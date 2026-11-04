import { createApiClient } from '@niwa/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from '../auth/AuthProvider.tsx';
import {
  AppearanceProvider,
  readCachedAppearance,
  toAppearance,
  useAppearance,
  useUserAppearance,
} from './appearance.tsx';
import { fontFacesFor } from './fonts.ts';
import { createNiwaTheme } from './theme.ts';

afterEach(() => localStorage.clear());

/** Signed out: enough of the app around a hook that reads the session. */
function Signedout({ children }: { children: ReactNode }) {
  const api = createApiClient({
    baseUrl: '/api/v1',
    fetch: vi.fn(
      async () => new Response('{"error":{"code":"UNAUTHORIZED","message":"No"}}', { status: 401 }),
    ),
  });
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider api={api}>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

describe('theme plumbing (B-02 V1.P4)', () => {
  it('builds the theme from a theme id + font id; defaults are Garden + Fredoka', () => {
    const def = createNiwaTheme();
    expect(def.niwa).toMatchObject({ themeId: 'garden', fontId: 'fredoka' });
    expect(def.typography.fontFamily).toMatch(/^"Fredoka Variable"/);
    expect(createNiwaTheme('garden', 'inter').typography.fontFamily).toMatch(/^"Inter Variable"/);
  });

  it('uses the 15 px body size and token widths', () => {
    const t = createNiwaTheme();
    expect(t.typography.body1.fontSize).toBe('0.9375rem');
    expect(t.niwa.width.list).toBeGreaterThan(t.niwa.width.reading);
  });

  it("registers only the chosen family's font files", () => {
    expect(fontFacesFor('fredoka')).toContain("'Fredoka Variable'");
    expect(fontFacesFor('fredoka')).not.toContain("'Inter Variable'");
    expect(fontFacesFor('inter')).not.toContain("'Fredoka Variable'");
    expect(fontFacesFor('system')).not.toMatch(/Fredoka|Inter/);
    // The wordmark slice and code font are always there.
    for (const f of ['fredoka', 'inter', 'system'] as const) {
      expect(fontFacesFor(f)).toContain("'Noto Sans JP'");
      expect(fontFacesFor(f)).toContain("'JetBrains Mono'");
    }
  });

  it('falls back to the defaults for unknown or broken cached ids', () => {
    expect(toAppearance({ theme: 'lavender', font: 'atkinson' })).toEqual({
      theme: 'lavender',
      font: 'atkinson',
    });
    localStorage.setItem('niwa.appearance', JSON.stringify({ theme: 'neon', font: 'comic' }));
    expect(readCachedAppearance()).toEqual({ theme: 'garden', font: 'fredoka' });
    localStorage.setItem('niwa.appearance', '{not json');
    expect(readCachedAppearance()).toEqual({ theme: 'garden', font: 'fredoka' });
  });

  it("signed-in screens show the user's font; leaving them returns to the defaults", () => {
    function Probe() {
      const { active } = useAppearance();
      return <p>{`${active.theme}/${active.font}`}</p>;
    }
    function SignedIn() {
      useUserAppearance({ theme: 'garden', font: 'inter' });
      return null;
    }
    function Harness() {
      const [signedIn, setSignedIn] = useState(true);
      return (
        <>
          <Probe />
          <button onClick={() => setSignedIn(false)}>Sign out</button>
          {signedIn && <SignedIn />}
        </>
      );
    }
    render(
      <AppearanceProvider defaultMode="light">
        <Signedout>
          <Harness />
        </Signedout>
      </AppearanceProvider>,
    );
    expect(screen.getByText('garden/inter')).toBeInTheDocument();
    expect(readCachedAppearance()).toEqual({ theme: 'garden', font: 'inter' });
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByText('garden/fredoka')).toBeInTheDocument();
  });
});

describe('ids shared with the API contract', () => {
  it('every theme and font the API accepts exists in the tokens, and vice versa', async () => {
    const { FONT_IDS, THEME_IDS } = await import('@niwa/contracts');
    const { fonts, themes } = await import('@niwa/tokens');
    expect([...THEME_IDS].sort()).toEqual(Object.keys(themes).sort());
    expect([...FONT_IDS].sort()).toEqual(Object.keys(fonts).sort());
  });
});
