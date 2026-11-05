import { useEffect } from 'react';

/** Facts shown on the public pages — keep them true of the deployed app (NIWA-PLAN-B-01 "Truth rule"). */
export const site = {
  name: 'NIWA',
  tagline: 'A garden for your ideas.',
  maker: 'Moeko Works',
  makerUrl: 'https://moekoworks.vercel.app/',
  /** Privacy, support and legal contact (B-01 B0, approved 2026-11-04). */
  contactEmail: 'zoletakyle.1111@gmail.com',
  sourceUrl: 'https://github.com/PastelSalt/niwa',
  /** Date the Privacy Policy, Terms and app licence were published. */
  legalUpdated: '4 November 2026',
  // The Privacy Policy changed on its own date (B-01 B8: settings and holiday country).
  privacyUpdated: '5 November 2026',
} as const;

/** Sets the tab title while the page is mounted; the app's default title comes back afterwards. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
