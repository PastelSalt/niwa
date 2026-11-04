#!/usr/bin/env node
/**
 * Visual audit (NIWA-PLAN-B-02 V0).
 *
 * Seeds the in-memory API with realistic content, then screenshots every screen, the main dialogs and the
 * empty states at 1440 / 820 / 390 / 360 px in light and dark, and runs an overflow/overlap check on each
 * shot. Screenshots go to `web_app/.visual-audit/<run>/` (git-ignored); findings are printed and written to
 * `findings.json` next to them.
 *
 *   pnpm --filter @niwa/web visual-audit                 # starts its own API + Vite on 4200/5175
 *   pnpm --filter @niwa/web visual-audit -- --reuse      # reuse servers already running on those ports
 *   pnpm --filter @niwa/web visual-audit -- --mock       # no MongoDB: a small fake API (scripts/audit-mock-api.mjs)
 *   … -- --only=focus,inbox --widths=390,360 --modes=light --no-shots
 *
 * Exits 1 when the check finds overlapping or spilling text, so it can gate a milestone (V7 exit criteria).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { MockWorkspace, routeMock } from './audit-mock-api.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..');
const API_PORT = Number(process.env.AUDIT_API_PORT ?? 4200);
const WEB_PORT = Number(process.env.AUDIT_WEB_PORT ?? 5175);
const BASE = `http://localhost:${WEB_PORT}`;
const API = `${BASE}/api/v1`;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const list = (v, fallback) => (typeof v === 'string' ? v.split(',').filter(Boolean) : fallback);

export const WIDTHS = list(args.widths, ['1440', '820', '390', '360']).map(Number);
const HEIGHT = { 1440: 900, 820: 1180, 390: 844, 360: 780 };
const MODES = list(args.modes, ['light', 'dark']);
const ONLY = list(args.only, null);
const MOCK = Boolean(args.mock);
const SHOTS = !args['no-shots'];
const OUT = join(webRoot, '.visual-audit', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
// A fixed zone with no DST keeps times stable between runs.
const TIME_ZONE = 'Asia/Manila';

// ---------------------------------------------------------------- servers

const children = [];
function start(cmd, argv, env, cwd) {
  const child = spawn(cmd, argv, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'ignore', 'inherit'],
    detached: true,
  });
  children.push(child);
  return child;
}
function stopAll() {
  for (const c of children) {
    try {
      process.kill(-c.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  }
}
process.on('exit', stopAll);
process.on('SIGINT', () => process.exit(130));

async function waitFor(url, ms = 180_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function servers() {
  if (!args.reuse && !MOCK) {
    start(
      'pnpm',
      ['--filter', '@niwa/backend', 'dev:memory'],
      {
        API_PORT: String(API_PORT),
        LOG_LEVEL: 'warn',
        RATE_LIMIT_AUTH_MAX: '1000',
        RATE_LIMIT_GENERAL_MAX: '100000',
        RATE_LIMIT_ACCOUNT_MAX: '100000',
        RATE_LIMIT_SIGNUP_PER_HOUR: '1000',
      },
      join(webRoot, '..'),
    );
  }
  if (!args.reuse) {
    start(
      'pnpm',
      ['exec', 'vite', '--port', String(WEB_PORT)],
      { API_PROXY_TARGET: `http://localhost:${API_PORT}`, PORT: String(WEB_PORT) },
      webRoot,
    );
  }
  if (!MOCK) await waitFor(`http://localhost:${API_PORT}/api/v1/health`);
  await waitFor(BASE);
}

// ---------------------------------------------------------------- seeding (the audit content of B-02)

const PASSWORD = 'garden-password-123';

async function call(request, token, method, path, body) {
  const res = await request.fetch(`${API}${path}`, {
    method,
    headers: {
      'x-requested-with': 'niwa',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    data: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok()) throw new Error(`${method} ${path} → ${res.status()} ${await res.text()}`);
  return res.status() === 204 ? null : res.json();
}

const doc = (...blocks) => ({ type: 'doc', content: blocks });
const p = (text) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const h = (level, text) => ({ type: 'heading', attrs: { level }, content: [{ type: 'text', text }] });
const ul = (...items) => ({
  type: 'bulletList',
  content: items.map((t) => ({ type: 'listItem', content: [p(t)] })),
});

/** Today in the audit's time zone, as YYYY-MM-DD, shifted by `days`. */
function day(days = 0) {
  const d = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(d);
}
/** ISO instant for a wall-clock time in the audit zone (UTC+8, no DST). */
const at = (date, hh, mm = 0) =>
  new Date(`${date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+08:00`).toISOString();

