# CMS Business School · Timetable Platform (front-end demo)

Integrated Timetable Management Platform for **CMS Business School, Jain (Deemed-to-be) University, Lalbagh Campus**.
A complete, front-end-only demo: no backend, no external APIs, no AI service. All data is generated locally and deterministically; email, WhatsApp and the assistant are simulated on screen.

Three areas, chosen from the landing page or the **Demo mode** switch in the header (no login):

| Area | What it does |
| --- | --- |
| **Committee Console** | Dashboard · Master Timetable Builder (drag-and-drop, live clash detection, clash panel with fixes, publish with admin override) · Daily Timetable (swap, substitution, room change, cancellation, extra class, workshop; draft → publish → undo) · Leave Approvals (ranked substitutes, assign and publish) · Rooms & Booking (free-room finder, booking, occupancy heatmap) · Workload Tracker · Calculator (opens in its own tab) · Committee Assistant (simulated) · Data Upload · Audit Trail · Backup & Year-End |
| **Faculty Portal** | My Timetable (all semesters merged, changes flagged, `.ics` export) · Apply for Leave (validated, animated mail flow, mail preview with working Approve/Reject) · Leave History |
| **Student View** | Pick programme, semester, section and electives once (remembered on the device). Today first, then the week, with “Changed” banners. Excel (CSV) and PDF (print) downloads. Installable PWA. |

A hidden **`/perf`** page generates 2,000 simulated users and a 5,000-slot master, benchmarks the clash engine, then mounts the heaviest screen and times it.

---

## Run, build, deploy

Requires Node 20.19+ (tested on Node 24) and Google Chrome (used by the Playwright and Lighthouse scripts).

```bash
npm install
```

```bash
npm run dev
```

Opens on http://localhost:5173.

```bash
npm run build
```

Type-checks, builds the client, then pre-renders the landing page (`dist/index.html`) and writes the app shell (`dist/app.html`).

```bash
npm run preview
```

Serves `dist/` on http://localhost:4173 exactly as Cloudflare Pages will (`/` → pre-rendered page, every other route → app shell).

### Checks

| Command | What it runs |
| --- | --- |
| `npm run typecheck` | `tsc -b` (strict) |
| `npm run lint` | ESLint (0 errors, 0 warnings) |
| `npm test` | Vitest: clash engine, calculator rules, leave rules, daily resolution, assistant intents (36 tests) |
| `npm run e2e` | Playwright smoke tests of the main flows against the production build (7 tests) |
| `npm run screenshots` | Captures every main screen at desktop and phone widths into `docs/screenshots/` and fails on any console error or warning (preview server must be running) |
| `npm run lighthouse` | Lighthouse on five key pages (mobile; `FORM=desktop` for desktop). Reports land in `docs/lighthouse/` |

### Deploy to Cloudflare Pages

1. Push the folder to a Git repository and create a Pages project from it (or upload `dist/` with `npx wrangler pages deploy dist`).
2. Build command `npm run build`, output directory `dist`, environment variable `NODE_VERSION=24`.
3. Nothing else is needed: `public/_redirects` sends app routes to `app.html`, and `public/_headers` sets immutable caching for hashed assets plus basic security headers.

---

## 2-minute demo script for the Dean

1. **Landing (10 s).** “One timetable. Zero clashes.” Point at the three entry cards, then click **Open Committee Console**.
2. **Dashboard (15 s).** Count-up tiles: classes today, open clashes (publish blocked), pending leave, workload alerts. Show **Needs cover today** (a faculty member on today’s approved unplanned leave).
3. **Master Builder (40 s).**
   - The red banner says publishing is blocked. The **Demo scenarios** strip lists what is seeded. Click **Scenario 1**: the grid jumps to the cell and flashes it. The red pulsing cell reads “Dr. Sneha Joshi is already in Semester 5, Section B (WOW), Mon Period 1, Room 305.”
   - Turn **Sound on**, then drag **BBA101** onto Saturday P4 (or any busy teacher’s slot): instant critical alert with a tone. Point at **Last check · 0.0x ms**.
   - Open **Clash panel**, expand **Room double-booked**, click a **Free rooms** suggestion. The critical count drops by one.
   - Click **Scenario 5** (combined class A+B in the Seminar Hall): correctly *not* flagged.
