import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { authOk, renderApp, testUser } from '../../test/renderApp.tsx';

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

/** Signed in as `testUser` with some preference overrides; PUT /account/preferences echoes the merged user. */
function signedInWith(prefs: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
  const user = { ...testUser, ...extra, preferences: { ...testUser.preferences, ...prefs } };
  const sent: Record<string, unknown>[] = [];
  return {
    sent,
    handlers: {
      'POST /auth/refresh': () => json({ accessToken: 'token', expiresIn: 600, user }),
      'PUT /account/preferences': (_url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body)) as Record<string, Record<string, unknown>>;
        sent.push(body);
        const p = user.preferences as Record<string, unknown>;
        for (const k of ['layout', 'background'] as const)
          if (body[k]) p[k] = { ...(p[k] as object), ...body[k] };
        return json({ user });
      },
    },
  };
}

describe('Settings › Appearance › Layout and Background (B-03 C2/C5)', () => {
  it('offers the three layouts with Scrapbook chosen, and saves a switch to Classic', async () => {
    const { handlers, sent } = signedInWith();
    renderApp('/settings/appearance', handlers);
    const scrapbook = await screen.findByRole('radio', { name: 'Scrapbook' }, { timeout: 5000 });
    expect(scrapbook).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Classic' })).toHaveAttribute('aria-checked', 'false');
    // The default Scrapbook shell: floating sidebar with the Spaces group and a patterned page.
    expect(screen.getByTestId('page-background')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Classic' }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toEqual({
      layout: { preset: 'classic', density: null, sidebar: null, stickers: null, chosen: true },
    });
    // Classic has no patterned page.
    await waitFor(() => expect(screen.queryByTestId('page-background')).not.toBeInTheDocument());
    expect(screen.getByText(/Patterns show with the Scrapbook layout/)).toBeInTheDocument();
  });

  it('saves a pattern, strength and the colour washes', async () => {
    const { handlers, sent } = signedInWith();
    renderApp('/settings/appearance', handlers);
    const dots = await screen.findByRole('radio', { name: 'Dots' }, { timeout: 5000 });
    expect(dots).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: 'Gingham' }));
    await userEvent.click(screen.getByRole('button', { name: 'Soft' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Colour washes in the corners' }));
    await waitFor(() => expect(sent).toHaveLength(3));
    expect(sent).toEqual([
      { background: { pattern: 'gingham' } },
      { background: { strength: 'soft' } },
      { background: { washes: false } },
    ]);
    expect(screen.getByRole('radio', { name: 'Gingham' })).toHaveAttribute('aria-checked', 'true');
  });

  it('spacing and sidebar options override the preset', async () => {
    const { handlers, sent } = signedInWith();
    renderApp('/settings/appearance', handlers);
    await userEvent.click(await screen.findByRole('button', { name: 'Compact' }, { timeout: 5000 }));
    await userEvent.click(screen.getByRole('button', { name: 'Icons only' }));
    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent).toEqual([
      { layout: { density: 'compact', chosen: true } },
      { layout: { sidebar: 'icons', chosen: true } },
    ]);
    // Icons only: the Spaces group is gone from the sidebar.
    await waitFor(() => expect(screen.queryByText('Spaces')).not.toBeInTheDocument());
  });
});

describe('"NIWA has a new look" on Today (B-03 C1)', () => {
  it('asks accounts from before the change once; switching back saves Classic', async () => {
    const { handlers, sent } = signedInWith(
      { layout: { preset: 'scrapbook', density: null, sidebar: null, stickers: null, chosen: false } },
      { createdAt: '2026-10-01T00:00:00.000Z' },
    );
    renderApp('/today', handlers);
    expect(
      await screen.findByRole('heading', { name: 'NIWA has a new look' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Switch back to Classic' }));
    await waitFor(() => expect(sent).toEqual([{ layout: { preset: 'classic', chosen: true } }]));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'NIWA has a new look' })).not.toBeInTheDocument(),
    );
  });

  it('is not shown to new accounts or once chosen', async () => {
    renderApp('/today', { 'POST /auth/refresh': authOk });
    expect(await screen.findByRole('heading', { name: /Good/ }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'NIWA has a new look' })).not.toBeInTheDocument();
  });
});
