import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Layers,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Table,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  MANDATORY_BREAKDOWN_ITEMS,
  MONTH_LABELS,
  PLANETARY_TARGETS,
  PROVENANCE_LEDGER,
} from '../../data/planetaryData';
import {
  DATASET_AUDIT_META,
  DATASET_DISTRIBUTION_STATS,
  DATASET_SAMPLE_ROWS,
  EMPIRICAL_VALIDATION_POINTS,
  MODEL_BENCHMARK_RESULTS,
  buildCsvReport,
  buildHtmlReport,
} from '../../data/validationData';
import {
  optimizeMissionPortfolio,
  runBacktestValidation,
} from '../../engine/analogEngine';
import {
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetaryTarget,
  ScoredCandidate,
  EarthAnalogResult,
} from '../../types/terra';
import {
  calculateTemperatureMatchPercentage,
  formatLocationName,
} from '../../utils/analogMatch';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TerrainPreviewArtwork } from '../common/TerrainPreviewArtwork';

interface ReportsViewProps {
  activeTarget: PlanetaryTarget;
  onSelectTarget: (targetId: string) => void;
  activeObjective: ObjectiveProfile;
  rankedCandidates: ScoredCandidate[];
  selectedSite: EarthCandidateSite;
  noveltyOnly: boolean;
  onToggleNovelty: (val: boolean) => void;
  analogResults: EarthAnalogResult[] | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  activeTarget,
  onSelectTarget,
  activeObjective,
  rankedCandidates,
  selectedSite,
  noveltyOnly,
  onToggleNovelty,
  analogResults,
}) => {
  const [portfolioK, setPortfolioK] = useState<2 | 3>(3);
  const [activeSection, setActiveSection] = useState<string>('validation');
  const [moduleFSubTab, setModuleFSubTab] = useState<'benchmarks' | 'visualizations' | 'dataAudit'>('benchmarks');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const selectedScored = useMemo(
    () =>
      rankedCandidates.find((c) => c.site.id === selectedSite.id) ||
      rankedCandidates[0],
    [rankedCandidates, selectedSite.id],
  );

  const portfolio = useMemo(
    () => optimizeMissionPortfolio(activeTarget, portfolioK, noveltyOnly),
    [activeTarget, portfolioK, noveltyOnly],
  );

  const backtests = useMemo(() => runBacktestValidation(), []);
  const breakdownItems = MANDATORY_BREAKDOWN_ITEMS[activeTarget.body];
  const reportAnalogs = analogResults?.slice(0, 3) ?? [];

  const engineeringObjectiveRows = useMemo(
    () =>
      portfolio.allocations.map((row, index) => {
        const analog = reportAnalogs[index % reportAnalogs.length];
        return {
          ...row,
          assignedSiteName: analog
            ? formatLocationName(analog.location_name, analog.lat, analog.lng)
            : row.assignedSiteName,
        };
      }),
    [portfolio.allocations, reportAnalogs],
  );

  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportNotice(`Exported ${filename}`);
    window.setTimeout(() => setExportNotice(null), 3200);
  };

  const handleExportJson = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      target: activeTarget,
      objective: activeObjective,
      selectedEarthAnalog: selectedScored,
      modelBenchmark: {
        meta: DATASET_AUDIT_META,
        models: MODEL_BENCHMARK_RESULTS,
        distributionStats: DATASET_DISTRIBUTION_STATS,
      },
      missionPortfolio: portfolio,
      whereAnalogyBreaksDown: breakdownItems,
      backtestValidation: backtests,
    };
    triggerDownload(
      `terraops-dossier-${activeTarget.id}-${selectedSite.id}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    );
  };

  const handleExportHtml = () => {
    const html = buildHtmlReport(activeTarget.name, selectedSite.name);
    triggerDownload(
      `terraops-validation-report-${activeTarget.id}-${selectedSite.id}.html`,
      html,
      'text/html',
    );
  };

  const handleExportCsv = () => {
    const csv = buildCsvReport();
    triggerDownload(
      `terraops-benchmark-metrics-${activeTarget.id}.csv`,
      csv,
      'text/csv',
    );
  };

  const handleExportMarkdown = () => {
    const lines: string[] = [
      `# TERraOps — Artemis IV Validation & Evidence Report`,
      `**Target Profile:** ${activeTarget.name} (${activeTarget.coordinates})`,
      `**Earth Analogue Site:** ${selectedSite.name} (${selectedSite.coordinates})`,
      `**Test Objective:** ${activeObjective.name}`,
      `**Peak Window:** ${selectedScored?.windowSummary.startDateLabel} – ${selectedScored?.windowSummary.endDateLabel} (${selectedScored?.bestMonthScore.toFixed(1)}%)`,
      ``,
      `---`,
      `## ⚠️ STATISTICAL CONFIDENCE & PROVENANCE NOTICE`,
      `> "The model has been statistically evaluated on the supplied dataset, but independent physical validation has not been established."`,
      `> Degradation predictions derive from regression models fitted on 1,000 synthetic laboratory test cycles across 200–1600 ppm sulfur exposure and 1–1000 days. Real flight qualification requires environmental vacuum chamber exposure.`,
      ``,
      `## 1. Model Comparison Benchmark`,
      `| Model | Architecture | Test R² | Test MAE (mg/cm²) | Test RMSE (mg/cm²) | 5-Fold CV R² | Status |`,
      `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
      ...MODEL_BENCHMARK_RESULTS.map(
        (m) =>
          `| ${m.name} | ${m.architecture} | ${m.testR2.toFixed(2)}% | ${m.testMae.toFixed(4)} | ${m.testRmse.toFixed(4)} | ${m.cvR2.toFixed(2)}% | ${m.status} |`,
      ),
      ``,
      `## 2. Dataset Audit (simulation_dataset.csv)`,
      `- **Total Records:** ${DATASET_AUDIT_META.totalRows}`,
      `- **Clean Benchmark Records:** ${DATASET_AUDIT_META.cleanBenchmarkRows} (13 outliers trimmed via 1.5*IQR bounds)`,
      `- **Features:** sulfur_ppm, exposure_days -> degradation_mg_cm2`,
      `- **Missing Values:** 0 | Duplicate Rows: 0`,
      ``,
      `| Metric | Sulfur (ppm) | Exposure (days) | Degradation (mg/cm²) |`,
      `| :--- | :--- | :--- | :--- |`,
      ...DATASET_DISTRIBUTION_STATS.map(
        (s) =>
          `| ${s.metric} | ${s.sulfur_ppm} | ${s.exposure_days} | ${s.degradation_mg_cm2} |`,
      ),
      ``,
      `## 3. Multi-Site Mission Portfolio (${portfolioK} Sites · ${portfolio.combinedCoveragePct}% Combined Coverage)`,
      ...portfolio.allocations.map(
        (a) =>
          `- **${a.objectiveName}:** ${a.assignedSiteName} (${a.bestMonthLabel}) — ${a.score.toFixed(1)}%`,
      ),
      ``,
      `## 4. Per-Dimension Fidelity Breakdown`,
      `| Dimension | Earth Value | Target Value | Score | Provenance |`,
      `| :--- | :--- | :--- | :--- | :--- |`,
      ...(selectedScored?.dimensionBreakdown.map(
        (d) =>
          `| ${d.label} | ${d.earthValueFormatted} | ${d.targetValueFormatted} | ${d.score.toFixed(1)}% | ${d.provenance} |`,
      ) || []),
      ``,
      `## 5. Where the Analogy Breaks Down`,
      ...breakdownItems.map(
        (b) =>
          `- **${b.pillar}:** Earth ${b.earthValue} vs. Target ${b.targetValue} — ${b.engineeringImpact}`,
      ),
    ];
    triggerDownload(
      `terraops-validation-${activeTarget.id}-${selectedSite.id}.md`,
      lines.join('\n'),
      'text/markdown',
    );
  };

  const ganttRows = useMemo(
    () =>
      portfolio.selectedSites.map((site, idx) => {
        const allocation = portfolio.allocations.find(
          (a) => a.assignedSiteId === site.id,
        );
        const startCol = idx === 0 ? 2 : idx === 1 ? 4 : 6;
        const spanCols = idx === 0 ? 2 : 2;
        const hrs = idx === 0 ? 120 : idx === 1 ? 140 : 80;
        return {
          site,
          task: allocation?.objectiveName || 'Surface Field Validation',
          window:
            idx === 0
              ? 'May – Aug 2026'
              : idx === 1
                ? 'Nov 2026 – Feb 2027'
                : 'Apr – Jun 2027',
          startCol,
          spanCols,
          hrs,
        };
      }),
    [portfolio],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* TOP HERO SYNTHESIS BANNER matching Stitch Synthesis Reports */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EE] font-mono text-[11px] font-semibold text-[#0F422E]">
              MISSION SYNTHESIS
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FDF2EC] text-[#A33E11] text-[11px] font-semibold">
              OPTIMAL SET-COVER
            </span>
            <span className="font-mono text-[11px] text-[#696156]">
              Target: {activeTarget.name}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[#1D1B17] tracking-tight">
            Mission Synthesis &amp; Fidelity Dossier
          </h1>
          <p className="text-xs text-[#414943] mt-1.5 leading-relaxed">
            Multi-site ground analog portfolio optimization delivering +{portfolio.gainPct}% higher scientific coverage over single-site deployment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-center">
            <div className="text-[11px] text-[#696156] font-medium">
              Overall Coverage
            </div>
            <div className="font-display text-3xl font-bold text-[#0F422E] tabular-nums">
              {portfolio.combinedCoveragePct}%
            </div>
            <div className="text-[10px] text-[#696156] font-mono">
              5/5 Objectives Covered
            </div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-center">
            <div className="text-[11px] text-[#696156] font-medium">
              Selected Sites
            </div>
            <div className="font-display text-3xl font-bold text-[#A33E11] tabular-nums">
              0{portfolio.selectedSites.length}
            </div>
            <div className="text-[10px] text-[#696156] font-mono">
              {reportAnalogs.length
                ? reportAnalogs
                    .map((analog) => {
                      const formattedName = formatLocationName(
                        analog.location_name,
                        analog.lat,
                        analog.lng,
                      );
                      return formattedName.split(' (')[0];
                    })
                    .join(' • ')
                : 'No analogs selected'}
            </div>
          </div>
        </div>
      </section>

      {/* 3-COLUMN MISSION PORTFOLIO & FIDELITY LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr_320px] gap-6 items-start">
        {/* LEFT COLUMN: Report Control + Back-Testing Confirmation */}
        <div className="no-print flex flex-col gap-5">
          <aside className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-bold text-[#1D1B17]">
                Report Control
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#F3EDE5] text-[10px] font-semibold text-[#414943]">
                Active
              </span>
            </div>

            <div>
              <label
                htmlFor="rep-target-select"
                className="text-[10px] font-semibold uppercase tracking-wider text-[#696156] block mb-1.5"
              >
                Target Profile
              </label>
              <select
                id="rep-target-select"
                value={activeTarget.id}
                onChange={(e) => onSelectTarget(e.target.value)}
                className="w-full bg-[#F9F3EB] border border-[#414943]/12 rounded-2xl px-3 py-2 text-xs font-semibold text-[#1D1B17]"
              >
                {PLANETARY_TARGETS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.body.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#696156] block mb-2">
                Section Navigator
              </span>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'validation', label: '1. Model Validation (Mod F)', tag: 'ML Audit', targetId: 'report-validation' },
                  { id: 'summary', label: '2. Executive Summary', targetId: 'report-summary' },
                  { id: 'setcover', label: '3. Multi-Site Set Cover', tag: `${portfolioK} Sites`, targetId: 'report-setcover' },
                  { id: 'matrix', label: '4. Dimension Matrix', tag: '8 Dim', targetId: 'report-matrix' },
                  { id: 'gantt', label: '5. Deployment Gantt', tag: '26–27', targetId: 'report-gantt' },
                ].map((nav) => (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(nav.id);
                      const el = document.getElementById(nav.targetId);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-medium transition-colors cursor-pointer ${
                      activeSection === nav.id
                        ? 'bg-[#0F422E] text-white font-semibold'
                        : 'text-[#414943] hover:bg-[#F9F3EB]'
                    }`}
                  >
                    <span>{nav.label}</span>
                    {nav.tag && (
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                          activeSection === nav.id
                            ? 'bg-white/15 text-[#BAEED1]'
                            : 'bg-[#F3EDE5] text-[#696156]'
                        }`}
                      >
                        {nav.tag}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Set-Cover k=2 / k=3 & Novelty */}
            <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1D1B17]">Portfolio Size</span>
                <div className="flex items-center gap-1">
                  {([2, 3] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPortfolioK(k)}
                      className={`px-2.5 py-0.5 rounded-full font-mono text-xs cursor-pointer ${
                        portfolioK === k
                          ? 'bg-[#0F422E] text-white font-semibold'
                          : 'bg-white text-[#414943]'
                      }`}
                    >
                      k={k}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center justify-between text-xs text-[#414943] cursor-pointer">
                <span>Underexplored Sites Only</span>
                <input
                  type="checkbox"
                  checked={noveltyOnly}
                  onChange={(e) => onToggleNovelty(e.target.checked)}
                  className="accent-[#0F422E] w-4 h-4"
                />
              </label>
            </div>

            {/* Automated Back-Testing Verification */}
            <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F422E] mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Back-Testing Verification</span>
              </div>
              <div className="space-y-1.5">
                {backtests.map((bt) => (
                  <div
                    key={bt.id}
                    className="p-2 rounded-xl bg-[#FFFFFF] border border-[#414943]/8 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-1 font-semibold text-[#1D1B17]">
                      <span className="truncate">{bt.label.split('->')[0]}</span>
                      <span
                        className={`inline-flex items-center gap-0.5 font-mono text-[10px] shrink-0 ${
                          bt.passed ? 'text-[#0F422E]' : 'text-[#B91C1C]'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {bt.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-[#696156] mt-0.5">
                      {bt.actualWinner}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Data & Validation Exports */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#696156]">
                Export Validation &amp; Dossier
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="py-2.5 rounded-xl bg-[#F9F3EB] hover:bg-[#EDE5D8] text-[11px] font-semibold text-[#1D1B17] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#E06A3B]" />
                  <span>Report (MD)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportHtml}
                  className="py-2.5 rounded-xl bg-[#F9F3EB] hover:bg-[#EDE5D8] text-[11px] font-semibold text-[#1D1B17] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#0F422E]" />
                  <span>Report (HTML)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="py-2.5 rounded-xl bg-[#F9F3EB] hover:bg-[#EDE5D8] text-[11px] font-semibold text-[#1D1B17] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>Metrics (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 rounded-xl bg-[#F9F3EB] hover:bg-[#EDE5D8] text-[11px] font-semibold text-[#1D1B17] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#696156]" />
                  <span>Print (PDF)</span>
                </button>
              </div>
              {exportNotice && (
                <p className="font-mono text-[11px] text-center text-[#0F422E] bg-[#EAF4EE] py-1 rounded-lg">
                  {exportNotice}
                </p>
              )}
            </div>
          </aside>
        </div>

        {/* CENTER COLUMN: Module F Validation & Evidence, Set-Cover Portfolio, Dimension Matrix */}
        <main className="flex flex-col gap-6">
          {/* MODULE F: VALIDATION & EVIDENCE REPORT SECTION */}
          <section id="report-validation" className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EE] text-[#0F422E] font-mono text-[11px] font-semibold">
                    MODULE F · VALIDATION &amp; EVIDENCE REPORT
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FDF2EC] text-[#A33E11] font-mono text-[11px] font-semibold">
                    Single Stressor: Sulfur Exposure
                  </span>
                  <span className="text-[11px] font-medium text-[#696156]">
                    Dataset: simulation_dataset.csv (1,000 rows)
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold text-[#1D1B17]">
                  Empirical Dataset Audit &amp; Multi-Model Wear Benchmark
                </h2>
                <p className="text-xs text-[#696156] mt-1">
                  Reproducible machine-learning evaluation across 5 regression architectures with outlier filtering and held-out cross validation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-2xl bg-[#EAF4EE] border border-[#2A5A44]/20 text-center">
                  <div className="text-[10px] font-semibold text-[#0F422E] uppercase">Holdout R²</div>
                  <div className="font-display text-xl font-bold text-[#0F422E]">93.39%</div>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-[#F9F3EB] border border-[#414943]/10 text-center">
                  <div className="text-[10px] font-semibold text-[#696156] uppercase">5-Fold CV R²</div>
                  <div className="font-display text-xl font-bold text-[#1D1B17]">92.6%</div>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-[#FDF2EC] border border-[#E06A3B]/20 text-center">
                  <div className="text-[10px] font-semibold text-[#A33E11] uppercase">RMSE Error</div>
                  <div className="font-display text-xl font-bold text-[#A33E11]">±0.0494</div>
                </div>
              </div>
            </div>

            {/* HIGH VISIBILITY CONFIDENCE STATEMENT ALERT */}
            <div className="p-4 rounded-2xl bg-[#FFF8E6] border border-[#F59E0B]/40 flex items-start gap-3.5 mb-6">
              <ShieldAlert className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div className="text-xs text-[#92400E] leading-relaxed">
                <div className="font-bold text-sm text-[#78350F] mb-0.5 flex items-center gap-2">
                  <span>STATISTICAL CONFIDENCE &amp; PROVENANCE NOTICE</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[10px] font-mono text-[#B45309]">MANDATORY CAVEAT</span>
                </div>
                <p className="font-semibold text-[#854D0E]">
                  “The model has been statistically evaluated on the supplied dataset, but independent physical validation has not been established.”
                </p>
                <p className="mt-1 text-[11px] text-[#92400E]/90">
                  Degradation predictions derive from regression models fitted on 1,000 synthetic laboratory test cycles across 200–1600 ppm sulfur exposure and 1–1000 days. 
                  High statistical confidence (R² = 93.39%, 5-fold CV R² = 92.6%, RMSE = 0.0494 mg/cm²) indicates robust interpolation across test points, but does NOT certify real-world rover or spacesuit life under lunar high-vacuum or radiation conditions.
                </p>
              </div>
            </div>

            {/* Sub-view switcher tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#414943]/10 pb-3 mb-5">
              <button
                type="button"
                onClick={() => setModuleFSubTab('benchmarks')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  moduleFSubTab === 'benchmarks'
                    ? 'bg-[#0F422E] text-white'
                    : 'bg-[#F9F3EB] text-[#414943] hover:bg-[#EDE5D8]'
                }`}
              >
                1. Model Comparison Benchmark (5 Models)
              </button>
              <button
                type="button"
                onClick={() => setModuleFSubTab('visualizations')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  moduleFSubTab === 'visualizations'
                    ? 'bg-[#0F422E] text-white'
                    : 'bg-[#F9F3EB] text-[#414943] hover:bg-[#EDE5D8]'
                }`}
              >
                2. Wear &amp; Residual Visualizations (Recharts)
              </button>
              <button
                type="button"
                onClick={() => setModuleFSubTab('dataAudit')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  moduleFSubTab === 'dataAudit'
                    ? 'bg-[#0F422E] text-white'
                    : 'bg-[#F9F3EB] text-[#414943] hover:bg-[#EDE5D8]'
                }`}
              >
                3. Dataset Audit &amp; Summary Stats
              </button>
            </div>

            {/* Sub-view 1: Model Benchmark Table */}
            {moduleFSubTab === 'benchmarks' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-[#414943]/10">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F9F3EB] text-[#414943] border-b border-[#414943]/10">
                        <th className="py-2.5 px-3 font-semibold">Model Architecture</th>
                        <th className="py-2.5 px-3 font-semibold">Feature Formulation</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Holdout R²</th>
                        <th className="py-2.5 px-3 font-semibold text-right">MAE (mg/cm²)</th>
                        <th className="py-2.5 px-3 font-semibold text-right">RMSE (mg/cm²)</th>
                        <th className="py-2.5 px-3 font-semibold text-right">5-Fold CV R²</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#414943]/8">
                      {MODEL_BENCHMARK_RESULTS.map((m) => {
                        const isChosen = m.status === 'Chosen Production';
                        return (
                          <tr
                            key={m.id}
                            className={`transition-colors ${
                              isChosen ? 'bg-[#EAF4EE]/60 font-medium' : 'hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#1D1B17] flex items-center gap-1.5">
                                {isChosen && <Sparkles className="w-3.5 h-3.5 text-[#0F422E]" />}
                                <span>{m.name}</span>
                              </div>
                              <div className="text-[10px] text-[#696156]">{m.notes}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-[#414943]">
                              {m.architecture}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-right text-[#1D1B17]">
                              {m.testR2.toFixed(2)}%
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-right text-[#414943]">
                              {m.testMae.toFixed(4)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-right font-semibold text-[#A33E11]">
                              {m.testRmse.toFixed(4)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-right text-[#0F422E]">
                              {m.cvR2.toFixed(2)}%
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isChosen
                                    ? 'bg-[#0F422E] text-white'
                                    : m.status === 'Rejected'
                                      ? 'bg-[#FEE2E2] text-[#B91C1C]'
                                      : m.status === 'Underfitting'
                                        ? 'bg-[#FEF3C7] text-[#92400E]'
                                        : 'bg-[#F3EDE5] text-[#414943]'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-[11px] text-[#414943] leading-relaxed">
                  <span className="font-bold text-[#1D1B17]">Model Selection Rationale:</span> Random Forest Regressor (100 estimators, max depth 8, RobustScaler) was selected as the operational deployment model. While Gradient Boosting achieved slightly higher unregularized training metrics (94.12%), Random Forest demonstrated superior robustness against extreme outliers at the boundaries of the sulfur parameter space (RMSE: 0.0494 mg/cm², 5-fold CV R²: 92.6%).
                </div>
              </div>
            )}

            {/* Sub-view 2: Wear & Residual Visualizations */}
            {moduleFSubTab === 'visualizations' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Chart 1: Actual vs Predicted */}
                <div className="p-4 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-display text-sm font-bold text-[#1D1B17]">
                        Actual vs. Predicted Degradation
                      </h3>
                      <p className="text-[10px] text-[#696156]">
                        Empirical test points vs Random Forest predictions · 1:1 perfect line
                      </p>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[#0F422E] font-semibold">
                      R² = 93.39%
                    </span>
                  </div>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          dataKey="actual"
                          name="Actual"
                          unit=" mg/cm²"
                          tick={{ fill: '#696156', fontSize: 10 }}
                          label={{ value: 'Actual Degradation (mg/cm²)', position: 'insideBottom', offset: -5, fill: '#696156', fontSize: 10 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="predicted"
                          name="Predicted"
                          unit=" mg/cm²"
                          tick={{ fill: '#696156', fontSize: 10 }}
                          label={{ value: 'Predicted (mg/cm²)', angle: -90, position: 'insideLeft', fill: '#696156', fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1D1B17',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '10px',
                          }}
                          formatter={(val: any, name: any) => [
                            `${Number(val ?? 0).toFixed(4)} mg/cm²`,
                            name === 'actual' ? 'Actual Degradation' : 'Predicted Degradation',
                          ]}
                        />
                        <ReferenceLine y={0.15} stroke="#DC2626" strokeDasharray="4 4" label={{ value: 'Crit 0.15', fill: '#DC2626', fontSize: 9 }} />
                        <Scatter name="Evaluation Test Points" data={EMPIRICAL_VALIDATION_POINTS} fill="#0F422E" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Residual Error Distribution */}
                <div className="p-4 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-display text-sm font-bold text-[#1D1B17]">
                        Residual Error Distribution (y - ŷ)
                      </h3>
                      <p className="text-[10px] text-[#696156]">
                        Deviations centered at zero across exposure duration
                      </p>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#FDF2EC] text-[#A33E11] font-semibold">
                      RMSE ±0.0494
                    </span>
                  </div>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={EMPIRICAL_VALIDATION_POINTS} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          tick={{ fill: '#696156', fontSize: 10 }}
                          label={{ value: 'Exposure Days', position: 'insideBottom', offset: -5, fill: '#696156', fontSize: 10 }}
                        />
                        <YAxis
                          tick={{ fill: '#696156', fontSize: 10 }}
                          label={{ value: 'Residual Error (mg/cm²)', angle: -90, position: 'insideLeft', fill: '#696156', fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1D1B17',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '10px',
                          }}
                          formatter={(val: any) => [`${Number(val ?? 0).toFixed(4)} mg/cm²`, 'Residual']}
                          labelFormatter={(d) => `Day ${d}`}
                        />
                        <ReferenceLine y={0} stroke="#414943" strokeWidth={1.5} />
                        <Bar dataKey="residual">
                          {EMPIRICAL_VALIDATION_POINTS.map((entry, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={entry.residual >= 0 ? '#166534' : '#DC2626'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view 3: Dataset Audit & Stats */}
            {moduleFSubTab === 'dataAudit' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                    <div className="text-[10px] text-[#696156] font-semibold uppercase">Total Source Records</div>
                    <div className="font-display text-lg font-bold text-[#1D1B17] mt-0.5">1,000 Rows</div>
                    <div className="text-[10px] text-[#696156]">simulation_dataset.csv</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                    <div className="text-[10px] text-[#696156] font-semibold uppercase">Filtered Benchmark</div>
                    <div className="font-display text-lg font-bold text-[#0F422E] mt-0.5">987 Rows</div>
                    <div className="text-[10px] text-[#0F422E]">13 outliers trimmed (IQR)</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                    <div className="text-[10px] text-[#696156] font-semibold uppercase">Feature Dimensions</div>
                    <div className="font-display text-lg font-bold text-[#1D1B17] mt-0.5">3 Columns</div>
                    <div className="text-[10px] text-[#696156]">2 features, 1 target</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                    <div className="text-[10px] text-[#696156] font-semibold uppercase">Data Quality</div>
                    <div className="font-display text-lg font-bold text-[#0F422E] mt-0.5">100% Complete</div>
                    <div className="text-[10px] text-[#0F422E]">0 nulls, 0 duplicate rows</div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[#414943]/10">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F9F3EB] text-[#414943] border-b border-[#414943]/10">
                        <th className="py-2 px-3 font-semibold">Distribution Metric</th>
                        <th className="py-2 px-3 font-semibold">Sulfur Concentration (ppm)</th>
                        <th className="py-2 px-3 font-semibold">Exposure Duration (days)</th>
                        <th className="py-2 px-3 font-semibold">Degradation (mg/cm²)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#414943]/8 font-mono text-[11px]">
                      {DATASET_DISTRIBUTION_STATS.map((s, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7F2]">
                          <td className="py-2 px-3 font-sans font-semibold text-[#1D1B17]">{s.metric}</td>
                          <td className="py-2 px-3 text-[#414943]">{s.sulfur_ppm}</td>
                          <td className="py-2 px-3 text-[#414943]">{s.exposure_days}</td>
                          <td className="py-2 px-3 font-semibold text-[#A33E11]">{s.degradation_mg_cm2}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="text-xs font-bold text-[#1D1B17] mb-1.5">First 5 Sample Records (Head Preview):</div>
                  <div className="overflow-x-auto rounded-xl border border-[#414943]/10">
                    <table className="w-full text-left text-xs font-mono text-[11px]">
                      <thead className="bg-[#F3EDE5] text-[#696156]">
                        <tr>
                          <th className="py-1.5 px-3">#</th>
                          <th className="py-1.5 px-3">sulfur_ppm</th>
                          <th className="py-1.5 px-3">exposure_days</th>
                          <th className="py-1.5 px-3">degradation_mg_cm2</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#414943]/8">
                        {DATASET_SAMPLE_ROWS.map((r) => (
                          <tr key={r.row} className="hover:bg-[#FAF7F2]">
                            <td className="py-1.5 px-3 text-[#696156]">{r.row}</td>
                            <td className="py-1.5 px-3">{r.sulfur_ppm.toFixed(2)}</td>
                            <td className="py-1.5 px-3">{r.exposure_days.toFixed(2)}</td>
                            <td className="py-1.5 px-3 font-semibold text-[#A33E11]">{r.degradation_mg_cm2.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Direct Export Action Toolbar */}
            <div className="mt-5 pt-4 border-t border-[#414943]/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#696156]">
                <ShieldCheck className="w-4 h-4 text-[#0F422E]" />
                <span>Auditable validation packages ready for mission review</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F9F3EB] hover:bg-[#EDE5D8] text-xs font-semibold text-[#1D1B17] border border-[#414943]/15 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#E06A3B]" />
                  <span>Download Report (MD)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportHtml}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF4EE] hover:bg-[#BAEED1]/70 text-xs font-semibold text-[#0F422E] border border-[#2A5A44]/20 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#0F422E]" />
                  <span>Download HTML</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFF6FF] hover:bg-[#DBEAFE] text-xs font-semibold text-[#1D4ED8] border border-[#93C5FD] transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>Download CSV Metrics</span>
                </button>
              </div>
            </div>
          </section>
          {/* Card 1: Weighted Set-Cover Portfolio Recommendation */}
          <section id="report-summary" className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-6">
            <div id="report-setcover" className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EE] text-[#0F422E] text-[11px] font-semibold">
                    {portfolio.selectedSites.length}-Site Minimum Cover
                  </span>
                  <span className="text-[11px] font-semibold text-[#A33E11]">
                    Pareto-Optimal Set
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-[#1D1B17]">
                  Weighted Set-Cover Portfolio Recommendation
                </h2>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-bold text-[#1D1B17] tabular-nums">
                  {portfolio.combinedCoveragePct}% Cover
                </div>
                <div className="font-mono text-[11px] text-[#696156]">
                  Gain: +{portfolio.gainPct}%
                </div>
              </div>
            </div>

            {analogResults && analogResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {analogResults.slice(0, 3).map((analog, idx) => {
                const scoreVal = calculateTemperatureMatchPercentage(
                  analog.min_temp_c,
                );
                return (
                  <div
                    key={analog.id}
                    className={`p-3.5 rounded-3xl border transition-all flex flex-col gap-2.5 ${
                      idx === 0
                        ? 'bg-[#FFFFFF] border-[#0F422E] shadow-sm'
                        : 'bg-[#F9F3EB] border-[#414943]/10'
                    }`}
                  >
                    <TerrainPreviewArtwork
                      siteId={`supabase-analog-${analog.id}`}
                      siteName={formatLocationName(analog.location_name, analog.lat, analog.lng)}
                      badgeText={`Site ${String.fromCharCode(65 + idx)} · ${analog.country}`}
                      scoreText={`${scoreVal.toFixed(1)}%`}
                      heightClass="h-24"
                    />
                    <div>
                      <h3 className="font-display text-base font-bold text-[#1D1B17] leading-tight">
                        {formatLocationName(analog.location_name, analog.lat, analog.lng)}
                      </h3>
                      <p className="font-mono text-[10px] text-[#696156] mt-0.5">
                        {analog.country} · {analog.lat.toFixed(2)}°, {analog.lng.toFixed(2)}°
                      </p>
                      <p className="text-[11px] text-[#414943] mt-1.5 leading-snug">
                        {scoreVal.toFixed(1)}% Match · Min Temperature {analog.min_temp_c.toFixed(1)}°C
                      </p>
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="mb-5 rounded-3xl border border-dashed border-[#2A5A44]/25 bg-[#EAF4EE] px-6 py-10 text-center">
                <h3 className="font-display text-lg font-bold text-[#0F422E]">
                  Analog Report Awaiting Data
                </h3>
                <p className="mt-2 text-sm text-[#414943]">
                  Run an Analog Search on the 3D Overview to generate this report.
                </p>
              </div>
            )}

            {/* Portfolio Allocation Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#414943]/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F3EB] text-[#696156] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3.5">Mission Engineering Objective</th>
                    <th className="py-2.5 px-3.5">Assigned Earth Testbed</th>
                    <th className="py-2.5 px-3.5">Optimal Month</th>
                    <th className="py-2.5 px-3.5 text-right">Fidelity Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#414943]/10">
                  {engineeringObjectiveRows.map((row) => (
                    <tr key={row.objectiveId}>
                      <td className="py-2.5 px-3.5 font-semibold text-[#1D1B17]">
                        {row.objectiveName}
                      </td>
                      <td className="py-2.5 px-3.5 text-[#414943]">
                        {row.assignedSiteName}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[#A33E11] font-medium">
                        {row.bestMonthLabel}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#0F422E]">
                        {row.score.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Card 2: Per-Dimension Fidelity Matrix */}
          <section id="report-matrix" className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#696156]">
                  Multi-Parametric Verification
                </div>
                <h2 className="font-display text-xl font-bold text-[#1D1B17]">
                  Per-Dimension Fidelity Matrix ({MONTH_LABELS[selectedScored?.bestMonthIndex ?? 0]})
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F3EDE5] font-mono text-[10px] text-[#414943]">
                IAU 2000 / {activeTarget.sourceDataset.split(' ')[0]}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#414943]/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F3EB] text-[#696156] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3.5">Dimension Metric</th>
                    <th className="py-2.5 px-3.5 text-[#A33E11]">
                      Target ({activeTarget.name})
                    </th>
                    <th className="py-2.5 px-3.5">
                      Earth ({selectedSite.name.split(' (')[0]})
                    </th>
                    <th className="py-2.5 px-3.5 text-right">Weight</th>
                    <th className="py-2.5 px-3.5 text-right">Match</th>
                    <th className="py-2.5 px-3.5">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#414943]/10">
                  {selectedScored?.dimensionBreakdown.map((dim) => (
                    <tr key={dim.dimension}>
                      <td className="py-2.5 px-3.5 font-semibold text-[#1D1B17]">
                        {dim.label}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[#A33E11] font-semibold">
                        {dim.targetValueFormatted}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[#1D1B17]">
                        {dim.earthValueFormatted}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono text-[#696156]">
                        {(dim.weight * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#0F422E]">
                        {dim.score.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3.5">
                        <ProvenanceBadge tag={dim.provenance} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Card 3: Temporal Deployment Schedule 2026–2027 Gantt */}
          <section id="report-gantt" className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#696156]">
                  Field Expedition Campaign
                </div>
                <h2 className="font-display text-xl font-bold text-[#1D1B17]">
                  Temporal Deployment Schedule 2026–2027
                </h2>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-[#F3EDE5] text-xs font-semibold text-[#1D1B17]">
                340 Total Operational Field Hours
              </span>
            </div>

            <div className="grid grid-cols-8 gap-2 font-mono text-[10px] text-[#696156] pb-2 border-b border-[#414943]/10 text-center">
              <span>Q1 26</span>
              <span>Q2 26</span>
              <span>Q3 26</span>
              <span>Q4 26</span>
              <span>Q1 27</span>
              <span>Q2 27</span>
              <span>Q3 27</span>
              <span>Q4 27</span>
            </div>

            <div className="space-y-3.5 mt-3">
              {ganttRows.map((row, idx) => (
                <div key={row.site.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1D1B17]">
                      {row.site.name.split(' (')[0]} · {row.task}
                    </span>
                    <span className="font-mono text-[11px] text-[#A33E11]">
                      {row.window}
                    </span>
                  </div>
                  <div className="h-7 rounded-full bg-[#F9F3EB] grid grid-cols-8 items-center px-1">
                    <div
                      style={{
                        gridColumn: `${row.startCol} / span ${row.spanCols}`,
                      }}
                      className={`h-5 rounded-full text-white font-mono text-[10px] font-semibold flex items-center justify-center px-2 truncate ${
                        idx === 0
                          ? 'bg-[#0F422E]'
                          : idx === 1
                            ? 'bg-[#A33E11]'
                            : 'bg-[#5A4A3C]'
                      }`}
                    >
                      {row.hrs} hrs · Active Campaign
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* RIGHT COLUMN: Analog Fidelity Ledger & Dataset Provenance */}
        <aside className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#1D1B17]">
              Analog Fidelity Ledger
            </h2>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#A33E11] mt-0.5">
              Fundamental Physical Divergences
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FDF2EC] border border-[#E06A3B]/25 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#A33E11] mb-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Where Earth Analogs Fail</span>
            </div>
            <p className="text-[11px] text-[#414943] leading-relaxed">
              Planetary analog sites provide terrestrial approximations. Critical
              environmental regimes remain unreplicable on Earth and require
              compensation rigs.
            </p>
          </div>

          <div className="space-y-2.5">
            {breakdownItems.map((b, idx) => (
              <div
                key={b.pillar}
                className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-[#1D1B17]">
                  <span>
                    {idx + 1}. {b.pillar}
                  </span>
                  <span className="font-mono text-[10px] text-[#A33E11]">
                    {b.gapFactor}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-[#414943] mt-0.5">
                  Earth: {b.earthValue} vs Target: {b.targetValue}
                </div>
                <p className="text-[11px] text-[#696156] mt-1 leading-snug">
                  {b.engineeringImpact}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#414943]/10">
            <div className="text-xs font-display font-bold text-[#1D1B17] mb-2">
              Dataset Provenance
            </div>
            <div className="space-y-2">
              {PROVENANCE_LEDGER.map((item) => (
                <a
                  key={item.dataset}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F9F3EB] hover:bg-[#EDE5D8] border border-[#414943]/8 transition-colors text-xs"
                >
                  <div className="pr-2">
                    <div className="font-semibold text-[#1D1B17]">
                      {item.agency}
                    </div>
                    <div className="text-[10px] text-[#696156] truncate max-w-[205px]">
                      {item.dataset}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#0F422E] shrink-0" />
                </a>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print w-full py-3.5 px-4 rounded-full bg-[#A33E11] hover:bg-[#E06A3B] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Complete Mission Portfolio (PDF)</span>
          </button>
        </aside>
      </div>
    </div>
  );
};
