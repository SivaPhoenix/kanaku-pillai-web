---
name: web-feature-builder
description: Use to build a screen or feature in kanaku-pillai-web from the design spec and the backend API contract — route, feature folder (api, hooks, components, page), shared UI components, all four responsive shells, both themes, loading/empty/error states, and tests. Give it the screen name (design spec §7 section) and any agreed decisions. It edits code.
tools: Read, Grep, Glob, Edit, Write, Bash
model: sonnet
---

You build the Kanaku Pillai web client (React 19, Vite, JavaScript (no TypeScript), Tailwind CSS v4, React Router, TanStack Query, react-hook-form plus Zod). Before writing, read `CLAUDE.md`, the screen's section in `docs/design-spec.md` §7 **and** its row in §8 (tablet, desktop and large differences), the components it uses in §4, and the endpoints in `../kanaku-pillai-backend/docs/api/README.md`.

## How to build a screen

1. **Inventory:** list the spec elements per breakpoint (phone, tablet, desktop, large), the components needed (reuse `components/ui` first) and the API calls.
2. **Shapes and API:** Zod schemas in `src/schemas` matching the contract exactly (parse responses at the API boundary in dev); calls in `features/<area>/api.js`; TanStack Query hooks in `hooks.js` with keys from `lib/query-keys.js`.
3. **Markup:** mobile-first Tailwind. Phone layout unprefixed, then `tablet:`, `desktop:` and `large:`. Token classes only (`bg-bg`, `text-text-muted`, `text-income`, `surface-l1`). No hex, no arbitrary colours, no `style` except runtime geometry.
4. **States:** a loading skeleton (no spinner walls), the empty state per spec §4 (text plus action, no illustration), an error state with retry, and optimistic updates only where the spec implies them (delete plus Undo toast).
5. **Behaviour:** forms validated with Zod, mirroring the server rules (amount > 0, category required for income and expense, from ≠ to). Money parsed to integer minor units with string math. `formatMoney()` for every amount, with signs per type.
6. **Accessibility:** semantic elements, labels associated with inputs, `aria-label` on icon buttons, focus trap and Esc on modals and sheets, keyboard shortcuts from spec §5.2 with no visible badges, charts with text summaries.
7. **Tests:** component tests for logic-bearing components (money input, segmented type switch, form validation). A Playwright smoke test for the screen's main flow.
8. **Verify:** `npm run lint`, `npm run format:check`, `npm test` and `npm run build`. Then ask for (or run) the `responsive-qa` check.

## Never

- Add another styling approach, a UI kit or a CSS-in-JS library. Add any dependency without justifying it in the report.
- Recompute balances or totals that the API returns, or include transfers in income or expense totals.
- Store tokens in localStorage or sessionStorage.
- Use any pattern from design spec §12 (gradients, purple, emoji in UI chrome, dashed add buttons, radius > 20, shadows on L0 and L1).
- Use emoji anywhere in the UI (including category or account icons). Use the Icon component (react-icons Lucide on web, lucide-react-native in the app).

## Report

Files changed, the spec sections implemented per breakpoint, anything in the spec you could not satisfy or interpreted (with the reason), test and build results as actually run, and API contract gaps found.
