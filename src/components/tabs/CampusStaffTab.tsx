'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Role, User } from '@/types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Lock,
  Building2,
  Mail,
  Zap,
  Wrench,
  Radio,
  Eye,
  Crown,
  Search,
  Check,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

import { Organization } from '@/types';
import { DjangoApi } from '@/services/api';

interface CampusStaffTabProps {
  onSimulateRole?: (role: Role) => void;
  org?: Organization;
}

export const CampusStaffTab: React.FC<CampusStaffTabProps> = ({ onSimulateRole, org }) => {
  const {
    activeOrg: contextOrg,
    users,
    addUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    currentUser,
  } = useAuth();
  const activeOrg = org || contextOrg;

  const [dbStaff, setDbStaff] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('ESTATE_MANAGER');
  const [title, setTitle] = useState('');

  const fetchStaff = async () => {
    if (!activeOrg?.id) return;
    try {
      const data = await DjangoApi.getStaffMembers(activeOrg.id);
      if (Array.isArray(data)) {
        setDbStaff(data);
      }
    } catch (e) {
      console.warn('Failed to fetch staff from NeonDB:', e);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [activeOrg?.id]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Map dbStaff or fallback to users
  const rawList: User[] = dbStaff.length > 0
    ? dbStaff.map((s) => ({
        id: `user-${s.id}`,
        name: s.name,
        email: s.email,
        role: s.role as Role,
        organizationId: `org-${s.organization_id || s.organization}`,
        organizationName: activeOrg?.name || 'Assigned Institution',
        title: s.title || `${s.role} - Staff`,
        status: (s.status as 'Active' | 'Inactive') || 'Active',
        lastActive: s.last_active || 'Connected to NeonDB',
      }))
    : users;

  // Filter users belonging to current organization (or national superadmin)
  const campusUsers = rawList.filter((u) => {
    if (u.organizationId && activeOrg?.id) {
      const cleanU = u.organizationId.replace('org-', '');
      const cleanO = activeOrg.id.replace('org-', '');
      return cleanU === cleanO;
    }
    return u.role !== 'SUPERADMIN';
  });

  const filteredStaff = campusUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newStaff: Omit<User, 'id'> = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      organizationId: activeOrg?.id || 'org-current',
      organizationName: activeOrg?.name || 'Assigned Institution',
      title: title.trim() || `${getRoleConfig(role).label} - ${activeOrg?.name || 'Campus'}`,
      status: 'Active',
      lastActive: 'Just registered',
    };

    addUser(newStaff);
    setName('');
    setEmail('');
    setTitle('');
    setShowAddModal(false);
    triggerToast(`Added ${newStaff.name} as ${getRoleConfig(role).label}!`);
    setTimeout(fetchStaff, 600);
  };

  const getRoleConfig = (r: Role) => {
    switch (r) {
      case 'ORG_ADMIN':
        return {
          label: 'Estate Admin',
          badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
          icon: Crown,
          desc: 'Full administrative control over campus facilities, staff access, and telemetry configuration.',
        };
      case 'ESTATE_MANAGER':
        return {
          label: 'Estate Manager',
          badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          icon: Wrench,
          desc: 'Asset maintenance, equipment digital twin, waste collection logistics, and water pump operations.',
        };
      case 'ENERGY_AUDITOR':
        return {
          label: 'Energy Auditor',
          badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
          icon: Zap,
          desc: 'Solar microgrid analytics, peak demand management, ESG GRIHA sustainability, and AI simulation.',
        };
      case 'ORG_OPERATOR':
        return {
          label: 'SCADA Operator',
          badgeBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
          icon: Radio,
          desc: 'Live IoT sensor beacons, LAN/WiFi packet streams, water pump actuators, and real-time alert thresholds.',
        };
      case 'FACILITY_VIEWER':
      default:
        return {
          label: 'Facility Viewer',
          badgeBg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30',
          icon: Eye,
          desc: 'Read-only campus visibility for faculty, students, and visitors. Air quality index and EV parking bays.',
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 select-none pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{toastMessage}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-500">RBAC Active</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
              <Crown className="w-3.5 h-3.5" />
              <span>Campus Role-Based Access Control (RBAC)</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f5efe6] dark:bg-[#0a0b12] text-stone-700 dark:text-slate-300 border border-[#ece3d6] dark:border-[#151722]">
              {activeOrg?.name || 'Institution Workspace'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Campus Staff & Role Management
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            As the lead administrator for <strong>{activeOrg?.name}</strong>, you configure and assign specialized dashboard portals tailored specifically for each staff member&apos;s daily operational duties.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Add Campus Staff Member
        </button>
      </div>

      {/* 4 Role Architecture Cards (Displays what each role gets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { role: 'ESTATE_MANAGER' as Role, count: campusUsers.filter((u) => u.role === 'ESTATE_MANAGER').length },
          { role: 'ENERGY_AUDITOR' as Role, count: campusUsers.filter((u) => u.role === 'ENERGY_AUDITOR').length },
          { role: 'ORG_OPERATOR' as Role, count: campusUsers.filter((u) => u.role === 'ORG_OPERATOR').length },
          { role: 'FACILITY_VIEWER' as Role, count: campusUsers.filter((u) => u.role === 'FACILITY_VIEWER').length },
        ].map(({ role: r, count }) => {
          const cfg = getRoleConfig(r);
          const Icon = cfg.icon;
          return (
            <div
              key={r}
              className="p-5 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#ece3d6] dark:border-[#151722]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#f5efe6] dark:bg-[#0a0b12]">
                      <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="font-extrabold text-xs text-stone-900 dark:text-white">
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] text-stone-700 dark:text-slate-300">
                    {count} Active
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {cfg.desc}
                </p>
              </div>

              {onSimulateRole && (
                <button
                  onClick={() => onSimulateRole(r)}
                  className="w-full py-1.5 px-3 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] hover:border-cyan-500 text-stone-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Simulate Dashboard</span>
                  <ArrowRight className="w-3 h-3 text-cyan-500" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Staff Directory Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm space-y-4">
        {/* Table Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search staff by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="ALL">All Roles ({campusUsers.length})</option>
              <option value="ORG_ADMIN">Estate Admin</option>
              <option value="ESTATE_MANAGER">Estate Manager</option>
              <option value="ENERGY_AUDITOR">Energy Auditor</option>
              <option value="ORG_OPERATOR">SCADA Operator</option>
              <option value="FACILITY_VIEWER">Facility Viewer</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#ece3d6] dark:border-[#151722]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-600 dark:text-slate-400 font-bold border-b border-[#ece3d6] dark:border-[#151722]">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Assigned Role & Portal</th>
                <th className="py-3 px-4">Department / Designation</th>
                <th className="py-3 px-4">Access Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece3d6] dark:divide-[#151722] bg-white dark:bg-[#07080e]">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    No staff members match the selected filter. Click &ldquo;Add Campus Staff Member&rdquo; to enroll personnel.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((u) => {
                  const cfg = getRoleConfig(u.role);
                  const Icon = cfg.icon;
                  const isCurrent = u.id === currentUser?.id || u.email === currentUser?.email;

                  return (
                    <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-[#0c0e17] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-stone-400 dark:text-slate-500 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 ${cfg.badgeBg}`}>
                            <Icon className="w-3 h-3" />
                            <span>{cfg.label}</span>
                          </span>

                          {/* Quick Role Select */}
                          <select
                            value={u.role}
                            onChange={(e) => {
                              updateUserRole(u.id, e.target.value as Role);
                              triggerToast(`Updated role for ${u.name} to ${getRoleConfig(e.target.value as Role).label}`);
                            }}
                            className="text-[11px] py-0.5 px-2 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-700 dark:text-slate-300 font-medium"
                          >
                            <option value="ESTATE_MANAGER">Estate Manager</option>
                            <option value="ENERGY_AUDITOR">Energy Auditor</option>
                            <option value="ORG_OPERATOR">SCADA Operator</option>
                            <option value="FACILITY_VIEWER">Facility Viewer</option>
                            <option value="ORG_ADMIN">Estate Admin</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-stone-600 dark:text-slate-300 font-medium">
                        {u.title || 'Facility Operations Staff'}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            const next = u.status === 'Inactive' ? 'Active' : 'Inactive';
                            updateUserStatus(u.id, next);
                            triggerToast(`Access status for ${u.name} changed to ${next}`);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            u.status === 'Inactive'
                              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {u.status || 'Active'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSimulateRole && (
                            <button
                              onClick={() => onSimulateRole(u.role)}
                              className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold transition-colors cursor-pointer"
                              title="Preview dashboard as this role"
                            >
                              View as Role
                            </button>
                          )}

                          {!isCurrent && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Revoke credentials and remove ${u.name}?`)) {
                                  deleteUser(u.id);
                                  setDbStaff((prev) => prev.filter((s) => `user-${s.id}` !== u.id && String(s.id) !== u.id));
                                  triggerToast(`Removed ${u.name} from campus staff.`);
                                  setTimeout(fetchStaff, 500);
                                }
                              }}
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Delete staff account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Campus Staff Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-500" />
                <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                  Add Campus Staff Member
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-stone-500 dark:text-slate-400 leading-relaxed">
              Enroll a new administrator or technician for <strong>{activeOrg?.name}</strong>. Their dashboard modules will be automatically configured according to their assigned role.
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">Staff Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. Subrat Mohapatra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">Official Campus Email:</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. subrat.m@campus.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">Operational Role:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white font-bold"
                >
                  <option value="ESTATE_MANAGER">🏢 Estate Manager (Maintenance & Waste)</option>
                  <option value="ENERGY_AUDITOR">⚡ Energy Auditor (Solar, Grid & ESG GRIHA)</option>
                  <option value="ORG_OPERATOR">🎛️ SCADA Operator (Live IoT & Actuators)</option>
                  <option value="FACILITY_VIEWER">👁️ Facility Viewer (Read-Only Campus Twin)</option>
                  <option value="ORG_ADMIN">👑 Estate Admin (Full Administrative Authority)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">Department / Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Substation Lead / Water STP Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow-md cursor-pointer"
                >
                  Issue Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusStaffTab;
