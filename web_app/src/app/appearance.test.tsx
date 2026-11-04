import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { AppearanceProvider, readCachedAppearance, useAppearance, useUserAppearance } from './appearance.tsx';
import { fontFacesFor } from './fonts.ts';
import { createNiwaTheme } from './theme.ts';

afterEach(() => localStorage.clear());

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
    let setSignedIn: (v: boolean) => void = () => {};
    function Harness() {
      const [signedIn, set] = useState(true);
      setSignedIn = set;
      return (
        <>
          <Probe />
          {signedIn && <SignedIn />}
        </>
      );
    }
    render(
      <AppearanceProvider defaultMode="light">
        <Harness />
      </AppearanceProvider>,
    );
    expect(screen.getByText('garden/inter')).toBeInTheDocument();
    expect(readCachedAppearance()).toEqual({ theme: 'garden', font: 'inter' });
    act(() => setSignedIn(false));
    expect(screen.getByText('garden/fredoka')).toBeInTheDocument();
  });
});
