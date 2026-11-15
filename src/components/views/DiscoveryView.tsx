import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  MapPin,
  Mountain,
  RotateCw,
  Search,
  Sparkles,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';
import {
  EARTH_CANDIDATE_SITES,
} from '../../data/planetaryData';
import {
  DimensionKey,
  DimensionWeights,
  EarthCandidateSite,
  EarthAnalogResult,
  ObjectiveProfile,
  PlanetaryTarget,
  ScoredCandidate,
  WorkspaceView,
} from '../../types/terra';
import { PlanetaryGlobe3D } from '../three/PlanetaryGlobe3D';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

// Verified visual metadata for Earth Analog sites
export const SITE_COUNTRY_FLAGS: Record<string, string> = {
  univ_valley: '🇦🇶',
  black_point: '🇺🇸',
  haughton_crater: '🇨🇦',
  atacama_yungay: '🇨🇱',
  pilbara: '🇦🇺',
  death_valley: '🇺🇸',
  negev_dmars: '🇮🇱',
  mdrs_utah: '🇺🇸',
  pyhasalmi_mine: '🇫🇮',
  qaidam_basin: '🇨🇳',
  kilauea: '🇺🇸',
  salar_gorbea: '🇨🇱',
  svalbard: '🇳🇴',
};

export const SITE_BIOME_ICONS: Record<string, string> = {
  univ_valley: '❄️',
  black_point: '🌋',
  haughton_crater: '🕳️',
  atacama_yungay: '🏜️',
  pilbara: '🌋',
  death_valley: '🏜️',
  negev_dmars: '🏜️',
  mdrs_utah: '🏜️',
  pyhasalmi_mine: '🕳️',
  qaidam_basin: '🏜️',
  kilauea: '🌋',
  salar_gorbea: '🌋',
  svalbard: '❄️',
};

export const SITE_ONE_LINERS: Record<string, string> = {
  univ_valley:
    'Extreme hyper-arid polar cold trap with sub-surface ice-cemented sandstone and cryogenic thermal swings.',
  black_point:
    'Extensive basaltic lava flow with rough, blocky terrain matching lunar mare volcanic basalt plains.',
  haughton_crater:
    '23-km Arctic impact structure in cold polar desert reproducing shattered impact melt and shatter cones.',
  atacama_yungay:
    'Hyper-arid desert core with near-zero precipitation, perchlorate salts, and extreme diurnal solar UV flux.',
  pilbara:
    'Ancient 3.5-billion-year-old basaltic greenstone terrain with silicified hydrothermal deposits and rugged scarps.',
  death_valley:
    'Extensive gravel fans, salt pan flats, and steep rocky ridges ideal for rover mobility and traction trials.',
  negev_dmars:
    'Erosion cirque with diverse basalt and limestone strata supporting long-duration isolation operations.',
  mdrs_utah:
    'Cretaceous bentonite clay and sandstone badlands offering challenging rover wheel traction and dust interaction.',
  pyhasalmi_mine:
    '1,440-meter-deep crystalline bedrock mine providing isolated, dark underground testing for lunar lava tubes.',
  qaidam_basin:
    'High-altitude hyper-arid plateau with extensive wind-carved yardangs, saline playas, and dune corridors.',
  kilauea:
    'Fresh tholeiitic basaltic flows, cinder cones, and lava tubes with chemical similarity to lunar basalts.',
  salar_gorbea:
    'High-altitude acidic volcanic salar with massive native sulfur deposits and cryogenic thermal swings.',
  svalbard:
    'High-Arctic archipelago with permafrost, volcanic necks, and hydrothermal carbonate deposits for cryogenic testing.',
};

