import {
  CSRF_HEADER,
  CSRF_HEADER_VALUE,
  NATIVE_CLIENT_HEADER,
  type AuthResponse,
  type CaptureInput,
  type CreateItemInput,
  type CreateLinkInput,
  type CreateScheduleEntryInput,
  type EditScope,
  type DeleteResponse,
  type ErrorCode,
  type ErrorEnvelope,
  type FileItemInput,
  type FocusResponse,
  type HealthResponse,
  type Item,
  type ItemLinksResponse,
  type ItemSummary,
  type Link,
  type ListItemsQuery,
  type LoginInput,
  type MoveItemInput,
  type PublicUser,
  type RegisterInput,
  type RestoreResponse,
  type SearchQuery,
  type SearchResponse,
  type ScheduleEntry,
  type UpdateScheduleEntryInput,
  type UpdateItemInput,
  type Attachment,
  type ConfirmAttachmentInput,
  type UploadConfigResponse,
  type UploadSignatureResponse,
  type Workspace,
} from '@niwa/contracts';

/**
 * Typed NIWA API client shared by web and desktop. Types come straight from `@niwa/contracts`
 * (the same Zod schemas that generate openapi.yaml), so no code generation is needed for TS clients.
 * Mobile generates Dart models from openapi.yaml instead (M10).
 *
 * Holds the access token in memory only (specs §12.1) and transparently refreshes once on 401.
 */

export type ClientKind = 'web' | 'desktop' | 'mobile';

export interface RefreshTokenStore {
  /** Native clients only: OS keychain / secure storage. Web uses the HttpOnly cookie instead. */
  get(): Promise<string | null>;
  set(token: string | null): Promise<void>;
}

export interface ApiClientOptions {
  /** e.g. `/api/v1` (web, via rewrite/proxy) or `https://niwa-api.onrender.com/api/v1` (native). */
  baseUrl: string;
  client?: ClientKind;
  refreshTokenStore?: RefreshTokenStore;
  fetch?: typeof fetch;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: unknown;
  readonly requestId: string | undefined;

  constructor(status: number, envelope: ErrorEnvelope['error']) {
    super(envelope.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = envelope.code;
    this.details = envelope.details;
    this.requestId = envelope.requestId;
  }
}

export interface Session {
  accessToken: string;
  user: PublicUser;
}

type SessionListener = (session: Session | null) => void;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Skip bearer auth + refresh-retry (auth endpoints themselves). */
  anonymous?: boolean;
  signal?: AbortSignal;
}

