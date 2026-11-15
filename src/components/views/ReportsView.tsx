import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  Compass,
  Download,
  FileSpreadsheet,
  FileText,
  MapPin,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  MODEL_BENCHMARK_RESULTS,
  buildCsvReport,
} from '../../data/validationData';
import {
  EarthAnalogResult,
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetaryTarget,
  ScoredCandidate,
} from '../../types/terra';

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
  activeObjective,
  rankedCandidates,
  selectedSite,
}) => {
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const selectedScored = useMemo(
    () =>
      rankedCandidates.find((c) => c.site.id === selectedSite.id) ||
      rankedCandidates[0],
    [rankedCandidates, selectedSite.id],
  );

  const topScore = selectedScored?.bestMonthScore ?? 92.4;

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
    window.setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportMarkdown = () => {
    const lines: string[] = [
      `# ECHO — Artemis IV Validation & Evidence Dossier`,
      `**Active Target:** ${activeTarget.name} (${activeTarget.body.toUpperCase()} Reference System)`,
      `**Top Recommended Analog Site:** ${selectedSite.name} (${selectedSite.country})`,
      `**Overall Fidelity Score:** ${topScore.toFixed(1)}%`,
      `**Flight Readiness Recommendation:** Candidate testbeds exhibit verified statistical fidelity across thermal and chemical regimes; recommended for Artemis IV ground trials.`,
      ``,
      `---`,
      `## 1. Machine Learning Model Accuracy Benchmark`,
      ...MODEL_BENCHMARK_RESULTS.map(
        (m) =>
          `- **${m.name}:** Holdout R² = ${m.testR2.toFixed(1)}% | 5-Fold CV R² = ${m.cvR2.toFixed(1)}% | RMSE = ${m.testRmse.toFixed(4)} mg/cm² [${m.status}]`,
      ),
      ``,
      `## 2. 2-Year Expedition Schedule (2026–2027)`,
      `- **Salar de Gorbea (Chile):** Nov 2026 – Feb 2027 · 140 Hours · Thermal Cold-Soak & High Sulfate Evaporites`,
      `- **University Valley (Antarctica):** May 2026 – Aug 2026 · 120 Hours · Low-Sun Grazing Light & Cryogenic Permafrost`,
      `- **Black Point Lava Flow (USA):** Mar 2027 – Jun 2027 · 80 Hours · Basaltic Rover Mobility & Traction Durability`,
    ];
    triggerDownload(
      `ECHO-Dossier-${activeTarget.id}-${selectedSite.id}.md`,
      lines.join('\n'),
      'text/markdown',
    );
  };

  const handleExportCsv = () => {
    const csv = buildCsvReport();
    triggerDownload(
      `ECHO-Model-Benchmarks-${activeTarget.id}.csv`,
      csv,
      'text/csv',
    );
  };

  // High-impact benchmark chart data
  const chartData = useMemo(() => {
    return MODEL_BENCHMARK_RESULTS.map((m) => ({
      name: m.name.replace(' Regressor', '').replace(' Trees', '').replace(' Regression', ''),
      fullName: m.name,
      r2: Math.max(0, m.testR2),
      isProduction: m.status === 'Chosen Production',
      status: m.status,
    }));
  }, []);

  // 2-Year Expedition Schedule
  const expeditionSchedule = useMemo(() => {
    return [
      {
        siteName: 'Salar de Gorbea',
        location: 'High Puna, Chile',
        window: 'Nov 2026 – Feb 2027',
        season: 'Austral Summer (Cold-Soak Window)',
        focus: 'Thermal cold-soak & high sulfate chemistry (510 ppm)',
        hours: 140,
        startCol: 4,
        spanCols: 2,
        color: '#166534',
        badge: 'Priority 1 · Chemistry & Cold-Soak',
      },
      {
        siteName: 'University Valley',
        location: 'McMurdo Dry Valleys, Antarctica',
        window: 'May 2026 – Aug 2026',
        season: 'Austral Winter (Low-Sun Grazing Light)',
        focus: 'Cryogenic permafrost coring & shadow navigation',
        hours: 120,
        startCol: 2,
        spanCols: 2,
        color: '#1D4ED8',
        badge: 'Priority 2 · Low-Sun Optical Autonomy',
      },
      {
        siteName: 'Black Point Lava Flow',
        location: 'Arizona, USA',
        window: 'Mar 2027 – Jun 2027',
        season: 'Spring Traverse Campaign',
        focus: 'Rough basaltic slope mobility & autonomous rover traction',
        hours: 80,
        startCol: 5,
        spanCols: 2,
        color: '#A33E11',
        badge: 'Priority 3 · Rover Mobility & Wheels',
      },
    ];
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. EXECUTIVE MISSION SYNTHESIS CARD */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#414943]/10 pb-5">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#EAF4EE] text-[#0F422E] font-mono text-xs font-bold uppercase tracking-wider">
                Module 6 · Validation &amp; Evidence
              </span>
              <span className="text-xs text-[#696156] font-mono">
                Executive Synthesis
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1D1B17] tracking-tight">
              Mission Validation &amp; Evidence Dossier
            </h1>
            <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
              Consolidated flight readiness summary, empirical regression benchmark, and recommended 2-year field campaign schedule.
            </p>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-[#EAF4EE] border border-[#2A5A44]/20 text-center">
            <div className="text-[11px] font-bold text-[#0F422E] uppercase tracking-wider">
              Overall Fidelity Match
            </div>
            <div className="font-display text-3xl font-black text-[#0F422E] tabular-nums mt-0.5">
              {topScore.toFixed(1)}%
            </div>
            <div className="text-[10px] text-[#2A5A44] font-mono">
              Scientific Match Score
            </div>
          </div>
        </div>

        {/* 4 Clean Key Synthesis Readouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#696156] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#0F422E]" />
              Active Target
            </span>
            <div className="font-display text-lg font-bold text-[#1D1B17] truncate">
              {activeTarget.name}
            </div>
            <div className="text-[11px] text-[#696156] font-mono">
              {activeTarget.body.toUpperCase()} · {activeTarget.coordinates}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#696156] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#A33E11]" />
              Top Recommended Analog
            </span>
            <div className="font-display text-lg font-bold text-[#1D1B17] truncate">
              {selectedSite.name}
            </div>
            <div className="text-[11px] text-[#696156] font-mono">
              {selectedSite.country} · {selectedSite.coordinates}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#696156] flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-[#166534]" />
              ML Prediction Accuracy
            </span>
            <div className="font-display text-lg font-bold text-[#166534]">
              R² = 93.39%
            </div>
            <div className="text-[11px] text-[#696156] font-mono">
              Random Forest Production Fit
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#696156] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1D4ED8]" />
              Total Testing Allocation
            </span>
            <div className="font-display text-lg font-bold text-[#1D4ED8]">
              340 Field Hours
            </div>
            <div className="text-[11px] text-[#696156] font-mono">
              Across 3 Complementary Sites
            </div>
          </div>
        </div>

        {/* 1-Sentence Flight Readiness Recommendation */}
        <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#86EFAC] flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
          <div className="text-xs sm:text-sm text-[#14532D] leading-relaxed">
            <strong className="font-bold">Flight Readiness Recommendation:</strong> Ground testbed parameters for <strong>{selectedSite.name}</strong> provide high scientific fidelity ({topScore.toFixed(1)}%) across thermal cold-soak and sulfuric regolith regimes; recommended for Artemis IV preliminary qualification.
          </div>
        </div>
      </section>

      {/* 2. MODEL BENCHMARK BAR CHART (Clean, High-Impact Comparison) */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#414943]/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1D1B17] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#184633]" />
              Model Benchmark Comparison (Holdout R² Accuracy)
            </h2>
            <p className="text-xs text-[#696156] mt-0.5">
              Evaluating candidate machine learning architectures against empirical laboratory wear trials.
            </p>
          </div>
          <span className="text-xs font-mono text-[#0F422E] bg-[#EAF4EE] px-3 py-1 rounded-full font-semibold">
            ★ Random Forest R² = 93.39% (Chosen Production)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#F9F3EB] border border-[#414943]/10">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#414943', fontSize: 11, fontWeight: 600 }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#696156', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: any) => [`${val}% R²`, 'Accuracy']}
                />
                <Bar dataKey="r2" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isProduction ? '#166534' : '#94A3B8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 3. 2-YEAR EXPEDITION SCHEDULE (Clean Visual Timeline) */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/10 shadow-soft-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#414943]/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1D1B17] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#184633]" />
              Recommended 2-Year Expedition Schedule (2026–2027)
            </h2>
            <p className="text-xs text-[#696156] mt-0.5">
              Phased multi-site campaign timeline spanning 340 total operational field hours.
            </p>
          </div>
          <span className="text-xs font-mono text-[#0F422E] bg-[#EAF4EE] px-3 py-1 rounded-full font-semibold">
            3 Phased Windows
          </span>
        </div>

        {/* 8-Quarter Gantt Header */}
        <div className="grid grid-cols-8 gap-2 font-mono text-[11px] font-bold text-[#696156] pb-2 border-b border-[#414943]/10 text-center">
          <span>Q1 2026</span>
          <span>Q2 2026</span>
          <span>Q3 2026</span>
          <span>Q4 2026</span>
          <span>Q1 2027</span>
          <span>Q2 2027</span>
          <span>Q3 2027</span>
          <span>Q4 2027</span>
        </div>

        {/* Gantt Timeline Cards */}
        <div className="space-y-3.5">
          {expeditionSchedule.map((campaign, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#414943]/10 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: campaign.color }}
                  />
                  <span className="font-bold text-[#1D1B17] text-sm">
                    {campaign.siteName}
                  </span>
                  <span className="text-[#696156]">({campaign.location})</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#414943]/10 text-[10px] font-semibold text-[#414943]">
                    {campaign.badge}
                  </span>
                </div>
                <div className="font-mono text-xs text-[#A33E11] font-bold">
                  {campaign.window} · {campaign.hours}h
                </div>
              </div>

              {/* Visual 8-Col Track */}
              <div className="h-8 rounded-xl bg-[#EDE5D8] grid grid-cols-8 items-center px-1">
                <div
                  style={{
                    gridColumn: `${campaign.startCol} / span ${campaign.spanCols}`,
                    backgroundColor: campaign.color,
                  }}
                  className="h-6 rounded-lg text-white font-mono text-[10px] font-bold flex items-center justify-between px-3 shadow-xs"
                >
                  <span className="truncate">{campaign.season}</span>
                  <span className="shrink-0">{campaign.hours}h</span>
                </div>
              </div>

              <div className="text-[11px] text-[#414943]">
                <strong className="text-[#1D1B17]">Primary Stressor:</strong> {campaign.focus}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CLEAN EXPORT BAR */}
      <section className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/10 shadow-soft-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1D1B17]">
          <Download className="w-4 h-4 text-[#184633]" />
          <span>Export Mission Dossier:</span>
          <span className="text-xs font-normal text-[#696156]">Auditable files for technical review</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE5D8] border border-[#414943]/15 text-xs font-bold text-[#1D1B17] flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4 text-[#A33E11]" />
            <span>Download Dossier (.md)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#3B82F6]/30 text-xs font-bold text-[#1E40AF] flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
            <span>Export CSV Metrics</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE5D8] border border-[#414943]/15 text-xs font-bold text-[#4B5563] flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#6B7280]" />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {exportNotice && (
          <div className="w-full text-center text-xs font-mono font-bold text-[#0F422E] bg-[#EAF4EE] py-1.5 rounded-lg border border-[#2A5A44]/20">
            ✓ {exportNotice}
          </div>
        )}
      </section>
    </div>
  );
};
