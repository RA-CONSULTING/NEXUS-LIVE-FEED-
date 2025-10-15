import { useMemo, useState } from 'react';
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
import { Line } from 'react-chartjs-2';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

type SubjectReading = {
  name: string;
  location: string;
  focus: string;
  notes: string;
  timestamp: string;
  coherence: number;
  schumannDelta: number;
  phaseLock: number;
  lumens: number;
  alignmentStatus: 'Harmonic' | 'Balancing' | 'Escalate';
  insights: string[];
};

const createSeededValue = (seed: string, min: number, max: number) => {
  if (min >= max) return min;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 131 + seed.charCodeAt(index)) % 100000;
  }
  const ratio = hash / 100000;
  const value = min + (max - min) * ratio;
  return Number(value.toFixed(3));
};

const buildSubjectReading = (name: string, location: string, focus: string, notes: string): SubjectReading => {
  const baseSeed = `${name}|${location}|${focus}|${notes}`.toLowerCase();
  const coherence = createSeededValue(`${baseSeed}:coherence`, 0.68, 0.98);
  const schumannDelta = createSeededValue(`${baseSeed}:schumann`, -0.04, 0.04);
  const phaseLock = createSeededValue(`${baseSeed}:phase-lock`, 0.72, 0.99);
  const lumens = createSeededValue(`${baseSeed}:lumens`, 62, 98);

  let alignmentStatus: SubjectReading['alignmentStatus'] = 'Balancing';
  if (coherence > 0.9 && Math.abs(schumannDelta) < 0.015) {
    alignmentStatus = 'Harmonic';
  } else if (coherence < 0.78 || Math.abs(schumannDelta) > 0.03) {
    alignmentStatus = 'Escalate';
  }

  const insights: string[] = [
    `Schumann drift ${schumannDelta >= 0 ? '+' : ''}${schumannDelta.toFixed(3)} Hz relative to baseline — ${
      Math.abs(schumannDelta) < 0.02 ? 'stays within the stable corridor.' : 'recommend additional grounding breathwork.'
    }`,
    `Phase-lock ratio at ${(phaseLock * 100).toFixed(1)}% indicates ${
      phaseLock > 0.9 ? 'strong coupling to the resonance lattice.' : 'partial coherence; invite heart-field entrainment.'
    }`,
    `Bio-luminosity quotient ${lumens.toFixed(1)} suggests ${
      lumens > 85 ? 'radiant emotional broadcast.' : 'opportunity to amplify gratitude expression.'
    }`,
  ];

  return {
    name,
    location,
    focus,
    notes,
    timestamp: new Date().toLocaleString(),
    coherence,
    schumannDelta,
    phaseLock,
    lumens,
    alignmentStatus,
    insights,
  };
};

