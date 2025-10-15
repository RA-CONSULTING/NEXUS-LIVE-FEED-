import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type LiveStreamState = 'Stable' | 'Watch' | 'Anomaly';

export type LiveStreamDatum = {
  id: string;
  name: string;
  location: string;
  intensity: number;
  state: LiveStreamState;
  note: string;
  rate: number;
  unit: string;
  capacity: number;
};

type StreamTheme = {
  crest: string;
  tagline: string;
  gradient: string;
  aurora: string;
  sparkline: [string, string, string];
  halo: string;
  sigils: string[];
};

const STREAM_THEMES: Record<string, StreamTheme> = {
  phenomena: {
    crest: 'Aureon Institute · Quantum Activation Seal',
    tagline: 'Prime sentinel witnessing cosmic phenomena in crystalline detail.',
    gradient: 'from-sky-500/35 via-indigo-500/25 to-emerald-500/20',
    aurora:
      'radial-gradient(circle at 18% 22%, rgba(56,189,248,0.28), transparent 65%), radial-gradient(circle at 82% 18%, rgba(129,140,248,0.18), transparent 75%)',
    sparkline: ['#38bdf8', '#818cf8', '#c084fc'],
    halo: 'rgba(56,189,248,0.88)',
    sigils: ['Quantum Seal', 'Prime Witness'],
  },
  temporal: {
    crest: 'Consciousness Wave Correlation Array',
    tagline: 'Temporal nexus aligns with consciousness wave harmonics.',
    gradient: 'from-amber-500/30 via-rose-500/25 to-sky-500/25',
    aurora:
      'radial-gradient(circle at 78% 20%, rgba(251,191,36,0.32), transparent 70%), radial-gradient(circle at 22% 82%, rgba(99,102,241,0.18), transparent 75%)',
    sparkline: ['#facc15', '#fb7185', '#60a5fa'],
    halo: 'rgba(251,191,36,0.88)',
    sigils: ['Wave Correlation', 'Chrono Array'],
  },
  geometry: {
    crest: 'Heart Mandala Resonance Hub',
    tagline: 'Sacred geometry modulators amplify harmonic compassion grids.',
    gradient: 'from-rose-500/35 via-fuchsia-500/25 to-amber-400/20',
    aurora:
      'radial-gradient(circle at 28% 78%, rgba(244,114,182,0.32), transparent 70%), radial-gradient(circle at 74% 26%, rgba(251,191,36,0.22), transparent 75%)',
    sparkline: ['#f472b6', '#fb7185', '#facc15'],
    halo: 'rgba(236,72,153,0.88)',
    sigils: ['Heart Resonance', 'Mandala Vector'],
  },
  celestial: {
    crest: 'Orbital Relay · Stellar Crown',
    tagline: 'Orbital relay charts celestial pathways for the harmonic lattice.',
    gradient: 'from-sky-500/30 via-blue-500/25 to-indigo-500/20',
    aurora:
      'radial-gradient(circle at 52% 48%, rgba(56,189,248,0.28), transparent 75%), radial-gradient(circle at 18% 70%, rgba(14,165,233,0.18), transparent 75%)',
    sparkline: ['#38bdf8', '#22d3ee', '#818cf8'],
    halo: 'rgba(59,130,246,0.85)',
    sigils: ['Orbital Relay', 'Crown Glyph'],
  },
  geomagnetic: {
    crest: 'Coherence Crown · Planetary Shield',
    tagline: 'Magnetosphere guardians stabilise the planet-wide coherence field.',
    gradient: 'from-emerald-500/35 via-teal-500/25 to-sky-500/20',
    aurora:
      'radial-gradient(circle at 70% 76%, rgba(16,185,129,0.32), transparent 75%), radial-gradient(circle at 24% 24%, rgba(45,212,191,0.2), transparent 80%)',
    sparkline: ['#34d399', '#2dd4bf', '#0ea5e9'],
    halo: 'rgba(16,185,129,0.9)',
    sigils: ['Geomantic Shield', 'Coherence Halo'],
  },
  default: {
    crest: 'Nexus Stream',
    tagline: 'Live lattice telemetry from the Harmonic Nexus.',
    gradient: 'from-indigo-500/30 via-slate-500/25 to-transparent',
    aurora:
      'radial-gradient(circle at 50% 40%, rgba(129,140,248,0.22), transparent 70%), radial-gradient(circle at 20% 80%, rgba(148,163,184,0.18), transparent 75%)',
    sparkline: ['#818cf8', '#38bdf8', '#a855f7'],
    halo: 'rgba(129,140,248,0.85)',
    sigils: ['Nexus Mesh'],
  },
};

const STREAM_ORDER = ['phenomena', 'temporal', 'geometry', 'celestial', 'geomagnetic'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const createSparklineValues = (rate: number, intensity: number) => {
  const normalizedRate = clamp(rate / Math.max(rate + 80, 120), 0, 1);
  const intensityRatio = clamp(intensity / 100, 0, 1);

  return Array.from({ length: 24 }, (_, index) => {
    const wave = Math.sin(index * 0.45 + normalizedRate * 2.1);
    const harmonic = Math.cos(index * 0.32 + intensityRatio * 1.7);
    const composite = 0.58 + 0.24 * wave + 0.16 * harmonic * (0.6 + intensityRatio * 0.8);
    return clamp(composite, 0.12, 0.96);
  });
};

const buildSparklinePaths = (values: number[]) => {
  if (values.length < 2) {
    return { line: '', area: '' };
  }

  const step = 100 / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const y = 34 - value * 26;
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  });

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const area = `M 0 34 ${points.map((point) => `L ${point.x} ${point.y}`).join(' ')} L 100 34 Z`;

  return { line, area };
};

