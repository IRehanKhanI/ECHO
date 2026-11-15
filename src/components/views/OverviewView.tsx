import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Compass,
  MapPin,
  RotateCw,
  Sun,
} from 'lucide-react';
import {
  EARTH_CANDIDATE_SITES,
  PLANETARY_TARGETS,
} from '../../data/planetaryData';
import {
  EarthAnalogResult,
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetBody,
  PlanetaryTarget,
  ScientificLayerId,
  ScoredCandidate,
  WorkspaceView,
} from '../../types/terra';
import {
  GlobePin,
  PlanetaryGlobe3D,
} from '../three/PlanetaryGlobe3D';
import { LunarSouthPoleTerrain } from '../three/LunarSouthPoleTerrain';

interface OverviewViewProps {
  activeBody: PlanetBody;
  onChangeBody: (body: PlanetBody) => void;
  activeTarget: PlanetaryTarget;
  onSelectTarget: (targetId: string) => void;
  activeObjective: ObjectiveProfile;
  onSelectObjective: (objectiveId: string) => void;
  activeLayerId: ScientificLayerId;
  onSelectLayer: (layerId: ScientificLayerId) => void;
  seasonalBinIdx: number;
  onChangeSeasonalBin: (idx: number) => void;
  rankedCandidates: ScoredCandidate[];
  selectedSite: EarthCandidateSite;
  onSelectSite: (siteId: string) => void;
  setActiveTab: (tab: WorkspaceView) => void;
  setAnalogResults: (results: EarthAnalogResult[]) => void;
  onOpenReport: () => void;
  onNextStep?: () => void;
}

