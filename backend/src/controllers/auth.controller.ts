import {
  CSRF_HEADER,
  CSRF_HEADER_VALUE,
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  NATIVE_CLIENT_HEADER,
  REFRESH_COOKIE,
  OnboardingInput,
  RefreshInput,
  RegisterInput,
} from '@niwa/contracts';
import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import type { AppConfig } from '../config/env.ts';
import { AppError, unauthorized } from '../lib/errors.ts';
import { parse } from '../lib/parse.ts';
import { authOf } from '../middleware/auth.ts';
import type { AuthService, Session } from '../services/auth.service.ts';
import type { ClientKind } from '../services/token.service.ts';

const COOKIE_PATH = '/api/v1/auth';

/**
 * Web keeps the refresh token in an HttpOnly cookie; desktop/mobile identify themselves with
 * `X-Client` and receive it in the body for their secure storage — specs §12.1.
 */
function clientOf(req: Request): ClientKind {
  const v = req.get(NATIVE_CLIENT_HEADER);
  return v === 'desktop' || v === 'mobile' ? v : 'web';
}

export function createAuthController(config: AppConfig, auth: AuthService) {
  const cookieOptions = (): CookieOptions => ({
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: 'lax',
    path: COOKIE_PATH,
  });

  function sendSession(res: Response, client: ClientKind, session: Session, status = 200) {
    if (client === 'web') {
      res.cookie(REFRESH_COOKIE, session.refreshToken, {
        ...cookieOptions(),
        expires: session.refreshExpiresAt,
      });
      res.status(status).json(session.response);
    } else {
      res.status(status).json({ ...session.response, refreshToken: session.refreshToken });
    }
  }

  /** Cookie-based calls must carry the custom header (CSRF guard, OPS.md §6.1). */
  function readRefreshToken(req: Request, client: ClientKind): string | undefined {
    if (client !== 'web') return parse(RefreshInput, req.body ?? {}).refreshToken;
    if (req.get(CSRF_HEADER) !== CSRF_HEADER_VALUE) {
      throw new AppError('FORBIDDEN', `Missing ${CSRF_HEADER} header.`);
    }
    const token: unknown = req.cookies?.[REFRESH_COOKIE];
    return typeof token === 'string' ? token : undefined;
  }

  const register: RequestHandler = async (req, res) => {
    const client = clientOf(req);
    sendSession(res, client, await auth.register(parse(RegisterInput, req.body), client), 201);
  };

  const login: RequestHandler = async (req, res) => {
    const client = clientOf(req);
    sendSession(res, client, await auth.login(parse(LoginInput, req.body), client));
  };

  const refresh: RequestHandler = async (req, res) => {
    const client = clientOf(req);
    const token = readRefreshToken(req, client);
    if (!token) throw unauthorized('No session.');
    try {
      sendSession(res, client, await auth.refresh(token));
    } catch (err) {
      if (client === 'web') res.clearCookie(REFRESH_COOKIE, cookieOptions());
      throw err;
    }
  };

  const logout: RequestHandler = async (req, res) => {
    const client = clientOf(req);
    const token = readRefreshToken(req, client);
    if (token) await auth.logout(token);
    if (client === 'web') res.clearCookie(REFRESH_COOKIE, cookieOptions());
    res.status(204).end();
  };

  /** Revokes every session of the signed-in user; clears this browser's cookie too. */
  const logoutAll: RequestHandler = async (req, res) => {
    await auth.logoutAll(authOf(res.locals).userId);
    if (clientOf(req) === 'web') res.clearCookie(REFRESH_COOKIE, cookieOptions());
    res.status(204).end();
  };

  const me: RequestHandler = async (_req, res) => {
    res.json({ user: await auth.me(authOf(res.locals).userId) });
  };

  const config_: RequestHandler = async (_req, res) => {
    res.json(await auth.config());
  };

  const setOnboarding: RequestHandler = async (req, res) => {
    res.json({ user: await auth.setOnboarding(authOf(res.locals).userId, parse(OnboardingInput, req.body)) });
  };

  const changePassword: RequestHandler = async (req, res) => {
    const client = clientOf(req);
    const input = parse(ChangePasswordInput, req.body);
    sendSession(res, client, await auth.changePassword(authOf(res.locals).userId, input, client));
  };

  const exportData: RequestHandler = async (_req, res) => {
    const data = await auth.exportData(authOf(res.locals).userId);
    const day = data.exportedAt.slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="niwa-export-${day}.json"`);
    res.json(data);
  };

  const deleteAccount: RequestHandler = async (req, res) => {
    const { password } = parse(DeleteAccountInput, req.body);
    await auth.deleteAccount(authOf(res.locals).userId, password);
    if (clientOf(req) === 'web') res.clearCookie(REFRESH_COOKIE, cookieOptions());
    res.status(204).end();
  };

  return {
    register,
    login,
    refresh,
    logout,
    logoutAll,
    me,
    config: config_,
    setOnboarding,
    changePassword,
    exportData,
    deleteAccount,
  };
}
