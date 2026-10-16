import { Pressable, StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  selected?: boolean;
  swatch?: string;
  onPress?: () => void;
}

export function Chip({ label, selected, swatch, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {swatch ? <View style={[styles.swatch, { backgroundColor: swatch, borderColor: colors.border }]} /> : null}
      <AppText variant="caption" color={selected ? colors.onPrimary : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth },
});
