import type { Garment, UploadUrlResponse } from '@armario/shared';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { authHeader, FakeBackend, USER_A, USER_B } from './fakes.js';

let backend: FakeBackend;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  backend = new FakeBackend();
  app = createApp(backend.deps());
});

/** Pide URL de subida, "sube" el fichero y crea la prenda. */
async function createGarment(user: typeof USER_A, tags: Record<string, unknown> = {}): Promise<Garment> {
  const upload = await request(app).post('/garments/upload-url').set(authHeader(user)).expect(201);
  const { garmentId, path } = upload.body as UploadUrlResponse;
  backend.files.add(path);
  const created = await request(app)
    .post('/garments')
    .set(authHeader(user))
    .send({ garmentId, ...tags })
    .expect(201);
  return created.body as Garment;
}

describe('autenticación', () => {
  it('deja pasar /health sin token', async () => {
    await request(app).get('/health').expect(200, { ok: true });
  });

  it('rechaza peticiones sin token o con token inválido', async () => {
    const missing = await request(app).get('/garments').expect(401);
    expect(missing.body.error.code).toBe('unauthorized');
    await request(app).get('/garments').set('Authorization', 'Bearer nope').expect(401);
  });
});

describe('POST /garments/upload-url', () => {
  it('devuelve una ruta dentro de la carpeta del usuario', async () => {
    const res = await request(app).post('/garments/upload-url').set(authHeader(USER_A)).expect(201);
    const body = res.body as UploadUrlResponse;
    expect(body.path).toBe(`${USER_A.id}/${body.garmentId}/original.jpg`);
    expect(body.signedUrl).toContain(body.path);
    expect(body.token).toBeTruthy();
  });
});

describe('POST /garments', () => {
  it('crea la prenda con sus etiquetas y la deja lista (fase 1)', async () => {
    const garment = await createGarment(USER_A, { category: 'top', colors: ['black'], formality: 2 });
    expect(garment).toMatchObject({
      category: 'top',
      colors: ['black'],
      formality: 2,
      status: 'ready',
      hasCutout: false,
    });
    expect(garment.imageUrl).toContain(`${USER_A.id}/${garment.id}/original.jpg`);
    expect(backend.enqueued).toEqual([garment.id]);
  });

  it('exige que la foto se haya subido antes', async () => {
    const upload = await request(app).post('/garments/upload-url').set(authHeader(USER_A));
    const res = await request(app)
      .post('/garments')
      .set(authHeader(USER_A))
      .send({ garmentId: upload.body.garmentId })
      .expect(400);
    expect(res.body.error.message).toMatch(/sube la foto/);
  });

  it('valida las etiquetas con Zod', async () => {
    const res = await request(app)
      .post('/garments')
      .set(authHeader(USER_A))
      .send({ garmentId: crypto.randomUUID(), formality: 9, colors: ['fucsia'] })
      .expect(400);
    expect(res.body.error.code).toBe('bad_request');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'formality' })]),
    );
  });

  it('si falla el encolado, devuelve la prenda en "processing"', async () => {
    backend.failEnqueue = true;
    const garment = await createGarment(USER_A);
    expect(garment.status).toBe('processing');
  });

  it('no permite registrar la foto de otro usuario', async () => {
    const upload = await request(app).post('/garments/upload-url').set(authHeader(USER_A));
    backend.files.add(upload.body.path);
    await request(app)
      .post('/garments')
      .set(authHeader(USER_B))
      .send({ garmentId: upload.body.garmentId })
      .expect(400);
  });
});

describe('GET /garments', () => {
  it('filtra por categoría, color y estación', async () => {
    await createGarment(USER_A, { category: 'top', colors: ['black'], seasons: ['winter'] });
    await createGarment(USER_A, { category: 'shoes', colors: ['white'], seasons: ['summer'] });
    await createGarment(USER_A, { category: 'top', colors: ['white'], seasons: ['summer'] });

    const tops = await request(app).get('/garments?category=top').set(authHeader(USER_A)).expect(200);
    expect(tops.body.items).toHaveLength(2);

    const whiteSummer = await request(app)
      .get('/garments?color=white&season=summer')
      .set(authHeader(USER_A))
      .expect(200);
    expect(whiteSummer.body.items).toHaveLength(2);

    const multi = await request(app).get('/garments?category=top,shoes&color=black').set(authHeader(USER_A));
    expect(multi.body.items).toHaveLength(1);
  });

  it('pagina con cursor', async () => {
    for (let i = 0; i < 3; i++) await createGarment(USER_A);

    const first = await request(app).get('/garments?limit=2').set(authHeader(USER_A)).expect(200);
    expect(first.body.items).toHaveLength(2);
    expect(first.body.nextCursor).toBeTruthy();

    const second = await request(app)
      .get('/garments')
      .query({ limit: 2, cursor: first.body.nextCursor })
      .set(authHeader(USER_A))
      .expect(200);
    expect(second.body.items).toHaveLength(1);
    expect(second.body.nextCursor).toBeNull();
  });

  it('solo devuelve las prendas del usuario', async () => {
    await createGarment(USER_A);
    const res = await request(app).get('/garments').set(authHeader(USER_B)).expect(200);
    expect(res.body.items).toEqual([]);
  });

  it('rechaza filtros desconocidos', async () => {
    await request(app).get('/garments?season=monzon').set(authHeader(USER_A)).expect(400);
  });
});

describe('GET/PATCH/DELETE /garments/:id', () => {
  it('edita etiquetas', async () => {
    const garment = await createGarment(USER_A);
    const res = await request(app)
      .patch(`/garments/${garment.id}`)
      .set(authHeader(USER_A))
      .send({ brand: 'Zara', seasons: ['autumn', 'winter'] })
      .expect(200);
    expect(res.body).toMatchObject({ brand: 'Zara', seasons: ['autumn', 'winter'] });
  });

  it('rechaza campos que el usuario no puede tocar', async () => {
    const garment = await createGarment(USER_A, { category: 'top' });
    await request(app)
      .patch(`/garments/${garment.id}`)
      .set(authHeader(USER_A))
      .send({ status: 'error' })
      .expect(400);
  });

  it('devuelve 404 con prendas ajenas', async () => {
    const garment = await createGarment(USER_A);
    await request(app).get(`/garments/${garment.id}`).set(authHeader(USER_B)).expect(404);
    await request(app).patch(`/garments/${garment.id}`).set(authHeader(USER_B)).send({ brand: 'x' }).expect(404);
    await request(app).delete(`/garments/${garment.id}`).set(authHeader(USER_B)).expect(404);
    expect(backend.rows.has(garment.id)).toBe(true);
  });

  it('valida el id', async () => {
    await request(app).get('/garments/no-es-un-uuid').set(authHeader(USER_A)).expect(400);
  });

  it('borra la fila y sus ficheros', async () => {
    const garment = await createGarment(USER_A);
    await request(app).delete(`/garments/${garment.id}`).set(authHeader(USER_A)).expect(204);
    expect(backend.rows.has(garment.id)).toBe(false);
    expect(backend.files.size).toBe(0);
    await request(app).get(`/garments/${garment.id}`).set(authHeader(USER_A)).expect(404);
  });
});
