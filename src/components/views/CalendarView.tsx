import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Pause,
  Play,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DIVINER_SEASONAL_BINS,
  EARTH_CANDIDATE_SITES,
  MANDATORY_BREAKDOWN_ITEMS,
  MONTH_LABELS,
} from '../../data/planetaryData';
import { computeTemporalWindow, dayOfYearToLabel } from '../../engine/analogEngine';
import {
  EarthCandidateSite,
  ObjectiveProfile,
  PlanetaryTarget,
  ScoredCandidate,
} from '../../types/terra';

interface CalendarViewProps {
  activeTarget: PlanetaryTarget;
  activeObjective: ObjectiveProfile;
  rankedCandidates: ScoredCandidate[];
  selectedSite: EarthCandidateSite;
  onSelectSite: (siteId: string) => void;
  seasonalBinIdx: number;
  onChangeSeasonalBin: (idx: number) => void;
  thresholdPct: number;
  onChangeThreshold: (val: number) => void;
  onLaunchLab: () => void;
}

type CalendarStageMode = 'waveforms' | 'stack3d' | 'heatstrip';

export const CalendarView: React.FC<CalendarViewProps> = ({
  activeTarget,
  activeObjective,
  rankedCandidates,
  selectedSite,
  onSelectSite,
  seasonalBinIdx,
  onChangeSeasonalBin,
  thresholdPct,
  onChangeThreshold,
  onLaunchLab,
}) => {
  const [stageMode, setStageMode] = useState<CalendarStageMode>('waveforms');
  const [showThermalWave, setShowThermalWave] = useState(true);
  const [showSolarWave, setShowSolarWave] = useState(true);
  const [showIceWave, setShowIceWave] = useState(true);
  const [scrubDay, setScrubDay] = useState<number>(320); // Mid-November default
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const scoredSite = useMemo(
    () =>
      rankedCandidates.find((c) => c.site.id === selectedSite.id) ||
      rankedCandidates[0],
    [rankedCandidates, selectedSite.id],
  );

  const activeMonthlySeries = useMemo(
    () => scoredSite?.monthlyScores ?? new Array(12).fill(78),
    [scoredSite],
  );

  const activeWindow = useMemo(
    () =>
      computeTemporalWindow(
        selectedSite,
        activeMonthlySeries,
        thresholdPct,
        activeTarget,
      ),
    [selectedSite, activeMonthlySeries, thresholdPct, activeTarget],
  );

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setScrubDay((d) => (d + 3) % 365);
    }, 60);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Isometric 3D Waveform Stack canvas when stack3d mode selected
  useEffect(() => {
    if (stageMode !== 'stack3d') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(400, rect.width);
    const h = Math.max(300, rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#F8F5EE';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(65, 73, 67, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x - 60, h - 20);
      ctx.stroke();
    }

    const numSlices = 12;
    const baseMarginX = 64;
    const sliceWidth = w - baseMarginX * 2 - 90;
    const startY = 74;
    const stepY = (h - 140) / numSlices;
    const skewX = 88;

    for (let s = numSlices - 1; s >= 0; s--) {
      const m = s;
      const depthFrac = s / (numSlices - 1);
      const originX = baseMarginX + depthFrac * skewX;
      const originY = startY + (numSlices - 1 - s) * stepY;

      const monthStartDay = Math.floor((m / 12) * 365);
      const pts: { x: number; y: number; val: number; valid: boolean }[] = [];
      const samples = 36;

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const dayIdx = (monthStartDay + Math.floor(t * 30)) % 365;
        const val = activeWindow.dailyScores[dayIdx];
        const valid = activeWindow.validDayMask[dayIdx];
        const harmonic =
          Math.sin(t * Math.PI * 6 + m * 1.1) * 3.2 +
          Math.cos(t * Math.PI * 11) * 1.4;
        const amp = Math.max(4, ((val + harmonic) / 100) * 58);

        pts.push({
          x: originX + t * sliceWidth,
          y: originY - amp,
          val,
          valid,
        });
      }

      const scrubMonth = Math.min(11, Math.floor((scrubDay / 365) * 12));
      const isScrubMonth = scrubMonth === m;
      const monthHasValid = pts.some((p) => p.valid);

      ctx.beginPath();
      ctx.moveTo(originX, originY);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(originX + sliceWidth, originY);
      ctx.closePath();

      ctx.fillStyle = isScrubMonth
        ? 'rgba(224, 106, 59, 0.22)'
        : monthHasValid
          ? 'rgba(24, 70, 51, 0.16)'
          : 'rgba(243, 237, 229, 0.7)';
      ctx.fill();

      ctx.beginPath();
      pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = isScrubMonth
        ? '#E06A3B'
        : monthHasValid
          ? '#184633'
          : 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = isScrubMonth ? 2.4 : monthHasValid ? 1.8 : 1.1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + sliceWidth, originY);
      ctx.strokeStyle = 'rgba(65, 73, 67, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = isScrubMonth
        ? '#E06A3B'
        : monthHasValid
          ? '#184633'
          : '#696156';
      ctx.fillText(MONTH_LABELS[m], originX - 34, originY + 3);
    }

    const scrubMonth = Math.min(11, Math.floor((scrubDay / 365) * 12));
    const depthFrac = scrubMonth / (numSlices - 1);
    const sOriginX = baseMarginX + depthFrac * skewX;
    const sOriginY = startY + (numSlices - 1 - scrubMonth) * stepY;
    const dayInMonthFrac = ((scrubDay / 365) * 12) % 1;
    const markerX = sOriginX + dayInMonthFrac * sliceWidth;
    const scrubVal = activeWindow.dailyScores[scrubDay];
    const markerY = sOriginY - (scrubVal / 100) * 58;

    ctx.beginPath();
    ctx.moveTo(markerX, sOriginY + 8);
    ctx.lineTo(markerX, markerY - 12);
    ctx.strokeStyle = '#E69A28';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(markerX, markerY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#E06A3B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [activeWindow, scrubDay, stageMode]);

  const scrubDateStr = dayOfYearToLabel(scrubDay);
  const scrubScore = activeWindow.dailyScores[scrubDay];
  const scrubValid = activeWindow.validDayMask[scrubDay];
  const scrubMonthIdx = Math.min(11, Math.floor((scrubDay / 365) * 12));

  // Build 12-month SVG waveform paths for comparative plots
  const buildWavePath = (values: number[], minVal: number, maxVal: number) => {
    const w = 640;
    const h = 76;
    const span = Math.max(1, maxVal - minVal);
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const norm = Math.max(0, Math.min(1, (v - minVal) / span));
        const y = h - 10 - norm * (h - 20);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const thermalWavePts = useMemo(
    () => buildWavePath(selectedSite.monthlyDiurnalDeltaK, 5, 50),
    [selectedSite],
  );
  const solarWavePts = useMemo(
    () => buildWavePath(selectedSite.monthlySolarNoonDeg, 0, 75),
    [selectedSite],
  );
  const iceWavePts = useMemo(
    () => buildWavePath(selectedSite.monthlySnowIcePct, 0, 100),
    [selectedSite],
  );

  const cursorX = (scrubDay / 364) * 640;
  const peakPct = Math.round(activeWindow.peakScore);
  const ringR = 36;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - peakPct / 100);
  const breakdownItems = MANDATORY_BREAKDOWN_ITEMS[activeTarget.body];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_340px] gap-6 items-start">
      {/* LEFT RAIL: Site, Diviner Bins 2x3, Waveform Channels, Threshold */}
      <aside className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-5">
        <div>
          <label
            htmlFor="cal-site-select"
            className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#696156] block mb-2"
          >
            Earth Analog Candidate
          </label>
          <select
            id="cal-site-select"
            value={selectedSite.id}
            onChange={(e) => onSelectSite(e.target.value)}
            className="w-full bg-[#F9F3EB] border border-[#414943]/12 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-[#1D1B17] focus:outline-none focus:ring-2 focus:ring-[#2A5A44]"
          >
            {EARTH_CANDIDATE_SITES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="font-mono text-[11px] text-[#696156] mt-2">
            {selectedSite.coordinates} · {selectedSite.elevationM} m ASL
          </p>
        </div>

        {/* Diviner Target Bins 2x3 Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#696156]">
              Diviner Seasonal Bins
            </span>
            <span className="font-mono text-[10px] text-[#0F422E] font-semibold">
              LRO Epoch
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DIVINER_SEASONAL_BINS.map((bin, idx) => (
              <button
                key={bin.id}
                type="button"
                onClick={() => onChangeSeasonalBin(idx)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  seasonalBinIdx === idx
                    ? 'bg-[#0F422E] text-white border-[#0F422E] shadow-sm'
                    : 'bg-[#F9F3EB] text-[#1D1B17] border-[#414943]/8 hover:border-[#2A5A44]/40'
                }`}
              >
                <div className="text-[11px] font-semibold leading-tight">
                  {bin.label}
                </div>
                <div
                  className={`font-mono text-[10px] mt-1 ${
                    seasonalBinIdx === idx ? 'text-[#BAEED1]' : 'text-[#696156]'
                  }`}
                >
                  {bin.solarElev}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Waveform Channels Toggle List */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#696156] block mb-2">
            Waveform Channels
          </span>
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-xs cursor-pointer">
              <span className="font-medium text-[#1D1B17] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E06A3B]" />
                Thermal Cycling ΔT
              </span>
              <input
                type="checkbox"
                checked={showThermalWave}
                onChange={(e) => setShowThermalWave(e.target.checked)}
                className="accent-[#0F422E] w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-xs cursor-pointer">
              <span className="font-medium text-[#1D1B17] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D9822B]" />
                Solar Grazing Angle
              </span>
              <input
                type="checkbox"
                checked={showSolarWave}
                onChange={(e) => setShowSolarWave(e.target.checked)}
                className="accent-[#0F422E] w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-xs cursor-pointer">
              <span className="font-medium text-[#1D1B17] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2A5A44]" />
                Cryo-Frost Stability
              </span>
              <input
                type="checkbox"
                checked={showIceWave}
                onChange={(e) => setShowIceWave(e.target.checked)}
                className="accent-[#0F422E] w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Fidelity Threshold Cutoff */}
        <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-[#1D1B17] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#2A5A44]" />
              Threshold Cutoff
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#EAF4EE] font-mono text-[11px] font-semibold text-[#0F422E]">
              ≥ {thresholdPct}%
            </span>
          </div>
          <input
            type="range"
            min={55}
            max={90}
            step={1}
            value={thresholdPct}
            onChange={(e) => onChangeThreshold(parseInt(e.target.value, 10))}
            className="w-full terra-slider"
            aria-label="Temporal window fidelity threshold"
          />
          <p className="text-[11px] text-[#696156] mt-2 leading-snug">
            Contiguous window extraction where daily spline fidelity{' '}
            <span className="font-mono">F(t) ≥ {thresholdPct}%</span>.
          </p>
        </div>
      </aside>

      {/* CENTER STAGE: Analog Window Matrix, Heatstrip, Stacked Waveforms / 3D Stack */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#1D1B17]">
              Analog Window Matrix
            </h2>
            <p className="text-xs text-[#696156]">
              365-day seasonal overlap comparing {selectedSite.name.split(' (')[0]} vs{' '}
              {activeTarget.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/8">
              {(
                [
                  { id: 'waveforms', label: 'Waveforms' },
                  { id: 'heatstrip', label: 'Heatstrip' },
                  { id: 'stack3d', label: '3D Horizon Stack' },
                ] as { id: CalendarStageMode; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setStageMode(m.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    stageMode === m.id
                      ? 'bg-[#FFFFFF] text-[#0F422E] font-semibold shadow-sm'
                      : 'text-[#696156] hover:text-[#1D1B17]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0F422E] text-white text-xs font-semibold hover:bg-[#2A5A44] transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{isPlaying ? 'Pause' : 'Play Cycle'}</span>
            </button>
          </div>
        </div>

        {/* Active Window Gradient Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#EAF4EE] via-[#FAF7F2] to-[#FDF2EC] border border-[#2A5A44]/15 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0F422E]">
              Active Valid Expedition Window ({activeObjective.shortName})
            </span>
            <div className="font-display text-2xl font-bold text-[#1D1B17] mt-0.5">
              {activeWindow.startDateLabel} – {activeWindow.endDateLabel}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-[#FFFFFF] border border-[#414943]/10 text-center">
              <div className="text-[10px] text-[#696156] uppercase">Duration</div>
              <div className="font-mono text-sm font-bold text-[#0F422E]">
                {activeWindow.durationDays} Days
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-[#FFFFFF] border border-[#414943]/10 text-center">
              <div className="text-[10px] text-[#696156] uppercase">Peak Score</div>
              <div className="font-mono text-sm font-bold text-[#A33E11]">
                {activeWindow.peakScore.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* 12-Month Annual Fidelity Heatstrip */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-[#1D1B17]">
              Annual Monthly Fidelity Heatstrip
            </span>
            <span className="font-mono text-[11px] text-[#696156]">
              Peak Day: {activeWindow.peakDateLabel}
            </span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {MONTH_LABELS.map((m, idx) => {
              const val = activeMonthlySeries[idx];
              const isValid = val >= thresholdPct;
              const isPeak = val >= activeWindow.peakScore - 3;
              const isScrubbed = scrubMonthIdx === idx;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setScrubDay(Math.round((idx / 12) * 365 + 14))}
                  className={`py-2 px-1.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    isScrubbed
                      ? 'ring-2 ring-[#E06A3B] border-[#E06A3B]'
                      : 'border-[#414943]/10'
                  } ${
                    isPeak
                      ? 'bg-[#0F422E] text-white'
                      : isValid
                        ? 'bg-[#EAF4EE] text-[#0F422E]'
                        : 'bg-[#F9F3EB] text-[#696156]'
                  }`}
                >
                  <div className="font-mono text-[10px] font-semibold">{m}</div>
                  <div className="font-mono text-xs font-bold mt-0.5">
                    {val.toFixed(0)}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Main Stage Content */}
        {stageMode === 'stack3d' ? (
          <div className="h-[340px] rounded-2xl overflow-hidden border border-[#222938] relative">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="pointer-events-none absolute top-3 right-3 bg-[#12161F]/95 border border-[#222938] rounded-xl px-3 py-1.5 text-[11px] font-mono text-[#F0F4F8]">
              Green Strata = Analog Window ≥ {thresholdPct}% · Amber = Cursor
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {showThermalWave && (
              <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#1D1B17]">
                    01. Diurnal Thermal Amplitude ΔT (K)
                  </span>
                  <span className="font-mono text-[11px] text-[#A33E11] font-semibold">
                    {selectedSite.monthlyDiurnalDeltaK[scrubMonthIdx]} K on {scrubDateStr}
                  </span>
                </div>
                <svg viewBox="0 0 640 76" className="w-full h-18">
                  <line
                    x1="0"
                    y1="26"
                    x2="640"
                    y2="26"
                    stroke="#0F422E"
                    strokeDasharray="4 3"
                    strokeOpacity="0.4"
                  />
                  <polyline
                    fill="none"
                    stroke="#E06A3B"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    points={thermalWavePts}
                  />
                  <line
                    x1={cursorX}
                    y1="0"
                    x2={cursorX}
                    y2="76"
                    stroke="#0F422E"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                </svg>
              </div>
            )}

            {showSolarWave && (
              <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#1D1B17]">
                    02. Solar Noon Elevation Angle (°)
                  </span>
                  <span className="font-mono text-[11px] text-[#D9822B] font-semibold">
                    {selectedSite.monthlySolarNoonDeg[scrubMonthIdx].toFixed(1)}° vs{' '}
                    {activeTarget.solarElevationMeanDeg.toFixed(1)}° target
                  </span>
                </div>
                <svg viewBox="0 0 640 76" className="w-full h-18">
                  <line
                    x1="0"
                    y1="56"
                    x2="640"
                    y2="56"
                    stroke="#0F422E"
                    strokeDasharray="4 3"
                    strokeOpacity="0.4"
                  />
                  <polyline
                    fill="none"
                    stroke="#D9822B"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    points={solarWavePts}
                  />
                  <line
                    x1={cursorX}
                    y1="0"
                    x2={cursorX}
                    y2="76"
                    stroke="#0F422E"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                </svg>
              </div>
            )}

            {showIceWave && (
              <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#1D1B17]">
                    03. Surface Snow / Cryo-Moisture Persistence (%)
                  </span>
                  <span className="font-mono text-[11px] text-[#0F422E] font-semibold">
                    {selectedSite.monthlySnowIcePct[scrubMonthIdx]}% cover
                  </span>
                </div>
                <svg viewBox="0 0 640 76" className="w-full h-18">
                  <polyline
                    fill="none"
                    stroke="#2A5A44"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    points={iceWavePts}
                  />
                  <line
                    x1={cursorX}
                    y1="0"
                    x2={cursorX}
                    y2="76"
                    stroke="#0F422E"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Temporal Scrubber Cursor */}
        <div className="p-4 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-[#1D1B17]">
              Temporal Scrubber Cursor
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold ${
                scrubValid
                  ? 'bg-[#EAF4EE] text-[#0F422E]'
                  : 'bg-[#FDF2EC] text-[#A33E11]'
              }`}
            >
              {scrubDateStr} · {scrubScore.toFixed(1)}% ·{' '}
              {scrubValid ? 'IN ANALOG WINDOW' : 'OUTSIDE WINDOW'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={364}
            value={scrubDay}
            onChange={(e) => setScrubDay(parseInt(e.target.value, 10))}
            className="w-full terra-slider"
            aria-label="Scrub day of year"
          />
          <div className="flex justify-between font-mono text-[10px] text-[#696156] mt-1.5">
            <span>Jan 1</span>
            <span>Apr 1</span>
            <span>Jul 1</span>
            <span>Oct 1</span>
            <span>Dec 31</span>
          </div>
        </div>
      </section>

      {/* RIGHT INSPECTOR: Window Dossier */}
      <aside className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0F422E] flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Window Dossier
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[#0F422E] font-semibold">
            {activeWindow.durationDays}d Match
          </span>
        </div>

        {/* Peak Fidelity Circular Ring Gauge */}
        <div className="p-4 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 flex items-center gap-4">
          <div className="relative w-22 h-22 flex items-center justify-center shrink-0">
            <svg className="w-22 h-22 -rotate-90" viewBox="0 0 88 88">
              <circle
                cx="44"
                cy="44"
                r={ringR}
                fill="none"
                stroke="#E5DDD0"
                strokeWidth="7"
              />
              <circle
                cx="44"
                cy="44"
                r={ringR}
                fill="none"
                stroke="#0F422E"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <span className="absolute font-display text-xl font-bold text-[#0F422E] tabular-nums">
              {peakPct}%
            </span>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#696156]">
              Peak Window Fidelity
            </div>
            <div className="font-display text-base font-bold text-[#1D1B17] mt-0.5">
              {selectedSite.name.split(' (')[0]}
            </div>
            <div className="font-mono text-[11px] text-[#0F422E] mt-1">
              Peak: {activeWindow.peakDateLabel}
            </div>
          </div>
        </div>

        {/* Why This Window Works */}
        <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-xs space-y-2">
          <div className="font-semibold text-[#1D1B17]">
            Why This Window Works ({scrubDateStr})
          </div>
          <p className="text-[11px] text-[#414943] leading-relaxed">
            {activeWindow.processAlignmentNote}
          </p>
          <div className="grid grid-cols-2 gap-y-1.5 pt-2 border-t border-[#414943]/10 font-mono text-[11px]">
            <span className="text-[#696156]">Earth Min / Max T</span>
            <span className="text-right font-semibold text-[#1D1B17]">
              {selectedSite.monthlyMinTempC[scrubMonthIdx]}°C /{' '}
              {selectedSite.monthlyMaxTempC[scrubMonthIdx]}°C
            </span>
            <span className="text-[#696156]">Diurnal Swing ΔT</span>
            <span className="text-right font-semibold text-[#A33E11]">
              {selectedSite.monthlyDiurnalDeltaK[scrubMonthIdx]} K
            </span>
            <span className="text-[#696156]">Solar Noon Elev</span>
            <span className="text-right font-semibold text-[#1D1B17]">
              {selectedSite.monthlySolarNoonDeg[scrubMonthIdx].toFixed(1)}°
            </span>
          </div>
        </div>

        {/* Field Expedition Logistics */}
        <div className="p-3.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-xs">
          <div className="font-semibold text-[#1D1B17] mb-1">
            Field Expedition Logistics
          </div>
          <p className="text-[11px] text-[#414943] leading-relaxed">
            {selectedSite.fieldAccessNotes}
          </p>
        </div>

        {/* Where the Analogy Fails */}
        <div className="p-3.5 rounded-2xl bg-[#FDF2EC] border border-[#E06A3B]/25 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#A33E11] mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Where The Analogy Fails</span>
          </div>
          <p className="text-[11px] text-[#414943] leading-snug">
            {breakdownItems[0].pillar}: {breakdownItems[0].earthValue} vs{' '}
            {breakdownItems[0].targetValue}. {breakdownItems[1].pillar}:{' '}
            {breakdownItems[1].earthValue} vs {breakdownItems[1].targetValue}.
          </p>
        </div>

        <button
          type="button"
          onClick={onLaunchLab}
          className="w-full py-3.5 px-6 rounded-full bg-[#184633] hover:bg-[#0F3525] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span>Lock Window &amp; Plan Traverse</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </aside>
    </div>
  );
};
