import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface SessionState {
  session: Session | null;
  /** true hasta que se ha leído la sesión guardada en el dispositivo. */
  loading: boolean;
}

export const useSessionStore = create<SessionState>(() => ({ session: null, loading: true }));

let started = false;

/** Lee la sesión guardada y escucha los cambios. Se llama una vez al arrancar. */
export function startSessionListener() {
  if (started) return;
  started = true;

  supabase.auth
    .getSession()
    .then(({ data }) => useSessionStore.setState({ session: data.session, loading: false }))
    .catch(() => useSessionStore.setState({ session: null, loading: false }));

  supabase.auth.onAuthStateChange((_event, session) => {
    useSessionStore.setState({ session, loading: false });
  });
}
