import { expect, test, type Page } from '@playwright/test';
import { skipWelcome, TEST_USER, uniqueEmail } from './fixtures.ts';

async function signUp(page: Page, tag: string) {
  await page.goto('/register');
  await page.getByLabel('Email').fill(uniqueEmail(tag));
  await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password);
  await page.getByLabel('Confirm password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await skipWelcome(page);
  await expect(page).toHaveURL(/\/knowledge$/);
}

test('capture → inbox → file (single and bulk) → it appears in the tree', async ({
  page,
  isMobile,
}, info) => {
  await signUp(page, `inbox-${info.project.name}`);

  // Capture several with Shift+Enter, then one more with Enter. Phones use the + button.
  if (isMobile) await page.getByRole('button', { name: 'Capture' }).click();
  else {
    await page.locator('body').click();
    await page.keyboard.press('c');
  }
  const title = page.getByRole('textbox', { name: 'Capture title' });
  await title.fill('Buy tomato seeds');
  await title.press('Shift+Enter');
  await expect(page.getByText('1 captured')).toBeVisible();
  await title.fill('Read about BGP');
  await title.press('Shift+Enter');
  await title.fill('Call the plumber');
  await title.press('Enter');
  await expect(page.getByText('Captured 3 items to Inbox')).toBeVisible();

  await page.goto('/inbox');
  const list = page.getByRole('list', { name: 'Inbox items' });
  await expect(list.getByRole('listitem')).toHaveCount(3);
  await expect(
    // Rail entries are links; bottom-bar entries are buttons.
    page.getByRole('navigation', { name: 'Main' }).getByRole(isMobile ? 'button' : 'link', { name: /Inbox/ }),
  ).toContainText('3');

  // File one with type and due date.
  await page.getByRole('button', { name: 'File Read about BGP' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('File under').fill('Knowledge');
  await page
    .getByRole('option', { name: /^Knowledge/ })
    .first()
    .click();
  await dialog.getByLabel('Type').click();
  await page.getByRole('option', { name: 'Note' }).click();
  await dialog.getByRole('button', { name: 'File' }).click();
  await expect(page.getByText('Filed under “Knowledge”')).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(2);

  // Bulk file the other two into Personal.
  await page.getByRole('checkbox', { name: 'Select Buy tomato seeds' }).check();
  await page.getByRole('checkbox', { name: 'Select Call the plumber' }).check();
  await page.getByRole('button', { name: 'File selected' }).click();
  await dialog.getByLabel('File under').fill('Personal');
  await page
    .getByRole('option', { name: /^Personal/ })
    .first()
    .click();
  await dialog.getByRole('button', { name: 'File' }).click();
  await expect(page.getByText('Filed 2 items under “Personal”')).toBeVisible();
  await expect(page.getByText('Inbox zero')).toBeVisible();

  if (!isMobile) {
    await page.goto('/knowledge');
    const tree = page.getByRole('tree');
    await tree.getByRole('treeitem', { name: 'Knowledge', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tree.getByRole('treeitem', { name: 'Read about BGP' })).toBeVisible();
  }
});

test('search finds titles, tags and body text with highlights', async ({ page }, info) => {
  await signUp(page, `search-${info.project.name}`);
  // Seed through the API the app itself uses (session cookie from sign-up).
  await page.evaluate(async () => {
    const h = { 'content-type': 'application/json', 'x-requested-with': 'niwa' };
    const { accessToken } = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: h,
      body: '{}',
    }).then((r) => r.json());
    const auth = { ...h, authorization: `Bearer ${accessToken}` };
    const tree = await fetch('/api/v1/tree', { headers: auth }).then((r) => r.json());
    const knowledge = tree.items.find((i: { title: string }) => i.title === 'Knowledge').id;
    const doc = (text: string) => ({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    });
    const mk = (body: object) =>
      fetch('/api/v1/items', {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ parentId: knowledge, ...body }),
      });
    await mk({
      title: 'BGP path selection',
      tags: ['routing'],
      content: doc('Prefer the shortest AS path.'),
    });
    await mk({
      title: 'OSPF areas',
      tags: ['routing'],
      content: doc('Area 0 is the backbone of the network.'),
    });
  });

  await page.goto('/search');
  const box = page.getByRole('textbox', { name: 'Search query' });
  await box.fill('backb');
  const results = page.getByRole('list', { name: 'Search results' });
  await expect(results.getByRole('link')).toHaveCount(1);
  await expect(results).toContainText('OSPF areas');
  await expect(results.locator('mark')).toHaveText(['backb']);
  await expect(page).toHaveURL(/\?q=backb/);

  await box.fill('routing');
  await expect(results.getByRole('link')).toHaveCount(2);

  await box.fill('shortest');
  await expect(results.getByRole('link')).toHaveCount(1); // wait for this query's results, not the previous one's
  await expect(results).toContainText('BGP path selection');
  await results.getByRole('link').first().click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('BGP path selection');
});
