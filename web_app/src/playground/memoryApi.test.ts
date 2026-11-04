import { createApiClient } from '@niwa/api-client';
import { describe, expect, it } from 'vitest';
import { exampleWorkspace } from './exampleWorkspace.ts';
import { localDay } from './memoryApi.ts';

const client = () => {
  const ws = exampleWorkspace();
  return { ws, api: createApiClient({ baseUrl: '/api/v1', fetch: ws.fetch }) };
};

describe('playground memory API (B-02 V11)', () => {
  it('signs in without an account and serves the example garden', async () => {
    const { api } = client();
    const session = await api.restoreSession();
    expect(session?.user.email).toBe('example@niwa.example');
    const { items: tree } = await api.items.tree();
    expect(tree.map((i) => i.title)).toEqual(
      expect.arrayContaining(['Biology 101', 'Weekend trip to the coast']),
    );
  });

  it('a completed task leaves the open Focus sections', async () => {
    const { ws, api } = client();
    await api.restoreSession();
    const today = localDay();
    const before = await api.items.focus(today);
    const overdue = before.overdue[0]!;
    expect(overdue.title).toBe('Book the train tickets');
    await api.items.update(overdue.id, { version: overdue.version, status: 'completed' });
    const after = await api.items.focus(today);
    expect(after.overdue).toHaveLength(0);
    expect(ws.items.find((i) => i.id === overdue.id)?.completedAt).not.toBeNull();
  });

  it('captures land in the Inbox, not the tree', async () => {
    const { api } = client();
    await api.restoreSession();
    await api.inbox.capture({ title: 'Plant tulips', type: 'idea' });
    expect((await api.inbox.list()).items.map((i) => i.title)).toContain('Plant tulips');
    expect((await api.items.tree()).items.map((i) => i.title)).not.toContain('Plant tulips');
  });

  it('answers anything outside the example with a clear error, never the network', async () => {
    const { ws } = client();
    const res = await ws.fetch('/api/v1/ai/items/x/summarize', { method: 'POST', body: '{}' });
    expect(res.status).toBe(501);
    expect(((await res.json()) as { error: { message: string } }).error.message).toMatch(/example/);
  });
});
