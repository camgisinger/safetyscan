# Handoff: SafetyScan — Mobile app

## Overview

SafetyScan is an AI-powered Queensland construction-site compliance tool for mobile. A site supervisor takes photos of their site, the app cross-checks them against QLD MUTCD / WHS / AS regulations, and returns a structured compliance report — issues, severity, checklist, and a PDF the inspector can take away.

This handoff covers the full first-release surface area: 10 screens × 2 themes (light + dark), the bottom-nav shell, the new-scan flow, and the public shared-report view.

## About the design files

The files in this bundle (`SafetyScan.html`, the `.jsx` files, `styles.css`, and the SVG assets) are **design references created in HTML/React** — prototypes showing intended look, layout, and behaviour. **They are not production code to copy directly.**

The job is to **recreate these designs in the target codebase's existing environment** (React Native, SwiftUI, Flutter, native iOS/Android, or a responsive PWA — whatever the SafetyScan app is built in) using its established patterns, component library, and naming conventions. If no environment exists yet, pick the framework that best fits the team and platform target. Treat the HTML as a faithful spec, not a starting point.

## Fidelity

**High-fidelity.** Final colours, typography, spacing, radii, shadows, copy and iconography are all decided. The developer should recreate every screen pixel-faithfully using the codebase's libraries and patterns. Where the bundled HTML uses CSS tricks (e.g. background-repeat for placeholder thumbnails), use the platform-native equivalent (e.g. an `<Image>` with a placeholder, or an `Asset.image` slot).

---

## Design tokens

> **Implement these as named tokens** (CSS custom properties, Tailwind theme, Material `ColorScheme`, SwiftUI `Color` extensions — whatever the codebase uses). Do not hardcode hex values inline.

### Brand
| Token | Value | Use |
|---|---|---|
| `--amber` | `#F39410` | Primary accent, CTAs, FAB, active nav, charts |
| `--amber-soft` | `#FFB552` | Hover / pressed amber |
| `--amber-deep` | `#C7770B` | Pressed amber on dark |
| `--amber-glow` | `rgba(243, 148, 16, 0.35)` | FAB / amber-button shadow |

### Paper (light theme)
| Token | Value | Use |
|---|---|---|
| `--paper-bg` | `#F1E7D3` | App background |
| `--paper-card` | `#FBF4E4` | Primary surface (cards, activity rows, banner) |
| `--paper-card-2` | `#F7EFDC` | Secondary surface (analysis block, tabs track, inset rows) |
| `--paper-text` | `#1B1D22` | Primary text |
| `--paper-text-mut` | `#7A7263` | Secondary text, meta labels |
| `--paper-text-dim` | `#ADA293` | Inactive nav labels, placeholder text |
| `--paper-border` | `rgba(28, 25, 20, 0.08)` | 1px card outlines |
| `--paper-divider` | `rgba(28, 25, 20, 0.06)` | Internal dividers |

### Ink (dark theme)
| Token | Value | Use |
|---|---|---|
| `--ink-bg` | `#16181C` | App background |
| `--ink-card` | `#1E2025` | Primary surface |
| `--ink-card-2` | `#25272C` | Secondary surface |
| `--ink-text` | `#ECE7DD` | Primary text |
| `--ink-text-mut` | `#847B6D` | Secondary text, meta labels |
| `--ink-text-dim` | `#5A554C` | Inactive nav labels |
| `--ink-border` | `rgba(255, 250, 240, 0.07)` | 1px card outlines |
| `--ink-divider` | `rgba(255, 250, 240, 0.05)` | Internal dividers |

### Status
| Token | Value | Use |
|---|---|---|
| `--status-red` | `#E15A4E` | "Issues" badges, high-severity dot, error states |
| `--status-red-bg` | `rgba(225, 90, 78, 0.12)` | Issues badge background, error icon halo |
| `--status-green` | `#4FB07A` | "Clear" badges, completed checks |
| `--status-green-bg` | `rgba(79, 176, 122, 0.14)` | Clear badge background |
| `--status-amber-bg` | `rgba(243, 148, 16, 0.14)` | Pending badge background, guide hero halo |

