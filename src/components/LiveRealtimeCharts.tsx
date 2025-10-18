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
import { earthPalette, realtimeSpectrumOrder } from "@/theme/palette";

const SCHUMANN_REFERENCE_MODES = [
  { id: "mode-1", label: "Mode 1 · Fundamental", frequency: 7.83 },
  { id: "mode-2", label: "Mode 2", frequency: 14.2 },
  { id: "mode-3", label: "Mode 3", frequency: 20.03 },
  { id: "mode-4", label: "Mode 4", frequency: 25.9 },
  { id: "mode-5", label: "Mode 5", frequency: 32.0 },
  { id: "mode-6", label: "Mode 6", frequency: 38.5 },
  { id: "mode-7", label: "Mode 7", frequency: 44.5 },
  { id: "mode-8", label: "Mode 8", frequency: 59.9 },
] as const;

const EARTH_CAVITY_FUNDAMENTAL = SCHUMANN_REFERENCE_MODES[0].frequency;

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
    accent: `text-[${earthPalette.sunrise}]`,
    glow: "from-[#5B8DFF]/35 via-[#7C3AED]/20 to-transparent",
    spectrum: realtimeSpectrumOrder[0],
    aurora: "linear-gradient(135deg, rgba(91,139,255,0.3) 0%, rgba(124,58,237,0.24) 45%, rgba(79,195,255,0.28) 100%)",
  },
  {
    key: "schumann",
    label: "Schumann Resonance",
    unit: "Hz",
    accent: `text-[${earthPalette.sage}]`,
    glow: "from-[#4FB6FF]/35 via-[#57E3FF]/25 to-transparent",
    spectrum: realtimeSpectrumOrder[1],
    aurora: "linear-gradient(140deg, rgba(63,163,255,0.28) 0%, rgba(95,205,255,0.24) 40%, rgba(149,219,255,0.26) 100%)",
  },
  {
    key: "coherence",
    label: "System Coherence Index",
    unit: "",
    accent: `text-[${earthPalette.clay}]`,
    glow: "from-[#7C3AED]/35 via-[#5B8DFF]/22 to-transparent",
    spectrum: realtimeSpectrumOrder[2],
    aurora: "linear-gradient(150deg, rgba(124,58,237,0.3) 0%, rgba(91,139,255,0.26) 45%, rgba(180,165,255,0.24) 100%)",
  },
  {
    key: "planetaryResonance",
    label: "Planetary Resonance",
    unit: "",
    accent: `text-[${earthPalette.dusk}]`,
    glow: "from-[#5A4BFF]/35 via-[#6D4BFF]/25 to-transparent",
    spectrum: realtimeSpectrumOrder[3],
    aurora: "linear-gradient(160deg, rgba(90,72,219,0.3) 0%, rgba(126,89,255,0.24) 45%, rgba(99,82,221,0.26) 100%)",
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
      <div className="h-48 rounded-2xl border border-[rgba(99,82,221,0.28)] bg-[#0b1230]/70 p-6 text-sm text-[#C8D4FF]/80">
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
  const markerStep = Math.max(1, Math.floor(coordinates.length / 48));
  const horizontalGuides = Array.from({ length: 4 }, (_, index) => ((index + 1) / 5) * 100);
  const verticalGuides = Array.from({ length: 5 }, (_, index) => ((index + 1) / 6) * 100);

  return (
    <div className="space-y-6">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={cn(
          "h-[28rem] w-full drop-shadow-[0_18px_55px_rgba(33,24,16,0.58)] sm:h-[32rem] lg:h-[36rem]",
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
                stopOpacity={index === 0 ? 0.18 : 0.05}
              />
            ))}
          </linearGradient>
          <radialGradient id={haloId} cx="50%" cy="70%" r="65%">
            <stop offset="0%" stopColor="rgba(35,25,17,0.22)" />
            <stop offset="65%" stopColor="rgba(35,25,17,0.06)" />
            <stop offset="100%" stopColor="rgba(35,25,17,0.0)" />
          </radialGradient>
          <pattern id={gridId} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(99,82,221,0.18)" strokeWidth="0.22" />
          </pattern>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="glow" />
            <feColorMatrix
              in="glow"
              type="matrix"
              values="0 0 0 0 0.55  0 0 0 0 0.46  0 0 0 0 0.28  0 0 0 0.35 0"
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
        {horizontalGuides.map((y) => (
          <line
            key={`h-${y}`}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="rgba(99,82,221,0.2)"
            strokeWidth={0.2}
            strokeDasharray="1.5 2.5"
          />
        ))}
        {verticalGuides.map((x) => (
          <line
            key={`v-${x}`}
            x1={x}
            y1="0"
            x2={x}
            y2="100"
            stroke="rgba(99,82,221,0.18)"
            strokeWidth={0.18}
            strokeDasharray="1 2"
          />
        ))}
        <path d={areaPath} fill={`url(#${fillId})`} opacity={0.65} />
        {smoothPath ? (
          <>
            <path
              d={smoothPath}
              fill="none"
              stroke={`url(#${strokeId})`}
              strokeWidth={2.15}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowId})`}
            />
            <path
              d={smoothPath}
              fill="none"
              stroke={`url(#${strokeId}-shine)`}
              strokeWidth={0.7}
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
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
        )}
        {coordinates.map((point, index) =>
          index % markerStep === 0 ? (
            <circle
              key={`${id}-marker-${point.x}-${point.y}`}
              cx={point.x}
              cy={point.y}
              r={0.85}
              fill="rgba(246, 241, 232, 0.85)"
              stroke={gradientStops[gradientStops.length - 1]}
              strokeWidth={0.25}
            />
          ) : null
        )}
        <circle
          cx={highlight.x}
          cy={highlight.y}
          r={1.9}
          fill={gradientStops[gradientStops.length - 1]}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={0.65}
        />
      </svg>
      <div className="flex justify-between text-[11px] uppercase tracking-[0.28em] text-[#8DA2FF]">
        <span className="font-mono text-xs">
          min {min.toFixed(2)}
          {unit ? ` ${unit}` : ""}
        </span>
        <span className="font-mono text-xs">
          max {max.toFixed(2)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
    </div>
  );
};

