import { createGarmentSchema, listGarmentsQuerySchema, updateGarmentSchema } from '@armario/shared';
import { Router, type Request } from 'express';
import { z } from 'zod';
import type { AppDeps } from '../deps.js';
import { badRequest } from '../lib/errors.js';
import { getContext } from '../middleware/auth.js';
import { userRateLimit } from '../middleware/rateLimit.js';
import { GarmentsService } from '../services/garments.service.js';

const idParam = (req: Request) => {
  const parsed = z.uuid().safeParse(req.params.id);
  if (!parsed.success) throw badRequest('Id de prenda no válido');
  return parsed.data;
};

export function garmentsRouter(deps: AppDeps): Router {
  const router = Router();
  const service = (req: Request) => new GarmentsService(getContext(req), deps.processor, deps.logger);

  router.post('/upload-url', userRateLimit({ windowMs: 60 * 60 * 1000, limit: 60 }), async (req, res) => {
    res.status(201).json(await service(req).createUploadUrl());
  });

  router.post('/', async (req, res) => {
    const input = createGarmentSchema.parse(req.body);
    res.status(201).json(await service(req).create(input));
  });

  router.get('/', async (req, res) => {
    const query = listGarmentsQuerySchema.parse(req.query);
    res.json(await service(req).list(query));
  });

  router.get('/:id', async (req, res) => {
    res.json(await service(req).get(idParam(req)));
  });

  router.patch('/:id', async (req, res) => {
    const patch = updateGarmentSchema.parse(req.body);
    res.json(await service(req).update(idParam(req), patch));
  });

  router.delete('/:id', async (req, res) => {
    await service(req).remove(idParam(req));
    res.status(204).end();
  });

  return router;
}
