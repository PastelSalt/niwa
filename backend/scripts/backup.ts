// Writes a portable backup of MONGODB_URI / MONGODB_DB (OPS.md §9).
//   pnpm --filter @niwa/backend backup [--out path]
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { exportDatabase } from '../src/lib/backup.ts';

const { values } = parseArgs({ options: { out: { type: 'string' } } });
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? 'niwa_dev';
if (!uri) throw new Error('MONGODB_URI is required');

await mongoose.connect(uri, { dbName, autoIndex: false, serverSelectionTimeoutMS: 15_000 });
try {
  const { data, header } = await exportDatabase(mongoose.connection.db!);
  const stamp = header.createdAt.replace(/[:.]/g, '-');
  const out = values.out ?? `backups/niwa-${dbName}-${stamp}.ndjson.gz`;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, data);
  const total = Object.values(header.collections).reduce((a, b) => a + b, 0);
  console.log(`Backed up ${total} documents from ${dbName} → ${out} (${(data.length / 1024).toFixed(1)} KB)`);
  console.table(header.collections);
} finally {
  await mongoose.disconnect();
}
