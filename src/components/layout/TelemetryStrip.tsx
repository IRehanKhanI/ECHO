import React from 'react';
import {
  ArrowRight,
  Compass,
  MapPin,
  Orbit,
  ShieldAlert,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import {
  EarthAnalogResult,
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetaryTarget,
  WorkspaceView,
} from '../../types/terra';
import { formatLocationName } from '../../utils/analogMatch';
import { WORKFLOW_STEPS } from './TopCommandBar';

interface TelemetryStripProps {
  target: PlanetaryTarget;
  selectedSite: EarthCandidateSite;
  objective: ObjectiveProfile;
  noveltyOnly: boolean;
  activeView?: WorkspaceView;
  analogResults?: EarthAnalogResult[] | null;
  onNextStep?: () => void;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({
  target,
  selectedSite,
  objective,
  noveltyOnly,
  activeView = 'overview',
  analogResults,
  onNextStep,
}) => {
  const currentStep = WORKFLOW_STEPS.find((s) => s.id === activeView) || WORKFLOW_STEPS[0];
  const nextStep =
    currentStep.stepNumber < WORKFLOW_STEPS.length
      ? WORKFLOW_STEPS[currentStep.stepNumber]
      : null;

  const topAnalogResult = analogResults && analogResults.length > 0 ? analogResults[0] : null;
  const activeAnalogName = topAnalogResult
    ? formatLocationName(topAnalogResult.location_name, topAnalogResult.lat, topAnalogResult.lng).split(' (')[0]
    : selectedSite.name.split(' (')[0];

  const distinct = selectedSite.distinctScores || {
    environmentalMatch: 86,
    operationalFeasibility: 48,
    administrativeReadiness: 65,
    dataConfidence: 94,
  };

  const adminStatus = selectedSite.adminFeasibility?.status || 'Conditional';
  const isAdminFeasible = adminStatus === 'Feasible pathway identified';
  const isAdminRestricted = adminStatus === 'Restricted / legal review required';

  return (
    <div className="no-print max-w-[1640px] w-full mx-auto px-4 sm:px-6 pb-3 shrink-0">
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#414943]">
        {/* Left: Planetary Target + Lunar Coordinate */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 font-semibold text-[#1D1B17]">
            <span className="w-6 h-6 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center shrink-0">
              <Orbit className="w-3.5 h-3.5 text-[#1D4ED8]" />
            </span>
            <span>
              Target: <strong className="text-[#1D1B17] font-bold">{target.name}</strong>
            </span>
          </div>

          <span aria-hidden="true" className="text-[#C0C9C1]">·</span>

          <span className="font-mono text-xs text-[#696156] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#414943]/10">
            {target.coordinates} · {target.elevationM >= 0 ? '+' : ''}{target.elevationM.toLocaleString()}m
          </span>

          <span aria-hidden="true" className="text-[#C0C9C1]">·</span>

          <span className="font-mono text-xs text-[#E06A3B] font-semibold flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-[#E06A3B] shrink-0" />
            Grazing Sun: +{target.solarElevationMinDeg.toFixed(1)}°
          </span>
        </div>

        {/* Center-Right: Active Analog + 4 Distinct Auditable Scores Pill */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Active Earth Analog Candidate */}
          <div className="flex items-center gap-1.5 font-medium text-[#1D1B17] bg-[#F9F3EB] px-3 py-1 rounded-full border border-[#414943]/10">
            <MapPin className="w-3.5 h-3.5 text-[#184633] shrink-0" />
            <span className="text-[#696156]">Analog:</span>
            <strong className="text-[#1D1B17] font-bold truncate max-w-[200px]" title={activeAnalogName}>
              {activeAnalogName}
            </strong>
          </div>

          {/* The 4 Distinct Auditable Scores Pill */}
          <div
            className="flex items-center gap-1.5 p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/10 font-mono text-[11px]"
            title="4 Distinct Auditable Readiness Scores: Environmental Match, Operational Feasibility, Administrative Readiness, Data Confidence"
          >
            {/* Score 1: Environmental Match */}
            <span
              className="px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[#0F422E] font-bold border border-[#BAEED1]"
              title="Environmental &amp; Thermal Match Score"
            >
              Env: {distinct.environmentalMatch}%
            </span>

            {/* Score 2: Operational Feasibility */}
            <span
              className="px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#1D4ED8] font-bold border border-[#BFDBFE]"
              title="Operational &amp; Logistics Feasibility Index"
            >
              Ops: {distinct.operationalFeasibility}/100
            </span>

            {/* Score 3: Administrative Readiness */}
            <span
              className={`px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                isAdminFeasible
                  ? 'bg-[#EAF4EE] text-[#0F422E] border-[#BAEED1]'
                  : isAdminRestricted
                    ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                    : 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
              }`}
              title={`Administrative Permit Status: ${adminStatus}`}
            >
              {isAdminFeasible ? (
                <ShieldCheck className="w-3 h-3 text-[#0F422E]" />
              ) : (
                <ShieldAlert className="w-3 h-3 text-[#92400E]" />
              )}
              <span>{adminStatus}</span>
            </span>

            {/* Score 4: Data Confidence */}
            <span
              className="px-2 py-0.5 rounded-full bg-[#FFFFFF] text-[#374151] font-bold border border-[#E5E7EB]"
              title="Data Confidence &amp; Sensor Provenance Score"
            >
              Conf: {distinct.dataConfidence}%
            </span>
          </div>

          {/* Workflow Step Indicator */}
          <div className="hidden 2xl:flex items-center gap-2 pl-1">
            <span className="text-[11px] font-semibold text-[#696156]">
              Step {currentStep.stepNumber} of 6: <strong className="text-[#1D1B17]">{currentStep.label}</strong>
            </span>

            {nextStep && onNextStep && (
              <button
                type="button"
                onClick={onNextStep}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#184633] hover:text-[#0F422E] underline cursor-pointer"
              >
                <span>Continue to {nextStep.label}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
