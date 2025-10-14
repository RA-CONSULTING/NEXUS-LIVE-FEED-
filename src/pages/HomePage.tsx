import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSero } from '@/contexts/SeroProvider';
import { useLiveNexusData } from '@/contexts/LiveNexusDataContext';
import type { AuditRecord } from '@/lib/sero/sero-core';

import ChronicleGovernanceTab, { type ChronicleGovernance } from '../components/ChronicleGovernanceTab';
import BioProfilePanel from '../components/BioProfilePanel';
import LiveRealtimeCharts from '../components/LiveRealtimeCharts';
import LiveVisualizationTab, { type VisualizationModule } from '../components/LiveVisualizationTab';
import OutputCommandTab from '../components/OutputCommandTab';
import ProcessingCoreTab from '../components/ProcessingCoreTab';
import RecordingSystemsTab, { type RecordingChannel } from '../components/RecordingSystemsTab';
import SensoryLayerTab from '../components/SensoryLayerTab';
import VisualRelayTab from '../components/VisualRelayTab';

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

const STREAM_METADATA: Record<string, { location: string; capacity: number }> = {
  phenomena: { location: 'Witness Array · Cusco Grid', capacity: 180 },
  temporal: { location: 'Temporal Anchor Lab · Reykjavik', capacity: 140 },
  geometry: { location: 'Sacred Geometry Observatory · Chartres', capacity: 120 },
  celestial: { location: 'Orbital Relay · Lagrange L1', capacity: 36 },
  geomagnetic: { location: 'Geomagnetic Vault · Mauna Kea Apex', capacity: 80 },
};

const NOTE_BY_SENSOR_STATE: Record<SensorState, string> = {
  Stable: 'Field drift < 0.5%',
  Watch: 'Harmonic balancing underway',
  Anomaly: 'Escalate for manual review',
};


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

const laneStatusFor = (load: number): ProcessingStatus => {
  if (load >= 0.88) {
    return 'Calibrating';
  }
  if (load >= 0.78) {
    return 'Balancing';
  }
  return 'Nominal';
};

const metricLabel = (status: 'stable' | 'watch' | 'alert') =>
  status === 'stable' ? 'Stable' : status === 'watch' ? 'Watch' : 'Review';

const metricBadgeStyles: Record<MetricSummary['status'], string> = {
  stable: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.45)]',
  watch: 'border-amber-300/40 bg-amber-500/20 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.35)]',
  alert: 'border-rose-400/40 bg-rose-500/25 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.35)]',
};

