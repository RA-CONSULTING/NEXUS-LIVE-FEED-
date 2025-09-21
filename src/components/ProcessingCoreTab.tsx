import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ProcessingStatus = 'Nominal' | 'Balancing' | 'Calibrating';

type ProcessingLane = {
  id: string;
  name: string;
  load: number; // 0-1
  status: ProcessingStatus;
  note: string;
};

const statusBadgeVariant = (status: ProcessingStatus) => {
  switch (status) {
    case 'Nominal':
      return 'success' as const;
    case 'Balancing':
      return 'warning' as const;
    case 'Calibrating':
      return 'info' as const;
    default:
      return 'secondary' as const;
  }
};

type ProcessingCoreTabProps = {
  processing: ProcessingLane[];
};

const ProcessingCoreTab = ({ processing }: ProcessingCoreTabProps) => (
  <Card className="border-stone-200">
    <CardHeader className="pb-2">
      <CardTitle className="text-xl font-semibold text-stone-900">Processing Lattice</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {processing.map((lane) => (
        <div key={lane.id} className="rounded-xl border border-stone-200 bg-white/80 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-stone-800">{lane.name}</div>
            <Badge variant={statusBadgeVariant(lane.status)}>{lane.status}</Badge>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-stone-900">{Math.round(lane.load * 100)}%</div>
            <span className="text-xs text-stone-500">{lane.note}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-stone-200">
            <div
              className="h-2 rounded-full bg-sky-500"
              style={{ width: `${Math.round(lane.load * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default ProcessingCoreTab;
