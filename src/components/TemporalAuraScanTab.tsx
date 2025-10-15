
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
} from 'chart.js';
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const POINT_COUNT = 240;

const generateCoherenceSeries = () =>
  Array.from({ length: POINT_COUNT }, (_, index) => {
    const trend = 0.84 + 0.08 * Math.sin(index / 7.5) + 0.03 * Math.sin(index / 2.5);
    const micro = 0.015 * Math.sin(index * 1.4) + 0.01 * Math.cos(index * 0.9);
    const value = Math.max(0.65, Math.min(1, trend + micro));
    return Number(value.toFixed(3));
  });

const generateSchumannSeries = () =>
  Array.from({ length: POINT_COUNT }, (_, index) => {
    const baseline = 7.83;
    const oscillation = 0.045 * Math.sin(index / 14) + 0.015 * Math.sin(index / 4.2 + Math.PI / 3);
    const shimmer = 0.005 * Math.sin(index * 1.2) + 0.004 * Math.cos(index * 0.75);
    const value = baseline + oscillation + shimmer;
    return Number(value.toFixed(3));
  });

const buildTemporalLabels = () =>
  Array.from({ length: POINT_COUNT }, (_, index) => `${index}`);

const baseLineOptions = (options: { min?: number; max?: number; stepSize?: number; unitLabel: string }) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.parsed.y.toFixed(3)} ${options.unitLabel}`.trim(),
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: 'rgba(226,232,240,0.65)',
        maxTicksLimit: 8,
      },
      grid: {
        color: 'rgba(148,163,184,0.15)',
      },
    },
    y: {
      ticks: {
        color: 'rgba(226,232,240,0.75)',
        stepSize: options.stepSize,
      },
      min: options.min,
      max: options.max,
      grid: {
        color: 'rgba(148,163,184,0.12)',
      },
    },
  },
});


const TemporalAuraScanTab: React.FC = () => {
  const labels = useMemo(buildTemporalLabels, []);
  const coherenceSeries = useMemo(generateCoherenceSeries, []);
  const schumannSeries = useMemo(generateSchumannSeries, []);

  const coherenceReading = coherenceSeries[coherenceSeries.length - 1];
  const schumannReading = schumannSeries[schumannSeries.length - 1];


  const coherenceData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Temporal Coherence',
          data: coherenceSeries,
          fill: {
            target: 'origin',
            above: 'rgba(250, 204, 21, 0.22)',
          },
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(250, 204, 21, 0.22)',
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 0,
        },
      ],
    }),
    [labels, coherenceSeries],
  );

  const schumannData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Schumann Frequency',
          data: schumannSeries,
          fill: {
            target: 'origin',
            above: 'rgba(56, 189, 248, 0.18)',
          },
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.18)',
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 0,
        },
      ],
    }),
    [labels, schumannSeries],
  );

  const coherenceOptions = useMemo(
    () =>
      baseLineOptions({
        min: 0.6,
        max: 1,
        stepSize: 0.1,
        unitLabel: 'coherence',
      }),
    [],
  );

  const schumannOptions = useMemo(
    () =>
      baseLineOptions({
        min: 7.75,
        max: 7.95,
        stepSize: 0.05,
        unitLabel: 'Hz',
      }),
    [],
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-amber-500/20 bg-slate-900/60 p-6 shadow-[0_0_45px_rgba(251,191,36,0.18)] backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="rounded-full border border-amber-400/60 bg-amber-400/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200">
              Temporal Aura Scan
            </Badge>
            <h2 className="mt-3 text-2xl font-semibold text-white">AURIS Temporal Coherence Console</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300/85">
              Engage the Auris lattice to observe coherence stability and Schumann resonance entrainment for any subject in view.
              Synthetic reference signals are displayed for calibration of the scan pipeline.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Coherence</span>
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
        <div className="grid gap-4 text-xs text-slate-300/80 sm:grid-cols-2">
          <div>
            <span className="text-slate-400">Scan Status</span>

          </div>
        </div>
      </div>


      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-amber-400/20 bg-slate-950/60">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg text-amber-100">AURIS Temporal Coherence (synthetic)</CardTitle>
            <CardDescription className="text-slate-300/80">
              Reference waveforms demonstrate expected coherence stability for a harmonized subject field.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={coherenceData} options={coherenceOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-sky-400/20 bg-slate-950/60">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg text-sky-100">Schumann Frequency (synthetic baseline 7.83 Hz)</CardTitle>
            <CardDescription className="text-slate-300/80">
              Monitoring entrainment between terrestrial resonance and subject auric field dynamics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={schumannData} options={schumannOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TemporalAuraScanTab;
