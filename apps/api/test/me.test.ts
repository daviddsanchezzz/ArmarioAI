import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { authHeader, FakeBackend, USER_A, USER_B } from './fakes.js';

describe('/me', () => {
  it('devuelve el usuario de la sesión', async () => {
    const app = createApp(new FakeBackend().deps());
    const res = await request(app).get('/me').set(authHeader(USER_A)).expect(200);
    expect(res.body).toEqual({ id: USER_A.id, email: USER_A.email });
  });

  it('DELETE borra ficheros, prendas y cuenta solo de ese usuario', async () => {
    const backend = new FakeBackend();
    const app = createApp(backend.deps());

    for (const user of [USER_A, USER_B]) {
      const upload = await request(app).post('/garments/upload-url').set(authHeader(user));
      backend.files.add(upload.body.path);
      await request(app).post('/garments').set(authHeader(user)).send({ garmentId: upload.body.garmentId });
    }
    // Un fichero subido sin prenda creada también debe borrarse.
    backend.files.add(`${USER_A.id}/huerfano/original.jpg`);

    await request(app).delete('/me').set(authHeader(USER_A)).expect(204);

    expect(backend.deletedUsers).toEqual([USER_A.id]);
    expect([...backend.files].every((path) => path.startsWith(USER_B.id))).toBe(true);
    expect([...backend.rows.values()].map((row) => row.user_id)).toEqual([USER_B.id]);
    await request(app).get('/garments').set(authHeader(USER_A)).expect(401);
  });
});
