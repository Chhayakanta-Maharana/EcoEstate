'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth, AppNotification } from '@/context/AuthContext';
import {
  Bell,
  Mail,
  Building2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';

export const NotificationCenterDropdown: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    currentUser,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter notifications according to current user's role
  const roleFilteredNotifications = notifications.filter((n) => {
    if (!n.targetRole || n.targetRole === 'ALL') return true;
    if (currentUser?.role === 'SUPERADMIN') return true;
    return n.targetRole === currentUser?.role;
  });

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'EMAIL_SENT':
        return <Mail className="w-4 h-4 text-cyan-500" />;
      case 'ROLE_ASSIGNED':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'ESTATE_CREATED':
        return <Building2 className="w-4 h-4 text-purple-500" />;
      case 'ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open Notifications"
        title="View Live System Alerts & Email Dispatches"
        className="relative p-2 rounded-xl bg-[#f5efe6] dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] text-stone-700 dark:text-slate-300 hover:border-cyan-500 transition-all cursor-pointer flex items-center justify-center"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-cyan-500 text-[9px] font-extrabold text-slate-950 flex items-center justify-center shadow-sm animate-pulse">
            {unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0c0e17] border border-[#ece3d6] dark:border-[#1d2030] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-stone-900 dark:text-slate-100">
          {/* Header */}
          <div className="p-3.5 border-b border-[#ece3d6] dark:border-[#151722] bg-[#fbf8f3] dark:bg-[#07080e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-500" />
              <h3 className="font-bold text-xs tracking-tight">Audit & Email Dispatch Logs</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-mono">
                {roleFilteredNotifications.length}
              </span>
            </div>
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#ece3d6]/60 dark:divide-[#151722]">
            {roleFilteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 dark:text-slate-500 space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500/60" />
                <p className="font-semibold">All systems operational</p>
                <p className="text-[10px]">No unread alerts or queued dispatches.</p>
              </div>
            ) : (
              roleFilteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-3 hover:bg-[#fbf8f3] dark:hover:bg-[#121524] ${
                    !notif.read ? 'bg-cyan-50/40 dark:bg-cyan-950/20' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#1d2030] flex-shrink-0 mt-0.5 shadow-sm">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-xs truncate text-stone-900 dark:text-white">
                        {notif.title}
                      </p>
                      <span className="text-[9px] text-stone-400 dark:text-slate-500 font-mono flex-shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#ece3d6] dark:bg-[#181a2b] text-stone-600 dark:text-slate-400">
                        {notif.type.replace('_', ' ')}
                      </span>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#fbf8f3] dark:bg-[#07080e] border-t border-[#ece3d6] dark:border-[#151722] text-center text-[10px] text-stone-400 dark:text-slate-500 font-mono">
            <span>Logged via National Identity & SMTP Engine</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenterDropdown;
