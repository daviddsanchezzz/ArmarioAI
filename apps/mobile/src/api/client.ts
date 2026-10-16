import { apiErrorSchema, type ApiErrorCode } from '@armario/shared';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode | 'network',
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function apiRequest<T>(
  method: Method,
  path: string,
  options: { body?: unknown; query?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const url = `${env.apiUrl}${path}${query.size ? `?${query}` : ''}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network', 'No hay conexión con el servidor');
  }

  if (response.status === 204) return undefined as T;

  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(json);
    const message = parsed.success ? parsed.data.error.message : 'Algo ha fallado';
    const code = parsed.success ? parsed.data.error.code : 'internal';
    if (response.status === 401) await supabase.auth.signOut({ scope: 'local' });
    throw new ApiError(response.status, code, message);
  }
  return json as T;
}
