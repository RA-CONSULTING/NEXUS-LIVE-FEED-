import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type RecordingMetric = {
  label: string;
  value: string;
  hint: string;
};

export type RecordingChannel = {
  id: string;
  title: string;
  status: 'Operational' | 'Standby' | 'Maintenance';
  summary: string;
  metrics: RecordingMetric[];
};

const statusVariant = (status: RecordingChannel['status']) => {
  switch (status) {
    case 'Operational':
      return 'success' as const;
    case 'Standby':
      return 'warning' as const;
    case 'Maintenance':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
};

type RecordingSystemsTabProps = {
  channels: RecordingChannel[];
};

const RecordingSystemsTab = ({ channels }: RecordingSystemsTabProps) => (
  <Card className="border-stone-200">
    <CardHeader className="pb-2">
      <CardTitle className="text-xl font-semibold text-stone-900">Recording Systems Control</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-2">
      {channels.map((channel) => (
        <div key={channel.id} className="rounded-xl border border-stone-200 bg-white/80 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-stone-800">{channel.title}</div>
              <p className="mt-1 text-xs text-stone-500">{channel.summary}</p>
            </div>
            <Badge variant={statusVariant(channel.status)}>{channel.status}</Badge>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            {channel.metrics.map((metric) => (
              <div key={metric.label} className="flex items-baseline justify-between gap-3">
                <dt className="text-xs uppercase tracking-wide text-stone-500">{metric.label}</dt>
                <dd className="text-right text-sm font-medium text-stone-900">
                  {metric.value}
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

export default RecordingSystemsTab;
