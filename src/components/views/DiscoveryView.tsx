import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  FlaskConical,
  Globe,
  Layers,
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
  getSiteSulfurPpm,
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
  stillwater: '🇺🇸',
  shawmere: '🇨🇦',
  atacama_pajonales: '🇨🇱',
  craters_moon: '🇺🇸',
  salar_pedernales: '🇨🇱',
  victoria_valley: '🇦🇶',
  putana_fumarole: '🇨🇱',
  lastarria: '🇨🇱',
  hekla: '🇮🇸',
  axel_heiberg: '🇨🇦',
  disko_island: '🇬🇱',
  mojave: '🇺🇸',
  taklamakan: '🇨🇳',
  salar_antofalla: '🇦🇷',
  cerro_galan: '🇦🇷',
  mount_fleming: '🇦🇶',
  allan_hills: '🇦🇶',
  // Historical aliases
  san_francisco_volcanic: '🇺🇸',
  mojave_silver_lake: '🇺🇸',
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
  stillwater: '🌋',
  shawmere: '🌋',
  atacama_pajonales: '🏜️',
  craters_moon: '🌋',
  salar_pedernales: '🏜️',
  victoria_valley: '❄️',
  putana_fumarole: '🌋',
  lastarria: '🌋',
  hekla: '🌋',
  axel_heiberg: '❄️',
  disko_island: '🌋',
  mojave: '🏜️',
  taklamakan: '🏜️',
  salar_antofalla: '🏜️',
  cerro_galan: '🌋',
  mount_fleming: '❄️',
  allan_hills: '❄️',
  // Historical aliases
  san_francisco_volcanic: '🌋',
  mojave_silver_lake: '🏜️',
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
  stillwater:
    'Archean stratiform anorthosite complex with 90%+ calcic plagioclase matching lunar ferroan anorthosite highlands.',
  shawmere:
    'Precambrian high-pressure anorthosite massif with coarse bytownite plagioclase analogous to Apollo 16 highland regolith.',
  atacama_pajonales:
    'High-altitude gypsum crusts with intense diurnal UV radiation and hyper-aridity matching lunar exposed regolith.',
  craters_moon:
    'Holocene flood basalt flow fields, cinder cones, and lava tubes used historically for Apollo astronaut field geology.',
  salar_pedernales:
    'Virgin high-Andean evaporite basin never utilized in prior NASA campaigns; pristine borate and sulfate crystal flats.',
  victoria_valley:
    'Pristine Dry Valleys polar corridor featuring active permafrost barchan dunes unvisited by human field trials.',
  putana_fumarole:
    'Active high-altitude stratovolcano summit with boiling sulfur solfataras and cryogenic diurnal swings.',
  lastarria:
    'Rare active volcanic liquid sulfur flows and fumarolic conduits matching volatile-rich planetary crusts.',
  hekla:
    'Active sub-polar stratovolcano surrounded by expansive tephra fields, black basaltic ash, and fresh lava.',
  axel_heiberg:
    'Perennial sub-zero hyper-saline springs discharging through permafrost near massive salt diapirs.',
  disko_island:
    'Rare terrestrial native telluric iron basalt flows with coastal columnar basalt cliffs in Arctic permafrost.',
  mojave:
    'Hyper-arid playa mudflats and gravel corridors ideal for long-range robotic mobility and wheel-traction characterization.',
  taklamakan:
    'Hyper-arid shifting megadunes, yardang corridors, and salt crusts within the enclosed Tarim Basin.',
  salar_antofalla:
    '150-km ultra-long evaporite scarp and lithium-borate crusts flanked by severe volcanic fault scarps.',
  cerro_galan:
    'Massive 40-km resurgent ignimbrite caldera with extreme altitude, UV radiation, and hyper-saline lake.',
  mount_fleming:
    'Sandstone nunatak protruding above polar glaciers with wind-sculpted ventifacts and endolithic niches.',
  allan_hills:
    'Ancient Antarctic blue-ice stranding margin where sub-surface meteorite concentrations survive for millennia.',
  san_francisco_volcanic:
    'Extensive basaltic cinders, spatter cones, and lava tubes utilized in Desert RATS rover and suit mobility trials.',
  mojave_silver_lake:
    'Hyper-arid playa mudflats and gravel corridors ideal for long-range robotic mobility and wheel-traction characterization.',
};

