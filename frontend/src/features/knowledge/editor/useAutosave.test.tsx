import { ApiError, type ApiClient } from '@niwa/api-client';
import type { Item } from '@niwa/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Editor } from '@tiptap/react';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../auth/AuthProvider.tsx';
import { NotifierProvider } from '../../../components/Notifier.tsx';
import { itemKeys } from '../../items/queries.ts';
import { useAutosave } from './useAutosave.ts';

const doc = (text: string) => ({
  type: 'doc' as const,
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const baseItem = {
  id: 'a'.repeat(24),
  version: 1,
  content: doc('v1'),
} as unknown as Item;

function setup(update: ApiClient['items']['update']) {
  let body = doc('v1');
  const editor = {
    isDestroyed: false,
    getJSON: () => body,
    commands: { setContent: vi.fn((c) => (body = c)) },
  } as unknown as Editor;
  const api = {
    getSession: () => ({ accessToken: 't', user: {} }),
    onSessionChange: () => () => {},
    restoreSession: async () => null,
    items: { update },
  } as unknown as ApiClient;
  const qc = new QueryClient();
  qc.setQueryData(itemKeys.item(baseItem.id), { item: baseItem });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <AuthProvider api={api}>
        <NotifierProvider>{children}</NotifierProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
  const hook = renderHook(() => useAutosave(baseItem, editor), { wrapper });
  return { hook, qc, type: (t: string) => (body = doc(t)) };
}

const conflict = (current: Partial<Item>) =>
  new ApiError(409, {
    code: 'VERSION_CONFLICT',
    message: 'changed',
    details: { current: { ...baseItem, ...current } },
  });

describe('useAutosave', () => {
  it('saves against the latest cached version', async () => {
    const update = vi.fn(async (_id: string, input: { version: number }) => ({
      item: { ...baseItem, version: input.version + 1, content: doc('v2') },
    }));
    const { hook, qc, type } = setup(update as never);
    // A detail-panel edit bumped the cached version meanwhile.
    qc.setQueryData(itemKeys.item(baseItem.id), { item: { ...baseItem, version: 5 } });
    type('v2');
    await act(() => hook.result.current.flush());
    expect(update).toHaveBeenCalledWith(baseItem.id, { version: 5, content: doc('v2') });
    expect(hook.result.current.status).toBe('saved');
  });

  it('silently retries when the conflict was a field-only change', async () => {
    const update = vi
      .fn()
      .mockRejectedValueOnce(conflict({ version: 2, content: doc('v1') }))
      .mockResolvedValueOnce({ item: { ...baseItem, version: 3, content: doc('mine') } });
    const { hook, type } = setup(update);
    type('mine');
    await act(() => hook.result.current.flush());
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[1]![1]).toMatchObject({ version: 2 });
    expect(hook.result.current.status).toBe('saved');
  });

  it('pauses on a real content conflict until the user chooses', async () => {
    const update = vi
      .fn()
      .mockRejectedValueOnce(conflict({ version: 4, content: doc('theirs') }))
      .mockResolvedValueOnce({ item: { ...baseItem, version: 5, content: doc('mine') } });
    const { hook, type } = setup(update);
    type('mine');
    await act(() => hook.result.current.flush());
    expect(hook.result.current.status).toBe('conflict');
    expect(update).toHaveBeenCalledTimes(1);

    await act(async () => hook.result.current.keepMine());
    await act(() => hook.result.current.flush());
    expect(update).toHaveBeenLastCalledWith(baseItem.id, { version: 4, content: doc('mine') });
  });

  it('"Load latest" replaces the body with the server version', async () => {
    const update = vi.fn().mockRejectedValueOnce(conflict({ version: 4, content: doc('theirs') }));
    const { hook, type } = setup(update);
    type('mine');
    await act(() => hook.result.current.flush());
    act(() => hook.result.current.loadLatest());
    expect(hook.result.current.status).toBe('saved');
    expect(hook.result.current.conflict).toBeNull();
  });
});
