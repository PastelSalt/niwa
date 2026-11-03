import type { z } from 'zod';

/** Parse request input with a contract schema. ZodErrors become 400 VALIDATION_ERROR in the error middleware. */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  return schema.parse(data);
}
