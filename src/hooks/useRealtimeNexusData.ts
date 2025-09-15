import { useEffect, useMemo, useState } from "react";

export type MetricFormat = "ratio" | "percent" | "count";

export interface RealtimeMetric {
  id: string;
  label: string;
  value: number;
  unit?: string;
  change: number;
  format: MetricFormat;
  target?: number;
}

export interface RealtimeChartPoint {
  timestamp: number;
  value: number;
}

export interface RealtimeDataStream {
  id: string;
  name: string;
  rate: number;
  unit: string;
  state: "stable" | "degraded" | "updating";
}

export interface LiveSensoryStatus {
  chronicleRecorder: {
    status: "Recording" | "Idle";
    eventsPerMinute: number;
    storageUsedTb: number;
    integrityChecks: string;
    retentionHours: number;
  };
  celestialCartography: {
    trackingSatellites: number;
    harmonicSignatures: string;
    solarAlignment: string;
    lunarPhase: string;
  };
  dataStreams: RealtimeDataStream[];
}

export interface LiveProcessingStatus {
  qssrModule: {
    solarCoherenceIndex: number;
    planetaryResonance: string;
    cosmicWeather: string;
    analysisQueue: number;
  };
  stormTargeting: {
    status: string;
    activePatterns: number;
    neutralizationRate: number;
    harmonicIntegration: number;
  };
  aurisCognitiveSafeguard: {
    status: string;
    hazardDetections: number;
    dampeningFactor: number;
    authorizedTemporalId: string;
  };
  algorithms: string[];
}

export interface LiveOutputStatus {
  voicePipelines: {
    activeVoices: number;
    latencyMs: number;
    successfulTransmits: number;
  };
  commandQueue: {
    queued: number;
    executing: number;
    lastCommand: string;
  };
  compliance: {
    status: string;
    auditsPassed: number;
    escalationLevel: string;
  };
  transmissions: {
    id: string;
    channel: string;
    destination: string;
    status: "queued" | "transmitting" | "complete";
  }[];
}

export interface RealtimeChartCollection {
  magnetometer: RealtimeChartPoint[];
  schumann: RealtimeChartPoint[];
  coherence: RealtimeChartPoint[];
}

export interface RealtimeNexusData {
  timestamp: number;
  metrics: RealtimeMetric[];
  charts: RealtimeChartCollection;
  sensory: LiveSensoryStatus;
  processing: LiveProcessingStatus;
  output: LiveOutputStatus;
}

const SERIES_LENGTH = 30;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const randomWithin = (value: number, delta: number) => {
  const next = value + (Math.random() - 0.5) * delta;
  return next;
};

const createInitialSeries = (
  base: number,
  variance: number,
  min: number,
  max: number
): RealtimeChartPoint[] => {
  const now = Date.now();
  return Array.from({ length: SERIES_LENGTH }, (_, index) => {
    const value = clamp(randomWithin(base, variance), min, max);
    const timestamp = now - (SERIES_LENGTH - index) * 60000;
    return {
      timestamp,
      value: Number(value.toFixed(3)),
    };
  });
};

const advanceSeries = (
  series: RealtimeChartPoint[],
  variance: number,
  min: number,
  max: number
): RealtimeChartPoint[] => {
  const lastValue = series[series.length - 1]?.value ?? (min + max) / 2;
  const nextValue = clamp(randomWithin(lastValue, variance), min, max);
  const nextPoint: RealtimeChartPoint = {
    timestamp: Date.now(),
    value: Number(nextValue.toFixed(3)),
  };
  return [...series.slice(-(SERIES_LENGTH - 1)), nextPoint];
};

const mutateMetric = (metric: RealtimeMetric): RealtimeMetric => {
  let min = 0;
  let max = metric.format === "ratio" ? 1 : metric.format === "percent" ? 100 : Math.max(metric.target ?? 200, 200);
  if (metric.format === "count") {
    min = 0;
  } else if (metric.format === "ratio") {
    min = 0.6;
    max = 1.05;
  } else {
    min = 20;
  }

  const delta =
    metric.format === "ratio"
      ? 0.05
      : metric.format === "percent"
      ? 6
      : Math.max((metric.target ?? 200) * 0.08, 8);

  const nextValueRaw = clamp(randomWithin(metric.value, delta), min, max);
  const decimals = metric.format === "count" ? 0 : metric.format === "percent" ? 1 : 2;
  const nextValue = Number(nextValueRaw.toFixed(decimals));
  const change = Number((nextValue - metric.value).toFixed(decimals));

  return {
    ...metric,
    value: nextValue,
    change,
  };
};