const badgeTone: Record<LiveStreamState, string> = {
  Stable: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.35)]',
  Watch: 'border-amber-300/50 bg-amber-500/15 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.35)]',
  Anomaly: 'border-rose-400/50 bg-rose-500/20 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.35)]',
};

type LiveStreamShowcaseProps = {
  streams: LiveStreamDatum[];
  updatedAt?: Date;
};

const LiveStreamShowcase = ({ streams, updatedAt }: LiveStreamShowcaseProps) => {
  const orderedStreams = useMemo(() => {
    const orderIndex = new Map(STREAM_ORDER.map((key, index) => [key, index]));
    return [...streams].sort((a, b) => {
      const aIndex = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
  }, [streams]);

  const decorated = useMemo(
    () =>
      orderedStreams.map((stream) => {
        const theme = STREAM_THEMES[stream.id] ?? STREAM_THEMES.default;
        const occupancy = clamp(stream.capacity ? stream.rate / stream.capacity : stream.intensity / 100, 0, 1);
        const signalStrength = clamp(stream.intensity / 100, 0, 1);
        const sparkValues = createSparklineValues(stream.rate, stream.intensity);
        const sparkline = buildSparklinePaths(sparkValues);

        return {
          stream,
          theme,
          occupancy,
          signalStrength,
          sparkline,
        };
      }),
    [orderedStreams]
  );

  return (
    <Card className="relative overflow-hidden border-white/10 bg-slate-950/70 text-slate-100 shadow-[0_0_45px_rgba(59,130,246,0.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_62%)] opacity-75" />
      <CardHeader className="relative z-10 flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight text-white">Live Stream Observatory</CardTitle>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-300/85">
            Spectacular upgrades ripple through every live channel—each stream now carries cosmic sigils, harmonic analytics, and
            auroral telemetry inspired by the Aureon Institute activation seals.
          </p>
        </div>
        {updatedAt ? (
          <Badge
            variant="outline"
            className="rounded-full border-sky-400/50 bg-sky-500/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-100 shadow-[0_0_25px_rgba(56,189,248,0.35)]"
          >
            Synced {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="relative z-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {decorated.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300/80">
            Awaiting live stream telemetry…
          </div>
        ) : null}
        {decorated.map(({ stream, theme, occupancy, signalStrength, sparkline }) => {
          const gradientId = `stream-spark-${stream.id}`;
          const areaId = `${gradientId}-fill`;
          const capacityLabel = stream.unit ? `${stream.capacity} ${stream.unit}` : String(stream.capacity);

          return (
            <div
              key={stream.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-[1px] shadow-[0_0_40px_rgba(148,163,184,0.3)]"
            >
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 rounded-3xl opacity-90 blur-xl transition duration-500 group-hover:opacity-100',
                  `bg-gradient-to-br ${theme.gradient}`
                )}
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-80 transition duration-500 group-hover:opacity-100"
                style={{ backgroundImage: theme.aurora }}
              />
              <div className="relative h-full rounded-[calc(1.5rem-2px)] bg-slate-950/80 p-5">
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-slate-200/75">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.55)]" />
                      </span>
                      Live Stream
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight text-white">{stream.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className="inline-flex rounded-full border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/85"
                    >
                      {theme.crest}
                    </Badge>
                    <p className="text-xs leading-relaxed text-slate-300/85">{theme.tagline}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]',
                      badgeTone[stream.state]
                    )}
                  >
                    {stream.state}
                  </Badge>
                </div>

                <div className="relative z-10 mt-6 flex items-center gap-4">
                  <div className="relative h-14 w-14">
                    <div
                      className="absolute inset-0 rounded-full border border-white/10"
                      style={{
                        background: `conic-gradient(${theme.halo} ${Math.round(signalStrength * 360)}deg, rgba(51,65,85,0.4) ${Math.round(signalStrength * 360)}deg)`,
                      }}
                    />
                    <div className="absolute inset-[5px] flex items-center justify-center rounded-full border border-white/10 bg-slate-950/85 text-sm font-semibold text-white">
                      {Math.round(stream.intensity)}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-slate-300/70">{stream.location}</div>
                    <div className="text-3xl font-semibold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.35)]">
                      {stream.rate.toFixed(1)}{' '}
                      <span className="text-sm font-normal text-slate-300/80">{stream.unit || 'units'}</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-5">
                  <svg viewBox="0 0 100 34" className="h-16 w-full text-white/50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={theme.sparkline[0]} />
                        <stop offset="50%" stopColor={theme.sparkline[1]} />
                        <stop offset="100%" stopColor={theme.sparkline[2]} />
                      </linearGradient>
                      <linearGradient id={areaId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={theme.sparkline[0]} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={theme.sparkline[2]} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    {sparkline.area ? <path d={sparkline.area} fill={`url(#${areaId})`} stroke="none" /> : null}
                    {sparkline.line ? (
                      <path
                        d={sparkline.line}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}
                  </svg>
                </div>

                <div className="relative z-10 mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-slate-300/70">Load Factor</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-semibold text-white">{Math.round(occupancy * 100)}%</span>
                      <span className="text-xs text-slate-300/70">of {capacityLabel}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800/80">
                      <div
                        className="h-1.5 rounded-full shadow-[0_0_18px_rgba(56,189,248,0.35)]"
                        style={{ width: `${Math.round(occupancy * 100)}%`, background: theme.halo }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-slate-300/70">Signal Note</div>
                    <p className="text-xs leading-relaxed text-slate-300/85">{stream.note}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.28em] text-slate-100/85">
                      {theme.sigils.map((sigil) => (
                        <span key={sigil} className="rounded-full border border-white/15 bg-white/10 px-2 py-1">
                          {sigil}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default LiveStreamShowcase;
