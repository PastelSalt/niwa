import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router';
import { LegalPage } from './LegalPage.tsx';
import { site } from './site.ts';

/** App licence / EULA (NIWA-PLAN-B-01 B3.P3). NIWA is open source, so the app licence is the MIT licence. */
export function EulaPage() {
  return (
    <LegalPage title="App licence" updated={site.legalUpdated}>
      <p>
        The NIWA mobile and desktop apps are open source software by <strong>{site.maker}</strong>, released
        under the <strong>MIT licence</strong>. You may use, copy, change and share the apps under that
        licence; its full text is in the{' '}
        <Link href={`${site.sourceUrl}/blob/main/LICENSE`} target="_blank" rel="noopener">
          source code
        </Link>
        .
      </p>
      <ul>
        <li>The apps are provided &quot;as is&quot;, without warranty, as the licence says.</li>
        <li>
          Using the apps with the hosted NIWA service is also covered by the{' '}
          <Link component={RouterLink} to="/terms">
            Terms of Use
          </Link>{' '}
          and{' '}
          <Link component={RouterLink} to="/privacy">
            Privacy Policy
          </Link>
          .
        </li>
        <li>
          If you got the app from an app store, that store&apos;s own terms also apply between you and the
          store. The store is not responsible for the app or its support — contact{' '}
          <Link href={`mailto:${site.contactEmail}`}>{site.contactEmail}</Link> instead.
        </li>
        <li>
          Third-party components inside the apps keep their own licences, listed in the app under Settings ›
          Account › Open-source licences (mobile) and on{' '}
          <Link component={RouterLink} to="/licenses">
            Licences
          </Link>{' '}
          (web).
        </li>
      </ul>
    </LegalPage>
  );
}
