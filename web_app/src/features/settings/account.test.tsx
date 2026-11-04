import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { apiError, authOk, renderApp } from '../../test/renderApp.tsx';

const signedIn = { 'POST /auth/refresh': authOk };

describe('Settings › Account', () => {
  it('shows how much of the account limits is used', async () => {
    renderApp('/settings/account', signedIn);
    // Settings is a lazy chunk; under a full parallel run it can take over a second to load.
    expect(await screen.findByText('4 of 10,000', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('0.0 MB of 200 MB')).toBeInTheDocument();
  });

  it('changes the password with the current one', async () => {
    const { fetch } = renderApp('/settings/account', { ...signedIn, 'POST /account/password': authOk });
    await userEvent.type(await screen.findByLabelText('Current password'), 'old password here');
    await userEvent.type(screen.getByLabelText('New password'), 'a brand new long password');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByText(/Other devices have been signed out/)).toBeInTheDocument();
    const call = fetch.mock.calls.find(([u]) => String(u).endsWith('/account/password'));
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({
      currentPassword: 'old password here',
      newPassword: 'a brand new long password',
    });
  });

  it('deletes the account after the password is confirmed, then leaves the app', async () => {
    let attempts = 0;
    const { router } = renderApp('/settings/account', {
      ...signedIn,
      'POST /account/delete': () =>
        ++attempts === 1
          ? apiError(401, 'INVALID_CREDENTIALS', 'Password is incorrect.')
          : new Response(null, { status: 204 }),
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Delete account…' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete your account?' });
    await userEvent.type(within(dialog).getByLabelText('Password'), 'wrong');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete forever' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Password is incorrect.');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete forever' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});
