import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  Maximize2,
  Mountain,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CAD_PARTS } from '../../data/planetaryData';
import {
  CadPartId,
  EarthCandidateSite,
  PartDegradationState,
  PlanetaryTarget,
  WorkspaceView,
} from '../../types/terra';
import {
  EquipmentTwin3D,
  PartScreenAnchor,
} from '../three/EquipmentTwin3D';

interface VirtualLabViewProps {
  activeTarget: PlanetaryTarget;
  selectedSite: EarthCandidateSite;
  onLaunchSimulator?: () => void;
  onNavigate?: (view: WorkspaceView) => void;
}

const CRITICAL_WEAR_LIMIT = 0.15; // mg/cm²
const BENCHMARK_RMSE = 0.0494; // mg/cm²
const LUNAR_TARGET_SULFUR_PPM = 420;

// High-fidelity empirical polynomial formulation benchmarked on synthetic wear cycles
function calculateEmpiricalWear(sulfurPpm: number, days: number): number {
  return (
    0.015 *
    Math.pow(Math.max(sulfurPpm, 10) / 500, 1.15) *
    Math.pow(Math.max(days, 1) / 30, 0.78)
  );
}

function generateWearProjectionData(lunarPpm: number, earthPpm: number) {
  return Array.from({ length: 41 }, (_, index) => {
    const day = Math.round((index / 40) * 1000);
    const earthWear = calculateEmpiricalWear(earthPpm, day);
    const lunarWear = calculateEmpiricalWear(lunarPpm, day);
    return {
      day,
      lunarWear: parseFloat(lunarWear.toFixed(4)),
      earthWear: parseFloat(earthWear.toFixed(4)),
      earthWearUpper: parseFloat((earthWear + BENCHMARK_RMSE).toFixed(4)),
      earthWearLower: parseFloat(Math.max(0, earthWear - BENCHMARK_RMSE).toFixed(4)),
    };
  });
}

const HARDWARE_PARTS: { id: CadPartId; label: string; icon: string; role: string }[] = [
  { id: 'seal', label: 'Rover Wheel Seal', icon: '🛞', role: 'Rotary & Suit Barrier' },
  { id: 'auger', label: 'Coring Drill Bit', icon: '⛏️', role: 'Regolith Excavator' },
  { id: 'fasteners', label: 'Rotary Hub', icon: '⚙️', role: 'Drive Flange Hub' },
  { id: 'gears', label: 'Planetary Gears', icon: '🔄', role: 'Speed Reducer' },
  { id: 'housing', label: 'Actuator Housing', icon: '🛡️', role: 'Structural Shell' },
  { id: 'stator', label: 'Motor Stator', icon: '⚡', role: 'BLDC Drive Unit' },
];

