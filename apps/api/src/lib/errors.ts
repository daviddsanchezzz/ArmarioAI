import type { ApiErrorCode } from '@armario/shared';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
};

export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.status = STATUS_BY_CODE[code];
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError('bad_request', message, details);
export const unauthorized = (message = 'Sesión no válida') => new AppError('unauthorized', message);
export const notFound = (message = 'No encontrado') => new AppError('not_found', message);
export const conflict = (message: string) => new AppError('conflict', message);
