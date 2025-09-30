import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSero } from '@/contexts/SeroProvider';
import type { AuditRecord } from '@/lib/sero/sero-core';

import ChronicleGovernanceTab, { type ChronicleGovernance } from '../components/ChronicleGovernanceTab';
import LiveRealtimeCharts from '../components/LiveRealtimeCharts';
import LiveVisualizationTab, { type VisualizationModule } from '../components/LiveVisualizationTab';
import OutputCommandTab from '../components/OutputCommandTab';
import ProcessingCoreTab from '../components/ProcessingCoreTab';
import RecordingSystemsTab, { type RecordingChannel } from '../components/RecordingSystemsTab';
import SensoryLayerTab from '../components/SensoryLayerTab';

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

const LIVE_VISUALIZATION_MODULES: VisualizationModule[] = [
  {
    id: 'spectrogram',
    title: 'Quantum Spectrogram',
    summary: 'Frequency waterfall spanning ELF through Ka-band harmonics.',
    status: 'Real-time',
    metrics: [
      { label: 'Frequency Range', value: '0.1 Hz – 40 GHz', hint: 'Coverage from Schumann resonance to millimeter wave.' },
      { label: 'Resolution', value: 'High', hint: 'Adaptive 4096-bin FFT granularity.' },
      { label: 'Update Rate', value: '< 50 ms', hint: 'Streaming refresh cadence.', tone: 'stable' },
      { label: 'Visual Theme', value: 'Sacred Geometry', hint: 'Golden ratio overlays and Fibonacci gradients.' },
    ],
  },
  {
    id: 'magnetogram',
    title: 'Planetary Magnetogram',
    summary: 'Vector field strength and anomaly detection lattice.',
    status: 'Coherence 0.94',
    metrics: [
      { label: 'Field Strength', value: '±100 μT', hint: 'Fluxgate triaxial capture band.' },
      { label: 'Sampling', value: '100 Hz', hint: 'Resynchronized with PPS clock.', tone: 'stable' },
      { label: 'Anomaly Watch', value: 'Active', hint: 'Auto-escalation when >2σ drift.', tone: 'watch' },
      { label: 'Calibration', value: 'Self-healing', hint: 'Auto zeroing and drift compensation.' },
    ],
  },
  {
    id: 'network-map',
    title: 'Global Node Map',
    summary: 'Synced nexus nodes with orbital relays and ground stations.',
    status: '18 Nodes',
    metrics: [
      { label: 'Active Connections', value: '17', hint: 'Live command paths currently online.' },
      { label: 'Latency', value: '< 50 ms', hint: 'Median round-trip via Aureon mesh.', tone: 'stable' },
      { label: 'Synchronization', value: 'Locked', hint: 'All clusters phase aligned.', tone: 'stable' },
      { label: 'Overlays', value: 'Sacred Geometry', hint: 'Fibonacci lattice overlays on map.', },
    ],
  },
];

const RECORDING_CHANNELS: RecordingChannel[] = [
  {
    id: 'audio',
    title: 'Audio Capture',
    status: 'Operational',
    summary: 'Ceremonial dual-mic array with infrasound capture.',
    metrics: [
      { label: 'Sample Rate', value: '96 kHz', hint: 'High fidelity archival recording.' },
      { label: 'Bit Depth', value: '24-bit', hint: 'Preserves subtle harmonic textures.' },
      { label: 'Channels', value: 'Stereo + Infrasound', hint: 'Includes subterranean resonance feed.' },
      { label: 'Format', value: 'BWF / FLAC', hint: 'Broadcast Wave with lossless mirror.' },
    ],
  },
  {
    id: 'rf-spectrum',
    title: 'RF Spectrum',
    status: 'Operational',
    summary: 'Wideband IQ streaming of atmospheric and cosmic carriers.',
    metrics: [
      { label: 'Frequency Range', value: '0.1 MHz – 6 GHz', hint: 'LF through microwave signature capture.' },
      { label: 'Bandwidth', value: '20 MHz', hint: 'Realtime demodulation window.' },
      { label: 'Mode', value: 'IQ Streaming', hint: 'Complex samples for coherent decoding.' },
      { label: 'Antenna', value: 'Discone + VLF Loop', hint: 'Dual array for sky and ground wave.' },
    ],
  },
  {
    id: 'magnetic',
    title: 'Magnetic Field',
    status: 'Operational',
    summary: 'Fluxgate triaxial lattice for geomagnetic resonance.',
    metrics: [
      { label: 'Sensor', value: 'Fluxgate Triaxial', hint: 'Vector capture with pT sensitivity.' },
      { label: 'Resolution', value: '0.1 nT', hint: 'Micro-variation perception threshold.' },
      { label: 'Sampling', value: '1 kHz', hint: 'Temporal quantum security pipeline.' },
      { label: 'Calibration', value: 'Auto', hint: 'Self-tuning every 12 minutes.' },
    ],
  },
  {
    id: 'environmental',
    title: 'Environmental',
    status: 'Operational',
    summary: 'Ambient field monitors for climate and radiation context.',
    metrics: [
      { label: 'Temperature', value: '±0.1°C', hint: 'Lab-grade thermal sensors.' },
      { label: 'Humidity', value: '±2% RH', hint: 'Compensated for dew point drift.' },
      { label: 'Pressure', value: '±0.1 hPa', hint: 'Barometric stabilization feed.' },
      { label: 'Radiation', value: 'Geiger Counter', hint: 'Ionizing particle watch channel.' },
    ],
  },
];

