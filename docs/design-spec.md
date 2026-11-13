# Kanaku Pillai — Frontend Design Spec (for the coding agent)

> **What this is:** the complete UI spec for the Kanaku Pillai expense tracker, written from the design canvas ("Kanaku Pillai — Glass UI Plan"). Build from this document. Where this document and the canvas disagree, **this document wins**: it records decisions made after some boards were drawn, and fixes inconsistencies found in review (each is marked **Resolved**).
>
> **Stack update (Nov 2026, see `docs/PROJECT.md` §5):** the product now ships as two clients instead of one React Native Web codebase. **Web** is React + Vite + Tailwind CSS (`kanaku-pillai-web`) and implements all four shells (§5). **App** is Expo + NativeWind (`kanaku-pillai-app`) and implements phone and tablet. Both clients style with Tailwind classes only. Read §0.1, §2.2 "Implementation" and §2.3 "load with expo-font" in that light. The design rules themselves are unchanged.
>
> **App name:** Kanaku Pillai (கணக்குப் பிள்ளை, "the accountant"). Logo mark: the Tamil letter **க** (short ka). The logo direction is not final yet; use the `க` glyph in a rounded tile as a placeholder.

---

## 0. Ground rules (read first)

1. **Stack:** React Native with Expo, plus React Native Web for tablet browsers and desktop. One codebase, with a layout shell chosen by window width (§5).
2. **Visual direction:** an ink-and-paper ledger look, with glass only where content actually scrolls underneath. **Do not** add decorative gradient blobs, purple accents, emoji used as UI symbols, keyboard hint badges, marketing slogans or extra KPI tiles. §12 lists every banned pattern.
3. **Every screen supports Dark and Light**, following the system setting by default, with a user override (System / Light / Dark).
4. **Money is stored as an integer in the currency's minor unit** (paise, cents, and zero decimals for JPY). Never use floats. Format with `Intl.NumberFormat`.
5. **Transfers are a first-class type.** They never count as income or expense in any total or chart.
6. **Categories and accounts are archived, never hard-deleted while transactions reference them.**
7. Touch targets are at least **44×44**, text contrast is at least **4.5:1**, and income versus expense is never shown by colour alone: a sign is always present.

---

## 1. Product scope

| Area | Included |
|---|---|
| Auth | Sign up, log in, Google sign-in button, forgot password (email → 6-digit code → new password → done), sign out, delete account |
| First run | Setup: currency, time zone (auto from device), optional starting balances (desktop/large), optional starter categories (large) |
| Transactions | Income, Expense, Transfer. Fields: amount, category (income/expense only), account (or from/to for a transfer), date + time, note, repeat rule, instalment plan (credit card), favourite (template) |
| Views | Month overview, Daily, Stats (week / month / year), Accounts, Search & filters, Transaction detail/edit, Empty month |
| Lists | Editable expense categories, income categories and accounts: rename, icon **or emoji**, colour, reorder, archive |
| Settings | Profile, currency, time zone (device or manual), appearance, week start, lists, change password, signed-in devices (tablet+), sign out, delete account |

### 1.1 Domain decisions (do not change without asking)

- **Currency** is set per account in Settings (one currency per user). Changing it **relabels** existing entries and does **not** convert them. Show this warning in the currency picker. Store `currencyCode` on every transaction anyway, so multi-currency can be added later without a migration.
- **Time zone** defaults to the device zone and is shown as an IANA name. The default for the mocks is **`Asia/Kolkata`** (IST, UTC+05:30). "Asia/India" is not a valid IANA zone. Each transaction stores the UTC instant plus the IANA zone it was recorded in. The **day an entry belongs to is its local date in that recorded zone**, so travelling never moves past entries to another day.
- **Credit card:** a purchase is an expense on the card account, and paying the bill is a **transfer** from bank to card. The card balance is a liability (amount owed).
- **Debit card** has no balance of its own. It is a payment method linked to a bank account, and its spending reduces the linked account.
- **Investments (Stocks, SIP)** are an account of type `investment`. Money moves in via **transfer**, not as an expense.
- **Instalments** apply only when the account is a credit card. They split a purchase into N monthly expense entries.
- **Repeat** generates future entries server-side, exactly once per occurrence (idempotent), and must work even if the device is offline on the due date.

---

## 2. Design tokens

All colours are semantic tokens. Components must never hard-code hex values (except the solid destructive red, §2.1).

### 2.1 Colour

| Token | Dark | Light | Use |
|---|---|---|---|
| `bg` | `#101113` | `#F3F1EC` | App background (warm paper in light mode) |
| `text` | `#ECEAE4` | `#1B1A18` | Primary text |
| `textMuted` | `#9D9A93` | `#5E5B55` | Secondary text, captions |
| `textMuted2` | `#C9C6BF` | `#3A3833` | Labels, emphasised secondary text |
| `accent` | `#ECEAE4` | `#1B1A18` | **Ink.** Primary button fill, selected tab, FAB, active nav |
| `onAccent` | `#101113` | `#F3F1EC` | Text and icons on `accent` |
| `link` | `#ECEAE4` | `#1B1A18` | Links (= text colour; distinguished by weight 700) |
| `income` | `#4CC9F0` | `#08698C` | Income amounts and highlights, always with "+" |
| `expense` | `#FF9F5A` | `#A8470A` | Expense amounts and highlights, always with "−" (U+2212) |
| `transfer` | `#B9B5AC` | `#55524B` | Transfer amounts and highlights (neutral, no sign) |
| `danger` | `#FF6B7A` | `#B4232F` | Destructive text and outline buttons |
| `dangerSolid` | `#C4283B` | `#C4283B` | Solid delete button background (white text) |
| `success` | `#7BE0AD` | `#17734A` | Password rules met, "down" spending deltas |
| `warning` | `#FFD166` | `#8A6500` | Currency-change warning |
| `line` | `rgba(255,255,255,.10)` | `rgba(27,26,24,.10)` | Dividers, empty bar tracks |
| `scrim` | `rgba(0,0,0,.60)` | `rgba(27,26,24,.35)` | Behind sheets and modals |

