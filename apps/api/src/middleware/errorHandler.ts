import type { ApiErrorBody } from '@armario/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, badRequest, notFound } from '../lib/errors.js';
import type { Logger } from '../lib/logger.js';

export const notFoundHandler: RequestHandler = (_req, _res, next) => next(notFound('Ruta no encontrada'));

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return badRequest(
      'Datos no válidos',
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  // Errores de body-parser (JSON mal formado, cuerpo demasiado grande…)
  if (typeof error === 'object' && error !== null && 'type' in error && 'status' in error) {
    const status = Number((error as { status: unknown }).status);
    if (status >= 400 && status < 500) return badRequest('Cuerpo de la petición no válido');
  }
  return new AppError('internal', 'Error interno');
}

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error, req, res, _next) => {
    const appError = toAppError(error);
    if (appError.status >= 500) {
      logger.error({ err: error, path: req.path, userId: req.ctx?.user.id }, 'Error no controlado');
    }

    const body: ApiErrorBody = {
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details !== undefined && appError.status < 500 ? { details: appError.details } : {}),
      },
    };
    res.status(appError.status).json(body);
  };
}
