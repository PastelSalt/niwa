import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import * as ai from './ai.ts';
import * as att from './attachment.ts';
import * as auth from './auth.ts';
import { ErrorEnvelope, HealthResponse, IdParams } from './common.ts';
import * as item from './item.ts';
import * as link from './link.ts';
import * as schedule from './schedule.ts';
import * as search from './search.ts';
import { Workspace } from './workspace.ts';

export const CONTRACT_VERSION = '0.1.0';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface RouteSpec {
  summary: string;
  tag: string;
  description?: string;
  /** Defaults to true (Bearer access token). */
  auth?: boolean;
  params?: z.ZodObject;
  query?: z.ZodObject;
  body?: z.ZodType;
  /** Success body; `null` = 204 No Content. */
  response: z.ZodType | null;
  status?: 200 | 201;
}

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ErrorEnvelope } },
});

export function buildRegistry(): OpenAPIRegistry {
  const registry = new OpenAPIRegistry();

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  const add = (method: Method, path: string, r: RouteSpec) => {
    const okStatus = r.response === null ? 204 : (r.status ?? 200);
    registry.registerPath({
      method,
      path,
      summary: r.summary,
      description: r.description,
      tags: [r.tag],
      security: r.auth === false ? [] : [{ bearerAuth: [] }],
      request: {
        params: r.params,
        query: r.query,
        body: r.body ? { content: { 'application/json': { schema: r.body } }, required: true } : undefined,
      },
      responses: {
        [okStatus]:
          r.response === null
            ? { description: 'No content' }
            : { description: 'Success', content: { 'application/json': { schema: r.response } } },
        400: errorResponse('Validation error'),
        ...(r.auth === false ? {} : { 401: errorResponse('Missing or invalid access token') }),
        404: errorResponse('Not found'),
        409: errorResponse('Version conflict or duplicate'),
        429: errorResponse('Rate limited'),
        500: errorResponse('Server error'),
      },
    });
  };

  // ---- Health ----
  add('get', '/health', { tag: 'System', summary: 'Liveness check', auth: false, response: HealthResponse });

  // ---- Auth (specs §12.1) ----
  add('post', '/auth/register', {
    tag: 'Auth',
    summary: 'Create an account (gated by REGISTRATION_MODE)',
    auth: false,
    body: auth.RegisterInput,
    response: auth.AuthResponse,
    status: 201,
  });
  add('post', '/auth/login', {
    tag: 'Auth',
    summary: 'Log in',
    auth: false,
    body: auth.LoginInput,
    response: auth.AuthResponse,
  });
  add('post', '/auth/refresh', {
    tag: 'Auth',
    summary: 'Rotate refresh token and issue a new access token',
    description:
      'Web: refresh token from the `niwa_rt` HttpOnly cookie and requires header `X-Requested-With: niwa`. ' +
      'Native: send `X-Client: desktop|mobile` and `refreshToken` in the body. Reusing a rotated token revokes the session family.',
    auth: false,
    body: auth.RefreshInput,
    response: auth.AuthResponse,
  });
  add('post', '/auth/logout', {
    tag: 'Auth',
    summary: 'Revoke the current refresh session',
    auth: false,
    body: auth.RefreshInput,
    response: null,
  });
  add('post', '/auth/logout-all', {
    tag: 'Auth',
    summary: 'Sign out everywhere: revoke every refresh session of the current user',
    response: null,
  });
  add('get', '/auth/me', { tag: 'Auth', summary: 'Current user', response: auth.MeResponse });
  add('get', '/auth/config', {
    tag: 'Auth',
    summary: 'Whether this server accepts new accounts right now',
    auth: false,
    response: auth.AuthConfig,
  });

  // ---- Account (NIWA-PLAN-B-01 B4, B7) ----
  add('put', '/account/onboarding', {
    tag: 'Account',
    summary: 'Record that the user finished or skipped the onboarding tour',
    body: auth.OnboardingInput,
    response: auth.MeResponse,
  });
  add('post', '/account/password', {
    tag: 'Account',
    summary: 'Change password; signs out every other session and returns a fresh one',
    body: auth.ChangePasswordInput,
    response: auth.AuthResponse,
  });
  add('get', '/account/export', {
    tag: 'Account',
    summary: 'Download everything this account owns as JSON',
    response: auth.AccountExport,
  });
  add('post', '/account/delete', {
    tag: 'Account',
    summary: 'Permanently delete the account, its workspace, items, schedule, images and sessions',
    body: auth.DeleteAccountInput,
    response: null,
  });

  // ---- Workspace ----
  add('get', '/workspace', {
    tag: 'Workspace',
    summary: 'The single workspace',
    response: z.object({ workspace: Workspace }),
  });

  // ---- Items (specs §6, DATA_MODEL.md) ----
  add('get', '/tree', {
    tag: 'Items',
    summary: 'Every filed item as a flat list (build the hierarchy from parentId)',
    query: item.TreeQuery,
    response: item.ItemListResponse,
  });
  add('get', '/items', {
    tag: 'Items',
    summary: 'List items (children of a parent, or filtered)',
    query: item.ListItemsQuery,
    response: item.ItemListResponse,
  });
  add('post', '/items', {
    tag: 'Items',
    summary: 'Create an item',
    body: item.CreateItemInput,
    response: item.ItemResponse,
    status: 201,
  });
  add('get', '/items/{id}', {
    tag: 'Items',
    summary: 'Get one item',
    params: IdParams,
    response: item.ItemResponse,
  });
  add('patch', '/items/{id}', {
    tag: 'Items',
    summary: 'Update fields (optimistic concurrency via `version`)',
    params: IdParams,
    body: item.UpdateItemInput,
    response: item.ItemResponse,
  });
  add('delete', '/items/{id}', {
    tag: 'Items',
    summary: 'Soft delete (cascades to descendants)',
    params: IdParams,
    response: item.DeleteResponse,
  });
  add('get', '/items/{id}/ancestors', {
    tag: 'Items',
    summary: 'Breadcrumb path from root to the parent',
    params: IdParams,
    response: item.ItemListResponse,
  });
  add('post', '/items/{id}/move', {
    tag: 'Items',
    summary: 'Move and/or reorder',
    params: IdParams,
    body: item.MoveItemInput,
    response: item.ItemResponse,
  });
  add('post', '/items/{id}/archive', {
    tag: 'Items',
    summary: 'Archive',
    params: IdParams,
    body: item.VersionInput,
    response: item.ItemResponse,
  });
  add('post', '/items/{id}/unarchive', {
    tag: 'Items',
    summary: 'Unarchive',
    params: IdParams,
    body: item.VersionInput,
    response: item.ItemResponse,
  });
  add('post', '/items/{id}/restore', {
    tag: 'Trash',
    summary: 'Restore a deleted batch (to its parent, or to Inbox if the parent is gone)',
    params: IdParams,
    response: item.RestoreResponse,
  });
  add('delete', '/items/{id}/permanent', {
    tag: 'Trash',
    summary: 'Delete permanently (items, links, schedule entries, attachments)',
    params: IdParams,
    response: item.DeleteResponse,
  });
  add('post', '/items/{id}/file', {
    tag: 'Inbox',
    summary: 'File an inbox item under a parent',
    params: IdParams,
    body: item.FileItemInput,
    response: item.ItemResponse,
  });
  add('post', '/items/{id}/promote-section', {
    tag: 'Knowledge',
    summary: 'Promote a heading section to a child item',
    params: IdParams,
    body: item.PromoteSectionInput,
    response: item.PromoteSectionResponse,
  });

  add('get', '/focus', {
    tag: 'Actionable',
    summary: 'Focus sections',
    query: item.FocusQuery,
    response: item.FocusResponse,
  });
  add('get', '/review', {
    tag: 'Knowledge',
    summary: 'Review queue (reviewAt due today or earlier)',
    query: item.ReviewQuery,
    response: item.ItemListResponse,
  });
  add('get', '/inbox', { tag: 'Inbox', summary: 'Inbox items', response: item.ItemListResponse });
  add('post', '/inbox', {
    tag: 'Inbox',
    summary: 'Quick capture',
    body: item.CaptureInput,
    response: item.ItemResponse,
    status: 201,
  });
  add('get', '/trash', {
    tag: 'Trash',
    summary: 'Deleted items (batch roots)',
    response: item.ItemListResponse,
  });

  add('get', '/tags', { tag: 'Tags', summary: 'All tags with counts', response: item.TagListResponse });
  add('post', '/tags/rename', {
    tag: 'Tags',
    summary: 'Rename / merge a tag across all items',
    body: item.RenameTagInput,
    response: item.RenameTagResponse,
  });

  // ---- Links ----
  add('get', '/items/{id}/links', {
    tag: 'Knowledge',
    summary: 'Outgoing links and backlinks',
    params: IdParams,
    response: link.ItemLinksResponse,
  });
  add('post', '/links', {
    tag: 'Knowledge',
    summary: 'Add a related-item link',
    body: link.CreateLinkInput,
    response: z.object({ link: link.Link }),
    status: 201,
  });
  add('delete', '/links/{id}', {
    tag: 'Knowledge',
    summary: 'Remove a manual link',
    params: IdParams,
    response: null,
  });

  // ---- Scheduler (docs/SCHEDULER.md) ----
  add('get', '/items/{id}/schedule', {
    tag: 'Scheduler',
    summary: 'Upcoming time blocks for an item (its derived scheduled time)',
    params: IdParams,
    response: schedule.ScheduleListResponse,
  });
  add('get', '/schedule', {
    tag: 'Scheduler',
    summary: 'Entries overlapping a range (materializes recurrences)',
    query: schedule.ScheduleRangeQuery,
    response: schedule.ScheduleListResponse,
  });
  add('post', '/schedule', {
    tag: 'Scheduler',
    summary: 'Create an event or block',
    body: schedule.CreateScheduleEntryInput,
    response: schedule.ScheduleEntryResponse,
    status: 201,
  });
  add('patch', '/schedule/{id}', {
    tag: 'Scheduler',
    summary: 'Update an entry',
    params: IdParams,
    query: schedule.ScheduleScopeQuery,
    body: schedule.UpdateScheduleEntryInput,
    response: schedule.ScheduleEntryResponse,
  });
  add('delete', '/schedule/{id}', {
    tag: 'Scheduler',
    summary: 'Delete an entry',
    params: IdParams,
    query: schedule.ScheduleScopeQuery,
    response: null,
  });

  // ---- Search ----
  add('get', '/search', {
    tag: 'Search',
    summary: 'Search titles, tags and content',
    query: search.SearchQuery,
    response: search.SearchResponse,
  });

  // ---- Uploads (Cloudinary) ----
  add('get', '/uploads/config', {
    tag: 'Uploads',
    summary: 'Whether image uploads are configured, and their limits',
    response: att.UploadConfigResponse,
  });
  add('post', '/uploads/sign', {
    tag: 'Uploads',
    summary: 'Get a signed Cloudinary upload',
    body: att.UploadSignatureRequest,
    response: att.UploadSignatureResponse,
  });
  add('post', '/attachments', {
    tag: 'Uploads',
    summary: 'Confirm an uploaded image',
    body: att.ConfirmAttachmentInput,
    response: att.AttachmentResponse,
    status: 201,
  });
  add('delete', '/attachments/{id}', {
    tag: 'Uploads',
    summary: 'Delete an attachment',
    params: IdParams,
    response: null,
  });

  // ---- AI (DeepSeek) ----
  add('get', '/ai/status', {
    tag: 'AI',
    summary: 'AI settings and whether a key is stored',
    response: ai.AiStatusResponse,
  });
  add('put', '/ai/key', {
    tag: 'AI',
    summary: 'Store the DeepSeek key (encrypted; never returned)',
    body: ai.SetAiKeyInput,
    response: ai.AiStatusResponse,
  });
  add('delete', '/ai/key', { tag: 'AI', summary: 'Remove the stored key', response: ai.AiStatusResponse });
  add('patch', '/ai/settings', {
    tag: 'AI',
    summary: 'Enable / disable AI',
    body: ai.AiSettingsInput,
    response: ai.AiStatusResponse,
  });
  add('post', '/ai/items/{id}/summarize', {
    tag: 'AI',
    summary: 'Summarize an item',
    params: IdParams,
    body: ai.AiActionInput,
    response: ai.SummarizeResponse,
  });
  add('post', '/ai/items/{id}/breakdown', {
    tag: 'AI',
    summary: 'Suggest child breakdown (drafts land in Inbox)',
    params: IdParams,
    body: ai.AiActionInput,
    response: ai.BreakdownResponse,
  });
  add('post', '/ai/items/{id}/autotag', {
    tag: 'AI',
    summary: 'Suggest 3–5 tags',
    params: IdParams,
    body: ai.AiActionInput,
    response: ai.AutoTagResponse,
  });

  return registry;
}

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(buildRegistry().definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'NIWA API',
      version: CONTRACT_VERSION,
      description:
        'A garden for your ideas. Generated from Zod schemas in @niwa/contracts — do not edit by hand.',
    },
    servers: [{ url: '/api/v1' }],
  });
}