**Category / data palette** (picked per category or account by the user; 7 slots):

| Slot | Dark | Light | Default mapping |
|---|---|---|---|
| `c1` | `#FF9F5A` | `#A8470A` | Food |
| `c2` | `#6FA8FF` | `#2457C5` | Transport, Bank |
| `c3` | `#C08BFF` | `#7A3FC4` | Shopping, Credit card |
| `c4` | `#FFD166` | `#8A6500` | Bills / Electricity |
| `c5` | `#7BE0AD` | `#17734A` | Rent / Home, Cash |
| `c6` | `#FF7AA8` | `#B4285E` | Entertainment |
| `c7` | `#5EE0D0` | `#0F766E` | Medicine / Health |

> **Resolved:** `c1` is the same hue as `expense`. That is acceptable for data colouring, but never use `c1` alone to mean "expense".

**Tints:** icon tiles and selected chips use the token colour at **16–18% alpha** over the surface. In React Native, precompute these as hex with alpha, because CSS `color-mix()` does not exist in RN.

### 2.2 Surfaces and glass tiers

| Tier | Where | Fill (dark / light) | Border (dark / light) | Blur |
|---|---|---|---|---|
| **L2 Elevated** | Bottom tab bar, side rail/sidebar, bottom sheets, modals, auth card, hero balance card | white 8% / white 88% | white 14% / ink 10% | **Real blur**, radius 40, saturate 170%. Max **one** blurred surface per screen region |
| **L1 Card** | Section panels (category breakdown, summary cards, side panels) | white 5% / white 72% | white 10% / ink 8% | **No blur on native.** Translucent fill only. Web may use `backdrop-filter: blur(24px)` |
| **L0 Tint** | List rows, chips, inputs, segmented tracks | white 3.5% / ink 3.5% | white 8% / ink 8% | Never. Anything inside a scrolling list is L0 |

- **No drop shadows** on L0 or L1. L2 may use a soft shadow (`0 12px 40px` at 14% black).
- **Fallback:** when the OS "Reduce transparency" setting is on, or the Android device is low-end, every tier becomes solid (dark `#1A1B1E`, light `#FFFFFF`).
- **Implementation (native):** use `expo-blur` `BlurView` only for L2. **[Likely]** Blur on Android is expensive. Never put a BlurView inside a FlatList item.
- **Implementation (web):** `backdrop-filter` on L2 (and optionally L1).

### 2.3 Typography

Fonts: **IBM Plex Sans** (UI), **IBM Plex Mono** (all amounts, dates and month labels, with tabular digits), **Noto Sans Tamil** (the `க` glyph and any Tamil text). Load all three with `expo-font`; on web, load them from Google Fonts.

| Style | Font | Size / weight | Use |
|---|---|---|---|
| `display` | Plex Mono | 40 / 700, tracking −0.02em | Phone balance, large amount on detail |
| `amountXL` | Plex Mono | 46–50 / 700 | Amount input on Add |
| `title` | Plex Sans | 22–30 / 700 | Screen titles (phone 22–24, desktop 26, large 30) |
| `period` | Plex Mono | 15–20 / 600 | "October 2026", "Thu, 22 Oct" |
| `heading` | Plex Sans | 17 / 700 | Section headings |
| `body` | Plex Sans | 15 / 500–600 | Row titles, inputs |
| `caption` | Plex Sans | 13 / 400 | Row metadata ("Food · Cash · 1:20 PM") |
| `label` | Plex Sans | 12–13 / 700, UPPERCASE, tracking 0.06–0.08em | Field group labels ("CATEGORY", "FROM") |
| `amountRow` | Plex Mono | 15–16 / 600–700 | Amounts in rows |

Headings (`h1`, `h2`) are always Plex Sans, even where the canvas shows a mono class.

### 2.4 Spacing, radius, size

- **Spacing scale:** 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32.
- **Screen padding:** phone 20 horizontal; tablet 24; desktop 24; large 28. The gap between shell panes equals the screen padding.
- **Radius tokens:** `sm 8`, `md 12`, `lg 14`, `xl 16`, `2xl 18`, `sheet 20` (top corners of sheets and modals). Do not exceed 20. Circles use 50%.
- **Control heights:** inputs 46–54 (phone 50, large 54), primary buttons 50–56, chips 36–44, segmented 38–46, list rows ≥ 54.
- **Icon tile:** 40–44 square with radius 12, holding a tinted fill and a 20px stroke icon.

### 2.5 Iconography

Stroke icons on a 24×24 grid, `stroke-width 1.9`, round caps and joins, no fill, colour `currentColor`. Use `react-native-svg`. These are the exact paths used on the canvas (replace with a licensed icon set if preferred, but keep the same metaphors):

