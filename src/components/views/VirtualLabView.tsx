import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Mountain,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MANDATORY_BREAKDOWN_ITEMS } from '../../data/planetaryData';
import {
  analyzeRoverTraverse,
  sampleTerrainElevationM,
} from '../../engine/analogEngine';
import {
  EarthCandidateSite,
  PlanetaryTarget,
  TraverseWaypoint,
} from '../../types/terra';

interface VirtualLabViewProps {
  activeTarget: PlanetaryTarget;
  selectedSite: EarthCandidateSite;
  onLaunchSimulator: () => void;
}

const CORROSION_ENVIRONMENTS = [
  { label: 'Lunar: Malapert Massif (510 ppm)', sulfurPpm: 510 },
  { label: 'Earth: Stillwater Complex (890 ppm)', sulfurPpm: 890 },
  { label: 'Earth: Craters of the Moon (640 ppm)', sulfurPpm: 640 },
];
const LUNAR_TARGET_SULFUR_PPM = 420;

function calculateBaselineWear(sulfurPpm: number, days: number) {
  return (
    0.015 *
    Math.pow(sulfurPpm / 500, 1.15) *
    Math.pow(Math.max(days, 0) / 30, 0.78)
  );
}

function generateWearProjection(lunarPpm: number, earthPpm: number) {
  return Array.from({ length: 50 }, (_, index) => {
    const day = Math.round((index / 49) * 1000);
    return {
      day,
      lunarWear: calculateBaselineWear(lunarPpm, day),
      earthWear: calculateBaselineWear(earthPpm, day),
    };
  });
}

const DEFAULT_PRESETS: Record<string, TraverseWaypoint[]> = {
  rim_recon: [
    { id: 'w1', xNorm: 0.14, yNorm: 0.78 },
    { id: 'w2', xNorm: 0.34, yNorm: 0.62 },
    { id: 'w3', xNorm: 0.54, yNorm: 0.45 },
    { id: 'w4', xNorm: 0.72, yNorm: 0.32 },
    { id: 'w5', xNorm: 0.86, yNorm: 0.22 },
  ],
  crater_edge: [
    { id: 'w1', xNorm: 0.18, yNorm: 0.72 },
    { id: 'w2', xNorm: 0.36, yNorm: 0.64 },
    { id: 'w3', xNorm: 0.58, yNorm: 0.7 },
    { id: 'w4', xNorm: 0.8, yNorm: 0.44 },
  ],
};

type StageMode = 'route25d' | 'contour' | 'shadow';

