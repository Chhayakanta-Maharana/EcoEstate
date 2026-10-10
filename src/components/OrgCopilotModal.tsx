'use client';

import React, { useState, useEffect } from 'react';
import { DjangoApi, OrgCopilotResponse, OrgCopilotRequest, SensorEvaluation } from '@/services/api';
import {
  BrainCircuit,
  X,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Zap,
  Droplets,
  Wind,
  Trash2,
  Thermometer,
  Wrench,
  ShieldCheck,
  Send,
  Sparkles,
  RefreshCw,
  Building2,
  Hospital,
  Factory,
  GraduationCap,
  Landmark,
  Layers,
  ChevronRight,
  Gauge,
  Sliders,
  Check,
  Flame,
  Activity,
} from 'lucide-react';

interface OrgCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrgType?: 'HOSPITAL' | 'INDUSTRY' | 'COLLEGE' | 'PSU' | 'COMMERCIAL';
  initialCluster?: string;
}

// Organization Presets
const ORG_PERSONAS = [
  {
    id: 'HOSPITAL',
    label: 'Hospital',
    icon: Hospital,
    badge: '🏥 Zero-Downtime Cleanroom',
    color: 'from-rose-500 to-red-600',
    borderColor: 'border-rose-500/40',
    activeBg: 'bg-rose-500/20 text-rose-300 border-rose-500',
    desc: 'Life-critical utility, ICU redundancy, NABH & ISO 14644 compliance.'
  },
  {
    id: 'INDUSTRY',
    label: 'Heavy Industry',
    icon: Factory,
    badge: '🏭 Mechanical Reliability',
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/40',
    activeBg: 'bg-amber-500/20 text-amber-300 border-amber-500',
    desc: 'Zero production stoppage, ISO 10816 vibration standards, OSHA LOTO.'
  },
  {
    id: 'COLLEGE',
    label: 'College Campus',
    icon: GraduationCap,
    badge: '🎓 Academic & Green Estate',
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/40',
    activeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500',
    desc: 'Student safety, hostel comfort, STP water reuse, green campus score.'
  },
  {
    id: 'PSU',
    label: 'PSU / Municipal',
    icon: Landmark,
    badge: '🏛️ Civic ESG Infrastructure',
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-500/40',
    activeBg: 'bg-blue-500/20 text-blue-300 border-blue-500',
    desc: 'CPCB CAAQMS compliance, statutory clean air, public transparency.'
  },
  {
    id: 'COMMERCIAL',
    label: 'Commercial IT Park',
    icon: Building2,
    badge: '🏬 Tenant IAQ & Efficiency',
    color: 'from-purple-500 to-fuchsia-600',
    borderColor: 'border-purple-500/40',
    activeBg: 'bg-purple-500/20 text-purple-300 border-purple-500',
    desc: 'Tenant comfort, CO2 < 800ppm, sub-metering, after-hours maintenance.'
  }
];

interface ClusterScenario {
  label: string;
  telemetry: Record<string, number>;
}

interface ClusterMeta {
  id: string;
  name: string;
  icon: any;
  color: string;
  defaultTelemetry: Record<string, number>;
  sampleScenarios: ClusterScenario[];
}

