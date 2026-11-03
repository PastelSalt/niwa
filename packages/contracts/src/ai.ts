import { z } from 'zod';
import { ItemSummary } from './item.ts';

/** DeepSeek AI — specs §8, §12.10–11. The key is write-only: never returned. */

export const SetAiKeyInput = z
  .object({ apiKey: z.string().trim().min(10).max(512) })
  .meta({ id: 'SetAiKeyInput' });

export const AiSettingsInput = z.object({ aiEnabled: z.boolean() }).meta({ id: 'AiSettingsInput' });

export const AiStatusResponse = z
  .object({ aiEnabled: z.boolean(), hasKey: z.boolean(), provider: z.literal('deepseek') })
  .meta({ id: 'AiStatusResponse' });

export const AiActionInput = z
  .object({ includeChildren: z.boolean().default(false) })
  .meta({ id: 'AiActionInput', description: 'Only the targeted item (and optionally its children) is sent' });

export const SummarizeResponse = z.object({ summary: z.string() }).meta({ id: 'SummarizeResponse' });

export const BreakdownResponse = z
  .object({ drafts: z.array(ItemSummary).meta({ description: 'Created in Inbox as drafts, never filed' }) })
  .meta({ id: 'BreakdownResponse' });

export const AutoTagResponse = z.object({ suggestions: z.array(z.string()).max(5) }).meta({
  id: 'AutoTagResponse',
  description: 'Suggestions only; the client applies accepted tags via PATCH',
});
