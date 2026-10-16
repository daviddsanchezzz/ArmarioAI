import type { GarmentCategory, GarmentColor, Season } from '@armario/shared';

export const CATEGORY_LABELS: Record<GarmentCategory, string> = {
  top: 'Parte de arriba',
  bottom: 'Parte de abajo',
  outerwear: 'Abrigo',
  dress: 'Vestido',
  shoes: 'Calzado',
  accessory: 'Accesorio',
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Primavera',
  summer: 'Verano',
  autumn: 'Otoño',
  winter: 'Invierno',
};

export const COLOR_LABELS: Record<GarmentColor, string> = {
  black: 'Negro',
  white: 'Blanco',
  grey: 'Gris',
  beige: 'Beige',
  brown: 'Marrón',
  red: 'Rojo',
  pink: 'Rosa',
  orange: 'Naranja',
  yellow: 'Amarillo',
  green: 'Verde',
  blue: 'Azul',
  navy: 'Marino',
  purple: 'Morado',
  multicolor: 'Multicolor',
};

export const FORMALITY_LABELS = ['', 'Muy informal', 'Informal', 'Casual arreglado', 'Formal', 'Muy formal'];
