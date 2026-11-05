import type {
  FocusResponse,
  Item,
  ItemSummary,
  Preferences,
  PublicUser,
  ScheduleEntry,
} from '@niwa/contracts';

/**
 * An in-memory stand-in for the NIWA API (NIWA-PLAN-B-02 V11): the landing page's playground runs the real
 * app against it, entirely in the visitor's browser — no account, no network, nothing saved. It implements
 * what the screens read plus the everyday writes (create, edit, complete, capture, file, move, delete,
 * schedule); anything else answers "not in the example". Behaviour mirrors the real services where a
 * visitor can see it (tree order, Focus sections, review queue, weekly repeats, search).
 */

interface Reply {
  status: number;
  body: unknown;
}

const ACTIONABLE = ['project', 'task'];
const natureOf = (type: string) => (ACTIONABLE.includes(type) ? 'actionable' : 'knowledge') as Item['nature'];
const json = (status: number, body: unknown): Reply => ({ status, body });
const err = (status: number, code: string, message: string) => json(status, { error: { code, message } });

let counter = 0;
/** 24 hex characters, like a Mongo id, so screens that check id shapes are happy. */
const oid = () =>
  (Date.now().toString(16).padStart(12, '0') + (++counter).toString(16).padStart(12, '0')).slice(-24);
const nowIso = () => new Date().toISOString();

function textOf(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (n.type === 'text') return n.text ?? '';
  return (n.content ?? []).map(textOf).join(' ');
}

/** Local calendar day `YYYY-MM-DD`, shifted by `days`. */
export function localDay(days = 0, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const addDays = (day: string, n: number) => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return localDay(n, new Date(y, m - 1, d));
};

/**
 * Real public holidays for the Philippines, 2026–2027, generated from `date-holidays` (the backend's source,
 * ISC; data CC BY 3.0). The playground can't carry the whole data set, so the example garden is set to PH.
 */
const PH_HOLIDAYS: [date: string, name: string, localName: string][] = [
  ['2026-01-01', "New Year's Day", "New Year's Day"],
  ['2026-03-20', 'End of Ramadan (Eid al-Fitr)', 'End of Ramadan (Eid al-Fitr)'],
  ['2026-04-02', 'Maundy Thursday', 'Maundy Thursday'],
  ['2026-04-03', 'Good Friday', 'Good Friday'],
  ['2026-04-05', 'Easter Sunday', 'Easter Sunday'],
  ['2026-04-09', 'Day of Valor', 'Day of Valor'],
  ['2026-05-01', 'Labour Day', 'Labour Day'],
  ['2026-05-27', 'Feast of the Sacrifice (Eid al-Adha)', 'Feast of the Sacrifice (Eid al-Adha)'],
  ['2026-06-12', 'Independence Day', 'Independence Day'],
  ['2026-08-31', "National Heroes' Day", "National Heroes' Day"],
  ['2026-11-30', 'Bonifacio Day', 'Bonifacio Day'],
  ['2026-12-25', 'Christmas Day', 'Christmas Day'],
  ['2026-12-30', 'Rizal Day', 'Rizal Day'],
  ['2027-01-01', "New Year's Day", "New Year's Day"],
  ['2027-03-09', 'End of Ramadan (Eid al-Fitr)', 'End of Ramadan (Eid al-Fitr)'],
  ['2027-03-25', 'Maundy Thursday', 'Maundy Thursday'],
  ['2027-03-26', 'Good Friday', 'Good Friday'],
  ['2027-03-28', 'Easter Sunday', 'Easter Sunday'],
  ['2027-04-09', 'Day of Valor', 'Day of Valor'],
  ['2027-05-01', 'Labour Day', 'Labour Day'],
  ['2027-05-16', 'Feast of the Sacrifice (Eid al-Adha)', 'Feast of the Sacrifice (Eid al-Adha)'],
  ['2027-06-12', 'Independence Day', 'Independence Day'],
  ['2027-08-30', "National Heroes' Day", "National Heroes' Day"],
  ['2027-11-30', 'Bonifacio Day', 'Bonifacio Day'],
  ['2027-12-25', 'Christmas Day', 'Christmas Day'],
  ['2027-12-30', 'Rizal Day', 'Rizal Day'],
];

