'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Settings,
  Shield,
  Key,
  Bell,
  Database,
  Lock,
  CheckCircle2,
  RefreshCw,
  Download,
  AlertTriangle,
  Save,
  Sliders,
  FileText,
} from 'lucide-react';
import { INITIAL_ORGANIZATIONS, DEMO_USERS } from '@/data/mockData';

export const AdminSettingsView: React.FC = () => {
  const { organizations, users } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'roles' | 'notifications' | 'backup'>('general');
  const [platformName, setPlatformName] = useState('EcoEstate INDIA National Smart Intelligence Platform');
  const [supportEmail, setSupportEmail] = useState('support@ecoestate.gov.in');
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [strictPasswordPolicy, setStrictPasswordPolicy] = useState(true);
  const [auditLogRetentionDays, setAuditLogRetentionDays] = useState(90);
  const [alertCriticalSensors, setAlertCriticalSensors] = useState(true);
  const [alertWeeklyReport, setAlertWeeklyReport] = useState(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const triggerSavedNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSavedNotice('Platform governance & security settings successfully saved!');
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all demo organizations and users to official national defaults? This will restore BPUT, AIIMS, ONGC, Tata Steel, and BMC.')) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ecoestate-organizations', JSON.stringify(INITIAL_ORGANIZATIONS));
        localStorage.setItem('ecoestate-users', JSON.stringify(DEMO_USERS));
        window.location.reload();
      }
    }
  };

  const handleExportAuditLog = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,ID,User,Role,Organization,Status,LastActive\n' +
      users.map((u) => `"${u.id}","${u.name}","${u.role}","${u.organizationName || 'National'}","${u.status || 'Active'}","${u.lastActive || 'Today'}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ecoestate_user_governance_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSavedNotice('User Governance Audit CSV exported successfully.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {savedNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white border border-cyan-500/50 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-semibold">{savedNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 mb-1">
            <Settings className="w-3.5 h-3.5" /> Platform Settings & Governance Matrix
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
            System Administration & Policy Controls
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-2xl">
            Configure system-wide identity rules, RBAC role permissions, security enforcement, and compliance audit exports.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#ece3d6] dark:border-[#151722] gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'general', label: 'General Configuration', icon: Sliders },
          { id: 'security', label: 'Security & 2FA Policies', icon: Shield },
          { id: 'roles', label: 'RBAC Permission Matrix', icon: Lock },
          { id: 'notifications', label: 'Alert Channels', icon: Bell },
          { id: 'backup', label: 'Audit & Maintenance', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 font-bold shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-[#f8f4ed] dark:hover:bg-[#0f111d]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL CONFIGURATION */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl space-y-5 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-stone-700 dark:text-slate-300">National Platform Title:</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-slate-300">Platform Support Email:</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-slate-300">Default Session Inactivity Timeout:</label>
              <select
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white cursor-pointer"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={60}>60 Minutes</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28] space-y-2">
            <p className="font-bold text-stone-800 dark:text-slate-200">Regulatory & Standard Alignment</p>
            <p className="text-stone-500 dark:text-slate-400 text-[11px]">
              Platform follows Central Pollution Control Board (CPCB) continuous CAAQMS guidelines and GRIHA National Green Rating for Integrated Habitat Assessment.
            </p>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md cursor-pointer"
          >
            Save General Settings
          </button>
        </form>
      )}

      {/* TAB 2: SECURITY & 2FA */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl space-y-5 text-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28]">
              <div>
                <p className="font-bold text-stone-900 dark:text-white">Mandatory Two-Factor Authentication (2FA)</p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Require OTP verification on login for all SuperAdmin and Estate Administrator accounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnforce2FA(!enforce2FA)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  enforce2FA ? 'bg-cyan-500' : 'bg-stone-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    enforce2FA ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28]">
              <div>
                <p className="font-bold text-stone-900 dark:text-white">Strict Password Complexity Enforcement</p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Requires 10+ characters, alphanumeric, and symbol characters for campus staff passwords.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStrictPasswordPolicy(!strictPasswordPolicy)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  strictPasswordPolicy ? 'bg-cyan-500' : 'bg-stone-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    strictPasswordPolicy ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28] space-y-2">
              <label className="font-bold text-stone-800 dark:text-slate-200">Security Audit Log Retention Period:</label>
              <select
                value={auditLogRetentionDays}
                onChange={(e) => setAuditLogRetentionDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-white dark:bg-[#07080e] text-stone-900 dark:text-white font-medium cursor-pointer"
              >
                <option value={30}>30 Days</option>
                <option value={90}>90 Days (MeitY Standard)</option>
                <option value={180}>180 Days</option>
                <option value={365}>1 Year (Comprehensive Audit)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => triggerSavedNotice('Security policies updated.')}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer"
          >
            Apply Security Policies
          </button>
        </div>
      )}


      {/* TAB 3: RBAC PERMISSION MATRIX */}
      {activeTab === 'roles' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              Role-Based Access Control (RBAC) Authority Matrix
            </h3>
            <p className="text-stone-500 dark:text-slate-400">
              Clear segregation of duties between Super Administrator and individual Campus staff.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#ece3d6] dark:border-[#151722]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5efe6] dark:bg-[#0a0b12] text-[11px] uppercase font-bold text-stone-500 dark:text-slate-400">
                <tr>
                  <th className="p-3">Role Name</th>
                  <th className="p-3">Manage Users</th>
                  <th className="p-3">Provision Estates</th>
                  <th className="p-3">View Platform Analytics</th>
                  <th className="p-3">Control Campus Devices</th>
                  <th className="p-3">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece3d6] dark:divide-[#151722] text-stone-700 dark:text-slate-300">
                <tr>
                  <td className="p-3 font-bold text-cyan-500">SUPERADMIN</td>
                  <td className="p-3 text-emerald-500 font-bold">Yes (All)</td>
                  <td className="p-3 text-emerald-500 font-bold">Yes</td>
                  <td className="p-3 text-emerald-500 font-bold">Yes (National)</td>
                  <td className="p-3 text-rose-500 font-bold">No (Isolated)</td>
                  <td className="p-3">National HQ</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-purple-500">ORG_ADMIN</td>
                  <td className="p-3 text-stone-400 dark:text-slate-400">Own Campus Only</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3 text-stone-400 dark:text-slate-400">Own Campus Only</td>
                  <td className="p-3 text-emerald-500 font-bold">Full Control</td>
                  <td className="p-3">Designated Estate</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-emerald-500">ESTATE_MANAGER</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3 text-stone-400 dark:text-slate-400">Own Campus Only</td>
                  <td className="p-3 text-emerald-500 font-bold">Facility Operations</td>
                  <td className="p-3">Designated Estate</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-amber-500">ENERGY_AUDITOR</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3 text-stone-400 dark:text-slate-400">Audit Reports</td>
                  <td className="p-3 text-rose-500">Read-Only Logs</td>
                  <td className="p-3">Energy Substation</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-pink-500">ORG_OPERATOR</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3 text-emerald-500 font-bold">Equipment/SCADA</td>
                  <td className="p-3">Substation/STP</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-blue-500">FACILITY_VIEWER</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3 text-stone-400 dark:text-slate-400">Read-Only Scorecard</td>
                  <td className="p-3 text-rose-500">No</td>
                  <td className="p-3">Public / Auditor</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ALERT CHANNELS */}
      {activeTab === 'notifications' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl space-y-4 text-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28]">
              <div>
                <p className="font-bold text-stone-900 dark:text-white">CPCB Critical Exceedance Notifications</p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Notify administrators when institutional PM2.5 or Substation peak loads exceed safe thresholds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAlertCriticalSensors(!alertCriticalSensors)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  alertCriticalSensors ? 'bg-cyan-500' : 'bg-stone-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    alertCriticalSensors ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28]">
              <div>
                <p className="font-bold text-stone-900 dark:text-white">Weekly ESG & Carbon Offset Digest</p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Send executive summary of solar kWh generation and water recycled across all campuses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAlertWeeklyReport(!alertWeeklyReport)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  alertWeeklyReport ? 'bg-cyan-500' : 'bg-stone-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    alertWeeklyReport ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT & MAINTENANCE */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl space-y-5 text-xs">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28] flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-stone-900 dark:text-white">Export User Governance Audit Report</p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Download CSV of all registered accounts, assigned roles, campus associations, and access statuses.
                </p>
              </div>
              <button
                onClick={handleExportAuditLog}
                className="px-4 py-2 rounded-xl bg-[#ece3d6] dark:bg-[#181a28] text-stone-900 dark:text-white font-bold hover:bg-cyan-500 hover:text-slate-950 transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-rose-500">Restore Default Mock Data (5 National Campuses)</p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Reset local storage to original initial national campuses: BPUT Rourkela, AIIMS Bhubaneswar, ONGC Paradip, Tata Steel Jamshedpur, and BMC.
                </p>
              </div>
              <button
                onClick={handleResetDemoData}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <RefreshCw className="w-4 h-4" /> Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsView;