```ts
export const ICONS = {
  month:    'M3 10l9-6 9 6v10H3zM9 20v-6h6v6',
  daily:    'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4',
  stats:    'M12 3a9 9 0 1 0 9 9h-9zM15 3.5A9 9 0 0 1 20.5 9H15z',
  accounts: 'M4 6a8 3 0 1 0 16 0a8 3 0 1 0-16 0M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  search:   'M11 4.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13M20 20l-4-4',
  lists:    'M4 6h16M4 12h16M4 18h10',
  settings: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  plus:     'M12 5v14M5 12h14',
  close:    'M6 6l12 12M18 6L6 18',
  back:     'M15 6l-6 6 6 6',
  forward:  'M9 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  edit:     'M4 20h4L19 9l-4-4L4 16v4z',
  trash:    'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  eye:      'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
  check:    'M5 12.5l4.5 4.5L19 7.5',
  repeat:   'M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4',
  swap:     'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4',
  transfer: 'M4 8h14l-3-3M20 16H6l3 3',
  star:     'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4',
  clock:    'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17M12 7.5V12l3 2',
  globe:    'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z',
  warning:  'M12 4l9 16H3zM12 10v4M12 17v.5',
  // categories / accounts (line-icon option; users may pick an emoji instead)
  food:     'M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 5s1 4 3 4v9',
  bus:      'M6 4h12a2 2 0 0 1 2 2v11H4V6a2 2 0 0 1 2-2zM4 11h16M8 17v3M16 17v3',
  bag:      'M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2',
  bolt:     'M13 3L5 14h6l-1 7 8-11h-6l1-7z',
  home:     'M4 11l8-7 8 7v9H4zM10 20v-5h4v5',
  film:     'M5 5h14v14H5zM9 5v14M15 5v14',
  wallet:   'M5 6h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 10h18M16 14.5h2',
  bank:     'M3 10l9-5 9 5M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18',
  cash:     'M4 7h16v10H4zM12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5',
  card:     'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M7 15h4',
  trend:    'M3 17l6-6 4 4 8-8M15 7h6v6',
  laptop:   'M5 6h14v9H5zM3 18h18',
  undo:     'M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10',
};
```

**Emoji** are allowed **only as user-chosen category or account icons** (data), never as UI symbols. Do not put ☆, ★, ⇄, ↑ or ↓ in button or label text.

### 2.6 Motion

Keep motion minimal and functional: sheet slide-up (250ms ease-out), modal fade+scale (200ms), segmented thumb slide (150ms), row swipe reveal (spring), theme switch cross-fade (150ms). Respect "Reduce motion".

---

## 3. Theming

- The `ThemeProvider` exposes `mode: 'system' | 'light' | 'dark'` and the resolved `scheme`. Persist `mode` in user settings (synced) with a local cache.
- `system` follows `Appearance` / `prefers-color-scheme` live.
- Tokens are two objects (`dark` and `light`) with identical keys; components read from `useTheme().colors`.
- The status bar style follows the scheme.

---

## 4. Core components

| Component | Spec |
|---|---|
| **Button / primary** | Fill `accent`, text `onAccent`, height 50–56, radius 12–14, Plex Sans 15–16/700. Full-width on phone forms |
| **Button / secondary** | L1 surface, text `text`, same sizes |
| **Button / ghost** | No fill, text `link` 700 |
| **Button / danger** | Outline 1.5px `danger`, text `danger`. Final destructive confirm uses `dangerSolid` with white text |
| **Hairline button** | 1px `line` border, no fill, text `link` 700. Used for "Add category", "Add account", "Add to Thu, 22 Oct". **No dashed borders** |
| **Icon button** | 44–52 square, L1 surface, radius 12–14. Needs an `accessibilityLabel` |
| **Input** | L0 fill + border, height 46–54, radius 12–14, padding 14–16, placeholder `textMuted`. The label sits above (13/600 `textMuted2`) and must be programmatically associated |
| **Password input** | Input with a trailing show/hide eye button (label switches between "Show password" and "Hide password") |
| **Strength meter** | 4 bars, 4–5px tall, gap 6. Score = 8+ chars, mixed case, digit, symbol. Colours by score: 1 `danger`, 2 `expense`, 3 `warning`, 4 `success`. Labels: Too weak / Weak / Okay / Good / Strong |
| **OTP input** | 6 cells in a grid (gap 8–12), height 56–66, Plex Mono 22–26, numeric keypad, auto-advance, paste support. The active cell has a 2px `accent` border |
| **Chip (selectable)** | Height 36–44, radius 12. Unselected: L0. Selected: 1.5px border in the context colour (category colour for categories, `accent` for accounts, `transfer` for from/to) plus a 18% tint and weight 700 |
| **Segmented control** | L0 track with 3–4px padding, radius 12–16. Selected segment: either a solid `accent` fill with `onAccent` text (primary tabs) or an `accent` 22–28% tint (secondary). For the Income / Expense / Transfer selector, the selected segment uses its type colour (border + 18% tint) |
| **Switch** | 52×32 (56×34 on large). Track on = `accent`, off = `textMuted`. Knob 26–28 in `onAccent`. `role=switch` with `aria-checked` |
| **Transaction row** | L0, radius 14–18, padding 10–14, at least 54 tall. Contents: icon tile (category colour) + title (note, falling back to category name) + meta "Category · Account · time" + amount (Plex Mono, type colour, signed). Swipe left on mobile reveals Edit (`accent`) and Delete (`dangerSolid`) actions, each 60 wide. Tapping opens Detail |
| **Date group header** | "Thu, 22 Oct · Today" (13/700 `textMuted2`) with the day's net on the right (signed, type colour) |
| **Amount text** | Always formatted via `formatMoney()` (§9). Expense "−₹240", income "+₹6,000", transfer "₹9,870" (neutral colour, no sign) |
| **Bottom sheet** | L2, top radius 20, 40×5 grab handle, title row with close button, scrim behind. Phone only (tablet and above use a centred modal) |
| **Modal** | L2, radius 20. Centred: tablet 880×710, desktop 1080×740, large 1400×860. Esc closes on web |
| **Alert dialog** | L2, width 340 on phone (inset 24) and 460–520 elsewhere. Title, one-line consequence, Cancel (secondary) + Delete (`dangerSolid`) |
| **Toast / Undo** | After deleting: "Deleted · Undo", 5-second window. Hard delete happens after the window closes (or soft-delete with `deletedAt`) |
| **Donut chart** | SVG arcs (**not** CSS conic-gradient, which RN lacks). Phone 220 (inner 132), tablet 290 (176), desktop 270 (164), large 330 (200). Segments sorted descending, coloured by category token. The centre shows "Spent" or "Earned" plus the total. The accessibility label lists each category with its percentage. The caption "Excludes transfers" sits below |
| **Ranked row** | Percentage pill (category colour at 22%, Plex Mono 13/700) + name + amount + a 4–7px bar whose width is relative to the largest item. Tapping opens Search filtered to that category and period |
| **Daily bar chart** (desktop Month) | 31 columns, 5px gap, plot height 140. Values above the cap (₹4,000) are drawn at full height with a value label above ("15k"). Future days use `line` colour at 3px. The selected day is `accent`; others are `expense` at 60%. Each bar is a button with an accessibility label "22 Oct: ₹1,240 spent" |
| **Calendar heatmap** (large Month) | 7 columns, Monday first; 5–6 rows of `minmax` height. Cell = day number + "−₹spent" + "+₹income" (in `income` colour). Intensity from expense: 0 → L0, <800 → 12%, <1,600 → 30%, <2,500 → 50%, otherwise 72% `expense` tint. Future days at 50% opacity and disabled; the selected day gets a 2px `accent` ring. A legend sits top-right |
| **Trend bars** | 6 months (desktop) or 12 months (large). The current month uses the full type colour, others 40%. Value label ("₹42k") above each bar, month below, average shown in the header |
| **Empty state** | Centred text only: title + one-line explanation + primary button (+ secondary on tablet and above). **No illustration** |

