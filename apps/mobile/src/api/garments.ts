import type {
  CreateGarmentInput,
  Garment,
  GarmentList,
  GarmentTags,
  UploadUrlResponse,
} from '@armario/shared';
import { apiRequest } from './client';

export interface GarmentFiltersQuery {
  category?: string;
  color?: string;
  season?: string;
  cursor?: string;
  limit?: number;
}

export const garmentsApi = {
  list: (query: GarmentFiltersQuery) => apiRequest<GarmentList>('GET', '/garments', { query: { ...query } }),
  get: (id: string) => apiRequest<Garment>('GET', `/garments/${id}`),
  uploadUrl: () => apiRequest<UploadUrlResponse>('POST', '/garments/upload-url'),
  create: (input: CreateGarmentInput) => apiRequest<Garment>('POST', '/garments', { body: input }),
  update: (id: string, patch: GarmentTags) => apiRequest<Garment>('PATCH', `/garments/${id}`, { body: patch }),
  remove: (id: string) => apiRequest<void>('DELETE', `/garments/${id}`),
};

export const meApi = {
  deleteAccount: () => apiRequest<void>('DELETE', '/me'),
};
