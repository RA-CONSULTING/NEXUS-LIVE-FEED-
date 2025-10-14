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
      <div className="h-36 rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-300/70">
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
  const polygon = `0,100 ${polyline} 100,100`;
  const fillId = `${id}-fill`;
  const strokeId = `${id}-stroke`;
  const gridId = `${id}-grid`;
  const glowId = `${id}-glow`;
  const haloId = `${id}-halo`;
  const highlight = coordinates.at(-1) ?? { x: 100, y: 50 };
  const gradientStops = spectrum.length ? spectrum : ["#38bdf8", "#a855f7"];

  return (
    <div className="space-y-4">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={cn(
          "h-36 w-full drop-shadow-[0_0_30px_rgba(99,102,241,0.35)]",
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
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.3" />
          </pattern>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill={`url(#${haloId})`} />
        <rect x="0" y="0" width="100" height="100" fill={`url(#${gridId})`} opacity={0.45} />
        <polygon points={polygon} fill={`url(#${fillId})`} opacity={0.55} />
        <polyline
          points={polyline}
          fill="none"
          stroke={`url(#${strokeId})`}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />
        <circle
          cx={highlight.x}
          cy={highlight.y}
          r={2.2}
          fill={gradientStops[gradientStops.length - 1]}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={0.8}
        />
      </svg>
      <div className="flex justify-between text-[10px] uppercase tracking-[0.3em] text-slate-400">
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
    <div className="grid gap-4 lg:grid-cols-4">
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

        const currentView = chartViews[key] || 'line';
        const latest = points.length > 0 ? points[points.length-1] : {value: 0, timestamp: 0};
        const deltaClass = delta >= 0 ? "text-emerald-200" : "text-rose-200";


        return (
          <Card
            key={key}
            className="group relative overflow-hidden border-white/10 bg-slate-950/75 text-slate-100 shadow-[0_0_60px_rgba(59,130,246,0.28)] backdrop-blur"
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
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">
                {label}
              </CardTitle>
              <Badge
                variant="outline"
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${badgeTone}`}
              >
                {delta >= 0 ? "Rising" : "Cooling"}
              </Badge>
            </CardHeader>
            <CardContent className="relative z-10 pt-2 space-y-4">
                <Button onClick={() => toggleView(key)} size="icon" variant="ghost" className="absolute top-2 right-2 z-20 h-7 w-7 text-slate-300 hover:bg-slate-700/50 hover:text-white">
                    <ArrowRightLeft size={16} />
                    <span className="sr-only">Toggle Chart View</span>
                </Button>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-semibold text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]">
                  {latest.value.toFixed(unit ? 2 : 3)}
                  {unit ? <span className="ml-1 text-sm font-normal text-slate-300/80">{unit}</span> : null}
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LiveRealtimeCharts;