const CHRONICLE_GOVERNANCE: ChronicleGovernance = {
  sections: [
    {
      id: 'source-law',
      title: 'Source Law 10-9-1',
      badge: 'Integrity 100%',
      description: 'Directive enforcement lattice for sacred data handling.',
      metrics: [
        { label: 'Check Directives', value: '847' },
        { label: 'Redact Rules', value: '23' },
        { label: 'Transactions', value: 'All Atomic' },
        { label: 'Integrity Score', value: '100%' },
      ],
    },
    {
      id: 'data-governance',
      title: 'Data Governance',
      badge: 'AES-256',
      description: 'Encryption, signature, and checksum assurance.',
      metrics: [
        { label: 'Encryption', value: 'AES-256' },
        { label: 'Signatures', value: 'Ed25519' },
        { label: 'Checksums', value: 'SHA-256' },
        { label: 'Backups', value: '3× Redundant' },
      ],
    },
    {
      id: 'chronicle-vault',
      title: 'Chronicle Vault',
      badge: 'Retrieval < 2s',
      description: 'Compression, archival, and retrieval command vault.',
      metrics: [
        { label: 'Vault Size', value: '15.7 TB' },
        { label: 'Compression', value: '4.2 : 1' },
        { label: 'Archival Rate', value: '99.9%' },
        { label: 'Access Time', value: '< 2 s' },
      ],
    },
  ],
  highlights: [
    'Auto-validation sweep confirms zero unresolved anomalies this cycle.',
    'Triplicate backups distributed across temple, field, and orbital vaults.',
    'Temporal checksum beacons synced with Schumann resonance for continuity.',
  ],
};

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

      <Tabs defaultValue="system-overview" className="space-y-6">
        <TabsList className="flex w-full flex-wrap gap-2 bg-stone-100 p-1">
          <TabsTrigger value="system-overview">System Overview</TabsTrigger>
          <TabsTrigger value="sensory-layer">Sensory &amp; Ingestion</TabsTrigger>
          <TabsTrigger value="processing-core">Processing &amp; Analysis</TabsTrigger>
          <TabsTrigger value="live-visualization">Live Visualization</TabsTrigger>
          <TabsTrigger value="recording-systems">Recording Systems</TabsTrigger>
          <TabsTrigger value="chronicle-governance">Chronicle &amp; Governance</TabsTrigger>
          <TabsTrigger value="output-command">Command &amp; Output</TabsTrigger>
        </TabsList>
        <TabsContent value="system-overview" className="space-y-6">
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
        </TabsContent>
        <TabsContent value="sensory-layer">
          <SensoryLayerTab sensors={sensors} />
        </TabsContent>
        <TabsContent value="processing-core">
          <ProcessingCoreTab processing={processing} />
        </TabsContent>
        <TabsContent value="live-visualization">
          <LiveVisualizationTab modules={LIVE_VISUALIZATION_MODULES} />
        </TabsContent>
        <TabsContent value="recording-systems">
          <RecordingSystemsTab channels={RECORDING_CHANNELS} />
        </TabsContent>
        <TabsContent value="chronicle-governance">
          <ChronicleGovernanceTab governance={CHRONICLE_GOVERNANCE} />
        </TabsContent>
        <TabsContent value="output-command">
          <OutputCommandTab latestAudit={latestAudit} vaultStatus={vaultStatus} vaultError={vaultError} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePage;
