import type { Garment, GarmentTags } from '@armario/shared';
import { emptyTags, type TagValues } from '@/components/garments/TagEditor';

const TAG_KEYS = Object.keys(emptyTags) as (keyof TagValues)[];

export function tagsFromGarment(garment: Garment): TagValues {
  return Object.fromEntries(TAG_KEYS.map((key) => [key, garment[key]])) as TagValues;
}

/** Solo los campos que han cambiado (arrays comparados por contenido). */
export function changedTags(before: TagValues, after: TagValues): GarmentTags {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  return Object.fromEntries(TAG_KEYS.filter((key) => !same(before[key], after[key])).map((key) => [key, after[key]]));
}

/** Para crear: omite lo vacío. */
export function nonEmptyTags(values: TagValues): GarmentTags {
  return changedTags(emptyTags, values);
}
