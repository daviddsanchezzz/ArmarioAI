import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { AppDeps } from './deps.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { userRateLimit } from './middleware/rateLimit.js';
import { garmentsRouter } from './routes/garments.routes.js';
import { meRouter } from './routes/me.routes.js';

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: deps.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));
  app.use(pinoHttp({ logger: deps.logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use(requireAuth(deps));
  app.use(userRateLimit({ windowMs: 15 * 60 * 1000, limit: 600 }));
  app.use('/garments', garmentsRouter(deps));
  app.use('/me', meRouter(deps));

  app.use(notFoundHandler);
  app.use(errorHandler(deps.logger));
  return app;
}
