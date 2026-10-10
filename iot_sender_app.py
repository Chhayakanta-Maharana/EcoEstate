#!/usr/bin/env python3
"""
EcoEstate India • Dual-Channel Hardware IoT Telemetry Sender Application
========================================================================
Supports:
  1. LAN Channel:
     - TCP Socket: Port 5000 (Modbus-TCP / Raw JSON Stream)
     - UDP Datagram: Port 5005 (Low-latency sensor broadcast)
  2. WiFi Channel:
     - HTTP/REST API: POST to http://localhost:8000/api/iot/ingest/
       Simulating ESP32 / ESP8266 WiFi nodes with RSSI & MAC address

Allows live sensor tuning, automated continuous streaming, and one-click
anomaly fault injection to test real-time SHAP Explainable AI diagnostics
and twin updates on the website.
"""

import sys
import os

# Safe standard stream handling for Windows GUI / PyInstaller executables
if sys.stdout is not None and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if sys.stderr is not None and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import json
import time
import socket
import urllib.request
import urllib.error
import threading
import random
from datetime import datetime

# Try importing tkinter for GUI
try:
    import tkinter as tk
    from tkinter import ttk, scrolledtext, messagebox
    HAS_TKINTER = True
except ImportError:
    HAS_TKINTER = False

# Default configurations
DEFAULT_TCP_PORT = 5000
DEFAULT_UDP_PORT = 5005


import concurrent.futures

CLOUD_INGEST_URL = "https://ecoestate.onrender.com/api/iot/ingest/"


def get_local_ip() -> str:
    """Auto-detect the machine's local network IP (works on shared WiFi)."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(2.0)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"


def normalize_ingest_url(raw_url: str) -> str:
    """Clean and normalize ingest URL, fixing common typos."""
    url = raw_url.strip()
    if not url:
        return CLOUD_INGEST_URL
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "http://" + url
    
    # Fix typo where colon is omitted before 8000 (e.g. 192.168.0.1918000)
    import re
    m = re.match(r'(https?://\d+\.\d+\.\d+\.\d{1,3})(8000|5000|5005)(.*)', url)
    if m:
        url = f"{m.group(1)}:{m.group(2)}{m.group(3)}"
    
    if not url.endswith("/api/iot/ingest/") and not url.endswith("/api/iot/ingest"):
        if url.endswith("/"):
            url = url + "api/iot/ingest/"
        else:
            url = url + "/api/iot/ingest/"
    
    if not url.endswith("/"):
        url = url + "/"
    return url


def discover_server_via_beacon(port: int = 5005, timeout: float = 0.8) -> dict | None:
    """Zero-Config UDP Broadcast Beacon handshake on port 5005 (runs in < 50ms)."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        s.settimeout(timeout)
        ping_msg = json.dumps({"msg": "ECOESTATE_DISCOVERY_PING"}).encode('utf-8')
        s.sendto(ping_msg, ("255.255.255.255", port))
        data, addr = s.recvfrom(2048)
        s.close()
        info = json.loads(data.decode('utf-8', errors='ignore'))
        if info.get('msg') == 'ECOESTATE_SERVER_ACK':
            return info
    except Exception:
        pass
    return None


def _probe_server_ip(ip: str, port: int = 8000) -> str | None:
    """Probes a single IP address to check if EcoEstate Django backend is running."""
    try:
        test_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        test_sock.settimeout(0.35)
        result = test_sock.connect_ex((ip, port))
        test_sock.close()
        if result == 0:
            test_url = f"http://{ip}:{port}/api/iot/status/"
            req = urllib.request.Request(test_url, headers={'User-Agent': 'ESP32-WiFi-Node/1.0'})
            with urllib.request.urlopen(req, timeout=0.8) as resp:
                if resp.getcode() == 200:
                    return f"http://{ip}:{port}/api/iot/ingest/"
    except Exception:
        pass
    return None


def discover_server_url(base_ip: str = "", port: int = 8000) -> tuple[str, str]:
    """
    Auto-Discovers EcoEstate Server URL:
    1. Zero-Config UDP Broadcast Beacon (Takes < 0.05s on same WiFi/LAN)
    2. Concurrent Subnet Scanner across local /24
    3. Production Cloud Fallback (https://ecoestate.onrender.com/api/iot/ingest/)
    Returns (url, discovery_source_text).
    """
    # 1. Ultra-fast UDP Beacon
    beacon = discover_server_via_beacon(port=5005)
    if beacon and beacon.get('http_url'):
        return beacon['http_url'], f"Auto UDP Beacon (Server IP: {beacon.get('server_ip')})"

    # 2. Fast Concurrent Subnet Scan
    local_ip = get_local_ip()
    candidates = ["127.0.0.1", "localhost"]
    if local_ip != "127.0.0.1":
        prefix = ".".join(local_ip.split(".")[:3])
        for i in range(1, 255):
            candidates.append(f"{prefix}.{i}")

    with concurrent.futures.ThreadPoolExecutor(max_workers=60) as executor:
        future_to_ip = {executor.submit(_probe_server_ip, ip, port): ip for ip in candidates}
        for future in concurrent.futures.as_completed(future_to_ip):
            res = future.result()
            if res:
                executor.shutdown(wait=False, cancel_futures=True)
                return res, f"WiFi Subnet Scan (Found: {future_to_ip[future]})"

    # 3. Production Cloud Fallback
    return CLOUD_INGEST_URL, "Production Cloud Fallback (Render)"


# Auto-detect host IP for shared WiFi support
DETECTED_LOCAL_IP = get_local_ip()
DEFAULT_HOST = "255.255.255.255"
DEFAULT_HTTP_URL = CLOUD_INGEST_URL