### Typography

Two families:
- **Sans (UI):** Geist — fallback stack `'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- **Mono (labels / meta):** Geist Mono — fallback `'Geist Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace`

If Geist is unavailable in your platform, sub Helvetica Neue (UI) and JetBrains Mono (labels). Don't substitute Inter — the wordmark and small-caps labels are tuned to the slightly tighter Geist letterforms.

| Style | Family | Size | Weight | Tracking | Use |
|---|---|---|---|---|---|
| Display | Geist | 26px | 600 | -0.02em | Auth heading, results title, guide title |
| Page title | Geist | 24px | 600 | -0.02em | Scan detail / site detail page title |
| Stat number | Geist | 32px | 600 | -0.02em | Home stats (12 / 3 / 2) |
| Score | Geist | 44px | 600 | -0.02em | Site compliance % |
| Wordmark | Geist | 19px | 700 | -0.01em | "SafetyScan" header |
| Body | Geist | 14px | 500 | 0 | Card titles, list rows |
| Body small | Geist | 13–13.5px | 400–500 | 0 | Analysis block, descriptions |
| Button | Geist | 14px | 600 | -0.005em | Primary / ghost buttons |
| Meta (mono) | Geist Mono | 10.5px | 400 | +0.06em UPPER | Activity date/time, file paths |
| Label (mono) | Geist Mono | 10px | 500 | +0.22em UPPER | Section headers ("THIS MONTH", "RECENT ACTIVITY") |
| Nav (mono) | Geist Mono | 9.5px | 500 | +0.16em UPPER | Bottom nav labels |
| Tag (mono) | Geist Mono | 9.5px | 400 | +0.18em UPPER | Issue regulation tags ("MUTCD PT 3 · §3.4") |

### Radius scale
| Token | Value | Use |
|---|---|---|
| `--r-card` | `16px` | All cards, activity rows, banner, issue, site row |
| `--r-card-lg` | `20px` | Guide hero art |
| `--r-input` | `12px` | Text inputs |
| `--r-thumb` | `10px` | Photo thumbnails (44×44, image placeholders) |
| `--r-pill` | `999px` | Buttons, badges, tabs, FAB, segmented toggles |

### Spacing scale
Linear 4px-step scale. Use these token names in code.
| Token | Value |
|---|---|
| `--s-1` | 4px |
| `--s-2` | 8px |
| `--s-3` | 12px |
| `--s-4` | 16px |
| `--s-5` | 20px |
| `--s-6` | 24px |
| `--s-7` | 32px |
| `--s-8` | 40px |

**Edge insets (375-wide phone):**
- Screen body horizontal padding: **18px**
- Card horizontal padding: **16px**, vertical: **16px** (12–14 for compact rows)
- App-bar padding: `8px 20px 14px`
- Bottom nav: `10px 12px 22px` with a 76px footprint (incl. safe area)

### Shadows
| Token | Value | Use |
|---|---|---|
| Card (paper) | `0 1px 0 rgba(28,25,20,.08), 0 6px 14px -10px rgba(28,25,20,.18)` | All cards on paper |
| Card (ink) | `inset 0 0 0 1px rgba(255,250,240,.07)` | All cards on ink (border-only, no drop shadow) |
| FAB | `0 12px 28px -8px rgba(243,148,16,.35), 0 6px 16px -4px rgba(0,0,0,.25)` | Floating action button |
| Amber button | `0 6px 16px -8px rgba(243,148,16,.35)` | Primary CTA |

