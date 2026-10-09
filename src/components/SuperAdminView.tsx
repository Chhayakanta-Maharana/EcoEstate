'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FacilityType, Organization } from '@/types';
import {
  ShieldCheck,
  Building2,
  Hospital,
  GraduationCap,
  Flame,
  Factory,
  PlusCircle,
  UserPlus,
  KeyRound,
  Eye,
  Trash2,
  Search,
  CheckCircle2,
  Zap,
  Droplets,
  Wind,
  Layers,
  Sparkles,
  Send,
} from 'lucide-react';

interface SuperAdminViewProps {
  onNavigateToOrg: (orgId: string) => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ onNavigateToOrg }) => {
  const { organizations, createOrganization, deleteOrganization, selectOrganization } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<FacilityType>('COLLEGE');
  const [categoryLabel, setCategoryLabel] = useState('Autonomous Engineering & Tech University');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [areaSqFt, setAreaSqFt] = useState<number>(2000000);
  const [occupancyCurrent, setOccupancyCurrent] = useState<number>(8500);
  const [occupancyMax, setOccupancyMax] = useState<number>(12000);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('campus@2026');
  const [iotGatewayIp, setIotGatewayIp] = useState('192.168.25.1');
  const [carbonTarget, setCarbonTarget] = useState<number>(30);
  const [description, setDescription] = useState('');

  // UI States
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [lastAssignedOrg, setLastAssignedOrg] = useState<Organization | null>(null);

  const getAutoLabel = (t: FacilityType) => {
    switch (t) {
      case 'HOSPITAL':
        return 'Super Specialty Healthcare Zone';
      case 'COLLEGE':
        return 'Autonomous Engineering & Tech University';
      case 'PSU':
        return 'Central Public Sector Undertaking (CPSE)';
      case 'INDUSTRY':
        return 'Heavy Manufacturing & Processing Complex';
      case 'MUNICIPAL':
        return 'Integrated Municipal Smart Zone';
    }
  };

  const handleTypeChange = (newType: FacilityType) => {
    setType(newType);
    setCategoryLabel(getAutoLabel(newType));
    const subnets: Record<FacilityType, string> = {
      HOSPITAL: '192.168.10.1',
      COLLEGE: '192.168.20.1',
      PSU: '192.168.30.1',
      INDUSTRY: '192.168.40.1',
      MUNICIPAL: '192.168.50.1',
    };
    setIotGatewayIp(subnets[newType]);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = createOrganization({
      name,
      type,
      categoryLabel: categoryLabel || getAutoLabel(type),
      city,
      state: stateName,
      areaSqFt: Number(areaSqFt),
      occupancyCurrent: Number(occupancyCurrent),
      occupancyMax: Number(occupancyMax),
      assignedAdminEmail: adminEmail,
      assignedAdminName: adminName,
      assignedPassword: adminPassword || 'estate@2026',
      iotGatewayIp,
      carbonTargetReductionPct: Number(carbonTarget),
      description: description || `Connected smart estate monitoring AQI, Water, Energy, Waste, and Assets for ${name}.`,
    });

    setLastAssignedOrg(created);
    setShowSuccessCard(true);

    // Reset Form
    setName('');
    setAdminName('');
    setAdminEmail('');
    setCity('');
    setStateName('');
    setDescription('');
  };

  const filteredOrgs = organizations.filter((org) => {
    const matchesFilter = filterType === 'ALL' || org.type === filterType;
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.assignedAdminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.assignedAdminEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getOrgIcon = (t: FacilityType) => {
    switch (t) {
      case 'HOSPITAL':
        return <Hospital className="w-5 h-5 text-rose-500" />;
      case 'COLLEGE':
        return <GraduationCap className="w-5 h-5 text-cyan-500" />;
      case 'PSU':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'INDUSTRY':
        return <Factory className="w-5 h-5 text-purple-500" />;
      default:
        return <Building2 className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Super Admin Top Hero Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a1828] to-emerald-950 border border-emerald-500/20 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Super Administrator Console • National Estate Mission
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Facility Provisioning & Access Assignment
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Register institutions across India (Hospitals, Colleges, PSUs, Industries), configure IoT gateway telemetry, and assign login credentials directly to estate administrators.
            </p>
          </div>

          <div className="flex gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="text-center px-3">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Active Estates</p>
              <p className="text-2xl font-extrabold text-emerald-400">{organizations.length}</p>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <div className="text-center px-3">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Live Sensors</p>
              <p className="text-2xl font-extrabold text-cyan-400">1,480+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification after provisioning */}
      {showSuccessCard && lastAssignedOrg && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-slate-900 dark:text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Estate Provisioned & Credentials Generated!
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Assigned Admin: <strong className="text-emerald-400">{lastAssignedOrg.assignedAdminName}</strong> ({lastAssignedOrg.assignedAdminEmail}) • Password: <span className="font-mono text-emerald-300">{lastAssignedOrg.assignedPassword}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              selectOrganization(lastAssignedOrg.id);
              onNavigateToOrg(lastAssignedOrg.id);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
          >
            <Eye className="w-4 h-4" /> Open Estate Dashboard →
          </button>
        </div>
      )}

      {/* 2-Column Spacious Layout: Left Form, Right Active Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Registration & Assignment Form */}
        <div className="lg:col-span-5 p-7 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#ece3d6] dark:border-[#151722]">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-stone-900 dark:text-white">
                1. Register Estate & Assign User
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Fills institutional data and issues user credentials.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            {/* Facility Type Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Facility Category:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'COLLEGE', label: 'College', icon: GraduationCap },
                  { key: 'HOSPITAL', label: 'Hospital', icon: Hospital },
                  { key: 'PSU', label: 'PSU', icon: Flame },
                  { key: 'INDUSTRY', label: 'Industry', icon: Factory },
                  { key: 'MUNICIPAL', label: 'Municipal', icon: Building2 },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = type === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleTypeChange(item.key as FacilityType)}
                      className={`flex items-center gap-1.5 p-2 rounded-xl font-bold border transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estate Name */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Institution / Estate Name:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BPUT State University Campus or Apollo Hospital"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">City:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rourkela"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">State / UT:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Odisha"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Assigned Administrator Credentials Card */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-slate-900/90 border border-emerald-500/20 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <KeyRound className="w-4 h-4" /> Assigned User Login Access:
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-slate-300">
                  Officer / Administrator Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. R. K. Mohanty (Estate Officer)"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-medium text-slate-600 dark:text-slate-300">Login Email:</label>
                  <input
                    type="email"
                    required
                    placeholder="officer@estate.ac.in"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-600 dark:text-slate-300">Assigned Password:</label>
                  <input
                    type="text"
                    placeholder="campus@2026"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* IoT Gateway */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                IoT LAN/WiFi Gateway Subnet:
              </label>
              <input
                type="text"
                value={iotGatewayIp}
                onChange={(e) => setIotGatewayIp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all mt-2"
            >
              <Send className="w-4 h-4" /> Provision Estate & Issue Credentials
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Connected Estates Directory */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-7 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div>
                <h2 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  Connected Facilities ({filteredOrgs.length})
                </h2>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Select any estate to inspect its live LAN/WiFi telemetry.
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search estate or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['ALL', 'COLLEGE', 'HOSPITAL', 'PSU', 'INDUSTRY', 'MUNICIPAL'].map((flt) => (
                <button
                  key={flt}
                  onClick={() => setFilterType(flt)}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    filterType === flt
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {flt}
                </button>
              ))}
            </div>

            {/* Estates List */}
            <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredOrgs.map((org) => {
                return (
                  <div
                    key={org.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/70 transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                          {getOrgIcon(org.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors">
                              {org.name}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {org.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            📍 {org.city}, {org.state} • Score: {org.sustainabilityScore}/100
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        {org.iotStatus}
                      </span>
                    </div>

                    {/* Assigned User Credentials Box */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Assigned Administrator:
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {org.assignedAdminName}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">
                          ({org.assignedAdminEmail})
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-800">
                        Key: {org.assignedPassword || 'estate@2026'}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">
                        Gateway: {org.iotGatewayIp}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            selectOrganization(org.id);
                            onNavigateToOrg(org.id);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Dashboard
                        </button>

                        <button
                          onClick={() => deleteOrganization(org.id)}
                          title="Delete Estate"
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminView;
