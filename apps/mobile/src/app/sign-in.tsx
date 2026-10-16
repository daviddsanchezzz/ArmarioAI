import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Mode = 'sign-in' | 'sign-up';

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: 'Email o contraseña incorrectos',
  user_already_exists: 'Ya hay una cuenta con ese email',
  weak_password: 'La contraseña es demasiado débil',
  email_not_confirmed: 'Confirma tu email antes de entrar',
};

export default function SignInScreen() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canSubmit = /\S+@\S+\.\S+/.test(email) && password.length >= 8;

  async function submit() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const credentials = { email: email.trim(), password };
    const { data, error: authError } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);
    setLoading(false);

    if (authError) {
      setError((authError.code && AUTH_ERRORS[authError.code]) || authError.message);
    } else if (mode === 'sign-up' && !data.session) {
      setInfo('Te hemos enviado un email para confirmar la cuenta.');
    }
    // Con sesión, el layout raíz redirige solo al armario.
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <View style={styles.container}>
          <View style={styles.header}>
            <AppText variant="display">Armario</AppText>
            <AppText muted>{mode === 'sign-in' ? 'Entra en tu cuenta' : 'Crea tu cuenta'}</AppText>
          </View>

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextField
            label="Contraseña (mínimo 8 caracteres)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            textContentType={mode === 'sign-in' ? 'password' : 'newPassword'}
            onSubmitEditing={() => canSubmit && submit()}
          />

          {error ? <AppText color={colors.danger}>{error}</AppText> : null}
          {info ? <AppText muted>{info}</AppText> : null}

          <Button
            label={mode === 'sign-in' ? 'Entrar' : 'Crear cuenta'}
            onPress={submit}
            loading={loading}
            disabled={!canSubmit}
          />
          <Button
            variant="ghost"
            label={mode === 'sign-in' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
            onPress={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
              setError(null);
              setInfo(null);
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  header: { gap: spacing.xs, marginBottom: spacing.lg },
});