---

## 5. Breakpoints and layout shells

> **Resolved:** the Foundations board says tablet is 600–1023, but the tablet design is drawn at **1194** wide (landscape iPad) using the tablet shell. Use these breakpoints instead:

| Class | Window width | Shell | Designed at |
|---|---|---|---|
| **Phone** | < 600 | Bottom tab bar + centre FAB; single column; Add is full-screen; pickers are bottom sheets | 390 × 844 |
| **Tablet** | 600 – 1279 | 88px icon **rail** (left, L2, radius 18); two-pane content; Add is a centred modal | 1194 × 834 (landscape) |
| **Desktop** | 1280 – 1679 | 232px labelled **sidebar**; main content plus one side panel | 1440 × 900 |
| **Large** | ≥ 1680 | 248px sidebar; three-pane content; persistent quick add on Month | 1920 × 1080 |

Use `useWindowDimensions()` and switch the **shell**; screens share hooks, data and components and only rearrange.

### 5.1 Navigation per shell

| Shell | Items |
|---|---|
| Phone tab bar (L2, floating 16px from the edges, 24 from the bottom, height 72, radius 18) | **Month**, **Daily**, **[+] FAB** (56×56, `accent`, radius 16–20), **Stats**, **Accounts**. Settings is the gear icon in the Month and Accounts headers. Search is the icon in the Month header |
| Tablet rail | Logo tile, Month, Daily, Stats, Accounts, Search, Settings (icon-only, 56×56, tooltip), and an Add button pinned at the bottom (`accent`) |
| Desktop / large sidebar | Logo + wordmark, **New entry** button (`accent`, full width), Month, Daily, Stats, Accounts, Search, Lists, Settings, then the user avatar + name pinned at the bottom (opens Settings) |

The active nav item gets an `accent` 20% tint background and `text` colour; inactive items use `textMuted2`.

### 5.2 Keyboard (web, desktop and large)

Implement these, but **do not render key badges in the UI** (put them in tooltips or a help sheet only): `N` new entry, `/` focus search, `←` / `→` previous/next day (Daily), `E` edit the selected entry, `Enter` save, `Esc` close a modal or cancel.

---

## 6. Routes

```
/auth/login            /auth/signup           /auth/forgot (step state 1–4)
/setup                 (after first sign-up)
/month?m=2026-10       (home; next month with no data → empty state)
/daily?d=2026-10-22
/stats?period=month&type=expense&ref=2026-10
/accounts              /accounts/:id (activity; tablet+ shows inline)
/add?type=expense|income|transfer&from=&to=&template=
/tx/:id                /tx/:id/edit (tablet+ edits inline)
/search?q=&type=&from=&to=&category=&account=&min=&max=
/settings              /settings/currency (phone sheet)
/lists?tab=expense|income|accounts&id=
```

Deep links from Accounts → "Pay bill" open `/add?type=transfer&from=<bank>&to=<card>&amount=<statement>`.

---

## 7. Screens

Mock data used throughout is in §10. Each screen below is the phone spec; §8 lists the differences at tablet, desktop and large.

### 7.1 Login
- Logo tile (`க`), title "Welcome back", subtitle "Sign in to Kanaku Pillai".
- L2 card containing Email, Password (with show/hide), "Forgot password?" link, **Sign in** (primary), an "or" divider, and **Continue with Google** (secondary; use the official Google mark at build time, not the placeholder circle).
- Footer: "New here? **Create an account**".
- Tablet and above: a "Keep me signed in" checkbox. Desktop and large: a centred card under a small logo row. **No marketing panel or slogan.**

