# Kanaku Pillai — Web (kanaku-pillai-web)

The responsive web client for the Kanaku Pillai expense tracker. One codebase serves phone browsers, tablets, desktops and large screens.

**Read first:** `docs/PROJECT.md` (product, scope, domain rules; shared across all three repos) → `docs/design-spec.md` (every UI decision: tokens, components, screens, breakpoints, banned patterns) → the API contract in `../kanaku-pillai-backend/docs/api/README.md` (or [on GitHub](https://github.com/SivaPhoenix/kanaku-pillai-backend/blob/main/docs/api/README.md)). Visual reference: open `docs/design/glass-ui-plan.html` in a browser. Where it disagrees with the spec, the spec wins.

## Stack
- React 19, Vite, **JavaScript (no TypeScript)**: `.js` for logic, `.jsx` for components, ES modules. Node ≥ 22.
- **Tailwind CSS v4 via `@tailwindcss/vite`. Tailwind is the only styling system.**
- React Router (data routers), TanStack Query (server state), react-hook-form plus Zod (forms), a small fetch wrapper for the API.
- Fonts: IBM Plex Sans, IBM Plex Mono, Noto Sans Tamil (Google Fonts, `display=swap`).
- Tests: Vitest plus Testing Library (unit and component), Playwright (e2e and responsive screenshots).

## Commands (once scaffolded)
- `npm run dev` (port 5173, proxies `/api` to `http://localhost:4000`), `npm run build`, `npm run preview`
- `npm run lint`, `npm run format:check`, `npm test`, `npm run e2e`

## Styling rules — Tailwind only (hard rule)
1. **All styling is Tailwind utility classes in JSX.** No CSS modules, no styled-components or emotion, no Sass, no per-component `.css` files, no `style={{…}}`. The one exception is runtime-computed geometry that classes cannot express: chart bar heights and widths, donut arc paths and progress percentages. Even then, prefer passing a CSS variable (`style={{ '--pct': '42%' }}` plus `w-(--pct)`).
2. **`src/index.css` is the single root stylesheet**, imported once in `main.jsx`. It contains only:
   - `@import "tailwindcss";`
   - `@theme` with **all** design tokens from design spec §2: colours as CSS variables, fonts, radius scale (max 20), spacing additions, breakpoints
   - `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`
   - light values on `:root` and dark overrides on `[data-theme=dark]` for the semantic colour variables, so `bg-bg`, `text-text`, `text-income` and so on switch theme without `dark:` on every element
   - `@utility` definitions for the three glass tiers (`surface-l0`, `surface-l1`, `surface-l2`) and the reduced-transparency fallback
   - `@layer base` for body defaults and font smoothing only
3. **Never hard-code a hex value or an arbitrary colour** (`text-[#FF9F5A]`) in components. Use the token classes (`text-expense`, `bg-accent`, `text-on-accent`, `border-line`). The only fixed colour is `dangerSolid`, and it is a token too.
4. Class order is enforced by `prettier-plugin-tailwindcss`. Build conditional classes with a small `cn()` helper (clsx plus tailwind-merge). Never build class names by string concatenation (Tailwind cannot see them).
5. Reusable looks become **components** (`<Button variant="primary">`), not `@apply` classes.

Token sketch for `src/index.css` (names map 1:1 to design spec §2.1):
```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
@theme {
  --breakpoint-tablet: 600px;  --breakpoint-desktop: 1280px;  --breakpoint-large: 1680px;
  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --font-tamil: "Noto Sans Tamil", sans-serif;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 14px; --radius-xl: 16px; --radius-2xl: 18px; --radius-sheet: 20px;
  --color-bg: var(--kp-bg); --color-text: var(--kp-text); --color-accent: var(--kp-accent); /* …every token… */
}
:root { --kp-bg: #F3F1EC; --kp-text: #1B1A18; --kp-accent: #1B1A18; /* light */ }
[data-theme=dark] { --kp-bg: #101113; --kp-text: #ECEAE4; --kp-accent: #ECEAE4; /* dark */ }
```

## Responsive rules (hard rule)
- **Mobile first.** Unprefixed classes are the phone layout (< 600). Then `tablet:` (600–1279), `desktop:` (1280–1679) and `large:` (≥ 1680) are layered on top. These are the design spec §5 breakpoints. Do not use Tailwind's default `sm/md/lg/xl` in this project.
- **Four layout shells** (§5): `PhoneShell` (floating bottom tab bar plus centre FAB, full-screen Add, bottom sheets), `TabletShell` (88px rail, two panes, centred modals), `DesktopShell` (232px sidebar plus side panel), `LargeShell` (248px sidebar, three panes, persistent quick add). Pick the shell with a `useBreakpoint()` hook (matchMedia on the same px values). Screens share hooks and components and only rearrange.
- Every screen must work at **360, 390, 834 (tablet portrait), 1194, 1440 and 1920** wide with **no horizontal scroll**, in **both themes**. Text scaling to 200% must not truncate amounts.
- Touch targets ≥ 44×44 at every size. Hover styles must never be the only affordance.

## Folder structure
```
src/
  main.jsx                  mounts <App/>, imports ./index.css
  index.css                 Tailwind root (see above)
  app/
    App.jsx  router.jsx     route tree from design spec §6, lazy-loaded per screen
    providers.jsx           QueryClient, ThemeProvider, AuthProvider
  layouts/                  PhoneShell, TabletShell, DesktopShell, LargeShell, AuthLayout
  features/                 one folder per domain area — owns its api, hooks, components
    auth/  setup/  month/  daily/  add-transaction/  transaction/  stats/  accounts/  search/  lists/  settings/
      api.js                typed calls for this feature (uses lib/api)
      hooks.js              TanStack Query hooks (query keys from lib/query-keys)
      components/           feature-only components
      <Screen>Page.jsx      route component
  components/
    ui/                     Button, IconButton, Input, PasswordInput, StrengthMeter, OtpInput, Chip,
                            Segmented, Switch, Sheet, Modal, AlertDialog, Toast, EmptyState, Icon, AmountText
    charts/                 Donut (SVG arcs), RankedRow, DailyBars, CalendarHeatmap, TrendBars
    transaction/            TransactionRow, DateGroupHeader
  lib/
    api.js                  fetch wrapper: base URL, auth header, refresh-on-401 (single flight), error → ApiError
    money.js                formatMoney(minor, settings), minorDigits, parse input → minor (no floats)
    dates.js                Intl date formats from spec §9 ("Thu, 22 Oct", "October 2026")
    query-keys.js  cn.js  icons.js (spec §2.5 paths)
  hooks/                    useBreakpoint, useTheme, useHotkeys (N, /, ←, →, E, Enter, Esc — no visible badges)
  schemas/                  Zod schemas for API payloads and forms (mirror the backend contract)
tests/  e2e/                Playwright specs and responsive snapshot specs
public/
docs/   PROJECT.md  design-spec.md  design/glass-ui-plan.html
```

## Data and auth rules
- Server state lives only in TanStack Query. No copying API data into context or local state. Mutations invalidate exact query keys.
- The access token is kept **in memory only**. The refresh token is an `httpOnly` cookie set by the API, so the client cannot read it. The API allows every origin but sends no CORS credentials, so **always call it through a same-origin path** (`/api/v1/...`): the Vite dev proxy forwards `/api` to `http://localhost:4000`, and production uses a reverse proxy. Never hard-code the API host in fetch calls. On a 401, call `/auth/refresh` once (single-flight), retry, and on failure go to login. Never store tokens in `localStorage`.
- Send `X-Client-Platform: web` and, on creates, an `Idempotency-Key` (`crypto.randomUUID()`) per form submission.
- Money comes in and goes out as integer `amountMinor`. Parse user input to minor units with string math, never `parseFloat(x) * 100`. Format only with `formatMoney()`.
- Never recompute balances or totals that the API provides. Transfers are never shown in income or expense totals.

## Design guardrails (from design spec §11–§12 — reviewers enforce)
No gradient blobs or glows, no purple accents, no emoji as UI symbols (emoji only as user category and account icons), no visible keyboard badges, no marketing copy on auth screens, no illustrations in empty states, no dashed "+ Add" buttons, no radius above 20, no shadows on L0 and L1, no card-in-card beyond L1 → L0. Income and expense always carry a sign. Every icon-only button has an `aria-label`. Modals trap focus and close on Esc.

## Definition of done (web)
1. `npm run lint`, `npm run format:check`, `npm test` and `npm run build` are all green.
2. The screen is checked at the six widths above in light and dark (`responsive-qa` agent).
3. `tailwind-ui-reviewer` finds no issues.
4. Loading, empty and error states exist for every data view.

## Agents (`.claude/agents/`)
| Agent | Use it when |
|---|---|
| `web-feature-builder` | Building a screen or feature from the design spec against the API contract |
| `tailwind-ui-reviewer` | Reviewing a diff: Tailwind-only, tokens, mobile-first breakpoints, spec fidelity, accessibility, banned patterns |
| `responsive-qa` | Running the app in a browser at all widths and both themes to catch layout breaks |
| `api-integration-checker` | Checking that API calls, payload shapes and error handling match the backend contract |

## Working rules
- Plan first for anything larger than a small fix. Build after the product owner approves.
- Do not change a design decision from the spec without asking. If the spec is silent, follow its closest analogue and say so.
- Single-line comments only where the reason is not obvious. Named exports. Edit files directly.
- Keep `docs/PROJECT.md` and `docs/design-spec.md` identical across the repos.
