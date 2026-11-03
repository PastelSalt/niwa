import type { Logger } from 'pino';
import { ItemModel, type ItemDoc } from '../models/item.model.ts';
import { attachmentService } from './attachment.service.ts';
import { itemService } from './item.service.ts';

/** Periodic housekeeping — DATA_MODEL.md §5 (Trash retention) and §8 (attachment cleanup). */

export const TRASH_RETENTION_MS = 30 * 86_400_000;
const EVERY_MS = 6 * 3_600_000;

export const maintenanceService = {
  async run(now = new Date()) {
    const old = await ItemModel.find({
      deleteRoot: true,
      deletedAt: { $ne: null, $lt: new Date(now.getTime() - TRASH_RETENTION_MS) },
    })
      .select({ _id: 1, workspaceId: 1 })
      .lean<Pick<ItemDoc, '_id' | 'workspaceId'>[]>();
    let trashPurged = 0;
    for (const t of old) {
      trashPurged += (await itemService.purge(t.workspaceId.toString(), t._id.toString())).affected;
    }
    const attachments = await attachmentService.sweep(now);
    return { trashPurged, ...attachments };
  },

  /** Run now and then every 6 hours; never keeps the process alive on its own. */
  schedule(logger: Logger): () => void {
    const tick = () =>
      this.run()
        .then((r) => {
          if (r.trashPurged || r.orphans || r.pending) logger.info(r, 'Maintenance sweep');
        })
        .catch((err: unknown) => logger.error({ err }, 'Maintenance sweep failed'));
    void tick();
    const timer = setInterval(tick, EVERY_MS);
    timer.unref();
    return () => clearInterval(timer);
  },
};
