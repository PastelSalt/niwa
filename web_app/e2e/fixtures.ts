import type { Page } from '@playwright/test';

/** Throwaway test account for the in-memory dev/e2e backend (`pnpm dev:memory`). Not a real credential. */
export const TEST_USER = {
  email: 'gardener@niwa.test',
  password: 'garden-password-123',
};

/** A fresh address per test run (the in-memory API keeps accounts until it restarts). */
export function uniqueEmail(tag: string): string {
  return TEST_USER.email.replace(
    '@',
    `+${tag}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@`,
  );
}

/**
 * New accounts get the onboarding welcome (B-01 B7); specs about other screens dismiss it. Web sign-up starts
 * with one "My garden" folder (B14); the specs were written around the classic four, so this ticks
 * "Start with folders" too — leave `classic` false to keep just My garden.
 */
export async function skipWelcome(page: Page, { classic = true } = {}): Promise<void> {
  const welcome = page.getByRole('dialog', { name: 'Welcome to your garden' });
  if (classic) await welcome.getByLabel(/Start with folders/).check();
  await welcome.getByRole('button', { name: 'Let’s go' }).click();
  await welcome.waitFor({ state: 'hidden' });
}

/** The Details panel is closed by default since B-01 B11; open it (desktop) if it isn't. */
export async function openDetails(page: Page) {
  const toggle = page.getByRole('button', { name: 'Toggle detail panel' });
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') await toggle.click();
  return page.getByRole('complementary', { name: 'Details' });
}

/** Links and backlinks fold into Connections on the item page (B-01 B11). */
export async function openConnections(page: Page) {
  const summary = page.getByRole('button', { name: /^Connections/ });
  if ((await summary.getAttribute('aria-expanded')) !== 'true') await summary.click();
}
