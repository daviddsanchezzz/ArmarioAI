import type { Logger } from './lib/logger.js';
import type { GarmentProcessor } from './jobs/garmentProcessor.js';
import type { GarmentRepository } from './repositories/garments.repository.js';
import type { StorageService } from './services/storage.service.js';
import type { AuthUser, TokenVerifier } from './services/tokenVerifier.js';

/** Servicios que actúan como el usuario (RLS). Se crean en cada petición. */
export interface UserScope {
  garments: GarmentRepository;
  storage: StorageService;
}

/** Servicios con privilegios de service_role. */
export interface AdminServices {
  storage: StorageService;
  deleteUser(userId: string): Promise<void>;
}

export interface AppDeps {
  logger: Logger;
  corsOrigins: string[];
  verifyToken: TokenVerifier;
  forUser(accessToken: string, user: AuthUser): UserScope;
  admin: AdminServices;
  processor: GarmentProcessor;
}

export interface RequestContext {
  user: AuthUser;
  scope: UserScope;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ctx?: RequestContext;
    }
  }
}
