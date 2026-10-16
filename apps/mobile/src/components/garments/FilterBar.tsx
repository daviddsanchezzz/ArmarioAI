import { COLOR_PALETTE, COLORS, GARMENT_CATEGORIES, SEASONS } from '@armario/shared';
import { ScrollView, StyleSheet } from 'react-native';
import { CATEGORY_LABELS, COLOR_LABELS, SEASON_LABELS } from '@/lib/labels';
import { useFiltersStore } from '@/stores/filters';
import { spacing } from '@/theme/tokens';
import { Chip } from '../ui/Chip';

function Row({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {children}
    </ScrollView>
  );
}

export function FilterBar() {
  const { category, color, season, setCategory, setColor, setSeason } = useFiltersStore();

  return (
    <>
      <Row>
        <Chip label="Todo" selected={category === null} onPress={() => setCategory(null)} />
        {GARMENT_CATEGORIES.map((value) => (
          <Chip
            key={value}
            label={CATEGORY_LABELS[value]}
            selected={category === value}
            onPress={() => setCategory(category === value ? null : value)}
          />
        ))}
      </Row>
      <Row>
        {SEASONS.map((value) => (
          <Chip
            key={value}
            label={SEASON_LABELS[value]}
            selected={season === value}
            onPress={() => setSeason(season === value ? null : value)}
          />
        ))}
        {COLORS.map((value) => (
          <Chip
            key={value}
            label={COLOR_LABELS[value]}
            swatch={COLOR_PALETTE[value]}
            selected={color === value}
            onPress={() => setColor(color === value ? null : value)}
          />
        ))}
      </Row>
    </>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingRight: spacing.lg },
});
