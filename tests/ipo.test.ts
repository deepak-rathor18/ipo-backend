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

describe('IPO module', () => {
  it('lets Deepak create an IPO and Aman see it (shared data)', async () => {
    const deepak = await loginAs(app, 'Deepak');
    const aman = await loginAs(app, 'Aman');

    const createRes = await deepak.post('/api/ipos').send({
      ipoName: 'ABC Technologies IPO',
      companyName: 'ABC Technologies Ltd',
      appliedDate: '2025-01-10',
      dematName: 'Nanesh',
      applicationAmount: 60000,
      lotSize: 40,
      lotsApplied: 2,
      sharesApplied: 80,
      applicationPrice: 150,
      status: 'ALLOTTED',
      allottedShares: 200,
      allotmentPrice: 150,
      listingDate: '2025-01-22',
      listingPrice: 220,
      currentPrice: 235,
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.createdBy).toBe('Deepak');

    const listRes = await aman.get('/api/ipos');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].ipoName).toBe('ABC Technologies IPO');
  });

  it('computes financial fields correctly on the backend', async () => {
    const deepak = await loginAs(app, 'Deepak');

    const createRes = await deepak.post('/api/ipos').send({
      ipoName: 'Calc Test IPO',
      companyName: 'Calc Test Ltd',
      appliedDate: '2025-01-10',
      dematName: 'Nanesh',
      applicationAmount: 60000,
      lotSize: 40,
      lotsApplied: 2,
      sharesApplied: 80,
      applicationPrice: 150,
      status: 'ALLOTTED',
      allottedShares: 200,
      allotmentPrice: 150,
      listingDate: '2025-01-22',
      listingPrice: 220,
      currentPrice: 235,
    });

    const data = createRes.body.data;
    expect(data.actualInvestment).toBe(30000); // 200 * 150
    expect(data.listingValue).toBe(44000); // 200 * 220
    expect(data.listingProfitLoss).toBe(14000);
    expect(data.listingProfitPercentage).toBeCloseTo(46.67, 1);
    expect(data.currentValue).toBe(47000); // 200 * 235
    expect(data.currentProfitLoss).toBe(17000);
  });

  it('ignores any client-supplied computed financial values', async () => {
    const deepak = await loginAs(app, 'Deepak');

    const createRes = await deepak.post('/api/ipos').send({
      ipoName: 'Trust Test IPO',
      companyName: 'Trust Test Ltd',
      appliedDate: '2025-01-10',
      dematName: 'Nanesh',
      applicationAmount: 60000,
      lotSize: 40,
      lotsApplied: 2,
      sharesApplied: 80,
      applicationPrice: 150,
      status: 'ALLOTTED',
      allottedShares: 200,
      allotmentPrice: 150,
      listingPrice: 220,
      currentPrice: 235,
      actualInvestment: 999999,
      listingProfitLoss: 999999,
    });

    expect(createRes.body.data.actualInvestment).toBe(30000);
  });

  it('rejects negative amounts', async () => {
    const deepak = await loginAs(app, 'Deepak');

    const res = await deepak.post('/api/ipos').send({
      ipoName: 'Bad IPO',
      companyName: 'Bad Ltd',
      appliedDate: '2025-01-10',
      dematName: 'Nanesh',
      applicationAmount: -5000,
      lotSize: 40,
      lotsApplied: 2,
      sharesApplied: 80,
      applicationPrice: 150,
    });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('soft deletes an IPO so it disappears from the default list', async () => {
    const deepak = await loginAs(app, 'Deepak');

    const createRes = await deepak.post('/api/ipos').send({
      ipoName: 'Delete Me IPO',
      companyName: 'Delete Me Ltd',
      appliedDate: '2025-01-10',
      dematName: 'Nanesh',
      applicationAmount: 10000,
      lotSize: 10,
      lotsApplied: 1,
      sharesApplied: 10,
      applicationPrice: 100,
    });

    const id = createRes.body.data.id;

    const deleteRes = await deepak.delete(`/api/ipos/${id}`);
    expect(deleteRes.status).toBe(200);

    const listRes = await deepak.get('/api/ipos');
    expect(listRes.body.data.find((i: any) => i.id === id)).toBeUndefined();
  });

  it('filters by status and dematName', async () => {
    const deepak = await loginAs(app, 'Deepak');

    await deepak.post('/api/ipos').send({
      ipoName: 'Allotted IPO',
      companyName: 'A Ltd',
      appliedDate: '2025-01-10',
      dematName: 'Nanesh',
      applicationAmount: 10000,
      lotSize: 10,
      lotsApplied: 1,
      sharesApplied: 10,
      applicationPrice: 100,
      status: 'ALLOTTED',
      allottedShares: 10,
      allotmentPrice: 100,
    });

    await deepak.post('/api/ipos').send({
      ipoName: 'Not Allotted IPO',
      companyName: 'B Ltd',
      appliedDate: '2025-01-11',
      dematName: 'Aman',
      applicationAmount: 10000,
      lotSize: 10,
      lotsApplied: 1,
      sharesApplied: 10,
      applicationPrice: 100,
      status: 'NOT_ALLOTTED',
    });

    const res = await deepak.get('/api/ipos').query({ status: 'ALLOTTED' });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].ipoName).toBe('Allotted IPO');
  });
});
