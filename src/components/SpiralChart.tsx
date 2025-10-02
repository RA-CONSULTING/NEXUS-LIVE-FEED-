
import { useMemo } from "react";
import type { RealtimeChartPoint } from "@/hooks/useRealtimeNexusData";

const SpiralChart = ({
  points,
  accent,
}: {
  points: RealtimeChartPoint[];
  accent: string;
}) => {
  const { polyline, min, max } = useMemo(() => {
    if (points.length < 2) {
      return { polyline: "", min: 0, max: 0 };
    }

    const values = points.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const polyline = points
      .map((point, index) => {
        const angle = index * 0.5;
        const radius = 10 + (index / points.length) * 40;
        const normalizedValue = (point.value - minVal) / range;
        const modulatedRadius = radius + normalizedValue * 10;
        const x = 50 + Math.cos(angle) * modulatedRadius;
        const y = 50 + Math.sin(angle) * modulatedRadius;
        return `${x},${y}`;
      })
      .join(" ");

    return { polyline, min: minVal, max: maxVal };
  }, [points]);

  if (!points.length) {
    return (
      <div className="h-36 rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-300/70">
        Awaiting telemetry...
      </div>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={`h-36 w-full ${accent}`}>
      <polyline
        points={polyline}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SpiralChart;
