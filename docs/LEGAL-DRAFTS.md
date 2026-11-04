# NIWA — Legal drafts for review (B-01 B0 + B3)

**Status:** ✅ Approved by the owner on 2026-11-04 with A = Philippines, B = MIT, C = yes. Published as `/privacy`,
`/terms`, `/eula` and `LICENSE`; the web pages are the source of truth from now on.
**Prepared:** 2026-11-04 · **Plan:** `NIWA-PLAN-B-01.md` §B0, §B3, §B4
**Not legal advice.** These were written from the code by the developer's assistant, not by a lawyer. The
owner chose not to have them reviewed (B0 item 5). They aim to be plain, honest and cautious.

Once approved, each section below becomes a page in the web app (`/privacy`, `/terms`, `/eula`), the repo
`LICENSE` file, and the small text changes listed in §7.

---

## 1. Your B0 answers, as recorded

| # | Question | Your answer | How the drafts use it |
|---|---|---|---|
| 1 | Who may sign up | Everyone (done) | Already live: `REGISTRATION_MODE=open` |
| 2 | Operator and contact | Moeko Works · zoletakyle.1111@gmail.com · <https://moekoworks.vercel.app/> | Named as operator; the email is the privacy/support contact on every page |
| 3 | Governing law, minimum age | "Play it safe" | Minimum age **16** (the strictest common default, so it covers the EU and most other places). Governing law: see ⚠ A below |
| 4 | Code licence | Open source | Proposed **MIT** licence — see ⚠ B |
| 5 | Legal review | None | Recorded; drafts say plainly that they're written by a solo developer |
| 6 | Hosting regions | Singapore for everything | Database and API in Singapore. Web pages are static files served by Vercel's worldwide network (no region to choose). Needs one config change — see §7 |
| 7 | Sign off the data table | Not sure | Because the code is public, anyone can check these claims. I re-checked the code and **added three things the first table missed** (IP addresses, full request addresses in logs, public image links) — see §2 "What NIWA collects" |

### ⚠ Needs your answer before this goes live

**A. Which country do you live in?** Terms normally say which country's law applies, and it should be the
operator's home country — not Singapore just because the servers are there. Until you answer, the Terms say
"the laws of the country where the operator lives" and promise that users keep the protections of their own
local consumer law (that part is the "play it safe" bit and stays either way).

**B. MIT or AGPL-3.0?** Both are open source.
- **MIT (recommended, used in the drafts):** short, the most widely understood, anyone may reuse the code for
  anything, including closed copies. Least trouble for you.
- **AGPL-3.0:** anyone who runs a modified NIWA as a website must publish their changes. Protects the project
  more, but is longer and some people avoid it.

**C. Optional code tweak I recommend (privacy):** request logs currently store the full address of each
request, which for searches includes what the user typed (`/search?q=…`). I suggest logging the path without
the query. If you approve, §2 drops that sentence.

---

## 2. Privacy Policy — `/privacy`

