import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { earthToneGroups } from '@/theme/palette';

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
    gradient: 'from-[#8f5b34]/30 via-[#c16a4a]/20 to-[#6b8a5e]/20',
    aurora:
      'radial-gradient(circle at 18% 22%, rgba(199,143,92,0.28), transparent 65%), radial-gradient(circle at 82% 18%, rgba(135,156,118,0.2), transparent 75%)',
    sparkline: earthToneGroups.vitality,
    halo: 'rgba(199,143,92,0.85)',
    sigils: ['Quantum Seal', 'Prime Witness'],
  },
  temporal: {
    crest: 'Consciousness Wave Correlation Array',
    tagline: 'Temporal nexus aligns with consciousness wave harmonics.',
    gradient: 'from-[#d99b54]/30 via-[#b9744f]/20 to-[#6b8a5e]/25',
    aurora:
      'radial-gradient(circle at 78% 20%, rgba(217,155,84,0.32), transparent 70%), radial-gradient(circle at 22% 82%, rgba(115,93,74,0.22), transparent 75%)',
    sparkline: earthToneGroups.flow,
    halo: 'rgba(217,155,84,0.85)',
    sigils: ['Wave Correlation', 'Chrono Array'],
  },
  geometry: {
    crest: 'Heart Mandala Resonance Hub',
    tagline: 'Sacred geometry modulators amplify harmonic compassion grids.',
    gradient: 'from-[#c16a4a]/30 via-[#d99b54]/20 to-[#8f5b34]/20',
    aurora:
      'radial-gradient(circle at 28% 78%, rgba(214,172,121,0.28), transparent 70%), radial-gradient(circle at 74% 26%, rgba(142,164,126,0.18), transparent 75%)',
    sparkline: earthToneGroups.aurora,
    halo: 'rgba(214,172,121,0.85)',
    sigils: ['Heart Resonance', 'Mandala Vector'],
  },
  celestial: {
    crest: 'Orbital Relay · Stellar Crown',
    tagline: 'Orbital relay charts celestial pathways for the harmonic lattice.',
    gradient: 'from-[#6b8a5e]/30 via-[#8faa72]/25 to-[#b7c59f]/20',
    aurora:
      'radial-gradient(circle at 52% 48%, rgba(142,164,126,0.26), transparent 75%), radial-gradient(circle at 18% 70%, rgba(91,118,73,0.18), transparent 75%)',
    sparkline: earthToneGroups.horizon,
    halo: 'rgba(142,164,126,0.82)',
    sigils: ['Orbital Relay', 'Crown Glyph'],
  },
  geomagnetic: {
    crest: 'Coherence Crown · Planetary Shield',
    tagline: 'Magnetosphere guardians stabilise the planet-wide coherence field.',
    gradient: 'from-[#4f6b40]/35 via-[#6b8a5e]/25 to-[#8faa72]/20',
    aurora:
      'radial-gradient(circle at 70% 76%, rgba(111,140,92,0.3), transparent 75%), radial-gradient(circle at 24% 24%, rgba(79,107,64,0.22), transparent 80%)',
    sparkline: earthToneGroups.resonance,
    halo: 'rgba(111,140,92,0.85)',
    sigils: ['Geomantic Shield', 'Coherence Halo'],
  },
  default: {
    crest: 'Nexus Stream',
    tagline: 'Live lattice telemetry from the Harmonic Nexus.',
    gradient: 'from-[#735d4a]/30 via-[#8f5b34]/25 to-transparent',
    aurora:
      'radial-gradient(circle at 50% 40%, rgba(169,129,90,0.24), transparent 70%), radial-gradient(circle at 20% 80%, rgba(115,93,74,0.18), transparent 75%)',
    sparkline: earthToneGroups.dusk,
    halo: 'rgba(169,129,90,0.82)',
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
  Stable: 'border-[rgba(107,138,94,0.4)] bg-[rgba(79,107,64,0.22)] text-[#e6f1de] shadow-[0_0_20px_rgba(79,107,64,0.3)]',
  Watch: 'border-[rgba(217,155,84,0.4)] bg-[rgba(217,155,84,0.22)] text-[#fdf3e4] shadow-[0_0_20px_rgba(217,155,84,0.28)]',
  Anomaly: 'border-[rgba(193,106,74,0.42)] bg-[rgba(193,106,74,0.24)] text-[#fbe9e2] shadow-[0_0_20px_rgba(193,106,74,0.3)]',
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
    <Card className="relative overflow-hidden border-[rgba(214,172,121,0.18)] bg-[#1f160f]/80 text-[#f4efe6] shadow-[0_0_45px_rgba(140,98,57,0.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(169,129,90,0.22),_transparent_62%)] opacity-75" />
      <CardHeader className="relative z-10 flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight text-[#f6f1e8]">Live Stream Observatory</CardTitle>
          <p className="max-w-2xl text-sm leading-relaxed text-[#e6d9c9]/85">
            Spectacular upgrades ripple through every live channel—each stream now carries cosmic sigils, harmonic analytics, and
            auroral telemetry inspired by the Aureon Institute activation seals.
          </p>
        </div>
        {updatedAt ? (
          <Badge
            variant="outline"
            className="rounded-full border-[rgba(214,172,121,0.35)] bg-[rgba(214,172,121,0.18)] px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f6e9d9] shadow-[0_0_25px_rgba(169,129,90,0.3)]"
          >
            Synced {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="relative z-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {decorated.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-[rgba(214,172,121,0.18)] bg-[rgba(44,33,22,0.6)] p-8 text-center text-sm text-[#e6d9c9]/80">
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
              className="group relative overflow-hidden rounded-3xl border border-[rgba(214,172,121,0.2)] bg-[rgba(44,33,22,0.45)] p-[1px] shadow-[0_0_40px_rgba(140,98,57,0.26)]"
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
              <div className="relative h-full rounded-[calc(1.5rem-2px)] bg-[#22170f]/85 p-5">
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-[#d9c7b3]/75">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6b8a5e] opacity-70" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#4f6b40] shadow-[0_0_12px_rgba(79,107,64,0.5)]" />
                      </span>
                      Live Stream
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight text-[#f6f1e8]">{stream.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className="inline-flex rounded-full border-[rgba(214,172,121,0.28)] bg-[rgba(214,172,121,0.14)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#f4ede2]/85"
                    >
                      {theme.crest}
                    </Badge>
                    <p className="text-xs leading-relaxed text-[#e6d9c9]/85">{theme.tagline}</p>
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
                      className="absolute inset-0 rounded-full border border-[rgba(214,172,121,0.18)]"
                      style={{
                        background: `conic-gradient(${theme.halo} ${Math.round(signalStrength * 360)}deg, rgba(60,48,32,0.45) ${Math.round(signalStrength * 360)}deg)`,
                      }}
                    />
                    <div className="absolute inset-[5px] flex items-center justify-center rounded-full border border-[rgba(214,172,121,0.18)] bg-[#1d140c]/85 text-sm font-semibold text-[#f6f1e8]">
                      {Math.round(stream.intensity)}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-[#d9c7b3]/70">{stream.location}</div>
                    <div className="text-3xl font-semibold text-[#f6f1e8] drop-shadow-[0_0_30px_rgba(214,172,121,0.28)]">
                      {stream.rate.toFixed(1)}{' '}
                      <span className="text-sm font-normal text-[#e6d9c9]/80">{stream.unit || 'units'}</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-5">
                  <svg viewBox="0 0 100 34" className="h-16 w-full text-[#f6f1e8]/50" preserveAspectRatio="none">
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
                    <div className="text-[10px] uppercase tracking-[0.28em] text-[#d9c7b3]/70">Load Factor</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-semibold text-[#f6f1e8]">{Math.round(occupancy * 100)}%</span>
                      <span className="text-xs text-[#d9c7b3]/70">of {capacityLabel}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[rgba(87,64,43,0.6)]">
                      <div
                        className="h-1.5 rounded-full shadow-[0_0_18px_rgba(169,129,90,0.3)]"
                        style={{ width: `${Math.round(occupancy * 100)}%`, background: theme.halo }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-[#d9c7b3]/70">Signal Note</div>
                    <p className="text-xs leading-relaxed text-[#e6d9c9]/85">{stream.note}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.28em] text-[#f4ede2]/85">
                      {theme.sigils.map((sigil) => (
                        <span key={sigil} className="rounded-full border border-[rgba(214,172,121,0.22)] bg-[rgba(214,172,121,0.12)] px-2 py-1">
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
