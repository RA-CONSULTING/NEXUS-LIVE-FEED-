import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BioResonanceData {
  species: string;
  resonanceFactor: number;
  location: string;
}

const BioResonanceInterface: React.FC = () => {
  const [bioResonanceData, setBioResonanceData] = useState<BioResonanceData[]>([]);
  const [harmonizationResult, setHarmonizationResult] = useState<any>(null);

  useEffect(() => {
    const eventSource = new EventSource('/bio-resonance-stream');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setBioResonanceData(data.bioResonance);
    };
    return () => {
      eventSource.close();
    };
  }, []);

  const handleHarmonize = async () => {
    try {
      const response = await fetch('/harmonize-bio-resonance');
      const result = await response.json();
      setHarmonizationResult(result);
    } catch (error) {
      console.error('Error during bio-resonance harmonization:', error);
      setHarmonizationResult({ error: 'Failed to harmonize bio-resonance' });
    }
  };

  const resonanceTone = (value: number) => {
    if (value < 0.5) return 'from-rose-500/50 via-amber-500/25 to-transparent';
    if (value < 0.8) return 'from-amber-500/45 via-yellow-400/30 to-transparent';
    return 'from-emerald-500/45 via-teal-400/30 to-transparent';
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-slate-100 shadow-[0_0_45px_rgba(20,184,166,0.25)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_60%)] opacity-80" />
      <header className="relative z-10 flex flex-col gap-4 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold uppercase tracking-[0.3em] text-white">Bio-Resonance Interface</h3>
          <p className="mt-1 text-sm text-slate-300/80">
            Monitoring the living resonance of allied species and sanctuaries. Harmonize to cascade restorative frequencies.
          </p>
        </div>
        <button
          onClick={handleHarmonize}
          className="relative overflow-hidden rounded-2xl border border-emerald-400/50 bg-emerald-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition hover:border-emerald-300/70 hover:bg-emerald-500/30"
        >
          Harmonize Bio-Resonance
        </button>
      </header>
      <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300/80">Live Bio-Resonance Data</h4>
          <div className="space-y-3">
            {bioResonanceData.map((data, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-[1px]">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10 opacity-0 transition duration-500 group-hover:opacity-100" />
                <div className="relative rounded-[calc(1rem-2px)] bg-slate-950/80 p-4">
                  <div className={cn('pointer-events-none absolute inset-0 rounded-[calc(1rem-2px)] opacity-70 blur-2xl transition duration-500 group-hover:opacity-100', `bg-gradient-to-br ${resonanceTone(data.resonanceFactor)}`)} />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.22em] text-white">{data.species}</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-200">
                      Resonance {data.resonanceFactor.toFixed(2)}
                    </span>
                  </div>
                  <div className="relative z-10 mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-slate-300/80">
                    <span>Location</span>
                    <span>{data.location}</span>
                  </div>
                  <div className="relative z-10 mt-4 h-1.5 rounded-full bg-slate-800/80">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 shadow-[0_0_18px_rgba(16,185,129,0.4)]"
                      style={{ width: `${Math.min(100, Math.round(data.resonanceFactor * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300/80">Harmonization Result</h4>
          {harmonizationResult ? (
            <pre className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs text-emerald-100/80">
              {JSON.stringify(harmonizationResult, null, 2)}
            </pre>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-xs text-slate-300/70">
              Awaiting harmonization request. Initiate the ritual to synchronize bio-fields.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default BioResonanceInterface;
