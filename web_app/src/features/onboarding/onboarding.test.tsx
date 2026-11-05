import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp, testUser } from '../../test/renderApp.tsx';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const newUser = { ...testUser, onboarding: null };
const signedInAs = (user: typeof newUser | typeof testUser) => ({
  'POST /auth/refresh': () => json(200, { accessToken: 'token', expiresIn: 600, user }),
});
const recorded = (status: 'completed' | 'skipped') => () =>
  json(200, { user: { ...testUser, onboarding: { status, version: 1, at: '2026-11-04T00:00:00.000Z' } } });

describe('onboarding tour', () => {
  it("welcomes a new account once; Let's go is saved on the account", async () => {
    const { fetch } = renderApp('/knowledge', {
      ...signedInAs(newUser),
      'PUT /account/onboarding': recorded('skipped'),
    });
    const welcome = await screen.findByRole('dialog', { name: 'Welcome to your garden' });
    await userEvent.click(within(welcome).getByRole('button', { name: 'Let’s go' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const put = fetch.mock.calls.find(([u]) => String(u).endsWith('/account/onboarding'));
    expect(JSON.parse(String(put?.[1]?.body))).toEqual({ status: 'skipped', version: 1 });
    // No folders or example pages unless asked for.
    expect(
      fetch.mock.calls.some(([u, init]) => String(u).endsWith('/items') && init?.method === 'POST'),
    ).toBe(false);
  });

  it('walks through every step and records completion', async () => {
    const { fetch } = renderApp('/knowledge', {
      ...signedInAs(newUser),
      'PUT /account/onboarding': recorded('completed'),
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Take the tour' }));

    expect(await screen.findByRole('dialog', { name: 'Capture first' })).toHaveTextContent('Step 1 of 7');
    for (let i = 0; i < 6; i++) await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: 'Make it yours' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const put = fetch.mock.calls.find(([u]) => String(u).endsWith('/account/onboarding'));
    expect(JSON.parse(String(put?.[1]?.body))).toEqual({ status: 'completed', version: 1 });
  });

  it("doesn't interrupt accounts that already saw it, and can be replayed from Settings", async () => {
    renderApp('/settings/help', signedInAs(testUser));
    await userEvent.click(await screen.findByRole('button', { name: 'Replay the tour' }));
    expect(screen.queryByRole('dialog', { name: 'Welcome to your garden' })).not.toBeInTheDocument();
    expect(await screen.findByRole('dialog', { name: 'Capture first' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Capture first' })).not.toBeInTheDocument(),
    );
  });
});

describe('welcome options (B-01 B14)', () => {
  it('adds the classic folders only when ticked', async () => {
    const created: string[] = [];
    renderApp('/today', {
      ...signedInAs(newUser),
      'PUT /account/onboarding': recorded('skipped'),
      'GET /tree': () => json(200, { items: [] }),
      'POST /items': (_u, init) => {
        created.push((JSON.parse(String(init.body)) as { title: string }).title);
        return json(201, { item: { id: 'x'.repeat(24) } });
      },
    });
    const welcome = await screen.findByRole('dialog', { name: 'Welcome to your garden' });
    await userEvent.click(within(welcome).getByLabelText(/Start with folders/));
    await userEvent.click(within(welcome).getByRole('button', { name: 'Let’s go' }));
    await waitFor(() => expect(created).toEqual(['Knowledge', 'Projects', 'College', 'Personal']));
  });
});
