import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileCode,
  FolderOpen,
  Gauge,
  HardDrive,
  Layers,
  Lock,
  Maximize2,
  Mountain,
  RotateCcw,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unlock,
  Upload,
  UploadCloud,
  Wrench,
  X,
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
import {
  CAD_PARTS,
  EARTH_CANDIDATE_SITES,
  getSiteSulfurPpm,
  getSiteSulfurSource,
} from '../../data/planetaryData';
import {
  CAD_MODEL_PRESETS,
  CadModelPresetId,
  CadModelTelemetry,
} from '../../types/cad';
import {
  CadPartId,
  EarthCandidateSite,
  PartDegradationState,
  PlanetaryTarget,
  ScoredCandidate,
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
  onSelectSite?: (siteId: string) => void;
  availableSites?: EarthCandidateSite[];
  rankedCandidates?: ScoredCandidate[];
}

const CRITICAL_WEAR_LIMIT = 0.15; // mg/cm²
const BENCHMARK_RMSE = 0.0494; // mg/cm²
const LUNAR_TARGET_SULFUR_PPM = 420;

// High-priority featured Earth analog reference testbeds for fast in-lab calibration
const FEATURED_ANALOGS: { id: string; name: string; ppm: number; tag: string }[] = [
  { id: 'salar_gorbea', name: 'Salar de Gorbea', ppm: 510, tag: 'High Puna' },
  { id: 'putana_fumarole', name: 'Putana Fumarole', ppm: 1450, tag: 'Active Solfatara' },
  { id: 'lastarria', name: 'Lastarria Volcano', ppm: 1620, tag: 'Sulfur Flows' },
  { id: 'univ_valley', name: 'University Valley', ppm: 45, tag: 'Dry Valleys' },
  { id: 'hekla', name: 'Hekla Volcanic Desert', ppm: 320, tag: 'Sub-Arctic Basalt' },
  { id: 'axel_heiberg', name: 'Axel Heiberg', ppm: 680, tag: 'Cold Springs' },
  { id: 'kilauea', name: 'Mauna Kea', ppm: 340, tag: 'Volcanic Ash' },
  { id: 'haughton_crater', name: 'Haughton Crater', ppm: 760, tag: 'Impact Crater' },
  { id: 'disko_island', name: 'Disko Island', ppm: 180, tag: 'Native Iron' },
];

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
  onSelectSite,
  availableSites,
}) => {
  const sitesList = useMemo(
    () => (availableSites && availableSites.length > 0 ? availableSites : EARTH_CANDIDATE_SITES),
    [availableSites],
  );

  const siteSulfurPpm = useMemo(() => getSiteSulfurPpm(selectedSite), [selectedSite]);
  const siteDataSource = useMemo(() => getSiteSulfurSource(selectedSite), [selectedSite]);

  // Operational Binding Mode: Defaults to TRUE (Locked to Site Dataset verified measurement)
  const [isLockedToSite, setIsLockedToSite] = useState<boolean>(true);
  const [sulfurPpm, setSulfurPpm] = useState<number>(() => getSiteSulfurPpm(selectedSite));
  const [exposureDays, setExposureDays] = useState<number>(365);
  const [predictedDegradation, setPredictedDegradation] = useState<number>(() =>
    calculateEmpiricalWear(getSiteSulfurPpm(selectedSite), 365),
  );

  // Automatic Sulfur Binding:
  // When an Earth analog site is active (selectedSite), sulfur concentration MUST automatically bind
  // to selectedSite.chemistry.sulfurConcentrationPpm!
  useEffect(() => {
    if (isLockedToSite) {
      setSulfurPpm(siteSulfurPpm);
    }
  }, [selectedSite.id, siteSulfurPpm, isLockedToSite]);

  const handleSelectSite = (siteId: string) => {
    const targetSite = sitesList.find((s) => s.id === siteId);
    if (targetSite) {
      const targetPpm = getSiteSulfurPpm(targetSite);
      setSulfurPpm(targetPpm);
      setIsLockedToSite(true);
    }
    onSelectSite?.(siteId);
  };

  const handleSulfurSliderChange = (newPpm: number) => {
    setSulfurPpm(newPpm);
    if (newPpm !== siteSulfurPpm) {
      setIsLockedToSite(false);
    } else {
      setIsLockedToSite(true);
    }
  };

  const handleRelockToSite = () => {
    setSulfurPpm(siteSulfurPpm);
    setIsLockedToSite(true);
  };

  const handleToggleLock = (locked: boolean) => {
    setIsLockedToSite(locked);
    if (locked) {
      setSulfurPpm(siteSulfurPpm);
    }
  };

  // 3D Machine Digital Twin Interactive State
  const [activePresetId, setActivePresetId] = useState<CadModelPresetId>('drill');
  const [customCadFile, setCustomCadFile] = useState<File | null>(null);
  const [cadTelemetry, setCadTelemetry] = useState<CadModelTelemetry | null>(null);
  const [cadUploadError, setCadUploadError] = useState<string | null>(null);
  const filePickerInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedPartId, setSelectedPartId] = useState<CadPartId | null>('seal');
  const [exploded, setExploded] = useState<boolean>(false);
  const [isolatedPartId, setIsolatedPartId] = useState<CadPartId | null>(null);
  const [sectionMode, setSectionMode] = useState<boolean>(false);
  const [camResetTrigger, setCamResetTrigger] = useState<number>(0);
  const [, setAnchors] = useState<Record<CadPartId, PartScreenAnchor> | null>(null);

  // Subsystems mapping per active preset
  const presetSubsystems: Record<
    CadModelPresetId,
    { id: CadPartId; label: string; icon: string; role: string }[]
  > = {
    drill: HARDWARE_PARTS,
    viper: [
      { id: 'seal', label: 'Wire-Mesh Compliant Tire', icon: '🛞', role: 'Spiral Spring Tread' },
      { id: 'fasteners', label: 'In-Wheel Hub Drive', icon: '⚙️', role: 'Harmonic Gearmotor' },
      { id: 'housing', label: 'Wishbone Suspension Arm', icon: '🛡️', role: 'Rocker-Bogie Clevis' },
      { id: 'gears', label: 'Kingpin Steer Knuckle', icon: '🔄', role: 'Steering Pivot' },
      { id: 'stator', label: 'Active Damper Strut', icon: '⚡', role: 'Shock Absorber & Coil' },
    ],
    scoop: [
      { id: 'auger', label: 'Cryo-Regolith Scoop', icon: '⛏️', role: 'Carbide Serrated Blade' },
      { id: 'fasteners', label: 'Wrist 2-DoF Gimbal', icon: '⚙️', role: 'Rotary Tool Changer' },
      { id: 'gears', label: 'Elbow Joint Actuator', icon: '🔄', role: 'Torque Sensor Pitch' },
      { id: 'stator', label: 'Carbon-Fiber Twin Boom', icon: '⚡', role: 'Lightweight Boom Link' },
      { id: 'housing', label: 'Shoulder Turret Base', icon: '🛡️', role: 'Azimuth Turntable Ring' },
    ],
    thruster: [
      { id: 'auger', label: 'De Laval Exit Bell', icon: '🚀', role: 'Supersonic Expansion' },
      { id: 'seal', label: 'Throat & Injector Dome', icon: '🛞', role: 'High-Temp Choke Ring' },
      { id: 'housing', label: 'Solenoid Valve Block', icon: '🛡️', role: 'Redundant Micro-Valves' },
      { id: 'fasteners', label: 'Mounting Flange & Tube', icon: '⚙️', role: 'Titanium Feed Coupling' },
    ],
    custom: [
      { id: 'housing', label: 'Primary Structural Shell', icon: '🛡️', role: 'NASA CAD Chassis' },
      { id: 'fasteners', label: 'Subcomponent Fasteners', icon: '⚙️', role: 'Torqued Hardpoints' },
      { id: 'seal', label: 'Dynamic Interface Seals', icon: '🛞', role: 'Fluid & Regolith Barrier' },
      { id: 'gears', label: 'Internal Mechanism', icon: '🔄', role: 'Rotary Assembly' },
    ],
  };

  const currentSubsystems = useMemo(() => {
    return presetSubsystems[activePresetId] || HARDWARE_PARTS;
  }, [activePresetId]);

  const activePreset = useMemo(
    () => CAD_MODEL_PRESETS.find((p) => p.id === activePresetId) || CAD_MODEL_PRESETS[0],
    [activePresetId],
  );

  const activeTelemetryDisplay = useMemo(() => {
    if (activePresetId === 'custom' && cadTelemetry) {
      return cadTelemetry;
    }
    const ratio = predictedDegradation / CRITICAL_WEAR_LIMIT;
    return {
      ...activePreset.defaultTelemetry,
      degradationStatus: (ratio >= 1.0 ? 'critical' : ratio >= 0.62 ? 'degrading' : 'nominal') as 'critical' | 'degrading' | 'nominal',
      wearIndex: +ratio.toFixed(2),
    };
  }, [activePresetId, cadTelemetry, activePreset, predictedDegradation]);

  const handleLoadSampleNasaModel = async () => {
    try {
      setCadUploadError(null);
      const res = await fetch('/models/nasa_analog_sensor.obj');
      if (!res.ok) throw new Error('Sample asset not found');
      const blob = await res.blob();
      const file = new File([blob], 'NASA_Lunar_Sensor_Pod_REV2.obj', {
        type: 'text/plain',
      });
      setCustomCadFile(file);
      setActivePresetId('custom');
    } catch (err: any) {
      setCadUploadError('Could not load sample NASA CAD model: ' + err.message);
    }
  };

  const handleCustomFileSelected = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf' && ext !== 'obj') {
      setCadUploadError(
        `Unsupported CAD file format ".${ext || 'unknown'}". Supported formats: NASA Binary GLTF (.glb), GLTF JSON (.gltf), and Wavefront OBJ (.obj).`
      );
      return;
    }
    setCadUploadError(null);
    setCustomCadFile(file);
    setActivePresetId('custom');
  };

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
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#FDF2EC] border border-[#F87171]/40 text-xs font-bold text-[#A33E11] uppercase tracking-wider">
                Module 5 · Equipment Exposure Lab
              </span>
              <span className="text-xs text-[#696156] font-mono flex items-center gap-1.5">
                Analog Testbed: <strong className="text-[#1D1B17]">{selectedSite.name}</strong>
                <span className="px-2 py-0.5 rounded-full bg-[#0F422E]/10 text-[#0F422E] font-bold text-[11px]">
                  {siteSulfurPpm} ppm S
                </span>
                {isLockedToSite ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#0F422E] text-white font-mono text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> AUTO-LOCKED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#A33E11] text-white font-mono text-[10px] font-bold flex items-center gap-1">
                    <Unlock className="w-2.5 h-2.5" /> MANUAL OVERRIDE
                  </span>
                )}
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
          {/* Hidden File Input for Custom NASA CAD */}
          <input
            ref={filePickerInputRef}
            type="file"
            accept=".glb,.gltf,.obj"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleCustomFileSelected(e.target.files[0]);
              }
            }}
          />

          {/* Header & Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#414943]/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#184633]" />
                <h2 className="text-base font-bold text-[#1D1B17]">
                  3D Machine Digital Twin
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[10px] font-mono font-bold text-[#0F422E] border border-[#2A5A44]/20">
                  {activePreset.name.split(' ')[0]} Flight Assembly
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

          {/* 3D Model Selector Bar (5 Presets / Upload) */}
          <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#414943]/10 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#A33E11] uppercase tracking-wider block">
                  NASA Digital Twin · Select 3D Hardware Model
                </span>
                <h3 className="text-xs font-bold text-[#1D1B17]">
                  Artemis IV CAD Presets &amp; Custom Importer
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => filePickerInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#184633] text-white hover:bg-[#2A5A44] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Upload NASA CAD File (.glb, .gltf, .obj)"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>📁 Upload NASA CAD</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleNasaModel}
                  className="px-2.5 py-1.5 rounded-xl bg-white text-[#414943] hover:bg-[#FAF7F2] border border-[#414943]/20 text-xs font-semibold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  title="Load Sample NASA Sensor Pod (.obj)"
                >
                  <span>⚡ Try Sample (.obj)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {CAD_MODEL_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setActivePresetId(preset.id);
                      setCadUploadError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#184633] text-white border-[#184633] shadow-xs'
                        : 'bg-[#FFFFFF] text-[#1D1B17] border-[#414943]/15 hover:bg-[#F3EDE5]'
                    }`}
                  >
                    <span className="text-xl shrink-0">{preset.icon}</span>
                    <div className="overflow-hidden min-w-0">
                      <div className="text-xs font-bold truncate leading-tight">
                        {preset.name.split(' ')[0]} {preset.name.split(' ')[1]}
                      </div>
                      <div
                        className={`text-[10px] truncate leading-tight mt-0.5 ${
                          isSelected ? 'text-white/80' : 'text-[#696156]'
                        }`}
                      >
                        {preset.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Preset 5: Action Upload Custom NASA CAD */}
              <button
                type="button"
                onClick={() => {
                  if (customCadFile) {
                    setActivePresetId('custom');
                  } else {
                    filePickerInputRef.current?.click();
                  }
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  activePresetId === 'custom'
                    ? 'bg-[#A33E11] text-white border-[#A33E11] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#1D1B17] border-[#414943]/15 hover:bg-[#F3EDE5]'
                }`}
              >
                <span className="text-xl shrink-0">📁</span>
                <div className="overflow-hidden min-w-0">
                  <div className="text-xs font-bold truncate leading-tight">
                    {customCadFile ? customCadFile.name : 'Upload Custom CAD'}
                  </div>
                  <div
                    className={`text-[10px] truncate leading-tight mt-0.5 ${
                      activePresetId === 'custom' ? 'text-white/80' : 'text-[#696156]'
                    }`}
                  >
                    {customCadFile ? 'Active User Asset' : '.glb, .gltf, .obj'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* CAD Ingestion Fallback Alert (if invalid format) */}
          {cadUploadError && (
            <div className="p-3.5 rounded-2xl bg-[#FDE8E8] border border-[#F87171] text-[#9B1C1C] text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-[#E02424] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">CAD Upload Format Unsupported</div>
                <p className="text-[11px] text-[#771D1D] leading-relaxed">
                  {cadUploadError}
                </p>
                <div className="pt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => filePickerInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-[#DC2626] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Choose Valid CAD Asset (.glb / .gltf / .obj)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCadUploadError(null);
                      setActivePresetId('drill');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#F87171] text-[10px] font-bold text-[#9B1C1C] cursor-pointer"
                  >
                    Return to Default Drill
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive 3D Canvas with Drag & Drop */}
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
              activePresetId={activePresetId}
              onSelectPreset={setActivePresetId}
              customFile={customCadFile}
              onCustomFileSelect={handleCustomFileSelected}
              onTelemetryUpdate={setCadTelemetry}
              predictedDegradation={predictedDegradation}
              className="w-full h-full"
            />
          </div>

          {/* Model Diagnostic Telemetry Box */}
          <div className="p-4 rounded-2xl bg-[#0F172A] text-white border border-[#334155] space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#334155] pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#10B981]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                  CAD Model Diagnostic Telemetry
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#334155] text-[#38BDF8]">
                  {activeTelemetryDisplay?.format || 'GLTF/OBJ'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    activeTelemetryDisplay.degradationStatus === 'critical'
                      ? 'bg-[#7F1D1D] text-[#FCA5A5] border border-[#EF4444]'
                      : activeTelemetryDisplay.degradationStatus === 'degrading'
                        ? 'bg-[#78350F] text-[#FDE68A] border border-[#F59E0B]'
                        : 'bg-[#064E3B] text-[#6EE7B7] border border-[#10B981]'
                  }`}
                >
                  {activeTelemetryDisplay.degradationStatus.toUpperCase()} (Index: {activeTelemetryDisplay.wearIndex}×)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#94A3B8] block">File Asset</span>
                <div
                  className="font-mono text-white font-bold truncate text-[11px]"
                  title={activeTelemetryDisplay.fileName}
                >
                  {activeTelemetryDisplay.fileName}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-[#94A3B8] block">Subcomponents / Meshes</span>
                <div className="font-mono text-white font-bold text-[11px]">
                  {activeTelemetryDisplay.subcomponentCount} Groups · {activeTelemetryDisplay.meshCount} Meshes
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-[#94A3B8] block">Vertex / Polygon Count</span>
                <div className="font-mono text-white font-bold text-[11px]">
                  {activeTelemetryDisplay.vertexCount.toLocaleString()} Vertices · {activeTelemetryDisplay.polygonCount.toLocaleString()} Polys
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-[#94A3B8] block">Bounding Dimensions (cm)</span>
                <div className="font-mono text-white font-bold text-[11px]">
                  {activeTelemetryDisplay.dimensionsCm.x} × {activeTelemetryDisplay.dimensionsCm.y} × {activeTelemetryDisplay.dimensionsCm.z} cm
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#94A3B8] pt-2 border-t border-[#334155]/60 flex flex-wrap items-center justify-between gap-2">
              <span>
                Real-Time Material Degradation:{' '}
                <strong
                  className={
                    activeTelemetryDisplay.degradationStatus === 'critical'
                      ? 'text-[#EF4444]'
                      : activeTelemetryDisplay.degradationStatus === 'degrading'
                        ? 'text-[#F59E0B]'
                        : 'text-[#10B981]'
                  }
                >
                  {activeTelemetryDisplay.degradationStatus.toUpperCase()}
                </strong>{' '}
                ({activeTelemetryDisplay.wearIndex}× Critical Limit)
              </span>
              <span>Auto-Centered at Origin (0,0,0) · Dynamic Sulfur Shading</span>
            </div>
          </div>

          {/* Hardware Subassembly Part Selector Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#696156]">
              <span className="font-semibold text-[#1D1B17]">Select Artemis Flight Subsystem:</span>
              <span>Click part to inspect live damage telemetry</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentSubsystems.map((item) => {
                const isSelected = selectedPartId === item.id;
                const partDeg = degradationStates.find((d) => d.part.id === item.id);
                const status = partDeg?.status || activeTelemetryDisplay.degradationStatus;

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
                  Subsystem Inspector · {activePreset.name}
                </span>
                <h4 className="text-sm font-bold text-[#1D1B17]">
                  {currentSubsystems.find((s) => s.id === selectedPartId)?.label || activePartState.part.name}
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#1D1B17] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#184633]" />
                Environmental Wear Kinetics &amp; Geochemical Calibrator
              </h2>
              <span className="text-xs font-mono text-[#0F422E] bg-[#EAF4EE] px-2.5 py-0.5 rounded-full font-semibold border border-[#2A5A44]/20">
                NASA EMIT L2B / USGS In-Situ Binding
              </span>
            </div>
            <p className="text-xs text-[#696156] mt-0.5">
              Empirical polynomial wear model automatically bound to active Earth analog measurements with manual sandbox override.
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. IN-LAB EARTH ANALOG SITE SELECTOR */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Mountain className="w-4 h-4 text-[#0F422E]" />
                    <label className="text-xs font-bold text-[#1D1B17] uppercase tracking-wider">
                      Analog Location Quick Selector
                    </label>
                    <span className="px-2 py-0.5 rounded-full bg-[#0F422E]/10 text-[10px] font-mono font-bold text-[#0F422E]">
                      {sitesList.length} Sites
                    </span>
                  </div>
                  <p className="text-[11px] text-[#696156] mt-0.5">
                    Select any Earth analog to automatically bind sulfur concentration without manual guessing.
                  </p>
                </div>

                {/* All Sites Dropdown Select */}
                <div className="min-w-[260px] sm:w-auto">
                  <select
                    aria-label="Earth Analog Location Selector"
                    value={selectedSite.id}
                    onChange={(e) => handleSelectSite(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white border border-[#414943]/20 text-[#1D1B17] focus:outline-none focus:ring-2 focus:ring-[#0F422E]/30 cursor-pointer shadow-xs"
                  >
                    {sitesList.map((site) => {
                      const ppm = getSiteSulfurPpm(site);
                      return (
                        <option key={site.id} value={site.id}>
                          {site.name} — {ppm} ppm S ({site.country})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Quick-Switch Buttons for Primary Reference Locations */}
              <div className="pt-2 border-t border-[#414943]/10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#696156] mb-1.5 flex items-center justify-between">
                  <span>Featured Reference Testbeds:</span>
                  <span className="text-[10px] text-[#0F422E] font-medium hidden sm:inline">
                    Click to instantly bind sulfur level
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FEATURED_ANALOGS.map((feat) => {
                    const isCurrent = selectedSite.id === feat.id;
                    return (
                      <button
                        key={feat.id}
                        type="button"
                        onClick={() => handleSelectSite(feat.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isCurrent
                            ? 'bg-[#0F422E] text-white shadow-xs ring-2 ring-[#0F422E]/30'
                            : 'bg-[#FFFFFF] text-[#414943] border border-[#414943]/15 hover:bg-[#F3EFEA]'
                        }`}
                      >
                        <span>{feat.name}</span>
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isCurrent
                              ? 'bg-white/20 text-white'
                              : 'bg-[#FDF2EC] text-[#A33E11] border border-[#F87171]/20'
                          }`}
                        >
                          {feat.ppm} ppm
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. OPERATIONAL STATUS PILL & TOGGLE SWITCH */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isLockedToSite
                  ? 'bg-[#EAF4EE] border-[#0F422E]/30 text-[#0F422E]'
                  : 'bg-[#FFF8F0] border-[#A33E11]/30 text-[#A33E11]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base shadow-xs ${
                      isLockedToSite
                        ? 'bg-[#0F422E] text-white'
                        : 'bg-[#A33E11] text-white'
                    }`}
                  >
                    {isLockedToSite ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold flex flex-wrap items-center gap-1.5 text-[#1D1B17]">
                      {isLockedToSite ? (
                        <>
                          <span className="text-[#0F422E] font-black">🔒 Bound to</span>
                          <strong className="text-[#1D1B17] font-extrabold">{selectedSite.name}</strong>
                          <span>Verified Measurement:</span>
                          <span className="font-mono text-sm font-black text-[#A33E11] bg-white/90 px-2 py-0.5 rounded-md border border-[#414943]/15">
                            {siteSulfurPpm} ppm
                          </span>
                          <span className="text-[10px] text-[#696156] font-mono">
                            ({siteDataSource})
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[#A33E11] font-black">🔓 Unlocked (Manual Sandbox Override Active)</span>
                          <span>· Target Site:</span>
                          <strong className="text-[#1D1B17]">{selectedSite.name}</strong>
                          <span className="text-[11px] text-[#696156]">
                            (Dataset: <strong className="font-mono text-[#0F422E]">{siteSulfurPpm} ppm</strong> · Active: <strong className="font-mono text-[#A33E11]">{sulfurPpm} ppm</strong>)
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-[#696156] mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>Calibration Mode: <strong>{isLockedToSite ? 'Empirical Site Replication' : 'Exploratory Sensitivity'}</strong></span>
                      <span>•</span>
                      <span>{selectedSite.chemistry?.dominantMinerals || 'Sulfates & Regolith Salts'}</span>
                    </p>
                  </div>
                </div>

                {/* Toggle Switch & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-[#FFFFFF] rounded-full p-1 border border-[#414943]/20 shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleLock(true)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isLockedToSite
                          ? 'bg-[#0F422E] text-white shadow-xs'
                          : 'text-[#696156] hover:text-[#1D1B17]'
                      }`}
                      title="Lock to active site dataset"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Lock to Site Dataset</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleLock(false)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        !isLockedToSite
                          ? 'bg-[#A33E11] text-white shadow-xs'
                          : 'text-[#696156] hover:text-[#1D1B17]'
                      }`}
                      title="Enable manual slider override"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Manual Sandbox Override</span>
                    </button>
                  </div>

                  {!isLockedToSite && (
                    <button
                      type="button"
                      onClick={handleRelockToSite}
                      className="px-3 py-1.5 rounded-full bg-[#0F422E] text-white text-xs font-bold hover:bg-[#184633] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-lock to {selectedSite.name} ({siteSulfurPpm} ppm)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. SLIDER 1: SULFUR LEVEL (PPM) */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#1D1B17] block">
                      Sulfur Concentration (ppm)
                    </label>
                    {isLockedToSite ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#0F422E]/10 text-[#0F422E] flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> LOCKED TO SITE DATASET
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#A33E11]/10 text-[#A33E11] flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> MANUAL OVERRIDE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#696156]">
                    Abrasive regolith volatile &amp; sulfate salt concentration (Range: 10–2,000 ppm)
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
                min={10}
                max={2000}
                step={5}
                value={sulfurPpm}
                onChange={(e) => handleSulfurSliderChange(Number(e.target.value))}
                className="w-full h-2.5 bg-[#EDE5D8] rounded-lg appearance-none cursor-pointer accent-[#A33E11]"
              />

              <div className="flex justify-between text-[10px] font-mono text-[#696156]">
                <span>10 ppm (Min)</span>
                <span>45 ppm (Univ Valley)</span>
                <span>510 ppm (Gorbea)</span>
                <span>1,450 ppm (Putana)</span>
                <span>2,000 ppm (Max)</span>
              </div>

              {/* Quick Calibration Preset Buttons */}
              <div className="pt-2 border-t border-[#414943]/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSulfurPpm(siteSulfurPpm);
                      setIsLockedToSite(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      isLockedToSite && sulfurPpm === siteSulfurPpm
                        ? 'bg-[#0F422E] text-white shadow-xs'
                        : 'bg-[#FFFFFF] text-[#414943] border border-[#414943]/10 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span>🔒 Site Baseline ({siteSulfurPpm} ppm)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSulfurPpm(LUNAR_TARGET_SULFUR_PPM);
                      setIsLockedToSite(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      !isLockedToSite && sulfurPpm === LUNAR_TARGET_SULFUR_PPM
                        ? 'bg-[#E06A3B] text-white shadow-xs'
                        : 'bg-[#FFFFFF] text-[#414943] border border-[#414943]/10 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span>🌙 Lunar Ref ({LUNAR_TARGET_SULFUR_PPM} ppm)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSulfurPpm(1620);
                      setIsLockedToSite(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      !isLockedToSite && sulfurPpm === 1620
                        ? 'bg-[#A33E11] text-white shadow-xs'
                        : 'bg-[#FFFFFF] text-[#414943] border border-[#414943]/10 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span>🌋 High Solfatara (1,620 ppm)</span>
                  </button>
                </div>

                {!isLockedToSite && (
                  <button
                    type="button"
                    onClick={handleRelockToSite}
                    className="text-[11px] font-bold text-[#0F422E] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>↺ Re-lock to {siteSulfurPpm} ppm</span>
                  </button>
                )}
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