export const VirtualLabView: React.FC<VirtualLabViewProps> = ({
  activeTarget,
  selectedSite,
  onLaunchSimulator,
}) => {
  const [waypoints, setWaypoints] = useState<TraverseWaypoint[]>(
    DEFAULT_PRESETS.rim_recon,
  );
  const [stageMode, setStageMode] = useState<StageMode>('route25d');
  const [roverClearanceCm, setRoverClearanceCm] = useState(38);
  const [solarArrayHeightM, setSolarArrayHeightM] = useState(1.8);
  const [drillDepthCm, setDrillDepthCm] = useState(100);
  const [showSlopeHazard, setShowSlopeHazard] = useState(true);
  const [showShadowZones, setShowShadowZones] = useState(true);
  const [showMicroSlip, setShowMicroSlip] = useState(true);
  const [abrasiveStress, setAbrasiveStress] = useState(true);
  const [roverProgress, setRoverProgress] = useState(0.54);
  const [animating, setAnimating] = useState(false);
  const [sulfurPpm, setSulfurPpm] = useState(510);
  const [exposureDays, setExposureDays] = useState(365);
  const [predictedDegradation, setPredictedDegradation] = useState<number | null>(
    null,
  );
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const earthCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wearProjection = useMemo(
    () => generateWearProjection(LUNAR_TARGET_SULFUR_PPM, sulfurPpm),
    [sulfurPpm],
  );

  const analysis = useMemo(
    () =>
      analyzeRoverTraverse(
        waypoints,
        selectedSite,
        activeTarget,
        solarArrayHeightM,
        roverClearanceCm,
      ),
    [waypoints, selectedSite, activeTarget, solarArrayHeightM, roverClearanceCm],
  );

  useEffect(() => {
    if (!animating) return;
    const id = window.setInterval(() => {
      setRoverProgress((p) => (p >= 1 ? 0 : p + 0.015));
    }, 50);
    return () => clearInterval(id);
  }, [animating]);

  useEffect(() => {
    const controller = new AbortController();

    const simulateWear = async () => {
      setSimulationError(null);
      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/simulate-wear/',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sulfur_ppm: sulfurPpm,
              exposure_days: exposureDays,
            }),
            signal: controller.signal,
          },
        );
        const payload = (await response.json()) as {
          predicted_degradation_mg_cm2?: number;
          error?: string;
        };
        if (!response.ok || payload.predicted_degradation_mg_cm2 === undefined) {
          throw new Error(payload.error || `Backend returned ${response.status}`);
        }
        setPredictedDegradation(payload.predicted_degradation_mg_cm2);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setPredictedDegradation(null);
        setSimulationError(
          error instanceof Error
            ? error.message
            : 'Unable to run the corrosion simulation.',
        );
      }
    };

    void simulateWear();
    return () => controller.abort();
  }, [sulfurPpm, exposureDays]);

  const renderTerrainMap = (
    canvas: HTMLCanvasElement | null,
    isTarget: boolean,
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, rect.width);
    const h = Math.max(220, rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const baseElev = isTarget ? activeTarget.elevationM : selectedSite.elevationM;
    const slope = isTarget ? activeTarget.meanSlopeDeg : selectedSite.slopeDeg;
    const rough = isTarget
      ? activeTarget.rmsRoughnessM
      : selectedSite.rmsRoughnessM;
    const seed = isTarget
      ? activeTarget.body === 'moon'
        ? 1.4
        : 2.9
      : (Math.abs(selectedSite.lat) % 10) * 0.3;

    const cols = 48;
    const rows = 36;
    const elevGrid: number[][] = [];
    let minE = Infinity;
    let maxE = -Infinity;

    for (let r = 0; r < rows; r++) {
      const rowArr: number[] = [];
      for (let c = 0; c < cols; c++) {
        const e = sampleTerrainElevationM(
          c / (cols - 1),
          r / (rows - 1),
          baseElev,
          slope,
          rough,
          seed,
        );
        if (e < minE) minE = e;
        if (e > maxE) maxE = e;
        rowArr.push(e);
      }
      elevGrid.push(rowArr);
    }

    const span = Math.max(1, maxE - minE);
    const cellW = w / cols;
    const cellH = h / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const e = elevGrid[r][c];
        const norm = (e - minE) / span;
        const inShadow =
          showShadowZones && e < baseElev - (isTarget ? 12 : 16);

        if (stageMode === 'shadow' && inShadow) {
          ctx.fillStyle = '#3B342C';
        } else if (inShadow && isTarget && activeTarget.body === 'moon') {
          ctx.fillStyle = `rgb(${Math.round(58 + norm * 32)}, ${Math.round(52 + norm * 28)}, ${Math.round(45 + norm * 24)})`;
        } else if (isTarget && activeTarget.body === 'mars') {
          ctx.fillStyle = `rgb(${Math.round(176 + norm * 52)}, ${Math.round(115 + norm * 42)}, ${Math.round(82 + norm * 36)})`;
        } else {
          // Terra Calm studio parchment-olive topographic shading
          ctx.fillStyle = `rgb(${Math.round(234 - norm * 62)}, ${Math.round(230 - norm * 45)}, ${Math.round(216 - norm * 52)})`;
        }
        ctx.fillRect(
          c * cellW,
          r * cellH,
          Math.ceil(cellW),
          Math.ceil(cellH),
        );
      }
    }

    // Contour isolines
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        const b1 = Math.floor(((elevGrid[r][c] - minE) / span) * 10);
        const b2 = Math.floor(((elevGrid[r][c + 1] - minE) / span) * 10);
        const b3 = Math.floor(((elevGrid[r + 1][c] - minE) / span) * 10);
        if (b1 !== b2 || b1 !== b3) {
          ctx.fillStyle =
            stageMode === 'contour'
              ? 'rgba(15, 66, 46, 0.34)'
              : 'rgba(65, 73, 67, 0.22)';
          ctx.fillRect(c * cellW, r * cellH, 1.3, 1.3);
        }
      }
    }

    // Highlight steep hazard cluster circle
    if (showSlopeHazard && waypoints.length >= 3) {
      const hz = waypoints[Math.floor(waypoints.length / 2)];
      ctx.beginPath();
      ctx.arc(hz.xNorm * w, hz.yNorm * h, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(224, 106, 59, 0.16)';
      ctx.fill();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#A33E11';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Traverse path
    if (waypoints.length >= 2) {
      ctx.beginPath();
      waypoints.forEach((wp, i) => {
        const px = wp.xNorm * w;
        const py = wp.yNorm * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      waypoints.forEach((wp, i) => {
        const px = wp.xNorm * w;
        const py = wp.yNorm * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = isTarget ? '#E06A3B' : '#0F422E';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }

    waypoints.forEach((wp, idx) => {
      const px = wp.xNorm * w;
      const py = wp.yNorm * h;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = isTarget ? '#A33E11' : '#0F422E';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#1D1B17';
      ctx.fillText(`WP-0${idx + 1}`, px + 8, py - 5);
    });

    if (waypoints.length >= 2) {
      const segs = waypoints.length - 1;
      const scaled = roverProgress * segs;
      const segIdx = Math.min(segs - 1, Math.floor(scaled));
      const localT = scaled - segIdx;
      const a = waypoints[segIdx];
      const b = waypoints[segIdx + 1];
      const rx = (a.xNorm + (b.xNorm - a.xNorm) * localT) * w;
      const ry = (a.yNorm + (b.yNorm - a.yNorm) * localT) * h;

      ctx.beginPath();
      ctx.arc(rx, ry, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#E69A28';
      ctx.fill();
      ctx.strokeStyle = '#1D1B17';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  useEffect(() => {
    renderTerrainMap(earthCanvasRef.current, false);
    renderTerrainMap(targetCanvasRef.current, true);
  }, [
    waypoints,
    selectedSite,
    activeTarget,
    roverProgress,
    stageMode,
    showSlopeHazard,
    showShadowZones,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xNorm = Math.max(
      0.06,
      Math.min(0.94, (e.clientX - rect.left) / rect.width),
    );
    const yNorm = Math.max(
      0.06,
      Math.min(0.94, (e.clientY - rect.top) / rect.height),
    );
    setWaypoints((prev) => {
      const next = prev.length >= 7 ? prev.slice(1) : prev;
      return [...next, { id: `w_${Date.now()}`, xNorm, yNorm }];
    });
  };

  const profileSvg = useMemo(() => {
    const pts = analysis.profilePoints;
    if (pts.length < 2) return { poly: '', area: '' };
    const vals = pts.map((p) => p.targetElevM);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = Math.max(1, max - min);
    const polyPts = pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * 420;
      const y = 76 - 10 - ((p.targetElevM - min) / span) * 54;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return {
      poly: polyPts.join(' '),
      area: `0,76 ${polyPts.join(' ')} 420,76`,
    };
  }, [analysis]);

  const breakdownItems = MANDATORY_BREAKDOWN_ITEMS[activeTarget.body];
  const estEnergyKwh = (
    (analysis.totalDistanceM / 1000) *
    (abrasiveStress ? 0.44 : 0.36)
  ).toFixed(2);
  const solarIllumPct = Math.max(
    42,
    Math.min(98, 92 - analysis.shadowTrapDurationMin * 0.25),
  ).toFixed(1);

  return (
    <div className="flex flex-col gap-6">
      {/* TOP HERO SIMULATION BANNER matching Stitch Virtual Field Lab */}
      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4EE] text-[#0F422E] font-mono text-[11px] font-semibold">
              PHYSICS SIMULATION v3.8
            </span>
            <span className="font-mono text-[11px] text-[#A33E11] font-semibold">
              TRAVERSE SOL-0824
            </span>
            <span className="text-[11px] text-[#696156]">
              · Simulant Engine: Artemis Granular 4.1
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#1D1B17]">
            {activeTarget.name} <span className="font-normal text-[#696156]">vs</span>{' '}
            {selectedSite.name.split(' (')[0]} Transect
          </h1>
        </div>

        <div className="bg-[#F9F3EB] rounded-2xl border border-[#414943]/8 px-4 py-2.5 flex flex-wrap items-center gap-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#696156]">
              Total Traverse
            </div>
            <div className="font-display text-lg font-bold text-[#1D1B17] tabular-nums">
              {(analysis.totalDistanceM / 1000).toFixed(2)}{' '}
              <span className="text-xs font-normal text-[#696156]">km</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#696156]">
              Waypoints
            </div>
            <div className="font-display text-lg font-bold text-[#1D1B17] tabular-nums">
              {waypoints.length}{' '}
              <span className="text-xs font-normal text-[#696156]">Autonomous</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#696156]">
              Est. Energy Req.
            </div>
            <div className="font-display text-lg font-bold text-[#A33E11] tabular-nums">
              {estEnergyKwh}{' '}
              <span className="text-xs font-normal text-[#696156]">kWh</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAnimating((a) => !a)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0F422E] hover:bg-[#2A5A44] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{animating ? 'Pause Sim' : 'Run Sim'}</span>
          </button>
        </div>
      </section>

      <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FDF2EC] text-[#A33E11] font-mono text-[11px] font-semibold">
              SULFUR-CORROSION SIMULATOR
            </span>
            <h2 className="mt-2 font-display text-xl font-bold text-[#1D1B17]">
              Material Wear Projection
            </h2>
            <p className="mt-1 text-xs text-[#696156]">
              Random Forest estimate trained on the supplied NASA benchmark dataset.
            </p>
          </div>
          <div className="rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 px-5 py-3 text-right min-w-[220px]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#696156]">
              PREDICTED DEGRADATION
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-[#A33E11] tabular-nums">
              {predictedDegradation === null
                ? '—'
                : `${predictedDegradation.toFixed(4)} mg/cm²`}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="text-xs font-semibold text-[#414943]">
            Test Environment
            <select
              value={sulfurPpm}
              onChange={(event) => setSulfurPpm(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-[#414943]/15 bg-[#F9F3EB] px-3 py-2.5 text-xs font-medium text-[#1D1B17] outline-none focus:border-[#184633]"
            >
              {CORROSION_ENVIRONMENTS.map((environment) => (
                <option
                  key={environment.sulfurPpm}
                  value={environment.sulfurPpm}
                >
                  {environment.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-[#414943]">
            Mission Timeline Scrubber
            <span className="float-right font-mono text-[#A33E11]">
              {exposureDays} days
            </span>
            <input
              type="range"
              min={1}
              max={1000}
              value={exposureDays}
              onChange={(event) => setExposureDays(Number(event.target.value))}
              className="terra-slider mt-4 w-full"
              aria-label="Exposure duration in days"
            />
            <span className="mt-1 flex justify-between text-[10px] font-normal text-[#696156]">
              <span>1 day</span>
              <span>1000 days</span>
            </span>
          </label>
        </div>

        <div className="mt-6 rounded-2xl bg-[#F9F3EB] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-bold text-[#1D1B17]">
                Comparative Material Wear Projection
              </h3>
              <p className="font-mono text-[10px] text-[#696156]">
                Baseline physics projection · 0–1000 days
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="inline-flex items-center gap-1.5 text-[#A33E11]">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                Lunar Target · {LUNAR_TARGET_SULFUR_PPM} ppm
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#166534]">
                <span className="h-2 w-2 rounded-full bg-[#166534]" />
                Earth Analog · {sulfurPpm} ppm
              </span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wearProjection} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lunarWearGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="earthWearGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#166534" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#166534" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" strokeOpacity={0.7} />
                <XAxis
                  dataKey="day"
                  ticks={[0, 200, 400, 600, 800, 1000]}
                  tick={{ fill: '#696156', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.7 }}
                  label={{ value: 'Mission Days', position: 'insideBottom', offset: -2, fill: '#696156', fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: '#696156', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => value.toFixed(2)}
                  label={{ value: 'mg/cm²', angle: -90, position: 'insideLeft', fill: '#696156', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1D1B17',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '10px',
                  }}
                  labelFormatter={(day) => `Day ${day}`}
                  formatter={(value, name) => [
                    `${Number(value).toFixed(4)} mg/cm²`,
                    name === 'lunarWear' ? 'Lunar Target' : 'Earth Analog',
                  ]}
                />
                <ReferenceLine
                  y={0.15}
                  stroke="#DC2626"
                  strokeDasharray="6 4"
                  label={{
                    value: 'Critical Wear Threshold (0.15 mg/cm²)',
                    fill: '#DC2626',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <ReferenceLine
                  x={exposureDays}
                  stroke="#1D1B17"
                  strokeDasharray="3 3"
                  label={{
                    value: `Day ${exposureDays}`,
                    fill: '#1D1B17',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="lunarWear"
                  stroke="#f97316"
                  fill="url(#lunarWearGradient)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="earthWear"
                  stroke="#166534"
                  fill="url(#earthWearGradient)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {simulationError && (
          <p className="mt-4 rounded-xl border border-[#FFDBCF] bg-[#FDF2EC] px-3 py-2 text-[10px] font-medium text-[#A33E11]">
            {simulationError}
          </p>
        )}
      </section>

      {/* 3-COLUMN VIRTUAL LAB GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[295px_1fr_345px] gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Mobility Specs Card */}
          <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-display font-bold text-[#1D1B17] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F422E]" />
                Mobility Specs
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#F3EDE5] font-mono text-[10px] text-[#696156]">
                LTV-VIPER
              </span>
            </div>

            <p className="text-[11px] text-[#696156] leading-snug">
              Baseline rover calibrated against {selectedSite.name.split(' (')[0]}{' '}
              terrain mechanics.
            </p>

            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#414943]">Ground Clearance</span>
                  <span className="font-mono font-semibold text-[#1D1B17]">
                    {roverClearanceCm} cm
                  </span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={48}
                  value={roverClearanceCm}
                  onChange={(e) => setRoverClearanceCm(parseInt(e.target.value, 10))}
                  className="w-full terra-slider"
                  aria-label="Rover ground clearance"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#414943]">Solar Mast Height</span>
                  <span className="font-mono font-semibold text-[#1D1B17]">
                    {solarArrayHeightM.toFixed(1)} m
                  </span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={2.8}
                  step={0.1}
                  value={solarArrayHeightM}
                  onChange={(e) =>
                    setSolarArrayHeightM(parseFloat(e.target.value))
                  }
                  className="w-full terra-slider"
                  aria-label="Solar mast height"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#414943]">Subsurface Drill</span>
                  <span className="font-mono font-semibold text-[#1D1B17]">
                    {(drillDepthCm / 100).toFixed(2)} m
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={150}
                  step={10}
                  value={drillDepthCm}
                  onChange={(e) => setDrillDepthCm(parseInt(e.target.value, 10))}
                  className="w-full terra-slider"
                  aria-label="Subsurface drill depth"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#414943]/10 flex items-center justify-center text-[#0F422E] shrink-0">
                <Mountain className="w-4 h-4" />
              </div>
              <div className="text-[11px]">
                <div className="font-semibold text-[#1D1B17]">
                  Ballast Rig Active
                </div>
                <div className="font-mono text-[#696156]">
                  Gravity Offset: 1 : {activeTarget.body === 'moon' ? '0.166' : '0.378'}
                </div>
              </div>
            </div>
          </section>

          {/* Hazard Overlays Card */}
          <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-display font-bold text-[#1D1B17]">
                Hazard Overlays
              </span>
              <span className="font-mono text-[11px] font-semibold text-[#A33E11]">
                {[showSlopeHazard, showShadowZones, showMicroSlip].filter(Boolean).length}{' '}
                Active
              </span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-xs cursor-pointer">
                <div>
                  <div className="font-semibold text-[#1D1B17]">
                    Slope Hazard (&gt;15°)
                  </div>
                  <div className="text-[10px] text-[#696156]">
                    Tipping & high motor torque
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showSlopeHazard}
                  onChange={(e) => setShowSlopeHazard(e.target.checked)}
                  className="accent-[#0F422E] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-xs cursor-pointer">
                <div>
                  <div className="font-semibold text-[#1D1B17]">
                    Permanently Shadowed
                  </div>
                  <div className="text-[10px] text-[#696156]">
                    Sub-40 K thermal drop rate
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showShadowZones}
                  onChange={(e) => setShowShadowZones(e.target.checked)}
                  className="accent-[#0F422E] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 text-xs cursor-pointer">
                <div>
                  <div className="font-semibold text-[#1D1B17]">
                    Micro-roughness Slip
                  </div>
                  <div className="text-[10px] text-[#696156]">
                    Evaporite crust collapse
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showMicroSlip}
                  onChange={(e) => setShowMicroSlip(e.target.checked)}
                  className="accent-[#0F422E] w-4 h-4"
                />
              </label>
            </div>

            <div className="pt-2 border-t border-[#414943]/8">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#696156] mb-2">
                Mobility Stress Mode
              </div>
              <div className="p-3 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-[#1D1B17]">
                    Abrasive Regolith Shear
                  </div>
                  <div className="text-[10px] text-[#696156]">
                    Simulates electrostatic grip loss
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={abrasiveStress}
                  onClick={() => setAbrasiveStress((s) => !s)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${
                    abrasiveStress ? 'bg-[#E06A3B]' : 'bg-[#C0C9C1]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      abrasiveStress ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Solar Illumination Card */}
          <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-[#696156]">
                Solar Illumination
              </span>
              <span className="font-mono font-bold text-[#1D1B17]">
                {solarIllumPct}% Ridge Crest
              </span>
            </div>
            <div className="h-2 w-full bg-[#EDE5D8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D9822B] rounded-full"
                style={{ width: `${solarIllumPct}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-[#696156] mt-2">
              <span>Direct Azimuth 174°</span>
              <span>Shadow Trap {analysis.shadowTrapDurationMin} min</span>
            </div>
          </section>
        </div>

        {/* CENTER STAGE: 2.5D Topographic Traverse Stage + Elevation Profile */}
        <section className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F422E]" />
              <h2 className="font-display text-base font-bold text-[#1D1B17]">
                2.5D Topographic Traverse Stage
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F3EDE5] font-mono text-[10px] text-[#696156]">
                DEM: 0.5m/px
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-[#F3EDE5] rounded-full border border-[#414943]/8">
                {(
                  [
                    { id: 'route25d', label: 'Route 2.5D' },
                    { id: 'contour', label: 'Contour Hazard' },
                    { id: 'shadow', label: 'Shadow Mask' },
                  ] as { id: StageMode; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setStageMode(m.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
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
                onClick={() => {
                  setWaypoints(DEFAULT_PRESETS.rim_recon);
                  setRoverProgress(0.15);
                }}
                className="p-2 rounded-full bg-[#F3EDE5] text-[#414943] hover:text-[#1D1B17] cursor-pointer"
                title="Reset traverse path"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Side-by-Side Interactive Topographic Canvases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#F9F3EB] border border-[#414943]/10 p-3 flex flex-col">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-[#0F422E]">
                  Earth Proxy: {selectedSite.name.split(' (')[0]}
                </span>
                <span className="font-mono text-[11px] text-[#696156]">
                  Slope {selectedSite.slopeDeg}°
                </span>
              </div>
              <div className="h-[260px] rounded-2xl overflow-hidden relative">
                <canvas
                  ref={earthCanvasRef}
                  onClick={handleCanvasClick}
                  className="w-full h-full block cursor-crosshair"
                />
                <div className="pointer-events-none absolute bottom-2.5 left-2.5 bg-[#FFFFFF] rounded-xl px-2.5 py-1.5 border border-[#414943]/12 shadow-sm text-[10px]">
                  <div className="font-semibold text-[#1D1B17]">
                    WP-01 Deployment
                  </div>
                  <div className="font-mono text-[#696156]">
                    0.0 km · Elev {selectedSite.elevationM}m
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F9F3EB] border border-[#414943]/10 p-3 flex flex-col">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-[#A33E11]">
                  Target: {activeTarget.name}
                </span>
                <span className="font-mono text-[11px] text-[#696156]">
                  Slope {activeTarget.meanSlopeDeg}°
                </span>
              </div>
              <div className="h-[260px] rounded-2xl overflow-hidden relative">
                <canvas
                  ref={targetCanvasRef}
                  onClick={handleCanvasClick}
                  className="w-full h-full block cursor-crosshair"
                />
                <div className="pointer-events-none absolute top-2.5 right-2.5 bg-[#FFFFFF] rounded-xl px-2.5 py-1.5 border border-[#414943]/12 shadow-sm text-[10px]">
                  <div className="font-semibold text-[#A33E11]">
                    WP-0{waypoints.length} Cryogenic Target
                  </div>
                  <div className="font-mono text-[#696156]">
                    Peak {analysis.maxSlopeDeg}° · {analysis.shadowTrapDurationMin}m shadow
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Synchronized Elevation & Solar Ingestion Profile */}
          <div className="p-4 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
              <span className="font-display font-bold text-[#1D1B17]">
                Synchronized Elevation & Solar Ingestion Profile
              </span>
              <div className="flex items-center gap-3 font-mono text-[10px]">
                <span className="text-[#0F422E]">— Relief (m)</span>
                <span className="text-[#A33E11]">— Hazard Grade &gt;15°</span>
                <span className="text-[#696156]">— Shadow Zone</span>
              </div>
            </div>

            <svg viewBox="0 0 420 76" className="w-full h-22">
              <rect
                x="145"
                y="6"
                width="75"
                height="64"
                rx="6"
                fill="rgba(224, 106, 59, 0.14)"
              />
              <rect
                x="320"
                y="6"
                width="95"
                height="64"
                rx="6"
                fill="rgba(65, 73, 67, 0.12)"
              />
              <polygon fill="rgba(42, 90, 68, 0.12)" points={profileSvg.area} />
              <polyline
                fill="none"
                stroke="#0F422E"
                strokeWidth="2.4"
                strokeLinecap="round"
                points={profileSvg.poly}
              />
            </svg>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#414943]/10">
              <span className="font-mono text-[11px] text-[#414943]">
                Traverse Efficiency:{' '}
                <strong className="text-[#0F422E]">
                  {Math.max(68, 98 - analysis.hazardSegmentsCount * 3).toFixed(1)}%
                  Nominal
                </strong>{' '}
                · Click maps to add waypoints
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWaypoints(DEFAULT_PRESETS.crater_edge)}
                  className="px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#414943]/12 text-xs font-medium text-[#1D1B17] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Outer Escarpment Loop
                </button>
                <button
                  type="button"
                  onClick={() => setWaypoints(DEFAULT_PRESETS.rim_recon)}
                  className="px-3.5 py-1.5 rounded-full bg-[#A33E11] hover:bg-[#E06A3B] text-white text-xs font-semibold cursor-pointer"
                >
                  Recalculate Route
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT INSPECTOR: Traverse Physics Divergence & Field Protocol Recs */}
        <div className="flex flex-col gap-5">
          <aside className="bg-[#FFFFFF] rounded-3xl border border-[#414943]/8 shadow-soft-card p-5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-base font-bold text-[#1D1B17]">
                Traverse Physics
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FDF2EC] text-[#A33E11] text-[11px] font-semibold">
                Divergence
              </span>
            </div>

            <p className="text-xs text-[#696156] leading-relaxed">
              Empirical breakdown comparing Earth field telemetry to target
              planetary physics constraints.
            </p>

            {/* Quick Live Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                <div className="text-[10px] text-[#696156]">Wheel Sinkage</div>
                <div className="font-mono text-sm font-bold text-[#1D1B17] mt-0.5">
                  {analysis.earthWheelSinkageCm} vs {analysis.targetWheelSinkageCm} cm
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#F9F3EB] border border-[#414943]/8">
                <div className="text-[10px] text-[#696156]">Mean Array Power</div>
                <div className="font-mono text-sm font-bold text-[#0F422E] mt-0.5">
                  {analysis.meanSolarPowerW} W (Pk {analysis.peakSolarPowerW}W)
                </div>
              </div>
            </div>

            {/* 4 Unbridgeable Divergence Cards */}
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
                    <span className="px-2 py-0.5 rounded-full bg-[#FDF2EC] font-mono text-[10px] text-[#A33E11]">
                      {b.gapFactor}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#414943] mt-1">
                    {b.earthValue} vs {b.targetValue}
                  </div>
                  <p className="text-[11px] text-[#696156] mt-1 leading-snug">
                    {b.engineeringImpact}
                  </p>
                </div>
              ))}
            </div>

            {/* Field Protocol Recs Mint Box */}
            <div className="p-3.5 rounded-2xl bg-[#EAF4EE] border border-[#2A5A44]/20 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#0F422E] mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>FIELD PROTOCOL RECS</span>
              </div>
              <ul className="space-y-1 text-[11px] text-[#0F422E]/90 list-disc pl-4 leading-snug">
                <li>Mount 50 kg counterweight gantry overhead for 1/6-g offload.</li>
                <li>Run optical hazard traverse at dawn/dusk for low solar grazing.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onLaunchSimulator}
              className="w-full py-3.5 px-6 rounded-full bg-[#184633] hover:bg-[#0F3525] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Validate Hardware in CAD Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </aside>

          {/* Compact Soil Analog Fidelity Footer Card */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#414943]/8 shadow-soft-card p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#696156]">
                Soil Analog Fidelity
              </div>
              <div className="font-display text-lg font-bold text-[#1D1B17]">
                88.4% Match
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#EAF4EE] text-[#0F422E] flex items-center justify-center">
              <Mountain className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