export function createApiClient(options: ApiClientOptions) {
  const clientKind = options.client ?? 'web';
  const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const baseUrl = options.baseUrl.replace(/\/$/, '');

  let session: Session | null = null;
  let refreshing: Promise<Session | null> | null = null;
  const listeners = new Set<SessionListener>();

  function setSession(next: Session | null) {
    session = next;
    for (const l of listeners) l(next);
  }

  function buildUrl(path: string, query?: RequestOptions['query']) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null) qs.set(k, String(v));
    const s = qs.toString();
    return `${baseUrl}${path}${s ? `?${s}` : ''}`;
  }

  function headers(withBody: boolean, accessToken?: string): Record<string, string> {
    const h: Record<string, string> = { Accept: 'application/json' };
    if (withBody) h['Content-Type'] = 'application/json';
    if (accessToken) h.Authorization = `Bearer ${accessToken}`;
    if (clientKind === 'web') h[CSRF_HEADER] = CSRF_HEADER_VALUE;
    else h[NATIVE_CLIENT_HEADER] = clientKind;
    return h;
  }

  async function send<T>(path: string, opts: RequestOptions, accessToken?: string): Promise<T> {
    const hasBody = opts.body !== undefined;
    const res = await doFetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers: headers(hasBody, accessToken),
      body: hasBody ? JSON.stringify(opts.body) : undefined,
      credentials: clientKind === 'web' ? 'same-origin' : 'omit',
      signal: opts.signal,
    });
    if (res.status === 204) return undefined as T;
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const env = (data as ErrorEnvelope | null)?.error;
      throw new ApiError(
        res.status,
        env ?? {
          code: res.status >= 500 ? 'UPSTREAM_ERROR' : 'INTERNAL_ERROR',
          message:
            res.status >= 500
              ? `The NIWA server is unavailable right now (HTTP ${res.status}). Try again shortly.`
              : `Request failed (HTTP ${res.status}).`,
        },
      );
    }
    return data as T;
  }

  async function acceptAuth(res: AuthResponse): Promise<Session> {
    if (clientKind !== 'web' && res.refreshToken) await options.refreshTokenStore?.set(res.refreshToken);
    const next = { accessToken: res.accessToken, user: res.user };
    setSession(next);
    return next;
  }

  /** Single-flight: concurrent 401s share one refresh call. */
  function refresh(): Promise<Session | null> {
    refreshing ??= (async () => {
      try {
        const refreshToken = clientKind === 'web' ? undefined : await options.refreshTokenStore?.get();
        if (clientKind !== 'web' && !refreshToken) {
          setSession(null);
          return null;
        }
        const res = await send<AuthResponse>('/auth/refresh', {
          method: 'POST',
          body: refreshToken ? { refreshToken } : {},
          anonymous: true,
        });
        return await acceptAuth(res);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          await options.refreshTokenStore?.set(null);
          setSession(null);
          return null;
        }
        throw err;
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  }

  async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    if (opts.anonymous) return send<T>(path, opts);
    let token = session?.accessToken ?? (await refresh())?.accessToken;
    if (!token) throw new ApiError(401, { code: 'UNAUTHORIZED', message: 'Not signed in.' });
    try {
      return await send<T>(path, opts, token);
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) throw err;
      token = (await refresh())?.accessToken;
      if (!token) throw err;
      return send<T>(path, opts, token);
    }
  }

  return {
    request,

    getSession: () => session,
    onSessionChange(listener: SessionListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /** Call once at app start: restores a session from the refresh cookie / secure store. */
    restoreSession: () => refresh(),

    health: () => request<HealthResponse>('/health', { anonymous: true }),

    auth: {
      async register(input: RegisterInput) {
        return acceptAuth(await send<AuthResponse>('/auth/register', { method: 'POST', body: input }));
      },
      async login(input: LoginInput) {
        return acceptAuth(await send<AuthResponse>('/auth/login', { method: 'POST', body: input }));
      },
      async logout() {
        const refreshToken = clientKind === 'web' ? undefined : await options.refreshTokenStore?.get();
        try {
          await send<void>('/auth/logout', { method: 'POST', body: refreshToken ? { refreshToken } : {} });
        } finally {
          await options.refreshTokenStore?.set(null);
          setSession(null);
        }
      },
      me: () => request<{ user: PublicUser }>('/auth/me'),
    },

    workspace: {
      get: () => request<{ workspace: Workspace }>('/workspace'),
    },

    items: {
      tree: (includeArchived = false) =>
        request<{ items: ItemSummary[] }>('/tree', {
          query: { includeArchived: includeArchived || undefined },
        }),
      list: (query: ListItemsQuery = {}) => request<{ items: ItemSummary[] }>('/items', { query }),
      get: (id: string) => request<{ item: Item }>(`/items/${id}`),
      ancestors: (id: string) => request<{ items: ItemSummary[] }>(`/items/${id}/ancestors`),
      create: (input: CreateItemInput) => request<{ item: Item }>('/items', { method: 'POST', body: input }),
      update: (id: string, input: UpdateItemInput) =>
        request<{ item: Item }>(`/items/${id}`, { method: 'PATCH', body: input }),
      move: (id: string, input: MoveItemInput) =>
        request<{ item: Item }>(`/items/${id}/move`, { method: 'POST', body: input }),
      archive: (id: string, version: number) =>
        request<{ item: Item }>(`/items/${id}/archive`, { method: 'POST', body: { version } }),
      unarchive: (id: string, version: number) =>
        request<{ item: Item }>(`/items/${id}/unarchive`, { method: 'POST', body: { version } }),
      remove: (id: string) => request<DeleteResponse>(`/items/${id}`, { method: 'DELETE' }),
      restore: (id: string) => request<RestoreResponse>(`/items/${id}/restore`, { method: 'POST' }),
      purge: (id: string) => request<DeleteResponse>(`/items/${id}/permanent`, { method: 'DELETE' }),
      trash: () => request<{ items: ItemSummary[] }>('/trash'),
      focus: (today: string, upcomingDays?: number) =>
        request<FocusResponse>('/focus', { query: { today, upcomingDays } }),
      review: (today: string) => request<{ items: ItemSummary[] }>('/review', { query: { today } }),
      links: (id: string) => request<ItemLinksResponse>(`/items/${id}/links`),
      promoteSection: (id: string, version: number, anchorId: string) =>
        request<{ parent: Item; child: Item }>(`/items/${id}/promote-section`, {
          method: 'POST',
          body: { version, anchorId },
        }),
    },

    inbox: {
      list: () => request<{ items: ItemSummary[] }>('/inbox'),
      capture: (input: CaptureInput) => request<{ item: Item }>('/inbox', { method: 'POST', body: input }),
      file: (id: string, input: FileItemInput) =>
        request<{ item: Item }>(`/items/${id}/file`, { method: 'POST', body: input }),
    },

    search: (query: SearchQuery) => request<SearchResponse>('/search', { query }),

    schedule: {
      range: (from: string, to: string) =>
        request<{ entries: ScheduleEntry[] }>('/schedule', { query: { from, to } }),
      forItem: (itemId: string) => request<{ entries: ScheduleEntry[] }>(`/items/${itemId}/schedule`),
      create: (input: CreateScheduleEntryInput) =>
        request<{ entry: ScheduleEntry }>('/schedule', { method: 'POST', body: input }),
      update: (id: string, input: UpdateScheduleEntryInput, scope: EditScope = 'instance') =>
        request<{ entry: ScheduleEntry }>(`/schedule/${id}`, {
          method: 'PATCH',
          body: input,
          query: { scope },
        }),
      remove: (id: string, scope: EditScope = 'instance') =>
        request<void>(`/schedule/${id}`, { method: 'DELETE', query: { scope } }),
    },

    uploads: {
      config: () => request<UploadConfigResponse>('/uploads/config'),
      sign: (itemId: string) =>
        request<UploadSignatureResponse>('/uploads/sign', { method: 'POST', body: { itemId } }),
      confirm: (input: ConfirmAttachmentInput) =>
        request<{ attachment: Attachment }>('/attachments', { method: 'POST', body: input }),
      remove: (id: string) => request<void>(`/attachments/${id}`, { method: 'DELETE' }),
    },

    links: {
      create: (input: CreateLinkInput) => request<{ link: Link }>('/links', { method: 'POST', body: input }),
      remove: (id: string) => request<void>(`/links/${id}`, { method: 'DELETE' }),
    },

    tags: {
      list: () => request<{ tags: { tag: string; count: number }[] }>('/tags'),
      rename: (from: string, to: string) =>
        request<{ updated: number }>('/tags/rename', { method: 'POST', body: { from, to } }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
