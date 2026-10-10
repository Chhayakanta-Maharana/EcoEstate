'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Role } from '@/types';
import { DjangoApi } from '@/services/api';
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  KeyRound,
  X,
  AlertTriangle,
  Lock,
  EyeOff,
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const {
    users,
    organizations,
    addUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    currentUser,
    addNotification,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for creating new user
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('ORG_ADMIN');
  const [newOrgId, setNewOrgId] = useState<string>(organizations[0]?.id || '');
  const [newTitle, setNewTitle] = useState('');
  const [newPassword, setNewPassword] = useState('estate@2026');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const roleLabelsMap: Record<string, string> = {
    SUPERADMIN: 'SUPER ADMIN (National)',
    ORG_ADMIN: 'ESTATE ADMIN',
    ESTATE_MANAGER: 'ESTATE MANAGER',
    ENERGY_AUDITOR: 'ENERGY AUDITOR',
    ORG_OPERATOR: 'SCADA OPERATOR',
    FACILITY_VIEWER: 'FACILITY VIEWER',
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrg = organizations.find((o) => o.id === newOrgId);
    const roleLabel = roleLabelsMap[newRole] || newRole.replace('_', ' ');
    const orgName = targetOrg?.name || 'National Estate';
    const emailToNotify = newEmail.trim().toLowerCase();
    const nameToNotify = newName.trim();
    const pwdToNotify = newPassword.trim() || 'estate@2026';

    addUser({
      name: nameToNotify,
      email: emailToNotify,
      role: newRole,
      organizationId: newOrgId,
      organizationName: orgName,
      title: newTitle.trim() || `${roleLabel} - ${orgName}`,
      status: 'Active',
    });

    setNewName('');
    setNewEmail('');
    setNewTitle('');
    setShowAddModal(false);
    triggerToast(`✉️ Sending official credentials email to ${emailToNotify}...`);

    try {
      const res = await DjangoApi.assignUserRoleAndNotify({
        user_name: nameToNotify,
        user_email: emailToNotify,
        role: newRole,
        role_label: roleLabel,
        organization_id: newOrgId,
        organization_name: orgName,
        password: pwdToNotify,
      });
      if (res?.success) {
        triggerToast(`✉️ Credentials email delivered to ${emailToNotify} via Gmail!`);
        addNotification({
          title: 'Role & Credentials Dispatched',
          message: `Official login credentials and role ${roleLabel} delivered to ${emailToNotify}.`,
          type: 'EMAIL_SENT',
          targetRole: 'SUPERADMIN',
        });
      } else {
        triggerToast(`User registered. Email notification queued for ${emailToNotify}.`);
        addNotification({
          title: 'User Registered & Notification Queued',
          message: `User ${nameToNotify} registered. Credentials mailer queued for ${emailToNotify}.`,
          type: 'ROLE_ASSIGNED',
          targetRole: 'SUPERADMIN',
        });
      }
    } catch (err) {
      console.error('Error dispatching user email:', err);
    }
  };

  const handleRoleChange = async (
    userId: string,
    userName: string,
    userEmail: string,
    role: Role,
    orgName?: string
  ) => {
    updateUserRole(userId, role);
    const roleLabel = roleLabelsMap[role] || role.replace('_', ' ');

    triggerToast(`✉️ Updating role to ${roleLabel} & sending email to ${userEmail}...`);

    try {
      const res = await DjangoApi.assignUserRoleAndNotify({
        user_name: userName,
        user_email: userEmail,
        role: role,
        role_label: roleLabel,
        organization_name: orgName || 'EcoEstate Campus',
        password: 'estate@2026',
      });
      if (res?.success) {
        triggerToast(`✉️ Role update & login credentials email delivered to ${userEmail}!`);
        addNotification({
          title: 'Role Updated & Email Sent',
          message: `Updated role to ${roleLabel} for ${userName} and emailed credentials to ${userEmail}.`,
          type: 'EMAIL_SENT',
          targetRole: 'SUPERADMIN',
        });
      } else {
        triggerToast(`Role updated for ${userName} to ${roleLabel}.`);
        addNotification({
          title: 'Role Updated',
          message: `Role changed to ${roleLabel} for ${userName}.`,
          type: 'ROLE_ASSIGNED',
          targetRole: 'SUPERADMIN',
        });
      }
    } catch (err) {
      console.error('Error dispatching role email:', err);
    }
  };

  const handleStatusToggle = (userId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'Inactive' ? 'Active' : 'Inactive';
    updateUserStatus(userId, nextStatus);
    triggerToast(`User access status changed to ${nextStatus}.`);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert('You cannot delete your own Super Admin account while logged in!');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently revoke credentials and delete access for "${userName}"?`)) {
      deleteUser(userId);
      triggerToast(`Access credentials revoked and deleted for ${userName}.`);
    }
  };

  // Filtered users: By default, this directory manages institutional facility/campus accounts.
  // SuperAdmin is governed under "My Profile & Security", but can be viewed if specifically filtered by Role: Super Admin.
  const filteredUsers = users.filter((u) => {
    const isSuperAdminAccount = u.role === 'SUPERADMIN' || u.id === 'user-superadmin';
    if (isSuperAdminAccount && roleFilter !== 'SUPERADMIN') {
      return false;
    }

    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.organizationName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.title || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.status || 'Active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const institutionalUsers = users.filter((u) => u.role !== 'SUPERADMIN' && u.id !== 'user-superadmin');
  const activeCount = institutionalUsers.filter((u) => (u.status || 'Active') === 'Active').length;
  const inactiveCount = institutionalUsers.filter((u) => u.status === 'Inactive').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white border border-cyan-500/50 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 mb-1">
            <Users className="w-3.5 h-3.5" /> Access Governance & Identity Management
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
            User Accounts & Institutional Roles
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-2xl">
            View active platform users across institutions, issue access credentials, assign permission roles, and revoke accounts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Issue & Grant Access
        </button>
      </div>

      {/* Stats Counter Bar: "dekh payega kitne log use kar rahe hai" */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 dark:text-slate-400">Total User Directory</p>
            <p className="text-2xl font-extrabold text-stone-900 dark:text-white">{institutionalUsers.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 dark:text-slate-400">Currently Active Users</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 dark:text-slate-400">Suspended / Inactive Access</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{inactiveCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, campus, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28] text-xs text-stone-900 dark:text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28] text-xs text-stone-900 dark:text-white font-medium cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPERADMIN">Super Admin</option>
              <option value="ORG_ADMIN">Estate Admin</option>
              <option value="ESTATE_MANAGER">Estate Manager</option>
              <option value="ENERGY_AUDITOR">Energy Auditor</option>
              <option value="ORG_OPERATOR">SCADA Operator</option>
              <option value="FACILITY_VIEWER">Facility Viewer</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#f8f4ed] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#181a28] text-xs text-stone-900 dark:text-white font-medium cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm dark:shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 dark:text-slate-300">
            <thead className="bg-[#f5efe6] dark:bg-[#0a0b12] border-b border-[#ece3d6] dark:border-[#151722] text-[11px] uppercase font-bold text-stone-500 dark:text-slate-400">
              <tr>
                <th className="p-4">User & Email</th>
                <th className="p-4">Assigned Facility</th>
                <th className="p-4">Assigned Role (Editable)</th>
                <th className="p-4">Last Active</th>
                <th className="p-4">Access Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece3d6] dark:divide-[#151722]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-500">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isActive = (user.status || 'Active') === 'Active';
                  const isSuperAdminAccount = user.role === 'SUPERADMIN' || user.id === 'user-superadmin';
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#f8f4ed] dark:hover:bg-[#0f111d] transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Campus */}
                      <td className="p-4">
                        <p className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-xs">
                          {isSuperAdminAccount ? 'National Platform (All Campuses)' : (user.organizationName || 'National Platform')}
                        </p>
                        <p className="text-[10px] text-slate-400">{isSuperAdminAccount ? 'National System Director' : (user.title || 'Staff')}</p>
                      </td>

                      {/* Interactive Role Assignment */}
                      <td className="p-4">
                        {isSuperAdminAccount ? (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 inline-flex items-center gap-1">
                            SUPER ADMIN (Root)
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, user.name, user.email, e.target.value as Role, user.organizationName)}
                            className="px-2.5 py-1 rounded-xl text-xs font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                          >
                            <option value="ORG_ADMIN">ESTATE ADMIN</option>
                            <option value="ESTATE_MANAGER">ESTATE MANAGER</option>
                            <option value="ENERGY_AUDITOR">ENERGY AUDITOR</option>
                            <option value="ORG_OPERATOR">SCADA OPERATOR</option>
                            <option value="FACILITY_VIEWER">FACILITY VIEWER</option>
                          </select>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="p-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {user.lastActive || 'Today'}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => !isSuperAdminAccount && handleStatusToggle(user.id, user.status)}
                          disabled={isSuperAdminAccount}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                            isSuperAdminAccount ? 'cursor-default opacity-80' : 'cursor-pointer'
                          } ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                          title={isSuperAdminAccount ? 'Root SuperAdmin is permanently active' : 'Click to toggle Active/Inactive'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions: Mail Creds & Delete */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRoleChange(user.id, user.name, user.email, user.role, user.organizationName)}
                            className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-600 dark:text-cyan-400 hover:text-slate-950 font-bold text-xs border border-cyan-500/30 transition-all cursor-pointer inline-flex items-center gap-1"
                            title={`Send/Resend login credentials to ${user.email}`}
                          >
                            <Mail className="w-3.5 h-3.5" /> Mail Creds
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={isSuperAdminAccount || user.id === currentUser?.id}
                            className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold text-xs border border-rose-500/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1"
                            title={isSuperAdminAccount ? "Root SuperAdmin cannot be deleted" : "Permanently delete user access"}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
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

      {/* Modal: "unko aceess de payeghe" */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-cyan-500/40 shadow-2xl text-stone-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-500" />
                <h3 className="font-bold text-base">Issue Credentials & Grant Access</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Satya Ranjan Patra"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">
                  Login Email Address:
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@campus.ac.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">
                    Assign Role:
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white font-medium cursor-pointer"
                  >
                    <option value="ORG_ADMIN">Estate Admin</option>
                    <option value="ESTATE_MANAGER">Estate Manager</option>
                    <option value="ENERGY_AUDITOR">Energy Auditor</option>
                    <option value="ORG_OPERATOR">SCADA Operator</option>
                    <option value="FACILITY_VIEWER">Facility Viewer</option>
                    <option value="SUPERADMIN">Super Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">
                    Assign Facility:
                  </label>
                  <select
                    value={newOrgId}
                    onChange={(e) => setNewOrgId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white font-medium truncate cursor-pointer"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">
                  Institutional Job Title / Department:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chief Facilities Officer / Substation Lead"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-stone-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">
                  Initial Password:
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] bg-[#f8f4ed] dark:bg-[#0a0b12] text-cyan-600 dark:text-cyan-400 font-mono"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#181a28] font-bold hover:bg-[#f8f4ed] dark:hover:bg-[#121422] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold shadow-lg transition-all cursor-pointer"
                >
                  Grant Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersView;
