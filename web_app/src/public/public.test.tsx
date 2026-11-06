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
    for (const lens of ['Notes', 'Tasks', 'Calendar']) {
      expect(screen.getByRole('heading', { level: 3, name: lens })).toBeInTheDocument();
    }
  });

  it('offers a lazy, labelled playground with its own customise panel (B-02 V11)', async () => {
    renderApp('/');
    const region = await screen.findByRole('region', { name: 'Interactive example' });
    const frame = region.querySelector('iframe')!;
    expect(frame).toHaveAttribute('src', '/playground');
    expect(frame).toHaveAttribute('loading', 'lazy');
    expect(frame.title).toMatch(/example garden/);
    const panel = screen.getByRole('region', { name: 'Make it yours' });
    // Five colour themes and nine page patterns (B-03 C2).
    expect(
      within(panel).getByRole('radiogroup', { name: 'Colour theme' }).querySelectorAll('[role=radio]'),
    ).toHaveLength(5);
    expect(within(panel).getAllByRole('radio', { name: /Dots|Gingham|Plain/ })).toHaveLength(3);
    expect(within(panel).getByRole('button', { name: 'Scrapbook' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(panel).getByText(/saved to your account after you sign up/)).toBeInTheDocument();
  });

  it('sends signed-in users to Today', async () => {
    const { router } = renderApp('/', { 'POST /auth/refresh': authOk });
    await waitFor(() => expect(router.state.location.pathname).toBe('/today'));
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

describe('policy pages (B3)', () => {
  it.each([
    ['/privacy', 'Privacy Policy', /zoletakyle\.1111@gmail\.com/, '5 November 2026'],
    ['/terms', 'Terms of Use', /laws of the Republic of the Philippines/, '4 November 2026'],
    ['/eula', 'App licence', /MIT licence/, '4 November 2026'],
  ])('%s shows %s with the agreed facts', async (path, title, fact, updated) => {
    renderApp(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText(`Last updated ${updated}`)).toBeInTheDocument();
    expect(document.body.textContent).toMatch(fact);
  });

  it('privacy says what is and isn’t collected, and the minimum age', async () => {
    renderApp('/privacy');
    const table = await screen.findByRole('table', { name: 'What NIWA collects' });
    expect(within(table).getByText('Your IP address')).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/not for anyone under 16/);
    expect(document.body.textContent).toMatch(/without search terms/);
  });

  it('footer links every policy page; sign-up names Terms, Privacy and the age', async () => {
    renderApp('/');
    const footer = await screen.findByRole('contentinfo');
    for (const name of ['Privacy', 'Terms', 'App licence', 'Cookies', 'Licences', 'Source code']) {
      expect(within(footer).getByRole('link', { name })).toBeInTheDocument();
    }

    renderApp('/register');
    expect(await screen.findAllByRole('link', { name: 'Terms of Use' })).not.toHaveLength(0);
    expect(document.body.textContent).toMatch(/confirm you’?'?re at least 16/);
  });
});