const TemporalAuraScanTab: React.FC = () => {
  const labels = useMemo(buildTemporalLabels, []);
  const coherenceSeries = useMemo(generateCoherenceSeries, []);
  const schumannSeries = useMemo(generateSchumannSeries, []);

  const coherenceReading = coherenceSeries[coherenceSeries.length - 1];
  const schumannReading = schumannSeries[schumannSeries.length - 1];

  const [subjectName, setSubjectName] = useState('');
  const [subjectLocation, setSubjectLocation] = useState('');
  const [subjectFocus, setSubjectFocus] = useState('');
  const [subjectNotes, setSubjectNotes] = useState('');
  const [subjectReading, setSubjectReading] = useState<SubjectReading | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  const activeCoherence = subjectReading?.coherence ?? coherenceReading;
  const activeSchumann = subjectReading ? 7.83 + subjectReading.schumannDelta : schumannReading;

  const alignmentBadgeClasses: Record<SubjectReading['alignmentStatus'], string> = {
    Harmonic: 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200',
    Balancing: 'border-amber-400/60 bg-amber-400/10 text-amber-200',
    Escalate: 'border-rose-400/60 bg-rose-400/10 text-rose-200',
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = subjectName.trim();
    const trimmedLocation = subjectLocation.trim();
    const trimmedFocus = subjectFocus.trim();
    const trimmedNotes = subjectNotes.trim();

    if (!trimmedName || !trimmedLocation) {
      setFormError('Provide at least a subject name and location to initiate the personalized read.');
      return;
    }

    setFormError(null);
    setSubjectReading(buildSubjectReading(trimmedName, trimmedLocation, trimmedFocus, trimmedNotes));
  };

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
              <span className="text-lg font-semibold text-amber-200">{activeCoherence.toFixed(3)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Schumann</span>
              <span className="text-lg font-semibold text-sky-200">{activeSchumann.toFixed(3)} Hz</span>
            </div>
            <Button
              type="submit"
              form="temporal-scan-form"
              variant="outline"
              className="border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
            >
              Initiate Personalized Scan
            </Button>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
        <div className="grid gap-4 text-xs text-slate-300/80 sm:grid-cols-2">
          <div>
            <span className="text-slate-400">Scan Status</span>
            <p className="text-sm font-semibold text-amber-200">
              {subjectReading ? 'Personalized resonance generated' : 'Standing by · Synthetic reference'}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Calibration Window</span>
            <p className="text-sm font-semibold text-slate-200">
              {subjectReading ? `Stabilized ${subjectReading.timestamp}` : 'Last synchronized 42s ago'}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Signal Gain</span>
            <p className="text-sm font-semibold text-slate-200">
              {subjectReading ? '+14.2 dB · Tuned to subject imprint' : '+12.4 dB · Auto compensated'}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Entanglement Link</span>
            <p className="text-sm font-semibold text-slate-200">
              {subjectReading ? 'Secure · Alignment handshake sealed' : 'Secure · Quantum handshake nominal'}
            </p>
          </div>
        </div>
      </div>

      <Card className="border border-amber-400/15 bg-slate-950/70">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg text-amber-100">Submit Subject Coordinates</CardTitle>
          <CardDescription className="text-slate-300/80">
            Provide the identity and resonance focus of the subject to receive a tailored temporal aura read. Minimum fields are
            name and location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="temporal-scan-form" className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-200/90">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Subject Name</span>
                <input
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  placeholder="e.g. Gary Solaris"
                  className="rounded-xl border border-amber-400/20 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200/90">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Location Grid</span>
                <input
                  value={subjectLocation}
                  onChange={(event) => setSubjectLocation(event.target.value)}
                  placeholder="e.g. Harmonic Nexus · Sector 7"
                  className="rounded-xl border border-amber-400/20 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/40"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm text-slate-200/90">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Resonant Focus</span>
              <input
                value={subjectFocus}
                onChange={(event) => setSubjectFocus(event.target.value)}
                placeholder="Intent, ritual, or inquiry focus"
                className="rounded-xl border border-amber-400/20 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-200/90">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Observational Notes</span>
              <textarea
                value={subjectNotes}
                onChange={(event) => setSubjectNotes(event.target.value)}
                placeholder="Optional sensory notes, ceremonial context, or observed shifts"
                rows={4}
                className="rounded-xl border border-amber-400/20 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/40"
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {formError ? <p className="text-xs font-medium text-rose-300/90">{formError}</p> : <span />}
              <Button
                type="submit"
                className="w-full rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20 sm:w-auto"
              >
                Generate Temporal Read
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {subjectReading ? (
        <Card className="border border-amber-400/20 bg-slate-950/70">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-xl text-white">{subjectReading.name}</CardTitle>
              <Badge className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] ${alignmentBadgeClasses[subjectReading.alignmentStatus]}`}>
                {subjectReading.alignmentStatus}
              </Badge>
            </div>
            <CardDescription className="text-slate-300/80">
              {subjectReading.location || 'Undisclosed location'} · {subjectReading.focus || 'No focus declared'}
            </CardDescription>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Calibrated {subjectReading.timestamp}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-amber-400/20 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Coherence Score</p>
                <p className="mt-3 text-2xl font-semibold text-white">{subjectReading.coherence.toFixed(3)}</p>
                <p className="mt-1 text-xs text-slate-300/75">1.0 denotes perfect temporal alignment.</p>
              </div>
              <div className="rounded-2xl border border-sky-400/20 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Schumann Delta</p>
                <p className="mt-3 text-2xl font-semibold text-white">{subjectReading.schumannDelta >= 0 ? '+' : ''}{subjectReading.schumannDelta.toFixed(3)} Hz</p>
                <p className="mt-1 text-xs text-slate-300/75">Relative offset from the 7.83 Hz baseline.</p>
              </div>
              <div className="rounded-2xl border border-purple-400/20 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-purple-200">Phase-Lock Ratio</p>
                <p className="mt-3 text-2xl font-semibold text-white">{(subjectReading.phaseLock * 100).toFixed(1)}%</p>
                <p className="mt-1 text-xs text-slate-300/75">Coupling strength with resonance lattice.</p>
              </div>
              <div className="rounded-2xl border border-pink-400/20 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-pink-200">Bio-Luminosity</p>
                <p className="mt-3 text-2xl font-semibold text-white">{subjectReading.lumens.toFixed(1)} qu</p>
                <p className="mt-1 text-xs text-slate-300/75">Quantum lumens radiating from the heart field.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-amber-400/15 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-200">Field Insights</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300/85">
                {subjectReading.insights.map((insight) => (
                  <li key={insight} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            {subjectReading.notes ? (
              <div className="rounded-3xl border border-slate-500/20 bg-slate-900/60 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Observer Notes</h3>
                <p className="mt-3 text-sm text-slate-200/85">{subjectReading.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
