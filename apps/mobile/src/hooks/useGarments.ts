import type { Garment, GarmentList, GarmentTags } from '@armario/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { garmentsApi } from '@/api/garments';
import { prepareForUpload, readFileBytes } from '@/lib/image';
import { GARMENTS_BUCKET, supabase } from '@/lib/supabase';
import { useFiltersStore } from '@/stores/filters';

export const garmentKeys = {
  all: ['garments'] as const,
  list: (filters: object) => ['garments', 'list', filters] as const,
  detail: (id: string) => ['garments', 'detail', id] as const,
};

const isProcessing = (garment: Garment) => garment.status === 'processing';

export function useGarmentList() {
  const category = useFiltersStore((s) => s.category);
  const color = useFiltersStore((s) => s.color);
  const season = useFiltersStore((s) => s.season);
  const filters = { category: category ?? undefined, color: color ?? undefined, season: season ?? undefined };

  return useInfiniteQuery({
    queryKey: garmentKeys.list(filters),
    queryFn: ({ pageParam }) => garmentsApi.list({ ...filters, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    // Mientras haya prendas procesándose, refresca cada pocos segundos.
    refetchInterval: (query) =>
      query.state.data?.pages.some((page) => page.items.some(isProcessing)) ? 4000 : false,
  });
}

export function useGarment(id: string) {
  return useQuery({
    queryKey: garmentKeys.detail(id),
    queryFn: () => garmentsApi.get(id),
    refetchInterval: (query) => (query.state.data && isProcessing(query.state.data) ? 4000 : false),
  });
}

export interface NewGarmentPhoto {
  uri: string;
  width: number;
  height: number;
}

/** Comprime la foto, la sube con URL firmada y crea la prenda. */
export function useCreateGarment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ photo, tags }: { photo: NewGarmentPhoto; tags?: GarmentTags }) => {
      const localUri = await prepareForUpload(photo.uri, photo.width, photo.height);
      const upload = await garmentsApi.uploadUrl();
      const { error } = await supabase.storage
        .from(GARMENTS_BUCKET)
        .uploadToSignedUrl(upload.path, upload.token, await readFileBytes(localUri), {
          contentType: 'image/jpeg',
        });
      if (error) throw new Error('No se pudo subir la foto. Inténtalo de nuevo.');
      return garmentsApi.create({ garmentId: upload.garmentId, ...tags });
    },
    onSuccess: (garment) => {
      queryClient.setQueryData(garmentKeys.detail(garment.id), garment);
      return queryClient.invalidateQueries({ queryKey: garmentKeys.all });
    },
  });
}

export function useUpdateGarment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: GarmentTags) => garmentsApi.update(id, patch),
    onSuccess: (garment) => {
      queryClient.setQueryData(garmentKeys.detail(id), garment);
      return queryClient.invalidateQueries({ queryKey: ['garments', 'list'] });
    },
  });
}

export function useDeleteGarment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => garmentsApi.remove(id),
    onSuccess: (_data, id) => {
      // Quita la prenda de las listas en caché sin esperar al refetch.
      queryClient.setQueriesData<InfiniteData<GarmentList>>({ queryKey: ['garments', 'list'] }, (data) =>
        data
          ? { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.filter((g) => g.id !== id) })) }
          : data,
      );
      queryClient.removeQueries({ queryKey: garmentKeys.detail(id) });
    },
  });
}