### 7.2 Sign up
- Back button, title "Create your account".
- Full name, Email, Password with strength meter, Confirm password, a checkbox "I agree to the Terms and Privacy Policy" (links), **Create account**, and the footer link "Already have an account? Sign in".
- Phone scrolls (the design frame is 390×960). Tablet and above: name/email and password/confirm sit in two columns.
- On success, go to **Setup**.

### 7.3 Forgot password (four steps, one route)
1. **Email**: "Reset your password", Email, **Send code**, and the note "For privacy we show the same message whether or not the email has an account." Never reveal whether an account exists.
2. **Code**: "Check your email", masked address "s•••@example.com", 6-digit OTP, **Verify code**, and "Didn't get it? Resend in 0:42" (live countdown; Resend becomes a link at 0).
3. **New password**: New + Confirm, with rules shown live and checked: 8+ characters · a number and a symbol · passwords match. Then **Update password**.
4. **Done**: check icon, "Password updated", "You've been signed out of other devices.", **Back to sign in**.
- Step indicator "Step N of 3" with 3 dots (the current dot is a 22px pill). The back button goes to the previous step.

### 7.4 Setup (first run)
- "Welcome, {first name}", title "Set up your account", subtitle "Pick the currency you track in. You can change it later in Settings."
- **Currency** radio grid (phone 2 columns × 3: INR, USD, EUR, GBP, AED, SGD; each tile shows symbol + code + name), an "All currencies…" link that opens the searchable picker, and a preview line "Amounts will look like ₹1,23,456.50" (live `Intl` format of 123456.5).
- **Time zone** info row: globe icon, "Asia/Kolkata · IST (UTC+05:30)", "Taken from your phone · decides which day an entry falls on".
- **Start tracking** (primary) goes to Month.
- Desktop adds **Starting balances (optional)**: Savings, Wallet (cash), and Credit card amount owed. Large also adds **Starter categories**: toggle chips, all on by default.

### 7.5 Month (home)
- Header: month switcher pill ("‹ October 2026 ›"; Next goes to the empty state when there is no data), Settings gear, and Search icon.
- **Balance card** (L2): "Balance this month" + display amount; a 2-column Income / Expense mini-tiles below. Balance = income − expense (transfers excluded).
- **Spending by category** (L1): stacked horizontal bar of all categories (12px, 2px gaps), the top 4 rows (icon tile, name, %, amount), "Show all 6 categories", and an "Edit list" link to Lists.
- **Spent by account** (L1): 2×2 tiles (icon, name, amount spent this month).
- **Daily transactions**: grouped by date (newest first) with group headers and rows, and an "Open day view" link.
- The tab bar floats over the scrolling content (this is where L2 blur is visible).

### 7.6 Daily
- Header: previous/next day buttons, "Thursday, 22 Oct" + "Today".
- **Week strip** (L1, 7 equal buttons): day-of-week, date, and a dot if the day has entries. Selected = `accent` fill with `onAccent` text. Future days at 45% opacity.
- **Summary** (L2): In / Out / Entries (3 columns).
- Rows for the selected day, newest first, with time in the meta. Swipe left reveals Edit/Delete.

### 7.7 Add transaction (phone: full screen, 390×960 frame)
- Header: Close (back to the origin), "New expense / income / transfer", **Favourites** button (opens a sheet).
- **Type** segmented: Income · Expense · Transfer, each selected in its type colour.
- Row: date-time chip ("Thu, 22 Oct · 12:56 PM", opens the native picker) and a **Repeat** chip. The Repeat chip label shows the current rule, e.g. "Monthly" or "6 instalments"; when a rule is active it gets an `accent` border and tint.
- **Amount**: large Plex Mono input (decimal keypad) with the sign + currency symbol prefix, coloured by type.
- **Income / Expense**: CATEGORY label + edit-pencil link (to Lists); a 3-column category grid (emoji/icon + name, 48 tall). Then an ACCOUNT chip row: Savings, Cash, Credit card, Debit card.
- **Transfer**: an L1 panel with FROM chips (excludes Debit card), a swap button (circular, `transfer` colour), TO chips (excludes Debit card and the selected From account), and the note "Transfers move money between your accounts. They never count as income or expense."
- NOTE input.
- Footer: **Save as favourite** (secondary toggle; label becomes "Saved") and **Save {type}** (primary).
- **Favourites sheet**: "One tap fills the form. Date stays today." Rows: emoji + title + meta + amount in type colour. Tapping fills type, amount, note, and category/account or from/to, then closes the sheet.
- **Repeat sheet**: segmented Repeat | Instalments.
  - *Repeat*: Never, Daily, Weekly, Monthly, Yearly, Custom (3-column chips). Caption "Creates this entry again automatically."
  - *Instalments*: 3, 6, 9 or 12 months. A "Per month" row shows amount ÷ N. Caption "Splits a credit-card purchase into monthly entries." **Enabled only when the account is a credit card.** Otherwise show it disabled with the reason.
  - **Done** closes the sheet.
- Validation: amount > 0; a category is required for income/expense; From ≠ To for a transfer.

### 7.8 Transaction detail
- Back and Edit buttons. Centre: icon tile 64, note, signed display amount, type badge ("Expense" pill in a type tint).
- Fields (L1 list with dividers): Category, Payment mode/Account, Date, Time + zone abbreviation (IST), Note. Meta: "Added 22 Oct, 1:22 PM · Last edited never".
- Footer: **Duplicate** (secondary) and **Delete** (danger outline), which opens an alert: "Delete this expense?" / "−₹240 · Lunch · 22 Oct. Your October balance will update." with Cancel / Delete. After deletion, show the Undo toast.

