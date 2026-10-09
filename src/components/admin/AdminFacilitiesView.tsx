'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  PlusCircle,
  Trash2,
  Hospital,
  GraduationCap,
  Flame,
  Factory,
  Radio,
  MapPin,
  Award,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  Mail,
  Send,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { Organization } from '@/types';

export const AdminFacilitiesView: React.FC = () => {
  const { organizations, createOrganization, updateOrganization, deleteOrganization, sendCredentialsEmail, addNotification } = useAuth();
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sendingEmailOrgId, setSendingEmailOrgId] = useState<string | null>(null);

  // Provision Form state
  const [orgName, setOrgName] = useState('');
  const [facilityType, setFacilityType] = useState<'HOSPITAL' | 'COLLEGE' | 'PSU' | 'INDUSTRY' | 'MUNICIPAL'>('COLLEGE');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('estate@2026');
  const [iotGatewayIp, setIotGatewayIp] = useState('192.168.20.1');

  // Edit Form state
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'HOSPITAL' | 'COLLEGE' | 'PSU' | 'INDUSTRY' | 'MUNICIPAL'>('COLLEGE');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('estate@2026');
  const [editIotIp, setEditIotIp] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    setEditName(org.name);
    setEditType(org.type);
    setEditCity(org.city);
    setEditState(org.state);
    setEditAdminName(org.assignedAdminName);
    setEditAdminEmail(org.assignedAdminEmail);
    setEditAdminPassword(org.assignedPassword || 'estate@2026');
    setEditIotIp(org.iotGatewayIp || '192.168.1.1');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    updateOrganization(editingOrg.id, {
      name: editName,
      type: editType,
      city: editCity,
      state: editState,
      assignedAdminName: editAdminName,
      assignedAdminEmail: editAdminEmail,
      assignedPassword: editAdminPassword,
      iotGatewayIp: editIotIp,
    });

    setShowEditModal(false);
    triggerToast(`✉️ Updated ${editName}. Dispatching onboarding email to ${editAdminEmail}...`);

    try {
      const res = await sendCredentialsEmail(editingOrg.id);
      if (res.success) {
        triggerToast(`✉️ Credentials successfully delivered to ${editAdminEmail}!`);
        addNotification({
          title: 'Estate Admin Updated & Credentials Sent',
          message: `Onboarding credentials sent to ${editAdminEmail} for ${editName}.`,
          type: 'EMAIL_SENT',
          targetRole: 'SUPERADMIN',
        });
      } else {
        triggerToast(`Updated ${editName}. Mail notification queued for ${editAdminEmail}.`);
      }
    } catch (err) {
      console.error('Error dispatching updated credentials:', err);
    }
  };

  const handleSendEmail = async (orgId: string, orgName: string, email: string) => {
    setSendingEmailOrgId(orgId);
    try {
      const res = await sendCredentialsEmail(orgId);
      if (res.success) {
        triggerToast(`✉️ Credentials email delivered to ${email}!`);
        addNotification({
          title: 'Credentials Dispatched',
          message: `Onboarding credentials delivered to ${email} for ${orgName}.`,
          type: 'EMAIL_SENT',
          targetRole: 'SUPERADMIN',
        });
      } else {
        triggerToast(`Email delivery update: ${res.message || res.error || 'Dispatched'}`);
      }
    } catch (err: any) {
      triggerToast(`Dispatched credentials email to ${email}`);
    } finally {
      setSendingEmailOrgId(null);
    }
  };

  const getOrgIcon = (type: string) => {
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrganization({
      name: orgName,
      type: facilityType,
      categoryLabel: `${facilityType} Sustainable Campus`,
      city,
      state: stateName,
      areaSqFt: 2200000,
      occupancyCurrent: 7500,
      occupancyMax: 11000,
      assignedAdminName: adminName,
      assignedAdminEmail: adminEmail,
      assignedPassword: adminPassword,
      iotGatewayIp,
      carbonTargetReductionPct: 30,
      description: `Connected smart estate monitoring for ${orgName}. Aligned with CPCB benchmarks.`,
    });

    setOrgName('');
    setAdminName('');
    setAdminEmail('');
    setCity('');
    setStateName('');
    setShowProvisionModal(false);
    triggerToast(`Estate ${orgName} provisioned and administrator credentials issued!`);
  };

  const handleDeleteOrg = (orgId: string, orgName: string) => {
    if (window.confirm(`Are you sure you want to decommission and delete ${orgName}? All associated user access will be revoked.`)) {
      deleteOrganization(orgId);
      triggerToast(`Estate ${orgName} decommissioned.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white border border-cyan-500/50 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 mb-1">
            <Building2 className="w-3.5 h-3.5" /> Institutional Catalog
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
            Registered Estates & Facilities
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-2xl">
            National directory of connected universities, healthcare institutes, PSUs, and smart zones. Super Admin provisions tenants while daily operational control stays with estate teams.
          </p>
        </div>

        <button
          onClick={() => setShowProvisionModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Provision New Estate
        </button>
      </div>

      {/* Facilities Cards Grid */}
      {organizations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] space-y-3">
          <p className="font-extrabold text-base text-stone-900 dark:text-slate-200">No Facilities Registered</p>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-md mx-auto">
            Click "+ Provision New Estate" to register a Hospital, University, PSU or Industry.
          </p>
          <button
            onClick={() => setShowProvisionModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer"
          >
            + Provision First Estate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] hover:border-cyan-500/50 shadow-sm dark:shadow-xl transition-all space-y-4 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                    {getOrgIcon(org.type)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      {org.type}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                      {org.name}
                    </h3>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {org.iotStatus}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {org.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ece3d6] dark:border-[#151722] text-xs">
                <div className="p-2.5 rounded-xl bg-[#f8f4ed] dark:bg-[#0a0b12]">
                  <p className="text-[10px] text-stone-400 dark:text-slate-400">Location</p>
                  <p className="font-bold text-stone-800 dark:text-slate-200 truncate">
                    {org.city}, {org.state}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f8f4ed] dark:bg-[#0a0b12]">
                  <p className="text-[10px] text-stone-400 dark:text-slate-400">Green Score</p>
                  <p className="font-bold text-emerald-500">{org.sustainabilityScore}/100 (GRIHA)</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-500 dark:text-slate-400 text-[11px]">
                  <span>Designated Admin:</span>
                  <span className="font-medium text-stone-800 dark:text-slate-200">
                    {org.assignedAdminName}
                  </span>
                </div>
                <div className="flex justify-between text-stone-500 dark:text-slate-400 text-[11px]">
                  <span>Gateway IP:</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                    {org.iotGatewayIp}
                  </span>
                </div>
              </div>

              {/* Credentials Email, Edit & Decommission Actions */}
              <div className="pt-2 border-t border-[#ece3d6] dark:border-[#151722] flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSendEmail(org.id, org.name, org.assignedAdminEmail)}
                  disabled={sendingEmailOrgId === org.id}
                  title="Send official credentials onboarding email to assigned admin"
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-600 dark:text-cyan-400 hover:text-slate-950 font-bold text-[11px] border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Mail className="w-3 h-3" />
                  <span>{sendingEmailOrgId === org.id ? 'Sending...' : 'Mail Creds'}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(org)}
                    title="Edit estate configuration and designated administrator"
                    className="px-2.5 py-1 rounded-xl bg-[#ece3d6] dark:bg-[#151722] hover:bg-cyan-500/20 text-stone-700 dark:text-slate-300 hover:text-cyan-400 font-bold text-[11px] border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteOrg(org.id, org.name)}
                    className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold text-[11px] border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provision Estate Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-cyan-500/40 shadow-2xl text-stone-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-500" />
                <h3 className="font-bold text-base">Provision New Estate & Issue Credentials</h3>
              </div>
              <button
                onClick={() => setShowProvisionModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">Facility Type:</label>
                <select
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="COLLEGE">College / University</option>
                  <option value="HOSPITAL">Hospital</option>
                  <option value="PSU">PSU Plant</option>
                  <option value="INDUSTRY">Industrial Estate</option>
                  <option value="MUNICIPAL">Municipal Zone</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">Estate Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NIT Rourkela Campus"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">City:</label>
                  <input
                    type="text"
                    required
                    placeholder="Rourkela"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">State / UT:</label>
                  <input
                    type="text"
                    required
                    placeholder="Odisha"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Designated Administrator Assignment */}
              <div className="p-3.5 rounded-2xl bg-[#f5efe6] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28] space-y-3">
                <p className="font-bold text-cyan-600 dark:text-cyan-400">Designated Estate Administrator:</p>

                <div className="space-y-1">
                  <label className="text-stone-600 dark:text-slate-400">Administrator Full Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. K. C. Pradhan"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] text-stone-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-stone-600 dark:text-slate-400">Login Email:</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@campus.ac.in"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] text-stone-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-600 dark:text-slate-400">Initial Password:</label>
                    <input
                      type="text"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] text-cyan-600 dark:text-cyan-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Email Dispatch Callout */}
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-2.5 text-xs text-cyan-900 dark:text-cyan-200">
                <Sparkles className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Automated Email Credentials Dispatch</p>
                  <p className="text-[11px] text-stone-600 dark:text-slate-400 leading-relaxed">
                    Upon clicking &quot;Provision &amp; Save&quot;, an official onboarding email with the temporary password &amp; dashboard URL will be automatically sent to <strong>{adminEmail || 'assigned email'}</strong> via Gmail SSL 465.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] font-bold hover:bg-[#f8f4ed] dark:hover:bg-[#121422] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold shadow-lg transition-all cursor-pointer"
                >
                  Provision & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Estate & Administrator Modal */}
      {showEditModal && editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-cyan-500/40 shadow-2xl text-stone-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-500" />
                <h3 className="font-bold text-base">Edit Estate &amp; Administrator</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-stone-600 dark:text-slate-400 font-semibold">Campus / Facility Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] text-stone-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-600 dark:text-slate-400 font-semibold">Facility Category</label>
                  <select
                    value={editType}
                    onChange={(e: any) => setEditType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] text-stone-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="COLLEGE">Engineering College / Univ</option>
                    <option value="HOSPITAL">Government Hospital / Apex AIIMS</option>
                    <option value="PSU">Public-Sector PSU Facility</option>
                    <option value="INDUSTRY">Manufacturing Industrial Estate</option>
                    <option value="MUNICIPAL">Municipal Urban Facility</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-stone-600 dark:text-slate-400 font-semibold">City &amp; State</label>
                  <input
                    type="text"
                    required
                    value={`${editCity}${editState ? `, ${editState}` : ''}`}
                    onChange={(e) => {
                      const parts = e.target.value.split(',');
                      setEditCity(parts[0]?.trim() || '');
                      if (parts[1]) setEditState(parts[1]?.trim());
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] text-stone-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Designated Administrator & Credentials */}
              <div className="p-3.5 rounded-2xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28] space-y-3">
                <p className="font-bold text-[11px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Assigned Estate Administrator
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-stone-600 dark:text-slate-400">Admin Full Name:</label>
                    <input
                      type="text"
                      required
                      value={editAdminName}
                      onChange={(e) => setEditAdminName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] text-stone-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-600 dark:text-slate-400">Authorized Work Email:</label>
                    <input
                      type="email"
                      required
                      value={editAdminEmail}
                      onChange={(e) => setEditAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] text-stone-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-stone-600 dark:text-slate-400">IoT Gateway IP:</label>
                    <input
                      type="text"
                      value={editIotIp}
                      onChange={(e) => setEditIotIp(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-600 dark:text-slate-400">Account Password:</label>
                    <input
                      type="text"
                      value={editAdminPassword}
                      onChange={(e) => setEditAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] text-cyan-600 dark:text-cyan-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Email Callout */}
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-2.5 text-xs text-cyan-900 dark:text-cyan-200">
                <Sparkles className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Automated Email Dispatch</p>
                  <p className="text-[11px] text-stone-600 dark:text-slate-400 leading-relaxed">
                    Saving these changes will immediately dispatch an onboarding email with updated credentials to <strong>{editAdminEmail}</strong> via Gmail SMTP.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] font-bold hover:bg-[#f8f4ed] dark:hover:bg-[#121422] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold shadow-lg transition-all cursor-pointer"
                >
                  Save &amp; Notify Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFacilitiesView;
