export const earthPalette = {
  soil: '#5b402c',
  canyon: '#8f5b34',
  ember: '#c16a4a',
  sunrise: '#d99b54',
  sandstone: '#d9b48f',
  clay: '#b9744f',
  grove: '#6b8a5e',
  moss: '#4f6b40',
  sage: '#8faa72',
  mist: '#b7c59f',
  dusk: '#735d4a',
  shadow: '#2c2116',
} as const;

type PaletteKey = keyof typeof earthPalette;

type PaletteGroup = [string, string, string];

export const earthToneGroups: Record<
  | 'vitality'
  | 'resonance'
  | 'flow'
  | 'horizon'
  | 'ember'
  | 'dusk'
  | 'aurora',
  PaletteGroup
> = {
  vitality: [earthPalette.canyon, earthPalette.ember, earthPalette.sunrise],
  resonance: [earthPalette.grove, earthPalette.sage, earthPalette.mist],
  flow: [earthPalette.clay, earthPalette.sunrise, earthPalette.sandstone],
  horizon: [earthPalette.moss, earthPalette.grove, earthPalette.mist],
  ember: [earthPalette.soil, earthPalette.canyon, earthPalette.sunrise],
  dusk: [earthPalette.dusk, earthPalette.canyon, earthPalette.sandstone],
  aurora: [earthPalette.grove, earthPalette.clay, earthPalette.sandstone],
};

export const borderStates: Record<'stable' | 'watch' | 'anomaly', string> = {
  stable: earthPalette.grove,
  watch: earthPalette.sunrise,
  anomaly: earthPalette.ember,
};

export const temporalScanBorders: Record<'alpha' | 'beta', string> = {
  alpha: earthPalette.sunrise,
  beta: earthPalette.grove,
};

export const sparklineGroups: PaletteGroup[] = [
  earthToneGroups.vitality,
  earthToneGroups.resonance,
  earthToneGroups.flow,
  earthToneGroups.horizon,
  earthToneGroups.ember,
  earthToneGroups.dusk,
];

export const realtimeSpectrumOrder: PaletteGroup[] = [
  earthToneGroups.vitality,
  earthToneGroups.resonance,
  earthToneGroups.flow,
  earthToneGroups.horizon,
];

export type EarthPaletteKey = PaletteKey;