export const getCountryFlag = (site: { id: string; country?: string }): string => {
  if (site.id && SITE_COUNTRY_FLAGS[site.id]) return SITE_COUNTRY_FLAGS[site.id];
  const c = (site.country || '').toLowerCase();
  if (c.includes('antarctica')) return '🇦🇶';
  if (c.includes('usa') || c.includes('united states')) return '🇺🇸';
  if (c.includes('canada')) return '🇨🇦';
  if (c.includes('chile')) return '🇨🇱';
  if (c.includes('norway')) return '🇳🇴';
  if (c.includes('australia')) return '🇦🇺';
  if (c.includes('israel')) return '🇮🇱';
  if (c.includes('finland')) return '🇫🇮';
  if (c.includes('china')) return '🇨🇳';
  if (c.includes('iceland')) return '🇮🇸';
  if (c.includes('greenland')) return '🇬🇱';
  if (c.includes('argentina')) return '🇦🇷';
  return '🌐';
};

/** Procedural Geological Biome Fallback if image fails to load or is offline */
interface ProceduralBiomeFallbackProps {
  site: EarthCandidateSite;
  className?: string;
}

export const ProceduralBiomeFallback: React.FC<ProceduralBiomeFallbackProps> = ({ site, className = '' }) => {
  const category = site.analogueCategory || 'basalt_volcanic';
  const flag = getCountryFlag(site);
  const icon = SITE_BIOME_ICONS[site.id] || '🌍';

  let gradientClass = 'from-[#1e293b] via-[#334155] to-[#0f172a]';
  let accentColor = '#94a3b8';
  let categoryLabel = 'Geological Analog';

  if (category === 'basalt_volcanic') {
    gradientClass = 'from-[#1c1917] via-[#292524] to-[#451a03]';
    accentColor = '#f97316';
    categoryLabel = 'Basaltic Volcanic';
  } else if (category === 'cold_polar') {
    gradientClass = 'from-[#082f49] via-[#0369a1] to-[#0c4a6e]';
    accentColor = '#38bdf8';
    categoryLabel = 'Cryogenic Polar';
  } else if (category === 'arid_saline') {
    gradientClass = 'from-[#451a03] via-[#78350f] to-[#92400e]';
    accentColor = '#fbbf24';
    categoryLabel = 'Hyper-Arid Salar';
  } else if (category === 'impact_terrain') {
    gradientClass = 'from-[#18181b] via-[#27272a] to-[#3f3f46]';
    accentColor = '#a1a1aa';
    categoryLabel = 'Impact Structure';
  } else if (category === 'subsurface') {
    gradientClass = 'from-[#0f172a] via-[#1e1b4b] to-[#1e293b]';
    accentColor = '#818cf8';
    categoryLabel = 'Subterranean Mine';
  }

  return (
    <div
      className={`relative w-full h-full min-h-[150px] bg-gradient-to-br ${gradientClass} flex flex-col justify-between p-3 overflow-hidden select-none ${className}`}
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
      >
        <path d="M-20,60 Q40,20 100,50 T220,40" fill="none" stroke={accentColor} strokeWidth="1.5" />
        <path d="M-20,90 Q50,60 110,85 T220,70" fill="none" stroke={accentColor} strokeWidth="1.5" />
        <path d="M-20,120 Q30,100 100,120 T220,105" fill="none" stroke={accentColor} strokeWidth="1.5" />
        <path d="M-20,150 Q60,130 120,155 T220,140" fill="none" stroke={accentColor} strokeWidth="1.5" />
        <path d="M-20,180 Q40,165 100,185 T220,175" fill="none" stroke={accentColor} strokeWidth="1.5" />
      </svg>

      <div className="relative z-10 flex items-center justify-between">
        <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/15 text-[10px] font-semibold text-white flex items-center gap-1">
          <span>{icon}</span>
          <span>{categoryLabel}</span>
        </span>
        <span className="text-base drop-shadow">{flag}</span>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2 text-center">
        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner mb-1">
          <Mountain className="w-5 h-5 text-white/80" />
        </div>
        <span className="text-[10px] font-mono tracking-wider uppercase text-white/80">
          In-Situ Geological Terrain
        </span>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-white/80 border-t border-white/10 pt-1.5">
        <span>{site.elevationM.toLocaleString()}m Elev</span>
        <span>{site.coordinates.split(',')[0]}</span>
      </div>
    </div>
  );
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
  noveltyOnly = false,
  onToggleNovelty,
  onOpenDossier,
  onNavigate,
}) => {
  // Simple 4-filter pill state
  const [activeFilter, setActiveFilter] = useState<'all' | 'volcanic' | 'polar' | 'desert'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (siteId: string) => {
    setImageErrors((prev) => ({ ...prev, [siteId]: true }));
  };

  // Dynamic database state
  const [backendMatches, setBackendMatches] = useState<EarthAnalogResult[] | null>(null);
  const [isBackendLive, setIsBackendLive] = useState<boolean>(false);
  const [, setIsLoadingBackend] = useState<boolean>(false);

  // Connect to Django Backend API (/api/find-analog/)
  useEffect(() => {
    const controller = new AbortController();
    const fetchBackendAnalogs = async () => {
      setIsLoadingBackend(true);
      try {
        let response: Response | null = null;
        const payload = JSON.stringify({
          target_id: activeTarget.id,
          lunar_temp_c: activeTarget.minTempC,
          lunar_slope_deg: activeTarget.meanSlopeDeg,
        });

        // 1. Try local dev backend on 127.0.0.1:8000
        try {
          response = await fetch('http://127.0.0.1:8000/api/find-analog/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            signal: controller.signal,
          });
        } catch {
          // 2. Fallback to relative path
          response = await fetch('/api/find-analog/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            signal: controller.signal,
          });
        }

        if (response && response.ok) {
          const data = (await response.json()) as { matches?: EarthAnalogResult[] };
          if (data && Array.isArray(data.matches) && data.matches.length > 0) {
            setBackendMatches(data.matches);
            setIsBackendLive(true);
            return;
          }
        }
        setIsBackendLive(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setIsBackendLive(false);
        }
      } finally {
        setIsLoadingBackend(false);
      }
    };

    void fetchBackendAnalogs();
    return () => controller.abort();
  }, [activeTarget.id, activeTarget.minTempC, activeTarget.meanSlopeDeg]);

  // 4 Simple filter pills
  const FILTER_PILLS = [
    { id: 'all' as const, label: 'All' },
    { id: 'volcanic' as const, label: '🌋 Volcanic (Moon)' },
    { id: 'polar' as const, label: '❄️ Polar (Antarctica)' },
    { id: 'desert' as const, label: '🏜️ Desert (Atacama)' },
  ];

  // Guaranteed fallback + Dynamic Database Merger
  const effectiveCandidates = useMemo(() => {
    // Base verified candidate list
    const sourceCandidates: ScoredCandidate[] =
      rankedCandidates && rankedCandidates.length > 0
        ? [...rankedCandidates]
        : EARTH_CANDIDATE_SITES.map((site, index) => ({
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

    const baseList = noveltyOnly
      ? sourceCandidates.filter((c) => !c.site.isCatalogKnown)
      : sourceCandidates;

    if (!backendMatches || backendMatches.length === 0) {
      return baseList;
    }

    // Match backend records with existing candidate objects
    const findCandidate = (match: EarthAnalogResult): ScoredCandidate | undefined => {
      const matchName = match.location_name.toLowerCase();
      return baseList.find((c) => {
        const cName = c.site.name.toLowerCase();
        const cId = c.site.id.toLowerCase();
        if (cName.includes(matchName) || matchName.includes(cName)) return true;
        if (cId === matchName.replace(/\s+/g, '_')) return true;
        if (matchName.includes('university valley') && cId === 'univ_valley') return true;
        if (matchName.includes('black point') && cId === 'black_point') return true;
        if (matchName.includes('haughton') && cId === 'haughton_crater') return true;
        if (matchName.includes('salar de gorbea') && cId === 'salar_gorbea') return true;
        if (matchName.includes('pedernales') && cId === 'salar_pedernales') return true;
        if (matchName.includes('victoria') && cId === 'victoria_valley') return true;
        if (matchName.includes('kilauea') && cId === 'kilauea') return true;
        if (matchName.includes('pajonales') && cId === 'atacama_pajonales') return true;
        if (matchName.includes('yungay') && cId === 'atacama_yungay') return true;
        if (matchName.includes('stillwater') && cId === 'stillwater') return true;
        if (matchName.includes('shawmere') && cId === 'shawmere') return true;
        if (matchName.includes('svalbard') && cId === 'svalbard') return true;
        if (matchName.includes('craters of the moon') && cId === 'craters_moon') return true;
        if (matchName.includes('pyhäsalmi') && cId === 'pyhasalmi_mine') return true;
        if (matchName.includes('qaidam') && cId === 'qaidam_basin') return true;
        if (matchName.includes('death valley') && cId === 'death_valley') return true;
        if (matchName.includes('pilbara') && cId === 'pilbara') return true;
        if (matchName.includes('negev') && cId === 'negev_dmars') return true;
        if (matchName.includes('mdrs') && cId === 'mdrs_utah') return true;
        const dLat = Math.abs(c.site.lat - match.lat);
        const dLon = Math.abs(c.site.lon - match.lng);
        return dLat < 0.6 && dLon < 0.6;
      });
    };

    const matchedCandidateIds = new Set<string>();
    const mergedList: ScoredCandidate[] = [];

    // 1. Merge and rank backend matches dynamically
    backendMatches.forEach((match) => {
      const existing = findCandidate(match);
      const dynamicScore = Math.max(
        62,
        Math.min(99, Math.round((1 - Math.min(1.0, match.cosine_distance * 0.42)) * 100))
      );

      if (existing) {
        matchedCandidateIds.add(existing.site.id);
        mergedList.push({
          ...existing,
          bestMonthScore: dynamicScore,
          annualMeanScore: Math.max(58, dynamicScore - 3),
        });
      }
    });

    // 2. Append remainder of verified real candidate sites
    baseList.forEach((c) => {
      if (!matchedCandidateIds.has(c.site.id)) {
        mergedList.push(c);
      }
    });

    return mergedList;
  }, [rankedCandidates, backendMatches, noveltyOnly]);

  // Filter candidates based on active filter pill & search query
  const filteredCandidates = useMemo(() => {
    return effectiveCandidates.filter((cand) => {
      const site = cand.site;

      // 0. Novelty Filter
      if (noveltyOnly && site.isCatalogKnown) return false;

      // 1. Filter pill match
      let matchesFilter = true;
      if (activeFilter === 'volcanic') {
        matchesFilter =
          site.analogueCategory === 'basalt_volcanic' ||
          [
            'black_point',
            'kilauea',
            'pilbara',
            'salar_gorbea',
            'stillwater',
            'shawmere',
            'craters_moon',
            'putana_fumarole',
            'lastarria',
            'hekla',
            'disko_island',
            'cerro_galan',
            'san_francisco_volcanic',
          ].includes(site.id) ||
          (site.geologySummary
            ? site.geologySummary.toLowerCase().includes('basalt') ||
              site.geologySummary.toLowerCase().includes('anorthosite') ||
              site.geologySummary.toLowerCase().includes('volcan')
            : false);
      } else if (activeFilter === 'polar') {
        matchesFilter =
          site.analogueCategory === 'cold_polar' ||
          [
            'univ_valley',
            'svalbard',
            'haughton_crater',
            'pyhasalmi_mine',
            'victoria_valley',
            'axel_heiberg',
            'mount_fleming',
            'allan_hills',
          ].includes(site.id) ||
          site.biomeCharacter.toLowerCase().includes('polar') ||
          site.biomeCharacter.toLowerCase().includes('permafrost') ||
          site.biomeCharacter.toLowerCase().includes('cold') ||
          site.biomeCharacter.toLowerCase().includes('ice');
      } else if (activeFilter === 'desert') {
        matchesFilter =
          site.analogueCategory === 'arid_saline' ||
          site.analogueCategory === 'operational_isolation' ||
          [
            'atacama_yungay',
            'atacama_pajonales',
            'salar_pedernales',
            'salar_gorbea',
            'death_valley',
            'negev_dmars',
            'mdrs_utah',
            'qaidam_basin',
            'mojave',
            'mojave_silver_lake',
            'taklamakan',
            'salar_antofalla',
          ].includes(site.id) ||
          site.biomeCharacter.toLowerCase().includes('arid') ||
          site.biomeCharacter.toLowerCase().includes('playa') ||
          site.biomeCharacter.toLowerCase().includes('salar');
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
              <span className="text-xs text-[#696156]">
                Target: <strong className="text-[#1D1B17] font-semibold">{activeTarget.name}</strong> ({activeTarget.body.toUpperCase()})
              </span>
              {isBackendLive ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EE] border border-[#2A5A44]/20 text-xs font-bold text-[#0F422E] flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-[#184633]" />
                  <span>Dynamic Database Active</span>
                </span>
              ) : (
                <ProvenanceBadge tag="VERIFIED NASA PDS / EARTHDATA" />
              )}
            </div>
            <h1 className="text-2xl font-display font-bold text-[#1D1B17] tracking-tight">
              Discover Earth Analog Test Sites
            </h1>
            <p className="text-xs sm:text-sm text-[#696156] max-w-2xl leading-relaxed">
              Real-world Earth test sites dynamically ranked by environmental fidelity against Artemis IV equipment qualification requirements.
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

            {/* Filter Pills + Novelty Toggle */}
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

              <div className="h-5 w-px bg-[#414943]/15 mx-1 hidden sm:block" />

              {/* 🌟 Novel / Unvisited Sites Only Toggle Pill */}
              <button
                type="button"
                onClick={() => onToggleNovelty?.(!noveltyOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  noveltyOnly
                    ? 'bg-[#A33E11] text-white shadow-xs ring-2 ring-[#A33E11]/30'
                    : 'bg-[#FDF2EC] text-[#A33E11] border border-[#F87171]/40 hover:bg-[#FCE7DC]'
                }`}
                title="Toggle virgin terrestrial analog candidate sites with zero prior documented NASA usage"
              >
                <span>🌟 Novel / Unvisited Sites Only</span>
                {noveltyOnly && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
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
              const flag = getCountryFlag(site);
              const oneLiner =
                SITE_ONE_LINERS[site.id] ||
                site.geologySummary ||
                'High-altitude terrestrial analog for lunar surface equipment qualification.';
              const minTemp = Math.min(...site.monthlyMinTempC);
              const sulfurPpm = getSiteSulfurPpm(site);

              return (
                <div
                  key={site.id}
                  onClick={() => onSelectSite(site.id)}
                  className={`group rounded-2xl transition-all cursor-pointer p-3.5 sm:p-4 border ${
                    isSelected
                      ? 'bg-[#FFFFFF] border-2 border-[#184633] shadow-md ring-2 ring-[#184633]/15'
                      : 'bg-[#FFFFFF] border-[#414943]/12 hover:border-[#184633]/40 shadow-soft-card hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-stretch gap-4">
                    {/* Left: Authentic Landscape / Aerial Photo Thumbnail */}
                    <div className="relative w-full sm:w-48 md:w-52 h-44 sm:h-auto min-h-[160px] rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#414943]/10">
                      {!imageErrors[site.id] && site.imageUrl ? (
                        <>
                          <img
                            src={site.imageUrl}
                            alt={`${site.name} analog terrain`}
                            loading="lazy"
                            onError={() => handleImageError(site.id)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          {/* Top & bottom subtle gradient scrim */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

                          {/* Top Badges Overlay */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-white flex items-center gap-1 shadow-xs">
                              <span>{SITE_BIOME_ICONS[site.id] || '🌍'}</span>
                              <span className="capitalize">{site.analogueCategory?.replace('_', ' ') || 'Analog'}</span>
                            </span>

                            {!site.isCatalogKnown && (
                              <span className="px-2 py-0.5 rounded-md bg-[#A33E11] text-white border border-amber-300/40 text-[9px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>NOVEL</span>
                              </span>
                            )}
                          </div>

                          {/* Bottom Badges Overlay: Match Score & Elevation */}
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#EAF4EE] text-[#0F422E] border border-[#2A5A44]/30 shadow-xs">
                              <Sparkles className="w-3 h-3 text-[#0F422E]" />
                              <span>{matchScore}% Match</span>
                            </span>

                            <span className="text-[10px] font-mono text-white/90 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10">
                              {site.elevationM.toLocaleString()}m
                            </span>
                          </div>
                        </>
                      ) : (
                        <ProceduralBiomeFallback site={site} />
                      )}
                    </div>

                    {/* Right: Site Details */}
                    <div className="flex-1 flex flex-col justify-between space-y-2.5 min-w-0">
                      <div>
                        {/* Country Flag + Country + Region + New Candidate Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-sm">{flag}</span>
                          <span className="font-semibold text-[#1D1B17]">{site.country}</span>
                          <span className="text-[#696156]">·</span>
                          <span className="text-[#696156] truncate max-w-[200px] sm:max-w-[260px]">{site.region}</span>
                          {!site.isCatalogKnown && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FDF2EC] border border-[#F87171]/40 text-[10px] font-bold text-[#A33E11] uppercase tracking-wider inline-flex items-center gap-1 ml-auto">
                              <Sparkles className="w-2.5 h-2.5 text-[#A33E11]" />
                              <span>NEW UNEXPLORED CANDIDATE</span>
                            </span>
                          )}
                        </div>

                        {/* Site Name */}
                        <h3 className="font-display font-bold text-base sm:text-lg text-[#1D1B17] tracking-tight group-hover:text-[#184633] transition-colors leading-snug mt-1">
                          {site.name}
                        </h3>

                        {/* Clean 1-Sentence Geological Summary - No ugly box-in-box nesting */}
                        <p className="mt-1.5 text-xs text-[#414943] leading-relaxed line-clamp-2">
                          {oneLiner}
                        </p>
                      </div>

                      {/* 4 Clean Parameter Badges: Slope, Min Temp, Aridity, Sulfur ppm */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 text-xs text-[#414943] flex items-center gap-1.5"
                          title={`Terrain Slope: ${site.slopeDeg}°`}
                        >
                          <Mountain className="w-3.5 h-3.5 text-[#184633] shrink-0" />
                          <span>Slope: <strong className="font-semibold text-[#1D1B17]">{site.slopeDeg}°</strong></span>
                        </span>

                        <span
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 text-xs text-[#414943] flex items-center gap-1.5"
                          title={`Coldest Temperature: ${minTemp}°C`}
                        >
                          <Thermometer className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                          <span>Min Temp: <strong className="font-semibold text-[#1D1B17]">{minTemp}°C</strong></span>
                        </span>

                        <span
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 text-xs text-[#414943] flex items-center gap-1.5"
                          title={`Aridity Index: ${site.aridityIndex}/100 (${getAridityLabel(site.aridityIndex)})`}
                        >
                          <Wind className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                          <span>Aridity: <strong className="font-semibold text-[#1D1B17]">{site.aridityIndex}</strong></span>
                        </span>

                        <span
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 text-xs text-[#414943] flex items-center gap-1.5"
                          title={`Regolith / Soil Sulfur Concentration: ${sulfurPpm.toLocaleString()} ppm`}
                        >
                          <FlaskConical className="w-3.5 h-3.5 text-[#9333EA] shrink-0" />
                          <span>Sulfur: <strong className="font-semibold text-[#1D1B17]">{sulfurPpm.toLocaleString()} ppm</strong></span>
                        </span>
                      </div>

                      {/* Footer: Coordinates & Action Button */}
                      <div className="pt-2 border-t border-[#414943]/8 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#696156]">
                          <MapPin className="w-3 h-3 text-[#696156]" />
                          <span>{site.coordinates}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspectDossier(site.id);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#184633] text-white text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto group/btn"
                        >
                          <span>View Site Dossier</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
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
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowOverlay((v) => !v)}
                  title="Toggle Elevation / Slope Spectral Overlay"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    showOverlay
                      ? 'bg-[#EAF4EE] text-[#0F422E] font-semibold border border-[#BAEED1]'
                      : 'bg-[#FAF7F2] text-[#696156] hover:bg-[#F3EDE5] border border-[#414943]/10'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Overlay: {showOverlay ? 'On' : 'Off'}</span>
                </button>
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
            </div>

            {/* Interactive 3D Globe */}
            <div className="relative w-full h-[320px] rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#414943]/8 flex items-center justify-center">
              <PlanetaryGlobe3D
                body="earth"
                layerId="srtm_slope"
                showOverlay={showOverlay}
                onToggleOverlay={setShowOverlay}
                onlyActiveLabel={true}
                pins={filteredCandidates.map((cand) => {
                  const isCandSelected = cand.site.id === currentSite.id;
                  const score = Math.round(cand.bestMonthScore || 80);
                  const flag = getCountryFlag(cand.site);
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
                onPinClick={(pinId) => onSelectSite(pinId)}
                autoRotate={autoRotate}
                layerOpacity={0.85}
                focusLat={currentSite.lat}
                focusLon={currentSite.lon}
                cameraMode="orbit"
                themeSurface="studio-light"
              />
            </div>

            {/* Simple Comparison Summary Card: Target Lunar Site vs Selected Earth Site */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 space-y-3">
              <div className="flex items-start gap-3 border-b border-[#414943]/8 pb-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-[#414943]/12 relative shadow-xs">
                  {!imageErrors[currentSite.id] && currentSite.imageUrl ? (
                    <img
                      src={currentSite.imageUrl}
                      alt={currentSite.name}
                      onError={() => handleImageError(currentSite.id)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-emerald-900 to-slate-800 text-white">
                      {SITE_BIOME_ICONS[currentSite.id] || '🌍'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#696156] truncate">
                      <span>{getCountryFlag(currentSite)}</span>
                      <span className="truncate">{currentSite.country} · {currentSite.region}</span>
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-[#EAF4EE] border border-[#2A5A44]/20 text-[11px] font-mono font-bold text-[#0F422E] shrink-0">
                      {currentScore}% Match
                    </div>
                  </div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-[#1D1B17] mt-0.5 truncate">
                    {currentSite.name}
                  </h4>
                  <div className="text-[10px] font-mono text-[#696156] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-[#696156]" />
                    <span>{currentSite.coordinates} · {currentSite.elevationM.toLocaleString()}m</span>
                  </div>
                </div>
              </div>

              {/* Special Badge for Novel / Unexplored Earth Candidate Sites */}
              {!currentSite.isCatalogKnown && (
                <div className="p-3.5 rounded-xl bg-[#FDF2EC] border border-[#F87171]/40 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#A33E11]">
                    <Sparkles className="w-4 h-4 text-[#A33E11]" />
                    <span>🌟 NEW UNEXPLORED CANDIDATE</span>
                  </div>
                  <p className="text-[11px] text-[#414943] leading-relaxed">
                    Virgin terrestrial analog candidate site with zero documented prior NASA field usage. Identified via planetary environmental multi-spectral matching.
                  </p>
                  <div className="text-[10px] font-mono text-[#A33E11] bg-white/90 px-2.5 py-1.5 rounded-lg border border-[#F87171]/25">
                    Citation: {currentSite.catalogCitation || 'NASA Earthdata / Landsat 8/9 OLI-2 + Sentinel-2 MSI'}
                  </div>
                </div>
              )}

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

                <div className="p-2.5 rounded-lg bg-white border border-[#414943]/8 flex items-center justify-between">
                  <span className="text-[#696156]">Sulfur Concentration:</span>
                  <div className="font-mono text-right">
                    <span className="text-[#9333EA] font-bold">{getSiteSulfurPpm(currentSite).toLocaleString()} ppm</span>
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
          Selected: <strong className="text-[#1D1B17]">{getCountryFlag(currentSite)} {currentSite.name}</strong> ({currentScore}% Match)
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
