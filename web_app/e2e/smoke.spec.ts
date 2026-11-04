import { expect, test, type Page } from '@playwright/test';
import { skipWelcome, TEST_USER, uniqueEmail } from './fixtures.ts';

// One account per project run (the in-memory API runs with REGISTRATION_MODE=open).
const userFor = (project: string) => ({ ...TEST_USER, email: uniqueEmail(project) });

async function fillAuthForm(page: Page, email: string, password: string, confirm = false) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  if (confirm) await page.getByLabel('Confirm password').fill(password);
}

test('landing → register → shell → reload keeps session → logout → login', async ({ page }, info) => {
  const user = userFor(info.project.name);

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'A garden for your ideas.' })).toBeVisible();
  await page.getByRole('banner').getByRole('link', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole('link', { name: 'Create your account' }).click();
  // Navigation runs in a transition: wait for the sign-up form before typing into it.
  await expect(page.getByRole('heading', { name: 'Plant your garden' })).toBeVisible();
  await fillAuthForm(page, user.email, user.password, true);
  await page.getByRole('button', { name: 'Create account' }).click();
  await skipWelcome(page);

  await expect(page).toHaveURL(/\/knowledge$/);
  const nav = page.getByRole('navigation', { name: 'Main' });
  for (const label of ['Knowledge', 'Actionable', 'Scheduler', 'Inbox', 'Search']) {
    await expect(nav.getByText(label, { exact: true })).toBeVisible();
  }

  // Access token is memory-only; a reload must restore the session from the HttpOnly cookie.
  await page.reload();
  await expect(page).toHaveURL(/\/knowledge$/);
  // Tree pane on desktop; on phones the tree is the Knowledge home.
  await expect(page.getByRole('tree')).toBeVisible();

  const cookies = await page.context().cookies();
  const rt = cookies.find((c) => c.name === 'niwa_rt');
  expect(rt?.httpOnly).toBe(true);
  expect(rt?.sameSite).toBe('Lax');

  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await fillAuthForm(page, user.email.toUpperCase(), user.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/knowledge$/);
});

test('settings theme toggle switches the color scheme', async ({ page }, info) => {
  const user = userFor(`${info.project.name}-theme`);
  await page.goto('/register');
  await fillAuthForm(page, user.email, user.password, true);
  await page.getByRole('button', { name: 'Create account' }).click();
  await skipWelcome(page);
  await expect(page).toHaveURL(/\/knowledge$/);

  await page.goto('/settings/appearance');
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-dark', '');
  await page.getByRole('button', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-light', '');
});
