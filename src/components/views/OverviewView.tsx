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
} from '../../types/terra';
import { TerrainPreviewArtwork } from '../common/TerrainPreviewArtwork';
import {
  GlobeCameraMode,
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
  onLaunchDiscovery: () => void;
  onOpenReport: () => void;
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
  onLaunchDiscovery,
  onOpenReport,
}) => {
  const [lolaOpacity, setLolaOpacity] = useState(100);
  const [divinerOpacity, setDivinerOpacity] = useState(75);
  const [stageMode, setStageMode] = useState<'orbit' | 'top' | 'relief'>('orbit');
  const [autoRotate, setAutoRotate] = useState(false);

  const activeBin =
    DIVINER_SEASONAL_BINS[seasonalBinIdx] || DIVINER_SEASONAL_BINS[2];

  const globePins: GlobePin[] = useMemo(() => {
    if (activeBody === 'earth') {
      return EARTH_CANDIDATE_SITES.map((s) => ({
        id: s.id,
        label: s.name.split(' (')[0],
        lat: s.lat,
        lon: s.lon,
        accent: s.isCatalogKnown ? 'moss' : 'terracotta',
        active: s.id === selectedSite.id,
      }));
    }
    return PLANETARY_TARGETS.filter((t) => t.body === activeBody).map((t) => ({
      id: t.id,
      label: t.name,
      lat: t.lat,
      lon: t.lon,
      accent: t.body === 'moon' ? 'moss' : 'terracotta',
      active: t.id === activeTarget.id,
      scoreBadge: `${t.elevationM >= 0 ? '+' : ''}${t.elevationM}m`,
    }));
  }, [activeBody, activeTarget.id, selectedSite.id]);

  const crossSectionSvg = useMemo(() => {
    const vals = activeTarget.crossSectionElevationsM;
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
  }, [activeTarget]);

  // Specific 3 primary objectives featured in Screen 1
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

  // Top 3 Earth Analogs
  const top3Analogs = useMemo(() => {
    return rankedCandidates.slice(0, 3);
  }, [rankedCandidates]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-6 items-start">
      {/* ===================== LEFT COLUMN ===================== */}
      <aside className="flex flex-col gap-5">
        {/* Card 1: ACTIVE STUDY REGION */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Active Study Region
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#E06A3B]" aria-hidden="true" />
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-[#1D1B17]">
            {activeTarget.name.includes('Shackleton')
              ? 'Shackleton Rim Massif'
              : activeTarget.name}
          </h2>

          <p className="font-mono text-xs font-semibold text-[#E06A3B] mt-1">
            {activeTarget.coordinates} • Elevation +{activeTarget.elevationM.toLocaleString()}m
          </p>

          <p className="text-xs text-[#696156] mt-2.5 leading-relaxed">
            {activeTarget.summary}
          </p>

          <div className="mt-4 pt-3 border-t border-[#414943]/8 flex items-center justify-between">
            <span className="text-[11px] text-[#696156] font-medium">Switch Target:</span>
            <select
              aria-label="Select reference site"
              value={activeTarget.id}
              onChange={(e) => onSelectTarget(e.target.value)}
              className="bg-[#F9F3EB] border border-[#414943]/10 rounded-xl px-2.5 py-1 text-xs font-medium text-[#1D1B17] focus:outline-none focus:ring-1 focus:ring-[#184633] cursor-pointer"
            >
              {PLANETARY_TARGETS.filter((t) => t.body === activeBody).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Card 2: PRIMARY FIELD OBJECTIVE */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Primary Field Objective
            </span>
            <span className="text-xs font-semibold text-[#696156]">Priority 1</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {featuredObjectives.map((obj) => {
              const isSelected = activeObjective.id === obj.id;
              const Icon = obj.icon;
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => onSelectObjective(obj.id)}
                  className={`text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-[#184633] text-[#FFFFFF] border-[#184633] shadow-xs'
                      : 'bg-[#F9F3EB] text-[#1D1B17] border-[#414943]/8 hover:border-[#184633]/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
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
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Spectral &amp; DEM Layers
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[11px] font-semibold text-[#0F422E]">
              2 Active
            </span>
          </div>

          {/* LOLA DEM Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-2 font-medium text-[#1D1B17]">
                <span className="w-2 h-2 rounded-full bg-[#184633]" />
                LOLA DEM Elevation Mesh
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
              aria-label="LOLA DEM Opacity"
            />
          </div>

          {/* Diviner Thermal Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-2 font-medium text-[#1D1B17]">
                <span className="w-2 h-2 rounded-full bg-[#E06A3B]" />
                Diviner Thermal Bolometry
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
              aria-label="Diviner Thermal Opacity"
            />
          </div>

          {/* Elevation Profile Ramp */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-[#696156] font-medium">Elevation Profile Ramp</span>
              <span className="font-mono text-[10px] text-[#696156]">Lunar Datum</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#0F422E] via-[#84CC16] via-[#E69A28] to-[#E06A3B]" />
            <div className="flex items-center justify-between font-mono text-[10px] text-[#696156] mt-1.5">
              <span>-4,200m (PSR)</span>
              <span>0m (Mean)</span>
              <span>+4,300m (Peak)</span>
            </div>
          </div>
        </div>

        {/* Action Button: Launch Analog Search */}
        <button
          type="button"
          onClick={onLaunchDiscovery}
          className="w-full bg-[#E06A3B] hover:bg-[#C95528] active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
        >
          <span>Launch Analog Search</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </aside>

      {/* ===================== CENTER COLUMN ===================== */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 sm:p-6 flex flex-col justify-between relative min-h-[660px]">
        {/* Top Control Bar inside Center Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F9F3EB] border border-[#414943]/8 font-mono text-xs font-semibold text-[#1D1B17]">
            <span className="w-2 h-2 rounded-full bg-[#E06A3B]" />
            <span>Lunar South Pole 3D</span>
            <span className="text-[#C0C9C1]">|</span>
            <span className="text-[#696156]">240m GSD</span>
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

        {/* The Main Stage (3D Globe or Polar Cartographic Projection) */}
        <div className="relative flex-1 w-full flex items-center justify-center my-2 min-h-[460px] overflow-hidden rounded-2xl bg-[#F8F5EE]">
          {stageMode === 'orbit' ? (
            <PlanetaryGlobe3D
              body={activeBody}
              activeLayerId={activeLayerId}
              pins={globePins}
              onPinClick={() => {}}
              autoRotate={autoRotate}
              layerOpacity={lolaOpacity / 100}
              focusLat={activeTarget.lat}
              focusLon={activeTarget.lon}
              cameraMode="orbit"
              themeSurface="studio-light"
            />
          ) : (
            /* Polar Cartographic Projection matching image_f53c2458 */
            <div className="relative w-full h-full flex items-center justify-center p-4">
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
                  0° PRIME MERIDIAN • EARTH FACING
                </text>

                {/* Shaded Craters */}
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

                {/* Station Alpha Pin */}
                <circle cx="264" cy="236" r="6" fill="#E06A3B" />
                <circle cx="264" cy="236" r="11" fill="none" stroke="#E06A3B" strokeWidth="1.5" opacity="0.6" />

                {/* Callout Label Station Alpha */}
                <g transform="translate(190, 192)">
                  <rect width="180" height="24" rx="12" fill="#FFFFFF" stroke="#414943" strokeWidth="0.5" strokeOpacity="0.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
                  <circle cx="12" cy="12" r="3.5" fill="#E06A3B" />
                  <text x="22" y="16" fill="#1D1B17" fontSize="10" fontFamily="Outfit" fontWeight="600">
                    Station Alpha • Shackleton Rim
                  </text>
                  <text x="146" y="16" fill="#E06A3B" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                    +1,240m
                  </text>
                </g>

                {/* Faustini Cold-Trap Pin */}
                <circle cx="330" cy="245" r="3" fill="#184633" />
                <text x="338" y="248" fill="#184633" fontSize="9" fontFamily="Inter" fontWeight="500">
                  • Faustini Cold-Trap
                </text>
              </svg>
            </div>
          )}

          {/* Overlaid Floating HUD Card: Grazing Sun */}
          <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
            <div className="bg-[#FFFFFF]/95 backdrop-blur-sm rounded-full border border-[#414943]/10 shadow-md px-3.5 py-1.5 flex items-center gap-2 text-xs font-mono text-[#1D1B17]">
              <Sun className="w-3.5 h-3.5 text-[#E69A28]" />
              <span>Grazing Sun: Subsolar +1.84° • Shadow: 74%</span>
            </div>
          </div>

          {/* Overlaid Floating HUD Card: Cross-Section Profile */}
          <div className="absolute bottom-4 right-4 z-10 bg-[#FFFFFF]/95 backdrop-blur-sm rounded-2xl border border-[#414943]/10 shadow-md p-3 w-64">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#1D1B17] mb-1.5">
              <span>Cross-Section (A-B)</span>
              <span className="font-mono text-[#E06A3B] text-[10px] font-bold">
                +1,240m to -3,800m
              </span>
            </div>
            <svg viewBox="0 0 220 42" className="w-full h-10 overflow-visible">
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
            <span>NASA PDS LOLA &amp; Diviner Certified</span>
          </div>
        </div>
      </section>

      {/* ===================== RIGHT COLUMN ===================== */}
      <aside className="flex flex-col gap-5">
        {/* Card 1: GEOLOGICAL DOSSIER */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Geological Dossier
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFF2EB] border border-[#FFDBCF] text-[10px] font-bold text-[#E06A3B]">
              CLASS A-1
            </span>
          </div>

          <h3 className="font-display text-2xl font-bold tracking-tight text-[#1D1B17]">
            {activeTarget.name}
          </h3>

          {/* 2x2 Metric Grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            {/* Min Surface T */}
            <div className="bg-[#F9F3EB] rounded-2xl p-3 border border-[#414943]/6">
              <div className="flex items-center gap-1.5 text-[11px] text-[#696156] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E06A3B]" />
                Min Surface T
              </div>
              <div className="font-display font-bold text-2xl text-[#E06A3B] mt-1">
                -203°C
              </div>
              <div className="font-mono text-[10px] text-[#696156] mt-0.5">
                69.7 K (Cryo Trap)
              </div>
            </div>

            {/* Max Surface T */}
            <div className="bg-[#F9F3EB] rounded-2xl p-3 border border-[#414943]/6">
              <div className="flex items-center gap-1.5 text-[11px] text-[#696156] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E06A3B]" />
                Max Surface T
              </div>
              <div className="font-display font-bold text-2xl text-[#E06A3B] mt-1">
                -48°C
              </div>
              <div className="font-mono text-[10px] text-[#696156] mt-0.5">
                225 K (Solar Peak)
              </div>
            </div>

            {/* Baseline Slope */}
            <div className="bg-[#F9F3EB] rounded-2xl p-3 border border-[#414943]/6">
              <div className="flex items-center gap-1.5 text-[11px] text-[#696156] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#184633]" />
                Baseline Slope
              </div>
              <div className="font-display font-bold text-2xl text-[#184633] mt-1">
                14.8°
              </div>
              <div className="font-mono text-[10px] text-[#696156] mt-0.5">
                Moderate Traverse
              </div>
            </div>

            {/* Grazing Solar */}
            <div className="bg-[#F9F3EB] rounded-2xl p-3 border border-[#414943]/6">
              <div className="flex items-center gap-1.5 text-[11px] text-[#696156] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E69A28]" />
                Grazing Solar
              </div>
              <div className="font-display font-bold text-2xl text-[#E69A28] mt-1">
                1.8°–5.6°
              </div>
              <div className="font-mono text-[10px] text-[#696156] mt-0.5">
                Quasi-Continuous
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: TOP MATCHED EARTH ANALOGS */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Top Matched Earth Analogs
            </span>
            <span className="text-xs font-semibold text-[#696156]">Top 3 Sites</span>
          </div>

          <div className="flex flex-col gap-3">
            {/* 1. University Valley, Antarctica */}
            <div
              onClick={() => onSelectSite('univ_valley')}
              className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 hover:border-[#184633]/30 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#1D1B17]">
                <span>University Valley, Antarctica</span>
                <span className="px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[#0F422E] font-semibold text-[11px]">
                  86.4% Match
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#696156] mt-1">
                <span>Dry permafrost ice-table ground</span>
                <span className="font-mono font-medium">Nov–Jan</span>
              </div>
              <div className="h-1.5 w-full bg-[#EDE5D8] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#184633] rounded-full" style={{ width: '86.4%' }} />
              </div>
            </div>

            {/* 2. Salar de Gorbea, Chile/Arg */}
            <div
              onClick={() => onSelectSite('salar_gorbea')}
              className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 hover:border-[#E06A3B]/30 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#1D1B17]">
                <span>Salar de Gorbea, Chile/Arg</span>
                <span className="font-mono font-bold text-[#E06A3B] text-[11px]">
                  84.2% Match
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#696156] mt-1">
                <span>Cryogenic evaporite salts &amp; high UV</span>
                <span className="font-mono font-medium">Dec–Feb</span>
              </div>
              <div className="h-1.5 w-full bg-[#EDE5D8] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#E06A3B] rounded-full" style={{ width: '84.2%' }} />
              </div>
            </div>

            {/* 3. Qaidam Basin, Tibetan Plat. */}
            <div
              onClick={() => onSelectSite('qaidam_basin')}
              className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 hover:border-[#E06A3B]/30 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#1D1B17]">
                <span>Qaidam Basin, Tibetan Plat.</span>
                <span className="font-mono font-bold text-[#E06A3B] text-[11px]">
                  79.1% Match
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#696156] mt-1">
                <span>Yardang field &amp; thermal cycling</span>
                <span className="font-mono font-medium">Apr–Jun</span>
              </div>
              <div className="h-1.5 w-full bg-[#EDE5D8] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#E06A3B] rounded-full" style={{ width: '79.1%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Terrain Match Reference */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#696156]">
              Terrain Match Reference
            </span>
            <span className="text-xs font-semibold text-[#184633]">
              University Valley Ridge
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#414943]/8">
            <TerrainPreviewArtwork
              siteId="univ_valley"
              siteName="University Valley"
              heightClass="h-28"
            />
            <div className="absolute bottom-2.5 left-2.5 bg-[#FFFFFF]/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-semibold text-[#1D1B17] shadow-xs">
              Polar Regolith Simulant
            </div>
          </div>
        </div>

        {/* Action Button: Open Analog Fidelity Dossier */}
        <button
          type="button"
          onClick={onOpenReport}
          className="w-full bg-[#FFFFFF] hover:bg-[#EAF4EE] active:scale-[0.99] border border-[#184633] text-[#184633] font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer shadow-xs"
        >
          <BookOpen className="w-4 h-4 text-[#184633]" />
          <span>Open Analog Fidelity Dossier</span>
        </button>
      </aside>
    </div>
  );
};
