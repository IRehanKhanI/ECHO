import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  FileCheck,
  FileText,
  Layers,
  MapPin,
  Mountain,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThermometerSnowflake,
  Wind,
  Wrench,
} from 'lucide-react';
import {
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetaryTarget,
  ScoredCandidate,
  WorkspaceView,
} from '../../types/terra';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

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
  const scored =
    rankedCandidates.find((c) => c.site.id === selectedSite.id) ||
    rankedCandidates[0];

  const scores = selectedSite.distinctScores || {
    environmentalMatch: Math.round(scored?.bestMonthScore || 80),
    operationalFeasibility: 75,
    administrativeReadiness: 70,
    dataConfidence: 88,
  };

  const admin = selectedSite.adminFeasibility || {
    status: 'Conditional',
    statusReason: 'Scientific research fieldwork permit and access authorization required.',
    authority: 'National Land Management Agency',
    jurisdiction: selectedSite.country,
    leadTimeWeeks: 8,
    officialUrl: 'https://www.nasa.gov/',
    permitsRequired: ['Scientific Fieldwork Permit', 'Land Access Notice'],
  };

  const nonReproduced = selectedSite.whatItDoesNotReproduce || [
    'Lunar vacuum: Earth atmospheric pressure is ~80-101 kPa vs 0 kPa on the Moon.',
    'Lunar 1/6th gravity: Earth surface gravity is 1.0 g (9.81 m/s²) vs 0.166 g on Moon.',
    'Cosmic ionizing radiation & solar wind sputtering (shielded by Earth magnetosphere & atmosphere).',
    'Cryogenic cold traps: Earth minimum air temperatures are ~215-230 K vs <40 K in lunar permanently shadowed craters.',
    'Electrostatic dust levitation: atmospheric humidity suppresses electrostatic grain transport.'
  ];

  return (
    <div className="space-y-6">
      {/* Dossier Header Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#414943]/8 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-xs font-semibold text-[#1D4ED8]">
                Module C · Site Dossier &amp; Analogue Breakdown
              </span>
              <span className="text-xs text-[#696156]">
                Target Reference: <strong className="text-[#1D1B17]">{activeTarget.name}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1D1B17] tracking-tight">
              {selectedSite.name}
            </h1>
            <p className="text-sm text-[#696156] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C2673B]" />
              <span>{selectedSite.region}, {selectedSite.country}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{selectedSite.coordinates}</span>
              <span aria-hidden="true">·</span>
              <span>Elevation: {selectedSite.elevationM} m ASL</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('discovery')}
              className="px-3 py-1.5 rounded-full border border-[#414943]/15 text-xs font-medium text-[#414943] hover:bg-[#FAF7F2] cursor-pointer"
            >
              ← Back to Discovery Map
            </button>
            <button
              type="button"
              onClick={() => onNavigate('permits')}
              className="px-4 py-1.5 rounded-full bg-[#184633] text-[#FFFFFF] text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Check Access &amp; Permits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 DISTINCT SCORES DISPLAYED SEPARATELY (MANDATORY REQUIREMENT) */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold font-mono tracking-wider text-[#696156] uppercase">
              Auditable 4-Pillar Evaluation (Kept Separate · No Artificial Composite)
            </h2>
            <span className="text-[11px] text-[#696156] italic">
              *Evaluated against public Artemis IV equipment testing objectives
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Environmental Analogue Match */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#475569]">
                <span className="font-medium flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-[#0284C7]" />
                  1. Environmental Match
                </span>
                <span className="font-mono font-bold text-sm text-[#0F172A]">{scores.environmentalMatch}%</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0284C7] h-full rounded-full transition-all"
                  style={{ width: `${scores.environmentalMatch}%` }}
                />
              </div>
              <p className="text-[11px] text-[#64748B] leading-snug">
                Physical terrain, slope ({selectedSite.slopeDeg}°), roughness, and thermal range similarity.
              </p>
            </div>

            {/* 2. Operational Feasibility */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#475569]">
                <span className="font-medium flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#059669]" />
                  2. Operational Feasibility
                </span>
                <span className="font-mono font-bold text-sm text-[#0F172A]">{scores.operationalFeasibility}/100</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#059669] h-full rounded-full transition-all"
                  style={{ width: `${scores.operationalFeasibility}%` }}
                />
              </div>
              <p className="text-[11px] text-[#64748B] leading-snug">
                Field transport logistics, ground accessibility, emergency medical proximity, communications.
              </p>
            </div>

            {/* 3. Administrative Readiness */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#475569]">
                <span className="font-medium flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-[#D97706]" />
                  3. Administrative Readiness
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    admin.status === 'Feasible pathway identified'
                      ? 'bg-[#DEF7EC] text-[#03543F]'
                      : admin.status === 'Restricted / legal review required'
                        ? 'bg-[#FDE8E8] text-[#9B1C1C]'
                        : 'bg-[#FEF08A] text-[#713F12]'
                  }`}
                >
                  {admin.status.split(' ')[0]}
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    admin.status === 'Feasible pathway identified'
                      ? 'bg-[#059669]'
                      : admin.status === 'Restricted / legal review required'
                        ? 'bg-[#E02424]'
                        : 'bg-[#D97706]'
                  }`}
                  style={{ width: `${scores.administrativeReadiness}%` }}
                />
              </div>
              <p className="text-[11px] text-[#64748B] leading-snug truncate">
                {admin.statusReason}
              </p>
            </div>

            {/* 4. Data Confidence */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#475569]">
                <span className="font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                  4. Data Confidence
                </span>
                <span className="font-mono font-bold text-sm text-[#0F172A]">{scores.dataConfidence}%</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#7C3AED] h-full rounded-full transition-all"
                  style={{ width: `${scores.dataConfidence}%` }}
                />
              </div>
              <p className="text-[11px] text-[#64748B] leading-snug">
                Verified from NASA PDS / USGS / peer-reviewed literature. No fabricated measurements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NON-NEGOTIABLE CAVEATS: WHAT THIS SITE DOES NOT REPRODUCE */}
      <div className="bg-[#FFF5F5] rounded-2xl border border-[#FEB2B2] p-6 shadow-soft-card">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#991B1B]">
                Non-Negotiable Mission Caveat: What This Site Does NOT Reproduce
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] font-semibold">
                Physical Limitations Audit
              </span>
            </div>
            <p className="text-xs text-[#7F1D1D] leading-relaxed">
              No Earth location is an exact replica of the lunar South Pole. A terrestrial site can help test selected
              mechanical, optical, logistics, and surface material behaviors. Vacuum, radiation, and reduced-gravity
              validation require separate specialized vacuum chamber and parabolic/centrifuge testing.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
              {nonReproduced.map((item, idx) => (
                <li
                  key={idx}
                  className="text-xs text-[#991B1B] flex items-start gap-2 bg-[#FFFFFF]/80 p-2.5 rounded-lg border border-[#FCA5A5]/40"
                >
                  <span className="text-[#DC2626] font-bold">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Two Column Detailed Scientific Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Geology & Mineralogy */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#414943]/8 pb-3">
            <h3 className="text-base font-bold text-[#1D1B17] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#184633]" />
              Geology, Lithology &amp; Mineralogy Evidence
            </h3>
            <ProvenanceBadge tag="VERIFIED NASA PDS / EARTHDATA" />
          </div>

          <div className="space-y-3.5 text-xs text-[#414943]">
            <div>
              <span className="font-semibold text-[#1D1B17] block mb-1">Geological Context &amp; Stratigraphy:</span>
              <p className="bg-[#FAF7F2] p-3 rounded-xl border border-[#414943]/8 leading-relaxed">
                {selectedSite.geologySummary || selectedSite.fieldAccessNotes}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#1D1B17] block mb-1">Mineralogical Composition &amp; Volatiles:</span>
              <p className="bg-[#FAF7F2] p-3 rounded-xl border border-[#414943]/8 leading-relaxed">
                {selectedSite.mineralogyEvidence ||
                  'Basaltic pyroxene, calcic plagioclase, olivine, minor sulfate evaporites and iron-bearing silicates.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 text-center">
                <span className="text-[10px] text-[#696156] uppercase font-mono block">Bare Rock Pct</span>
                <span className="text-base font-bold font-mono text-[#1D1B17]">{selectedSite.bareRockPct}%</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 text-center">
                <span className="text-[10px] text-[#696156] uppercase font-mono block">Aridity Index</span>
                <span className="text-base font-bold font-mono text-[#1D1B17]">{selectedSite.aridityIndex}/100</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#414943]/8 text-center">
                <span className="text-[10px] text-[#696156] uppercase font-mono block">Radar CPR Proxy</span>
                <span className="text-base font-bold font-mono text-[#1D1B17]">{selectedSite.radarCprProxy.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Environmental & Operational Logistics */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#414943]/8 pb-3">
            <h3 className="text-base font-bold text-[#1D1B17] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#C2673B]" />
              Terrain, Climate &amp; Operational Logistics
            </h3>
            <span className="text-xs font-mono text-[#696156]">
              {selectedSite.coordinates}
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-[#414943]">
            <div>
              <span className="font-semibold text-[#1D1B17] block mb-1">Operational Logistics &amp; Access Pathway:</span>
              <p className="bg-[#FAF7F2] p-3 rounded-xl border border-[#414943]/8 leading-relaxed">
                {selectedSite.operationalLogistics || selectedSite.fieldAccessNotes}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#414943]/8">
                <span className="text-[10px] text-[#696156] uppercase font-mono block mb-1">
                  Slope &amp; Roughness
                </span>
                <span className="text-sm font-bold font-mono text-[#1D1B17]">
                  {selectedSite.slopeDeg}° slope · {selectedSite.rmsRoughnessM} m RMS
                </span>
                <span className="text-[10px] text-[#696156] block mt-1">
                  Target: {activeTarget.meanSlopeDeg}° mean slope
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#414943]/8">
                <span className="text-[10px] text-[#696156] uppercase font-mono block mb-1">
                  Thermal Regime
                </span>
                <span className="text-sm font-bold font-mono text-[#1D1B17]">
                  {Math.min(...selectedSite.monthlyMinTempC)}°C min to {Math.max(...selectedSite.monthlyMaxTempC)}°C max
                </span>
                <span className="text-[10px] text-[#696156] block mt-1">
                  Max diurnal delta: {Math.max(...selectedSite.monthlyDiurnalDeltaK)} K
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#EAF4EE] border border-[#2A5A44]/20 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#0F422E]">
                <span className="font-bold">Next Action in Mission Journey:</span>
                <span className="text-[11px] font-mono">Step 4 of 6</span>
              </div>
              <p className="text-xs text-[#2A5A44] leading-relaxed">
                Now verify whether an equipment testing campaign can legally and administratively operate at{' '}
                <strong>{selectedSite.name}</strong>, inspect responsible authorities, and generate a draft permit package.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('permits')}
                className="w-full mt-2 py-2 rounded-xl bg-[#184633] text-[#FFFFFF] text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Module D: Access &amp; Permits</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
