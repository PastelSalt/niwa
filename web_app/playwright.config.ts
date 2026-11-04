import { defineConfig, devices } from '@playwright/test';

// E2E runs the real API on an in-memory MongoDB (backend/scripts/dev-memory.ts) behind the Vite proxy,
// on ports separate from normal dev so both can run at once.
const API_PORT = 4100;
const WEB_PORT = 5174;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  // The tree and knowledge specs are long multi-step journeys; give them room on a busy machine.
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${WEB_PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter @niwa/backend dev:memory',
      env: {
        API_PORT: String(API_PORT),
        LOG_LEVEL: 'warn',
        RATE_LIMIT_AUTH_MAX: '1000',
        RATE_LIMIT_GENERAL_MAX: '100000',
        RATE_LIMIT_ACCOUNT_MAX: '100000',
        // Every spec signs up its own accounts.
        RATE_LIMIT_SIGNUP_PER_HOUR: '1000',
      },
      url: `http://localhost:${API_PORT}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `pnpm exec vite --port ${WEB_PORT}`,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}`, PORT: String(WEB_PORT) },
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
