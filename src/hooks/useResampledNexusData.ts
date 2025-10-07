import { useEffect, useMemo, useState } from "react";
import { resample } from "@/lib/akashic/aureon-akashic";
import { NexusSystem } from "../nexus_system_simulator";

// Assuming the types are defined elsewhere and imported, but for simplicity, including them here.
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
  planetaryResonance: RealtimeChartPoint[];
}

export interface RealtimeNexusData {
  timestamp: number;
  metrics: RealtimeMetric[];
  charts: RealtimeChartCollection;
  sensory: LiveSensoryStatus;
  processing: LiveProcessingStatus;
  output: LiveOutputStatus;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const createInitialSeries = (
  base: number,
  variance: number,
  min: number,
  max: number
): RealtimeChartPoint[] => {
  const now = Date.now();
  // Start with a 60-second history
  return Array.from({ length: 120 }, (_, index) => {
    const value = base;
    const timestamp = now - (120 - index) * 500;
    return {
      timestamp,
      value: Number(value.toFixed(3)),
    };
  });
};

const advanceSeries = (
  series: RealtimeChartPoint[],
  newValue: number
): RealtimeChartPoint[] => {
  const nextPoint: RealtimeChartPoint = {
    timestamp: Date.now(),
    value: Number(newValue.toFixed(3)),
  };
  // Keep a rolling window of points
  return [...series, nextPoint];
};


const STREAM_TUNINGS: Record<
  string,
  { variance: number; watch: number; alert: number }
> = {
  phenomena: { variance: 6, watch: 140, alert: 165 },
  temporal: { variance: 4, watch: 105, alert: 130 },
  geometry: { variance: 3, watch: 82, alert: 96 },
  celestial: { variance: 1.2, watch: 28, alert: 34 },
  geomagnetic: { variance: 2.5, watch: 56, alert: 70 },
};

const createInitialData = (nexus: NexusSystem): RealtimeNexusData => {
    const vizData = nexus.getVisualizationData();
    return {
        timestamp: Date.now(),
        metrics: [
            {
              id: "coherence",
              label: "Solar Coherence Index (C)",
              value: vizData.sentinel.coherence / 100,
              unit: "",
              change: 0,
              format: "ratio",
            },
            {
              id: "resonance",
              label: "Planetary Resonance Harmony",
              value: vizData.stability.stable / 100,
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
            schumann: createInitialSeries(vizData.frequencies.schumann.amplitude, 0.4, 7.1, 8.6),
            coherence: createInitialSeries(vizData.sentinel.coherence / 100, 0.05, 0.7, 1.02),
            planetaryResonance: createInitialSeries(vizData.stability.stable / 100, 0.08, 0.7, 1.05),
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
              {
                id: "geomagnetic",
                name: "Geomagnetic Field",
                rate: 48,
                unit: "nT",
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
    }
}

const computeNextData = (prev: RealtimeNexusData, nexus: NexusSystem, liveData: { solarAlignment: string; lunarPhase: string }): RealtimeNexusData => {
    nexus.egoDeathSim.step(0.01);
    const vizData = nexus.getVisualizationData();
  const toSample = (p: RealtimeChartPoint) => ({ t: p.timestamp / 1000, v: p.value });
  const fromSample = (s: { t: number; v: number }) => ({ timestamp: s.t * 1000, value: s.v });

  const now = Date.now();
  const timeWindow = 60 * 1000; // 60 seconds

  const truncateAndResample = (series: RealtimeChartPoint[]) => {
    const recentPoints = series.filter(p => now - p.timestamp < timeWindow);
    const samples = recentPoints.map(toSample);
    if (samples.length < 2) return recentPoints; // Not enough to resample
    return resample(samples, 0.5).map(fromSample); // dt=0.5 -> 2 points per second
  }

  const newCharts: RealtimeChartCollection = {
    magnetometer: advanceSeries(prev.charts.magnetometer, vizData.energy.amplitude),
    schumann: advanceSeries(prev.charts.schumann, vizData.frequencies.schumann.amplitude),
    coherence: advanceSeries(prev.charts.coherence, vizData.sentinel.coherence / 100),
    planetaryResonance: advanceSeries(prev.charts.planetaryResonance, vizData.stability.stable / 100),
  };

  const resampledCharts: RealtimeChartCollection = {
    magnetometer: truncateAndResample(newCharts.magnetometer),
    schumann: truncateAndResample(newCharts.schumann),
    coherence: truncateAndResample(newCharts.coherence),
    planetaryResonance: truncateAndResample(newCharts.planetaryResonance),
  };

  const coherenceRatio = clamp(vizData.sentinel.coherence / 100, 0, 1);
  const resonanceRatio = clamp(vizData.stability.stable / 100, 0, 1);

  const updatedStreams = prev.sensory.dataStreams.map((stream) => {
    const tuning = STREAM_TUNINGS[stream.id] ?? {
      variance: Math.max(1, stream.rate * 0.05),
      watch: Number.POSITIVE_INFINITY,
      alert: Number.POSITIVE_INFINITY,
    };
    const delta = (Math.random() - 0.5) * tuning.variance;
    const nextRate = clamp(stream.rate + delta, Math.max(0, stream.rate - tuning.variance * 4), stream.rate + tuning.variance * 4);
    let nextState: RealtimeDataStream["state"] = "stable";
    if (nextRate >= tuning.alert) {
      nextState = "degraded";
    } else if (nextRate >= tuning.watch) {
      nextState = "updating";
    }

    return {
      ...stream,
      rate: Number(nextRate.toFixed(1)),
      state: nextState,
    };
  });

  const updatedProcessing: LiveProcessingStatus = {
    qssrModule: {
      solarCoherenceIndex: Number(coherenceRatio.toFixed(3)),
      planetaryResonance: resonanceRatio > 0.85 ? "Harmonized" : resonanceRatio > 0.7 ? "Balancing" : "Investigating",
      cosmicWeather: resonanceRatio > 0.8 ? "Clear" : resonanceRatio > 0.65 ? "Variable" : "Turbulent",
      analysisQueue: clamp(
        Math.round(prev.processing.qssrModule.analysisQueue + (Math.random() - 0.5) * 6),
        18,
        96
      ),
    },
    stormTargeting: {
      status: coherenceRatio > 0.85 ? "Synchronized" : coherenceRatio > 0.72 ? "Migrating to HNC" : "Recalibrating",
      activePatterns: clamp(
        Math.round(
          prev.processing.stormTargeting.activePatterns + (Math.random() - 0.5) * 1.5
        ),
        1,
        6
      ),
      neutralizationRate: clamp(
        Math.round(70 + coherenceRatio * 28 + (Math.random() - 0.5) * 4),
        52,
        99
      ),
      harmonicIntegration: clamp(
        Math.round(60 + resonanceRatio * 35 + (Math.random() - 0.5) * 6),
        48,
        98
      ),
    },
    aurisCognitiveSafeguard: {
      status: prev.processing.aurisCognitiveSafeguard.status,
      hazardDetections: clamp(
        Math.round(prev.processing.aurisCognitiveSafeguard.hazardDetections + (Math.random() - 0.5) * 1.6),
        0,
        9
      ),
      dampeningFactor: Number(clamp(0.42 + (1 - coherenceRatio) * 0.4, 0.35, 0.88).toFixed(2)),
      authorizedTemporalId: prev.processing.aurisCognitiveSafeguard.authorizedTemporalId,
    },
    algorithms: prev.processing.algorithms,
  };

  const updatedTransmissions = prev.output.transmissions.map((tx) => {
    const cycle: Record<typeof tx.status, typeof tx.status> = {
      queued: "transmitting",
      transmitting: "complete",
      complete: "queued",
    };
    const shouldAdvance = Math.random() > 0.76;
    if (!shouldAdvance) {
      if (tx.status === "complete" && Math.random() > 0.94) {
        return { ...tx, status: "queued" };
      }
      return tx;
    }
    return { ...tx, status: cycle[tx.status] };
  });

  const completedBefore = prev.output.transmissions.filter((tx) => tx.status === "complete").length;
  const completedAfter = updatedTransmissions.filter((tx) => tx.status === "complete").length;
  const completedDelta = Math.max(0, completedAfter - completedBefore);

  return {
    ...prev,
    timestamp: Date.now(),
    metrics: prev.metrics.map((metric) => {
      if (metric.id === "coherence") {
        const nextValue = coherenceRatio;
        return {
          ...metric,
          value: nextValue,
          change: Number((nextValue - metric.value).toFixed(3)),
        };
      }
      if (metric.id === "resonance") {
        const nextValue = resonanceRatio;
        return {
          ...metric,
          value: nextValue,
          change: Number((nextValue - metric.value).toFixed(3)),
        };
      }
      return metric;
    }),
    charts: resampledCharts,
    sensory: {
      ...prev.sensory,
      dataStreams: updatedStreams,
      celestialCartography: {
        ...prev.sensory.celestialCartography,
        solarAlignment: liveData.solarAlignment,
        lunarPhase: liveData.lunarPhase,
      },
    },
    processing: updatedProcessing,
    output: {
      ...prev.output,
      voicePipelines: {
        ...prev.output.voicePipelines,
        latencyMs: clamp(
          Math.round(prev.output.voicePipelines.latencyMs + (Math.random() - 0.5) * 18),
          120,
          220
        ),
        successfulTransmits: prev.output.voicePipelines.successfulTransmits + completedDelta,
      },
      commandQueue: {
        ...prev.output.commandQueue,
        queued: clamp(
          Math.round(prev.output.commandQueue.queued + (Math.random() - 0.5) * 1.2),
          2,
          7
        ),
        executing: clamp(
          Math.round(prev.output.commandQueue.executing + (Math.random() - 0.5) * 1.2),
          1,
          3
        ),
      },
      transmissions: updatedTransmissions,
    },
  };
};

export const useResampledNexusData = (refreshMs = 200): RealtimeNexusData => {
  const nexus = useMemo(() => new NexusSystem(), []);
  const initial = useMemo(() => createInitialData(nexus), [nexus]);
  const [data, setData] = useState<RealtimeNexusData>(initial);
  const [liveCelestialData, setLiveCelestialData] = useState({ solarAlignment: "Optimal", lunarPhase: "Waxing Gibbous" });

  useEffect(() => {
    const fetchSolarData = async () => {
      try {
        // Using NASA's DONKI API for Coronal Mass Ejection events as a proxy for solar alignment
        const response = await fetch("https://api.nasa.gov/DONKI/CME?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=DEMO_KEY");
        const cmeEvents = await response.json();
        if (cmeEvents.length > 0) {
          setLiveCelestialData(prev => ({ ...prev, solarAlignment: "Adjusting" }));
        } else {
          setLiveCelestialData(prev => ({ ...prev, solarAlignment: "Optimal" }));
        }
      } catch (error) {
        console.error("Error fetching solar data:", error);
        setLiveCelestialData(prev => ({ ...prev, solarAlignment: "Unknown" }));
      }
    };

    const fetchLunarData = async () => {
      try {
        // Using a simple moon phase API
        const response = await fetch("https://api.farmsense.net/v1/moonphases/");
        const lunarData = await response.json();
        if (lunarData.length > 0) {
          setLiveCelestialData(prev => ({ ...prev, lunarPhase: lunarData[0].Phase }));
        }
      } catch (error) {
        console.error("Error fetching lunar data:", error);
        setLiveCelestialData(prev => ({ ...prev, lunarPhase: "Unknown" }));
      }
    };

    fetchSolarData();
    fetchLunarData();

    const intervalId = setInterval(() => {
        fetchSolarData();
        fetchLunarData();
    }, 1000 * 60 * 60); // Fetch every hour

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setData((current) => computeNextData(current, nexus, liveCelestialData));
    }, refreshMs);

    return () => clearInterval(id);
  }, [refreshMs, nexus, liveCelestialData]);

  return data;
};