// Telemetry Clusters
const CLUSTER_CONFIG: ClusterMeta[] = [
  {
    id: 'WATER',
    name: 'Water & STP MBBR',
    icon: Droplets,
    color: 'text-cyan-400',
    defaultTelemetry: {
      vibration_mm_s: 4.8,
      operating_temp_c: 82.0,
      flow_rate_lps: 12.4,
      current_draw_a: 42.5,
      acoustic_noise_db: 78.0,
    },
    sampleScenarios: [
      { label: 'Bearing Wear & Cavitation', telemetry: { vibration_mm_s: 4.8, operating_temp_c: 82.0, flow_rate_lps: 11.2, current_draw_a: 44.0, acoustic_noise_db: 79.0 } },
      { label: 'Normal Baseline Flow', telemetry: { vibration_mm_s: 1.1, operating_temp_c: 44.0, flow_rate_lps: 18.5, current_draw_a: 28.0, acoustic_noise_db: 54.0 } },
    ]
  },
  {
    id: 'ENERGY',
    name: 'Energy & Substation',
    icon: Zap,
    color: 'text-amber-400',
    defaultTelemetry: {
      oil_temp_c: 78.5,
      harmonic_thd_pct: 7.2,
      power_factor: 0.84,
      active_load_kw: 760.0,
      neutral_current_a: 28.0,
    },
    sampleScenarios: [
      { label: 'Oil Overheat & THD Spike', telemetry: { oil_temp_c: 84.0, harmonic_thd_pct: 8.2, power_factor: 0.82, active_load_kw: 810.0, neutral_current_a: 32.0 } },
      { label: 'Optimal Grid Balance', telemetry: { oil_temp_c: 48.0, harmonic_thd_pct: 2.4, power_factor: 0.98, active_load_kw: 420.0, neutral_current_a: 4.2 } },
    ]
  },
  {
    id: 'AQI',
    name: 'CPCB AQI & Air Quality',
    icon: Wind,
    color: 'text-emerald-400',
    defaultTelemetry: {
      pm25_ug_m3: 135.0,
      pm10_ug_m3: 210.0,
      co2_ppm: 880.0,
      voc_ppb: 280.0,
      humidity_pct: 78.0,
    },
    sampleScenarios: [
      { label: 'Laser Lens Dust Choke', telemetry: { pm25_ug_m3: 145.0, pm10_ug_m3: 240.0, co2_ppm: 920.0, voc_ppb: 310.0, humidity_pct: 82.0 } },
      { label: 'Clean Air Standard', telemetry: { pm25_ug_m3: 28.0, pm10_ug_m3: 52.0, co2_ppm: 430.0, voc_ppb: 85.0, humidity_pct: 55.0 } },
    ]
  },
  {
    id: 'WASTE',
    name: 'Smart Waste Bins',
    icon: Trash2,
    color: 'text-indigo-400',
    defaultTelemetry: {
      fill_level_pct: 94.0,
      battery_voltage_pct: 88.0,
      methane_ppm: 42.0,
      distance_cm: 8.0,
    },
    sampleScenarios: [
      { label: 'Bin Overflow Warning', telemetry: { fill_level_pct: 95.0, battery_voltage_pct: 85.0, methane_ppm: 48.0, distance_cm: 6.0 } },
      { label: 'Clean Emptied Bin', telemetry: { fill_level_pct: 12.0, battery_voltage_pct: 98.0, methane_ppm: 2.0, distance_cm: 95.0 } },
    ]
  },
  {
    id: 'HVAC',
    name: 'Chiller & HVAC Plant',
    icon: Thermometer,
    color: 'text-blue-400',
    defaultTelemetry: {
      vibration_mm_s: 4.2,
      operating_temp_c: 79.0,
      head_pressure_bar: 2.6,
      flow_rate_lps: 13.0,
      current_draw_a: 48.0,
    },
    sampleScenarios: [
      { label: 'ICU Cleanroom Pressure Drop', telemetry: { vibration_mm_s: 4.5, operating_temp_c: 81.0, head_pressure_bar: 2.3, flow_rate_lps: 11.5, current_draw_a: 51.0 } },
      { label: 'Optimal Cooling Loop', telemetry: { vibration_mm_s: 1.2, operating_temp_c: 42.0, head_pressure_bar: 4.4, flow_rate_lps: 19.0, current_draw_a: 27.0 } },
    ]
  }
];

