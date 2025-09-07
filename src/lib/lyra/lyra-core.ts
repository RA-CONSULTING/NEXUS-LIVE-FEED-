// Lyra — Resonance Core
// Turns metrics → musical notes/chords and harmonic glyphs (Lissajous)
// No deps; safe for Vite/React. Works with 432 Hz reference by default.

export type Metric = {
  name: string;
  value: number;     // current reading
  min: number;       // expected low bound
  max: number;       // expected high bound
};

export type ScaleKind = "pentatonic" | "ionian" | "aeolian" | "custom";

export interface ScaleSpec {
  baseHz?: number;        // A4 reference (default 432)
  semitones?: number[];   // for "custom"
  kind?: ScaleKind;       // default "pentatonic"
}

// ---------- Math utilities ----------
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;
const TAU = Math.PI * 2;

// 12-TET conversion around a base reference (A4)
export function hzFromSemis(baseHz: number, semis: number) {
  return baseHz * Math.pow(2, semis / 12);
}

// Common scales as semitone steps from tonic (0)
const SCALES: Record<Exclude<ScaleKind, "custom">, number[]> = {
  pentatonic: [0, 2, 4, 7, 9, 12],            // major pentatonic
  ionian:     [0, 2, 4, 5, 7, 9, 11, 12],     // major
  aeolian:    [0, 2, 3, 5, 7, 8, 10, 12],     // natural minor
};

// Build a frequency scale (several octaves) around base
export function buildScale(spec: ScaleSpec = {}): number[] {
  const baseHz = spec.baseHz ?? 432;
  const steps  = spec.kind === "custom" ? (spec.semitones ?? [0, 2, 4, 7, 9, 12])
                                        : SCALES[spec.kind ?? "pentatonic"];
  // stack across −2..+2 octaves
  const out: number[] = [];
  for (let oct = -2; oct <= 2; oct++) {
    for (const s of steps) out.push(hzFromSemis(baseHz, s + 12 * oct));
  }
  // keep useful hearing range
  return out.filter(h => h >= 30 && h <= 8000).sort((a, b) => a - b);
}

// Map a metric value to a scale frequency
export function mapValueToHz(value: number, min: number, max: number, scale: number[]) {
  const t = (value - min) / Math.max(1e-9, (max - min));
  const u = clamp(t, 0, 1);
  const idx = Math.round(u * (scale.length - 1));
  return scale[idx];
}

// Build a chord from multiple metrics
export function chordFromMetrics(metrics: Metric[], scale: number[]) {
  const freqs = metrics.map(m => mapValueToHz(m.value, m.min, m.max, scale));
  // Deduplicate near-equals to avoid beating
  const uniq: number[] = [];
  for (const f of freqs) {
    if (!uniq.some(u => Math.abs(u - f) / u < 0.01)) uniq.push(f);
  }
  return uniq.slice(0, 6); // cap voices
}

// ---------- Glyph synthesis (Lissajous) ----------
export interface GlyphPoint { x: number; y: number; }
export interface LissajousSpec {
  fx: number;           // frequency x
  fy: number;           // frequency y
  phase?: number;       // phase offset (rad)
  samples?: number;     // default 800
  radius?: number;      // default 1.0 (unit circle)
}

export function lissajous({ fx, fy, phase = 0, samples = 800, radius = 1 }: LissajousSpec): GlyphPoint[] {
  const pts: GlyphPoint[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const th = TAU * t;
    const x = radius * Math.sin(fx * th + phase);
    const y = radius * Math.sin(fy * th);
    pts.push({ x, y });
  }
  return pts;
}

// Normalize glyph points to viewBox [0,1]x[0,1] with padding
export function normalizePoints(pts: GlyphPoint[], pad = 0.06): GlyphPoint[] {
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (const p of pts) { xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x);
                         ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y); }
  const w = xmax - xmin || 1, h = ymax - ymin || 1;
  return pts.map(p => ({
    x: pad + (1 - 2 * pad) * (p.x - xmin) / w,
    y: pad + (1 - 2 * pad) * (p.y - ymin) / h,
  }));
}

