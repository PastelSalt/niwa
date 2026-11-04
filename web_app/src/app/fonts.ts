import notoJpWordmark from '../assets/fonts/noto-sans-jp-101-400-normal.woff2';
import fredokaLatinExt from '@fontsource-variable/fredoka/files/fredoka-latin-ext-wght-normal.woff2';
import fredokaLatin from '@fontsource-variable/fredoka/files/fredoka-latin-wght-normal.woff2';
import interLatinExt from '@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2';
import interLatin from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2';
import monoLatin from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2';
import type { FontId } from '@niwa/tokens';

/**
 * Self-hosted fonts (NIWA-PLAN-B-01 B5, B-02 V1.P4), registered through CssBaseline so the pure-MUI rule
 * holds (no stylesheet imports). The theme only registers the **selected** family, so the browser never
 * downloads the others; each face also has its unicode-range, so only the scripts a page uses are fetched.
 *
 * - Fredoka (variable, 300–700; default): Latin + Latin Extended (~30 KB for Latin). No Japanese glyphs.
 * - Inter (variable, 100–900): Latin + Latin Extended (~130 KB).
 * - System: nothing to download.
 * - Always: Noto Sans JP — only the ~10 KB slice holding the wordmark's 庭 (U+5EAD), vendored from
 *   @fontsource/noto-sans-jp 5.3.1 (OFL, see assets/fonts/NotoSansJP-OFL.txt) — and JetBrains Mono
 *   (variable, Latin, ~40 KB) for code in notes, under the token's own name ("JetBrains Mono").
 */

const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';

const face = (family: string, weights: string, src: string, range: string) => `
@font-face {
  font-family: '${family}';
  font-style: normal;
  font-display: swap;
  font-weight: ${weights};
  src: url(${src}) format('woff2-variations');
  unicode-range: ${range};
}`;

const FAMILY_FACES: Record<FontId, string> = {
  fredoka:
    face('Fredoka Variable', '300 700', fredokaLatin, LATIN) +
    face('Fredoka Variable', '300 700', fredokaLatinExt, LATIN_EXT),
  inter:
    face('Inter Variable', '100 900', interLatin, LATIN) +
    face('Inter Variable', '100 900', interLatinExt, LATIN_EXT),
  system: '',
};

const SHARED_FACES = `
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(${notoJpWordmark}) format('woff2');
  unicode-range: U+5EAD;
}
${face('JetBrains Mono', '100 800', monoLatin, LATIN)}
`;

/** @font-face rules for one font choice plus the shared wordmark and code faces. */
export function fontFacesFor(font: FontId): string {
  return FAMILY_FACES[font] + SHARED_FACES;
}
