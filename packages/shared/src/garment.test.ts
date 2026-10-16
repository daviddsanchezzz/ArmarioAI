import { describe, expect, it } from 'vitest';
import { listGarmentsQuerySchema, updateGarmentSchema } from './index.js';

describe('listGarmentsQuerySchema', () => {
  it('parsea filtros separados por comas', () => {
    const parsed = listGarmentsQuerySchema.parse({ category: 'top,shoes', color: 'black' });
    expect(parsed).toMatchObject({ category: ['top', 'shoes'], color: ['black'], limit: 30 });
  });

  it('rechaza valores fuera del catálogo', () => {
    expect(listGarmentsQuerySchema.safeParse({ color: 'fucsia' }).success).toBe(false);
  });
});

describe('updateGarmentSchema', () => {
  it('exige al menos un campo', () => {
    expect(updateGarmentSchema.safeParse({}).success).toBe(false);
  });

  it('valida la formalidad entre 1 y 5', () => {
    expect(updateGarmentSchema.safeParse({ formality: 6 }).success).toBe(false);
    expect(updateGarmentSchema.safeParse({ formality: 3 }).success).toBe(true);
  });
});
