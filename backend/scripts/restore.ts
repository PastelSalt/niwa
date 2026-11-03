// Restores a backup into MONGODB_URI / MONGODB_DB, then rebuilds indexes (OPS.md §9).
//   pnpm --filter @niwa/backend restore <file> --yes [--drop]
// Without --drop it refuses to touch non-empty collections. Run restore drills against staging.
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { readHeader, restoreDatabase } from '../src/lib/backup.ts';
// Register every model so their indexes can be rebuilt.
import '../src/models/attachment.model.ts';
import '../src/models/item.model.ts';
import '../src/models/link.model.ts';
import '../src/models/refreshSession.model.ts';
import '../src/models/schedule.model.ts';
import '../src/models/user.model.ts';
import '../src/models/workspace.model.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { yes: { type: 'boolean' }, drop: { type: 'boolean' } },
});
const file = positionals[0];
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? 'niwa_dev';
if (!file) throw new Error('Usage: restore <file> --yes [--drop]');
if (!uri) throw new Error('MONGODB_URI is required');

const data = await readFile(file);
const header = readHeader(data);
console.log(`Backup of ${header.database} taken ${header.createdAt}:`);
console.table(header.collections);
if (!values.yes) {
  console.log(
    `Dry run. Re-run with --yes to restore into "${dbName}"${values.drop ? ' (replacing its data)' : ''}.`,
  );
  process.exit(0);
}

await mongoose.connect(uri, { dbName, autoIndex: false, serverSelectionTimeoutMS: 15_000 });
try {
  await restoreDatabase(mongoose.connection.db!, data, { drop: values.drop });
  await mongoose.syncIndexes();
  console.log(`Restored into ${dbName}; indexes rebuilt.`);
} finally {
  await mongoose.disconnect();
}
