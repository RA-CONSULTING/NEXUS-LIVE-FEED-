import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export type VisualizationMetric = {
  label: string;
  value: string;
  hint: string;
  tone?: 'stable' | 'watch' | 'alert';
  progress?: number;
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

          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default LiveVisualizationTab;