### Component sizes
| Component | Size |
|---|---|
| Bottom nav (total) | 76px tall, 4-col grid |
| FAB | 56px circle, positioned `right: 24px; bottom: 92px` (above nav) |
| Primary button | 44px tall, pill radius, 18px horiz padding |
| Input | 50px tall, 12px radius, 16px horiz padding |
| Avatar (profile) | 56px circle, amber fill, white initials 22/600 |
| Status badge | 26px pill, 8px horiz padding, 11px text, 6px coloured dot |
| Activity-row thumbnail | 44×44, 10px radius |
| Photo carousel | 220px tall, 16px radius |

---

## Theme model

- The app supports **System / Light / Dark** with system as default (Profile → Appearance row).
- Light theme is `theme-paper`, dark is `theme-ink`. All component styling switches via the theme class on the root.
- Status colours (`red`, `green`, `amber`) do **not** change between themes.
- The radar mark switches asset: ink mark on paper, amber mark on ink. See **Assets** below.

---

## Global chrome (every in-app screen)

### Status bar (iOS-style)
- 48px tall, 16px top padding, 28px horiz padding.
- Left: time `9:41`, weight 600, size 15.
- Right: signal bars (4×3px, 4/6/8/10px tall) + wifi glyph + battery glyph.
- Colour follows `--paper-text` / `--ink-text`.

### App header (`AppBar`)
Three forms — pick based on screen:

| Variant | Left | Right |
|---|---|---|
| Main tabs (Home, Scans, Sites, Profile) | Radar logo (28px circle, card-coloured background, 1px border) + "Safety**Scan**" wordmark (Scan in amber) | Hamburger icon (3 × 1.6px bars, 4px gap) |
| Detail (Scan, Site) | Back button (36px square card, chevron left) + page name | Share icon OR menu |
| Modal (Analysing, Guide) | Title (no logo) | Close × |

### Bottom tab bar
- 4 tabs: **Home · Scans · Sites · Profile** (mono caps, 9.5px, +0.16em tracking).
- Icons stroked 1.5px, 22×22.
- Active state: amber colour + 22×2.5px amber underline pinned to the top of the item (NOT under the label).
- The bar has a subtle gradient mask (20px tall) above it so scrolling content fades out into the bar — implement as a top-aligned gradient from transparent to `var(--bg)`.

### Floating action button
- Amber filled circle, white `+` glyph, 22px stroke 2.2.
- Lives on Home, Scans, Sites (NOT Scan detail, Site detail, Profile, Auth, Shared, Guide).
- Tapping opens the new-scan flow at the **Capture** state.

---

## Screens

Each screen is documented below in the form a developer can build directly. All screens are 375pt wide; height is device-dependent. **Numbers in parentheses are token names** — substitute in code.

### 1. Home / Dashboard
**Purpose:** At-a-glance summary + recent activity feed. Default landing.

**Layout (top → bottom):**
1. Status bar
2. AppBar (logo + wordmark + hamburger)
3. **Stats card** (`--paper-card` / `--ink-card`, 16px radius, 16px padding) containing:
   - Row: section label "THIS MONTH" (mono caps) + "View all →" action (amber)
   - 3-column grid (`--s-3` gap) of stats:
     - `12` / SCANS
     - `3` / SITES
     - `2` / ISSUES *(amber number)*
   - Stat numbers are 32/600/-2%, labels are mono caps 10px / +0.22em.
4. **Guide banner** (12px top margin from stats): pill-radius card with circular amber icon (28px, ink-on-amber mark inside), title "SafetyScan Guide", trailing arrow `→`.
5. **Section header:** "RECENT ACTIVITY" + "View all →".
6. **Activity feed** — vertical list, 8px gap between rows. Each row:
   - Card surface, 14px H × 12px V padding.
   - 44×44 thumbnail (rounded 10px).
   - Title (14.5/600).
   - Meta line: site name + " · " + date · time, all uppercase, mono 10.5/+6%.
   - Trailing status badge (red dot "2 issues" / green dot "Clear").