/**
 * An audit account: `api(method, path, body)` for seeding, and `attach(context)` to sign a browser context in.
 * Real mode registers on the in-memory API; mock mode keeps a MockWorkspace and routes `/api/v1` to it.
 */
async function account(request, tag, { finishTour = true } = {}) {
  const email = `audit+${tag}-${Date.now().toString(36)}@niwa.test`;
  if (MOCK) {
    const ws = new MockWorkspace({ email, onboarded: finishTour });
    return {
      email,
      api: async (method, path, body) => ws.handle(method, path, new URLSearchParams(), body).body,
      attach: (context) => routeMock(context, ws, unhandled),
    };
  }
  const { accessToken: token } = await call(request, null, 'POST', '/auth/register', {
    email,
    password: PASSWORD,
  });
  if (finishTour) await call(request, token, 'PUT', '/account/onboarding', { status: 'skipped', version: 1 });
  return {
    email,
    api: (method, path, body) => call(request, token, method, path, body),
    // Signing in through the API sets the refresh cookie the app picks up on load.
    attach: (context) => call(context.request, null, 'POST', '/auth/login', { email, password: PASSWORD }),
  };
}
const unhandled = new Set();

async function seed(acc) {
  const { api } = acc;
  const tree = (await api('GET', '/tree')).items;
  const root = (title) => tree.find((i) => i.parentId === null && i.title === title).id;
  const item = async (parentId, title, extra = {}) =>
    (await api('POST', '/items', { parentId, title, type: 'note', ...extra })).item;

  // Knowledge: a course with long notes.
  const course = await item(root('College'), 'CS 301 — Computer Networks', {
    tags: ['cs301', 'networks'],
    content: doc(p('Lecture notes, labs and reading for the networks course.')),
  });
  const week3 = await item(course.id, 'Week 3: TCP congestion control', {
    tags: ['cs301', 'tcp'],
    reviewAt: day(0),
    content: doc(
      h(2, 'Slow start'),
      p('The congestion window doubles every round trip until it reaches the slow-start threshold.'),
      ul(
        'cwnd starts at one MSS',
        'ssthresh halves after loss',
        'Fast retransmit after three duplicate ACKs',
      ),
      h(2, 'Congestion avoidance'),
      p('Above the threshold the window grows by one MSS per round trip (additive increase).'),
      h(3, 'Reno vs Cubic'),
      p(
        'Cubic grows the window as a cubic function of time since the last loss, which suits long fat networks.',
      ),
    ),
  });
  await item(course.id, 'Week 4: Routing algorithms — distance vector and link state', {
    content: doc(p('Bellman-Ford, Dijkstra, count-to-infinity.')),
  });
  await item(course.id, 'Lab 2 — Wireshark capture', {
    type: 'task',
    status: 'in_progress',
    priority: 'high',
    dueAt: day(1),
  });
  await item(root('Knowledge'), 'Reading list', {
    type: 'note',
    content: doc(ul('Designing Data-Intensive Applications', 'The Pragmatic Programmer')),
  });
  await item(root('Knowledge'), 'Idea: a spaced-repetition view for notes', {
    type: 'idea',
    tags: ['someday'],
  });

  // Projects: one with tasks across statuses and priorities.
  const site = await item(root('Projects'), 'Portfolio site redesign', {
    type: 'project',
    status: 'in_progress',
    priority: 'medium',
  });
  await item(site.id, 'Write case study for the garden app', {
    type: 'task',
    status: 'in_progress',
    priority: 'high',
    dueAt: day(-2),
  });
  await item(site.id, 'Pick a typeface', { type: 'task', status: 'completed', priority: 'low' });
  await item(site.id, 'Fix the contact form on Safari', {
    type: 'task',
    status: 'blocked',
    priority: 'critical',
    dueAt: day(0),
  });
  await item(site.id, 'Compress hero images', {
    type: 'task',
    status: 'not_started',
    priority: 'medium',
    dueAt: day(3),
  });
  const move = await item(root('Personal'), 'Move apartments', {
    type: 'project',
    status: 'not_started',
    priority: 'high',
    dueAt: day(20),
  });
  await item(move.id, 'Book the movers', { type: 'task', priority: 'high', dueAt: day(5) });
  await item(move.id, 'Change address with the bank', { type: 'task', priority: 'none' });

  // Inbox captures.
  for (const title of [
    'Buy plant food for the monstera',
    'Idea: weekly review checklist template',
    'Look into HTTP/3 for the networks essay',
  ]) {
    await api('POST', '/inbox', { title, type: 'idea' });
  }

  // Scheduler: events, a block on a task, a weekly repeat, an all-day entry.
  const today = day(0);
  await api('POST', '/schedule', {
    kind: 'event',
    title: 'CS 301 lecture',
    startAt: at(today, 10),
    endAt: at(today, 11, 30),
    recurrence: 'weekly',
    timeZone: TIME_ZONE,
  });
  await api('POST', '/schedule', {
    kind: 'event',
    title: 'Dentist',
    startAt: at(today, 14),
    endAt: at(today, 14, 30),
    timeZone: TIME_ZONE,
  });
  await api('POST', '/schedule', {
    kind: 'event',
    title: 'Coffee with Mika',
    startAt: at(today, 14, 15),
    endAt: at(today, 15),
    color: '#E3A1B4',
    timeZone: TIME_ZONE,
  });
  await api('POST', '/schedule', {
    kind: 'block',
    itemId: week3.id,
    startAt: at(day(1), 9),
    endAt: at(day(1), 10, 30),
    timeZone: TIME_ZONE,
  });
  await api('POST', '/schedule', {
    kind: 'event',
    title: 'Moving day',
    startAt: at(day(2), 0),
    endAt: at(day(3), 0),
    isAllDay: true,
    timeZone: TIME_ZONE,
  });

  // Trash: one deleted note.
  const gone = await item(root('Personal'), 'Old packing list');
  await api('DELETE', `/items/${gone.id}`);

  return { ids: { course: course.id, week3: week3.id, site: site.id } };
}