// SVG path from points
export function svgPath(pts: GlyphPoint[]): string {
  if (!pts.length) return "";
  const [p0, ...rest] = pts;
  return "M " + p0.x + " " + p0.y + " " + rest.map(p => "L " + p.x + " " + p.y).join(" ");
}

// ---------- WebAudio Synth ----------
export interface LyraSynthOptions {
  attack?: number;  // seconds
  decay?: number;
  sustain?: number; // 0..1
  release?: number;
  type?: OscillatorType; // "sine" | "triangle" | "sawtooth" | "square"
  gain?: number;   // master gain
}

export class LyraSynth {
  ctx: AudioContext;
  out: GainNode;
  delay: DelayNode;
  fb: GainNode;
  filter: BiquadFilterNode;
  opts: Required<LyraSynthOptions>;

  constructor(ctx?: AudioContext, opts: LyraSynthOptions = {}) {
    // AudioContext must be started by a user gesture in browsers
    this.ctx = ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    this.out = this.ctx.createGain();
    this.delay = this.ctx.createDelay(1.0);
    this.fb = this.ctx.createGain();
    this.filter = this.ctx.createBiquadFilter();

    this.opts = {
      attack: 0.02, decay: 0.18, sustain: 0.6, release: 0.3,
      type: "sine", gain: 0.12, ...opts
    };

    // light ambience: lowpass + gentle feedback delay
    this.filter.type = "lowpass";
    this.filter.frequency.value = 8000;
    this.delay.delayTime.value = 0.22;
    this.fb.gain.value = 0.2;

    this.out.gain.value = this.opts.gain;

    this.out.connect(this.filter);
    this.filter.connect(this.delay);
    this.delay.connect(this.fb);
    this.fb.connect(this.delay);
    this.delay.connect(this.ctx.destination);
    this.filter.connect(this.ctx.destination);
  }

  async resume() { if (this.ctx.state !== "running") await this.ctx.resume(); }

  private envGain(t0: number, dur: number) {
    const g = this.ctx.createGain();
    const { attack, decay, sustain, release } = this.opts;
    const peak = t0 + attack;
    const s = t0 + attack + decay;
    const end = t0 + dur + release;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(1.0, peak);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain), s);
    g.gain.setValueAtTime(Math.max(0.0001, sustain), t0 + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    return { node: g, end };
  }

  playNote(freqHz: number, dur = 0.6) {
    const t0 = this.ctx.currentTime + 0.01;
    const osc = this.ctx.createOscillator();
    osc.type = this.opts.type;
    osc.frequency.value = freqHz;
    const { node: g, end } = this.envGain(t0, dur);
    osc.connect(g); g.connect(this.out);
    osc.start(t0); osc.stop(end + 0.02);
  }

  playChord(freqs: number[], dur = 1.2) {
    const t0 = this.ctx.currentTime + 0.01;
    const voices = Math.max(1, Math.min(6, freqs.length));
    const perGain = this.opts.gain / Math.sqrt(voices);
    for (let i = 0; i < voices; i++) {
      const f = freqs[i];
      const osc = this.ctx.createOscillator();
      osc.type = this.opts.type;
      osc.frequency.value = f;
      const { node: g, end } = this.envGain(t0, dur);
      const voiceGain = this.ctx.createGain();
      voiceGain.gain.value = perGain;
      osc.connect(g); g.connect(voiceGain); voiceGain.connect(this.out);
      osc.start(t0); osc.stop(end + 0.02);
    }
  }
}

// Convenience: one-shot from metrics
export function chordAndGlyph(metrics: Metric[], scaleSpec: ScaleSpec = {}) {
  const scale = buildScale(scaleSpec);
  const chord = chordFromMetrics(metrics, scale);
  const fx = chord[0] ?? 220;
  const fy = chord[1] ?? (fx * 1.5);
  const pts = normalizePoints(lissajous({ fx, fy, phase: Math.PI / 2, samples: 900 }));
  return { chord, pts };
}

export default {
  buildScale, mapValueToHz, chordFromMetrics,
  lissajous, normalizePoints, svgPath,
  LyraSynth, chordAndGlyph, hzFromSemis
};