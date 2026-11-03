import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { apiError, authOk, renderApp } from '../test/renderApp.tsx';

describe('route guards', () => {
  it('sends anonymous visitors to login', async () => {
    const { router } = renderApp('/actionable');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('restores a session from the refresh cookie and skips login', async () => {
    const { router } = renderApp('/login', { 'POST /auth/refresh': authOk });
    await waitFor(() => expect(router.state.location.pathname).toBe('/knowledge'));
  });
});

describe('login', () => {
  it('validates before calling the API', async () => {
    const { fetch } = renderApp('/login');
    await userEvent.click(await screen.findByRole('button', { name: 'Log in' }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
    expect(fetch.mock.calls.filter(([u]) => String(u).endsWith('/auth/login'))).toHaveLength(0);
  });

  it('logs in and returns to the page that was requested', async () => {
    const { router, fetch } = renderApp('/actionable', { 'POST /auth/login': authOk });
    await userEvent.type(await screen.findByLabelText('Email'), 'Gardener@NIWA.test');
    await userEvent.type(screen.getByLabelText('Password'), 'garden-password-123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/actionable'));
    const login = fetch.mock.calls.find(([u]) => String(u).endsWith('/auth/login'));
    expect(JSON.parse(String(login?.[1]?.body))).toEqual({
      email: 'gardener@niwa.test',
      password: 'garden-password-123',
    });
    // Shell with all six destinations
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    for (const label of ['Knowledge', 'Actionable', 'Scheduler', 'Inbox', 'Search', 'Settings']) {
      expect(nav).toHaveTextContent(label);
    }
  });

  it('shows the server message on bad credentials', async () => {
    renderApp('/login', {
      'POST /auth/login': () => apiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.'),
    });
    await userEvent.type(await screen.findByLabelText('Email'), 'gardener@niwa.test');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });

  it('floats field labels once a value is typed (inputRef wiring)', async () => {
    renderApp('/login');
    const email = await screen.findByLabelText('Email');
    await userEvent.type(email, 'a@b.co');
    await userEvent.tab();
    const label = document.querySelector(`label[for="${email.id}"]`);
    expect(label).toHaveAttribute('data-shrink', 'true');
  });
});

describe('register', () => {
  it('requires matching passwords', async () => {
    renderApp('/register');
    await userEvent.type(await screen.findByLabelText('Email'), 'gardener@niwa.test');
    await userEvent.type(screen.getByLabelText('Password'), 'garden-password-123');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'garden-password-124');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
  });

  it('explains when registration is closed', async () => {
    renderApp('/register', {
      'POST /auth/register': () =>
        apiError(403, 'REGISTRATION_CLOSED', 'Registration is closed for this NIWA instance.'),
    });
    await userEvent.type(await screen.findByLabelText('Email'), 'gardener@niwa.test');
    await userEvent.type(screen.getByLabelText('Password'), 'garden-password-123');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'garden-password-123');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Registration is closed');
  });
});
