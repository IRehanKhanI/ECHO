import React from 'react';
import { Orbit, SlidersHorizontal, Sparkles, Sun } from 'lucide-react';
import {
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetaryTarget,
  WorkspaceView,
} from '../../types/terra';

interface TelemetryStripProps {
  target: PlanetaryTarget;
  selectedSite: EarthCandidateSite;
  objective: ObjectiveProfile;
  noveltyOnly: boolean;
  activeView?: WorkspaceView;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({
  target,
  selectedSite,
  objective,
  noveltyOnly,
  activeView = 'overview',
}) => {
  return (
    <div className="no-print max-w-[1640px] w-full mx-auto px-4 sm:px-6 pb-3 shrink-0">
      <div className="bg-[#FFFFFF] rounded-2xl sm:rounded-full border border-[#414943]/8 shadow-soft-card px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#414943]">
        {activeView === 'overview' ? (
          <>
            {/* Screen 1 Overview Telemetry Banner matching reference */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 font-semibold text-[#1D1B17]">
                <Orbit className="w-4 h-4 text-[#184633] shrink-0" />
                Target: {target.name}
              </span>

              <span aria-hidden="true" className="text-[#C0C9C1]">·</span>

              <span className="font-mono text-xs text-[#696156]">
                SPICE Kernel: {target.spiceKernel}
              </span>

              <span aria-hidden="true" className="text-[#C0C9C1]">·</span>

              <span className="font-mono text-xs text-[#E06A3B] font-semibold flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#E06A3B] shrink-0" />
                Solar Elevation: +{target.solarElevationMinDeg.toFixed(2)}°{target.body === 'moon' ? ' (Stable Grazing)' : ''}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2.5 font-mono text-xs shrink-0">
              <span className="text-[#C2673B] font-medium">
                {target.body === 'moon'
                  ? 'Polar Stereographic Grid'
                  : target.body === 'mars'
                    ? 'Areocentric Grid'
                    : 'WGS84 Geodetic Grid'}
              </span>
              <span aria-hidden="true" className="text-[#C0C9C1]">·</span>
              <span className="text-[#414943]">Altitude: 48.6 km</span>
            </div>
          </>
        ) : activeView === 'discovery' ? (
          <>
            {/* Screen 2 Discovery Telemetry Banner */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF4EE] text-[#0F422E] font-semibold text-xs border border-[#2A5A44]/15">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#184633]" />
                Pareto Multi-Objective Discovery Active
              </span>

              <span className="text-[#696156] font-medium">
                Target Datum:{' '}
                <strong className="text-[#1D1B17] font-semibold">{target.name}</strong>
              </span>

              <span aria-hidden="true" className="text-[#C0C9C1]">·</span>

              <span className="font-mono text-xs text-[#696156]">
                Lat {target.lat.toFixed(1)}°{target.lat < 0 ? 'S' : 'N'}
              </span>

              <span aria-hidden="true" className="text-[#C0C9C1]">·</span>

              <span className="font-mono text-xs text-[#696156]">
                Permanent Grazing Light 86%
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:inline font-mono text-xs text-[#696156]">
                Evaluated 1,842,900 biomes
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF2EB] border border-[#FFDBCF] text-[#E06A3B] font-semibold text-xs">
                <Sparkles className="w-3 h-3 text-[#E06A3B]" />
                Novelty Engine Active
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Generic Views Telemetry Banner */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF4EE] text-[#0F422E] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#184633]" aria-hidden="true" />
                {objective.shortName}
              </span>

              <span className="text-[#696156]">
                Target: <strong className="text-[#1D1B17] font-semibold">{target.name}</strong>
              </span>

              <span aria-hidden="true" className="text-[#C0C9C1]">·</span>

              <span className="font-mono text-xs text-[#414943]">
                {target.coordinates}
              </span>

              <span aria-hidden="true" className="text-[#C0C9C1]">·</span>

              <span className="font-mono text-xs text-[#E06A3B] font-semibold flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-[#E06A3B]" />
                Solar +{target.solarElevationMinDeg.toFixed(1)}° to +{target.solarElevationMaxDeg.toFixed(1)}°
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F9F3EB] border border-[#414943]/10 font-mono text-xs text-[#1D1B17]">
                Selected Analog: <strong>{selectedSite.name.split(' (')[0]}</strong>
              </span>
              {noveltyOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF2EB] border border-[#FFDBCF] text-[#E06A3B] font-semibold text-xs">
                  <Sparkles className="w-3 h-3" />
                  Novelty Active
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
