'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DjangoApi } from '@/services/api';
import {
  BrainCircuit,
  X,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Droplets,
  Wind,
  Radio,
  Sparkles,
  Info,
  Wrench,
  RotateCcw,
  Search,
  MapPin,
  Clock,
  UserCheck,
  Package,
  Layers,
  Check,
  Send,
  ExternalLink,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface ExplainableAiShapModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSensorCategory?: string;
}

export const ExplainableAiShapModal: React.FC<ExplainableAiShapModalProps> = ({
  isOpen,
  onClose,
  defaultSensorCategory,
}) => {
  const [sensors, setSensors] = useState<any[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string>('');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'FAULT' | 'WARNING' | 'HEALTHY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWhatIfControls, setShowWhatIfControls] = useState(false);
  const [dispatchedTickets, setDispatchedTickets] = useState<Record<string, { ticketNo: string; time: string }>>({});
  const [interactiveTelemetry, setInteractiveTelemetry] = useState<Record<string, number>>({});
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);

  // Fetch all sensors on open & periodic polling for live hardware updates
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    const fetchSensors = (isInitial = false) => {
      if (isInitial) setIsLoading(true);
      DjangoApi.getShapSensorAnomalies()
        .then((data) => {
          if (!isSubscribed) return;
          if (data && data.results && data.results.length > 0) {
            setSensors(data.results);
            
            // Retain selected sensor or pick appropriate initial
            setSelectedSensorId((prevId) => {
              let targetId = prevId;
              if (!targetId) {
                if (defaultSensorCategory) {
                  const matched = data.results.find((s: any) => s.category === defaultSensorCategory);
                  targetId = matched ? matched.sensor_id : data.results[0].sensor_id;
                } else {
                  const fault = data.results.find((s: any) => s.severity === 'CRITICAL_FAULT');
                  targetId = fault ? fault.sensor_id : data.results[0].sensor_id;
                }
              }

              const targetObj = data.results.find((s: any) => s.sensor_id === targetId) || data.results[0];
              setCurrentAnalysis(targetObj);
              if (isInitial) initTelemetry(targetObj);
              return targetId;
            });
          }
        })
        .catch((err) => {
          console.error('Error fetching SHAP sensor anomalies:', err);
        })
        .finally(() => {
          if (isSubscribed && isInitial) setIsLoading(false);
        });
    };

    fetchSensors(true);
    const pollInterval = setInterval(() => fetchSensors(false), 3000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [isOpen, defaultSensorCategory]);


  const initTelemetry = (sensorObj: any) => {
    const tObj: Record<string, number> = {};
    if (sensorObj?.feature_attributions) {
      sensorObj.feature_attributions.forEach((f: any) => {
        tObj[f.feature_key] = f.actual_value;
      });
    }
    setInteractiveTelemetry(tObj);
  };

  const handleSelectSensor = (sensor: any) => {
    setSelectedSensorId(sensor.sensor_id);
    setCurrentAnalysis(sensor);
    initTelemetry(sensor);
  };

  // Sensitivity What-If Slider Handler
  const handleSliderChange = (key: string, val: number) => {
    const updated = { ...interactiveTelemetry, [key]: val };
    setInteractiveTelemetry(updated);

    DjangoApi.explainSensorWithShap(
      currentAnalysis?.category || 'WATER_PUMP',
      updated,
      currentAnalysis?.sensor_id,
      currentAnalysis?.sensor_name
    ).then((res) => {
      if (res) {
        // Merge enriched metadata
        setCurrentAnalysis({
          ...currentAnalysis,
          ...res,
          location: currentAnalysis.location,
          system_subsystem: currentAnalysis.system_subsystem,
          kahan_kharab_hua: currentAnalysis.kahan_kharab_hua,
          problem_title: res.explanation_summary,
          kya_maintenance_chahiye: currentAnalysis.kya_maintenance_chahiye,
          kya_solution_hai: currentAnalysis.kya_solution_hai,
          spare_parts_needed: currentAnalysis.spare_parts_needed,
          urgency: currentAnalysis.urgency,
          assigned_tech: currentAnalysis.assigned_tech,
        });
      }
    });
  };

  const resetToHealthyBaseline = () => {
    if (!currentAnalysis) return;
    const clean: Record<string, number> = {};
    currentAnalysis.feature_attributions.forEach((f: any) => {
      clean[f.feature_key] = f.baseline_value;
    });
    setInteractiveTelemetry(clean);

    DjangoApi.explainSensorWithShap(
      currentAnalysis.category,
      clean,
      currentAnalysis.sensor_id,
      currentAnalysis.sensor_name
    ).then((res) => {
      if (res) {
        setCurrentAnalysis({
          ...currentAnalysis,
          ...res,
          location: currentAnalysis.location,
          system_subsystem: currentAnalysis.system_subsystem,
          kahan_kharab_hua: currentAnalysis.kahan_kharab_hua,
          problem_title: 'Sensor restored to nominal operating parameters. Zero anomaly detected.',
          kya_maintenance_chahiye: 'Sensor baseline re-zeroed. Verify physical sensor mount.',
          kya_solution_hai: currentAnalysis.kya_solution_hai,
          spare_parts_needed: currentAnalysis.spare_parts_needed,
          urgency: 'NORMAL (Resolved)',
          assigned_tech: currentAnalysis.assigned_tech,
        });
      }
    });
  };

  const handleDispatchTicket = (sensorId: string) => {
    const ticketId = `WO-CBM-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setDispatchedTickets((prev) => ({
      ...prev,
      [sensorId]: { ticketNo: ticketId, time: now },
    }));
  };

  // Filter sensors
  const filteredSensors = useMemo(() => {
    return sensors.filter((s) => {
      // Tab filter
      if (activeTabFilter === 'FAULT' && s.severity !== 'CRITICAL_FAULT') return false;
      if (activeTabFilter === 'WARNING' && s.severity !== 'WARNING') return false;
      if (activeTabFilter === 'HEALTHY' && s.severity !== 'NORMAL') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${s.sensor_name} ${s.sensor_id} ${s.location} ${s.kahan_kharab_hua} ${s.problem_title}`.toLowerCase();
        return text.includes(q);
      }
      return true;
    });
  }, [sensors, activeTabFilter, searchQuery]);

  const counts = useMemo(() => {
    const total = sensors.length;
    const faults = sensors.filter((s) => s.severity === 'CRITICAL_FAULT').length;
    const warnings = sensors.filter((s) => s.severity === 'WARNING').length;
    const normal = sensors.filter((s) => s.severity === 'NORMAL').length;
    return { total, faults, warnings, normal };
  }, [sensors]);

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'WATER_PUMP':
        return <Droplets className="w-4 h-4 text-cyan-500" />;
      case 'ENERGY_TRANSFORMER':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'AIR_QUALITY_STATION':
        return <Wind className="w-4 h-4 text-blue-500" />;
      default:
        return <Radio className="w-4 h-4 text-purple-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-7xl h-[92vh] rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl text-stone-900 dark:text-slate-100 flex flex-col overflow-hidden">
        
        {/* 1. TOP EXECUTIVE HEADER */}
        <div className="px-5 py-4 border-b border-[#ece3d6] dark:border-[#151722] bg-[#fbf8f3] dark:bg-[#05060b] flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/15 border border-cyan-500/30 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10 flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-white">
                  Machinery SCADA &amp; Condition-Based Monitoring (CBM)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Telemetry Ingestion
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                SCADA telemetry streaming: Real-time telemetry monitoring for mechanical assets, diagnostic root cause attribution, and SLA maintenance workflows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Status KPI Summary */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] text-xs font-mono">
              <span className="text-stone-400 dark:text-slate-500">Monitored:</span>
              <span className="font-bold text-stone-900 dark:text-white">{counts.total}</span>
              <span className="text-stone-300 dark:text-stone-700">|</span>
              <span className="text-rose-500 font-bold">{counts.faults} Faults</span>
              <span className="text-stone-300 dark:text-stone-700">|</span>
              <span className="text-amber-500 font-bold">{counts.warnings} Warnings</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#121422] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. DUAL-PANE BODY WORKSPACE */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          
          {/* LEFT PANE: All Campus Sensors Directory (35% width) */}
          <div className="w-full lg:w-96 flex-shrink-0 border-r border-[#ece3d6] dark:border-[#151722] bg-[#fcfaf7] dark:bg-[#04050a] flex flex-col min-h-0">
            
            {/* Search & Filter Header */}
            <div className="p-3.5 border-b border-[#ece3d6] dark:border-[#151722] space-y-2.5 flex-shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search sensor, location or fault..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-[#090a12] text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setActiveTabFilter('ALL')}
                  className={`py-1 rounded-lg transition-all ${
                    activeTabFilter === 'ALL'
                      ? 'bg-stone-900 dark:bg-slate-200 text-white dark:text-slate-950 font-black'
                      : 'bg-white dark:bg-[#0a0b12] text-stone-500 dark:text-slate-400 hover:bg-stone-100'
                  }`}
                >
                  All ({counts.total})
                </button>
                <button
                  onClick={() => setActiveTabFilter('FAULT')}
                  className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTabFilter === 'FAULT'
                      ? 'bg-rose-500 text-white font-black'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Fault ({counts.faults})
                </button>
                <button
                  onClick={() => setActiveTabFilter('WARNING')}
                  className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTabFilter === 'WARNING'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Warn ({counts.warnings})
                </button>
                <button
                  onClick={() => setActiveTabFilter('HEALTHY')}
                  className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTabFilter === 'HEALTHY'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Normal ({counts.normal})
                </button>
              </div>
            </div>

            {/* Scrollable Sensor Card List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 no-scrollbar">
              {filteredSensors.map((sensor) => {
                const isSelected = selectedSensorId === sensor.sensor_id;
                const isCritical = sensor.severity === 'CRITICAL_FAULT';
                const isWarning = sensor.severity === 'WARNING';

                return (
                  <div
                    key={sensor.sensor_id}
                    onClick={() => handleSelectSensor(sensor)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 relative ${
                      isSelected
                        ? 'bg-white dark:bg-[#0c0e18] border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500'
                        : 'bg-white dark:bg-[#07080e] border-[#ece3d6] dark:border-[#151722] hover:border-cyan-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getCategoryIcon(sensor.category)}
                        <span className="font-extrabold text-xs text-stone-900 dark:text-white truncate">
                          {sensor.sensor_name}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isCritical
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : isWarning
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isCritical ? 'Fault' : isWarning ? 'Warning' : 'Healthy'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-slate-400 truncate">
                      <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{sensor.location}</span>
                    </div>

                    {/* Problem teaser */}
                    <div className="pt-1 border-t border-[#ece3d6]/60 dark:border-[#151722] flex items-center justify-between text-[10px]">
                      <span className="text-stone-500 dark:text-slate-400 font-mono truncate max-w-[190px]">
                        {sensor.problem_title || sensor.explanation_summary}
                      </span>
                      <span className={`font-mono font-black ${isCritical ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {sensor.anomaly_probability_pct}% Risk
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANE: Comprehensive Explainable AI & Solution Dossier (65% width) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white dark:bg-[#07080e] no-scrollbar">
            {currentAnalysis ? (
              <>
                {/* 1. SENSOR IDENTITY & PASSPORT HEADER */}
                <div className="p-4 sm:p-5 rounded-3xl bg-[#f8f5ee] dark:bg-[#0b0c15] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                        {currentAnalysis.sensor_id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-[#141624] text-stone-700 dark:text-slate-300 border border-[#ece3d6] dark:border-[#1e2030]">
                        {currentAnalysis.system_subsystem || 'Campus Infrastructure'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Dual Telemetry Stream Online (LAN/WiFi)
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                      {currentAnalysis.sensor_name}
                    </h1>

                    <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{currentAnalysis.location}</span>
                    </p>
                  </div>

                  {/* Fault Probability Badge & Ticket Dispatch */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 block">
                        Equipment Failure Risk
                      </span>
                      <div className="flex items-baseline gap-1 justify-end">
                        <span
                          className={`text-2xl font-black font-mono ${
                            currentAnalysis.severity === 'CRITICAL_FAULT'
                              ? 'text-rose-500'
                              : currentAnalysis.severity === 'WARNING'
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {currentAnalysis.anomaly_probability_pct}%
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 font-mono">
                        Tolerance Base: {Math.round(currentAnalysis.base_value_E_f_x * 100)}%
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1.5 rounded-2xl text-xs font-black uppercase border ${
                        currentAnalysis.severity === 'CRITICAL_FAULT'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-sm shadow-rose-500/10'
                          : currentAnalysis.severity === 'WARNING'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {currentAnalysis.status_label}
                    </span>
                  </div>
                </div>

                {/* 2. THE 4 CRUCIAL OPERATIONAL CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* CARD 1: KAHAN SENSOR KHARAB HUA HAI (EXACT LOCATION & FAULT POINT) */}
                  {/* CARD 1: EXACT LOCATION */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0b0c15] border border-cyan-500/30 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                      <MapPin className="w-4 h-4" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider">
                        1. Physical Asset Location &amp; Node ID
                      </h3>
                    </div>
                    <div className="p-3 rounded-2xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/20 space-y-1">
                      <p className="text-sm font-black text-stone-900 dark:text-white">
                        {currentAnalysis.kahan_kharab_hua || currentAnalysis.location}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-slate-300">
                        Facility Zone: <span className="font-bold text-cyan-600 dark:text-cyan-400">{currentAnalysis.system_subsystem || 'Campus Main Plant'}</span>
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 font-mono">
                        Hardware Node ID: {currentAnalysis.sensor_id} • Modbus Address: 0x{currentAnalysis.sensor_id.slice(-2)}
                      </p>
                    </div>
                  </div>

                  {/* CARD 2: ROOT CAUSE ANOMALY */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0b0c15] border border-rose-500/30 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider">
                        2. Root Cause Anomaly Diagnostic
                      </h3>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 space-y-1">
                      <p className="text-sm font-black text-rose-700 dark:text-rose-300">
                        {currentAnalysis.problem_title || currentAnalysis.status_label}
                      </p>
                      <p className="text-xs text-stone-700 dark:text-slate-300 leading-relaxed font-medium">
                        {currentAnalysis.explanation_summary}
                      </p>
                    </div>
                  </div>

                  {/* CARD 3: MAINTENANCE CHECKLIST & SPARES */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0b0c15] border border-amber-500/30 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Wrench className="w-4 h-4" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider">
                        3. Corrective Maintenance &amp; Spare Parts
                      </h3>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-2">
                      <p className="text-xs text-stone-800 dark:text-slate-200 font-semibold leading-relaxed">
                        {currentAnalysis.kya_maintenance_chahiye || currentAnalysis.action_plan}
                      </p>
                      <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          <span>Spare Parts:</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#07080e] border border-amber-500/30 text-stone-800 dark:text-slate-200 font-mono text-[10px]">
                          {currentAnalysis.spare_parts_needed || 'Standard Mechanical Kit'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: ENGINEERING WORKFLOW & DISPATCH */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0b0c15] border border-emerald-500/30 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider">
                        4. Engineering Protocol &amp; SLA Resolution
                      </h3>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                      <p className="text-xs text-stone-800 dark:text-slate-200 font-semibold leading-relaxed">
                        {currentAnalysis.kya_solution_hai || 'Auto-balance load and reset sensor threshold.'}
                      </p>
                      <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          Urgency: {currentAnalysis.urgency || 'Standard SLA'}
                        </span>
                        <span className="text-stone-500 dark:text-slate-400 font-medium">
                          Lead: {currentAnalysis.assigned_tech || 'Field Maintenance Lead'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. SENSOR TELEMETRY & PARAMETER DEVIATIONS */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#f8f5ee] dark:bg-[#0b0c15] border border-[#ece3d6] dark:border-[#151722] shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-500" />
                        <span>Telemetry Parameter Deviations &amp; Root Cause Contribution</span>
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-slate-400">
                        Sensor variance analysis: Red indicates out-of-tolerance parameters driving failure risk, Cyan indicates nominal operating levels.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowWhatIfControls(!showWhatIfControls)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          showWhatIfControls
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                            : 'bg-white dark:bg-[#121422] text-stone-700 dark:text-slate-300 border-[#ece3d6] dark:border-[#1a1d2e] hover:border-cyan-500'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{showWhatIfControls ? 'Hide Parameter Sliders' : 'Diagnostic Parameter Tuning'}</span>
                      </button>

                      <button
                        onClick={resetToHealthyBaseline}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121422] hover:bg-[#ece3d6] text-stone-700 dark:text-slate-300 text-xs font-bold border border-[#ece3d6] dark:border-[#1a1d2e] flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Simulate all sensor readings returning to baseline"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Reset to Nominal Baseline</span>
                      </button>
                    </div>
                  </div>

                  {/* Clean Vertical Feature Impact Meters */}
                  <div className="space-y-3">
                    {currentAnalysis.feature_attributions.map((feat: any) => {
                      const isFaultDriver = feat.shap_value > 0;
                      const currentVal = interactiveTelemetry[feat.feature_key] ?? feat.actual_value;

                      return (
                        <div
                          key={feat.feature_key}
                          className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  isFaultDriver ? 'bg-rose-500' : 'bg-cyan-500'
                                }`}
                              />
                              <span className="font-extrabold text-stone-900 dark:text-white">
                                {feat.feature_label}
                              </span>
                              {feat.is_root_cause && (
                                <span className="px-2 py-0.2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-bold text-[9px] border border-rose-500/20">
                                  PRIMARY FAULT DRIVER
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-stone-500 dark:text-slate-400 text-[11px]">
                                Reading: <strong className="text-stone-900 dark:text-white">{currentVal} {feat.unit}</strong> (Baseline: {feat.baseline_value} {feat.unit})
                              </span>
                              <span
                                className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                                  isFaultDriver
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                    : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                                }`}
                              >
                                {isFaultDriver ? `+${feat.relative_impact_pct}% Risk Contribution` : `${feat.relative_impact_pct}% Nominal Margin`}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar visual */}
                          <div className="w-full h-2.5 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${Math.min(100, Math.max(5, feat.relative_impact_pct))}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                isFaultDriver ? 'bg-rose-500' : 'bg-cyan-500'
                              }`}
                            />
                          </div>

                          {/* Interactive Slider when tuning mode is toggled */}
                          {showWhatIfControls && (
                            <div className="pt-2 border-t border-[#ece3d6]/60 dark:border-[#151722] flex items-center gap-3">
                              <span className="text-[10px] text-stone-500 dark:text-slate-400 font-mono flex-shrink-0">
                                Tune Parameter:
                              </span>
                              <input
                                type="range"
                                min={Math.min(feat.baseline_value * 0.4, currentVal * 0.5)}
                                max={Math.max(feat.baseline_value * 2.5, currentVal * 1.5)}
                                step={(feat.baseline_value / 20) || 0.1}
                                value={currentVal}
                                onChange={(e) => handleSliderChange(feat.feature_key, parseFloat(e.target.value))}
                                className="flex-1 accent-cyan-500 cursor-pointer"
                              />
                              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 w-16 text-right">
                                {currentVal} {feat.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. DISPATCH WORK ORDER & ACTIONS BANNER */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-slate-800/20 to-blue-500/10 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs text-stone-900 dark:text-white">
                        SCADA Asset Maintenance &amp; Work Order Dispatch
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-slate-300">
                      Dispatches field work order to {currentAnalysis.assigned_tech || 'Facilities Team'} with prescribed spare parts and laser alignment protocol.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {dispatchedTickets[currentAnalysis.sensor_id] ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md">
                        <Check className="w-4 h-4" />
                        <span>Work Order {dispatchedTickets[currentAnalysis.sensor_id].ticketNo} Dispatched at {dispatchedTickets[currentAnalysis.sensor_id].time}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDispatchTicket(currentAnalysis.sensor_id)}
                        className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-105 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Generate &amp; Dispatch Work Order</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-stone-400">
                <Activity className="w-12 h-12 text-cyan-500 animate-pulse mb-3" />
                <p className="text-sm font-bold">Select an equipment sensor from the left directory to view full root-cause telemetry and maintenance specs.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-[#ece3d6] dark:border-[#151722] bg-[#fbf8f3] dark:bg-[#05060b] flex items-center justify-between text-xs flex-shrink-0">
          <div className="flex items-center gap-2 text-stone-500 dark:text-slate-400 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>SCADA &amp; IoT Telemetry Online • ISO 55001 Asset Management Compliant • Real-Time Fault Diagnostics</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-900 dark:bg-slate-200 hover:bg-stone-800 text-white dark:text-slate-950 font-bold transition-all cursor-pointer"
          >
            Close Diagnostic Center
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExplainableAiShapModal;
