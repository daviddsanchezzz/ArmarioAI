import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
}

export function Button({ label, variant = 'primary', loading, disabled, style, ...props }: ButtonProps) {
  const { colors } = useTheme();
  const scheme = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
    danger: { bg: colors.danger, fg: colors.onDanger, border: colors.danger },
    ghost: { bg: 'transparent', fg: colors.text, border: 'transparent' },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      style={(state) => [
        styles.base,
        { backgroundColor: scheme.bg, borderColor: scheme.border, opacity: inactive ? 0.5 : state.pressed ? 0.8 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={scheme.fg} />
      ) : (
        <AppText variant="subtitle" color={scheme.fg}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
