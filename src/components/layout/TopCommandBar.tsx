import React from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileText,
  FlaskConical,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react';
import { PlanetBody, WorkspaceView } from '../../types/terra';

interface TopCommandBarProps {
  activeView: WorkspaceView;
  onChangeView: (view: WorkspaceView) => void;
  activeBody: PlanetBody;
  onChangeBody: (body: PlanetBody) => void;
  onQuickExport: () => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
}

export interface WorkflowStepDef {
  id: WorkspaceView;
  stepNumber: number;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
}

export const WORKFLOW_STEPS: WorkflowStepDef[] = [
  {
    id: 'overview',
    stepNumber: 1,
    label: 'Mission Brief',
    shortLabel: '1. Brief',
    description: 'Artemis IV Readiness',
    icon: Compass,
  },
  {
    id: 'discovery',
    stepNumber: 2,
    label: 'Discover Sites',
    shortLabel: '2. Discover',
    description: 'Pareto Candidate Matching',
    icon: Search,
  },
  {
    id: 'dossier',
    stepNumber: 3,
    label: 'Site Dossier',
    shortLabel: '3. Dossier',
    description: 'Geology & Microclimate',
    icon: FileText,
  },
  {
    id: 'permits',
    stepNumber: 4,
    label: 'Access & Permits',
    shortLabel: '4. Permits',
    description: 'Legal & Logistics Feasibility',
    icon: ShieldCheck,
  },
  {
    id: 'lab',
    stepNumber: 5,
    label: 'Exposure Lab',
    shortLabel: '5. Lab',
    description: 'Hardware Durability & Sulfur',
    icon: FlaskConical,
  },
  {
    id: 'reports',
    stepNumber: 6,
    label: 'Validation & Evidence',
    shortLabel: '6. Validation',
    description: 'Audit & Flight Readiness',
    icon: Award,
  },
];

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  activeView,
  onChangeView,
  activeBody,
  onChangeBody,
  onQuickExport,
  onNextStep,
}) => {
  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.id === activeView);
  const activeStep = WORKFLOW_STEPS[currentStepIndex] || WORKFLOW_STEPS[0];
  const nextStep =
    currentStepIndex >= 0 && currentStepIndex < WORKFLOW_STEPS.length - 1
      ? WORKFLOW_STEPS[currentStepIndex + 1]
      : null;

  return (
    <header className="no-print max-w-[1640px] w-full mx-auto px-4 sm:px-6 pt-3 pb-2 shrink-0">
      <div className="bg-[#FFFFFF] rounded-2xl lg:rounded-full border border-[#414943]/10 shadow-soft-card px-4 sm:px-5 py-2.5 sm:py-2 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        {/* Brand Identity / Home Button */}
        <button
          type="button"
          onClick={() => onChangeView('overview')}
          className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#184633] rounded-xl pr-1"
          title="Return to Step 1: Mission Brief"
        >
          <span className="w-10 h-10 rounded-full bg-[#184633] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-sm border border-[#2A5A44]">
            <Compass className="w-5 h-5 text-[#BAEED1]" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="flex items-center gap-2">
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1D1B17]">
                TERraOps
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-[11px] font-bold text-[#1D4ED8]">
                Artemis IV Readiness
              </span>
            </span>
            <span className="hidden xl:block text-[11px] font-semibold text-[#696156]">
              Lunar South Pole Analogs &amp; Equipment Testing
            </span>
          </span>
        </button>

        {/* 6-Step Visual Workflow Stepper (Centerpiece of Navigation) */}
        <nav
          aria-label="Mission workflow progress stepper"
          className="flex items-center gap-1 sm:gap-1.5 p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/10 overflow-x-auto max-w-full shadow-inner"
        >
          {WORKFLOW_STEPS.map((step, idx) => {
            const isActive = activeView === step.id;
            const isCompleted = currentStepIndex > idx;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => onChangeView(step.id)}
                  aria-current={isActive ? 'step' : undefined}
                  className={`group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#184633] ${
                    isActive
                      ? 'bg-[#184633] text-[#FFFFFF] shadow-sm ring-1 ring-[#BAEED1]/40'
                      : isCompleted
                        ? 'bg-[#EAF4EE] text-[#0F422E] hover:bg-[#D4EBDC] border border-[#BAEED1]/50'
                        : 'text-[#414943] hover:text-[#1D1B17] hover:bg-[#FFFFFF]/80'
                  }`}
                  title={`${step.label} (${step.description})`}
                >
                  {/* Step Number or Checkmark Badge */}
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[#BAEED1] text-[#0F422E]'
                        : isCompleted
                          ? 'bg-[#2A5A44] text-[#FFFFFF]'
                          : 'bg-[#FFFFFF] text-[#696156] border border-[#414943]/15'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FFFFFF]" />
                    ) : (
                      step.stepNumber
                    )}
                  </span>

                  {/* Step Icon */}
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#BAEED1]'
                        : isCompleted
                          ? 'text-[#184633]'
                          : 'text-[#696156] group-hover:text-[#1D1B17]'
                    }`}
                  />

                  {/* Step Label */}
                  <span className="tracking-tight">
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.shortLabel}</span>
                  </span>
                </button>

                {/* Arrow connector between steps (desktop) */}
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <ChevronRight
                    className={`w-3 h-3 hidden 2xl:block shrink-0 ${
                      currentStepIndex > idx ? 'text-[#184633]' : 'text-[#C0C9C1]'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right Controls: Quick Next Button, Body Switcher, Auxiliary Tools */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Step Advance Button */}
          {nextStep && onNextStep && (
            <button
              type="button"
              onClick={onNextStep}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#184633] hover:bg-[#2A5A44] text-[#FFFFFF] text-xs font-bold transition-all shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#184633]"
              title={`Advance to Step ${nextStep.stepNumber}: ${nextStep.label}`}
            >
              <span>Next: {nextStep.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#BAEED1]" />
            </button>
          )}

          {/* Auxiliary Tools: Seasonal Calendar & 3D CAD Twin */}
          <div className="hidden xl:flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => onChangeView('calendar')}
              className={`px-3 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                activeView === 'calendar'
                  ? 'bg-[#1D1B17] text-[#FFFFFF] border-[#1D1B17]'
                  : 'bg-[#FFFFFF] text-[#414943] border-[#414943]/15 hover:text-[#1D1B17]'
              }`}
              title="View Seasonal Climatology &amp; Deployment Windows"
            >
              Seasonal Window
            </button>
            <button
              type="button"
              onClick={() => onChangeView('cad')}
              className={`px-3 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                activeView === 'cad'
                  ? 'bg-[#1D1B17] text-[#FFFFFF] border-[#1D1B17]'
                  : 'bg-[#FFFFFF] text-[#414943] border-[#414943]/15 hover:text-[#1D1B17]'
              }`}
              title="Open Axiom Spacesuit &amp; Rover 3D Digital Twin"
            >
              3D CAD Twin
            </button>
          </div>

          {/* Planetary Body Switcher */}
          <div
            role="group"
            aria-label="Planetary body selector"
            className="flex items-center gap-0.5 p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/10"
          >
            {(['moon', 'earth', 'mars'] as PlanetBody[]).map((b) => {
              const active = activeBody === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => onChangeBody(b)}
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#FFFFFF] text-[#1D1B17] shadow-xs'
                      : 'text-[#696156] hover:text-[#1D1B17]'
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>

          {/* Live PDS Link */}
          <button
            type="button"
            onClick={onQuickExport}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#EAF4EE] text-[#0F422E] border border-[#2A5A44]/20 hover:bg-[#BAEED1]/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="NASA PDS &amp; Copernicus verified data stream"
          >
            <span
              className="w-2 h-2 rounded-full bg-[#184633] animate-pulse"
              aria-hidden="true"
            />
            <span>Live PDS Data</span>
          </button>

          {/* User Profile / Report Shortcut */}
          <button
            type="button"
            onClick={onQuickExport}
            title="Open Mission Verification Report"
            className="w-8 h-8 rounded-full bg-[#F3EDE5] hover:bg-[#EDE5D8] border border-[#414943]/10 text-[#414943] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
