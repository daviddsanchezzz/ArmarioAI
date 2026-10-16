import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Button } from './Button';

interface MessageProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: MessageProps) {
  return (
    <View style={styles.center}>
      <AppText variant="subtitle" style={styles.text}>
        {title}
      </AppText>
      {description ? (
        <AppText muted style={styles.text}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Algo ha fallado';
  return (
    <EmptyState
      title="No se ha podido cargar"
      description={message}
      actionLabel={onRetry ? 'Reintentar' : undefined}
      onAction={onRetry}
    />
  );
}

export function LoadingState() {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  text: { textAlign: 'center' },
});
