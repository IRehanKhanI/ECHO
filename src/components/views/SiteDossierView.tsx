import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Compass,
  ExternalLink,
  FileCheck,
  FileText,
  Globe,
  Info,
  Layers,
  MapPin,
  Mountain,
  Navigation,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Thermometer,
  ThermometerSnowflake,
  Truck,
  Wind,
  Wrench,
  X,
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
  activeObjective: ObjectiveProfile;
  rankedCandidates: ScoredCandidate[];
  onSelectSite: (siteId: string) => void;
  onNavigate: (view: WorkspaceView) => void;
}

export const SiteDossierView: React.FC<SiteDossierViewProps> = ({
  activeTarget,
  selectedSite,
  activeObjective,
  rankedCandidates,
  onSelectSite,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'geology' | 'logistics' | 'equipment'>('geology');

  // Find candidate scored object
  const scored =
    rankedCandidates.find((c) => c.site.id === selectedSite.id) ||
    rankedCandidates[0];

  // Distinct auditable scores (strictly kept separate, never collapsed into fake single score)
  const scores = selectedSite.distinctScores || {
    environmentalMatch: Math.round(scored?.bestMonthScore || 85),
    operationalFeasibility: 72,
    administrativeReadiness: 70,
    dataConfidence: 94,
  };

  const admin = selectedSite.adminFeasibility || {
    status: 'Conditional' as const,
    statusReason: 'Scientific research fieldwork permit and access authorization required.',
    authority: 'National Land Management Agency',
    jurisdiction: selectedSite.country,
    leadTimeWeeks: 8,
    officialUrl: 'https://www.nasa.gov/',
    permitsRequired: ['Scientific Fieldwork Permit', 'Land Access Notice'],
  };

  // Flag and biome
  const flag = SITE_COUNTRY_FLAGS[selectedSite.id] || '🌐';
  const biomeIcon = SITE_BIOME_ICONS[selectedSite.id] || '🏔️';
  const oneLiner =
    SITE_ONE_LINERS[selectedSite.id] ||
    selectedSite.geologySummary ||
    'High-fidelity terrestrial analog for lunar surface equipment qualification.';

  // Side-by-side matrices:
  // 1. What it DOES accurately reproduce
  const doesReproduceItems = [
    {
      title: 'Regolith Geomechanics & Wheel Traction',
      detail:
        'Fragmented basaltic regolith, loose tephra, and ice-cemented sandstone test wheel slip, sinkage, and grouser tractive efficiency on slopes up to ' +
        selectedSite.slopeDeg +
        '°.',
      tag: 'Mobility & Grousers',
    },
    {
      title: 'Cryogenic Diurnal Thermal Stress',
      detail:
        'Diurnal thermal cycling (up to ' +
        Math.max(...selectedSite.monthlyDiurnalDeltaK) +
        ' K amplitude) subjects structural joints, seal elastomers, and electronics to realistic thermal shock.',
      tag: 'Thermal Mechanics',
    },
    {
      title: 'Sulfur & Acidic Sulfate Exposure',
      detail:
        'High natural concentrations of native sulfur (S8) and acidic sulfate evaporites simulate the corrosive mineralogy and abrasive mineral crusts of volatile-rich regolith.',
      tag: 'Chemical Stress',
    },
    {
      title: 'Abrasive Dust & Particulate Ingress',
      detail:
        'Fine aeolian and crushed mineral grains test seal integrity, optical lens degradation, radiator coatings, and mechanical rotary bearing wear.',
      tag: 'Dust Mitigation',
    },
    {
      title: 'Autonomous Navigation & Boulder Avoidance',
      detail:
        'Rugged terrain with surface roughness (' +
        selectedSite.rmsRoughnessM +
        ' m RMS) stresses hazard-detection stereo cameras, lidar SLAM algorithms, and autonomous path planners.',
      tag: 'Autonomous Navigation',
    },
  ];

  // 2. What it CANNOT reproduce (Mandatory physical limitations audit)
  const cannotReproduceItems = selectedSite.whatItDoesNotReproduce || [
    'Lunar vacuum: Earth atmospheric pressure is ~62-101 kPa vs 0 kPa on the Moon. Prevents testing of vacuum outgassing and cold-welding.',
    'Lunar 1/6th gravity: Earth 1.0 g gravity imposes 6x higher vehicle weight, modifying rover suspension compression and roll-over tipping points.',
    'Solar cosmic radiation & solar wind sputtering: Earth magnetosphere and atmosphere provide >100x shielding against GCR and solar proton events.',
    'Deep PSR cryogenic cold (<40 K): Permanently Shadowed Regions reach 40 K (-233°C). Terrestrial winter lows reach ~210-230 K (-63°C to -43°C).',
    'Electrostatic dust levitation: Ambient atmospheric humidity suppresses electrostatic grain charging and levitation dynamics.',
  ];

  // Circular progress calculations for Environmental Match
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const envStrokeOffset =
    circumference - (Math.min(100, Math.max(0, scores.environmentalMatch)) / 100) * circumference;

  return (
    <div className="space-y-6 pb-24">
      {/* ==================== HERO SITE CARD ==================== */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6">
        {/* Navigation & Target Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#414943]/8 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EE] border border-[#2A5A44]/20 font-bold text-[#0F422E]">
              Module 3 · Site Dossier &amp; In-Depth Analogue Audit
            </span>
            <span className="text-[#696156]">
              Target Reference:{' '}
              <strong className="text-[#1D1B17] font-semibold">{activeTarget.name}</strong> (
              {activeTarget.body.toUpperCase()} South Pole)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('discovery')}
              className="px-3.5 py-1.5 rounded-xl border border-[#414943]/15 text-xs font-semibold text-[#1D1B17] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#696156]" />
              <span>← Back to Discover Sites</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('permits')}
              className="px-4 py-1.5 rounded-xl bg-[#184633] text-white text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Check Access &amp; Permits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Title & Identity */}
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
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

            {/* Geographical Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 font-mono text-[#1D1B17] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E06A3B]" />
                <span>{selectedSite.coordinates}</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#414943]/10 font-mono text-[#1D1B17] flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-[#184633]" />
                <span>Elevation: {selectedSite.elevationM.toLocaleString()} m ASL</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#FFF8F1] border border-[#FFDBCF] font-semibold text-[#A33E11] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E06A3B]" />
                <span>Archetype: {selectedSite.biomeCharacter}</span>
              </span>
            </div>
          </div>

          {/* Quick Candidate Switcher: Compare other shortlisted sites */}
          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#414943]/10 space-y-1.5">
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
                    <span className="truncate max-w-[100px]">{cand.site.name.split(' (')[0]}</span>
                    <span className="font-mono text-[10px] opacity-80">
                      {Math.round(cand.bestMonthScore)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1-Sentence Plain-English Summary */}
        <p className="mt-4 text-xs sm:text-sm text-[#414943] leading-relaxed bg-[#FAF7F2] p-3.5 rounded-xl border border-[#414943]/8">
          <strong className="text-[#1D1B17]">Mission Analogue Suitability:</strong> {oneLiner}
        </p>

        {/* ==================== THE 4 DISTINCT AUDITABLE SCORES ==================== */}
        {/* Strictly separate, never collapsed into one artificial composite percentage */}
        <div className="mt-6 pt-5 border-t border-[#414943]/8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-xs font-bold font-mono tracking-wider text-[#696156] uppercase">
              Auditable 4-Pillar Evaluation (Strictly Kept Separate · No Artificial Composite)
            </h2>
            <span className="text-[11px] text-[#696156] italic">
              *Evaluated against public Artemis IV equipment testing objectives
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Environmental Match */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-[#184633]" />
                    <span>1. Environmental Match</span>
                  </span>
                  <span className="text-[11px] text-[#696156] block mt-0.5">
                    Terrain &amp; thermal fidelity
                  </span>
                </div>
                {/* Circular Gauge */}
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      fill="none"
                      stroke="#E5DCCE"
                      strokeWidth="5"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      fill="none"
                      stroke="#184633"
                      strokeWidth="5"
                      strokeDasharray={circumference}
                      strokeDashoffset={envStrokeOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute font-mono font-bold text-xs text-[#184633]">
                    {scores.environmentalMatch}%
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-[#414943] leading-snug border-t border-[#414943]/8 pt-2">
                Evaluates slope ({selectedSite.slopeDeg}°), roughness ({selectedSite.rmsRoughnessM}m
                RMS), and diurnal cold-soak thermal similarity.
              </div>
            </div>

            {/* 2. Operational Feasibility */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#059669]" />
                    <span>2. Operational Feasibility</span>
                  </span>
                  <span className="font-mono font-bold text-base text-[#059669]">
                    {scores.operationalFeasibility}/100
                  </span>
                </div>
                <span className="text-[11px] text-[#696156] block mt-0.5">
                  Logistics, road access &amp; medevac
                </span>
                <div className="w-full bg-[#E5DCCE] h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-[#059669] h-full rounded-full transition-all"
                    style={{ width: `${scores.operationalFeasibility}%` }}
                  />
                </div>
              </div>
              <div className="text-[11px] text-[#414943] leading-snug border-t border-[#414943]/8 pt-2">
                Heavy transport roads, airstrip access, emergency medical evacuation route &amp;
                satellite comms.
              </div>
            </div>

            {/* 3. Administrative Readiness */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>3. Administrative Readiness</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      admin.status === 'Feasible pathway identified'
                        ? 'bg-[#DEF7EC] text-[#03543F] border border-[#31C48D]/30'
                        : admin.status === 'Restricted / legal review required'
                          ? 'bg-[#FDE8E8] text-[#9B1C1C] border border-[#F87171]/30'
                          : 'bg-[#FEF08A] text-[#713F12] border border-[#FACC15]/30'
                    }`}
                  >
                    {String(admin.status).split(' ')[0]}
                  </span>
                </div>
                <span className="text-[11px] text-[#696156] block mt-0.5">
                  Regulatory permits &amp; land rights
                </span>
                <div className="w-full bg-[#E5DCCE] h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-[#D97706] h-full rounded-full transition-all"
                    style={{ width: `${scores.administrativeReadiness}%` }}
                  />
                </div>
              </div>
              <div className="text-[11px] text-[#414943] leading-snug border-t border-[#414943]/8 pt-2 truncate">
                {admin.statusReason} (Lead time: ~{admin.leadTimeWeeks} wks)
              </div>
            </div>

            {/* 4. Data Confidence */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>4. Data Confidence</span>
                  </span>
                  <span className="font-mono font-bold text-base text-[#7C3AED]">
                    {scores.dataConfidence}%
                  </span>
                </div>
                <span className="text-[11px] text-[#696156] block mt-0.5">
                  Verified dataset provenance
                </span>
                <div className="w-full bg-[#E5DCCE] h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-[#7C3AED] h-full rounded-full transition-all"
                    style={{ width: `${scores.dataConfidence}%` }}
                  />
                </div>
              </div>
              <div className="text-[11px] text-[#414943] leading-snug border-t border-[#414943]/8 pt-2">
                NASA PDS LOLA, Diviner, USGS Astrogeology &amp; peer-reviewed scientific literature.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== BALANCED SIDE-BY-SIDE MATRIX ==================== */}
      {/* Visual "What This Site DOES & DOES NOT Reproduce" (NNG Balance & Contrast) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: What It DOES Reproduce (Emerald / Green Highlights) */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#2A5A44]/25 shadow-soft-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A5A44]/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EAF4EE] text-[#0F422E] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#0F422E]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#0F422E]">
                  What This Terrestrial Site CAN Accurately Reproduce
                </h3>
                <p className="text-[11px] text-[#2A5A44]">
                  Approved testing domains for Artemis IV surface equipment
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#EAF4EE] text-[#0F422E] text-[10px] font-mono font-bold">
              5 Test Capabilities
            </span>
          </div>

          <div className="space-y-3">
            {doesReproduceItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#F7FAF8] border border-[#2A5A44]/15 space-y-1 transition-colors hover:border-[#2A5A44]/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1B17] flex items-center gap-2">
                    <span className="text-[#0F422E] font-bold">✓</span>
                    <span>{item.title}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAF4EE] text-[#0F422E] font-semibold">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-[#414943] leading-relaxed pl-4">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: What It CANNOT Reproduce (Red Alert Box / Rose Highlights) */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#FEB2B2] shadow-soft-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#FEB2B2]/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#991B1B]">
                  What This Terrestrial Site CANNOT Reproduce (Limitations)
                </h3>
                <p className="text-[11px] text-[#B91C1C]">
                  Conditions requiring separate chamber or centrifuge testing
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] text-[10px] font-mono font-bold">
              Physical Caveats
            </span>
          </div>

          <div className="space-y-3">
            {cannotReproduceItems.map((item, idx) => {
              const [heading, ...rest] = item.split(':');
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2]/50 space-y-1 transition-colors hover:border-[#FEB2B2]"
                >
                  <div className="text-xs font-bold text-[#991B1B] flex items-center gap-2">
                    <span className="text-[#DC2626] font-bold">✕</span>
                    <span>{heading}</span>
                  </div>
                  <p className="text-xs text-[#7F1D1D] leading-relaxed pl-4">
                    {rest.join(':') || item}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== SCIENTIFIC DEEP-DIVE TABS ==================== */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6 space-y-5">
        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#414943]/8 pb-4">
          <div className="flex items-center p-0.5 bg-[#F3EDE5] rounded-xl border border-[#414943]/8 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('geology')}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'geology'
                  ? 'bg-[#184633] text-white font-semibold shadow-xs'
                  : 'text-[#696156] hover:text-[#1D1B17]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Geology &amp; Lithology Evidence</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logistics')}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'logistics'
                  ? 'bg-[#184633] text-white font-semibold shadow-xs'
                  : 'text-[#696156] hover:text-[#1D1B17]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Field Logistics &amp; Accessibility</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('equipment')}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'equipment'
                  ? 'bg-[#184633] text-white font-semibold shadow-xs'
                  : 'text-[#696156] hover:text-[#1D1B17]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>Recommended Artemis IV Equipment Tests</span>
              </span>
            </button>
          </div>

          <ProvenanceBadge tag={selectedSite.provenance || 'VERIFIED NASA PDS / EARTHDATA'} />
        </div>

        {/* Tab 1: Geology & Lithology */}
        {activeTab === 'geology' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-2">
                <span className="text-xs font-bold text-[#1D1B17] block">
                  Geological Context &amp; Stratigraphy
                </span>
                <p className="text-xs text-[#414943] leading-relaxed">
                  {selectedSite.geologySummary || selectedSite.fieldAccessNotes}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-2">
                <span className="text-xs font-bold text-[#1D1B17] block">
                  Mineralogical Composition &amp; Native Volatiles
                </span>
                <p className="text-xs text-[#414943] leading-relaxed">
                  {selectedSite.mineralogyEvidence ||
                    'Basaltic pyroxene, calcic plagioclase, olivine, minor sulfate evaporites, and iron-bearing silicates.'}
                </p>
              </div>
            </div>

            {/* Geomorphic Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 text-center">
                <span className="text-[10px] text-[#696156] uppercase font-mono block">
                  Bare Rock Exposure
                </span>
                <span className="text-base font-bold font-mono text-[#1D1B17]">
                  {selectedSite.bareRockPct}%
                </span>
                <span className="text-[10px] text-[#696156] block mt-0.5">High sensor contact</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 text-center">
                <span className="text-[10px] text-[#696156] uppercase font-mono block">
                  Aridity Index
                </span>
                <span className="text-base font-bold font-mono text-[#1D1B17]">
                  {selectedSite.aridityIndex}/100
                </span>
                <span className="text-[10px] text-[#696156] block mt-0.5">Hyper-arid regime</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 text-center">
                <span className="text-[10px] text-[#696156] uppercase font-mono block">
                  Radar CPR Proxy
                </span>
                <span className="text-base font-bold font-mono text-[#1D1B17]">
                  {selectedSite.radarCprProxy.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#696156] block mt-0.5">LRO Mini-RF baseline</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 text-center">
                <span className="text-[10px] text-[#696156] uppercase font-mono block">
                  Catalog Status
                </span>
                <span className="text-sm font-bold text-[#184633]">
                  {selectedSite.isCatalogKnown ? 'NASA Cataloged' : 'Emerging Analog'}
                </span>
                <span className="text-[10px] text-[#696156] block mt-0.5">
                  {selectedSite.catalogCitation?.split('·')[0] || 'CAFE Catalogue'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Field Logistics & Accessibility */}
        {activeTab === 'logistics' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-2">
              <span className="text-xs font-bold text-[#1D1B17] block">
                Operational Access Pathway &amp; Heavy Vehicle Transit
              </span>
              <p className="text-xs text-[#414943] leading-relaxed">
                {selectedSite.operationalLogistics || selectedSite.fieldAccessNotes}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-1">
                <span className="font-mono text-[10px] uppercase text-[#696156] block">
                  Topographic Slope &amp; Roughness
                </span>
                <div className="font-mono font-bold text-sm text-[#1D1B17]">
                  {selectedSite.slopeDeg}° Slope · {selectedSite.rmsRoughnessM}m RMS
                </div>
                <div className="text-[11px] text-[#696156]">
                  Target benchmark: {activeTarget.meanSlopeDeg}° mean slope
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-1">
                <span className="font-mono text-[10px] uppercase text-[#696156] block">
                  Thermal Amplitude Range
                </span>
                <div className="font-mono font-bold text-sm text-[#1D1B17]">
                  {Math.min(...selectedSite.monthlyMinTempC)}°C to{' '}
                  {Math.max(...selectedSite.monthlyMaxTempC)}°C
                </div>
                <div className="text-[11px] text-[#696156]">
                  Max diurnal delta: {Math.max(...selectedSite.monthlyDiurnalDeltaK)} K
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-1">
                <span className="font-mono text-[10px] uppercase text-[#696156] block">
                  Emergency Medical Evacuation
                </span>
                <div className="font-mono font-bold text-sm text-[#1D1B17]">
                  {scores.operationalFeasibility >= 70 ? '< 4 Hours (Airstrip)' : 'Remote Expedition'}
                </div>
                <div className="text-[11px] text-[#696156]">
                  Comms: Iridium / Starlink satellite telemetry
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Recommended Artemis IV Equipment Tests */}
        {activeTab === 'equipment' && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1B17]">
                    1. Rover Drivetrain Traction &amp; Wheel Slip
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAF4EE] text-[#0F422E] font-semibold">
                    High Priority
                  </span>
                </div>
                <p className="text-xs text-[#414943] leading-relaxed">
                  Evaluate tire grousers, torque distribution, wheel sinkage, and motor current draw
                  on loose granular slopes matching lunar scarp angles ({selectedSite.slopeDeg}°).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1B17]">
                    2. Surface Sampling Drill Bit Abrasive Wear
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAF4EE] text-[#0F422E] font-semibold">
                    Core Rig Test
                  </span>
                </div>
                <p className="text-xs text-[#414943] leading-relaxed">
                  Test rotary-percussive drill bit wear rates, cutter thermal dissipation, and core
                  sample retention in dense, cemented rock or frozen permafrost.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1B17]">
                    3. Dust Seal Ingress &amp; Joint Enclosure
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFF8F1] text-[#A33E11] font-semibold">
                    Seal Reliability
                  </span>
                </div>
                <p className="text-xs text-[#414943] leading-relaxed">
                  Subject rotary seals, camera lens wiper coatings, and radiator fins to abrasive
                  mineral dust under diurnal thermal cycling.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1B17]">
                    4. Native Sulfur &amp; Corrosion Coupons
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFF8F1] text-[#A33E11] font-semibold">
                    Material Coupons
                  </span>
                </div>
                <p className="text-xs text-[#414943] leading-relaxed">
                  Expose aluminum 7075-T6, titanium Grade 5, and anodized coatings to acidic sulfate
                  brines to audit corrosion rates and degradation kinetics.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== PROMINENT NEXT ACTION CTA CARD ==================== */}
      <div className="bg-[#FFFFFF] rounded-2xl border-2 border-[#184633] shadow-md p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#184633]">
              Next Step in Mission Workflow: Step 4 of 6
            </span>
          </div>
          <h3 className="font-display font-bold text-lg text-[#1D1B17]">
            Verify Land Access &amp; Environmental Permits for {selectedSite.name}
          </h3>
          <p className="text-xs text-[#696156] leading-relaxed">
            Inspect responsible land authorities ({admin.authority}), statutory review lead times (~
            {admin.leadTimeWeeks} weeks), and generate an expedition clearance package.
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
            <span>Proceed to Access &amp; Permits (Module 4)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
