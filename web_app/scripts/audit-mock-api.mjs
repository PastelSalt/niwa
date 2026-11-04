/**
 * A small in-memory stand-in for the NIWA API, used by `visual-audit.mjs --mock` where the real in-memory API
 * can't run (no MongoDB binary available). It implements only what the audited screens read plus the writes
 * the seed makes; it is not a second backend and is never shipped. Behaviour mirrors the real services for the
 * parts a screenshot shows (tree order, Focus sections, review queue, weekly repeats, search).
 */

let counter = 0;
const oid = () =>
  (Date.now().toString(16).slice(-8) + (++counter).toString(16).padStart(16, '0')).slice(0, 24);
const now = () => new Date().toISOString();
const ACTIONABLE = ['project', 'task'];
const natureOf = (type) => (ACTIONABLE.includes(type) ? 'actionable' : 'knowledge');
const json = (status, body) => ({ status, body });
const err = (status, code, message) => json(status, { error: { code, message } });

function textOf(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(textOf).join(' ');
}

function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export class MockWorkspace {
  constructor({ email, onboarded = true, preferences = {} }) {
    this.user = {
      id: oid(),
      email,
      workspaceId: oid(),
      aiEnabled: false,
      hasAiKey: false,
      createdAt: now(),
      onboarding: onboarded ? { status: 'skipped', version: 1, at: now() } : null,
      preferences: { theme: 'garden', font: 'fredoka', mode: 'system', ...preferences },
    };
    this.items = [];
    this.entries = [];
    for (const title of ['Knowledge', 'Projects', 'College', 'Personal'])
      this.items.push(this.#newItem({ parentId: null, title, type: 'note' }));
  }

  #newItem(input) {
    const siblings = this.items.filter((i) => i.parentId === (input.parentId ?? null));
    const t = now();
    return {
      id: oid(),
      workspaceId: this.user.workspaceId,
      parentId: input.parentId ?? null,
      title: input.title,
      content: input.content ?? null,
      type: input.type ?? 'note',
      nature: natureOf(input.type ?? 'note'),
      status: input.status ?? 'not_started',
      priority: input.priority ?? 'none',
      orderKey: `a${String(siblings.length).padStart(4, '0')}`,
      tags: input.tags ?? [],
      dueAt: input.dueAt ?? null,
      estimatedMinutes: input.estimatedMinutes ?? null,
      reviewAt: input.reviewAt ?? null,
      sourceUrl: input.sourceUrl ?? null,
      inboxedAt: input.inboxedAt ?? null,
      suggestedParentId: null,
      archivedAt: null,
      deletedAt: null,
      version: 1,
      createdAt: t,
      updatedAt: t,
      completedAt: input.status === 'completed' ? t : null,
    };
  }

  #summary(item) {
    const { content: _content, ...rest } = item;
    return rest;
  }

  #live() {
    return this.items.filter((i) => !i.deletedAt && !i.archivedAt);
  }

  #filed() {
    return this.#live().filter((i) => !i.inboxedAt);
  }

  #expand(entry, from, to) {
    if (entry.recurrence === 'none') return [entry];
    const out = [];
    const len = new Date(entry.endAt) - new Date(entry.startAt);
    const step = { daily: 1, weekly: 7 }[entry.recurrence];
    for (let i = 0; i < 400; i++) {
      const start = new Date(entry.startAt);
      if (step) start.setUTCDate(start.getUTCDate() + i * step);
      else start.setUTCMonth(start.getUTCMonth() + i);
      if (start >= to) break;
      const end = new Date(start.getTime() + len);
      if (end <= from) continue;
      out.push({
        ...entry,
        id: `${entry.id}_${i}`,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        seriesId: entry.id,
        seriesIndex: i,
      });
    }
    return out;
  }

  /** Handles one API call. `path` has the `/api/v1` prefix removed. */
  handle(method, path, query, body) {
    const route = `${method} ${path}`;
    const id = path.split('/')[2];
    const find = () => this.items.find((i) => i.id === id);

    if (route === 'POST /auth/refresh' || route === 'POST /auth/login' || route === 'POST /auth/register')
      return json(200, { accessToken: 'mock-token', expiresIn: 600, user: this.user });
    if (route === 'GET /auth/me') return json(200, { user: this.user });
    if (route === 'POST /auth/logout') return json(200, { ok: true });
    if (route === 'GET /auth/config') return json(200, { registrationOpen: true });
    if (route === 'PUT /account/onboarding') {
      this.user.onboarding = { ...body, at: now() };
      return json(200, { user: this.user });
    }
    if (route === 'PUT /account/preferences') {
      this.user.preferences = { ...this.user.preferences, ...body };
      return json(200, { user: this.user });
    }
    if (route === 'GET /account/usage')
      return json(200, {
        items: this.items.length,
        itemLimit: 10_000,
        imageBytes: 0,
        imageByteLimit: 200 * 1024 * 1024,
      });
    if (route === 'GET /uploads/config') return json(200, { enabled: false, maxBytes: 0, allowedMime: [] });
    if (route === 'GET /ai/status')
      return json(200, { aiEnabled: false, hasKey: false, provider: 'deepseek' });
    if (route === 'GET /workspace')
      return json(200, {
        workspace: { id: this.user.workspaceId, name: 'Garden', createdAt: now(), updatedAt: now() },
      });

    if (route === 'GET /tree') return json(200, { items: this.#filed().map((i) => this.#summary(i)) });
    if (route === 'GET /inbox')
      return json(200, {
        items: this.#live()
          .filter((i) => i.inboxedAt)
          .map((i) => this.#summary(i)),
      });
    if (route === 'GET /trash')
      return json(200, { items: this.items.filter((i) => i.deletedAt).map((i) => this.#summary(i)) });
    if (route === 'GET /review') {
      const today = new Date().toISOString().slice(0, 10);
      return json(200, {
        items: this.#filed()
          .filter((i) => i.reviewAt && i.reviewAt <= today)
          .map((i) => this.#summary(i)),
      });
    }
    if (route === 'GET /tags') {
      const counts = new Map();
      for (const i of this.#filed()) for (const t of i.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
      return json(200, { tags: [...counts].map(([tag, count]) => ({ tag, count })) });
    }
    if (route === 'GET /focus') {
      const today = query.get('today');
      const horizon = addDays(today, Number(query.get('upcomingDays') ?? 7));
      const actionable = this.#filed().filter((i) => ACTIONABLE.includes(i.type));
      const open = actionable.filter((i) => i.status !== 'completed');
      const byDue = (a, b) => (a.dueAt ?? '9').localeCompare(b.dueAt ?? '9');
      const recent = (a, b) => b.updatedAt.localeCompare(a.updatedAt);
      const s = (list) => list.slice(0, 20).map((i) => this.#summary(i));
      return json(200, {
        inProgress: s(actionable.filter((i) => i.status === 'in_progress').sort(recent)),
        highPriority: s(
          open
            .filter((i) => ['high', 'critical'].includes(i.priority))
            .sort(byDue)
            .sort((a, b) => Number(b.priority === 'critical') - Number(a.priority === 'critical')),
        ),
        overdue: s(open.filter((i) => i.dueAt && i.dueAt < today).sort(byDue)),
        upcoming: s(open.filter((i) => i.dueAt && i.dueAt >= today && i.dueAt <= horizon).sort(byDue)),
        recentlyUpdated: s([...actionable].sort(recent).slice(0, 10)),
      });
    }
    if (route === 'GET /search') {
      const q = (query.get('q') ?? '').toLowerCase();
      const hits = [];
      for (const i of this.#filed()) {
        const body = textOf(i.content);
        const matchedIn = i.title.toLowerCase().includes(q)
          ? 'title'
          : i.tags.some((t) => t.includes(q))
            ? 'tags'
            : body.toLowerCase().includes(q)
              ? 'content'
              : null;
        if (!matchedIn) continue;
        const at = body.toLowerCase().indexOf(q);
        hits.push({
          item: this.#summary(i),
          snippet: at >= 0 ? body.slice(Math.max(0, at - 60), at + 100) : null,
          matchedIn,
          score: matchedIn === 'title' ? 3 : matchedIn === 'tags' ? 2 : 1,
        });
      }
      return json(200, { hits: hits.sort((a, b) => b.score - a.score) });
    }
    if (route === 'GET /schedule') {
      const from = new Date(query.get('from'));
      const to = new Date(query.get('to'));
      const entries = this.entries
        .flatMap((e) => this.#expand(e, from, to))
        .filter((e) => new Date(e.startAt) < to && new Date(e.endAt) > from);
      return json(200, { entries });
    }

    if (method === 'GET' && /^\/items\/[^/]+$/.test(path)) {
      const item = find();
      return item ? json(200, { item }) : err(404, 'NOT_FOUND', 'Item not found.');
    }
    if (method === 'GET' && path.endsWith('/ancestors')) {
      const chain = [];
      for (let p = find()?.parentId; p; p = this.items.find((i) => i.id === p)?.parentId)
        chain.unshift(this.#summary(this.items.find((i) => i.id === p)));
      return json(200, { items: chain });
    }
    if (method === 'GET' && path.endsWith('/links')) return json(200, { outgoing: [], backlinks: [] });
    if (method === 'GET' && path.endsWith('/schedule'))
      return json(200, { entries: this.entries.filter((e) => e.itemId === id) });

    if (route === 'POST /items') {
      const item = this.#newItem(body);
      this.items.push(item);
      return json(201, { item });
    }
    if (route === 'POST /inbox') {
      const item = this.#newItem({ ...body, parentId: null, inboxedAt: now() });
      this.items.push(item);
      return json(201, { item });
    }
    if (method === 'PATCH' && /^\/items\/[^/]+$/.test(path)) {
      const item = find();
      if (!item) return err(404, 'NOT_FOUND', 'Item not found.');
      Object.assign(item, body, { version: item.version + 1, updatedAt: now() });
      if (body.type) item.nature = natureOf(body.type);
      return json(200, { item });
    }
    if (method === 'DELETE' && /^\/items\/[^/]+$/.test(path)) {
      const item = find();
      if (!item) return err(404, 'NOT_FOUND', 'Item not found.');
      item.deletedAt = now();
      return json(200, { ok: true, affected: 1 });
    }
    if (route === 'POST /schedule') {
      const t = now();
      const entry = {
        id: oid(),
        kind: body.kind,
        itemId: body.itemId ?? null,
        title: body.title ?? '',
        startAt: body.startAt,
        endAt: body.endAt,
        isAllDay: body.isAllDay ?? false,
        color: body.color ?? null,
        recurrence: body.recurrence ?? 'none',
        seriesId: null,
        seriesIndex: null,
        createdAt: t,
        updatedAt: t,
      };
      this.entries.push(entry);
      return json(201, { entry });
    }
    return err(501, 'NOT_IMPLEMENTED', `Mock API has no ${route}`);
  }
}

/** Serves `/api/v1/*` for one Playwright browser context from a MockWorkspace. */
export async function routeMock(context, workspace, unhandled) {
  await context.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace('/api/v1', '');
    let body;
    try {
      body = req.postData() ? JSON.parse(req.postData()) : undefined;
    } catch {
      body = undefined;
    }
    const res = workspace.handle(req.method(), path, url.searchParams, body);
    if (res.status === 501) unhandled.add(`${req.method()} ${path}`);
    await route.fulfill({
      status: res.status,
      contentType: 'application/json',
      body: JSON.stringify(res.body),
    });
  });
}
