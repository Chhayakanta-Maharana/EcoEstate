'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Logo from '@/components/Logo';
import ModelGovernanceModal from '@/components/ModelGovernanceModal';
import {
  Sun,
  Moon,
  LogOut,
  Radio,
  Building2,
  ChevronDown,
  ShieldCheck,
  Hospital,
  GraduationCap,
  Flame,
  Factory,
  Check,
  Menu,
  X,
  LayoutDashboard,
  Wind,
  Droplets,
  Zap,
  Car,
  Trash2,
  Cpu,
  BrainCircuit,
  Award,
  PlusCircle,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenNewOrgModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenNewOrgModal,
}) => {
  const router = useRouter();
  const {
    currentUser,
    activeOrg,
    organizations,
    selectOrganization,
    logout,
    isSuperAdmin,
    isSimulatingIoT,
    toggleIoTSimulation,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGovernanceModalOpen, setIsGovernanceModalOpen] = useState(false);

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

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: '3d', label: '3D Campus Twin', icon: Layers },
    { id: 'aqi', label: 'Air Quality (AQI)', icon: Wind },
    { id: 'water', label: 'Water & STP Loop', icon: Droplets },
    { id: 'energy', label: 'Energy & Solar', icon: Zap },
    { id: 'parking', label: 'Smart Parking & EV', icon: Car },
    { id: 'waste', label: 'Waste Logistics', icon: Trash2 },
    { id: 'equipment', label: 'Asset Digital Twin', icon: Cpu },
    { id: 'simulator', label: 'AI Scenario Engine', icon: BrainCircuit },
    { id: 'scorecard', label: 'ESG Sustainability', icon: Award },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#ece3d6] dark:border-[#151722] bg-[#fbf8f3]/95 dark:bg-[#020305]/95 backdrop-blur-xl transition-colors">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Mobile Menu"
            className="p-2 rounded-xl bg-[#f5efe6] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] lg:hidden text-stone-700 dark:text-slate-200 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => {
              if (isSuperAdmin) {
                router.push('/admin/dashboard');
              } else {
                router.push(`/user/${activeOrg?.id || 'org-bput'}`);
              }
            }}
            className="cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <Logo size="sm" showText={true} className="sm:hidden" />
            <Logo size="md" showText={true} className="hidden sm:inline-flex" />
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f5efe6] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] text-stone-700 dark:text-slate-300">
            {isSuperAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Super Admin
              </>
            ) : (
              <>
                {getOrgIcon(activeOrg?.type)} {activeOrg?.type || 'Estate Admin'}
              </>
            )}
          </div>
        </div>

        {/* Center: Estate Selector */}
        <div className="relative">
          <button
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f5efe6] dark:bg-[#0a0b12] text-xs font-semibold text-stone-800 dark:text-slate-200 hover:border-emerald-500 transition-all shadow-sm max-w-[140px] sm:max-w-[260px] truncate cursor-pointer"
          >
            {getOrgIcon(activeOrg?.type)}
            <span className="truncate">{activeOrg?.name || 'Select Facility'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 flex-shrink-0 ml-0.5" />
          </button>

          {isOrgDropdownOpen && (
            <div
              className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              onClick={() => setIsOrgDropdownOpen(false)}
            >
              <div className="p-2 border-b border-[#ece3d6] dark:border-[#151722] flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400">
                <span>Switch Estate</span>
                <span className="text-emerald-500 font-mono">{organizations.length} Online</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                {organizations.map((org) => {
                  const isSelected = org.id === activeOrg?.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => {
                        selectOrganization(org.id);
                        router.push(`/user/${org.id}`);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 font-bold'
                          : 'text-stone-700 dark:text-slate-300 hover:bg-[#f5efe6] dark:hover:bg-[#0f111d]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {getOrgIcon(org.type)}
                        <div className="truncate">
                          <p className="truncate font-medium">{org.name}</p>
                          <p className="text-[10px] text-stone-400 dark:text-slate-400">{org.city} • {org.type}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {isSuperAdmin && onOpenNewOrgModal && (
                <button
                  onClick={onOpenNewOrgModal}
                  className="w-full mt-1 p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Provision New Estate
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* System Architecture, Assumptions & Model Governance Button */}
          <button
            onClick={() => setIsGovernanceModalOpen(true)}
            title="System Architecture, Ingestion Assumptions & AI Model Governance"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-extrabold text-xs transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="hidden sm:inline">Model Governance</span>
            <span className="sm:hidden">Governance</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          </button>

          {/* IoT Status indicator (Desktop only) */}
          <button
            onClick={toggleIoTSimulation}
            title="IoT LAN/WiFi stream status"
            className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isSimulatingIoT
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isSimulatingIoT ? 'animate-pulse text-emerald-500' : 'text-amber-500'}`} />
            <span>IoT: {isSimulatingIoT ? 'LIVE' : 'PAUSED'}</span>
          </button>

          {/* Superadmin Console Button */}
          {isSuperAdmin && (
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all bg-emerald-600 text-white border-emerald-600 shadow-sm hover:bg-emerald-500 cursor-pointer"
            >
              Admin HQ
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f5efe6] dark:bg-[#0a0b12] text-stone-700 dark:text-slate-300 hover:scale-105 transition-all shadow-sm cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* User & Logout */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#ece3d6] dark:border-[#151722]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              title="Sign Out"
              className="p-1.5 sm:p-2 rounded-xl text-stone-400 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#ece3d6] dark:border-[#151722] bg-[#fbf8f3]/95 dark:bg-[#020305]/95 backdrop-blur-2xl p-4 space-y-2 animate-in slide-in-from-top-3 duration-150">
          <div className="p-3 mb-2 rounded-2xl bg-[#f5efe6] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722]">
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Active Facility</p>
            <p className="font-bold text-xs text-stone-900 dark:text-white truncate">{activeOrg?.name}</p>
            <p className="text-[10px] text-stone-400 dark:text-slate-400">{activeOrg?.city}, {activeOrg?.state}</p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setCurrentView('superadmin');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                currentView === 'superadmin'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Super Admin Portal</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-stone-700 dark:text-slate-300 hover:bg-[#f5efe6] dark:hover:bg-[#0a0b12]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* System Architecture & Model Governance Modal */}
      <ModelGovernanceModal
        isOpen={isGovernanceModalOpen}
        onClose={() => setIsGovernanceModalOpen(false)}
        onNavigateToSimulator={() => setCurrentView('simulator')}
      />
    </header>
  );
};

export default Navbar;
