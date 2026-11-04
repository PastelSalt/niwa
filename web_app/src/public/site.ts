import { useEffect } from 'react';

/** Facts shown on the public pages — keep them true of the deployed app (NIWA-PLAN-B-01 "Truth rule"). */
export const site = {
  name: 'NIWA',
  tagline: 'A garden for your ideas.',
  maker: 'Moeko Works',
  makerUrl: 'https://moekoworks.vercel.app/',
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