> **Privacy Policy**
> Last updated: [date of publishing]
>
> NIWA is a notes, tasks and planning app made and run by one person, **Moeko Works**
> (<https://moekoworks.vercel.app/>). This page explains what NIWA stores about you, why, where, and how to
> get it or delete it. NIWA's code is open source, so you can check everything written here yourself.
>
> Questions or requests: **zoletakyle.1111@gmail.com**
>
> **The short version**
> - NIWA stores your account and the things you write, so the app can work. Nothing else.
> - No ads, no analytics, no tracking cookies, and your data is never sold or shared for marketing.
> - Each account has its own private workspace. Other users can't see it.
> - You can export your data or delete your account at any time in Settings › Account.
>
> **What NIWA collects**
>
> | What | Why | Where it's kept |
> |---|---|---|
> | Your email address | To sign you in and contact you if you write to us | Database (MongoDB Atlas, Singapore) |
> | Your password — **only as a secure hash** (Argon2id); the password itself is never stored | To sign you in | Database |
> | Everything you create: notes, ideas, projects, tasks, tags, links between items, schedule entries, Inbox captures, and the finished/skipped state of the welcome tour | This is the app | Database |
> | Images you add to notes | Shown inside your notes | Cloudinary (image hosting) |
> | Sign-in sessions: a hashed session token, the kind of app (web or mobile), and when it expires | To keep you signed in and let you "sign out everywhere" | Database |
> | Your IP address | To limit repeated sign-in attempts and protect the service from abuse | Temporary counters (Render Key Value, Singapore), cleared after 1–15 minutes |
> | Request logs: time, IP address, browser/app information (user agent), the address requested, and the result. Passwords, tokens, cookies and note text are removed from logs | To run the service and fix problems | Render (hosting), kept for a limited time set by Render |
>
> NIWA does **not** collect: your name, phone number, location, contacts, payment details, advertising IDs, or
> analytics about how you use the app.
>
> **On your phone (mobile app)**
> The mobile app keeps a copy of your items on the phone so it works offline, a queue of things you captured
> while offline, your reminders and your theme. This stays on the device and is deleted when you log out
> (except the theme). Reminders are scheduled by your phone itself — NIWA has no push-notification server.
> The app asks for the camera or photo library only when you choose to add an image, and for notifications
> only if you turn reminders on.
>
> **Cookies**
> One cookie, `niwa_rt`, keeps you signed in on the web. There are no other cookies. Details: `/cookies`.
>
> **Images are private by link, not by password**
> Images you add are stored at long, random web addresses. They aren't listed anywhere, but anyone who has an
> image's exact address can open it. Don't add images you couldn't risk being seen if a link were shared.
>
> **Who else handles your data**
> NIWA uses these services to run. They process data only to provide their service:
> - **MongoDB Atlas** — database (Singapore)
> - **Render** — runs the NIWA server and the rate-limit counters (Singapore)
> - **Vercel** — delivers the web app's pages from its worldwide network
> - **Cloudinary** — stores and delivers images (Cloudinary decides where files are stored; this may be outside
>   Singapore)
>
> These are companies based in the United States, so your data may be handled under their policies outside
> your country. NIWA does not use any other service with your data and does not use AI on your data.
> (If an AI feature is ever added, it will be off by default, used only when you ask, and this policy will be
> updated first.)
>
> **How long things are kept**
> - **Your account and content:** until you delete them or your account.
> - **Items in Trash:** deleted for good 30 days after you move them there.
> - **Images removed from a note:** deleted 7 days later (in case you undo).
> - **Sign-in sessions:** expire after 14 days without use, then are removed.
> - **Rate-limit counters:** 1 to 15 minutes.
> - **Request logs:** a limited time set by Render.
> - **Backups:** none at the moment. If backups are switched on, they will be encrypted and kept for up to
>   14 days, so deleted data could remain in a backup for up to 14 days. This page will be updated when that
>   happens.
>
> **Your choices and rights**
> - **Get a copy:** Settings › Account › *Export my data* downloads everything as a file.
> - **Change things:** edit or delete any item in the app. To change your email address, write to us.
> - **Delete everything:** Settings › Account › *Delete account*. This deletes your account, workspace, items,
>   schedule, images and sessions straight away. It can't be undone.
> - **Forgot your password?** There's no automatic reset yet. Write to us from the email address on the
>   account and we'll help if we can confirm it's you.
> - **Anything else** (a question, a complaint, a request under your local privacy law): email us. We'll
>   answer within 30 days. You can also complain to the data protection authority where you live.
>
> **Security**
> Passwords are hashed with Argon2id; connections use HTTPS; the sign-in cookie can't be read by page
> scripts; sign-in attempts are rate-limited; logs leave out passwords, tokens and note text; every database
> query is limited to your own workspace. No system is perfectly secure. If a breach affects your data, we
> will tell you by email as soon as we reasonably can.
>
> **Children**
> NIWA is not for anyone under 16. If you're under 16, please don't create an account. If we learn an
> account belongs to someone under 16, we'll delete it.
>
> **Changes**
> If this policy changes, the date above changes and the old version stays visible in the project's public
> history. For important changes, we'll also tell signed-in users in the app before they take effect.

---

## 3. Terms of Use — `/terms`

> **Terms of Use**
> Last updated: [date of publishing]
>
> These terms are the agreement between you and **Moeko Works** (the person who makes and runs NIWA) for
> using NIWA at niwa-delta.vercel.app and in the NIWA apps. By creating an account you agree to them.
> Contact: zoletakyle.1111@gmail.com
>
> **1. Who can use NIWA**
> You must be at least 16. You're responsible for your account and for keeping your password safe. One person
> per account.
>
> **2. Your content is yours**
> You own what you write and upload. You give Moeko Works permission only to store, process and show it to you,
> as needed to run NIWA (for example, saving your notes and showing them on your devices). That permission ends
> when you delete the content or your account, except for copies in short-term backups (see the Privacy Policy).
>
> **3. Acceptable use**
> Don't use NIWA to:
> - break the law or store illegal content;
> - upload malware, or try to break into, overload or probe the service or other people's accounts;
> - get around rate limits or security measures, or scrape the service in bulk;
> - store content that infringes someone else's rights.
>
> We may suspend or delete accounts that break these rules, especially if they put the service or other users
> at risk. Where reasonable, we'll tell you first.
>
> **4. A free service from one person**
> NIWA is free and run by a single developer on free-tier hosting. That means:
> - it can be slow to wake up, can be unavailable, and features can change or be removed;
> - there is no guaranteed uptime and no guaranteed support;
> - **keep your own copy of anything important** — use *Export my data* regularly.
>
> If NIWA is ever shut down, we'll give at least 30 days' notice in the app (where possible) so you can export
> your data.
>
> **5. No warranty**
> NIWA is provided "as is" and "as available", without warranties of any kind, to the extent the law allows.
>
> **6. Limits on liability**
> To the extent the law allows, Moeko Works is not liable for lost data, lost profits, or indirect or
> consequential damages arising from using NIWA, and total liability is limited to the amount you paid for
> NIWA (which is zero). Nothing in these terms limits liability that can't be limited by law, or removes rights
> you have under the consumer protection laws of the country where you live.
>
> **7. Ending your use**
> You can stop using NIWA and delete your account at any time in Settings › Account. We can end these terms
> or close accounts as described in section 3, or if NIWA is shut down (section 4).
>
> **8. The code**
> NIWA's source code is open source under the MIT licence. That licence covers the
> code; these terms cover using the hosted service.
>
> **9. Changes**
> If these terms change, the date above changes. For important changes we'll tell signed-in users in the app
> before they take effect. If you keep using NIWA after that, the new terms apply; if you don't agree, you can
> delete your account.
>
> **10. Law and disputes**
> These terms are governed by the laws of **the Republic of the Philippines**. If something goes wrong, please email us
> first — we'll try to sort it out informally. This doesn't take away any right you have to bring a claim in
> the courts of the country where you live.

---

## 4. EULA — `/eula` (mobile and desktop apps)

Because NIWA is open source, the app licence is simply the code licence. The page is short and says so.

> **App licence (EULA)**
> Last updated: [date of publishing]
>
> The NIWA mobile and desktop apps are open source software by **Moeko Works**, released under the **MIT
> licence [or AGPL-3.0 — see ⚠ B]**. You may use, copy, change and share the apps under that licence; its
> full text is on `/licenses` and in the source code.
>
> - The apps are provided "as is", without warranty, as the licence says.
> - Using the apps with the hosted NIWA service is also covered by the **Terms of Use** and **Privacy
>   Policy**.
> - If you got the app from an app store, that store's own terms also apply between you and the store. The
>   store is not responsible for the app or its support — contact zoletakyle.1111@gmail.com instead.
> - Third-party components inside the apps keep their own licences, listed in the app under Settings ›
>   Account › Open-source licences.

---

## 5. `LICENSE` (repo root) — MIT, if ⚠ B = MIT

```text
MIT License

Copyright (c) 2026 Moeko Works

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

If you pick AGPL-3.0 instead, the file is the official AGPL-3.0 text (long; copied unchanged from gnu.org).

---

## 6. Small text changes

- **Sign-up form** (web and mobile), under the button:
  "By creating an account you agree to the [Terms of Use] and [Privacy Policy], and confirm you're at least 16."
- **Footer** (public pages): Privacy · Terms · App licence · Cookies · Licences · © 2026 Moeko Works.
- **Settings › Help** (web and mobile): "Questions or privacy requests: zoletakyle.1111@gmail.com" plus links
  to Privacy, Terms and the source code.
- **Cookies page:** add the contact email at the bottom.
- **Landing page "privacy" section:** add a link to the Privacy Policy.

---

## 7. What I'll code after you approve

1. Pages `/privacy`, `/terms`, `/eula` from §2–§4 (same layout as `/cookies`), footer and sitemap links,
   sign-up line, Settings › Help contact (web); sign-up line, links and contact in the Flutter app.
2. `LICENSE` file + `"license"` field in each `package.json`.
3. `render.yaml`: `region: singapore` for the API and Key Value (today it has no region, so Render would use
   its default, Oregon, USA). Atlas: choose the Singapore region when you create the cluster (`docs/OPS.md`).
4. If you approve ⚠ C: request logs keep the path but drop the query string.
5. Update `NIWA-PLAN-B-01.md` (B0 ticked, B3 done), `GAPS.md`, `LOGS.md`, and record "no legal review — owner's
   choice" in `LOGS.md`.

**Please reply with:** your country (⚠ A), MIT or AGPL-3.0 (⚠ B), yes/no on the log tweak (⚠ C), and any
wording you want changed.
