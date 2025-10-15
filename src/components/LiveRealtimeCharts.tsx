import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLiveNexusData } from "@/contexts/LiveNexusDataContext";
import type {
  RealtimeChartCollection,
  RealtimeChartPoint,
} from "@/hooks/useResampledNexusData";
import { cn } from "@/lib/utils";
import { useState } from "react";
import MandalaOverlay from "./MandalaOverlay";
import SpiralChart from "./SpiralChart";
import QuantumSpectrogramPanel from "./QuantumSpectrogramPanel";
import { ArrowRightLeft } from "lucide-react"; // Import the ArrowRightLeft icon

const chartConfigs: Array<{
  key: keyof RealtimeChartCollection;
  label: string;
  unit: string;
  accent: string;
  glow: string;
  spectrum: string[];
  aurora: string;
}> = [
  {
    key: "magnetometer",
    label: "Magnetometer Field Strength",
    unit: "µT",
    accent: "text-sky-300",
    glow: "from-sky-500/40 via-cyan-400/20 to-transparent",
    spectrum: ["#38bdf8", "#6366f1", "#a855f7"],
    aurora: "linear-gradient(135deg, rgba(56,189,248,0.25) 0%, rgba(99,102,241,0.22) 45%, rgba(168,85,247,0.3) 100%)",
  },
  {
    key: "schumann",
    label: "Schumann Resonance",
    unit: "Hz",
    accent: "text-emerald-300",
    glow: "from-emerald-500/40 via-teal-400/20 to-transparent",
    spectrum: ["#34d399", "#2dd4bf", "#22d3ee"],
    aurora: "linear-gradient(140deg, rgba(20,184,166,0.25) 0%, rgba(45,212,191,0.22) 40%, rgba(14,165,233,0.28) 100%)",
  },
  {
    key: "coherence",
    label: "System Coherence Index",
    unit: "",
    accent: "text-amber-300",
    glow: "from-amber-500/45 via-orange-400/20 to-transparent",
    spectrum: ["#facc15", "#fb7185", "#a855f7"],
    aurora: "linear-gradient(150deg, rgba(250,204,21,0.3) 0%, rgba(251,113,133,0.24) 45%, rgba(168,85,247,0.28) 100%)",
  },
  {
    key: "planetaryResonance",
    label: "Planetary Resonance",
    unit: "",
    accent: "text-rose-300",
    glow: "from-rose-500/40 via-fuchsia-400/20 to-transparent",
    spectrum: ["#fb7185", "#f472b6", "#60a5fa"],
    aurora: "linear-gradient(160deg, rgba(251,113,133,0.28) 0%, rgba(244,114,182,0.24) 45%, rgba(96,165,250,0.28) 100%)",
  },
];

const formatDelta = (delta: number, unit: string) => {
  const formatted = Math.abs(delta).toFixed(2);
  const prefix = delta >= 0 ? "▲" : "▼";
  return `${prefix} ${formatted}${unit ? ` ${unit}` : ""}`;
};

const formatValueWithUnit = (value: number, unit: string, digits = unit ? 2 : 3) =>
  Number.isFinite(value) ? `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}` : "—";

