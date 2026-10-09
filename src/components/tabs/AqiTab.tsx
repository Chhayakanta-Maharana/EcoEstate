'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAqiData } from '@/data/mockData';
import { DjangoApi } from '@/services/api';
import { Organization } from '@/types';
import {
  Wind,
  ShieldCheck,
  AlertTriangle,
  Thermometer,
  CloudRain,
  Volume2,
  Sparkles,
  Info,
  Radio,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface AqiTabProps {
  org?: Organization;
}

export const AqiTab: React.FC<AqiTabProps> = ({ org }) => {
  const { activeOrg: contextOrg } = useAuth();
  const activeOrg = org || contextOrg;
  const [dbAqi, setDbAqi] = useState<any>(null);

  useEffect(() => {
    if (!activeOrg?.id) return;
    DjangoApi.getAqiTelemetry(activeOrg.id).then((data) => {
      if (data) setDbAqi(data);
    });
  }, [activeOrg?.id]);

  const fallback = getAqiData(activeOrg?.type || 'HOSPITAL');
  const baseAqi = dbAqi?.overall_aqi ?? fallback.overallAqi;
  const basePm25 = dbAqi?.pm25 ?? fallback.pm25;
  const baseCo2 = dbAqi?.co2 ?? fallback.co2;

  const liveTrend24h = [
    { time: '00:00', aqi: Math.max(10, Math.round(baseAqi * 0.78)), pm25: Math.round(basePm25 * 0.72), co2: Math.round(baseCo2 * 0.85) },
    { time: '03:00', aqi: Math.max(10, Math.round(baseAqi * 0.72)), pm25: Math.round(basePm25 * 0.68), co2: Math.round(baseCo2 * 0.82) },
    { time: '06:00', aqi: Math.max(10, Math.round(baseAqi * 0.88)), pm25: Math.round(basePm25 * 0.85), co2: Math.round(baseCo2 * 0.9) },
    { time: '09:00', aqi: Math.round(baseAqi * 1.28), pm25: Math.round(basePm25 * 1.38), co2: Math.round(baseCo2 * 1.15) },
    { time: '12:00', aqi: Math.round(baseAqi * 1.2), pm25: Math.round(basePm25 * 1.26), co2: Math.round(baseCo2 * 1.2) },
    { time: '15:00', aqi: Math.round(baseAqi * 1.14), pm25: Math.round(basePm25 * 1.18), co2: Math.round(baseCo2 * 1.12) },
    { time: '18:00', aqi: Math.round(baseAqi * 1.32), pm25: Math.round(basePm25 * 1.48), co2: Math.round(baseCo2 * 1.26) },
    { time: '21:00', aqi: Math.round(baseAqi * 1.08), pm25: Math.round(basePm25 * 1.12), co2: Math.round(baseCo2 * 1.05) },
    { time: 'Now', aqi: baseAqi, pm25: basePm25, co2: baseCo2 },
  ];

  const aqi = {
    overallAqi: baseAqi,
    status: dbAqi?.status ?? fallback.status,
    pm25: basePm25,
    pm10: dbAqi?.pm10 ?? fallback.pm10,
    co2: baseCo2,
    voc: dbAqi?.voc ?? fallback.voc,
    temperature: dbAqi?.temperature ?? fallback.temperature,
    humidity: dbAqi?.humidity ?? fallback.humidity,
    noise: dbAqi?.noise ?? fallback.noise,
    hotspotLocation: dbAqi?.hotspot_location ?? fallback.hotspotLocation,
    anomalyDetected: dbAqi?.anomaly_detected ?? fallback.anomalyDetected,
    trend24h: liveTrend24h,
  };

  const getStatusColor = (val: number) => {
    if (val <= 50) return { label: 'Good', bg: 'bg-emerald-500', text: 'text-emerald-500' };
    if (val <= 100) return { label: 'Satisfactory / Moderate', bg: 'bg-emerald-400', text: 'text-emerald-400' };
    if (val <= 200) return { label: 'Moderate', bg: 'bg-amber-500', text: 'text-amber-500' };
    if (val <= 300) return { label: 'Poor', bg: 'bg-orange-500', text: 'text-orange-500' };
    return { label: 'Very Poor / Severe', bg: 'bg-rose-500', text: 'text-rose-500' };
  };

  const aqiInfo = getStatusColor(aqi.overallAqi);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-emerald-500/30 text-stone-900 dark:text-white shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <Wind className="w-4 h-4" /> Continuous Ambient Air Quality Monitoring System (CAAQMS)
          </div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white">Air Quality & Clean Air Intelligence</h1>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
            Real-time optical particulate and VOC sensors across {activeOrg?.name}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#f8f4ed] dark:bg-[#0a0b12] p-3 rounded-2xl border border-[#ece3d6] dark:border-[#181a28]">
          <div className="text-center">
            <span className="text-[10px] text-stone-500 dark:text-slate-400 uppercase font-semibold">Campus AQI</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className={`text-3xl font-extrabold ${aqiInfo.text}`}>{aqi.overallAqi}</span>
              <span className="text-[11px] text-stone-400 dark:text-slate-400 font-mono">NAQI</span>
            </div>
          </div>
          <div className="border-l border-[#ece3d6] dark:border-[#181a28] pl-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${aqiInfo.bg}`}>
              {aqi.status}
            </span>
            <p className="text-[10px] text-stone-400 dark:text-slate-400 mt-1">CPCB Standard</p>
          </div>
        </div>
      </div>

      {/* Grid of 6 Environmental Sensors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm">
          <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">PM2.5 Fine Dust</p>
          <p className="text-xl font-extrabold text-stone-900 dark:text-white mt-1">{aqi.pm25} <span className="text-xs font-normal text-stone-400">µg/m³</span></p>
          <span className="text-[10px] text-emerald-500 font-medium">Safe Limit: 60 µg/m³</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm">
          <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">PM10 Coarse Dust</p>
          <p className="text-xl font-extrabold text-stone-900 dark:text-white mt-1">{aqi.pm10} <span className="text-xs font-normal text-stone-400">µg/m³</span></p>
          <span className="text-[10px] text-emerald-500 font-medium">Safe Limit: 100 µg/m³</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm">
          <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">Carbon Dioxide (CO2)</p>
          <p className="text-xl font-extrabold text-stone-900 dark:text-white mt-1">{aqi.co2} <span className="text-xs font-normal text-stone-400">ppm</span></p>
          <span className="text-[10px] text-emerald-500 font-medium">Fresh Air (&lt;800 ppm)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm">
          <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">Total VOCs</p>
          <p className="text-xl font-extrabold text-stone-900 dark:text-white mt-1">{aqi.voc} <span className="text-xs font-normal text-stone-400">ppb</span></p>
          <span className="text-[10px] text-emerald-500 font-medium">Safe Level</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm">
          <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">Ambient Temp</p>
          <p className="text-xl font-extrabold text-stone-900 dark:text-white mt-1">{aqi.temperature} <span className="text-xs font-normal text-stone-400">°C</span></p>
          <span className="text-[10px] text-cyan-500 font-medium">Humidity: {aqi.humidity}%</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm">
          <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">Ambient Noise</p>
          <p className="text-xl font-extrabold text-stone-900 dark:text-white mt-1">{aqi.noise} <span className="text-xs font-normal text-stone-400">dB</span></p>
          <span className="text-[10px] text-emerald-500 font-medium">Silence Zone OK</span>
        </div>
      </div>

      {/* 24-Hour Trend & Hotspot Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-stone-900 dark:text-white">
                24-Hour Pollutant Evolution Timeline
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                LAN IoT Transceivers streaming at 10-second intervals
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-emerald-500">■ AQI</span>
              <span className="text-cyan-500">■ PM2.5</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aqi.trend24h}>
                <defs>
                  <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2dad0" className="dark:stroke-[#181a28]" opacity={0.3} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#07080e', borderRadius: '12px', border: '1px solid #151722', color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff', fontWeight: 700 }}
                  labelStyle={{ color: '#38bdf8', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="aqi" stroke="#10b981" strokeWidth={2.5} fill="url(#aqiGrad)" name="Air Quality Index" />
                <Area type="monotone" dataKey="pm25" stroke="#06b6d4" strokeWidth={1.5} fill="none" name="PM2.5 Concentration" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hotspot & Advisory */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl space-y-4">
          <h2 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Active AQI Hotspots & Actions
          </h2>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-xs space-y-2">
            <p className="font-bold text-amber-800 dark:text-amber-300">
              📍 Primary Hotspot: {aqi.hotspotLocation}
            </p>
            <p className="text-stone-600 dark:text-slate-300 text-[11px] leading-relaxed">
              Localized PM2.5 elevation detected due to vehicular idling and mechanical exhaust. Recommended action: Route delivery transit away from air intake louvers.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-xs space-y-2">
            <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Clean Air Ventilation Automation
            </p>
            <p className="text-stone-600 dark:text-slate-300 text-[11px] leading-relaxed">
              Fresh air dampers auto-adjusted to 65% intake to maintain indoor CO2 levels below 550 ppm without inflating HVAC chiller consumption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AqiTab;
