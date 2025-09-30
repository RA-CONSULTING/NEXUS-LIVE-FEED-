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

type LiveVisualizationTabProps = {
  modules: VisualizationModule[];
};

const LiveVisualizationTab = ({ modules }: LiveVisualizationTabProps) => (
  <Card className="border-stone-200">
    <CardHeader className="pb-2">
      <CardTitle className="text-xl font-semibold text-stone-900">Live Visualization Center</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-4 lg:grid-cols-3">
      {modules.map((module) => (
        <div key={module.id} className="flex flex-col rounded-xl border border-stone-200 bg-white/80 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-stone-800">{module.title}</div>
              <p className="mt-1 text-xs text-stone-500">{module.summary}</p>
            </div>
            {module.status ? <Badge variant="outline">{module.status}</Badge> : null}
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            {module.metrics.map((metric) => (
              <div key={metric.label} className="flex items-baseline justify-between gap-3">
                <dt className="text-xs uppercase tracking-wide text-stone-500">{metric.label}</dt>
                <dd className="text-right text-sm font-medium text-stone-900">
                  <div className="flex items-center justify-end gap-2">
                    <span>{metric.value}</span>
                    {metric.tone ? (
                      <Badge variant={badgeVariant(metric.tone)}>
                        {metric.tone === 'stable' ? 'Stable' : metric.tone === 'watch' ? 'Watch' : 'Alert'}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-[11px] font-normal text-stone-500">{metric.hint}</div>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default LiveVisualizationTab;
