import React, { useState } from 'react';
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
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="no-print w-full bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#414943]/10 sticky top-0 z-50 px-4 sm:px-8 py-3 shrink-0">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left: ECHO Brand Logo */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onChangeView('overview')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#184633] rounded-xl group py-0.5 px-1 -ml-1 transition-colors hover:bg-[#FAF7F2]"
            title="Return to Mission Brief"
          >
            {!logoError ? (
              <img
                src="/icons.jpg"
                alt="ECHO - Earth Correlation & Habitat Observation"
                onError={() => setLogoError(true)}
                className="h-8 sm:h-9 w-auto object-contain rounded-md shadow-xs border border-[#414943]/15 group-hover:scale-105 transition-transform"
              />
            ) : (
              <span className="w-9 h-9 rounded-full bg-[#184633] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-sm border border-[#2A5A44] group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4 text-[#BAEED1]" />
              </span>
            )}
            <div className="flex flex-col">
              <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[#1D1B17] leading-none">
                ECHO
              </span>
              <span className="text-[9px] uppercase tracking-wider font-mono text-[#696156] font-semibold hidden sm:inline leading-tight mt-0.5">
                Artemis IV Analog
              </span>
            </div>
          </button>
        </div>

        {/* Center: 6 Clean Primary Workflow Tabs */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <nav
            aria-label="Mission workflow tabs"
            className="flex items-center gap-1 sm:gap-1.5 p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/10 shadow-inner overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-full"
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
        </div>

        {/* Right: Symmetrical balancer to keep center tabs perfectly aligned */}
        <div
          className="hidden md:flex items-center justify-end shrink-0 w-[140px] pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </header>
  );
};
