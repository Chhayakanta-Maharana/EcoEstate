'use strict';
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Wind,
  Droplets,
  Zap,
  Car,
  Trash2,
  Cpu,
  BrainCircuit,
  Award,
  ShieldCheck,
  Building,
  Activity,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { isSuperAdmin, activeOrg } = useAuth();

  const navigationItems = [
    { id: 'overview', label: 'Estate Overview', icon: LayoutDashboard, badge: 'Live' },
    { id: '3d', label: '3D Campus Twin', icon: Layers, badge: '3D Mesh' },
    { id: 'aqi', label: 'Air Quality (AQI)', icon: Wind, badge: 'CPCB' },
    { id: 'water', label: 'Water & STP Loop', icon: Droplets, badge: 'STP 82%' },
    { id: 'energy', label: 'Energy & Solar Grid', icon: Zap, badge: 'Solar' },
    { id: 'parking', label: 'Smart EV Parking', icon: Car, badge: 'IoT' },
    { id: 'waste', label: 'Waste Logistics', icon: Trash2, badge: 'Route' },
    { id: 'equipment', label: 'Asset Digital Twin', icon: Cpu, badge: 'Manual/CSV' },
    { id: 'simulator', label: 'AI Scenario Engine', icon: BrainCircuit, badge: 'GenAI' },
    { id: 'scorecard', label: 'ESG Sustainability', icon: Award, badge: 'GRIHA' },
  ];

  return (
    <aside className="w-60 flex-shrink-0 hidden lg:flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 border-r border-[#ece3d6] dark:border-[#151722] bg-[#fbf8f3] dark:bg-[#020305] p-3 transition-colors overflow-hidden select-none">
      <div className="space-y-2.5">
        {/* Active Organization Info Card (Compact) */}
        {activeOrg && (
          <div className="p-3 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] text-stone-900 dark:text-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
              <span>Current Estate</span>
              <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {activeOrg.iotStatus}
              </span>
            </div>
            <h2 className="font-bold text-xs leading-tight text-stone-900 dark:text-white truncate">
              {activeOrg.name}
            </h2>
            <div className="mt-2 pt-1.5 border-t border-[#ece3d6] dark:border-[#151722] flex items-center justify-between text-[10px] font-medium">
              <span className="text-stone-500 dark:text-slate-400">Green Score:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {activeOrg.sustainabilityScore}/100
              </span>
            </div>
          </div>
        )}

        {/* Super Admin Special Link */}
        {isSuperAdmin && (
          <div>
            <button
              onClick={() => setCurrentView('superadmin')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'superadmin'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-[#f5efe6] dark:bg-[#0a0b12] text-stone-700 dark:text-slate-300 border border-[#ece3d6] dark:border-[#151722] hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Super Admin Portal</span>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 py-0.2 rounded font-semibold">HQ</span>
            </button>
          </div>
        )}

        {/* Navigation List (Compact & Clean) */}
        <div className="space-y-0.5 pt-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-stone-600 dark:text-slate-300 hover:bg-[#f5efe6] dark:hover:bg-[#0a0b12] hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-stone-400 dark:text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#f5efe6] dark:bg-[#0f111d] text-stone-500 dark:text-slate-400 border border-[#ece3d6] dark:border-[#181a28]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Gateway IP */}
      <div className="pt-2 border-t border-[#ece3d6] dark:border-[#151722] text-[10px] text-stone-400 dark:text-slate-500 flex items-center justify-between">
        <span className="truncate">GW: {activeOrg?.iotGatewayIp || '192.168.1.1'}</span>
        <span className="font-mono text-emerald-500 font-bold">● ONLINE</span>
      </div>
    </aside>
  );
};

export default Sidebar;
