import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../lib/errors.js';

/** Operaciones sobre un bucket de Storage. */
export interface StorageService {
  createUploadUrl(path: string): Promise<{ signedUrl: string; token: string }>;
  exists(path: string): Promise<boolean>;
  /** Devuelve un mapa ruta → URL firmada. Las rutas que fallen no aparecen. */
  signedUrls(paths: string[]): Promise<Map<string, string>>;
  remove(paths: string[]): Promise<void>;
  /** Borra todo lo que haya bajo `prefix/` (dos niveles: {user}/{garment}/fichero). */
  removeFolder(prefix: string): Promise<number>;
}

const storageError = (action: string, error: { message: string }) =>
  new AppError('internal', `Error de almacenamiento al ${action}`, { reason: error.message });

export function createSupabaseStorageService(
  db: SupabaseClient,
  bucket: string,
  signedUrlTtlSeconds: number,
): StorageService {
  const files = () => db.storage.from(bucket);

  async function listAll(prefix: string): Promise<string[]> {
    const paths: string[] = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await files().list(prefix, { limit: pageSize, offset });
      if (error) throw storageError('listar', error);
      for (const entry of data) {
        const fullPath = `${prefix}/${entry.name}`;
        // Las "carpetas" llegan sin id.
        if (entry.id === null) paths.push(...(await listAll(fullPath)));
        else paths.push(fullPath);
      }
      if (data.length < pageSize) return paths;
    }
  }

  return {
    async createUploadUrl(path) {
      const { data, error } = await files().createSignedUploadUrl(path);
      if (error) throw storageError('preparar la subida', error);
      return { signedUrl: data.signedUrl, token: data.token };
    },

    async exists(path) {
      const slash = path.lastIndexOf('/');
      const { data, error } = await files().list(path.slice(0, slash), {
        search: path.slice(slash + 1),
        limit: 1,
      });
      if (error) throw storageError('comprobar el fichero', error);
      return data.some((entry) => entry.name === path.slice(slash + 1));
    },

    async signedUrls(paths) {
      const result = new Map<string, string>();
      if (paths.length === 0) return result;
      const { data, error } = await files().createSignedUrls(paths, signedUrlTtlSeconds);
      if (error) throw storageError('firmar las URLs', error);
      for (const item of data) {
        if (item.path && item.signedUrl && !item.error) result.set(item.path, item.signedUrl);
      }
      return result;
    },

    async remove(paths) {
      if (paths.length === 0) return;
      const { error } = await files().remove(paths);
      if (error) throw storageError('borrar', error);
    },

    async removeFolder(prefix) {
      const paths = await listAll(prefix);
      for (let i = 0; i < paths.length; i += 1000) {
        const { error } = await files().remove(paths.slice(i, i + 1000));
        if (error) throw storageError('borrar', error);
      }
      return paths.length;
    },
  };
}
