import type { FontId, LayoutId, PatternId, ThemeId } from '@niwa/tokens';

/**
 * Messages between the landing page and its playground iframe (NIWA-PLAN-B-02 V11). Same origin only; both
 * sides check `event.origin` and `source`.
 */
export const PLAYGROUND_PATH = '/playground';

export interface PlaygroundAppearance {
  theme: ThemeId;
  font: FontId;
  mode: 'light' | 'dark';
  /** B-03 C1/C2: the layout preset and page pattern. */
  layout: LayoutId;
  pattern: PatternId;
}

export type ToPlayground = { source: 'niwa-landing'; type: 'appearance' } & PlaygroundAppearance;
export type FromPlayground = { source: 'niwa-playground'; type: 'ready' };

export function isToPlayground(e: MessageEvent): e is MessageEvent<ToPlayground> {
  return e.origin === window.location.origin && (e.data as ToPlayground | null)?.source === 'niwa-landing';
}

export function isFromPlayground(e: MessageEvent): e is MessageEvent<FromPlayground> {
  return (
    e.origin === window.location.origin && (e.data as FromPlayground | null)?.source === 'niwa-playground'
  );
}
