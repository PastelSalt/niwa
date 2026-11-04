import { expect, test, type Page } from '@playwright/test';
import { skipWelcome, TEST_USER, uniqueEmail } from './fixtures.ts';

test.skip(
  ({ isMobile }) => isMobile,
  'Tree pane interactions are desktop-only; phone layout is covered in smoke.spec.ts',
);

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
// Click the row's own label — the treeitem box also contains its nested children.
const label = (page: Page, title: string) => node(page, title).locator('[draggable]').first();

async function addChild(page: Page, parent: string, title: string, type?: string) {
  await node(page, parent).first().hover();
  await page
    .getByRole('button', { name: `Add child to ${parent}` })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title').fill(title);
  if (type) {
    await dialog.getByLabel('Type').click();
    await page.getByRole('option', { name: type }).click();
  }
  await dialog.getByRole('button', { name: 'Create' }).click();
  await expect(dialog).toBeHidden();
}

test('build a project, reorder with the keyboard, complete from Focus, delete and restore', async ({
  page,
}, info) => {
  await signUp(page, `tree-${info.project.name}`);
  await page.goto('/actionable');

  // Root containers are always visible in a lens.
  for (const root of ['Knowledge', 'Projects', 'College', 'Personal']) {
    await expect(node(page, root)).toBeVisible();
  }

  await addChild(page, 'Projects', 'Garden site', 'Project');
  await expect(page).toHaveURL(/\/actionable\/[a-f0-9]{24}$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Actionable');
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Garden site');

  await addChild(page, 'Garden site', 'Plant seeds');
  await addChild(page, 'Garden site', 'Water daily');
  await expect(node(page, 'Garden site')).toHaveAttribute('aria-expanded', 'true');

  // Alt+↑ moves "Water daily" above "Plant seeds".
  await node(page, 'Water daily').focus();
  await page.keyboard.press('Alt+ArrowUp');
  const children = node(page, 'Garden site').getByRole('group').getByRole('treeitem');
  await expect(children).toHaveText([/Water daily/, /Plant seeds/]);

  // Tab indents "Plant seeds" under "Water daily".
  await node(page, 'Plant seeds').focus();
  await page.keyboard.press('Tab');
  await expect(
    node(page, 'Water daily').getByRole('group').getByRole('treeitem', { name: 'Plant seeds' }),
  ).toBeVisible();

  // Details panel edits feed Focus.
  await label(page, 'Water daily').click();
  await expect(node(page, 'Water daily')).toHaveAttribute('aria-selected', 'true');
  const details = page.getByRole('complementary', { name: 'Details' });
  await details.getByLabel('Status').click();
  await page.getByRole('option', { name: 'In progress' }).click();
  await expect(details.getByLabel('Status')).toHaveText('In progress');

  await page.getByRole('link', { name: 'Actionable' }).click();
  await page.goto('/actionable');
  const inProgress = page.getByRole('region', { name: 'In progress' });
  await expect(inProgress.getByText('Water daily')).toBeVisible();
  // click, not check(): a completed task correctly leaves "In progress", so the box can vanish before check() re-reads it
  await inProgress.getByRole('checkbox', { name: 'Complete Water daily' }).click();
  await expect(page.getByText('Completed “Water daily”')).toBeVisible();

  // Delete with cascade → Undo restores everything.
  await label(page, 'Garden site').click();
  await page.getByRole('complementary', { name: 'Details' }).getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Move to Trash' }).click();
  await expect(node(page, 'Garden site')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(node(page, 'Garden site')).toBeVisible();

  // Delete again → restore from Settings → Trash.
  await label(page, 'Garden site').click();
  await page.getByRole('complementary', { name: 'Details' }).getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Move to Trash' }).click();
  await expect(node(page, 'Garden site')).toHaveCount(0); // let the delete finish before leaving the page
  await page.goto('/settings/trash');
  await page.getByRole('button', { name: 'Restore Garden site' }).click();
  await expect(page.getByText(/Restored “Garden site” and 2 inside it/)).toBeVisible();
  await page.goto('/actionable');
  await expect(node(page, 'Garden site')).toBeVisible();
});

test('lens filtering dims context and keeps knowledge out of the Actionable tree', async ({ page }, info) => {
  await signUp(page, `lens-${info.project.name}`);
  await page.goto('/knowledge');
  await addChild(page, 'College', 'CS 301');
  await addChild(page, 'CS 301', 'Problem set 1', 'Task');
  await addChild(page, 'CS 301', 'Lecture notes', 'Note');

  await page.goto('/actionable');
  // Expand with the keyboard (clicking a knowledge row here would open it in the Knowledge lens).
  await node(page, 'College').focus();
  await page.keyboard.press('ArrowRight');
  await node(page, 'CS 301 (context)').focus();
  await page.keyboard.press('ArrowRight');
  await expect(node(page, 'Problem set 1')).toBeVisible();
  await expect(node(page, 'Lecture notes')).toHaveCount(0);
  // The knowledge ancestor is shown for context only.
  await expect(page.getByTitle('CS 301 — shown for context')).toBeVisible();
});

test('drag and drop moves an item inside another', async ({ page }, info) => {
  await signUp(page, `dnd-${info.project.name}`);
  await page.goto('/actionable');
  await addChild(page, 'Projects', 'Alpha', 'Project');
  await addChild(page, 'Projects', 'Beta', 'Task');

  const inside = node(page, 'Alpha').getByRole('group').getByRole('treeitem', { name: 'Beta' });
  // Middle of the row = "inside"; the top/bottom quarters reorder instead. Measure right before
  // dropping and retry if a busy machine lands the drop on an edge zone (an extra inside-drop is a no-op).
  await expect(async () => {
    if (await inside.isVisible()) return;
    const src = (await label(page, 'Beta').boundingBox())!;
    const dst = (await label(page, 'Alpha').boundingBox())!;
    await page.mouse.move(src.x + 20, src.y + src.height / 2);
    await page.mouse.down();
    await page.mouse.move(dst.x + dst.width / 3, dst.y + dst.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(inside).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15_000 });
});
