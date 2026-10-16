import type { Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError } from '../lib/errors.js';

/**
 * Límite por usuario (va después de requireAuth). Almacén en memoria: vale
 * mientras haya una sola instancia de la API.
 */
export function userRateLimit(options: { windowMs: number; limit: number }) {
  return rateLimit({
    ...options,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.ctx?.user.id ?? 'anonymous',
    handler: (_req, _res, next) => next(new AppError('rate_limited', 'Demasiadas peticiones, espera un poco')),
  });
}
