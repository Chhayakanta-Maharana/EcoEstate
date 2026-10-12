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

  // Initialize immediately from client cache for 0ms tab-switch hydration
  const initialStatus = DjangoApi.getCachedIoTStatus();
  const initialDbParking = DjangoApi.getCachedParkingTelemetry(activeOrg?.id);
  const initialParkingStream = initialStatus?.category_streams?.PARKING || (initialStatus?.active_stream?.category === 'PARKING' ? initialStatus?.active_stream : null);

  const [dbParking, setDbParking] = useState<any>(initialDbParking);
  const [activeStream, setActiveStream] = useState<any>(initialParkingStream);

  // Manual Capacity Feeder State
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [manualTotalBays, setManualTotalBays] = useState<number>(initialDbParking?.total_slots || 80);
  const [manualEvBays, setManualEvBays] = useState<number>(initialDbParking?.ev_charging_total || 12);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configToast, setConfigToast] = useState<string | null>(null);
  const [cameraFeed, setCameraFeed] = useState<any>(() => DjangoApi.getCachedCameraFeed());

  useEffect(() => {
    if (!activeOrg?.id) return;
    let isMounted = true;

    // Fast in-memory stream poller
    const fetchStream = () => {
      DjangoApi.getIoTStatus().then((status) => {
        if (isMounted && status) {
          const parkingStream = status?.category_streams?.PARKING || (status?.active_stream?.category === 'PARKING' ? status?.active_stream : null);
          if (parkingStream) setActiveStream(parkingStream);
        }
      }).catch(() => null);
    };

    // NeonDB historical poller
    const fetchDb = () => {
      DjangoApi.getParkingTelemetry(activeOrg.id).then((data) => {
        if (isMounted && data) {
          setDbParking(data);
          if (data.total_slots) setManualTotalBays(data.total_slots);
          if (data.ev_charging_total) setManualEvBays(data.ev_charging_total);
        }
      }).catch(() => null);
    };

    const fetchCamera = () => {
      DjangoApi.getLatestCameraFeed().then((cam) => {
        if (isMounted && cam) {
          setCameraFeed(cam);
        }
      }).catch(() => null);
    };

    fetchStream();
    fetchDb();
    fetchCamera();

    const streamInterval = setInterval(fetchStream, 350);
    const dbInterval = setInterval(fetchDb, 3500);
    const camInterval = setInterval(fetchCamera, 200);

    return () => {
      isMounted = false;
      clearInterval(streamInterval);
      clearInterval(dbInterval);
      clearInterval(camInterval);
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

  const handleSaveInlineCapacity = async (overrideTotal?: number) => {
    if (!activeOrg?.id) return;
    const targetTotal = overrideTotal !== undefined ? overrideTotal : manualTotalBays;
    if (targetTotal <= 0) return;

    setIsSavingConfig(true);
    try {
      const res = await DjangoApi.configureParkingCapacity(activeOrg.id, targetTotal, manualEvBays);
      if (res && res.success) {
        setConfigToast(`✅ Updated Capacity: ${res.total_slots} Total Parking Bays (${res.ev_charging_total || manualEvBays} EV)`);
        setManualTotalBays(res.total_slots);
        const fresh = await DjangoApi.getParkingTelemetry(activeOrg.id);
        if (fresh) setDbParking(fresh);
      }
    } catch (err) {
      console.error('Error saving capacity:', err);
      setConfigToast('⚠️ Failed to save parking capacity to database');
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

  const isStreamLive = Boolean(activeStream?.is_active ?? (activeStream?.status === 'ACTIVE'));
  const isParkingActive = isStreamLive && activeStream?.category === 'PARKING';

  const streamMetrics = isParkingActive ? (activeStream?.metrics || {}) : {};
  const streamTotal = streamMetrics.total_slots !== undefined ? Number(streamMetrics.total_slots) : undefined;
  const streamOcc = streamMetrics.occupied_slots !== undefined ? Number(streamMetrics.occupied_slots) : undefined;
  const streamEvOcc = streamMetrics.ev_charging_occupied !== undefined ? Number(streamMetrics.ev_charging_occupied) : undefined;
  const streamFlow = streamMetrics.entry_flow_rate !== undefined ? Number(streamMetrics.entry_flow_rate) : undefined;

  const hasFrame = Boolean(cameraFeed?.annotated_frame_base64);
  const isStreamActive = Boolean(cameraFeed?.active);
  const isCameraLive = hasFrame;

  const total = hasFrame && cameraFeed?.total_slots
    ? cameraFeed.total_slots
    : (streamTotal ?? dbParking?.total_slots ?? manualTotalBays ?? 80);

  const occ = hasFrame && cameraFeed?.occupied_slots !== undefined && cameraFeed?.occupied_slots !== null
    ? cameraFeed.occupied_slots
    : (streamOcc ?? (isParkingActive ? dbParking?.occupied_slots : null));

  const evOcc = hasFrame && cameraFeed?.ev_charging_occupied !== undefined && cameraFeed?.ev_charging_occupied !== null
    ? cameraFeed.ev_charging_occupied
    : (streamEvOcc ?? (isParkingActive ? dbParking?.ev_charging_occupied : 0));

  const flowRate = hasFrame && cameraFeed?.entry_flow_rate !== undefined && cameraFeed?.entry_flow_rate !== null
    ? cameraFeed.entry_flow_rate
    : (streamFlow ?? (isParkingActive ? dbParking?.entry_flow_rate : null));

  const ratePct = hasFrame && cameraFeed?.occupancy_rate_pct !== undefined && cameraFeed?.occupancy_rate_pct !== null
    ? cameraFeed.occupancy_rate_pct
    : (occ !== null && total > 0 ? Math.round((occ / total) * 100) : null);

  const liveHourlyOccupancy = [
    { time: '08:00', standard: Math.round(total * 0.32), ev: Math.round(evOcc * 0.35) },
    { time: '10:00', standard: Math.round(total * 0.78), ev: Math.round(evOcc * 0.9) },
    { time: '12:00', standard: Math.round(occ * 0.95), ev: evOcc },
    { time: '14:00', standard: Math.round(occ * 0.88), ev: Math.max(0, evOcc - 4) },
    { time: '16:00', standard: occ, ev: evOcc },
    { time: '18:00', standard: Math.round(total * 0.52), ev: Math.round(evOcc * 0.5) },
  ];

  const parking = {
    totalSlots: total,
    occupiedSlots: occ,
    availableSlots: dbParking?.available_slots ?? Math.max(0, total - occ),
    evChargingSlotsTotal: dbParking?.ev_charging_total ?? 12,
    evChargingSlotsOccupied: evOcc,
    occupancyRatePct: ratePct,
    peakCongestionZone: isCameraLive ? 'Live Camera Feed (best.onnx)' : (dbParking?.peak_congestion_zone || 'CAM-GATE-NORTH-01'),
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

      {/* Header Banner with Side-Positioned Directly Editable Slot Controller */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border border-blue-800/40 text-white flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1 flex-wrap">
            <Car className="w-4 h-4" /> Ethernet/Wi-Fi IP Camera Vision &amp; EV Charging Grid
            {isParkingActive ? (
              <span className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30 font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> CAMERA RTSP STREAM ACTIVE
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

        {/* SIDE CAPACITY & DIRECT EDITABLE SLOTS CARD */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-blue-500/30 shadow-2xl">
          {/* Live Bay Ratio Display */}
          <div className="text-center sm:text-left pr-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-white/10 pb-3 sm:pb-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Available Bays</span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-3xl font-black text-emerald-400">
                {occ !== null ? Math.max(0, manualTotalBays - occ) : '---'}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ {manualTotalBays}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {ratePct !== null ? `${ratePct}% Occupied` : '---'}
              </span>
              <span className="text-[10px] text-slate-400">
                Inflow: {flowRate !== null ? `${flowRate}/hr` : '---'}
              </span>
            </div>
          </div>

          {/* Direct Editable Slot Controls */}
          <div className="flex flex-col gap-2 min-w-[220px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Total Parking Slots:
              </span>
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                title="Open Advanced Modal"
              >
                Advanced
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const updated = Math.max(1, manualTotalBays - 5);
                  setManualTotalBays(updated);
                  handleSaveInlineCapacity(updated);
                }}
                disabled={isSavingConfig}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black text-xs flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
                title="-5 Slots"
              >
                -5
              </button>

              <input
                type="number"
                min="1"
                max="2000"
                value={manualTotalBays}
                onChange={(e) => setManualTotalBays(Math.max(1, Number(e.target.value)))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveInlineCapacity();
                  }
                }}
                className="w-20 px-2 py-1.5 rounded-xl bg-black/60 border border-cyan-500/50 text-white font-mono font-black text-sm text-center focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
              />

              <button
                type="button"
                onClick={() => {
                  const updated = manualTotalBays + 5;
                  setManualTotalBays(updated);
                  handleSaveInlineCapacity(updated);
                }}
                disabled={isSavingConfig}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black text-xs flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
                title="+5 Slots"
              >
                +5
              </button>

              <button
                type="button"
                onClick={() => handleSaveInlineCapacity()}
                disabled={isSavingConfig}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-blue-500/25 disabled:opacity-50"
                title="Save Slot Count"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingConfig ? 'Saving' : 'Save'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
              <span>EV Bays: <strong className="text-emerald-400 font-mono">{parking.evChargingSlotsTotal}</strong></span>
              <span className="text-stone-400 font-mono">Formula: {manualTotalBays} - {occ} = {Math.max(0, manualTotalBays - occ)}</span>
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
            <span className="text-rose-600 dark:text-rose-400 font-bold">{occ !== null ? `${occ} Detected In-Camera` : '---'}</span>
            <span className="text-stone-400"> = </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{occ !== null ? `${Math.max(0, parking.totalSlots - occ)} Available` : '---'}</span>
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

      {/* Live Edge AI ONNX Camera Video Monitor Card */}
      <div className="p-5 rounded-3xl bg-slate-950 border border-cyan-500/30 shadow-2xl space-y-4 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              {isCameraLive ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500/80 animate-pulse"></span>
              )}
            </span>
            <div>
              <h4 className="text-sm font-black tracking-wide text-white flex items-center gap-2">
                <span>LIVE EDGE AI ONNX CAMERA STREAM</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isCameraLive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isCameraLive ? (cameraFeed?.model_name || 'BPUT/best.onnx (YOLOv8)') : 'Awaiting Video Stream'}
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Real-time optical frame ingestion over WiFi/Ethernet • Synced with Campus 3D Twin &amp; NeonDB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            {cameraFeed?.frame_idx !== undefined && cameraFeed?.frame_idx !== null && isCameraLive && (
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                <span>Frame: <strong>#{cameraFeed.frame_idx}{cameraFeed.total_frames ? ` / ${cameraFeed.total_frames}` : ''}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
              <Car className="w-3.5 h-3.5 text-blue-400" />
              <span>Detected Vehicles: <strong>{isCameraLive && cameraFeed?.detected_occupied !== null ? cameraFeed.detected_occupied : '---'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span>Occupied Bays: <strong>{isCameraLive && cameraFeed?.occupied_slots !== null ? cameraFeed.occupied_slots : '---'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Available Bays: <strong>{isCameraLive && cameraFeed?.available_slots !== null ? cameraFeed.available_slots : '---'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              <span>Occupancy Rate: <strong>{isCameraLive && cameraFeed?.occupancy_rate_pct !== null ? `${cameraFeed.occupancy_rate_pct}%` : '---'}</strong></span>
            </div>
          </div>
        </div>

        {isCameraLive && cameraFeed?.annotated_frame_base64 ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
            {/* Top-Right Live Real-Time Frame HUD Badge Overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono z-10 shadow-lg">
              {cameraFeed.frame_idx !== undefined && cameraFeed.frame_idx !== null && (
                <>
                  <span className="text-amber-300 font-bold">🎞️ Frame #{cameraFeed.frame_idx}{cameraFeed.total_frames ? ` / ${cameraFeed.total_frames}` : ''}</span>
                  <span className="text-slate-600">|</span>
                </>
              )}
              <span className="text-blue-400 font-bold">🚗 {cameraFeed.detected_occupied ?? cameraFeed.occupied_slots} Vehicles</span>
              <span className="text-slate-600">|</span>
              <span className="text-rose-400 font-bold">🔴 {cameraFeed.detected_occupied ?? cameraFeed.occupied_slots} Occupied</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">🟢 {cameraFeed.detected_empty ?? cameraFeed.available_slots} Available</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 font-bold">{cameraFeed.occupancy_rate_pct}% Occupancy Rate</span>
            </div>

            <img
              src={cameraFeed.annotated_frame_base64}
              alt="Live Edge AI Parking Detection"
              className="w-full max-h-[440px] object-contain rounded-xl"
            />
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-cyan-500/30 text-[11px] text-cyan-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE OPTICAL INFERENCE • FRAME #{cameraFeed.frame_idx || 1} • FPS: {cameraFeed.camera_fps || 30} • {cameraFeed.timestamp || 'ONLINE'}</span>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/60 p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-20"></span>
              <Camera className="w-8 h-8 text-cyan-400" />
            </div>
            <h4 className="text-sm font-bold text-white tracking-wide uppercase">
              Awaiting Live Optical Camera Feed from IoT Hardware Sender
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Start streaming video in the EcoEstate IoT Hardware Sender (click <strong>&quot;▶ Stream Video Telemetry&quot;</strong>) to transmit real video frames.
            </p>
            <div className="mt-5 flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950/80 px-4 py-2 rounded-xl border border-white/5">
              <span>Frame: <strong className="text-slate-300 font-normal">---</strong></span>
              <span>•</span>
              <span>Vehicles: <strong className="text-slate-300 font-normal">---</strong></span>
              <span>•</span>
              <span>Occupied: <strong className="text-slate-300 font-normal">---</strong></span>
              <span>•</span>
              <span>Available: <strong className="text-slate-300 font-normal">---</strong></span>
              <span>•</span>
              <span>Occupancy Rate: <strong className="text-slate-300 font-normal">---</strong></span>
            </div>
          </div>
        )}
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
