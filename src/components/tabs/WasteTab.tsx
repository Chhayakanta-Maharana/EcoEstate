'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDustbins } from '@/data/mockData';
import { DjangoApi } from '@/services/api';
import { Organization } from '@/types';
import {
  Trash2,
  AlertTriangle,
  Battery,
  Clock,
  Sparkles,
  Truck,
  CheckCircle2,
} from 'lucide-react';

interface WasteTabProps {
  org?: Organization;
}

export const WasteTab: React.FC<WasteTabProps> = ({ org }) => {
  const { activeOrg: contextOrg } = useAuth();
  const activeOrg = org || contextOrg;
  const [dbDustbins, setDbDustbins] = useState<any[]>([]);

  useEffect(() => {
    if (!activeOrg?.id) return;
    DjangoApi.getDustbins(activeOrg.id).then((data) => {
      if (Array.isArray(data) && data.length > 0) setDbDustbins(data);
    });
  }, [activeOrg?.id]);

  const fallback = getDustbins(activeOrg?.type || 'HOSPITAL');
  const dustbins = dbDustbins.length > 0
    ? dbDustbins.map((b) => ({
        id: b.bin_code || `BIN-${b.id}`,
        zone: b.zone,
        binType: b.bin_type,
        fillPercentage: b.fill_percentage,
        batteryPct: b.battery_pct,
        predictedOverflowMins: b.predicted_overflow_mins,
        status: b.status,
        lastEmptied: b.last_emptied,
      }))
    : fallback;

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Bio-Medical':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'Hazardous':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'E-Waste':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'Wet Waste':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 border border-purple-800/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
            <Trash2 className="w-4 h-4" /> Ultrasonic Level Sensors & AI Overflow Prediction
          </div>
          <h1 className="text-2xl font-extrabold">Smart Waste Management & Segregation</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time fill telemetry, CPCB bio-medical tracking, and dynamic vehicle collection dispatch for {activeOrg?.name}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-2xl border border-purple-500/30 text-xs font-bold text-purple-300">
          <Truck className="w-4 h-4 text-purple-400" /> Route Optimization Active
        </div>
      </div>

      {/* Dustbins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dustbins.map((bin) => {
          const isWarning = bin.status === 'Overflow Warning' || bin.fillPercentage >= 85;

          return (
            <div
              key={bin.id}
              className={`p-5 rounded-3xl bg-white dark:bg-[#07080e] border shadow-xl space-y-4 transition-all ${
                isWarning
                  ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                  : 'border-[#ece3d6] dark:border-[#151722]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-400 dark:text-slate-500">{bin.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeColor(bin.binType)}`}>
                      {bin.binType}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-white mt-1">{bin.zone}</h3>
                </div>

                {isWarning && (
                  <span className="p-1.5 rounded-xl bg-rose-500/20 text-rose-500 animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                )}
              </div>

              {/* Progress bar fill percentage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-slate-400">Fill Capacity:</span>
                  <span className={`font-extrabold ${bin.fillPercentage >= 80 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {bin.fillPercentage}%
                  </span>
                </div>
                <div className="w-full h-3 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      bin.fillPercentage >= 85
                        ? 'bg-rose-500'
                        : bin.fillPercentage >= 65
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${bin.fillPercentage}%` }}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-2 border-t border-[#ece3d6]/60 dark:border-[#151722] grid grid-cols-2 gap-2 text-[11px] text-stone-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                  <span>Overflow in: <strong className="text-stone-800 dark:text-slate-200">{bin.predictedOverflowMins}m</strong></span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Battery className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Battery: {bin.batteryPct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WasteTab;
