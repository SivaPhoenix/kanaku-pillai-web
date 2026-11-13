# Kanaku Pillai — Web

Responsive web app for **Kanaku Pillai** (கணக்குப் பிள்ளை, "the accountant"), a production-grade personal expense tracker. One codebase serves phone browsers, tablets, desktops and large screens, in light and dark themes.

**Stack:** React 19 · Vite 8 · JavaScript · Tailwind CSS v4 (the only styling system; tokens on `:root` in `src/index.css`) · React Router 7 · TanStack Query · react-hook-form + Zod · react-icons (Lucide)

**Status:** app shell, design system and auth are built. Email/password sign-up and sign-in, Google sign-in, session restore, sign-out and the Settings appearance switch all work against the backend. Month, Daily, Stats, Accounts, Search and Lists show their empty states until the backend ledger endpoints exist.

## Getting started

Requirements: Node.js 22.13 or newer, and the [backend](https://github.com/SivaPhoenix/kanaku-pillai-backend) running on port 4000.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_CLIENT_ID` (the Google OAuth Web client ID; public, not secret).

3. Start the dev server on http://localhost:5173. It proxies `/api` to the backend, so the browser stays on one origin:

   ```bash
   npm run dev
   ```

## Scripts

| Script                                  | What it does                                         |
| --------------------------------------- | ---------------------------------------------------- |
| `npm run dev`                           | Dev server with the `/api` proxy                     |
| `npm run build` / `npm run preview`     | Production build into `dist/`, and a local preview   |
| `npm test`                              | Unit and component tests (Vitest + Testing Library)  |
| `npm run lint` / `npm run format:check` | ESLint and Prettier checks                           |
| `npm run check`                         | Lint, format check, tests and build, as CI runs them |

## Deploying

`npm run build` outputs static files in `dist/`. Serve them behind a reverse proxy that also forwards `/api` to the backend on the **same origin**, because the refresh-token cookie is only sent to the web app's own origin. Route unknown paths to `index.html` (client-side routing).

## Docs

- [Project context](docs/PROJECT.md): product idea, scope, domain rules, architecture (shared with the backend and app repos)
- [Design spec](docs/design-spec.md): tokens, components, screens, breakpoints, banned patterns
- [Design canvas](docs/design/glass-ui-plan.html): visual boards (download and open in a browser)
- [API contract](https://github.com/SivaPhoenix/kanaku-pillai-backend/blob/main/docs/api/README.md) (backend repo)
- [CLAUDE.md](CLAUDE.md): engineering rules, folder layout and Claude Code agents for this repo

## Related repos

- [kanaku-pillai-backend](https://github.com/SivaPhoenix/kanaku-pillai-backend): Node + Express + MongoDB API
- [kanaku-pillai-app](https://github.com/SivaPhoenix/kanaku-pillai-app): Expo + NativeWind mobile app
