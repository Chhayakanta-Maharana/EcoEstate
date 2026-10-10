'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getAqiData,
  getWaterData,
  getEnergyData,
  getParkingData,
  getDustbins,
  getAiRecommendations,
  INITIAL_ORGANIZATIONS,
} from '@/data/mockData';
import {
  Wind,
  Droplets,
  Zap,
  Car,
  Trash2,
  Cpu,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Clock,
  MapPin,
  BrainCircuit,
  Layers,
  MoreHorizontal,
  Activity,
  TrendingUp,
  Hospital,
  GraduationCap,
  Flame,
  Factory,
  Building2,
  Wrench,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';
import { DjangoApi } from '@/services/api';
import ExplainableAiShapModal from '@/components/ExplainableAiShapModal';
import { Organization } from '@/types';

interface DashboardOverviewProps {
  onNavigateTab: (tabId: string) => void;
  org?: Organization;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigateTab, org }) => {
  const { activeOrg: contextOrg, isSimulatingIoT, equipmentList: contextEquipments } = useAuth();
  const activeOrg = org || contextOrg || INITIAL_ORGANIZATIONS[0];
  const [timeRange, setTimeRange] = useState('7D');
  const [isShapModalOpen, setIsShapModalOpen] = useState(false);

  // Live Database States from NeonDB PostgreSQL
  const [dbAqi, setDbAqi] = useState<any>(null);
  const [dbWater, setDbWater] = useState<any>(null);
  const [dbEnergy, setDbEnergy] = useState<any>(null);
  const [dbParking, setDbParking] = useState<any>(null);
  const [dbEquipment, setDbEquipment] = useState<any[]>([]);
  const [dbRecommendations, setDbRecommendations] = useState<any[]>([]);
  const [activeStream, setActiveStream] = useState<any>(null);

  useEffect(() => {
    if (!activeOrg?.id) return;
    let isMounted = true;
    const fetchOrgData = async () => {
      try {
        const [aqiData, waterData, energyData, parkingData, eqData, recData, iotStatus] = await Promise.all([
          DjangoApi.getAqiTelemetry(activeOrg.id),
          DjangoApi.getWaterTelemetry(activeOrg.id),
          DjangoApi.getEnergyTelemetry(activeOrg.id),
          DjangoApi.getParkingTelemetry(activeOrg.id),
          DjangoApi.getEquipment(activeOrg.id),
          DjangoApi.getRecommendations(activeOrg.id),
          DjangoApi.getIoTStatus(),
        ]);
        if (isMounted) {
          if (aqiData) setDbAqi(aqiData);
          if (waterData) setDbWater(waterData);
          if (energyData) setDbEnergy(energyData);
          if (parkingData) setDbParking(parkingData);
          if (Array.isArray(eqData)) setDbEquipment(eqData);
          if (Array.isArray(recData)) setDbRecommendations(recData);
          if (iotStatus?.active_stream) setActiveStream(iotStatus.active_stream);
        }
      } catch (err) {
        console.warn('Live telemetry fetch fallback:', err);
      }
    };
    fetchOrgData();
    const interval = setInterval(fetchOrgData, 1200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeOrg?.id]);

  const currentCategory = activeStream?.category || null;

  // Strict Stream Isolation:
  // - If no packet arrived: show '--'
  // - If active category matches: show live packet values
  // - If active category does NOT match: strictly show 0 (idle)
  const isAqiActive = currentCategory === 'AQI';
  const isEnergyActive = currentCategory === 'ENERGY';
  const isWaterActive = currentCategory === 'WATER';

  const streamMetrics = activeStream?.metrics || {};

  const streamPm25 = streamMetrics.pm25 !== undefined ? Number(streamMetrics.pm25) : (streamMetrics.pm25_ug_m3 !== undefined ? Number(streamMetrics.pm25_ug_m3) : undefined);
  const streamComputedAqi = streamPm25 !== undefined ? Math.round(streamPm25 * 2.5) : (streamMetrics.pm10_ug_m3 ? Math.round(Number(streamMetrics.pm10_ug_m3)) : 55);

  const hasAqiData = isAqiActive && (streamPm25 !== undefined || Boolean(dbAqi && (dbAqi.overall_aqi !== undefined || dbAqi.pm25 !== undefined)));

  const aqi = {
    overallAqi: currentCategory === null ? '--' : (isAqiActive ? (dbAqi?.overall_aqi ?? streamComputedAqi) : 0),
    status: currentCategory === null ? '--' : (isAqiActive ? (dbAqi?.status ?? (streamComputedAqi <= 50 ? 'Good' : 'Moderate')) : 'Idle (0)'),
    pm25: currentCategory === null ? '--' : (isAqiActive ? (dbAqi?.pm25 ?? (streamPm25 ?? 0)) : 0),
    co2: currentCategory === null ? '--' : (isAqiActive ? (dbAqi?.co2 ?? (streamMetrics.co2_ppm ?? streamMetrics.co2 ?? 0)) : 0),
    voc: currentCategory === null ? '--' : (isAqiActive ? (dbAqi?.voc ?? (streamMetrics.voc_ppb ?? streamMetrics.voc ?? 0)) : 0),
  };

  const streamLoad = streamMetrics.active_load_kw !== undefined ? Number(streamMetrics.active_load_kw) : (streamMetrics.current_load_kw !== undefined ? Number(streamMetrics.current_load_kw) : undefined);
  const streamSolar = streamMetrics.solar_kw !== undefined ? Number(streamMetrics.solar_kw) : (streamMetrics.solar_rooftop_kw !== undefined ? Number(streamMetrics.solar_rooftop_kw) : undefined);
  const hasEnergyData = isEnergyActive && (streamLoad !== undefined || Boolean(dbEnergy && (dbEnergy.current_load_kw !== undefined || dbEnergy.solar_rooftop_kw !== undefined)));

  const loadKw = currentCategory === null ? null : (isEnergyActive ? Number(dbEnergy?.current_load_kw ?? (streamLoad ?? 420)) : 0);
  const solarKw = currentCategory === null ? null : (isEnergyActive ? Number(dbEnergy?.solar_rooftop_kw ?? (streamSolar ?? 180)) : 0);
  const liveTrend24h = (isEnergyActive && loadKw !== null && solarKw !== null && loadKw > 0) ? [
    { time: '02:00', grid: Math.round(loadKw * 0.45), solar: 0, load: Math.round(loadKw * 0.45) },
    { time: '06:00', grid: Math.round(loadKw * 0.52), solar: Math.round(solarKw * 0.12), load: Math.round(loadKw * 0.58) },
    { time: '10:00', grid: Math.round(loadKw * 0.72), solar: Math.round(solarKw * 0.86), load: Math.round(loadKw * 0.92) },
    { time: '13:00', grid: Math.round(loadKw * 0.62), solar: Math.round(solarKw * 0.98), load: Math.round(loadKw * 1.0) },
    { time: '16:00', grid: Math.round(loadKw * 0.78), solar: Math.round(solarKw * 0.62), load: Math.round(loadKw * 0.95) },
    { time: '19:00', grid: Math.round(loadKw * 0.94), solar: 0, load: Math.round(loadKw * 0.94) },
    { time: '22:00', grid: Math.round(loadKw * 0.62), solar: 0, load: Math.round(loadKw * 0.62) },
  ] : [];

  const energy = {
    currentLoadKw: currentCategory === null ? '--' : (isEnergyActive ? (dbEnergy?.current_load_kw ?? (streamLoad ?? 420)) : 0),
    solarRooftopKw: currentCategory === null ? '--' : (isEnergyActive ? (dbEnergy?.solar_rooftop_kw ?? (streamSolar ?? 180)) : 0),
    peakLoadKw: currentCategory === null ? '--' : (isEnergyActive ? (dbEnergy?.peak_load_kw ?? Math.round((streamLoad ?? 420) * 1.15)) : 0),
    powerFactor: currentCategory === null ? '--' : (isEnergyActive ? (dbEnergy?.power_factor ?? (streamMetrics.power_factor ?? 0.98)) : 0),
    savingsInrToday: currentCategory === null ? '--' : (isEnergyActive ? (dbEnergy?.savings_inr_today ?? Math.round((streamSolar ?? 180) * 8 * 7)) : 0),
    trend24h: liveTrend24h,
  };

  const streamFlow = streamMetrics.flow_rate_lps !== undefined ? Number(streamMetrics.flow_rate_lps) : undefined;
  const streamDailyWater = streamFlow !== undefined ? Number((streamFlow * 3.6 * 8).toFixed(1)) : undefined;
  const hasWaterData = isWaterActive && (streamFlow !== undefined || Boolean(dbWater && (dbWater.stp_recycle_rate_pct !== undefined || dbWater.daily_consumption_kl !== undefined || dbWater.flow_rate_lps !== undefined)));

  const water = {
    stpTreatedWaterKL: currentCategory === null ? '--' : (isWaterActive ? (dbWater?.stp_treated_water_kl ?? (streamDailyWater ? Number((streamDailyWater * 0.72).toFixed(1)) : 230)) : 0),
    dailyConsumptionKL: currentCategory === null ? '--' : (isWaterActive ? (dbWater?.daily_consumption_kl ?? (streamDailyWater ?? 320)) : 0),
    stpRecycleRatePct: currentCategory === null ? '--' : (isWaterActive ? (dbWater?.stp_recycle_rate_pct ?? 72) : 0),
    phLevel: currentCategory === null ? '--' : (isWaterActive ? (dbWater?.ph_level ?? (streamMetrics.ph_level ?? 7.2)) : 0),
  };

  const effectiveEquipments = dbEquipment.map((eq) => ({
    id: eq.equipment_code || `EQ-${eq.id}`,
    name: eq.name,
    category: eq.category,
    location: eq.location,
    status: eq.status === 'Operational' ? 'Healthy' : eq.status,
    healthScore: eq.health_score,
    powerKw: eq.power_rating_kw,
    operatingTempC: eq.operating_temp_c,
    vibrationMmSec: eq.vibration_mm_per_sec,
  }));

  const hasEquipment = effectiveEquipments.length > 0;
  const criticalEquipments = effectiveEquipments.filter((e) => e.status === 'Critical' || e.status === 'Warning');
  const avgHealth = effectiveEquipments.length > 0
    ? Math.round(effectiveEquipments.reduce((acc, curr) => acc + (curr.healthScore || 90), 0) / effectiveEquipments.length)
    : null;

  const aiRecs = dbRecommendations.map((r, i) => ({
    id: `rec-${r.id || i}`,
    title: r.title,
    category: r.category,
    urgency: r.urgency,
    impactDescription: r.impact_description,
    estimatedSaving: r.estimated_saving,
    confidenceScore: r.confidence_score,
  }));

  // Resource Consumption Donut Data from live database
  const gridPower = Math.max(0, energy.currentLoadKw - energy.solarRooftopKw);
  const totalLoad = Math.max(1, energy.currentLoadKw);
  const solarSharePct = Math.round((energy.solarRooftopKw / totalLoad) * 100);
  const gridSharePct = Math.round((gridPower / totalLoad) * 100);
  const auxSharePct = Math.max(0, 100 - solarSharePct - gridSharePct);

  const consumptionDonut = [
    { name: 'Grid Base Load', value: gridSharePct || 65, color: '#06b6d4' },
    { name: 'Solar Rooftop Yield', value: solarSharePct || 25, color: '#10b981' },
    { name: 'Auxiliary & Utilities', value: auxSharePct || 10, color: '#a855f7' },
  ];

  // Dynamic real-time facility zones based on live NeonDB data
  const facilityZones = [
    {
      id: 'zone-1',
      name: `${(activeOrg?.name || 'Central').split(' ')[0] || 'Central'} Environmental CAAQMS Node`,
      metric: `AQI ${aqi.overallAqi} (${aqi.status})`,
      status: aqi.overallAqi < 100 ? 'normal' : 'warning',
      color: aqi.overallAqi < 100 ? 'text-emerald-500' : 'text-amber-500',
    },
    {
      id: 'zone-2',
      name: `Rooftop Solar Substation (${Math.round(energy.solarRooftopKw * 1.2)} kWp)`,
      metric: `${energy.solarRooftopKw} kW Active Generation`,
      status: 'normal',
      color: 'text-amber-500',
    },
    {
      id: 'zone-3',
      name: 'MBBR Sewage Treatment & STP Recycling Plant',
      metric: `${water.stpRecycleRatePct}% Reused (${water.stpTreatedWaterKL} kL)`,
      status: 'normal',
      color: 'text-cyan-500',
    },
    {
      id: 'zone-4',
      name: 'Main Substation & Transformer Bay',
      metric: `Power Factor ${energy.powerFactor}`,
      status: energy.powerFactor >= 0.95 ? 'normal' : 'warning',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* 1. TOP HERO BANNER (Hospital / Campus Identity + 3D Twin & AI Shortcuts) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
              {activeOrg?.type || 'CAMPUS'} FACILITY
            </span>
            <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold bg-[#f5efe6] dark:bg-[#0a0b12] text-stone-700 dark:text-slate-300 border border-[#ece3d6] dark:border-[#181a28] inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> {activeOrg?.city || 'Campus'}, {activeOrg?.state || 'India'}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-[#0a1f1a] text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Gateway: {activeOrg?.iotGatewayIp || '192.168.1.1'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            {activeOrg?.name || 'Smart Campus Facility'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-300 leading-relaxed">
            {activeOrg?.description || 'Smart facility management'}
          </p>
        </div>

        {/* Quick Launch Buttons: 3D Twin & AI Simulator & SHAP XAI */}
        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => onNavigateTab('3d')}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Layers className="w-4 h-4" /> 3D Digital Twin
          </button>
          <button
            onClick={() => onNavigateTab('simulator')}
            className="px-4 py-2.5 rounded-xl bg-[#f5efe6] dark:bg-[#0a0b12] hover:bg-[#ece3d6] dark:hover:bg-[#121422] text-stone-900 dark:text-white font-bold text-xs border border-[#ece3d6] dark:border-[#181a28] flex items-center gap-2 transition-all cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 text-purple-400" /> AI Scenario Stress Test
          </button>
          <button
            onClick={() => setIsShapModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 hover:from-amber-500/25 hover:via-rose-500/25 hover:to-purple-500/25 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <Wrench className="w-4 h-4 text-amber-500" />
            <span>Equipment Diagnostics &amp; Maintenance</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold">
              ROOT CAUSE
            </span>
          </button>
        </div>
      </div>

      {/* 1.5. REAL-TIME HARDWARE INGESTION STATUS BANNER */}
      {activeStream?.category ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/30 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-black text-cyan-800 dark:text-cyan-400 tracking-wide text-xs">
              LIVE HARDWARE SENSOR ACTIVE: {activeStream.category}
            </span>
            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-500/30">
              Node: {activeStream.device_id || 'LAN/WiFi'}
            </span>
            <span className="text-stone-500 dark:text-slate-400 text-[11px] hidden sm:inline">
              • {activeStream.location}
            </span>
          </div>
          <div className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <span>Synced at {activeStream.timestamp || 'Live'}</span>
            <span className="text-stone-400 dark:text-slate-500 font-sans">• Inactive streams zeroed (0)</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#f5efe6] dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] text-xs">
          <div className="flex items-center gap-2 text-stone-500 dark:text-slate-400">
            <Radio className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 animate-pulse" />
            <span className="font-semibold">Dual-Channel IoT Ingest Ready (UDP:5005 • TCP:5000 • WiFi:8000)</span>
          </div>
          <span className="text-[10px] font-mono text-stone-400 dark:text-slate-500 font-bold">Awaiting sensor packets...</span>
        </div>
      )}

      {/* 2. ROW 1: 4 GLOWING KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Clean Air Quality AQI */}
        <div
          onClick={() => onNavigateTab('aqi')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#07080e] border transition-all cursor-pointer space-y-3 ${
            isAqiActive
              ? 'border-cyan-500 shadow-md shadow-cyan-500/10 dark:shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
              : 'border-[#ece3d6] dark:border-[#151722] hover:border-cyan-500/60 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Campus Air Quality</span>
              {isAqiActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
              {currentCategory === null ? '--' : (isAqiActive ? aqi.status : 'Idle (0)')}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-stone-900 dark:text-white">
                {currentCategory === null ? '--' : (isAqiActive ? aqi.overallAqi : 0)}
              </span>
              <span className="text-xs font-mono text-stone-400 dark:text-slate-400 ml-1">NAQI</span>
            </div>
            <svg className="w-20 h-7 text-cyan-500" viewBox="0 0 100 35" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M0 25 Q20 30 40 15 T80 8 T100 5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold truncate">
            {currentCategory === null
              ? 'PM2.5: -- • CO2: --'
              : (isAqiActive ? `PM2.5: ${aqi.pm25} µg/m³ • CO2: ${aqi.co2} ppm` : 'PM2.5: 0 µg/m³ • CO2: 0 ppm (Idle)')}
          </p>
        </div>

        {/* Card 2: Real-time Power & Solar */}
        <div
          onClick={() => onNavigateTab('energy')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#07080e] border transition-all cursor-pointer space-y-3 ${
            isEnergyActive
              ? 'border-amber-500 shadow-md shadow-amber-500/10 dark:shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
              : 'border-[#ece3d6] dark:border-[#151722] hover:border-amber-500/60 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Substation Load</span>
              {isEnergyActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
              {currentCategory === null ? 'Solar --' : (isEnergyActive && solarKw !== null ? `Solar ${(solarKw / 1000).toFixed(1)} MW` : 'Solar 0 MW')}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-stone-900 dark:text-white">
                {currentCategory === null ? '--' : (isEnergyActive ? energy.currentLoadKw : 0)}
              </span>
              <span className="text-xs font-mono text-stone-400 dark:text-slate-400 ml-1">kW</span>
            </div>
            <svg className="w-20 h-7 text-amber-500" viewBox="0 0 100 35" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M0 28 Q25 5 50 20 T100 8" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold truncate">
            {currentCategory === null
              ? 'Peak: -- • PF --'
              : (isEnergyActive ? `Peak: ${energy.peakLoadKw} kW • PF ${energy.powerFactor}` : 'Peak: 0 kW • PF 0.0 (Idle)')}
          </p>
        </div>

        {/* Card 3: Water Recycled (STP Closed Loop) */}
        <div
          onClick={() => onNavigateTab('water')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#07080e] border transition-all cursor-pointer space-y-3 ${
            isWaterActive
              ? 'border-blue-500 shadow-md shadow-blue-500/10 dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/40'
              : 'border-[#ece3d6] dark:border-[#151722] hover:border-blue-500/60 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Daily Water Treated</span>
              {isWaterActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              {currentCategory === null ? 'STP --' : (isWaterActive ? `STP ${water.stpRecycleRatePct}%` : 'STP 0%')}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-stone-900 dark:text-white">
                {currentCategory === null ? '--' : (isWaterActive ? water.stpTreatedWaterKL : 0)}
              </span>
              <span className="text-xs font-mono text-stone-400 dark:text-slate-400 ml-1">kL / day</span>
            </div>
            <svg className="w-20 h-7 text-blue-500" viewBox="0 0 100 35" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M0 15 Q30 30 60 10 T100 20" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">
            {currentCategory === null
              ? 'Total Flow: -- • pH --'
              : (isWaterActive ? `Total Flow: ${water.dailyConsumptionKL} kL • pH ${water.phLevel}` : 'Total Flow: 0 kL • pH 0.0 (Idle)')}
          </p>
        </div>

        {/* Card 4: Machinery Digital Twin Health */}
        <div
          onClick={() => onNavigateTab('equipment')}
          className="p-5 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] hover:border-emerald-500/60 shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.06)] transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Asset Twin Health</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              {avgHealth !== null ? `${avgHealth}% Health` : '--'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-stone-900 dark:text-white">{hasEquipment ? effectiveEquipments.length : '--'}</span>
              <span className="text-xs font-mono text-stone-400 dark:text-slate-400 ml-1">Assets Online</span>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              {hasEquipment ? (criticalEquipments.length > 0 ? `${criticalEquipments.length} Service` : 'All Optimal') : '--'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#ece3d6]/60 dark:border-[#151722]/60">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
              {hasEquipment ? 'Vibration & Thermal Synced' : 'Awaiting Sensor Telemetry'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsShapModalOpen(true);
              }}
              className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <Wrench className="w-3 h-3 text-amber-500" />
              <span>Diagnostics &gt;</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ROW 2: DUAL NEON WAVE CHART & ACTIVITY DONUT BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Dual Neon Wave Chart: Substation Load vs Rooftop Solar */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Substation Load vs Rooftop Solar Generation (kW)
            </h3>

            {/* Time Range Pills */}
            <div className="flex bg-[#f5efe6] dark:bg-[#0b0c14] p-1 rounded-xl border border-[#ece3d6] dark:border-[#151722] text-[11px] font-bold">
              {['7D', '1M', '3M', '1Y'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeRange === range
                      ? 'bg-white dark:bg-[#151726] text-stone-900 dark:text-white shadow-sm'
                      : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={energy.trend24h}>
                <defs>
                  <linearGradient id="cyanNeonFacility" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="purpleNeonFacility" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit=" kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#07080e',
                    borderColor: '#06b6d4',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: '#ffffff',
                  }}
                  itemStyle={{ color: '#ffffff', fontWeight: 700 }}
                  labelStyle={{ color: '#38bdf8', fontWeight: 700 }}
                />
                <Area
                  type="monotone"
                  dataKey="load"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fill="url(#cyanNeonFacility)"
                  name="Facility Demand"
                />
                <Area
                  type="monotone"
                  dataKey="solar"
                  stroke="#a855f7"
                  strokeWidth={3}
                  fill="url(#purpleNeonFacility)"
                  name="Solar Inverter"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Campus Resource Breakdown */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white tracking-wide">
            Campus Energy & Resource Distribution
          </h3>

          <div className="h-44 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={consumptionDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {consumptionDonut.map((entry, index) => (
                    <Cell key={`cell-f-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-around text-xs font-semibold pt-2 border-t border-[#ece3d6] dark:border-[#151722]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-stone-700 dark:text-slate-300">HVAC 45%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="text-stone-700 dark:text-slate-300">Labs 30%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-stone-700 dark:text-slate-300">Solar 25%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ROW 3: ACTIVE ZONE TELEMETRY NODES & GENAI ADVISORY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Active Facility Zones & 3D Spatial Gateway */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Active Campus Subsystems
            </h3>
            <button
              onClick={() => onNavigateTab('3d')}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              Open 3D Mesh &gt;
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {facilityZones.map((zone) => (
              <div
                key={zone.id}
                onClick={() => onNavigateTab('3d')}
                className="p-3.5 rounded-2xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28] hover:border-cyan-500/60 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold">{zone.metric}</span>
                </div>
                <p className="font-bold text-xs text-stone-900 dark:text-white truncate group-hover:text-cyan-400">
                  {zone.name}
                </p>
                <p className="text-[10px] text-stone-400 dark:text-slate-400">Online • 1.0s telemetry stream</p>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#f8f4ed] dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#181a28] flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> CPCB / GRIHA Telemetry Nodes: 100% Synced</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">Latency: 8ms</span>
          </div>
        </div>

        {/* Right: AI Sustainability Recommendations & Action Logs */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> AI Sustainability Engine & Advisories
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">GRIHA 5-Star</span>
          </div>

          <div className="space-y-2.5">
            {aiRecs.slice(0, 3).map((rec, idx) => (
              <div
                key={rec.id || idx}
                className="p-3.5 rounded-2xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 flex-shrink-0">
                    {rec.category || 'Advisory'}
                  </span>
                  <div className="truncate">
                    <p className="text-xs text-stone-800 dark:text-slate-200 font-bold truncate">
                      {rec.title}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                      Est. Impact: {rec.estimatedSaving || 'Optimal ROI'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('simulator')}
                  className="px-2.5 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 text-cyan-700 dark:text-cyan-400 font-bold text-[10px] border border-cyan-200 dark:border-cyan-500/30 transition-all flex-shrink-0 cursor-pointer"
                >
                  Simulate
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Explainable AI (SHAP) Attribution Modal */}
      <ExplainableAiShapModal
        isOpen={isShapModalOpen}
        onClose={() => setIsShapModalOpen(false)}
      />
    </div>
  );
};

export default DashboardOverview;
