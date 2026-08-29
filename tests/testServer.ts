import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Application } from 'express';

let mongod: MongoMemoryServer;

/**
 * Starts an in-memory MongoDB instance, points MONGODB_URI at it, and
 * only then requires the app/config/database modules (which validate
 * and read env vars at import time). Must be called from beforeAll.
 */
export async function startTestApp(): Promise<{
  app: Application;
  connectDatabase: () => Promise<void>;
  disconnectDatabase: () => Promise<void>;
}> {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  // Require (not import) so this happens after MONGODB_URI is set.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createApp } = require('../src/app');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { connectDatabase, disconnectDatabase } = require('../src/config/database');

  await connectDatabase();
  const app = createApp();

  return { app, connectDatabase, disconnectDatabase };
}

export async function stopTestApp(disconnectDatabase: () => Promise<void>): Promise<void> {
  await disconnectDatabase();
  if (mongod) await mongod.stop();
}

export async function clearDatabase(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mongoose = require('mongoose');
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