**Copy used:**
- "Traffic Management" / "27 MAY · 2:14PM" / red "2 issues"
- "Westgate Site B" / "27 MAY · 9:02AM" / green "Clear"
- "Scaffold Inspection" / "26 MAY · 4:48PM" / green "Clear"

**FAB** + **Bottom nav** (Home active).

### 2. Scans list
**Purpose:** Full chronological list with status filters.

**Layout:**
1. Status bar, AppBar (title "Scans", hamburger).
2. **Segmented filter** (pill track, 4 segments, amber-filled active):
   - All · Issues · Clear · Pending
3. List of activity rows (same component as Home), 8px gap. 7 sample rows including a "Pending" amber badge ("Edge Protection / 25 MAY · 8:05AM").

FAB + Bottom nav (Scans active).

### 3. Scan detail
**Purpose:** Full AI report for one scan.

**Layout:**
1. Status bar.
2. AppBar with **back chevron** on the left + title "Scan", **share icon** (three-circle network glyph) on the right.
3. **Page title** "Traffic Management" (24/600/-2%).
4. **Meta line** (mono caps): `NEWSTEAD PLAZA · 27 MAY · 2:14PM`
5. **Photo carousel** (220px tall, 16px radius, striped placeholder when no photo):
   - Top-right counter pill `1 / 4` (black 50% bg, mono 10/+8%).
   - Bottom-centre 4 pagination dots (6×6, white 50% opacity, active dot 18×6).
6. **Result row:** red "2 issues found" badge (left), mono caps "AI · 94% CONFIDENCE" (right, 60% opacity).
7. **Section: AI Analysis** — `--card-2` surface, 13.2/400, line-height 1.55. Plain-language summary.
8. **Section: Issues** — vertical list, 8px gap. Each issue card (16px radius, 14px padding):
   - 8px coloured dot (red high / amber med / grey low) top-left.
   - Title 13.5/600.
   - Description 12.5/400, line 1.45, muted.
   - Regulation tag pill (mono 9.5/+18%, secondary surface).
9. **Section: Checklist** — single card containing 5 check rows:
   - 20×20 box. Done = amber filled with white tick (`-45deg` rotated check). Fail = red filled with white ×. Empty = border only.
   - Done rows get line-through + 55% opacity.
   - Rows separated by 1px divider.
10. **Action row** (20px top margin): 8px gap, two pill buttons side-by-side, both `--block`:
    - **Re-analyse** (ghost, refresh glyph)
    - **Export PDF** (amber, download glyph)
11. *(Optional `Share` button is the icon in the app bar — no inline button required.)*

No FAB, no bottom nav on this screen — it's a detail view; back button returns to whatever pushed it.

### 4. New-scan flow

Three sequential screens, all triggered by the FAB.

#### 4a. Capture (always dark — viewfinder UX)
- Full-bleed near-black (`#0A0B0D`) viewfinder.
- Centred orange reticle: 1.5px amber rectangle with rule-of-thirds grid lines at 35% opacity + 22×22 amber L-shaped corner anchors at the 8% inset.
- Top centre: hint pill "Frame the work area · keep steady" (black 55%, 12px text, 999 radius).
- Top left: close × (36×36, black 55% bg, 12px radius).
- Top right: counter pill "1 / 4" (amber, mono caps).
- Bottom toolbar (`#0A0B0D`, 18/24/30 padding):
  - Left chip: gallery icon (44×44, white 10% bg, 12px radius).
  - Centre: shutter — 68px white circle with an inset 4px ring (`box-shadow: inset 0 0 0 4px #0A0B0D, 0 0 0 3px #fff`).
  - Right chip: flash/scene icon.

#### 4b. Analysing (themed)
- Status bar + AppBar ("Analysing", close ×).
- Centred **radar loader** (160×160) using `assets/mark-amber.svg` (on ink) or `assets/mark-ink.svg` (on paper):
  - Arc group rotates `360deg / 3.6s linear infinite`.
  - Central 10px dot is static.
  - 60px concentric ring scales `0.5 → 1.4` with opacity `0.8 → 0` over 1.8s — repeated "ping".
