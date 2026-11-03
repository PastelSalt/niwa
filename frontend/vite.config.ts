import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Mirrors the Vercel /api rewrite so cookies behave the same locally (docs/OPS.md §3).
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  // Scan every source file for dependencies up front. Otherwise the first visit to a screen with a
  // new deep import (an icon, a TipTap module) re-optimizes deps and force-reloads every open page.
  optimizeDeps: { entries: ['index.html', 'src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/test/**'] },
  server: {
    port: Number(process.env.PORT ?? 5173),
    strictPort: true,
    proxy: { '/api': { target: apiTarget, changeOrigin: false } },
  },
  preview: {
    proxy: { '/api': { target: apiTarget, changeOrigin: false } },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
});
