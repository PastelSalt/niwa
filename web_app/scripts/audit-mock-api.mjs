/**
 * Serves `/api/v1/*` for the visual audit's `--mock` mode from the playground's in-memory workspace
 * (src/playground/memoryApi.ts — the same code the landing page's playground runs on), for machines where
 * the real in-memory API can't start (no MongoDB binary).
 */
export { MemoryWorkspace as MockWorkspace } from '../src/playground/memoryApi.ts';

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
