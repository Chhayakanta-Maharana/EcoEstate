"""
Native Multi-Protocol IoT Socket Listener (LAN TCP & UDP Gateway)
Runs background daemon threads listening on:
- UDP Port 5005: Low-latency UDP Sensor Datagrams & Subnet Broadcasts (255.255.255.255) on 0.0.0.0
- TCP Port 5000: Modbus-TCP / Raw JSON Stream over Ethernet LAN on 0.0.0.0
Ingests directly into EcoEstate's real-time IoT Packet Stream.
"""

import socket
import threading
import json
import time
from datetime import datetime

# Global state
_TCP_THREAD = None
_UDP_THREAD = None
_LISTENER_ACTIVE = False

# Gateway Network Configuration
GATEWAY_CONFIG = {
    'bind_host': '0.0.0.0',
    'udp_port': 5005,
    'tcp_port': 5000,
    'http_port': 8000,
    'udp_broadcast_enabled': True,
    'preferred_protocol': 'UDP_BROADCAST',  # UDP_BROADCAST | TCP_SOCKET | HTTP_REST
    'stats': {
        'udp_packets': 0,
        'tcp_packets': 0,
        'http_packets': 0,
        'last_packet_time': None,
        'last_device_id': None,
        'last_protocol': None,
    }
}


def get_gateway_config():
    """Returns current IoT Gateway network & listener configuration."""
    cfg = dict(GATEWAY_CONFIG)
    cfg['is_active'] = _LISTENER_ACTIVE
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(1.0)
        s.connect(('8.8.8.8', 80))
        cfg['server_local_ip'] = s.getsockname()[0]
        s.close()
    except Exception:
        cfg['server_local_ip'] = '127.0.0.1'
    return cfg


def update_gateway_config(new_cfg: dict):
    """Updates gateway configuration and restarts listeners if ports changed."""
    global GATEWAY_CONFIG
    needs_restart = False

    if 'udp_port' in new_cfg and int(new_cfg['udp_port']) != GATEWAY_CONFIG['udp_port']:
        GATEWAY_CONFIG['udp_port'] = int(new_cfg['udp_port'])
        needs_restart = True

    if 'tcp_port' in new_cfg and int(new_cfg['tcp_port']) != GATEWAY_CONFIG['tcp_port']:
        GATEWAY_CONFIG['tcp_port'] = int(new_cfg['tcp_port'])
        needs_restart = True

    if 'preferred_protocol' in new_cfg:
        GATEWAY_CONFIG['preferred_protocol'] = new_cfg['preferred_protocol']

    if 'udp_broadcast_enabled' in new_cfg:
        GATEWAY_CONFIG['udp_broadcast_enabled'] = bool(new_cfg['udp_broadcast_enabled'])

    if needs_restart and _LISTENER_ACTIVE:
        restart_iot_socket_listeners()

    return get_gateway_config()


def record_http_packet(device_id: str):
    """Record HTTP packet received via Django views."""
    GATEWAY_CONFIG['stats']['http_packets'] += 1
    GATEWAY_CONFIG['stats']['last_packet_time'] = datetime.now().strftime('%H:%M:%S')
    GATEWAY_CONFIG['stats']['last_device_id'] = device_id
    GATEWAY_CONFIG['stats']['last_protocol'] = 'HTTP'


