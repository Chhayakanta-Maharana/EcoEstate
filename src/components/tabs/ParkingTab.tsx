'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DjangoApi } from '@/services/api';
import { Organization } from '@/types';
import {
  Car,
  BatteryCharging,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Camera,
  Video,
  Sliders,
  Check,
  X,
  Radio,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ParkingTabProps {
  org?: Organization;
}

export const ParkingTab: React.FC<ParkingTabProps> = ({ org }) => {
  const { activeOrg: contextOrg } = useAuth();
  const activeOrg = org || contextOrg;
  const [dbParking, setDbParking] = useState<any>(null);
  const [activeStream, setActiveStream] = useState<any>(null);

  // Manual Capacity Feeder State
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [manualTotalBays, setManualTotalBays] = useState<number>(80);
  const [manualEvBays, setManualEvBays] = useState<number>(12);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configToast, setConfigToast] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrg?.id) return;
    let isMounted = true;

    const fetchParking = () => {
      Promise.all([
        DjangoApi.getParkingTelemetry(activeOrg.id),
        DjangoApi.getIoTStatus(),
      ]).then(([data, status]) => {
        if (isMounted) {
          if (data) {
            setDbParking(data);
            if (data.total_slots) setManualTotalBays(data.total_slots);
            if (data.ev_charging_total) setManualEvBays(data.ev_charging_total);
          }
          if (status?.active_stream) setActiveStream(status.active_stream);
        }
      });
    };

    fetchParking();
    const interval = setInterval(fetchParking, 1200);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeOrg?.id]);

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg?.id) return;
    setIsSavingConfig(true);
    try {
      const res = await DjangoApi.configureParkingCapacity(activeOrg.id, manualTotalBays, manualEvBays);
      if (res && res.success) {
        setConfigToast(`Configured capacity: ${res.total_slots} total bays for ${activeOrg.name}`);
        setShowConfigModal(false);
        // Refresh telemetry
        const fresh = await DjangoApi.getParkingTelemetry(activeOrg.id);
        if (fresh) setDbParking(fresh);
      }
    } catch (err) {
      console.error('Error saving capacity:', err);
    } finally {
      setIsSavingConfig(false);
      setTimeout(() => setConfigToast(null), 3500);
    }
  };

  const handleSimulateCameraDetection = async (detectedCount: number) => {
    if (!activeOrg?.id) return;
    const cleanId = String(activeOrg.id).replace('org-', '');
    try {
      await fetch('http://127.0.0.1:8000/api/iot/ingest/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'LAN',
          sensor_type: 'PARKING',
          protocol: 'UDP',
          device_id: 'CAM-PARKING-RTSP-01',
          org_id: cleanId,
          metrics: {
            occupied_slots: detectedCount,
            total_slots: parking.totalSlots,
            entry_flow_rate: Math.floor(Math.random() * 15) + 18,
            ev_charging_occupied: Math.min(parking.evChargingSlotsTotal, Math.floor(detectedCount * 0.2)),
            camera_fps: 30,
            vision_algorithm: 'YOLOv8-Occupancy-PolyMesh'
          }
        })
      });
      setConfigToast(`Camera Feed Updated: ${detectedCount} vehicles detected in-frame!`);
      setTimeout(() => setConfigToast(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const currentCategory = activeStream?.category || null;
  const isParkingActive = currentCategory === 'PARKING';
  const isInactive = currentCategory !== null && !isParkingActive;

  const streamMetrics = isParkingActive ? (activeStream?.metrics || {}) : {};
  const streamTotal = streamMetrics.total_slots !== undefined ? Number(streamMetrics.total_slots) : undefined;
  const streamOcc = streamMetrics.occupied_slots !== undefined ? Number(streamMetrics.occupied_slots) : undefined;
  const streamEvOcc = streamMetrics.ev_charging_occupied !== undefined ? Number(streamMetrics.ev_charging_occupied) : undefined;
  const streamFlow = streamMetrics.entry_flow_rate !== undefined ? Number(streamMetrics.entry_flow_rate) : undefined;

  const total = isInactive ? (dbParking?.total_slots || 80) : (dbParking?.total_slots ?? (streamTotal ?? 80));
  const occ = isInactive ? 0 : (dbParking?.occupied_slots ?? (streamOcc ?? (currentCategory === null ? 0 : 0)));
  const evOcc = isInactive ? 0 : (dbParking?.ev_charging_occupied ?? (streamEvOcc ?? (currentCategory === null ? 0 : 0)));
  const flowRate = isInactive ? 0 : (dbParking?.entry_flow_rate ?? (streamFlow ?? (currentCategory === null ? 0 : 0)));
  const ratePct = isInactive ? 0 : (dbParking?.occupancy_rate_pct ?? (total > 0 ? Math.round((occ / total) * 100) : 0));

  const liveHourlyOccupancy = [
    { time: '08:00', standard: Math.round(total * (isInactive ? 0 : 0.32)), ev: isInactive ? 0 : Math.round(evOcc * 0.35) },
    { time: '10:00', standard: Math.round(total * (isInactive ? 0 : 0.78)), ev: isInactive ? 0 : Math.round(evOcc * 0.9) },
    { time: '12:00', standard: Math.round(occ * (isInactive ? 0 : 0.95)), ev: evOcc },
    { time: '14:00', standard: Math.round(occ * (isInactive ? 0 : 0.88)), ev: isInactive ? 0 : Math.max(0, evOcc - 4) },
    { time: '16:00', standard: occ, ev: evOcc },
    { time: '18:00', standard: Math.round(total * (isInactive ? 0 : 0.52)), ev: isInactive ? 0 : Math.round(evOcc * 0.5) },
  ];

  const parking = {
    totalSlots: total,
    occupiedSlots: occ,
    availableSlots: isInactive ? total : (dbParking?.available_slots ?? Math.max(0, total - occ)),
    evChargingSlotsTotal: dbParking?.ev_charging_total ?? 12,
    evChargingSlotsOccupied: evOcc,
    occupancyRatePct: ratePct,
    peakCongestionZone: isInactive ? 'Inactive Stream (0)' : (dbParking?.peak_congestion_zone || 'CAM-GATE-NORTH-01'),
    entryFlowRatePerHour: flowRate,
    hourlyOccupancy: liveHourlyOccupancy,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {configToast && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            {configToast}
          </span>
          <button onClick={() => setConfigToast(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border border-blue-800/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1 flex-wrap">
            <Car className="w-4 h-4" /> Ethernet/Wi-Fi IP Camera Vision &amp; EV Charging Grid
            {isParkingActive ? (
              <span className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30 font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> CAMERA RTSP STREAM ACTIVE
              </span>
            ) : currentCategory !== null ? (
              <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> INACTIVE STREAM ({currentCategory} ACTIVE)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> CAMERA VISION ONLINE (PoE / Wi-Fi)
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold">Smart Parking &amp; Traffic Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time optical vehicle detection from campus IP camera network stream combined with manually configured estate capacity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Configure Capacity (Manual Feeder)</span>
          </button>

          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Available Bays</span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-extrabold text-emerald-400">{parking.availableSlots}</span>
                <span className="text-xs text-slate-400">/ {parking.totalSlots}</span>
              </div>
            </div>
            <div className="border-l border-white/10 pl-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {parking.occupancyRatePct}% Occupied
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Gate Inflow: {parking.entryFlowRatePerHour} / hr</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Camera Vision Pipeline Banner */}
      <div className="p-5 rounded-3xl bg-[#f8f5ee] dark:bg-[#0b0c15] border border-[#ece3d6] dark:border-[#151722] shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-2">
                <span>Real-Time Optical Camera Vision Feed</span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  RTSP over Ethernet RJ45 / Wi-Fi Router
                </span>
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                Footage Source: <code className="text-cyan-600 dark:text-cyan-400 font-bold">{streamMetrics.source_video || activeStream?.metrics?.source_video || dbParking?.peak_congestion_zone || 'rtsp://cam-gate01.lan:554/live/ch0'}</code> • Resolution: 1080p @ {streamMetrics.camera_fps || 30} FPS • Live Packets Ingested via Socket / REST
              </p>
            </div>
          </div>
        </div>

        {/* Live Calculation Formula Display */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#1a1d2e] text-[11px] font-mono">
            <span className="text-stone-400 dark:text-slate-500">Formula: </span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">{parking.totalSlots} Total</span>
            <span className="text-stone-400"> - </span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">{parking.occupiedSlots} Detected In-Camera</span>
            <span className="text-stone-400"> = </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{parking.availableSlots} Available</span>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSimulateCameraDetection(Math.min(parking.totalSlots, parking.occupiedSlots + 5))}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer"
              title="Simulate 5 cars entering parking via camera"
            >
              +5 Cars In
            </button>
            <button
              onClick={() => handleSimulateCameraDetection(Math.max(0, parking.occupiedSlots - 5))}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
              title="Simulate 5 cars exiting parking via camera"
            >
              -5 Cars Out
            </button>
          </div>
        </div>
      </div>

      {/* Manual Capacity Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div className="flex items-center gap-2.5 text-stone-900 dark:text-white">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">Configure Parking Space Capacity</h3>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">Manual Feeder for {activeOrg?.name || 'Campus'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#121422] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCapacity} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                  Total Authorized Parking Bays (S_total)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={manualTotalBays}
                  onChange={(e) => setManualTotalBays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#fbf8f3] dark:bg-[#090a12] text-stone-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <p className="text-[10px] text-stone-500 dark:text-slate-400">
                  This value serves as the denominator for live camera occupancy calculation: Available = Total - Occupied.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                  Designated EV Fast Charging Bays
                </label>
                <input
                  type="number"
                  min="0"
                  max={manualTotalBays}
                  value={manualEvBays}
                  onChange={(e) => setManualEvBays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#fbf8f3] dark:bg-[#090a12] text-stone-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="p-3 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 text-[11px] text-stone-600 dark:text-slate-300 space-y-1">
                <p className="font-bold text-blue-600 dark:text-blue-400">Live Camera Ingestion Notice:</p>
                <p>
                  Camera Vision AI will continuously count parked vehicles in video frames and subtract from this configured total to calculate available space.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-[#121422] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingConfig ? 'Saving...' : 'Save Capacity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Occupancy Status</span>
          <p className="text-3xl font-extrabold text-stone-900 dark:text-white">{parking.occupiedSlots} <span className="text-xs font-normal text-stone-400 dark:text-slate-500">Slots Used</span></p>
          <div className="w-full h-2 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${parking.occupancyRatePct}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">EV Fast Charging Bays</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-500">{parking.evChargingSlotsOccupied}</span>
            <span className="text-xs text-stone-400 dark:text-slate-500">/ {parking.evChargingSlotsTotal} Active (CCS2/Type 2)</span>
          </div>
          <p className="text-xs text-emerald-500 font-semibold">120 kW Fast Chargers Online</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Traffic Inflow Rate</span>
          <p className="text-3xl font-extrabold text-cyan-500">{parking.entryFlowRatePerHour} <span className="text-xs font-normal text-stone-400 dark:text-slate-500">Vehicles/hr</span></p>
          <p className="text-xs text-stone-500 dark:text-slate-400">ANPR Cameras 100% Operational</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Congestion Hotspot</span>
          <p className="text-sm font-bold text-amber-500 truncate">{parking.peakCongestionZone}</p>
          <p className="text-xs text-stone-500 dark:text-slate-400">Dynamic Variable Message Sign Active</p>
        </div>
      </div>

      {/* Hourly Occupancy Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-4">
        <h2 className="font-bold text-sm text-stone-900 dark:text-white">
          Hourly Parking Utilization & EV Bay Charging Trend
        </h2>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={parking.hourlyOccupancy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#07080e', borderRadius: '12px', border: '1px solid #151722', color: '#ffffff' }}
                itemStyle={{ color: '#ffffff', fontWeight: 700 }}
                labelStyle={{ color: '#38bdf8', fontWeight: 700 }}
              />
              <Legend />
              <Bar dataKey="standard" name="Standard Vehicles" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="ev" name="EV Charging Bays" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ParkingTab;
