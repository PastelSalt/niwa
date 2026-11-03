import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

/** Fractional indexing helpers — specs §12.7, DATA_MODEL.md §4. Only the server mints keys. */

export function keyBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after);
}

export function keysAfter(last: string | null, count: number): string[] {
  return generateNKeysBetween(last, null, count);
}

/** Rebalance a sibling scope once any key grows past this. */
export const ORDER_KEY_REBALANCE_LENGTH = 50;
