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
  const globalScore = Math.round(selectedScored?.bestMonthScore || 84);

  // Circular progress stroke calculation (radius = 32, circumference = 2 * PI * 32 = 201)
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (globalScore / 100) * circumference;

  const transectCurves = useMemo(() => {
    const tVals = activeTarget.crossSectionElevationsM || [0];
    const sVals = selectedSite.transectElevationsM || [0];
    const minT = Math.min(...tVals);
    const maxT = Math.max(...tVals);
    const spanT = Math.max(1, maxT - minT);

    const minS = Math.min(...sVals);
    const maxS = Math.max(...sVals);
    const spanS = Math.max(1, maxS - minS);

    const w = 160;
    const h = 50;

    const tPts = tVals.map((v, i) => {
      const x = (i / (tVals.length - 1)) * w;
      const y = h - 6 - ((v - minT) / spanT) * (h - 12);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const sPts = sVals.map((v, i) => {
      const x = (i / (sVals.length - 1)) * w;
      const y = h - 6 - ((v - minS) / spanS) * (h - 12);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return {
      targetPath: tPts.join(' '),
      analogPath: sPts.join(' '),
    };
  }, [activeTarget, selectedSite]);

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

          <div className="flex flex-col gap-3.5">
            {/* 1. Thermal Amplitude (ΔT) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
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
              <div className="flex items-center justify-between font-mono text-[10px] text-[#696156]">
                <span>180K – 390K range</span>
                <span className="font-medium text-[#E06A3B]">Primary Priority</span>
              </div>
            </div>

            {/* 2. Diurnal / Seasonal Ratio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
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
              <div className="flex items-center justify-between font-mono text-[10px] text-[#696156]">
                <span>Harmonic fidelity</span>
                <span className="font-medium text-[#184633]">Cyclic Pattern</span>
              </div>
            </div>

            {/* 3. Slope & Rugosity (DEM) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
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
              <div className="flex items-center justify-between font-mono text-[10px] text-[#696156]">
                <span>Relief RMS 4.8m</span>
                <span className="font-medium text-[#E06A3B]">Morphology</span>
              </div>
            </div>

            {/* 4. Solar Grazing Angle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
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
              <div className="flex items-center justify-between font-mono text-[10px] text-[#696156]">
                <span>Incidence &lt; 2.5°</span>
                <span className="font-medium text-[#696156]">Horizon Dip</span>
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                  autoRotate
                    ? 'bg-[#184633] text-white font-semibold'
                    : 'bg-[#F9F3EB] hover:bg-[#F3EDE5] text-[#696156]'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate 3D</span>
              </button>
              <button
                type="button"
                onClick={() => setCenterMode('datum')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                  centerMode === 'datum'
                    ? 'bg-[#FFF2EB] text-[#E06A3B] font-semibold border border-[#FFDBCF]'
                    : 'bg-[#F9F3EB] text-[#696156] hover:bg-[#F3EDE5]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-[#E06A3B]" />
                <span>Heatmap</span>
              </button>
              <button
                type="button"
                onClick={() => setCenterMode('globe')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                  centerMode === 'globe'
                    ? 'bg-[#EAF4EE] text-[#184633] font-semibold border border-[#2A5A44]/15'
                    : 'bg-[#F9F3EB] text-[#696156] hover:bg-[#F3EDE5]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#184633]" />
                <span>Relief</span>
              </button>
              <button
                type="button"
                onClick={() => setCenterMode((m) => (m === 'globe' ? 'datum' : 'globe'))}
                className="p-1 rounded-full bg-[#F9F3EB] hover:bg-[#F3EDE5] text-[#696156] cursor-pointer"
                title="Toggle Geodetic Datum / Globe"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central Circular Radar Projection matching Screen 2 */}
          <div className="relative flex-1 w-full flex items-center justify-center py-2 min-h-[300px]">
            {centerMode === 'globe' ? (
              <PlanetaryGlobe3D
                body="earth"
                layerId="srtm_slope"
                pins={EARTH_CANDIDATE_SITES.map((s) => {
                  const score = Math.round(
                    rankedCandidates.find((c) => c.site.id === s.id)?.bestMonthScore || 75,
                  );
                  return {
                    id: s.id,
                    label: s.name.split(' (')[0],
                    lat: s.lat,
                    lon: s.lon,
                    accent: s.id === selectedSite.id ? 'terracotta' : s.isCatalogKnown ? 'moss' : 'amber',
                    active: s.id === selectedSite.id,
                    scoreBadge: `${score}%`,
                  };
                })}
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

                  {/* Axis Crosshairs */}
                  <line x1="200" y1="20" x2="200" y2="380" stroke="#E5DCCE" strokeWidth="0.75" strokeDasharray="4,4" />
                  <line x1="20" y1="200" x2="380" y2="200" stroke="#E5DCCE" strokeWidth="0.75" strokeDasharray="4,4" />

                  {/* Cardinal Ticks */}
                  <text x="200" y="32" textAnchor="middle" fill="#696156" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">0° N</text>
                  <text x="372" y="203" textAnchor="middle" fill="#696156" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">90° E</text>
                  <text x="200" y="375" textAnchor="middle" fill="#696156" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">180° S</text>
                  <text x="28" y="203" textAnchor="middle" fill="#696156" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">270° W</text>

                  {/* High transferability sector green fill */}
                  <path
                    d="M200,200 L180,60 A140,140 0 0,1 270,100 Z"
                    fill="#184633"
                    opacity="0.18"
                  />
                  {/* Active transect focus sector */}
                  <path
                    d="M200,200 L170,140 Q195,190 200,200 Z"
                    fill="#2A5A44"
                    opacity="0.65"
                  />

                  {/* Dynamic Candidate Pins for top 5 */}
                  {rankedCandidates.slice(0, 5).map((cand, idx) => {
                    // Polar layout based on lat/lon
                    const rNorm = Math.min(160, Math.max(35, ((90 - Math.abs(cand.site.lat)) / 90) * 165));
                    const angleRad = (cand.site.lon * Math.PI) / 180;
                    const cx = Math.round(200 + rNorm * Math.sin(angleRad));
                    const cy = Math.round(200 - rNorm * Math.cos(angleRad));
                    const isSelected = cand.site.id === selectedSite.id;
                    const score = Math.round(cand.bestMonthScore);
                    const shortName = cand.site.name.split(' (')[0].slice(0, 14);

                    return (
                      <g
                        key={cand.site.id}
                        transform={`translate(${cx - 50}, ${cy - 11})`}
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => onSelectSite(cand.site.id)}
                      >
                        {isSelected && (
                          <circle cx="12" cy="11" r="10" fill="#E06A3B" opacity="0.3" className="animate-ping" />
                        )}
                        <rect
                          width="104"
                          height="22"
                          rx="11"
                          fill={isSelected ? '#184633' : '#FFFFFF'}
                          stroke={isSelected ? '#184633' : idx === 1 ? '#E06A3B' : '#414943'}
                          strokeWidth={isSelected || idx === 1 ? '1.2' : '0.5'}
                          strokeOpacity={isSelected ? '1' : '0.3'}
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))"
                        />
                        <circle
                          cx="11"
                          cy="11"
                          r="3.5"
                          fill={isSelected ? '#E06A3B' : idx === 1 ? '#E06A3B' : '#184633'}
                        />
                        <text
                          x="20"
                          y="15"
                          fill={isSelected ? '#FFFFFF' : '#1D1B17'}
                          fontSize="9"
                          fontFamily="Outfit"
                          fontWeight={isSelected ? '700' : '600'}
                        >
                          {shortName}
                        </text>
                        <text
                          x="82"
                          y="15"
                          fill={isSelected ? '#BAEED1' : idx === 1 ? '#E06A3B' : '#184633'}
                          fontSize="8.5"
                          fontFamily="JetBrains Mono"
                          fontWeight="700"
                        >
                          {score}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Center Datum Reticle */}
                  <circle cx="200" cy="200" r="4" fill="#184633" />
                  <circle cx="200" cy="200" r="7" fill="none" stroke="#184633" strokeWidth="1" />
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
                Inspection Focus: {selectedSite.region}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#184633] via-[#E69A28] to-[#E06A3B]" />
            <div className="flex items-center justify-between font-mono text-[10px] text-[#696156] mt-1">
              <span>Depression (-500m)</span>
              <span>Plateau Base</span>
              <span>Summit (+{selectedSite.elevationM.toLocaleString()}m)</span>
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
                {activeTarget.name}
              </span>
              <span className="flex items-center gap-1.5 text-[#E06A3B]">
                <span className="w-3 h-0.5 bg-[#E06A3B] border-b border-dashed border-[#E06A3B]" />
                #{Math.max(1, rankedCandidates.findIndex((c) => c.site.id === selectedSite.id) + 1)} {selectedSite.name.split(' (')[0]}
              </span>
            </div>
          </div>

          {/* 3 Plots in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Plot 1: Elevation Relief */}
            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/6">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#1D1B17]">Elevation Relief (Δz)</span>
                <span className="font-mono text-[11px] text-[#184633]">
                  RMS Δ {Math.abs(Math.round((activeTarget.rmsRoughnessM - selectedSite.rmsRoughnessM) * 100) / 100)}m
                </span>
              </div>
              <svg viewBox="0 0 160 50" className="w-full h-12 overflow-visible">
                {/* Target profile */}
                <path
                  d={transectCurves.targetPath}
                  fill="none"
                  stroke="#184633"
                  strokeWidth="2.2"
                />
                {/* Analog profile */}
                <path
                  d={transectCurves.analogPath}
                  fill="none"
                  stroke="#E06A3B"
                  strokeWidth="1.8"
                  strokeDasharray="3,2"
                />
              </svg>
              <div className="flex items-center justify-between font-mono text-[9px] text-[#696156] mt-1">
                <span>0 km</span>
                <span>5 km</span>
                <span>10 km</span>
              </div>
            </div>

            {/* Plot 2: Diurnal Temperature Wave */}
            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/6">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#1D1B17]">Diurnal ΔT Amplitude</span>
                <span className="font-mono text-[11px] text-[#E06A3B]">
                  ΔT = {activeTarget.diurnalDeltaK} K vs {selectedSite.monthlyDiurnalDeltaK[selectedScored.bestMonthIndex] || 36} K
                </span>
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
                <span>24:00 (Cycle)</span>
              </div>
            </div>

            {/* Plot 3: Slope Rugosity Bins */}
            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/6">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#1D1B17]">Slope Distribution</span>
                <span className="font-mono text-[11px] text-[#0F422E]">
                  Slope {selectedSite.slopeDeg.toFixed(1)}°
                </span>
              </div>
              <div className="flex items-end justify-between h-12 gap-1.5 px-2">
                {[
                  { targetH: Math.min(48, Math.max(8, activeTarget.meanSlopeDeg * 1.8)), analogH: Math.min(48, Math.max(8, selectedSite.slopeDeg * 1.8)) },
                  { targetH: Math.min(48, Math.max(12, activeTarget.meanSlopeDeg * 2.2)), analogH: Math.min(48, Math.max(12, selectedSite.slopeDeg * 2.1)) },
                  { targetH: Math.min(48, Math.max(10, activeTarget.meanSlopeDeg * 1.5)), analogH: Math.min(48, Math.max(10, selectedSite.slopeDeg * 1.6)) },
                  { targetH: Math.min(48, Math.max(6, activeTarget.meanSlopeDeg * 0.9)), analogH: Math.min(48, Math.max(6, selectedSite.slopeDeg * 1.0)) },
                  { targetH: Math.min(48, Math.max(4, activeTarget.meanSlopeDeg * 0.5)), analogH: Math.min(48, Math.max(4, selectedSite.slopeDeg * 0.6)) },
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
            PRIME MATCH #{Math.max(1, rankedCandidates.findIndex((c) => c.site.id === selectedSite.id) + 1)}
          </span>
          <span className="text-xs font-semibold text-[#696156]">
            Candidate Report
          </span>
        </div>

        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-[#1D1B17]">
            {selectedSite.name.split(' (')[0]}
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
              {selectedSite.biomeCharacter}
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
              {activeTarget.name} Match
            </div>
            <div className="text-[11px] text-[#696156] mt-0.5">
              Confidence index: <strong className="text-[#0F422E]">{globalScore >= 80 ? 'High' : 'Moderate'}</strong>
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

          {(selectedScored?.dimensionBreakdown || []).slice(0, 4).map((d) => {
            const pct = Math.min(100, Math.max(0, Math.round(d.score)));
            const barColor =
              pct >= 85 ? 'bg-[#184633]' : pct >= 70 ? 'bg-[#E06A3B]' : 'bg-[#696156]';
            const txtColor =
              pct >= 85 ? 'text-[#184633]' : pct >= 70 ? 'text-[#E06A3B]' : 'text-[#696156]';
            return (
              <div key={d.dimension}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#1D1B17] font-medium truncate max-w-[200px]" title={d.label}>
                    {d.label}
                  </span>
                  <span className={`font-mono text-xs font-bold ${txtColor}`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#EDE5D8] rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Physical Analogy Boundaries Callout (Mandatory Failure Lab Callout) */}
        <div className="bg-[#FFF5ED] border border-[#FFDBCF] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#E06A3B] mb-1">
            <span>ⓘ</span>
            <span>Physical Analogy Boundaries ({activeTarget.body === 'mars' ? 'Mars' : 'Lunar'})</span>
          </div>
          <p className="text-[11px] text-[#696156] leading-snug mb-2">
            Real-world terrestrial limits to bear in mind before mission planning:
          </p>
          <ul className="text-[11px] text-[#414943] space-y-1.5 leading-tight">
            {MANDATORY_BREAKDOWN_ITEMS[activeTarget.body === 'mars' ? 'mars' : 'moon'].map((item) => (
              <li key={item.pillar}>
                • <strong>{item.pillar}:</strong> {item.earthValue} Earth vs {item.targetValue} ({item.gapFactor}).
              </li>
            ))}
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
            Suggested Expedition Window:{' '}
            <strong>
              {selectedScored?.windowSummary
                ? `${selectedScored.windowSummary.startDateLabel} – ${selectedScored.windowSummary.endDateLabel}`
                : 'Nov 15 – Jan 28'}
            </strong>
          </p>
        </div>
      </aside>
    </div>
  );
};
