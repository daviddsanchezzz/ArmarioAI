import { Router } from 'express';
import type { AppDeps } from '../deps.js';
import { getContext } from '../middleware/auth.js';
import { userRateLimit } from '../middleware/rateLimit.js';

export function meRouter(deps: AppDeps): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const { user } = getContext(req);
    res.json({ id: user.id, email: user.email });
  });

  /**
   * Borra todos los datos del usuario: primero los ficheros (si falla, se
   * puede reintentar) y después la cuenta, que borra las filas en cascada.
   */
  router.delete('/', userRateLimit({ windowMs: 60 * 60 * 1000, limit: 5 }), async (req, res) => {
    const { user } = getContext(req);
    const removedFiles = await deps.admin.storage.removeFolder(user.id);
    await deps.admin.deleteUser(user.id);
    deps.logger.info({ userId: user.id, removedFiles }, 'Cuenta borrada');
    res.status(204).end();
  });

  return router;
}
