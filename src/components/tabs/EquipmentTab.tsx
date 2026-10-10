'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EquipmentItem } from '@/types';
import {
  Cpu,
  PlusCircle,
  FileSpreadsheet,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Search,
  Wrench,
  Thermometer,
  Zap,
  Clock,
  Sparkles,
  Upload,
  MapPin,
  X,
} from 'lucide-react';
import ExplainableAiShapModal from '@/components/ExplainableAiShapModal';
import { Organization } from '@/types';
import { DjangoApi } from '@/services/api';

interface EquipmentTabProps {
  org?: Organization;
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({ org }) => {
  const { activeOrg: contextOrg, equipmentList: contextEquipments, addEquipment, importEquipmentBatch, deleteEquipment } = useAuth();
  const activeOrg = org || contextOrg;

  const [dbEquipment, setDbEquipment] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchEquipment = () => {
    if (!activeOrg?.id) return;
    DjangoApi.getEquipment(activeOrg.id).then((data) => {
      if (Array.isArray(data) && data.length > 0) setDbEquipment(data);
    });
  };

  useEffect(() => {
    fetchEquipment();
  }, [activeOrg?.id]);

  const handleDeleteEquipment = (id: string) => {
    deleteEquipment(id);
    setDbEquipment((prev) =>
      prev.filter((e) => (e.equipment_code || `EQ-${e.id}`) !== id && String(e.id) !== id)
    );
  };

  const equipmentList: EquipmentItem[] = dbEquipment.length > 0
    ? dbEquipment.map((eq) => ({
        id: eq.equipment_code || `EQ-${eq.id}`,
        name: eq.name,
        category: eq.category,
        location: eq.location,
        status: (eq.status || 'Operational') as any,
        healthScore: eq.health_score || 95,
        powerRatingKw: eq.power_rating_kw || 50,
        runtimeHoursToday: eq.runtime_hours_today || 14,
        vibrationMmPerSec: eq.vibration_mm_per_sec || 1.2,
        operatingTempC: eq.operating_temp_c || 45,
        lastCalibrated: eq.last_calibrated || '2026-09-15',
        nextServiceDate: eq.next_service_date || '2026-12-15',
        dataSource: (eq.data_source || 'IoT LAN/WiFi') as any,
      }))
    : contextEquipments;

  // SHAP Explainable AI Modal State
  const [isShapModalOpen, setIsShapModalOpen] = useState(false);
  const [selectedShapCategory, setSelectedShapCategory] = useState<string>('WATER_PUMP');

  const getCategoryForEquipment = (item: EquipmentItem) => {
    const c = (item.category + ' ' + item.name).toLowerCase();
    if (
      c.includes('water') ||
      c.includes('pump') ||
      c.includes('ro') ||
      c.includes('centrifuge') ||
      c.includes('etp') ||
      c.includes('stp')
    ) {
      return 'WATER_PUMP';
    }
    if (
      c.includes('fan') ||
      c.includes('ahu') ||
      c.includes('air') ||
      c.includes('clean') ||
      c.includes('cooler')
    ) {
      return 'AIR_QUALITY_STATION';
    }
    if (
      c.includes('furnace') ||
      c.includes('compressor') ||
      c.includes('substation') ||
      c.includes('transformer') ||
      c.includes('power')
    ) {
      return 'ENERGY_TRANSFORMER';
    }
    return 'IOT_GATEWAY_NODE';
  };

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [powerRatingKw, setPowerRatingKw] = useState<number>(50);
  const [operatingTempC, setOperatingTempC] = useState<number>(45);
  const [vibrationMmPerSec, setVibrationMmPerSec] = useState<number>(1.2);
  const [healthScore, setHealthScore] = useState<number>(95);
  const [status, setStatus] = useState<EquipmentItem['status']>('Operational');
  const [dataSource, setDataSource] = useState<EquipmentItem['dataSource']>('Manual Log');

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const sampleCsvTemplates: Record<string, string> = {
    HOSPITAL: `Name,Category,Location,PowerKw,TempC,Vibration,HealthScore,Status
CT-Scan Super Cooler 45kW,Diagnostic Imaging,Ground Radiology,45,22,0.6,96,Operational
Negative Pressure Isolation AHU-3,Infection Control,Isolation Ward 4,18,24,1.1,92,Operational
Autoclave Sterilization Unit B,CSSD Dept,Sterile Block,30,121,1.5,88,Operational`,
    COLLEGE: `Name,Category,Location,PowerKw,TempC,Vibration,HealthScore,Status
Supercomputing High-Density Rack,AI & High Performance Lab,CS Block Floor 3,60,20,0.4,98,Operational
Fluid Mechanics Wind Tunnel Fan,Mechanical Lab,Aerospace Bay,35,38,2.2,85,Operational
Central RO Water Purification Plant,Campus Utilities,Hostel Utility Yard,15,26,0.8,94,Operational`,
    INDUSTRY: `Name,Category,Location,PowerKw,TempC,Vibration,HealthScore,Status
Heavy Induction Furnace Coil Unit-2,Metallurgy & Smelting,Melt Shop 1,2200,95,3.2,84,Operational
Coke Oven Gas Booster Compressor,Gas Processing,Yard Block 5,350,68,2.8,89,Operational
Main ETP Sludge Centrifuge,Effluent Treatment,ETP Yard,45,42,1.8,91,Operational`,
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEquipment({
      name,
      category: category || 'Facility Equipment',
      location: location || 'Main Utility Block',
      powerRatingKw: Number(powerRatingKw),
      operatingTempC: Number(operatingTempC),
      vibrationMmPerSec: Number(vibrationMmPerSec),
      healthScore: Number(healthScore),
      status,
      runtimeHoursToday: 12.0,
      lastCalibrated: new Date().toISOString().split('T')[0],
      nextServiceDate: '2026-12-31',
      dataSource,
    });

    setName('');
    setCategory('');
    setLocation('');
    setShowAddModal(false);
    setTimeout(fetchEquipment, 600);
  };

  const handleCsvImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = importCsvText.trim().split('\n');
    if (lines.length < 2) return;

    const parsedItems: Omit<EquipmentItem, 'id'>[] = [];
    const dataLines = lines[0].toLowerCase().includes('name') ? lines.slice(1) : lines;

    dataLines.forEach((line) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        parsedItems.push({
          name: parts[0] || 'Imported Equipment',
          category: parts[1] || 'Industrial Asset',
          location: parts[2] || 'Campus Zone',
          powerRatingKw: Number(parts[3]) || 25,
          operatingTempC: Number(parts[4]) || 40,
          vibrationMmPerSec: Number(parts[5]) || 1.2,
          healthScore: Number(parts[6]) || 90,
          status: (parts[7] as any) || 'Operational',
          runtimeHoursToday: 14.0,
          lastCalibrated: new Date().toISOString().split('T')[0],
          nextServiceDate: '2026-12-15',
          dataSource: 'Batch CSV',
        });
      }
    });

    if (parsedItems.length > 0) {
      importEquipmentBatch(parsedItems);
      setImportSuccessCount(parsedItems.length);
      setTimeout(fetchEquipment, 700);
      setTimeout(() => {
        setImportSuccessCount(null);
        setShowImportModal(false);
        setImportCsvText('');
      }, 1400);
    }
  };

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const getStatusBadge = (st: EquipmentItem['status']) => {
    switch (st) {
      case 'Operational':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'Warning':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Critical':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'Maintenance Due':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a1828] to-emerald-950 border border-emerald-500/20 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Cpu className="w-4 h-4" /> Asset Digital Twin • Manual Control + CSV Import
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Equipment & Machinery Control</h1>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedShapCategory('WATER_PUMP');
              setIsShapModalOpen(true);
            }}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 hover:from-amber-500/25 hover:via-rose-500/25 hover:to-purple-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-[1.02]"
          >
            <Wrench className="w-4 h-4 text-amber-500" />
            <span>Diagnostics &amp; Maintenance</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold">
              ROOT CAUSE
            </span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Instrument</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs w-full sm:w-auto">
          {['ALL', 'Operational', 'Warning', 'Critical', 'Maintenance Due'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterStatus === st
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#151722]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEquipment.map((item) => (
          <div
            key={item.id}
            className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-4 hover:border-emerald-500/70 transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-stone-400 dark:text-slate-500">{item.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-white mt-1 group-hover:text-emerald-400 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400" /> {item.location} • {item.category}
                </p>
              </div>

              <button
                onClick={() => handleDeleteEquipment(item.id)}
                title="Remove Equipment"
                className="p-2 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Health Score Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-stone-500 dark:text-slate-400">Asset Health Score</span>
                <span className={`font-extrabold ${item.healthScore >= 90 ? 'text-emerald-500' : item.healthScore >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {item.healthScore}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.healthScore >= 90 ? 'bg-emerald-500' : item.healthScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${item.healthScore}%` }}
                />
              </div>
            </div>

            {/* Telemetry Detail Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] text-[11px]">
              <div>
                <span className="text-stone-400 dark:text-slate-500 block">Vibration:</span>
                <span className="font-bold text-stone-800 dark:text-slate-200">{item.vibrationMmPerSec} mm/s</span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-slate-500 block">Temp:</span>
                <span className="font-bold text-stone-800 dark:text-slate-200">{item.operatingTempC}°C</span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-slate-500 block">Power:</span>
                <span className="font-bold text-stone-800 dark:text-slate-200">{item.powerRatingKw} kW</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ece3d6]/60 dark:border-[#151722] flex items-center justify-between text-[11px] text-stone-400 dark:text-slate-500">
              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#0a0b12] font-mono text-[10px]">
                Feed: {item.dataSource}
              </span>
              <span>Service: {item.nextServiceDate}</span>
            </div>

            {/* SHAP Explainable AI attribution trigger */}
            <button
              onClick={() => {
                setSelectedShapCategory(getCategoryForEquipment(item));
                setIsShapModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 hover:from-amber-500/20 hover:via-rose-500/20 hover:to-purple-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              <span>Root Cause &amp; Maintenance Checklist</span>
            </button>
          </div>
        ))}
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl text-stone-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base">Add Equipment / Instrument</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Equipment Name / Model:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chiller Unit B4 or Autoclave Sterilizer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">Category:</label>
                  <input
                    type="text"
                    placeholder="e.g. HVAC, Power, Water, Cryo"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Location / Room:</label>
                  <input
                    type="text"
                    placeholder="e.g. Basement Block 2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="font-bold">Power (kW):</label>
                  <input
                    type="number"
                    value={powerRatingKw}
                    onChange={(e) => setPowerRatingKw(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Temp (°C):</label>
                  <input
                    type="number"
                    value={operatingTempC}
                    onChange={(e) => setOperatingTempC(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Vibration:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vibrationMmPerSec}
                    onChange={(e) => setVibrationMmPerSec(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">Health Score (0-100):</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={healthScore}
                    onChange={(e) => setHealthScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Status:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Warning">Warning</option>
                    <option value="Critical">Critical</option>
                    <option value="Maintenance Due">Maintenance Due</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] font-bold hover:bg-stone-100 dark:hover:bg-[#151722] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-md transition-colors"
                >
                  Save Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl text-stone-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base">Batch CSV Equipment Ingestion</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importSuccessCount !== null ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">Successfully Ingested {importSuccessCount} Equipment Records!</p>
                  <p className="text-xs">Updating asset digital twin dashboard...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCsvImportSubmit} className="space-y-3.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-bold">Paste CSV Data or load template:</label>
                  <button
                    type="button"
                    onClick={() => setImportCsvText(sampleCsvTemplates[activeOrg?.type || 'HOSPITAL'] || sampleCsvTemplates.HOSPITAL)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[10px] w-fit inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-emerald-500" />
                    Load Sample Template
                  </button>
                </div>

                <textarea
                  rows={6}
                  required
                  placeholder={`Name,Category,Location,PowerKw,TempC,Vibration,HealthScore,Status\nChiller Unit 1,HVAC,Basement,150,45,1.2,95,Operational`}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] font-bold hover:bg-stone-100 dark:hover:bg-[#151722] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Ingest & Update
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Explainable AI (SHAP) Attribution Modal */}
      <ExplainableAiShapModal
        isOpen={isShapModalOpen}
        onClose={() => setIsShapModalOpen(false)}
        defaultSensorCategory={selectedShapCategory}
      />
    </div>
  );
};

export default EquipmentTab;
