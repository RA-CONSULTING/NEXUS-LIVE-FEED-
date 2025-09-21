import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLiveNexusData } from "@/contexts/LiveNexusDataContext";

const streamStateMap = {
  stable: "success",
  degraded: "warning",
  updating: "info",
} as const;

const formatState = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const SensoryLayerTab = () => {
  const { sensory } = useLiveNexusData();

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="border-stone-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg font-semibold text-stone-800">
            Chronicle Recorder
          </CardTitle>
          <p className="text-sm text-stone-500">
            Quantum timestamp capture and sacred geometry logging cadence
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">Status</span>
            <Badge variant="success">{sensory.chronicleRecorder.status}</Badge>
          </div>
          <dl className="space-y-3 text-sm text-stone-600">
            <div className="flex items-center justify-between">
              <dt>Events per minute</dt>
              <dd className="font-medium text-stone-900">
                {sensory.chronicleRecorder.eventsPerMinute}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Storage utilization</dt>
              <dd className="font-medium text-stone-900">
                {sensory.chronicleRecorder.storageUsedTb.toFixed(2)} TB
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Integrity checks</dt>
              <dd className="font-medium text-stone-900">
                {sensory.chronicleRecorder.integrityChecks}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Retention window</dt>
              <dd className="font-medium text-stone-900">
                {sensory.chronicleRecorder.retentionHours} hours
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg font-semibold text-stone-800">
            Celestial Cartography
          </CardTitle>
          <p className="text-sm text-stone-500">
            Orbital harmonics and resonance tracking for planetary alignment
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-3 text-sm text-stone-600">
            <div className="flex items-center justify-between">
              <dt>Tracking satellites</dt>
              <dd className="font-medium text-stone-900">
                {sensory.celestialCartography.trackingSatellites}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Harmonic signatures</dt>
              <dd className="font-medium text-stone-900">
                {sensory.celestialCartography.harmonicSignatures}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Solar alignment</dt>
              <dd className="font-medium text-stone-900">
                {sensory.celestialCartography.solarAlignment}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Lunar phase</dt>
              <dd className="font-medium text-stone-900">
                {sensory.celestialCartography.lunarPhase}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="border-stone-200 xl:col-span-1">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg font-semibold text-stone-800">
            Active Data Streams
          </CardTitle>
          <p className="text-sm text-stone-500">
            Real-time ingestion channels feeding the Nexus sensory layer
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {sensory.dataStreams.map((stream) => (
              <div
                key={stream.id}
                className="rounded-lg border border-stone-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">
                    {stream.name}
                  </span>
                  <Badge variant={streamStateMap[stream.state]}>
                    {formatState(stream.state)}
                  </Badge>
                </div>
                <div className="mt-3 text-2xl font-semibold text-stone-900">
                  {stream.rate}
                  <span className="ml-1 text-xs font-medium text-stone-500">
                    {stream.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SensoryLayerTab;