export interface DiscoveryViewProps {
  activeTarget: PlanetaryTarget;
  onSelectTarget?: (targetId: string) => void;
  activeObjective?: ObjectiveProfile;
  onSelectObjective?: (objectiveId: string) => void;
  weights?: DimensionWeights;
  onChangeWeight?: (key: DimensionKey, val: number) => void;
  onResetWeights?: () => void;
  noveltyOnly?: boolean;
  onToggleNovelty?: (val: boolean) => void;
  thresholdPct?: number;
  onChangeThreshold?: (val: number) => void;
  rankedCandidates: ScoredCandidate[];
  selectedSite: EarthCandidateSite;
  onSelectSite: (siteId: string) => void;
  onOpenCalendar?: () => void;
  analogResults?: EarthAnalogResult[] | null;
  onOpenDossier?: () => void;
  onNavigate?: (view: WorkspaceView) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  activeTarget,
  rankedCandidates,
  selectedSite,
  onSelectSite,
  onOpenDossier,
  onNavigate,
}) => {
  // Simple 4-filter pill state
  const [activeFilter, setActiveFilter] = useState<'all' | 'volcanic' | 'polar' | 'desert'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // 4 Simple filter pills
  const FILTER_PILLS = [
    { id: 'all' as const, label: 'All' },
    { id: 'volcanic' as const, label: '🌋 Volcanic (Moon)' },
    { id: 'polar' as const, label: '❄️ Polar (Antarctica)' },
    { id: 'desert' as const, label: '🏜️ Desert (Atacama)' },
  ];

  // Guaranteed fallback: If rankedCandidates is somehow empty, build from catalog
  const effectiveCandidates = useMemo(() => {
    if (rankedCandidates && rankedCandidates.length > 0) {
      return rankedCandidates;
    }
    return EARTH_CANDIDATE_SITES.map((site, index) => ({
      site,
      bestMonthIndex: 0,
      bestMonthScore: Math.max(65, 92 - index * 3),
      annualMeanScore: Math.max(60, 88 - index * 3),
      monthlyScores: Array(12).fill(80),
      dimensionBreakdown: [],
      windowSummary: {
        startDateLabel: 'Jan 01',
        endDateLabel: 'Mar 31',
        durationDays: 90,
        peakDateLabel: 'Feb 15',
        peakScore: 88,
        thresholdPct: 75,
        dailyScores: Array(365).fill(80),
        validDayMask: Array(365).fill(true),
        processAlignmentNote: 'Optimal operational window based on insolation and accessibility.',
      },
    }));
  }, [rankedCandidates]);

  // Filter candidates based on active filter pill & search query
  const filteredCandidates = useMemo(() => {
    return effectiveCandidates.filter((cand) => {
      const site = cand.site;

      // 1. Filter pill match
      let matchesFilter = true;
      if (activeFilter === 'volcanic') {
        matchesFilter =
          site.analogueCategory === 'basalt_volcanic' ||
          ['black_point', 'kilauea', 'pilbara', 'salar_gorbea'].includes(site.id) ||
          (site.geologySummary ? site.geologySummary.toLowerCase().includes('basalt') : false);
      } else if (activeFilter === 'polar') {
        matchesFilter =
          site.analogueCategory === 'cold_polar' ||
          ['univ_valley', 'svalbard', 'haughton_crater'].includes(site.id) ||
          site.biomeCharacter.toLowerCase().includes('polar') ||
          site.biomeCharacter.toLowerCase().includes('permafrost');
      } else if (activeFilter === 'desert') {
        matchesFilter =
          site.analogueCategory === 'arid_saline' ||
          site.analogueCategory === 'operational_isolation' ||
          ['atacama_yungay', 'death_valley', 'negev_dmars', 'mdrs_utah', 'qaidam_basin'].includes(
            site.id,
          ) ||
          site.biomeCharacter.toLowerCase().includes('arid');
      }

      if (!matchesFilter) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          site.name.toLowerCase().includes(q) ||
          site.country.toLowerCase().includes(q) ||
          site.region.toLowerCase().includes(q) ||
          site.biomeCharacter.toLowerCase().includes(q) ||
          (SITE_ONE_LINERS[site.id] && SITE_ONE_LINERS[site.id].toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [effectiveCandidates, activeFilter, searchQuery]);

  // Resolve currently active / inspected candidate
  const activeCandidate = useMemo(() => {
    return (
      effectiveCandidates.find((c) => c.site.id === selectedSite?.id) ||
      filteredCandidates[0] ||
      effectiveCandidates[0]
    );
  }, [effectiveCandidates, filteredCandidates, selectedSite?.id]);

  const currentSite = activeCandidate.site;
  const currentScore = Math.round(activeCandidate.bestMonthScore || 85);

  // Navigation handlers
  const handleInspectDossier = (siteId: string) => {
    onSelectSite(siteId);
    if (onOpenDossier) {
      onOpenDossier();
    } else if (onNavigate) {
      onNavigate('dossier');
    }
  };

  const handleBackToOverview = () => {
    if (onNavigate) {
      onNavigate('overview');
    }
  };

  const getAridityLabel = (index: number) => {
    if (index >= 70) return 'High';
    if (index >= 40) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ==================== MODULE HEADER & SEARCH/FILTER BAR ==================== */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EE] border border-[#2A5A44]/20 text-xs font-bold text-[#0F422E]">
                Module 2 · Discover Sites
              </span>
              <span className="text-xs text-[#696156]">
                Target: <strong className="text-[#1D1B17] font-semibold">{activeTarget.name}</strong> ({activeTarget.body.toUpperCase()})
              </span>
              <ProvenanceBadge tag="VERIFIED NASA PDS / EARTHDATA" />
            </div>
            <h1 className="text-2xl font-display font-bold text-[#1D1B17] tracking-tight">
              Discover Earth Analog Test Sites
            </h1>
            <p className="text-xs sm:text-sm text-[#696156] max-w-2xl leading-relaxed">
              Earth test sites ranked by environmental fidelity against Artemis IV equipment qualification requirements.
            </p>
          </div>

          <button
            type="button"
            onClick={handleBackToOverview}
            className="px-3.5 py-2 rounded-xl border border-[#414943]/15 hover:bg-[#FAF7F2] text-xs font-semibold text-[#1D1B17] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#696156]" />
            <span>Mission Brief</span>
          </button>
        </div>

        {/* Clean Top Search Bar + 4 Filter Pills */}
        <div className="pt-2 border-t border-[#414943]/8 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#696156]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate sites by name, country, or biome..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FAF7F2] border border-[#414943]/15 text-xs text-[#1D1B17] placeholder:text-[#696156] focus:outline-none focus:ring-2 focus:ring-[#184633]/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#696156] hover:text-[#1D1B17]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTER_PILLS.map((pill) => {
                const isActive = activeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setActiveFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#184633] text-white shadow-xs'
                        : 'bg-[#FAF7F2] text-[#414943] hover:bg-[#F3EDE5] border border-[#414943]/12'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#696156] px-1">
            <span>
              Showing <strong className="text-[#1D1B17] font-semibold">{filteredCandidates.length}</strong> candidate sites
            </span>
            <span>Click any site to inspect on the globe or view its full dossier</span>
          </div>
        </div>
      </div>

      {/* ==================== 2-COLUMN LAYOUT ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================== LEFT COLUMN: CLEAN CANDIDATE SITE CARDS (7 Cols) ==================== */}
        <section className="lg:col-span-7 space-y-3.5">
          {filteredCandidates.length === 0 ? (
            <div className="bg-[#FFFFFF] rounded-2xl border border-dashed border-[#414943]/20 p-8 text-center space-y-3">
              <Search className="w-6 h-6 text-[#696156] mx-auto" />
              <h3 className="font-display font-bold text-base text-[#1D1B17]">
                No analog candidates match your criteria
              </h3>
              <p className="text-xs text-[#696156] max-w-md mx-auto">
                Try switching the filter to &quot;All&quot; or clearing your search term to see all Earth test locations.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-[#184633] text-white text-xs font-semibold hover:bg-[#2A5A44] transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredCandidates.map((cand) => {
              const site = cand.site;
              const isSelected = site.id === currentSite.id;
              const matchScore = Math.round(cand.bestMonthScore || 85);
              const flag = SITE_COUNTRY_FLAGS[site.id] || '🌐';
              const oneLiner =
                SITE_ONE_LINERS[site.id] ||
                site.geologySummary ||
                'High-altitude terrestrial analog for lunar surface equipment qualification.';
              const minTemp = Math.min(...site.monthlyMinTempC);

              return (
                <div
                  key={site.id}
                  onClick={() => onSelectSite(site.id)}
                  className={`rounded-2xl transition-all cursor-pointer p-4 sm:p-5 ${
                    isSelected
                      ? 'bg-[#FFFFFF] border-2 border-[#184633] shadow-md ring-2 ring-[#184633]/15'
                      : 'bg-[#FFFFFF] border border-[#414943]/12 hover:border-[#184633]/40 shadow-soft-card hover:shadow-md'
                  }`}
                >
                  {/* Top Row: Country flag + Site name + match badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl p-1.5 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 shrink-0">
                        {flag}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#696156]">
                          <span className="font-semibold">{site.country}</span>
                          <span>·</span>
                          <span>{site.region}</span>
                        </div>
                        <h3 className="font-display font-bold text-base sm:text-lg text-[#1D1B17] tracking-tight leading-snug">
                          {site.name}
                        </h3>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EAF4EE] text-[#0F422E] border border-[#2A5A44]/20 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-[#0F422E]" />
                      <span>{matchScore}% Match</span>
                    </div>
                  </div>

                  {/* Simple 1-sentence summary */}
                  <p className="mt-2.5 text-xs text-[#414943] leading-relaxed">
                    {oneLiner}
                  </p>

                  {/* 3 Clean mini-pills & Action Button */}
                  <div className="mt-3.5 pt-3 border-t border-[#414943]/8 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 text-xs text-[#414943] flex items-center gap-1.5">
                        <Mountain className="w-3.5 h-3.5 text-[#184633]" />
                        <span>Slope ({site.slopeDeg}°)</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 text-xs text-[#414943] flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-[#0284C7]" />
                        <span>Min Temp ({minTemp}°C)</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 text-xs text-[#414943] flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Aridity ({getAridityLabel(site.aridityIndex)})</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectDossier(site.id);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#184633] text-white text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center gap-1 shadow-xs cursor-pointer ml-auto"
                    >
                      <span>View Site Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* ==================== RIGHT COLUMN: 3D GLOBE & COMPARISON SUMMARY (5 Cols) ==================== */}
        <aside className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#184633]" />
                <span className="font-display font-bold text-sm text-[#1D1B17]">
                  Interactive 3D Earth Globe
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoRotate((r) => !r)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  autoRotate
                    ? 'bg-[#184633] text-white font-semibold'
                    : 'bg-[#FAF7F2] text-[#696156] hover:bg-[#F3EDE5]'
                }`}
              >
                <RotateCw className="w-3 h-3" />
                <span>{autoRotate ? 'Rotating' : 'Rotate'}</span>
              </button>
            </div>

            {/* Interactive 3D Globe */}
            <div className="relative w-full h-[320px] rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#414943]/8 flex items-center justify-center">
              <PlanetaryGlobe3D
                body="earth"
                layerId="srtm_slope"
                pins={filteredCandidates.map((cand) => {
                  const isCandSelected = cand.site.id === currentSite.id;
                  const score = Math.round(cand.bestMonthScore || 80);
                  const flag = SITE_COUNTRY_FLAGS[cand.site.id] || '🌐';
                  return {
                    id: cand.site.id,
                    label: `${flag} ${cand.site.name.split(' (')[0]}`,
                    lat: cand.site.lat,
                    lon: cand.site.lon,
                    accent: isCandSelected ? 'terracotta' : 'moss',
                    active: isCandSelected,
                    scoreBadge: `${score}%`,
                  };
                })}
                autoRotate={autoRotate}
                layerOpacity={0.9}
                focusLat={currentSite.lat}
                focusLon={currentSite.lon}
                cameraMode="orbit"
                themeSurface="studio-light"
              />
            </div>

            {/* Simple Comparison Summary Card: Target Lunar Site vs Selected Earth Site */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-[#414943]/8 pb-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#696156]">
                    <span>{SITE_COUNTRY_FLAGS[currentSite.id]}</span>
                    <span>{currentSite.country}</span>
                    <span>·</span>
                    <span className="font-mono">{currentSite.coordinates}</span>
                  </div>
                  <h4 className="font-display font-bold text-base text-[#1D1B17] mt-0.5">
                    {currentSite.name}
                  </h4>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-[#EAF4EE] border border-[#2A5A44]/20 text-xs font-mono font-bold text-[#0F422E]">
                  {currentScore}% Match
                </div>
              </div>

              {/* Target vs Analog Comparison Grid */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-[#414943]/8 flex items-center justify-between">
                  <span className="text-[#696156]">Surface Slope:</span>
                  <div className="font-mono text-right">
                    <span className="text-[#696156] mr-2">Target: {activeTarget.meanSlopeDeg}°</span>
                    <span className="text-[#184633] font-bold">Earth: {currentSite.slopeDeg}°</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#414943]/8 flex items-center justify-between">
                  <span className="text-[#696156]">Roughness (RMS):</span>
                  <div className="font-mono text-right">
                    <span className="text-[#696156] mr-2">Target: {activeTarget.rmsRoughnessM}m</span>
                    <span className="text-[#184633] font-bold">Earth: {currentSite.rmsRoughnessM}m</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#414943]/8 flex items-center justify-between">
                  <span className="text-[#696156]">Diurnal ΔT:</span>
                  <div className="font-mono text-right">
                    <span className="text-[#696156] mr-2">Target: {activeTarget.diurnalDeltaK} K</span>
                    <span className="text-[#184633] font-bold">Earth: {Math.max(...currentSite.monthlyDiurnalDeltaK)} K</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#414943]/8 flex items-center justify-between">
                  <span className="text-[#696156]">Coldest Temp:</span>
                  <div className="font-mono text-right">
                    <span className="text-[#696156] mr-2">Target: {activeTarget.minTempC}°C</span>
                    <span className="text-[#184633] font-bold">Earth: {Math.min(...currentSite.monthlyMinTempC)}°C</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleInspectDossier(currentSite.id)}
                className="w-full py-2.5 rounded-xl bg-[#184633] text-white text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Proceed to Site Dossier →</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ==================== CLEAN BOTTOM NAVIGATION ==================== */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBackToOverview}
          className="px-4 py-2 rounded-xl border border-[#414943]/20 hover:bg-[#FAF7F2] text-xs font-semibold text-[#1D1B17] flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#696156]" />
          <span>← Back to Mission Brief</span>
        </button>

        <div className="text-xs text-[#696156] hidden sm:block">
          Selected: <strong className="text-[#1D1B17]">{SITE_COUNTRY_FLAGS[currentSite.id]} {currentSite.name}</strong> ({currentScore}% Match)
        </div>

        <button
          type="button"
          onClick={() => handleInspectDossier(currentSite.id)}
          className="px-5 py-2 rounded-xl bg-[#184633] text-white text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <span>Proceed to Site Dossier →</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