### 7.9 Stats
- Header: period switcher with prev/next ("Oct 2026", "19 – 25 Oct", "2026") and segmented Week | Month | Year.
- Tabs: Income (total) | Expenses (total), with a 3px underline in the type colour.
- Donut (L1) and the caption "Excludes transfers between your accounts."
- Ranked list, sorted descending.

### 7.10 Accounts
- Header: title "Accounts", hide-balances toggle (eye; shows "₹ ••••" everywhere on the screen), Settings gear.
- **Net worth** card (L2): net worth plus Assets (`income` colour) / Liabilities (`expense` colour) tiles.
- Groups with uppercase labels: BANK, CASH, CARDS, INVESTMENTS. Each account row has an icon tile, name, sub-line and balance.
  - Bank sub-line: "Debit card ••4821 spends from here".
  - Credit card is a richer block: outstanding amount (expense colour) + "outstanding", "Bill due 5 Nov · statement ₹9,870", a limit-usage bar ("12% of ₹1,00,000 limit used"), and a **Pay bill — transfer from Savings** button (opens prefilled Add in transfer mode).
  - Investments sub-line: "Money moved in via transfers".
- **Add account** (hairline button).

### 7.11 Manage lists
- Back button, title "Manage lists". Tabs: Categories | Accounts (solid `accent` selected). In Categories, sub-toggle pills: Expense | Income.
- Rows: drag handle (reorder; the order here is the chip order in Add), icon tile (emoji or line icon in a 16% colour tint), name, usage meta ("42 transactions this month" / "Credit · bill due on the 5th · 12 txns"), a "Default" badge where it applies, and an edit pencil.
- **Edit sheet**: Name input; **Icon or emoji** picker (a line-icon option, a row of suggested emoji, and an "Any" input accepting one emoji); **Colour** swatches (c1–c6, 44 targets, selected = 2.5px `text` ring); the archive explanation; **Archive** (danger outline) and **Save** (primary).
- Archive rule copy: "Archiving hides it from new entries; past transactions keep their category. Delete is only offered when nothing uses it."
- Add button at the bottom: "Add expense category" / "Add income category" / "Add account".

### 7.12 Search
- Search input (autofocus) + Cancel link.
- Type chips: All / Expense / Income (+ Transfer on tablet and above). Filter chips: date range ("Oct 2026"), Category, Mode/Account (each opens a picker).
- Result summary (L1): "**4** results" with the net total on the right (signed, type colour). **The net excludes transfers.**
- Rows: date block (day number + day-of-week), note, meta, signed amount. Tapping opens Detail.
- Empty: "No matches" / "Try another word or clear a filter."
- Matching: case-insensitive on note, category name and account name; amount match when the query is numeric.

### 7.13 Settings
- Profile card: avatar initial, name, email, Edit.
- **PREFERENCES**:
  - **Currency** row ("INR · ₹") opens the currency sheet: search ("Search code or name"), the warning banner ("Changing currency relabels your N existing entries. Amounts are not converted."), and a list (symbol tile, "CODE · Name", sample "₹1,23,456.50", a check on the selected one). Selecting closes the sheet.
  - **Use phone time zone** switch, with sub-line "Asia/Kolkata · IST (UTC+05:30)". When off, a **Time zone** row appears and opens an IANA picker.
  - **Appearance** segmented: System / Light / Dark (applies live).
  - **Week starts on**: Monday / Sunday.
- **LISTS**: Categories (count), Payment modes / Accounts (count). Both open Manage lists.
- **ACCOUNT**: Change password (reuses the forgot flow from step 2 with the email prefilled), Sign out, **Delete account** (danger text; confirm with a typed confirmation). App-store rules require in-app account deletion when sign-up exists.
- Footer: "Kanaku Pillai · v{version}".

### 7.14 Empty month
- Same header as Month (Next disabled at the current month).
- Zeroed summary (amounts in `textMuted`).
- Title "Nothing in November yet", body "Your categories and payment modes carry over. Add the first income or expense to start the month.", **Add first entry** (primary). Tablet and above add **Use a favourite** (secondary).
- If recurring entries are scheduled, mention them in the body ("Your 2 repeating entries will appear on their dates").

---

## 8. Differences by breakpoint

