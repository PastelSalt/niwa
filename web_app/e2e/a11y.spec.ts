import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { TEST_USER, uniqueEmail } from './fixtures.ts';

/**
 * Automated accessibility audit (WCAG 2.1 A/AA rules in axe-core) of every main screen, in both
 * colour schemes. Fails on serious/critical issues; prints the details to make fixing easy.
 */

test.skip(({ isMobile }) => isMobile, 'Audited at desktop width; phone layout reuses the same components');

async function audit(page: Page, where: string) {
  // Let entrance transitions finish so colours are final.
  await page.waitForTimeout(400);
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
  // Tree rows are named by their own title; an expanded row's text also contains its children, which
  // label-content-name-mismatch reads as a mismatch. Run that one rule everywhere except the tree.
  const main = await new AxeBuilder({ page })
    .withTags(tags)
    .disableRules(['label-content-name-mismatch'])
    .analyze();
  const label = await new AxeBuilder({ page })
    .withRules(['label-content-name-mismatch'])
    .exclude('[role="tree"]')
    .analyze();
  const bad = [...main.violations, ...label.violations].filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  const report = bad.map(
    (v) =>
      `${where} · ${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes
        .slice(0, 4)
        .map((n) => `    ${n.target.join(' ')} — ${n.failureSummary?.split('\n').slice(1).join(' ').trim()}`)
        .join('\n'),
  );
  expect(report, report.join('\n\n')).toEqual([]);
}

async function seed(page: Page) {
  return page.evaluate(async () => {
    const h = { 'content-type': 'application/json', 'x-requested-with': 'niwa' };
    const { accessToken } = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: h,
      body: '{}',
    }).then((r) => r.json());
    const auth = { ...h, authorization: `Bearer ${accessToken}` };
    const tree = await fetch('/api/v1/tree', { headers: auth }).then((r) => r.json());
    const root = Object.fromEntries(tree.items.map((i: { title: string; id: string }) => [i.title, i.id]));
    const post = (url: string, body: object) =>
      fetch(url, { method: 'POST', headers: auth, body: JSON.stringify(body) }).then((r) => r.json());
    const today = new Date().toISOString().slice(0, 10);
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, anchorId: 'a1' },
          content: [{ type: 'text', text: 'Overview' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Some notes with ' },
            { type: 'text', text: 'code', marks: [{ type: 'code' }] },
          ],
        },
      ],
    };
    const note = (
      await post('/api/v1/items', {
        title: 'Networking',
        parentId: root.Knowledge,
        content: doc,
        tags: ['routing'],
      })
    ).item;
    const task = (
      await post('/api/v1/items', {
        title: 'Deploy',
        parentId: root.Projects,
        type: 'task',
        status: 'in_progress',
        priority: 'critical',
        dueAt: today,
      })
    ).item;
    await post('/api/v1/items', {
      title: 'Done thing',
      parentId: root.Projects,
      type: 'task',
      status: 'completed',
    });
    await post('/api/v1/inbox', { title: 'An idea' });
    const start = new Date();
    start.setHours(10, 0, 0, 0);
    await post('/api/v1/schedule', {
      kind: 'event',
      title: 'Standup',
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + 30 * 60000).toISOString(),
    });
    await post('/api/v1/schedule', {
      kind: 'block',
      itemId: task.id,
      startAt: new Date(start.getTime() + 3600000).toISOString(),
      endAt: new Date(start.getTime() + 7200000).toISOString(),
    });
    return { note: note.id as string, task: task.id as string, today };
  });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`main screens have no serious accessibility issues (${scheme})`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ colorScheme: scheme });

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await audit(page, 'login');

    await page.goto('/register');
    await page.getByLabel('Email').fill(uniqueEmail(`a11y-${scheme}-${info.project.name}`));
    await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password);
    await page.getByLabel('Confirm password').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/knowledge$/);
    const ids = await seed(page);

    const screens: [string, string, () => Promise<void>][] = [
      ['knowledge home', '/knowledge', () => expect(page.getByText('Your notebook garden')).toBeVisible()],
      [
        'note',
        `/knowledge/${ids.note}`,
        () => expect(page.locator('.ProseMirror')).toContainText('Some notes'),
      ],
      [
        'focus',
        '/actionable',
        () =>
          expect(page.getByRole('region', { name: 'Overdue' }))
            .toBeVisible()
            .catch(() => expect(page.getByText('Focus')).toBeVisible()),
      ],
      [
        'task',
        `/actionable/${ids.task}`,
        () => expect(page.getByLabel('Title', { exact: true })).toHaveValue('Deploy'),
      ],
      [
        'month',
        `/scheduler/month/${ids.today}`,
        () => expect(page.getByRole('grid', { name: 'Month' })).toBeVisible(),
      ],
      [
        'week',
        `/scheduler/week/${ids.today}`,
        () => expect(page.getByRole('grid', { name: 'Time grid' })).toBeVisible(),
      ],
      ['inbox', '/inbox', () => expect(page.getByRole('list', { name: 'Inbox items' })).toBeVisible()],
      [
        'search',
        '/search?q=netw',
        () => expect(page.getByRole('list', { name: 'Search results' })).toBeVisible(),
      ],
      [
        'review',
        '/knowledge/review',
        () => expect(page.getByRole('heading', { name: 'Review queue' })).toBeVisible(),
      ],
      [
        'appearance',
        '/settings/appearance',
        () => expect(page.getByRole('button', { name: 'Light' })).toBeVisible(),
      ],
      ['trash', '/settings/trash', () => expect(page.getByText('Trash is empty.')).toBeVisible()],
    ];
    for (const [label, url, ready] of screens) {
      await page.goto(url);
      await ready();
      await audit(page, `${scheme} ${label}`);
    }

    // Dialogs
    await page.goto('/knowledge');
    await page.getByRole('button', { name: 'Capture' }).click();
    await expect(page.getByRole('textbox', { name: 'Capture title' })).toBeVisible();
    await audit(page, `${scheme} capture dialog`);
  });
}
