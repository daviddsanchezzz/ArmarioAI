import { loadEnv } from './config/env.js';
import { createApp } from './app.js';
import type { AppDeps } from './deps.js';
import { createImmediateGarmentProcessor } from './jobs/garmentProcessor.js';
import { createLogger } from './lib/logger.js';
import { createAdminClient, createUserClient } from './lib/supabase.js';
import { createSupabaseGarmentRepository } from './repositories/garments.repository.js';
import { createSupabaseStorageService } from './services/storage.service.js';
import { createSupabaseTokenVerifier } from './services/tokenVerifier.js';

const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL, env.NODE_ENV === 'development');
const admin = createAdminClient(env);

const deps: AppDeps = {
  logger,
  corsOrigins: env.CORS_ORIGINS,
  verifyToken: createSupabaseTokenVerifier(env),
  forUser: (accessToken) => {
    const db = createUserClient(env, accessToken);
    return {
      garments: createSupabaseGarmentRepository(db),
      storage: createSupabaseStorageService(db, env.GARMENTS_BUCKET, env.SIGNED_URL_TTL_SECONDS),
    };
  },
  admin: {
    storage: createSupabaseStorageService(admin, env.GARMENTS_BUCKET, env.SIGNED_URL_TTL_SECONDS),
    deleteUser: async (userId) => {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
  },
  processor: createImmediateGarmentProcessor(admin, logger),
};

const server = createApp(deps).listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API de Armario escuchando');
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info({ signal }, 'Cerrando servidor');
    server.close(() => process.exit(0));
  });
}
