import { Text, type TextProps } from 'react-native';
import { fontSize } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'caption';

const VARIANTS: Record<Variant, { fontSize: number; fontWeight: '400' | '500' | '600' }> = {
  display: { fontSize: fontSize.display, fontWeight: '600' },
  title: { fontSize: fontSize.title, fontWeight: '600' },
  subtitle: { fontSize: fontSize.subtitle, fontWeight: '500' },
  body: { fontSize: fontSize.body, fontWeight: '400' },
  caption: { fontSize: fontSize.caption, fontWeight: '400' },
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
}

export function AppText({ variant = 'body', muted, color, style, ...props }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[VARIANTS[variant], { color: color ?? (muted ? colors.textMuted : colors.text) }, style]}
      {...props}
    />
  );
}
