/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { TopCommandBar } from './components/layout/TopCommandBar';
import { AdminPermitsView } from './components/views/AdminPermitsView';
import { DiscoveryView } from './components/views/DiscoveryView';
import { OverviewView } from './components/views/OverviewView';
import { ReportsView } from './components/views/ReportsView';
import { SiteDossierView } from './components/views/SiteDossierView';
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
  EarthAnalogResult,
  WorkspaceView,
  ScoredCandidate,
} from './types/terra';

function deriveAnalogResultsFromCandidates(candidates: ScoredCandidate[]): EarthAnalogResult[] {
  return candidates.map((c, idx) => ({
    id: idx + 1,
    location_name: c.site.name,
    country: c.site.country,
    lat: c.site.lat,
    lng: c.site.lon,
    min_temp_c: Math.min(...c.site.monthlyMinTempC),
    slope_deg: c.site.slopeDeg,
    cosine_distance: parseFloat(Math.max(0, 1 - (c.bestMonthScore / 100)).toFixed(4)),
  }));
}

const PRIMARY_WORKFLOW_STEPS: WorkspaceView[] = [
  'overview',
  'discovery',
  'dossier',
  'permits',
  'lab',
  'reports',
];

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
  const [customAnalogResults, setCustomAnalogResults] = useState<EarthAnalogResult[] | null>(null);

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

  // Synchronously derived default results - guarantees ZERO empty or 'Awaiting data' states on initial load!
  const defaultAnalogResults = useMemo(
    () => deriveAnalogResultsFromCandidates(rankedCandidates),
    [rankedCandidates],
  );

  // Effective analogResults is NEVER null and NEVER empty on startup:
  const analogResults: EarthAnalogResult[] = useMemo(() => {
    if (customAnalogResults && customAnalogResults.length > 0) {
      return customAnalogResults;
    }
    return defaultAnalogResults;
  }, [customAnalogResults, defaultAnalogResults]);

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

  const currentStepIndex = PRIMARY_WORKFLOW_STEPS.indexOf(activeView);

  const handleNextStep = () => {
    if (currentStepIndex >= 0 && currentStepIndex < PRIMARY_WORKFLOW_STEPS.length - 1) {
      setActiveView(PRIMARY_WORKFLOW_STEPS[currentStepIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setActiveView(PRIMARY_WORKFLOW_STEPS[currentStepIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
        onQuickExport={() => setActiveView('reports')}
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
      />

      <main className="max-w-[1640px] w-full mx-auto px-4 sm:px-6 pt-6 pb-8 flex-1">
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
            setActiveTab={setActiveView}
            setAnalogResults={setCustomAnalogResults}
            onOpenReport={() => setActiveView('reports')}
            onNextStep={handleNextStep}
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
            onOpenCalendar={() => setActiveView('dossier')}
            analogResults={analogResults}
            onOpenDossier={() => setActiveView('dossier')}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'dossier' && (
          <SiteDossierView
            activeTarget={activeTarget}
            selectedSite={selectedSite}
            activeObjective={activeObjective}
            rankedCandidates={rankedCandidates}
            onSelectSite={setSelectedSiteId}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'permits' && (
          <AdminPermitsView
            selectedSite={selectedSite}
            activeTarget={activeTarget}
            activeObjective={activeObjective}
            onNavigate={setActiveView}
            rankedCandidates={rankedCandidates}
            onSelectSite={setSelectedSiteId}
          />
        )}

        {activeView === 'lab' && (
          <VirtualLabView
            activeTarget={activeTarget}
            selectedSite={selectedSite}
            onLaunchSimulator={() => setActiveView('reports')}
            onNavigate={setActiveView}
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
            analogResults={analogResults}
          />
        )}
      </main>

      <footer className="no-print max-w-[1640px] w-full mx-auto px-4 sm:px-6 pb-6 shrink-0">
        <div className="bg-[#FFFFFF] rounded-full border border-[#414943]/8 shadow-soft-card px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#696156]">
          <div className="flex items-center gap-2.5 truncate">
            <img
              src="/icons.jpg"
              alt="ECHO"
              className="h-5 w-auto object-contain rounded shrink-0 border border-[#414943]/15"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-display font-bold text-[#1D1B17]">
              ECHO
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
