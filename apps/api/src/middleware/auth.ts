import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AppDeps, RequestContext } from '../deps.js';
import { unauthorized } from '../lib/errors.js';

/** Exige un JWT de Supabase válido y prepara los servicios del usuario. */
export function requireAuth(deps: AppDeps): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const match = header?.match(/^Bearer\s+(.+)$/i);
    if (!match?.[1]) throw unauthorized('Falta el token de sesión');

    const accessToken = match[1];
    const user = await deps.verifyToken(accessToken);
    req.ctx = { user, scope: deps.forUser(accessToken, user) };
    next();
  };
}

export function getContext(req: Request): RequestContext {
  if (!req.ctx) throw unauthorized();
  return req.ctx;
}
