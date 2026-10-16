import { z } from 'zod';
import {
  COLORS,
  FORMALITY_MAX,
  FORMALITY_MIN,
  GARMENT_CATEGORIES,
  PROCESSING_STATUSES,
  SEASONS,
  type GarmentColor,
} from '../enums.js';

export const garmentCategorySchema = z.enum(GARMENT_CATEGORIES);
export const seasonSchema = z.enum(SEASONS);
export const processingStatusSchema = z.enum(PROCESSING_STATUSES);
export const garmentColorSchema = z.enum(COLORS as [GarmentColor, ...GarmentColor[]]);

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

/** Etiquetas que el usuario puede escribir (y que la IA rellenará en la fase 2). */
export const garmentTagsSchema = z.object({
  category: garmentCategorySchema.nullable().optional(),
  subcategory: optionalText(60),
  colors: z.array(garmentColorSchema).max(5).optional(),
  pattern: optionalText(60),
  material: optionalText(60),
  seasons: z.array(seasonSchema).max(4).optional(),
  formality: z.number().int().min(FORMALITY_MIN).max(FORMALITY_MAX).nullable().optional(),
  brand: optionalText(100),
  notes: optionalText(1000),
});
export type GarmentTags = z.infer<typeof garmentTagsSchema>;

export const createGarmentSchema = garmentTagsSchema.extend({
  garmentId: z.uuid(),
});
export type CreateGarmentInput = z.infer<typeof createGarmentSchema>;

export const updateGarmentSchema = garmentTagsSchema.refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Debes enviar al menos un campo' },
);
export type UpdateGarmentInput = z.infer<typeof updateGarmentSchema>;

const csvOf = <T extends z.ZodType<unknown, string>>(item: T) =>
  z
    .string()
    .transform((value) => value.split(',').map((part) => part.trim()).filter(Boolean))
    .pipe(z.array(item).min(1));

export const listGarmentsQuerySchema = z.object({
  category: csvOf(garmentCategorySchema).optional(),
  color: csvOf(garmentColorSchema).optional(),
  season: csvOf(seasonSchema).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  /** created_at ISO de la última prenda recibida (paginación por cursor). */
  cursor: z.iso.datetime({ offset: true }).optional(),
});
export type ListGarmentsQuery = z.input<typeof listGarmentsQuerySchema>;

/** Prenda tal como la devuelve la API. */
export const garmentSchema = z.object({
  id: z.uuid(),
  imageUrl: z.url().nullable(),
  hasCutout: z.boolean(),
  category: garmentCategorySchema.nullable(),
  subcategory: z.string().nullable(),
  colors: z.array(garmentColorSchema),
  pattern: z.string().nullable(),
  material: z.string().nullable(),
  seasons: z.array(seasonSchema),
  formality: z.number().int().nullable(),
  brand: z.string().nullable(),
  notes: z.string().nullable(),
  status: processingStatusSchema,
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Garment = z.infer<typeof garmentSchema>;

export const garmentListSchema = z.object({
  items: z.array(garmentSchema),
  nextCursor: z.string().nullable(),
});
export type GarmentList = z.infer<typeof garmentListSchema>;

export const uploadUrlResponseSchema = z.object({
  garmentId: z.uuid(),
  path: z.string(),
  signedUrl: z.url(),
  token: z.string(),
});
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;
