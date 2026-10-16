function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Falta la variable ${name}. Copia .env.example a .env y rellénala.`);
  return value;
}

// Expo solo incrusta las variables EXPO_PUBLIC_* si se leen de forma literal.
export const env = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  apiUrl: required('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL).replace(/\/$/, ''),
};
