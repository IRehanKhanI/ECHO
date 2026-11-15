import React from 'react';
import {
  Award,
  Compass,
  FileText,
  FlaskConical,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { PlanetBody, WorkspaceView } from '../../types/terra';

interface TopCommandBarProps {
  activeView: WorkspaceView;
  onChangeView: (view: WorkspaceView) => void;
  activeBody: PlanetBody;
  onChangeBody: (body: PlanetBody) => void;
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
  activeBody,
  onChangeBody,
}) => {
  return (
    <header className="no-print max-w-[1640px] w-full mx-auto px-4 sm:px-6 pt-3 pb-2 shrink-0">
      <div className="bg-[#FFFFFF] rounded-2xl lg:rounded-full border border-[#414943]/10 shadow-soft-card px-4 sm:px-6 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <button
          type="button"
          onClick={() => onChangeView('overview')}
          className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#184633] rounded-xl group"
          title="Return to Mission Brief"
        >
          <span className="w-9 h-9 rounded-full bg-[#184633] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-sm border border-[#2A5A44] group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4 text-[#BAEED1]" />
          </span>
          <span className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight text-[#1D1B17]">
              TERraOps
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-[11px] font-bold text-[#1D4ED8]">
              Artemis IV
            </span>
          </span>
        </button>

        {/* 6 Clean Primary Tabs */}
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

        {/* Planet Switcher: Moon | Mars | Earth */}
        <div
          role="group"
          aria-label="Planetary body selector"
          className="flex items-center gap-1 p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/10 shrink-0"
        >
          {(['moon', 'mars', 'earth'] as PlanetBody[]).map((body) => {
            const active = activeBody === body;
            return (
              <button
                key={body}
                type="button"
                onClick={() => onChangeBody(body)}
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#FFFFFF] text-[#1D1B17] shadow-xs'
                    : 'text-[#696156] hover:text-[#1D1B17]'
                }`}
              >
                {body}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
