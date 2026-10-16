import { useMutation } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { meApi } from '@/api/garments';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { confirmDestructive } from '@/lib/confirm';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/stores/session';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const email = useSessionStore((s) => s.session?.user.email);

  const signOut = useMutation({ mutationFn: () => supabase.auth.signOut() });
  const deleteAccount = useMutation({
    mutationFn: meApi.deleteAccount,
    onSuccess: () => supabase.auth.signOut({ scope: 'local' }),
  });

  function confirmDelete() {
    confirmDestructive(
      '¿Borrar todos tus datos?',
      'Se borrarán tu cuenta, todas tus prendas y todas tus fotos. No se puede deshacer.',
      'Borrar todo',
      () => deleteAccount.mutate(),
    );
  }

  return (
    <Screen>
      <AppText variant="title">Ajustes</AppText>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppText variant="caption" muted>
          Sesión iniciada como
        </AppText>
        <AppText>{email}</AppText>
      </View>

      <Button label="Cerrar sesión" variant="secondary" loading={signOut.isPending} onPress={() => signOut.mutate()} />

      <View style={styles.spacer} />

      <AppText variant="caption" muted>
        Tus fotos se guardan en almacenamiento privado y no se usan para entrenar ningún modelo.
      </AppText>
      {deleteAccount.isError ? <AppText color={colors.danger}>{deleteAccount.error.message}</AppText> : null}
      <Button
        label="Borrar mi cuenta y mis datos"
        variant="danger"
        loading={deleteAccount.isPending}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, gap: spacing.xs },
  spacer: { flex: 1 },
});
