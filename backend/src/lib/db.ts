import mongoose from 'mongoose';
import type { Logger } from 'pino';
import type { AppConfig } from '../config/env.ts';

export async function connectDb(config: AppConfig, logger: Logger): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(config.MONGODB_URI, {
    dbName: config.MONGODB_DB,
    // Indexes are built automatically only for local/test; deployed envs use a migration step (OPS.md §7).
    autoIndex: config.APP_ENV === 'local' || config.APP_ENV === 'test',
  });
  logger.info({ db: config.MONGODB_DB }, 'MongoDB connected');
  return conn;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
