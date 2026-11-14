import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  BookOpen,
  FastForward,
  Layers,
  Maximize2,
  Pause,
  RotateCcw,
  Scissors,
  Wrench,
} from 'lucide-react';
import { CAD_PARTS, EARTH_CANDIDATE_SITES } from '../../data/planetaryData';
import { simulateHardwareDegradation } from '../../engine/analogEngine';
import {
  CadPartId,
  EarthCandidateSite,
  SimEnvironment,
} from '../../types/terra';
import {
  EquipmentTwin3D,
  PartScreenAnchor,
} from '../three/EquipmentTwin3D';

interface SimulatorViewProps {
  selectedSite: EarthCandidateSite;
  onSelectSite: (siteId: string) => void;
  onOpenReports?: () => void;
}

type DockMode = 'dashboard' | 'procedures' | 'documents' | 'parts' | 'section';

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  selectedSite,
  onSelectSite,
  onOpenReports,
}) => {
  const [simEnv, setSimEnv] = useState<SimEnvironment>('earth_analog');
  const [simYears, setSimYears] = useState<number>(5.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [selectedPartId, setSelectedPartId] = useState<CadPartId | null>('fasteners');
  const [exploded, setExploded] = useState<boolean>(false);
  const [isolatedPartId, setIsolatedPartId] = useState<CadPartId | null>(null);
  const [sectionMode, setSectionMode] = useState<boolean>(false);
  const [dockMode, setDockMode] = useState<DockMode>('dashboard');
  const [camResetTrigger, setCamResetTrigger] = useState<number>(0);

  const [thermalGain, setThermalGain] = useState(1.0);
  const [corrosiveGain, setCorrosiveGain] = useState(1.0);
  const [abrasionGain, setAbrasionGain] = useState(1.0);

  const [anchors, setAnchors] = useState<Record<CadPartId, PartScreenAnchor> | null>(
    null,
  );

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setSimYears((prev) => {
        if (prev >= 10) {
          setIsPlaying(false);
          return 10;
        }
        return Number(Math.min(10, prev + 0.12).toFixed(2));
      });
    }, 65);
    return () => clearInterval(id);
  }, [isPlaying]);

  const degradationStates = useMemo(
    () =>
      simulateHardwareDegradation(simYears, simEnv, selectedSite, {
        thermalGain,
        corrosiveGain,
        abrasionGain,
      }),
    [simYears, simEnv, selectedSite, thermalGain, corrosiveGain, abrasionGain],
  );

  const criticalParts = useMemo(
    () => degradationStates.filter((d) => d.status === 'critical'),
    [degradationStates],
  );

  const activePartState = useMemo(() => {
    if (selectedPartId) {
      return (
        degradationStates.find((d) => d.part.id === selectedPartId) ||
        degradationStates[0]
      );
    }
    return criticalParts[0] || degradationStates[1] || degradationStates[0];
  }, [selectedPartId, degradationStates, criticalParts]);

  const primaryFailing = criticalParts[0] || null;
  const selectedAnchor =
    selectedPartId && anchors ? anchors[selectedPartId] : null;
  const failingAnchor =
    primaryFailing && anchors ? anchors[primaryFailing.part.id] : null;

  const handleDockAction = (mode: DockMode) => {
    setDockMode(mode);
    if (mode === 'section') {
      setSectionMode((s) => !s);
    } else if (mode === 'parts') {
      setExploded((e) => !e);
    } else if (mode === 'documents' && !selectedPartId) {
      setSelectedPartId(primaryFailing?.part.id || 'fasteners');
    }
  };

  const handleResetAll = () => {
    setExploded(false);
    setIsolatedPartId(null);
    setSectionMode(false);
    setCamResetTrigger((c) => c + 1);
  };

  const envLabel =
    simEnv === 'earth_analog'
      ? `Earth Analog (${selectedSite.name.split(' (')[0]})`
      : simEnv === 'moon_south_pole'
        ? 'Moon South Pole (Shackleton)'
        : 'Mars Jezero Crater';

  // Cumulative wear curve points across Year 0..10
  const wearSparkline = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const states = simulateHardwareDegradation(i, simEnv, selectedSite, {
        thermalGain,
        corrosiveGain,
        abrasionGain,
      });
      const st =
        states.find((s) => s.part.id === activePartState.part.id) || states[0];
      const x = (i / 10) * 320;
      const norm = Math.min(1, st.damageIndex / 1.6);
      const y = 36 - norm * 28;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [simEnv, selectedSite, thermalGain, corrosiveGain, abrasionGain, activePartState.part.id]);

  return (
    <div className="flex flex-col gap-6">
      {/* TOP HERO CAD BANNER */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EE] text-[#0F422E] font-mono text-[11px] font-semibold">
              FR-05 DIGITAL TWIN CAD
            </span>
            <span className="font-mono text-[11px] text-[#A33E11] font-semibold">
              ASSEMBLY: TX-DRL-40
            </span>
            <span className="text-[11px] text-[#696156]">
              · Coupled Thermo-Chemical Fatigue Solver
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#1D1B17]">
            Artemis Rotary-Percussive Ice Drill & Actuator
          </h1>
        </div>

        <div className="bg-[#F9F3EB] rounded-2xl border border-[#414943]/8 px-4 py-2.5 flex flex-wrap items-center gap-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#696156]">
              Active Faults
            </div>
            <div className="font-display text-lg font-bold text-[#A33E11] tabular-nums">
              {criticalParts.length}{' '}
              <span className="text-xs font-normal text-[#696156]">Critical</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#696156]">
              Simulation Epoch
            </div>
            <div className="font-display text-lg font-bold text-[#1D1B17] tabular-nums">
              {simYears < 0.08 ? 'Day 1' : `Yr ${simYears.toFixed(1)}`}{' '}
              <span className="text-xs font-normal text-[#696156]">/ 10.0</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (simYears >= 9.9) setSimYears(0.1);
              setIsPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#184633] hover:bg-[#0F3525] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <FastForward className="w-3.5 h-3.5" />
            )}
            <span>{isPlaying ? 'Pause' : 'Fast-Forward'}</span>
          </button>
        </div>
      </section>

      {/* 3-COLUMN CAD WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[295px_1fr_345px] gap-6 items-start">
        {/* LEFT COLUMN: Target Regime, Stress Simulators, Assembly Tree */}
        <div className="flex flex-col gap-5">
          <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#696156] block">
              Target Regime
            </span>
            <div className="flex flex-col gap-2">
              {(
                [
                  {
                    id: 'earth_analog',
                    title: 'Earth Analog Field Site',
                    sub: `${selectedSite.name.split(' (')[0]} · Salinity ${selectedSite.salinityIndex}/100`,
                  },
                  {
                    id: 'moon_south_pole',
                    title: 'Moon South Pole (Vacuum)',
                    sub: '155 K ΔT · Cold-weld + Agglutinates',
                  },
                  {
                    id: 'mars_jezero',
                    title: 'Mars Jezero Crater (6 mbar)',
                    sub: 'Perchlorate 2 µm dust + 76 K ΔT',
                  },
                ] as { id: SimEnvironment; title: string; sub: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSimEnv(opt.id)}
                  className={`text-left px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                    simEnv === opt.id
                      ? 'bg-[#0F422E] text-white border-[#0F422E] shadow-sm'
                      : 'bg-[#F9F3EB] text-[#1D1B17] border-[#414943]/8 hover:border-[#2A5A44]/40'
                  }`}
                >
                  <div className="text-xs font-semibold">{opt.title}</div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      simEnv === opt.id ? 'text-[#BAEED1]' : 'text-[#696156]'
                    }`}
                  >
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>

            {simEnv === 'earth_analog' && (
              <select
                aria-label="Select Earth analog for corrosion test"
                value={selectedSite.id}
                onChange={(e) => onSelectSite(e.target.value)}
                className="w-full bg-[#F9F3EB] border border-[#414943]/12 rounded-2xl px-3 py-2 text-xs font-semibold text-[#1D1B17]"
              >
                {EARTH_CANDIDATE_SITES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </section>

          <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#696156]">
                Stress Simulators
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[#0F422E] text-[10px] font-semibold">
                Coupled Mode
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-[#1D1B17]">Thermal Cycling (ΔT)</span>
                <span className="font-mono font-semibold text-[#A33E11]">
                  {thermalGain.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={thermalGain}
                onChange={(e) => setThermalGain(parseFloat(e.target.value))}
                className="w-full terra-slider terracotta-thumb"
                aria-label="Thermal cycling stressor gain"
              />
            </div>

            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-[#1D1B17]">Brine / Perchlorate</span>
                <span className="font-mono font-semibold text-[#D9822B]">
                  {corrosiveGain.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={corrosiveGain}
                onChange={(e) => setCorrosiveGain(parseFloat(e.target.value))}
                className="w-full terra-slider amber-thumb"
                aria-label="Corrosive chemistry stressor gain"
              />
            </div>

            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-[#1D1B17]">Regolith Abrasion</span>
                <span className="font-mono font-semibold text-[#0F422E]">
                  {abrasionGain.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={abrasionGain}
                onChange={(e) => setAbrasionGain(parseFloat(e.target.value))}
                className="w-full terra-slider"
                aria-label="Regolith abrasion stressor gain"
              />
            </div>
          </section>

          <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#696156] block mb-2.5">
              Assembly Tree ({CAD_PARTS.length})
            </span>
            <div className="flex flex-col gap-1.5">
              {degradationStates.map((st) => {
                const isSel = selectedPartId === st.part.id;
                const badgeColor =
                  st.status === 'critical'
                    ? 'bg-[#FDF2EC] text-[#B91C1C]'
                    : st.status === 'degrading'
                      ? 'bg-[#FEF7EE] text-[#734800]'
                      : 'bg-[#EAF4EE] text-[#0F422E]';
                return (
                  <button
                    key={st.part.id}
                    type="button"
                    onClick={() => setSelectedPartId(st.part.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                      isSel
                        ? 'bg-[#FFFFFF] border-[#0F422E] shadow-sm'
                        : 'bg-[#F9F3EB] border-[#414943]/8 hover:border-[#2A5A44]/40'
                    }`}
                  >
                    <span className="font-semibold text-[#1D1B17] truncate pr-2">
                      {st.part.name.split(' (')[0]}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}
                    >
                      D={st.damageIndex.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* CENTER STAGE: Industrial CAD Viewport + Timeline Scrubber */}
        <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#1D1B17] text-white font-mono text-xs font-semibold">
                CAD Viewport: TX-DRL-40
              </span>
              <span className="text-xs text-[#696156]">{envLabel}</span>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/8">
              <button
                type="button"
                onClick={() => setExploded((e) => !e)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  exploded
                    ? 'bg-[#0F422E] text-white font-semibold'
                    : 'text-[#414943] hover:text-[#1D1B17]'
                }`}
              >
                {exploded ? 'Collapse' : 'Explode'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setIsolatedPartId((prev) =>
                    prev === activePartState.part.id ? null : activePartState.part.id,
                  )
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  isolatedPartId
                    ? 'bg-[#0F422E] text-white font-semibold'
                    : 'text-[#414943] hover:text-[#1D1B17]'
                }`}
              >
                Isolate Failure
              </button>
              <button
                type="button"
                onClick={() => setSectionMode((s) => !s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  sectionMode
                    ? 'bg-[#0F422E] text-white font-semibold'
                    : 'text-[#414943] hover:text-[#1D1B17]'
                }`}
              >
                Cross-Section
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="px-2.5 py-1 rounded-full text-xs text-[#696156] hover:text-[#1D1B17] cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* 3D CAD Canvas */}
          <div className="h-[460px] relative rounded-3xl overflow-hidden border border-[#CBD5E1]">
            <EquipmentTwin3D
              selectedPartId={selectedPartId}
              onSelectPart={setSelectedPartId}
              exploded={exploded}
              isolatedPartId={isolatedPartId}
              sectionMode={sectionMode}
              cameraResetTrigger={camResetTrigger}
              degradationStates={degradationStates}
              onAnchorsUpdate={setAnchors}
            />

            {/* Top-Left Assembly Spec Chip (solid white, zero backdrop blur) */}
            <div className="pointer-events-none absolute top-3.5 left-3.5 bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl px-3.5 py-2 shadow-sm">
              <div className="font-display text-xs font-bold text-[#1D1B17]">
                TX-DRL-40 Ice Drill Assembly
              </div>
              <div className="font-mono text-[10px] text-[#475569]">
                Click any sub-assembly to inspect wear
              </div>
            </div>

            {/* Radial On-Canvas Action Pills */}
            {selectedPartId && selectedAnchor && selectedAnchor.visible && (
              <div
                style={{
                  transform: `translate3d(${Math.min(
                    Math.max(selectedAnchor.x, 120),
                    560,
                  )}px, ${Math.min(Math.max(selectedAnchor.y, 70), 340)}px, 0)`,
                }}
                className="absolute top-0 left-0 -translate-y-1/2 translate-x-3 flex flex-wrap gap-1.5 max-w-[215px] z-10"
              >
                <button
                  type="button"
                  onClick={() => setExploded((e) => !e)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium shadow-md border flex items-center gap-1 cursor-pointer ${
                    exploded
                      ? 'bg-[#0F422E] text-white border-[#0F422E]'
                      : 'bg-[#FFFFFF] text-[#1D1B17] border-[#CBD5E1]'
                  }`}
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>{exploded ? 'Collapse' : 'Explode'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setIsolatedPartId((prev) =>
                      prev === selectedPartId ? null : selectedPartId,
                    )
                  }
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium shadow-md border flex items-center gap-1 cursor-pointer ${
                    isolatedPartId === selectedPartId
                      ? 'bg-[#0F422E] text-white border-[#0F422E]'
                      : 'bg-[#FFFFFF] text-[#1D1B17] border-[#CBD5E1]'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{isolatedPartId === selectedPartId ? 'Un-Isolate' : 'Isolate'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDockMode('documents')}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium shadow-md border bg-[#FFFFFF] text-[#1D1B17] border-[#CBD5E1] flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Specs</span>
                </button>
              </div>
            )}

            {/* Floating Critical Failure Callout Card */}
            {primaryFailing && failingAnchor && failingAnchor.visible && (
              <div
                style={{
                  transform: `translate3d(${Math.max(
                    14,
                    Math.min(failingAnchor.x - 265, 310),
                  )}px, ${Math.max(70, Math.min(failingAnchor.y - 20, 290))}px, 0)`,
                }}
                className="pointer-events-none absolute top-0 left-0 w-64 bg-[#FFFFFF] border border-[#DC2626] rounded-2xl p-3 shadow-lg z-10"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#B91C1C]">
                    <AlertOctagon className="w-3 h-3" />
                    CRITICAL FAILURE · YR {simYears.toFixed(1)}
                  </span>
                  <span className="font-mono text-[10px] font-semibold text-[#B91C1C]">
                    D={primaryFailing.damageIndex.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#1D1B17]">
                  {primaryFailing.part.name}
                </div>
                <p className="text-[11px] text-[#475569] mt-1 leading-snug">
                  {primaryFailing.mechanismSummary}
                </p>
              </div>
            )}

            {/* Bottom Floating Dock inside CAD Stage */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-full bg-[#FFFFFF] border border-[#CBD5E1] shadow-md z-10">
              {(
                [
                  { id: 'dashboard', label: 'Dashboard' },
                  { id: 'procedures', label: 'Procedures' },
                  { id: 'documents', label: 'Specs' },
                  { id: 'parts', label: exploded ? 'Parts (Exploded)' : 'Parts' },
                  { id: 'section', label: sectionMode ? 'Section (On)' : 'Section' },
                ] as { id: DockMode; label: string }[]
              ).map((d) => {
                const active =
                  (d.id === 'section' && sectionMode) ||
                  (d.id === 'parts' && exploded) ||
                  dockMode === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDockAction(d.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#1D1B17] text-[#FFFFFF]'
                        : 'text-[#475569] hover:text-[#1D1B17]'
                    }`}
                  >
                    {d.id === 'section' && (
                      <Scissors className="w-3 h-3 inline mr-1 -mt-0.5" />
                    )}
                    {d.id === 'procedures' && (
                      <Wrench className="w-3 h-3 inline mr-1 -mt-0.5" />
                    )}
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Timeline Scrubber with Wear Sparkline */}
          <div className="p-4 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1D1B17]">
                  Timeline Scrubber — Cumulative Fatigue Curve
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FDF2EC] font-mono text-[10px] font-semibold text-[#A33E11]">
                  D_c Wear: {activePartState.damageIndex.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[0.01, 2.0, 5.0, 10.0].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setSimYears(yr);
                    }}
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] cursor-pointer ${
                      Math.abs(simYears - yr) < 0.15
                        ? 'bg-[#0F422E] text-white font-semibold'
                        : 'bg-[#FFFFFF] text-[#414943] border border-[#414943]/12'
                    }`}
                  >
                    {yr < 0.1 ? 'Day 1' : `Yr ${yr}`}
                  </button>
                ))}
              </div>
            </div>

            <svg viewBox="0 0 320 40" className="w-full h-10">
              <line
                x1="0"
                y1="18"
                x2="320"
                y2="18"
                stroke="#E06A3B"
                strokeDasharray="3 2"
                strokeOpacity="0.45"
              />
              <polyline
                fill="none"
                stroke="#0F422E"
                strokeWidth="2.2"
                strokeLinecap="round"
                points={wearSparkline}
              />
              <circle
                cx={(simYears / 10) * 320}
                cy={36 - Math.min(1, activePartState.damageIndex / 1.6) * 28}
                r="4"
                fill="#E06A3B"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </svg>

            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-[#696156]">Day 1</span>
              <input
                type="range"
                min={0.01}
                max={10}
                step={0.1}
                value={simYears}
                onChange={(e) => {
                  setIsPlaying(false);
                  setSimYears(parseFloat(e.target.value));
                }}
                className="flex-1 terra-slider terracotta-thumb"
                aria-label="Fast-forward simulation years"
              />
              <span className="font-mono text-[10px] text-[#696156]">Year 10.0</span>
            </div>
          </div>
        </section>

        {/* RIGHT INSPECTOR: Failure Diagnostic & Redesign Protocol */}
        <aside className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#A33E11]">
                Failure Diagnostic
              </span>
              <span
                className={`font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                  activePartState.status === 'critical'
                    ? 'bg-[#FDF2EC] text-[#B91C1C]'
                    : activePartState.status === 'degrading'
                      ? 'bg-[#FEF7EE] text-[#734800]'
                      : 'bg-[#EAF4EE] text-[#0F422E]'
                }`}
              >
                {activePartState.status.toUpperCase()}
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-[#1D1B17] mt-1">
              {activePartState.part.name}
            </h3>
            <p className="font-mono text-[11px] text-[#696156]">
              {activePartState.part.material} · {activePartState.part.subsystem}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#1D1B17]">
                Cumulative Damage D(t)
              </span>
              <span
                className={`font-mono font-bold ${
                  activePartState.damageIndex >= 1
                    ? 'text-[#B91C1C]'
                    : 'text-[#0F422E]'
                }`}
              >
                {activePartState.damageIndex.toFixed(2)} / 1.00
              </span>
            </div>
            <div className="h-2.5 w-full bg-[#EDE5D8] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  activePartState.damageIndex >= 1
                    ? 'bg-[#EF4444]'
                    : activePartState.damageIndex >= 0.62
                      ? 'bg-[#D9822B]'
                      : 'bg-[#2A5A44]'
                }`}
                style={{
                  width: `${Math.min(100, activePartState.damageIndex * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-[#414943] mt-2 leading-snug">
              {activePartState.mechanismSummary}
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#696156]">
              Dominant Degradation Physics
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Coffin-Manson Thermal Fatigue</span>
                <span className="font-mono font-semibold">
                  {Math.round(activePartState.thermalFatigueShare * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-[#EDE5D8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E06A3B] rounded-full"
                  style={{ width: `${activePartState.thermalFatigueShare * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Chemical / Brine Corrosion</span>
                <span className="font-mono font-semibold">
                  {Math.round(activePartState.corrosionShare * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-[#EDE5D8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B91C1C] rounded-full"
                  style={{ width: `${activePartState.corrosionShare * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Electrostatic Dust Abrasion</span>
                <span className="font-mono font-semibold">
                  {Math.round(activePartState.abrasionShare * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-[#EDE5D8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2A5A44] rounded-full"
                  style={{ width: `${activePartState.abrasionShare * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FDF2EC] border border-[#E06A3B]/25 text-xs">
            <div className="font-semibold text-[#A33E11] mb-1">
              Earth vs. Lunar / Martian Divergence
            </div>
            <p className="text-[11px] text-[#414943] leading-relaxed">
              {activePartState.part.earthDivergenceNote}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EAF4EE] border border-[#2A5A44]/20 text-xs">
            <div className="font-semibold text-[#0F422E] mb-1">
              Redesign Protocol (Mitigation)
            </div>
            <p className="text-[11px] text-[#0F422E]/90 leading-relaxed">
              Specify Braycote 601EF PFPE grease, Ti-6Al-4V Belleville torque
              washers (14.2 N·m), and DLC tungsten-carbide flute coatings.
            </p>
          </div>

          {dockMode === 'documents' && (
            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/10 text-xs">
              <div className="font-semibold text-[#1D1B17] mb-1.5">
                Nominal MTBF Across Regimes
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                <div className="p-2 bg-white rounded-xl border border-[#414943]/8 text-center">
                  <div className="text-[9px] text-[#696156]">EARTH</div>
                  <div className="font-bold">
                    {activePartState.part.nominalLifeYears.earth_analog} yr
                  </div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-[#414943]/8 text-center">
                  <div className="text-[9px] text-[#696156]">MOON</div>
                  <div className="font-bold">
                    {activePartState.part.nominalLifeYears.moon_south_pole} yr
                  </div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-[#414943]/8 text-center">
                  <div className="text-[9px] text-[#696156]">MARS</div>
                  <div className="font-bold">
                    {activePartState.part.nominalLifeYears.mars_jezero} yr
                  </div>
                </div>
              </div>
            </div>
          )}

          {onOpenReports && (
            <button
              type="button"
              onClick={onOpenReports}
              className="w-full py-3.5 px-6 rounded-full bg-[#184633] hover:bg-[#0F3525] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Compile into Synthesis Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </aside>
      </div>
    </div>
  );
};
