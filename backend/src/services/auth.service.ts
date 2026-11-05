import {
  ACCOUNT_EXPORT_FORMAT,
  ROOT_CONTAINERS,
  STARTER_FOLDERS,
  type AccountExport,
  type AuthConfig,
  type AuthResponse,
  type ChangePasswordInput,
  type LoginInput,
  type OnboardingInput,
  type PreferencesInput,
  type RegisterInput,
} from '@niwa/contracts';
import { hash, verify } from '@node-rs/argon2';
import { holidayService } from './holiday.service.ts';
import type { AppConfig } from '../config/env.ts';
import { AppError, unauthorized } from '../lib/errors.ts';
import { AttachmentModel } from '../models/attachment.model.ts';
import { ItemModel } from '../models/item.model.ts';
import { LinkModel } from '../models/link.model.ts';
import { RefreshSessionModel } from '../models/refreshSession.model.ts';
import { ScheduleEntryModel, ScheduleSeriesModel } from '../models/schedule.model.ts';
import type { UserDoc } from '../models/user.model.ts';
import { WorkspaceModel } from '../models/workspace.model.ts';
import { itemRepo } from '../repositories/item.repo.ts';
import { userRepo } from '../repositories/user.repo.ts';
import { workspaceRepo } from '../repositories/workspace.repo.ts';
import { usageOf } from '../lib/quota.ts';
import { attachmentService } from './attachment.service.ts';
import { toPublicUser } from './serializers.ts';
import type { ClientKind, TokenService } from './token.service.ts';

// Argon2id with OWASP-recommended minimums.
const ARGON_OPTS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

// Verified against when the email is unknown, so timing doesn't reveal which accounts exist.
const DUMMY_HASH_PROMISE = hash('niwa-timing-equalizer', ARGON_OPTS);

export interface Session {
  response: AuthResponse;
  refreshToken: string;
  refreshExpiresAt: Date;
}

/** Disabled accounts can't sign in or refresh (operator action, scripts/admin.ts). */
function assertEnabled(user: UserDoc): void {
  if (user.disabledAt) {
    throw new AppError(
      'ACCOUNT_DISABLED',
      'This account has been disabled. If you think this is a mistake, email zoletakyle.1111@gmail.com.',
    );
  }
}

