import { pino } from 'pino';
import type { AppDeps, UserScope } from '../src/deps.js';
import { unauthorized } from '../src/lib/errors.js';
import type { GarmentRepository, GarmentRow } from '../src/repositories/garments.repository.js';
import type { StorageService } from '../src/services/storage.service.js';

export const USER_A = { id: '11111111-1111-4111-8111-111111111111', email: 'a@example.com' };
export const USER_B = { id: '22222222-2222-4222-8222-222222222222', email: 'b@example.com' };

/** Simula Postgres + Storage en memoria, con el aislamiento por usuario que da RLS. */
export class FakeBackend {
  rows = new Map<string, GarmentRow>();
  files = new Set<string>();
  deletedUsers: string[] = [];
  enqueued: string[] = [];
  failEnqueue = false;
  private clock = Date.parse('2026-01-01T00:00:00Z');

  private now() {
    this.clock += 1000;
    return new Date(this.clock).toISOString();
  }

  repoFor(userId: string): GarmentRepository {
    const own = (row: GarmentRow | undefined) => (row && row.user_id === userId ? row : null);
    return {
      create: async (garment) => {
        if (this.rows.has(garment.id)) throw new Error('duplicate');
        const at = this.now();
        const row: GarmentRow = {
          id: garment.id,
          user_id: userId,
          original_path: garment.original_path,
          cutout_path: null,
          category: garment.category ?? null,
          subcategory: garment.subcategory ?? null,
          colors: garment.colors ?? [],
          pattern: garment.pattern ?? null,
          material: garment.material ?? null,
          seasons: garment.seasons ?? [],
          formality: garment.formality ?? null,
          brand: garment.brand ?? null,
          notes: garment.notes ?? null,
          status: 'processing',
          error_message: null,
          created_at: at,
          updated_at: at,
        };
        this.rows.set(row.id, row);
        return { ...row };
      },
      list: async ({ category, color, season, cursor, limit }) =>
        [...this.rows.values()]
          .filter((row) => row.user_id === userId)
          .filter((row) => !category?.length || (row.category !== null && category.includes(row.category)))
          .filter((row) => !color?.length || row.colors.some((c) => color.includes(c)))
          .filter((row) => !season?.length || row.seasons.some((s) => season.includes(s)))
          .filter((row) => !cursor || row.created_at < cursor)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, limit),
      findById: async (id) => own(this.rows.get(id)),
      update: async (id, patch) => {
        const row = own(this.rows.get(id));
        if (!row) return null;
        Object.assign(row, patch, { updated_at: this.now() });
        return { ...row };
      },
      remove: async (id) => (own(this.rows.get(id)) ? this.rows.delete(id) : false),
    };
  }

  storageFor(prefix: string | null): StorageService {
    const allowed = (path: string) => prefix === null || path.startsWith(`${prefix}/`);
    return {
      createUploadUrl: async (path) => {
        if (!allowed(path)) throw new Error('forbidden');
        return { signedUrl: `https://storage.test/upload/${path}`, token: 'upload-token' };
      },
      exists: async (path) => allowed(path) && this.files.has(path),
      signedUrls: async (paths) =>
        new Map(paths.filter(allowed).map((path) => [path, `https://storage.test/read/${path}`])),
      remove: async (paths) => {
        paths.filter(allowed).forEach((path) => this.files.delete(path));
      },
      removeFolder: async (folder) => {
        const matches = [...this.files].filter((path) => path.startsWith(`${folder}/`));
        matches.forEach((path) => this.files.delete(path));
        return matches.length;
      },
    };
  }

  deps(): AppDeps {
    const users = new Map([USER_A, USER_B].map((user) => [`token-${user.id}`, user]));
    return {
      logger: pino({ level: 'silent' }),
      corsOrigins: [],
      verifyToken: async (token) => {
        const user = users.get(token);
        if (!user || this.deletedUsers.includes(user.id)) throw unauthorized();
        return user;
      },
      forUser: (_token, user): UserScope => ({
        garments: this.repoFor(user.id),
        storage: this.storageFor(user.id),
      }),
      admin: {
        storage: this.storageFor(null),
        deleteUser: async (userId) => {
          this.deletedUsers.push(userId);
          for (const [id, row] of this.rows) if (row.user_id === userId) this.rows.delete(id);
        },
      },
      processor: {
        enqueue: async (garmentId) => {
          if (this.failEnqueue) throw new Error('queue down');
          this.enqueued.push(garmentId);
          const row = this.rows.get(garmentId);
          if (row) row.status = 'ready';
        },
      },
    };
  }
}

export const authHeader = (user: { id: string }) => ({ Authorization: `Bearer token-${user.id}` });
