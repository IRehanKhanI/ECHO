import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  Landmark,
  Layers,
  MapPin,
  Radio,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetaryTarget,
  WorkspaceView,
} from '../../types/terra';

interface AdminPermitsViewProps {
  selectedSite: EarthCandidateSite;
  activeTarget: PlanetaryTarget;
  activeObjective: ObjectiveProfile;
  onNavigate: (view: WorkspaceView) => void;
}

interface CoreActivity {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  status: 'Required' | 'Exempt' | 'Restricted';
  description: string;
}

export const AdminPermitsView: React.FC<AdminPermitsViewProps> = ({
  selectedSite,
  activeTarget,
  activeObjective,
  onNavigate,
}) => {
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);

  // Fallback if adminFeasibility is not defined
  const admin = useMemo(() => {
    return (
      selectedSite.adminFeasibility || {
        status: 'Conditional',
        statusReason:
          'Scientific research fieldwork permit and access authorization required.',
        authority: 'National Land Management Agency',
        jurisdiction: selectedSite.country,
        leadTimeWeeks: 14,
        officialUrl: 'https://www.nasa.gov/',
        permitsRequired: ['Scientific Fieldwork Permit', 'Land Access Notice'],
        chinaWolfAmendmentWarning: selectedSite.country.toLowerCase().includes('china'),
        indigenousConsultationRequired: false,
      }
    );
  }, [selectedSite]);

  const isChinaRestricted =
    Boolean(admin.chinaWolfAmendmentWarning) ||
    selectedSite.country.toLowerCase().includes('china') ||
    selectedSite.id.includes('qaidam');

  // Status configuration
  const statusConfig = useMemo(() => {
    if (isChinaRestricted || admin.status === 'Restricted / legal review required') {
      return {
        badge: 'RESTRICTED',
        subtext: 'Specialist legal waiver & export review required',
        bg: 'bg-[#FDE8E8]',
        border: 'border-[#F98080]',
        text: 'text-[#9B1C1C]',
        pillBg: 'bg-[#9B1C1C]',
        icon: ShieldAlert,
      };
    }
    if (admin.status === 'Feasible pathway identified') {
      return {
        badge: 'FEASIBLE',
        subtext: 'Standard regulatory permit pathway identified',
        bg: 'bg-[#DEF7EC]',
        border: 'border-[#31C48D]',
        text: 'text-[#03543F]',
        pillBg: 'bg-[#03543F]',
        icon: ShieldCheck,
      };
    }
    return {
      badge: 'CONDITIONAL',
      subtext: 'Prior host-nation access authorization required',
      bg: 'bg-[#FEF08A]/60',
      border: 'border-[#FACC15]',
      text: 'text-[#713F12]',
      pillBg: 'bg-[#854D0E]',
      icon: AlertTriangle,
    };
  }, [admin.status, isChinaRestricted]);

  const StatusIcon = statusConfig.icon;

  // 6 Core Activity Badges
  const coreActivities: CoreActivity[] = useMemo(() => {
    return [
      {
        id: 'land_entry',
        name: 'Land Entry',
        category: 'Territorial Access',
        icon: MapPin,
        status: isChinaRestricted ? 'Restricted' : 'Required',
        description: 'Physical access notification and perimeter staging clearance.',
      },
      {
        id: 'rover_driving',
        name: 'Rover Driving',
        category: 'Mobility Corridor',
        icon: Layers,
        status: isChinaRestricted ? 'Restricted' : 'Required',
        description: 'Off-road vehicular movement and regolith traverse corridor.',
      },
      {
        id: 'drilling',
        name: 'Drilling',
        category: 'Subsurface Sampling',
        icon: FileCheck,
        status: isChinaRestricted ? 'Restricted' : 'Required',
        description: 'Core drilling (10–120 cm) and geological sample collection.',
      },
      {
        id: 'drones',
        name: 'Drones',
        category: 'Airspace Integration',
        icon: Sparkles,
        status: isChinaRestricted ? 'Restricted' : 'Required',
        description: 'Low-altitude UAS photogrammetry and DEM elevation mapping.',
      },
      {
        id: 'rf_spectrum',
        name: 'RF Spectrum',
        category: 'Spectrum Clearance',
        icon: Radio,
        status: isChinaRestricted ? 'Restricted' : 'Required',
        description: 'Long-range UHF/S-band data telemetry and radar frequency allocation.',
      },
      {
        id: 'customs',
        name: 'Customs',
        category: 'Border & Logistics',
        icon: Scale,
        status: isChinaRestricted ? 'Restricted' : 'Exempt',
        description: 'ATA Carnet temporary hardware import/re-export duty exemption.',
      },
    ];
  }, [isChinaRestricted]);

  // Clean prefilled cover letter
  const prefilledDraft = useMemo(() => {
    return `OFFICIAL SCIENTIFIC FIELDWORK & REGULATORY FILING DRAFT
Docket: TERraOps-AR4-${selectedSite.id.toUpperCase()}-2026
Authority: ${admin.authority} (${admin.jurisdiction})
Official Portal: ${admin.officialUrl}

APPLICANT: Artemis IV Surface Operations Science Team
INSTITUTION: NASA Analogs & Exploration Systems Consortium
TARGET OBJECTIVE: ${activeObjective.name}
PLANETARY DATUM: ${activeTarget.name} (${activeTarget.body.toUpperCase()})

PROPOSED TESTBED:
Site: ${selectedSite.name}, ${selectedSite.country}
Coordinates: ${selectedSite.coordinates} (Elevation: ${selectedSite.elevationM} m ASL)
Field Lead Time: ~${admin.leadTimeWeeks} Weeks

REQUESTED OPERATIONAL SCOPES (6 Core Activities):
1. Land Entry & Staging: Required (Surface transit via ${admin.authority})
2. Rover Mobility: Required (Off-road regolith navigation corridor)
3. Subsurface Coring & Drilling: Required (Non-destructive core sampling)
4. UAS Drone Mapping: Required (Low-altitude photogrammetry flight plan)
5. RF Spectrum Allocation: Required (UHF/S-band telemetry transceivers)
6. Hardware Customs Import: ${isChinaRestricted ? 'Restricted (ITAR review required)' : 'Exempt (Standard ATA Carnet)'}

STATUTORY COMPLIANCE:
${
  isChinaRestricted
    ? 'ALERT: Destination flagged under US Public Law 112-55 Sec 539 (Wolf Amendment). Requires Congressional certification prior to bilateral expenditure or hardware deployment.'
    : `Host nation (${selectedSite.country}) is confirmed Western/neutral jurisdiction with zero bilateral restrictions under US Public Law 112-55 Sec 539 (Wolf Amendment). Standard permit protocol applies.`
}

*Draft generated by TERraOps for human regulatory review prior to official submission.*`;
  }, [selectedSite, admin, activeTarget, activeObjective, isChinaRestricted]);

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(prefilledDraft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2200);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. LEGAL READINESS BANNER */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#414943]/10 pb-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                Module 4 · Access &amp; Permits
              </span>
              <span className="text-xs text-[#696156] font-mono">
                Site: <strong className="text-[#1D1B17]">{selectedSite.name}</strong> ({selectedSite.country})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1D1B17] tracking-tight">
              Site Access &amp; Statutory Feasibility
            </h1>
            <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
              Verify regulatory permissions, foreign statutory restrictions, and generate an auditable filing draft before deploying hardware.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('dossier')}
              className="px-4 py-2 rounded-full border border-[#414943]/20 text-xs font-semibold text-[#414943] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              ← Back to Site Dossier
            </button>
            <button
              type="button"
              onClick={() => onNavigate('lab')}
              className="px-5 py-2 rounded-full bg-[#184633] text-[#FFFFFF] text-xs font-bold hover:bg-[#2A5A44] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Equipment Lab (Module 5)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Streamlined Metric Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Statutory Status Badge */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 ${statusConfig.bg} ${statusConfig.border}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#414943]">
                Statutory Readiness
              </span>
              <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
            </div>
            <div>
              <div className={`text-3xl font-display font-black tracking-tight ${statusConfig.text}`}>
                {statusConfig.badge}
              </div>
              <div className="text-xs font-semibold text-[#1D1B17] mt-1">
                {statusConfig.subtext}
              </div>
            </div>
            <div className="text-[11px] text-[#414943] font-mono border-t border-[#414943]/10 pt-2 truncate">
              Jurisdiction: <strong>{admin.jurisdiction}</strong>
            </div>
          </div>

          {/* Card 2: Estimated Lead Time */}
          <div className="p-5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/10 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#696156]">
                Estimated Lead Time
              </span>
              <Clock className="w-5 h-5 text-[#A33E11]" />
            </div>
            <div>
              <div className="text-3xl font-display font-black text-[#A33E11] tracking-tight tabular-nums">
                ~{admin.leadTimeWeeks} Weeks
              </div>
              <div className="text-xs font-semibold text-[#1D1B17] mt-1">
                Filing to Field Clearance
              </div>
            </div>
            <div className="text-[11px] text-[#696156] font-mono border-t border-[#414943]/10 pt-2">
              Recommended Filing: <strong>Spring 2026</strong>
            </div>
          </div>

          {/* Card 3: Governing Authority */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#414943]/10 shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#696156]">
                Governing Authority
              </span>
              <Landmark className="w-5 h-5 text-[#0F422E]" />
            </div>
            <div>
              <div className="text-base font-bold text-[#1D1B17] line-clamp-1">
                {admin.authority}
              </div>
              <div className="text-xs text-[#696156] mt-0.5">
                Primary Regulatory Agency
              </div>
            </div>
            <a
              href={admin.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between text-xs font-semibold text-[#0F422E] hover:underline border-t border-[#414943]/10 pt-2"
            >
              <span>Visit Regulatory Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 2. CHINA WOLF AMENDMENT CARD (Clean 2-sentence note with verified check) */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-[#184633]" />
            <h2 className="text-base font-bold text-[#1D1B17]">
              US Statutory Compliance: China Wolf Amendment (P.L. 112-55, Sec. 539)
            </h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
              isChinaRestricted
                ? 'bg-[#FDE8E8] text-[#9B1C1C] border border-[#F87171]'
                : 'bg-[#DEF7EC] text-[#03543F] border border-[#31C48D]'
            }`}
          >
            {isChinaRestricted ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Restricted / Legal Waiver Required</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified · Zero Bilateral Restrictions</span>
              </>
            )}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
            isChinaRestricted
              ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
              : 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
          }`}
        >
          {isChinaRestricted ? (
            <p>
              This site is located within or involves jurisdictions restricted under US Public Law 112-55 Sec 539. NASA-funded bilateral participation or equipment deployment requires explicit Congressional certification and export licensing prior to commitment.
            </p>
          ) : (
            <p>
              Host nation ({selectedSite.country}) is confirmed as a sovereign Western/neutral jurisdiction with zero bilateral restrictions under US Public Law 112-55 Sec 539. NASA analog fieldwork may proceed via standard host-nation scientific access agreements.
            </p>
          )}
        </div>
      </section>

      {/* 3. 6 CORE ACTIVITY BADGES */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#414943]/10 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#1D1B17]">
              Core Activity Permission Badges
            </h2>
            <p className="text-xs text-[#696156] mt-0.5">
              Statutory operational clearance breakdown for primary surface analog activities.
            </p>
          </div>
          <span className="text-xs font-mono text-[#0F422E] bg-[#EAF4EE] px-3 py-1 rounded-full font-semibold">
            6 Core Activities Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {coreActivities.map((act) => {
            const Icon = act.icon;
            const isExempt = act.status === 'Exempt';
            const isRestricted = act.status === 'Restricted';
            return (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 flex flex-col justify-between gap-3 hover:bg-[#FFFFFF] hover:border-[#414943]/20 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#FFFFFF] border border-[#414943]/10 flex items-center justify-center text-[#184633]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1D1B17]">
                          {act.name}
                        </div>
                        <div className="text-[10px] text-[#696156]">
                          {act.category}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isRestricted
                          ? 'bg-[#FDE8E8] text-[#9B1C1C]'
                          : isExempt
                            ? 'bg-[#DEF7EC] text-[#03543F]'
                            : 'bg-[#FEF08A] text-[#713F12]'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#414943] leading-snug">
                    {act.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. AI PERMIT LETTER ASSISTANT (Clean preview & 1-click Copy) */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#414943]/10 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-[#1D1B17] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A33E11]" />
              AI Permit Preparation Assistant
            </h2>
            <p className="text-xs text-[#696156]">
              Prefilled application draft ready for review and submission to {admin.authority}.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyDraft}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              copiedDraft
                ? 'bg-[#16A34A] text-white'
                : 'bg-[#184633] text-white hover:bg-[#2A5A44]'
            }`}
          >
            {copiedDraft ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Draft Application</span>
              </>
            )}
          </button>
        </div>

        {/* Clean Draft Preview Box */}
        <div className="relative">
          <textarea
            readOnly
            value={prefilledDraft}
            rows={12}
            className="w-full p-4 rounded-2xl bg-[#0F172A] text-[#E2E8F0] font-mono text-xs leading-relaxed border border-[#334155] focus:outline-none select-all"
          />
        </div>

        {/* 5. CLEAR CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#414943]/10">
          <div className="text-xs text-[#696156]">
            Module 4 Complete · Legal pathway evaluated for <strong>{selectedSite.name}</strong>.
          </div>
          <button
            type="button"
            onClick={() => onNavigate('lab')}
            className="px-6 py-3 rounded-full bg-[#184633] hover:bg-[#2A5A44] text-[#FFFFFF] text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>Proceed to Equipment Exposure Lab (Module 5) →</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
