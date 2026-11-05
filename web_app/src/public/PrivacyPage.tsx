import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Link as RouterLink } from 'react-router';
import { LegalPage } from './LegalPage.tsx';
import { site } from './site.ts';

/**
 * Privacy Policy (NIWA-PLAN-B-01 B3.P1), approved by the owner 2026-11-04 (`docs/LEGAL-DRAFTS.md`).
 * Every row must stay true of the code — update this page in the same change as the code.
 */
const COLLECTED: [what: string, why: string, where: string][] = [
  [
    'Your email address',
    'To sign you in and reply if you write to us',
    'Database (MongoDB Atlas, Singapore)',
  ],
  [
    'Your password — only as a secure hash (Argon2id); the password itself is never stored',
    'To sign you in',
    'Database',
  ],
  [
    'Everything you create: notes, ideas, projects, tasks, tags, links between items, schedule entries, Inbox captures, and whether you finished or skipped the welcome tour',
    'This is the app',
    'Database',
  ],
  ['Images you add to notes', 'Shown inside your notes', 'Cloudinary (image hosting)'],
  [
    'Your settings: colour theme, font, light or dark, and — if you pick one — your country and region for holidays',
    'To show NIWA the way you chose on every device, and your public holidays in the Calendar',
    'Database, with your account',
  ],
  [
    'Sign-in sessions: a hashed session token, the kind of app (web or mobile), and when it expires',
    'To keep you signed in and let you sign out everywhere',
    'Database',
  ],
  [
    'Only if an account is disabled for breaking the Terms: when, and a short reason',
    'To keep the service safe and answer questions about it',
    'Database, until the account is re-enabled or deleted',
  ],
  [
    'Your IP address',
    'To limit repeated sign-in attempts and protect the service from abuse',
    'Temporary counters (Render Key Value, Singapore), cleared after 1–15 minutes',
  ],
  [
    'Request logs: time, IP address, browser or app information (user agent), the page or endpoint requested (without search terms), and the result. Passwords, tokens, cookies and note text are left out',
    'To run the service and fix problems',
    'Render (hosting), kept for a limited time set by Render',
  ],
];

