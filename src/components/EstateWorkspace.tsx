'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Logo from '@/components/Logo';
import { Role } from '@/types';
import {
  LayoutDashboard,
  Layers,
  Wind,
  Droplets,
  Zap,
  Car,
  Trash2,
  Cpu,
  BrainCircuit,
  Award,
  ShieldCheck,
  Hospital,
  GraduationCap,
  Flame,
  Factory,
  Building2,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Check,
  Search,
  ExternalLink,
  Sparkles,
  Wifi,
  Network,
  Radio,
  Users,
  Eye,
  RotateCcw,
  Briefcase,
  AlertTriangle,
  User,
  Edit3,
  Database,
  AlertCircle,
} from 'lucide-react';
import { NotificationCenterDropdown } from '@/components/NotificationCenterDropdown';
import { UserProfileModal } from '@/components/UserProfileModal';

import DashboardOverview from '@/components/DashboardOverview';
import AqiTab from '@/components/tabs/AqiTab';
import WaterTab from '@/components/tabs/WaterTab';
import EnergyTab from '@/components/tabs/EnergyTab';
import ParkingTab from '@/components/tabs/ParkingTab';
import WasteTab from '@/components/tabs/WasteTab';
import EquipmentTab from '@/components/tabs/EquipmentTab';
import AiSimulatorTab from '@/components/tabs/AiSimulatorTab';
import ScorecardTab from '@/components/tabs/ScorecardTab';
import Campus3DTab from '@/components/tabs/Campus3DTab';
import CampusStaffTab from '@/components/tabs/CampusStaffTab';
import IoTGatewayModal from '@/components/IoTGatewayModal';
import { INITIAL_ORGANIZATIONS } from '@/data/mockData';

interface EstateWorkspaceProps {
  orgId?: string;
  initialTab?: string;
}

export interface CampusRoleProfile {
  id: Role;
  label: string; // Exact match to user's screenshot
  badge: string;
  tagline: string;
  duties: string;
  icon: any;
  allowedTabs: string[];
}

export const CAMPUS_ROLE_PROFILES: Record<string, CampusRoleProfile> = {
  ORG_ADMIN: {
    id: 'ORG_ADMIN',
    label: 'ESTATE ADMIN',
    badge: 'Campus Lead',
    tagline: 'Institute Governance & Staff Provisioning',
    duties: 'Manages institution users, staff roles, 3D spatial mesh, dual-gateway telemetry, water loops, and facility ESG compliance.',
    icon: ShieldCheck,
    allowedTabs: [
      'overview',
      'staff',
      '3d',
      'aqi',
      'water',
      'energy',
      'parking',
      'waste',
      'equipment',
      'simulator',
      'scorecard',
    ],
  },
  ESTATE_MANAGER: {
    id: 'ESTATE_MANAGER',
    label: 'ESTATE MANAGER',
    badge: 'Operations',
    tagline: 'Physical Facilities & Infrastructure Health',
    duties: 'Daily operational management of building assets, 3D spatial layout, equipment maintenance lifecycles, STP water loop, and waste collection routes.',
    icon: Cpu,
    allowedTabs: ['overview', '3d', 'equipment', 'water', 'parking', 'waste', 'aqi'],
  },
  ENERGY_AUDITOR: {
    id: 'ENERGY_AUDITOR',
    label: 'ENERGY AUDITOR',
    badge: 'ESG Audit',
    tagline: 'Power Efficiency, Solar Yield & AI Simulations',
    duties: 'Continuous energy monitoring, solar array optimization, AI peak-shaving stress tests, and GRIHA / LEED ESG rating scorecard.',
    icon: Zap,
    allowedTabs: ['overview', 'energy', 'scorecard', 'simulator', 'aqi', 'water'],
  },
  ORG_OPERATOR: {
    id: 'ORG_OPERATOR',
    label: 'SCADA OPERATOR',
    badge: 'Telemetry SCADA',
    tagline: 'Edge Ingestion, Sensor Mesh & Pump Actuation',
    duties: 'Real-time telemetry from Dual-Channel LAN (Modbus-TCP) & WiFi (ESP32) sensor streams, pump relay triggers, and 3D mesh node placement.',
    icon: Radio,
    allowedTabs: ['3d', 'water', 'energy', 'parking', 'aqi', 'overview'],
  },
  FACILITY_VIEWER: {
    id: 'FACILITY_VIEWER',
    label: 'FACILITY VIEWER',
    badge: 'Public/Auditor',
    tagline: 'Read-Only Environmental & Campus Metrics',
    duties: 'Clean read-only portal for ambient air quality (AQI), smart EV parking bay availability, green sustainability ranking, and 3D campus twin.',
    icon: Eye,
    allowedTabs: ['overview', '3d', 'aqi', 'parking', 'scorecard'],
  },
};

