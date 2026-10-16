import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from '../lib/logger.js';

/** Punto de entrada del procesado de una prenda (quitar fondo + etiquetar). */
export interface GarmentProcessor {
  enqueue(garmentId: string): Promise<void>;
}

/**
 * Fase 1: todavía no hay worker, así que la prenda se marca como lista al
 * momento y se muestra con la foto original. En la fase 2 esto se sustituye
 * por un trabajo de pg-boss sin cambiar la interfaz.
 */
export function createImmediateGarmentProcessor(admin: SupabaseClient, logger: Logger): GarmentProcessor {
  return {
    async enqueue(garmentId) {
      const { error } = await admin
        .from('garments')
        .update({ status: 'ready', processed_at: new Date().toISOString() })
        .eq('id', garmentId);
      if (error) {
        logger.error({ garmentId, err: error }, 'No se pudo marcar la prenda como lista');
        throw error;
      }
    },
  };
}
