import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SensorState = 'Stable' | 'Watch' | 'Anomaly';

type SensorStream = {
  id: string;
  name: string;
  location: string;
  intensity: number; // percentage 0-100
  state: SensorState;
  note: string;
};

const statusBadgeVariant = (state: SensorState) => {
  switch (state) {
    case 'Stable':
      return 'success' as const;
    case 'Watch':
      return 'warning' as const;
    case 'Anomaly':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
};

type SensoryLayerTabProps = {
  sensors: SensorStream[];
};

const SensoryLayerTab = ({ sensors }: SensoryLayerTabProps) => (
  <Card className="border-stone-200">
    <CardHeader className="pb-2">
      <CardTitle className="text-xl font-semibold text-stone-900">Sensory Array</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {sensors.map((stream) => (
        <div key={stream.id} className="rounded-xl border border-stone-200 bg-white/80 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-stone-800">{stream.name}</div>
              <div className="text-xs text-stone-500">{stream.location}</div>
            </div>
            <Badge variant={statusBadgeVariant(stream.state)}>{stream.state}</Badge>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-stone-900">{stream.intensity.toFixed(1)}%</div>
            <span className="text-xs text-stone-500">{stream.note}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-stone-200">
            <div
              className="h-2 rounded-full bg-amber-500"
              style={{ width: `${Math.round(stream.intensity)}%` }}
            />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default SensoryLayerTab;
