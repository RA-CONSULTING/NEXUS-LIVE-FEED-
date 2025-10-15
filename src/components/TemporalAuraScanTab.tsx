
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

  const lookbackIndex = Math.max(0, coherenceSeries.length - 30);
  const coherenceDelta = coherenceReading - coherenceSeries[lookbackIndex];
  const schumannDelta = schumannReading - schumannSeries[lookbackIndex];

  const formatDelta = (value: number, decimals: number) => `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}`;

  const subjectProfile = useMemo(
    () => ({
      name: 'Gary Leckey',
      origin: 'Belfast · Emerald Frequency Sector',
      birthDate: '02 November 1991',
      temporalId: 'AUR-GL-02111991',
      scanWindow: 'Harmonic 728 · 13:40 UTC',
      auricTone: 'Golden Citrine',
    }),
    [],
  );

  const summaryMetrics = useMemo(
    () => [
      {
        id: 'coherence',
        label: 'Coherence Integrity',
        value: `${(coherenceReading * 100).toFixed(1)}%`,
        detail: `Field convergence ${formatDelta(coherenceDelta * 100, 2)} over last 30 frames.`,
        accent: 'text-amber-200',
        border: 'border-amber-400/30',
      },
      {
        id: 'schumann',
        label: 'Schumann Sync',
        value: `${schumannReading.toFixed(2)} Hz`,
        detail: `Entrainment delta ${formatDelta(schumannDelta, 3)} Hz from baseline.`,
        accent: 'text-sky-200',
        border: 'border-sky-400/30',
      },
      {
        id: 'stability',
        label: 'Field Stability',
        value: 'Primed',
        detail: 'Temporal buffers locked · No flare indicators detected.',
        accent: 'text-emerald-200',
        border: 'border-emerald-400/30',
      },
    ],
    [coherenceDelta, coherenceReading, schumannDelta, schumannReading],
  );

  const scanTimeline = useMemo(
    () => [
      {
        time: '13:36',
        title: 'Auric Field Lock',
        detail: 'Quantum lattice keyed to Gary Leckey signature for Belfast node.',
      },
      {
        time: '13:37',
        title: 'Baseline Capture',
        detail: 'Physio-emotive harmonics recorded; Schumann reference synchronized at 7.83 Hz.',
      },
      {
        time: '13:38',
        title: 'Temporal Resonance Sweep',
        detail: 'Citrine tone amplified · No phase tears detected across 240-slice window.',
      },
      {
        time: '13:40',
        title: 'Stability Verification',
        detail: 'Field seal confirmed · Authorization for archival transmission granted.',
      },
    ],
    [],
  );

  const resonanceInsights = useMemo(
    () => [
      'Theta-band coherence uplifts recorded at 0.87 amplitude aligning with Northern Ireland geofield.',
      'Cardio-electromagnetic pulse mirrored with 0.4% variance against Harmonic Nexus reference.',
      'Emotive vector traces indicate compassionate resonance with steady empathic modulation.',
    ],
    [],
  );


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
      <div className="flex flex-col gap-6 rounded-3xl border border-amber-500/20 bg-slate-900/60 p-6 shadow-[0_0_45px_rgba(251,191,36,0.18)] backdrop-blur">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <Badge className="rounded-full border border-amber-400/60 bg-amber-400/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200">
              Temporal Aura Scan
            </Badge>
            <h2 className="mt-3 text-2xl font-semibold text-white">AURIS Temporal Coherence Console</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300/85">
              Live calibration stream focused on the temporal aura of{' '}
              <span className="text-amber-200">{subjectProfile.name}</span>. Belfast node instrumentation is running a reference
              sweep to verify coherence stability against the Harmonic Nexus baseline.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[24rem]">
            {summaryMetrics.map((metric) => (
              <div
                key={metric.id}
                className={`rounded-2xl border ${metric.border} bg-slate-950/40 p-4 shadow-inner shadow-slate-900/40 backdrop-blur-sm`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400/80">{metric.label}</span>
                <p className={`mt-2 text-xl font-semibold ${metric.accent}`}>{metric.value}</p>
                <p className="mt-1 text-xs text-slate-300/80">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">Subject Profile</p>
              <h3 className="mt-2 text-lg font-semibold text-amber-50">{subjectProfile.name}</h3>
              <p className="text-sm text-amber-50/80">{subjectProfile.origin}</p>
            </div>
            <dl className="grid gap-4 text-sm text-amber-50/90 sm:grid-cols-2">
              {[
                { label: 'Birth Date', value: subjectProfile.birthDate },
                { label: 'Temporal ID', value: subjectProfile.temporalId },
                { label: 'Scan Window', value: subjectProfile.scanWindow },
                { label: 'Auric Tone', value: subjectProfile.auricTone },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[10px] uppercase tracking-[0.4em] text-amber-200/70">{item.label}</dt>
                  <dd className="mt-1 text-base text-white">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-200/10 bg-slate-950/40 p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400/70">Scan Timeline</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Temporal Sweep Highlights</h3>
            </div>
            <ol className="space-y-3">
              {scanTimeline.map((entry) => (
                <li key={entry.time} className="flex gap-3">
                  <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.4em] text-amber-200/80">{entry.time}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{entry.title}</p>
                    <p className="text-xs text-slate-300/80">{entry.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/10 bg-slate-950/40 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400/70">Resonance Insights</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300/85">
            {resonanceInsights.map((insight) => (
              <li key={insight} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
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
