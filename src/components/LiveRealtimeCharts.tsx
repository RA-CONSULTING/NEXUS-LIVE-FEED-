import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLiveNexusData } from "@/contexts/LiveNexusDataContext";
import type { RealtimeChartCollection, RealtimeChartPoint } from "@/hooks/useRealtimeNexusData";
import { cn } from "@/lib/utils";

const chartConfigs: Array<{
  key: keyof RealtimeChartCollection;
  label: string;
  unit: string;
  accent: string;
}> = [
  {
    key: "magnetometer",
    label: "Magnetometer Field Strength",
    unit: "µT",
    accent: "text-sky-500",
  },
  {
    key: "schumann",
    label: "Schumann Resonance",
    unit: "Hz",
    accent: "text-emerald-500",
  },
  {
    key: "coherence",
    label: "System Coherence Index",
    unit: "",
    accent: "text-amber-500",
  },
];

const formatDelta = (delta: number, unit: string) => {
  const formatted = Math.abs(delta).toFixed(2);
  const prefix = delta >= 0 ? "▲" : "▼";
  return `${prefix} ${formatted}${unit ? ` ${unit}` : ""}`;
};

const RealtimeLineChart = ({
  points,
  unit,
  accent,
}: {
  points: RealtimeChartPoint[];
  unit: string;
  accent: string;
}) => {
  if (!points.length) {
    return (
      <div className="h-32 text-sm text-stone-500">Awaiting telemetry...</div>
    );
  }

  const latest = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : latest;
  const values = points.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const polyline = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((point.value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  const delta = latest.value - previous.value;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-semibold text-stone-900">
          {latest.value.toFixed(unit ? 2 : 3)}
          {unit ? <span className="ml-1 text-sm font-normal text-stone-500">{unit}</span> : null}
        </div>
        <div className="text-xs text-stone-500">{formatDelta(delta, unit)}</div>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={cn("h-32 w-full", accent)}
      >
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between text-xs text-stone-500">
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

export default function LiveRealtimeCharts() {
  const { charts } = useLiveNexusData();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {chartConfigs.map(({ key, label, unit, accent }) => {
        const points = charts[key];
        const delta =
          points.length > 1
            ? points[points.length - 1].value - points[points.length - 2].value
            : 0;
        const variant = delta >= 0 ? "success" : "warning";

        return (
          <Card key={key} className="border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-stone-800">
                {label}
              </CardTitle>
              <Badge variant={variant}>{delta >= 0 ? "Rising" : "Cooling"}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <RealtimeLineChart points={points} unit={unit} accent={accent} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { LiveRealtimeCharts };