const HomePage = () => {
  const { audit } = useSero();
  const { metrics: liveMetrics, sensory, processing: processingData, output, timestamp, bioProfile } = useLiveNexusData();

  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [vaultError, setVaultError] = useState<string | null>(null);

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

  const sensors = useMemo<SensorStream[]>(() => {
    const dataStreams = sensory?.dataStreams ?? [];
    return dataStreams.map((stream) => {
      const meta = STREAM_METADATA[stream.id] ?? { location: 'Unknown Node', capacity: 100 };
      const normalized = clamp((stream.rate / meta.capacity) * 100, 0, 100);
      const state: SensorState = stream.state === 'degraded' || normalized >= 90
        ? 'Anomaly'
        : stream.state === 'updating' || normalized >= 72
          ? 'Watch'
          : 'Stable';

      return {
        id: stream.id,
        name: stream.name,
        location: meta.location,
        intensity: Number(normalized.toFixed(1)),
        state,
        note: NOTE_BY_SENSOR_STATE[state],
      };
    });
  }, [sensory]);

  const processing = useMemo<ProcessingLane[]>(() => {
    if (!processingData) {
      return [];
    }

    const qssrLoad = clamp(0.65 + (1 - processingData.qssrModule.solarCoherenceIndex) * 0.5, 0, 1);
    const stormLoad = clamp(processingData.stormTargeting.harmonicIntegration / 100, 0, 1);
    const safeguardLoad = clamp(0.45 + processingData.aurisCognitiveSafeguard.dampeningFactor * 0.5, 0, 1);

    const lanes: ProcessingLane[] = [
      {
        id: 'harmonics',
        name: 'Harmonic Coherence Synthesizer',
        load: Number(qssrLoad.toFixed(2)),
        status: laneStatusFor(qssrLoad),
        note: `Coherence ${(processingData.qssrModule.solarCoherenceIndex * 100).toFixed(0)}% · Queue ${processingData.qssrModule.analysisQueue}`,
      },
      {
        id: 'storm-mapper',
        name: 'Storm Trajectory Mapper',
        load: Number(stormLoad.toFixed(2)),
        status: laneStatusFor(stormLoad),
        note: `Neutralization ${processingData.stormTargeting.neutralizationRate}% · Patterns ${processingData.stormTargeting.activePatterns}`,
      },
      {
        id: 'ethics',
        name: 'Prime Ethics Correlator',
        load: Number(safeguardLoad.toFixed(2)),
        status: laneStatusFor(safeguardLoad),
        note: `Safeguard ${processingData.aurisCognitiveSafeguard.status} · Hazards ${processingData.aurisCognitiveSafeguard.hazardDetections}`,
      },
    ];

    return lanes;
  }, [processingData]);

  const transmissions = useMemo<Transmission[]>(() => {
    const records = output?.transmissions ?? [];
    return records.map((tx) => ({
      id: tx.id,
      channel: tx.channel,
      target: tx.destination,
      status:
        tx.status === 'transmitting'
          ? 'Transmitting'
          : tx.status === 'complete'
            ? 'Complete'
            : 'Queued',
    }));
  }, [output]);

  const metrics = useMemo<MetricSummary[]>(() => {
    if (!sensors.length || !processing.length) {
      return [];
    }
    const stableSensors = sensors.filter((stream) => stream.state === 'Stable').length;
    const sensorIntegrity = stableSensors / sensors.length;
    const averageIntensity = sensors.reduce((sum, stream) => sum + stream.intensity, 0) / sensors.length;
    const averageLoad = processing.reduce((sum, lane) => sum + lane.load, 0) / processing.length;
    const activeTransmissions = transmissions.filter((tx) => tx.status !== 'Complete').length;

    const coherenceMetric = liveMetrics.find((metric) => metric.id === 'coherence');
    const resonanceMetric = liveMetrics.find((metric) => metric.id === 'resonance');
    const coherence = coherenceMetric ? coherenceMetric.value : 0;
    const resonance = resonanceMetric ? resonanceMetric.value : 0;
    const nexusHealth = (sensorIntegrity * 0.3) + (coherence * 0.4) + (resonance * 0.3);

    return [
      {
        id: 'nexus-health',
        label: 'Nexus Health',
        value: `${Math.round(nexusHealth * 100)}%`,
        status: nexusHealth > 0.88 ? 'stable' : nexusHealth > 0.72 ? 'watch' : 'alert',
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
  }, [processing, sensors, transmissions, liveMetrics]);

  const visualizationModules = useMemo<VisualizationModule[]>(() => {
    const formatRatio = (value: number) => `${(value * 100).toFixed(1)}%`;
    const ratioTone = (value: number): VisualizationMetric['tone'] =>
      value >= 0.86 ? 'stable' : value >= 0.72 ? 'watch' : 'alert';
    const percentTone = (value: number): VisualizationMetric['tone'] =>
      value >= 85 ? 'stable' : value >= 65 ? 'watch' : 'alert';
    const queueTone = (queued: number): VisualizationMetric['tone'] =>
      queued <= 4 ? 'stable' : queued <= 6 ? 'watch' : 'alert';
    const solarTone = (alignment?: string): VisualizationMetric['tone'] => {
      if (!alignment) return 'watch';
      const normalized = alignment.toLowerCase();
      if (normalized.includes('optimal') || normalized.includes('locked')) return 'stable';
      if (normalized.includes('adjust') || normalized.includes('balancing')) return 'watch';
      return 'alert';
    };
    const solarProgress = (alignment?: string) => {
      const tone = solarTone(alignment);
      if (tone === 'stable') return 1;
      if (tone === 'watch') return 0.6;
      return 0.3;
    };

    const coherenceMetric = liveMetrics.find((metric) => metric.id === 'coherence');
    const resonanceMetric = liveMetrics.find((metric) => metric.id === 'resonance');
    const chronicleMetric = liveMetrics.find((metric) => metric.id === 'chronicle');
    const aureonMetric = liveMetrics.find((metric) => metric.id === 'aureon');

    const coherenceRatio = clamp(coherenceMetric?.value ?? 0, 0, 1);
    const resonanceRatio = clamp(resonanceMetric?.value ?? 0, 0, 1);
    const chronicleValue = chronicleMetric?.value ?? sensory?.chronicleRecorder.eventsPerMinute ?? 0;
    const chronicleTarget = chronicleMetric?.target ?? 180;
    const chronicleProgress = chronicleTarget ? clamp(chronicleValue / chronicleTarget, 0, 1) : undefined;
    const aureonPercent = clamp(aureonMetric?.value ?? 0, 0, 100);

    const streams = sensory?.dataStreams ?? [];
    const totalStreams = streams.length;
    const stableStreams = streams.filter((stream) => stream.state === 'stable').length;
    const watchStreams = streams.filter((stream) => stream.state !== 'stable').length;
    const streamIntegrity = totalStreams ? stableStreams / totalStreams : 0;

    const chronicleRecorder = sensory?.chronicleRecorder;
    const celestial = sensory?.celestialCartography;

    const voice = output?.voicePipelines;
    const queue = output?.commandQueue;
    const compliance = output?.compliance;
    const transmissions = output?.transmissions ?? [];
    const totalTransmissions = transmissions.length;
    const completedTransmissions = transmissions.filter((tx) => tx.status === 'complete').length;
    const activeTransmissions = transmissions.filter((tx) => tx.status !== 'complete').length;
    const transmittingCount = transmissions.filter((tx) => tx.status === 'transmitting').length;

    const latencyTone = (latency?: number): VisualizationMetric['tone'] => {
      if (latency === undefined) return undefined;
      if (latency <= 180) return 'stable';
      if (latency <= 210) return 'watch';
      return 'alert';
    };

    const complianceTone = (level?: string): VisualizationMetric['tone'] => {
      if (!level) return 'watch';
      const normalized = level.toLowerCase();
      if (normalized === 'none' || normalized === 'low') return normalized === 'none' ? 'stable' : 'watch';
      if (normalized.includes('advisory')) return 'watch';
      return 'alert';
    };

    const latencyProgress = voice ? clamp(1 - (voice.latencyMs - 120) / 120, 0, 1) : undefined;
    const queueProgress = queue
      ? clamp(queue.executing / Math.max(queue.executing + queue.queued, 1), 0, 1)
      : undefined;
    const complianceProgress = compliance ? clamp(compliance.auditsPassed / 24, 0, 1) : undefined;
    const transmissionProgress = totalTransmissions
      ? clamp(completedTransmissions / totalTransmissions, 0, 1)
      : undefined;

    const lastSync = new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    return [
      {
        id: 'bio-resonance-core',
        title: 'Bio-Resonance Core',
        summary:
          processingData
            ? `${processingData.qssrModule.cosmicWeather} skies · Queue ${processingData.qssrModule.analysisQueue}`
            : 'Awaiting QSSR synchronizer handshake.',
        status: processingData?.qssrModule.planetaryResonance
          ? `${processingData.qssrModule.planetaryResonance} · ${lastSync}`
          : `Synced ${lastSync}`,
        metrics: [
          {
            label: 'System Coherence',
            value: formatRatio(coherenceRatio),
            hint: `Cosmic weather ${processingData?.qssrModule.cosmicWeather ?? 'calibrating'}.`,
            tone: ratioTone(coherenceRatio),
            progress: coherenceRatio,
          },
          {
            label: 'Resonance Harmony',
            value: formatRatio(resonanceRatio),
            hint: `Sentinel lattice ${processingData?.stormTargeting.status ?? 'tuning phase'}.`,
            tone: ratioTone(resonanceRatio),
            progress: resonanceRatio,
          },
          {
            label: 'Chronicle Throughput',
            value: `${Math.round(chronicleValue)} evt/min`,
            hint: `Target ${chronicleTarget} · Storage ${chronicleRecorder?.storageUsedTb ?? 0} TB`,
            tone: percentTone(Math.min(chronicleProgress ?? 0, 1) * 100),
            progress: chronicleProgress,
          },
          {
            label: 'Aureon Activity',
            value: `${Math.round(aureonPercent)}%`,
            hint: `Cognitive safeguard ${processingData?.aurisCognitiveSafeguard.status ?? 'idle'}.`,
            tone: percentTone(aureonPercent),
            progress: aureonPercent / 100,
          },
        ],
      },
      {
        id: 'sensory-stream-lattice',
        title: 'Sensory Stream Lattice',
        summary:
          totalStreams > 0
            ? `${stableStreams} stable · ${watchStreams} balancing across ${totalStreams} channels.`
            : 'Awaiting sensory array link.',
        status: celestial?.harmonicSignatures,
        metrics: [
          {
            label: 'Active Streams',
            value: totalStreams ? `${stableStreams}/${totalStreams} stable` : 'No channels',
            hint: `Integrity ${(streamIntegrity * 100).toFixed(0)}% across the mesh.`,
            tone: ratioTone(streamIntegrity),
            progress: totalStreams ? streamIntegrity : undefined,
          },
          {
            label: 'Streams on Watch',
            value: `${watchStreams}`,
            hint:
              watchStreams === 0
                ? 'All channels within harmonic band.'
                : 'Balancing flux across regional nodes.',
            tone: watchStreams === 0 ? 'stable' : watchStreams <= 2 ? 'watch' : 'alert',
            progress: totalStreams ? clamp(watchStreams / totalStreams, 0, 1) : undefined,
          },
          {
            label: 'Chronicle Recorder',
            value: chronicleRecorder
              ? `${chronicleRecorder.status} @ ${chronicleRecorder.eventsPerMinute} evt/min`
              : 'Offline',
            hint: chronicleRecorder
              ? `Retention ${chronicleRecorder.retentionHours}h · Integrity ${chronicleRecorder.integrityChecks}`
              : 'No recorder handshake detected.',
            tone: chronicleRecorder?.status === 'Recording' ? 'stable' : 'watch',
            progress: chronicleRecorder ? clamp(chronicleRecorder.retentionHours / 72, 0, 1) : undefined,
          },
          {
            label: 'Celestial Alignment',
            value: celestial
              ? `${celestial.solarAlignment} · ${celestial.lunarPhase}`
              : 'Alignment unknown',
            hint: celestial
              ? `Tracking ${celestial.trackingSatellites} satellites.`
              : 'Orbital telemetry pending.',
            tone: solarTone(celestial?.solarAlignment),
            progress: solarProgress(celestial?.solarAlignment),
          },
        ],
      },
      {
        id: 'operator-command-bridge',
        title: 'Operator Command Bridge',
        summary:
          output
            ? `${activeTransmissions} uplinks live · Compliance ${compliance?.status ?? 'Unknown'}.`
            : 'Command bridge establishing secure link.',
        status: voice ? `Voices ${voice.activeVoices}` : undefined,
        metrics: [
          {
            label: 'Voice Pipeline Latency',
            value: voice ? `${voice.latencyMs} ms` : '—',
            hint: voice
              ? `${voice.activeVoices} active voices · ${voice.successfulTransmits} transmits`
              : 'No active voice circuits.',
            tone: latencyTone(voice?.latencyMs),
            progress: latencyProgress,
          },
          {
            label: 'Command Queue',
            value: queue
              ? `${queue.executing} executing · ${queue.queued} queued`
              : 'Queue offline',
            hint: queue ? `Last command: ${queue.lastCommand}` : 'Awaiting queue handshake.',
            tone: queue ? queueTone(queue.queued) : undefined,
            progress: queueProgress,
          },
          {
            label: 'Compliance Shield',
            value: compliance ? compliance.status : 'Unknown',
            hint: compliance
              ? `Audits ${compliance.auditsPassed} · Escalation ${compliance.escalationLevel}`
              : 'Compliance node offline.',
            tone: complianceTone(compliance?.escalationLevel),
            progress: complianceProgress,
          },
          {
            label: 'Transmission Flow',
            value: totalTransmissions
              ? `${completedTransmissions}/${totalTransmissions} complete`
              : 'No transmissions',
            hint: totalTransmissions
              ? `${activeTransmissions} uplinks active · ${transmittingCount} transmitting`
              : 'Awaiting uplink requests.',
            tone:
              activeTransmissions <= 1
                ? 'stable'
                : activeTransmissions <= 2
                  ? 'watch'
                  : 'alert',
            progress: transmissionProgress,
          },
        ],
      },
    ];
  }, [
    liveMetrics,
    sensory,
    output,
    processingData,
    timestamp,
  ]);

  const latestAudit = useMemo<AuditRecord[]>(
    () => audit.slice(-4).reverse(),
    [audit]
  );

  const networkStatus = sensors.every((stream) => stream.state === 'Stable')
    ? { label: 'Online', variant: 'success' as const }
    : sensors.some((stream) => stream.state === 'Anomaly')
      ? { label: 'Investigate', variant: 'warning' as const }
      : { label: 'Balancing', variant: 'warning' as const };

  const statusBadgeClass =
    networkStatus.label === 'Online'
      ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100 shadow-[0_0_35px_rgba(16,185,129,0.45)]'
      : networkStatus.label === 'Investigate'
        ? 'border-rose-400/50 bg-rose-500/20 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.35)]'
        : 'border-amber-300/50 bg-amber-500/20 text-amber-100 shadow-[0_0_35px_rgba(251,191,36,0.4)]';

  const updatedAt = useMemo(() => new Date(timestamp), [timestamp]);

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/60 p-6 shadow-cosmic text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-cosmic-mesh opacity-80" />
      <div className="pointer-events-none absolute -top-32 left-8 h-80 w-80 rounded-full bg-sky-500/40 blur-3xl animate-cosmic-drift" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-fuchsia-500/35 blur-[140px] animate-orbital-glow" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
      <div className="relative z-10 space-y-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="bg-gradient-to-r from-sky-200 via-fuchsia-200 to-amber-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
              Nexus Live Feed
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-300/90 sm:text-base">
              Witness the Harmonia Nexus breathing in real time—sensor choirs, quantum analysts, and command pillars weaving a living tapestry of celestial insight.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-xs text-slate-300/80 lg:items-end">
            <Badge
              variant="outline"
              className={`inline-flex items-center rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] ${statusBadgeClass}`}
            >
              {networkStatus.label}
            </Badge>
            <span className="text-sm text-slate-300/90">
              Updated <span className="font-semibold text-white">{updatedAt.toLocaleTimeString()}</span>
            </span>
          </div>
        </div>

        <BioProfilePanel profile={bioProfile} />

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-nebula backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-fuchsia-500/20 opacity-70" />
          <div className="pointer-events-none absolute -inset-20 animate-stellar-pulse bg-[radial-gradient(circle,_rgba(255,255,255,0.18),_transparent_60%)]" />
          <Tabs defaultValue="system-overview" className="relative z-10 space-y-8">
            <TabsList className="relative flex w-full flex-wrap gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur">
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500/0 via-sky-500/60 to-sky-500/0" />
              <TabsTrigger
                value="system-overview"
                className="group relative flex-1 min-w-[160px] overflow-hidden rounded-xl border border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 transition duration-300 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500/40 data-[state=active]:via-blue-500/30 data-[state=active]:to-cyan-400/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_35px_rgba(56,189,248,0.45)]"
              >
                System Overview
              </TabsTrigger>
              <TabsTrigger
                value="sensory-layer"
                className="group relative flex-1 min-w-[160px] overflow-hidden rounded-xl border border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 transition duration-300 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/40 data-[state=active]:via-teal-500/30 data-[state=active]:to-sky-400/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_35px_rgba(16,185,129,0.45)]"
              >
                Sensory &amp; Ingestion
              </TabsTrigger>
              <TabsTrigger
                value="processing-core"
                className="group relative flex-1 min-w-[160px] overflow-hidden rounded-xl border border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 transition duration-300 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/40 data-[state=active]:via-indigo-500/30 data-[state=active]:to-sky-400/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_35px_rgba(139,92,246,0.45)]"
              >
                Processing &amp; Analysis
              </TabsTrigger>
              <TabsTrigger
                value="live-visualization"
                className="group relative flex-1 min-w-[160px] overflow-hidden rounded-xl border border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 transition duration-300 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500/40 data-[state=active]:via-pink-500/30 data-[state=active]:to-amber-400/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_35px_rgba(236,72,153,0.45)]"
              >
                Live Visualization
              </TabsTrigger>
              <TabsTrigger
                value="visual-relay"
                className="group relative flex-1 min-w-[160px] overflow-hidden rounded-xl border border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 transition duration-300 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/40 data-[state=active]:via-indigo-500/30 data-[state=active]:to-rose-400/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_35px_rgba(14,165,233,0.45)]"
              >
                Visual Relay
              </TabsTrigger>
              <TabsTrigger
                value="recording-systems"
                className="group relative flex-1 min-w-[160px] overflow-hidden rounded-xl border border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 transition duration-300 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/40 data-[state=active]:via-orange-500/30 data-[state=active]:to-rose-400/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_35px_rgba(245,158,11,0.45)]"
              >
                Recording Systems
              </TabsTrigger>
              <TabsTrigger
                value="chronicle-governance"
                className="group relative flex-1 min-w-[160px] overflow-hidden rounded-xl border border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 transition duration-300 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500/40 data-[state=active]:via-purple-500/30 data-[state=active]:to-rose-400/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_35px_rgba(59,130,246,0.45)]"
              >
                Chronicle &amp; Governance
              </TabsTrigger>
              <TabsTrigger
                value="output-command"
                className="group relative flex-1 min-w-[160px] overflow-hidden rounded-xl border border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 transition duration-300 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/40 data-[state=active]:via-blue-500/30 data-[state=active]:to-indigo-500/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_35px_rgba(37,99,235,0.45)]"
              >
                Command &amp; Output
              </TabsTrigger>
            </TabsList>
            <TabsContent value="system-overview" className="space-y-6">
              <Card className="group relative overflow-hidden border-white/10 bg-slate-900/60 text-slate-100 shadow-[0_0_50px_rgba(59,130,246,0.25)]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-indigo-500/20 opacity-60 transition duration-700 group-hover:opacity-80" />
                <div className="pointer-events-none absolute -inset-24 animate-stellar-pulse bg-[radial-gradient(circle,_rgba(148,163,184,0.35),_transparent_55%)] opacity-0 group-hover:opacity-80" />
                <CardHeader className="relative z-10 pb-3">
                  <CardTitle className="text-xl font-semibold text-white">Operational Pulse</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {metrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/40 via-transparent to-fuchsia-500/40 p-[1px] shadow-[0_0_40px_rgba(129,140,248,0.35)]"
                    >
                      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.2),_transparent_65%)] opacity-0 transition duration-500 group-hover:opacity-80" />
                      <div className="relative h-full rounded-[1.5rem] bg-slate-950/75 p-4 backdrop-blur">
                        <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%)] opacity-0 transition duration-500 group-hover:opacity-80" />
                        <div className="relative z-10 flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-slate-300/90">
                          <span className="text-[11px] font-semibold">{metric.label}</span>
                          <Badge
                            variant="outline"
                            className={`rounded-full px-3 py-1 ${metricBadgeStyles[metric.status]}`}
                          >
                            {metricLabel(metric.status)}
                          </Badge>
                        </div>
                        <div className="relative z-10 mt-4 text-3xl font-semibold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.35)]">
                          {metric.value}
                        </div>
                        <p className="relative z-10 mt-2 text-xs leading-relaxed text-slate-300/80">{metric.hint}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <LiveRealtimeCharts />
            </TabsContent>
            <TabsContent
              value="sensory-layer"
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] backdrop-blur"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-transparent to-sky-500/15 opacity-70" />
              <div className="relative z-10">
                <SensoryLayerTab sensors={sensors} />
              </div>
            </TabsContent>
            <TabsContent
              value="processing-core"
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_0_50px_rgba(139,92,246,0.22)] backdrop-blur"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/15 via-transparent to-sky-500/15 opacity-70" />
              <div className="relative z-10">
                <ProcessingCoreTab processing={processing} />
              </div>
            </TabsContent>
            <TabsContent
              value="live-visualization"
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_0_50px_rgba(236,72,153,0.22)] backdrop-blur"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 via-transparent to-amber-400/15 opacity-70" />
              <div className="relative z-10">
                <LiveVisualizationTab modules={visualizationModules} />
              </div>
            </TabsContent>
            <TabsContent
              value="visual-relay"
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_0_50px_rgba(56,189,248,0.25)] backdrop-blur"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-rose-500/15 opacity-70" />
              <div className="relative z-10">
                <VisualRelayTab />
              </div>
            </TabsContent>
            <TabsContent
              value="recording-systems"
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] backdrop-blur"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-rose-500/15 opacity-70" />
              <div className="relative z-10">
                <RecordingSystemsTab channels={RECORDING_CHANNELS} />
              </div>
            </TabsContent>
            <TabsContent
              value="chronicle-governance"
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_0_50px_rgba(59,130,246,0.22)] backdrop-blur"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-rose-500/15 opacity-70" />
              <div className="relative z-10">
                <ChronicleGovernanceTab governance={CHRONICLE_GOVERNANCE} />
              </div>
            </TabsContent>
            <TabsContent
              value="output-command"
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_0_50px_rgba(37,99,235,0.25)] backdrop-blur"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-indigo-500/20 opacity-70" />
              <div className="relative z-10">
                <OutputCommandTab latestAudit={latestAudit} vaultStatus={vaultStatus} vaultError={vaultError} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
