import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSero } from '@/contexts/SeroProvider';
import type { AuditRecord } from '@/lib/sero/sero-core';

import OutputCommandTab from '../components/OutputCommandTab';
import ProcessingCoreTab from '../components/ProcessingCoreTab';
import SensoryLayerTab from '../components/SensoryLayerTab';
import LiveRealtimeCharts from '../components/LiveRealtimeCharts';

type SensorState = 'Stable' | 'Watch' | 'Anomaly';

type SensorStream = {
  id: string;
  name: string;
  location: string;
  intensity: number; // percentage 0-100
  state: SensorState;
  note: string;
};

type ProcessingStatus = 'Nominal' | 'Balancing' | 'Calibrating';

type ProcessingLane = {
  id: string;
  name: string;
  load: number; // 0-1
  status: ProcessingStatus;
  note: string;
};

type TransmissionStatus = 'Queued' | 'Transmitting' | 'Complete';

type Transmission = {
  id: string;
  channel: string;
  target: string;
  status: TransmissionStatus;
};

type VaultStatus = Record<string, { present: boolean; masked: string }>;

type MetricSummary = {
  id: string;
  label: string;
  value: string;
  status: 'stable' | 'watch' | 'alert';
  hint: string;
};

const SENSOR_SEEDS: Array<{ id: string; name: string; location: string; intensity: number }> = [
  {
    id: 'earth-grid',
    name: 'Earth Grid Magnetometer',
    location: 'Cusco Array',
    intensity: 63.4,
  },
  {
    id: 'ionosphere',
    name: 'Ionosphere Choir',
    location: 'Inuvik Relay',
    intensity: 71.2,
  },
  {
    id: 'storm-lens',
    name: 'Storm Lens Doppler',
    location: 'Azores Node',
    intensity: 58.6,
  },
  {
    id: 'solar-halo',
    name: 'Solar Halo Spectrometer',
    location: 'Mauna Kea Apex',
    intensity: 79.1,
  },
];

