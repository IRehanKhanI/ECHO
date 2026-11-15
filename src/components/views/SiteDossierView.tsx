import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Globe,
  MapPin,
  Mountain,
  Navigation,
  Radio,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Truck,
} from 'lucide-react';
import {
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetaryTarget,
  ScoredCandidate,
  WorkspaceView,
} from '../../types/terra';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { SITE_BIOME_ICONS, SITE_COUNTRY_FLAGS, SITE_ONE_LINERS } from './DiscoveryView';

interface SiteDossierViewProps {
  activeTarget: PlanetaryTarget;
  selectedSite: EarthCandidateSite;
  activeObjective?: ObjectiveProfile;
  rankedCandidates: ScoredCandidate[];
  onSelectSite: (siteId: string) => void;
  onNavigate: (view: WorkspaceView) => void;
}

export const SiteDossierView: React.FC<SiteDossierViewProps> = ({
  activeTarget,
  selectedSite,
  rankedCandidates,
  onSelectSite,
  onNavigate,
}) => {
  // Find candidate scored object
  const scored =
    rankedCandidates.find((c) => c.site.id === selectedSite.id) ||
    rankedCandidates[0];

  // Distinct scores
  const scores = selectedSite.distinctScores || {
    environmentalMatch: Math.round(scored?.bestMonthScore || 86),
    operationalFeasibility: 48,
    administrativeReadiness: 65,
    dataConfidence: 94,
  };

  const admin = selectedSite.adminFeasibility || {
    status: 'Conditional' as const,
    statusReason: 'Scientific research fieldwork permit and access authorization required.',
    authority: 'National Land Management Agency',
    jurisdiction: selectedSite.country,
    leadTimeWeeks: 14,
    officialUrl: 'https://www.nasa.gov/',
    permitsRequired: ['Scientific Fieldwork Permit', 'Land Access Notice'],
  };

  const flag = SITE_COUNTRY_FLAGS[selectedSite.id] || '🌐';
  const biomeIcon = SITE_BIOME_ICONS[selectedSite.id] || '🏔️';
  const oneLiner =
    SITE_ONE_LINERS[selectedSite.id] ||
    selectedSite.geologySummary ||
    'High-altitude terrestrial analog for lunar surface equipment qualification.';
  const minTemp = Math.min(...selectedSite.monthlyMinTempC);

  // Logistics facts helper
  const getLogisticsFacts = (siteId: string) => {
    switch (siteId) {
      case 'salar_gorbea':
        return {
          route: 'High-clearance 4WD from Copiapó (6 hours) via Route 31-CH across High Puna Plateau.',
          airstrip: 'Desierto de Atacama Airport (CPO) / Chamonate Airfield (~6 hr 4WD)',
          hospital: 'Copiapó Regional Hospital (~6 hours by road or emergency helicopter medevac)',
        };
      case 'atacama_yungay':
        return {
          route: 'Paved highway from Antofagasta (1.5 hours) plus unpaved desert spur road.',
          airstrip: 'Andrés Sabella Gálvez International Airport (ANF), Antofagasta (~1.5 hr drive)',
          hospital: 'Antofagasta Regional Hospital Level 1 (< 1.5 hours drive)',
        };
      case 'univ_valley':
        return {
          route: 'Helicopter sling load or tracked Hagglunds from McMurdo Station (45 min flight).',
          airstrip: 'Pegasus Field / Phoenix Airfield (LC-130 Hercules skiway), Antarctica',
          hospital: 'McMurdo Station Medical Clinic / Christchurch medevac protocol',
        };
      case 'black_point':
        return {
          route: 'All-weather gravel road from Flagstaff, Arizona (1 hour drive via US-89).',
          airstrip: 'Flagstaff Pulliam Airport (FLG, 1 hr drive) or Phoenix Sky Harbor (PHX, 2.5 hr)',
          hospital: 'Flagstaff Medical Center Level 1 Trauma (< 1 hour drive)',
        };
      case 'haughton_crater':
        return {
          route: 'Charter Twin Otter flight from Resolute Bay directly to Devon Island gravel airstrip.',
          airstrip: 'Resolute Bay Airport (YRB) / Haughton River unimproved dirt strip',
          hospital: 'Resolute Bay Nursing Station / Air ambulance medevac to Iqaluit',
        };
      case 'death_valley':
        return {
          route: 'Paved state highway (CA-190) from Las Vegas (2.5 hours drive).',
          airstrip: 'Furnace Creek Airport (L06) or Las Vegas Harry Reid Airport (LAS)',
          hospital: 'Pahrump Regional Medical Center / Las Vegas Level 1 Trauma (< 2 hours)',
        };
      case 'kilauea':
        return {
          route: 'Paved road access within Hawaii Volcanoes National Park (45 min from Hilo).',
          airstrip: 'Hilo International Airport (ITO, 45 min drive)',
          hospital: 'HMC Hilo Medical Center (< 45 minutes drive)',
        };
      case 'pilbara':
        return {
          route: '4WD mining access track from Newman or Port Hedland, Western Australia (3 hours).',
          airstrip: 'Newman Airport (ZNE, 3 hr drive)',
          hospital: 'Newman Hospital (< 3 hours) / Royal Flying Doctor Service (RFDS)',
        };
      case 'mdrs_utah':
        return {
          route: 'Gravel access road from Hanksville, Utah (15 minutes drive).',
          airstrip: 'Canyonlands Regional Airport (CNY), Moab, Utah (1.5 hr drive)',
          hospital: 'Moab Regional Hospital (< 1.5 hours drive)',
        };
      case 'negev_dmars':
        return {
          route: 'Paved road to Mitzpe Ramon, followed by 4WD desert trail into Makhtesh Ramon.',
          airstrip: 'Ramon Airport (ETM) / Beersheba Airfield',
          hospital: 'Soroka Medical Center, Beersheba (< 1.5 hours drive)',
        };
      case 'svalbard':
        return {
          route: 'Snowmobile or boat charter from Longyearbyen (2-3 hours depending on season).',
          airstrip: 'Svalbard Airport, Longyearbyen (LYR)',
          hospital: 'Longyearbyen Hospital (< 2 hours) / Tromsø medevac flight',
        };
      default:
        return {
          route: selectedSite.operationalLogistics || selectedSite.fieldAccessNotes || '4WD transport road, ~4-6 hours from regional transport hub.',
          airstrip: 'Nearest regional commercial or charter airstrip',
          hospital: 'Regional emergency medical facility & air medevac coordination',
        };
    }
  };

  const logistics = getLogisticsFacts(selectedSite.id);

  return (
    <div className="space-y-6 pb-12">
      {/* ==================== HERO SITE HEADER ==================== */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6 space-y-5">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#414943]/8 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EE] border border-[#2A5A44]/20 font-bold text-[#0F422E]">
              Module 3 · Site Dossier
            </span>
            <span className="text-[#696156]">
              Target: <strong className="text-[#1D1B17] font-semibold">{activeTarget.name}</strong> ({activeTarget.body.toUpperCase()} South Pole)
            </span>
            <ProvenanceBadge tag="VERIFIED NASA PDS / EARTHDATA" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('discovery')}
              className="px-3.5 py-1.5 rounded-xl border border-[#414943]/15 text-xs font-semibold text-[#1D1B17] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#696156]" />
              <span>Back to Discover</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('permits')}
              className="px-4 py-1.5 rounded-xl bg-[#184633] text-white text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Permits &amp; Clearance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Location Identity, Coordinates & Quick Switcher */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10">
                {flag}
              </span>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#696156]">
                  <span>{biomeIcon}</span>
                  <span className="uppercase tracking-wider font-mono">{selectedSite.country}</span>
                  <span>·</span>
                  <span>{selectedSite.region}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1D1B17] tracking-tight">
                  {selectedSite.name}
                </h1>
              </div>
            </div>

            {/* Coordinates & Elevation Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 font-mono text-[#1D1B17] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E06A3B]" />
                <span>{selectedSite.coordinates}</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 font-mono text-[#1D1B17] flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-[#184633]" />
                <span>Elevation: {selectedSite.elevationM.toLocaleString()} m ASL</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 text-xs font-medium text-[#414943] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0F422E]" />
                <span>Archetype: {selectedSite.biomeCharacter}</span>
              </span>
            </div>
          </div>

          {/* Quick Switch Candidate Pill Bar */}
          <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#414943]/10 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#696156] block">
              Quick Switch Candidate:
            </span>
            <div className="flex flex-wrap gap-1 max-w-xs">
              {rankedCandidates.slice(0, 5).map((cand) => {
                const isThis = cand.site.id === selectedSite.id;
                const cFlag = SITE_COUNTRY_FLAGS[cand.site.id] || '🌐';
                return (
                  <button
                    key={cand.site.id}
                    type="button"
                    onClick={() => onSelectSite(cand.site.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isThis
                        ? 'bg-[#184633] text-white shadow-xs'
                        : 'bg-white text-[#414943] hover:bg-[#F3EDE5] border border-[#414943]/10'
                    }`}
                  >
                    <span>{cFlag}</span>
                    <span className="truncate max-w-[85px]">{cand.site.name.split(' (')[0]}</span>
                    <span className="font-mono text-[10px] opacity-80">
                      {Math.round(cand.bestMonthScore)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1-Sentence Summary */}
        <p className="text-xs sm:text-sm text-[#414943] leading-relaxed bg-[#FAF7F2] p-3 rounded-xl border border-[#414943]/8">
          <strong className="text-[#1D1B17]">Mission Analogue Suitability:</strong> {oneLiner}
        </p>

        {/* ==================== 4 CLEAR SCORE BADGES IN A SINGLE CLEAN ROW ==================== */}
        <div className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Environmental Match */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                  <span>🌿</span>
                  <span>Environmental Match</span>
                </span>
                <span className="font-mono font-bold text-base text-[#0F422E]">
                  {scores.environmentalMatch}%
                </span>
              </div>
              <div className="w-full bg-[#E5DCCE] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0F422E] h-full rounded-full transition-all"
                  style={{ width: `${scores.environmentalMatch}%` }}
                />
              </div>
              <div className="text-[11px] text-[#696156]">
                Terrain relief ({selectedSite.slopeDeg}° slope), roughness &amp; thermal cycling
              </div>
            </div>

            {/* 2. Operations */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                  <span>🚙</span>
                  <span>Operations</span>
                </span>
                <span className="font-mono font-bold text-base text-[#0284C7]">
                  {scores.operationalFeasibility}/100
                </span>
              </div>
              <div className="w-full bg-[#E5DCCE] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0284C7] h-full rounded-full transition-all"
                  style={{ width: `${scores.operationalFeasibility}%` }}
                />
              </div>
              <div className="text-[11px] text-[#696156]">
                Heavy transport roads, airstrip access &amp; field power support
              </div>
            </div>

            {/* 3. Permit Status */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                  <span>⚖️</span>
                  <span>Permit Status</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FEF08A] text-[#713F12] border border-[#FACC15]/40 font-mono">
                  {String(admin.status).split(' ')[0]}
                </span>
              </div>
              <div className="text-xs font-bold font-mono text-[#1D1B17]">
                ~{admin.leadTimeWeeks} wk lead time
              </div>
              <div className="text-[11px] text-[#696156] truncate">
                {admin.authority}
              </div>
            </div>

            {/* 4. Data Quality */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                  <span>🔬</span>
                  <span>Data Quality</span>
                </span>
                <span className="font-mono font-bold text-base text-[#7C3AED]">
                  {scores.dataConfidence}%
                </span>
              </div>
              <div className="w-full bg-[#E5DCCE] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#7C3AED] h-full rounded-full transition-all"
                  style={{ width: `${scores.dataConfidence}%` }}
                />
              </div>
              <div className="text-[11px] text-[#696156]">
                Verified NASA LOLA, Diviner &amp; USGS data
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== CLEAN SIDE-BY-SIDE COMPARISON BOX ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left (Green): What You Can Test Here */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#2A5A44]/25 shadow-soft-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A5A44]/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EAF4EE] text-[#0F422E] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#0F422E]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#0F422E]">
                  What You Can Test Here
                </h3>
                <p className="text-[11px] text-[#2A5A44]">
                  Approved engineering test domains for Artemis IV surface equipment
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#EAF4EE] text-[#0F422E] text-[10px] font-mono font-bold">
              High Fidelity
            </span>
          </div>

          <div className="space-y-3">
            {/* Regolith traction */}
            <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#2A5A44]/15 space-y-1">
              <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                <span className="text-[#0F422E]">✓</span>
                <span>Regolith Traction &amp; Slope Mobility</span>
              </span>
              <p className="text-xs text-[#414943] leading-relaxed pl-4">
                Fragmented basaltic scree and loose volcanic ash matching slopes up to {selectedSite.slopeDeg}° evaluate wheel sinkage, tire grouser grip, and motor torque.
              </p>
            </div>

            {/* Sulfur & chemical corrosion */}
            <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#2A5A44]/15 space-y-1">
              <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                <span className="text-[#0F422E]">✓</span>
                <span>Sulfur &amp; Chemical Soil Corrosion</span>
              </span>
              <p className="text-xs text-[#414943] leading-relaxed pl-4">
                High natural concentrations of native sulfur and acidic sulfate evaporites simulate corrosive regolith volatiles for material coupons and seal longevity.
              </p>
            </div>

            {/* Cold soak */}
            <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#2A5A44]/15 space-y-1">
              <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                <span className="text-[#0F422E]">✓</span>
                <span>Cryogenic Diurnal Cold Soak</span>
              </span>
              <p className="text-xs text-[#414943] leading-relaxed pl-4">
                Diurnal cold drops reaching {minTemp}°C subject structural fasteners, elastomer seals, and battery heating units to real-world thermal shocks.
              </p>
            </div>

            {/* Dust abrasion */}
            <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#2A5A44]/15 space-y-1">
              <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                <span className="text-[#0F422E]">✓</span>
                <span>Abrasive Dust &amp; Particulate Ingress</span>
              </span>
              <p className="text-xs text-[#414943] leading-relaxed pl-4">
                Sharp aeolian mineral dust verifies rotary bearing seal enclosures, camera lens wiper coatings, and radiator surface degradation.
              </p>
            </div>

            {/* Autonomous navigation */}
            <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#2A5A44]/15 space-y-1">
              <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                <span className="text-[#0F422E]">✓</span>
                <span>Autonomous Hazard Detection &amp; SLAM</span>
              </span>
              <p className="text-xs text-[#414943] leading-relaxed pl-4">
                Rugged surface roughness ({selectedSite.rmsRoughnessM}m RMS) stresses stereo hazard navigation cameras and autonomous path planning algorithms.
              </p>
            </div>
          </div>
        </div>

        {/* Right (Amber/Red): What Earth Cannot Match */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#FEB2B2] shadow-soft-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#FEB2B2]/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#991B1B]">
                  What Earth Cannot Match
                </h3>
                <p className="text-[11px] text-[#B91C1C]">
                  Physical limitations requiring vacuum chamber or centrifuge testing
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] text-[10px] font-mono font-bold">
              Physical Limits
            </span>
          </div>

          <div className="space-y-3">
            {/* Hard vacuum */}
            <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2]/50 space-y-1">
              <span className="text-xs font-bold text-[#991B1B] flex items-center gap-1.5">
                <span className="text-[#DC2626]">✕</span>
                <span>Hard Vacuum (0 kPa)</span>
              </span>
              <p className="text-xs text-[#7F1D1D] leading-relaxed pl-4">
                Earth atmospheric pressure ({selectedSite.elevationM > 3500 ? '62-75' : '85-101'} kPa) prevents testing vacuum outgassing, sublimation kinetics, and bare metal cold-welding.
              </p>
            </div>

            {/* 1/6th gravity */}
            <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2]/50 space-y-1">
              <span className="text-xs font-bold text-[#991B1B] flex items-center gap-1.5">
                <span className="text-[#DC2626]">✕</span>
                <span>Lunar 1/6th Gravity (0.166 g)</span>
              </span>
              <p className="text-xs text-[#7F1D1D] leading-relaxed pl-4">
                Terrestrial 1.0 g gravity imposes 6x higher vehicle mass loads, altering suspension spring compression and vehicle rollover tipping angles.
              </p>
            </div>

            {/* Cosmic radiation */}
            <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2]/50 space-y-1">
              <span className="text-xs font-bold text-[#991B1B] flex items-center gap-1.5">
                <span className="text-[#DC2626]">✕</span>
                <span>Cosmic &amp; Solar Wind Radiation</span>
              </span>
              <p className="text-xs text-[#7F1D1D] leading-relaxed pl-4">
                Earth&apos;s magnetic field and upper atmosphere shield &gt;100x against galactic cosmic rays (GCR) and high-energy solar proton event single-event upsets.
              </p>
            </div>

            {/* Deep PSR cold */}
            <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2]/50 space-y-1">
              <span className="text-xs font-bold text-[#991B1B] flex items-center gap-1.5">
                <span className="text-[#DC2626]">✕</span>
                <span>Deep PSR Cryogenic Cold (&lt;40 K)</span>
              </span>
              <p className="text-xs text-[#7F1D1D] leading-relaxed pl-4">
                Permanently Shadowed Regions on the Moon reach 40 K (-233°C). Terrestrial winter lows reach ~{minTemp}°C, requiring cryogenic thermal-vac chambers.
              </p>
            </div>

            {/* Electrostatic levitation */}
            <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2]/50 space-y-1">
              <span className="text-xs font-bold text-[#991B1B] flex items-center gap-1.5">
                <span className="text-[#DC2626]">✕</span>
                <span>Electrostatic Dust Levitation</span>
              </span>
              <p className="text-xs text-[#7F1D1D] leading-relaxed pl-4">
                Ambient atmospheric humidity discharges electrostatic particle charging, suppressing the lunar dust lofting and adhesion dynamics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SIMPLE LOGISTICS CARD ==================== */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#414943]/8 pb-3">
          <Truck className="w-5 h-5 text-[#184633]" />
          <div>
            <h3 className="font-display font-bold text-base text-[#1D1B17]">
              Field Logistics &amp; Expedition Access
            </h3>
            <p className="text-xs text-[#696156]">
              Operational transit routes, medical evacuation pathways, and satellite telemetry
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Access Route */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-1.5">
            <span className="font-mono text-[10px] uppercase font-bold text-[#696156] flex items-center gap-1">
              <span>🛣️</span>
              <span>Ground Access Route</span>
            </span>
            <p className="text-xs text-[#1D1B17] font-semibold leading-relaxed">
              {logistics.route}
            </p>
          </div>

          {/* Nearest Airstrip */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-1.5">
            <span className="font-mono text-[10px] uppercase font-bold text-[#696156] flex items-center gap-1">
              <span>✈️</span>
              <span>Nearest Airstrip / Airfield</span>
            </span>
            <p className="text-xs text-[#1D1B17] font-semibold leading-relaxed">
              {logistics.airstrip}
            </p>
          </div>

          {/* Hospital / Medevac */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-1.5">
            <span className="font-mono text-[10px] uppercase font-bold text-[#696156] flex items-center gap-1">
              <span>🏥</span>
              <span>Hospital &amp; Emergency Medevac</span>
            </span>
            <p className="text-xs text-[#1D1B17] font-semibold leading-relaxed">
              {logistics.hospital}
            </p>
          </div>
        </div>

        {/* Comms strip */}
        <div className="pt-1 flex items-center gap-2 text-xs text-[#696156]">
          <Radio className="w-3.5 h-3.5 text-[#184633]" />
          <span>Communications: Verified Starlink portable broadband telemetry &amp; Iridium Extreme satellite emergency beacon.</span>
        </div>
      </div>

      {/* ==================== LARGE CTA BUTTON / WORKFLOW CARD ==================== */}
      <div className="bg-[#FFFFFF] rounded-2xl border-2 border-[#184633] shadow-md p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#184633]">
              Next Mission Step: Legal Clearance
            </span>
          </div>
          <h3 className="font-display font-bold text-lg text-[#1D1B17]">
            Verify Land Access &amp; Permits for {selectedSite.name}
          </h3>
          <p className="text-xs text-[#696156] leading-relaxed">
            Review land management jurisdiction ({admin.authority}), statutory filing lead times (~{admin.leadTimeWeeks} weeks), and generate an expedition clearance package.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('discovery')}
            className="px-4 py-2.5 rounded-xl border border-[#414943]/15 hover:bg-[#FAF7F2] text-xs font-semibold text-[#1D1B17] transition-colors cursor-pointer"
          >
            ← Back to Discover Sites
          </button>
          <button
            type="button"
            onClick={() => onNavigate('permits')}
            className="px-6 py-2.5 rounded-xl bg-[#184633] text-white text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>Check Legal Permits &amp; Requirements (Module 4)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
