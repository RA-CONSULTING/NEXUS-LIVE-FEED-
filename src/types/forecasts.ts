export type Nullable<T> = T | null | undefined;

export interface ForecastWindow<T> {
  entries: T[];
  range: Nullable<{ start: Nullable<string>; end: Nullable<string> }>;
  lastUpdated: Nullable<string>;
}

export interface ForecastResponse {
  quantum: ForecastWindow<QuantumForecastEntry>;
  bioLinear: ForecastWindow<BioLinearForecastEntry>;
}

export interface SolarFieldSnapshot {
  kp_index?: number;
  storm_class?: string;
  solar_wind_speed_km_s?: number;
  solar_radiation?: string;
  aurora_outlook?: string;
}

export interface SchumannSnapshot {
  tomsk_amplitude?: number;
  tomsk_frequency_hz?: number;
  cumana_e_field?: string;
  heartmath_power_band_hz?: string;
}

export interface CosmicSnapshot {
  interstellar_current?: string;
  galactic_wave_interaction?: string;
}

export interface QuantumForecastEntry {
  date: string;
  solar_field?: SolarFieldSnapshot;
  schumann_resonance?: SchumannSnapshot;
  cosmic_events?: CosmicSnapshot;
  nervous_system_guidance?: string[];
  narrative?: string;
  last_updated?: string;
  validation?: { last_synced_at?: string };
}

export interface HazardRating {
  level?: string;
  confidence?: number;
  notes?: string;
}

export interface BioLinearForecastEntry {
  date: string;
  synoptic_overview?: string;
  hazard_ratings?: Record<string, HazardRating>;
  alerts?: string[];
  preparedness_actions?: string[];
  last_updated?: string;
  validation?: { last_synced_at?: string };
}
