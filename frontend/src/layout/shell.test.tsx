import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { authOk, renderApp } from '../test/renderApp.tsx';

const signedIn = { 'POST /auth/refresh': authOk };

describe('app shell', () => {
  it('redirects / to Knowledge and shows the tree pane there', async () => {
    const { router } = renderApp('/', signedIn);
    await waitFor(() => expect(router.state.location.pathname).toBe('/knowledge'));
    expect(await screen.findByLabelText('Knowledge tree')).toBeInTheDocument();
  });

  it('hides the tree pane on non-tree destinations', async () => {
    renderApp('/scheduler', signedIn);
    expect(await screen.findByRole('grid', { name: 'Month' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/tree$/)).not.toBeInTheDocument();
  });

  it('navigates with g-shortcuts and focuses search with /', async () => {
    const { router } = renderApp('/knowledge', signedIn);
    await screen.findByText('Your notebook garden');

    await userEvent.keyboard('ga');
    await waitFor(() => expect(router.state.location.pathname).toBe('/actionable'));

    await userEvent.keyboard('/');
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();
    // typing in the search box must not trigger shortcuts
    await userEvent.keyboard('gi');
    expect(router.state.location.pathname).toBe('/actionable');
  });

  it('submits the top-bar search to /search', async () => {
    const { router } = renderApp('/knowledge', signedIn);
    await userEvent.type(await screen.findByRole('textbox', { name: 'Search' }), 'bgp routing{Enter}');
    await waitFor(() => expect(router.state.location.search).toBe('?q=bgp%20routing'));
    expect(await screen.findByRole('textbox', { name: 'Search query' })).toHaveValue('bgp routing');
    expect(await screen.findByText('Nothing matches “bgp routing”')).toBeInTheDocument();
  });

  it('opens and closes the detail panel', async () => {
    renderApp('/knowledge', signedIn);
    await userEvent.click(await screen.findByRole('button', { name: 'Toggle detail panel' }));
    expect(screen.getByText('Nothing selected')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close details' }));
    await waitFor(() => expect(screen.queryByText('Nothing selected')).not.toBeInTheDocument());
  });

  it('logs out from the account menu', async () => {
    const { router } = renderApp('/settings/account', {
      ...signedIn,
      'POST /auth/logout': () => new Response(null, { status: 204 }),
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Account menu' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('unknown routes show the not-found state inside the shell', async () => {
    renderApp('/nowhere', signedIn);
    expect(await screen.findByText('Nothing grows here')).toBeInTheDocument();
  });
});
