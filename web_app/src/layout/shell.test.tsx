import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { authOk, renderApp } from '../test/renderApp.tsx';

const signedIn = { 'POST /auth/refresh': authOk };

describe('app shell', () => {
  it('sends signed-in users from / to Today; Garden shows the tree with its filter', async () => {
    const { router } = renderApp('/', signedIn);
    await waitFor(() => expect(router.state.location.pathname).toBe('/today'));
    expect(
      await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening|night)$/ }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Garden tree')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Garden' }));
    expect(await screen.findByLabelText('Garden tree')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Tasks' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/actionable'));
    expect(screen.getByRole('link', { name: 'Garden' })).toHaveAttribute('aria-current', 'page');
  });

  it('has four places in the nav', async () => {
    renderApp('/today', signedIn);
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    for (const label of ['Today', 'Garden', 'Calendar', 'Inbox']) expect(nav).toHaveTextContent(label);
    expect(nav).not.toHaveTextContent('Knowledge');
  });

  it('hides the tree pane on non-tree destinations', async () => {
    renderApp('/scheduler', signedIn);
    expect(await screen.findByRole('grid', { name: 'Month' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/tree$/)).not.toBeInTheDocument();
  });

  it('navigates with g-shortcuts and opens the command box with /', async () => {
    const { router } = renderApp('/knowledge', signedIn);
    await screen.findByText('Your garden');

    await userEvent.keyboard('gc');
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/scheduler/));
    await userEvent.keyboard('gg');
    await waitFor(() => expect(router.state.location.pathname).toBe('/garden'));

    await userEvent.keyboard('/');
    const box = await screen.findByRole('combobox', { name: 'Search or jump to' });
    expect(box).toHaveFocus();
    // typing in the box must not trigger shortcuts
    await userEvent.keyboard('gi');
    expect(router.state.location.pathname).toBe('/garden');
  });

  it('the command box jumps to places and searches everything', async () => {
    const { router } = renderApp('/knowledge', signedIn);
    await userEvent.click(await screen.findByRole('button', { name: 'Search or jump to' }));
    await userEvent.type(screen.getByRole('combobox', { name: 'Search or jump to' }), 'inb{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/inbox'));

    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(screen.getByRole('combobox', { name: 'Search or jump to' }), 'bgp routing');
    await userEvent.click(screen.getByRole('option', { name: /Search everything for/ }));
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
