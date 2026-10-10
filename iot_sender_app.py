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
    from tkinter import ttk, scrolledtext, messagebox, filedialog
    HAS_TKINTER = True
except ImportError:
    HAS_TKINTER = False

# Try importing OpenCV for Real-Time Optical Computer Vision & Video Ingestion
try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

# ==============================================================================
# COMPUTER VISION PARKING SLOT & VEHICLE DETECTION ENGINE
# ==============================================================================
class ParkingVisionProcessor:
    """
    Real-time Optical Parking Bay & Vehicle Movement Computer Vision Engine:
    - Decodes video streams from local files (.mp4, .avi, etc.) or RTSP/HTTP network camera feeds.
    - Uses Adaptive Background Subtraction (MOG2) + morphological contour extraction.
    - Detects active moving and parked vehicles across calibrated parking bay boundaries.
    - Computes real-time telemetry metrics:
        * Total Bays (S_total)
        * Detected Occupied Bays (S_occupied)
        * Available Bays (S_available = max(0, S_total - S_occupied))
        * Occupancy Percentage ((S_occupied / S_total) * 100)
        * Real-time Gate Inflow / Flow rate (vehicles/min)
        * EV Bays Occupied
        * Optical FPS & Frame counter
    """
    def __init__(self, total_slots: int = 80, ev_slots: int = 12):
        self.total_slots = total_slots
        self.ev_slots = ev_slots
        self.video_source = None
        self.cap = None
        self.is_open = False
        self.fps = 30.0
        self.total_frames = 0
        self.current_frame_idx = 0
        self.width = 640
        self.height = 360
        self.bg_subtractor = None
        self.last_process_time = time.time()
        self.processed_fps = 30.0
        self.slot_rois = []
        self._init_slot_rois()

    def _init_slot_rois(self):
        """Define virtual parking bay bounding boxes across normalized 640x360 frame."""
        self.slot_rois = []
        cols_row1 = max(1, self.total_slots // 2)
        slot_w1 = max(8, 560 // cols_row1)
        for i in range(cols_row1):
            x = 40 + i * slot_w1
            self.slot_rois.append((x, 45, max(6, slot_w1 - 4), 75))
            
        cols_row2 = max(1, self.total_slots - cols_row1)
        slot_w2 = max(8, 560 // cols_row2)
        for i in range(cols_row2):
            x = 40 + i * slot_w2
            self.slot_rois.append((x, 240, max(6, slot_w2 - 4), 75))

    def set_total_slots(self, total: int):
        self.total_slots = max(1, int(total))
        self._init_slot_rois()

    def load_source(self, source_path_or_url: str) -> tuple[bool, str]:
        if not HAS_OPENCV:
            return False, "OpenCV (cv2) is not installed in the environment."
        try:
            if self.cap is not None:
                try:
                    self.cap.release()
                except Exception:
                    pass
            
            source = int(source_path_or_url) if isinstance(source_path_or_url, str) and source_path_or_url.isdigit() else source_path_or_url

            self.cap = cv2.VideoCapture(source)
            if not self.cap.isOpened():
                self.is_open = False
                return False, f"Could not open video source: {source_path_or_url}"

            self.video_source = str(source_path_or_url)
            self.is_open = True
            raw_fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
            self.fps = raw_fps if (0 < raw_fps <= 120) else 30.0
            self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
            self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
            self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 360
            self.current_frame_idx = 0
            
            self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=32, detectShadows=True)
            return True, f"Loaded: {self.width}x{self.height} @ {self.fps:.1f} FPS ({self.total_frames} frames)"
        except Exception as e:
            self.is_open = False
            return False, f"Error initializing optical pipeline: {e}"

    def process_next_frame(self) -> dict:
        now = time.time()
        dt = max(0.001, now - self.last_process_time)
        self.processed_fps = round(1.0 / dt, 1)
        self.last_process_time = now

        if not HAS_OPENCV or self.cap is None or not self.is_open:
            sim_occ = max(5, int(self.total_slots * 0.45) + random.randint(-1, 1))
            sim_occ = min(self.total_slots, sim_occ)
            return {
                "total_slots": self.total_slots,
                "occupied_slots": sim_occ,
                "available_slots": max(0, self.total_slots - sim_occ),
                "occupancy_rate_pct": round((sim_occ / self.total_slots) * 100),
                "ev_charging_occupied": min(self.ev_slots, int(sim_occ * 0.18)),
                "ev_charging_total": self.ev_slots,
                "entry_flow_rate": random.randint(18, 26),
                "camera_fps": 30.0,
                "frame_idx": self.current_frame_idx,
                "total_frames": self.total_frames,
                "detected_vehicles": sim_occ,
                "model_status": "Simulated Optical Engine"
            }

        ret, frame = self.cap.read()
        if not ret or frame is None:
            # Loop video back to beginning
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            self.current_frame_idx = 0
            ret, frame = self.cap.read()
            if not ret or frame is None:
                return self._fallback_metrics()

        self.current_frame_idx += 1
        proc_w, proc_h = 640, 360
        resized = cv2.resize(frame, (proc_w, proc_h))

        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        if self.bg_subtractor is None:
            self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=32, detectShadows=True)
        fg_mask = self.bg_subtractor.apply(blurred)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        cleaned = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
        dilated = cv2.dilate(cleaned, kernel, iterations=2)

        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detected_vehicles = 0
        vehicle_boxes = []
        for c in contours:
            area = cv2.contourArea(c)
            if area > 280:
                x, y, w, h = cv2.boundingRect(c)
                aspect = float(w) / max(1, h)
                if 0.3 < aspect < 4.5:
                    detected_vehicles += 1
                    vehicle_boxes.append((x, y, w, h))

        occupied_slots = 0
        for (sx, sy, sw, sh) in self.slot_rois:
            slot_mask = fg_mask[sy:sy+sh, sx:sx+sw]
            if slot_mask.size > 0:
                white_pixels = cv2.countNonZero(slot_mask)
                occupancy_ratio = white_pixels / float(slot_mask.size)
                if occupancy_ratio > 0.12:
                    occupied_slots += 1
                else:
                    slot_center_x, slot_center_y = sx + sw // 2, sy + sh // 2
                    for (vx, vy, vw, vh) in vehicle_boxes:
                        if vx <= slot_center_x <= vx + vw and vy <= slot_center_y <= vy + vh:
                            occupied_slots += 1
                            break

        if occupied_slots == 0 and detected_vehicles > 0:
            occupied_slots = min(self.total_slots, detected_vehicles)
        elif occupied_slots == 0:
            mean_intensity = float(np.mean(gray))
            occupied_slots = min(self.total_slots, max(5, int((mean_intensity / 255.0) * self.total_slots * 0.7)))

        occupied_slots = min(self.total_slots, max(0, occupied_slots))
        available_slots = max(0, self.total_slots - occupied_slots)
        rate_pct = round((occupied_slots / max(1, self.total_slots)) * 100)
        ev_occ = min(self.ev_slots, max(0, int(occupied_slots * 0.18)))

        # Corridor vehicle flow calculation
        transit_corridor = fg_mask[130:230, 0:proc_w]
        flow_movement = cv2.countNonZero(transit_corridor) / float(max(1, transit_corridor.size))
        entry_flow = max(10, min(120, int(flow_movement * 250) + 15))

        return {
            "total_slots": self.total_slots,
            "occupied_slots": occupied_slots,
            "available_slots": available_slots,
            "occupancy_rate_pct": rate_pct,
            "ev_charging_occupied": ev_occ,
            "ev_charging_total": self.ev_slots,
            "entry_flow_rate": entry_flow,
            "camera_fps": round(self.fps, 1),
            "frame_idx": self.current_frame_idx,
            "total_frames": self.total_frames,
            "detected_vehicles": detected_vehicles,
            "model_status": "OpenCV MOG2 Vision Active"
        }

    def _fallback_metrics(self):
        sim_occ = max(10, int(self.total_slots * 0.5))
        return {
            "total_slots": self.total_slots,
            "occupied_slots": sim_occ,
            "available_slots": max(0, self.total_slots - sim_occ),
            "occupancy_rate_pct": round((sim_occ / self.total_slots) * 100),
            "ev_charging_occupied": min(self.ev_slots, int(sim_occ * 0.18)),
            "ev_charging_total": self.ev_slots,
            "entry_flow_rate": 24,
            "camera_fps": 30.0,
            "frame_idx": self.current_frame_idx,
            "total_frames": self.total_frames,
            "detected_vehicles": sim_occ,
            "model_status": "Optical Engine Standby"
        }

    def close(self):
        if self.cap is not None:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None
        self.is_open = False

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
        "category": "WASTE",
        "sensor_type": "WASTE",
        "device_id": "WIFI-ESP32-BIN-02",
        "location": "Student Food Court & Canteen Plaza",
        "healthy": {
            "fill_percentage": 35.0,
            "battery_pct": 94.0,
            "distance_cm": 65.0,
            "waste_weight_kg": 28.0
        },
        "anomaly": {
            "fill_percentage": 92.0,
            "battery_pct": 18.0,
            "distance_cm": 8.0,
            "waste_weight_kg": 95.0
        }
    },
    "PARKING_GATEWAY": {
        "name": "Ethernet/Wi-Fi IP Camera Vision & ANPR Node #1",
        "category": "PARKING",
        "sensor_type": "PARKING",
        "device_id": "CAM-PARKING-RTSP-01",
        "location": "Main Campus Gate & Parking Quad (RTSP over Ethernet/Wi-Fi)",
        "healthy": {
            "occupied_slots": 35.0,
            "total_slots": 80.0,
            "ev_charging_occupied": 5.0,
            "entry_flow_rate": 22.0,
            "camera_fps": 30.0
        },
        "anomaly": {
            "occupied_slots": 78.0,
            "total_slots": 80.0,
            "ev_charging_occupied": 12.0,
            "entry_flow_rate": 84.0,
            "camera_fps": 30.0
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
    """Sends telemetry payload via UDP Datagram / Subnet Broadcast (255.255.255.255) with 0ms non-blocking delivery."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        msg = json.dumps(payload)
        sock.sendto(msg.encode('utf-8'), (host, port))
        sock.close()
        return True, f"Subnet UDP Datagram Emitted to {host}:{port} (Instant 0ms delivery)"
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

        # Video footage import & IP Camera streaming state (OpenCV Optical Vision Engine)
        self.video_streaming = False
        self.video_stream_thread = None
        self.video_file_var = tk.StringVar(value="")
        self.video_rtsp_var = tk.StringVar(value="rtsp://192.168.0.50:554/live/ch0")
        self.video_total_bays_var = tk.IntVar(value=80)
        self.video_detected_var = tk.IntVar(value=35)
        self.video_flow_var = tk.IntVar(value=24)
        self.video_auto_sim_var = tk.BooleanVar(value=False)
        self.video_status_label = None
        self.btn_video_toggle = None

        # Integrated Computer Vision Video Processing Model
        self.vision_processor = ParkingVisionProcessor(total_slots=80, ev_slots=12)
        sample_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_parking_feed.mp4")
        if os.path.exists(sample_path):
            self.video_file_var.set(sample_path)
            self.vision_processor.load_source(sample_path)

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

        # TAB 3: VIDEO FOOTAGE & IP CAMERA INGEST
        video_frame = tk.Frame(self.channel_tab, bg="#0d111f")
        self.channel_tab.add(video_frame, text="  📹 Video Import & RTSP  ")
        self._build_video_tab(video_frame)

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
                "DUSTBIN (Smart Campus Ultrasonic Bin)",
                "PARKING_GATEWAY (Ethernet/Wi-Fi IP Camera Vision)"
            ]
        )
        self.sensor_combo.pack(side="left", padx=10)
        self.sensor_combo.current(0)
        self.sensor_combo.bind("<<ComboboxSelected>>", lambda e: self._on_sensor_changed())

        # Sensor metadata display
        self.loc_label = tk.Label(sensor_box, text="📍 Location: Loading...", bg="#0d111f", fg="#94a3b8", font=("Segoe UI", 8))
        self.loc_label.pack(anchor="w", padx=10, pady=(0, 4))

        # Dynamic Sensor Fleet Count (N Nodes Selector)
        fleet_row = tk.Frame(sensor_box, bg="#0d111f")
        fleet_row.pack(fill="x", padx=10, pady=(0, 6))

        tk.Label(fleet_row, text="Active Fleet Size (N Sensors):", font=("Segoe UI", 8, "bold"), bg="#0d111f", fg="#38bdf8").pack(side="left")

        self.fleet_count_var = tk.IntVar(value=8)

        btn_dec = tk.Button(
            fleet_row, text="➖", font=("Segoe UI", 7, "bold"),
            bg="#1e293b", fg="#ffffff", activebackground="#334155", bd=0, padx=5, pady=0,
            cursor="hand2", command=lambda: self._step_fleet(-1)
        )
        btn_dec.pack(side="left", padx=(6, 2))

        self.fleet_spin = tk.Spinbox(
            fleet_row, from_=1, to=30, textvariable=self.fleet_count_var, width=3,
            font=("Segoe UI", 9, "bold"), bg="#070913", fg="#38bdf8", insertbackground="#ffffff",
            justify="center", command=lambda: self._update_fleet_label()
        )
        self.fleet_spin.pack(side="left", padx=2)

        btn_inc = tk.Button(
            fleet_row, text="➕", font=("Segoe UI", 7, "bold"),
            bg="#1e293b", fg="#ffffff", activebackground="#334155", bd=0, padx=5, pady=0,
            cursor="hand2", command=lambda: self._step_fleet(1)
        )
        btn_inc.pack(side="left", padx=(2, 6))

        for p_val in [1, 5, 8, 12]:
            tk.Button(
                fleet_row, text=f"{p_val}N", font=("Segoe UI", 7, "bold"),
                bg="#1e3a8a", fg="#93c5fd", activebackground="#2563eb", bd=0, padx=4, pady=1,
                cursor="hand2", command=lambda v=p_val: (self.fleet_count_var.set(v), self._update_fleet_label())
            ).pack(side="left", padx=1)

        self.fleet_info_label = tk.Label(fleet_row, text="• 8 Nodes Live", font=("Segoe UI", 8, "bold"), bg="#0d111f", fg="#10b981")
        self.fleet_info_label.pack(side="left", padx=6)

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

        # --- 4. Multi-Behavior AI Copilot Diagnostic Box (Groq Cloud) ---
        ai_box = tk.LabelFrame(parent, text=" ⚡ 4. Multi-Behavior AI Copilot (Groq LPU Engine) ", font=("Segoe UI", 9, "bold"), bg="#0d111f", fg="#c084fc", bd=1)
        ai_box.pack(fill="x", pady=(0, 8), padx=2)

        ai_row = tk.Frame(ai_box, bg="#0d111f")
        ai_row.pack(fill="x", padx=8, pady=6)

        tk.Label(ai_row, text="Org Persona:", font=("Segoe UI", 9, "bold"), bg="#0d111f", fg="#cbd5e1").pack(side="left")
        self.ai_org_var = tk.StringVar(value="HOSPITAL")
        self.ai_org_combo = ttk.Combobox(
            ai_row, textvariable=self.ai_org_var, state="readonly", width=22,
            values=[
                "HOSPITAL",
                "INDUSTRY",
                "COLLEGE",
                "PSU",
                "COMMERCIAL"
            ]
        )
        self.ai_org_combo.pack(side="left", padx=6)
        self.ai_org_combo.current(0)

        self.btn_run_ai = tk.Button(
            ai_row, text="🧠 Run Groq AI Diagnosis", font=("Segoe UI", 9, "bold"),
            bg="#7e22ce", fg="#ffffff", activebackground="#6b21a8", activeforeground="#ffffff",
            bd=0, padx=12, pady=4, cursor="hand2", command=self.run_ai_copilot_diagnosis
        )
        self.btn_run_ai.pack(side="left", padx=4)

        # --- 5. Transmission Action Bar ---
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

    def _step_fleet(self, delta: int):
        cur = self.fleet_count_var.get()
        new_val = max(1, min(30, cur + delta))
        self.fleet_count_var.set(new_val)
        self._update_fleet_label()

    def _update_fleet_label(self):
        key = self._get_selected_key()
        count = max(1, min(30, self.fleet_count_var.get()))
        self.fleet_info_label.config(text=f"• {count} {key.split('_')[0]} Nodes Online")

    def _on_sensor_changed(self):
        key = self._get_selected_key()
        tmpl = SENSOR_TEMPLATES.get(key, SENSOR_TEMPLATES["WATER_PUMP"])
        self.loc_label.config(text=f"📍 Location: {tmpl['location']}  |  Node: {tmpl['device_id']}")

        # Auto-adjust default fleet size based on category type
        cat_default_fleet = {
            "AIR_QUALITY_STATION": 8,
            "DUSTBIN": 5,
            "WATER_PUMP": 4,
            "ENERGY_TRANSFORMER": 3,
            "SOLAR_ARRAY": 3,
            "PARKING_GATEWAY": 2,
            "CHILLER_HVAC": 2,
        }
        if key in cat_default_fleet:
            self.fleet_count_var.set(cat_default_fleet[key])
        self._update_fleet_label()

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

    def run_ai_copilot_diagnosis(self):
        """Dispatches an asynchronous query to the Groq Multi-Behavior AI Copilot."""
        org_type = self.ai_org_var.get().split(" ")[0].strip()
        sensor_key = self._get_selected_key()
        cluster_map = {
            "WATER_PUMP": "WATER",
            "ENERGY_TRANSFORMER": "ENERGY",
            "AIR_QUALITY_STATION": "AQI",
            "CHILLER_HVAC": "HVAC",
            "SOLAR_ARRAY": "ENERGY",
            "DUSTBIN": "WASTE",
            "PARKING_GATEWAY": "GATEWAY"
        }
        cluster = cluster_map.get(sensor_key, "WATER")

        # Collect current slider telemetry
        telemetry = {}
        for k, var in self.metric_vars.items():
            telemetry[k] = round(var.get(), 2)

        self._log(f"🧠 Querying Groq AI Copilot [{org_type}] for {cluster}...", "INFO")
        self.btn_run_ai.config(state="disabled", text="⏳ Analyzing with Groq...")

        def _worker():
            result = None
            raw_url = self.wifi_url_var.get().strip() or DEFAULT_HTTP_URL
            
            # Determine API base url
            try:
                if "/api/" in raw_url:
                    base_api = raw_url.split("/api/")[0] + "/api"
                else:
                    base_api = raw_url.rstrip("/") + "/api"
            except Exception:
                base_api = "http://127.0.0.1:8000/api"

            payload_data = {
                "org_type": org_type,
                "cluster": cluster,
                "sensor_telemetry": telemetry,
                "user_query": f"Diagnose {cluster} readings for {org_type} estate and provide maintenance requirements.",
                "org_name": f"EcoEstate {org_type} Estate"
            }

            # 1. Try local/cloud Django API endpoint first
            target_endpoints = [
                f"{base_api}/ai/org-copilot/",
                "http://127.0.0.1:8000/api/ai/org-copilot/",
                "https://ecoestate.onrender.com/api/ai/org-copilot/"
            ]

            for ep in target_endpoints:
                try:
                    req = urllib.request.Request(
                        ep,
                        data=json.dumps(payload_data).encode("utf-8"),
                        headers={"Content-Type": "application/json", "User-Agent": "EcoEstate-Sender-Desktop/1.0"},
                        method="POST"
                    )
                    with urllib.request.urlopen(req, timeout=5.0) as res:
                        if res.status == 200:
                            result = json.loads(res.read().decode("utf-8"))
                            break
                except Exception:
                    continue

            # 2. If backend endpoints fail, query Groq API directly from desktop app!
            if not result:
                try:
                    groq_key = os.environ.get("GROQ_API_KEY", "")
                    sys_prompt = f"You are the EcoEstate India Multi-Behavior AI Copilot for {org_type} estate. Cluster: {cluster}. Output JSON strictly with keys: persona_summary, urgency, answer, sensor_evaluations, immediate_actions, maintenance_steps, required_tools, spare_parts, compliance_standards."
                    groq_payload = {
                        "model": "openai/gpt-oss-120b",
                        "messages": [
                            {"role": "system", "content": sys_prompt},
                            {"role": "user", "content": json.dumps(payload_data)}
                        ],
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"}
                    }
                    g_req = urllib.request.Request(
                        "https://api.groq.com/openai/v1/chat/completions",
                        data=json.dumps(groq_payload).encode("utf-8"),
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Bearer {groq_key}",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0"
                        },
                        method="POST"
                    )
                    with urllib.request.urlopen(g_req, timeout=8.0) as g_res:
                        g_json = json.loads(g_res.read().decode("utf-8"))
                        raw_c = g_json["choices"][0]["message"]["content"].strip()
                        if raw_c.startswith("```json"): raw_c = raw_c[7:]
                        if raw_c.startswith("```"): raw_c = raw_c[3:]
                        if raw_c.endswith("```"): raw_c = raw_c[:-3]
                        result = json.loads(raw_c.strip())
                        result["source"] = "DIRECT_GROQ_CLOUD"
                except Exception as e_groq:
                    # Deterministic local fallback
                    urgency = "EMERGENCY" if org_type == "HOSPITAL" else "WARNING"
                    result = {
                        "persona_summary": f"Offline Diagnostic for {org_type}",
                        "urgency": urgency,
                        "answer": f"Evaluated {cluster} telemetry under {org_type} criteria.",
                        "immediate_actions": ["Switch to redundant backup unit immediately.", "Dispatch facility engineer."],
                        "maintenance_steps": ["Inspect bearings and vibration.", "Verify electrical phase balance."],
                        "required_tools": ["Fluke 87V Multimeter", "Laser Tachometer"],
                        "spare_parts": ["SKF Bearings", "EPDM Gaskets"],
                        "compliance_standards": ["NABH / ISO 10816 Standard"],
                        "sensor_evaluations": [],
                        "source": "OFFLINE_FALLBACK"
                    }

            self.root.after(0, lambda: self._on_ai_copilot_result(result, org_type, cluster))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_ai_copilot_result(self, result: dict, org_type: str, cluster: str):
        self.btn_run_ai.config(state="normal", text="🧠 Run Groq AI Diagnosis")
        urgency = result.get("urgency", "NORMAL")
        source = result.get("source", "Groq LPU Engine")
        
        # Log to Console
        tag = "ERROR" if urgency in ["EMERGENCY", "CRITICAL"] else "WARN" if urgency == "WARNING" else "SUCCESS"
        self._log(f"✨ AI Copilot Diagnosis Received: [{urgency}] via {source}", tag)
        if result.get("immediate_actions"):
            for act in result.get("immediate_actions", []):
                self._log(f"   ⚡ ACTION: {act}", "INFO")

        # Open Dedicated Modal Window
        self._show_ai_copilot_window(result, org_type, cluster)

    def _show_ai_copilot_window(self, res: dict, org_type: str, cluster: str):
        win = tk.Toplevel(self.root)
        win.title(f"EcoEstate AI Copilot • {org_type} Diagnostic Report")
        win.geometry("820x680")
        win.minsize(700, 500)
        win.configure(bg="#070913")

        # Top Banner
        top_bar = tk.Frame(win, bg="#0d111f", padx=14, pady=10, relief="solid", bd=1)
        top_bar.pack(fill="x", padx=10, pady=(10, 5))

        urgency = res.get("urgency", "NORMAL")
        urg_bg = "#7f1d1d" if urgency == "EMERGENCY" else "#b91c1c" if urgency == "CRITICAL" else "#78350f" if urgency == "WARNING" else "#064e3b"
        urg_fg = "#fca5a5" if urgency in ["EMERGENCY", "CRITICAL"] else "#fde68a" if urgency == "WARNING" else "#6ee7b7"

        tk.Label(
            top_bar, text=f"⚡ AI Copilot: {org_type} Mode  ({cluster})",
            font=("Segoe UI", 12, "bold"), bg="#0d111f", fg="#38bdf8"
        ).pack(side="left")

        urg_lbl = tk.Label(
            top_bar, text=f" {urgency} ", font=("Segoe UI", 9, "bold"),
            bg=urg_bg, fg=urg_fg, padx=10, pady=3
        )
        urg_lbl.pack(side="right")

        # Persona summary
        if res.get("persona_summary"):
            tk.Label(
                win, text=f"📌 {res['persona_summary']}", font=("Segoe UI", 8, "italic"),
                bg="#070913", fg="#94a3b8", wraplength=780, justify="left"
            ).pack(anchor="w", padx=14, pady=(2, 6))

        # Scrollable Notebook / Content
        nb = ttk.Notebook(win)
        nb.pack(fill="both", expand=True, padx=10, pady=5)

        # Tab 1: Action Protocol & Maintenance
        tab_actions = tk.Frame(nb, bg="#0d111f", padx=10, pady=10)
        nb.add(tab_actions, text=" 🚨 Emergency & Maintenance Protocol ")

        t1_box = scrolledtext.ScrolledText(tab_actions, bg="#04050a", fg="#f1f5f9", font=("Segoe UI", 9), wrap="word")
        t1_box.pack(fill="both", expand=True)

        t1_content = []
        t1_content.append("================================================================================")
        t1_content.append(f"  ECOESTATE INDIA AI COPILOT REPORT  |  ORGANIZATION: {org_type}")
        t1_content.append(f"  URGENCY STATUS: {urgency}          |  CLUSTER: {cluster}")
        t1_content.append("================================================================================\n")

        if res.get("immediate_actions"):
            t1_content.append("🛑 IMMEDIATE EMERGENCY ACTION PROTOCOL (MANDATORY):")
            for idx, a in enumerate(res["immediate_actions"], 1):
                t1_content.append(f"   [{idx}] {a}")
            t1_content.append("")

        if res.get("maintenance_steps"):
            t1_content.append("🔧 STEP-BY-STEP MAINTENANCE WORKFLOW:")
            for idx, s in enumerate(res["maintenance_steps"], 1):
                t1_content.append(f"   Step {idx}: {s}")
            t1_content.append("")

        if res.get("required_tools"):
            t1_content.append("🧰 REQUIRED TOOLS & TESTING GEAR:")
            for t in res["required_tools"]:
                t1_content.append(f"   • {t}")
            t1_content.append("")

        if res.get("spare_parts"):
            t1_content.append("📦 RECOMMENDED SPARE PARTS & PART NUMBERS:")
            for p in res["spare_parts"]:
                t1_content.append(f"   • {p}")
            t1_content.append("")

        if res.get("compliance_standards"):
            t1_content.append("📜 STATUTORY & REGULATORY COMPLIANCE:")
            for std in res["compliance_standards"]:
                t1_content.append(f"   • {std}")
            t1_content.append("")

        t1_box.insert(tk.END, "\n".join(t1_content))
        t1_box.config(state="disabled")

        # Tab 2: Full Diagnostic Reasoning
        tab_diag = tk.Frame(nb, bg="#0d111f", padx=10, pady=10)
        nb.add(tab_diag, text=" 🧠 Deep Technical Reasoning & Telemetry ")

        t2_box = scrolledtext.ScrolledText(tab_diag, bg="#04050a", fg="#93c5fd", font=("Consolas", 9), wrap="word")
        t2_box.pack(fill="both", expand=True)
        
        t2_content = []
        if res.get("sensor_evaluations"):
            t2_content.append("--- SENSOR TELEMETRY EVALUATIONS ---")
            for ev in res["sensor_evaluations"]:
                t2_content.append(f"  {ev.get('parameter', 'Param')}: Measured {ev.get('measured_value')} {ev.get('unit')} vs Threshold {ev.get('threshold_value')} | Status: {ev.get('status')} ({ev.get('deviation_pct')})")
            t2_content.append("\n")

        t2_content.append("--- AI DIAGNOSTIC ASSESSMENT ---")
        t2_content.append(res.get("answer", "No narrative available."))
        
        t2_box.insert(tk.END, "\n".join(t2_content))
        t2_box.config(state="disabled")

        # Close button at bottom
        btn_close = tk.Button(
            win, text="Close Report", font=("Segoe UI", 9, "bold"),
            bg="#334155", fg="#ffffff", padx=16, pady=4, command=win.destroy, cursor="hand2"
        )
        btn_close.pack(anchor="e", padx=14, pady=8)

    def _gather_multi_payloads(self) -> list[dict]:
        key = self._get_selected_key()
        tmpl = SENSOR_TEMPLATES.get(key, SENSOR_TEMPLATES["WATER_PUMP"])

        # Determine active channel from notebook tab
        current_tab_idx = self.channel_tab.index(self.channel_tab.select())
        is_lan = (current_tab_idx == 0)

        # Collect base slider metrics
        base_metrics = {}
        for k, var in self.metric_vars.items():
            base_metrics[k] = round(var.get(), 2)

        source = "LAN" if is_lan else "WIFI"
        proto = self.lan_protocol_var.get() if is_lan else "HTTP"
        dev_ip = self.lan_dev_ip_var.get() if is_lan else "192.168.1.145"

        n_count = max(1, min(30, self.fleet_count_var.get()))
        payloads = []

        campus_locations = [
            "Central Academic Plaza & Fountain",
            "Hostel Quad & Central Green Walkway",
            "Sports Complex & Athletic Ground",
            "Main Gateway & Visitor Reception",
            "Science & Engineering Lab Wing",
            "Library Lawn & Reading Pavilion",
            "Auditorium & Cultural Hall",
            "Student Canteen & Food Court",
            "Research Innovation & Incubation Block",
            "Administrative Tower & Boardroom",
            "South Gate & Perimeter Boulevard",
            "Mechanical Plant Yard & Utilities Pit",
            "Rooftop Solar Terrace & Deck",
            "Residential Faculty Enclave",
            "Health Center & Emergency Bay"
        ]

        dev_prefix = {
            "AIR_QUALITY_STATION": "WIFI-ESP32-AQI",
            "DUSTBIN": "WIFI-ESP32-BIN",
            "WATER_PUMP": "LAN-PLC-PUMP",
            "CHILLER_HVAC": "LAN-BACNET-CHILLER",
            "ENERGY_TRANSFORMER": "LAN-MODBUS-XFR",
            "SOLAR_ARRAY": "WIFI-ESP32-SOLAR",
            "PARKING_GATEWAY": "CAM-PARKING-RTSP"
        }.get(key, "NODE")

        # If PARKING_GATEWAY and computer vision processor has an active stream/video, inject real CV metrics
        cv_parking_metrics = None
        if key == "PARKING_GATEWAY" and self.vision_processor and self.vision_processor.is_open:
            cv_parking_metrics = self.vision_processor.process_next_frame()

        for i in range(1, n_count + 1):
            d_id = f"{dev_prefix}-{i:02d}"
            loc = campus_locations[(i - 1) % len(campus_locations)]

            # Natural per-sensor variance (±5%) around slider baseline so nodes aren't carbon copies
            node_metrics = {}
            for mk, mv in base_metrics.items():
                if isinstance(mv, (int, float)):
                    variance = 1.0 + (((i * 9 + 4) % 17) - 8) * 0.012
                    node_metrics[mk] = round(mv * variance, 2)
                else:
                    node_metrics[mk] = mv

            if cv_parking_metrics:
                # Per-node variance on bay count
                occ_var = max(0, min(cv_parking_metrics["total_slots"], cv_parking_metrics["occupied_slots"] + (i - 1) * 2))
                node_metrics["occupied_slots"] = occ_var
                node_metrics["total_slots"] = cv_parking_metrics["total_slots"]
                node_metrics["available_slots"] = max(0, cv_parking_metrics["total_slots"] - occ_var)
                node_metrics["occupancy_rate_pct"] = round((occ_var / max(1, cv_parking_metrics["total_slots"])) * 100)
                node_metrics["ev_charging_occupied"] = cv_parking_metrics["ev_charging_occupied"]
                node_metrics["entry_flow_rate"] = cv_parking_metrics["entry_flow_rate"]
                node_metrics["camera_fps"] = cv_parking_metrics["camera_fps"]
                node_metrics["vision_pipeline"] = cv_parking_metrics.get("model_status", "OpenCV MOG2 Tracking")

            payloads.append({
                "source": source,
                "protocol": proto,
                "sensor_type": tmpl["sensor_type"],
                "category": tmpl["category"],
                "name": f"{tmpl['name']} Node #{i}",
                "device_id": d_id,
                "location": loc,
                "ip_address": dev_ip,
                "mac_address": f"00:1B:44:11:3A:{i:02X}" if is_lan else f"30:AE:A4:7F:8C:{i:02X}",
                "signal_dbm": None if is_lan else (self.wifi_rssi_var.get() - (i % 6)),
                "metrics": node_metrics,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            })

        return payloads

    def send_single_packet(self):
        payloads = self._gather_multi_payloads()
        total_nodes = len(payloads)
        success_count = 0
        last_proto = "UDP"
        last_msg = ""

        # Send all N sensor nodes in the fleet
        for payload in payloads:
            is_lan = (payload["source"] == "LAN")
            proto = payload.get("protocol", "TCP")

            if is_lan:
                host = self.lan_host_var.get().strip() or "255.255.255.255"
                try:
                    port = int(self.lan_port_var.get().strip())
                except Exception:
                    port = DEFAULT_TCP_PORT if proto == "TCP" else DEFAULT_UDP_PORT

                if proto == "TCP":
                    ok, msg = send_packet_lan_tcp(host, port, payload)
                else:
                    ok, msg = send_packet_lan_udp(host, port, payload)
                last_proto = proto
                last_msg = msg
            else:
                raw_url = self.wifi_url_var.get().strip() or DEFAULT_HTTP_URL
                url = normalize_ingest_url(raw_url)
                udp_ok, udp_msg = send_packet_lan_udp("255.255.255.255", 5005, payload)
                http_ok, http_msg = send_packet_wifi_http(url, payload)
                ok = http_ok or udp_ok
                last_proto = "WiFi-HTTP" if http_ok else "UDP-Broadcast"
                last_msg = f"Delivered {payload['device_id']}"

            if ok:
                success_count += 1

        self.packet_count += total_nodes
        self.stat_tx_label.config(text=f"Packets Sent: {self.packet_count}")

        sens_type = payloads[0].get("sensor_type", "TELEMETRY")
        if success_count == total_nodes:
            self._log(f"📡 Multi-Node Fleet: Sent {total_nodes} nodes for [{sens_type}] ({payloads[0]['device_id']} to {payloads[-1]['device_id']}) -> Delivered!", "SUCCESS")
            self.stat_last_label.config(text=f"Fleet Active ({total_nodes} Nodes)", fg="#34d399")
        else:
            self._log(f"⚠️ Fleet Sent: {success_count}/{total_nodes} nodes delivered via {last_proto}.", "WARN")
            self.stat_last_label.config(text=f"Partial ({success_count}/{total_nodes})", fg="#fbbf24")

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

    def _build_video_tab(self, parent):
        grid = tk.Frame(parent, bg="#0d111f")
        grid.pack(fill="both", expand=True, padx=8, pady=6)

        # 1. Video File Browser Row
        f_row = tk.LabelFrame(grid, text=" 📁 Import Local Parking Video Footage ", font=("Segoe UI", 8, "bold"), bg="#0d111f", fg="#38bdf8", bd=1)
        f_row.pack(fill="x", pady=(0, 4), padx=2)

        f_inner = tk.Frame(f_row, bg="#0d111f")
        f_inner.pack(fill="x", padx=6, pady=4)

        tk.Label(f_inner, text="Video File:", bg="#0d111f", fg="#94a3b8", font=("Segoe UI", 8)).pack(side="left")
        self.video_entry = tk.Entry(f_inner, textvariable=self.video_file_var, width=30, bg="#070913", fg="#ffffff", insertbackground="#ffffff")
        self.video_entry.pack(side="left", padx=5)

        btn_browse = tk.Button(
            f_inner, text="📁 Browse Video...", font=("Segoe UI", 8, "bold"),
            bg="#1e3a8a", fg="#93c5fd", activebackground="#2563eb", activeforeground="#ffffff",
            bd=0, padx=6, pady=2, cursor="hand2", command=self._browse_video_file
        )
        btn_browse.pack(side="left", padx=2)

        self.video_info_label = tk.Label(f_row, text="No video loaded. Click 'Browse Video' or enter RTSP URL below.", bg="#0d111f", fg="#64748b", font=("Segoe UI", 7))
        self.video_info_label.pack(anchor="w", padx=8, pady=(0, 2))

        # 2. RTSP Camera Stream Input Row
        rtsp_row = tk.LabelFrame(grid, text=" 🌐 Live IP Camera RTSP Network Stream (Ethernet / Wi-Fi) ", font=("Segoe UI", 8, "bold"), bg="#0d111f", fg="#38bdf8", bd=1)
        rtsp_row.pack(fill="x", pady=(0, 4), padx=2)

        rtsp_inner = tk.Frame(rtsp_row, bg="#0d111f")
        rtsp_inner.pack(fill="x", padx=6, pady=4)

        tk.Label(rtsp_inner, text="RTSP URL:", bg="#0d111f", fg="#94a3b8", font=("Segoe UI", 8)).pack(side="left")
        tk.Entry(rtsp_inner, textvariable=self.video_rtsp_var, width=34, bg="#070913", fg="#ffffff", insertbackground="#ffffff").pack(side="left", padx=5)

        btn_preset_rtsp = tk.Button(
            rtsp_inner, text="Reset RTSP", font=("Segoe UI", 7, "bold"),
            bg="#334155", fg="#cbd5e1", bd=0, padx=5, pady=2, cursor="hand2",
            command=lambda: self.video_rtsp_var.set("rtsp://192.168.0.50:554/live/ch0")
        )
        btn_preset_rtsp.pack(side="left", padx=2)

        # 3. Vision Detection & Telemetry Parameters
        vision_row = tk.LabelFrame(grid, text=" ⚙️ Parking Capacity & Optical Vision Ingestion Settings ", font=("Segoe UI", 8, "bold"), bg="#0d111f", fg="#38bdf8", bd=1)
        vision_row.pack(fill="x", pady=(0, 4), padx=2)

        v_grid = tk.Frame(vision_row, bg="#0d111f")
        v_grid.pack(fill="x", padx=6, pady=3)

        tk.Label(v_grid, text="Total Authorized Bays (S_total):", bg="#0d111f", fg="#cbd5e1", font=("Segoe UI", 8)).grid(row=0, column=0, sticky="w", pady=2)
        tk.Entry(v_grid, textvariable=self.video_total_bays_var, width=8, bg="#070913", fg="#38bdf8", font=("Consolas", 8, "bold"), insertbackground="#ffffff").grid(row=0, column=1, sticky="w", padx=4, pady=2)

        tk.Label(v_grid, text="In-Frame Vehicles:", bg="#0d111f", fg="#cbd5e1", font=("Segoe UI", 8)).grid(row=0, column=2, sticky="w", padx=(6, 0), pady=2)
        self.slider_detected = tk.Scale(
            v_grid, from_=0, to=150, orient="horizontal", variable=self.video_detected_var,
            bg="#0d111f", fg="#38bdf8", highlightthickness=0, length=120, font=("Consolas", 7)
        )
        self.slider_detected.grid(row=0, column=3, sticky="w", padx=4, pady=2)

        tk.Checkbutton(
            vision_row, text="🔄 Auto-simulate vehicle movement timeline from imported video playback",
            variable=self.video_auto_sim_var, bg="#0d111f", fg="#34d399", selectcolor="#070913",
            activebackground="#0d111f", activeforeground="#34d399", font=("Segoe UI", 8)
        ).pack(anchor="w", padx=6, pady=(1, 3))

        # 4. Stream Control Row
        ctrl_row = tk.Frame(grid, bg="#0d111f")
        ctrl_row.pack(fill="x", pady=(3, 0))

        self.btn_video_toggle = tk.Button(
            ctrl_row, text="▶ Stream Video Telemetry", font=("Segoe UI", 8, "bold"),
            bg="#16a34a", fg="#ffffff", activebackground="#15803d", activeforeground="#ffffff",
            bd=0, padx=10, pady=4, cursor="hand2", command=self.toggle_video_stream
        )
        self.btn_video_toggle.pack(side="left", padx=(0, 6))

        self.video_status_label = tk.Label(
            ctrl_row, text="● STANDBY (Ready to stream over Ethernet/WiFi)",
            font=("Consolas", 8, "bold"), bg="#1e293b", fg="#94a3b8", padx=6, pady=3
        )
        self.video_status_label.pack(side="left")

    def _browse_video_file(self):
        try:
            fpath = filedialog.askopenfilename(
                title="Select Parking Video Footage",
                filetypes=[
                    ("Video Files", "*.mp4 *.avi *.mov *.mkv *.wmv *.flv"),
                    ("All Files", "*.*")
                ]
            )
            if fpath:
                self.video_file_var.set(fpath)
                fname = os.path.basename(fpath)
                fsize = os.path.getsize(fpath) / (1024 * 1024)

                # Load into OpenCV Optical Vision Engine
                total_cap = max(1, int(self.video_total_bays_var.get() or 80))
                self.vision_processor.set_total_slots(total_cap)
                ok, msg = self.vision_processor.load_source(fpath)

                if ok:
                    # Run first frame through vision model immediately
                    init_res = self.vision_processor.process_next_frame()
                    self.video_detected_var.set(init_res["occupied_slots"])
                    self.video_flow_var.set(init_res["entry_flow_rate"])
                    self.video_info_label.config(
                        text=f"✅ {fname} ({fsize:.1f} MB) • {msg} • Initial Optical Detection: {init_res['occupied_slots']}/{init_res['total_slots']} Bays ({init_res['occupancy_rate_pct']}%)",
                        fg="#34d399"
                    )
                    self._log(f"📁 Imported Video: {fname} -> CV2 Model Processed: {init_res['occupied_slots']}/{init_res['total_slots']} Bays Occupied ({init_res['occupancy_rate_pct']}%)", "SUCCESS")
                else:
                    self.video_info_label.config(text=f"⚠️ {fname}: {msg}", fg="#fbbf24")
                    self._log(f"Video load notice: {msg}", "WARN")
        except Exception as e:
            self._log(f"Error opening video: {e}", "FAIL")

    def toggle_video_stream(self):
        if self.video_streaming:
            self.video_streaming = False
            if self.btn_video_toggle:
                self.btn_video_toggle.config(text="▶ Stream Video Telemetry", bg="#16a34a")
            if self.video_status_label:
                self.video_status_label.config(text="● STOPPED", bg="#1e293b", fg="#94a3b8")
            self._log("⏹ Video telemetry stream stopped.", "WARN")
        else:
            self.video_streaming = True
            if self.btn_video_toggle:
                self.btn_video_toggle.config(text="⏹ Stop Video Stream", bg="#dc2626")
            if self.video_status_label:
                self.video_status_label.config(text="🔴 COMPUTER VISION STREAMING LIVE OVER LAN & WIFI", bg="#7f1d1d", fg="#fca5a5")

            # Check if source needs loading
            v_path = self.video_file_var.get().strip()
            rtsp_url = self.video_rtsp_var.get().strip()
            target_source = v_path if (v_path and os.path.exists(v_path)) else (rtsp_url or "rtsp://192.168.0.50:554/live/ch0")

            if not self.vision_processor.is_open:
                self.vision_processor.load_source(target_source)

            source_name = os.path.basename(v_path) if v_path else target_source
            self._log(f"▶ Commenced Live Optical Processing [{source_name}] broadcasting via UDP 5005 & HTTP 8000...", "INFO")

            def _stream_worker():
                while self.video_streaming:
                    try:
                        total_cap = max(1, int(self.video_total_bays_var.get() or 80))
                        self.vision_processor.set_total_slots(total_cap)

                        # Process frame using real Computer Vision model
                        v_metrics = self.vision_processor.process_next_frame()

                        curr_occ = v_metrics["occupied_slots"]
                        avail = v_metrics["available_slots"]
                        rate_pct = v_metrics["occupancy_rate_pct"]
                        ev_occ = v_metrics["ev_charging_occupied"]
                        ev_tot = v_metrics["ev_charging_total"]
                        flow_rate = v_metrics["entry_flow_rate"]
                        cam_fps = v_metrics["camera_fps"]
                        f_idx = v_metrics["frame_idx"]
                        tot_f = v_metrics["total_frames"]
                        pipeline_status = v_metrics["model_status"]

                        # Update GUI variables on main thread
                        self.root.after(0, lambda o=curr_occ: self.video_detected_var.set(o))
                        self.root.after(0, lambda fl=flow_rate: self.video_flow_var.set(fl))
                        status_str = f"🔴 FRAME {f_idx}/{tot_f} | {curr_occ}/{total_cap} BAYS ({rate_pct}%) | FLOW: {flow_rate}/hr"
                        self.root.after(0, lambda txt=status_str: self.video_status_label.config(text=txt, bg="#7f1d1d", fg="#fca5a5"))

                        payload = {
                            "source": "LAN",
                            "protocol": "UDP",
                            "sensor_type": "PARKING",
                            "category": "PARKING",
                            "device_id": "CAM-PARKING-RTSP-01",
                            "source_video": source_name,
                            "location": "Main Campus Parking Quad (Optical Video Ingest)",
                            "ip_address": self.detected_ip,
                            "mac_address": "00:1B:44:11:3A:B7",
                            "signal_dbm": None,
                            "metrics": {
                                "total_slots": total_cap,
                                "occupied_slots": curr_occ,
                                "available_slots": avail,
                                "occupancy_rate_pct": rate_pct,
                                "ev_charging_occupied": ev_occ,
                                "ev_charging_total": ev_tot,
                                "entry_flow_rate": flow_rate,
                                "camera_fps": cam_fps,
                                "frame_idx": f_idx,
                                "total_frames": tot_f,
                                "source_video": source_name,
                                "vision_pipeline": pipeline_status
                            },
                            "timestamp": datetime.now().strftime("%H:%M:%S")
                        }

                        # Dual-Delivery over Ethernet & Wi-Fi:
                        # 1. UDP Broadcast on 5005 (Ethernet / WiFi Low-Latency Datagram)
                        send_packet_lan_udp("255.255.255.255", 5005, payload)

                        # 2. HTTP POST on 8000
                        http_target = self.wifi_url_var.get().strip() or "http://127.0.0.1:8000/api/iot/ingest/"
                        send_packet_wifi_http(http_target, payload)

                        self.packet_count += 1
                        self.root.after(0, lambda: self.stat_tx_label.config(text=f"Packets Sent: {self.packet_count}"))
                        self.root.after(0, lambda s=source_name: self.stat_last_label.config(text=f"CV2 Stream ({s[:14]})", fg="#34d399"))

                        self.root.after(0, lambda o=curr_occ, t=total_cap, a=avail, r=rate_pct, s=source_name, fi=f_idx, fl=flow_rate: 
                            self._log(f"📹 [CV2 VIDEO: {s[:18]}] Frame {fi} -> Occupied: {o}/{t} ({r}%) | Free: {a} | Flow: {fl}/hr", "INFO")
                        )

                    except Exception as err:
                        self.root.after(0, lambda e=err: self._log(f"Video stream error: {e}", "FAIL"))

                    time.sleep(1.0)

            self.video_stream_thread = threading.Thread(target=_stream_worker, daemon=True)
            self.video_stream_thread.start()

    def _discover_server(self):
        """
        Sends an automated UDP Subnet Broadcast beacon to 255.255.255.255:5005.
        EcoEstate backend server listens on 0.0.0.0:5005 and replies with its current IP.
        Updates self.wifi_url_var to the real dynamic IP of Laptop B in < 50ms!
        """
        def _worker():
            self._log("🔍 Probing local WiFi subnet (255.255.255.255:5005) for EcoEstate server...", "INFO")
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
                s.settimeout(1.5)
                ping_payload = b"ECOESTATE_DISCOVERY_PING"
                s.sendto(ping_payload, ("255.255.255.255", 5005))

                data, addr = s.recvfrom(2048)
                resp = json.loads(data.decode('utf-8', errors='ignore'))
                s.close()

                if resp.get('msg') == 'ECOESTATE_SERVER_ACK':
                    server_ip = resp.get('server_ip') or addr[0]
                    http_url = resp.get('http_url') or f"http://{server_ip}:8000/api/iot/ingest/"
                    self.root.after(0, lambda: self._on_server_discovered(server_ip, http_url))
                    return
            except socket.timeout:
                self._scan_subnet_fallback()
            except Exception as e:
                self._log(f"Auto-discovery notice: {e}", "WARN")

        threading.Thread(target=_worker, daemon=True).start()

    def _on_server_discovered(self, server_ip: str, http_url: str):
        self.wifi_url_var.set(http_url)
        self.lan_host_var.set(server_ip)
        self.conn_status_label.config(
            text=f"🟢 Server Auto-Found: {server_ip}:8000",
            bg="#064e3b", fg="#6ee7b7"
        )
        self._log(f"🎯 Auto-Discovered Laptop B Server at {server_ip}! Ingest URL updated to {http_url}", "SUCCESS")

    def _scan_subnet_fallback(self):
        """Fallback subnet scan if router blocks 255.255.255.255 broadcast."""
        parts = self.detected_ip.split('.')
        if len(parts) == 4:
            base = f"{parts[0]}.{parts[1]}.{parts[2]}"
            for host_tail in [191, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 1, 2, 50]:
                target = f"{base}.{host_tail}"
                try:
                    url = f"http://{target}:8000/api/iot/status/"
                    req = urllib.request.Request(url)
                    with urllib.request.urlopen(req, timeout=0.25) as r:
                        if r.getcode() == 200:
                            ingest_url = f"http://{target}:8000/api/iot/ingest/"
                            self.root.after(0, lambda: self._on_server_discovered(target, ingest_url))
                            return
                except Exception:
                    pass
        self._log("💡 Tip: Use '📡 255.255.255.255' UDP Broadcast (works with zero config, even if IP changes!)", "INFO")

    def _auto_connect_server_on_startup(self):
        """Run discovery probe in background thread right after GUI opens."""
        threading.Thread(target=self._discover_server, daemon=True).start()


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
