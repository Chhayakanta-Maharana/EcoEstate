'use client';

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Network,
  Activity,
  Cpu,
  Zap,
  Droplets,
  Wind,
  Trash2,
  CheckCircle2,
  Radio,
  Server,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  X,
  Play,
  Layers,
  ArrowRight,
  Settings,
  Sliders,
  Save,
  CheckCircle,
  AlertTriangle,
  Globe,
  Share2,
} from 'lucide-react';
import { DjangoApi } from '@/services/api';

interface IoTGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IoTGatewayModal: React.FC<IoTGatewayModalProps> = ({ isOpen, onClose }) => {
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [packetStream, setPacketStream] = useState<any[]>([]);
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'LAN' | 'WIFI'>('ALL');
  const [activeCodeTab, setActiveCodeTab] = useState<'esp32' | 'lan_python' | 'udp_broadcast'>('udp_broadcast');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  // Admin Configuration State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [preferredProtocol, setPreferredProtocol] = useState<'UDP_BROADCAST' | 'TCP_SOCKET' | 'HTTP_REST'>('UDP_BROADCAST');
  const [udpPort, setUdpPort] = useState<number>(5005);
  const [tcpPort, setTcpPort] = useState<number>(5000);
  const [udpBroadcastEnabled, setUdpBroadcastEnabled] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configToast, setConfigToast] = useState<string | null>(null);

  // Fetch status, gateway config, and live packets
  const refreshData = async () => {
    try {
      const [statusRes, packetsRes, configRes] = await Promise.all([
        DjangoApi.getIoTStatus(),
        DjangoApi.getIoTPackets(30),
        DjangoApi.getIoTGatewayConfig(),
      ]);
      if (statusRes) setGatewayStatus(statusRes);
      if (packetsRes?.packets) setPacketStream(packetsRes.packets);
      if (configRes?.config) {
        setPreferredProtocol(configRes.config.preferred_protocol || 'UDP_BROADCAST');
        setUdpPort(configRes.config.udp_port || 5005);
        setTcpPort(configRes.config.tcp_port || 5000);
        setUdpBroadcastEnabled(configRes.config.udp_broadcast_enabled !== false);
      }
    } catch (e) {
      console.warn('Could not refresh IoT telemetry', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await DjangoApi.updateIoTGatewayConfig({
        preferred_protocol: preferredProtocol,
        udp_port: udpPort,
        tcp_port: tcpPort,
        udp_broadcast_enabled: udpBroadcastEnabled,
      });
      if (res?.status === 'success') {
        setConfigToast('✅ IoT Gateway Settings Applied! Socket listeners synchronized on 0.0.0.0.');
        setTimeout(() => setConfigToast(null), 4000);
        refreshData();
      }
    } catch (err) {
      console.error('Failed to save IoT config', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSimulate = async (
    source: 'LAN' | 'WIFI',
    sensorType: string,
    protocol: string = source === 'LAN' ? 'UDP' : 'HTTP',
    isAnomaly: boolean = false
  ) => {
    setIsSimulating(true);
    try {
      const res = await DjangoApi.simulateIoTPacket(source, sensorType, protocol, isAnomaly);
      if (res?.packet) {
        setPacketStream((prev) => [res.packet, ...prev.slice(0, 29)]);
        setSimulationToast(
          isAnomaly
            ? `CRITICAL FAULT INJECTED via ${source} [${protocol}]! Check Equipment Diagnostics.`
            : `Live telemetry received from ${source} [${protocol}] [${sensorType}] on 0.0.0.0!`
        );
        setTimeout(() => setSimulationToast(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const serverLocalIp = gatewayStatus?.lan_channel?.gateway_ip || '192.168.1.100';
  const stats = gatewayStatus?.gateway_config?.stats || { udp_packets: 0, tcp_packets: 0, http_packets: 0 };

  const udpBroadcastSnippet = `# ==============================================================
# EcoEstate IoT Telemetry Sender • UDP Subnet Broadcast (Zero-Config)
# Transmits to 255.255.255.255 on Port ${udpPort} (Received by 0.0.0.0)
# ==============================================================
import socket
import json
import time

BROADCAST_IP = "255.255.255.255"  # Reaches any 0.0.0.0 receiver on shared WiFi
UDP_PORT = ${udpPort}

payload = {
    "source": "LAN",
    "protocol": "UDP",
    "sensor_type": "WATER",
    "device_id": "LAN-UDP-PUMP-04",
    "location": "STP Yard MBBR Lift Pit",
    "metrics": {
        "vibration_mm_s": 1.15,
        "operating_temp_c": 42.5,
        "flow_rate_lps": 18.2
    }
}

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

print(f"Broadcasting telemetry to {BROADCAST_IP}:{UDP_PORT}...")
sock.sendto(json.dumps(payload).encode('utf-8'), (BROADCAST_IP, UDP_PORT))
sock.close()
print("Broadcast packet dispatched successfully!")`;

  const esp32CodeSnippet = `// ==============================================================
// ESP32 WiFi Sensor Telemetry Node -> EcoEstate Dual Gateway
// Direct HTTP JSON POST to: http://${serverLocalIp}:8000/api/iot/ingest/
// ==============================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "EcoEstate_IoT_Grid";
const char* password = "CampusIoTSecretKey";
const char* serverUrl = "http://${serverLocalIp}:8000/api/iot/ingest/";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! Node IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["source"] = "WIFI";
    doc["protocol"] = "HTTP";
    doc["device_id"] = "ESP32-AQI-NODE-01";
    doc["sensor_type"] = "AQI";
    doc["ip_address"] = WiFi.localIP().toString();
    doc["signal_dbm"] = WiFi.RSSI();
    doc["location"] = "Central Campus Quadrangle";

    JsonObject metrics = doc.createNestedObject("metrics");
    metrics["pm25"] = 24.5;
    metrics["pm10"] = 49.2;
    metrics["temp_c"] = 28.6;
    metrics["humidity_pct"] = 62;

    String jsonString;
    serializeJson(doc, jsonString);

    int httpResponseCode = http.POST(jsonString);
    Serial.printf("Transmitted packet. HTTP Code: %d\\n", httpResponseCode);
    http.end();
  }
  delay(5000); // Send telemetry every 5 seconds
}`;

  const lanPythonSnippet = `# ==============================================================
# Industrial LAN (Ethernet RJ45 / Modbus-TCP) Telemetry Gateway
# Direct TCP Socket Connection to 0.0.0.0:${tcpPort}
# ==============================================================
import socket
import json
import time

SERVER_HOST = "${serverLocalIp}"
TCP_PORT = ${tcpPort}

payload = {
    "source": "LAN",
    "protocol": "TCP",
    "device_id": "MODBUS-LAN-SUBSTATION-01",
    "sensor_type": "ENERGY",
    "location": "Primary 33kV Substation Transformer",
    "metrics": {
        "current_load_kw": 584.2,
        "power_factor": 0.98,
        "grid_power_kw": 410.0,
        "solar_kw": 174.2,
        "voltage_v": 415.4
    }
}

try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((SERVER_HOST, TCP_PORT))
    sock.sendall((json.dumps(payload) + "\\n").encode('utf-8'))
    ack = sock.recv(1024)
    print(f"[TCP SUCCESS] ACK Received: {ack.decode('utf-8')}")
    sock.close()
except Exception as e:
    print(f"[TCP ERROR] {e}")`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredPackets = packetStream.filter((pkt) => {
    if (filterChannel === 'ALL') return true;
    return pkt.source === filterChannel;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl overflow-hidden my-auto">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#ece3d6] dark:border-[#151722] flex items-center justify-between gap-3 bg-[#fbf8f3] dark:bg-[#04050a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white tracking-tight">
                  IoT Gateway & Multi-Protocol Ingestion
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  0.0.0.0 LISTENER ACTIVE
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Receiving UDP Broadcasts (255.255.255.255), TCP Direct Stream & WiFi REST on all network interfaces
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              title="Toggle Organization Admin Network Settings"
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isConfigOpen
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-md'
                  : 'bg-white dark:bg-[#0a0b12] border-[#ece3d6] dark:border-[#151722] text-stone-600 dark:text-slate-300 hover:text-cyan-500'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">Admin Config</span>
            </button>
            <button
              onClick={refreshData}
              title="Refresh Telemetry Pipeline"
              className="p-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-[#0a0b12] text-stone-600 dark:text-slate-300 hover:text-cyan-500 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-[#0a0b12] text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Notification Toast */}
          {simulationToast && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{simulationToast}</span>
              </div>
              <span className="font-mono text-[10px]">NeonDB Ingest Synchronized</span>
            </div>
          )}

          {configToast && (
            <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-500" />
                <span>{configToast}</span>
              </div>
              <span className="font-mono text-[10px]">Socket Ports Updated</span>
            </div>
          )}

          {/* ADMIN CONFIGURATION PANEL (Collapsible or always available) */}
          {isConfigOpen && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#f8f5ee] to-[#f2ede4] dark:from-[#0d101e] dark:to-[#090b14] border-2 border-cyan-500/50 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-[#ece3d6] dark:border-[#1e2338] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-stone-900 dark:text-white">
                      Organization Admin • IoT Network & Protocol Control
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400">
                      Alter protocol priorities, binding ports, and UDP broadcast settings for your institute
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                  Role: Org Admin
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Protocol Preference */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-cyan-500" /> Preferred Protocol Mode:
                  </label>
                  <select
                    value={preferredProtocol}
                    onChange={(e: any) => setPreferredProtocol(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#ece3d6] dark:border-[#1d2035] bg-white dark:bg-[#121422] text-stone-900 dark:text-white font-semibold cursor-pointer outline-none focus:border-cyan-500"
                  >
                    <option value="UDP_BROADCAST">📡 UDP Broadcast (255.255.255.255) - Zero Config</option>
                    <option value="TCP_SOCKET">🔌 TCP Socket (Modbus-TCP / Port 5000)</option>
                    <option value="HTTP_REST">📶 WiFi HTTP REST (Port 8000)</option>
                  </select>
                </div>

                {/* UDP Port Config */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1">
                    <Network className="w-3.5 h-3.5 text-blue-500" /> UDP Broadcast Port:
                  </label>
                  <input
                    type="number"
                    value={udpPort}
                    onChange={(e) => setUdpPort(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-[#ece3d6] dark:border-[#1d2035] bg-white dark:bg-[#121422] text-stone-900 dark:text-white font-mono font-bold outline-none focus:border-cyan-500"
                    placeholder="5005"
                  />
                </div>

                {/* TCP Port Config */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-emerald-500" /> TCP Socket Port:
                  </label>
                  <input
                    type="number"
                    value={tcpPort}
                    onChange={(e) => setTcpPort(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-[#ece3d6] dark:border-[#1d2035] bg-white dark:bg-[#121422] text-stone-900 dark:text-white font-mono font-bold outline-none focus:border-cyan-500"
                    placeholder="5000"
                  />
                </div>
              </div>

              {/* Shared WiFi Info & Save Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#ece3d6] dark:border-[#1e2338]">
                <div className="flex items-center gap-2 text-[11px] text-stone-600 dark:text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Receiver Bind: <strong>0.0.0.0</strong> • Subnet Auto-IP: <strong>{serverLocalIp}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingConfig ? 'Applying...' : 'Save & Restart Listeners'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. DUAL CHANNEL ARCHITECTURE OVERVIEW & REAL-TIME STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Channel 1: LAN & UDP BROADCAST */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border-2 border-emerald-500/40 relative overflow-hidden space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span>LAN UDP Broadcast & TCP Socket</span>
                    </h3>
                    <span className="text-[11px] text-stone-500 dark:text-slate-400">
                      Binds to 0.0.0.0 • Catches 255.255.255.255 Subnet Telemetry
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-slate-950">
                  ONLINE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Receiver Binding</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">0.0.0.0 (All NICs)</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Broadcast Destination</span>
                  <span className="font-bold text-stone-900 dark:text-white">255.255.255.255</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">UDP Port</span>
                  <span className="font-bold text-blue-500">Port {udpPort}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">TCP Modbus Port</span>
                  <span className="font-bold text-cyan-500">Port {tcpPort}</span>
                </div>
              </div>

              <div className="text-[11px] text-stone-600 dark:text-slate-400 pt-1 border-t border-emerald-500/20 flex items-center justify-between">
                <span>UDP Broadcasts Received: <strong>{stats.udp_packets} pkts</strong></span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Zero-Config Ready</span>
              </div>
            </div>

            {/* Channel 2: WiFi & REST INGEST */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border-2 border-cyan-500/40 relative overflow-hidden space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span>WiFi (ESP32 Mesh & HTTP REST)</span>
                    </h3>
                    <span className="text-[11px] text-stone-500 dark:text-slate-400">
                      Shared WiFi Subnet Ingestion & REST Endpoint
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500 text-slate-950">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Server Local IP</span>
                  <span className="font-bold text-stone-900 dark:text-white truncate">{serverLocalIp}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">HTTP Ingest Endpoint</span>
                  <span className="font-bold text-cyan-400 truncate">:8000/api/iot/ingest/</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Active WiFi Nodes</span>
                  <span className="font-bold text-stone-900 dark:text-white">28 Microcontrollers</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">HTTP Ingested Packets</span>
                  <span className="font-bold text-indigo-400">{stats.http_packets} pkts</span>
                </div>
              </div>

              <div className="text-[11px] text-stone-600 dark:text-slate-400 pt-1 border-t border-cyan-500/20 flex items-center justify-between">
                <span>Targets: AQI Sensors, Smart Bins, Parking</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">ESP32 / ESP8266</span>
              </div>
            </div>
          </div>

          {/* SENDER APP BANNER */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-purple-500/15 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-extrabold text-stone-900 dark:text-white">
                  IoT Sender App: Broadcast 255.255.255.255 Ready
                </span>
                <span className="px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-mono text-[9px] font-bold">
                  UDP {udpPort} • TCP {tcpPort} • Shared WiFi
                </span>
              </div>
              <p className="text-stone-600 dark:text-slate-300 text-[11px]">
                Sender automatically broadcasts to <strong>255.255.255.255:{udpPort}</strong> without requiring manual server IP configuration.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <code className="px-2.5 py-1 rounded-xl bg-black/40 text-cyan-400 font-mono text-[10px] border border-cyan-500/30">
                python iot_sender_app.py
              </code>
              <span className="text-[10px] text-stone-500 dark:text-slate-400">or double-click <strong>run_sender.bat</strong></span>
            </div>
          </div>

          {/* 2. REAL-TIME TEST SIMULATOR */}
          <div className="p-4 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-slate-300">
                  Transmit Test Sensor Packet (Verify Live Ingestion)
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Dispatch telemetry over UDP broadcast, TCP socket, or WiFi HTTP REST:
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 hidden sm:inline">
                Ports: UDP:{udpPort} | TCP:{tcpPort} | HTTP:8000
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleSimulate('LAN', 'WATER', 'UDP', false)}
                disabled={isSimulating}
                className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5" />
                  <Droplets className="w-3.5 h-3.5" />
                </div>
                <span>UDP Broadcast</span>
                <span className="text-[9px] opacity-75 font-mono">255.255.255.255:{udpPort}</span>
              </button>

              <button
                onClick={() => handleSimulate('LAN', 'ENERGY', 'TCP', false)}
                disabled={isSimulating}
                className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-1">
                  <Network className="w-3.5 h-3.5" />
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>LAN TCP Socket</span>
                <span className="text-[9px] opacity-75 font-mono">0.0.0.0:{tcpPort} • Modbus</span>
              </button>

              <button
                onClick={() => handleSimulate('WIFI', 'AQI', 'HTTP', false)}
                disabled={isSimulating}
                className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" />
                  <Wind className="w-3.5 h-3.5" />
                </div>
                <span>WiFi ESP32 Node</span>
                <span className="text-[9px] opacity-75 font-mono">Port 8000 • REST POST</span>
              </button>

              <button
                onClick={() => handleSimulate('LAN', 'EQUIPMENT', 'UDP', true)}
                disabled={isSimulating}
                className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Inject Anomaly Fault
                </span>
                <span className="text-[9px] opacity-75 font-mono">4.8 mm/s • UDP Broadcast</span>
              </button>
            </div>
          </div>

          {/* 3. LIVE INGESTED TELEMETRY STREAM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-slate-200">
                  Live Ingested Telemetry Feed ({filteredPackets.length} Packets)
                </h4>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] text-[11px] font-bold">
                <button
                  onClick={() => setFilterChannel('ALL')}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    filterChannel === 'ALL'
                      ? 'bg-white dark:bg-[#121422] text-stone-900 dark:text-white shadow-sm font-extrabold'
                      : 'text-stone-400'
                  }`}
                >
                  All Channels
                </button>
                <button
                  onClick={() => setFilterChannel('LAN')}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    filterChannel === 'LAN'
                      ? 'bg-emerald-500 text-slate-950 font-extrabold'
                      : 'text-stone-400'
                  }`}
                >
                  LAN / UDP
                </button>
                <button
                  onClick={() => setFilterChannel('WIFI')}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    filterChannel === 'WIFI'
                      ? 'bg-cyan-500 text-slate-950 font-extrabold'
                      : 'text-stone-400'
                  }`}
                >
                  WiFi Only
                </button>
              </div>
            </div>

            {/* Packets List */}
            <div className="rounded-2xl border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-[#07080e] overflow-hidden max-h-52 overflow-y-auto divide-y divide-[#ece3d6] dark:divide-[#151722]">
              {filteredPackets.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400">
                  No packets recorded for this channel filter. Dispatch test packets above or stream from Python sender.
                </div>
              ) : (
                filteredPackets.map((pkt) => (
                  <div key={pkt.id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50 dark:hover:bg-[#0c0e17] transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex-shrink-0 flex items-center gap-1 ${
                          pkt.source === 'LAN'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {pkt.source === 'LAN' ? <Network className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                        {pkt.source}
                      </span>

                      {pkt.protocol && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black ${
                          pkt.protocol === 'UDP'
                            ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                            : pkt.protocol === 'TCP'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {pkt.protocol}
                        </span>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900 dark:text-white truncate">
                            {pkt.device_id}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono hidden md:inline">
                            [{pkt.ip_address}]
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 dark:text-slate-400 truncate block">
                          {pkt.location} • <span className="font-semibold text-cyan-600 dark:text-cyan-400">{pkt.interface}</span>
                        </span>
                      </div>
                    </div>

                    {/* Metrics Values */}
                    <div className="flex items-center gap-3 justify-between sm:justify-end font-mono text-[11px]">
                      <div className="text-right">
                        {pkt.metrics?.vibration_mm_s && (
                          <span className="text-rose-500 font-bold block">{pkt.metrics.vibration_mm_s} mm/s Vib</span>
                        )}
                        {pkt.metrics?.operating_temp_c && (
                          <span className="text-amber-500 font-bold">{pkt.metrics.operating_temp_c}°C </span>
                        )}
                        {pkt.metrics?.current_load_kw && (
                          <span className="text-amber-500 font-bold">{pkt.metrics.current_load_kw} kW</span>
                        )}
                        {pkt.metrics?.pm25 && (
                          <span className="text-cyan-400 font-bold">PM2.5: {pkt.metrics.pm25} µg/m³</span>
                        )}
                        {pkt.metrics?.flow_rate_lps && (
                          <span className="text-blue-400 font-bold">{pkt.metrics.flow_rate_lps} L/s</span>
                        )}
                        {pkt.metrics?.fill_percentage && (
                          <span className="text-rose-400 font-bold">Fill: {pkt.metrics.fill_percentage}%</span>
                        )}
                      </div>

                      <span className="text-[10px] text-stone-400 flex-shrink-0">
                        {pkt.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. HARDWARE FLASHING & CODE EXAMPLES */}
          <div className="p-4 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-slate-200">
                  Ready-to-Use Integration Code
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#151722] text-[11px] font-bold">
                  <button
                    onClick={() => setActiveCodeTab('udp_broadcast')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      activeCodeTab === 'udp_broadcast'
                        ? 'bg-blue-500 text-white font-extrabold'
                        : 'text-stone-400'
                    }`}
                  >
                    UDP Broadcast (Python)
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('esp32')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      activeCodeTab === 'esp32'
                        ? 'bg-cyan-500 text-slate-950 font-extrabold'
                        : 'text-stone-400'
                    }`}
                  >
                    ESP32 WiFi (C++)
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('lan_python')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      activeCodeTab === 'lan_python'
                        ? 'bg-emerald-500 text-slate-950 font-extrabold'
                        : 'text-stone-400'
                    }`}
                  >
                    TCP Modbus (Python)
                  </button>
                </div>

                <button
                  onClick={() => copyToClipboard(activeCodeTab === 'udp_broadcast' ? udpBroadcastSnippet : activeCodeTab === 'esp32' ? esp32CodeSnippet : lanPythonSnippet)}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#151722] text-xs font-bold text-stone-700 dark:text-slate-300 hover:text-cyan-500 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-stone-800 p-3 font-mono text-[11px] text-emerald-400 max-h-44 overflow-y-auto leading-relaxed">
              <pre>{activeCodeTab === 'udp_broadcast' ? udpBroadcastSnippet : activeCodeTab === 'esp32' ? esp32CodeSnippet : lanPythonSnippet}</pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#ece3d6] dark:border-[#151722] bg-[#fbf8f3] dark:bg-[#04050a] flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>0.0.0.0 Listeners: <strong>UDP {udpPort} (Broadcast 255.255.255.255) • TCP {tcpPort} • HTTP Ingest 8000</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-slate-950 font-extrabold text-xs cursor-pointer shadow-md"
          >
            Close Monitor
          </button>
        </div>

      </div>
    </div>
  );
};

export default IoTGatewayModal;