const LUNAR_PRESETS = [
  {
    id: 'moon_shackleton_rim',
    name: 'Shackleton Rim Massif',
    coord: '89.9°S',
    tag: 'Peak Sunlight',
  },
  {
    id: 'moon_malapert_massif',
    name: 'Malapert Massif',
    coord: '86.0°S',
    tag: 'Earth Line-of-Sight',
  },
  {
    id: 'moon_haworth_psr',
    name: 'Haworth PSR',
    coord: '87.5°S',
    tag: 'Cold Trap (<40 K)',
  },
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  activeBody,
  onChangeBody,
  activeTarget,
  onSelectTarget,
  activeLayerId,
  rankedCandidates,
  selectedSite,
  onSelectSite,
  setActiveTab,
  onNextStep,
}) => {
  const [stageMode, setStageMode] = useState<'orbit' | 'top' | 'relief'>('orbit');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showPins, setShowPins] = useState(true);

  const globePins: GlobePin[] = useMemo(() => {
    if (!showPins) return [];
    if (activeBody === 'earth') {
      return EARTH_CANDIDATE_SITES.map((s) => ({
        id: s.id,
        label: s.name.split(' (')[0],
        lat: s.lat,
        lon: s.lon,
        accent: s.id === selectedSite.id ? 'terracotta' : s.isCatalogKnown ? 'moss' : 'amber',
        active: s.id === selectedSite.id,
        scoreBadge: `${Math.round(rankedCandidates.find((c) => c.site.id === s.id)?.bestMonthScore || 75)}%`,
      }));
    }
    return PLANETARY_TARGETS.filter((t) => t.body === activeBody).map((t) => ({
      id: t.id,
      label: t.name,
      lat: t.lat,
      lon: t.lon,
      accent: t.body === 'moon' ? 'moss' : 'terracotta',
      active: t.id === activeTarget.id,
      scoreBadge: `${t.elevationM >= 0 ? '+' : ''}${t.elevationM.toLocaleString()}m`,
    }));
  }, [activeBody, activeTarget.id, selectedSite.id, rankedCandidates, showPins]);

  const handleStartDiscovery = () => {
    if (onNextStep) {
      onNextStep();
    } else {
      setActiveTab('discovery');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Spacious Hero & 3D Stage Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Sleek Mission Hero Card */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 sm:p-8 space-y-6">
          {/* Header & Badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#184633] text-[#FFFFFF] text-xs font-bold tracking-tight shadow-xs">
                <Compass className="w-3.5 h-3.5 text-[#BAEED1]" />
                Step 1: Mission Brief
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-xs font-semibold text-[#1D4ED8]">
                Artemis IV Readiness
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#1D1B17] tracking-tight leading-tight">
              Artemis IV Terrestrial Readiness
            </h1>

            <p className="text-sm text-[#414943] leading-relaxed">
              Prepare Artemis IV flight hardware for the lunar South Pole (2028). Identify high-fidelity Earth analog sites for cold-soak, rover mobility, and abrasive sulfur regolith testing.
            </p>
          </div>

          {/* Quick Lunar Target Picker */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#696156]">
              Select Reference Target
            </span>
            <div className="grid grid-cols-1 gap-2">
              {LUNAR_PRESETS.map((preset) => {
                const isSelected = activeTarget.id === preset.id && activeBody === 'moon';
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (activeBody !== 'moon') onChangeBody('moon');
                      onSelectTarget(preset.id);
                    }}
                    className={`text-left px-4 py-3 rounded-2xl text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? 'bg-[#184633] text-[#FFFFFF] border-[#184633] font-semibold shadow-xs'
                        : 'bg-[#FAF7F2] text-[#1D1B17] border-[#414943]/10 hover:border-[#184633]/40'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm leading-tight">{preset.name}</div>
                      <div
                        className={`text-[11px] mt-0.5 font-mono ${
                          isSelected ? 'text-[#BAEED1]' : 'text-[#696156]'
                        }`}
                      >
                        {preset.coord} · {preset.tag}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#BAEED1] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Target Stats in Clean Large Numbers */}
          <div className="grid grid-cols-3 gap-3 bg-[#FAF7F2] rounded-2xl p-4 border border-[#414943]/8">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#696156]">
                Coordinates
              </div>
              <div className="font-mono font-bold text-xs sm:text-sm text-[#1D1B17] mt-1 truncate" title={activeTarget.coordinates}>
                {activeTarget.coordinates}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#696156]">
                Elevation
              </div>
              <div className="font-display font-bold text-xs sm:text-sm text-[#184633] mt-1 truncate">
                {activeTarget.elevationM >= 0 ? '+' : ''}{activeTarget.elevationM.toLocaleString()} m
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#696156]">
                Temp Range
              </div>
              <div className="font-mono font-bold text-[11px] sm:text-xs text-[#E06A3B] mt-1 truncate">
                {activeTarget.minTempC}° to {activeTarget.maxTempC >= 0 ? '+' : ''}{activeTarget.maxTempC}°C
              </div>
            </div>
          </div>

          {/* Large Bold CTA Button */}
          <button
            type="button"
            onClick={handleStartDiscovery}
            className="w-full py-4 px-6 rounded-2xl bg-[#184633] hover:bg-[#2A5A44] active:scale-[0.99] text-[#FFFFFF] text-base font-bold transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#184633]/30"
          >
            <span>Discover Earth Analogs</span>
            <ArrowRight className="w-5 h-5 text-[#BAEED1]" />
          </button>
        </div>

        {/* Right Column: Large Crisp 3D Globe / Terrain */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-5 sm:p-6 flex flex-col justify-between min-h-[520px]">
          {/* Header toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#414943]/10 font-mono text-xs font-bold text-[#1D1B17]">
              <span className="w-2 h-2 rounded-full bg-[#E06A3B]" />
              <span>
                {activeBody === 'moon'
                  ? 'Lunar South Pole 3D'
                  : activeBody === 'mars'
                    ? 'Mars Areocentric 3D'
                    : 'Earth Geodetic 3D'}
              </span>
              <span className="text-[#C0C9C1]">|</span>
              <span className="text-[#696156]">
                {activeBody === 'moon' ? '240m LOLA DEM' : '30m SRTM'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Camera Mode Toggles */}
              <div className="flex items-center p-0.5 bg-[#F3EDE5] rounded-full border border-[#414943]/10 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStageMode('orbit')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    stageMode === 'orbit'
                      ? 'bg-[#184633] text-white font-bold shadow-xs'
                      : 'text-[#696156] hover:text-[#1D1B17]'
                  }`}
                >
                  3D Orbit
                </button>
                <button
                  type="button"
                  onClick={() => setStageMode('top')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    stageMode === 'top'
                      ? 'bg-[#184633] text-white font-bold shadow-xs'
                      : 'text-[#696156] hover:text-[#1D1B17]'
                  }`}
                >
                  Top View
                </button>
                <button
                  type="button"
                  onClick={() => setStageMode('relief')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    stageMode === 'relief'
                      ? 'bg-[#184633] text-white font-bold shadow-xs'
                      : 'text-[#696156] hover:text-[#1D1B17]'
                  }`}
                >
                  Relief
                </button>
              </div>

              {/* Pin Toggle */}
              <button
                type="button"
                onClick={() => setShowPins((p) => !p)}
                title="Toggle Target Markers"
                className={`px-3 py-1 rounded-full border border-[#414943]/10 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showPins
                    ? 'bg-[#EAF4EE] text-[#0F422E] border-[#BAEED1]'
                    : 'bg-[#FAF7F2] text-[#696156] hover:text-[#1D1B17]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Pins</span>
              </button>

              {/* Auto Rotate Toggle */}
              <button
                type="button"
                onClick={() => setAutoRotate((r) => !r)}
                title="Toggle Rotation"
                className={`p-1.5 rounded-full border border-[#414943]/10 transition-colors cursor-pointer ${
                  autoRotate
                    ? 'bg-[#184633] text-white'
                    : 'bg-[#FAF7F2] text-[#696156] hover:text-[#1D1B17]'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3D Stage */}
          <div className="relative flex-1 w-full flex items-center justify-center min-h-[420px] rounded-2xl overflow-hidden bg-[#FAF7F2]/50 border border-[#414943]/6">
            {stageMode === 'orbit' ? (
              activeBody === 'moon' ? (
                <div className="h-[460px] w-full bg-transparent flex items-center justify-center overflow-hidden">
                  <LunarSouthPoleTerrain />
                </div>
              ) : (
                <PlanetaryGlobe3D
                  body={activeBody}
                  activeLayerId={activeLayerId}
                  pins={globePins}
                  onPinClick={(pinId) => {
                    if (activeBody === 'earth') {
                      onSelectSite(pinId);
                    } else {
                      onSelectTarget(pinId);
                    }
                  }}
                  autoRotate={autoRotate}
                  layerOpacity={1}
                  focusLat={activeBody === 'earth' ? selectedSite.lat : activeTarget.lat}
                  focusLon={activeBody === 'earth' ? selectedSite.lon : activeTarget.lon}
                  cameraMode="orbit"
                  themeSurface="studio-light"
                />
              )
            ) : (
              /* Cartographic 2D Projection */
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <svg
                  viewBox="0 0 500 500"
                  className="w-full max-w-[420px] max-h-[420px] drop-shadow-sm"
                >
                  <circle cx="250" cy="250" r="230" fill="#FAF6EE" stroke="#E2DACF" strokeWidth="2" />
                  <circle cx="250" cy="250" r="180" fill="none" stroke="#EADFCF" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="250" cy="250" r="120" fill="none" stroke="#E2DACF" strokeWidth="1" />
                  <circle cx="250" cy="250" r="60" fill="none" stroke="#E2DACF" strokeWidth="1" />
                  <line x1="250" y1="20" x2="250" y2="480" stroke="#E5DCCE" strokeWidth="1" />
                  <line x1="20" y1="250" x2="480" y2="250" stroke="#E5DCCE" strokeWidth="1" />
                  <text x="250" y="38" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="0.08em">
                    0° PRIME MERIDIAN • LUNAR SOUTH POLE PROJECTION
                  </text>
                  <circle cx="310" cy="210" r="42" fill="#E8DEC8" stroke="#D3C5AB" strokeWidth="1.5" />
                  <text x="310" y="214" textAnchor="middle" fill="#786B54" fontSize="10" fontFamily="Outfit" fontWeight="600">
                    FAUSTINI
                  </text>
                  <circle cx="210" cy="285" r="46" fill="#E8DEC8" stroke="#D3C5AB" strokeWidth="1.5" />
                  <text x="210" y="289" textAnchor="middle" fill="#786B54" fontSize="10" fontFamily="Outfit" fontWeight="600">
                    SHOEMAKER
                  </text>
                  <circle cx="250" cy="250" r="26" fill="#184633" stroke="#2A5A44" strokeWidth="2.5" opacity="0.85" />
                  <circle cx="250" cy="250" r="12" fill="#0A2419" />
                  <circle cx="250" cy="120" r="32" fill="#EADFCF" stroke="#D3C5AB" strokeWidth="1.2" />
                  <text x="250" y="124" textAnchor="middle" fill="#786B54" fontSize="9" fontFamily="Outfit" fontWeight="600">
                    MALAPERT
                  </text>
                  <circle cx="230" cy="180" r="30" fill="#2A5A44" stroke="#184633" strokeWidth="1.5" opacity="0.75" />
                  <text x="230" y="184" textAnchor="middle" fill="#BAEED1" fontSize="8" fontFamily="Outfit" fontWeight="600">
                    HAWORTH PSR
                  </text>
                </svg>
              </div>
            )}

            {/* Floating HUD info */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <div className="bg-[#FFFFFF]/95 backdrop-blur-sm rounded-full border border-[#414943]/10 shadow-soft-card px-3.5 py-1.5 flex items-center gap-2 text-xs font-mono text-[#1D1B17]">
                <Sun className="w-3.5 h-3.5 text-[#E69A28] shrink-0" />
                <span>
                  Grazing Sun: Subsolar +{activeTarget.solarElevationMinDeg.toFixed(2)}°
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Simple Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 space-y-2 hover:border-[#184633]/30 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h3 className="font-display font-bold text-lg text-[#1D1B17]">
              Target 2028
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
            4 astronauts in orbit, 2 on lunar South Pole surface for ~1 week with Axiom spacesuits.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 space-y-2 hover:border-[#184633]/30 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <h3 className="font-display font-bold text-lg text-[#1D1B17]">
              Earth Analogs
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
            Match high-altitude salars, Antarctic permafrost, and basalt fields.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 space-y-2 hover:border-[#184633]/30 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <h3 className="font-display font-bold text-lg text-[#1D1B17]">
              Hardware Lab
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
            Simulate abrasive sulfur degradation and verify legal permit requirements.
          </p>
        </div>
      </div>
    </div>
  );
};
