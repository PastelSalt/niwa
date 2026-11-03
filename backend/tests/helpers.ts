import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.ts';
import { loadConfig, type AppConfig } from '../src/config/env.ts';
import { createLogger } from '../src/lib/logger.ts';

let mongo: MongoMemoryServer | undefined;

export function testConfig(overrides: Record<string, string> = {}): AppConfig {
  return loadConfig({
    NODE_ENV: 'test',
    APP_ENV: 'test',
    MONGODB_URI: mongo?.getUri() ?? 'mongodb://unused',
    MONGODB_DB: 'niwa_test',
    JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-chars',
    ...overrides,
  });
}

export async function startDb(): Promise<void> {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'niwa_test', autoIndex: true });
  await mongoose.connection.syncIndexes();
}

export async function stopDb(): Promise<void> {
  await mongoose.disconnect();
  await mongo?.stop();
}

export async function resetDb(): Promise<void> {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export function buildApp(overrides: Record<string, string> = {}, fetchImpl?: typeof fetch) {
  const config = testConfig(overrides);
  return createApp({ config, logger: createLogger(config), redis: null, fetch: fetchImpl });
}

/** Pull the refresh cookie value out of a Set-Cookie header. */
export function refreshCookie(setCookie: string | string[] | undefined): string | undefined {
  const all = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return all.find((c) => c.startsWith('niwa_rt='))?.split(';')[0];
}