const mutateSensory = (sensory: LiveSensoryStatus): LiveSensoryStatus => {
  const chronicle = sensory.chronicleRecorder;
  const nextEvents = clamp(Math.round(randomWithin(chronicle.eventsPerMinute, 12)), 80, 180);
  const nextStorage = clamp(randomWithin(chronicle.storageUsedTb, 0.08), 1.8, 4.6);

  const tracking = clamp(
    Math.round(randomWithin(sensory.celestialCartography.trackingSatellites, 2)),
    18,
    30
  );
  const harmonicStates = ["Stable", "Elevated", "Slight Variance"];
  const solarAlignments = ["Optimal", "Nominal", "Adjusting"];
  const lunarPhases = ["Waxing Gibbous", "Full", "Waning Gibbous", "First Quarter"];

  const nextStreams = sensory.dataStreams.map((stream) => {
    const delta = stream.rate * 0.12 + 4;
    const rate = clamp(Math.round(randomWithin(stream.rate, delta)), 0, (stream.unit === "bodies" ? 40 : 220));
    const stateRoll = Math.random();
    let state: RealtimeDataStream["state"] = stream.state;
    if (stateRoll > 0.92) {
      state = "degraded";
    } else if (stateRoll > 0.82) {
      state = "updating";
    } else if (stateRoll < 0.7) {
      state = "stable";
    }

    return {
      ...stream,
      rate,
      state,
    };
  });

  return {
    chronicleRecorder: {
      ...chronicle,
      eventsPerMinute: nextEvents,
      storageUsedTb: Number(nextStorage.toFixed(2)),
    },
    celestialCartography: {
      trackingSatellites: tracking,
      harmonicSignatures: harmonicStates[Math.floor(Math.random() * harmonicStates.length)],
      solarAlignment: solarAlignments[Math.floor(Math.random() * solarAlignments.length)],
      lunarPhase: lunarPhases[Math.floor(Math.random() * lunarPhases.length)],
    },
    dataStreams: nextStreams,
  };
};

const mutateProcessing = (processing: LiveProcessingStatus): LiveProcessingStatus => {
  const qssr = processing.qssrModule;
  const storm = processing.stormTargeting;
  const auris = processing.aurisCognitiveSafeguard;

  const cosmicConditions = ["Clear", "Minor Solar Wind", "Geomagnetic Stir", "Calm"];
  const stormStates = ["Migrating to HNC", "Synchronizing", "Neutralizing", "Monitoring"];

  return {
    qssrModule: {
      solarCoherenceIndex: Number(clamp(randomWithin(qssr.solarCoherenceIndex, 0.05), 0.7, 1.02).toFixed(2)),
      planetaryResonance: Math.random() > 0.15 ? "Harmonized" : "Rebalancing",
      cosmicWeather: cosmicConditions[Math.floor(Math.random() * cosmicConditions.length)],
      analysisQueue: clamp(Math.round(randomWithin(qssr.analysisQueue, 6)), 18, 72),
    },
    stormTargeting: {
      status: stormStates[Math.floor(Math.random() * stormStates.length)],
      activePatterns: clamp(Math.round(randomWithin(storm.activePatterns, 1)), 1, 6),
      neutralizationRate: Number(clamp(randomWithin(storm.neutralizationRate, 4), 60, 99).toFixed(1)),
      harmonicIntegration: Number(clamp(randomWithin(storm.harmonicIntegration, 5), 50, 100).toFixed(1)),
    },
    aurisCognitiveSafeguard: {
      status: Math.random() > 0.08 ? "Active" : "Calibrating",
      hazardDetections: clamp(Math.round(randomWithin(auris.hazardDetections, 1)), 1, 8),
      dampeningFactor: Number(clamp(randomWithin(auris.dampeningFactor, 0.08), 0.35, 0.85).toFixed(2)),
      authorizedTemporalId: auris.authorizedTemporalId,
    },
    algorithms: processing.algorithms,
  };
};

const mutateOutput = (output: LiveOutputStatus): LiveOutputStatus => {
  const pipelines = output.voicePipelines;
  const queue = output.commandQueue;
  const compliance = output.compliance;

  const nextTransmissions = output.transmissions.map((transmission) => {
    const stateRoll = Math.random();
    let status = transmission.status;
    if (stateRoll > 0.9) {
      status = "complete";
    } else if (stateRoll > 0.65) {
      status = "transmitting";
    } else if (stateRoll < 0.2) {
      status = "queued";
    }
    return { ...transmission, status };
  });

  return {
    voicePipelines: {
      activeVoices: clamp(Math.round(randomWithin(pipelines.activeVoices, 1)), 2, 5),
      latencyMs: Number(clamp(randomWithin(pipelines.latencyMs, 24), 90, 240).toFixed(0)),
      successfulTransmits: pipelines.successfulTransmits + Math.round(Math.random() * 3),
    },
    commandQueue: {
      queued: clamp(Math.round(randomWithin(queue.queued, 1)), 0, 6),
      executing: clamp(Math.round(randomWithin(queue.executing, 1)), 0, 3),
      lastCommand: Math.random() > 0.4 ? queue.lastCommand : "Stabilize QSSR Envelope",
    },
    compliance: {
      status: Math.random() > 0.1 ? compliance.status : "Reviewing",
      auditsPassed: compliance.auditsPassed + (Math.random() > 0.85 ? 1 : 0),
      escalationLevel: Math.random() > 0.9 ? "Advisory" : "None",
    },
    transmissions: nextTransmissions,
  };
};