4. **Leave Approvals (20 s).** In **Classes needing cover**, show the ranked substitutes (free, not on leave, same subject area, lowest workload) and click **Assign and publish**. Go back to the builder: the leave clash is gone.
5. **Faculty Portal (20 s).** Switch Demo mode to **Faculty**, open **Apply for leave**, type a reason, **Submit**. Watch the timeline (“Emailed to Chaitra, Krishna Koppa and Jai Shree”). **Open mail preview**, click **Approve** inside Chaitra’s email, then the **Faculty** tab to show the approval email and the WhatsApp alert.
6. **Assistant (15 s).** Committee → Assistant: click “Room 305 is closed this week”, then type “Prof. Arjun Rao is absent Thursday”. **Preview**, **Confirm as drafts**. Note the label “Demo assistant (simulated)” and that it never publishes.
7. **Student View (10 s).** Switch to **Student**: today first, the “Changed” banner, the strike-through of the old room. Toggle dark mode from the header to finish.

Keep `/perf` in a second tab in case anyone asks “will it scale?”.

---

## Lighthouse

Measured on the production build served locally (Lighthouse 12, Chrome, `docs/lighthouse/*.json`).

**Mobile** (Moto G Power profile: slow 4G, 4× CPU slowdown)

| Page | Performance | Accessibility | Best Practices | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- |
| `/` (landing) | **99** | 100 | 100 | 2.0 s | 0 | 10 ms |
| `/student` | **96** | 100 | 100 | 2.4 s | 0 | 60 ms |
| `/faculty` | 93 | 100 | 100 | 2.8 s | 0 | 130 ms |
| `/committee` | 91 | 100 | 100 | 2.9 s | 0 | 150 ms |
| `/committee/builder` | 88 | 100 | 100 | 3.1 s | 0 | 130 ms |

**Desktop**

| Page | Performance | Accessibility | Best Practices | LCP | CLS |
| --- | --- | --- | --- | --- | --- |
| `/` | 100 | 100 | 100 | 0.4 s | 0 |
| `/student` | 100 | 100 | 100 | 0.6 s | 0 |
| `/faculty` | 100 | 100 | 100 | 0.6 s | 0 |
| `/committee` | 100 | 100 | 100 | 0.7 s | 0 |
| `/committee/builder` | 99 | 100 | 100 | 0.8 s | 0 |

**Against the targets.** Accessibility and Best Practices are 100 everywhere, CLS is 0 everywhere, and the landing and student pages exceed 95 on mobile. The committee screens score 88–93 on the throttled mobile profile and miss the 1.5 s LCP target there: they are data-heavy app screens that must download and run their code before painting, and the remaining gap would need server-side rendering, which a static demo does not have. On desktop every page is 99–100 with LCP under 1 s. Scores vary by a few points between runs.

Initial JavaScript for the landing page is about 74 KB gzipped (entry 54 KB + React runtime + router), well under the 150 KB budget; every screen is its own chunk, prefetched on hover and, a few seconds after load, in idle time.

**Clash engine** (from `/perf` and the unit tests): 5,000 slots indexed in ~45 ms; each edit is checked in **~0.04 ms on average** (p95 ~0.1 ms, budget 5 ms). The heaviest synthetic screen (936 cells) mounts in ~18 ms, and an edit re-renders 2 of 936 cells.

---

## What is simulated vs what the real build will do

| In this demo | In production |
| --- | --- |
| Data generated in the browser from a fixed seed, saved to `localStorage` | Database (with the same snapshot model), multi-user, role-based sign-in (SSO) |
| Emails are previews in a drawer; Approve/Reject buttons in them work locally | Real email with signed one-click approval links; replies logged |
| WhatsApp alert is a mock bubble | WhatsApp Business API notifications |
| Assistant uses keyword matching and templates (labelled “Demo assistant (simulated)”) | An LLM with tool access to the same actions, still preview-then-confirm and never publishing alone |
| Excel upload: the file is not parsed; a believable validation report is shown. **CSV checks are real.** Import is logged, not applied | Real `.xlsx` parsing, validation, and transactional import |
| Record copy and term deletion only log and schedule (30-day grace) | Archive integration and an actual scheduled purge |
| “Today” is your device’s IST date; demo data refreshes once per day | Live academic calendar |
| One-machine demo | Published snapshots served from a CDN, so 2,000+ readers never touch the database |

---

## Decisions made (the brief said “ask me nothing”)