export const OrgCopilotModal: React.FC<OrgCopilotModalProps> = ({
  isOpen,
  onClose,
  initialOrgType = 'HOSPITAL',
  initialCluster = 'WATER',
}) => {
  const [selectedOrg, setSelectedOrg] = useState<string>(initialOrgType);
  const [selectedCluster, setSelectedCluster] = useState<string>(initialCluster);
  const [telemetry, setTelemetry] = useState<Record<string, number>>({});
  const [userQuery, setUserQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<OrgCopilotResponse | null>(null);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  // Initialize telemetry on cluster change
  useEffect(() => {
    const clusterObj = CLUSTER_CONFIG.find((c) => c.id === selectedCluster) || CLUSTER_CONFIG[0];
    setTelemetry({ ...clusterObj.defaultTelemetry });
  }, [selectedCluster]);

  // Execute AI Diagnostic Query
  const handleRunDiagnosis = async (customQuery?: string) => {
    setIsLoading(true);
    try {
      const activeQuery = customQuery || userQuery || `Perform complete telemetry diagnosis for ${selectedCluster} under ${selectedOrg} operating criteria.`;
      const res = await DjangoApi.queryOrgCopilot({
        org_type: selectedOrg,
        cluster: selectedCluster,
        sensor_telemetry: telemetry,
        user_query: activeQuery,
        org_name: `EcoEstate ${selectedOrg} Campus`
      });
      setDiagnosis(res);
    } catch (err) {
      console.error('Diagnosis error', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial diagnostic on open
  useEffect(() => {
    if (isOpen && !diagnosis) {
      handleRunDiagnosis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOrgMeta = ORG_PERSONAS.find((o) => o.id === selectedOrg) || ORG_PERSONAS[0];
  const currentClusterMeta = CLUSTER_CONFIG.find((c) => c.id === selectedCluster) || CLUSTER_CONFIG[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/40 text-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Multi-Behavior AI Copilot & Diagnostic System
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                  Groq LPU Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dynamic organization personas, strict telemetry thresholds, and automated maintenance workflows.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Organization Persona Selector Bar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Organization Mode:
          </span>
          {ORG_PERSONAS.map((org) => {
            const Icon = org.icon;
            const isSelected = selectedOrg === org.id;
            return (
              <button
                key={org.id}
                onClick={() => {
                  setSelectedOrg(org.id);
                  setDiagnosis(null);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? `${org.activeBg} ring-1 ring-white/20 shadow-md`
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{org.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Persona Header Banner */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  {currentOrgMeta.badge}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                  {selectedOrg}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {currentOrgMeta.desc}
              </p>
            </div>

            {/* Telemetry Cluster Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CLUSTER_CONFIG.map((c) => {
                const Icon = c.icon;
                const isClusterActive = selectedCluster === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCluster(c.id);
                      setDiagnosis(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isClusterActive
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Telemetry Controller & Quick Scenarios */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left: Live Parameter Sliders */}
            <div className="lg:col-span-8 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    {currentClusterMeta.name} Telemetry Ingestion
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Scenarios:</span>
                  {currentClusterMeta.sampleScenarios.map((sc, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTelemetry({ ...sc.telemetry })}
                      className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {Object.entries(telemetry).map(([paramKey, val]) => (
                  <div key={paramKey} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono text-[11px] truncate" title={paramKey}>
                        {paramKey.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-cyan-300 font-mono">
                        {val}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={paramKey.includes('temp') ? 120 : paramKey.includes('vibration') ? 10 : paramKey.includes('thd') ? 15 : paramKey.includes('load') ? 1000 : 300}
                      step={0.1}
                      value={val}
                      onChange={(e) =>
                        setTelemetry({ ...telemetry, [paramKey]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Trigger Diagnosis Box */}
            <div className="lg:col-span-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Quick Inquiries
                </span>
                <div className="flex flex-col gap-1.5">
                  {[
                    selectedOrg === 'HOSPITAL'
                      ? 'ICU Cleanroom & Chiller Emergency Check'
                      : 'ISO 10816 Vibration & Mechanical Wear',
                    'Check required spare parts & maintenance steps',
                    'Evaluate compliance standards & tolerance'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setUserQuery(preset);
                        handleRunDiagnosis(preset);
                      }}
                      className="text-left text-xs p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800/80 transition flex items-center justify-between group"
                    >
                      <span className="truncate">{preset}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Diagnose Button */}
              <button
                disabled={isLoading}
                onClick={() => handleRunDiagnosis()}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing with Groq Cloud...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run {selectedOrg} Diagnosis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Diagnostic Output Results */}
          {diagnosis && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Urgency & Persona Alert Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  diagnosis.urgency === 'EMERGENCY'
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                    : diagnosis.urgency === 'CRITICAL'
                    ? 'bg-red-950/40 border-red-500/60 text-red-200'
                    : diagnosis.urgency === 'WARNING'
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                    : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10">
                    {diagnosis.urgency === 'EMERGENCY' ? (
                      <AlertOctagon className="w-6 h-6 text-rose-400 animate-pulse" />
                    ) : diagnosis.urgency === 'CRITICAL' ? (
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    ) : diagnosis.urgency === 'WARNING' ? (
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold uppercase tracking-wider">
                        {diagnosis.urgency} STATUS
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 font-mono">
                        {diagnosis.source || 'Groq Llama-3.3-70B'}
                      </span>
                    </div>
                    <p className="text-xs opacity-90">
                      {diagnosis.persona_summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {diagnosis.compliance_standards && diagnosis.compliance_standards.map((std, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 rounded bg-black/40 border border-white/10 text-white font-mono">
                      {std}
                    </span>
                  ))}
                </div>
              </div>

              {/* Telemetry Evaluation Table */}
              {diagnosis.sensor_evaluations && diagnosis.sensor_evaluations.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Live Telemetry vs Safety Baseline Standards
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {diagnosis.sensor_evaluations.map((ev, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border flex flex-col justify-between ${
                          ev.status === 'CRITICAL'
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : ev.status === 'ELEVATED'
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{ev.parameter}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              ev.status === 'CRITICAL'
                                ? 'bg-rose-500 text-white'
                                : ev.status === 'ELEVATED'
                                ? 'bg-amber-500 text-black'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between text-xs font-mono">
                          <div>
                            <span className="text-slate-400 text-[10px]">Measured: </span>
                            <span className="font-bold text-white text-sm">
                              {ev.measured_value} {ev.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 text-[10px]">Safe Limit: </span>
                            <span className="text-slate-300">
                              {ev.threshold_value} {ev.unit}
                            </span>
                          </div>
                        </div>

                        <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Deviation:</span>
                          <span
                            className={`font-mono font-bold ${
                              ev.deviation_pct.startsWith('+') && ev.status !== 'NORMAL'
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {ev.deviation_pct}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immediate Emergency Action Protocols */}
              {diagnosis.immediate_actions && diagnosis.immediate_actions.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/30 to-red-950/20 border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                      Immediate Action Protocol (Mandatory First Response)
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {diagnosis.immediate_actions.map((act, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-rose-500/20 text-xs text-rose-100"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-[11px] border border-rose-500/40">
                          {i + 1}
                        </span>
                        <span className="font-medium">{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maintenance Steps & Tools / Spares Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left: Step-by-Step Maintenance Protocol */}
                <div className="lg:col-span-7 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Step-by-Step Maintenance Protocol
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {diagnosis.maintenance_steps && diagnosis.maintenance_steps.map((st, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition"
                      >
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] mt-0.5">
                          {i + 1}
                        </span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Required Tools & Spare Parts */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Tools Box */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                        Required Tools & Testing Gear
                      </h4>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {diagnosis.required_tools && diagnosis.required_tools.map((tl, i) => (
                        <li key={i} className="flex items-center gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                          <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="truncate">{tl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Spare Parts Box */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <h4 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                        Recommended Spare Parts
                      </h4>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {diagnosis.spare_parts && diagnosis.spare_parts.map((sp, i) => (
                        <li key={i} className="flex items-center gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="truncate font-mono text-[11px] text-emerald-200">{sp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

              {/* Detailed Technical Narrative */}
              {diagnosis.answer && (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                    <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                      AI Diagnostic Reasoning & Rationale
                    </span>
                  </div>
                  <div className="prose prose-invert prose-xs max-w-none whitespace-pre-line text-slate-300">
                    {diagnosis.answer}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Bottom Interactive Query Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
          <input
            type="text"
            placeholder={`Ask a question for ${currentOrgMeta.label} mode (e.g. "What is the procedure if vibration breaches 4.5 mm/s?")...`}
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userQuery.trim()) {
                handleRunDiagnosis();
              }
            }}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <button
            disabled={isLoading || !userQuery.trim()}
            onClick={() => handleRunDiagnosis()}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 transition disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </div>

      </div>
    </div>
  );
};
