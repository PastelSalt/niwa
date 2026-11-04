import { expect, test, type Page } from '@playwright/test';
import { skipWelcome, TEST_USER, uniqueEmail } from './fixtures.ts';

test.skip(({ isMobile }) => isMobile, 'Editor flows are exercised on desktop');

async function signUp(page: Page, tag: string) {
  await page.goto('/register');
  await page.getByLabel('Email').fill(uniqueEmail(tag));
  await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password);
  await page.getByLabel('Confirm password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await skipWelcome(page);
  await expect(page).toHaveURL(/\/knowledge$/);
}

const tree = (page: Page) => page.getByRole('tree');
const node = (page: Page, title: string) => tree(page).getByRole('treeitem', { name: title, exact: true });
const label = (page: Page, title: string) => node(page, title).locator('[draggable]').first();
const body = (page: Page) => page.locator('.ProseMirror');

async function addNote(page: Page, parent: string, title: string) {
  await node(page, parent).first().hover();
  await page
    .getByRole('button', { name: `Add child to ${parent}` })
    .first()
    .click();
  await page.getByRole('dialog').getByLabel('Title').fill(title);
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(title);
}

async function waitSaved(page: Page) {
  await expect(page.getByRole('status').filter({ hasText: /^Saved$/ })).toBeVisible({ timeout: 10_000 });
}

test('write, outline, link with [[, backlinks, deep link, promote, review', async ({ page }, info) => {
  await signUp(page, `kb-${info.project.name}`);

  // Target note with a section.
  await addNote(page, 'Knowledge', 'BGP');
  await body(page).click();
  await page.keyboard.type('## Path selection');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Prefer the shortest AS path.');
  await waitSaved(page);
  await expect(page.getByRole('navigation', { name: 'Outline' })).toContainText('Path selection');

  // Source note linking to the BGP section via [[ → section.
  await addNote(page, 'Knowledge', 'Networking');
  await body(page).click();
  await page.keyboard.type('See [[BG');
  const picker = page.getByRole('listbox', { name: 'Link suggestions' });
  await expect(picker.getByRole('option', { name: /BGP/ })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(picker.getByRole('option', { name: 'Path selection' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(body(page).locator('[data-niwa-link]')).toContainText('BGP');
  await expect(body(page).locator('[data-niwa-link]')).toContainText('Path selection');
  await waitSaved(page);
  await expect(page.getByRole('region', { name: 'Related items' })).toContainText('BGP › Path selection');

  // Reload: content persisted.
  await page.reload();
  await expect(body(page).locator('[data-niwa-link]')).toContainText('BGP');

  // Follow the link → lands on the section; backlink shows the source.
  await body(page).locator('[data-niwa-link]').click();
  await expect(page).toHaveURL(/\/knowledge\/[a-f0-9]{24}#h-/);
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('BGP');
  await expect(page.getByRole('region', { name: 'Backlinks' })).toContainText('Networking');
  await expect(page.getByRole('region', { name: 'Backlinks' })).toContainText('Links to “Path selection”');

  // Promote the section to a child item.
  const outline = page.getByRole('navigation', { name: 'Outline' });
  await outline.getByText('Path selection').hover();
  await outline.getByRole('button', { name: 'Actions for heading Path selection' }).click();
  await page.getByRole('menuitem', { name: 'Promote to child item' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Promote' }).click();
  await expect(page.getByText('Promoted “Path selection” to a child item')).toBeVisible();
  await expect(body(page)).not.toContainText('Prefer the shortest AS path.');
  await expect(body(page).locator('[data-niwa-link]')).toContainText('Path selection');
  await expect(page.getByRole('list', { name: 'Children' })).toContainText('Path selection');

  // The old section link from "Networking" now points at a section that's gone.
  await label(page, 'Networking').click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Networking');
  await body(page).locator('[data-niwa-link]').click();
  await expect(page.getByText('The linked section no longer exists.')).toBeVisible();

  // Review queue.
  await page
    .getByRole('complementary', { name: 'Details' })
    .getByLabel('Review on')
    .fill(new Date().toISOString().slice(0, 10));
  await page.goto('/knowledge/review');
  await expect(page.getByRole('list', { name: 'Due for review' })).toContainText('BGP');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Nothing to review today')).toBeVisible();
});
