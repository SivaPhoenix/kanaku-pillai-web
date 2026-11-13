# Kanaku Pillai — Project Context

> Shared context for all three repositories. An identical copy lives at `docs/PROJECT.md` in each repo. If you change it in one repo, copy the same change to the other two in the same working session.

**Kanaku Pillai** (கணக்குப் பிள்ளை, "the accountant") is a production-grade personal expense tracker. You record income, expenses and transfers across bank, cash, card and investment accounts. It shows where your money went by day, month and year, in your own currency and time zone.

## 1. Repositories

| Repo                                                                          | What it is                                                        | Stack                                                              |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| [kanaku-pillai-backend](https://github.com/SivaPhoenix/kanaku-pillai-backend) | REST API, auth, data, scheduled jobs (repeat entries, purge)      | Node.js 22, Express 5, MongoDB Atlas (Mongoose 9), JavaScript, Zod |
| [kanaku-pillai-web](https://github.com/SivaPhoenix/kanaku-pillai-web)         | Responsive web app: phone browser, tablet, desktop, large desktop | React 19, Vite, Tailwind CSS v4, JavaScript                        |
| [kanaku-pillai-app](https://github.com/SivaPhoenix/kanaku-pillai-app)         | Native mobile app: iOS and Android, phone and tablet              | React Native (Expo), NativeWind (Tailwind CSS), JavaScript         |

Local layout: all three are cloned side by side under `E:\Source Setup\`. A client repo can read the backend's contract at `../kanaku-pillai-backend/docs/api/`.

**Who owns what**

- The **backend owns the API contract** (`kanaku-pillai-backend/docs/api/`) and every business rule (balances, transfer exclusion, recurrence, instalments, time-zone day assignment). Clients display what the API returns. They never recompute money rules on their own beyond formatting.
- The **design spec** (`docs/design-spec.md`, identical in all three repos) owns every UI decision. The web and app follow it. The backend uses its domain sections (§1.1 and §9).
- The **design canvas** (`docs/design/glass-ui-plan.html`, in the web and app repos only) is the visual reference: 66 boards across phone, tablet, desktop and large. Open it in a browser. Where the canvas and the spec disagree, the spec wins.

## 2. Product idea

Most expense apps are either toy-simple (one wallet, no transfers) or bookkeeping-heavy. Kanaku Pillai sits in between. It models real personal accounts correctly while keeping daily entry to a few taps:

- **Correct money:** integer minor units, never floats. Transfers between your own accounts are never counted as spending or income. Credit cards are liabilities. A debit card spends from its linked bank account.
- **Correct days:** each entry stores the UTC instant plus the IANA zone it was recorded in. The day it belongs to is its local date in that zone, so travelling never moves past entries to another day.
- **Fast entry:** favourites (one-tap templates), repeat rules generated server-side, and credit-card instalments split into monthly entries.
- **Calm UI:** an ink-and-paper ledger look, dark and light themes, with glass only where content scrolls underneath. The design spec §12 lists the banned visual patterns.

### 2.1 Scope (v1)

| Area         | Included                                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth         | Sign up, log in, Google sign-in, forgot password (email → 6-digit code → new password), sign out, sign out other devices, delete account            |
| First run    | Currency, time zone (from device), optional starting balances and starter categories                                                                |
| Transactions | Income, Expense, Transfer, with amount, category, account (or from/to), date-time, note, repeat rule, instalment plan (credit card only), favourite |
| Views        | Month overview, Daily, Stats (week / month / year), Accounts and net worth, Search and filters, Transaction detail and edit, Empty month            |
| Lists        | Expense categories, income categories and accounts: rename, icon or emoji, colour, reorder, archive                                                 |
| Settings     | Profile, currency, time zone, appearance (System / Light / Dark), week start, lists, change password, signed-in devices, sign out, delete account   |

**Not in v1:** multi-currency per user (the data model stores `currencyCode` per transaction, so it can be added later without a migration), shared or family accounts, bank sync, budgets, receipts and attachments, offline-first editing.

### 2.2 Delivery phases

1. **Foundation:** repo scaffolds, tooling, CI, env validation, logging, error format, health check. Theme tokens and layout shells in web and app.
2. **Auth:** sign up, log in, refresh-token rotation, forgot password with email OTP, Google sign-in, sessions, delete account.
3. **Ledger core:** accounts, categories, transactions (CRUD, soft delete and undo), setup flow, Month and Daily views.
4. **Insight:** Stats (donut, ranked list, trends), Accounts with net worth and credit-card bill, Search with filters and CSV export (web).
5. **Automation:** favourites, repeat rules (server job, idempotent), instalments.
6. **Hardening:** rate limits, an audit pass with the security agents, accessibility pass, performance, store-readiness (app), production deploy.

## 3. Domain rules (non-negotiable)

These come from design spec §1.1 and §9. Change them only with the product owner's approval.

1. **Money** is an integer in the currency's minor unit (paise, cents; JPY has 0 decimals). Never a float, anywhere: DB, API, client state. Format only at display time with `Intl.NumberFormat`.
2. **`amountMinor` is always positive.** The sign comes from `type`. Expense is shown with "−" (U+2212), income with "+", and transfer with no sign.
3. **Transfers** never count as income or expense in any total: Month, Stats, Search net, Day In/Out, or charts.
4. **Currency** is one per user. Changing it relabels existing entries and never converts them.
5. **Time:** `occurredAt` is a UTC instant, plus `tzid` (IANA, for example `Asia/Kolkata`). `localDate` is derived from both and never changes when the user's current zone changes.
6. **Credit card:** a purchase is an expense on the card, and paying the bill is a transfer from bank to card. Card balance = amount owed.
7. **Debit card** has no balance of its own. Its spending reduces the linked bank account.
8. **Investments** receive money by transfer, never as an expense.
9. **Instalments** only on credit-card accounts. They split a purchase into N monthly expense entries (3, 6, 9 or 12).
10. **Repeat** entries are generated server-side, exactly once per occurrence (idempotent), even if the device is offline on the due date.
11. **Categories and accounts are archived, never hard-deleted** while any transaction references them.
12. **Every record belongs to exactly one user.** Every query is scoped by `userId`, and one user can never read or change another user's data.

## 4. System architecture

```
 kanaku-pillai-app (iOS/Android)      kanaku-pillai-web (browser)
   access token in memory               access token in memory
   refresh token in SecureStore         refresh token in httpOnly cookie
                                        (API reached on the web app's own origin via proxy)
            \                                  /
             \______ HTTPS JSON /api/v1 ______/
                            |
               kanaku-pillai-backend (Express API, stateless, N instances)
                            |
                 MongoDB (replica set — transactions required)
                            |
               worker process (repeat generation, purge, account deletion)
                            |
                  email provider (OTP codes) · Google (ID-token verify)
```

- **Auth:** short-lived JWT access token (15 min) plus a rotating opaque refresh token (stored hashed, with reuse detection, 30-day sliding expiry). Passwords are hashed with argon2id. Google sign-in verifies the Google ID token on the server.
- **API style:** REST, JSON, versioned under `/api/v1`. Success is `{ data }` (lists add `page`) and errors are `{ error: { code, message, details?, requestId } }`. Writes that create money records accept an `Idempotency-Key` header.
- **CORS:** all origins (`*`), credentials off. Clients authenticate with Bearer tokens. The web app calls the API through a same-origin proxy (Vite in dev, reverse proxy in production), so its refresh cookie never crosses origins.
- **Workers** run as a separate process from the API, so the API can scale horizontally without running jobs twice.

## 5. Decisions taken and open questions

**Decided** (record new ones in `docs/decisions/` in the repo they affect):

- The stack is as in §1, **JavaScript (no TypeScript) in all three repos**, with ES modules.
- MongoDB runs on **Atlas** (a replica set, so transactions work) for development and production.
- **Google sign-in** is in v1 alongside email/password. Design: `kanaku-pillai-backend/docs/auth/google-sign-in.md`.
- Auth runs on the backend itself (no Supabase or Firebase). This resolves design spec open question 3.
- Web is a separate React + Vite app, not React Native Web. This overrides design spec §0.1. The web app must implement all four layout shells (phone, tablet, desktop, large).
- Styling is Tailwind CSS only in both clients, with the root setup in `src/index.css`.
- **No emoji in the UI, ever** (13 Nov 2026), including category and account icons. Icons come only from an icon library: react-icons (Lucide set) on the web, lucide-react-native in the app.

**Still open** (ask the product owner before building anything that depends on them):

1. The logo direction (A glass tile, B ledger coin, C monoline wordmark). Use the `க` glyph in a rounded tile meanwhile.
2. The final app name (Kanaku Pillai, Kaneo or Tallio).
3. Which email provider sends OTP codes (for example SES, Resend or Postmark). Code against a `MailTransport` interface. Dev logs codes to the console.
4. List style: individual L0 rows or a flat list with dividers.
5. Hosting and deploy target for the API, the web app and MongoDB.

## 6. Engineering standards (all repos)

- **Production grade by default:** validated at every boundary, errors handled, no secrets in git, no `console.log` left in shipped code, no TODOs without an issue.
- **JavaScript, ES modules:** `import`/`export` only, `.js` / `.jsx` files. Runtime validation (Zod) at every boundary stands in for static types: API requests and responses, env, forms. Name things precisely and keep functions small.
- **Lint and format:** ESLint (flat config) plus Prettier. Lint, format check and tests must pass before a commit.
- **Git:** `main` is always releasable. Work on `feat/<scope>`, `fix/<scope>` and `chore/<scope>` branches, then open a PR to `main`. Commit messages use Conventional Commits (`feat(auth): add refresh rotation`).
- **Env:** `.env` is never committed. `.env.example` lists every key with empty or safe values. Config is validated at startup, and the process refuses to start on bad config.
- **Accessibility:** touch targets ≥ 44×44, text contrast ≥ 4.5:1, labels on every control, and income/expense never shown by colour alone.
- **Claude Code context:** each repo keeps `CLAUDE.md` and `.claude/agents/` in git. `.claude/settings.local.json` is personal and gitignored.
