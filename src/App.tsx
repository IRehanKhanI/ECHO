/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { TelemetryStrip } from './components/layout/TelemetryStrip';
import { TopCommandBar } from './components/layout/TopCommandBar';
import { CalendarView } from './components/views/CalendarView';
import { DiscoveryView } from './components/views/DiscoveryView';
import { OverviewView } from './components/views/OverviewView';
import { ReportsView } from './components/views/ReportsView';
import { SimulatorView } from './components/views/SimulatorView';
import { VirtualLabView } from './components/views/VirtualLabView';
import {
  DIVINER_SEASONAL_BINS,
  EARTH_CANDIDATE_SITES,
  OBJECTIVE_PROFILES,
  PLANETARY_TARGETS,
  SCIENTIFIC_LAYERS,
} from './data/planetaryData';
import { rankAnalogCandidates } from './engine/analogEngine';
import {
  DimensionKey,
  DimensionWeights,
  PlanetBody,
  ScientificLayerId,
  WorkspaceView,
} from './types/terra';

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('overview');
  const [activeBody, setActiveBody] = useState<PlanetBody>('moon');
  const [activeTargetId, setActiveTargetId] = useState<string>(
    'moon_shackleton_rim',
  );
  const [activeObjectiveId, setActiveObjectiveId] =
    useState<string>('thermal_cold_soak');
  const [weights, setWeights] = useState<DimensionWeights>(
    () => ({ ...OBJECTIVE_PROFILES[0].weights }),
  );
  const [activeLayerId, setActiveLayerId] =
    useState<ScientificLayerId>('lola_topo');
  const [seasonalBinIdx, setSeasonalBinIdx] = useState<number>(2);
  const [noveltyOnly, setNoveltyOnly] = useState<boolean>(false);
  const [thresholdPct, setThresholdPct] = useState<number>(75);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('univ_valley');

  const activeTarget = useMemo(
    () =>
      PLANETARY_TARGETS.find((t) => t.id === activeTargetId) ||
      PLANETARY_TARGETS[0],
    [activeTargetId],
  );

  const activeObjective = useMemo(
    () =>
      OBJECTIVE_PROFILES.find((o) => o.id === activeObjectiveId) ||
      OBJECTIVE_PROFILES[0],
    [activeObjectiveId],
  );

  const seasonalTempBiasK =
    DIVINER_SEASONAL_BINS[seasonalBinIdx]?.tempBiasK ?? 0;

  const rankedCandidates = useMemo(
    () =>
      rankAnalogCandidates(activeTarget, weights, {
        suppressCatalogKnown: noveltyOnly,
        thresholdPct,
        seasonalTempBiasK,
      }),
    [activeTarget, weights, noveltyOnly, thresholdPct, seasonalTempBiasK],
  );

  useEffect(() => {
    const exists = rankedCandidates.some((c) => c.site.id === selectedSiteId);
    if (!exists && rankedCandidates.length > 0) {
      setSelectedSiteId(rankedCandidates[0].site.id);
    }
  }, [rankedCandidates, selectedSiteId]);

  const selectedSite = useMemo(
    () =>
      EARTH_CANDIDATE_SITES.find((s) => s.id === selectedSiteId) ||
      rankedCandidates[0]?.site ||
      EARTH_CANDIDATE_SITES[0],
    [selectedSiteId, rankedCandidates],
  );

  const handleChangeBody = (body: PlanetBody) => {
    setActiveBody(body);
    const matchingLayer = SCIENTIFIC_LAYERS.find((l) => l.body === body);
    if (matchingLayer) setActiveLayerId(matchingLayer.id);

    if (body === 'moon' || body === 'mars') {
      if (activeTarget.body !== body) {
        const firstTarget = PLANETARY_TARGETS.find((t) => t.body === body);
        if (firstTarget) setActiveTargetId(firstTarget.id);
      }
    }
  };

  const handleSelectTarget = (targetId: string) => {
    setActiveTargetId(targetId);
    const t = PLANETARY_TARGETS.find((x) => x.id === targetId);
    if (t && t.body !== activeBody) {
      setActiveBody(t.body);
      const matchingLayer = SCIENTIFIC_LAYERS.find((l) => l.body === t.body);
      if (matchingLayer) setActiveLayerId(matchingLayer.id);
    }
  };

  const handleSelectObjective = (objectiveId: string) => {
    setActiveObjectiveId(objectiveId);
    const prof = OBJECTIVE_PROFILES.find((o) => o.id === objectiveId);
    if (prof) setWeights({ ...prof.weights });
  };

  const handleChangeWeight = (key: DimensionKey, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetWeights = () => {
    setWeights({ ...activeObjective.weights });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1D1B17]">
      <TopCommandBar
        activeView={activeView}
        onChangeView={setActiveView}
        activeBody={activeBody}
        onChangeBody={handleChangeBody}
        onQuickExport={() => setActiveView('reports')}
      />

      <TelemetryStrip
        target={activeTarget}
        selectedSite={selectedSite}
        objective={activeObjective}
        noveltyOnly={noveltyOnly}
        activeView={activeView}
      />

      <main className="max-w-[1640px] w-full mx-auto px-4 sm:px-6 pb-8 flex-1">
        {activeView === 'overview' && (
          <OverviewView
            activeBody={activeBody}
            onChangeBody={handleChangeBody}
            activeTarget={activeTarget}
            onSelectTarget={handleSelectTarget}
            activeObjective={activeObjective}
            onSelectObjective={handleSelectObjective}
            activeLayerId={activeLayerId}
            onSelectLayer={setActiveLayerId}
            seasonalBinIdx={seasonalBinIdx}
            onChangeSeasonalBin={setSeasonalBinIdx}
            rankedCandidates={rankedCandidates}
            selectedSite={selectedSite}
            onSelectSite={setSelectedSiteId}
            onLaunchDiscovery={() => setActiveView('discovery')}
            onOpenReport={() => setActiveView('reports')}
          />
        )}

        {activeView === 'discovery' && (
          <DiscoveryView
            activeTarget={activeTarget}
            onSelectTarget={handleSelectTarget}
            activeObjective={activeObjective}
            onSelectObjective={handleSelectObjective}
            weights={weights}
            onChangeWeight={handleChangeWeight}
            onResetWeights={handleResetWeights}
            noveltyOnly={noveltyOnly}
            onToggleNovelty={setNoveltyOnly}
            thresholdPct={thresholdPct}
            onChangeThreshold={setThresholdPct}
            rankedCandidates={rankedCandidates}
            selectedSite={selectedSite}
            onSelectSite={setSelectedSiteId}
            onOpenCalendar={() => setActiveView('calendar')}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView
            activeTarget={activeTarget}
            activeObjective={activeObjective}
            rankedCandidates={rankedCandidates}
            selectedSite={selectedSite}
            onSelectSite={setSelectedSiteId}
            seasonalBinIdx={seasonalBinIdx}
            onChangeSeasonalBin={setSeasonalBinIdx}
            thresholdPct={thresholdPct}
            onChangeThreshold={setThresholdPct}
            onLaunchLab={() => setActiveView('lab')}
          />
        )}

        {activeView === 'lab' && (
          <VirtualLabView
            activeTarget={activeTarget}
            selectedSite={selectedSite}
            onLaunchSimulator={() => setActiveView('simulator')}
          />
        )}

        {activeView === 'simulator' && (
          <SimulatorView
            selectedSite={selectedSite}
            onSelectSite={setSelectedSiteId}
            onOpenReports={() => setActiveView('reports')}
          />
        )}

        {activeView === 'reports' && (
          <ReportsView
            activeTarget={activeTarget}
            onSelectTarget={handleSelectTarget}
            activeObjective={activeObjective}
            rankedCandidates={rankedCandidates}
            selectedSite={selectedSite}
            noveltyOnly={noveltyOnly}
            onToggleNovelty={setNoveltyOnly}
          />
        )}
      </main>

      <footer className="no-print max-w-[1640px] w-full mx-auto px-4 sm:px-6 pb-6 shrink-0">
        <div className="bg-[#FFFFFF] rounded-full border border-[#414943]/8 shadow-soft-card px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#696156]">
          <div className="flex items-center gap-2.5 truncate">
            <span className="font-display font-bold text-[#1D1B17]">
              TERRA-X Workstation
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">
              Planetary &amp; Terrestrial Geological Analogs · NASA PDS / Earthdata / Copernicus
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[#0F422E] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2A5A44]" aria-hidden="true" />
              All biomes nominal
            </span>
            <span aria-hidden="true">·</span>
            <span>IAU2000 Moon/Mars Spheroid Reference</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