- Title "Reading your site" (22/600/-1%), 28px top margin.
- Subtitle "Cross-checking against QLD MUTCD & WHS regs" (13/65%).
- **Step list** (4 cards, secondary surface, 12px gap from subtitle, full-width inside body):
  - ✓ Photos uploaded · 4 / 4
  - ✓ Detecting hazards · DONE
  - ◌ Matching regulations · NOW (amber spinner: 20×20, 2px amber ring, transparent top, 0.9s linear spin)
  - ☐ Compiling report (50% opacity, empty box)

#### 4c. Results reveal (themed)
- AppBar back + title "Result", share icon.
- **Hero icon:** 96px circle, `--status-red-bg` fill, centred red triangle-exclamation glyph.
- Title "2 issues found" (26/600/-2%), centred.
- Subtitle (max 280px wide, centred, 70% opacity): "Two compliance gaps detected in Traffic Management. Review and resolve before the next walk."
- 24px top margin → list of 2 issue chips (`--card-2` surface):
  - Severity dot · title (13.5/500) · right-aligned mono caps "HIGH" / "MED"
- 24px → action row: **Save draft** (ghost) + **Open report** (amber). Tapping "Open report" pushes the Scan detail (Screen 3).

### 5. Sites list
**Purpose:** Per-site compliance overview.

**Layout:**
1. Status bar, AppBar (title "Sites", hamburger).
2. Subhead row: "4 active sites · 21 scans this month" (left, 13/muted), "Sort ↕" link (right, amber).
3. List of **site rows** (16px radius card, 14×16 padding, 8px gap):
   - Top: site name (14.5/600) + subtitle (mono caps "BRISBANE · 8 SCANS THIS MONTH").
   - Right of name: large compliance % (22/600/-2%, amber if 70–89, red if <70, default if 90+) over mono caps "COMPLIANCE" label.
   - Bottom: 8px-tall stacked horizontal bar (`--r-pill`, secondary-surface track), filled with green/amber/red segments summing to 100%.

Sample data:
- Newstead Plaza · 78% (60g / 18a / 22r)
- Westgate Stage 2 · 96% (92g / 4a / 4r)
- Kelvin Grove Lots · 64% RED (50g / 18a / 32r)
- Northgate Depot · 100%

FAB + Bottom nav (Sites active).

### 6. Site detail
**Purpose:** Drill-down for one site.

**Layout:**
1. Status bar, AppBar back + "Site" + menu.
2. **Page title** "Newstead Plaza" + subtitle "12 Skyring Tce, Brisbane QLD · Tier 2 build · 38 weeks remaining".
3. **Compliance card** (primary surface):
   - Row: "COMPLIANCE" (mono caps) · "LAST 30 DAYS" (right, mono caps).
   - Big score: `78%` (44/600/-2%, amber) over mono label "Site score".
   - Right column: three dot-prefixed rows: 6 clear · 1 pending · 1 issue (12px text, dots match status colours).
   - **Histogram:** 30 vertical bars, height 18–42px, 2px radius, ~3px gap. Default colour is `#D8C9AD` (paper) / `#3A3D44` (ink). One bar amber (index 3 in each 7-block), one bar red at index 22. This represents daily score deltas.
4. Section "RECENT SCANS" → 5 activity rows (same component as Home/Scans list).

FAB + Bottom nav (Sites active).

### 7. Profile
**Purpose:** Account + subscription + settings.

**Layout:**
1. Status bar, AppBar "Profile" + hamburger.
2. **Profile card** (card surface, 18px padding, row layout, 16px gap):
   - 56px amber avatar with white initials "EM" (22/600).
   - Name "Ellie Marsden" (16/600).
   - Mono caps subtitle "SITE SUPERVISOR · QBCC 14821".
