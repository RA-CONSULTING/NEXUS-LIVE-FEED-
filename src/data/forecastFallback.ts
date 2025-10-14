import type { ForecastResponse } from '@/types/forecasts';

export const fallbackForecastResponse: ForecastResponse = {
  quantum: {
    entries: [
      {
        date: '2025-10-16',
        solar_field: {
          kp_index: 5.2,
          storm_class: 'G1 Minor Storm',
          solar_wind_speed_km_s: 540,
          solar_radiation: 'Stable background with isolated M-class threat diminishing',
          aurora_outlook: 'Auroral oval expands; rare low-latitude sighting window at midnight',
        },
        schumann_resonance: {
          tomsk_amplitude: 5.32,
          tomsk_frequency_hz: 8.01,
          cumana_e_field: 'Electric-field surge pulses between 20–30 pT',
          heartmath_power_band_hz: '1–50 Hz waves weaving coherent envelope',
        },
        cosmic_events: {
          interstellar_current: 'Mars-cone plasma buffets magnetosphere, sourced from comet wake',
          galactic_wave_interaction: 'Gravitational wave crest lifts heliospheric bow by 0.2 AU',
        },
        nervous_system_guidance: [
          'Practice 4-7-8 breath cycles',
          'Trace meridians with cool water for nervous system balance',
        ],
        narrative: 'Solar breath quickens; Earth’s heartbeat replies with harmonic resilience.',
        last_updated: '2025-10-14T10:30:00Z',
      },
      {
        date: '2025-10-17',
        solar_field: {
          kp_index: 4.3,
          storm_class: 'Active',
          solar_wind_speed_km_s: 505,
          solar_radiation: 'Quiet with B-class glimmers',
          aurora_outlook: 'High-latitude skies shimmer softly; subdued mid-latitude glow',
        },
        schumann_resonance: {
          tomsk_amplitude: 4.88,
          tomsk_frequency_hz: 8.05,
          cumana_e_field: 'Stable baseline near 18 pT',
          heartmath_power_band_hz: 'Delta-to-beta coherence smoothing out spikes',
        },
        cosmic_events: {
          interstellar_current: 'Comet tail filaments disperse, leaving charged dust wake',
          galactic_wave_interaction: 'Wavefront trough provides recovery pocket for planetary field',
        },
        nervous_system_guidance: [
          'Walk barefoot at dawn',
          'Sip warm herbal infusions with trace minerals',
        ],
        narrative: 'Harmonics settle; Earth inhales a calmer rhythm while holding cosmic memory.',
        last_updated: '2025-10-14T10:30:00Z',
      },
    ],
    range: { start: '2025-10-16', end: '2025-11-14' },
    lastUpdated: '2025-10-14T10:30:00Z',
  },
  bioLinear: {
    entries: [
      {
        date: '2025-10-16',
        synoptic_overview:
          'Slow-moving cold front drifts inland; jet streak overhead supports organized convection.',
        hazard_ratings: {
          storm: {
            level: 'Moderate',
            confidence: 0.65,
            notes: 'Embedded thunderstorms produce brief hail cores.',
          },
          flood: {
            level: 'Moderate',
            confidence: 0.57,
            notes: 'Rainfall rates 20–30 mm/hr in urban basins.',
          },
          heat: {
            level: 'Low',
            confidence: 0.3,
            notes: 'Surface temps 8–10°C below seasonal norm.',
          },
          wildfire: {
            level: 'Low',
            confidence: 0.25,
            notes: 'Fuel moisture elevated after overnight rain.',
          },
          seismic: {
            level: 'Background',
            confidence: 0.28,
            notes: 'Crustal stress remains nominal.',
          },
        },
        alerts: [
          'Activate urban ponding advisory for Puget Sound corridor.',
          'Standby convective spotters along I-5 belt.',
        ],
        preparedness_actions: [
          'Clear storm drains and deploy portable pumps in low-lying intersections.',
          'Coordinate messaging with transportation hubs about slick conditions.',
        ],
        last_updated: '2025-10-14T10:35:00Z',
      },
      {
        date: '2025-10-17',
        synoptic_overview:
          'Frontal boundary stalls; secondary low near Vancouver Island drives persistent rain shield.',
        hazard_ratings: {
          storm: {
            level: 'Moderate',
            confidence: 0.68,
            notes: '45 kt southerly gusts persist through afternoon.',
          },
          flood: {
            level: 'High',
            confidence: 0.66,
            notes: 'Soils saturating with 75–90 mm cumulative totals.',
          },
          heat: {
            level: 'Low',
            confidence: 0.32,
            notes: 'Cloud deck suppresses diurnal range.',
          },
          wildfire: {
            level: 'Low',
            confidence: 0.22,
            notes: 'Persistent drizzle dampens fuels.',
          },
          seismic: {
            level: 'Background',
            confidence: 0.28,
            notes: 'Plate coupling metrics steady.',
          },
        },
        alerts: [
          'Maintain flood watch messaging for Snohomish and Skagit basins.',
          'Stage swift-water teams near Skokomish River lowlands.',
        ],
        preparedness_actions: [
          'Pre-position sandbags along urban creeks with rapid rise potential.',
          'Issue voluntary telework guidance for exposed corridors during peak gusts.',
        ],
        last_updated: '2025-10-14T10:35:00Z',
      },
    ],
    range: { start: '2025-10-16', end: '2025-11-14' },
    lastUpdated: '2025-10-14T10:35:00Z',
  },
};