const formatRecency = (timestamp: number | null) => {
  if (!timestamp) {
    return "No signal";
  }

  const deltaMs = Date.now() - timestamp;
  if (deltaMs < 1000) {
    return "just now";
  }

  const totalSeconds = Math.max(0, Math.round(deltaMs / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s ago`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${seconds}s ago`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ago`;
};

const computeStatistics = (points: RealtimeChartPoint[]) => {
  if (!points.length) {
    return {
      min: 0,
      max: 0,
      average: 0,
      stdev: 0,
      windowSeconds: 0,
      cadenceHz: 0,
    };
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.length > 1
      ? values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1)
      : 0;
  const stdev = Math.sqrt(Math.max(variance, 0));
  const windowSeconds =
    values.length > 1
      ? (points[points.length - 1].timestamp - points[0].timestamp) / 1000
      : 0;
  const cadenceHz = windowSeconds > 0 ? values.length / windowSeconds : 0;

  return {
    min,
    max,
    average,
    stdev,
    windowSeconds,
    cadenceHz,
  };
};

const buildSmoothPath = (coordinates: Array<{ x: number; y: number }>) => {
  if (coordinates.length <= 1) {
    return "";
  }

  const command: string[] = [];
  command.push(`M ${coordinates[0].x},${coordinates[0].y}`);

  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const p0 = coordinates[i - 1] ?? coordinates[i];
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const p3 = coordinates[i + 2] ?? coordinates[i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    command.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
  }

  return command.join(" ");
};

const RealtimeLineChart = ({
  id,
  points,
  unit,
  accent,
  spectrum,
}: {
  id: string;
  points: RealtimeChartPoint[];
  unit: string;
  accent: string;
  spectrum: string[];
}) => {
  const finitePoints = points.filter((point) => Number.isFinite(point.value));

  if (!finitePoints.length) {
    return (
      <div className="h-48 rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-300/70">
        Awaiting telemetry...
      </div>
    );
  }

  const values = finitePoints.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const coordinates = finitePoints.map((point, index) => {
    const x = (index / Math.max(finitePoints.length - 1, 1)) * 100;
    const y = 100 - ((point.value - min) / range) * 100;
    return { x, y };
  });
  const polyline = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const smoothPath = buildSmoothPath(coordinates);
  const areaPath = smoothPath
    ? `${smoothPath} L ${coordinates[coordinates.length - 1].x},100 L ${coordinates[0].x},100 Z`
    : `M 0,${coordinates[0]?.y ?? 100} ${polyline} L ${coordinates.at(-1)?.x ?? 100},100 L 0,100 Z`;
  const fillId = `${id}-fill`;
  const strokeId = `${id}-stroke`;
  const gridId = `${id}-grid`;
  const glowId = `${id}-glow`;
  const haloId = `${id}-halo`;
  const highlight = coordinates.at(-1) ?? { x: 100, y: 50 };
  const gradientStops = spectrum.length ? spectrum : ["#38bdf8", "#a855f7"];

  return (
    <div className="space-y-6">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={cn(
          "h-[28rem] w-full drop-shadow-[0_18px_55px_rgba(15,23,42,0.6)] sm:h-[32rem] lg:h-[36rem]",
          accent
        )}
      >
        <defs>
          <linearGradient id={strokeId} x1="0%" x2="100%" y1="0%" y2="0%">
            {gradientStops.map((color, index) => (
              <stop key={`${strokeId}-${index}`} offset={`${(index / Math.max(gradientStops.length - 1, 1)) * 100}%`} stopColor={color} />
            ))}
          </linearGradient>
          <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
            {gradientStops.map((color, index) => (
              <stop
                key={`${fillId}-${index}`}
                offset={`${(index / Math.max(gradientStops.length - 1, 1)) * 100}%`}
                stopColor={color}
                stopOpacity={index === 0 ? 0.35 : 0.1}
              />
            ))}
          </linearGradient>
          <radialGradient id={haloId} cx="50%" cy="70%" r="65%">
            <stop offset="0%" stopColor="rgba(15,23,42,0.2)" />
            <stop offset="65%" stopColor="rgba(15,23,42,0.05)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0.0)" />
          </radialGradient>
          <pattern id={gridId} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="0.25" />
          </pattern>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="glow" />
            <feColorMatrix
              in="glow"
              type="matrix"
              values="0 0 0 0 0.35  0 0 0 0 0.45  0 0 0 0 0.85  0 0 0 0.6 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`${strokeId}-shine`} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" stopOpacity="0.45" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.6)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill={`url(#${haloId})`} />
        <rect x="0" y="0" width="100" height="100" fill={`url(#${gridId})`} opacity={0.45} />
        <path d={areaPath} fill={`url(#${fillId})`} opacity={0.65} />
        {smoothPath ? (
          <>
            <path
              d={smoothPath}
              fill="none"
              stroke={`url(#${strokeId})`}
              strokeWidth={3.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowId})`}
            />
            <path
              d={smoothPath}
              fill="none"
              stroke={`url(#${strokeId}-shine)`}
              strokeWidth={1.1}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.55}
            />
          </>
        ) : (
          <polyline
            points={polyline}
            fill="none"
            stroke={`url(#${strokeId})`}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
        )}
        <circle
          cx={highlight.x}
          cy={highlight.y}
          r={2.7}
          fill={gradientStops[gradientStops.length - 1]}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={1}
        />
      </svg>
      <div className="flex justify-between text-[11px] uppercase tracking-[0.3em] text-slate-400">
        <span>
          min {min.toFixed(2)}
          {unit ? ` ${unit}` : ""}
        </span>
        <span>
          max {max.toFixed(2)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
    </div>
  );
};

const LiveRealtimeCharts = () => {
  const { charts } = useLiveNexusData();
  const [chartViews, setChartViews] = useState<Record<string, "line" | "spiral">>({});

  const toggleView = (key: string) => {
    setChartViews((prev) => ({
      ...prev,
      [key]: prev[key] === "spiral" ? "line" : "spiral",
    }));
  };

  return (
    <div className="flex flex-col gap-16">
      {chartConfigs.map(({ key, label, unit, accent, glow, spectrum, aurora }) => {
        const rawPoints = charts[key] ?? [];
        const points = rawPoints.filter((point) => Number.isFinite(point.value));
        const delta =
          points.length > 1
            ? points[points.length - 1].value - points[points.length - 2].value
            : 0;
        const badgeTone =
          delta >= 0
            ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
            : "border-rose-400/40 bg-rose-500/20 text-rose-100";

        const currentView = chartViews[key] || "line";
        const latest = points.at(-1) ?? null;
        const deltaClass = delta >= 0 ? "text-emerald-200" : "text-rose-200";

        const statistics = computeStatistics(points);
        const hasSignal = points.length > 0;

        const volatilityRatio =
          statistics.average !== 0 ? Math.min((statistics.stdev / Math.abs(statistics.average)) * 100, 999) : 0;
        const windowLabel = statistics.windowSeconds > 0 ? `${Math.round(statistics.windowSeconds)}s span` : "Realtime feed";
        const cadenceLabel = statistics.cadenceHz > 0 ? `${statistics.cadenceHz.toFixed(1)} Hz cadence` : "Awaiting cadence";

        const detailStats = [
          {
            label: "Window",
            value: windowLabel,
            hint: `${points.length} samples • ${cadenceLabel}`,
          },
          {
            label: "Mean",
            value: formatValueWithUnit(hasSignal ? statistics.average : Number.NaN, unit),
            hint: hasSignal
              ? `σ ${formatValueWithUnit(statistics.stdev, unit)} · ${volatilityRatio.toFixed(1)}% variance`
              : "Awaiting variance lock",
          },
          {
            label: "Last Update",
            value: formatRecency(latest?.timestamp ?? null),
            hint: latest ? new Date(latest.timestamp).toLocaleTimeString() : "No recent datapoint",
          },
        ];

        return (
          <Card
            key={key}
            className="group relative flex w-full min-h-[72vh] flex-col overflow-hidden border-white/10 bg-slate-950/75 text-slate-100 shadow-[0_0_60px_rgba(59,130,246,0.28)] backdrop-blur lg:min-h-[82vh]"
          >
            <MandalaOverlay />
            <div
              className={cn(
                "pointer-events-none absolute inset-0 opacity-70 transition duration-700 group-hover:opacity-90",
                `bg-gradient-to-br ${glow}`
              )}
            />
            <div
              className="pointer-events-none absolute inset-px rounded-[calc(1.5rem-2px)] opacity-0 blur-2xl transition duration-700 group-hover:opacity-80"
              style={{ background: aurora }}
            />
            <div className="pointer-events-none absolute -inset-24 animate-stellar-pulse bg-[radial-gradient(circle,_rgba(255,255,255,0.25),_transparent_60%)] opacity-0 group-hover:opacity-40" />
            <CardHeader className="relative z-10 pb-6 pt-10 lg:pb-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <CardTitle className="max-w-4xl text-lg font-semibold uppercase tracking-[0.32em] text-slate-100">
                  {label}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${badgeTone}`}
                  >
                    {delta >= 0 ? "Rising" : "Cooling"}
                  </Badge>
                  <Button
                    onClick={() => toggleView(key)}
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-slate-300 transition hover:bg-slate-700/50 hover:text-white"
                  >
                    <ArrowRightLeft size={16} />
                    <span className="sr-only">Toggle Chart View</span>
                  </Button>
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-300/75">
                {detailStats[0].hint}
              </p>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-1 flex-col gap-10 pb-14 pt-4">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="text-4xl font-semibold text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.35)] sm:text-5xl">
                  {formatValueWithUnit(hasSignal ? latest?.value ?? Number.NaN : Number.NaN, unit)}
                </div>
                <div className={`text-xs font-semibold uppercase tracking-[0.25em] ${deltaClass}`}>
                  {formatDelta(delta, unit)}
                </div>
              </div>
              {currentView === "line" ? (
                <RealtimeLineChart id={key} points={points} unit={unit} accent={accent} spectrum={spectrum} />
              ) : (
                <SpiralChart id={key} points={points} spectrum={spectrum} accent={accent} />
              )}
              <div className="grid gap-6 rounded-2xl border border-white/5 bg-slate-950/60 p-6 text-left md:grid-cols-3">
                {detailStats.map(({ label, value, hint }) => (
                  <div key={label} className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-400">{label}</p>
                    <p className="text-base font-semibold text-white">{value}</p>
                    <p className="text-[11px] leading-relaxed text-slate-400/80">{hint}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <QuantumSpectrogramPanel />
    </div>
  );
};

export default LiveRealtimeCharts;