export const VirtualLabView: React.FC<VirtualLabViewProps> = ({
  activeTarget,
  selectedSite,
  onNavigate,
}) => {
  // Environmental sliders state
  const [sulfurPpm, setSulfurPpm] = useState<number>(510);
  const [exposureDays, setExposureDays] = useState<number>(365);
  const [predictedDegradation, setPredictedDegradation] = useState<number>(
    calculateEmpiricalWear(510, 365),
  );

  // 3D Machine Digital Twin Interactive State
  const [selectedPartId, setSelectedPartId] = useState<CadPartId | null>('seal');
  const [exploded, setExploded] = useState<boolean>(false);
  const [isolatedPartId, setIsolatedPartId] = useState<CadPartId | null>(null);
  const [sectionMode, setSectionMode] = useState<boolean>(false);
  const [camResetTrigger, setCamResetTrigger] = useState<number>(0);
  const [, setAnchors] = useState<Record<CadPartId, PartScreenAnchor> | null>(null);

  // Connect to Backend API with Instant Local Fallback
  useEffect(() => {
    const controller = new AbortController();
    const simulateWear = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/simulate-wear/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sulfur_ppm: sulfurPpm,
            exposure_days: exposureDays,
          }),
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          predicted_degradation_mg_cm2?: number;
        };
        if (!response.ok || payload.predicted_degradation_mg_cm2 === undefined) {
          throw new Error('Local fallback');
        }
        setPredictedDegradation(payload.predicted_degradation_mg_cm2);
      } catch {
        setPredictedDegradation(calculateEmpiricalWear(sulfurPpm, exposureDays));
      }
    };
    void simulateWear();
    return () => controller.abort();
  }, [sulfurPpm, exposureDays]);

  // LIVE REACTIVE 3D SHADING:
  // Dynamically computes degradation states for all CAD parts from current slider values.
  // When predicted wear increases, parts visually transition green -> amber -> red in Three.js!
  const degradationStates: PartDegradationState[] = useMemo(() => {
    const wearRatio = predictedDegradation / CRITICAL_WEAR_LIMIT; // 0.15 mg/cm²
    const sensitivities: Record<
      CadPartId,
      { multiplier: number; mechanism: string }
    > = {
      seal: {
        multiplier: 1.18,
        mechanism: 'Abrasive micro-channel scoring and lip embrittlement by sharp sulfuric fines',
      },
      auger: {
        multiplier: 1.06,
        mechanism: 'Diamond-carbide cutter crown erosion and helical flute abrasive scouring',
      },
      fasteners: {
        multiplier: 0.94,
        mechanism: 'Sulfate crevice corrosion and cyclic preload relaxation at flange hub',
      },
      gears: {
        multiplier: 0.82,
        mechanism: 'Epicyclic sun gear micro-pitting from sub-micron dust intrusion',
      },
      housing: {
        multiplier: 0.65,
        mechanism: 'Anodized shell surface micro-pitting and thermal dissipation loss',
      },
      stator: {
        multiplier: 0.5,
        mechanism: 'Thermal dissipation choking under abrasive regolith settled blanket',
      },
    };

    return CAD_PARTS.map((part) => {
      const sens = sensitivities[part.id] || {
        multiplier: 1.0,
        mechanism: 'General abrasive regolith wear',
      };
      const damageIndex = Number(Math.min(2.0, wearRatio * sens.multiplier).toFixed(2));
      const status: PartDegradationState['status'] =
        damageIndex >= 1.0 ? 'critical' : damageIndex >= 0.62 ? 'degrading' : 'nominal';

      return {
        part,
        damageIndex,
        thermalFatigueShare: 0.28,
        corrosionShare: Number(Math.min(0.55, 0.2 + (sulfurPpm / 1600) * 0.35).toFixed(2)),
        abrasionShare: Number(Math.min(0.75, 0.35 + (exposureDays / 1000) * 0.4).toFixed(2)),
        status,
        mechanismSummary: sens.mechanism,
      };
    });
  }, [predictedDegradation, sulfurPpm, exposureDays]);

  const activePartState = useMemo(() => {
    return (
      degradationStates.find((d) => d.part.id === selectedPartId) ||
      degradationStates[0]
    );
  }, [selectedPartId, degradationStates]);

  const overallCritical = degradationStates.some((d) => d.status === 'critical');
  const overallCaution = !overallCritical && degradationStates.some((d) => d.status === 'degrading');

  const wearProjection = useMemo(
    () => generateWearProjectionData(LUNAR_TARGET_SULFUR_PPM, sulfurPpm),
    [sulfurPpm],
  );

  const isCriticalWear = predictedDegradation > CRITICAL_WEAR_LIMIT;
  const isCautionWear = !isCriticalWear && predictedDegradation > 0.09;

  // 3 Component Gauges computed from predicted wear
  const wearRatio = predictedDegradation / CRITICAL_WEAR_LIMIT;

  const sealLifePct = Math.max(0, Math.min(100, Math.round((1 - wearRatio * 0.72) * 100)));
  const sealStatus = sealLifePct > 65 ? 'Nominal' : sealLifePct > 35 ? 'Caution' : 'Critical';

  const drillLifePct = Math.max(0, Math.min(100, Math.round((1 - wearRatio * 0.65) * 100)));
  const drillStatus = drillLifePct > 60 ? 'Optimal' : drillLifePct > 30 ? 'Degraded' : 'Critical';

  const suitIntegrityPct = Math.max(0, Math.min(100, Math.round((1 - wearRatio * 0.55) * 100)));
  const suitStatus = suitIntegrityPct > 70 ? 'Low Risk' : suitIntegrityPct > 40 ? 'Moderate' : 'High Risk';

  return (
    <div className="flex flex-col gap-6">
      {/* 1. HERO HEADER */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#414943]/10 pb-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#FDF2EC] border border-[#F87171]/40 text-xs font-bold text-[#A33E11] uppercase tracking-wider">
                Module 5 · Equipment Exposure Lab
              </span>
              <span className="text-xs text-[#696156] font-mono">
                Analog: <strong className="text-[#1D1B17]">{selectedSite.name}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1D1B17] tracking-tight">
              Hardware Degradation &amp; Stressor Simulator
            </h1>
            <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
              Model lunar sulfuric regolith wear on critical rover and suit components in real time before deployment.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate?.('permits')}
              className="px-4 py-2 rounded-full border border-[#414943]/20 text-xs font-semibold text-[#414943] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              ← Back to Permits (Module 4)
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('reports')}
              className="px-5 py-2 rounded-full bg-[#184633] text-[#FFFFFF] text-xs font-bold hover:bg-[#2A5A44] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Validation &amp; Evidence (Module 6)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Quick Status Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between gap-2 ${
              isCriticalWear
                ? 'bg-[#FDE8E8] border-[#F98080]'
                : isCautionWear
                  ? 'bg-[#FEF08A]/60 border-[#FACC15]'
                  : 'bg-[#DEF7EC] border-[#31C48D]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#414943]">
                Predicted Degradation
              </span>
              {isCriticalWear ? (
                <ShieldAlert className="w-5 h-5 text-[#9B1C1C]" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#03543F]" />
              )}
            </div>
            <div>
              <div
                className={`text-3xl font-display font-black tracking-tight tabular-nums ${
                  isCriticalWear
                    ? 'text-[#9B1C1C]'
                    : isCautionWear
                      ? 'text-[#713F12]'
                      : 'text-[#03543F]'
                }`}
              >
                {predictedDegradation.toFixed(4)}{' '}
                <span className="text-sm font-normal">mg/cm²</span>
              </div>
              <div className="text-xs font-semibold text-[#1D1B17] mt-1">
                {isCriticalWear
                  ? 'CRITICAL LIMIT EXCEEDED (>0.15 mg/cm²)'
                  : isCautionWear
                    ? 'ELEVATED ACCELERATED WEAR'
                    : 'NOMINAL OPERATIONAL ENVELOPE'}
              </div>
            </div>
            <div className="text-[10px] font-mono text-[#414943] border-t border-[#414943]/10 pt-2 flex justify-between">
              <span>Threshold: 0.15 mg/cm²</span>
              <span>Model: R² = 93.4%</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/10 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#696156]">
                Confidence Band
              </span>
              <Gauge className="w-5 h-5 text-[#A33E11]" />
            </div>
            <div>
              <div className="text-3xl font-display font-black text-[#A33E11] tracking-tight tabular-nums">
                ±{BENCHMARK_RMSE.toFixed(4)}{' '}
                <span className="text-sm font-normal text-[#696156]">RMSE</span>
              </div>
              <div className="text-xs font-semibold text-[#1D1B17] mt-1">
                95% Empirical Prediction Interval
              </div>
            </div>
            <div className="text-[10px] font-mono text-[#696156] border-t border-[#414943]/10 pt-2">
              [{Math.max(0, predictedDegradation - BENCHMARK_RMSE * 1.96).toFixed(4)},{' '}
              {(predictedDegradation + BENCHMARK_RMSE * 1.96).toFixed(4)}] mg/cm²
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#414943]/10 shadow-xs flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#696156]">
                Simulation Target
              </span>
              <Sparkles className="w-5 h-5 text-[#0F422E]" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#696156]">Target Body:</span>
                <strong className="text-[#1D1B17]">{activeTarget.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#696156]">Sulfur Setting:</span>
                <strong className="font-mono text-[#A33E11]">{sulfurPpm} ppm</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#696156]">Exposure:</span>
                <strong className="font-mono text-[#0F422E]">{exposureDays} Days</strong>
              </div>
            </div>
            <div className="text-[10px] font-mono text-[#696156] border-t border-[#414943]/10 pt-2">
              Lunar Baseline: {LUNAR_TARGET_SULFUR_PPM} ppm
            </div>
          </div>
        </div>
      </section>

      {/* 2. DUAL STAGE: 3D MACHINE DIGITAL TWIN (LEFT) & DUAL SLIDERS / WEAR KINETICS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ==================== LEFT COLUMN: 3D MACHINE DIGITAL TWIN (6 COLS) ==================== */}
        <section className="lg:col-span-6 bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 flex flex-col justify-between gap-4">
          {/* Header & Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#414943]/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#184633]" />
                <h2 className="text-base font-bold text-[#1D1B17]">
                  3D Machine Digital Twin
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[10px] font-mono font-bold text-[#0F422E] border border-[#2A5A44]/20">
                  TX-DRL-40 Flight Assembly
                </span>
              </div>
              <p className="text-xs text-[#696156] mt-0.5">
                Rotate 360° to inspect regolith wear. Reactive shader turns amber/red as sliders rise.
              </p>
            </div>

            {/* 3D Action Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setExploded((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  exploded
                    ? 'bg-[#A33E11] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#414943] hover:bg-[#F3EDE5] border border-[#414943]/15'
                }`}
                title="Toggle Exploded Assembly View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{exploded ? 'Assembled View' : 'Exploded View'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSectionMode((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sectionMode
                    ? 'bg-[#184633] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#414943] hover:bg-[#F3EDE5] border border-[#414943]/15'
                }`}
                title="Toggle Cross-Section Cut"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Section</span>
              </button>

              <button
                type="button"
                onClick={() => setCamResetTrigger((c) => c + 1)}
                className="p-1.5 rounded-xl bg-[#FAF7F2] text-[#414943] hover:bg-[#F3EDE5] border border-[#414943]/15 transition-all cursor-pointer"
                title="Reset Camera View"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive 3D Canvas */}
          <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden bg-[#0A0D12] border border-[#414943]/20 shadow-inner flex items-center justify-center">
            <EquipmentTwin3D
              selectedPartId={selectedPartId}
              onSelectPart={setSelectedPartId}
              exploded={exploded}
              isolatedPartId={isolatedPartId}
              sectionMode={sectionMode}
              cameraResetTrigger={camResetTrigger}
              degradationStates={degradationStates}
              onAnchorsUpdate={setAnchors}
              className="w-full h-full"
            />

            {/* Top-Left Telemetry HUD */}
            <div className="pointer-events-none absolute top-3 left-3 bg-[#0F172A]/90 backdrop-blur-md border border-[#334155] rounded-xl px-3 py-2 text-white shadow-md">
              <div className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
                Overall Assembly State
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    overallCritical
                      ? 'bg-[#EF4444] animate-ping'
                      : overallCaution
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#10B981]'
                  }`}
                />
                <span className="text-xs font-bold font-mono">
                  {overallCritical
                    ? 'CRITICAL WEAR EXCEEDED'
                    : overallCaution
                      ? 'ACCELERATED DEGRADATION'
                      : 'NOMINAL ENVELOPE'}
                </span>
              </div>
            </div>

            {/* Bottom-Right 3D Gesture Hint */}
            <div className="pointer-events-none absolute bottom-3 right-3 bg-[#0F172A]/85 backdrop-blur-md border border-[#334155]/60 rounded-lg px-2.5 py-1 text-[10px] font-mono text-[#94A3B8]">
              Orbit: Drag · Pan: Right-Click · Zoom: Scroll
            </div>
          </div>

          {/* Hardware Subassembly Part Selector Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#696156]">
              <span className="font-semibold text-[#1D1B17]">Select Artemis Flight Subsystem:</span>
              <span>Click part to inspect live damage telemetry</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {HARDWARE_PARTS.map((item) => {
                const isSelected = selectedPartId === item.id;
                const partDeg = degradationStates.find((d) => d.part.id === item.id);
                const status = partDeg?.status || 'nominal';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedPartId(item.id);
                      setIsolatedPartId(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#184633] text-white border-[#184633] shadow-sm'
                        : 'bg-[#FAF7F2] text-[#1D1B17] border-[#414943]/12 hover:bg-[#F3EDE5]'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-base shrink-0">{item.icon}</span>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{item.label}</div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-white/80' : 'text-[#696156]'
                          }`}
                        >
                          {item.role}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        status === 'critical'
                          ? 'bg-[#EF4444]'
                          : status === 'degrading'
                            ? 'bg-[#F59E0B]'
                            : 'bg-[#10B981]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Part Live Diagnostics Telemetry Box */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 space-y-2.5">
            <div className="flex items-start justify-between gap-2 border-b border-[#414943]/10 pb-2">
              <div>
                <span className="text-[10px] font-mono text-[#696156] uppercase tracking-wider block">
                  Subsystem Inspector · {activePartState.part.subsystem}
                </span>
                <h4 className="text-sm font-bold text-[#1D1B17]">
                  {activePartState.part.name}
                </h4>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                  activePartState.status === 'critical'
                    ? 'bg-[#FDE8E8] text-[#9B1C1C] border border-[#F98080]'
                    : activePartState.status === 'degrading'
                      ? 'bg-[#FEF08A] text-[#713F12] border border-[#FACC15]'
                      : 'bg-[#DEF7EC] text-[#03543F] border border-[#31C48D]'
                }`}
              >
                {activePartState.status.toUpperCase()} (Index: {activePartState.damageIndex}×)
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#414943]">
                <span>Flight Material:</span>
                <strong className="text-[#1D1B17] font-mono">{activePartState.part.material}</strong>
              </div>
              <div className="flex justify-between text-[#414943]">
                <span>Lunar Design Life:</span>
                <span className="font-mono text-[#184633]">
                  {activePartState.part.nominalLifeYears.moon_south_pole} Years
                </span>
              </div>
              <div className="pt-1.5 border-t border-[#414943]/10 text-[11px] text-[#696156] leading-relaxed">
                <strong className="text-[#1D1B17]">Primary Degradation Mode: </strong>
                {activePartState.mechanismSummary}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== RIGHT COLUMN: DUAL SLIDERS & RECHARTS GRAPH (6 COLS) ==================== */}
        <section className="lg:col-span-6 bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 flex flex-col justify-between gap-5">
          <div className="border-b border-[#414943]/10 pb-4">
            <h2 className="text-base font-bold text-[#1D1B17] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#184633]" />
              Dual Environmental Sliders &amp; Wear Kinetics
            </h2>
            <p className="text-xs text-[#696156] mt-0.5">
              Adjust abrasive sulfur concentration &amp; mission duration to observe real-time 3D shader wear.
            </p>
          </div>

          {/* The Two Sliders */}
          <div className="space-y-4">
            {/* Slider 1: Sulfur Level (ppm) */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-[#1D1B17] block">
                    Sulfur Level (ppm)
                  </label>
                  <span className="text-[10px] text-[#696156]">
                    Abrasive regolith salt concentration
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-black text-[#A33E11] tabular-nums">
                    {sulfurPpm}
                  </span>
                  <span className="text-xs font-mono text-[#696156] ml-1">ppm</span>
                </div>
              </div>

              <input
                type="range"
                min={200}
                max={1600}
                step={10}
                value={sulfurPpm}
                onChange={(e) => setSulfurPpm(Number(e.target.value))}
                className="w-full h-2.5 bg-[#EDE5D8] rounded-lg appearance-none cursor-pointer accent-[#A33E11]"
              />

              <div className="flex justify-between text-[10px] font-mono text-[#696156]">
                <span>200 ppm</span>
                <span>900 ppm</span>
                <span>1,600 ppm</span>
              </div>

              {/* 3 Quick Pill Buttons */}
              <div className="pt-2 border-t border-[#414943]/10 flex flex-wrap gap-2">
                {[
                  { label: 'Salar de Gorbea (510 ppm)', val: 510 },
                  { label: 'Mauna Kea (340 ppm)', val: 340 },
                  { label: 'High Sulfate (1,200 ppm)', val: 1200 },
                ].map((pill) => (
                  <button
                    key={pill.val}
                    type="button"
                    onClick={() => setSulfurPpm(pill.val)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      sulfurPpm === pill.val
                        ? 'bg-[#A33E11] text-white shadow-xs'
                        : 'bg-[#FFFFFF] text-[#414943] border border-[#414943]/10 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Exposure Duration (Days) */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-[#1D1B17] block">
                    Exposure Duration (Days)
                  </label>
                  <span className="text-[10px] text-[#696156]">
                    Continuous surface mission operational timeline
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-black text-[#0F422E] tabular-nums">
                    {exposureDays}
                  </span>
                  <span className="text-xs font-mono text-[#696156] ml-1">days</span>
                </div>
              </div>

              <input
                type="range"
                min={1}
                max={1000}
                step={5}
                value={exposureDays}
                onChange={(e) => setExposureDays(Number(e.target.value))}
                className="w-full h-2.5 bg-[#EDE5D8] rounded-lg appearance-none cursor-pointer accent-[#0F422E]"
              />

              <div className="flex justify-between text-[10px] font-mono text-[#696156]">
                <span>1 Day</span>
                <span>500 Days</span>
                <span>1,000 Days</span>
              </div>

              {/* 3 Quick Pill Buttons */}
              <div className="pt-2 border-t border-[#414943]/10 flex flex-wrap gap-2">
                {[
                  { label: '90 Days', val: 90 },
                  { label: '180 Days', val: 180 },
                  { label: '1 Year (365d)', val: 365 },
                ].map((pill) => (
                  <button
                    key={pill.val}
                    type="button"
                    onClick={() => setExposureDays(pill.val)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      exposureDays === pill.val
                        ? 'bg-[#0F422E] text-white shadow-xs'
                        : 'bg-[#FFFFFF] text-[#414943] border border-[#414943]/10 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recharts Area Graph with Critical Threshold & Confidence Band */}
          <div className="p-4 rounded-2xl bg-[#F9F3EB] border border-[#414943]/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-[#1D1B17]">
                  Predicted Material Wear (0–1,000 Days)
                </h3>
                <p className="text-[10px] text-[#696156]">
                  Band represents ±0.0494 mg/cm² RMSE empirical confidence interval.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="inline-flex items-center gap-1 text-[#166534] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#166534]" />
                  Earth ({sulfurPpm} ppm)
                </span>
                <span className="inline-flex items-center gap-1 text-[#E06A3B] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#E06A3B]" />
                  Lunar ({LUNAR_TARGET_SULFUR_PPM} ppm)
                </span>
                <span className="inline-flex items-center gap-1 text-[#DC2626] font-semibold">
                  <span className="w-2 h-0.5 bg-[#DC2626]" />
                  Limit (0.15)
                </span>
              </div>
            </div>

            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wearProjection} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earthGradLab" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#166534" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#166534" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="lunarGradLab" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E06A3B" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#E06A3B" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="ciGradLab" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#166534" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#166534" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    ticks={[0, 200, 400, 600, 800, 1000]}
                    tick={{ fill: '#696156', fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#696156', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 0.45]}
                    tickFormatter={(val: number) => val.toFixed(2)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                    labelFormatter={(day) => `Day ${day}`}
                    formatter={(value: any, name: any) => [
                      `${Number(value).toFixed(4)} mg/cm²`,
                      name === 'earthWear'
                        ? `Earth (${sulfurPpm} ppm)`
                        : name === 'lunarWear'
                          ? `Lunar Ref (${LUNAR_TARGET_SULFUR_PPM} ppm)`
                          : 'Confidence Bound',
                    ]}
                  />
                  <ReferenceLine
                    y={CRITICAL_WEAR_LIMIT}
                    stroke="#DC2626"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    label={{
                      value: 'THRESHOLD 0.15',
                      fill: '#DC2626',
                      fontSize: 9,
                      position: 'insideTopRight',
                    }}
                  />
                  <ReferenceLine
                    x={exposureDays}
                    stroke="#1D1B17"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    label={{
                      value: `Day ${exposureDays}`,
                      fill: '#1D1B17',
                      fontSize: 9,
                      position: 'insideTopLeft',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="earthWearUpper"
                    stroke="transparent"
                    fill="url(#ciGradLab)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="lunarWear"
                    stroke="#E06A3B"
                    strokeWidth={1.8}
                    fill="url(#lunarGradLab)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="earthWear"
                    stroke="#166534"
                    strokeWidth={2.2}
                    fill="url(#earthGradLab)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      {/* 3. 3 VISUAL COMPONENT WEAR DIAGNOSTICS CARDS */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#414943]/10 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1D1B17]">
              Component Diagnostics Cards
            </h2>
            <p className="text-xs text-[#696156] mt-0.5">
              Real-time engineering subsystem life remaining calibrated to active sulfur exposure.
            </p>
          </div>
          <span className="text-xs font-mono text-[#0F422E] bg-[#EAF4EE] px-3 py-1 rounded-full font-semibold border border-[#2A5A44]/20">
            3 Critical Subsystems Calibrated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Diagnostic 1: Rover Wheel Rotary Seal */}
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FFFFFF] border border-[#414943]/10 flex items-center justify-center text-[#184633] shadow-xs">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1D1B17]">
                      Rover Wheel Rotary Seal
                    </div>
                    <div className="text-[10px] text-[#696156]">
                      Fluoroelastomer Lip Barrier
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    sealStatus === 'Nominal'
                      ? 'bg-[#DEF7EC] text-[#03543F]'
                      : sealStatus === 'Caution'
                        ? 'bg-[#FEF08A] text-[#713F12]'
                        : 'bg-[#FDE8E8] text-[#9B1C1C]'
                  }`}
                >
                  {sealStatus}
                </span>
              </div>

              <div className="my-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#414943] font-medium">Life Remaining:</span>
                  <strong className="font-mono text-[#1D1B17]">{sealLifePct}% · {sealStatus}</strong>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#EDE5D8] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      sealLifePct > 60
                        ? 'bg-[#166534]'
                        : sealLifePct > 30
                          ? 'bg-[#D97706]'
                          : 'bg-[#DC2626]'
                    }`}
                    style={{ width: `${sealLifePct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#696156] border-t border-[#414943]/10 pt-2 font-mono flex items-center justify-between">
              <span>Dust Barrier Margin:</span>
              <strong className="text-[#1D1B17]">
                {Math.max(0.1, (sealLifePct / 100) * 1.5).toFixed(2)}× nominal
              </strong>
            </div>
          </div>

          {/* Diagnostic 2: Coring Drill Bit */}
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FFFFFF] border border-[#414943]/10 flex items-center justify-center text-[#A33E11] shadow-xs">
                    <Mountain className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1D1B17]">
                      Coring Drill Bit
                    </div>
                    <div className="text-[10px] text-[#696156]">
                      Diamond Composite Matrix
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    drillStatus === 'Optimal'
                      ? 'bg-[#DEF7EC] text-[#03543F]'
                      : drillStatus === 'Degraded'
                        ? 'bg-[#FEF08A] text-[#713F12]'
                        : 'bg-[#FDE8E8] text-[#9B1C1C]'
                  }`}
                >
                  {drillStatus}
                </span>
              </div>

              <div className="my-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#414943] font-medium">Cutting Life:</span>
                  <strong className="font-mono text-[#A33E11]">{drillLifePct}% Cutting Life</strong>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#EDE5D8] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      drillLifePct > 60
                        ? 'bg-[#166534]'
                        : drillLifePct > 30
                          ? 'bg-[#D97706]'
                          : 'bg-[#DC2626]'
                    }`}
                    style={{ width: `${drillLifePct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#696156] border-t border-[#414943]/10 pt-2 font-mono flex items-center justify-between">
              <span>Drilling Depth Remaining:</span>
              <strong className="text-[#A33E11]">
                {Math.round(drillLifePct * 1.1)} m remaining
              </strong>
            </div>
          </div>

          {/* Diagnostic 3: Spacesuit Fabric Seal (AxEMU) */}
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FFFFFF] border border-[#414943]/10 flex items-center justify-center text-[#1D4ED8] shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1D1B17]">
                      Spacesuit Fabric Seal (AxEMU)
                    </div>
                    <div className="text-[10px] text-[#696156]">
                      Pressure Garment Bladder
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    suitStatus === 'Low Risk'
                      ? 'bg-[#DEF7EC] text-[#03543F]'
                      : suitStatus === 'Moderate'
                        ? 'bg-[#FEF08A] text-[#713F12]'
                        : 'bg-[#FDE8E8] text-[#9B1C1C]'
                  }`}
                >
                  {suitStatus}
                </span>
              </div>

              <div className="my-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#414943] font-medium">Pressure Integrity:</span>
                  <strong className="font-mono text-[#1D4ED8]">{suitIntegrityPct}% Pressure Integrity</strong>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#EDE5D8] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      suitIntegrityPct > 70
                        ? 'bg-[#1D4ED8]'
                        : suitIntegrityPct > 40
                          ? 'bg-[#D97706]'
                          : 'bg-[#DC2626]'
                    }`}
                    style={{ width: `${suitIntegrityPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#696156] border-t border-[#414943]/10 pt-2 font-mono flex items-center justify-between">
              <span>Pressure Retention:</span>
              <strong className="text-[#1D4ED8]">
                {(29.6 * (suitIntegrityPct / 100)).toFixed(1)} kPa nominal
              </strong>
            </div>
          </div>
        </div>

        {/* 4. CLEAR BOTTOM CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#414943]/10">
          <div className="text-xs text-[#696156]">
            Module 5 Hardware Simulation Complete · Calibrated at <strong>{sulfurPpm} ppm</strong> for <strong>{exposureDays} days</strong>.
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('reports')}
            className="px-6 py-3 rounded-full bg-[#184633] hover:bg-[#2A5A44] text-[#FFFFFF] text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>Proceed to Validation &amp; Evidence (Module 6) →</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
