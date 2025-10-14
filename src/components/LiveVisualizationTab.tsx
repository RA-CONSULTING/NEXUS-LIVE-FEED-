import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type VisualizationMetric = {
  label: string;
  value: string;
  hint: string;
  tone?: 'stable' | 'watch' | 'alert';
};

export type VisualizationModule = {
  id: string;
  title: string;
  summary: string;
  status?: string;
  metrics: VisualizationMetric[];
};

const badgeVariant = (tone?: 'stable' | 'watch' | 'alert') => {
  if (!tone) return 'secondary' as const;
  if (tone === 'stable') return 'success' as const;
  if (tone === 'watch') return 'warning' as const;
  return 'destructive' as const;
};

const metricLabel = (tone: 'stable' | 'watch' | 'alert') =>
  tone === 'stable' ? 'Stable' : tone === 'watch' ? 'Watch' : 'Alert';

type LiveVisualizationTabProps = {
  modules: VisualizationModule[];
};

const LiveVisualizationTab = ({ modules }: LiveVisualizationTabProps) => (
  <Card className="relative overflow-hidden border-white/10 bg-slate-950/70 text-slate-100 shadow-[0_0_45px_rgba(236,72,153,0.22)]">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.2),_transparent_60%)] opacity-80" />
    <CardHeader className="relative z-10 pb-4">
      <CardTitle className="text-xl font-semibold tracking-[0.28em] text-white">Live Visualization Center</CardTitle>
      <p className="mt-2 text-sm text-slate-300/85">
        Every module paints the nexus from a different prism. Select metrics pulse alongside their health glyphs.
      </p>
    </CardHeader>
    <CardContent className="relative z-10 grid gap-4 lg:grid-cols-3">
      {modules.map((module) => (
        <div
          key={module.id}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-[1px]"
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10 opacity-0 transition duration-500 group-hover:opacity-100" />
          <div className="relative z-10 flex flex-col gap-5 rounded-[1.05rem] bg-slate-950/80 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white">{module.title}</div>
                <p className="mt-1 text-xs text-slate-300/80">{module.summary}</p>
              </div>
              {module.status ? (
                <Badge className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]" variant="outline">
                  {module.status}
                </Badge>
              ) : null}
            </div>
            <dl className="space-y-5 text-sm">
              {module.metrics.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-[11px] uppercase tracking-[0.28em] text-slate-300/75">{metric.label}</dt>
                    <dd className="text-right text-sm font-semibold text-white">
                      <div className="flex items-center justify-end gap-2">
                        <span>{metric.value}</span>
                        {metric.tone ? (
                          <Badge
                            className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em]"
                            variant={badgeVariant(metric.tone)}
                          >
                            {metricLabel(metric.tone)}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 text-[11px] font-normal text-slate-300/80">{metric.hint}</div>
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default LiveVisualizationTab;
