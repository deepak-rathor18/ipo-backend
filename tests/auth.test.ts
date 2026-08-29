import request from 'supertest';
import type { Application } from 'express';
import { startTestApp, stopTestApp, clearDatabase } from './testServer';

let app: Application;
let disconnectDatabase: () => Promise<void>;

beforeAll(async () => {
  const ctx = await startTestApp();
  app = ctx.app;
  disconnectDatabase = ctx.disconnectDatabase;
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await stopTestApp(disconnectDatabase);
});

describe('Auth', () => {
  it('logs in Deepak with the correct auth code and sets an httpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ user: 'Deepak', authCode: 'deepak-test-code-123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Deepak');
    expect(res.body.data.authCode).toBeUndefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/HttpOnly/i);
  });

  it('logs in Aman with the correct auth code', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ user: 'Aman', authCode: 'aman-test-code-456' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Aman');
  });

  it('rejects an invalid auth code without revealing details', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ user: 'Deepak', authCode: 'wrong-code' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an unknown user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ user: 'Someone', authCode: 'whatever' });

    expect(res.status).toBe(400);
  });

  it('blocks protected routes without a session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid session and logs out cleanly', async () => {
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ user: 'Deepak', authCode: 'deepak-test-code-123' });

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.name).toBe('Deepak');

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);

    const meAfterLogout = await agent.get('/api/auth/me');
    expect(meAfterLogout.status).toBe(401);
  });
});