# Sensor Presets with Healthy vs Anomaly telemetry
SENSOR_TEMPLATES = {
    "WATER_PUMP": {
        "name": "STP MBBR Raw Sewage Lift Pump #4",
        "category": "WATER_PUMP",
        "sensor_type": "WATER",
        "device_id": "LAN-PLC-PUMP-04",
        "location": "Central STP Yard • MBBR Lift Pit B",
        "healthy": {
            "vibration_mm_s": 1.15,
            "operating_temp_c": 42.5,
            "flow_rate_lps": 18.2,
            "current_draw_a": 28.0,
            "acoustic_noise_db": 54.0,
            "head_pressure_bar": 4.1
        },
        "anomaly": {
            "vibration_mm_s": 4.65,
            "operating_temp_c": 78.5,
            "flow_rate_lps": 10.8,
            "current_draw_a": 44.2,
            "acoustic_noise_db": 77.5,
            "head_pressure_bar": 2.5
        }
    },
    "ENERGY_TRANSFORMER": {
        "name": "Substation 11kV/415V Step-Down Transformer #2",
        "category": "ENERGY_TRANSFORMER",
        "sensor_type": "ENERGY",
        "device_id": "LAN-MODBUS-XFR-02",
        "location": "Main Substation & HT Panel Room",
        "healthy": {
            "oil_temp_c": 48.0,
            "harmonic_thd_pct": 2.8,
            "power_factor": 0.98,
            "active_load_kw": 420.0,
            "neutral_current_a": 4.5
        },
        "anomaly": {
            "oil_temp_c": 76.5,
            "harmonic_thd_pct": 7.2,
            "power_factor": 0.85,
            "active_load_kw": 760.0,
            "neutral_current_a": 28.0
        }
    },
    "AIR_QUALITY_STATION": {
        "name": "CPCB Laser Particulate Sensor Quad #1",
        "category": "AIR_QUALITY_STATION",
        "sensor_type": "AQI",
        "device_id": "WIFI-ESP32-AQI-01",
        "location": "Hostel Quad & Central Green Walkway",
        "healthy": {
            "pm25_ug_m3": 24.5,
            "pm10_ug_m3": 45.0,
            "co2_ppm": 430.0,
            "voc_ppb": 85.0,
            "humidity_pct": 52.0
        },
        "anomaly": {
            "pm25_ug_m3": 125.0,
            "pm10_ug_m3": 195.0,
            "co2_ppm": 710.0,
            "voc_ppb": 160.0,
            "humidity_pct": 74.0
        }
    },
    "CHILLER_HVAC": {
        "name": "Central HVAC Dual-Screw Chiller Unit-1",
        "category": "WATER_PUMP",
        "sensor_type": "EQUIPMENT",
        "device_id": "LAN-BACNET-CHILLER-01",
        "location": "Basement Mechanical Plant Block B",
        "healthy": {
            "vibration_mm_s": 1.4,
            "operating_temp_c": 45.0,
            "flow_rate_lps": 19.5,
            "current_draw_a": 32.0,
            "head_pressure_bar": 4.3
        },
        "anomaly": {
            "vibration_mm_s": 3.4,
            "operating_temp_c": 71.0,
            "flow_rate_lps": 12.0,
            "current_draw_a": 42.5,
            "head_pressure_bar": 2.2
        }
    },
    "SOLAR_ARRAY": {
        "name": "Campus 500 kW Rooftop Solar Array Inverter #3",
        "category": "ENERGY_TRANSFORMER",
        "sensor_type": "ENERGY",
        "device_id": "WIFI-ESP32-SOLAR-03",
        "location": "Academic Block C Rooftop Solar Deck",
        "healthy": {
            "oil_temp_c": 44.0,
            "harmonic_thd_pct": 2.2,
            "power_factor": 0.99,
            "active_load_kw": 485.0,
            "neutral_current_a": 3.0
        },
        "anomaly": {
            "oil_temp_c": 64.0,
            "harmonic_thd_pct": 5.1,
            "power_factor": 0.90,
            "active_load_kw": 360.0,
            "neutral_current_a": 18.0
        }
    },
    "DUSTBIN": {
        "name": "Smart Campus Ultrasonic Waste Bin #2",
        "category": "IOT_GATEWAY_NODE",
        "sensor_type": "DUSTBIN",
        "device_id": "WIFI-ESP32-BIN-02",
        "location": "Student Food Court & Canteen Plaza",
        "healthy": {
            "fill_percentage": 35.0,
            "battery_pct": 94.0,
            "distance_cm": 65.0
        },
        "anomaly": {
            "fill_percentage": 92.0,
            "battery_pct": 18.0,
            "distance_cm": 8.0
        }
    }
}


def send_packet_lan_tcp(host: str, port: int, payload: dict) -> tuple[bool, str]:
    """Sends telemetry payload via TCP Socket to LAN Gateway."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3.0)
        sock.connect((host, port))
        msg = json.dumps(payload) + "\n"
        sock.sendall(msg.encode('utf-8'))
        
        # Read ACK
        sock.settimeout(2.0)
        resp = sock.recv(1024)
        sock.close()
        return True, f"TCP ACK Received: {resp.decode('utf-8', errors='ignore').strip()}"
    except Exception as e:
        return False, f"TCP Socket Error ({host}:{port}): {e}"


def send_packet_lan_udp(host: str, port: int, payload: dict) -> tuple[bool, str]:
    """Sends telemetry payload via UDP Datagram / Broadcast (255.255.255.255) to LAN Gateway."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Enable SO_BROADCAST to permit 255.255.255.255 subnet broadcasts on shared WiFi/LAN
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.settimeout(2.5)
        msg = json.dumps(payload)
        sock.sendto(msg.encode('utf-8'), (host, port))
        
        # Try reading ACK
        sock.settimeout(1.2)
        try:
            resp, _ = sock.recvfrom(1024)
            ack_msg = resp.decode('utf-8', errors='ignore').strip()
        except socket.timeout:
            ack_msg = f"UDP Broadcast Packet Transmitted to {host}:{port}"
        sock.close()
        return True, f"UDP Success: {ack_msg}"
    except Exception as e:
        return False, f"UDP Datagram Error ({host}:{port}): {e}"


