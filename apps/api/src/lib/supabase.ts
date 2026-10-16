import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../config/env.js';

const serverAuthOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const;

/** Cliente que actúa como el usuario: todas las consultas pasan por RLS. */
export function createUserClient(env: Env, accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: serverAuthOptions,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** Cliente con service_role: se salta RLS. Solo para el procesado y el borrado de cuenta. */
export function createAdminClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: serverAuthOptions,
  });
}
