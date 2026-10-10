'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DjangoApi } from '@/services/api';
import { Organization } from '@/types';
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
  Edit2,
  Check,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityOrg?: Organization | null;
  mode?: 'SUPERADMIN' | 'TENANT' | 'AUTO';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  facilityOrg,
  mode = 'AUTO',
}) => {
  const { currentUser, updateProfile, activeOrg, updateOrganization } = useAuth();

  // Resolve target organization for facility context
  const targetOrg = facilityOrg || activeOrg;
  const isTenantView = Boolean(targetOrg && (mode === 'TENANT' || targetOrg.id));

  // Facility Admin frozen details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminTitle, setAdminTitle] = useState('');
  const [activePassword, setActivePassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);

  // Inline password edit state (as requested by user with pencil edit icon)
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [editedPasswordVal, setEditedPasswordVal] = useState('');

  // Inline email and name edit states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmailVal, setEditedEmailVal] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedNameVal, setEditedNameVal] = useState('');

  // SuperAdmin Root Account states (only when in SuperAdmin Portal)
  const [saName, setSaName] = useState('');
  const [saEmail, setSaEmail] = useState('');
  const [saTitle, setSaTitle] = useState('');
  const [saNewPassword, setSaNewPassword] = useState('');
  const [saConfirmPassword, setSaConfirmPassword] = useState('');
  const [saShowPassword, setSaShowPassword] = useState(true);

  // Operational states
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasInitializedRef = React.useRef(false);

  // Sync state once on open
  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      setIsEditingPassword(false);
      setIsEditingEmail(false);
      setIsEditingName(false);
      return;
    }

    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const localSavedPass = typeof window !== 'undefined' ? localStorage.getItem('ecoestate-user-password') : null;
    const localSavedEmail = typeof window !== 'undefined' ? localStorage.getItem('ecoestate-user-email') : null;
    const localSavedName = typeof window !== 'undefined' ? localStorage.getItem('ecoestate-user-name') : null;

    if (isTenantView && targetOrg) {
      // Prioritize the actual authenticated login user credentials
      const effectiveName = currentUser?.name || localSavedName || targetOrg.assignedAdminName || 'HARI PANGI';
      const effectiveEmail = currentUser?.email || localSavedEmail || targetOrg.assignedAdminEmail || 'haripangi335@gmail.com';
      const effectiveTitle = currentUser?.title || `Estate Administrator - ${targetOrg.name}`;

      setAdminName(effectiveName);
      setEditedNameVal(effectiveName);
      setIsEditingName(false);

      setAdminEmail(effectiveEmail);
      setEditedEmailVal(effectiveEmail);
      setIsEditingEmail(false);

      setAdminTitle(effectiveTitle);
      const cleanOrgId = targetOrg.id.replace('org-', '');
      const localOrgPass = typeof window !== 'undefined'
        ? (localStorage.getItem(`ecoestate-org-pass-${cleanOrgId}`) || localStorage.getItem(`ecoestate-org-pass-${targetOrg.id}`))
        : null;
      const rawPass = targetOrg.assignedPassword;
      const isBulletMasked = !rawPass || rawPass.includes('•');
      const pass = localOrgPass || localSavedPass || (currentUser as any)?.password || (!isBulletMasked ? rawPass : '') || 'estate@2026';
      setActivePassword(pass);
      setEditedPasswordVal(pass);
      setIsEditingPassword(false);
    }

    if (currentUser) {
      setSaName(currentUser.name || 'Hari');
      setSaEmail(currentUser.email || 'superadmin@ecoestate.gov.in');
      setSaTitle(currentUser.title || 'National Director & Chief Administrator');
      if (!isTenantView) {
        const cleanOrgId = targetOrg ? targetOrg.id.replace('org-', '') : '';
        const localOrgPass = typeof window !== 'undefined' && cleanOrgId
          ? (localStorage.getItem(`ecoestate-org-pass-${cleanOrgId}`) || localStorage.getItem(`ecoestate-org-pass-${targetOrg?.id}`))
          : null;
        const rawPass = targetOrg?.assignedPassword;
        const isBulletMasked = !rawPass || rawPass.includes('•');
        const pass = localOrgPass || localSavedPass || (currentUser as any)?.password || (!isBulletMasked ? rawPass : '') || 'estate@2026';
        setActivePassword(pass);
        setEditedPasswordVal(pass);
        setIsEditingPassword(false);
      }
      setSaNewPassword('');
      setSaConfirmPassword('');
    }
  }, [isOpen, targetOrg, currentUser, isTenantView]);

  if (!isOpen || !currentUser) return null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Save inline password update
  const handleSaveInlinePassword = async () => {
    if (!editedPasswordVal.trim()) {
      triggerToast('⚠️ Password cannot be empty!');
      return;
    }

    setIsSaving(true);
    try {
      const newPass = editedPasswordVal.trim();
      setActivePassword(newPass);
      setEditedPasswordVal(newPass);

      const effectiveOrg = targetOrg || activeOrg;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ecoestate-user-password', newPass);
        if (effectiveOrg?.id) {
          const cleanId = effectiveOrg.id.replace('org-', '');
          localStorage.setItem(`ecoestate-org-pass-${cleanId}`, newPass);
          localStorage.setItem(`ecoestate-org-pass-${effectiveOrg.id}`, newPass);
        }
      }

      updateProfile({
        password: newPass,
      });

      if (effectiveOrg) {
        effectiveOrg.assignedPassword = newPass;
        updateOrganization(effectiveOrg.id, {
          assignedPassword: newPass,
        });

        const numericOrgId = effectiveOrg.id.replace('org-', '');
        if (/^\d+$/.test(numericOrgId)) {
          DjangoApi.updateOrganization(numericOrgId, {
            assigned_password: newPass,
          }).catch(() => {});
        }
      }

      setShowPassword(true);
      setIsEditingPassword(false);
      triggerToast('✅ Password changed successfully!');
    } catch (err) {
      console.error('Failed to update password:', err);
      triggerToast('⚠️ Failed to persist password update');
    } finally {
      setIsSaving(false);
    }
  };

  // Save inline email update
  const handleSaveInlineEmail = async () => {
    if (!editedEmailVal.trim()) {
      triggerToast('⚠️ Email cannot be empty!');
      return;
    }
    setIsSaving(true);
    try {
      const newEmail = editedEmailVal.trim().toLowerCase();
      setAdminEmail(newEmail);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ecoestate-user-email', newEmail);
      }
      updateProfile({ email: newEmail });
      const effectiveOrg = targetOrg || activeOrg;
      if (effectiveOrg) {
        updateOrganization(effectiveOrg.id, { assignedAdminEmail: newEmail });
        const numericOrgId = effectiveOrg.id.replace('org-', '');
        if (/^\d+$/.test(numericOrgId)) {
          DjangoApi.updateOrganization(numericOrgId, { assigned_admin_email: newEmail }).catch(() => {});
        }
      }
      setIsEditingEmail(false);
      triggerToast('✅ Login Email updated successfully!');
    } catch (err) {
      triggerToast('⚠️ Failed to update email');
    } finally {
      setIsSaving(false);
    }
  };

  // Save inline name update
  const handleSaveInlineName = async () => {
    if (!editedNameVal.trim()) {
      triggerToast('⚠️ Name cannot be empty!');
      return;
    }
    setIsSaving(true);
    try {
      const newName = editedNameVal.trim();
      setAdminName(newName);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ecoestate-user-name', newName);
      }
      updateProfile({ name: newName });
      const effectiveOrg = targetOrg || activeOrg;
      if (effectiveOrg) {
        updateOrganization(effectiveOrg.id, { assignedAdminName: newName });
        const numericOrgId = effectiveOrg.id.replace('org-', '');
        if (/^\d+$/.test(numericOrgId)) {
          DjangoApi.updateOrganization(numericOrgId, { assigned_admin_name: newName }).catch(() => {});
        }
      }
      setIsEditingName(false);
      triggerToast('✅ Full Name updated successfully!');
    } catch (err) {
      triggerToast('⚠️ Failed to update name');
    } finally {
      setIsSaving(false);
    }
  };

  // SuperAdmin Portal Profile Form Submit
  const handleSuperAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saNewPassword && saNewPassword !== saConfirmPassword) {
      triggerToast('⚠️ Passwords do not match!');
      return;
    }

    setIsSaving(true);
    try {
      const passwordToSave = ((isEditingPassword || editedPasswordVal !== activePassword) && editedPasswordVal.trim())
        ? editedPasswordVal.trim()
        : saNewPassword.trim() || undefined;

      updateProfile({
        name: saName.trim(),
        email: saEmail.trim().toLowerCase(),
        title: saTitle.trim(),
        ...(passwordToSave ? { password: passwordToSave } : {}),
      });

      if (passwordToSave) {
        setActivePassword(passwordToSave);
        setIsEditingPassword(false);

        const effectiveOrg = targetOrg || activeOrg;
        if (effectiveOrg) {
          updateOrganization(effectiveOrg.id, {
            assignedPassword: passwordToSave,
          });

          const numericOrgId = effectiveOrg.id.replace('org-', '');
          if (/^\d+$/.test(numericOrgId)) {
            DjangoApi.updateOrganization(numericOrgId, {
              assigned_password: passwordToSave,
            }).catch(() => {});
          }
        }
      }

      triggerToast('✅ Profile & Password updated successfully!');
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update superadmin profile:', err);
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
              {isTenantView
                ? (adminName || targetOrg?.name || 'AD').slice(0, 2).toUpperCase()
                : (saName || 'ME').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                {isTenantView ? 'Designated Estate Administrator' : 'Account Profile & Security'}
              </h2>
              <p className="text-xs text-slate-300">
                {isTenantView
                  ? `${targetOrg?.name || 'Campus'} • Assigned Management Post`
                  : 'National SuperAdmin Console'}
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

        {/* Body Content */}
        {isTenantView ? (
          /* ================= ASSIGNED FACILITY ADMINISTRATOR VIEW (CLEAN, FROZEN, NO SUPERADMIN TABS) ================= */
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Full Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-500" /> Full Name
                </label>
                {!isEditingName && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedNameVal(adminName);
                      setIsEditingName(true);
                    }}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Name
                  </button>
                )}
              </div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedNameVal}
                    onChange={(e) => setEditedNameVal(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 rounded-xl border border-cyan-500 bg-white dark:bg-[#07080e] text-xs font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveInlineName}
                    disabled={isSaving}
                    className="p-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold transition-all cursor-pointer flex-shrink-0"
                    title="Save Name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedNameVal(adminName);
                      setIsEditingName(false);
                    }}
                    className="p-2 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 transition-all cursor-pointer flex-shrink-0"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] bg-[#f5efe6]/70 dark:bg-[#07080e]/70 text-xs font-bold text-stone-900 dark:text-slate-100 select-all">
                  {adminName || currentUser?.name || 'HARI PANGI'}
                </div>
              )}
            </div>

            {/* Authorized Email Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-500" /> Authorized Email Address
                </label>
                {!isEditingEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedEmailVal(adminEmail);
                      setIsEditingEmail(true);
                    }}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Email
                  </button>
                )}
              </div>
              {isEditingEmail ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={editedEmailVal}
                    onChange={(e) => setEditedEmailVal(e.target.value)}
                    placeholder="Enter email (e.g. yourname@gmail.com)"
                    className="w-full px-3 py-2 rounded-xl border border-cyan-500 bg-white dark:bg-[#07080e] text-xs font-mono font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveInlineEmail}
                    disabled={isSaving}
                    className="p-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold transition-all cursor-pointer flex-shrink-0"
                    title="Save Email"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedEmailVal(adminEmail);
                      setIsEditingEmail(false);
                    }}
                    className="p-2 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 transition-all cursor-pointer flex-shrink-0"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-cyan-500/30 bg-[#f5efe6]/70 dark:bg-[#07080e]/70 text-xs font-mono font-bold text-stone-900 dark:text-cyan-300 select-all">
                  {adminEmail || currentUser?.email || 'haripangi335@gmail.com'}
                </div>
              )}
            </div>

            {/* Professional Title / Designation (Frozen) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-500" /> Professional Title / Designation
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] bg-[#f5efe6]/70 dark:bg-[#07080e]/70 text-xs font-medium text-stone-800 dark:text-slate-200 select-none cursor-default">
                {adminTitle || `Estate Administrator - ${targetOrg?.name || 'Campus'}`}
              </div>
            </div>

            {/* Assigned Role & Facility Scope Badges */}
            <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/40 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 block tracking-wider">
                  ASSIGNED ROLE
                </span>
                <strong className="text-stone-900 dark:text-white font-extrabold text-sm">
                  ESTATE ADMIN
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                  FACILITY SCOPE
                </span>
                <span className="font-extrabold text-cyan-700 dark:text-cyan-300 text-sm">
                  {targetOrg?.name || 'gcek'}
                </span>
              </div>
            </div>

            {/* Active Login Password with Inline Pencil Edit Icon */}
            <div className="pt-2 border-t border-[#ece3d6] dark:border-[#151722] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Active Login Password
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>

              {/* Password Display / Edit Card */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block tracking-wider">
                    CURRENT PASSWORD
                  </span>
                  {isEditingPassword ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={editedPasswordVal}
                          onChange={(e) => setEditedPasswordVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveInlinePassword();
                            }
                          }}
                          placeholder="Enter New Password"
                          className="px-3 py-1.5 pr-8 rounded-xl border border-amber-500 bg-white dark:bg-[#07080e] text-xs font-mono font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 w-full"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveInlinePassword}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold transition-all cursor-pointer flex-shrink-0"
                        title="Save Password"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedPasswordVal(activePassword);
                          setIsEditingPassword(false);
                        }}
                        className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 transition-all cursor-pointer flex-shrink-0"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono font-extrabold text-sm text-stone-900 dark:text-white tracking-wider block mt-0.5 select-all">
                      {showPassword ? (activePassword && !activePassword.includes('•') ? activePassword : 'estate@2026') : '••••••••••••'}
                    </span>
                  )}
                </div>

                {!isEditingPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedPasswordVal(activePassword && !activePassword.includes('•') ? activePassword : '');
                      setShowPassword(true);
                      setIsEditingPassword(true);
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-[#131622] border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5 font-bold shadow-sm"
                    title="Edit Active Password"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#ece3d6] dark:border-[#151722]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] text-xs font-bold hover:bg-stone-100 dark:hover:bg-[#151722] cursor-pointer"
              >
                Close
              </button>
              {(isEditingPassword || isEditingEmail || isEditingName || (editedPasswordVal && editedPasswordVal !== activePassword)) && (
                <button
                  type="button"
                  onClick={async () => {
                    if (isEditingEmail) await handleSaveInlineEmail();
                    if (isEditingName) await handleSaveInlineName();
                    if (isEditingPassword || (editedPasswordVal && editedPasswordVal !== activePassword)) await handleSaveInlinePassword();
                  }}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ================= SUPERADMIN PORTAL VIEW (FOR ROOT CONSOLE ONLY) ================= */
          <form onSubmit={handleSuperAdminSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-500" /> Full Name
              </label>
              <input
                type="text"
                required
                value={saName}
                onChange={(e) => setSaName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] bg-[#fbf8f3] dark:bg-[#07080e] text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-500" /> Authorized Email Address
              </label>
              <input
                type="email"
                required
                value={saEmail}
                onChange={(e) => setSaEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] bg-[#fbf8f3] dark:bg-[#07080e] text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-500" /> Professional Title / Designation
              </label>
              <input
                type="text"
                value={saTitle}
                onChange={(e) => setSaTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] bg-[#fbf8f3] dark:bg-[#07080e] text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/40 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 block">
                  ASSIGNED ROLE
                </span>
                <strong className="text-stone-900 dark:text-white font-extrabold">{currentUser.role}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">FACILITY SCOPE</span>
                <span className="font-semibold text-stone-700 dark:text-slate-300">All National Campuses</span>
              </div>
            </div>

            {/* Active Login Password with Inline Pencil Edit Icon */}
            <div className="pt-2 border-t border-[#ece3d6] dark:border-[#151722] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Active Login Password
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSaShowPassword(!saShowPassword)}
                    className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {saShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{saShowPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>

              {/* Password Display / Edit Card with Pencil Icon */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block tracking-wider">
                    CURRENT PASSWORD
                  </span>
                  {isEditingPassword ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type={saShowPassword ? 'text' : 'password'}
                        value={editedPasswordVal}
                        onChange={(e) => setEditedPasswordVal(e.target.value)}
                        placeholder="Enter New Password"
                        className="px-3 py-1.5 rounded-xl border border-amber-500/50 bg-white dark:bg-[#07080e] text-xs font-mono font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 w-full max-w-[200px]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveInlinePassword}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold transition-all cursor-pointer"
                        title="Save Password"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedPasswordVal(activePassword || 'estate@2026');
                          setIsEditingPassword(false);
                        }}
                        className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 transition-all cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono font-extrabold text-sm text-stone-900 dark:text-white tracking-wider block mt-0.5 select-all">
                      {saShowPassword ? (activePassword && !activePassword.includes('•') ? activePassword : 'estate@2026') : '••••••••••••'}
                    </span>
                  )}
                </div>

                {!isEditingPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedPasswordVal(activePassword || 'estate@2026');
                      setIsEditingPassword(true);
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-[#131622] border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5 font-bold shadow-sm"
                    title="Edit Active Password"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Edit</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#ece3d6] dark:border-[#151722]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#ece3d6] dark:border-[#1d2030] text-xs font-bold hover:bg-stone-100 dark:hover:bg-[#151722] cursor-pointer"
              >
                Close
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
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
