import Link from '@mui/material/Link';
import { LegalPage } from './LegalPage.tsx';
import { site } from './site.ts';

/**
 * Cookies (NIWA-PLAN-B-01 B3.P4). Every statement is about the code: the only cookie is set in
 * `backend/src/controllers/auth.controller.ts`; there is no analytics or advertising code.
 */
export function CookiesPage() {
  return (
    <LegalPage title="Cookies" updated="4 November 2026">
      <p>
        NIWA uses one cookie, and only to keep you signed in. There are no analytics, advertising or tracking
        cookies.
      </p>

      <h2>The cookie</h2>
      <ul>
        <li>
          <strong>Name:</strong> <code>niwa_rt</code>
        </li>
        <li>
          <strong>Purpose:</strong> holds your sign-in session so you stay logged in after closing the tab. It
          is strictly necessary for signing in, so no consent banner is shown.
        </li>
        <li>
          <strong>Set when:</strong> you create an account or log in. Logging out removes it.
        </li>
        <li>
          <strong>Lifetime:</strong> 14 days, renewed each time the app refreshes your session.
        </li>
        <li>
          <strong>Protection:</strong> <code>HttpOnly</code> (page scripts can't read it), <code>Secure</code>{' '}
          (sent only over HTTPS), <code>SameSite=Lax</code>, and limited to the sign-in endpoints (
          <code>/api/v1/auth</code>).
        </li>
        <li>
          <strong>Contents:</strong> a random value. The server stores only a hash of it.
        </li>
      </ul>

      <h2>Other storage in your browser</h2>
      <p>
        Your theme choice (light, dark or system) is saved in your browser's local storage. It never leaves
        your device.
      </p>

      <h2>If this changes</h2>
      <p>
        If NIWA ever adds a cookie that isn't strictly necessary, this page will be updated first and you'll
        be asked before it is set.
      </p>

      <h2>Questions</h2>
      <p>
        Email <Link href={`mailto:${site.contactEmail}`}>{site.contactEmail}</Link>.
      </p>
    </LegalPage>
  );
}
