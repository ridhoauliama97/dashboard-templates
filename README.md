# Studio Admin — React + Vite port

A working port of **[studio-admin.arhamkhnz.com](https://studio-admin.arhamkhnz.com/dashboard/default)** —
the full 35-route admin dashboard — rebuilt on **React + Vite** instead of Next.js,
set in **Plus Jakarta Sans**.

Upstream is MIT-licensed: [`arhamkhnz/next-shadcn-admin-dashboard`](https://github.com/arhamkhnz/next-shadcn-admin-dashboard).

The upstream source is used **verbatim** wherever possible. A small shim layer
maps the `next/*` specifiers the source imports onto browser equivalents, so
routing, screens, features, form validation, toasts, shortcuts and preferences
behave the same — without a fork of every file.

---

## 1. How it was analysed

### Runtime analysis with REA (Chrome DevTools Protocol)

A headless Chrome instance was driven over a loopback CDP endpoint and inspected
passively — REA never evaluates page JavaScript.

| REA operation | What it produced |
| --- | --- |
| `list_browser_targets` | eligible page targets, browser/product identity |
| `inspect_web_page` | 1 221 DOM nodes, accessibility tree, resources, scripts, storage keys, response metadata |
| `analyze_web_bundle` | 31 scripts / 1 403 969 bytes analysed, chunk graph, vendor fingerprints |

Evidence IDs: `ev_90ac8a4b3a01…` (target list), `ev_eab5064a2f48…` (page
inspection), `ev_ae150f1d1f12…` (bundle analysis). Raw captures live in
[`analysis/raw/`](../analysis/raw).

> **Limitation, stated honestly:** `analyze_web_bundle`'s route detector produced
> false positives on this build (it classified minified SVG path data as route
> candidates), so its route output is **not** used. Routes came from the upstream
> source tree instead. REA does not execute page JavaScript, so nothing here
> claims runtime behaviour that was not observed.

### Source study

The upstream repository was read directly — `components.json` (shadcn style
`radix-nova`), `package.json`, `biome.json`, `AGENTS.md`, `tsconfig.json`,
`next.config.mjs`, `postcss.config.mjs`, the complete file tree, the four theme
presets, the preference layer, the sidebar/header components, and all 35 screens.
The published tarball was unpacked locally so files could be copied byte-for-byte
and grepped rather than re-typed.

---

## 2. Tech stack

| Layer | Choice |
| --- | --- |
| Runtime | React 19 + Vite 8 + TypeScript |
| Routing | react-router-dom 7 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Type | **Plus Jakarta Sans**, self-hosted (latin subset, variable weight 200–800) |
| Components | shadcn/ui, style `radix-nova`, on Radix UI (63 components) |
| Charts | Recharts through shadcn's `ChartContainer` |
| Tables | TanStack Table v9 (`useTable` + `dataTableFeatures`) |
| Forms | react-hook-form + zod + `@hookform/resolvers` |
| State | zustand (vanilla store + React provider) |
| Feedback | sonner toasts |
| Extras | dnd-kit (Kanban), FullCalendar (Calendar), react-day-picker, shiki, d3-geo + topojson (maps), vaul, input-otp, react-resizable-panels, simple-icons |
| Lint | **oxlint via `npm run lint`** |

---

## 3. Architecture

### The shim layer

Five modules in `src/shims/` are wired up through Vite aliases (and matching
`tsconfig` paths) so the upstream imports resolve unchanged:

| Upstream specifier | Shim | Notes |
| --- | --- | --- |
| `next/link` | `shims/next-link.tsx` | delegates to react-router; keeps `href` / `prefetch` / `replace` / `scroll` |
| `next/navigation` | `shims/next-navigation.ts` | `useRouter` / `usePathname` / `useSearchParams`; `notFound()` and the redirect helpers throw a `NavigationSignal` |
| `next/headers` | `shims/next-headers.ts` | `cookies()` reads the document cookie jar |
| `next-themes` | `shims/next-themes.ts` | reports the dashboard's own theme to sonner |
| `next` | `shims/next.ts` | `Metadata` types only (erased at build time) |
| `@/server/server-actions` | `server/server-actions.ts` | client-side cookie reads/writes |

Only **six** upstream components needed real edits, all because they were async
Server Components: `dashboard/layout.tsx`, `chat/layout.tsx`, `mail/layout.tsx`,
`mail/page.tsx`, `file-manager/page.tsx` and `(external)/_components/intro.tsx`.
Each became synchronous and reads its cookie or search params on the client.

### Route table

`src/routes.tsx` mirrors the App Router tree, including the pathless `(legacy)`
route group and the nested layouts. Every page is lazy-loaded, so each screen
ships as its own chunk. Upstream layouts take `children`, so each is wrapped with
`<Outlet />`.

`notFound()` / `permanentRedirect()` are caught by a `NavigationBoundary` placed
as close to the throwing component as possible — React Router installs its own
boundary around every route, so a boundary further up the tree never sees the
signal.

---

## 4. Routes

All 35 routes were loaded in a real browser: **35/35 render with no console
errors or uncaught exceptions.**

| Group | Routes |
| --- | --- |
| External | `/` |
| Dashboards | `/dashboard/default`, `crm`, `finance`, `analytics`, `productivity`, `ecommerce`, `academy`, `logistics`, `infrastructure`, `file-manager`, `patient-monitoring` |
| Pages | `/dashboard/mail`, `chat`, `calendar`, `kanban`, `tasks`, `invoice`, `profile`, `users`, `roles` |
| Legacy | `/dashboard/default-v1`, `crm-v1`, `finance-v1`, `analytics-v1` |
| Other | `/dashboard/coming-soon`, `/dashboard` (redirects to `/dashboard/default`), `/dashboard/*` (404) |
| Auth | `/auth/v1/login`, `/auth/v1/register`, `/auth/v2/login`, `/auth/v2/register` |
| Standalone | `/chat`, `/mail`, `/unauthorized`, `*` (404) |

---

## 5. Verified behaviour

Exercised through the real UI in a headless browser against the production build:

| Behaviour | Result |
| --- | --- |
| Sidebar navigation | click **Finance** → `/dashboard/finance`, `<h1>` "Personal Finances" |
| Keyboard shortcut | `Ctrl/⌘ + J` opens the command palette with every nav group |
| Theme preset | **Default → Brutalist**: `data-theme-preset="brutalist"`, `--radius: 0px`, cookie persisted |
| Theme mode | cycling button + `prefers-color-scheme` fallback, no flash on reload |
| Auth validation | empty submit on `/auth/v1/login` → "Please enter a valid email address." and "Password must be at least 6 characters." |
| Layout shift | CLS **0** |

### Typography

The reference shipped **18 switchable font families** through `next/font`, with a
Fonts selector in the preferences popover. That feature is **removed** here:
the picker was the only consumer, and 18 self-hosted faces were the single
biggest avoidable cost on the page.

This port ships exactly one family — **Plus Jakarta Sans** — self-hosted, latin
subset, variable weight 200–800, 26.7 KB, preloaded from `index.html`. System
monospace covers code blocks and keyboard hints. Verified: `--font-sans` resolves
to Plus Jakarta Sans, `document.fonts.check('16px "Plus Jakarta Sans"')` is true,
and the page issues **one** font request.

The preferences popover now contains: Theme Preset, Theme Mode, Page Layout,
Navbar Behavior, Sidebar Style, Sidebar Collapse Mode.

### Interactivity audit

Every control that is supposed to reveal something was inventoried and then
**exercised in a real browser** — nothing here is inferred from the source.

**Inventory (REA).** `inspect_web_page` against the reference deployment gave the
accessibility tree for `/dashboard/default`: 873 nodes, **59 triggers** — 20
buttons, 3 comboboxes, 24 links, 11 checkboxes, 1 textbox, 1 table.
Evidence: `ev_ea2071dbd65b…`.

**Exercise (Playwright).** `tests/interactivity.spec.ts` visits all 33 routes and,
for each one, clicks every dropdown, select, popover, dialog, sheet, alert-dialog,
sub-menu, context-menu, hover-card and menubar trigger, asserting the surface it
promises actually becomes visible, then closes it again. It also asserts tabs
become active with their panel, toggle-group items turn on, checkboxes flip, and
collapsibles open.

Result: **118 passed, 14 failed** on the first run — and the failures were not
where the source suggested they would be.

### What the audit found

Three of the fourteen failures were **test defects**, confirmed by dumping the
live DOM rather than trusting the report:

| Reported | Reality |
| --- | --- |
| `collapsibles on /dashboard/default-v1` — "Dashboards did not open" | The group was **already open** (`data-state="open"`, 128px tall); the click closed it. Working. |
| `toggles on /dashboard/default-v1` — "Last 3 months did not turn on" | It was **already on** (the default); the group is a `radiogroup`, so clicking deselects. Working. |
| `collapsibles on /dashboard/infrastructure` — three panels "did not open" | All three were already `open`. Working. |

The other eleven were real, and clustered into one cause: **tab strips that only
highlight**. `Tabs` was rendered with `TabsTrigger`s but no `TabsContent` and no
`onValueChange`, so the content below was rendered unconditionally and clicking a
tab changed nothing.

| Screen | Tabs that did nothing | Now |
| --- | --- | --- |
| `logistics` — shipment list | All / In Transit / Delivered / Delayed | filters the list; **counts are computed from the rows** instead of the hardcoded `(156) (32) (98) (9)`; the search box (also inert) filters too |
| `users` | list / grid | switches between the table and a new grid view, both driven by the same row model |
| `kanban` | Board / List / Table | three real views of the same tasks — Board keeps drag-and-drop, plus new List and Table views; the search box filters all three and the tab counts come from the filtered rows |
| `invoice` — form | Invoice / Payment / Business | renders only the section that belongs to the active tab |
| `chat` — conversation list | All / Open / Snoozed / Closed | filters by status; counts computed from the rows (`All (23)`, `Open (11)`, `Snoozed (0)`) instead of the hardcoded `(24) (18) (2)` |
| `chat` — profile details | Details / Files / Activity | switches panels |

Two more findings from the same pass, both confirmed against the live DOM rather than
the source:

- **`finance-v1`** ships Activity / Insights / Utilities as `disabled` triggers. That
  is deliberate — they cannot be activated — so the test skips disabled controls
  instead of reporting them.
- **`chat`** profile details is a **slide-over**: parked at `x = 1972` on a 1440px
  viewport until the thread asks for it (`More actions → View profile`). The tabs
  are laid out but unreachable while it is closed, so there is a dedicated test
  that opens the panel first and then exercises all three tabs.

### Delete confirmations

`AlertDialog` was shipped with the component library and **used nowhere** — every
destructive action fired immediately. `src/components/confirm-delete.tsx` now
provides one confirmation that **names the object** and states the consequence,
and each destructive action routes through it and confirms the outcome with a toast:

| Screen | Action | Question asked |
| --- | --- | --- |
| `tasks` | row menu → Delete | “…task title…” (TASK-8782) will be permanently deleted |
| `file-manager` | file menu → Move to trash | “Brand assets.png” · 2.4 MB · Image. Anyone you shared it with will lose access. |
| `crm-v1` | lead menu → Delete | Olivia Rhye (Acme Inc.) — their status and activity history will be removed |
| `default-v1` | section menu → Delete | “Executive summary” — the section and its reviewer assignment will be removed |
| `invoice` | line item → Remove item N | “Design retainer” — £4,800.00 will be removed from the invoice total |
| `mail` | toolbar → Move to trash | “Q3 planning notes” — it will be removed from the inbox and moved to Trash |

Deleting actually removes the item from the view — the tables now hold their rows
in state, the column definitions are factories that receive the handler, and the
mail list filters a `trashed` set — so confirming has a visible effect rather than
just closing a dialog.

### Running the checks

```bash
npm test              # the whole suite, headless
npm run test:headed   # same, with a visible browser
```

**161 tests, 0 failures** on the final build (`npx playwright test`).

`tests/interactivity.spec.ts` is the trigger matrix — every route renders, every
trigger reveals its surface, tabs activate with their panel, toggles turn on,
checkboxes flip, collapsibles change state. `tests/crud-and-tabs.spec.ts` covers
the delete flows, the four rewritten tab strips, the kanban views, and the chat
profile slide-over.

Two weaknesses in the first version of the suite are worth recording, because both
produced false failures that looked like product bugs:

- The trigger matrix re-located elements **by list index**, which shifts the moment
  an overlay opens. It now re-locates by a stable key.
- The tab check hashed only `innerText`, so a panel whose only difference is an
  input **placeholder** read as unchanged. The hash now includes field placeholders
  and values, and it is scoped per tab strip — indexing the global trigger list
  picked the wrong tab on pages with two strips.

A Playwright MCP server config is provided at `.opencode/mcp-playwright.json` for
driving the same browser from an agent session.


---

## 6. Performance

Measured by loading `/dashboard/default` in a real browser with the cache and
cookies cleared, comparing this build against the live reference.

| | Reference (Next.js) | This port | |
| --- | --- | --- | --- |
| Requests | 57 | 102 | |
| HTML | 185.5 KB decoded / 19.6 KB transfer | 5.2 KB / 1.9 KB | |
| CSS | 1 139.7 KB / 827.4 KB (25 files) | 349.4 KB / 75.1 KB (2 files) | −69 % decoded |
| JS | 1 333.9 KB / 432.1 KB (27 files) | 1 137.3 KB / 406.0 KB (97 files) | −15 % decoded |
| Fonts | 763.0 KB / 769.5 KB (22 files) | 26.7 KB / 27.0 KB (1 file) | **−96.5 %** |
| **Total** | **3 422.2 KB / 2 049.4 KB** | **1 518.7 KB / 510.1 KB** | **−55.6 % decoded, −75.1 % transfer** |
| FCP / LCP | not comparable (remote origin) | 556 ms | |
| CLS | — | 0 | |

What produces that:

1. **One self-hosted face.** Plus Jakarta Sans, latin subset, preloaded — 26.7 KB
   against the reference's 763 KB of font traffic.
2. **Scoped CSS.** Tailwind v4 compiles only the utilities in use, and the four
   presets are custom-property overrides rather than duplicated rule sets. The
   199 KB flag-icon sheet is a separate chunk that only the routes using it load.
3. **Code-split screens.** All 35 pages are lazy, so one screen never pays for
   another.
4. **The chart and table are deferred** inside `/dashboard/default` with skeleton
   fallbacks. Recharts and TanStack Table were on the critical path and blocked
   first paint; deferring them took FCP from **968 ms → 556 ms**.
5. **No SSR/hydration runtime** — no Next.js router, RSC payload or hydration pass.

Two things I tried and rejected, with the numbers:

- **Forcing vendors into large chunks** cut requests 94 → 40 but added ~680 KB of
  decoded JS the dashboard route never needs, with no change in FCP.
- **`content-visibility: auto`** on the table card helped little on a page this
  short and breaks find-in-page and printing.

---

## 7. Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the production build (SPA history fallback)
npm run lint       # oxlint
```

`npm run lint`: **0 errors**, 71 warnings — all `react(only-export-components)`
and `react(set-state-in-effect)` notices that upstream's own generated components
and column files produce too.

---

## 8. Deliberate differences from upstream

| Area | Difference | Why |
| --- | --- | --- |
| Framework | Vite SPA instead of Next.js 16 App Router | the requested stack; removes SSR/hydration cost |
| Routing | react-router over the upstream route tree | the App Router tree is mirrored, including nested layouts and the pathless `(legacy)` group |
| `next/*` | five shims behind Vite aliases | keeps upstream files verbatim |
| Root layout | providers only; `<html>`/`<body>` and the boot script live in `index.html` | a SPA cannot render `<html>` into `#root` |
| **Font** | **single family (Plus Jakarta Sans); the 18-face picker and the `font` preference are removed** | requested; also removes the page's largest avoidable cost |
| Server Actions | `server-cookie` persistence degrades to `client-cookie` | no server in a static build |
| Six async components | made synchronous | async components need RSC |
| `dashboard/default/page.tsx` | adds lazy boundaries around two sections | the only way to keep Recharts off the critical path without forking the sections |
| Two header buttons | added `aria-label` | upstream ships icon-only buttons with no accessible name; invisible change |
| Analytics | the Google Analytics tag from upstream's root layout is **not** included | it is the original author's property ID |
| `showcase.tsx` | images referenced from `public/media` with explicit dimensions | `next/image` static imports do not exist here |

### Sample data

Every figure is the upstream template's **demo data**, copied verbatim. The chart
series, customer rows, invoices, patients, shipments and messages are all
fabricated for the demo — replace them before production. The avatar in the
sidebar and account menu points at the upstream author's public GitHub avatar.

### Known gaps

- Upstream's `/dashboard/default` has no `<h1>` — the KPI cards use `CardTitle`.
  That is reproduced as-is rather than silently "fixed".
- Some upstream screens (e.g. `coming-soon`) intentionally render a "Page not
  found." heading.
- Screens keep upstream's client-side state; nothing is persisted beyond
  preference cookies.

---

## 9. Layout

```
src/
├── app/
│   ├── globals.css                  # tokens (OKLCH), presets, @font-face
│   ├── layout.tsx                   # providers + global stylesheet
│   ├── not-found.tsx
│   └── (main)/
│       ├── dashboard/
│       │   ├── layout.tsx           # sidebar shell + header
│       │   ├── _components/{header,sidebar}/
│       │   ├── default/ … roles/    # 22 dashboard screens
│       │   └── (legacy)/            # 4 v1 screens + their layout
│       ├── auth/{v1,v2}/            # 4 auth screens
│       ├── chat/, mail/             # standalone layouts
│       └── unauthorized/
│   └── (external)/                  # landing page
├── components/ui/                   # 63 generated shadcn components
├── lib/                             # preferences, navigation, table features
├── navigation/sidebar/              # sidebar-items.ts
├── shims/                           # next/* → browser equivalents
├── stores/preferences/              # zustand store + provider
└── styles/presets/                  # brutalist, soft-pop, tangerine
```

Screenshots are in [`docs/screenshots/`](./screenshots).
