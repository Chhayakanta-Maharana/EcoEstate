'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Logo from '@/components/Logo';
import {
  Search,
  Bell,
  MoreHorizontal,
  Settings,
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  Sun,
  Moon,
  PlusCircle,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import AdminDashboardView from './admin/AdminDashboardView';
import AdminUsersView from './admin/AdminUsersView';
import AdminFacilitiesView from './admin/AdminFacilitiesView';
import AdminSettingsView from './admin/AdminSettingsView';

interface SuperAdminPortalProps {
  initialTab?: 'dashboard' | 'users' | 'facilities' | 'settings';
  onNavigateTab?: (tabId: string) => void;
  onNavigateToOrg?: (orgId: string) => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  initialTab = 'dashboard',
  onNavigateTab,
  onNavigateToOrg,
}) => {
  const { currentUser, organizations, users, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeNav, setActiveNav] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveNav(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tabId: string) => {
    setActiveNav(tabId);
    if (onNavigateTab) {
      onNavigateTab(tabId);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Analytics', icon: LayoutDashboard },
    { id: 'users', label: 'Users & Roles', icon: Users, badge: `${users.length}` },
    { id: 'facilities', label: 'Estates Directory', icon: Building2, badge: `${organizations.length}` },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#fbf8f3] dark:bg-[#020305] text-stone-900 dark:text-slate-100 font-sans flex antialiased transition-colors duration-300">
      {/* 1. LEFT SIDEBAR (Sticky, No-scroll, SuperAdmin dedicated) */}
      <aside className="w-60 flex-shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 border-r border-[#ece3d6] dark:border-[#151722] bg-white/95 dark:bg-[#04050a] p-4 transition-colors z-20 select-none overflow-hidden">
        <div className="space-y-4">
          {/* Logo & Portal Badge */}
          <div className="px-1 py-0.5">
            <Logo size="md" showText={true} />
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
              <ShieldCheck className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Super Admin Portal
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#f5efe6] dark:bg-[#0f111d] text-cyan-800 dark:text-cyan-400 border border-cyan-500/40 shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.12)] font-bold'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 hover:bg-[#f8f4ed] dark:hover:bg-[#0a0b12]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-stone-400 dark:text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-bold'
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
        <div className="space-y-2">
          <div className="p-2.5 rounded-2xl bg-[#f5efe6] dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-xs flex-shrink-0">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'AC'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                  {currentUser?.name || 'Alex Carter'}
                </p>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold block leading-none">
                  Super Admin
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-[#16223b] transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="h-16 border-b border-[#ece3d6] dark:border-[#151722] bg-white/90 dark:bg-[#04050a]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 sticky top-0 z-30 transition-colors">
          {/* Mobile Navigation Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <Logo size="sm" showText={true} />
          </div>

          {/* Search Bar */}
          <div className="relative hidden md:block w-72 sm:w-80 md:w-96">
            <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search platform metrics, users, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f5efe6] dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* System Online Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-[#061711] border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>System Online</span>
            </div>

            {/* Notification Icon */}
            <div className="relative p-2 rounded-xl bg-[#f5efe6] dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] text-stone-700 dark:text-slate-300">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-extrabold text-slate-950 flex items-center justify-center">
                {users.length}
              </span>
            </div>

            {/* Quick Action Button: Manage Users */}
            <button
              onClick={() => handleTabChange('users')}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users & Roles</span>
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-stone-600 dark:text-slate-400 bg-[#f5efe6] dark:bg-[#0a0b12]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>


        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {activeNav === 'dashboard' && <AdminDashboardView onNavigateTab={handleTabChange} />}
          {activeNav === 'users' && <AdminUsersView />}
          {activeNav === 'facilities' && <AdminFacilitiesView />}
          {activeNav === 'settings' && <AdminSettingsView />}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminPortal;
