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

async function loginAs(app: Application, user: 'Deepak' | 'Aman') {
  const agent = request.agent(app);
  const code = user === 'Deepak' ? 'deepak-test-code-123' : 'aman-test-code-456';
  await agent.post('/api/auth/login').send({ user, authCode: code });
  return agent;
}

describe('Health check', () => {
  it('reports healthy status without leaking internals', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('Dashboard', () => {
  it('computes net balance from given/borrowed money', async () => {
    const deepak = await loginAs(app, 'Deepak');

    await deepak.post('/api/money').send({
      personName: 'Rahul',
      type: 'GIVEN',
      amount: 20000,
      transactionDate: '2025-01-15',
    });

    await deepak.post('/api/money').send({
      personName: 'Suresh',
      type: 'BORROWED',
      amount: 5000,
      transactionDate: '2025-01-16',
    });

    const res = await deepak.get('/api/dashboard/money');
    expect(res.status).toBe(200);
    expect(res.body.data.moneyToReceive).toBe(20000);
    expect(res.body.data.moneyToPay).toBe(5000);
    expect(res.body.data.netBalance).toBe(15000);
  });
});

describe('Security', () => {
  it('never returns auth codes in any response', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ user: 'Deepak', authCode: 'deepak-test-code-123' });

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('deepak-test-code-123');
  });

  it('sets no-store cache headers on authenticated financial endpoints', async () => {
    const deepak = await loginAs(app, 'Deepak');
    const res = await deepak.get('/api/ipos');
    expect(res.headers['cache-control']).toMatch(/no-store/);
  });

  it('applies CORS only for the configured frontend origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });
});
