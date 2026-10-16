import { createRemoteJWKSet, errors as joseErrors, jwtVerify, type JWTPayload } from 'jose';
import type { Env } from '../config/env.js';
import { unauthorized } from '../lib/errors.js';

export interface AuthUser {
  id: string;
  email: string | null;
}

/** Devuelve el usuario del JWT o lanza 401. */
export type TokenVerifier = (accessToken: string) => Promise<AuthUser>;

/**
 * Verifica los JWT de Supabase Auth.
 * Por defecto usa las claves públicas del proyecto (JWKS); si se configura
 * SUPABASE_JWT_SECRET, usa el secreto HS256 heredado.
 */
export function createSupabaseTokenVerifier(env: Env): TokenVerifier {
  const issuer = `${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1`;
  const options = { issuer, audience: 'authenticated' };
  const secret = env.SUPABASE_JWT_SECRET;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  const verify = secret
    ? (token: string) => jwtVerify(token, new TextEncoder().encode(secret), options)
    : (token: string) => jwtVerify(token, jwks, options);

  return async (accessToken) => {
    let payload: JWTPayload & { email?: unknown; role?: unknown };
    try {
      ({ payload } = await verify(accessToken));
    } catch (error) {
      if (error instanceof joseErrors.JWTExpired) throw unauthorized('La sesión ha caducado');
      throw unauthorized();
    }

    if (!payload.sub || payload.role !== 'authenticated') throw unauthorized();
    return { id: payload.sub, email: typeof payload.email === 'string' ? payload.email : null };
  };
}
