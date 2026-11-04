import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { authOk, renderApp } from '../test/renderApp.tsx';

describe('landing page', () => {
  it('shows visitors the landing page at / instead of bouncing them to login', async () => {
    const { router } = renderApp('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'A garden for your ideas.' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    for (const lens of ['Knowledge', 'Actionable', 'Scheduler']) {
      expect(screen.getByRole('heading', { level: 3, name: lens })).toBeInTheDocument();
    }
  });

  it('sends signed-in users to Knowledge', async () => {
    const { router } = renderApp('/', { 'POST /auth/refresh': authOk });
    await waitFor(() => expect(router.state.location.pathname).toBe('/knowledge'));
  });

  it('links to sign-up and log-in', async () => {
    const { router } = renderApp('/');
    const header = await screen.findByRole('banner');
    await userEvent.click(within(header).getByRole('link', { name: 'Create account' }));
    expect(await screen.findByRole('heading', { name: 'Plant your garden' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/register');
  });

  it('credits Moeko Works with a link to the portfolio', async () => {
    renderApp('/');
    const footer = await screen.findByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'Moeko Works' })).toHaveAttribute(
      'href',
      'https://moekoworks.vercel.app/',
    );
  });
});

describe('public pages', () => {
  it('shows visitors a 404 on unknown URLs instead of the login wall', async () => {
    const { router } = renderApp('/no-such-page');
    expect(await screen.findByText('Nothing grows here')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/no-such-page');
  });

  it('still sends visitors to login on app screens', async () => {
    const { router } = renderApp('/settings/account');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('lists the one cookie and the open-source packages', async () => {
    renderApp('/cookies');
    expect(await screen.findByRole('heading', { level: 1, name: 'Cookies' })).toBeInTheDocument();
    expect(screen.getAllByText('niwa_rt').length).toBeGreaterThan(0);

    renderApp('/licenses');
    const table = await screen.findByRole('table', { name: 'Open-source packages' });
    expect(within(table).getByRole('link', { name: 'react' })).toBeInTheDocument();
  });

  it('hides sign-up when the server is not accepting accounts', async () => {
    renderApp('/', {
      'GET /auth/config': () =>
        new Response(JSON.stringify({ registrationOpen: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    });
    await screen.findByRole('heading', { level: 1, name: 'A garden for your ideas.' });
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Create account' })).not.toBeInTheDocument(),
    );
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });
});
