// Operator tools for the shared server (GAPS "Multi-user readiness"). Runs against MONGODB_URI/MONGODB_DB.
//   pnpm --filter @niwa/backend admin list
//   pnpm --filter @niwa/backend admin disable <email> [--reason "spam"]
//   pnpm --filter @niwa/backend admin enable <email>
//   pnpm --filter @niwa/backend admin delete <email> --confirm <email>
//   pnpm --filter @niwa/backend admin indexes        (the server also does this on every deployed start)
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { loadConfig } from '../src/config/env.ts';
import { createCloudinary, setCloudinary } from '../src/lib/cloudinary.ts';
import { syncIndexes } from '../src/lib/db.ts';
import { setUploadFolder } from '../src/services/attachment.service.ts';
import { adminService } from '../src/services/admin.service.ts';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { reason: { type: 'string' }, confirm: { type: 'string' } },
});
const [command, email] = positionals;
const usage =
  'Usage: admin list | disable <email> [--reason text] | enable <email> | delete <email> --confirm <email> | indexes';

const config = loadConfig();
// Account deletion removes images too, so Cloudinary is configured as in the server.
setCloudinary(createCloudinary(config));
setUploadFolder(config.CLOUDINARY_FOLDER);

await mongoose.connect(config.MONGODB_URI, { dbName: config.MONGODB_DB, autoIndex: false });
try {
  switch (command) {
    case 'indexes':
      console.log('Dropped (not in any schema):', await syncIndexes());
      break;
    case 'list':
      console.table(await adminService.list());
      break;
    case 'disable':
      if (!email) throw new Error(usage);
      await adminService.disable(email, values.reason ?? null);
      console.log(`Disabled ${email} and signed it out everywhere.`);
      break;
    case 'enable':
      if (!email) throw new Error(usage);
      await adminService.enable(email);
      console.log(`Enabled ${email}.`);
      break;
    case 'delete':
      if (!email) throw new Error(usage);
      await adminService.delete(email, values.confirm ?? '');
      console.log(`Deleted ${email} and everything it owned.`);
      break;
    default:
      console.log(usage);
      process.exitCode = 1;
  }
} finally {
  await mongoose.disconnect();
}