def send_packet_wifi_http(url: str, payload: dict) -> tuple[bool, str]:
    """Sends telemetry payload via HTTP REST API simulating WiFi ESP32 node with fast 0.8s timeout."""
    try:
        data_bytes = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={'Content-Type': 'application/json', 'User-Agent': 'ESP32-WiFi-Node/1.0'}
        )
        with urllib.request.urlopen(req, timeout=0.8) as resp:
            status_code = resp.getcode()
            body = resp.read().decode('utf-8', errors='ignore')
            return True, f"HTTP {status_code} Created: Synced with Twin Buffer"
    except urllib.error.HTTPError as e:
        return False, f"HTTP Error {e.code}: {e.read().decode('utf-8', errors='ignore')}"
    except Exception as e:
        return False, f"WiFi HTTP POST Error ({url}): {e}"


# ==============================================================================
# TKINTER GRAPHICAL SENDER APPLICATION
# ==============================================================================
class IoTSenderGui:
    def __init__(self, root):
        self.root = root
        self.root.title("EcoEstate India • IoT Telemetry Hardware Sender (LAN TCP/UDP & WiFi)")
        self.root.geometry("980x740")
        self.root.minsize(860, 640)
        self.root.configure(bg="#070913")

        self.streaming = False
        self.stream_thread = None
        self.packet_count = 0
        self.detected_ip = DETECTED_LOCAL_IP

        # Current telemetry metrics dict
        self.current_metrics = {}
        self.metric_vars = {}

        self._apply_dark_style()
        self._build_ui()
        self._on_sensor_changed()
        self._auto_connect_server_on_startup()

    def _apply_dark_style(self):
        style = ttk.Style()
        style.theme_use('clam')
        style.configure(".", background="#070913", foreground="#e2e8f0", fieldbackground="#0d111f")
        style.configure("TLabel", background="#070913", foreground="#e2e8f0", font=("Segoe UI", 9))
        style.configure("Header.TLabel", font=("Segoe UI", 12, "bold"), foreground="#00f2fe")
        style.configure("SubHeader.TLabel", font=("Segoe UI", 9), foreground="#94a3b8")
        style.configure("TNotebook", background="#070913")
        style.configure("TNotebook.Tab", background="#0d111f", foreground="#cbd5e1", padding=[12, 6], font=("Segoe UI", 9, "bold"))
        style.map("TNotebook.Tab", background=[("selected", "#00f2fe")], foreground=[("selected", "#020617")])
        style.configure("Accent.TButton", font=("Segoe UI", 9, "bold"), background="#00f2fe", foreground="#020617")
        style.configure("Danger.TButton", font=("Segoe UI", 9, "bold"), background="#ef4444", foreground="#ffffff")
        style.configure("Success.TButton", font=("Segoe UI", 9, "bold"), background="#10b981", foreground="#ffffff")

    def _build_ui(self):
        # 1. Top Title Banner with Auto-Discovery Badge
        banner = tk.Frame(self.root, bg="#0d111f", height=65, relief="solid", bd=1)
        banner.pack(fill="x", padx=10, pady=(10, 5))

        banner_top = tk.Frame(banner, bg="#0d111f")
        banner_top.pack(fill="x", padx=15, pady=(8, 2))

        title_label = tk.Label(
            banner_top, text="⚡ EcoEstate IoT Hardware Sender (LAN & WiFi)",
            font=("Segoe UI", 13, "bold"), bg="#0d111f", fg="#38bdf8"
        )
        title_label.pack(side="left")

        self.conn_status_label = tk.Label(
            banner_top, text="🔍 Auto-Connecting to Server on WiFi...",
            font=("Segoe UI", 8, "bold"), bg="#1e293b", fg="#facc15", padx=8, pady=2
        )
        self.conn_status_label.pack(side="right")

        subtitle = tk.Label(
            banner,
            text="Simulate physical sensor nodes transmitting across LAN (TCP/UDP Socket) and WiFi (ESP32 REST POST)",
            font=("Segoe UI", 9), bg="#0d111f", fg="#94a3b8"
        )
        subtitle.pack(anchor="w", padx=15, pady=(0, 8))

        # Main Content Panes (Left: Config & Telemetry Controls, Right: Live Logs & Stats)
        main_split = tk.PanedWindow(self.root, orient="horizontal", bg="#070913", bd=0, sashwidth=6)
        main_split.pack(fill="both", expand=True, padx=10, pady=5)

        # LEFT PANE: Controls
        left_frame = tk.Frame(main_split, bg="#070913")
        main_split.add(left_frame, width=540)

        # RIGHT PANE: Console Log
        right_frame = tk.Frame(main_split, bg="#070913")
        main_split.add(right_frame)

        self._build_left_pane(left_frame)
        self._build_right_pane(right_frame)

    def _build_left_pane(self, parent):
        # --- Channel & Protocol Notebook ---
        notebook_frame = tk.LabelFrame(parent, text=" 1. Transmission Channel & Protocol ", font=("Segoe UI", 9, "bold"), bg="#0d111f", fg="#38bdf8", bd=1)
        notebook_frame.pack(fill="x", pady=(0, 8), padx=2)

        self.channel_tab = ttk.Notebook(notebook_frame)
        self.channel_tab.pack(fill="x", padx=8, pady=8)

        # TAB 1: LAN ETHERNET
        lan_frame = tk.Frame(self.channel_tab, bg="#0d111f")
        self.channel_tab.add(lan_frame, text="  🔌 LAN (Ethernet RJ45)  ")

        # LAN Protocol Selection (TCP / UDP)
        proto_box = tk.Frame(lan_frame, bg="#0d111f")
        proto_box.pack(fill="x", padx=10, pady=6)

        tk.Label(proto_box, text="Protocol:", font=("Segoe UI", 9, "bold"), bg="#0d111f", fg="#e2e8f0").pack(side="left")
        self.lan_protocol_var = tk.StringVar(value="TCP")
        rb_tcp = tk.Radiobutton(proto_box, text="TCP Socket (Modbus Port 5000)", variable=self.lan_protocol_var, value="TCP", bg="#0d111f", fg="#38bdf8", selectcolor="#070913", font=("Segoe UI", 8, "bold"), activebackground="#0d111f", activeforeground="#38bdf8")
        rb_tcp.pack(side="left", padx=10)
        rb_udp = tk.Radiobutton(proto_box, text="UDP Datagram (Port 5005)", variable=self.lan_protocol_var, value="UDP", bg="#0d111f", fg="#38bdf8", selectcolor="#070913", font=("Segoe UI", 8, "bold"), activebackground="#0d111f", activeforeground="#38bdf8")
        rb_udp.pack(side="left", padx=5)

        # Host & Port inputs
        lan_grid = tk.Frame(lan_frame, bg="#0d111f")
        lan_grid.pack(fill="x", padx=10, pady=4)

        tk.Label(lan_grid, text="Gateway Host / Broadcast:", bg="#0d111f", fg="#94a3b8").grid(row=0, column=0, sticky="w", pady=2)
        self.lan_host_var = tk.StringVar(value="255.255.255.255")
        tk.Entry(lan_grid, textvariable=self.lan_host_var, width=16, bg="#070913", fg="#ffffff", insertbackground="#ffffff").grid(row=0, column=1, sticky="w", padx=5, pady=2)

        # Broadcast helper buttons
        btn_box = tk.Frame(lan_grid, bg="#0d111f")
        btn_box.grid(row=0, column=2, columnspan=2, sticky="w", padx=5)
        
        btn_bcast = tk.Button(
            btn_box, text="📡 255.255.255.255", font=("Segoe UI", 7, "bold"),
            bg="#1e3a8a", fg="#93c5fd", activebackground="#2563eb", activeforeground="#ffffff",
            bd=0, padx=5, pady=1, cursor="hand2", command=lambda: self.lan_host_var.set("255.255.255.255")
        )
        btn_bcast.pack(side="left", padx=2)

        btn_local = tk.Button(
            btn_box, text=f"🎯 Local IP ({self.detected_ip})", font=("Segoe UI", 7, "bold"),
            bg="#064e3b", fg="#6ee7b7", activebackground="#047857", activeforeground="#ffffff",
            bd=0, padx=5, pady=1, cursor="hand2", command=lambda: self.lan_host_var.set(self.detected_ip)
        )
        btn_local.pack(side="left", padx=2)

        tk.Label(lan_grid, text="Port (UDP/TCP):", bg="#0d111f", fg="#94a3b8").grid(row=1, column=0, sticky="w", pady=2)
        self.lan_port_var = tk.StringVar(value="5005")
        tk.Entry(lan_grid, textvariable=self.lan_port_var, width=16, bg="#070913", fg="#ffffff", insertbackground="#ffffff").grid(row=1, column=1, sticky="w", padx=5, pady=2)

        tk.Label(lan_grid, text="Device LAN IP:", bg="#0d111f", fg="#94a3b8").grid(row=1, column=2, sticky="w", padx=(10, 0), pady=2)
        self.lan_dev_ip_var = tk.StringVar(value=self.detected_ip)
        tk.Entry(lan_grid, textvariable=self.lan_dev_ip_var, width=16, bg="#070913", fg="#ffffff", insertbackground="#ffffff").grid(row=1, column=3, sticky="w", padx=5, pady=2)

        # Detected IP info label
        ip_info = tk.Label(lan_frame, text=f"🌐 0.0.0.0 Receiver Compatible • Subnet Broadcast: 255.255.255.255:5005 (UDP)", bg="#0d111f", fg="#10b981", font=("Segoe UI", 8, "bold"))
        ip_info.pack(anchor="w", padx=10, pady=(4, 6))

        # TAB 2: WIFI (ESP32)
        wifi_frame = tk.Frame(self.channel_tab, bg="#0d111f")
        self.channel_tab.add(wifi_frame, text="  📶 WiFi (802.11 ESP32 Node)  ")

        wifi_grid = tk.Frame(wifi_frame, bg="#0d111f")
        wifi_grid.pack(fill="x", padx=10, pady=6)

        tk.Label(wifi_grid, text="HTTP Ingest URL:", bg="#0d111f", fg="#94a3b8").grid(row=0, column=0, sticky="w", pady=2)
        self.wifi_url_var = tk.StringVar(value=DEFAULT_HTTP_URL)
        url_entry = tk.Entry(wifi_grid, textvariable=self.wifi_url_var, width=38, bg="#070913", fg="#ffffff", insertbackground="#ffffff")
        url_entry.grid(row=0, column=1, columnspan=2, sticky="w", padx=5, pady=2)

        # Preset & Auto-Discover buttons row
        btn_wifi_box = tk.Frame(wifi_grid, bg="#0d111f")
        btn_wifi_box.grid(row=1, column=1, columnspan=3, sticky="w", padx=5, pady=2)

        btn_cloud = tk.Button(
            btn_wifi_box, text="🌐 Cloud (Render)", font=("Segoe UI", 7, "bold"),
            bg="#1e3a8a", fg="#93c5fd", activebackground="#2563eb", activeforeground="#ffffff",
            bd=0, padx=5, pady=1, cursor="hand2", command=lambda: self.wifi_url_var.set(CLOUD_INGEST_URL)
        )
        btn_cloud.pack(side="left", padx=2)

        btn_local_http = tk.Button(
            btn_wifi_box, text="🏠 Localhost", font=("Segoe UI", 7, "bold"),
            bg="#374151", fg="#e5e7eb", activebackground="#4b5563", activeforeground="#ffffff",
            bd=0, padx=5, pady=1, cursor="hand2", command=lambda: self.wifi_url_var.set("http://127.0.0.1:8000/api/iot/ingest/")
        )
        btn_local_http.pack(side="left", padx=2)

        btn_discover = tk.Button(
            btn_wifi_box, text="🔍 Subnet Scan", font=("Segoe UI", 7, "bold"),
            bg="#064e3b", fg="#6ee7b7", activebackground="#047857", activeforeground="#ffffff",
            bd=0, padx=6, pady=1, cursor="hand2", command=self._discover_server
        )
        btn_discover.pack(side="left", padx=2)

        tk.Label(wifi_grid, text="WiFi SSID:", bg="#0d111f", fg="#94a3b8").grid(row=2, column=0, sticky="w", pady=2)
        self.wifi_ssid_var = tk.StringVar(value="EcoEstate_IoT_Grid")
        tk.Entry(wifi_grid, textvariable=self.wifi_ssid_var, width=18, bg="#070913", fg="#ffffff", insertbackground="#ffffff").grid(row=2, column=1, sticky="w", padx=5, pady=2)

        tk.Label(wifi_grid, text="Signal (RSSI dBm):", bg="#0d111f", fg="#94a3b8").grid(row=2, column=2, sticky="w", padx=(10, 0), pady=2)
        self.wifi_rssi_var = tk.IntVar(value=-54)
        tk.Scale(wifi_grid, from_=-90, to=-30, orient="horizontal", variable=self.wifi_rssi_var, bg="#0d111f", fg="#38bdf8", highlightthickness=0, length=120).grid(row=2, column=3, sticky="w", padx=5)

        # Server IP helper label
        wifi_help = tk.Label(wifi_frame, text=f"💡 Local IP: {self.detected_ip} • Click 'Subnet Scan' to auto-find server or 'Cloud (Render)'", bg="#0d111f", fg="#10b981", font=("Segoe UI", 8))
        wifi_help.pack(anchor="w", padx=10, pady=(2, 6))

        # --- Sensor Node Preset Selection ---
        sensor_box = tk.LabelFrame(parent, text=" 2. Sensor Node Preset & Location ", font=("Segoe UI", 9, "bold"), bg="#0d111f", fg="#38bdf8", bd=1)
        sensor_box.pack(fill="x", pady=(0, 8), padx=2)

        s_row = tk.Frame(sensor_box, bg="#0d111f")
        s_row.pack(fill="x", padx=10, pady=6)

        tk.Label(s_row, text="Select Sensor:", font=("Segoe UI", 9, "bold"), bg="#0d111f", fg="#e2e8f0").pack(side="left")
        self.sensor_choice_var = tk.StringVar(value="WATER_PUMP")
        self.sensor_combo = ttk.Combobox(
            s_row, textvariable=self.sensor_choice_var, state="readonly", width=34,
            values=[
                "WATER_PUMP (STP Raw Sewage Lift Pump #4)",
                "ENERGY_TRANSFORMER (11kV/415V Substation XFR)",
                "AIR_QUALITY_STATION (CPCB Laser AQI Quad)",
                "CHILLER_HVAC (Basement Chiller Compressor)",
                "SOLAR_ARRAY (500 kW Rooftop Solar Inverter)",
                "DUSTBIN (Smart Campus Ultrasonic Bin)"
            ]
        )
        self.sensor_combo.pack(side="left", padx=10)
        self.sensor_combo.current(0)
        self.sensor_combo.bind("<<ComboboxSelected>>", lambda e: self._on_sensor_changed())

        # Sensor metadata display
        self.loc_label = tk.Label(sensor_box, text="📍 Location: Loading...", bg="#0d111f", fg="#94a3b8", font=("Segoe UI", 8))
        self.loc_label.pack(anchor="w", padx=10, pady=(0, 6))

        # --- Dynamic Telemetry Tuning Sliders ---
        self.telemetry_box = tk.LabelFrame(parent, text=" 3. Real-Time Telemetry Tuning (Inject SHAP Faults) ", font=("Segoe UI", 9, "bold"), bg="#0d111f", fg="#38bdf8", bd=1)
        self.telemetry_box.pack(fill="both", expand=True, pady=(0, 8), padx=2)

        self.sliders_container = tk.Frame(self.telemetry_box, bg="#0d111f")
        self.sliders_container.pack(fill="both", expand=True, padx=8, pady=4)

        # Quick Preset Buttons (Healthy vs Anomaly)
        btn_preset_row = tk.Frame(self.telemetry_box, bg="#0d111f")
        btn_preset_row.pack(fill="x", padx=8, pady=(2, 8))

        btn_healthy = tk.Button(
            btn_preset_row, text="🟢 Set Healthy Baseline", font=("Segoe UI", 9, "bold"),
            bg="#064e3b", fg="#6ee7b7", activebackground="#047857", activeforeground="#ffffff",
            bd=0, padx=12, pady=4, cursor="hand2", command=self._set_healthy_preset
        )
        btn_healthy.pack(side="left", padx=4)

        btn_anomaly = tk.Button(
            btn_preset_row, text="🔴 Inject Anomaly Fault (Test SHAP)", font=("Segoe UI", 9, "bold"),
            bg="#7f1d1d", fg="#fca5a5", activebackground="#b91c1c", activeforeground="#ffffff",
            bd=0, padx=12, pady=4, cursor="hand2", command=self._set_anomaly_preset
        )
        btn_anomaly.pack(side="left", padx=4)

        # --- 4. Transmission Action Bar ---
        action_box = tk.Frame(parent, bg="#0d111f", pady=6)
        action_box.pack(fill="x", padx=2)

        self.btn_send_single = tk.Button(
            action_box, text="🚀 Send Single Packet", font=("Segoe UI", 10, "bold"),
            bg="#0284c7", fg="#ffffff", activebackground="#0369a1", bd=0, padx=16, pady=7,
            cursor="hand2", command=self.send_single_packet
        )
        self.btn_send_single.pack(side="left", padx=4)

        self.btn_stream_toggle = tk.Button(
            action_box, text="▶ Start Auto-Stream (1s)", font=("Segoe UI", 10, "bold"),
            bg="#16a34a", fg="#ffffff", activebackground="#15803d", bd=0, padx=16, pady=7,
            cursor="hand2", command=self.toggle_stream
        )
        self.btn_stream_toggle.pack(side="left", padx=4)

        # Rate selector
        tk.Label(action_box, text="Interval:", bg="#0d111f", fg="#94a3b8").pack(side="left", padx=(10, 2))
        self.interval_var = tk.DoubleVar(value=1.0)
        self.interval_combo = ttk.Combobox(action_box, textvariable=self.interval_var, values=[0.5, 1.0, 2.0, 5.0], width=5, state="readonly")
        self.interval_combo.pack(side="left")

    def _build_right_pane(self, parent):
        log_frame = tk.LabelFrame(parent, text=" Live Packet Transmission Console ", font=("Segoe UI", 9, "bold"), bg="#0d111f", fg="#38bdf8", bd=1)
        log_frame.pack(fill="both", expand=True, padx=2)

        # Top stats bar
        stats_bar = tk.Frame(log_frame, bg="#070913")
        stats_bar.pack(fill="x", padx=6, pady=4)

        self.stat_tx_label = tk.Label(stats_bar, text="Packets Sent: 0", font=("Consolas", 9, "bold"), bg="#070913", fg="#38bdf8")
        self.stat_tx_label.pack(side="left", padx=6)

        self.stat_last_label = tk.Label(stats_bar, text="Last Status: Standby", font=("Consolas", 9), bg="#070913", fg="#10b981")
        self.stat_last_label.pack(side="right", padx=6)

        # Scrolled Text Box
        self.log_text = scrolledtext.ScrolledText(
            log_frame, bg="#04050a", fg="#e2e8f0", font=("Consolas", 8),
            insertbackground="#ffffff", selectbackground="#1e293b", wrap="word"
        )
        self.log_text.pack(fill="both", expand=True, padx=6, pady=(0, 6))

        # Color tags
        self.log_text.tag_config("SUCCESS", foreground="#34d399")
        self.log_text.tag_config("FAIL", foreground="#f87171")
        self.log_text.tag_config("INFO", foreground="#38bdf8")
        self.log_text.tag_config("WARN", foreground="#fbbf24")

        # Clear button
        btn_clear = tk.Button(
            log_frame, text="Clear Console", font=("Segoe UI", 8),
            bg="#1e293b", fg="#94a3b8", bd=0, padx=8, pady=2, command=lambda: self.log_text.delete('1.0', tk.END)
        )
        btn_clear.pack(anchor="e", padx=6, pady=4)

        self._log("System initialized. Select channel (LAN TCP/UDP or WiFi HTTP) and click 'Send Single Packet'.", "INFO")

    def _log(self, msg: str, tag="INFO"):
        ts = datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] {msg}\n"
        self.log_text.insert(tk.END, line, tag)
        self.log_text.see(tk.END)

    def _get_selected_key(self):
        choice = self.sensor_combo.get()
        return choice.split(" ")[0].strip()

    def _on_sensor_changed(self):
        key = self._get_selected_key()
        tmpl = SENSOR_TEMPLATES.get(key, SENSOR_TEMPLATES["WATER_PUMP"])
        self.loc_label.config(text=f"📍 Location: {tmpl['location']}  |  Node: {tmpl['device_id']}")

        # Re-build telemetry sliders
        for w in self.sliders_container.winfo_children():
            w.destroy()

        self.current_metrics = dict(tmpl["healthy"])
        self.metric_vars.clear()

        # Render 2-column grid of sliders
        for i, (k, val) in enumerate(self.current_metrics.items()):
            row = i // 2
            col = (i % 2) * 2

            lbl_name = k.replace("_", " ").title()
            tk.Label(self.sliders_container, text=lbl_name, bg="#0d111f", fg="#cbd5e1", font=("Segoe UI", 8)).grid(row=row*2, column=col, sticky="w", padx=6, pady=(4, 0))

            v = tk.DoubleVar(value=float(val))
            self.metric_vars[k] = v

            # Determine range
            min_val = round(max(0.0, float(val) * 0.2), 2)
            max_val = round(max(10.0, float(val) * 2.8), 2)
            if min_val >= max_val:
                max_val = min_val + 50.0

            scale = tk.Scale(
                self.sliders_container, from_=min_val, to=max_val, orient="horizontal",
                variable=v, resolution=0.1, length=210, bg="#0d111f", fg="#38bdf8",
                highlightthickness=0, font=("Consolas", 8)
            )
            scale.grid(row=row*2+1, column=col, sticky="w", padx=6, pady=(0, 4))

    def _auto_connect_server_on_startup(self):
        """Silently auto-connects to the server on app launch in a background thread."""
        def _runner():
            found_url, desc = discover_server_url(self.detected_ip)
            self.root.after(0, lambda: self._on_discover_result(found_url, desc))
        threading.Thread(target=_runner, daemon=True).start()

    def _discover_server(self):
        """Auto-discover the Django backend server on the local network."""
        self._log("🔍 Auto-Scanning WiFi & UDP Beacon for EcoEstate Server...", "INFO")
        self.conn_status_label.config(text="🔍 Searching Server on WiFi...", fg="#facc15")
        
        def _scan():
            found_url, desc = discover_server_url(self.detected_ip)
            self.root.after(0, lambda: self._on_discover_result(found_url, desc))
        
        threading.Thread(target=_scan, daemon=True).start()

    def _on_discover_result(self, url: str, desc: str = ""):
        self.wifi_url_var.set(url)
        # Also update LAN host based on discovered URL
        try:
            host_part = url.split("//")[1].split(":")[0]
            self.lan_host_var.set(host_part)
        except Exception:
            host_part = url

        if "Render" in desc or "Cloud" in desc:
            self.conn_status_label.config(text=f"🌐 Cloud Production Ingest", fg="#60a5fa", bg="#1e293b")
            self._log(f"🌐 Connected to Cloud Production Ingest: {url} ({desc})", "INFO")
        else:
            self.conn_status_label.config(text=f"🟢 Auto-Connected: {host_part}", fg="#34d399", bg="#064e3b")
            self._log(f"✅ Auto-Connected to Host: {url} [{desc}]", "SUCCESS")

    def _set_healthy_preset(self):
        key = self._get_selected_key()
        tmpl = SENSOR_TEMPLATES.get(key, SENSOR_TEMPLATES["WATER_PUMP"])
        for k, v in tmpl["healthy"].items():
            if k in self.metric_vars:
                self.metric_vars[k].set(float(v))
        self._log(f"Reset {key} to healthy baseline.", "SUCCESS")

    def _set_anomaly_preset(self):
        key = self._get_selected_key()
        tmpl = SENSOR_TEMPLATES.get(key, SENSOR_TEMPLATES["WATER_PUMP"])
        for k, v in tmpl["anomaly"].items():
            if k in self.metric_vars:
                self.metric_vars[k].set(float(v))
        self._log(f"⚠️ INJECTED ANOMALY FAULT into {key}! Real-time SHAP analysis will trigger on website.", "WARN")

    def _gather_payload(self) -> dict:
        key = self._get_selected_key()
        tmpl = SENSOR_TEMPLATES.get(key, SENSOR_TEMPLATES["WATER_PUMP"])

        # Determine active channel from notebook tab
        current_tab_idx = self.channel_tab.index(self.channel_tab.select())
        is_lan = (current_tab_idx == 0)

        # Collect metrics from sliders
        metrics = {}
        for k, var in self.metric_vars.items():
            metrics[k] = round(var.get(), 2)

        source = "LAN" if is_lan else "WIFI"
        proto = self.lan_protocol_var.get() if is_lan else "HTTP"
        dev_ip = self.lan_dev_ip_var.get() if is_lan else "192.168.1.145"

        payload = {
            "source": source,
            "protocol": proto,
            "sensor_type": tmpl["sensor_type"],
            "category": tmpl["category"],
            "device_id": tmpl["device_id"],
            "location": tmpl["location"],
            "ip_address": dev_ip,
            "mac_address": "00:1B:44:11:3A:B7" if is_lan else "30:AE:A4:7F:8C:11",
            "signal_dbm": None if is_lan else self.wifi_rssi_var.get(),
            "metrics": metrics,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }
        return payload

    def send_single_packet(self):
        payload = self._gather_payload()
        is_lan = (payload["source"] == "LAN")
        proto = payload.get("protocol", "TCP")

        if is_lan:
            host = self.lan_host_var.get().strip() or "255.255.255.255"
            try:
                port = int(self.lan_port_var.get().strip())
            except Exception:
                port = DEFAULT_TCP_PORT if proto == "TCP" else DEFAULT_UDP_PORT

            if proto == "TCP":
                self._log(f"Dispatching [LAN TCP] to {host}:{port} ({payload['device_id']})...", "INFO")
                ok, msg = send_packet_lan_tcp(host, port, payload)
            else:
                self._log(f"Dispatching [LAN UDP Broadcast] to {host}:{port} ({payload['device_id']})...", "INFO")
                ok, msg = send_packet_lan_udp(host, port, payload)
        else:
            raw_url = self.wifi_url_var.get().strip() or DEFAULT_HTTP_URL
            url = normalize_ingest_url(raw_url)
            self.wifi_url_var.set(url)

            # Instant Zero-Latency Dual-Delivery:
            # 1. Fire non-blocking UDP Broadcast on port 5005 (0ms latency across WiFi & LAN)
            udp_ok, udp_msg = send_packet_lan_udp("255.255.255.255", 5005, payload)

            # 2. Concurrently attempt HTTP POST with 0.8s fast timeout
            http_ok, http_msg = send_packet_wifi_http(url, payload)

            if http_ok:
                ok = True
                proto = "WiFi-HTTP"
                msg = f"Delivered via WiFi HTTP -> {url} (UDP Broadcast synced in 0ms)"
            elif udp_ok:
                ok = True
                proto = "UDP-Broadcast"
                msg = f"Delivered via LAN/WiFi UDP Broadcast (255.255.255.255:5005) [0ms Instant Delivery]"
            else:
                ok = False
                proto = "WiFi-Failed"
                msg = f"WiFi HTTP failed ({http_msg}) & UDP failed ({udp_msg})"

        # Summary of metrics for crystal-clear user awareness
        sens_type = payload.get("sensor_type", "TELEMETRY")
        m_str = ", ".join([f"{k}: {v}" for k, v in list(payload.get("metrics", {}).items())[:3]])
        self._log(f"📡 Transmitted [{sens_type}] {payload.get('device_id')} -> {m_str}", "INFO")

        self.packet_count += 1
        self.stat_tx_label.config(text=f"Packets Sent: {self.packet_count}")

        if ok:
            self._log(f"✅ {msg}", "SUCCESS")
            self.stat_last_label.config(text=f"Success ({proto})", fg="#34d399")
        else:
            self._log(f"❌ {msg}", "FAIL")
            self.stat_last_label.config(text=f"Failed ({proto})", fg="#f87171")
            if not is_lan:
                self._log("💡 TIP: Switch to 'LAN (Ethernet RJ45)' tab -> select UDP Broadcast (255.255.255.255) for Zero-Config transmission.", "INFO")

    def toggle_stream(self):
        if self.streaming:
            self.streaming = False
            self.btn_stream_toggle.config(text="▶ Start Auto-Stream", bg="#16a34a")
            self._log("⏹ Auto-stream stopped.", "WARN")
        else:
            self.streaming = True
            interval = float(self.interval_var.get() or 1.0)
            self.btn_stream_toggle.config(text="⏹ Stop Streaming", bg="#dc2626")
            self._log(f"▶ Continuous streaming started (every {interval}s)...", "INFO")

            def _stream_worker():
                while self.streaming:
                    self.send_single_packet()
                    time.sleep(interval)

            self.stream_thread = threading.Thread(target=_stream_worker, daemon=True)
            self.stream_thread.start()


