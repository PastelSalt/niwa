import { expect, test, type Page } from '@playwright/test';
import { TEST_USER, uniqueEmail } from './fixtures.ts';

test.skip(({ isMobile }) => isMobile, 'Pointer drags on the time grid are exercised on desktop');
// A fixed zone with no DST keeps wall-clock assertions deterministic.
test.use({ timezoneId: 'Asia/Manila', viewport: { width: 1440, height: 900 } });

async function signUp(page: Page, tag: string) {
  await page.goto('/register');
  await page.getByLabel('Email').fill(uniqueEmail(tag));
  await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password);
  await page.getByLabel('Confirm password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/knowledge$/);
}

const cell = (page: Page, day: string) => page.locator(`[role="gridcell"][data-day="${day}"]`);
const HOUR_PX = 48;

/** Pointer position inside a week-grid day column at a given time. */
async function at(page: Page, day: string, hour: number, minute = 0) {
  const col = page.locator(`[role="grid"][aria-label="Time grid"] [data-day="${day}"]`);
  const box = (await col.boundingBox())!;
  const scroll = await page.locator('[role="grid"][aria-label="Time grid"]').boundingBox();
  return { x: box.x + box.width / 2, y: scroll!.y + (hour + minute / 60) * HOUR_PX };
}

test('month: create, drag to another day; week: drag-create, move, resize; repeat scopes', async ({
  page,
}, info) => {
  await signUp(page, `sched-${info.project.name}`);

  // Month view: click a day → new event.
  await page.goto('/scheduler/month/2027-03-10');
  await cell(page, '2027-03-10').click({ position: { x: 100, y: 70 } });
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title').fill('Dentist');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(cell(page, '2027-03-10').getByRole('button', { name: /9:00 AM\s*Dentist/ })).toBeVisible();

  // Drag the chip to the 12th — keeps its time.
  await cell(page, '2027-03-10')
    .getByRole('button', { name: /Dentist/ })
    .dragTo(cell(page, '2027-03-12'));
  await expect(cell(page, '2027-03-12').getByRole('button', { name: /9:00 AM\s*Dentist/ })).toBeVisible();
  await expect(cell(page, '2027-03-10').getByRole('button', { name: /Dentist/ })).toHaveCount(0);

  // Week view: drag 14:00 → 15:30 on Wed to create.
  await page.goto('/scheduler/week/2027-03-10');
  const a = await at(page, '2027-03-10', 14);
  const b = await at(page, '2027-03-10', 15, 30);
  await page.mouse.move(a.x, a.y + 2);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y - 2, { steps: 6 });
  await page.mouse.up();
  await expect(dialog.getByLabel('Start', { exact: true })).toHaveValue('14:00');
  await expect(dialog.getByLabel('End', { exact: true })).toHaveValue('15:30');
  await dialog.getByLabel('Title').fill('Deep work');
  await dialog.getByRole('button', { name: 'Save' }).click();
  const deep = page.getByRole('button', { name: /^Deep work\s*2:00 PM – 3:30 PM/ });
  await expect(deep).toBeVisible();

  // Move it to Thu 10:00 by dragging its top.
  const box = (await deep.boundingBox())!;
  const target = await at(page, '2027-03-11', 10);
  await page.mouse.move(box.x + box.width / 2, box.y + 6);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y + 6, { steps: 8 });
  await page.mouse.up();
  const moved = page.getByRole('button', { name: /^Deep work\s*10:00 AM – 11:30 AM/ });
  await expect(moved).toBeVisible();

  // Resize the bottom edge to 12:00.
  const mb = (await moved.boundingBox())!;
  const end = await at(page, '2027-03-11', 12);
  await page.mouse.move(mb.x + mb.width / 2, mb.y + mb.height - 3);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: /^Deep work\s*10:00 AM – 12:00 PM/ })).toBeVisible();

  // Weekly repeating event, then "this and following" changes the title from week 2.
  await page.goto('/scheduler/month/2027-04-01');
  await cell(page, '2027-04-05').click({ position: { x: 100, y: 70 } });
  await dialog.getByLabel('Title').fill('Piano');
  await dialog.getByLabel('Repeat').click();
  await page.getByRole('option', { name: 'Every week' }).click();
  await dialog.getByRole('button', { name: 'Save' }).click();
  for (const d of ['2027-04-05', '2027-04-12', '2027-04-19', '2027-04-26']) {
    await expect(cell(page, d).getByRole('button', { name: /Piano/ })).toBeVisible();
  }
  await cell(page, '2027-04-12').getByRole('button', { name: /Piano/ }).click();
  await dialog.getByLabel('This and following').check();
  await dialog.getByLabel('Title').fill('Piano (new teacher)');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(cell(page, '2027-04-05').getByRole('button', { name: /Piano$/ })).toBeVisible();
  await expect(cell(page, '2027-04-19').getByRole('button', { name: /Piano \(new teacher\)/ })).toBeVisible();

  // "This event" delete removes just one.
  await cell(page, '2027-04-26').getByRole('button', { name: /Piano/ }).click();
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await expect(cell(page, '2027-04-26').getByRole('button', { name: /Piano/ })).toHaveCount(0);
  await expect(cell(page, '2027-04-19').getByRole('button', { name: /Piano/ })).toBeVisible();
});

test('schedule a time block from an item and see it in the calendar', async ({ page }, info) => {
  await signUp(page, `block-${info.project.name}`);
  await page.goto('/actionable');
  const tree = page.getByRole('tree');
  await tree.getByRole('treeitem', { name: 'Projects', exact: true }).hover();
  await page.getByRole('button', { name: 'Add child to Projects' }).click();
  await page.getByRole('dialog').getByLabel('Title').fill('Problem set 1');
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();

  const details = page.getByRole('complementary', { name: 'Details' });
  await details.getByRole('button', { name: 'Schedule time' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Date', { exact: true }).fill('2027-03-09');
  await dialog.getByLabel('Start', { exact: true }).fill('14:00');
  await dialog.getByLabel('End date').fill('2027-03-09');
  await dialog.getByLabel('End', { exact: true }).fill('15:30');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Scheduled “Problem set 1”')).toBeVisible();
  await expect(details).toContainText('2:00 PM – 3:30 PM');

  await page.goto('/scheduler/week/2027-03-09');
  await expect(page.getByRole('button', { name: /^Problem set 1\s*2:00 PM – 3:30 PM/ })).toBeVisible();
});
