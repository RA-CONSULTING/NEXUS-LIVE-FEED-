
import { useMemo } from "react";
import type { RealtimeChartPoint } from "@/hooks/useResampledNexusData";

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

    // Golden Spiral Implementation (Logarithmic Spiral)
    // This aligns with the 'Fibonacci Sacred Geometry' theme and fixes clipping issues.
    const PHI = (1 + Math.sqrt(5)) / 2;
    const b = Math.log(PHI) / (Math.PI / 2); // Growth rate for a golden spiral
    const angleStep = 0.5; // Radians per point

    const maxModulation = 0.15; // Modulate radius by +/- 15%
    const viewboxRadius = 48; // Fit within 100x100 viewbox with padding

    // Calculate the max base radius before modulation to prevent clipping
    const maxBaseRadius = viewboxRadius / (1 + maxModulation);

    const finalAngle = (points.length - 1) * angleStep;
    
    // Calculate scaling factor 'a' to make the spiral end at maxBaseRadius
    const a = finalAngle > 0 ? maxBaseRadius / Math.exp(b * finalAngle) : maxBaseRadius;

    const polyline_points = points
      .map((point, index) => {
        const angle = index * angleStep;
        const radius = a * Math.exp(b * angle);
        const normalizedValue = (point.value - minVal) / range;
        
        // Modulate radius by the normalized value, centered around the base radius
        const modulatedRadius = radius * (1 + (normalizedValue - 0.5) * 2 * maxModulation);

        const x = 50 + Math.cos(angle) * modulatedRadius;
        const y = 50 + Math.sin(angle) * modulatedRadius;
        return `${x},${y}`;
      });
      
    const polyline = polyline_points.join(" ");

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
