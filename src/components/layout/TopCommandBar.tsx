import React from 'react';
import { Compass, User } from 'lucide-react';
import { PlanetBody, WorkspaceView } from '../../types/terra';

interface TopCommandBarProps {
  activeView: WorkspaceView;
  onChangeView: (view: WorkspaceView) => void;
  activeBody: PlanetBody;
  onChangeBody: (body: PlanetBody) => void;
  onQuickExport: () => void;
}

const PRIMARY_TABS: { id: WorkspaceView; label: string }[] = [
  { id: 'overview', label: '1. Mission Brief' },
  { id: 'discovery', label: '2. Discover Sites' },
  { id: 'dossier', label: '3. Site Dossier' },
  { id: 'permits', label: '4. Access & Permits' },
  { id: 'lab', label: '5. Exposure Lab' },
  { id: 'reports', label: '6. Validation & Evidence' },
];

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  activeView,
  onChangeView,
  activeBody,
  onChangeBody,
  onQuickExport,
}) => {
  return (
    <header className="no-print max-w-[1640px] w-full mx-auto px-4 sm:px-6 pt-4 pb-2 shrink-0">
      <div className="bg-[#FFFFFF] rounded-2xl sm:rounded-full border border-[#414943]/10 shadow-soft-card px-4 sm:px-5 py-3 sm:py-0 sm:h-16 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        {/* Left: Brand Wordmark + Subtitle */}
        <button
          type="button"
          onClick={() => onChangeView('overview')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span className="w-9 h-9 rounded-full bg-[#184633] text-[#FFFFFF] flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-4 h-4 text-[#BAEED1]" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="flex items-center gap-1.5">
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#1D1B17]">
                TERraOps
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-[10px] font-semibold text-[#1D4ED8]">
                Artemis IV Readiness
              </span>
            </span>
            <span className="hidden xl:block text-[10px] font-medium text-[#696156]">
              Artemis IV Analog Intelligence &amp; Equipment Exposure Lab
            </span>
          </span>
        </button>

        {/* Center: 6 Primary Workflow Tabs */}
        <nav
          aria-label="Workspace views"
          className="flex items-center gap-1 p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/8 overflow-x-auto max-w-full"
        >
          {PRIMARY_TABS.map((tab) => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeView(tab.id)}
                className={`px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#184633] text-[#FFFFFF] font-semibold shadow-xs'
                    : 'text-[#414943] hover:text-[#1D1B17] hover:bg-[#FFFFFF]/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Auxiliary tools (Seasonal Calendar / 3D CAD) & Body Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="hidden 2xl:flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => onChangeView('calendar')}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-medium cursor-pointer transition-all ${
                activeView === 'calendar'
                  ? 'bg-[#1D1B17] text-[#FFFFFF] border-[#1D1B17]'
                  : 'bg-[#FFFFFF] text-[#696156] border-[#414943]/15 hover:text-[#1D1B17]'
              }`}
            >
              Seasonal Window
            </button>
            <button
              type="button"
              onClick={() => onChangeView('cad')}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-medium cursor-pointer transition-all ${
                activeView === 'cad'
                  ? 'bg-[#1D1B17] text-[#FFFFFF] border-[#1D1B17]'
                  : 'bg-[#FFFFFF] text-[#696156] border-[#414943]/15 hover:text-[#1D1B17]'
              }`}
            >
              3D CAD Twin
            </button>
          </div>

          <div
            role="group"
            aria-label="Planetary body selector"
            className="flex items-center gap-0.5 p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/8"
          >
            {(['earth', 'moon', 'mars'] as PlanetBody[]).map((b) => {
              const active = activeBody === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => onChangeBody(b)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#FFFFFF] text-[#1D1B17] font-semibold shadow-xs'
                      : 'text-[#696156] hover:text-[#1D1B17]'
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onQuickExport}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EAF4EE] text-[#0F422E] border border-[#2A5A44]/20 hover:bg-[#BAEED1]/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#184633] animate-pulse" aria-hidden="true" />
            <span>Live PDS Data</span>
          </button>

          <button
            type="button"
            onClick={onQuickExport}
            title="User Profile / Dossier Settings"
            className="w-8 h-8 rounded-full bg-[#F3EDE5] hover:bg-[#EDE5D8] border border-[#414943]/10 text-[#414943] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="flex lg:hidden overflow-x-auto gap-1 p-1 mt-2 bg-[#F3EDE5] rounded-full border border-[#414943]/8">
        {WORKSPACE_TABS.map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeView(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#184633] text-[#FFFFFF] font-semibold'
                  : 'text-[#414943] hover:text-[#1D1B17]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
