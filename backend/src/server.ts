import { createApp } from './app.ts';
import { loadConfig } from './config/env.ts';
import { connectDb, disconnectDb } from './lib/db.ts';
import { createLogger } from './lib/logger.ts';
import { createRedis } from './lib/redis.ts';

const config = loadConfig();
const logger = createLogger(config);

await connectDb(config, logger);
const redis = createRedis(config, logger);
const app = createApp({ config, logger, redis });

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.APP_ENV }, 'NIWA API listening');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  server.close();
  await Promise.allSettled([disconnectDb(), redis?.quit()]);
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
