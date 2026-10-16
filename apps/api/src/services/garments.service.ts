import type {
  CreateGarmentInput,
  Garment,
  GarmentList,
  GarmentTags,
  UploadUrlResponse,
} from '@armario/shared';
import { randomUUID } from 'node:crypto';
import type { RequestContext } from '../deps.js';
import type { GarmentProcessor } from '../jobs/garmentProcessor.js';
import { badRequest, notFound } from '../lib/errors.js';
import type { Logger } from '../lib/logger.js';
import type { GarmentFilters, GarmentRow } from '../repositories/garments.repository.js';

/** Convención de rutas en Storage: {userId}/{garmentId}/fichero */
export function garmentPaths(userId: string, garmentId: string) {
  const folder = `${userId}/${garmentId}`;
  return { folder, original: `${folder}/original.jpg`, cutout: `${folder}/cutout.png` };
}

export class GarmentsService {
  constructor(
    private readonly ctx: RequestContext,
    private readonly processor: GarmentProcessor,
    private readonly logger: Logger,
  ) {}

  private get repo() {
    return this.ctx.scope.garments;
  }

  private get storage() {
    return this.ctx.scope.storage;
  }

  async createUploadUrl(): Promise<UploadUrlResponse> {
    const garmentId = randomUUID();
    const path = garmentPaths(this.ctx.user.id, garmentId).original;
    const { signedUrl, token } = await this.storage.createUploadUrl(path);
    return { garmentId, path, signedUrl, token };
  }

  async create({ garmentId, ...tags }: CreateGarmentInput): Promise<Garment> {
    const path = garmentPaths(this.ctx.user.id, garmentId).original;
    if (!(await this.storage.exists(path))) {
      throw badRequest('Primero sube la foto con la URL firmada');
    }

    const row = await this.repo.create({ id: garmentId, original_path: path, ...tags });

    try {
      await this.processor.enqueue(row.id);
    } catch (err) {
      // La prenda queda en "processing"; se podrá reintentar desde el worker.
      this.logger.error({ err, garmentId: row.id }, 'No se pudo encolar el procesado');
      return this.toDto(row);
    }

    return this.get(row.id);
  }

  async list(filters: GarmentFilters): Promise<GarmentList> {
    const rows = await this.repo.list({ ...filters, limit: filters.limit + 1 });
    const page = rows.slice(0, filters.limit);
    const nextCursor = rows.length > filters.limit ? (page.at(-1)?.created_at ?? null) : null;
    return { items: await this.toDtos(page), nextCursor };
  }

  async get(id: string): Promise<Garment> {
    const row = await this.repo.findById(id);
    if (!row) throw notFound('Prenda no encontrada');
    return this.toDto(row);
  }

  async update(id: string, patch: GarmentTags): Promise<Garment> {
    const row = await this.repo.update(id, patch);
    if (!row) throw notFound('Prenda no encontrada');
    return this.toDto(row);
  }

  async remove(id: string): Promise<void> {
    const row = await this.repo.findById(id);
    if (!row || !(await this.repo.remove(id))) throw notFound('Prenda no encontrada');

    const paths = [row.original_path, row.cutout_path].filter((p): p is string => Boolean(p));
    try {
      await this.storage.remove(paths);
    } catch (err) {
      // La fila ya no existe; los ficheros huérfanos se limpian al borrar la cuenta.
      this.logger.warn({ err, garmentId: id }, 'No se pudieron borrar los ficheros de la prenda');
    }
  }

  private async toDto(row: GarmentRow): Promise<Garment> {
    const [dto] = await this.toDtos([row]);
    return dto!;
  }

  private async toDtos(rows: GarmentRow[]): Promise<Garment[]> {
    const imagePath = (row: GarmentRow) => row.cutout_path ?? row.original_path;
    const urls = await this.storage.signedUrls(rows.map(imagePath));

    return rows.map((row) => ({
      id: row.id,
      imageUrl: urls.get(imagePath(row)) ?? null,
      hasCutout: row.cutout_path !== null,
      category: row.category,
      subcategory: row.subcategory,
      colors: row.colors,
      pattern: row.pattern,
      material: row.material,
      seasons: row.seasons,
      formality: row.formality,
      brand: row.brand,
      notes: row.notes,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}
