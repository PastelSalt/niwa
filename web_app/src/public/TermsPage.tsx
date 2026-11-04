import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router';
import { LegalPage } from './LegalPage.tsx';
import { site } from './site.ts';

/** Terms of Use (NIWA-PLAN-B-01 B3.P2), approved by the owner 2026-11-04 (`docs/LEGAL-DRAFTS.md`). */
export function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated={site.legalUpdated}>
      <p>
        These terms are the agreement between you and <strong>{site.maker}</strong> (the person who makes and
        runs NIWA) for using NIWA on the web and in the NIWA apps. By creating an account you agree to them.
        Contact: <Link href={`mailto:${site.contactEmail}`}>{site.contactEmail}</Link>
      </p>

      <h2>1. Who can use NIWA</h2>
      <p>
        You must be at least 16. You&apos;re responsible for your account and for keeping your password safe.
        One person per account.
      </p>

      <h2>2. Your content is yours</h2>
      <p>
        You own what you write and upload. You give {site.maker} permission only to store, process and show it
        to you, as needed to run NIWA (for example, saving your notes and showing them on your devices). That
        permission ends when you delete the content or your account, except for copies in short-term backups
        (see the{' '}
        <Link component={RouterLink} to="/privacy">
          Privacy Policy
        </Link>
        ).
      </p>

      <h2>3. Acceptable use</h2>
      <p>Don&apos;t use NIWA to:</p>
      <ul>
        <li>break the law or store illegal content;</li>
        <li>
          upload malware, or try to break into, overload or probe the service or other people&apos;s accounts;
        </li>
        <li>get around rate limits or security measures, or scrape the service in bulk;</li>
        <li>store content that infringes someone else&apos;s rights.</li>
      </ul>
      <p>
        We may suspend or delete accounts that break these rules, especially if they put the service or other
        users at risk. Where reasonable, we&apos;ll tell you first.
      </p>

      <h2>4. A free service from one person</h2>
      <p>NIWA is free and run by a single developer on free-tier hosting. That means:</p>
      <ul>
        <li>it can be slow to wake up, can be unavailable, and features can change or be removed;</li>
        <li>there is no guaranteed uptime and no guaranteed support;</li>
        <li>
          each account has limits on how many items and how much image storage it can use; you can see them in
          Settings › Account;
        </li>
        <li>
          <strong>keep your own copy of anything important</strong> — use Export my data (Settings › Account)
          regularly.
        </li>
      </ul>
      <p>
        If NIWA is ever shut down, we&apos;ll give at least 30 days&apos; notice in the app (where possible)
        so you can export your data.
      </p>

      <h2>5. No warranty</h2>
      <p>
        NIWA is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind, to
        the extent the law allows.
      </p>

      <h2>6. Limits on liability</h2>
      <p>
        To the extent the law allows, {site.maker} is not liable for lost data, lost profits, or indirect or
        consequential damages arising from using NIWA, and total liability is limited to the amount you paid
        for NIWA (which is zero). Nothing in these terms limits liability that can&apos;t be limited by law,
        or removes rights you have under the consumer protection laws of the country where you live.
      </p>

      <h2>7. Ending your use</h2>
      <p>
        You can stop using NIWA and delete your account at any time in Settings › Account. We can end these
        terms or close accounts as described in section 3, or if NIWA is shut down (section 4).
      </p>

      <h2>8. The code</h2>
      <p>
        NIWA&apos;s{' '}
        <Link href={site.sourceUrl} target="_blank" rel="noopener">
          source code
        </Link>{' '}
        is open source under the MIT licence. That licence covers the code; these terms cover using the hosted
        service.
      </p>

      <h2>9. Changes</h2>
      <p>
        If these terms change, the date above changes. For important changes we&apos;ll tell signed-in users
        in the app before they take effect. If you keep using NIWA after that, the new terms apply; if you
        don&apos;t agree, you can delete your account.
      </p>

      <h2>10. Law and disputes</h2>
      <p>
        These terms are governed by the laws of the Republic of the Philippines. If something goes wrong,
        please email us first — we&apos;ll try to sort it out informally. This doesn&apos;t take away any
        right you have to bring a claim in the courts of the country where you live.
      </p>
    </LegalPage>
  );
}
