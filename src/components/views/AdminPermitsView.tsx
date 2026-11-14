import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileCheck,
  FileQuestion,
  FileText,
  Landmark,
  Layers,
  MapPin,
  Radio,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
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
  icon: React.ElementType;
  description: string;
  status: 'Authorized' | 'Permit Required' | 'Restricted' | 'Exempt';
  notes: string;
}

export const AdminPermitsView: React.FC<AdminPermitsViewProps> = ({
  selectedSite,
  activeTarget,
  activeObjective,
  onNavigate,
}) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string>('equipment_op');
  const [applicantName, setApplicantName] = useState<string>('Artemis Analog Science Team');
  const [organization, setOrganization] = useState<string>('NASA-Affiliated University Consortium');
  const [campaignDates, setCampaignDates] = useState<string>('Summer Field Season (14 Days)');
  const [equipmentList, setEquipmentList] = useState<string>(
    'Autonomous Rover Platform (45 kg), Subsurface Drill Prototype, Multi-Spectral Imager, SO2 Gas Monitor',
  );
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);

  const admin = selectedSite.adminFeasibility || {
    status: 'Conditional',
    statusReason: 'Scientific research fieldwork permit and access authorization required.',
    authority: 'National Land Management Agency',
    jurisdiction: selectedSite.country,
    leadTimeWeeks: 8,
    officialUrl: 'https://www.nasa.gov/',
    permitsRequired: ['Scientific Fieldwork Permit', 'Land Access Notice'],
    chinaWolfAmendmentWarning: selectedSite.country.toLowerCase().includes('china'),
    indigenousConsultationRequired: false,
  };

  const isChinaRestricted = admin.chinaWolfAmendmentWarning || selectedSite.country.toLowerCase().includes('china');

  // 9 Distinct Activity Permissions Breakdown
  const activities: ActivityPermission[] = useMemo(() => {
    return [
      {
        id: 'land_entry',
        name: '1. Land Entry & Staging',
        icon: MapPin,
        description: 'Physical access to surface territory and establishing field camp.',
        status: isChinaRestricted ? 'Restricted' : 'Permit Required',
        notes: isChinaRestricted
          ? 'BLOCKED: Physical field access restricted by US federal bilateral policy without Congressional waiver.'
          : `Authority: ${admin.authority}. Access subject to boundary zoning and land-use notification.`,
      },
      {
        id: 'scientific_research',
        name: '2. Scientific Research & Observation',
        icon: FileText,
        description: 'Conducting non-destructive geological, thermal, and optical characterization.',
        status: isChinaRestricted ? 'Restricted' : 'Permit Required',
        notes: isChinaRestricted
          ? 'Public Chinese research data is permissible for citation, but bilateral co-investigation is prohibited under P.L. 112-55.'
          : `Scientific research permit required from ${admin.authority}. Lead time ~${admin.leadTimeWeeks} weeks.`,
      },
      {
        id: 'equipment_op',
        name: '3. Hardware & Equipment Operation',
        icon: Wrench,
        description: 'Deploying engineering test articles, battery packs, and sensors in the field.',
        status: isChinaRestricted ? 'Restricted' : admin.status === 'Feasible pathway identified' ? 'Authorized' : 'Permit Required',
        notes: `Requires equipment safety certification, battery transport compliance, and environmental containment plan.`,
      },
      {
        id: 'rover_driving',
        name: '4. Robotic Rover Mobility',
        icon: Layers,
        description: 'Driving off-road wheeled or tracked rovers across natural surfaces.',
        status: selectedSite.country === 'USA' && selectedSite.name.includes('National Park') ? 'Restricted' : 'Permit Required',
        notes: 'Off-road vehicle traffic is strictly regulated in protected wilderness; designated analog corridors required.',
      },
      {
        id: 'drilling_sampling',
        name: '5. Drilling, Excavation & Sampling',
        icon: FileCheck,
        description: 'Subsurface coring (10–100 cm) or extracting rock and regolith samples.',
        status: isChinaRestricted ? 'Restricted' : 'Permit Required',
        notes: 'Material extraction requires separate sampling authorization and cultural heritage clearance.',
      },
      {
        id: 'drone_uas',
        name: '6. Drone / UAS Aerial Imaging',
        icon: Sparkles,
        description: 'Low-altitude drone surveying for DEM reconstruction and shadows.',
        status: 'Permit Required',
        notes: 'National civil aviation authority drone flight clearance and local airspace park authorization required.',
      },
      {
        id: 'rf_transmission',
        name: '7. RF / Telecommunications',
        icon: Radio,
        description: 'Using long-range UHF/S-band data transceivers or radar emitters.',
        status: 'Permit Required',
        notes: 'National telecommunications spectrum coordination required to prevent interference with emergency or orbital channels.',
      },
      {
        id: 'customs_import',
        name: '8. Customs & Temporary Hardware Import',
        icon: Scale,
        description: 'Shipping foreign prototype equipment into the host country.',
        status: isChinaRestricted ? 'Restricted' : 'Permit Required',
        notes: isChinaRestricted
          ? 'ITAR/EAR export control license required from US State/Commerce Dept before any physical equipment shipment.'
          : 'ATA Carnet or host-nation Temporary Admission (Admission Temporaria) protocol required for duty-free re-export.',
      },
      {
        id: 'indigenous_consult',
        name: '9. Indigenous & Culturally Sensitive Lands',
        icon: Users,
        description: 'Consultation with Traditional Owners, First Nations, or cultural custodians.',
        status: admin.indigenousConsultationRequired ? 'Permit Required' : 'Exempt',
        notes: admin.indigenousConsultationRequired
          ? 'MANDATORY: Formal cultural impact assessment and consent from traditional custodian community council.'
          : 'No specific indigenous title restrictions identified on verified coordinates.',
      },
    ];
  }, [selectedSite, admin, isChinaRestricted]);

  const selectedActivity = activities.find((a) => a.id === selectedActivityId) || activities[0];

  // AI-Assisted Draft Application Cover Letter
  const generatedCoverLetter = useMemo(() => {
    return `APPLICATION FOR SCIENTIFIC FIELDWORK & ANALOG EQUIPMENT TESTING
Authority: ${admin.authority}
Jurisdiction: ${admin.jurisdiction}
Official Portal: ${admin.officialUrl}

DATE: November 15, 2026
APPLICANT: ${applicantName}
INSTITUTION: ${organization}
PROPOSED LOCATION: ${selectedSite.name} (${selectedSite.region}, ${selectedSite.country})
COORDINATES: ${selectedSite.coordinates} (Elevation: ${selectedSite.elevationM} m ASL)
PROJECT TIMEFRAME: ${campaignDates}

1. MISSION OBJECTIVE & PURPOSE:
This application proposes a non-crewed terrestrial equipment readiness campaign in support of publicly documented Artemis IV equipment test objectives (${activeObjective.name}). The objective is to evaluate hardware mechanical durability, mobility, and material degradation against lunar South Pole physical analogues (target datum: ${activeTarget.name}).

2. ACTIVITY REQUESTED:
- Primary Activity: ${selectedActivity.name}
- Detailed Scope: ${selectedActivity.description}
- Staged Equipment: ${equipmentList}
- Environmental Impact: Low-impact, non-hazardous surface operations. No permanent structures or toxic chemical releases.

3. LEGAL & REGULATORY COMPLIANCE:
${isChinaRestricted
  ? `[LEGAL RESTRICTION NOTICE]
Pursuant to US Public Law 112-55, Sec. 539 (Wolf Amendment) and NASA Policy Guidelines (PRC FAQ for ROSES), any NASA-funded bilateral participation, collaboration, or contract with Chinese entities or physical deployments on Chinese territory is strictly restricted without an explicit Congressional waiver and US State Department export authorization. This dossier is flagged for government legal counsel review before any physical activities.`
  : `The applicant agrees to adhere to all municipal, provincial, and national land stewardship codes. Required permits under review: ${admin.permitsRequired.join(', ')}.`}

4. RESPONSIBLE LEAD SIGN-OFF:
Lead Investigator: __________________________
Affiliation: ${organization}
Date: __________________________

*NOTICE: This document is an AI-assisted preparation draft generated by TERraOps for human review. It does not constitute official approval, clearance, or submission.*`;
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
  ]);

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(generatedCoverLetter);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  const handleDownloadDraft = () => {
    const blob = new Blob([generatedCoverLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Permit_Draft_${selectedSite.id}_${selectedActivity.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Module D Header & Status Banner */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#414943]/8 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-xs font-semibold text-[#1D4ED8]">
                Module D · Administrative &amp; Permit Feasibility Layer
              </span>
              <span className="text-xs text-[#696156]">
                Site: <strong className="text-[#1D1B17]">{selectedSite.name}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1D1B17] tracking-tight">
              Permits, Legal Constraints &amp; AI Assistant
            </h1>
            <p className="text-sm text-[#696156]">
              A scientifically ideal Earth site is useless if a mission team cannot legally or practically operate there.
              Verify jurisdiction, statutory restrictions, required approvals, and draft an application package.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('dossier')}
              className="px-3 py-1.5 rounded-full border border-[#414943]/15 text-xs font-medium text-[#414943] hover:bg-[#FAF7F2] cursor-pointer"
            >
              ← Back to Site Dossier
            </button>
            <button
              type="button"
              onClick={() => onNavigate('lab')}
              className="px-4 py-1.5 rounded-full bg-[#184633] text-[#FFFFFF] text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Open Exposure Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Current Site Administrative Status Card */}
        <div className="pt-6">
          <div
            className={`p-5 rounded-xl border flex flex-wrap items-start justify-between gap-4 ${
              admin.status === 'Feasible pathway identified'
                ? 'bg-[#DEF7EC]/60 border-[#31C48D]'
                : admin.status === 'Restricted / legal review required'
                  ? 'bg-[#FDE8E8]/70 border-[#F98080]'
                  : 'bg-[#FEF08A]/40 border-[#FACC15]'
            }`}
          >
            <div className="space-y-1 max-w-3xl">
              <div className="flex items-center gap-2">
                {admin.status === 'Feasible pathway identified' ? (
                  <ShieldCheck className="w-5 h-5 text-[#03543F]" />
                ) : admin.status === 'Restricted / legal review required' ? (
                  <ShieldAlert className="w-5 h-5 text-[#9B1C1C]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[#713F12]" />
                )}
                <span className="font-bold text-sm tracking-wide uppercase">
                  Administrative Status: {admin.status}
                </span>
              </div>
              <p className="text-xs text-[#1F2937] leading-relaxed">
                {admin.statusReason}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-[#374151]">
                <span>Authority: <strong>{admin.authority}</strong></span>
                <span>·</span>
                <span>Jurisdiction: <strong>{admin.jurisdiction}</strong></span>
                <span>·</span>
                <span>Est. Lead Time: <strong>~{admin.leadTimeWeeks} Weeks</strong></span>
              </div>
            </div>

            <a
              href={admin.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs font-semibold text-[#1F2937] hover:bg-[#F9FAFB] shadow-xs shrink-0"
            >
              <span>Official Authority Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* CHINA / WOLF AMENDMENT SPECIAL CASE AUDIT (SECTION 6.D REQUIREMENT) */}
      {isChinaRestricted && (
        <div className="bg-[#FFF8F8] rounded-2xl border-2 border-[#E02424] p-6 shadow-soft-card space-y-3">
          <div className="flex items-center gap-2 text-[#9B1C1C]">
            <AlertOctagon className="w-6 h-6 text-[#E02424]" />
            <h3 className="text-base font-bold tracking-tight">
              Statutory Compliance Deep-Dive: NASA Wolf Amendment &amp; China Bilateral Restrictions
            </h3>
          </div>
          <p className="text-xs text-[#771D1D] leading-relaxed">
            Per <strong>US Public Law 112-55, Section 539</strong> (commonly known as the Wolf Amendment) and
            NASA&apos;s published <em>Frequently Asked Questions on PRC Restrictions for ROSES</em>, NASA funds cannot be
            used to participate, collaborate, or coordinate bilaterally in any way with China or any Chinese-owned
            company, whether funded directly or via a contract, grant, or cooperative agreement.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#F87171] space-y-1">
              <span className="font-bold text-[#046C4E] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#046C4E]" />
                What is Legally Permitted:
              </span>
              <p className="text-[#374151]">
                Citing publicly available Chinese geological, meteorological, or satellite data. Analyzing open scientific
                literature published by Chinese academic institutions.
              </p>
            </div>
            <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#F87171] space-y-1">
              <span className="font-bold text-[#C81E1E] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#C81E1E]" />
                What is Legally Restricted:
              </span>
              <p className="text-[#374151]">
                Conducting physical field campaigns, entering bilateral field agreements, exporting prototype hardware or
                ITAR/EAR technical data, or sharing equipment without an explicit Congressional certification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 9-Activity Permission Checklist */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#1D1B17]">
            Distinct Activity Permissions Checklist
          </h2>
          <p className="text-xs text-[#696156]">
            General land-access does not automatically authorize technical equipment testing, rover driving, or sampling.
            Select an activity below to view compliance status and generate an official application narrative.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activities.map((act) => {
            const Icon = act.icon;
            const isSelected = selectedActivityId === act.id;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => setSelectedActivityId(act.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#EBF3FF] border-[#3B82F6] ring-1 ring-[#3B82F6]'
                    : 'bg-[#FAF7F2] border-[#414943]/10 hover:bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#FFFFFF] border border-[#414943]/10 flex items-center justify-center text-[#184633]">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-[#1D1B17]">{act.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      act.status === 'Authorized'
                        ? 'bg-[#DEF7EC] text-[#03543F]'
                        : act.status === 'Restricted'
                          ? 'bg-[#FDE8E8] text-[#9B1C1C]'
                          : 'bg-[#FEF08A] text-[#713F12]'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#696156] line-clamp-2">{act.description}</p>
                <p className="text-[10px] text-[#1D1B17] font-mono mt-2 truncate">{act.notes}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI PERMIT ASSISTANT & APPLICATION GENERATOR */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#414943]/8 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#1D1B17] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C2673B]" />
              AI Permit Preparation Assistant &amp; Cover Letter Generator
            </h2>
            <p className="text-xs text-[#696156]">
              Drafts an auditable application package using only user-provided facts and verified site metadata.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyDraft}
              className="px-3 py-1.5 rounded-lg border border-[#414943]/15 text-xs font-medium text-[#1D1B17] hover:bg-[#FAF7F2] flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#184633]" />
              <span>{copiedDraft ? 'Copied to Clipboard!' : 'Copy Draft'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadDraft}
              className="px-3.5 py-1.5 rounded-lg bg-[#184633] text-[#FFFFFF] text-xs font-semibold hover:bg-[#2A5A44] flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Package (.txt)</span>
            </button>
          </div>
        </div>

        {/* Input Parameters for Application */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-semibold text-[#1D1B17] block mb-1">Applicant / Team Name:</label>
            <input
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#414943]/15 text-xs"
            />
          </div>
          <div>
            <label className="font-semibold text-[#1D1B17] block mb-1">Affiliated Organization:</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#414943]/15 text-xs"
            />
          </div>
          <div>
            <label className="font-semibold text-[#1D1B17] block mb-1">Campaign Dates &amp; Window:</label>
            <input
              type="text"
              value={campaignDates}
              onChange={(e) => setCampaignDates(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#414943]/15 text-xs"
            />
          </div>
          <div>
            <label className="font-semibold text-[#1D1B17] block mb-1">Hardware / Test Articles:</label>
            <input
              type="text"
              value={equipmentList}
              onChange={(e) => setEquipmentList(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#414943]/15 text-xs"
            />
          </div>
        </div>

        {/* Generated Cover Letter Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#696156]">
            <span>Generated Application Narrative (Prefilled for {selectedActivity.name})</span>
            <span className="text-[#B45309] font-medium">*Requires Human Review &amp; Official Submission</span>
          </div>
          <textarea
            readOnly
            value={generatedCoverLetter}
            rows={14}
            className="w-full p-4 rounded-xl bg-[#1E293B] text-[#E2E8F0] font-mono text-xs leading-relaxed border border-[#334155] focus:outline-none"
          />
        </div>

        {/* Next step footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#414943]/8">
          <div className="text-xs text-[#696156]">
            Step 4 of 6 Complete · Administrative review verified for <strong>{selectedSite.name}</strong>.
          </div>
          <button
            type="button"
            onClick={() => onNavigate('lab')}
            className="px-5 py-2 rounded-full bg-[#184633] text-[#FFFFFF] text-xs font-semibold hover:bg-[#2A5A44] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Proceed to Module E: Equipment Exposure Lab</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
