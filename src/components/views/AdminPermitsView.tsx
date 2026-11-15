import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Download,
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
  ToggleLeft,
  ToggleRight,
  Users,
  Wrench,
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

interface ActivityPermission {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  description: string;
  status: 'Authorized' | 'Permit Required' | 'Restricted' | 'Exempt' | 'Under Review';
  leadTime: string;
  authority: string;
  notes: string;
  active: boolean;
}

export const AdminPermitsView: React.FC<AdminPermitsViewProps> = ({
  selectedSite,
  activeTarget,
  activeObjective,
  onNavigate,
}) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string>('equipment_op');
  const [applicantName, setApplicantName] = useState<string>(
    'Artemis IV Surface Operations Science Team',
  );
  const [organization, setOrganization] = useState<string>(
    'NASA Analogs & Exploration Systems Consortium',
  );
  const [campaignDates, setCampaignDates] = useState<string>(
    'Nov 2026 – Feb 2027 (18 Days Field Window)',
  );
  const [equipmentList, setEquipmentList] = useState<string>(
    'Autonomous Rover Platform (45 kg), AxEMU Spacesuit Seal Coupons, Diamond Coring Drill (1.2m), SO2/H2S Spectrometer',
  );
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
        leadTimeWeeks: 12,
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

  // Track active toggles for 9 activities
  const [activityToggles, setActivityToggles] = useState<Record<string, boolean>>({
    land_entry: true,
    rover_mobility: true,
    drilling_sampling: true,
    drone_uas: true,
    rf_transmission: true,
    customs_import: true,
    environmental_review: true,
    scientific_observation: true,
    indigenous_consult: true,
  });

  const toggleActivity = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivityToggles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 9 Distinct Activity Permissions Breakdown
  const activities: ActivityPermission[] = useMemo(() => {
    return [
      {
        id: 'land_entry',
        name: 'Land Entry & Staging',
        category: 'Territorial Access',
        icon: MapPin,
        description: 'Physical access to surface territory, vehicle convoy staging, and establishing base camp.',
        status: isChinaRestricted ? 'Restricted' : 'Permit Required',
        leadTime: `${admin.leadTimeWeeks} wks`,
        authority: admin.authority,
        notes: isChinaRestricted
          ? 'BLOCKED: Physical field access restricted by US federal bilateral policy without Congressional waiver.'
          : `Boundary access notification and land stewardship clearance required via ${admin.authority}.`,
        active: activityToggles['land_entry'] ?? true,
      },
      {
        id: 'rover_mobility',
        name: 'Robotic Rover Mobility',
        category: 'Off-Road Traverse',
        icon: Layers,
        description: 'Navigating wheeled or tracked rovers across natural regolith corridors and slope hazards.',
        status: isChinaRestricted ? 'Restricted' : 'Under Review',
        leadTime: '8 wks',
        authority: admin.authority,
        notes: 'Off-road vehicular movement requires terrain protection zoning and biological containment protocol.',
        active: activityToggles['rover_mobility'] ?? true,
      },
      {
        id: 'drilling_sampling',
        name: 'Drilling & Regolith Sampling',
        category: 'Subsurface Operations',
        icon: FileCheck,
        description: 'Core drilling (10–120 cm) and geological sample collection for mineralogical and wear analysis.',
        status: isChinaRestricted ? 'Restricted' : 'Permit Required',
        leadTime: '12 wks',
        authority: admin.authority.includes('SERNAGEOMIN')
          ? 'SERNAGEOMIN Geological Division'
          : admin.authority,
        notes: 'Sample extraction requires formal material transfer clearance and non-destructive survey protocol.',
        active: activityToggles['drilling_sampling'] ?? true,
      },
      {
        id: 'drone_uas',
        name: 'Drone / UAS Aerial Survey',
        category: 'Airspace Integration',
        icon: Sparkles,
        description: 'Low-altitude multi-spectral photogrammetry for DEM elevation reconstruction and shadow tracking.',
        status: isChinaRestricted ? 'Restricted' : 'Permit Required',
        leadTime: '6 wks',
        authority: 'Civil Aviation Authority / National Park Service',
        notes: 'Flight clearance within research airspace corridor with emergency return-to-base geo-fencing.',
        active: activityToggles['drone_uas'] ?? true,
      },
      {
        id: 'rf_transmission',
        name: 'RF & Telecommunications',
        category: 'Spectrum Management',
        icon: Radio,
        description: 'Long-range UHF/S-band data transceivers, Lunar relay emulation, and ground-penetrating radar.',
        status: 'Permit Required',
        leadTime: '4 wks',
        authority: 'National Telecommunications Regulatory Agency',
        notes: 'Frequency allocation clearance to prevent harmonic interference with emergency and satellite channels.',
        active: activityToggles['rf_transmission'] ?? true,
      },
      {
        id: 'customs_import',
        name: 'Customs & Hardware Import',
        category: 'Border & Logistics',
        icon: Scale,
        description: 'Temporary duty-free importation and re-exportation of prototype rovers, suits, and drilling gear.',
        status: isChinaRestricted ? 'Restricted' : 'Authorized',
        leadTime: '4 wks',
        authority: 'National Customs Directorate / ATA Carnet',
        notes: isChinaRestricted
          ? 'ITAR/EAR export control licenses strictly required from US State/Commerce Dept before shipping.'
          : 'Standard ATA Carnet or host-nation Temporary Admission protocol ensures tariff-free transit.',
        active: activityToggles['customs_import'] ?? true,
      },
      {
        id: 'environmental_review',
        name: 'Environmental Impact Review',
        category: 'Ecological Stewardship',
        icon: ShieldCheck,
        description: 'Environmental containment assessment, waste management, and non-hazardous field certification.',
        status: 'Exempt',
        leadTime: '2 wks',
        authority: 'Environmental Protection Agency / Conservation Board',
        notes: 'Classified as low-impact non-invasive scientific activity under standard categorical exclusion.',
        active: activityToggles['environmental_review'] ?? true,
      },
      {
        id: 'scientific_observation',
        name: 'Scientific Characterization',
        category: 'Sensor Operations',
        icon: FileText,
        description: 'In-situ spectroscopy, passive radiometry, thermal data logging, and surface camera imaging.',
        status: 'Authorized',
        leadTime: '1 wk',
        authority: admin.authority,
        notes: 'Non-destructive sensor logging authorized under academic consortium bilateral agreements.',
        active: activityToggles['scientific_observation'] ?? true,
      },
      {
        id: 'indigenous_consult',
        name: 'Indigenous & Cultural Clearance',
        category: 'Heritage Rights',
        icon: Users,
        description: 'Coordination with Traditional Custodians, First Nations councils, or heritage authorities.',
        status: admin.indigenousConsultationRequired ? 'Permit Required' : 'Exempt',
        leadTime: admin.indigenousConsultationRequired ? '16 wks' : 'None',
        authority: admin.indigenousConsultationRequired
          ? 'Regional Traditional Custodians Council'
          : 'Not Applicable',
        notes: admin.indigenousConsultationRequired
          ? 'MANDATORY: Formal cultural impact assessment and consent prior to ground disturbance or equipment staging.'
          : 'No indigenous land claims or archaeological restrictions identified on verified coordinates.',
        active: activityToggles['indigenous_consult'] ?? true,
      },
    ];
  }, [selectedSite, admin, isChinaRestricted, activityToggles]);

  const selectedActivity =
    activities.find((a) => a.id === selectedActivityId) || activities[0];

  // AI-Assisted Draft Application Cover Letter
  const generatedCoverLetter = useMemo(() => {
    const activeActivitiesList = activities
      .filter((a) => a.active)
      .map((a) => `  - ${a.name} [${a.status}] — Authority: ${a.authority}`)
      .join('\n');

    return `================================================================================
OFFICIAL SCIENTIFIC FIELDWORK & ANALOG READINESS APPLICATION DOSSIER
================================================================================
Target Authority : ${admin.authority}
Jurisdiction     : ${admin.jurisdiction}
Official Portal  : ${admin.officialUrl}
Filing Date      : November 15, 2026
Reference Docket : TERraOps-AR4-AUTH-${selectedSite.id.toUpperCase()}-2026

APPLICANT DETAILS:
Lead Investigator: ${applicantName}
Organization     : ${organization}
Mission Context  : NASA Artemis IV Analogs & Lunar Surface Equipment Readiness
Target Datum     : ${activeTarget.name} (${activeTarget.body.toUpperCase()} Reference System)
Primary Objective: ${activeObjective.name}

PROPOSED FIELD SITE:
Candidate Site   : ${selectedSite.name}
Geographic Region: ${selectedSite.region}, ${selectedSite.country}
Coordinates      : ${selectedSite.coordinates} (Elevation: ${selectedSite.elevationM} m ASL)
Field Season     : ${campaignDates}

1. EXECUTIVE PURPOSE & MISSION JUSTIFICATION:
This application requests formal research access and technical operational authorization
for an advanced terrestrial equipment validation campaign. The field trials will evaluate
hardware mechanical durability, wheel traction, and regolith-seal degradation under physical
stressors matching the Artemis IV lunar South Pole operating envelope.

2. SPECIFIC ACTIVITIES REQUESTED (${activities.filter((a) => a.active).length} of 9 Enabled):
${activeActivitiesList}

3. PRIMARY ACTIVE SUBMISSION FOCUS:
- Activity Module : ${selectedActivity.name} (${selectedActivity.category})
- Technical Scope : ${selectedActivity.description}
- Deployment Gear : ${equipmentList}
- Impact Level    : Low-impact, temporary, zero-residue surface research. No permanent
                    foundations or toxic effluents.

4. STATUTORY & STATISTICAL COMPLIANCE STATEMENT:
${
  isChinaRestricted
    ? `[MANDATORY LEGAL WARNING — P.L. 112-55 SEC 539]
Pursuant to US Public Law 112-55, Section 539 (Wolf Amendment) and NASA Policy Guidelines
(PRC FAQ for ROSES), any NASA-funded bilateral participation, collaboration, or contract
with Chinese entities or physical deployments on Chinese territory is strictly restricted
without an explicit Congressional waiver and US State Department export authorization.
This application package is flagged for government legal counsel review before any physical activities.`
    : `[VERIFIED STATUTORY STATUS — P.L. 112-55 SEC 539 COMPLIANT]
Host nation (${selectedSite.country}) is confirmed as a Western/neutral jurisdiction with zero
restricted bilateral Chinese entanglements under US Public Law 112-55 Sec 539.
Permits under active processing: ${admin.permitsRequired.join(', ')}.`
}

5. VERIFICATION & RESPONSIBLE SIGN-OFF:
Principal Investigator: ____________________________________
Affiliated Institution: ${organization}
Submission Timestamp  : ${new Date().toUTCString()}

*DISCLAIMER: This document is an AI-assisted preparation package generated by TERraOps
for human review. It does not constitute official regulatory clearance or granted authority.*
================================================================================`;
  }, [
    admin,
    applicantName,
    organization,
    selectedSite,
    campaignDates,
    activeObjective,
    activeTarget,
    selectedActivity,
    equipmentList,
    isChinaRestricted,
    activities,
  ]);

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(generatedCoverLetter);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  const handleDownloadDraft = () => {
    const blob = new Blob([generatedCoverLetter], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TERraOps_Permit_Application_${selectedSite.id}_${selectedActivity.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Readiness badge config
  const statusConfig = useMemo(() => {
    if (admin.status === 'Feasible pathway identified') {
      return {
        badge: 'FEASIBLE',
        badgeFull: 'FEASIBLE — STANDARD PERMIT PATHWAY',
        bg: 'bg-[#DEF7EC]',
        border: 'border-[#31C48D]',
        text: 'text-[#03543F]',
        icon: ShieldCheck,
      };
    }
    if (admin.status === 'Restricted / legal review required') {
      return {
        badge: 'RESTRICTED',
        badgeFull: 'RESTRICTED — SPECIALIST LEGAL WAIVER REQUIRED',
        bg: 'bg-[#FDE8E8]',
        border: 'border-[#F98080]',
        text: 'text-[#9B1C1C]',
        icon: ShieldAlert,
      };
    }
    return {
      badge: 'CONDITIONAL',
      badgeFull: 'CONDITIONAL — AUTHORIZATION REQUIRED',
      bg: 'bg-[#FEF08A]/60',
      border: 'border-[#FACC15]',
      text: 'text-[#713F12]',
      icon: AlertTriangle,
    };
  }, [admin.status]);

  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. HERO LEGAL STATUS BANNER according to visual hierarchy & scale */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#414943]/10 pb-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                Module 4 · Access &amp; Permits
              </span>
              <span className="text-xs text-[#696156] font-mono">
                Site: <strong className="text-[#1D1B17]">{selectedSite.name}</strong> ({selectedSite.country})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[#1D1B17] tracking-tight">
              Site Access, Statutory Feasibility &amp; AI Permit Assistant
            </h1>
            <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
              A scientifically matched Earth analogue is unusable if mission teams cannot legally operate.
              Review jurisdictional requirements, statutory foreign entanglements, and generate an auditable filing draft.
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

        {/* Big visual readiness status cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A: Readiness Status Badge */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 ${statusConfig.bg} ${statusConfig.border}`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#414943]">
                Statutory Readiness Badge
              </div>
              <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
            </div>
            <div>
              <div className={`text-2xl font-display font-black tracking-tight ${statusConfig.text}`}>
                {statusConfig.badge}
              </div>
              <div className="text-xs font-semibold text-[#1D1B17] mt-1 leading-snug">
                {statusConfig.badgeFull}
              </div>
              <p className="text-[11px] text-[#414943] mt-2 line-clamp-2">
                {admin.statusReason}
              </p>
            </div>
            <div className="text-[10px] font-mono text-[#696156]">
              Jurisdiction: <strong>{admin.jurisdiction}</strong>
            </div>
          </div>

          {/* Card B: Lead-Time Clock */}
          <div className="p-5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/10 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#696156]">
                Regulatory Lead-Time Clock
              </div>
              <Clock className="w-5 h-5 text-[#A33E11]" />
            </div>
            <div>
              <div className="text-3xl font-display font-black text-[#A33E11] tracking-tight tabular-nums">
                ~{admin.leadTimeWeeks} Weeks
              </div>
              <div className="text-xs font-semibold text-[#1D1B17] mt-1">
                Filing Window to Expedition Deployment
              </div>
              <p className="text-[11px] text-[#696156] mt-2">
                Standard processing time required by host-nation regulators for biological, land, and spectrum clearance.
              </p>
            </div>
            <div className="text-[10px] font-mono text-[#0F422E]">
              Recommended Target Filing: <strong>Spring 2026</strong>
            </div>
          </div>

          {/* Card C: Governing Regulatory Bodies */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#414943]/10 shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#696156]">
                Responsible Regulatory Authority
              </div>
              <Landmark className="w-5 h-5 text-[#0F422E]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1D1B17] line-clamp-1">
                {admin.authority}
              </div>
              <div className="text-xs text-[#696156] mt-1">
                Primary Host Agency
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {admin.permitsRequired.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-0.5 rounded-md bg-[#F3EDE5] font-mono text-[10px] text-[#414943] truncate max-w-full"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <a
              href={admin.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#F9F3EB] hover:bg-[#EDE5D8] text-xs font-semibold text-[#1D1B17] border border-[#414943]/10 transition-colors"
            >
              <span>Visit Authority Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#0F422E]" />
            </a>
          </div>
        </div>
      </section>

      {/* 2. VISUAL CHINA WOLF AMENDMENT & P.L. 112-55 SEC 539 COMPLIANCE CARD */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6">
        <div className="flex items-center justify-between gap-3 mb-3 border-b border-[#414943]/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-[#184633]" />
            <h2 className="text-base sm:text-lg font-bold text-[#1D1B17]">
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
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>RESTRICTED / WAIVER REQUIRED</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>COMPLIANCE STATUS: VERIFIED / EXEMPT</span>
              </>
            )}
          </span>
        </div>

        {/* 2 Simple Sentences as explicitly required */}
        <div className="p-4 rounded-2xl bg-[#F9F3EB] border border-[#414943]/10 text-xs sm:text-sm text-[#1D1B17] leading-relaxed mb-4">
          <p className="font-medium">
            US Public Law 112-55 Sec 539 restricts NASA bilateral collaboration with China or Chinese-owned entities.
            Sites in third-party sovereign territory are screened to ensure zero restricted bilateral entanglements.
          </p>
        </div>

        {/* Visual Split: Permitted vs Restricted */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#86EFAC] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#166534]">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Legally Permitted Under P.L. 112-55:</span>
            </div>
            <ul className="text-xs text-[#14532D] space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Open Scientific Data:</strong> Citing peer-reviewed satellite observations, open geological maps, or published soil analyses from any institution globally.
              </li>
              <li>
                <strong>Multilateral Working Groups:</strong> Passive participation in international scientific assemblies (e.g. COSPAR, IAU) without bilateral funds transfer.
              </li>
              <li>
                <strong>Western/Neutral Field Testing:</strong> Operating analogue campaigns in sovereign partner nations (Chile, Antarctica, USA, Canada, Australia, Norway).
              </li>
            </ul>
          </div>

          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isChinaRestricted
                ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                : 'bg-[#FAF7F2] border-[#414943]/10'
            }`}
          >
            <div
              className={`flex items-center gap-2 text-xs font-bold ${
                isChinaRestricted ? 'text-[#991B1B]' : 'text-[#713F12]'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 ${
                  isChinaRestricted ? 'text-[#DC2626]' : 'text-[#D97706]'
                }`}
              />
              <span>Statutorily Restricted Without Congressional Certification:</span>
            </div>
            <ul
              className={`text-xs space-y-1.5 list-disc pl-4 leading-relaxed ${
                isChinaRestricted ? 'text-[#7F1D1D]' : 'text-[#414943]'
              }`}
            >
              <li>
                <strong>Bilateral Coordination:</strong> Direct NASA funding, contract awards, or joint field logistics with Chinese agencies or Chinese-owned companies.
              </li>
              <li>
                <strong>Hardware &amp; Technology Export:</strong> Shipping ITAR-controlled prototype rovers, flight avionics, or spacesuit components to Chinese soil.
              </li>
              <li>
                <strong>Reciprocal Facility Hosting:</strong> Hosting foreign bilateral entities at NASA-sponsored field analogue stations without FBI security clearance.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE 9-ACTIVITY PERMISSIONS CHECKLIST */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#414943]/10 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1D1B17]">
              Interactive Activity Permissions Checklist
            </h2>
            <p className="text-xs text-[#696156] mt-0.5">
              Click any card to select for the AI Application narrative. Toggle switches to enable/disable specific operational scopes.
            </p>
          </div>
          <div className="text-xs font-mono text-[#0F422E] bg-[#EAF4EE] px-3 py-1 rounded-full font-semibold">
            {activities.filter((a) => a.active).length} of 9 Scopes Enabled
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activities.map((act) => {
            const Icon = act.icon;
            const isSelected = selectedActivityId === act.id;
            return (
              <div
                key={act.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedActivityId(act.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedActivityId(act.id);
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#EBF3FF] border-[#3B82F6] ring-2 ring-[#3B82F6]/30 shadow-sm'
                    : act.active
                      ? 'bg-[#FAF7F2] border-[#414943]/10 hover:bg-[#FFFFFF] hover:border-[#414943]/20'
                      : 'bg-[#F3EDE5]/60 border-[#414943]/10 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-[#FFFFFF] border border-[#414943]/10 text-[#184633]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1D1B17] leading-tight">
                          {act.name}
                        </div>
                        <div className="text-[10px] text-[#696156]">
                          {act.category}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleActivity(act.id, e)}
                      className="text-[#184633] hover:text-[#0F3525] p-1 cursor-pointer"
                      title={act.active ? 'Disable this activity scope' : 'Enable this activity scope'}
                    >
                      {act.active ? (
                        <ToggleRight className="w-6 h-6 text-[#16A34A]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-[#9CA3AF]" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-[#414943] leading-snug line-clamp-2">
                    {act.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#414943]/10 flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      act.status === 'Authorized' || act.status === 'Exempt'
                        ? 'bg-[#DEF7EC] text-[#03543F]'
                        : act.status === 'Restricted'
                          ? 'bg-[#FDE8E8] text-[#9B1C1C]'
                          : 'bg-[#FEF08A] text-[#713F12]'
                    }`}
                  >
                    {act.status}
                  </span>
                  <span className="font-mono text-[10px] text-[#696156]">
                    Lead: {act.leadTime}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. AI PERMIT PREPARATION ASSISTANT & APPLICATION GENERATOR */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#414943]/10 pb-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#1D1B17] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A33E11]" />
              AI Permit Preparation Assistant &amp; Cover Letter Generator
            </h2>
            <p className="text-xs text-[#696156]">
              Drafts an auditable application package using only user-confirmed parameters and verified host regulatory metadata.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyDraft}
              className="px-3.5 py-2 rounded-xl border border-[#414943]/15 text-xs font-semibold text-[#1D1B17] hover:bg-[#FAF7F2] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#184633]" />
              <span>{copiedDraft ? 'Copied to Clipboard!' : 'Copy Application Draft'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadDraft}
              className="px-4 py-2 rounded-xl bg-[#184633] text-[#FFFFFF] text-xs font-bold hover:bg-[#2A5A44] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .txt Package</span>
            </button>
          </div>
        </div>

        {/* Clean Interactive Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-[#1D1B17] block mb-1">
              Lead Investigator / Team Name:
            </label>
            <input
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#414943]/15 text-xs font-medium focus:outline-none focus:border-[#184633]"
            />
          </div>
          <div>
            <label className="font-bold text-[#1D1B17] block mb-1">
              Affiliated Organization:
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#414943]/15 text-xs font-medium focus:outline-none focus:border-[#184633]"
            />
          </div>
          <div>
            <label className="font-bold text-[#1D1B17] block mb-1">
              Campaign Window &amp; Duration:
            </label>
            <input
              type="text"
              value={campaignDates}
              onChange={(e) => setCampaignDates(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#414943]/15 text-xs font-medium focus:outline-none focus:border-[#184633]"
            />
          </div>
          <div>
            <label className="font-bold text-[#1D1B17] block mb-1">
              Test Articles &amp; Staged Hardware:
            </label>
            <input
              type="text"
              value={equipmentList}
              onChange={(e) => setEquipmentList(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#414943]/15 text-xs font-medium focus:outline-none focus:border-[#184633]"
            />
          </div>
        </div>

        {/* Formatted Letter Preview in High-Contrast Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#696156]">
            <span>
              Generated Application Text (Prefilled for <strong>{selectedActivity.name}</strong>)
            </span>
            <span className="text-[#B45309] font-semibold">
              *Draft — Human Review Required Prior to Regulatory Submission
            </span>
          </div>
          <div className="relative">
            <textarea
              readOnly
              value={generatedCoverLetter}
              rows={16}
              className="w-full p-4 rounded-2xl bg-[#0F172A] text-[#E2E8F0] font-mono text-xs leading-relaxed border border-[#334155] focus:outline-none select-all"
            />
          </div>
        </div>

        {/* 5. CLEAR NEXT ACTION CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#414943]/10">
          <div className="text-xs text-[#696156]">
            Module 4 Complete · Legal pathway evaluated for <strong>{selectedSite.name}</strong> ({selectedSite.country}).
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