3. Section "THIS MONTH" — same stats card from Home (12 / 3 / 2 with amber issues).
4. Section "SUBSCRIPTION" + "Manage" action:
   - Card. Left: "Pro · Annual" (15/600) + mono caps "Renews 14 Aug 2026".
   - Right: green "Active" badge.
   - Below: usage row "12 / 50 SCANS" — "24%" (mono caps), then 8px pill bar with amber fill at 24%.
5. Section "SETTINGS" — single card holding 5 rows separated by 1px dividers:
   - 32×32 icon chip (10px radius, secondary surface) + title + optional hint/toggle + chevron `›`.
   - Rows: Appearance · "SYSTEM" › / Email notifications · toggle ON / Privacy › / Help & support › / Log out (red label, red-tinted icon chip, no chevron — destructive).

Bottom nav (Profile active). No FAB.

### 8. Login / Sign up
**Purpose:** Auth entry. Single screen that toggles between sign-in and create-account.

**Layout:**
1. Status bar.
2. 40px top padding, 26px horiz padding.
3. Brand row: 44×44 rounded-square (14px radius) holding the radar mark + "Safety**Scan**" wordmark (24/700).
4. Heading "Walk the site.\nCatch the gap." (26/600/-2%, 1.15 line-height, two lines).
5. Sub "QLD construction compliance in your pocket." (muted).
6. **Segmented toggle** (4px-padded pill track, full-width, two segments):
   - Sign in (active = amber) · Create account
7. Labelled fields (mono caps label 10px / +0.22em):
   - **Email** — `you@company.com.au` placeholder
   - **Password** — secret with visibility toggle (not shown but expected)
8. Row: "Keep me signed in" (16×16 amber-filled check) on left · "Forgot?" amber link on right.
9. **Primary CTA:** 50px tall amber pill button "Sign in" (full width).
10. "OR" divider (mono caps centred, 1px lines either side).
11. **Continue with Google** — 50px ghost pill with multi-colour Google glyph.
12. Footer micro-text: "By signing in you agree to our Terms · Privacy" (11.5/55%, centred).

### 9. Shared scan (public view)
**Purpose:** Read-only report rendered for someone opening a share link. **No bottom nav, no FAB.**

**Layout:**
1. Status bar.
2. AppBar with logo + wordmark on the left, mono caps "SHARED REPORT" on the right.
3. **Banner** (secondary surface, 10×14 padding, 16px radius): amber 6px dot + "Read-only · shared 27 May by Ellie M."
4. Page title "Traffic Management" + subtitle "Newstead Plaza · 27 May 2026, 2:14 PM".
5. Same photo carousel as Scan detail.
6. Same result row (issues badge + AI confidence).
7. Section "SUMMARY" — secondary-surface block, same content as Scan detail's AI Analysis.
8. Section "ISSUES" — same issue list as Scan detail.
9. CTA: amber pill "Open in SafetyScan" (deep links into the app, prompts install if not present).
10. Tiny mono caps footer: `safetyscan.app/r/8K2J-VQ4M` (the share URL).

### 10. Guide (onboarding / help carousel)
**Purpose:** 5-step explainer. Reachable from the Home banner or first launch.

**Layout (showing step 2 of 5):**
1. Status bar.
2. AppBar "Guide" + close ×.
3. **Header row:** mono caps "STEP 2 / 5" left · 5 progress dots right (active dot is amber 22×8 pill, inactive are 8×8 muted dots at 45% opacity).
4. **Hero art** — 280px-tall surface card (20px radius):
   - Centred 180px radar mark over an amber-tinted halo circle.
   - Two angled "sticker" pills overlapping the mark:
     - Top-right: red "Missing sign" pill, rotated +8°.
     - Bottom-left: amber "Cone gap 8m" pill, rotated -6°.
   - Both have 6×16 box-shadow.