export const EstateWorkspace: React.FC<EstateWorkspaceProps> = ({
  orgId,
  initialTab = 'overview',
}) => {
  const router = useRouter();
  const {
    currentUser,
    activeOrg,
    organizations,
    selectOrganization,
    logout,
    isSuperAdmin,
    dataSource,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Active role strictly determined by the authenticated user's role
  // Estate Admin sees Admin profile; other roles only see their own profile
  const effectiveRole: Role =
    currentUser?.role === 'SUPERADMIN' ? 'ORG_ADMIN' : (currentUser?.role || 'ORG_ADMIN');

  const currentRoleProfile =
    CAMPUS_ROLE_PROFILES[effectiveRole] || CAMPUS_ROLE_PROFILES.ORG_ADMIN;

  const [currentView, setCurrentView] = useState<string>(initialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isIotModalOpen, setIsIotModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const cleanParam = (orgId || '').replace('org-', '');
  const displayOrg =
    organizations.find(
      (o) =>
        o.id === orgId ||
        o.id === `org-${cleanParam}` ||
        o.id.replace('org-', '') === cleanParam
    ) ||
    activeOrg ||
    organizations[0] ||
    INITIAL_ORGANIZATIONS[0];

  // If orgId is provided in URL, sync it with AuthContext
  useEffect(() => {
    if (orgId && displayOrg && activeOrg?.id !== displayOrg.id) {
      selectOrganization(displayOrg.id);
    }
  }, [orgId, displayOrg, activeOrg, selectOrganization]);

  // When effective role changes, ensure current view is allowed in this role's profile
  useEffect(() => {
    if (!currentRoleProfile.allowedTabs.includes(currentView)) {
      setCurrentView(currentRoleProfile.allowedTabs[0] || 'overview');
    }
  }, [effectiveRole, currentRoleProfile, currentView]);

  const getOrgIcon = (type?: string) => {
    switch (type) {
      case 'HOSPITAL':
        return <Hospital className="w-4 h-4 text-rose-500" />;
      case 'COLLEGE':
        return <GraduationCap className="w-4 h-4 text-cyan-500" />;
      case 'PSU':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'INDUSTRY':
        return <Factory className="w-4 h-4 text-purple-500" />;
      default:
        return <Building2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  // Master navigation item catalogue
  const masterNavItems = [
    { id: 'overview', label: 'Estate Overview', icon: LayoutDashboard, badge: 'Live' },
    { id: 'staff', label: 'Campus Staff & Roles', icon: Users, badge: 'Admin Lead' },
    { id: '3d', label: '3D Campus Twin', icon: Layers, badge: '3D Mesh' },
    { id: 'aqi', label: 'Air Quality (AQI)', icon: Wind, badge: 'CPCB' },
    { id: 'water', label: 'Water & STP Loop', icon: Droplets, badge: 'STP Loop' },
    { id: 'energy', label: 'Energy & Solar Grid', icon: Zap, badge: 'Solar' },
    { id: 'parking', label: 'Smart EV Parking', icon: Car, badge: 'IoT' },
    { id: 'waste', label: 'Waste Logistics', icon: Trash2, badge: 'Route' },
    { id: 'equipment', label: 'Asset Digital Twin', icon: Cpu, badge: 'Manual/CSV' },
    { id: 'simulator', label: 'AI Scenario Engine', icon: BrainCircuit, badge: 'GenAI' },
    { id: 'scorecard', label: 'ESG Sustainability', icon: Award, badge: 'GRIHA' },
  ];

  // Dynamically filtered navigation items for the active role's dashboard configuration
  const visibleNavItems = masterNavItems.filter((item) =>
    currentRoleProfile.allowedTabs.includes(item.id)
  );

  const renderActiveView = () => {
    switch (currentView) {
      case 'overview':
        return <DashboardOverview onNavigateTab={(tab) => setCurrentView(tab)} org={displayOrg || undefined} />;
      case 'staff':
        return <CampusStaffTab org={displayOrg || undefined} />;
      case 'aqi':
        return <AqiTab org={displayOrg || undefined} />;
      case 'water':
        return <WaterTab org={displayOrg || undefined} />;
      case 'energy':
        return <EnergyTab org={displayOrg || undefined} />;
      case 'parking':
        return <ParkingTab org={displayOrg || undefined} />;
      case 'waste':
        return <WasteTab org={displayOrg || undefined} />;
      case 'equipment':
        return <EquipmentTab org={displayOrg || undefined} />;
      case 'simulator':
        return <AiSimulatorTab org={displayOrg || undefined} />;
      case 'scorecard':
        return <ScorecardTab org={displayOrg || undefined} />;
      case '3d':
        return <Campus3DTab />;
      default:
        return <DashboardOverview onNavigateTab={(tab) => setCurrentView(tab)} org={displayOrg || undefined} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f3] dark:bg-[#020305] text-stone-900 dark:text-slate-100 font-sans flex antialiased transition-colors duration-300">
      {/* 1. LEFT SIDEBAR (Configured per role) */}
      <aside className="w-72 flex-shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 border-r border-[#ece3d6] dark:border-[#151722] bg-white/95 dark:bg-[#04050a] p-4 transition-colors z-20 select-none overflow-hidden no-scrollbar">
        <div className="flex flex-col flex-1 min-h-0 space-y-3">
          {/* Brand Logo & Institutional Type Pill */}
          <div className="px-1 py-0.5">
            <Logo size="md" showText={true} />
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f5efe6] dark:bg-[#0f111d] text-cyan-800 dark:text-cyan-400 border border-cyan-500/30">
              {getOrgIcon(displayOrg?.type)}
              <span>{displayOrg?.type || 'ESTATE'} WORKSPACE</span>
            </div>
          </div>

          {/* Active Estate Info Card */}
          {displayOrg && (
            <div className="p-3 rounded-2xl bg-[#f5efe6] dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] text-stone-900 dark:text-slate-100 shadow-sm space-y-1.5 flex-shrink-0">
              <div className="flex items-center justify-between text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <span>Facility Node</span>
                <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {displayOrg.iotStatus || 'ONLINE'}
                </span>
              </div>
              <h2 className="font-extrabold text-xs text-stone-900 dark:text-white truncate">
                {displayOrg.name}
              </h2>
              <div className="pt-1.5 border-t border-[#ece3d6] dark:border-[#151722] flex items-center justify-between text-[10px]">
                <span className="text-stone-500 dark:text-slate-400">Green Score</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                  {displayOrg.sustainabilityScore}/100
                </span>
              </div>
            </div>
          )}

          {/* SuperAdmin return shortcut if superadmin is inspecting */}
          {isSuperAdmin && (
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all cursor-pointer flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin HQ</span>
              </div>
              <span className="text-[10px]">← Return</span>
            </button>
          )}

          {/* Main Navigation Items (Filtered per role duties) */}
          <nav className="space-y-1.5 pt-1 flex-1 overflow-y-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 ease-out cursor-pointer active:scale-[0.98] border ${
                    isActive
                      ? 'bg-[#f5efe6] dark:bg-[#0f111d] text-cyan-800 dark:text-cyan-400 border-cyan-500/50 shadow-sm dark:shadow-[0_0_16px_rgba(6,182,212,0.18)] font-bold'
                      : 'border-transparent text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 hover:bg-[#f8f4ed] dark:hover:bg-[#0a0b12] font-semibold'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-in fade-in zoom-in-50 duration-200" />
                  )}
                  <div className="flex items-center gap-3 min-w-0 pl-1">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                        isActive
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : 'text-stone-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono flex-shrink-0 transition-colors duration-200 ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-bold border border-cyan-500/30'
                          : 'bg-[#ece3d6] dark:bg-[#121422] text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Card */}
        <div className="space-y-2 pt-2 border-t border-[#ece3d6] dark:border-[#151722]">
          <div className="p-2.5 rounded-2xl bg-[#f5efe6] dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] flex items-center justify-between">
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
              title="Click to edit your profile and credentials"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-xs flex-shrink-0 group-hover:ring-2 group-hover:ring-cyan-400 transition-all">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'EA'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-white truncate group-hover:text-cyan-500 transition-colors">
                  {currentUser?.name || 'Estate Admin'}
                </p>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold block leading-none truncate">
                  {currentRoleProfile.label} (Edit)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                title="Edit Profile & Password"
                className="p-1.5 rounded-lg text-stone-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-[#16223b] transition-colors cursor-pointer flex-shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-[#16223b] transition-colors cursor-pointer flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#ece3d6] dark:border-[#151722] bg-white/90 dark:bg-[#04050a]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 sticky top-0 z-30 transition-colors">
          {/* Left: Mobile Navigation Button & Facility Identity */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Mobile Navigation"
              className="p-2 rounded-xl bg-[#f5efe6] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] lg:hidden text-stone-700 dark:text-slate-200 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo on Mobile */}
            <div className="lg:hidden flex items-center">
              <Logo size="sm" showText={false} />
            </div>

            {/* Facility Identity Badge */}
            {isSuperAdmin ? (
              <div className="relative">
                <button
                  onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f5efe6] dark:bg-[#0a0b12] text-xs font-semibold text-stone-800 dark:text-slate-200 hover:border-cyan-500 transition-all cursor-pointer shadow-sm"
                >
                  {getOrgIcon(displayOrg?.type)}
                  <span className="font-extrabold text-stone-900 dark:text-white truncate max-w-[140px] sm:max-w-[190px]">
                    {displayOrg?.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold hidden sm:inline">
                    Switcher
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                </button>

                {isOrgDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setIsOrgDropdownOpen(false)}
                  >
                    <div className="p-2 border-b border-[#ece3d6] dark:border-[#151722] flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400">
                      <span>SuperAdmin Switch Facility</span>
                      <span className="text-emerald-500 font-mono">{organizations.length} Active</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                      {organizations.map((org) => {
                        const isSelected = org.id === displayOrg?.id;
                        return (
                          <button
                            key={org.id}
                            onClick={() => selectOrganization(org.id)}
                            className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30'
                                : 'text-stone-700 dark:text-slate-300 hover:bg-[#f5efe6] dark:hover:bg-[#0f111d]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {getOrgIcon(org.type)}
                              <span className="truncate">{org.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f5efe6] dark:bg-[#0a0b12] text-xs font-semibold text-stone-800 dark:text-slate-200 shadow-sm">
                {getOrgIcon(displayOrg?.type)}
                <span className="font-extrabold text-stone-900 dark:text-white truncate max-w-[140px] sm:max-w-[220px]">
                  {displayOrg?.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 hidden sm:inline">
                  Assigned
                </span>
              </div>
            )}
          </div>

          {/* Right Controls: Role Identity, IoT Status, Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Authenticated User Role Badge (Clean, Strict, Non-Switchable) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f5efe6] dark:bg-[#0a0b12] text-xs font-semibold text-stone-800 dark:text-slate-200 shadow-sm">
              <currentRoleProfile.icon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="font-extrabold text-stone-900 dark:text-white truncate">
                {currentRoleProfile.label}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 hidden sm:inline">
                {currentRoleProfile.badge}
              </span>
            </div>

            {/* Real-time Dual-Channel Hardware Gateway Status (Clickable) */}
            <button
              onClick={() => setIsIotModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold transition-all cursor-pointer shadow-sm text-xs"
              title="Click to inspect Dual Hardware Ingestion (LAN & WiFi)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Network className="w-3.5 h-3.5" /> LAN
                </span>
                <span className="opacity-40 text-stone-400">•</span>
                <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                  <Wifi className="w-3.5 h-3.5" /> WiFi
                </span>
              </div>
            </button>

            {/* Live Interactive Notification Center */}
            <NotificationCenterDropdown />

            {/* Data Source Indicator Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold shadow-sm ${
                dataSource === 'backend'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : dataSource === 'mock'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-500/10 border-slate-500/30 text-slate-500 dark:text-slate-400'
              }`}
              title={dataSource === 'backend' ? 'All data is live from NeonDB PostgreSQL' : dataSource === 'mock' ? 'Showing simulated demo data — backend not connected' : 'Connecting to NeonDB...'}
            >
              {dataSource === 'backend' ? (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Live NeonDB</span>
                </>
              ) : dataSource === 'mock' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Demo Data</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 animate-pulse" />
                  <span>Syncing...</span>
                </>
              )}
            </div>

            {/* Profile Edit Trigger */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              aria-label="Edit Profile"
              title="Edit Profile & Security"
              className="p-2 rounded-xl bg-[#f5efe6] dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] text-stone-700 dark:text-slate-300 hover:border-cyan-500 transition-all cursor-pointer flex items-center justify-center"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f5efe6] dark:bg-[#07080e] text-stone-700 dark:text-slate-300 hover:border-cyan-500 hover:scale-105 transition-all shadow-sm flex items-center gap-1.5 font-bold cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] text-amber-400 font-bold hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] text-indigo-600 font-bold hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Pill Bar */}
        <div className="lg:hidden border-b border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-[#07080e] p-2 flex gap-1 overflow-x-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-stone-600 dark:text-slate-400 bg-[#f5efe6] dark:bg-[#0a0b12]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>



        {/* Dynamic Main Workspace Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto overflow-hidden">
          <div key={currentView} className="animate-in fade-in duration-200 ease-out">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Dual-Channel Hardware IoT Gateway Monitor (LAN & WiFi) */}
      <IoTGatewayModal isOpen={isIotModalOpen} onClose={() => setIsIotModalOpen(false)} />

      {/* Universal Profile & Password Edit Modal with Assigned Facility Post Context */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        facilityOrg={displayOrg}
        mode="TENANT"
      />
    </div>
  );
};

export default EstateWorkspace;

