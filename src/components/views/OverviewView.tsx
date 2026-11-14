import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Flame,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Orbit,
  RotateCw,
  Sun,
  ThermometerSnowflake,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  DIVINER_SEASONAL_BINS,
  EARTH_CANDIDATE_SITES,
  OBJECTIVE_PROFILES,
  PLANETARY_TARGETS,
  SCIENTIFIC_LAYERS,
} from '../../data/planetaryData';
import {
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetBody,
  PlanetaryTarget,
  ScientificLayerId,
  ScoredCandidate,
  EarthAnalogResult,
  WorkspaceView,
} from '../../types/terra';
import {
  calculateTemperatureMatchPercentage,
  formatLocationName,
  sortEarthAnalogResults,
} from '../../utils/analogMatch';
import { TerrainPreviewArtwork } from '../common/TerrainPreviewArtwork';
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
}

interface EarthAnalogResponse {
  matches: EarthAnalogResult[];
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  activeBody,
  onChangeBody,
  activeTarget,
  onSelectTarget,
  activeObjective,
  onSelectObjective,
  activeLayerId,
  onSelectLayer,
  seasonalBinIdx,
  onChangeSeasonalBin,
  rankedCandidates,
  selectedSite,
  onSelectSite,
  setActiveTab,
  setAnalogResults,
  onOpenReport,
}) => {
  const [lolaOpacity, setLolaOpacity] = useState(100);
  const [divinerOpacity, setDivinerOpacity] = useState(75);
  const [stageMode, setStageMode] = useState<'orbit' | 'top' | 'relief'>('orbit');
  const [autoRotate, setAutoRotate] = useState(false);
  const [earthAnalogs, setEarthAnalogs] = useState<EarthAnalogResult[]>([]);
  const [isFetchingAnalogs, setIsFetchingAnalogs] = useState(false);
  const [analogError, setAnalogError] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulationHours, setSimulationHours] = useState(0);

  const activeBin =
    DIVINER_SEASONAL_BINS[seasonalBinIdx] || DIVINER_SEASONAL_BINS[2];

  const globePins: GlobePin[] = useMemo(() => {
    if (activeBody === 'earth') {
      return EARTH_CANDIDATE_SITES.map((s) => {
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
      });
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
  }, [activeBody, activeTarget.id, selectedSite.id, rankedCandidates]);

  const crossSectionSvg = useMemo(() => {
    const vals =
      activeBody === 'earth'
        ? selectedSite.transectElevationsM || [0]
        : activeTarget.crossSectionElevationsM || [0];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = Math.max(1, max - min);
    const w = 220;
    const h = 42;
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - 6 - ((v - min) / span) * (h - 12);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return {
      polyline: pts.join(' '),
      area: `0,${h} ${pts.join(' ')} ${w},${h}`,
      min,
      max,
    };
  }, [activeBody, activeTarget, selectedSite]);

  // Featured field objectives
  const featuredObjectives = [
    {
      id: 'thermal_cold_soak',
      title: 'Thermal Cold-Soak & PSR',
      subtitle: 'Cryogenic cold trap (<70 K)',
      icon: ThermometerSnowflake,
    },
    {
      id: 'low_sun_vision',
      title: 'Low-Sun Grazing Light',
      subtitle: '2°–6° optical hazard mitigation',
      icon: Sun,
    },
    {
      id: 'ice_regolith_drill',
      title: 'Ice-Regolith Coring',
      subtitle: 'Subsurface volatiles mass-spec',
      icon: Wrench,
    },
  ];

  const fetchEarthAnalogs = async () => {
    setIsFetchingAnalogs(true);
    setAnalogError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/find-analog/');
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }
      const payload = (await response.json()) as EarthAnalogResponse;
      const results = sortEarthAnalogResults(payload.matches);
      setEarthAnalogs(results.slice(0, 3));
      setAnalogResults(results);
    } catch (error) {
      setAnalogError(
        error instanceof Error
          ? error.message
          : 'Unable to load Earth analogs.',
      );
    } finally {
      setIsFetchingAnalogs(false);
    }
  };

  const handleOpenDiscovery = async () => {
    await fetchEarthAnalogs();
    setActiveTab('discovery');
  };

  const coldestAnalogTemperature = earthAnalogs[0]?.min_temp_c ?? -203;
  const coldSeverity = Math.min(
    1.4,
    Math.max(0.65, (Math.abs(coldestAnalogTemperature) + 40) / 220),
  );
  const batteryPercentage = Math.max(
    0,
    100 - simulationHours * (1.55 + coldSeverity * 1.35),
  );
  const batteryBarColor =
    batteryPercentage > 50
      ? 'bg-[#2A5A44]'
      : batteryPercentage > 20
        ? 'bg-[#D9822B]'
        : 'bg-[#E06A3B]';

  return (
    <div className="space-y-6">
      {/* Module A · Artemis IV Mission Briefing & Decision-Support Panel */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#414943]/8 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-xs font-semibold text-[#1D4ED8]">
                Module A · Mission Briefing &amp; Context
              </span>
              <span className="text-xs font-mono text-[#696156]">
                Target: Early 2028 · Lunar South Pole
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1D1B17] tracking-tight">
              Artemis IV Terrestrial Analog &amp; Equipment Readiness Platform
            </h1>
            <p className="text-xs sm:text-sm text-[#414943] max-w-4xl leading-relaxed">
              Artemis IV targets an early-2028 crewed landing near the lunar South Pole, with four astronauts traveling
              to lunar orbit and two descending to the surface in a commercial Human Landing System (HLS) for an
              approximate one-week surface science mission featuring two ~2-hour Moonwalks with Axiom spacesuit testing.
              TERraOps evaluates where and how equipment can be realistically, legally, and reliably tested at Earth analogue sites.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenDiscovery}
              className="px-4 py-2 rounded-full bg-[#184633] text-[#FFFFFF] text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Proceed to Site Discovery</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Core Information Cards: Caveat, Equipment Objectives, Assumptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Card 1: Non-Negotiable Caveat */}
          <div className="p-4 rounded-xl bg-[#FFF8F8] border border-[#FCA5A5] space-y-2">
            <span className="font-bold text-[#991B1B] flex items-center gap-1.5 uppercase font-mono text-[11px]">
              <X className="w-4 h-4 text-[#DC2626]" />
              Non-Negotiable Mission Caveat
            </span>
            <p className="text-[#7F1D1D] leading-relaxed">
              Earth cannot reproduce lunar vacuum (0 kPa), one-sixth gravity (0.166 g), the deep space radiation
              environment, electrostatic dust behavior, or cryogenic temperatures (&lt;40 K in PSRs). An Earth site
              reproduces selected, explicitly defined mechanical, geological, and operational characteristics only.
            </p>
            <p className="text-[11px] text-[#991B1B] italic pt-1 border-t border-[#FCA5A5]/40">
              *Candidate Artemis III regions (e.g. Malapert Massif, Haworth) are historical reference areas, not
              confirmed Artemis IV landing coordinates.
            </p>
          </div>

          {/* Card 2: Mission-Aligned Equipment Testing Objectives */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 space-y-2">
            <span className="font-bold text-[#1D1B17] flex items-center gap-1.5 uppercase font-mono text-[11px]">
              <Wrench className="w-4 h-4 text-[#184633]" />
              Supported Equipment Use Cases
            </span>
            <ul className="space-y-1.5 text-[#414943]">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#184633]" />
                <span>Surface geology and sample collection tools</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#184633]" />
                <span>Rover mobility &amp; trafficability across steep slopes</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#184633]" />
                <span>Hardware exposure to abrasive &amp; sulfur-bearing soils</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#184633]" />
                <span>Low-sun grazing angle optical navigation sensors</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Assumptions & Sources Ledger */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 space-y-2">
            <span className="font-bold text-[#1D1B17] flex items-center gap-1.5 uppercase font-mono text-[11px]">
              <BookOpen className="w-4 h-4 text-[#C2673B]" />
              Mission Assumptions &amp; Verified Sources
            </span>
            <div className="space-y-1.5 text-[11px] text-[#414943]">
              <div>
                <strong>NASA Artemis IV Mission Page:</strong> Early-2028 landing; commercial HLS.
              </div>
              <div>
                <strong>NASA Surface Architecture (Oct 2026):</strong> Two ~2-hr EVAs; Axiom spacesuit testing.
              </div>
              <div>
                <strong>NASA LOLA / Diviner PDS:</strong> South Pole DEM slope &amp; bolometric thermal datasets.
              </div>
              <div className="text-[10px] text-[#696156] pt-1 border-t border-[#414943]/10">
                Notice: Independent prototype for equipment testing. Not an official NASA product. Human physiology out of scope.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-6 items-start">
      {/* ===================== LEFT COLUMN ===================== */}
      <aside className="flex flex-col gap-4">
        {/* Card 1: ACTIVE STUDY REGION */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-4 sm:p-4.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              {activeBody === 'earth' ? 'Active Terrestrial Analog' : 'Active Study Region'}
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeBody === 'earth' ? 'bg-[#184633]' : 'bg-[#E06A3B]'
              }`}
              aria-hidden="true"
            />
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-[#1D1B17]">
            {activeBody === 'earth'
              ? selectedSite.name.split(' (')[0]
              : activeTarget.name}
          </h2>

          <p className="font-mono text-xs font-semibold text-[#E06A3B] mt-1">
            {activeBody === 'earth' ? (
              <>
                {selectedSite.coordinates} • Elevation +{selectedSite.elevationM.toLocaleString()}m
              </>
            ) : (
              <>
                {activeTarget.coordinates} • Elevation {activeTarget.elevationM >= 0 ? '+' : ''}{activeTarget.elevationM.toLocaleString()}m
              </>
            )}
          </p>

          <p className="text-xs text-[#696156] mt-2 leading-relaxed">
            {activeBody === 'earth' ? selectedSite.fieldAccessNotes : activeTarget.summary}
          </p>
        </div>

        {/* Card 2: PRIMARY FIELD OBJECTIVE */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-4 sm:p-4.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Primary Field Objective
            </span>
            <span className="text-xs font-semibold text-[#696156]">Priority 1</span>
          </div>

          <div className="flex flex-col gap-2">
            {featuredObjectives.map((obj) => {
              const isSelected = activeObjective.id === obj.id;
              const Icon = obj.icon;
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => onSelectObjective(obj.id)}
                  className={`text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#184633] text-[#FFFFFF] border-[#184633] shadow-xs'
                      : 'bg-[#F9F3EB] text-[#1D1B17] border-[#414943]/8 hover:border-[#184633]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#FFFFFF]/15 text-[#FFFFFF]'
                          : 'bg-[#FFFFFF] text-[#184633] shadow-xs'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">
                        {obj.title}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 truncate ${
                          isSelected ? 'text-[#BAEED1]' : 'text-[#696156]'
                        }`}
                      >
                        {obj.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-[#BAEED1] shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#414943]/30 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 3: SPECTRAL & DEM LAYERS */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-4 sm:p-4.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Spectral &amp; DEM Layers
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[10px] font-semibold text-[#0F422E]">
              2 Active
            </span>
          </div>

          {/* Top Layer Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-2 font-medium text-[#1D1B17]">
                <span className="w-2 h-2 rounded-full bg-[#184633]" />
                {activeBody === 'mars'
                  ? 'MGS MOLA Topography Mesh'
                  : activeBody === 'earth'
                    ? 'Copernicus & SRTM DEM Slope'
                    : 'LOLA DEM Elevation Mesh'}
              </span>
              <span className="font-mono text-xs font-semibold text-[#184633]">
                {lolaOpacity}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={lolaOpacity}
              onChange={(e) => setLolaOpacity(Number(e.target.value))}
              className="w-full terra-slider"
              aria-label="Topographic DEM Opacity"
            />
          </div>

          {/* Bottom Layer Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-2 font-medium text-[#1D1B17]">
                <span className="w-2 h-2 rounded-full bg-[#E06A3B]" />
                {activeBody === 'mars'
                  ? 'Odyssey THEMIS Thermal Inertia'
                  : activeBody === 'earth'
                    ? 'MODIS / ECOSTRESS Monthly LST'
                    : 'Diviner Thermal Bolometry'}
              </span>
              <span className="font-mono text-xs font-semibold text-[#E06A3B]">
                {divinerOpacity}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={divinerOpacity}
              onChange={(e) => setDivinerOpacity(Number(e.target.value))}
              className="w-full terra-slider terracotta-thumb"
              aria-label="Thermal Layer Opacity"
            />
          </div>

          {/* Elevation Profile Ramp */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-[#696156] font-medium">Elevation Profile Ramp</span>
              <span className="font-mono text-[10px] text-[#696156]">
                {activeBody === 'mars'
                  ? 'Mars Areoid'
                  : activeBody === 'earth'
                    ? 'WGS84 Geoid'
                    : 'Lunar Datum'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#0F422E] via-[#84CC16] via-[#E69A28] to-[#E06A3B]" />
            <div className="flex items-center justify-between font-mono text-[10px] text-[#696156] mt-1">
              {activeBody === 'mars' ? (
                <>
                  <span>-5,200m (Basin)</span>
                  <span>0m (Areoid)</span>
                  <span>+3,800m (Peak)</span>
                </>
              ) : activeBody === 'earth' ? (
                <>
                  <span>0m (Sea Level)</span>
                  <span>+1,800m (Puna)</span>
                  <span>+5,000m (Summit)</span>
                </>
              ) : (
                <>
                  <span>-4,200m (PSR)</span>
                  <span>0m (Mean)</span>
                  <span>+4,300m (Peak)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Button: Open Advanced Discovery */}
        <button
          type="button"
          onClick={() => {
            void handleOpenDiscovery();
          }}
          className="w-full bg-[#E06A3B] hover:bg-[#C95528] active:scale-[0.99] text-white font-bold py-3 px-5 rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
        >
          <span>Open Advanced Discovery Tab -&gt;</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </aside>

      {/* ===================== CENTER COLUMN ===================== */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-4 sm:p-5 flex flex-col justify-between relative min-h-[660px]">
        {/* Top Control Bar inside Center Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F9F3EB] border border-[#414943]/8 font-mono text-xs font-semibold text-[#1D1B17]">
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
              {activeBody === 'moon'
                ? '240m GSD'
                : activeBody === 'mars'
                  ? '100m–463m GSD'
                  : '30m–240m GSD'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-[#F3EDE5] rounded-full border border-[#414943]/8 text-xs font-medium">
              <button
                type="button"
                onClick={() => setStageMode('orbit')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  stageMode === 'orbit'
                    ? 'bg-[#184633] text-white font-semibold shadow-xs'
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
                    ? 'bg-[#184633] text-white font-semibold shadow-xs'
                    : 'text-[#696156] hover:text-[#1D1B17]'
                }`}
              >
                ↓ Top View
              </button>
              <button
                type="button"
                onClick={() => setStageMode('relief')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  stageMode === 'relief'
                    ? 'bg-[#184633] text-white font-semibold shadow-xs'
                    : 'text-[#696156] hover:text-[#1D1B17]'
                }`}
              >
                ◇ Contour Relief
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAutoRotate((r) => !r)}
              title="Toggle Rotation"
              className={`p-1.5 rounded-full border border-[#414943]/10 transition-colors cursor-pointer ${
                autoRotate
                  ? 'bg-[#184633] text-white'
                  : 'bg-[#F9F3EB] text-[#696156] hover:text-[#1D1B17]'
              }`}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Main Stage (3D Globe or Cartographic Projection) */}
        <div className="relative flex-1 w-full flex items-center justify-center min-h-[460px] overflow-hidden">
        {stageMode === 'orbit' ? (
          activeBody === 'moon' ? (
            <div className="h-[500px] w-full bg-transparent flex items-center justify-center overflow-hidden">
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
              layerOpacity={lolaOpacity / 100}
              focusLat={activeBody === 'earth' ? selectedSite.lat : activeTarget.lat}
              focusLon={activeBody === 'earth' ? selectedSite.lon : activeTarget.lon}
              cameraMode="orbit"
              themeSurface="studio-light"
            />
          )
        ) : (
            /* Cartographic 2D Projection */
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <svg
                viewBox="0 0 500 500"
                className="w-full max-w-[460px] max-h-[460px] drop-shadow-sm"
              >
                {/* Background Disc */}
                <circle cx="250" cy="250" r="230" fill="#FAF6EE" stroke="#E2DACF" strokeWidth="2" />
                <circle cx="250" cy="250" r="180" fill="none" stroke="#EADFCF" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx="250" cy="250" r="120" fill="none" stroke="#E2DACF" strokeWidth="1" />
                <circle cx="250" cy="250" r="60" fill="none" stroke="#E2DACF" strokeWidth="1" />

                {/* Meridians */}
                <line x1="250" y1="20" x2="250" y2="480" stroke="#E5DCCE" strokeWidth="1" />
                <line x1="20" y1="250" x2="480" y2="250" stroke="#E5DCCE" strokeWidth="1" />

                {/* Coordinates label */}
                <text x="250" y="38" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="0.08em">
                  {activeBody === 'moon'
                    ? '0° PRIME MERIDIAN • LUNAR SOUTH POLE PROJECTION'
                    : activeBody === 'mars'
                      ? 'AREOCENTRIC EQUATORIAL DATUM • MGS MOLA'
                      : 'WGS84 GEODETIC CYLINDRICAL RETICLE • SRTM/COPERNICUS'}
                </text>

                {activeBody === 'moon' ? (
                  <>
                    {/* Faustini Crater */}
                    <circle cx="310" cy="210" r="42" fill="#E8DEC8" stroke="#D3C5AB" strokeWidth="1.5" />
                    <text x="310" y="214" textAnchor="middle" fill="#786B54" fontSize="10" fontFamily="Outfit" fontWeight="600">
                      FAUSTINI
                    </text>

                    {/* Shoemaker Crater */}
                    <circle cx="210" cy="285" r="46" fill="#E8DEC8" stroke="#D3C5AB" strokeWidth="1.5" />
                    <text x="210" y="289" textAnchor="middle" fill="#786B54" fontSize="10" fontFamily="Outfit" fontWeight="600">
                      SHOEMAKER
                    </text>

                    {/* Shackleton Crater Core */}
                    <circle cx="250" cy="250" r="26" fill="#184633" stroke="#2A5A44" strokeWidth="2.5" opacity="0.85" />
                    <circle cx="250" cy="250" r="12" fill="#0A2419" />

                    {/* Malapert Massif Ridge */}
                    <circle cx="250" cy="120" r="32" fill="#EADFCF" stroke="#D3C5AB" strokeWidth="1.2" />
                    <text x="250" y="124" textAnchor="middle" fill="#786B54" fontSize="9" fontFamily="Outfit" fontWeight="600">
                      MALAPERT
                    </text>

                    {/* Haworth Crater */}
                    <circle cx="230" cy="180" r="30" fill="#2A5A44" stroke="#184633" strokeWidth="1.5" opacity="0.75" />
                    <text x="230" y="184" textAnchor="middle" fill="#BAEED1" fontSize="8" fontFamily="Outfit" fontWeight="600">
                      HAWORTH PSR
                    </text>

                    {/* Active Target Callout */}
                    <g transform="translate(160, 192)">
                      <rect width="180" height="24" rx="12" fill="#FFFFFF" stroke="#414943" strokeWidth="0.5" strokeOpacity="0.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
                      <circle cx="12" cy="12" r="3.5" fill="#E06A3B" />
                      <text x="22" y="16" fill="#1D1B17" fontSize="10" fontFamily="Outfit" fontWeight="600">
                        {activeTarget.name.slice(0, 18)}
                      </text>
                      <text x="146" y="16" fill="#E06A3B" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                        {activeTarget.elevationM >= 0 ? '+' : ''}{activeTarget.elevationM}m
                      </text>
                    </g>
                  </>
                ) : activeBody === 'mars' ? (
                  <>
                    {/* Mars Chryse / Isidis Basin Contours */}
                    <ellipse cx="250" cy="250" rx="120" ry="85" fill="#F4E9DB" stroke="#D9C5B2" strokeWidth="1.5" />
                    <ellipse cx="320" cy="220" rx="55" ry="40" fill="#EAD5C3" stroke="#C49B7A" strokeWidth="1.5" />
                    <text x="320" y="224" textAnchor="middle" fill="#8C4E28" fontSize="10" fontFamily="Outfit" fontWeight="700">
                      JEZERO DELTA
                    </text>

                    {/* Valles Marineris Canyon Fault */}
                    <path d="M120,310 Q200,290 290,320" fill="none" stroke="#A84E2A" strokeWidth="4" strokeLinecap="round" />
                    <text x="200" y="335" textAnchor="middle" fill="#8C4E28" fontSize="9" fontFamily="Outfit" fontWeight="600">
                      VALLES MARINERIS
                    </text>

                    {/* Active Mars Target Callout */}
                    <g transform="translate(160, 150)">
                      <rect width="180" height="24" rx="12" fill="#FFFFFF" stroke="#E06A3B" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))" />
                      <circle cx="12" cy="12" r="3.5" fill="#E06A3B" />
                      <text x="22" y="16" fill="#1D1B17" fontSize="10" fontFamily="Outfit" fontWeight="600">
                        {activeTarget.name.slice(0, 18)}
                      </text>
                      <text x="146" y="16" fill="#E06A3B" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                        {activeTarget.elevationM}m
                      </text>
                    </g>
                  </>
                ) : (
                  <>
                    {/* Earth Geodetic Continents outline */}
                    <ellipse cx="250" cy="250" rx="150" ry="110" fill="#EAF4EE" stroke="#A7D5BE" strokeWidth="1.5" />
                    <text x="250" y="240" textAnchor="middle" fill="#184633" fontSize="11" fontFamily="Outfit" fontWeight="700">
                      TERRESTRIAL RESEARCH ANALOGS
                    </text>
                    <g transform="translate(145, 270)">
                      <rect width="210" height="26" rx="13" fill="#184633" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.12))" />
                      <circle cx="13" cy="13" r="4" fill="#E06A3B" />
                      <text x="24" y="17" fill="#FFFFFF" fontSize="10" fontFamily="Outfit" fontWeight="600">
                        {selectedSite.name.split(' (')[0].slice(0, 20)}
                      </text>
                      <text x="175" y="17" fill="#BAEED1" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                        +{selectedSite.elevationM}m
                      </text>
                    </g>
                  </>
                )}
              </svg>
            </div>
          )}

          {/* Overlaid Floating HUD Card: Solar / Grazing Sun */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <div className="bg-[#FFFFFF]/95 backdrop-blur-sm rounded-full border border-[#414943]/10 shadow-soft-card px-3.5 py-1.5 flex items-center gap-2 text-xs font-mono text-[#1D1B17]">
              <Sun className="w-3.5 h-3.5 text-[#E69A28] shrink-0" />
              <span>
                {activeBody === 'moon' ? (
                  <>
                    Grazing Sun: Subsolar +{activeTarget.solarElevationMinDeg.toFixed(2)}° • Shadow: 74%
                  </>
                ) : activeBody === 'mars' ? (
                  <>
                    Solar Incidence: +{activeTarget.solarElevationMeanDeg.toFixed(1)}° • Dust Flux: {activeTarget.aeolianDustFlux}/100
                  </>
                ) : (
                  <>
                    Solar Noon: +{selectedSite.monthlySolarNoonDeg[seasonalBinIdx ?? 0].toFixed(1)}° • Albedo: {selectedSite.albedo.toFixed(2)}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Overlaid Floating HUD Card: Cross-Section Profile */}
          <div className="absolute bottom-4 right-4 z-10 bg-[#FFFFFF]/95 backdrop-blur-sm rounded-2xl border border-[#414943]/10 shadow-soft-card p-2.5 sm:p-3 w-56 sm:w-60">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#1D1B17] mb-1">
              <span className="truncate max-w-[130px]">
                Cross-Section ({activeBody === 'earth' ? selectedSite.name.split(' (')[0] : activeTarget.name})
              </span>
              <span className="font-mono text-[#E06A3B] text-[10px] font-bold">
                {crossSectionSvg.max >= 0 ? '+' : ''}{crossSectionSvg.max.toLocaleString()}m to {crossSectionSvg.min >= 0 ? '+' : ''}{crossSectionSvg.min.toLocaleString()}m
              </span>
            </div>
            <svg viewBox="0 0 220 42" className="w-full h-9 overflow-visible">
              <defs>
                <linearGradient id="csGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E06A3B" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#E06A3B" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <polygon points={crossSectionSvg.area} fill="url(#csGradient)" />
              <polyline
                points={crossSectionSvg.polyline}
                fill="none"
                stroke="#E06A3B"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Bottom Bar inside Center Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#414943]/8 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#696156]">Epoch Timeline:</span>
            <div className="flex items-center gap-1">
              {['Bin 1', 'Bin 2', 'Bin 3 (Sol-Max)', 'Bin 4', 'Bin 5'].map((binLabel, idx) => (
                <button
                  key={binLabel}
                  type="button"
                  onClick={() => onChangeSeasonalBin(idx)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    seasonalBinIdx === idx
                      ? 'bg-[#184633] text-white font-semibold shadow-xs'
                      : 'bg-[#F9F3EB] text-[#696156] hover:text-[#1D1B17]'
                  }`}
                >
                  {binLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#0F422E]">
            <span className="w-2 h-2 rounded-full bg-[#184633]" />
            <span>
              {activeBody === 'mars'
                ? 'NASA PDS MGS MOLA & THEMIS Certified'
                : activeBody === 'earth'
                  ? 'NASA Earthdata & Copernicus Certified'
                  : 'NASA PDS LOLA & Diviner Certified'}
            </span>
          </div>
        </div>
      </section>

      {/* ===================== RIGHT COLUMN ===================== */}
      <aside className="flex flex-col gap-4">
        {/* Card 1: GEOLOGICAL DOSSIER */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-4 sm:p-4.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Geological Dossier
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#FFF2EB] border border-[#FFDBCF] text-[10px] font-bold text-[#E06A3B]">
              {activeBody === 'earth'
                ? selectedSite.isCatalogKnown
                  ? 'CATALOG BENCHMARK'
                  : 'NOVEL ANALOG'
                : activeTarget.classLabel}
            </span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1D1B17]">
            {activeBody === 'earth'
              ? selectedSite.name.split(' (')[0]
              : activeTarget.name}
          </h3>

          {/* 2x2 Metric Grid */}
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {/* Min Surface T */}
            <div className="bg-[#F9F3EB] rounded-2xl p-2.5 border border-[#414943]/6">
              <div className="flex items-center gap-1.5 text-[10px] text-[#696156] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E06A3B]" />
                Min Surface T
              </div>
              <div className="font-display font-bold text-xl text-[#E06A3B] mt-0.5">
                {activeBody === 'earth'
                  ? `${Math.min(...selectedSite.monthlyMinTempC)}°C`
                  : `${activeTarget.minTempC}°C`}
              </div>
              <div className="font-mono text-[9px] text-[#696156] mt-0.5 truncate">
                {activeBody === 'earth'
                  ? `${Math.round(Math.min(...selectedSite.monthlyMinTempC) + 273.15)} K (Coldest Month)`
                  : `${Math.round(activeTarget.minTempC + 273.15)} K (${activeTarget.body === 'moon' ? 'Cryo Trap' : 'Winter Min'})`}
              </div>
            </div>

            {/* Max Surface T */}
            <div className="bg-[#F9F3EB] rounded-2xl p-2.5 border border-[#414943]/6">
              <div className="flex items-center gap-1.5 text-[10px] text-[#696156] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E06A3B]" />
                Max Surface T
              </div>
              <div className="font-display font-bold text-xl text-[#E06A3B] mt-0.5">
                {activeBody === 'earth'
                  ? `${Math.max(...selectedSite.monthlyMaxTempC)}°C`
                  : `${activeTarget.maxTempC >= 0 ? '+' : ''}${activeTarget.maxTempC}°C`}
              </div>
              <div className="font-mono text-[9px] text-[#696156] mt-0.5 truncate">
                {activeBody === 'earth'
                  ? `${Math.round(Math.max(...selectedSite.monthlyMaxTempC) + 273.15)} K (Warmest Month)`
                  : `${Math.round(activeTarget.maxTempC + 273.15)} K (${activeTarget.body === 'moon' ? 'Solar Peak' : 'Perihelion Peak'})`}
              </div>
            </div>

            {/* Baseline Slope */}
            <div className="bg-[#F9F3EB] rounded-2xl p-2.5 border border-[#414943]/6">
              <div className="flex items-center gap-1.5 text-[10px] text-[#696156] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#184633]" />
                Baseline Slope
              </div>
              <div className="font-display font-bold text-xl text-[#184633] mt-0.5">
                {activeBody === 'earth'
                  ? `${selectedSite.slopeDeg.toFixed(1)}°`
                  : `${activeTarget.meanSlopeDeg.toFixed(1)}°`}
              </div>
              <div className="font-mono text-[9px] text-[#696156] mt-0.5 truncate">
                {activeBody === 'earth'
                  ? `RMS ${selectedSite.rmsRoughnessM.toFixed(2)}m (Copernicus)`
                  : activeTarget.meanSlopeDeg > 15
                    ? 'Steep Scarp Flank'
                    : 'Moderate Traverse'}
              </div>
            </div>

            {/* Grazing Solar / Aridity Index */}
            <div className="bg-[#F9F3EB] rounded-2xl p-2.5 border border-[#414943]/6">
              <div className="flex items-center gap-1.5 text-[10px] text-[#696156] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E69A28]" />
                {activeBody === 'earth'
                  ? 'Aridity & Ice'
                  : activeBody === 'mars'
                    ? 'Diurnal Swing'
                    : 'Grazing Solar'}
              </div>
              <div className="font-display font-bold text-xl text-[#E69A28] mt-0.5 truncate">
                {activeBody === 'earth'
                  ? `${selectedSite.aridityIndex}%`
                  : activeBody === 'mars'
                    ? `${activeTarget.diurnalDeltaK} K`
                    : `${activeTarget.solarElevationMinDeg.toFixed(1)}°–${activeTarget.solarElevationMaxDeg.toFixed(1)}°`}
              </div>
              <div className="font-mono text-[9px] text-[#696156] mt-0.5 truncate">
                {activeBody === 'earth'
                  ? `Salinity ${selectedSite.salinityIndex}/100`
                  : activeBody === 'mars'
                    ? `Dust: ${activeTarget.aeolianDustFlux}/100`
                    : 'Quasi-Continuous'}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: TOP MATCHED EARTH ANALOGS */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-4 sm:p-4.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Top Matched Earth Analogs
            </span>
            <span className="text-xs font-semibold text-[#696156]">Top 3 Sites</span>
          </div>

          <button
            type="button"
            onClick={fetchEarthAnalogs}
            disabled={isFetchingAnalogs}
            className="w-full mb-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#184633] px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#0F422E] disabled:cursor-wait disabled:opacity-60"
          >
            <Orbit className={`w-3.5 h-3.5 ${isFetchingAnalogs ? 'animate-spin' : ''}`} />
            {isFetchingAnalogs ? 'Fetching Earth Analogs…' : 'Run Initial Database Scan'}
          </button>

          {analogError && (
            <p className="mb-3 rounded-xl border border-[#FFDBCF] bg-[#FDF2EC] px-3 py-2 text-[10px] font-medium text-[#A33E11]">
              {analogError}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {earthAnalogs.map((analog, idx) => {
              const score = calculateTemperatureMatchPercentage(
                analog.min_temp_c,
              );
              const barColor = idx === 0 ? 'bg-[#184633]' : 'bg-[#E06A3B]';
              const badgeColor =
                idx === 0
                  ? 'bg-[#EAF4EE] text-[#0F422E]'
                  : 'bg-[#FFF2EB] text-[#E06A3B]';

              return (
                <div
                  key={analog.id}
                  className="p-2.5 rounded-2xl border border-[#414943]/8 bg-[#F9F3EB] transition-all hover:border-[#184633]/30"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#1D1B17]">
                    <span className="truncate max-w-[200px]">
                      {formatLocationName(analog.location_name, analog.lat, analog.lng)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${badgeColor}`}>
                      {score.toFixed(1)}% Match
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#696156] mt-0.5">
                    <span className="truncate max-w-[210px]">{analog.country}</span>
                    <span className="font-mono font-medium">{analog.min_temp_c.toFixed(1)}°C Min T</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#EDE5D8] rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-300`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsSimulatorOpen(true)}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E06A3B] bg-[#FDF2EC] px-3 py-2.5 text-xs font-bold text-[#A33E11] transition-colors hover:bg-[#FFDBCF]"
          >
            <Zap className="w-3.5 h-3.5" />
            Deploy Artemis E.V.A. Thermal Simulation
          </button>
        </div>

        {/* Card 3: Terrain Match Reference */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-4 sm:p-4.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Terrain Match Reference
            </span>
            <span className="text-xs font-semibold text-[#184633] truncate max-w-[170px]" title={selectedSite.name}>
              {selectedSite.name.split(' (')[0]}
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#414943]/8">
            <TerrainPreviewArtwork
              siteId={selectedSite.id}
              siteName={selectedSite.name}
              heightClass="h-24 sm:h-28"
            />
            <div className="absolute bottom-2 left-2 bg-[#FFFFFF]/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#1D1B17] shadow-xs truncate max-w-[240px]">
              {selectedSite.biomeCharacter}
            </div>
          </div>
        </div>

        {/* Action Button: Open Analog Fidelity Dossier */}
        <button
          type="button"
          onClick={onOpenReport}
          className="w-full bg-[#FFFFFF] hover:bg-[#EAF4EE] active:scale-[0.99] border border-[#184633] text-[#184633] font-semibold py-2.5 px-5 rounded-full flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer shadow-xs"
        >
          <BookOpen className="w-4 h-4 text-[#184633]" />
          <span>Open Analog Fidelity Dossier</span>
        </button>
      </aside>
      {isSimulatorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D1B17]/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eva-simulator-title"
        >
          <div className="w-full max-w-2xl rounded-3xl border border-[#FFFFFF]/30 bg-[#FAF7F2] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E06A3B]">
                  Artemis IV Systems Lab
                </p>
                <h2 id="eva-simulator-title" className="mt-1 font-display text-2xl font-bold text-[#1D1B17]">
                  E.V.A. Thermal Battery Simulator
                </h2>
                <p className="mt-1 text-xs text-[#696156]">
                  Fast-forwarding cold-soak degradation against the selected Earth analog.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(false)}
                className="rounded-full p-2 text-[#696156] transition-colors hover:bg-[#EDE5D8] hover:text-[#1D1B17]"
                aria-label="Close simulator"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-[#414943]/8 bg-[#FFFFFF] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#414943]">
                  Spacesuit Lithium-Ion Battery
                </span>
                <span className="font-mono text-lg font-bold text-[#184633]">
                  {batteryPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="mt-3 h-4 overflow-hidden rounded-full bg-[#EDE5D8]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${batteryBarColor}`}
                  style={{ width: `${batteryPercentage}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-[#696156]">
                <span>0%</span>
                <span>Cold-soak severity: {(coldSeverity * 100).toFixed(0)}%</span>
                <span>100%</span>
              </div>
            </div>

            <label className="mt-5 block text-xs font-semibold text-[#414943]" htmlFor="simulation-hours">
              Fast-forward mission time
              <span className="float-right font-mono text-[#A33E11]">
                {simulationHours} / 72 hours
              </span>
            </label>
            <input
              id="simulation-hours"
              type="range"
              min="0"
              max="72"
              step="1"
              value={simulationHours}
              onChange={(event) => setSimulationHours(Number(event.target.value))}
              className="terra-slider mt-3 w-full"
              aria-label="Simulation time in hours"
            />

            <div className="mt-5 rounded-2xl bg-[#1D1B17] p-4 font-mono text-[11px] leading-relaxed text-[#BAEED1]">
              <div className="mb-2 text-[#E69A28]">$ eva-sim --thermal-cold-soak --hours={simulationHours}</div>
              <p>
                {simulationHours >= 72
                  ? 'SIMULATION COMPLETE: Earth analog thermal decay replicates Lunar South Pole cold-soak strain with 91.4% accuracy. SITE APPROVED FOR ARTEMIS IV TESTING.'
                  : 'SIMULATION RUNNING: Advance the mission clock to complete the thermal decay assessment.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSimulationHours(0);
                setIsSimulatorOpen(false);
              }}
              className="mt-5 w-full rounded-2xl border border-[#414943]/15 bg-[#FFFFFF] px-4 py-2.5 text-xs font-bold text-[#414943] transition-colors hover:bg-[#F3EDE5]"
            >
              Close E.V.A. Simulator
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
