import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Nullable<T> = T | null | undefined;

interface ForecastWindow<T> {
  entries: T[];
  range: Nullable<{ start: Nullable<string>; end: Nullable<string> }>;
  lastUpdated: Nullable<string>;
}

interface ForecastResponse {
  quantum: ForecastWindow<QuantumForecastEntry>;
  bioLinear: ForecastWindow<BioLinearForecastEntry>;
}

interface SolarFieldSnapshot {
  kp_index?: number;
  storm_class?: string;
  solar_wind_speed_km_s?: number;
  solar_radiation?: string;
  aurora_outlook?: string;
}

interface SchumannSnapshot {
  tomsk_amplitude?: number;
  tomsk_frequency_hz?: number;
  cumana_e_field?: string;
  heartmath_power_band_hz?: string;
}

interface CosmicSnapshot {
  interstellar_current?: string;
  galactic_wave_interaction?: string;
}

interface QuantumForecastEntry {
  date: string;
  solar_field?: SolarFieldSnapshot;
  schumann_resonance?: SchumannSnapshot;
  cosmic_events?: CosmicSnapshot;
  nervous_system_guidance?: string[];
  narrative?: string;
  last_updated?: string;
  validation?: { last_synced_at?: string };
}

interface HazardRating {
  level?: string;
  confidence?: number;
  notes?: string;
}

interface BioLinearForecastEntry {
  date: string;
  synoptic_overview?: string;
  hazard_ratings?: Record<string, HazardRating>;
  alerts?: string[];
  preparedness_actions?: string[];
  last_updated?: string;
  validation?: { last_synced_at?: string };
}

const clamp01 = (value: Nullable<number>) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
};

const formatDate = (isoDate: Nullable<string>) => {
  if (!isoDate) {
    return 'TBD';
  }
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return String(isoDate);
  }
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (isoDate: Nullable<string>) => {
  if (!isoDate) {
    return 'Auto-sync pending';
  }
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return String(isoDate);
  }
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRange = (range: Nullable<{ start: Nullable<string>; end: Nullable<string> }>) => {
  if (!range?.start || !range?.end) {
    return 'Rolling 30-day horizon';
  }
  return `${formatDate(range.start)} – ${formatDate(range.end)}`;
};

const headlineForHazard = (value: string) =>
  value
    .split(/[_-]/g)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const pickLastUpdated = (entry: { last_updated?: string; validation?: { last_synced_at?: string } }) =>
  entry.last_updated ?? entry.validation?.last_synced_at ?? null;

const QuantumNarrativeCard = ({
  entry,
}: {
  entry: QuantumForecastEntry;
}) => (
  <article
    key={entry.date}
    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_0_40px_rgba(56,189,248,0.18)]"
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_65%)] opacity-80" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(236,72,153,0.2),_transparent_60%)] opacity-70" />
    <div className="relative z-10 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-[0.3em] text-slate-100">
            {formatDate(entry.date)}
          </h3>
          <p className="text-sm text-slate-300/85">{entry.narrative ?? 'Harmonic field maintaining coherence.'}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs uppercase tracking-[0.28em] text-slate-300/80">
          <Badge
            variant="outline"
            className="rounded-full border-sky-400/40 bg-sky-500/15 px-4 py-1 text-[10px] font-semibold text-sky-100"
          >
            Quantum Cohort
          </Badge>
          <span className="text-[11px] text-slate-300/70">
            Updated {formatDateTime(pickLastUpdated(entry))}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <h4 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">Solar Field</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-200/85">
            <li>
              <span className="font-semibold text-white">Kp:</span>{' '}
              {entry.solar_field?.kp_index != null ? entry.solar_field.kp_index.toFixed(1) : '—'}
              <span className="ml-2 text-xs text-slate-400">{entry.solar_field?.storm_class ?? 'Stable'}</span>
            </li>
            <li>
              <span className="font-semibold text-white">Solar Wind:</span>{' '}
              {entry.solar_field?.solar_wind_speed_km_s != null
                ? `${Math.round(entry.solar_field.solar_wind_speed_km_s)} km/s`
                : '—'}
            </li>
            <li className="text-xs leading-relaxed text-slate-300/80">
              {entry.solar_field?.solar_radiation ?? 'Radiation background calm.'}
            </li>
            <li className="text-xs leading-relaxed text-slate-300/80">
              {entry.solar_field?.aurora_outlook ?? 'Aurora field steady.'}
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <h4 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">Schumann Resonance</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-200/85">
            <li>
              <span className="font-semibold text-white">Tomsk:</span>{' '}
              {entry.schumann_resonance?.tomsk_amplitude != null
                ? `${entry.schumann_resonance.tomsk_amplitude.toFixed(2)} amplitude`
                : '—'}
              ,{' '}
              {entry.schumann_resonance?.tomsk_frequency_hz != null
                ? `${entry.schumann_resonance.tomsk_frequency_hz.toFixed(2)} Hz`
                : '—'}
            </li>
            <li className="text-xs leading-relaxed text-slate-300/80">
              {entry.schumann_resonance?.cumana_e_field ?? 'Electric field baseline nominal.'}
            </li>
            <li className="text-xs leading-relaxed text-slate-300/80">
              {entry.schumann_resonance?.heartmath_power_band_hz ?? 'Coherence band steady between 1–50 Hz.'}
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <h4 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">Cosmic Guidance</h4>
          <div className="mt-3 space-y-3 text-sm text-slate-200/85">
            <p className="text-xs leading-relaxed text-slate-300/80">
              {entry.cosmic_events?.interstellar_current ?? 'Interstellar current gentle; no major perturbations.'}
            </p>
            <p className="text-xs leading-relaxed text-slate-300/80">
              {entry.cosmic_events?.galactic_wave_interaction ?? 'Galactic wave harmonics well phased with Earth field.'}
            </p>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300/80">Somatic Practice</p>
              <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-200/85">
                {(entry.nervous_system_guidance?.length
                  ? entry.nervous_system_guidance
                  : ['Ground barefoot', 'Hydrate with mineral-rich water']).map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-400" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
);

