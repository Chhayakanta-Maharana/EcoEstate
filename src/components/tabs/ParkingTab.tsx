'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getParkingData } from '@/data/mockData';
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

  useEffect(() => {
    if (!activeOrg?.id) return;
    let isMounted = true;

    const fetchParking = () => {
      Promise.all([
        DjangoApi.getParkingTelemetry(activeOrg.id),
        DjangoApi.getIoTStatus(),
      ]).then(([data, status]) => {
        if (isMounted) {
          if (data) setDbParking(data);
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

  const currentCategory = activeStream?.category || null;
  const isParkingActive = currentCategory === 'PARKING';
  const isInactive = currentCategory !== null && !isParkingActive;

  const total = dbParking?.total_slots || 80;
  const occ = isInactive ? 0 : (dbParking?.occupied_slots ?? (currentCategory === null ? 0 : 0));
  const evOcc = isInactive ? 0 : (dbParking?.ev_charging_occupied ?? (currentCategory === null ? 0 : 0));
  const flowRate = isInactive ? 0 : (dbParking?.entry_flow_rate ?? (currentCategory === null ? 0 : 0));
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
    availableSlots: isInactive ? total : (dbParking?.available_slots ?? (total - occ)),
    evChargingSlotsTotal: dbParking?.ev_charging_total ?? 12,
    evChargingSlotsOccupied: evOcc,
    occupancyRatePct: ratePct,
    peakCongestionZone: isInactive ? 'Inactive Stream (0)' : (dbParking?.peak_congestion_zone || 'Basement B1 - Lane 4'),
    entryFlowRatePerHour: flowRate,
    hourlyOccupancy: liveHourlyOccupancy,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border border-blue-800/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <Car className="w-4 h-4" /> Automated Ultrasonic Bay Sensors & EV Fast Charging Network
            {isParkingActive ? (
              <span className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> LIVE STREAM ACTIVE (PARKING)
              </span>
            ) : currentCategory !== null ? (
              <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> INACTIVE STREAM ({currentCategory} ACTIVE) • SENSORS SET TO 0
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-stone-500/20 text-stone-300 px-2 py-0.5 rounded-full border border-stone-500/30">
                <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse" /> AWAITING SENSOR FEED...
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold">Smart Parking & Traffic Intelligence</h1>
        </div>

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