| Screen | Tablet (rail, 2 panes) | Desktop (sidebar + panel) | Large (sidebar, 3 panes) |
|---|---|---|---|
| Login / Sign up / Forgot | Centred card 480–640 wide | Centred card ≤ 520 under the logo row | Centred card ≤ 600 under the logo row |
| Setup | Card 860 wide: currency grid (3 columns × 3) + preview / time zone column | Card 1080: currency (12 options, 3 columns) + time zone + starting balances | Card 1560: currency + time zone/balances + starter categories |
| Month | KPI card + category breakdown (6 items, 2-column legend) + account tiles on the left; daily list on the right | KPI row (Balance / Income / Expense), daily spending bar chart, category bars + account list; right panel shows the selected day (rows, "Add to this day") and the Appearance switch in the sidebar | KPI row (3), **calendar heatmap**; right column: selected-day detail + **persistent quick add** form (type, amount, note, category chips, account chips, Add expense) |
| Daily | Header + week strip (470 wide); left: summary + selectable rows; right: **selected entry** panel (fields, Edit, Duplicate, Delete) | Week strip shows each day's spend under the date; left: summary (In / Out / Entries) + Time/Entry/Amount rows; right: selected entry with Duplicate / Favourite / Delete | Same as desktop, with larger type and spacing (two panes) |
| Add | Modal 880×710: left = type, amount, date, repeat, note; right = 4-column category grid + accounts (or transfer from/to) | Modal 1080×740: three columns. Left = amount/date/repeat/note/account; middle = 3-column categories (or transfer); right = **Favourites list** + "Save current as favourite" | Modal 1400×860, same three columns, 4-column categories |
| Detail | Inline **edit form** (type segmented, amount, category, account, date-time, note, repeat; Cancel / Save) + "Food this month" context with similar entries | Edit form + context card + **History** (created on phone, synced) | Three columns: edit form, context, history |
| Manage | Master-detail: tabs (Expense / Income / Accounts) + list on the left; edit panel on the right (emoji grid 8×2, colours, Archive / Save) | List with columns (handle, icon, name, usage) + edit panel | Three columns: list-type nav (with counts), items, edit panel |
| Search | Filter sidebar 260 (type chips, date, category checkboxes, account) + results | Filters (+ amount min/max) + results **table** (Date, Note, Category, Account, Amount) + **Export CSV** | Filters + table + **summary panel** (Net, Spent, Received) |
| Settings | Section list (Profile, Preferences, Lists, Security, Account) + content | Section list + Preferences page (currency grid with live preview, time zone switch, week start, appearance preview tiles) | Section list + content + **live preview** panel (balance card rendered in the chosen currency and theme) |
| Stats | Donut 290 left; ranked list right; tabs as large tiles showing totals | Donut + ranked rows (pill, name, bar, amount) + **6-month trend** | Donut 330 + ranking + **vs previous period** list (signed delta; spending up = `expense` colour, down = `success`) + **12-month trend** |
| Accounts | Net worth / Assets / Liabilities tiles; selectable account list; right panel = selected account's month activity (in/out, recent rows, Pay bill when it's a card) | Same, with a share-of-assets bar per account | Plus a **Next card bill** tile and a **Quick transfer** panel (from/to chips, amount, Transfer) |
| Empty month | Zero KPI tiles + centred message | Same | Same |

Tablet portrait (834 wide) uses the tablet shell, with two panes stacked into a single scrolling column.

---

## 9. Data model and formatting

```ts
type ID = string; // uuid
type Minor = number; // integer minor units (paise/cents)

interface UserSettings {
  currencyCode: string;           // ISO 4217, default 'INR'
  locale: string;                 // derived from currency for formatting, e.g. 'en-IN'
  tzMode: 'device' | 'manual';
  tzid: string;                   // IANA, default 'Asia/Kolkata'
  theme: 'system' | 'light' | 'dark';
  weekStart: 'mon' | 'sun';
}

type AccountType = 'bank' | 'cash' | 'credit_card' | 'debit_card' | 'investment';
interface Account {
  id: ID; name: string; type: AccountType;
  icon: { kind: 'glyph' | 'emoji'; value: string };
  color: 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7';
  openingBalanceMinor: Minor;      // for credit_card: amount owed at start
  linkedAccountId?: ID;            // debit_card → bank
  creditLimitMinor?: Minor; statementDay?: number; dueDay?: number;
  isDefault?: boolean; sortOrder: number; archivedAt?: string;
}

interface Category {
  id: ID; kind: 'expense' | 'income'; name: string;
  icon: { kind: 'glyph' | 'emoji'; value: string };
  color: Account['color']; sortOrder: number; archivedAt?: string;
}

type TxType = 'income' | 'expense' | 'transfer';
interface Transaction {
  id: ID; type: TxType;
  amountMinor: Minor;             // always positive; the sign comes from type
  currencyCode: string;
  categoryId?: ID;                // required for income/expense, null for transfer
  accountId: ID;                  // income: into; expense: from; transfer: from
  toAccountId?: ID;               // transfer only
  occurredAt: string;             // UTC ISO instant
  tzid: string;                   // zone at time of recording → defines local date
  note?: string;
  recurrenceId?: ID; installmentPlanId?: ID; installmentIndex?: number;
  createdAt: string; updatedAt: string; deletedAt?: string; createdOn: 'ios' | 'android' | 'web';
}

interface RecurrenceRule { id: ID; template: Omit<Transaction, 'id' | 'occurredAt' | 'createdAt' | 'updatedAt'>;
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'; interval: number; byDay?: number[];
  startsOn: string; endsOn?: string; lastGeneratedFor?: string; }

interface InstallmentPlan { id: ID; accountId: ID /* credit_card */; totalMinor: Minor; months: 3 | 6 | 9 | 12; startsOn: string; }

interface Favourite { id: ID; title: string; icon: string; type: TxType; amountMinor: Minor;
  categoryId?: ID; accountId?: ID; toAccountId?: ID; note?: string; sortOrder: number; }
```

**Derived values**
- `balance(account)` = opening + income in − expense out ± transfers. Debit-card activity rolls into its linked bank account.
- `liability(card)` = opening owed + card expenses − transfers into the card.
- Month/period totals: sum income and expense only. **Exclude transfers everywhere** (Month, Stats, Search net, Day In/Out).
- Net worth = Σ asset balances − Σ card liabilities.

**Formatting**

```ts
const fmt = (minor: number, s: UserSettings) =>
  new Intl.NumberFormat(s.locale, { style: 'currency', currency: s.currencyCode })
    .format(minor / 10 ** minorDigits(s.currencyCode)); // JPY 0, most 2
// Signs: expense '−' (U+2212) prefix, income '+', transfer none.
// INR groups as 1,23,456.50 (en-IN); USD 123,456.50; EUR (de-DE) 123.456,50 €.
```

