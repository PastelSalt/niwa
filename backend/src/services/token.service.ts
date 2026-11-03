import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { Types } from 'mongoose';
import type { AppConfig } from '../config/env.ts';
import { unauthorized } from '../lib/errors.ts';
import type { RefreshSessionDoc } from '../models/refreshSession.model.ts';
import { refreshSessionRepo } from '../repositories/refreshSession.repo.ts';

export type ClientKind = RefreshSessionDoc['client'];

export interface AccessClaims {
  userId: string;
  workspaceId: string;
}

const ISSUER = 'niwa';
const AUDIENCE = 'niwa-api';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Access JWTs (short-lived, in memory on clients) + opaque rotating refresh tokens — specs §12.1. */
export function createTokenService(config: AppConfig) {
  const accessKey = new TextEncoder().encode(config.JWT_ACCESS_SECRET);
  const refreshTtlMs = config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

  async function issueRefresh(userId: Types.ObjectId, client: ClientKind, familyId: string = randomUUID()) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + refreshTtlMs);
    await refreshSessionRepo.create({ userId, familyId, tokenHash: hashToken(token), client, expiresAt });
    return { token, expiresAt };
  }

  return {
    accessTtlSeconds: config.ACCESS_TOKEN_TTL_SECONDS,
    refreshTtlMs,

    signAccess(claims: AccessClaims): Promise<string> {
      return new SignJWT({ wid: claims.workspaceId })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(claims.userId)
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${config.ACCESS_TOKEN_TTL_SECONDS}s`)
        .sign(accessKey);
    },

    async verifyAccess(token: string): Promise<AccessClaims> {
      try {
        const { payload } = await jwtVerify(token, accessKey, {
          issuer: ISSUER,
          audience: AUDIENCE,
          algorithms: ['HS256'],
        });
        if (typeof payload.sub !== 'string' || typeof payload.wid !== 'string') throw new Error('claims');
        return { userId: payload.sub, workspaceId: payload.wid };
      } catch {
        throw unauthorized('Invalid or expired access token');
      }
    },

    issueRefresh,

    /**
     * One-time use: consumes `token` and issues its successor in the same family.
     * A token that was already used means it leaked — revoke the whole family.
     */
    async rotateRefresh(token: string) {
      const now = new Date();
      const tokenHash = hashToken(token);
      const consumed = await refreshSessionRepo.consume(tokenHash, now);
      if (!consumed) {
        const existing = await refreshSessionRepo.findByHash(tokenHash);
        if (existing?.revokedAt) await refreshSessionRepo.revokeFamily(existing.familyId, now);
        throw unauthorized('Session expired. Please log in again.');
      }
      const next = await issueRefresh(consumed.userId, consumed.client, consumed.familyId);
      return { userId: consumed.userId, client: consumed.client, ...next };
    },

    async revokeRefresh(token: string): Promise<void> {
      const session = await refreshSessionRepo.findByHash(hashToken(token));
      if (session) await refreshSessionRepo.revokeFamily(session.familyId, new Date());
    },
  };
}

export type TokenService = ReturnType<typeof createTokenService>;