def _ingest_socket_packet(raw_data_str: str, client_ip: str, protocol: str):
    from api.views import IOT_PACKET_STREAM

    try:
        data = json.loads(raw_data_str)
    except Exception:
        # Fallback if raw text
        data = {'raw_payload': raw_data_str, 'sensor_type': 'TELEMETRY'}

    source = data.get('source', 'LAN').upper()
    sensor_type = data.get('sensor_type', 'EQUIPMENT').upper()
    device_id = data.get('device_id', f"{source}-{protocol}-NODE-{client_ip.split('.')[-1]}")
    location = data.get('location', 'Campus Facility Node (0.0.0.0 Listener)')
    metrics = data.get('metrics', {})

    # Update stats
    if protocol == 'UDP':
        GATEWAY_CONFIG['stats']['udp_packets'] += 1
    elif protocol == 'TCP':
        GATEWAY_CONFIG['stats']['tcp_packets'] += 1

    GATEWAY_CONFIG['stats']['last_packet_time'] = datetime.now().strftime('%H:%M:%S')
    GATEWAY_CONFIG['stats']['last_device_id'] = device_id
    GATEWAY_CONFIG['stats']['last_protocol'] = protocol

    port_label = GATEWAY_CONFIG['tcp_port'] if protocol == 'TCP' else GATEWAY_CONFIG['udp_port']
    interface_label = f"0.0.0.0 ({protocol} Broadcast/Socket Port {port_label})"

    new_packet = {
        'id': f"pkt-sock-{int(time.time() * 1000) % 100000}",
        'source': source,
        'protocol': protocol,
        'interface': interface_label,
        'device_id': device_id,
        'ip_address': client_ip,
        'mac_address': data.get('mac_address', '00:1B:44:11:3A:B7'),
        'signal_dbm': data.get('signal_dbm', -55 if source == 'WIFI' else None),
        'sensor_type': sensor_type,
        'location': location,
        'metrics': metrics,
        'timestamp': datetime.now().strftime('%H:%M:%S'),
        'status': 'HEALTHY'
    }

    IOT_PACKET_STREAM.insert(0, new_packet)
    if len(IOT_PACKET_STREAM) > 50:
        IOT_PACKET_STREAM.pop()

    return new_packet


def _tcp_server_worker():
    global _LISTENER_ACTIVE
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    tcp_port = GATEWAY_CONFIG['tcp_port']
    try:
        server_sock.bind(('0.0.0.0', tcp_port))
        server_sock.listen(10)
        server_sock.settimeout(2.0)
        print(f"[IoT Gateway] [ACTIVE] TCP Socket Listener Active on 0.0.0.0:{tcp_port}")

        while _LISTENER_ACTIVE:
            try:
                conn, addr = server_sock.accept()
                conn.settimeout(5.0)
                try:
                    data = conn.recv(4096)
                    if data:
                        text = data.decode('utf-8', errors='ignore').strip()
                        pkt = _ingest_socket_packet(text, addr[0], 'TCP')
                        ack = json.dumps({'status': 'ACK', 'id': pkt['id'], 'protocol': 'TCP', 'timestamp': pkt['timestamp']})
                        conn.sendall(ack.encode('utf-8'))
                except Exception:
                    pass
                finally:
                    conn.close()
            except socket.timeout:
                continue
            except Exception:
                pass
    except Exception as e:
        print(f"[IoT Gateway] TCP listener notice: {e}")
    finally:
        server_sock.close()


def _udp_server_worker():
    global _LISTENER_ACTIVE
    udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    udp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    # Enable SO_BROADCAST to receive 255.255.255.255 subnet broadcasts
    try:
        udp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    except Exception:
        pass

    udp_port = GATEWAY_CONFIG['udp_port']
    try:
        udp_sock.bind(('0.0.0.0', udp_port))
        udp_sock.settimeout(2.0)
        print(f"[IoT Gateway] [ACTIVE] UDP Broadcast/Socket Listener Active on 0.0.0.0:{udp_port} (Accepts 255.255.255.255)")

        while _LISTENER_ACTIVE:
            try:
                data, addr = udp_sock.recvfrom(4096)
                if data:
                    text = data.decode('utf-8', errors='ignore').strip()
                    pkt = _ingest_socket_packet(text, addr[0], 'UDP')
                    ack = json.dumps({'status': 'ACK', 'id': pkt['id'], 'protocol': 'UDP', 'timestamp': pkt['timestamp']})
                    try:
                        udp_sock.sendto(ack.encode('utf-8'), addr)
                    except Exception:
                        pass
            except socket.timeout:
                continue
            except Exception:
                pass
    except Exception as e:
        print(f"[IoT Gateway] UDP listener notice: {e}")
    finally:
        udp_sock.close()


def start_iot_socket_listeners():
    global _LISTENER_ACTIVE, _TCP_THREAD, _UDP_THREAD
    if _LISTENER_ACTIVE:
        return

    _LISTENER_ACTIVE = True
    _TCP_THREAD = threading.Thread(target=_tcp_server_worker, daemon=True, name="IoT-TCP-Listener")
    _UDP_THREAD = threading.Thread(target=_udp_server_worker, daemon=True, name="IoT-UDP-Listener")

    _TCP_THREAD.start()
    _UDP_THREAD.start()


def restart_iot_socket_listeners():
    global _LISTENER_ACTIVE
    _LISTENER_ACTIVE = False
    time.sleep(1.0)
    start_iot_socket_listeners()