- Dates use Plex Mono and the format "Thu, 22 Oct", "October 2026", "19 – 25 Oct", "1:20 PM".
- **[Likely]** Hermes supports `Intl.NumberFormat` and `DateTimeFormat`. Verify on the minimum Android target, and fall back to a formatter library if a locale is missing.

---

## 10. Mock / fixture data (matches the canvas)

- **User:** Siva, siva@example.com, INR, Asia/Kolkata. "Today" = Thu 22 Oct 2026.
- **October 2026:** Income ₹85,000 (Salary ₹79,000 on 1 Oct, Freelance "Website project" ₹6,000 on 21 Oct). Expense ₹42,380: Rent 15,000 · Food 9,840 · Shopping 6,250 · Transport 4,120 · Bills 3,870 · Entertainment 3,300. Balance ₹42,620.
- **By account (spent):** Bank 18,870 · Credit card 12,450 · Cash 6,240 · Debit card 4,820.
- **22 Oct:** Electricity bill −880 (Bills, Bank, 6:10 PM) · Lunch −240 (Food, Cash, 1:20 PM) · Auto to office −120 (Transport, Cash, 9:05 AM).
- **21 Oct:** Website project +6,000 (Freelance, Bank) · Groceries −1,460 (Food, Debit card).
- **Daily spend 1–22 Oct:** 15000, 640, 1820, 2350, 420, 980, 1340, 260, 3120, 760, 2480, 540, 1150, 890, 1950, 620, 1980, 2240, 360, 780, 1460, 1240 (sum 42,380).
- **Accounts:** Savings ₹1,52,600 (debit ••4821 linked) · Wallet ₹6,300 · Credit card ••9310 owes ₹12,450 (limit ₹1,00,000, statement ₹9,870 due 5 Nov) · Stocks & SIP ₹25,450. Net worth ₹1,71,900 (assets ₹1,84,350).
- **Expense categories (emoji):** 🍜 Food, ☕ Coffee, 🥨 Snacks, 🍒 Fruits, 🚕 Transport, 🏠 Rent, ⚡ Electricity, 🪑 Household, 💊 Medicine, 💇 Haircut, 📱 Gadgets, 📙 Education. **Income:** 💰 Salary, 💻 Freelance, 🏦 Interest, ↩️ Refund, 🎁 Gift, 📦 Other.
- **Favourites:** Lunch ₹240 (Food, Cash) · Auto to office ₹120 (Transport, Cash) · Monthly SIP ₹6,000 (transfer Savings → Stocks & SIP) · Card bill ₹9,870 (transfer Savings → Credit card).
- **6-month expense trend (May–Oct):** 38,200 · 41,050 · 39,800 · 44,600 · 40,900 · 42,380. **Income:** 80,000 · 82,500 · 81,000 · 85,000 · 79,000 · 85,000.

---

## 11. Accessibility checklist

- Real buttons, links and inputs with associated labels. Icon-only buttons need an `accessibilityLabel`.
- Contrast ≥ 4.5:1 for text (the light-mode semantic colours were chosen for this; don't reuse dark-mode hex values in light mode).
- Income, expense and transfer are always distinguishable without colour (sign, label, or position).
- Charts carry an `accessibilityLabel` summary; bars and heatmap cells are focusable buttons with value labels.
- Dynamic Type / font scaling up to 200%: rows grow in height, and amounts never truncate (shrink the note text first).
- Focus order follows the visual order; modals trap focus; Esc closes them on web.
- Respect Reduce Motion and Reduce Transparency (§2.2 fallback).

---

## 12. Do NOT (anti-slop rules from design review)

- No blurred colour blobs, gradient washes or glowing backgrounds.
- No purple or indigo brand accent. Interaction colour is ink (`accent`).
- No marketing slogans, feature bullet lists or decorative product previews on auth screens.
- No "Tip" boxes, designer notes or explanatory captions about the UI inside the UI.
- No vanity KPI tiles ("vs daily avg", "you've spent 50%", entry counts) unless the product owner asks for them.
- No visible keyboard-shortcut badges.
- No emoji or text symbols (☆ ★ ⇄ ↑ ↓ →) in buttons or labels. Emoji appear only as user category or account icons.
- No dashed "+ Add" buttons, no illustrations in empty states, no card-inside-card nesting beyond L1 → L0, and no corner radius above 20.
- No drop shadows on ordinary cards.

---

## 13. Open questions (ask before building)

1. **Logo:** three directions on the canvas (A glass tile, B ledger coin, C monoline wordmark). Not yet chosen; the designer recommends B.
2. **App name:** keep "Kanaku Pillai" or rename (shortlist: Kaneo, Tallio). Not decided.
3. **Backend / auth provider** for email OTP and Google sign-in (e.g. Supabase or Firebase) is not decided.
4. **List style:** rows are still individual L0 boxes. A cleaner flat list with dividers was proposed and not yet drawn.
5. **Dark vs light default** per platform: the design follows the system setting. Confirm there is no forced default.

---

## 14. Source

- Design canvas: "Kanaku Pillai — Glass UI Plan" (private to the owner). Pages: 1 Design system + logo · 2 Phone auth · 3 Phone app · 4 Phone settings & states · 5 Tablet · 6 Desktop · 7 Large desktop (66 boards).
- Board sizes: phone 390×844 (Month 390×1820, Sign up 390×960, Settings 390×1040, Add 390×960, Stats 390×1180, Accounts 390×1100) · tablet 1194×834 · desktop 1440×900 · large 1920×1080.
