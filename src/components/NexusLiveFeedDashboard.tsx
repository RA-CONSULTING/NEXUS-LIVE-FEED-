import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSero } from '@/contexts/SeroProvider';
import type { AuditRecord } from '@/lib/sero/sero-core';

import KeyStatus from './KeyStatus';

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

const TRANSMISSION_SEEDS: Transmission[] = [
  {
    id: 'aurora-net',
    channel: 'Aurora Uplink',
    target: 'Polar Station 3',
    status: 'Transmitting',
  },
  {
    id: 'coherence-beacon',
    channel: 'Coherence Beacon',
    target: 'Himalaya Choir',
    status: 'Queued',
  },
  {
    id: 'steward-brief',
    channel: 'Steward Briefing',
    target: 'Continuum Council',
    status: 'Complete',
  },
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

const statusBadgeVariant = (state: SensorState | ProcessingStatus | TransmissionStatus) => {
  switch (state) {
    case 'Stable':
    case 'Nominal':
    case 'Complete':
      return 'success' as const;
    case 'Watch':
    case 'Balancing':
    case 'Queued':
      return 'warning' as const;
    case 'Calibrating':
    case 'Transmitting':
      return 'info' as const;
    case 'Anomaly':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
};

const formatRelativeTime = (iso?: string) => {
  if (!iso) return 'timestamp pending';
  const value = new Date(iso).getTime();
  if (!Number.isFinite(value)) return 'timestamp pending';
  const deltaMs = Date.now() - value;
  if (deltaMs < 30_000) return 'just now';
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const metricVariant = (status: 'stable' | 'watch' | 'alert') =>
  status === 'stable' ? 'success' : status === 'watch' ? 'warning' : 'destructive';

const metricLabel = (status: 'stable' | 'watch' | 'alert') =>
  status === 'stable' ? 'Stable' : status === 'watch' ? 'Watch' : 'Review';

const NexusLiveFeedDashboard = () => {
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
  const [transmissions, setTransmissions] = useState<Transmission[]>(TRANSMISSION_SEEDS);
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

    return [
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
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-6 lg:grid-cols-2">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-stone-900">Command Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestAudit.length === 0 ? (
              <p className="text-sm text-stone-500">
                No stewardship commands executed in this session. Use the Actuation console to initiate one.
              </p>
            ) : (
              latestAudit.map((entry) => (
                <div key={entry.audit_id} className="rounded-xl border border-stone-200 bg-white/80 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-stone-800">{entry.request.subsystem}</div>
                    <Badge variant={entry.decision === 'ALLOW' ? 'success' : 'warning'}>{entry.decision}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-stone-500">{entry.request.intent}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                    <span>{entry.request.operator?.name ?? 'Unknown operator'}</span>
                    <span>{formatRelativeTime(entry.request.ts)}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-stone-200">
                    <div
                      className="h-2 rounded-full bg-amber-500"
                      style={{ width: `${Math.round((entry.evaluation?.score ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-stone-900">Access & Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Environment Flags</div>
              <div className="mt-2 rounded-xl border border-stone-200 bg-white/70 p-3">
                <KeyStatus />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Key Vault</div>
              <div className="mt-2 space-y-2">
                {vaultError ? (
                  <p className="text-xs text-rose-500">{vaultError}</p>
                ) : !vaultStatus ? (
                  <p className="text-xs text-stone-500">Requesting key status…</p>
                ) : (
                  <ul className="space-y-2 text-sm text-stone-600">
                    {Object.entries(vaultStatus).map(([name, status]) => (
                      <li
                        key={name}
                        className="flex items-center justify-between rounded-lg border border-stone-200 bg-white/80 px-3 py-2"
                      >
                        <span className="font-medium text-stone-700">{name}</span>
                        <span className={`text-xs font-mono ${status.present ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {status.masked}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <p className="text-xs text-stone-500">
              Access logs rotate every 24 hours. Stewardship counsel can revoke any credential from the Sero console.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NexusLiveFeedDashboard;