export interface MemoryWorkspaceOptions {
  email?: string;
  onboarded?: boolean;
  preferences?: Partial<Preferences>;
}

export class MemoryWorkspace {
  user: PublicUser;
  items: Item[] = [];
  entries: ScheduleEntry[] = [];
  signedIn = true;

  constructor({
    email = 'example@niwa.example',
    onboarded = true,
    preferences = {},
  }: MemoryWorkspaceOptions = {}) {
    const t = nowIso();
    this.user = {
      id: oid(),
      email,
      workspaceId: oid(),
      aiEnabled: false,
      hasAiKey: false,
      createdAt: t,
      onboarding: onboarded ? { status: 'skipped', version: 1, at: t } : null,
      preferences: {
        theme: 'garden',
        font: 'fredoka',
        mode: 'system',
        holidays: { country: null, region: null, observances: false },
        ...preferences,
      },
    };
    for (const title of ['Knowledge', 'Projects', 'College', 'Personal'])
      this.items.push(this.newItem({ parentId: null, title, type: 'note' }));
  }

  root(title: string): string {
    return this.items.find((i) => i.parentId === null && i.title === title)!.id;
  }

  newItem(input: Partial<Item> & { title: string; parentId: string | null }): Item {
    const siblings = this.items.filter((i) => i.parentId === input.parentId && !i.inboxedAt);
    const t = nowIso();
    const type = input.type ?? 'note';
    return {
      id: oid(),
      workspaceId: this.user.workspaceId,
      parentId: input.parentId,
      title: input.title,
      content: input.content ?? null,
      type,
      nature: natureOf(type),
      status: input.status ?? 'not_started',
      priority: input.priority ?? 'none',
      orderKey: `a${String(siblings.length).padStart(4, '0')}`,
      tags: input.tags ?? [],
      dueAt: input.dueAt ?? null,
      estimatedMinutes: input.estimatedMinutes ?? null,
      reviewAt: input.reviewAt ?? null,
      sourceUrl: input.sourceUrl ?? null,
      inboxedAt: input.inboxedAt ?? null,
      suggestedParentId: input.suggestedParentId ?? null,
      archivedAt: null,
      deletedAt: null,
      version: 1,
      createdAt: t,
      updatedAt: t,
      completedAt: input.status === 'completed' ? t : null,
    };
  }

  add(input: Partial<Item> & { title: string; parentId: string | null }): Item {
    const item = this.newItem(input);
    this.items.push(item);
    return item;
  }

  private summary(item: Item): ItemSummary {
    const { content: _content, ...rest } = item;
    return rest;
  }

  private live() {
    return this.items.filter((i) => !i.deletedAt && !i.archivedAt);
  }

  private filed() {
    return this.live().filter((i) => !i.inboxedAt);
  }

  private descendants(id: string): Item[] {
    const kids = this.items.filter((i) => i.parentId === id);
    return kids.flatMap((k) => [k, ...this.descendants(k.id)]);
  }

