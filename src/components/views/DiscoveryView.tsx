import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Crosshair,
  Flame,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Orbit,
  RotateCcw,
  RotateCw,
  Sparkles,
  Sun,
  Thermometer,
} from 'lucide-react';
import {
  DIMENSION_META,
  EARTH_CANDIDATE_SITES,
  MANDATORY_BREAKDOWN_ITEMS,
  PLANETARY_TARGETS,
} from '../../data/planetaryData';
import {
  DimensionKey,
  DimensionWeights,
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetaryTarget,
  ScoredCandidate,
} from '../../types/terra';
import { PlanetaryGlobe3D } from '../three/PlanetaryGlobe3D';

interface DiscoveryViewProps {
  activeTarget: PlanetaryTarget;
  onSelectTarget: (targetId: string) => void;
  activeObjective: ObjectiveProfile;
  onSelectObjective: (objectiveId: string) => void;
  weights: DimensionWeights;
  onChangeWeight: (key: DimensionKey, val: number) => void;
  onResetWeights: () => void;
  noveltyOnly: boolean;
  onToggleNovelty: (val: boolean) => void;
  thresholdPct: number;
  onChangeThreshold: (val: number) => void;
  rankedCandidates: ScoredCandidate[];
  selectedSite: EarthCandidateSite;
  onSelectSite: (siteId: string) => void;
  onOpenCalendar: () => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  activeTarget,
  onSelectTarget,
  activeObjective,
  onSelectObjective,
  weights,
  onChangeWeight,
  onResetWeights,
  noveltyOnly,
  onToggleNovelty,
  thresholdPct,
  onChangeThreshold,
  rankedCandidates,
  selectedSite,
  onSelectSite,
  onOpenCalendar,
}) => {
  const [centerMode, setCenterMode] = useState<'globe' | 'datum'>('datum');
  const [autoRotate, setAutoRotate] = useState(false);

  const selectedScored = useMemo(
    () =>
      rankedCandidates.find((c) => c.site.id === selectedSite.id) ||
      rankedCandidates[0],
    [rankedCandidates, selectedSite.id],
  );

  // Match percentage calculation for prime candidate
  const globalScore = Math.round(selectedScored?.overallScore || 84);

  // Circular progress stroke calculation (radius = 32, circumference = 2 * PI * 32 = 201)
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (globalScore / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-6 items-start">
      {/* ===================== LEFT COLUMN ===================== */}
      <aside className="flex flex-col gap-5">
        {/* Card 1: Criteria Weights */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-base font-bold text-[#1D1B17]">
              Criteria Weights
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EE] text-[#0F422E] font-semibold text-xs border border-[#2A5A44]/15">
              100% Calibrated
            </span>
          </div>
          <p className="text-xs text-[#696156] mb-4">
            Balance surface analogy properties
          </p>

          <div className="flex flex-col gap-4">
            {/* 1. Thermal Amplitude (ΔT) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-2 font-semibold text-[#1D1B17]">
                  <span className="w-2 h-2 rounded-full bg-[#E06A3B]" />
                  Thermal Amplitude (ΔT)
                </span>
                <span className="font-mono text-xs font-bold text-[#E06A3B]">
                  {Math.round((weights.thermalRange || 0.4) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((weights.thermalRange || 0.4) * 100)}
                onChange={(e) =>
                  onChangeWeight('thermalRange', Number(e.target.value) / 100)
                }
                className="w-full terra-slider terracotta-thumb"
                aria-label="Thermal Amplitude weight"
              />
              <div className="flex items-center justify-between text-[11px] text-[#696156] mt-1">
                <span>Range: 180K – 390K</span>
                <span className="font-semibold text-[#E06A3B]">Priority Primary</span>
              </div>
            </div>

            {/* 2. Diurnal / Seasonal Ratio */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-2 font-semibold text-[#1D1B17]">
                  <span className="w-2 h-2 rounded-full bg-[#184633]" />
                  Diurnal / Seasonal Ratio
                </span>
                <span className="font-mono text-xs font-bold text-[#184633]">
                  {Math.round((weights.diurnalSeasonalRatio || 0.25) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((weights.diurnalSeasonalRatio || 0.25) * 100)}
                onChange={(e) =>
                  onChangeWeight('diurnalSeasonalRatio', Number(e.target.value) / 100)
                }
                className="w-full terra-slider"
                aria-label="Diurnal / Seasonal Ratio weight"
              />
              <div className="flex items-center justify-between text-[11px] text-[#696156] mt-1">
                <span>Hurst Exponent: 0.84</span>
                <span className="font-medium">Cyclic Pattern</span>
              </div>
            </div>

            {/* 3. Slope & Rugosity (DEM) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-2 font-semibold text-[#1D1B17]">
                  <span className="w-2 h-2 rounded-full bg-[#E06A3B]" />
                  Slope &amp; Rugosity (DEM)
                </span>
                <span className="font-mono text-xs font-bold text-[#E06A3B]">
                  {Math.round((weights.slope || 0.2) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((weights.slope || 0.2) * 100)}
                onChange={(e) =>
                  onChangeWeight('slope', Number(e.target.value) / 100)
                }
                className="w-full terra-slider terracotta-thumb"
                aria-label="Slope and Rugosity weight"
              />
              <div className="flex items-center justify-between text-[11px] text-[#696156] mt-1">
                <span>Relief RMS: 4.8m</span>
                <span className="font-medium">Morphology</span>
              </div>
            </div>

            {/* 4. Solar Grazing Angle */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-2 font-semibold text-[#1D1B17]">
                  <span className="w-2 h-2 rounded-full bg-[#696156]" />
                  Solar Grazing Angle
                </span>
                <span className="font-mono text-xs font-bold text-[#696156]">
                  {Math.round((weights.solarElevation || 0.15) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((weights.solarElevation || 0.15) * 100)}
                onChange={(e) =>
                  onChangeWeight('solarElevation', Number(e.target.value) / 100)
                }
                className="w-full terra-slider"
                aria-label="Solar Grazing Angle weight"
              />
              <div className="flex items-center justify-between text-[11px] text-[#696156] mt-1">
                <span>Incidence: &lt; 2.5°</span>
                <span className="font-medium">Horizon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Novelty Discovery */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-1.5 font-display text-base font-bold text-[#1D1B17]">
              <Sparkles className="w-4 h-4 text-[#E06A3B]" />
              <span>Novelty Discovery</span>
            </div>
            <p className="text-xs text-[#696156] mt-0.5">
              Suppress overused catalog sites
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
            <div>
              <div className="text-xs font-bold text-[#1D1B17]">
                Suppress Legacy Sites
              </div>
              <div className="text-[11px] text-[#696156]">
                Hides classic 2014 field locations
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={noveltyOnly}
              onClick={() => onToggleNovelty(!noveltyOnly)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                noveltyOnly ? 'bg-[#184633]' : 'bg-[#C0C9C1]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  noveltyOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Novel Clusters Identified Box */}
          <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1D1B17]">
                Novel Clusters Identified
              </div>
              <div className="text-[11px] text-[#696156] mt-0.5 leading-snug">
                High Puna salars, dry Tibetan basins, &amp; polar nunataks
              </div>
            </div>
            <span className="font-display font-bold text-3xl text-[#184633] ml-2">
              14
            </span>
          </div>

          {/* Fidelity Threshold Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#1D1B17]">Fidelity Threshold</span>
              <span className="font-mono text-xs font-bold text-[#184633]">
                ≥ {thresholdPct.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              value={thresholdPct}
              onChange={(e) => onChangeThreshold(Number(e.target.value))}
              className="w-full terra-slider"
              aria-label="Fidelity Threshold"
            />
            <div className="flex items-center justify-between font-mono text-[10px] text-[#696156] mt-1">
              <span>Broad (50%)</span>
              <span>Exact Match (95%)</span>
            </div>
          </div>

          {/* Refresh Pareto Button */}
          <button
            type="button"
            onClick={onResetWeights}
            className="w-full py-2.5 px-4 rounded-full border border-[#414943]/15 hover:bg-[#F3EDE5] text-xs font-semibold text-[#1D1B17] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#696156]" />
            <span>Refresh Pareto Calculation</span>
          </button>
        </div>
      </aside>

      {/* ===================== CENTER COLUMN ===================== */}
      <section className="flex flex-col gap-5">
        {/* Top Card: Analog Globe / Radar Stage */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 sm:p-6 flex flex-col justify-between relative min-h-[440px]">
          {/* Top Stage Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 z-10">
            <div className="flex items-center p-0.5 bg-[#F3EDE5] rounded-full border border-[#414943]/8 text-xs font-medium">
              <button
                type="button"
                onClick={() => setCenterMode('globe')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  centerMode === 'globe'
                    ? 'bg-[#184633] text-white font-semibold shadow-xs'
                    : 'text-[#696156] hover:text-[#1D1B17]'
                }`}
              >
                Analog Globe 3D
              </button>
              <button
                type="button"
                onClick={() => setCenterMode('datum')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  centerMode === 'datum'
                    ? 'bg-[#184633] text-white font-semibold shadow-xs'
                    : 'text-[#696156] hover:text-[#1D1B17]'
                }`}
              >
                Geodetic Datum
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#696156]">
              <button
                type="button"
                onClick={() => setAutoRotate((r) => !r)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F9F3EB] hover:bg-[#F3EDE5] cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate 3D</span>
              </button>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F9F3EB]">
                <Flame className="w-3.5 h-3.5 text-[#E06A3B]" />
                <span>Heatmap</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F9F3EB]">
                <Layers className="w-3.5 h-3.5 text-[#184633]" />
                <span>Relief</span>
              </span>
              <button
                type="button"
                className="p-1 rounded-full bg-[#F9F3EB] hover:bg-[#F3EDE5] cursor-pointer"
                title="Crosshair datum"
              >
                <Crosshair className="w-4 h-4 text-[#696156]" />
              </button>
            </div>
          </div>

          {/* Central Circular Radar Projection matching Screen 2 */}
          <div className="relative flex-1 w-full flex items-center justify-center py-2 min-h-[300px]">
            {centerMode === 'globe' ? (
              <PlanetaryGlobe3D
                body="earth"
                activeLayerId="earth_dem"
                pins={EARTH_CANDIDATE_SITES.map((s) => ({
                  id: s.id,
                  label: s.name.split(' (')[0],
                  lat: s.lat,
                  lon: s.lon,
                  accent: s.id === selectedSite.id ? 'terracotta' : 'moss',
                  active: s.id === selectedSite.id,
                }))}
                onPinClick={onSelectSite}
                autoRotate={autoRotate}
                layerOpacity={0.9}
                focusLat={selectedSite.lat}
                focusLon={selectedSite.lon}
                cameraMode="orbit"
                themeSurface="studio-light"
              />
            ) : (
              <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
                <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-sm overflow-visible">
                  {/* Concentric Elevation / Polar Rings */}
                  <circle cx="200" cy="200" r="180" fill="#F6F1E8" stroke="#E5DCCE" strokeWidth="2" />
                  <circle cx="200" cy="200" r="140" fill="none" stroke="#EADFCF" strokeWidth="1" />
                  <circle cx="200" cy="200" r="95" fill="none" stroke="#E2DACF" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="200" cy="200" r="45" fill="none" stroke="#E2DACF" strokeWidth="1" />

                  {/* High transferability sector green fill */}
                  <path
                    d="M200,200 L180,60 A140,140 0 0,1 270,100 Z"
                    fill="#184633"
                    opacity="0.18"
                  />
                  {/* Puna Transect Sector */}
                  <path
                    d="M200,200 L170,140 Q195,190 200,200 Z"
                    fill="#2A5A44"
                    opacity="0.7"
                  />

                  {/* Candidate Pin #4: Svalbard */}
                  <g transform="translate(180, 80)">
                    <rect width="90" height="20" rx="10" fill="#FFFFFF" stroke="#414943" strokeWidth="0.5" strokeOpacity="0.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
                    <circle cx="10" cy="10" r="3" fill="#696156" />
                    <text x="18" y="14" fill="#696156" fontSize="9" fontFamily="Inter" fontWeight="600">
                      Svalbard 76.5%
                    </text>
                  </g>

                  {/* Candidate Pin #3: Qaidam Basin */}
                  <g transform="translate(230, 130)">
                    <rect width="98" height="22" rx="11" fill="#FFFFFF" stroke="#E06A3B" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
                    <circle cx="11" cy="11" r="3.5" fill="#E06A3B" />
                    <text x="20" y="15" fill="#1D1B17" fontSize="9" fontFamily="Inter" fontWeight="600">
                      Qaidam Basin 79.1%
                    </text>
                  </g>

                  {/* Candidate Pin #2: Salar de Gorbea (ACTIVE PRIME PIN) */}
                  <g transform="translate(150, 168)" className="cursor-pointer" onClick={() => onSelectSite('salar_gorbea')}>
                    <circle cx="10" cy="10" r="10" fill="#E06A3B" opacity="0.3" className="animate-ping" />
                    <rect width="130" height="24" rx="12" fill="#184633" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.14))" />
                    <circle cx="12" cy="12" r="4" fill="#E06A3B" />
                    <text x="22" y="16" fill="#FFFFFF" fontSize="10" fontFamily="Outfit" fontWeight="600">
                      • Salar de Gorbea
                    </text>
                    <text x="100" y="16" fill="#BAEED1" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                      84.2%
                    </text>
                  </g>

                  {/* Candidate Pin #1: Univ. Valley */}
                  <g transform="translate(170, 240)" className="cursor-pointer" onClick={() => onSelectSite('univ_valley')}>
                    <rect width="120" height="22" rx="11" fill="#FFFFFF" stroke="#184633" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
                    <circle cx="11" cy="11" r="3.5" fill="#184633" />
                    <text x="20" y="15" fill="#184633" fontSize="9" fontFamily="Inter" fontWeight="600">
                      Univ. Valley 86.4%
                    </text>
                  </g>
                </svg>
              </div>
            )}
          </div>

          {/* Bottom Gradient Elevation Bar */}
          <div className="pt-3 border-t border-[#414943]/8 z-10">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-semibold text-[#696156] uppercase tracking-[0.06em]">
                Terrain Elevation Gradient
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#E06A3B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E06A3B]" />
                Inspection Focus: Chile–Argentina Transect
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#184633] via-[#E69A28] to-[#E06A3B]" />
            <div className="flex items-center justify-between font-mono text-[10px] text-[#696156] mt-1">
              <span>-500m Depression</span>
              <span>Puna Plateau</span>
              <span>Cordillera +6,000m</span>
            </div>
          </div>
        </div>

        {/* Bottom Card: 10 km Regional Transect Comparison */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="font-display font-bold text-base text-[#1D1B17]">
                10 km Regional Transect Comparison
              </h4>
              <p className="text-xs text-[#696156]">
                Smooth synchronized profile alignment across candidate zones
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#184633]">
                <span className="w-3 h-0.5 bg-[#184633]" />
                Lunar Shackleton Rim
              </span>
              <span className="flex items-center gap-1.5 text-[#E06A3B]">
                <span className="w-3 h-0.5 bg-[#E06A3B] border-b border-dashed border-[#E06A3B]" />
                #2 Salar de Gorbea
              </span>
            </div>
          </div>

          {/* 3 Plots in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Plot 1: Elevation Relief */}
            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/6">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#1D1B17]">Elevation Relief (Δz)</span>
                <span className="font-mono text-[11px] text-[#184633]">RMS Δ 34m</span>
              </div>
              <svg viewBox="0 0 160 50" className="w-full h-12 overflow-visible">
                {/* Target profile */}
                <path
                  d="M0,40 Q40,15 80,32 T160,25"
                  fill="none"
                  stroke="#184633"
                  strokeWidth="2.2"
                />
                {/* Analog profile */}
                <path
                  d="M0,44 Q45,20 80,35 T160,30"
                  fill="none"
                  stroke="#E06A3B"
                  strokeWidth="1.8"
                  strokeDasharray="3,2"
                />
              </svg>
              <div className="flex items-center justify-between font-mono text-[9px] text-[#696156] mt-1">
                <span>0 km (West Rim)</span>
                <span>5 km</span>
                <span>10 km (Basin)</span>
              </div>
            </div>

            {/* Plot 2: Diurnal Temperature Wave */}
            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/6">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#1D1B17]">Diurnal Temperature Wave</span>
                <span className="font-mono text-[11px] text-[#E06A3B]">ΔT = 224 K</span>
              </div>
              <svg viewBox="0 0 160 50" className="w-full h-12 overflow-visible">
                {/* Target diurnal sine wave */}
                <path
                  d="M0,45 Q40,5 80,10 T160,45"
                  fill="none"
                  stroke="#184633"
                  strokeWidth="2.2"
                />
                {/* Analog wave */}
                <path
                  d="M0,40 Q40,18 80,20 T160,40"
                  fill="none"
                  stroke="#E06A3B"
                  strokeWidth="1.8"
                  strokeDasharray="3,2"
                />
              </svg>
              <div className="flex items-center justify-between font-mono text-[9px] text-[#696156] mt-1">
                <span>00:00 (Nadir)</span>
                <span>12:00 (Zenith)</span>
                <span>24:00 (End)</span>
              </div>
            </div>

            {/* Plot 3: Slope Rugosity Bins */}
            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/6">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#1D1B17]">Slope Rugosity Bins</span>
                <span className="font-mono text-[11px] text-[#0F422E]">Overlap 92%</span>
              </div>
              <div className="flex items-end justify-between h-12 gap-1.5 px-2">
                {[
                  { targetH: 20, analogH: 26 },
                  { targetH: 45, analogH: 40 },
                  { targetH: 35, analogH: 38 },
                  { targetH: 22, analogH: 18 },
                  { targetH: 12, analogH: 14 },
                ].map((b, i) => (
                  <div key={i} className="flex-1 flex items-end justify-center gap-0.5">
                    <div
                      className="w-1.5 bg-[#184633] rounded-t-xs"
                      style={{ height: `${b.targetH}px` }}
                    />
                    <div
                      className="w-1.5 bg-[#E06A3B] rounded-t-xs"
                      style={{ height: `${b.analogH}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between font-mono text-[9px] text-[#696156] mt-1">
                <span>0–5°</span>
                <span>5–10°</span>
                <span>10–15°</span>
                <span>15–20°</span>
                <span>&gt;20°</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== RIGHT COLUMN ===================== */}
      <aside className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full bg-[#FFF2EB] border border-[#FFDBCF] text-[10px] font-bold text-[#E06A3B]">
            PRIME MATCH #1
          </span>
          <span className="text-xs font-semibold text-[#696156]">
            Candidate Report
          </span>
        </div>

        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-[#1D1B17]">
            {selectedSite.name.includes('Gorbea') ? 'Salar de Gorbea' : selectedSite.name.split(' (')[0]}
          </h3>
          <p className="text-xs text-[#696156] mt-0.5">
            {selectedSite.region} • {selectedSite.country}
          </p>
        </div>

        {/* Metadata lines */}
        <div className="border-y border-[#414943]/8 py-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#696156]">Coordinates:</span>
            <span className="font-mono font-medium text-[#1D1B17]">
              {selectedSite.coordinates}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#696156]">Elevation:</span>
            <span className="font-mono font-medium text-[#1D1B17]">
              {selectedSite.elevationM.toLocaleString()} m altitude
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#696156]">Biome Character:</span>
            <span className="font-semibold text-[#1D1B17]">
              {selectedSite.biome}
            </span>
          </div>
        </div>

        {/* GLOBAL FIDELITY box */}
        <div className="p-4 rounded-2xl bg-[#F9F3EB] border border-[#414943]/6 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-[#696156] uppercase tracking-[0.06em]">
              Global Fidelity
            </div>
            <div className="font-display font-bold text-lg text-[#1D1B17] mt-0.5">
              {activeTarget.name.includes('Shackleton') ? 'Shackleton' : activeTarget.name} Match
            </div>
            <div className="text-[11px] text-[#696156] mt-0.5">
              Confidence index: <strong className="text-[#0F422E]">High</strong>
            </div>
          </div>

          {/* SVG Circular Progress Ring matching image_d14f26ba */}
          <div className="relative w-18 h-18 flex items-center justify-center">
            <svg viewBox="0 0 76 76" className="w-full h-full transform -rotate-90">
              <circle
                cx="38"
                cy="38"
                r={radius}
                fill="none"
                stroke="#E2DACF"
                strokeWidth="5"
              />
              <circle
                cx="38"
                cy="38"
                r={radius}
                fill="none"
                stroke="#184633"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-xl text-[#184633]">
              {globalScore}%
            </div>
          </div>
        </div>

        {/* DIMENSION OVERLAP Progress Bars */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
            Dimension Overlap
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#1D1B17] font-medium">Thermal Cycling Fidelity</span>
              <span className="font-mono text-xs font-bold text-[#E06A3B]">88%</span>
            </div>
            <div className="h-1.5 w-full bg-[#EDE5D8] rounded-full overflow-hidden">
              <div className="h-full bg-[#E06A3B] rounded-full" style={{ width: '88%' }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#1D1B17] font-medium">Slope Rugosity &amp; DEM</span>
              <span className="font-mono text-xs font-bold text-[#184633]">91%</span>
            </div>
            <div className="h-1.5 w-full bg-[#EDE5D8] rounded-full overflow-hidden">
              <div className="h-full bg-[#184633] rounded-full" style={{ width: '91%' }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#1D1B17] font-medium">Aridity &amp; Sublimation</span>
              <span className="font-mono text-xs font-bold text-[#E06A3B]">82%</span>
            </div>
            <div className="h-1.5 w-full bg-[#EDE5D8] rounded-full overflow-hidden">
              <div className="h-full bg-[#E06A3B] rounded-full" style={{ width: '82%' }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#1D1B17] font-medium">Grazing Illumination Similarity</span>
              <span className="font-mono text-xs font-bold text-[#696156]">64%</span>
            </div>
            <div className="h-1.5 w-full bg-[#EDE5D8] rounded-full overflow-hidden">
              <div className="h-full bg-[#696156] rounded-full" style={{ width: '64%' }} />
            </div>
          </div>
        </div>

        {/* Physical Analogy Boundaries Callout (Mandatory Failure Lab Callout) */}
        <div className="bg-[#FFF5ED] border border-[#FFDBCF] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#E06A3B] mb-1">
            <span>ⓘ</span>
            <span>Physical Analogy Boundaries</span>
          </div>
          <p className="text-[11px] text-[#696156] leading-snug mb-2">
            Real-world terrestrial limits to bear in mind before mission planning:
          </p>
          <ul className="text-[11px] text-[#414943] space-y-1.5 leading-tight">
            <li>
              • <strong>Gravity Gap:</strong> 9.8 m/s² Earth vs 1.62 m/s² Moon (6x difference).
            </li>
            <li>
              • <strong>Atmosphere:</strong> 62 kPa cold air vs lunar ultra-high vacuum.
            </li>
            <li>
              • <strong>Regolith:</strong> Sulfate evaporites vs jagged impact glass agglutinates.
            </li>
          </ul>
        </div>

        {/* Action Button: Open Seasonal Calendar */}
        <div>
          <button
            type="button"
            onClick={onOpenCalendar}
            className="w-full bg-[#184633] hover:bg-[#0F3525] active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            <span>Open Seasonal Calendar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="font-mono text-[11px] text-[#696156] text-center mt-2">
            Suggested Expedition Window: <strong>Nov 15 – Jan 28</strong>
          </p>
        </div>
      </aside>
    </div>
  );
};
