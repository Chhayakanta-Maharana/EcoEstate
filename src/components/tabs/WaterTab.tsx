'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getWaterData } from '@/data/mockData';
import { DjangoApi } from '@/services/api';
import { Organization } from '@/types';
import {
  Droplets,
  Activity,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  RefreshCw,
  Waves,
  ShieldCheck,
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

interface WaterTabProps {
  org?: Organization;
}

export const WaterTab: React.FC<WaterTabProps> = ({ org }) => {
  const { activeOrg: contextOrg } = useAuth();
  const activeOrg = org || contextOrg;
  const [dbWater, setDbWater] = useState<any>(null);

  useEffect(() => {
    if (!activeOrg?.id) return;
    DjangoApi.getWaterTelemetry(activeOrg.id).then((data) => {
      if (data) setDbWater(data);
    });
  }, [activeOrg?.id]);

  const fallback = getWaterData(activeOrg?.type || 'HOSPITAL');
  const water = {
    dailyConsumptionKL: dbWater?.daily_consumption_kl ?? fallback.dailyConsumptionKL,
    flowRateLps: dbWater?.flow_rate_lps ?? fallback.flowRateLps,
    undergroundTankLevelPct: dbWater?.underground_tank_level_pct ?? fallback.undergroundTankLevelPct,
    overheadTankLevelPct: dbWater?.overhead_tank_level_pct ?? fallback.overheadTankLevelPct,
    stpRecycleRatePct: dbWater?.stp_recycle_rate_pct ?? fallback.stpRecycleRatePct,
    stpTreatedWaterKL: dbWater?.stp_treated_water_kl ?? fallback.stpTreatedWaterKL,
    phLevel: dbWater?.ph_level ?? fallback.phLevel,
    turbidityNtu: dbWater?.turbidity_ntu ?? fallback.turbidityNtu,
    leakAlertCount: dbWater?.leak_alert_count ?? fallback.leakAlertCount,
    trend7Days: fallback.trend7Days,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 border border-cyan-800/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <Droplets className="w-4 h-4" /> Smart Water Metering & Circular STP Recycling
          </div>
          <h1 className="text-2xl font-extrabold">Water Intelligence & Zero Liquid Discharge</h1>
          <p className="text-xs text-slate-300 mt-1">
            Live acoustic flowmeters, level transducers, and water quality telemetry across {activeOrg?.name}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">STP Recycle Rate</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-extrabold text-cyan-400">{water.stpRecycleRatePct}%</span>
            </div>
          </div>
          <div className="border-l border-white/10 pl-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Circular Loop Active
            </span>
            <p className="text-[10px] text-slate-400 mt-1">{water.stpTreatedWaterKL} kL Reused / day</p>
          </div>
        </div>
      </div>

      {/* KPI Cards & Tank Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Underground Sump</span>
            <Waves className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 dark:text-white">{water.undergroundTankLevelPct}%</span>
            <span className="text-xs text-emerald-500 font-semibold">Optimal</span>
          </div>
          <div className="w-full h-3 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${water.undergroundTankLevelPct}%` }}
            />
          </div>
          <p className="text-[11px] text-stone-400 dark:text-slate-500">Capacity: 500,000 Liters</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Overhead Tank</span>
            <Waves className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 dark:text-white">{water.overheadTankLevelPct}%</span>
            <span className="text-xs text-emerald-500 font-semibold">Auto-Pumping</span>
          </div>
          <div className="w-full h-3 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${water.overheadTankLevelPct}%` }}
            />
          </div>
          <p className="text-[11px] text-stone-400 dark:text-slate-500">Capacity: 150,000 Liters</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Water Quality Parameters</span>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722]">
              <span className="text-[10px] text-stone-500 dark:text-slate-400 block">pH Level</span>
              <span className="text-base font-bold text-emerald-500">{water.phLevel}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722]">
              <span className="text-[10px] text-stone-500 dark:text-slate-400 block">Turbidity</span>
              <span className="text-base font-bold text-cyan-500">{water.turbidityNtu} NTU</span>
            </div>
          </div>
          <p className="text-[10px] text-stone-400 dark:text-slate-500">BIS 10500 Potable Standard Pass</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Smart Leak Sensor Grid</span>
          <div className="pt-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold text-stone-900 dark:text-white">
              {water.leakAlertCount === 0 ? 'Zero Pipeline Leaks' : `${water.leakAlertCount} Pipe Alert`}
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Acoustic wave IoT sensors active across all main distribution lines.
          </p>
        </div>
      </div>

      {/* 7-Day Freshwater vs STP Recycled Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-stone-900 dark:text-white">
              7-Day Water Balance: Municipal Freshwater vs STP Recycled (kL)
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Recycled water redirected for cooling towers, flush systems, and horticulture.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={water.trend7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} unit=" kL" />
              <Tooltip
                contentStyle={{ backgroundColor: '#07080e', borderRadius: '12px', border: '1px solid #151722', color: '#ffffff' }}
                itemStyle={{ color: '#ffffff', fontWeight: 700 }}
                labelStyle={{ color: '#38bdf8', fontWeight: 700 }}
              />
              <Legend />
              <Bar dataKey="freshWater" name="Freshwater Intake (kL)" fill="#0284c7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="recycledWater" name="STP Treated Water (kL)" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WaterTab;
