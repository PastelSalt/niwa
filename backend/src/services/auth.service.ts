import { ROOT_CONTAINERS, type AuthResponse, type LoginInput, type RegisterInput } from '@niwa/contracts';
import { hash, verify } from '@node-rs/argon2';
import type { AppConfig } from '../config/env.ts';
import { AppError, unauthorized } from '../lib/errors.ts';
import type { UserDoc } from '../models/user.model.ts';
import { itemRepo } from '../repositories/item.repo.ts';
import { userRepo } from '../repositories/user.repo.ts';
import { workspaceRepo } from '../repositories/workspace.repo.ts';
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

  async function assertRegistrationAllowed() {
    if (config.REGISTRATION_MODE === 'open') return;
    if (config.REGISTRATION_MODE === 'first_user_only' && (await userRepo.count()) === 0) return;
    throw new AppError('REGISTRATION_CLOSED', 'Registration is closed for this NIWA instance.');
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
        await itemRepo.createRootContainers(workspace._id, ROOT_CONTAINERS);
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
      return startSession(user, client);
    },

    async refresh(refreshToken: string): Promise<Session> {
      const rotated = await tokens.rotateRefresh(refreshToken);
      const user = await userRepo.findById(rotated.userId);
      if (!user) throw unauthorized('Session expired. Please log in again.');
      return buildSession(user, rotated.token, rotated.expiresAt);
    },

    logout(refreshToken: string): Promise<void> {
      return tokens.revokeRefresh(refreshToken);
    },

    async me(userId: string) {
      const user = await userRepo.findById(userId);
      if (!user) throw unauthorized();
      return toPublicUser(user);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
