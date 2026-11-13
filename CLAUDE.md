# Kanaku Pillai — Web (kanaku-pillai-web)

The responsive web client for the Kanaku Pillai expense tracker. One codebase serves phone browsers, tablets, desktops and large screens.

**Read first:** `docs/PROJECT.md` (product, scope, domain rules; shared across all three repos) → `docs/design-spec.md` (every UI decision: tokens, components, screens, breakpoints, banned patterns) → the API contract in `../kanaku-pillai-backend/docs/api/README.md` (or [on GitHub](https://github.com/SivaPhoenix/kanaku-pillai-backend/blob/main/docs/api/README.md)). Visual reference: open `docs/design/glass-ui-plan.html` in a browser. Where it disagrees with the spec, the spec wins.

## Stack

- React 19, Vite, **JavaScript (no TypeScript)**: `.js` for logic, `.jsx` for components, ES modules. Node ≥ 22.
- **Tailwind CSS v4 via `@tailwindcss/vite`. Tailwind is the only styling system.**
- React Router (data routers), TanStack Query (server state), react-hook-form plus Zod (forms), a small fetch wrapper for the API.
- Fonts: IBM Plex Sans, IBM Plex Mono, Noto Sans Tamil (Google Fonts, `display=swap`).
- React Router 7 (data router, lazy routes), `@react-oauth/google` for the Google button.
- Tests: Vitest plus Testing Library and jsdom. Playwright for e2e comes later.
- Icons: **react-icons** (Lucide set via `react-icons/lu`), mapped by name in `src/lib/icons.js`. Never emoji.

## Commands

- `npm run dev`: port 5173, proxies `/api` to the backend (`VITE_API_PROXY_TARGET`, default `http://localhost:4000`). Start the backend first.
- `npm run build`, `npm run preview`
- `npm run lint`, `npm run format:check`, `npm test`, `npm run check` (all of them plus build, as CI runs)
- Config: copy `.env.example` to `.env.local` (`VITE_GOOGLE_CLIENT_ID`). Only `VITE_*` values reach the browser, so never put secrets there.

## Styling rules — Tailwind only (hard rule)

1. **All styling is Tailwind utility classes in JSX.** No CSS modules, no styled-components or emotion, no Sass, no per-component `.css` files, no `style={{…}}`. The one exception is runtime-computed geometry that classes cannot express: chart bar heights and widths, donut arc paths and progress percentages. Even then, prefer passing a CSS variable (`style={{ '--pct': '42%' }}` plus `w-(--pct)`).
2. **`src/index.css` is the single root stylesheet**, imported once in `main.jsx`. **All colours are plain CSS variables on `:root`** (light), overridden under `[data-theme="dark"]`:
   ```css
   :root {
     --bg: #f3f1ec;  --text: #1b1a18;  --text-muted: #5e5b55;
     --primary: #1b1a18;  --on-primary: #f3f1ec;      /* ink: filled buttons, selected tab, FAB, active nav */
     --secondary: rgb(255 255 255 / 0.72);  --on-secondary: #1b1a18;   /* secondary buttons, icon buttons */
     --income: …; --expense: …; --transfer: …; --danger: …; --success: …; --warning: …;
     --line: …; --scrim: …; --surface-0/1/2 (+ -border); --c1 … --c7;
   }
   [data-theme="dark"] { --bg: #101113; --primary: #eceae4; … }
   ```
   `@theme inline` maps each variable to a Tailwind colour (`--color-primary: var(--primary)`), so components write `bg-primary`, `text-on-primary`, `bg-secondary`, `text-income`, `border-line`, and the theme switches without `dark:` on every element. The file also holds the `@theme` block (breakpoints `tablet`/`desktop`/`large`, fonts, radius scale up to 20, animations), the `@utility` glass tiers `surface-l0`, `surface-l1`, `surface-l2` and `tabular`, the reduced-transparency fallback, and `@layer base` body defaults. Nothing else.
3. **Never hard-code a hex value or an arbitrary colour** (`text-[#FF9F5A]`) in components. Use the token classes. To add a colour, add a variable to `:root` and `[data-theme="dark"]` and map it in `@theme inline`. Opacity modifiers work on tokens (`bg-primary/20`, `bg-income/18` for the spec's tints).
4. Class order is enforced by `prettier-plugin-tailwindcss`. Build conditional classes with `cn()` (`src/lib/cn.js`, clsx plus tailwind-merge). Never build class names by string concatenation (Tailwind cannot see them).
5. Reusable looks become **components** (`<Button variant="primary">`), not `@apply` classes.

## Responsive rules (hard rule)

- **Mobile first.** Unprefixed classes are the phone layout (< 600). Then `tablet:` (600–1279), `desktop:` (1280–1679) and `large:` (≥ 1680) are layered on top. These are the design spec §5 breakpoints. Do not use Tailwind's default `sm/md/lg/xl` in this project.
- **Four layout shells** (§5), all inside `components/layout/AppLayout.jsx`: phone (floating bottom tab bar plus centre FAB, full-screen Add, bottom sheets), tablet (88px icon rail, two panes, centred modals), desktop (232px labelled sidebar plus side panel) and large (248px sidebar, three panes). The shell is switched **with CSS breakpoint classes** (`tablet:hidden`, `hidden desktop:flex`), not JavaScript, so there is no layout flash. Use a JS breakpoint hook only when behaviour (not just layout) must differ. Screens share hooks and components and only rearrange.
- Every screen must work at **360, 390, 834 (tablet portrait), 1194, 1440 and 1920** wide with **no horizontal scroll**, in **both themes**. Text scaling to 200% must not truncate amounts.
- Touch targets ≥ 44×44 at every size. Hover styles must never be the only affordance.

## Folder structure

```
index.html                  fonts, meta, and the inline script that applies the theme before first paint
vite.config.js              React + Tailwind plugins, /api dev proxy, Vitest config
src/
  main.jsx                  mounts <App/>, imports ./index.css
  index.css                 Tailwind root: :root tokens (see above)
  App.jsx                   providers: Theme → QueryClient → Google OAuth (if configured) → Auth → Router
  router.jsx                route tree (design spec §6); every page lazy-loaded; auth guards
  pages/                    one file per route, named export <Name>Page
    auth/LoginPage.jsx  auth/SignupPage.jsx
    MonthPage.jsx  DailyPage.jsx  StatsPage.jsx  AccountsPage.jsx  SearchPage.jsx  ListsPage.jsx
    SettingsPage.jsx  NotFoundPage.jsx
  components/
    ui/                     shared design-system components (Button, Input, Segmented, Switch, Chip, Card,
                            EmptyState, AmountText, Icon, Logo …) re-exported from ui/index.js
    layout/                 AppLayout (all four shells), AuthLayout, PageHeader, nav pieces, RouteError
    auth/                   GoogleSignInButton and other auth-only pieces
  context/                  AuthProvider, ThemeProvider (+ their createContext files)
  hooks/                    useAuth, useTheme, and other shared hooks
  routes/                   guards.jsx (RequireAuth, RedirectIfAuthenticated)
  lib/
    api.js                  fetch wrapper: same-origin /api/v1, bearer token, refresh-on-401, ApiError, fieldErrors
    session.js              in-memory access token, single-flight + cross-tab (Web Locks) refresh
    auth-api.js             auth endpoint calls
    money.js  dates.js  password-strength.js  icons.js  navigation.js  cn.js  config.js  query-client.js
  schemas/                  Zod schemas for forms and API payloads (mirror the backend rules)
tests/                      setup.js (jest-dom, matchMedia stub); unit tests sit next to the code as *.test.js(x)
public/                     favicon.svg
docs/                       PROJECT.md  design-spec.md  design/glass-ui-plan.html  decisions/
```

Add a new screen by adding `src/pages/<Name>Page.jsx` and one lazy route in `src/router.jsx`. Put a component in `components/` once two pages use it; until then keep it in the page file.

## Data and auth rules

- Server state lives only in TanStack Query. No copying API data into context or local state. Mutations invalidate exact query keys.
- The access token is kept **in memory only**. The refresh token is an `httpOnly` cookie set by the API, so the client cannot read it. The API allows every origin but sends no CORS credentials, so **always call it through a same-origin path** (`/api/v1/...`): the Vite dev proxy forwards `/api` to `http://localhost:4000`, and production uses a reverse proxy. Never hard-code the API host in fetch calls. On a 401, call `/auth/refresh` once (single-flight), retry, and on failure go to login. Never store tokens in `localStorage`.
- Send `X-Client-Platform: web` and, on creates, an `Idempotency-Key` (`crypto.randomUUID()`) per form submission.
- Money comes in and goes out as integer `amountMinor`. Parse user input to minor units with string math, never `parseFloat(x) * 100`. Format only with `formatMoney()`.
- Never recompute balances or totals that the API provides. Transfers are never shown in income or expense totals.

## Design guardrails (from design spec §11–§12 — reviewers enforce)

No gradient blobs or glows, no purple accents, **no emoji anywhere in the UI — not even as category or account icons**; every icon is `<Icon name="…" />` from `src/components/ui/Icon.jsx`, backed by react-icons (Lucide set, `src/lib/icons.js`), and category/account pickers offer `CATEGORY_ICON_NAMES`, no visible keyboard badges, no marketing copy on auth screens, no illustrations in empty states, no dashed "+ Add" buttons, no radius above 20, no shadows on L0 and L1, no card-in-card beyond L1 → L0. Income and expense always carry a sign. Every icon-only button has an `aria-label`. Modals trap focus and close on Esc.

## Definition of done (web)

1. `npm run lint`, `npm run format:check`, `npm test` and `npm run build` are all green.
2. The screen is checked at the six widths above in light and dark (`responsive-qa` agent).
3. `tailwind-ui-reviewer` finds no issues.
4. Loading, empty and error states exist for every data view.

## Agents (`.claude/agents/`)

| Agent                     | Use it when                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `web-feature-builder`     | Building a screen or feature from the design spec against the API contract                                       |
| `tailwind-ui-reviewer`    | Reviewing a diff: Tailwind-only, tokens, mobile-first breakpoints, spec fidelity, accessibility, banned patterns |
| `responsive-qa`           | Running the app in a browser at all widths and both themes to catch layout breaks                                |
| `api-integration-checker` | Checking that API calls, payload shapes and error handling match the backend contract                            |

## Working rules

- **Use subagents on cheaper models for scoped work.** Do not run every task on Opus. Delegate well-specified work to a subagent with `model: "sonnet"` (implementation from a clear brief, reviews, tests) or `model: "haiku"` (mechanical edits, searches, doc syncs). Keep Opus for architecture, design decisions and integrating results. Give parallel subagents separate files, and verify what each one returns before reporting it done. The agents in `.claude/agents/` already run on Sonnet.
- Plan first for anything larger than a small fix. Build after the product owner approves.
- Do not change a design decision from the spec without asking. If the spec is silent, follow its closest analogue and say so.
- Single-line comments only where the reason is not obvious. Named exports. Edit files directly.
- Keep `docs/PROJECT.md` and `docs/design-spec.md` identical across the repos.
