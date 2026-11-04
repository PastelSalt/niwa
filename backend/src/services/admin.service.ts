import { AppError, notFound } from '../lib/errors.ts';
import { usageOf } from '../lib/quota.ts';
import { UserModel, type UserDoc } from '../models/user.model.ts';
import { refreshSessionRepo } from '../repositories/refreshSession.repo.ts';
import { userRepo } from '../repositories/user.repo.ts';
import { purgeAccount } from './auth.service.ts';

/**
 * Operator tools for a shared server (GAPS "Multi-user readiness" › admin basics). Used only from
 * `scripts/admin.ts` on the operator's machine — there is no admin HTTP endpoint on purpose.
 */
export interface AccountRow {
  email: string;
  createdAt: string;
  items: number;
  imageMB: number;
  disabled: string;
}

async function byEmail(email: string): Promise<UserDoc> {
  const user = await userRepo.findByEmail(email.trim().toLowerCase());
  if (!user) throw notFound('Account');
  return user;
}

export const adminService = {
  async list(): Promise<AccountRow[]> {
    const users = await UserModel.find({}).sort({ createdAt: 1 }).lean<UserDoc[]>();
    return Promise.all(
      users.map(async (u) => {
        const usage = await usageOf(u.workspaceId);
        return {
          email: u.email,
          createdAt: u.createdAt.toISOString().slice(0, 10),
          items: usage.items,
          imageMB: Math.round((usage.imageBytes / 1024 / 1024) * 10) / 10,
          disabled: u.disabledAt
            ? `${u.disabledAt.toISOString().slice(0, 10)} ${u.disabledReason ?? ''}`.trim()
            : '',
        };
      }),
    );
  },

  /** Blocks sign-in and signs the account out everywhere (access tokens lapse within their ≤ 15 min TTL). */
  async disable(email: string, reason: string | null): Promise<void> {
    const user = await byEmail(email);
    await userRepo.update(user._id, { disabledAt: new Date(), disabledReason: reason });
    await refreshSessionRepo.revokeAllForUser(user._id, new Date());
  },

  async enable(email: string): Promise<void> {
    const user = await byEmail(email);
    await userRepo.update(user._id, { disabledAt: null, disabledReason: null });
  },

  /** Same deletion as the user's own "Delete account", without the password. `confirm` must repeat the email. */
  async delete(email: string, confirm: string): Promise<void> {
    if (confirm.trim().toLowerCase() !== email.trim().toLowerCase()) {
      throw new AppError('VALIDATION_ERROR', 'Repeat the email after --confirm to delete an account.');
    }
    await purgeAccount(await byEmail(email));
  },
};