const PROCESSING_SEEDS: Array<{ id: string; name: string; load: number }> = [
  { id: 'harmonics', name: 'Harmonic Coherence Synthesizer', load: 0.72 },
  { id: 'storm-mapper', name: 'Storm Trajectory Mapper', load: 0.81 },
  { id: 'ethics', name: 'Prime Ethics Correlator', load: 0.64 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sensorStateFor = (intensity: number): { state: SensorState; note: string } => {
  if (intensity >= 85) {
    return { state: 'Anomaly', note: 'Escalate for manual review' };
  }
  if (intensity >= 70) {
    return { state: 'Watch', note: 'Harmonic balancing underway' };
  }
  return { state: 'Stable', note: 'Field drift < 0.5%' };
};

const laneStatusFor = (load: number): { status: ProcessingStatus; note: string } => {
  if (load >= 0.88) {
    return { status: 'Calibrating', note: 'Phase correction engaged' };
  }
  if (load >= 0.78) {
    return { status: 'Balancing', note: 'Redistributing workload across clusters' };
  }
  return { status: 'Nominal', note: 'In sync with planetary cadence' };
};

const metricVariant = (status: 'stable' | 'watch' | 'alert') =>
  status === 'stable' ? 'success' : status === 'watch' ? 'warning' : 'destructive';

const metricLabel = (status: 'stable' | 'watch' | 'alert') =>
  status === 'stable' ? 'Stable' : status === 'watch' ? 'Watch' : 'Review';

const HomePage = () => {
  const { audit } = useSero();

  const [sensors, setSensors] = useState<SensorStream[]>(() =>
    SENSOR_SEEDS.map((seed) => {
      const { state, note } = sensorStateFor(seed.intensity);
      return { ...seed, intensity: Number(seed.intensity.toFixed(1)), state, note };
    })
  );
  const [processing, setProcessing] = useState<ProcessingLane[]>(() =>
    PROCESSING_SEEDS.map((seed) => {
      const { status, note } = laneStatusFor(seed.load);
      return { ...seed, load: Number(seed.load.toFixed(2)), status, note };
    })
  );
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    fetch('/api/keys-status')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<VaultStatus>;
      })
      .then((data) => {
        if (active) setVaultStatus(data);
      })
      .catch((error) => {
        if (active) setVaultError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSensors((prev) =>
        prev.map((stream) => {
          const nextIntensity = clamp(stream.intensity + (Math.random() - 0.5) * 1.6, 52, 94);
          const { state, note } = sensorStateFor(nextIntensity);
          return {
            ...stream,
            intensity: Number(nextIntensity.toFixed(1)),
            state,
            note,
          };
        })
      );

      setProcessing((prev) =>
        prev.map((lane) => {
          const nextLoad = clamp(lane.load + (Math.random() - 0.5) * 0.06, 0.58, 0.93);
          const { status, note } = laneStatusFor(nextLoad);
          return {
            ...lane,
            load: Number(nextLoad.toFixed(2)),
            status,
            note,
          };
        })
      );

      setTransmissions((prev) =>
        prev.map((tx) => {
          const transitions: TransmissionStatus[] = ['Queued', 'Transmitting', 'Complete'];
          const shouldAdvance = Math.random() > 0.72;
          if (!shouldAdvance) {
            return tx.status === 'Complete' && Math.random() > 0.92
              ? { ...tx, status: 'Queued' }
              : tx;
          }
          const currentIndex = transitions.indexOf(tx.status);
          const nextStatus = transitions[(currentIndex + 1) % transitions.length];
          return { ...tx, status: nextStatus };
        })
      );

      setTimestamp(new Date());
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  const metrics = useMemo<MetricSummary[]>(() => {
    if (!sensors.length || !processing.length) {
      return [];
    }
    const stableSensors = sensors.filter((stream) => stream.state === 'Stable').length;
    const sensorIntegrity = stableSensors / sensors.length;
    const averageIntensity = sensors.reduce((sum, stream) => sum + stream.intensity, 0) / sensors.length;
    const averageLoad = processing.reduce((sum, lane) => sum + lane.load, 0) / processing.length;
    const activeTransmissions = transmissions.filter((tx) => tx.status !== 'Complete').length;

    const nexusHealth = (sensorIntegrity * 0.4) + ((100 - averageIntensity) / 100 * 0.3) + ((1 - averageLoad) * 0.3);

    return [
      {
        id: 'nexus-health',
        label: 'Nexus Health',
        value: `${Math.round(nexusHealth * 100)}%`,
        status: nexusHealth > 0.9 ? 'stable' : nexusHealth > 0.75 ? 'watch' : 'alert',
        hint: 'Overall system stability and coherence'
      },
      {
        id: 'sensor-integrity',
        label: 'Sensor Integrity',
        value: `${Math.round(sensorIntegrity * 100)}%`,
        status: sensorIntegrity === 1 ? 'stable' : sensorIntegrity > 0.75 ? 'watch' : 'alert',
        hint:
          sensorIntegrity === 1
            ? 'All stations synchronized'
            : 'Attractors balancing minor variance',
      },
      {
        id: 'field-intensity',
        label: 'Average Field Intensity',
        value: `${averageIntensity.toFixed(1)}%`,
        status: averageIntensity > 86 ? 'alert' : averageIntensity > 74 ? 'watch' : 'stable',
        hint: 'Magnetometer and ionosphere composite',
      },
      {
        id: 'processing-load',
        label: 'Processing Load',
        value: `${Math.round(averageLoad * 100)}%`,
        status: averageLoad > 0.86 ? 'alert' : averageLoad > 0.76 ? 'watch' : 'stable',
        hint: 'Quantum synchronizers utilization',
      },
      {
        id: 'open-commands',
        label: 'Open Command Paths',
        value: `${activeTransmissions}`,
        status: activeTransmissions > 2 ? 'watch' : activeTransmissions > 0 ? 'stable' : 'stable',
        hint: 'Sessions awaiting completion',
      },
    ];
  }, [processing, sensors, transmissions]);

  const latestAudit = useMemo<AuditRecord[]>(
    () => audit.slice(-4).reverse(),
    [audit]
  );

  const networkStatus = sensors.every((stream) => stream.state === 'Stable')
    ? { label: 'Online', variant: 'success' as const }
    : { label: 'Balancing', variant: 'warning' as const };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Nexus Live Feed</h1>
          <p className="text-sm text-stone-500">
            Harmonized view of planetary sensors, processing lattices, and stewardship commands.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm text-stone-500 lg:items-end">
          <Badge variant={networkStatus.variant}>{networkStatus.label}</Badge>
          <span>
            Updated <span className="font-medium text-stone-700">{timestamp.toLocaleTimeString()}</span>
          </span>
        </div>
      </div>

      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-stone-900">Operational Pulse</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <div key={metric.id} className="rounded-xl border border-stone-200 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>{metric.label}</span>
                <Badge variant={metricVariant(metric.status)}>{metricLabel(metric.status)}</Badge>
              </div>
              <div className="mt-3 text-3xl font-semibold text-stone-900">{metric.value}</div>
              <p className="mt-2 text-xs text-stone-500">{metric.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <LiveRealtimeCharts />

      <Tabs defaultValue="sensory-layer">
        <TabsList>
          <TabsTrigger value="sensory-layer">Sensory Layer</TabsTrigger>
          <TabsTrigger value="processing-core">Processing Core</TabsTrigger>
          <TabsTrigger value="output-command">Output & Command</TabsTrigger>
        </TabsList>
        <TabsContent value="sensory-layer">
          <SensoryLayerTab sensors={sensors} />
        </TabsContent>
        <TabsContent value="processing-core">
          <ProcessingCoreTab processing={processing} />
        </TabsContent>
        <TabsContent value="output-command">
          <OutputCommandTab latestAudit={latestAudit} vaultStatus={vaultStatus} vaultError={vaultError} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePage;
