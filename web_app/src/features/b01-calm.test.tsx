import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp, testUser } from '../test/renderApp.tsx';

/** NIWA-PLAN-B-01 B8, B13, B15 — holidays, Inbox triage, Getting started. */

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const as = (user: object) => ({
  'POST /auth/refresh': () => json(200, { accessToken: 't', expiresIn: 600, user }),
});
const item = (over: Record<string, unknown>) => ({
  id: 'i'.repeat(24),
  workspaceId: 'b'.repeat(24),
  parentId: null,
  title: 'Untitled',
  type: 'note',
  nature: 'knowledge',
  status: 'not_started',
  priority: 'none',
  orderKey: 'a0',
  tags: [],
  dueAt: null,
  estimatedMinutes: null,
  reviewAt: null,
  sourceUrl: null,
  inboxedAt: null,
  suggestedParentId: null,
  archivedAt: null,
  deletedAt: null,
  version: 1,
  createdAt: '2026-11-04T00:00:00.000Z',
  updatedAt: '2026-11-04T00:00:00.000Z',
  completedAt: null,
  ...over,
});

describe('Calendar holidays (B8)', () => {
  it('shows the country’s holidays as read-only labels that explain themselves', async () => {
    const user = {
      ...testUser,
      preferences: { ...testUser.preferences, holidays: { country: 'PH', region: null, observances: false } },
    };
    renderApp('/scheduler/month/2026-12-01', {
      ...as(user),
      'GET /holidays': () =>
        json(200, {
          country: 'PH',
          holidays: [{ date: '2026-12-30', name: 'Rizal Day', localName: 'Rizal Day', type: 'public' }],
        }),
    });
    const label = await screen.findByRole('button', { name: 'Rizal Day, public holiday' });
    await userEvent.click(label);
    expect(await screen.findByText(/Public holiday in/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Change country' })).toHaveAttribute(
      'href',
      '/settings/calendar',
    );
  });

  it('asks nothing of the server when no country is set', async () => {
    const { fetch } = renderApp('/scheduler/month/2026-12-01', as(testUser));
    await screen.findByRole('grid', { name: 'Month' });
    expect(fetch.mock.calls.some(([u]) => String(u).includes('/holidays'))).toBe(false);
  });
});

describe('Inbox triage (B13)', () => {
  it('files one capture at a time, as the chosen kind, then says all sorted', async () => {
    const garden = item({ id: 'g'.repeat(24), title: 'My garden' });
    const capture = item({ title: 'Plant tulips', type: 'idea', inboxedAt: '2026-11-04T08:00:00.000Z' });
    let inbox = [capture];
    const filed: unknown[] = [];
    renderApp('/inbox?sort=1', {
      ...as(testUser),
      'GET /tree': () => json(200, { items: [garden] }),
      'GET /inbox': () => json(200, { items: inbox }),
      [`POST /items/${capture.id}/file`]: (_u, init) => {
        filed.push(JSON.parse(String(init.body)));
        inbox = [];
        return json(200, { item: { ...capture, inboxedAt: null, parentId: garden.id } });
      },
    });
    const card = await screen.findByRole('region', { name: 'Plant tulips' });
    await userEvent.click(within(card).getByRole('button', { name: /Task/ }));
    await userEvent.click(within(card).getByRole('button', { name: 'My garden' }));
    await waitFor(() => expect(filed).toEqual([{ version: 1, parentId: garden.id, type: 'task' }]));
    expect(await screen.findByText('All sorted')).toBeInTheDocument();
  });
});

describe('Getting started (B15)', () => {
  it('ticks itself from the garden and can be hidden', async () => {
    renderApp('/today', {
      ...as(testUser),
      'GET /inbox': () =>
        json(200, { items: [item({ title: 'A thought', inboxedAt: '2026-11-04T08:00:00.000Z' })] }),
    });
    const card = await screen.findByRole('region', { name: 'Getting started' });
    expect(card).toHaveTextContent('1 of 4');
    expect(within(card).getByText(/Done:/)).toBeInTheDocument();
    await userEvent.click(within(card).getByRole('button', { name: 'Hide' }));
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Getting started' })).not.toBeInTheDocument(),
    );
  });
});
