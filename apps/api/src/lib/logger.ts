import { pino, type Logger } from 'pino';

export type { Logger };

export function createLogger(level: string, pretty: boolean): Logger {
  return pino({
    level,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    ...(pretty ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {}),
  });
}
