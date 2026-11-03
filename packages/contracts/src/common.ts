import { z } from 'zod';

/** Server-generated MongoDB ObjectId (24 hex chars). */
export const Id = z
  .string()
  .regex(/^[a-f0-9]{24}$/, 'Invalid id')
  .meta({ id: 'Id', example: '6745f0c2a1b2c3d4e5f60718' });

/** Calendar day with no timezone (`dueAt`, `reviewAt`) — specs §12.5. */
export const DateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
  }, 'Not a real calendar date')
  .meta({ id: 'DateOnly', example: '2026-11-03' });

/** UTC instant in ISO 8601. */
export const IsoDateTime = z.iso
  .datetime({ offset: true })
  .meta({ id: 'IsoDateTime', example: '2026-11-03T09:30:00.000Z' });

export const ErrorCode = z
  .enum([
    'VALIDATION_ERROR',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'VERSION_CONFLICT',
    'RATE_LIMITED',
    'REGISTRATION_CLOSED',
    'INVALID_CREDENTIALS',
    'AI_KEY_MISSING',
    'AI_KEY_INVALID',
    'AI_DISABLED',
    'UPSTREAM_ERROR',
    'INTERNAL_ERROR',
  ])
  .meta({ id: 'ErrorCode' });
export type ErrorCode = z.infer<typeof ErrorCode>;

/** The one error shape every endpoint returns — specs §11.2. */
export const ErrorEnvelope = z
  .object({
    error: z.object({
      code: ErrorCode,
      message: z.string(),
      details: z.unknown().optional(),
      requestId: z.string().optional(),
    }),
  })
  .meta({ id: 'ErrorEnvelope' });
export type ErrorEnvelope = z.infer<typeof ErrorEnvelope>;

export const IdParams = z.object({ id: Id });

export const OkResponse = z.object({ ok: z.literal(true) }).meta({ id: 'OkResponse' });

export const HealthResponse = z
  .object({ status: z.literal('ok'), env: z.string(), time: IsoDateTime })
  .meta({ id: 'HealthResponse' });
export type HealthResponse = z.infer<typeof HealthResponse>;
