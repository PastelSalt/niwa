import type { RequestHandler } from 'express';
import { unauthorized } from '../lib/errors.ts';
import type { AccessClaims, TokenService } from '../services/token.service.ts';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      auth?: AccessClaims;
    }
  }
}

/** Bearer access token on every protected route — the API is the real authorization boundary (specs §13). */
export function requireAuth(tokens: TokenService): RequestHandler {
  return async (req, res, next) => {
    const header = req.get('authorization');
    if (!header?.startsWith('Bearer ')) throw unauthorized();
    res.locals.auth = await tokens.verifyAccess(header.slice('Bearer '.length));
    next();
  };
}

/** Claims set by requireAuth. Use only in handlers mounted behind it. */
export function authOf(locals: Express.Locals): AccessClaims {
  if (!locals.auth) throw unauthorized();
  return locals.auth;
}
