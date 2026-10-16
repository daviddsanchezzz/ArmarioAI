import type {
  GarmentCategory,
  GarmentColor,
  GarmentTags,
  ProcessingStatus,
  Season,
} from '@armario/shared';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { AppError, badRequest, conflict } from '../lib/errors.js';

/** Fila de public.garments tal como sale de Postgres. */
export interface GarmentRow {
  id: string;
  user_id: string;
  original_path: string;
  cutout_path: string | null;
  category: GarmentCategory | null;
  subcategory: string | null;
  colors: GarmentColor[];
  pattern: string | null;
  material: string | null;
  seasons: Season[];
  formality: number | null;
  brand: string | null;
  notes: string | null;
  status: ProcessingStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewGarment extends GarmentTags {
  id: string;
  original_path: string;
}

export interface GarmentFilters {
  category?: GarmentCategory[];
  color?: GarmentColor[];
  season?: Season[];
  cursor?: string;
  limit: number;
}

export interface GarmentRepository {
  create(garment: NewGarment): Promise<GarmentRow>;
  /** Devuelve como mucho `limit` filas, de la más nueva a la más antigua. */
  list(filters: GarmentFilters): Promise<GarmentRow[]>;
  findById(id: string): Promise<GarmentRow | null>;
  update(id: string, patch: GarmentTags): Promise<GarmentRow | null>;
  remove(id: string): Promise<boolean>;
}

const COLUMNS =
  'id, user_id, original_path, cutout_path, category, subcategory, colors, pattern, material, ' +
  'seasons, formality, brand, notes, status, error_message, created_at, updated_at';

/** Traduce errores de Postgres/PostgREST a errores de la API. */
export function mapPostgrestError(error: PostgrestError): AppError {
  switch (error.code) {
    case '23505':
      return conflict('Ya existe una prenda con ese id');
    case '23514':
    case '22P02':
      return badRequest('Datos no válidos', { reason: error.message });
    case '42501':
      return new AppError('forbidden', 'No tienes permiso para esta operación');
    default:
      return new AppError('internal', 'Error de base de datos', { code: error.code });
  }
}

/**
 * Implementación sobre Supabase. Recibe un cliente con el JWT del usuario,
 * así que RLS limita cada consulta a sus propias prendas.
 */
export function createSupabaseGarmentRepository(db: SupabaseClient): GarmentRepository {
  const table = () => db.from('garments');

  return {
    async create(garment) {
      const { data, error } = await table().insert(garment).select(COLUMNS).single();
      if (error) throw mapPostgrestError(error);
      return data as unknown as GarmentRow;
    },

    async list({ category, color, season, cursor, limit }) {
      let query = table().select(COLUMNS).order('created_at', { ascending: false }).limit(limit);
      if (category?.length) query = query.in('category', category);
      if (color?.length) query = query.overlaps('colors', color);
      if (season?.length) query = query.overlaps('seasons', season);
      if (cursor) query = query.lt('created_at', cursor);

      const { data, error } = await query;
      if (error) throw mapPostgrestError(error);
      return data as unknown as GarmentRow[];
    },

    async findById(id) {
      const { data, error } = await table().select(COLUMNS).eq('id', id).maybeSingle();
      if (error) throw mapPostgrestError(error);
      return data as unknown as GarmentRow | null;
    },

    async update(id, patch) {
      const { data, error } = await table().update(patch).eq('id', id).select(COLUMNS).maybeSingle();
      if (error) throw mapPostgrestError(error);
      return data as unknown as GarmentRow | null;
    },

    async remove(id) {
      const { data, error } = await table().delete().eq('id', id).select('id');
      if (error) throw mapPostgrestError(error);
      return data.length > 0;
    },
  };
}