- **Stack versions.** Vite 8, React 18, TypeScript strict, Tailwind CSS 4 (tokens in CSS variables), Zustand 5, TanStack Virtual, Framer Motion (only dialogs, drawers, chat and the mail timeline, loaded lazily), Lucide, date-fns 4, Fontsource (Inter Variable + Instrument Serif). **React Router 7** is used instead of 6 because 6.x has open security advisories; the API is the same in library mode.
- **Periods and shifts.** Eight 55-minute periods (08:00–16:45, tea after P2, lunch after P4, break after P6). Three overlapping shifts: Shift 1 P1–P4, Shift 2 P3–P6, Shift 3 P5–P8. BBA Sem 1 and WOW Sem 5 run Shift 1, BBA Sem 3 and WOW Sem 1 run Shift 2, BBA Sem 5 and WOW Sem 3 run Shift 3. Overlaps are what make cross-semester faculty clashes possible.
- **Sections.** BBA has sections A–D in each semester; WOW has A–B (18 sections). Strengths 54–68.
- **Catalogue.** 60 fictional faculty (48 internal, 12 visiting with limited availability windows), 40 subjects (core, OE, ME, WOW), 20 rooms (13 classrooms, 2 labs, Seminar Hall, Auditorium, Boardroom, 2 meeting rooms). Elective blocks run 4 offerings in parallel so each offering fits a classroom.
- **Clash severities.** Critical: faculty, room or section double-booked; faculty on approved leave. Warning: capacity exceeded; outside the faculty’s working hours or the section’s shift; elective overlap (an OE and an ME block at the same time). Advisory: a faculty member teaching four or more periods in a row. Every severity shows an icon and a text label, not only a colour.
- **Leave and the master.** The builder checks approved leave for the week chosen in its week picker. A class is no longer a leave clash once a substitution or cancellation exists for that date. Only **approved** leave reaches the Planned Leave column and the engine.
- **Leave rules.** Planned leave must start at least one day ahead (1–2 days’ notice); unplanned leave can be sent for today until 09:30 IST, or for tomorrow. Any one of the three approvers (Chaitra, Krishna Koppa, Jai Shree) can decide.
- **Snapshots.** Publishing the master creates an immutable snapshot (the last six are kept). Daily views are built from the latest snapshot plus that date’s changes. Student and faculty views read **published** changes only; drafts never reach them.
- **Calculator.** Semesters 3 and 5 are checkboxes; the **Semester 1 switch** adds Semester 1, which starts after induction and is counted separately. Rules are enforced in code and unit-tested: one hour per period; cohort = Section + Subject + Teacher (electives use the semester pool); substitution credit goes to the teacher who took the class; “IR” (Industrial Relations) is always counted because exclusions match whole session names only; unit tests and excluded sessions are listed separately.
- **Workload.** Assigned hours come from the published master; delivered hours are term-to-date (weeks elapsed, minus approved leave, plus published substitutions, with small deterministic noise). Visiting faculty are measured against 8–11-week contracts.
- **Demo data and dates.** The seed is deterministic, but dates are relative to today so “today’s” scenarios always make sense. Data saved in the browser is regenerated when the date changes. **Reset demo data** (committee sidebar) restores everything.
- **Performance choices.** The landing page is pre-rendered at build time and hydrated. Other routes are served an app shell that starts downloading the route’s code immediately (route-aware `modulepreload`). Off-screen heavy blocks use `content-visibility: auto`. Font fallbacks are metric-matched, so CLS stays at 0.
- **Accessibility.** Keyboard: arrow keys move through the builder grid, Enter places or opens, Esc cancels; tap-to-place works on touch screens where drag is awkward. Dialogs trap focus and restore it. `prefers-reduced-motion` is respected.

---

## Seeded demo scenarios (in the master draft)

1. Faculty double-booked across Semester 1 and Semester 5 (BBA Sem 1 · A and WOW Sem 5 · B, Mon P1, Room 305).
2. Room clash: Room 305 booked by BBA Sem 3 · C and WOW Sem 5 · B at the same time.
3. Capacity warning: BBA Sem 5 · D (68 students) in Computer Lab 1 (40 seats).
4. Advisory: one faculty member teaching four periods in a row.
5. Combined class that is correctly **not** flagged: BBA Sem 1 · A+B in the Seminar Hall.
6. Leave clash: approved planned leave on Thursday of the current week, plus an approved unplanned leave today.

The published snapshot (v12) is clean. The draft holds the scenarios, so publishing stays blocked until they are fixed or overridden with a written reason.

---

## Project layout

```
src/
  domain/      clash engine, daily resolution, leave rules, substitutes, calculator, workload, chat intents, .ics (+ unit tests)
  data/        catalogue, deterministic seed and scheduler, synthetic load data, audit history
  store/       data store (Zustand, persisted), UI preferences, toasts
  components/  UI kit (buttons, dialogs, drawers, tabs, combobox, toasts…), layout, timetable chips, mail preview
  pages/       landing, committee/*, faculty/*, student/*, Calculator, Perf
e2e/           Playwright smoke tests
scripts/       pre-render, screenshots, icons, Lighthouse
docs/          screenshots/ and lighthouse/ reports
public/        manifest, icons, service worker, Cloudflare _redirects and _headers
```

All people except the three approver roles are fictional. No logos are used; the wordmark is text.
