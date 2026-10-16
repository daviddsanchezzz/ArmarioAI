import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { radius, spacing, fontSize } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, style, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
  },
});
