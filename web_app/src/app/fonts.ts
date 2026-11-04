import notoJpWordmark from '../assets/fonts/noto-sans-jp-101-400-normal.woff2';
import interLatinExt from '@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2';
import interLatin from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2';
import monoLatin from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2';

/**
 * Self-hosted brand fonts (NIWA-PLAN-B-01 B5), registered through CssBaseline so the pure-MUI rule holds
 * (no stylesheet imports). Each face has its unicode-range, so browsers only fetch what a page uses.
 *
 * - Inter (variable, 100–900): Latin + Latin Extended — ~130 KB, enough for the UI copy.
 * - Noto Sans JP: only the ~10 KB slice holding the wordmark's 庭 (U+5EAD), vendored from
 *   @fontsource/noto-sans-jp 5.3.1 (OFL, see assets/fonts/NotoSansJP-OFL.txt). Other Japanese text falls back
 *   to the system font; ship more slices if Japanese UI copy is ever added.
 * - JetBrains Mono (variable, Latin, ~40 KB) for code in notes. Registered under the token's own name
 *   ("JetBrains Mono"), so `typography.monoFamily` picks it up unchanged.
 */
export const fontFaces = `
@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url(${interLatin}) format('woff2-variations');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url(${interLatinExt}) format('woff2-variations');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329,
    U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(${notoJpWordmark}) format('woff2');
  unicode-range: U+5EAD;
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 100 800;
  src: url(${monoLatin}) format('woff2-variations');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
`;