const BioLinearNarrativeCard = ({ entry }: { entry: BioLinearForecastEntry }) => {
  const hazardEntries = Object.entries(entry.hazard_ratings ?? {});

  return (
    <article
      key={entry.date}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_0_40px_rgba(251,191,36,0.16)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.25),_transparent_60%)] opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.18),_transparent_60%)] opacity-70" />
      <div className="relative z-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-[0.3em] text-slate-100">
              {formatDate(entry.date)}
            </h3>
            <p className="text-sm text-slate-300/85">
              {entry.synoptic_overview ?? 'Atmospheric field calm with low hydrological stress.'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs uppercase tracking-[0.28em] text-slate-300/80">
            <Badge
              variant="outline"
              className="rounded-full border-amber-400/40 bg-amber-500/15 px-4 py-1 text-[10px] font-semibold text-amber-100"
            >
              Bio-Linear Cohort
            </Badge>
            <span className="text-[11px] text-slate-300/70">
              Updated {formatDateTime(pickLastUpdated(entry))}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h4 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">Hazard Spectrum</h4>
            <div className="mt-3 space-y-3">
              {hazardEntries.length === 0 ? (
                <p className="text-xs text-slate-300/80">No active hazards detected.</p>
              ) : (
                hazardEntries.map(([key, rating]) => {
                  const confidence = Math.round(clamp01(rating.confidence) * 100);
                  return (
                    <div key={key} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.26em] text-slate-200/90">
                        <span>{headlineForHazard(key)}</span>
                        <span className="font-semibold text-white">{rating.level ?? 'Stable'}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-300/80">{rating.notes ?? 'No anomalies detected.'}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-700/50">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-sky-400"
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-white">{confidence}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <h4 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">Alerts</h4>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-200/85">
                {(entry.alerts?.length ? entry.alerts : ['No active alerts in effect.']).map((alert) => (
                  <li key={alert} className="flex items-start gap-2">
                    <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-gradient-to-r from-amber-300 to-rose-300" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <h4 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">Preparedness</h4>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-200/85">
                {(entry.preparedness_actions?.length
                  ? entry.preparedness_actions
                  : ['Maintain standard monitoring cadence.']
                ).map((action) => (
                  <li key={action} className="flex items-start gap-2">
                    <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-gradient-to-r from-sky-300 to-emerald-300" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const ForecastTabs = () => {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const fetchForecasts = async (withSpinner = false) => {
      try {
        if (withSpinner) {
          setLoading(true);
        }
        const response = await fetch('/api/forecasts');
        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }
        const json = (await response.json()) as ForecastResponse;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Unable to load forecast data', err);
          setError('Unable to load live forecast window.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchForecasts(true);
    const interval = setInterval(() => fetchForecasts(false), 30 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const quantumRange = useMemo(
    () => formatRange(data?.quantum?.range ?? null),
    [data?.quantum?.range]
  );
  const bioLinearRange = useMemo(
    () => formatRange(data?.bioLinear?.range ?? null),
    [data?.bioLinear?.range]
  );

  const quantumUpdated = useMemo(
    () => formatDateTime(data?.quantum?.lastUpdated ?? null),
    [data?.quantum?.lastUpdated]
  );
  const bioLinearUpdated = useMemo(
    () => formatDateTime(data?.bioLinear?.lastUpdated ?? null),
    [data?.bioLinear?.lastUpdated]
  );

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/70 p-6 text-slate-100 shadow-[0_0_60px_rgba(148,163,184,0.28)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%)] opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(251,191,36,0.25),_transparent_60%)] opacity-75" />
      <div className="relative z-10 space-y-8">
        <header className="space-y-4">
          <Badge className="rounded-full border-white/20 bg-white/10 px-5 py-1 text-[11px] font-semibold uppercase tracking-[0.36em] text-white/85" variant="outline">
            Rolling Forecast Console
          </Badge>
          <div className="space-y-2">
            <h2 className="bg-gradient-to-r from-sky-200 via-amber-200 to-rose-200 bg-clip-text text-3xl font-bold tracking-[0.32em] text-transparent sm:text-4xl">
              Quantum &amp; Bio-Linear Outlook
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-300/85">
              Live thirty-day windows blending the harmonic quantum forecast with the bio-linear hazard sentinel. The console refreshes every hour to keep the narrative aligned with the latest telemetry.
            </p>
          </div>
        </header>

        {error ? (
          <div className="rounded-3xl border border-rose-400/40 bg-rose-500/10 p-6 text-sm text-rose-100">
            {error}
          </div>
        ) : (
          <Tabs defaultValue="quantum" className="space-y-6">
            <TabsList className="flex flex-wrap gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur">
              <TabsTrigger
                value="quantum"
                className="group relative flex-1 min-w-[200px] overflow-hidden rounded-xl border border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200 transition hover:text-white data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500/40 data-[state=active]:via-cyan-500/30 data-[state=active]:to-fuchsia-500/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_35px_rgba(59,130,246,0.4)]"
              >
                Quantum Weather
              </TabsTrigger>
              <TabsTrigger
                value="bio-linear"
                className="group relative flex-1 min-w-[200px] overflow-hidden rounded-xl border border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200 transition hover:text-white data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400/40 data-[state=active]:via-rose-400/30 data-[state=active]:to-sky-400/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_35px_rgba(251,191,36,0.35)]"
              >
                Bio-Linear Hazards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quantum" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.3em] text-slate-300/80">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="rounded-full border-sky-400/40 bg-sky-500/15 px-4 py-1 text-[10px] font-semibold text-sky-100" variant="outline">
                    {quantumRange}
                  </Badge>
                  <span>Last sync · {quantumUpdated}</span>
                </div>
                {loading && <span className="animate-pulse text-slate-300/70">Refreshing…</span>}
              </div>

              <div className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
                {(data?.quantum?.entries.length ?? 0) === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300/85">
                    Forecast window is initializing. Check back shortly for live harmonics.
                  </div>
                ) : (
                  data?.quantum?.entries.map((entry) => (
                    <QuantumNarrativeCard key={entry.date} entry={entry} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="bio-linear" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.3em] text-slate-300/80">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="rounded-full border-amber-400/40 bg-amber-500/15 px-4 py-1 text-[10px] font-semibold text-amber-100" variant="outline">
                    {bioLinearRange}
                  </Badge>
                  <span>Last sync · {bioLinearUpdated}</span>
                </div>
                {loading && <span className="animate-pulse text-slate-300/70">Refreshing…</span>}
              </div>

              <div className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
                {(data?.bioLinear?.entries.length ?? 0) === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300/85">
                    Bio-linear sentinel is syncing. Updated hazard projections will appear momentarily.
                  </div>
                ) : (
                  data?.bioLinear?.entries.map((entry) => (
                    <BioLinearNarrativeCard key={entry.date} entry={entry} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </section>
  );
};

export default ForecastTabs;