  private expand(entry: ScheduleEntry, from: Date, to: Date): ScheduleEntry[] {
    if (entry.recurrence === 'none') return [entry];
    const out: ScheduleEntry[] = [];
    const len = Date.parse(entry.endAt) - Date.parse(entry.startAt);
    const step = entry.recurrence === 'daily' ? 1 : entry.recurrence === 'weekly' ? 7 : 0;
    for (let i = 0; i < 400; i++) {
      const start = new Date(entry.startAt);
      if (step) start.setDate(start.getDate() + i * step);
      else start.setMonth(start.getMonth() + i);
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

  /** One API call; `path` is relative to `/api/v1`. */
  handle(
    method: string,
    path: string,
    query: URLSearchParams,
    body: Record<string, unknown> | undefined,
  ): Reply {
    const route = `${method} ${path}`;
    const id = path.split('/')[2] ?? '';
    const find = () => this.items.find((i) => i.id === id);
    const session = () => json(200, { accessToken: 'example', expiresIn: 3600, user: this.user });

    // ---- session & account
    if (route === 'POST /auth/refresh')
      return this.signedIn ? session() : err(401, 'UNAUTHORIZED', 'Signed out.');
    if (route === 'POST /auth/login' || route === 'POST /auth/register') {
      this.signedIn = true;
      return session();
    }
    if (route === 'POST /auth/logout' || route === 'POST /auth/logout-all') {
      this.signedIn = false;
      return json(200, { ok: true });
    }
    if (route === 'GET /auth/me') return json(200, { user: this.user });
    if (route === 'GET /auth/config') return json(200, { registrationOpen: true });
    if (route === 'PUT /account/onboarding') {
      const b = body as { status: 'completed' | 'skipped'; version: number };
      this.user = { ...this.user, onboarding: { status: b.status, version: b.version, at: nowIso() } };
      return json(200, { user: this.user });
    }
    if (route === 'PUT /account/preferences') {
      this.user = {
        ...this.user,
        preferences: {
          ...this.user.preferences,
          ...(body as Partial<Preferences>),
          holidays: { ...this.user.preferences.holidays, ...(body as Partial<Preferences>).holidays },
        },
      };
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

    // ---- reads
    if (route === 'GET /tree') return json(200, { items: this.filed().map((i) => this.summary(i)) });
    if (route === 'GET /inbox')
      return json(200, {
        items: this.live()
          .filter((i) => i.inboxedAt)
          .map((i) => this.summary(i)),
      });
    if (route === 'GET /trash')
      return json(200, {
        items: this.items
          .filter(
            (i) => i.deletedAt && !(i.parentId && this.items.find((p) => p.id === i.parentId)?.deletedAt),
          )
          .map((i) => this.summary(i)),
      });
    if (route === 'GET /review') {
      const today = query.get('today') ?? localDay();
      return json(200, {
        items: this.filed()
          .filter((i) => i.reviewAt && i.reviewAt <= today)
          .map((i) => this.summary(i)),
      });
    }
    if (route === 'GET /tags') {
      const counts = new Map<string, number>();
      for (const i of this.filed()) for (const t of i.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
      return json(200, { tags: [...counts].map(([tag, count]) => ({ tag, count })) });
    }
    if (route === 'GET /focus') {
      const today = query.get('today') ?? localDay();
      const horizon = addDays(today, Number(query.get('upcomingDays') ?? 7));
      const actionable = this.filed().filter((i) => ACTIONABLE.includes(i.type));
      const open = actionable.filter((i) => i.status !== 'completed');
      const byDue = (a: Item, b: Item) => (a.dueAt ?? '9').localeCompare(b.dueAt ?? '9');
      const recent = (a: Item, b: Item) => b.updatedAt.localeCompare(a.updatedAt);
      const s = (list: Item[]) => list.slice(0, 20).map((i) => this.summary(i));
      const focus: FocusResponse = {
        inProgress: s(actionable.filter((i) => i.status === 'in_progress').sort(recent)),
        highPriority: s(
          open
            .filter((i) => i.priority === 'high' || i.priority === 'critical')
            .sort(byDue)
            .sort((a, b) => Number(b.priority === 'critical') - Number(a.priority === 'critical')),
        ),
        overdue: s(open.filter((i) => i.dueAt && i.dueAt < today).sort(byDue)),
        upcoming: s(open.filter((i) => i.dueAt && i.dueAt >= today && i.dueAt <= horizon).sort(byDue)),
        recentlyUpdated: s([...actionable].sort(recent).slice(0, 10)),
      };
      return json(200, focus);
    }
    if (route === 'GET /search') {
      const q = (query.get('q') ?? '').toLowerCase();
      const hits = [];
      for (const i of this.filed()) {
        const text = textOf(i.content);
        const matchedIn = i.title.toLowerCase().includes(q)
          ? 'title'
          : i.tags.some((t) => t.includes(q))
            ? 'tags'
            : text.toLowerCase().includes(q)
              ? 'content'
              : null;
        if (!matchedIn) continue;
        const at = text.toLowerCase().indexOf(q);
        hits.push({
          item: this.summary(i),
          snippet: at >= 0 ? text.slice(Math.max(0, at - 60), at + 100) : null,
          matchedIn,
          score: matchedIn === 'title' ? 3 : matchedIn === 'tags' ? 2 : 1,
        });
      }
      return json(200, { hits: hits.sort((a, b) => b.score - a.score) });
    }
    if (route === 'GET /holidays') {
      const { country } = this.user.preferences.holidays;
      const from = query.get('from') ?? '';
      const to = query.get('to') ?? '';
      const holidays =
        country === 'PH'
          ? PH_HOLIDAYS.filter(([d]) => d >= from && d <= to).map(([date, name, localName]) => ({
              date,
              name,
              localName,
              type: 'public',
            }))
          : [];
      return json(200, { country, holidays });
    }
    if (route === 'GET /holidays/countries')
      return json(200, { places: [{ code: 'PH', name: 'Philippines' }] });
    if (route === 'GET /holidays/regions') return json(200, { places: [] });
    if (route === 'GET /schedule') {
      const from = new Date(query.get('from')!);
      const to = new Date(query.get('to')!);
      return json(200, {
        entries: this.entries
          .flatMap((e) => this.expand(e, from, to))
          .filter((e) => new Date(e.startAt) < to && new Date(e.endAt) > from),
      });
    }
    if (method === 'GET' && /^\/items\/[^/]+$/.test(path)) {
      const item = find();
      return item && !item.deletedAt ? json(200, { item }) : err(404, 'NOT_FOUND', 'Item not found.');
    }
    if (method === 'GET' && path.endsWith('/ancestors')) {
      const chain: ItemSummary[] = [];
      for (let p = find()?.parentId; p; p = this.items.find((i) => i.id === p)?.parentId)
        chain.unshift(this.summary(this.items.find((i) => i.id === p)!));
      return json(200, { items: chain });
    }
    if (method === 'GET' && path.endsWith('/links')) return json(200, { outgoing: [], backlinks: [] });
    if (method === 'GET' && path.endsWith('/schedule'))
      return json(200, { entries: this.entries.filter((e) => e.itemId === id) });

    // ---- writes
    if (route === 'POST /items') {
      const b = body as Partial<Item> & { title: string; parentId: string | null };
      return json(201, { item: this.add({ ...b, title: b.title.trim() }) });
    }
    if (route === 'POST /inbox') {
      const b = body as { title: string; type?: Item['type'] };
      return json(201, {
        item: this.add({
          title: b.title.trim(),
          type: b.type ?? 'idea',
          parentId: null,
          inboxedAt: nowIso(),
        }),
      });
    }
    if (method === 'PATCH' && /^\/items\/[^/]+$/.test(path)) {
      const item = find();
      if (!item) return err(404, 'NOT_FOUND', 'Item not found.');
      const { version: _v, ...changes } = body as Partial<Item> & { version?: number };
      Object.assign(item, changes, { version: item.version + 1, updatedAt: nowIso() });
      if (changes.type) item.nature = natureOf(changes.type);
      if (changes.status) item.completedAt = changes.status === 'completed' ? nowIso() : null;
      return json(200, { item });
    }
    if (method === 'POST' && (path.endsWith('/move') || path.endsWith('/file'))) {
      const item = find();
      if (!item) return err(404, 'NOT_FOUND', 'Item not found.');
      const b = body as {
        parentId: string | null;
        type?: Item['type'];
        dueAt?: string | null;
        tags?: string[];
      };
      Object.assign(item, {
        parentId: b.parentId,
        inboxedAt: null,
        ...(b.type && { type: b.type, nature: natureOf(b.type) }),
        ...(b.dueAt !== undefined && { dueAt: b.dueAt }),
        ...(b.tags && { tags: b.tags }),
        orderKey: `z${Date.now()}`,
        version: item.version + 1,
        updatedAt: nowIso(),
      });
      return json(200, { item });
    }
    if (method === 'POST' && (path.endsWith('/archive') || path.endsWith('/unarchive'))) {
      const item = find();
      if (!item) return err(404, 'NOT_FOUND', 'Item not found.');
      item.archivedAt = path.endsWith('/archive') ? nowIso() : null;
      item.version += 1;
      return json(200, { item });
    }
    if (method === 'DELETE' && /^\/items\/[^/]+$/.test(path)) {
      const item = find();
      if (!item) return err(404, 'NOT_FOUND', 'Item not found.');
      const all = [item, ...this.descendants(item.id)];
      for (const i of all) i.deletedAt = nowIso();
      return json(200, { ok: true, affected: all.length });
    }
    if (method === 'POST' && path.endsWith('/restore')) {
      const item = find();
      if (!item) return err(404, 'NOT_FOUND', 'Item not found.');
      const all = [item, ...this.descendants(item.id)];
      for (const i of all) i.deletedAt = null;
      return json(200, { item, restoredTo: 'original', restoredCount: all.length });
    }
    if (method === 'DELETE' && path.endsWith('/permanent')) {
      const gone = new Set([id, ...this.descendants(id).map((i) => i.id)]);
      this.items = this.items.filter((i) => !gone.has(i.id));
      return json(200, { ok: true, affected: gone.size });
    }
    if (route === 'POST /schedule') {
      const b = body as Partial<ScheduleEntry> & {
        startAt: string;
        endAt: string;
        kind: ScheduleEntry['kind'];
      };
      const t = nowIso();
      const entry: ScheduleEntry = {
        id: oid(),
        kind: b.kind,
        itemId: b.itemId ?? null,
        title: b.title ?? '',
        startAt: b.startAt,
        endAt: b.endAt,
        isAllDay: b.isAllDay ?? false,
        color: b.color ?? null,
        recurrence: b.recurrence ?? 'none',
        seriesId: null,
        seriesIndex: null,
        createdAt: t,
        updatedAt: t,
      };
      this.entries.push(entry);
      return json(201, { entry });
    }
    if ((method === 'PATCH' || method === 'DELETE') && path.startsWith('/schedule/')) {
      const base = id.split('_')[0];
      const entry = this.entries.find((e) => e.id === base);
      if (!entry) return err(404, 'NOT_FOUND', 'Entry not found.');
      if (method === 'DELETE') {
        this.entries = this.entries.filter((e) => e !== entry);
        return json(200, { ok: true });
      }
      Object.assign(entry, body, { updatedAt: nowIso() });
      return json(200, { entry });
    }
    return err(
      501,
      'NOT_IN_EXAMPLE',
      'That isn’t part of the example. Create an account to use it for real.',
    );
  }

  /** A `fetch` for the api client: answers `/api/v1/*` from memory. */
  fetch = async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(String(input), 'http://example.invalid');
    const path = url.pathname.replace(/^\/api\/v1/, '');
    let body: Record<string, unknown> | undefined;
    try {
      body = typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : undefined;
    } catch {
      body = undefined;
    }
    const res = this.handle((init.method ?? 'GET').toUpperCase(), path, url.searchParams, body);
    return new Response(res.status === 204 ? null : JSON.stringify(res.body), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