export function createAuthService(config: AppConfig, tokens: TokenService) {
  async function startSession(user: UserDoc, client: ClientKind): Promise<Session> {
    const refresh = await tokens.issueRefresh(user._id, client);
    return buildSession(user, refresh.token, refresh.expiresAt);
  }

  async function buildSession(user: UserDoc, refreshToken: string, refreshExpiresAt: Date): Promise<Session> {
    const accessToken = await tokens.signAccess({
      userId: user._id.toString(),
      workspaceId: user.workspaceId.toString(),
    });
    return {
      response: { accessToken, expiresIn: tokens.accessTtlSeconds, user: toPublicUser(user) },
      refreshToken,
      refreshExpiresAt,
    };
  }

  async function registrationOpen(): Promise<boolean> {
    if (config.REGISTRATION_MODE === 'open') return true;
    return config.REGISTRATION_MODE === 'first_user_only' && (await userRepo.count()) === 0;
  }

  async function assertRegistrationAllowed() {
    if (await registrationOpen()) return;
    throw new AppError('REGISTRATION_CLOSED', 'Registration is closed for this NIWA instance.');
  }

  /** Re-checks the password for sensitive account actions; same message as a failed login. */
  async function verifiedUser(userId: string, password: string): Promise<UserDoc> {
    const user = await userRepo.findById(userId);
    if (!user) throw unauthorized();
    if (!(await verify(user.passwordHash, password))) {
      throw new AppError('INVALID_CREDENTIALS', 'Password is incorrect.');
    }
    return user;
  }

  return {
    async register(input: RegisterInput, client: ClientKind): Promise<Session> {
      await assertRegistrationAllowed();
      if (await userRepo.findByEmail(input.email)) {
        throw new AppError('CONFLICT', 'An account with this email already exists.');
      }

      const passwordHash = await hash(input.password, ARGON_OPTS);
      const workspace = await workspaceRepo.create('My garden');
      try {
        await itemRepo.createRootContainers(
          workspace._id,
          input.starter === 'simple' ? STARTER_FOLDERS : ROOT_CONTAINERS,
        );
        const user = await userRepo.create({ email: input.email, passwordHash, workspaceId: workspace._id });
        return await startSession(user, client);
      } catch (err) {
        // No multi-document transaction yet: undo the partial workspace on failure.
        await itemRepo.deleteAllInWorkspace(workspace._id);
        await workspaceRepo.deleteById(workspace._id);
        throw err;
      }
    },

    async login(input: LoginInput, client: ClientKind): Promise<Session> {
      const user = await userRepo.findByEmail(input.email);
      const ok = await verify(user?.passwordHash ?? (await DUMMY_HASH_PROMISE), input.password);
      if (!user || !ok) throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect.');
      assertEnabled(user);
      return startSession(user, client);
    },

    async refresh(refreshToken: string): Promise<Session> {
      const rotated = await tokens.rotateRefresh(refreshToken);
      const user = await userRepo.findById(rotated.userId);
      if (!user) throw unauthorized('Session expired. Please log in again.');
      assertEnabled(user);
      return buildSession(user, rotated.token, rotated.expiresAt);
    },

    logout(refreshToken: string): Promise<void> {
      return tokens.revokeRefresh(refreshToken);
    },

    /** Sign out on every device (A-02 MA9). */
    async logoutAll(userId: string): Promise<void> {
      await tokens.revokeAllForUser(userId);
    },

    async me(userId: string) {
      const user = await userRepo.findById(userId);
      if (!user) throw unauthorized();
      return toPublicUser(user);
    },

    async config(): Promise<AuthConfig> {
      return { registrationOpen: await registrationOpen() };
    },

    async setOnboarding(userId: string, input: OnboardingInput) {
      const user = await userRepo.update(userId, { onboarding: { ...input, at: new Date() } });
      if (!user) throw unauthorized();
      return toPublicUser(user);
    },

    /** Appearance choices (B-02 V10): a partial update merged into what's stored. */
    async setPreferences(userId: string, input: PreferencesInput) {
      const current = await userRepo.findById(userId);
      if (!current) throw unauthorized();
      const { holidays: holidayInput, ...rest } = input;
      const holidays = holidayInput && { ...current.preferences?.holidays, ...holidayInput };
      if (holidays) {
        // A new country clears a region that belonged to the old one.
        if (holidayInput.country !== undefined && holidayInput.region === undefined) holidays.region = null;
        holidayService.validate({ country: holidays.country ?? null, region: holidays.region ?? null });
      }
      const user = await userRepo.update(userId, {
        preferences: { ...current.preferences, ...rest, ...(holidays && { holidays }) },
      });
      if (!user) throw unauthorized();
      return toPublicUser(user);
    },

    /** Other devices are signed out; the caller gets a fresh session so it stays signed in. */
    async changePassword(userId: string, input: ChangePasswordInput, client: ClientKind): Promise<Session> {
      const user = await verifiedUser(userId, input.currentPassword);
      const updated = await userRepo.update(user._id, {
        passwordHash: await hash(input.newPassword, ARGON_OPTS),
      });
      await tokens.revokeAllForUser(userId);
      return startSession(updated!, client);
    },

    async usage(userId: string) {
      const user = await userRepo.findById(userId);
      if (!user) throw unauthorized();
      return usageOf(user.workspaceId);
    },

    /** Everything the account owns, as plain JSON (NIWA-PLAN-B-01 B4). */
    async exportData(userId: string): Promise<AccountExport> {
      const user = await userRepo.findById(userId);
      if (!user) throw unauthorized();
      const wid = user.workspaceId;
      const plain = <T>(docs: T[]) => JSON.parse(JSON.stringify(docs)) as Record<string, unknown>[];
      const [workspace, items, links, entries, series, attachments] = await Promise.all([
        WorkspaceModel.findById(wid).lean(),
        ItemModel.find({ workspaceId: wid }).sort({ _id: 1 }).lean(),
        LinkModel.find({ workspaceId: wid }).sort({ _id: 1 }).lean(),
        ScheduleEntryModel.find({ workspaceId: wid }).sort({ _id: 1 }).lean(),
        ScheduleSeriesModel.find({ workspaceId: wid }).sort({ _id: 1 }).lean(),
        AttachmentModel.find({ workspaceId: wid }).sort({ _id: 1 }).lean(),
      ]);
      return {
        format: ACCOUNT_EXPORT_FORMAT,
        version: 1,
        exportedAt: new Date().toISOString(),
        account: { email: user.email, createdAt: user.createdAt.toISOString() },
        workspace: plain([workspace])[0] ?? {},
        items: plain(items),
        links: plain(links),
        scheduleEntries: plain(entries),
        scheduleSeries: plain(series),
        attachments: plain(attachments),
      };
    },

    /** Permanent: removes the user and everything in their workspace, images included. */
    async deleteAccount(userId: string, password: string): Promise<void> {
      await purgeAccount(await verifiedUser(userId, password));
    },
  };
}

/** Deletes a user and everything they own (account deletion and `scripts/admin.ts delete`). */
export async function purgeAccount(user: UserDoc): Promise<void> {
  const wid = user.workspaceId;
  const itemIds = (await ItemModel.find({ workspaceId: wid }, { _id: 1 }).lean()).map((i) => i._id);
  await attachmentService.purgeForItems(wid, itemIds);
  await AttachmentModel.deleteMany({ workspaceId: wid });
  await Promise.all([
    ScheduleEntryModel.deleteMany({ workspaceId: wid }),
    ScheduleSeriesModel.deleteMany({ workspaceId: wid }),
    LinkModel.deleteMany({ workspaceId: wid }),
    ItemModel.deleteMany({ workspaceId: wid }),
    RefreshSessionModel.deleteMany({ userId: user._id }),
  ]);
  await WorkspaceModel.deleteOne({ _id: wid });
  await userRepo.deleteById(user._id);
}

export type AuthService = ReturnType<typeof createAuthService>;
