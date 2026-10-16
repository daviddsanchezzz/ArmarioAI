import type { Garment } from '@armario/shared';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { CATEGORY_LABELS } from '@/lib/labels';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { AppText } from '../ui/AppText';
import { Skeleton } from '../ui/Skeleton';

export function GarmentCard({ garment }: { garment: Garment }) {
  const { colors } = useTheme();
  const label = garment.subcategory ?? (garment.category ? CATEGORY_LABELS[garment.category] : 'Sin etiquetar');

  return (
    <Link href={{ pathname: '/garment/[id]', params: { id: garment.id } }} asChild>
      <Pressable style={styles.card} accessibilityLabel={label}>
        <View style={[styles.imageBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {garment.status === 'processing' ? (
            <Skeleton height="100%" style={styles.fill} />
          ) : garment.imageUrl ? (
            <Image
              source={{ uri: garment.imageUrl }}
              // La URL firmada cambia en cada respuesta; la caché se indexa por id.
              recyclingKey={garment.id}
              cachePolicy="memory-disk"
              contentFit={garment.hasCutout ? 'contain' : 'cover'}
              style={styles.fill}
              transition={150}
            />
          ) : null}
          {garment.status === 'error' ? (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <AppText variant="caption" color={colors.onDanger}>
                Error
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="caption" muted numberOfLines={1}>
          {label}
        </AppText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  // maxWidth: con un número impar de prendas, la última no ocupa toda la fila.
  card: { flex: 1, maxWidth: '50%', gap: spacing.xs },
  imageBox: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  fill: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