export function PrivacyPage() {
  const mail = <Link href={`mailto:${site.contactEmail}`}>{site.contactEmail}</Link>;
  return (
    <LegalPage title="Privacy Policy" updated={site.privacyUpdated}>
      <p>
        NIWA is a notes, tasks and planning app made and run by one person,{' '}
        <Link href={site.makerUrl} target="_blank" rel="noopener">
          {site.maker}
        </Link>
        . This page explains what NIWA stores about you, why, where, and how to get it or delete it.
        NIWA&apos;s code is{' '}
        <Link href={site.sourceUrl} target="_blank" rel="noopener">
          open source
        </Link>
        , so you can check everything written here yourself.
      </p>
      <p>Questions or requests: {mail}</p>

      <h2>The short version</h2>
      <ul>
        <li>NIWA stores your account and the things you write, so the app can work. Nothing else.</li>
        <li>
          No ads, no analytics, no tracking cookies, and your data is never sold or shared for marketing.
        </li>
        <li>Each account has its own private workspace. Other users can&apos;t see it.</li>
        <li>You can export your data or delete your account at any time in Settings › Account.</li>
      </ul>

      <h2>What NIWA collects</h2>
      <Table size="small" aria-label="What NIWA collects" sx={{ my: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>What</TableCell>
            <TableCell>Why</TableCell>
            <TableCell>Where it&apos;s kept</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {COLLECTED.map(([what, why, where]) => (
            <TableRow key={what}>
              <TableCell>{what}</TableCell>
              <TableCell>{why}</TableCell>
              <TableCell>{where}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p>
        NIWA does <strong>not</strong> collect your name, phone number, location, contacts, payment details,
        advertising IDs, or analytics about how you use the app.
      </p>

      <h2>On your phone (mobile app)</h2>
      <p>
        The mobile app keeps a copy of your items on the phone so it works offline, a queue of things you
        captured while offline, your reminders and your theme. This stays on the device and is deleted when
        you log out (except the theme). Reminders are scheduled by your phone itself — NIWA has no
        push-notification server. The app asks for the camera or photo library only when you choose to add an
        image, and for notifications only if you turn reminders on.
      </p>

      <h2>Cookies</h2>
      <p>
        One cookie, <code>niwa_rt</code>, keeps you signed in on the web. There are no other cookies. Details:{' '}
        <Link component={RouterLink} to="/cookies">
          Cookies
        </Link>
        .
      </p>

      <h2>Images are private by link, not by password</h2>
      <p>
        Images you add are stored at long, random web addresses. They aren&apos;t listed anywhere, but anyone
        who has an image&apos;s exact address can open it. Don&apos;t add images you couldn&apos;t risk being
        seen if a link were shared.
      </p>

      <h2>Who else handles your data</h2>
      <p>NIWA uses these services to run. They process data only to provide their service:</p>
      <ul>
        <li>
          <strong>MongoDB Atlas</strong> — database (Singapore)
        </li>
        <li>
          <strong>Render</strong> — runs the NIWA server and the rate-limit counters (Singapore)
        </li>
        <li>
          <strong>Vercel</strong> — delivers the web app&apos;s pages from its worldwide network
        </li>
        <li>
          <strong>Cloudinary</strong> — stores and delivers images (Cloudinary decides where files are stored;
          this may be outside Singapore)
        </li>
      </ul>
      <p>
        These are companies based in the United States, so your data may be handled under their policies
        outside your country. NIWA does not use any other service with your data and does not use AI on your
        data. If an AI feature is ever added, it will be off by default, used only when you ask, and this
        policy will be updated first.
      </p>

      <h2>How long things are kept</h2>
      <ul>
        <li>
          <strong>Your account and content:</strong> until you delete them or your account.
        </li>
        <li>
          <strong>Items in Trash:</strong> deleted for good 30 days after you move them there.
        </li>
        <li>
          <strong>Images removed from a note:</strong> deleted 7 days later (in case you undo).
        </li>
        <li>
          <strong>Sign-in sessions:</strong> expire after 14 days without use, then are removed.
        </li>
        <li>
          <strong>Rate-limit counters:</strong> 1 to 15 minutes.
        </li>
        <li>
          <strong>Request logs:</strong> a limited time set by Render.
        </li>
        <li>
          <strong>Backups:</strong> none at the moment. If backups are switched on, they will be encrypted and
          kept for up to 14 days, so deleted data could remain in a backup for up to 14 days. This page will
          be updated when that happens.
        </li>
      </ul>

      <h2>Your choices and rights</h2>
      <ul>
        <li>
          <strong>Get a copy:</strong> Settings › Account › Export my data downloads everything as a file.
        </li>
        <li>
          <strong>Change things:</strong> edit or delete any item in the app. To change your email address,
          write to us.
        </li>
        <li>
          <strong>Delete everything:</strong> Settings › Account › Delete account. This deletes your account,
          workspace, items, schedule, images and sessions straight away. It can&apos;t be undone.
        </li>
        <li>
          <strong>Forgot your password?</strong> There&apos;s no automatic reset yet. Write to us from the
          email address on the account and we&apos;ll help if we can confirm it&apos;s you.
        </li>
        <li>
          <strong>Anything else</strong> (a question, a complaint, a request under your local privacy law):
          email {mail}. We&apos;ll answer within 30 days. You can also complain to the data protection
          authority where you live.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        Passwords are hashed with Argon2id; connections use HTTPS; the sign-in cookie can&apos;t be read by
        page scripts; sign-in attempts are rate-limited; logs leave out passwords, tokens and note text; every
        database query is limited to your own workspace. No system is perfectly secure. If a breach affects
        your data, we will tell you by email as soon as we reasonably can.
      </p>

      <h2>Children</h2>
      <p>
        NIWA is not for anyone under 16. If you&apos;re under 16, please don&apos;t create an account. If we
        learn an account belongs to someone under 16, we&apos;ll delete it.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the date above changes and the old version stays visible in the project&apos;s{' '}
        <Link href={site.sourceUrl} target="_blank" rel="noopener">
          public history
        </Link>
        . For important changes, we&apos;ll also tell signed-in users in the app before they take effect.
      </p>
    </LegalPage>
  );
}
