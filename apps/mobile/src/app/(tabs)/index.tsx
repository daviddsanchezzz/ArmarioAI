import type { Garment } from '@armario/shared';
import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { FilterBar } from '@/components/garments/FilterBar';
import { GarmentCard } from '@/components/garments/GarmentCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { useGarmentList } from '@/hooks/useGarments';
import { useFiltersStore } from '@/stores/filters';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function WardrobeScreen() {
  const { colors } = useTheme();
  const query = useGarmentList();
  const hasFilters = useFiltersStore((s) => Boolean(s.category || s.color || s.season));
  const resetFilters = useFiltersStore((s) => s.reset);
  const garments: Garment[] = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <AppText variant="title">Mi armario</AppText>
        <FilterBar />
      </View>

      {query.isPending ? (
        <GridSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : garments.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="Nada con estos filtros"
            actionLabel="Quitar filtros"
            onAction={resetFilters}
          />
        ) : (
          <EmptyState
            title="Tu armario está vacío"
            description="Haz una foto a tu primera prenda para empezar."
            actionLabel="Añadir prenda"
            onAction={() => router.navigate('/add')}
          />
        )
      ) : (
        <FlatList
          data={garments}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <GarmentCard garment={item} />}
          onEndReachedThreshold={0.5}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor={colors.textMuted}
            />
          }
        />
      )}
    </Screen>
  );
}

function GridSkeleton() {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }, (_, i) => (
        <View key={i} style={styles.skeletonCell}>
          <View style={styles.skeletonImage}>
            <Skeleton height="100%" />
          </View>
          <Skeleton width="60%" height={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  header: { gap: spacing.md },
  list: { gap: spacing.lg, paddingBottom: spacing.xxl },
  column: { gap: spacing.lg },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  skeletonCell: { width: '47%', gap: spacing.xs },
  skeletonImage: { aspectRatio: 1 },
});
