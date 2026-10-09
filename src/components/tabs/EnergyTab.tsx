'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEnergyData } from '@/data/mockData';
import { DjangoApi } from '@/services/api';
import { Organization } from '@/types';
import {
  Zap,
  SunMedium,
  TrendingDown,
  Activity,
  IndianRupee,
  Leaf,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface EnergyTabProps {
  org?: Organization;
}

export const EnergyTab: React.FC<EnergyTabProps> = ({ org }) => {
  const { activeOrg: contextOrg } = useAuth();
  const activeOrg = org || contextOrg;
  const [dbEnergy, setDbEnergy] = useState<any>(null);

  useEffect(() => {
    if (!activeOrg?.id) return;
    DjangoApi.getEnergyTelemetry(activeOrg.id).then((data) => {
      if (data) setDbEnergy(data);
    });
  }, [activeOrg?.id]);

  const fallback = getEnergyData(activeOrg?.type || 'HOSPITAL');
  const energy = {
    currentLoadKw: dbEnergy?.current_load_kw ?? fallback.currentLoadKw,
    dailyTotalKwh: dbEnergy?.daily_total_kwh ?? fallback.dailyTotalKwh,
    peakLoadKw: dbEnergy?.peak_load_kw ?? fallback.peakLoadKw,
    gridPowerKw: dbEnergy?.grid_power_kw ?? fallback.gridPowerKw,
    solarRooftopKw: dbEnergy?.solar_rooftop_kw ?? fallback.solarRooftopKw,
    powerFactor: dbEnergy?.power_factor ?? fallback.powerFactor,
    carbonEmissionsKg: dbEnergy?.carbon_emissions_kg ?? fallback.carbonEmissionsKg,
    savingsInrToday: dbEnergy?.savings_inr_today ?? fallback.savingsInrToday,
    trend24h: fallback.trend24h,
  };

  const solarPct = Math.round((energy.solarRooftopKw / (energy.currentLoadKw || 1)) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border border-amber-800/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Zap className="w-4 h-4" /> Smart Grid, Solar Rooftop Microgrid & Power Quality
          </div>
          <h1 className="text-2xl font-extrabold">Energy Telemetry & Carbon Accounting</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time multi-function meters, solar inverter telemetry, and peak tariff shaving for {activeOrg?.name}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Today's Solar Share</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-extrabold text-amber-400">{solarPct}%</span>
            </div>
          </div>
          <div className="border-l border-white/10 pl-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ₹ {energy.savingsInrToday.toLocaleString()} Saved Today
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Direct Solar Off-Grid</p>
          </div>
        </div>
      </div>

      {/* 4 Energy Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Total Active Load</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-stone-900 dark:text-white">{energy.currentLoadKw} <span className="text-sm font-normal text-stone-400 dark:text-slate-500">kW</span></p>
          <p className="text-xs text-stone-500 dark:text-slate-400">Daily Total: {energy.dailyTotalKwh.toLocaleString()} kWh</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Solar Rooftop Inverter</span>
            <SunMedium className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-amber-500">{energy.solarRooftopKw} <span className="text-sm font-normal text-stone-400 dark:text-slate-500">kW</span></p>
          <p className="text-xs text-emerald-500 font-semibold">Grid Import Reduced to {energy.gridPowerKw} kW</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Power Factor (PF)</span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-3xl font-extrabold text-stone-900 dark:text-white">{energy.powerFactor}</p>
          <p className="text-xs text-emerald-500 font-semibold">Unity Target Maintained (No APFC Penalty)</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Daily Carbon Footprint</span>
            <Leaf className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-stone-900 dark:text-white">{(energy.carbonEmissionsKg / 1000).toFixed(1)} <span className="text-sm font-normal text-stone-400 dark:text-slate-500">Tons CO₂e</span></p>
          <p className="text-xs text-emerald-500 font-semibold">28% Lower than Conventional Baseline</p>
        </div>
      </div>

      {/* 24-Hour Load Profile vs Solar Generation */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-stone-900 dark:text-white">
              24-Hour Campus Load vs Solar PV Generation Profile (kW)
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              LAN Substation Modbus TCP stream. Yellow area represents zero-carbon solar output.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={energy.trend24h}>
              <defs>
                <linearGradient id="solarG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="loadG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} unit=" kW" />
              <Tooltip
                contentStyle={{ backgroundColor: '#07080e', borderRadius: '12px', border: '1px solid #151722', color: '#ffffff' }}
                itemStyle={{ color: '#ffffff', fontWeight: 700 }}
                labelStyle={{ color: '#38bdf8', fontWeight: 700 }}
              />
              <Legend />
              <Area type="monotone" dataKey="load" stroke="#10b981" strokeWidth={2.5} fill="url(#loadG)" name="Total Facility Demand (kW)" />
              <Area type="monotone" dataKey="solar" stroke="#f59e0b" strokeWidth={2} fill="url(#solarG)" name="Solar PV Generation (kW)" />
              <Area type="monotone" dataKey="grid" stroke="#64748b" strokeWidth={1.5} fill="none" name="Grid Inflow (kW)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EnergyTab;