// ---------------------------------------------------------------- screens

/** Each screen: a name, a path (or setup) and an optional action that opens a dialog. */
function screens(ids) {
  const today = day(0);
  return [
    { name: 'landing', path: '/', account: 'none' },
    { name: 'login', path: '/login', account: 'none' },
    { name: 'register', path: '/register', account: 'none' },
    { name: 'privacy', path: '/privacy', account: 'none' },
    { name: 'knowledge', path: '/knowledge' },
    { name: 'note', path: `/knowledge/${ids.week3}`, wait: '.ProseMirror' },
    { name: 'course', path: `/knowledge/${ids.course}` },
    { name: 'focus', path: '/actionable' },
    { name: 'project', path: `/actionable/${ids.site}` },
    { name: 'month', path: `/scheduler/month/${today}` },
    { name: 'week', path: `/scheduler/week/${today}` },
    { name: 'day', path: `/scheduler/day/${today}` },
    { name: 'inbox', path: '/inbox' },
    { name: 'search', path: '/search?q=tcp' },
    { name: 'settings', path: '/settings/appearance' },
    { name: 'trash', path: '/settings/trash' },
    {
      name: 'capture-dialog',
      path: '/inbox',
      open: async (page) => {
        await page.keyboard.press('c');
        await page.getByRole('dialog').waitFor();
      },
    },
    {
      name: 'event-dialog',
      path: `/scheduler/month/${today}`,
      open: async (page) => {
        await page.locator(`[role="gridcell"][data-day="${today}"]`).click({ position: { x: 8, y: 8 } });
        await page.getByRole('dialog').waitFor();
      },
    },
    { name: 'empty-knowledge', path: '/knowledge', account: 'empty' },
    { name: 'empty-focus', path: '/actionable', account: 'empty' },
    { name: 'empty-scheduler', path: `/scheduler/week/${today}`, account: 'empty' },
    { name: 'empty-inbox', path: '/inbox', account: 'empty' },
    { name: 'welcome-dialog', path: '/knowledge', account: 'fresh', wait: '[role="dialog"]' },
    { name: '404', path: '/no-such-page' },
  ];
}

// ---------------------------------------------------------------- overflow / overlap check