const createInitialData = (): RealtimeNexusData => ({
  timestamp: Date.now(),
  metrics: [
    {
      id: "coherence",
      label: "Solar Coherence Index (C)",
      value: 0.92,
      unit: "",
      change: 0,
      format: "ratio",
    },
    {
      id: "resonance",
      label: "Planetary Resonance Harmony",
      value: 0.88,
      unit: "",
      change: 0,
      format: "ratio",
    },
    {
      id: "chronicle",
      label: "Chronicle Write Rate",
      value: 132,
      unit: "events/min",
      change: 0,
      format: "count",
      target: 180,
    },
    {
      id: "aureon",
      label: "Aureon Protocol Activity",
      value: 74,
      unit: "%",
      change: 0,
      format: "percent",
    },
  ],
  charts: {
    magnetometer: createInitialSeries(48, 6, 35, 65),
    schumann: createInitialSeries(7.83, 0.4, 7.1, 8.6),
    coherence: createInitialSeries(0.93, 0.05, 0.7, 1.02),
  },
  sensory: {
    chronicleRecorder: {
      status: "Recording",
      eventsPerMinute: 128,
      storageUsedTb: 2.4,
      integrityChecks: "Passing",
      retentionHours: 72,
    },
    celestialCartography: {
      trackingSatellites: 24,
      harmonicSignatures: "Stable",
      solarAlignment: "Optimal",
      lunarPhase: "Waxing Gibbous",
    },
    dataStreams: [
      {
        id: "phenomena",
        name: "Witnessed Phenomena Log",
        rate: 127,
        unit: "events/min",
        state: "stable",
      },
      {
        id: "temporal",
        name: "Temporal Stamp Verification",
        rate: 98,
        unit: "ops/min",
        state: "stable",
      },
      {
        id: "geometry",
        name: "Sacred Geometry Detection",
        rate: 76,
        unit: "patterns/min",
        state: "updating",
      },
      {
        id: "celestial",
        name: "Celestial Body Tracking",
        rate: 24,
        unit: "bodies",
        state: "stable",
      },
    ],
  },
  processing: {
    qssrModule: {
      solarCoherenceIndex: 0.89,
      planetaryResonance: "Harmonized",
      cosmicWeather: "Clear",
      analysisQueue: 42,
    },
    stormTargeting: {
      status: "Migrating to HNC",
      activePatterns: 3,
      neutralizationRate: 92,
      harmonicIntegration: 75,
    },
    aurisCognitiveSafeguard: {
      status: "Active",
      hazardDetections: 4,
      dampeningFactor: 0.5,
      authorizedTemporalId: "alpha",
    },
    algorithms: [
      "FFT Spectral Analysis",
      "MFCC Feature Extraction",
      "Cross-modal Correlation",
      "Event Detection ML",
    ],
  },
  output: {
    voicePipelines: {
      activeVoices: 3,
      latencyMs: 162,
      successfulTransmits: 47,
    },
    commandQueue: {
      queued: 5,
      executing: 2,
      lastCommand: "Stabilize QSSR Envelope",
    },
    compliance: {
      status: "Aligned",
      auditsPassed: 18,
      escalationLevel: "None",
    },
    transmissions: [
      {
        id: "uplink",
        channel: "Prime Uplink",
        destination: "Central Pillar",
        status: "transmitting",
      },
      {
        id: "field",
        channel: "Field Node Broadcast",
        destination: "All Active Nodes",
        status: "queued",
      },
      {
        id: "archive",
        channel: "Chronicle Archive Sync",
        destination: "Aureon Library",
        status: "complete",
      },
    ],
  },
});

const computeNextData = (prev: RealtimeNexusData): RealtimeNexusData => ({
  timestamp: Date.now(),
  metrics: prev.metrics.map((metric) => mutateMetric(metric)),
  charts: {
    magnetometer: advanceSeries(prev.charts.magnetometer, 5, 35, 65),
    schumann: advanceSeries(prev.charts.schumann, 0.35, 7.1, 8.6),
    coherence: advanceSeries(prev.charts.coherence, 0.04, 0.7, 1.02),
  },
  sensory: mutateSensory(prev.sensory),
  processing: mutateProcessing(prev.processing),
  output: mutateOutput(prev.output),
});

export const useRealtimeNexusData = (refreshMs = 4000): RealtimeNexusData => {
  const initial = useMemo(() => createInitialData(), []);
  const [data, setData] = useState<RealtimeNexusData>(initial);

  useEffect(() => {
    const id = setInterval(() => {
      setData((current) => computeNextData(current));
    }, refreshMs);

    return () => clearInterval(id);
  }, [refreshMs]);

  return data;
};