5. **Headline:** "The AI flags what doesn't match QLD code." (26/600/-2%, 1.18 line-height).
6. **Body:** "Each issue is tagged with its source — MUTCD, AS 4576, WHS Reg — so your write-up is ready for the inspector." (13.5/1.5, muted).
7. **Footer action row** (pushed to bottom of screen): 12px gap, "Back" ghost button (90px wide) + "Next" amber button (flex 1).

The other 4 guide steps follow the same template; suggested copy:
- 01 · "Snap the site, head to toe." — uses capture-frame art.
- 02 · *(shown above)* — AI flagging.
- 03 · "Every issue, with its regulation." — issue-list art with regulation tags called out.
- 04 · "Track sites, week over week." — site bar chart art.
- 05 · "Share the report. PDF or link." — devices fanned out.

---

## Interactions & behaviour

### Navigation graph
```
[Auth] → [Home]
  Home tab     ⇄ Scans tab ⇄ Sites tab ⇄ Profile tab    (bottom nav)
  Home banner  → Guide (modal)
  Home/Scans row tap → Scan detail
  Sites row tap → Site detail
  Site detail row tap → Scan detail
  FAB → Capture → Processing → Results → Scan detail
  Scan detail share → share sheet (system) → opens Shared scan URL
  Profile · Log out → Auth
```

### Animations / transitions
| Where | Property | Duration | Easing |
|---|---|---|---|
| Radar loader arc | `rotate(360deg)` | 3.6s | linear, infinite |
| Radar loader ping ring | scale 0.5→1.4 + opacity 0.8→0 | 1.8s | ease-out, infinite |
| Step-list spinner | rotate | 0.9s | linear, infinite |
| Tab change (bottom nav) | colour + underline slide | 180ms | ease-out |
| Push transitions (detail screens) | platform default | — | — |
| Capture → Processing | crossfade | 240ms | ease-in-out |
| Processing → Results | scale-in of hero icon | 280ms | ease-out cubic |

### States to implement (not pictured)
- **Empty states** for Home / Scans / Sites when the user has no data yet — same layout, replace lists with a muted illustration zone + one-line tip + amber "Start a scan" CTA.
- **Network error** on Capture → "Couldn't reach the AI. Retry" toast (red dot, dark pill).
- **Camera permission denied** → permission-explainer modal with link to Settings.
- **Long content** — body scrolls under the gradient mask of the bottom nav.
- **Loading skeletons** — for activity rows, use shimmer placeholders at the same 44×44 / two-line layout. Use surface-2 colour + 8% lightness shift.

### Form validation (auth)
- Email — RFC-ish, show inline mono-caps error "INVALID EMAIL" in red under the field.
- Password — min 8 chars on Create account, no live check on Sign in.
- Submit disables (50% opacity, no shadow) while pending; shows the same amber spinner from the step list inline with the button label.

### Accessibility
- All status badges include **both colour and text** (not colour alone).
- Bottom-nav active state uses **colour + underline** so screen-reader and colour-blind users get the cue.
- Tap targets are ≥44px (nav items, FAB, badges remain interactive only inside their row).
- Mono-caps labels should keep `aria-label`s in title-case so VoiceOver doesn't spell them out.

---

## State model (suggested)

```ts
// Auth
type AuthState = 'signed-out' | 'signing-in' | 'signed-in'

// Scan
type ScanStatus = 'pending' | 'issues' | 'clear'
type IssueSeverity = 'high' | 'med' | 'low'

interface Scan {
  id: string
  siteId: string
  title: string                  // "Traffic Management"
  capturedAt: ISODateString
  photos: PhotoRef[]             // 1..N
  aiSummary: string
  confidence: number             // 0–1
  issues: Issue[]
  checklist: ChecklistItem[]
  status: ScanStatus
}

interface Issue {
  id: string
  severity: IssueSeverity
  title: string
  description: string
  regulation: string             // e.g. "MUTCD PT 3 · §3.4"
}

interface ChecklistItem {
  id: string
  label: string
  state: 'done' | 'fail' | 'open'
}

interface Site {
  id: string
  name: string
  address: string
  city: string
  tier: string
  weeksRemaining: number
  monthlyScans: number
  complianceScore: number        // 0–100
  breakdown: { clear: number; pending: number; issues: number }   // sums to 100
}

// New-scan flow
type ScanFlowStage = 'capture' | 'processing' | 'results'
```

