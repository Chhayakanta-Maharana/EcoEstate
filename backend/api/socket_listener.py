"""
Native Multi-Protocol IoT Socket Listener (LAN TCP & UDP Gateway)
Runs background daemon threads listening on:
- TCP Port 5000: Modbus-TCP / Raw JSON Stream over Ethernet LAN
- UDP Port 5005: Low-latency UDP Sensor Datagrams over Ethernet LAN
Ingests directly into EcoEstate's real-time IoT Packet Stream.
"""

import socket
import threading
import json
import time
from datetime import datetime

# Will be initialized by Django app ready hook
_TCP_THREAD = None
_UDP_THREAD = None
_LISTENER_ACTIVE = False

TCP_PORT = 5000
UDP_PORT = 5005


def _ingest_socket_packet(raw_data_str: str, client_ip: str, protocol: str):
    from api.views import IOT_PACKET_STREAM

    try:
        data = json.loads(raw_data_str)
    except Exception:
        # Fallback if raw text
        data = {'raw_payload': raw_data_str, 'sensor_type': 'TELEMETRY'}

    source = data.get('source', 'LAN').upper()
    sensor_type = data.get('sensor_type', 'EQUIPMENT').upper()
    device_id = data.get('device_id', f"LAN-{protocol}-NODE-{client_ip.split('.')[-1]}")
    location = data.get('location', 'Campus Utility Loop (LAN RJ45)')
    metrics = data.get('metrics', {})

    new_packet = {
        'id': f"pkt-sock-{int(time.time() * 1000) % 100000}",
        'source': source,
        'protocol': protocol,
        'interface': f"Ethernet RJ45 ({protocol} Socket Port {TCP_PORT if protocol == 'TCP' else UDP_PORT})",
        'device_id': device_id,
        'ip_address': client_ip,
        'mac_address': data.get('mac_address', '00:1B:44:11:3A:B7'),
        'signal_dbm': None,
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

    try:
        server_sock.bind(('0.0.0.0', TCP_PORT))
        server_sock.listen(10)
        server_sock.settimeout(2.0)
        print(f"[IoT Gateway] TCP Socket Listener Active on 0.0.0.0:{TCP_PORT}")

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
                except Exception as e:
                    pass
                finally:
                    conn.close()
            except socket.timeout:
                continue
            except Exception as e:
                pass
    except Exception as e:
        print(f"[IoT Gateway] TCP listener bind notice: {e}")
    finally:
        server_sock.close()


def _udp_server_worker():
    global _LISTENER_ACTIVE
    udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    udp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        udp_sock.bind(('0.0.0.0', UDP_PORT))
        udp_sock.settimeout(2.0)
        print(f"[IoT Gateway] UDP Socket Listener Active on 0.0.0.0:{UDP_PORT}")

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
            except Exception as e:
                pass
    except Exception as e:
        print(f"[IoT Gateway] UDP listener bind notice: {e}")
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
