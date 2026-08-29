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

describe('Money & Repayments', () => {
  it('creates a money transaction visible to both users with PENDING status', async () => {
    const deepak = await loginAs(app, 'Deepak');
    const aman = await loginAs(app, 'Aman');

    const createRes = await deepak.post('/api/money').send({
      personName: 'Rahul',
      type: 'GIVEN',
      amount: 20000,
      transactionDate: '2025-01-15',
      dueDate: '2099-01-01',
      reason: 'Personal loan',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('PENDING');
    expect(createRes.body.data.remainingAmount).toBe(20000);

    const listRes = await aman.get('/api/money');
    expect(listRes.body.data).toHaveLength(1);
  });

  it('moves to PARTIALLY_PAID and then PAID as repayments are added', async () => {
    const deepak = await loginAs(app, 'Deepak');

    const createRes = await deepak.post('/api/money').send({
      personName: 'Rahul',
      type: 'GIVEN',
      amount: 10000,
      transactionDate: '2025-01-15',
    });

    const id = createRes.body.data.id;

    const partialRes = await deepak.post(`/api/money/${id}/repayments`).send({
      amount: 4000,
      paymentDate: '2025-02-01',
    });
    expect(partialRes.status).toBe(201);

    const afterPartial = await deepak.get(`/api/money/${id}`);
    expect(afterPartial.body.data.status).toBe('PARTIALLY_PAID');
    expect(afterPartial.body.data.remainingAmount).toBe(6000);

    await deepak.post(`/api/money/${id}/repayments`).send({
      amount: 6000,
      paymentDate: '2025-03-01',
    });

    const afterFull = await deepak.get(`/api/money/${id}`);
    expect(afterFull.body.data.status).toBe('PAID');
    expect(afterFull.body.data.remainingAmount).toBe(0);
  });

  it('rejects a repayment greater than the remaining amount', async () => {
    const deepak = await loginAs(app, 'Deepak');

    const createRes = await deepak.post('/api/money').send({
      personName: 'Rahul',
      type: 'GIVEN',
      amount: 5000,
      transactionDate: '2025-01-15',
    });

    const id = createRes.body.data.id;

    const overRes = await deepak.post(`/api/money/${id}/repayments`).send({
      amount: 5001,
      paymentDate: '2025-02-01',
    });

    expect(overRes.status).toBe(400);
    expect(overRes.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('marks a transaction OVERDUE when past due date and unpaid', async () => {
    const deepak = await loginAs(app, 'Deepak');

    const createRes = await deepak.post('/api/money').send({
      personName: 'Rahul',
      type: 'BORROWED',
      amount: 5000,
      transactionDate: '2020-01-01',
      dueDate: '2020-02-01',
    });

    expect(createRes.body.data.status).toBe('OVERDUE');
  });

  it('rejects a negative or zero amount', async () => {
    const deepak = await loginAs(app, 'Deepak');

    const res = await deepak.post('/api/money').send({
      personName: 'Rahul',
      type: 'GIVEN',
      amount: -100,
      transactionDate: '2025-01-15',
    });

    expect(res.status).toBe(400);
  });

  it('aggregates per-person totals correctly', async () => {
    const deepak = await loginAs(app, 'Deepak');

    const tx = await deepak.post('/api/money').send({
      personName: 'Rahul',
      type: 'GIVEN',
      amount: 10000,
      transactionDate: '2025-01-15',
    });

    await deepak.post(`/api/money/${tx.body.data.id}/repayments`).send({
      amount: 3000,
      paymentDate: '2025-02-01',
    });

    const personRes = await deepak.get('/api/people/Rahul');
    expect(personRes.status).toBe(200);
    expect(personRes.body.data.totalGiven).toBe(10000);
    expect(personRes.body.data.totalReceived).toBe(3000);
    expect(personRes.body.data.remainingAmount).toBe(7000);
  });
});