The Analysing screen's step list is driven by 4 phases the backend reports in order; UI auto-advances each card.

---

## Assets

All assets are in `assets/` and are **SVG**, so they scale. They use only two colours (amber `#F39410` and ink `#16181C`) so the mark works at any size.

| File | Use |
|---|---|
| `mark-amber.svg` | Radar mark in amber on transparent — for use on ink (dark) surfaces |
| `mark-ink.svg` | Radar mark in ink on transparent — for use on paper (light) surfaces |
| `mark-amber-on-ink.svg` | Pre-composited amber on ink square — splash / share-image |
| `mark-ink-on-amber.svg` | Pre-composited ink on amber square — banner icon, guide art |
| `mark-animated.svg` | Same mark with an inline animation (arcs rotate, dot pings) — reference for native motion |

**Re-create the loader animation natively** rather than embedding the animated SVG — most native runtimes (React Native, Android) handle SVG animation inconsistently. The motion spec is in the Animations table above.

**Imagery placeholders:** the diagonal-stripe thumbnails in the HTML are stand-ins. In production, every scan has 1..N user photos; show the first photo as the row thumb, and the full set in the carousel. For the photo zones in the Guide hero art, the design uses the radar mark as the focal element — no real photo needed.

---

## Files in this bundle

The HTML reference implementation is included for visual fidelity checks. Treat it as a spec, not a starting point.

```
design_handoff_safetyscan/
├── README.md                ← you are here
├── SafetyScan.html          ← entry point; open this in a browser
├── styles.css               ← all tokens & component styles (canonical reference)
├── chrome.jsx               ← StatusBar, AppBar, BottomNav, FAB, Phone frame
├── screens-1.jsx            ← Home, Scans list, Scan detail, Capture, Processing, Results
├── screens-2.jsx            ← Sites list, Site detail, Profile, Auth, Shared, Guide
├── tokens.jsx               ← Visual token panel (also rendered in the canvas)
├── app.jsx                  ← Composes everything onto a pan/zoom design canvas
├── design-canvas.jsx        ← Pan/zoom canvas (presentation only — not part of the app)
└── assets/
    ├── mark-amber.svg
    ├── mark-ink.svg
    ├── mark-amber-on-ink.svg
    ├── mark-ink-on-amber.svg
    └── mark-animated.svg
```

To preview the source mockups, open `SafetyScan.html` in any modern browser. Pan with click-drag, zoom with scroll, double-click any phone to enter focus mode.

---

## Build order (suggested)

If starting from a fresh codebase, this order keeps you unblocked:

1. **Tokens** — port every value in the Design Tokens section into your theme system.
2. **Chrome** — StatusBar (or rely on system), AppBar (3 variants), BottomNav, FAB.
3. **Primitive components** — Card, Badge (3 variants), Button (amber / ghost, primary / sm / block), Input + Label, Checkbox, Toggle, SegmentedTabs, Avatar.
4. **Compound components** — ActivityRow, IssueCard, ChecklistRow, SiteRow, ListRow.
5. **Screens** — Home → Scans list → Scan detail → Sites list → Site detail → Profile → Auth → Shared → Guide.
6. **New-scan flow last** — it depends on camera/permissions + the analyse API; design is already complete.

Good luck. Anything ambiguous, fall back to the `styles.css` numeric values — they are canon.