/**
 * Runs in the page. Collects visible text runs (one rect per text node line box) and reports:
 * - `overlap`: two text runs from different elements whose boxes intersect;
 * - `spill`: text that runs outside its element's box with overflow visible (not an intended ellipsis);
 * - `squeezed`: ellipsis truncation that leaves almost nothing readable (< 6 characters);
 * - `page-scroll`: the page scrolls horizontally.
 */
function inspect() {
  const findings = [];
  const describe = (el) => {
    const parts = [];
    for (let e = el; e && parts.length < 3 && e !== document.body; e = e.parentElement) {
      const label = e.getAttribute('aria-label') || e.getAttribute('data-testid');
      parts.unshift(e.tagName.toLowerCase() + (label ? `[${label.slice(0, 30)}]` : ''));
    }
    return parts.join(' > ');
  };
  const visible = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
      // Visually hidden (screen-reader only) text.
      if (s.clip === 'rect(0px, 0px, 0px, 0px)' || s.clipPath === 'inset(50%)') return false;
      if (e.getAttribute('aria-hidden') === 'true' && e.tagName !== 'svg') return false;
    }
    return true;
  };

  const runs = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim();
    const el = node.parentElement;
    if (!text || !el || el.closest('script,style,noscript,[role="tooltip"],.MuiTouchRipple-root')) continue;
    if (!visible(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    // Clip each line box to the nearest clipping ancestor, so text inside scroll areas compares fairly.
    let clip = null;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        clip = e.getBoundingClientRect();
        break;
      }
    }
    for (const r of range.getClientRects()) {
      if (r.width < 2 || r.height < 2) continue;
      let { left, top, right, bottom } = r;
      if (clip) {
        left = Math.max(left, clip.left);
        top = Math.max(top, clip.top);
        right = Math.min(right, clip.right);
        bottom = Math.min(bottom, clip.bottom);
        if (right - left < 2 || bottom - top < 2) continue;
      }
      runs.push({ el, text, left, top, right, bottom });
    }
  }

  // Overlap between runs that belong to different elements (and aren't one inside the other).
  const seen = new Set();
  for (let i = 0; i < runs.length; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      const a = runs[i];
      const b = runs[j];
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const hgt = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w <= 2 || hgt <= 3) continue;
      // Ignore stacked layers (a dialog or menu over the page): only compare runs in the same top layer.
      const layer = (el) => {
        for (let e = el; e; e = e.parentElement) {
          if (e.matches('[role="dialog"],[role="menu"],[role="listbox"],.MuiPopover-root')) return e;
          const pos = getComputedStyle(e).position;
          if (pos === 'fixed' || pos === 'sticky') return e;
        }
        return null;
      };
      if (layer(a.el) !== layer(b.el)) continue;
      const key = `${a.text}|${b.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        kind: 'overlap',
        text: `"${a.text.slice(0, 40)}" ↔ "${b.text.slice(0, 40)}"`,
        where: describe(a.el),
      });
    }
  }

  // Text spilling out of its element, and truncation that leaves almost nothing.
  const checked = new Set();
  for (const { el } of runs) {
    if (checked.has(el)) continue;
    checked.add(el);
    const s = getComputedStyle(el);
    const over = el.scrollWidth - el.clientWidth;
    if (over <= 1 || el.clientWidth === 0) continue;
    if (s.textOverflow === 'ellipsis' && s.overflowX !== 'visible') {
      const full = el.textContent.trim();
      const shown = Math.floor((el.clientWidth / el.scrollWidth) * full.length);
      if (full.length > 12 && shown < Math.min(12, full.length * 0.4))
        findings.push({
          kind: 'squeezed',
          text: `"${full.slice(0, 40)}" shows ≈${shown} chars`,
          where: describe(el),
        });
    } else if (s.overflowX === 'visible' && !el.matches('input,textarea,[contenteditable]')) {
      findings.push({
        kind: 'spill',
        text: `"${el.textContent.trim().slice(0, 40)}" +${over}px`,
        where: describe(el),
      });
    }
  }

  if (document.documentElement.scrollWidth > window.innerWidth + 1)
    findings.push({
      kind: 'page-scroll',
      text: `page is ${document.documentElement.scrollWidth}px wide in a ${window.innerWidth}px window`,
      where: 'html',
    });
  return findings;
}

// ---------------------------------------------------------------- run

async function settle(page, wait) {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  if (wait)
    await page
      .locator(wait)
      .first()
      .waitFor({ timeout: 15_000 })
      .catch(() => {});
  // Let fonts, lazy chunks and transitions finish.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

async function main() {
  await servers();
  if (SHOTS) mkdirSync(OUT, { recursive: true });
  // AUDIT_CHROMIUM points at a preinstalled browser when it doesn't match this Playwright version.
  const browser = await chromium.launch({ executablePath: process.env.AUDIT_CHROMIUM || undefined });
  const all = [];

  // Accounts are shared across widths and modes; sign-in state is stored per account.
  const setup = await browser.newContext({ baseURL: BASE, timezoneId: TIME_ZONE });
  const full = await account(setup.request, 'full');
  const { ids } = await seed(full);
  const empty = await account(setup.request, 'empty');
  await setup.close();

  const list = screens(ids).filter((s) => !ONLY || ONLY.includes(s.name));
  for (const mode of MODES) {
    for (const width of WIDTHS) {
      const sessions = {};
      const contextFor = async (who) => {
        if (sessions[who]) return sessions[who];
        const ctx = await browser.newContext({
          baseURL: BASE,
          viewport: { width, height: HEIGHT[width] ?? 900 },
          colorScheme: mode,
          timezoneId: TIME_ZONE,
          reducedMotion: 'reduce',
        });
        if (who === 'none') {
          // Visitors: no session (mock mode answers refresh with 401).
          if (MOCK)
            await ctx.route('**/api/v1/**', (route) =>
              route.request().url().endsWith('/auth/config')
                ? route.fulfill({ json: { registrationOpen: true } })
                : route.fulfill({
                    status: 401,
                    json: { error: { code: 'UNAUTHORIZED', message: 'No session.' } },
                  }),
            );
        } else {
          const acc =
            who === 'empty'
              ? empty
              : who === 'fresh'
                ? await account(ctx.request, 'fresh', { finishTour: false })
                : full;
          await acc.attach(ctx);
        }
        sessions[who] = ctx;
        return ctx;
      };

      for (const s of list) {
        const ctx = await contextFor(s.account ?? 'full');
        const page = await ctx.newPage();
        const t0 = Date.now();
        try {
          await page.goto(s.path);
          await settle(page, s.wait);
          if (s.open) {
            await s.open(page);
            await settle(page);
          }
          const found = await page.evaluate(inspect);
          for (const f of found) all.push({ screen: s.name, width, mode, ...f });
          if (SHOTS)
            await page.screenshot({ path: join(OUT, `${s.name}-${width}-${mode}.png`), fullPage: false });
        } catch (err) {
          all.push({
            screen: s.name,
            width,
            mode,
            kind: 'error',
            text: String(err.message).split('\n')[0],
            where: s.path,
          });
        } finally {
          process.stderr.write(`  ${s.name} @ ${width} ${mode} (${Date.now() - t0} ms)\n`);
          await page.close();
        }
      }
      for (const ctx of Object.values(sessions)) await ctx.close();
    }
  }
  await browser.close();

  // Report: grouped by screen, problems that block (overlap, spill, page-scroll, error) first.
  const blocking = all.filter((f) => f.kind !== 'squeezed');
  const byScreen = new Map();
  for (const f of all) {
    const k = `${f.screen} @ ${f.width}px ${f.mode}`;
    if (!byScreen.has(k)) byScreen.set(k, []);
    byScreen.get(k).push(f);
  }
  for (const [k, fs] of byScreen) {
    console.log(`\n${k}`);
    for (const f of fs) console.log(`  ${f.kind.padEnd(11)} ${f.text}\n              at ${f.where}`);
  }
  const counts = all.reduce((acc, f) => ((acc[f.kind] = (acc[f.kind] ?? 0) + 1), acc), {});
  if (unhandled.size) console.log('\nMock API had no handler for:', [...unhandled].join(', '));
  console.log(
    `\n${list.length} screens × ${WIDTHS.length} widths × ${MODES.length} modes — findings:`,
    counts,
  );
  if (SHOTS) {
    writeFileSync(join(OUT, 'findings.json'), JSON.stringify(all, null, 2));
    console.log(`Screenshots and findings.json in ${OUT}`);
  }
  process.exitCode = blocking.length ? 1 : 0;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 2;
  })
  // The dev servers it started would otherwise keep Node running.
  .finally(() => {
    stopAll();
    process.exit();
  });
