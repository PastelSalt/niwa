import type { FocusResponse, ItemSummary } from '@niwa/contracts';
import { describe, expect, it } from 'vitest';
import { dedupeFocus } from './focusSections.ts';

const item = (id: string) => ({ id, title: id }) as ItemSummary;

describe('dedupeFocus', () => {
  it('keeps each task once, in its most urgent section', () => {
    const data: FocusResponse = {
      overdue: [item('a')],
      inProgress: [item('a'), item('b')],
      highPriority: [item('a'), item('b'), item('c')],
      upcoming: [item('c'), item('d')],
      recentlyUpdated: [item('a'), item('d'), item('e')],
    };
    const ids = (k: keyof FocusResponse) => dedupeFocus(data)[k].map((i) => i.id);
    expect(ids('overdue')).toEqual(['a']);
    expect(ids('inProgress')).toEqual(['b']);
    expect(ids('highPriority')).toEqual(['c']);
    expect(ids('upcoming')).toEqual(['d']);
    expect(ids('recentlyUpdated')).toEqual(['e']);
  });
});
