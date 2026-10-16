export const GARMENT_CATEGORIES = [
  'top',
  'bottom',
  'outerwear',
  'dress',
  'shoes',
  'accessory',
] as const;
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

export const PROCESSING_STATUSES = ['processing', 'ready', 'error'] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

/** Paleta cerrada: facilita los filtros y lo que pediremos a la IA en la fase 2. */
export const COLOR_PALETTE = {
  black: '#111111',
  white: '#F5F5F5',
  grey: '#9E9E9E',
  beige: '#D8C3A5',
  brown: '#7B5136',
  red: '#C62828',
  pink: '#EC8FB0',
  orange: '#EF7D2D',
  yellow: '#F2C94C',
  green: '#3E8E5A',
  blue: '#2F6FD6',
  navy: '#1F2A48',
  purple: '#7E57C2',
  multicolor: '#B0B0B0',
} as const;
export const COLORS = Object.keys(COLOR_PALETTE) as (keyof typeof COLOR_PALETTE)[];
export type GarmentColor = keyof typeof COLOR_PALETTE;

export const FORMALITY_MIN = 1;
export const FORMALITY_MAX = 5;
