import { gunzipSync, gzipSync } from 'node:zlib';
import mongoose from 'mongoose';

/**
 * Portable database backup (OPS.md §9): gzip'd NDJSON with Extended JSON documents, so ObjectIds,
 * dates and binary survive and any Node/Mongo version can read it — no mongodump binary needed.
 *
 * Line 1 is a header; every other line is `{ "c": collection, "d": document }`.
 */

export const BACKUP_FORMAT = 'niwa-backup';
export const BACKUP_VERSION = 1;

const { EJSON } = mongoose.mongo.BSON;
type Db = mongoose.mongo.Db;
type Doc = mongoose.mongo.Document;

export interface BackupHeader {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: string;
  database: string;
  collections: Record<string, number>;
}

export async function exportDatabase(
  db: Db,
  now = new Date(),
): Promise<{ data: Buffer; header: BackupHeader }> {
  const names = (await db.listCollections({ type: 'collection' }, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'))
    .sort();
  const header: BackupHeader = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: now.toISOString(),
    database: db.databaseName,
    collections: {},
  };
  const lines: string[] = [];
  for (const name of names) {
    let count = 0;
    for await (const doc of db.collection(name).find({}, { sort: { _id: 1 } })) {
      lines.push(EJSON.stringify({ c: name, d: doc }, { relaxed: false }));
      count++;
    }
    header.collections[name] = count;
  }
  const body = [JSON.stringify(header), ...lines].join('\n') + '\n';
  return { data: gzipSync(body), header };
}

export function readHeader(data: Buffer): BackupHeader {
  const text = gunzipSync(data).toString('utf8');
  return parseHeader(text.slice(0, text.indexOf('\n')));
}

function parseHeader(line: string): BackupHeader {
  const header = JSON.parse(line) as BackupHeader;
  if (header.format !== BACKUP_FORMAT) throw new Error('Not a NIWA backup file');
  if (header.version > BACKUP_VERSION)
    throw new Error(`Backup version ${header.version} is newer than this tool`);
  return header;
}

export interface RestoreOptions {
  /** Empty the backed-up collections first. Without it, restoring into non-empty collections is refused. */
  drop?: boolean;
  batchSize?: number;
}

/** Restores a backup into `db`. Indexes are not in the file — run `syncIndexes()` afterwards. */
export async function restoreDatabase(
  db: Db,
  data: Buffer,
  opts: RestoreOptions = {},
): Promise<BackupHeader> {
  const lines = gunzipSync(data).toString('utf8').split('\n');
  const header = parseHeader(lines[0]!);
  const names = Object.keys(header.collections);

  for (const name of names) {
    const existing = await db.collection(name).estimatedDocumentCount();
    if (existing === 0) continue;
    if (!opts.drop) throw new Error(`Collection "${name}" is not empty — pass drop to replace it`);
    await db.collection(name).deleteMany({});
  }

  const batchSize = opts.batchSize ?? 500;
  const pending = new Map<string, Doc[]>();
  const restored: Record<string, number> = {};
  const flush = async (name: string) => {
    const docs = pending.get(name);
    if (!docs?.length) return;
    await db.collection(name).insertMany(docs, { ordered: true });
    restored[name] = (restored[name] ?? 0) + docs.length;
    pending.set(name, []);
  };

  for (const line of lines.slice(1)) {
    if (!line) continue;
    const { c, d } = EJSON.parse(line, { relaxed: false }) as { c: string; d: Doc };
    const docs = pending.get(c) ?? [];
    docs.push(d);
    pending.set(c, docs);
    if (docs.length >= batchSize) await flush(c);
  }
  for (const name of pending.keys()) await flush(name);

  for (const name of names) {
    if ((restored[name] ?? 0) !== header.collections[name]) {
      throw new Error(
        `Restored ${restored[name] ?? 0} of ${header.collections[name]} documents in "${name}"`,
      );
    }
  }
  return header;
}
