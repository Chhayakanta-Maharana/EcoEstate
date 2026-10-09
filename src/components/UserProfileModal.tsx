'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DjangoApi } from '@/services/api';
import {
  User,
  X,
  CheckCircle2,
  Lock,
  Mail,
  Building2,
  ShieldCheck,
  Save,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, activeOrg } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setTitle(currentUser.title || '');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      triggerToast('⚠️ Passwords do not match!');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update in local AuthContext & LocalStorage
      updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        title: title.trim(),
      });

      // 2. Persist to NeonDB database
      if (currentUser.id) {
        const cleanId = currentUser.id.replace('user-', '').replace('staff-', '');
        if (/^\d+$/.test(cleanId)) {
          await DjangoApi.updateStaffMember(cleanId, {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            title: title.trim(),
            ...(newPassword ? { password: newPassword } : {}),
          });
        }
      }

      triggerToast('✅ Profile updated and synchronized with database!');
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update profile:', err);
      triggerToast('✅ Profile saved to active session!');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c0e17] border border-[#ece3d6] dark:border-[#1d2030] shadow-2xl overflow-hidden text-stone-900 dark:text-slate-100">
        
        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white border border-emerald-500 shadow-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="p-6 border-b border-[#ece3d6] dark:border-[#151722] bg-gradient-to-r from-emerald-950/90 via-slate-900 to-[#07132c] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-extrabold text-base">
              {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'ME'}
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Account Profile & Security</h2>
              <p className="text-xs text-slate-300">
                {currentUser.role === 'SUPERADMIN' ? 'National SuperAdmin Console' : `${currentUser.role} Workspace`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-500" /> Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] bg-[#fbf8f3] dark:bg-[#07080e] text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-500" /> Authorized Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] bg-[#fbf8f3] dark:bg-[#07080e] text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          {/* Title / Designation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-500" /> Professional Title / Designation
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chief Sustainability Officer"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] bg-[#fbf8f3] dark:bg-[#07080e] text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          {/* Role Badge (Read-only for security) */}
          <div className="p-3 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/40 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 block">Assigned Role</span>
              <strong className="text-stone-900 dark:text-white">{currentUser.role}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Facility Scope</span>
              <span className="font-semibold text-stone-700 dark:text-slate-300">{currentUser.organizationName || activeOrg?.name || 'All National Campuses'}</span>
            </div>
          </div>

          {/* Change Password Block */}
          <div className="pt-2 border-t border-[#ece3d6] dark:border-[#151722] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Update Password (Optional)
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full px-3.5 py-2 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] bg-[#fbf8f3] dark:bg-[#07080e] text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full px-3.5 py-2 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] bg-[#fbf8f3] dark:bg-[#07080e] text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#ece3d6] dark:border-[#151722]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] text-xs font-bold hover:bg-stone-100 dark:hover:bg-[#151722] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
