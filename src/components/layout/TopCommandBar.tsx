import React from 'react';
import {
  Award,
  Compass,
  FileText,
  FlaskConical,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { WorkspaceView } from '../../types/terra';

interface TopCommandBarProps {
  activeView: WorkspaceView;
  onChangeView: (view: WorkspaceView) => void;
  onQuickExport?: () => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
}

export interface WorkflowStepDef {
  id: WorkspaceView;
  stepNumber: number;
  label: string;
  icon: React.ElementType;
}

export const WORKFLOW_STEPS: WorkflowStepDef[] = [
  {
    id: 'overview',
    stepNumber: 1,
    label: 'Mission Brief',
    icon: Compass,
  },
  {
    id: 'discovery',
    stepNumber: 2,
    label: 'Discover Sites',
    icon: Search,
  },
  {
    id: 'dossier',
    stepNumber: 3,
    label: 'Site Dossier',
    icon: FileText,
  },
  {
    id: 'permits',
    stepNumber: 4,
    label: 'Access & Permits',
    icon: ShieldCheck,
  },
  {
    id: 'lab',
    stepNumber: 5,
    label: 'Exposure Lab',
    icon: FlaskConical,
  },
  {
    id: 'reports',
    stepNumber: 6,
    label: 'Validation',
    icon: Award,
  },
];

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  activeView,
  onChangeView,
}) => {
  return (
    <header className="no-print w-full bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#414943]/10 sticky top-0 z-50 px-6 sm:px-8 py-3.5 shrink-0">
      <div className="w-full flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
        {/* Left: ECHO Brand Logo & Artemis IV Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onChangeView('overview')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#184633] rounded-xl group"
            title="Return to Mission Brief"
          >
            <span className="w-9 h-9 rounded-full bg-[#184633] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-sm border border-[#2A5A44] group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4 text-[#BAEED1]" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-[#1D1B17]">
              ECHO
            </span>
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#184633]/10 text-[#184633] text-[11px] font-bold uppercase tracking-wider border border-[#184633]/15">
            <span className="w-1.5 h-1.5 rounded-full bg-[#184633]" />
            Artemis IV Readiness
          </span>
        </div>

        {/* Center: 6 Clean Primary Workflow Tabs */}
        <nav
          aria-label="Mission workflow tabs"
          className="flex items-center gap-1 p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/10 overflow-x-auto max-w-full shadow-inner"
        >
          {WORKFLOW_STEPS.map((step) => {
            const isActive = activeView === step.id;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onChangeView(step.id)}
                aria-current={isActive ? 'step' : undefined}
                className={`group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#184633] ${
                  isActive
                    ? 'bg-[#184633] text-[#FFFFFF] shadow-sm ring-1 ring-[#BAEED1]/40'
                    : 'text-[#414943] hover:text-[#1D1B17] hover:bg-[#FFFFFF]/80'
                }`}
                title={step.label}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#BAEED1] text-[#0F422E]'
                      : 'bg-[#FFFFFF] text-[#696156] border border-[#414943]/15'
                  }`}
                >
                  {step.stepNumber}
                </span>

                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#BAEED1]'
                      : 'text-[#696156] group-hover:text-[#1D1B17]'
                  }`}
                />

                <span className="tracking-tight">{step.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Live Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#414943]/10 font-mono text-xs text-[#1D1B17] shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#2A5A44] animate-pulse" />
          <span className="font-semibold text-[#0F422E]">Live PDS Active</span>
          <span className="text-[#414943]/20">·</span>
          <span className="text-[11px] text-[#696156]">IAU2000</span>
        </div>
      </div>
    </header>
  );
};
