import type { ErrorCode } from '@niwa/contracts';

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  REGISTRATION_CLOSED: 403,
  AI_DISABLED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VERSION_CONFLICT: 409,
  AI_KEY_MISSING: 409,
  AI_KEY_INVALID: 422,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
  NOT_CONFIGURED: 503,
  INTERNAL_ERROR: 500,
};

/** Expected, client-facing error. Anything else becomes INTERNAL_ERROR. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }
}

export const notFound = (what = 'Resource') => new AppError('NOT_FOUND', `${what} not found`);
export const unauthorized = (message = 'Authentication required') => new AppError('UNAUTHORIZED', message);