const SchumannModeReference = ({
  fundamental,
  stdev,
  windowSeconds,
  sampleCount,
}: {
  fundamental: number;
  stdev: number;
  windowSeconds: number;
  sampleCount: number;
}) => {
  const deltaFromReference = fundamental - EARTH_CAVITY_FUNDAMENTAL;
  const adjustedModes = SCHUMANN_REFERENCE_MODES.map((mode, index) => {
    const observed = mode.frequency + deltaFromReference;
    const previous = SCHUMANN_REFERENCE_MODES[index - 1];
    const observedPrevious = previous ? previous.frequency + deltaFromReference : null;
    const spacing = observedPrevious != null ? observed - observedPrevious : null;
    return {
      ...mode,
      observed,
      deviation: observed - mode.frequency,
      spacing,
    };
  });

  const qualityFactor = stdev > 0 ? fundamental / (2 * stdev) : null;
  const windowLabel = windowSeconds > 0 ? `${Math.round(windowSeconds)} s` : "Realtime";

  return (
    <div className="grid gap-6 rounded-2xl border border-[rgba(99,82,221,0.24)] bg-[#09102a]/75 p-6 text-left lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8DA2FF]">
          Schumann Resonance Context
        </p>
        <p className="text-sm leading-relaxed text-[#E8F1FF]/90">
          Lightning strikes excite standing waves within the Earth–ionosphere cavity. The fundamental mode is expected at
          {" "}
          {EARTH_CAVITY_FUNDAMENTAL.toFixed(2)} Hz, with higher modes spaced by roughly 6.5–8 Hz. Displayed values apply the
          measured deviation from the fundamental across each overtone so the physics behind the visualization remains
          explicit.
        </p>
        <div className="grid gap-2 text-[11px] text-[#A7B5FF]/80 sm:grid-cols-2">
          <div>
            <span className="font-semibold uppercase tracking-[0.3em] text-[#8DA2FF]">Observation Window</span>
            <p className="font-mono text-base text-[#E8F1FF]">{windowLabel}</p>
            <p>Samples analysed: {sampleCount}</p>
          </div>
          <div>
            <span className="font-semibold uppercase tracking-[0.3em] text-[#8DA2FF]">Quality Factor</span>
            <p className="font-mono text-base text-[#E8F1FF]">
              {qualityFactor ? qualityFactor.toFixed(2) : "—"}
            </p>
            <p>Approximate cavity sharpness (f₀ / 2σ).</p>
          </div>
        </div>
        <p className="text-[11px] text-[#A7B5FF]/80">
          The spectral width of each mode is typically ~20% of its center frequency; compare the observed spread above to
          confirm the resonance is physical rather than decorative.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-[rgba(99,82,221,0.2)] bg-[#101c46]/80">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[rgba(99,82,221,0.16)] text-[11px] uppercase tracking-[0.28em] text-[#8DA2FF]">
            <tr>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3 text-right">Reference (Hz)</th>
              <th className="px-4 py-3 text-right">Adjusted (Hz)</th>
              <th className="px-4 py-3 text-right">Δ (Hz)</th>
              <th className="px-4 py-3 text-right">Spacing (Hz)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(99,82,221,0.18)] text-[#E8F1FF]/90">
            {adjustedModes.map(({ id, label, frequency, observed, deviation, spacing }) => (
              <tr key={id}>
                <td className="px-4 py-3 font-semibold uppercase tracking-[0.18em] text-[#A7B5FF]">{label}</td>
                <td className="px-4 py-3 text-right font-mono">{frequency.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono">{observed.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono text-[#57E3FF]">
                  {deviation >= 0 ? "+" : ""}
                  {deviation.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#A7B5FF]">
                  {spacing != null ? spacing.toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            ? "border-[rgba(56,189,248,0.38)] bg-[rgba(56,189,248,0.18)] text-[#e6f9ff]"
            : "border-[rgba(236,72,153,0.45)] bg-[rgba(124,58,237,0.18)] text-[#fde6ff]";

        const currentView = chartViews[key] || "line";
        const latest = points.at(-1) ?? null;
        const deltaClass = delta >= 0 ? "text-[#57E3FF]" : "text-[#F5D26A]";

        const statistics = computeStatistics(points);
        const hasSignal = points.length > 0;
        const isSchumann = key === "schumann";

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
        ] satisfies Array<{ label: string; value: string; hint: string }>;

        if (isSchumann) {
          const deltaFromReference = hasSignal ? (latest?.value ?? Number.NaN) - EARTH_CAVITY_FUNDAMENTAL : Number.NaN;
          const qualityFactor = statistics.stdev > 0 ? (latest?.value ?? 0) / (2 * statistics.stdev) : Number.NaN;
          detailStats.push({
            label: "Δ vs 7.83 Hz",
            value: Number.isFinite(deltaFromReference) ? `${deltaFromReference >= 0 ? "+" : ""}${deltaFromReference.toFixed(2)} Hz` : "—",
            hint: Number.isFinite(qualityFactor)
              ? `Quality factor ≈ ${(qualityFactor as number).toFixed(2)} • Expected spacing 6.5–8 Hz`
              : "Collect more samples to resolve Q-factor",
          });
        }

        const detailGridColumns = isSchumann ? "md:grid-cols-4" : "md:grid-cols-3";
        const spreadHint = isSchumann
          ? "Std. deviation approximates cavity bandwidth (≈20% spectral width)."
          : "Std. deviation of readings across the window";
        const sampleHint = isSchumann
          ? "Lightning-excited resonance samples captured this window"
          : "Resampled observations in current window";

        const badgeLabel = delta >= 0 ? "Δ ≥ 0" : "Δ < 0";

        return (
          <Card
            key={key}
            className="group relative flex w-full min-h-[72vh] flex-col overflow-hidden border-[rgba(99,82,221,0.28)] bg-[#0b1230]/80 text-[#E8F1FF] shadow-[0_0_60px_rgba(56,189,248,0.32)] backdrop-blur lg:min-h-[82vh]"
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
            <div className="pointer-events-none absolute -inset-24 animate-stellar-pulse bg-[radial-gradient(circle,_rgba(120,76,255,0.28),_transparent_60%)] opacity-0 group-hover:opacity-40" />
            <CardHeader className="relative z-10 pb-6 pt-10 lg:pb-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <CardTitle className="max-w-4xl text-lg font-semibold uppercase tracking-[0.32em] text-[#F3F7FF]">
                  {label}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${badgeTone}`}
                  >
                    {badgeLabel}
                  </Badge>
                  <Button
                    onClick={() => toggleView(key)}
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-[#A7B5FF] transition hover:bg-[rgba(76,114,255,0.35)] hover:text-[#F3F7FF]"
                  >
                    <ArrowRightLeft size={16} />
                    <span className="sr-only">Toggle Chart View</span>
                  </Button>
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#A7B5FF]/75">
                {detailStats[0].hint}
              </p>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-1 flex-col gap-10 pb-14 pt-4">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="font-mono text-4xl font-semibold text-[#F3F7FF] drop-shadow-[0_0_18px_rgba(99,82,221,0.24)] sm:text-5xl">
                  {formatValueWithUnit(hasSignal ? latest?.value ?? Number.NaN : Number.NaN, unit)}
                </div>
                <div className={`font-mono text-xs font-semibold uppercase tracking-[0.22em] ${deltaClass}`}>
                  {formatDelta(delta, unit)}
                </div>
              </div>
              {currentView === "line" ? (
                <RealtimeLineChart id={key} points={points} unit={unit} accent={accent} spectrum={spectrum} />
              ) : (
                <SpiralChart id={key} points={points} spectrum={spectrum} accent={accent} />
              )}
              <div
                className={cn(
                  "grid gap-6 rounded-2xl border border-[rgba(99,82,221,0.24)] bg-[#0f1738]/70 p-6 text-left",
                  detailGridColumns
                )}
              >
                {detailStats.map(({ label, value, hint }) => (
                  <div key={label} className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8DA2FF]">{label}</p>
                    <p className="font-mono text-base font-semibold text-[#E8F1FF]">{value}</p>
                    <p className="text-[11px] leading-relaxed text-[#A7B5FF]/80">{hint}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 rounded-2xl border border-[rgba(99,82,221,0.18)] bg-[#0b1230]/60 p-5 text-left sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#8DA2FF]">Sample Count</p>
                  <p className="font-mono text-lg text-[#E8F1FF]">{points.length}</p>
                  <p className="text-[11px] text-[#A7B5FF]/75">{sampleHint}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#8DA2FF]">Spread</p>
                  <p className="font-mono text-lg text-[#E8F1FF]">
                    σ {formatValueWithUnit(hasSignal ? statistics.stdev : Number.NaN, unit)}
                  </p>
                  <p className="text-[11px] text-[#A7B5FF]/75">{spreadHint}</p>
                </div>
              </div>
              {isSchumann && hasSignal ? (
                <SchumannModeReference
                  fundamental={latest?.value ?? EARTH_CAVITY_FUNDAMENTAL}
                  stdev={statistics.stdev}
                  windowSeconds={statistics.windowSeconds}
                  sampleCount={points.length}
                />
              ) : null}
            </CardContent>
          </Card>
        );
      })}
      <QuantumSpectrogramPanel />
    </div>
  );
};

export default LiveRealtimeCharts;