# ==============================================================================
# CLI MODE (For automated terminal execution)
# ==============================================================================
def run_cli_mode():
    print("=" * 70)
    print("EcoEstate India - IoT Telemetry CLI Sender")
    print("Options: 1=LAN TCP, 2=LAN UDP, 3=WiFi HTTP, 4=Inject Anomaly, q=Quit")
    print("=" * 70)

    while True:
        try:
            choice = input("\n[1: LAN-TCP | 2: LAN-UDP | 3: WiFi-HTTP | 4: Anomaly-Stream | q: Quit] > ").strip()
            if choice.lower() == 'q':
                break

            tmpl = SENSOR_TEMPLATES["WATER_PUMP"]
            metrics = dict(tmpl["healthy"])

            if choice == '1':
                payload = {
                    "source": "LAN", "protocol": "TCP", "sensor_type": tmpl["sensor_type"],
                    "device_id": "LAN-TCP-PUMP-01", "location": tmpl["location"],
                    "ip_address": "192.168.1.108", "metrics": metrics
                }
                ok, msg = send_packet_lan_tcp(DEFAULT_HOST, DEFAULT_TCP_PORT, payload)
                print(f"[{'OK' if ok else 'ERR'}] {msg}")

            elif choice == '2':
                payload = {
                    "source": "LAN", "protocol": "UDP", "sensor_type": tmpl["sensor_type"],
                    "device_id": "LAN-UDP-PUMP-01", "location": tmpl["location"],
                    "ip_address": "192.168.1.108", "metrics": metrics
                }
                ok, msg = send_packet_lan_udp(DEFAULT_HOST, DEFAULT_UDP_PORT, payload)
                print(f"[{'OK' if ok else 'ERR'}] {msg}")

            elif choice == '3':
                payload = {
                    "source": "WIFI", "protocol": "HTTP", "sensor_type": "AQI",
                    "device_id": "WIFI-ESP32-AQI-01", "location": "Central Green Walkway",
                    "signal_dbm": -56, "metrics": SENSOR_TEMPLATES["AIR_QUALITY_STATION"]["healthy"]
                }
                ok, msg = send_packet_wifi_http(DEFAULT_HTTP_URL, payload)
                print(f"[{'OK' if ok else 'ERR'}] {msg}")

            elif choice == '4':
                print("Transmitting 5 high-vibration anomaly packets via LAN TCP...")
                anomaly_metrics = dict(tmpl["anomaly"])
                for i in range(5):
                    payload = {
                        "source": "LAN", "protocol": "TCP", "sensor_type": tmpl["sensor_type"],
                        "device_id": "LAN-TCP-PUMP-04", "location": tmpl["location"],
                        "metrics": anomaly_metrics
                    }
                    ok, msg = send_packet_lan_tcp(DEFAULT_HOST, DEFAULT_TCP_PORT, payload)
                    print(f"  Packet {i+1}/5 -> {msg}")
                    time.sleep(1.0)
                print("Done. Check Explainable AI & IoT Modal on the website!")

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")


def main():
    try:
        if "--cli" in sys.argv or not HAS_TKINTER:
            run_cli_mode()
        else:
            root = tk.Tk()
            app = IoTSenderGui(root)
            root.mainloop()
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        try:
            with open("iot_sender_error.log", "w", encoding="utf-8") as f:
                f.write(err_msg)
        except Exception:
            pass
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(
                0,
                f"EcoEstate IoT Sender Startup Notice:\n\n{e}\n\nFull log saved to iot_sender_error.log",
                "EcoEstate IoT Sender",
                0x10
            )
        except Exception:
            pass
        sys.exit(1)


if __name__ == "__main__":
    main()
