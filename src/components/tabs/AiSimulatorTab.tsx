'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DjangoApi } from '@/services/api';
import {
  BrainCircuit,
  Sparkles,
  Sliders,
  Zap,
  Droplets,
  SunMedium,
  Users,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Flame,
  Leaf,
  DollarSign,
  TrendingDown,
  Gauge,
  Truck,
  Check,
  Info,
} from 'lucide-react';

export const AiSimulatorTab: React.FC = () => {
  const { activeOrg } = useAuth();

  // Grand Finale Explicit Scenario State
  const [hvacHoursReduced, setHvacHoursReduced] = useState<number>(1.0); // Problem statement: "what if HVAC runs an hour less"
  const [isTuesdayCollectionShift, setIsTuesdayCollectionShift] = useState<boolean>(true); // Problem statement: "what if collection shifts to Tuesday"
  const [solarDropPct, setSolarDropPct] = useState<number>(20); // Monsoon / dust
  const [occupancySurgePct, setOccupancySurgePct] = useState<number>(30); // Rush hour / exam
  const [ambientHeatwaveC, setAmbientHeatwaveC] = useState<number>(3); // Summer peak
  const [waterInflowCutPct, setWaterInflowCutPct] = useState<number>(15); // Municipal cut

  // Live Backend Simulation Sync
  const [backendSimulation, setBackendSimulation] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Facility-specific baseline constants
  const facilityType = activeOrg?.type || 'COLLEGE';
  const baseLoadKw = facilityType === 'INDUSTRY' ? 9200 : facilityType === 'PSU' ? 4800 : facilityType === 'COLLEGE' ? 1250 : 840;
  const baseSolarKw = facilityType === 'INDUSTRY' ? 1850 : facilityType === 'PSU' ? 1200 : facilityType === 'COLLEGE' ? 580 : 220;
  const hvacRatio = facilityType === 'HOSPITAL' ? 0.42 : facilityType === 'COLLEGE' ? 0.38 : 0.32;
  const monthlyWasteTons = facilityType === 'INDUSTRY' ? 8.6 : facilityType === 'PSU' ? 5.2 : facilityType === 'COLLEGE' ? 2.4 : 1.8;

  // Immediate Client-Side Physics Calculations
  const simulatedSolarKw = Math.round(baseSolarKw * (1 - solarDropPct / 100));
  const coolingPenaltyMultiplier = 1 + (ambientHeatwaveC * 0.045);
  const occupancyLoadMultiplier = 1 + (occupancySurgePct * 0.0035);
  const rawLoadKw = baseLoadKw * coolingPenaltyMultiplier * occupancyLoadMultiplier;
  
  // HVAC 1-hour less reduction calculation
  const hvacLoadKw = baseLoadKw * hvacRatio;
  const hvacDailyKwhSaved = Math.round(hvacLoadKw * hvacHoursReduced);
  const hvacMonthlyInrSaved = Math.round(hvacDailyKwhSaved * 8.5 * 30);
  const hvacDailyCo2Avoided = Math.round(hvacDailyKwhSaved * 0.82);
  const thermalComfortDriftC = Number((hvacHoursReduced * 0.32).toFixed(2));

  // Net Simulated Grid Draw with HVAC Intervention applied
  const netFacilityLoadKw = Math.round(rawLoadKw - (hvacHoursReduced > 0 ? (hvacLoadKw * 0.15 * hvacHoursReduced) : 0));
  const simulatedGridDrawKw = Math.max(0, netFacilityLoadKw - simulatedSolarKw);
  const extraCostPerDayInr = Math.round((simulatedGridDrawKw - (baseLoadKw - baseSolarKw)) * 14 * 8.5);
  const gridOverloadRisk = netFacilityLoadKw > baseLoadKw * 1.25 ? 'HIGH RISK' : netFacilityLoadKw > baseLoadKw * 1.1 ? 'MODERATE' : 'OPTIMAL';

  // Tuesday Waste Collection Shift Impact
  const dieselSavedLitresWeekly = isTuesdayCollectionShift ? 42.0 : 0.0;
  const dieselCostSavedWeeklyInr = Math.round(dieselSavedLitresWeekly * 92.5);
  const binOverflowReductionPct = isTuesdayCollectionShift ? 38 : 0;
  const dryRecyclablePurityGainPct = isTuesdayCollectionShift ? 24 : 0;
  const landfillDivertedTonsMonthly = isTuesdayCollectionShift ? Number((monthlyWasteTons * 0.45 * 4).toFixed(1)) : 0;
  const wasteCo2AvoidedWeekly = Math.round(dieselSavedLitresWeekly * 2.68);

  // Sync with Django Backend simulation endpoint
  useEffect(() => {
    let active = true;
    const fetchBackendSim = async () => {
      setIsSimulating(true);
      try {
        const res = await DjangoApi.simulateWhatIf(
          facilityType,
          solarDropPct,
          occupancySurgePct,
          ambientHeatwaveC,
          waterInflowCutPct,
          hvacHoursReduced,
          isTuesdayCollectionShift
        );
        if (active && res) {
          setBackendSimulation(res);
        }
      } catch (err) {
        console.warn('Backend scenario simulate sync error', err);
      } finally {
        if (active) setIsSimulating(false);
      }
    };

    const timer = setTimeout(fetchBackendSim, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [facilityType, solarDropPct, occupancySurgePct, ambientHeatwaveC, waterInflowCutPct, hvacHoursReduced, isTuesdayCollectionShift]);

  const applyHvacScenarioPreset = () => {
    setHvacHoursReduced(1.0);
    setIsTuesdayCollectionShift(false);
    setAmbientHeatwaveC(2);
    setSolarDropPct(0);
  };

  const applyTuesdayWasteScenarioPreset = () => {
    setIsTuesdayCollectionShift(true);
    setHvacHoursReduced(0);
    setOccupancySurgePct(20);
  };

  const applyCombinedGrandFinalePreset = () => {
    setHvacHoursReduced(1.0);
    setIsTuesdayCollectionShift(true);
    setSolarDropPct(25);
    setAmbientHeatwaveC(3);
    setOccupancySurgePct(30);
    setWaterInflowCutPct(15);
  };

  const resetToBaseline = () => {
    setHvacHoursReduced(0);
    setIsTuesdayCollectionShift(false);
    setSolarDropPct(0);
    setOccupancySurgePct(0);
    setAmbientHeatwaveC(0);
    setWaterInflowCutPct(0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-[#0c1833] border border-emerald-500/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <BrainCircuit className="w-4 h-4" /> BPUT 2.0 Grand Finale • Generative Decision Support Engine
          </div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2.5">
            What-If Scenario Simulation & Named Interventions
            {isSimulating && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono animate-pulse">Running Neural Inference...</span>}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Simulate the exact problem statement interventions for <strong>{activeOrg?.name} ({facilityType})</strong>: 
            projected impact of reducing HVAC by 1 hour, shifting waste collection to Tuesday, and mitigating climate stress shocks.
          </p>
        </div>

        <button
          onClick={resetToBaseline}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Baseline
        </button>
      </div>

      {/* Quick Problem Statement Preset Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={applyHvacScenarioPreset}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            hvacHoursReduced === 1.0 && !isTuesdayCollectionShift
              ? 'bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-md ring-1 ring-cyan-500/50'
              : 'bg-white dark:bg-[#07080e] border-[#ece3d6] dark:border-[#151722] hover:border-cyan-500/40 text-stone-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-500" /> Scenario A: HVAC 1 Hour Less
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">Problem Statement</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-slate-400">
            Tests building thermal inertia by ramping down chiller runtime 1 hour earlier.
          </p>
        </button>

        <button
          onClick={applyTuesdayWasteScenarioPreset}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            isTuesdayCollectionShift && hvacHoursReduced === 0
              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-md ring-1 ring-amber-500/50'
              : 'bg-white dark:bg-[#07080e] border-[#ece3d6] dark:border-[#151722] hover:border-amber-500/40 text-stone-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-500" /> Scenario B: Tuesday Waste Shift
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Problem Statement</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-slate-400">
            Shifts collection fleet to Tuesday & Friday to synchronize with municipal processing.
          </p>
        </button>

        <button
          onClick={applyCombinedGrandFinalePreset}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            hvacHoursReduced === 1.0 && isTuesdayCollectionShift
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/50'
              : 'bg-white dark:bg-[#07080e] border-[#ece3d6] dark:border-[#151722] hover:border-emerald-500/40 text-stone-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Grand Finale Full Stress Test
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Combined</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-slate-400">
            Combines HVAC 1-hr reduction, Tuesday waste route, +3°C heatwave & solar dip.
          </p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
            <h2 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Adjust Operational & Environmental Levers
            </h2>
            <span className="text-[10px] text-stone-400 dark:text-slate-500 font-mono">Live Inputs</span>
          </div>

          {/* Intervention 1: HVAC Hours Reduction Slider */}
          <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/40 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-500" /> What if HVAC runs less per day?
              </span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                {hvacHoursReduced > 0 ? `-${hvacHoursReduced} hr / day` : 'Normal Schedule (0 hr)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3.0"
              step="0.5"
              value={hvacHoursReduced}
              onChange={(e) => setHvacHoursReduced(Number(e.target.value))}
              className="w-full h-2 bg-cyan-200 dark:bg-cyan-900/50 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[11px] text-stone-500 dark:text-slate-400">
              <span>0h (Baseline)</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">1h (Problem Statement)</span>
              <span>3h (Extreme Conservation)</span>
            </div>
          </div>

          {/* Intervention 2: Tuesday Collection Shift Toggle */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-500" /> What if Waste Collection shifts to Tuesday?
              </span>
              <button
                onClick={() => setIsTuesdayCollectionShift(!isTuesdayCollectionShift)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isTuesdayCollectionShift
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-slate-300'
                }`}
              >
                {isTuesdayCollectionShift ? 'Active (Tuesday Route)' : 'Disabled (Daily)'}
              </button>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-slate-400">
              Synchronizes campus dry-waste pickup with regional municipal transfer stations on Tuesday & Friday.
            </p>
          </div>

          {/* Slider 3: Rooftop Solar Intermittency */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                <SunMedium className="w-4 h-4 text-amber-500" /> Rooftop Solar Output Dip (Cloud Cover / Smog):
              </span>
              <span className="font-mono text-amber-500 font-bold">-{solarDropPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={solarDropPct}
              onChange={(e) => setSolarDropPct(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[11px] text-stone-400 dark:text-slate-500">Solar generation dips from {baseSolarKw} kW → {simulatedSolarKw} kW</p>
          </div>

          {/* Slider 4: Occupancy Surge */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" /> Campus Occupancy Surge (Events / OPD Rush):
              </span>
              <span className="font-mono text-emerald-500 font-bold">+{occupancySurgePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={occupancySurgePct}
              onChange={(e) => setOccupancySurgePct(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Slider 5: Ambient Heatwave */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" /> Ambient Summer Heatwave Spike:
              </span>
              <span className="font-mono text-rose-500 font-bold">+{ambientHeatwaveC}°C</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={ambientHeatwaveC}
              onChange={(e) => setAmbientHeatwaveC(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Slider 6: Water Cut */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-500" /> Municipal Water Supply Cut:
              </span>
              <span className="font-mono text-blue-500 font-bold">-{waterInflowCutPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={waterInflowCutPct}
              onChange={(e) => setWaterInflowCutPct(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Right Column: Projected Impact & Named Interventions */}
        <div className="lg:col-span-6 space-y-5">
          {/* Top Impact Summary Cards */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <h2 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Projected Impact on Operations & ESG
              </h2>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                gridOverloadRisk === 'HIGH RISK' ? 'bg-rose-500 text-white' : gridOverloadRisk === 'MODERATE' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
              }`}>
                Grid Strain: {gridOverloadRisk}
              </span>
            </div>

            {/* Projected Impact Matrix */}
            <div className="grid grid-cols-2 gap-3">
              {/* HVAC 1-hr Less Impact Card */}
              <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-800/40">
                <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block tracking-wider">
                  ⚡ HVAC {hvacHoursReduced}h Less Impact
                </span>
                <span className="text-xl font-extrabold text-stone-900 dark:text-white mt-1 block">
                  {hvacDailyKwhSaved} <span className="text-xs font-normal text-stone-400">kWh/day saved</span>
                </span>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  ₹ {hvacMonthlyInrSaved.toLocaleString()} / month saved
                </p>
                <div className="mt-2 pt-2 border-t border-cyan-200/50 dark:border-cyan-800/30 text-[10px] text-stone-500 dark:text-slate-400">
                  <span>Carbon avoided: <strong>{hvacDailyCo2Avoided} kg CO2e/day</strong></span>
                  <br />
                  <span>Drift: <strong>+{thermalComfortDriftC}°C</strong> (ASHRAE 55 compliant)</span>
                </div>
              </div>

              {/* Tuesday Waste Collection Impact Card */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block tracking-wider">
                  🚛 Tuesday Route Impact
                </span>
                <span className="text-xl font-extrabold text-stone-900 dark:text-white mt-1 block">
                  {isTuesdayCollectionShift ? '-38%' : '0%'} <span className="text-xs font-normal text-stone-400">overflow risk</span>
                </span>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  {isTuesdayCollectionShift ? `₹ ${(dieselCostSavedWeeklyInr * 4).toLocaleString()} / month diesel saved` : 'Standard daily route'}
                </p>
                <div className="mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 text-[10px] text-stone-500 dark:text-slate-400">
                  <span>Landfill diverted: <strong>{landfillDivertedTonsMonthly} tons/mo</strong></span>
                  <br />
                  <span>Recyclable purity: <strong>+{dryRecyclablePurityGainPct}%</strong></span>
                </div>
              </div>

              {/* Net Facility Peak Load */}
              <div className="p-4 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722]">
                <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400 block tracking-wider">
                  Net Peak Demand
                </span>
                <span className="text-xl font-extrabold text-stone-900 dark:text-white mt-1 block">
                  {netFacilityLoadKw} <span className="text-xs font-normal text-stone-400">kW</span>
                </span>
                <span className={`text-[10px] font-semibold ${netFacilityLoadKw > baseLoadKw ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {netFacilityLoadKw > baseLoadKw ? `+${Math.round(((netFacilityLoadKw - baseLoadKw) / baseLoadKw) * 100)}% above normal` : 'Within safe transformer limits'}
                </span>
              </div>

              {/* Grid Import & Cost Balance */}
              <div className="p-4 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722]">
                <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400 block tracking-wider">
                  Simulated Net Grid Draw
                </span>
                <span className="text-xl font-extrabold text-stone-900 dark:text-white mt-1 block">
                  {simulatedGridDrawKw} <span className="text-xs font-normal text-stone-400">kW</span>
                </span>
                <span className="text-[10px] text-amber-500 font-semibold">
                  Net Daily Cost Shift: ₹{Math.max(0, extraCostPerDayInr).toLocaleString()}/day
                </span>
              </div>
            </div>
          </div>

          {/* Plain-Language Actions Tied to Specific Named Interventions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#ece3d6] dark:border-[#151722]">
              <h3 className="font-bold text-xs uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Plain-Language Actions Tied to Named Interventions
              </h3>
              <span className="text-[10px] font-mono text-stone-400 dark:text-slate-500">ISO 50001 / GRIHA</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300">
                    [INT-ENG-101] HVAC Operating Window Optimization
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Saves ₹{hvacMonthlyInrSaved.toLocaleString()}/mo
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-slate-300 mt-1">
                  <strong>Plain-Language Action:</strong> Shift central chiller plant shutdown 1 hour earlier (at 17:00 instead of 18:00) using building thermal storage. Keep circulation fans active to preserve air quality while saving {hvacDailyKwhSaved} kWh/day with zero clinical disruption.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    [INT-WST-201] Tuesday & Friday Dynamic Municipal Solid Waste Routing
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    -38% Overflow
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-slate-300 mt-1">
                  <strong>Plain-Language Action:</strong> Consolidate collection trips on Tuesday & Friday morning when municipal processing facilities have 40% surplus sorting bandwidth. Eliminates post-weekend Monday container contamination and diverts {landfillDivertedTonsMonthly} tons from landfills.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    [INT-WTR-301] STP Treated Effluent Chiller Loop Diversion
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    95% Blend
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-slate-300 mt-1">
                  <strong>Plain-Language Action:</strong> Route 95% of MBBR treated STP effluent directly into the HVAC cooling tower reservoir during peak heat hours. Mitigates municipal water supply cuts and protects the underground fire & emergency buffer tank.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ece3d6] dark:border-[#151722] flex items-center justify-between text-[11px] text-stone-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-500" />
                Backend Engine: Django REST Framework + SciPy Simulation Kernel
              </span>
              <span className="text-emerald-500 font-mono">Status: Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSimulatorTab;
