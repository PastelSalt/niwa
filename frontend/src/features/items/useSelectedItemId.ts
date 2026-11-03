import { useLocation } from 'react-router';

const ITEM_ROUTE = /^\/(?:knowledge|actionable)\/([a-f0-9]{24})(?:\/|$)/;

/** The item selected via `/{lens}/:itemId`, readable from layout components (tree, detail panel). */
export function useSelectedItemId(): string | undefined {
  return ITEM_ROUTE.exec(useLocation().pathname)?.[1];
}
