// Local dev without Atlas: boots an in-memory MongoDB, then the real server.
// Data is thrown away when the process exits. Also used by the Playwright e2e run.
import { randomBytes } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();

process.env.APP_ENV ??= 'local';
// Dev tooling often exports PORT for the web server; keep the API on its own port.
process.env.PORT = process.env.API_PORT ?? '4000';
process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB ??= 'niwa_memory';
process.env.JWT_ACCESS_SECRET ??= randomBytes(48).toString('base64url');
process.env.REGISTRATION_MODE ??= 'open';

const stop = () => void mongo.stop().finally(() => process.exit(0));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

await import('../src/server.ts');
