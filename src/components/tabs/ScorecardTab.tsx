'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSustainabilityScorecard } from '@/data/mockData';
import { DjangoApi } from '@/services/api';
import {
  Award,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Download,
  FileCheck,
  Star,
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

import { Organization } from '@/types';

interface ScorecardTabProps {
  org?: Organization;
}

export const ScorecardTab: React.FC<ScorecardTabProps> = ({ org }) => {
  const { activeOrg: contextOrg, organizations } = useAuth();
  const activeOrg = org || contextOrg || organizations[0] || null;
  const [dbEnergy, setDbEnergy] = useState<any>(null);
  const [dbWater, setDbWater] = useState<any>(null);

  useEffect(() => {
    if (!activeOrg?.id) return;
    Promise.all([
      DjangoApi.getEnergyTelemetry(activeOrg.id),
      DjangoApi.getWaterTelemetry(activeOrg.id),
    ]).then(([energy, water]) => {
      if (energy) setDbEnergy(energy);
      if (water) setDbWater(water);
    });
  }, [activeOrg?.id]);

  const baseCard = getSustainabilityScorecard(activeOrg);
  const renewableEnergySharePct = dbEnergy
    ? Math.round((dbEnergy.solar_rooftop_kw / (dbEnergy.current_load_kw || 1)) * 100)
    : baseCard.renewableEnergySharePct;
  const waterNeutralityPct = dbWater
    ? dbWater.stp_recycle_rate_pct
    : baseCard.waterNeutralityPct;

  const starsCount = Math.max(1, Math.min(5, Math.round(Number(baseCard.grihaStars) || 4)));

  const card = {
    ...baseCard,
    grihaStars: starsCount,
    overallScore: activeOrg.sustainabilityScore || baseCard.overallScore || 88,
    renewableEnergySharePct,
    waterNeutralityPct,
    breakdown: [
      { category: 'Air Quality & Indoor Comfort', score: 88, maxScore: 100, benchmarkIndiaAvg: 65 },
      { category: 'Energy Efficiency & Solar Share', score: Math.min(100, Math.round(renewableEnergySharePct * 1.5 + 40)), maxScore: 100, benchmarkIndiaAvg: 58 },
      { category: 'Water Conservation & STP Reuse', score: Math.min(100, waterNeutralityPct), maxScore: 100, benchmarkIndiaAvg: 62 },
      { category: 'Solid & Hazardous Waste Management', score: 92, maxScore: 100, benchmarkIndiaAvg: 70 },
      { category: 'Low-Carbon Transport & EV Charging', score: 78, maxScore: 100, benchmarkIndiaAvg: 50 },
      { category: 'Predictive Equipment Health & Safety', score: 85, maxScore: 100, benchmarkIndiaAvg: 60 },
    ],
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Award className="w-4 h-4" /> National Green Estate Rating (GRIHA / LEED / BEE Star Protocol)
          </div>
          <h1 className="text-2xl font-extrabold">ESG Sustainability Scorecard & Compliance</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-3 rounded-2xl bg-white/10 border border-white/15 text-amber-300">
            {[...Array(starsCount)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs font-bold text-white ml-1">{starsCount}-Star GRIHA</span>
          </div>

          <button
            onClick={() => alert('Exporting Certified ESG Audit Report PDF for ' + (activeOrg?.name || 'Estate'))}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30"
          >
            <Download className="w-4 h-4" /> Export ESG Audit PDF
          </button>
        </div>
      </div>

      {/* 4 Summary Score Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Overall Sustainability Score</span>
          <p className="text-4xl font-extrabold text-emerald-500">{card.overallScore}<span className="text-lg font-normal text-stone-400 dark:text-slate-500"> / 100</span></p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Grade: {card.esgRating} (Top Decile in India)</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Renewable Energy Share</span>
          <p className="text-4xl font-extrabold text-amber-500">{card.renewableEnergySharePct}%</p>
          <p className="text-xs text-stone-400 dark:text-slate-500">Target: 50% by 2028</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Water Circularity Loop</span>
          <p className="text-4xl font-extrabold text-cyan-500">{card.waterNeutralityPct}%</p>
          <p className="text-xs text-stone-400 dark:text-slate-500">STP Treated Water Reuse Ratio</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Waste Landfill Diversion</span>
          <p className="text-4xl font-extrabold text-purple-500">{card.wasteDiversionPct}%</p>
          <p className="text-xs text-stone-400 dark:text-slate-500">Segregated at Source</p>
        </div>
      </div>

      {/* Category Breakdown vs National Benchmark */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-4">
        <div>
          <h2 className="font-bold text-sm text-stone-900 dark:text-white">
            Category-wise Performance vs Indian National Facility Average (Out of 100)
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Evaluated according to Central Pollution Control Board (CPCB) and Bureau of Energy Efficiency (BEE) guidelines.
          </p>
        </div>

        <div className="h-[430px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={card.breakdown}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              barGap={4}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit=" / 100" />
              <YAxis
                dataKey="category"
                type="category"
                width={250}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155', opacity: 0.3 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#07080e', borderRadius: '12px', border: '1px solid #151722', color: '#ffffff' }}
                itemStyle={{ color: '#ffffff', fontWeight: 700 }}
                labelStyle={{ color: '#38bdf8', fontWeight: 700 }}
                formatter={(value: any) => [`${value} / 100`, '']}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="score" name="Estate Score" fill="#10b981" barSize={13} radius={[0, 6, 6, 0]} />
              <Bar dataKey="benchmarkIndiaAvg" name="Indian National Average" fill="#64748b" barSize={13} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ScorecardTab;
