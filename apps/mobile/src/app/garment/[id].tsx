import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import type { Garment } from '@armario/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TagEditor, type TagValues } from '@/components/garments/TagEditor';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useDeleteGarment, useGarment, useUpdateGarment } from '@/hooks/useGarments';
import { confirmDestructive } from '@/lib/confirm';
import { changedTags, tagsFromGarment } from '@/lib/tags';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function GarmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const garment = useGarment(id);

  if (garment.isPending) return <LoadingState />;
  if (garment.isError) return <ErrorState error={garment.error} onRetry={() => garment.refetch()} />;
  // La key reinicia el formulario cuando la prenda cambia en el servidor.
  return <GarmentEditor key={garment.data.updatedAt} item={garment.data} />;
}

function GarmentEditor({ item }: { item: Garment }) {
  const { id } = item;
  const { colors } = useTheme();
  const update = useUpdateGarment(id);
  const remove = useDeleteGarment();
  const [saved] = useState(() => tagsFromGarment(item));
  const [draft, setDraft] = useState<TagValues>(saved);

  const patch = changedTags(saved, draft);
  const dirty = Object.keys(patch).length > 0;

  function confirmDelete() {
    confirmDestructive(
      '¿Borrar esta prenda?',
      'Se borrarán la prenda y sus fotos. No se puede deshacer.',
      'Borrar',
      () => remove.mutate(id, { onSuccess: () => router.back() }),
    );
  }

  return (
    <Screen scroll edges={[]}>
      <View style={[styles.imageBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {item.status === 'processing' ? (
          <Skeleton height="100%" />
        ) : item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            recyclingKey={item.id}
            contentFit={item.hasCutout ? 'contain' : 'cover'}
            style={styles.image}
          />
        ) : null}
      </View>

      {item.status === 'processing' ? <AppText muted>Procesando la foto…</AppText> : null}
      {item.status === 'error' ? (
        <AppText color={colors.danger}>{item.errorMessage ?? 'No se pudo procesar la foto.'}</AppText>
      ) : null}

      <TagEditor value={draft} onChange={setDraft} />

      {update.isError ? <AppText color={colors.danger}>{update.error.message}</AppText> : null}
      {remove.isError ? <AppText color={colors.danger}>{remove.error.message}</AppText> : null}

      <Button label="Guardar cambios" disabled={!dirty} loading={update.isPending} onPress={() => update.mutate(patch)} />
      <Button label="Borrar prenda" variant="danger" loading={remove.isPending} onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  image: { width: '100%', height: '100%' },
});
