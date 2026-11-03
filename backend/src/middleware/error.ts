import type { ErrorEnvelope } from '@niwa/contracts';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, notFound } from '../lib/errors.ts';

export const notFoundHandler: RequestHandler = (req) => {
  throw notFound(`Route ${req.method} ${req.path}`);
};

/** Central error middleware: every failure leaves as one ErrorEnvelope — specs §11.2. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = String(req.id ?? '');
  let status = 500;
  let body: ErrorEnvelope = {
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.', requestId },
  };

  if (err instanceof AppError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message, details: err.details, requestId } };
  } else if (err instanceof ZodError) {
    status = 400;
    body = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request.',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        requestId,
      },
    };
  } else if (isBodyParserError(err)) {
    status = 400;
    body = { error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body.', requestId } };
  } else {
    req.log?.error({ err }, 'Unhandled error');
  }

  res.status(status).json(body);
};

function isBodyParserError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed';
}
