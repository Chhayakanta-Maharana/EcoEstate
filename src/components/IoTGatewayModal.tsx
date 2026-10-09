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
  const [activeCodeTab, setActiveCodeTab] = useState<'esp32' | 'lan_python'>('esp32');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  // Fetch status and live packets
  const refreshData = async () => {
    try {
      const [statusRes, packetsRes] = await Promise.all([
        DjangoApi.getIoTStatus(),
        DjangoApi.getIoTPackets(30),
      ]);
      if (statusRes) setGatewayStatus(statusRes);
      if (packetsRes?.packets) setPacketStream(packetsRes.packets);
    } catch (e) {
      console.warn('Could not refresh IoT telemetry', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleSimulate = async (
    source: 'LAN' | 'WIFI',
    sensorType: string,
    protocol: string = source === 'LAN' ? 'TCP' : 'HTTP',
    isAnomaly: boolean = false
  ) => {
    setIsSimulating(true);
    try {
      const res = await DjangoApi.simulateIoTPacket(source, sensorType, protocol, isAnomaly);
      if (res?.packet) {
        setPacketStream((prev) => [res.packet, ...prev.slice(0, 29)]);
        setSimulationToast(
          isAnomaly
            ? `⚠️ CRITICAL FAULT INJECTED via ${source} [${protocol}]! Check Equipment Diagnostics.`
            : `Live telemetry received from ${source} [${protocol}] [${sensorType}]!`
        );
        setTimeout(() => setSimulationToast(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const esp32CodeSnippet = `// ==============================================================
// ESP32 WiFi Sensor Telemetry Node -> EcoEstate Dual Gateway
// Direct HTTP JSON POST to: http://<server-ip>:8000/api/iot/ingest/
// ==============================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "EcoEstate_IoT_Grid";
const char* password = "CampusIoTSecretKey";
const char* serverUrl = "http://192.168.1.100:8000/api/iot/ingest/";

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
# Raspberry Pi / Industrial Edge PC / Modbus Transceiver
# ==============================================================
import time
import requests
import socket

GATEWAY_ENDPOINT = "http://127.0.0.1:8000/api/iot/ingest/"

def get_lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 1))
        return s.getsockname()[0]
    except Exception:
        return '192.168.1.50'
    finally:
        s.close()

def push_lan_sensor_telemetry():
    # Read industrial sensors via Modbus-TCP (Port 502) or RS-485
    payload = {
        "source": "LAN",
        "interface": "Ethernet RJ45 (Modbus-TCP)",
        "device_id": "MODBUS-LAN-SUBSTATION-01",
        "sensor_type": "ENERGY",
        "ip_address": get_lan_ip(),
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
        res = requests.post(GATEWAY_ENDPOINT, json=payload, timeout=2.0)
        print(f"[LAN GATEWAY] Transmitted packet: {res.status_code} - {res.json().get('message')}")
    except Exception as e:
        print(f"[LAN GATEWAY ERROR] {e}")

if __name__ == "__main__":
    print(f"Starting EcoEstate LAN Telemetry Gateway on {get_lan_ip()}...")
    while True:
        push_lan_sensor_telemetry()
        time.sleep(3) # Stream every 3 seconds over physical wire`;

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
                  Dual-Channel IoT Sensor Gateway
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LAN + WiFi ACTIVE
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Receiving physical telemetry via wired Ethernet (RJ45 / Modbus) & Wireless (ESP32 Mesh)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
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

          {/* 1. DUAL CHANNEL ARCHITECTURE OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Channel 1: LAN (Ethernet RJ45) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border-2 border-emerald-500/40 relative overflow-hidden space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span>🔌 LAN (Ethernet / Modbus-TCP)</span>
                    </h3>
                    <span className="text-[11px] text-stone-500 dark:text-slate-400">
                      Physical RJ45 Cat6 Cable • Industrial Wired
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-slate-950">
                  ONLINE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Gateway Host IP</span>
                  <span className="font-bold text-stone-900 dark:text-white">192.168.1.50</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Wire Latency</span>
                  <span className="font-bold text-emerald-500">1.8 ms (Zero Jitter)</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Active Wired Nodes</span>
                  <span className="font-bold text-stone-900 dark:text-white">12 Industrial Units</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Packet Frequency</span>
                  <span className="font-bold text-cyan-500">1,420 pkts/min</span>
                </div>
              </div>

              <div className="text-[11px] text-stone-600 dark:text-slate-400 pt-1 border-t border-emerald-500/20 flex items-center justify-between">
                <span>Targets: Substation, STP Pump, Solar Bank</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Port 502 / 8000</span>
              </div>
            </div>

            {/* Channel 2: WiFi (Wireless 802.11 Mesh) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border-2 border-cyan-500/40 relative overflow-hidden space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span>📶 WiFi (ESP32 Wireless Mesh)</span>
                    </h3>
                    <span className="text-[11px] text-stone-500 dark:text-slate-400">
                      802.11 b/g/n Grid • Distributed Wireless
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500 text-slate-950">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Network SSID</span>
                  <span className="font-bold text-stone-900 dark:text-white truncate">EcoEstate_IoT_Grid</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Avg Signal (RSSI)</span>
                  <span className="font-bold text-cyan-400">-56 dBm (High SNR)</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Active WiFi Nodes</span>
                  <span className="font-bold text-stone-900 dark:text-white">28 Microcontrollers</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#1d2035]">
                  <span className="text-[10px] text-stone-400 block font-sans">Packet Frequency</span>
                  <span className="font-bold text-indigo-400">3,450 pkts/min</span>
                </div>
              </div>

              <div className="text-[11px] text-stone-600 dark:text-slate-400 pt-1 border-t border-cyan-500/20 flex items-center justify-between">
                <span>Targets: AQI Sensors, Smart Bins, Parking</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">WPA2-Enterprise</span>
              </div>
            </div>
          </div>

          {/* SENDER APP LAUNCHER BANNER */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-purple-500/15 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-extrabold text-stone-900 dark:text-white">
                  Desktop IoT Hardware Sender Application Ready
                </span>
                <span className="px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-mono text-[9px] font-bold">
                  TCP 5000 • UDP 5005 • WiFi 8000
                </span>
              </div>
              <p className="text-stone-600 dark:text-slate-300 text-[11px]">
                Launch the native Python GUI application to stream telemetry via actual TCP/UDP sockets and WiFi REST API.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <code className="px-2.5 py-1 rounded-xl bg-black/40 text-cyan-400 font-mono text-[10px] border border-cyan-500/30">
                python iot_sender_app.py
              </code>
              <span className="text-[10px] text-stone-500 dark:text-slate-400">or double-click <strong>run_sender.bat</strong></span>
            </div>
          </div>

          {/* 2. REAL-TIME TEST SIMULATOR (Instant Live Verification) */}
          <div className="p-4 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-slate-300">
                  Transmit Test Sensor Packet (Verify Live Ingestion)
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Dispatch real telemetry payloads over LAN TCP socket, LAN UDP datagram, or WiFi HTTP REST:
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 hidden sm:inline">
                Ports: TCP:5000 | UDP:5005 | HTTP:8000
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                <span className="text-[9px] opacity-75 font-mono">Port 5000 • Modbus</span>
              </button>

              <button
                onClick={() => handleSimulate('LAN', 'WATER', 'UDP', false)}
                disabled={isSimulating}
                className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-1">
                  <Network className="w-3.5 h-3.5" />
                  <Droplets className="w-3.5 h-3.5" />
                </div>
                <span>LAN UDP Datagram</span>
                <span className="text-[9px] opacity-75 font-mono">Port 5005 • Fast UDP</span>
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
                onClick={() => handleSimulate('LAN', 'EQUIPMENT', 'TCP', true)}
                disabled={isSimulating}
                className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span>🔴 Inject Vibration Fault</span>
                <span className="text-[9px] opacity-75 font-mono">4.8 mm/s • Simulates Failure</span>
              </button>
            </div>
          </div>

          {/* 3. LIVE INGESTED TELEMETRY STREAM (Packet Inspection Log) */}
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
                  🔌 LAN Only
                </button>
                <button
                  onClick={() => setFilterChannel('WIFI')}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    filterChannel === 'WIFI'
                      ? 'bg-cyan-500 text-slate-950 font-extrabold'
                      : 'text-stone-400'
                  }`}
                >
                  📶 WiFi Only
                </button>
              </div>
            </div>

            {/* Packets List */}
            <div className="rounded-2xl border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-[#07080e] overflow-hidden max-h-56 overflow-y-auto divide-y divide-[#ece3d6] dark:divide-[#151722]">
              {filteredPackets.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400">
                  No packets recorded for this channel filter. Click the test buttons above to simulate live data.
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
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
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

          {/* 4. HARDWARE FLASHING SNIPPETS (For Real Physical Sensors) */}
          <div className="p-4 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-slate-200">
                  Ready-to-Flash Hardware Integration Code
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#151722] text-[11px] font-bold">
                  <button
                    onClick={() => setActiveCodeTab('esp32')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      activeCodeTab === 'esp32'
                        ? 'bg-cyan-500 text-slate-950 font-extrabold'
                        : 'text-stone-400'
                    }`}
                  >
                    ESP32 WiFi (Arduino C++)
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('lan_python')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      activeCodeTab === 'lan_python'
                        ? 'bg-emerald-500 text-slate-950 font-extrabold'
                        : 'text-stone-400'
                    }`}
                  >
                    LAN Modbus / Python
                  </button>
                </div>

                <button
                  onClick={() => copyToClipboard(activeCodeTab === 'esp32' ? esp32CodeSnippet : lanPythonSnippet)}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#121422] border border-[#ece3d6] dark:border-[#151722] text-xs font-bold text-stone-700 dark:text-slate-300 hover:text-cyan-500 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-stone-800 p-3 font-mono text-[11px] text-emerald-400 max-h-48 overflow-y-auto leading-relaxed">
              <pre>{activeCodeTab === 'esp32' ? esp32CodeSnippet : lanPythonSnippet}</pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#ece3d6] dark:border-[#151722] bg-[#fbf8f3] dark:bg-[#04050a] flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Dual Ingestion: <strong>http://localhost:8000/api/iot/ingest/</strong></span>
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
