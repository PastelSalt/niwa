import mongoose from 'mongoose';
import type { Logger } from 'pino';
import type { AppConfig } from '../config/env.ts';

const autoIndex = (config: AppConfig) => config.APP_ENV === 'local' || config.APP_ENV === 'test';

/** Creates missing indexes and drops ones no schema declares; returns the dropped names per model. */
export async function syncIndexes(): Promise<Record<string, string[]>> {
  const result = (await mongoose.syncIndexes()) as Record<string, string[]>;
  return Object.fromEntries(Object.entries(result).filter(([, names]) => names.length > 0));
}

export async function connectDb(config: AppConfig, logger: Logger): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(config.MONGODB_URI, {
    dbName: config.MONGODB_DB,
    // Indexes are built automatically only for local/test; deployed envs use a migration step (OPS.md §7).
    autoIndex: autoIndex(config),
  });
  logger.info({ db: config.MONGODB_DB }, 'MongoDB connected');
  if (!autoIndex(config)) {
    // Deployed: bring indexes in line with the schemas on every start (creates missing ones, drops ones no
    // schema declares). Without this a fresh database would have no unique-email, TTL or per-account indexes.
    const dropped = await syncIndexes();
    logger.info({ dropped }, 'MongoDB indexes in sync');
  }
  return conn;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
