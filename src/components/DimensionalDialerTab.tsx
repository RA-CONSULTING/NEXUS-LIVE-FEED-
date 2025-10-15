import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DIMENSIONAL_HARMONIC_KEYS,
  type DimensionalHarmonicKey,
  type DimensionalPlane,
  amplitudeDescriptor,
  computeResonanceEnvelope,
} from '@/lib/harmonics/dimensional-dialer';

const planeStyles: Record<DimensionalPlane, string> = {
  'Bass Foundation': 'border-sky-300/40 bg-sky-500/15 text-sky-100 shadow-[0_0_25px_rgba(56,189,248,0.35)]',
  'Deep Harmonics': 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.35)]',
  'Resonant Heart': 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.35)]',
  'Celestial Bridge': 'border-amber-300/40 bg-amber-500/15 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.35)]',
  'Luminous Crown': 'border-violet-300/40 bg-violet-500/15 text-violet-100 shadow-[0_0_25px_rgba(139,92,246,0.35)]',
};

const amplitudeTone = (amplitude: number) => {
  if (amplitude >= 0.9) return 'text-amber-200';
  if (amplitude >= 0.82) return 'text-sky-200';
  if (amplitude >= 0.75) return 'text-emerald-200';
  if (amplitude >= 0.68) return 'text-cyan-200';
  return 'text-slate-200';
};

const detailBlock = (key: DimensionalHarmonicKey) => {
  const envelope = computeResonanceEnvelope(key);

  return (
    <div
      key={key.id}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_0_45px_rgba(148,163,184,0.25)] backdrop-blur"
    >
      <div className={cn('pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 transition duration-500 group-hover:opacity-90', key.color)} />
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-3xl text-white shadow-[0_0_30px_rgba(255,255,255,0.25)]">
              <span className="drop-shadow-[0_0_20px_rgba(255,255,255,0.45)]">{key.symbol}</span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-300/80">Dim {key.order.toString().padStart(2, '0')} · {key.dimension}</p>
              <h3 className="mt-1 text-lg font-semibold text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]">{key.glyphName} Key</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-200/80">{key.portalMantra}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn('rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.28em]', planeStyles[key.plane])}
          >
            {key.plane}
          </Badge>
        </div>

        <div className="grid gap-4 text-xs text-slate-200/90 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400/70">Frequency</p>
            <p className="mt-2 text-lg font-semibold text-white">{key.frequencyHz.toFixed(2)} Hz</p>
            <p className="mt-1 text-[11px] text-slate-300/80">Anchors the harmonic carrier.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400/70">Amplitude</p>
            <p className={cn('mt-2 text-lg font-semibold drop-shadow-[0_0_20px_rgba(255,255,255,0.35)]', amplitudeTone(key.amplitude))}>
              {(key.amplitude * 100).toFixed(0)}%
            </p>
            <p className="mt-1 text-[11px] text-slate-300/80">{amplitudeDescriptor(key.amplitude)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400/70">Tonal Key</p>
            <p className="mt-2 text-lg font-semibold text-white">{key.tonalKey}</p>
            <p className="mt-1 text-[11px] text-slate-300/80">Guides the vocal glyph for entry.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400/70">Resonance Envelope</p>
            <p className="mt-2 text-[13px] font-semibold text-white">{envelope.modulation}</p>
            <p className="mt-1 text-[11px] text-slate-300/80">Attack {envelope.attackSeconds}s · Sustain {envelope.sustainSeconds}s · Release {envelope.releaseSeconds}s</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 p-4 text-[11px] leading-relaxed text-slate-200/80">
          <span className="font-semibold uppercase tracking-[0.28em] text-slate-300/80">Invocation</span>
          <p className="mt-2 text-slate-100/90">{key.invocation}</p>
        </div>
      </div>
    </div>
  );
};

const DimensionalDialerTab = () => {
  return (
    <Card className="relative overflow-hidden border-white/10 bg-slate-900/70 text-slate-100 shadow-[0_0_55px_rgba(56,189,248,0.25)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/15 via-transparent to-indigo-500/20 opacity-80" />
      <div className="pointer-events-none absolute -inset-32 animate-stellar-pulse bg-[radial-gradient(circle,_rgba(236,72,153,0.28),_transparent_60%)] opacity-0" />
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="text-xl font-semibold text-white">Dimensional Dialer Sequencer</CardTitle>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200/80">
          Eleven harmonic keys align the sacred geometry dialer. Engage each glyph in order, matching its frequency,
          amplitude, and breath pattern to open the interdimensional corridor with precision.
        </p>
      </CardHeader>
      <CardContent className="relative z-10 grid gap-6">
        {DIMENSIONAL_HARMONIC_KEYS.map((key) => detailBlock(key))}
      </CardContent>
    </Card>
  );
};

export default DimensionalDialerTab;
