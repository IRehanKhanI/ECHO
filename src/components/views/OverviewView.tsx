import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Compass,
  MapPin,
  RotateCw,
  Sun,
  Mountain,
  Thermometer,
  Crosshair,
} from 'lucide-react';
import {
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

export interface ArtemisIVPreset {
  id: string;
  name: string;
  coord: string;
  lat: number;
  lon: number;
  tag: string;
  badge: string;
  feature: string;
}

export const ARTEMIS_IV_TARGETS: ArtemisIVPreset[] = [
  {
    id: 'moon_shackleton_rim',
    name: 'Shackleton Rim Massif',
    coord: '89.90°S, 0.00°E',
    lat: -89.9,
    lon: 0.0,
    tag: 'Primary Landing Candidate',
    badge: 'Peak Sunlight',
    feature: 'High-ridge perimeter bordered by cryogenic volatile traps with persistent grazing sunlight peaks.',
  },
  {
    id: 'moon_malapert_massif',
    name: 'Malapert Massif',
    coord: '85.99°S, 2.90°W',
    lat: -85.99,
    lon: -2.9,
    tag: 'Earth Line-of-Sight',
    badge: 'Class A-2 Massif',
    feature: 'Elevated south polar mountain massif with continuous Earth telemetry line-of-sight and boulder-strewn flanks.',
  },
  {
    id: 'moon_haworth_crater',
    name: 'Haworth Crater PSR',
    coord: '87.40°S, 5.10°W',
    lat: -87.4,
    lon: -5.1,
    tag: 'Cold Trap (<40 K)',
    badge: 'Volatile Ice Basin',
    feature: 'Deep permanently shadowed cryogenic cold-trap floor recording ultra-low temperatures (<40 K / -246°C) and water ice.',
  },
  {
    id: 'moon_connecting_ridge',
    name: 'Connecting Ridge',
    coord: '89.44°S, 137.31°W',
    lat: -89.44,
    lon: -137.31,
    tag: 'Trans-Polar Saddle',
    badge: 'Low Rover Slope',
    feature: 'Narrow saddle connecting Shackleton to de Gerlache featuring dual illumination windows and low traversal slopes.',
  },
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  activeBody,
  onChangeBody,
  activeTarget,
  onSelectTarget,
  activeLayerId,
  setActiveTab,
  onNextStep,
}) => {
  const [stageMode, setStageMode] = useState<'orbit' | 'top' | 'relief'>('orbit');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showPins, setShowPins] = useState(true);

  // 4 Prominent Artemis IV Location Pointers on the 3D Moon
  const globePins: GlobePin[] = useMemo(() => {
    if (!showPins) return [];
    return ARTEMIS_IV_TARGETS.map((target) => {
      const pdsTarget = PLANETARY_TARGETS.find((p) => p.id === target.id);
      const isSelected = activeTarget.id === target.id;
      return {
        id: target.id,
        label: target.name,
        sublabel: 'Artemis IV Candidate',
        lat: target.lat,
        lon: target.lon,
        accent: isSelected ? 'terracotta' : 'moss',
        active: isSelected,
        scoreBadge: pdsTarget
          ? `${pdsTarget.elevationM >= 0 ? '+' : ''}${pdsTarget.elevationM.toLocaleString()}m`
          : undefined,
      };
    });
  }, [activeTarget.id, showPins]);

  const handleSelectTarget = (targetId: string) => {
    if (activeBody !== 'moon') {
      onChangeBody('moon');
    }
    onSelectTarget(targetId);
  };

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
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 sm:p-7 space-y-5">
          {/* Header & Badges */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#184633] text-[#FFFFFF] text-xs font-bold tracking-tight shadow-xs">
                <Compass className="w-3.5 h-3.5 text-[#BAEED1]" />
                Step 1: Mission Brief
              </span>

            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#1D1B17] tracking-tight leading-tight">
              ECHO Artemis IV Lunar Readiness
            </h1>

            <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
              Targeting the Lunar South Pole (2028). Select a reference landing candidate below to focus the 3D Moon and discover verified Earth terrestrial analogs for cryogenic cold-soak, rover mobility, and abrasive regolith exposure.
            </p>
          </div>

          {/* Dynamic Target Switcher: Select Preferred Target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#696156] flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-[#184633]" />
                Select Preferred Target
              </span>

            </div>

            <div className="grid grid-cols-1 gap-2">
              {ARTEMIS_IV_TARGETS.map((target) => {
                const isSelected = activeTarget.id === target.id;
                return (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => handleSelectTarget(target.id)}
                    className={`text-left px-3.5 py-2.5 rounded-2xl text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? 'bg-[#184633] text-[#FFFFFF] border-[#184633] font-semibold shadow-md ring-2 ring-[#BAEED1]/40'
                        : 'bg-[#FAF7F2] text-[#1D1B17] border-[#414943]/10 hover:border-[#184633]/40 hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm leading-tight truncate">
                          {target.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full font-semibold shrink-0 ${
                            isSelected
                              ? 'bg-[#BAEED1] text-[#0F422E]'
                              : 'bg-[#414943]/10 text-[#414943]'
                          }`}
                        >
                          {target.badge}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 font-mono truncate ${
                          isSelected ? 'text-[#BAEED1]' : 'text-[#696156]'
                        }`}
                      >
                        {target.coord} · {target.tag}
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="w-3 h-3 rounded-full bg-[#BAEED1] shrink-0 ring-4 ring-[#BAEED1]/20 animate-pulse" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full border border-[#414943]/20 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target NASA PDS Verified Telemetry Card */}
          <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#414943]/10 space-y-3">
            <div className="flex items-center justify-between border-b border-[#414943]/8 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#184633] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#184633]" />
                NASA PDS Verified Telemetry · {activeTarget.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/90 rounded-xl p-2.5 border border-[#414943]/8">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#696156] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#184633]" />
                  Coordinates
                </div>
                <div className="font-mono font-bold text-xs sm:text-sm text-[#1D1B17] mt-1 whitespace-normal break-words" title={activeTarget.coordinates}>
                  {activeTarget.coordinates}
                </div>
                <div className="text-[10px] text-[#696156] font-mono mt-0.5">
                  South Pole Grid
                </div>
              </div>

              <div className="bg-white/90 rounded-xl p-2.5 border border-[#414943]/8">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#696156] flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-[#184633]" />
                  Elevation
                </div>
                <div className="font-display font-bold text-xs sm:text-sm text-[#184633] mt-1 whitespace-normal">
                  {activeTarget.elevationM >= 0 ? '+' : ''}{activeTarget.elevationM.toLocaleString()} m
                </div>
                <div className="text-[10px] text-[#696156] font-mono mt-0.5">
                  Lunar Datum
                </div>
              </div>

              <div className="bg-white/90 rounded-xl p-2.5 border border-[#414943]/8">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#696156] flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-[#E06A3B]" />
                  Temp Range
                </div>
                <div className="font-mono font-bold text-xs sm:text-sm text-[#E06A3B] mt-1 whitespace-normal">
                  {activeTarget.minTempC}° to {activeTarget.maxTempC >= 0 ? '+' : ''}{activeTarget.maxTempC}°C
                </div>
                <div className="text-[10px] text-[#696156] font-mono mt-0.5">
                  Mean: {activeTarget.meanTempC}°C
                </div>
              </div>

              <div className="bg-white/90 rounded-xl p-2.5 border border-[#414943]/8">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#696156] flex items-center gap-1">
                  <Sun className="w-3 h-3 text-[#E69A28]" />
                  Slope & Sun
                </div>
                <div className="font-mono font-bold text-xs sm:text-sm text-[#1D1B17] mt-1 whitespace-normal">
                  {activeTarget.meanSlopeDeg}° slope
                </div>
                <div className="text-[10px] text-[#E69A28] font-mono font-semibold mt-0.5 whitespace-normal">
                  Sun: {activeTarget.solarElevationMinDeg.toFixed(1)}°–{activeTarget.solarElevationMaxDeg.toFixed(1)}°
                </div>
              </div>
            </div>

            <p className="text-xs text-[#414943] leading-relaxed pt-1 border-t border-[#414943]/8">
              {activeTarget.summary}
            </p>
          </div>

          {/* Large Bold CTA Button to Module 2 */}
          <button
            type="button"
            onClick={handleStartDiscovery}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#184633] hover:bg-[#2A5A44] active:scale-[0.99] text-[#FFFFFF] text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#184633]/30"
          >
            <span>Discover Earth Analogs →</span>
            <ArrowRight className="w-5 h-5 text-[#BAEED1]" />
          </button>
        </div>

        {/* Right Column: Large Crisp 3D Moon Stage with Artemis IV Pointers */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-5 sm:p-6 flex flex-col justify-between min-h-[520px]">
          {/* Header toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#414943]/10 font-mono text-xs font-bold text-[#1D1B17]">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span>Lunar South Pole 3D</span>
              <span className="text-[#C0C9C1]">|</span>
              <span className="text-[#696156]">240m LOLA DEM</span>
              <span className="text-[#C0C9C1]">|</span>
              <span className="text-[#1D4ED8] font-semibold">Artemis IV Reference</span>
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
                  title="3D Oblique Orbit View"
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
                  title="Nadir Polar View"
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
                  title="Low-Angle Relief View"
                >
                  Relief
                </button>
              </div>

              {/* Pin Toggle */}
              <button
                type="button"
                onClick={() => setShowPins((p) => !p)}
                title="Toggle Artemis IV Markers"
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
                title="Toggle Slow Orbit Rotation"
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

          {/* 3D Moon Stage with Dynamic Rotation and Artemis IV Location Pointers */}
          <div className="relative flex-1 w-full flex items-center justify-center min-h-[440px] rounded-2xl overflow-hidden bg-[#FAF7F2]/50 border border-[#414943]/6">
            <PlanetaryGlobe3D
              body="moon"
              activeLayerId={activeLayerId}
              pins={globePins}
              onPinClick={handleSelectTarget}
              autoRotate={autoRotate}
              showPins={showPins}
              layerOpacity={0.85}
              focusLat={activeTarget.lat}
              focusLon={activeTarget.lon}
              cameraMode={stageMode === 'top' ? 'polar' : stageMode === 'relief' ? 'relief' : 'orbit'}
              themeSurface="studio-light"
            />

            {/* Hint overlay on bottom right */}
            <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
              <span className="bg-[#FFFFFF]/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-[#414943]/10 text-[10px] font-mono text-[#696156]">
                Click any pin or candidate to rotate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 space-y-2 hover:border-[#184633]/30 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h3 className="font-display font-bold text-lg text-[#1D1B17]">
              Artemis IV South Pole (2028)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
            4 astronauts in orbit, 2 on the lunar South Pole surface for ~1 week with Axiom lunar spacesuits, exploring permanently shadowed volatile cold-traps.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 space-y-2 hover:border-[#184633]/30 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <h3 className="font-display font-bold text-lg text-[#1D1B17]">
              Terrestrial Analogs
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
            High-altitude salars, Antarctic Dry Valleys permafrost, and volcanic basalt fields matched via 8-dimensional multi-sensor NASA PDS similarity algorithms.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 space-y-2 hover:border-[#184633]/30 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <h3 className="font-display font-bold text-lg text-[#1D1B17]">
              ECHO Hardware Testing Lab
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
            Simulate abrasive sulfur regolith degradation on 3D rover CAD models, plan 2.5D traverses, and verify real-world land access permits.
          </p>
        </div>
      </div>
    </div>
  );
};
