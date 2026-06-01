# SafetyScan — Design Spec (locked system)

AI-powered Queensland construction-site compliance tool, mobile. This spec describes the FINAL,
signed-off design: **Concrete neutral · single amber accent · Schibsted Grotesk · "Worklog Ticket"
structure · top hazard stripe**, in Light ("Paper") and Dark ("Ink") themes.

The HTML/React files in `reference/` are the source of truth for layout and exact values. This
document is the readable spec. Treat both as the design to recreate in the target stack — not code
to copy.

---

## 1. Design tokens

Implement as named theme tokens (CSS vars / Tailwind theme / RN theme object). Don't hardcode hex.

### Brand
| Token | Light | Dark | Use |
|---|---|---|---|
| `amber` | `#EE801A` | `#F58A22` | Logo, hero stat, FAB, active nav, primary CTA, section ticks |

Amber is the ONLY accent. No secondary accent colour (explored and rejected).

### Neutrals — Concrete (light)
| Token | Value | Use |
|---|---|---|
| `bg` | `#E2DED5` | App background (warm concrete) |
| `surface` | `#FAF8F2` | Cards, tickets, inputs, nav bar |
| `line` | `#1B1A12` | 1.5px borders, primary text |
| `divider` | `rgba(27,26,18,0.12)` | Internal hairlines |
| `text` | `#1B1A12` | Primary text |
| `muted` | `#6F6A5C` | Secondary text, labels, meta |

### Neutrals — Ink (dark)
| Token | Value | Use |
|---|---|---|
| `bg` | `#16150F` | App background |
| `surface` | `#221F19` | Cards, tickets, inputs, nav bar |
| `line` | `#100E09` | Borders (near-black) |
| `divider` | `rgba(241,239,230,0.10)` | Internal hairlines |
| `text` | `#F1EFE6` | Primary text |
| `muted` | `#948E80` | Secondary text, labels, meta |

### Status
| Token | Light | Dark | Use |
|---|---|---|---|
| `issue` (red) | `#D63A26` bar / `#C5341F` text | `#E8705C` text | Issues — edge bar, badge, high severity |
| `clear` (green) | `#3E8E5A` | `#67B083` | Clear / passed |
| `pending` | = amber | = amber | Pending / medium severity |

### Typography — Schibsted Grotesk (Google Fonts, weights 400/500/600/700)
| Style | Size / weight | Tracking | Use |
|---|---|---|---|
| Page title | 23px / 600 | -0.025em | Scan & site detail titles |
| Big number (stat) | 28px / 700 (strip) · big stat tabular | -0.02em | Stats strip figures |
| Score | 44px / 600 | -0.03em | Site compliance % |
| Wordmark | 20px / 600 | -0.02em | "SafetyScan" header ("Scan" in amber) |
| Ticket / row title | 15–15.5px / 600 | -0.02em | Activity & issue titles |
| Body | 13px / 500 | 0 | Analysis text, descriptions |
| Button | 13.5px / 600 | -0.01em | All buttons |
| Eyebrow / section label | 11–11.5px / 600 UPPER | +0.13–0.14em | "THIS MONTH", "RECENT ACTIVITY" |
| Meta / ticket meta | 10.5px / 600 UPPER | +0.08–0.1em | Site · date · time lines |
| Nav label | 9.5px / 500 UPPER | +0.1em | Bottom-nav tabs |
| Issue reg tag | 9.5px / 600 UPPER | +0.12em | "MUTCD PT 3 · §3.4" |

### Radius
| Token | Value | Use |
|---|---|---|
| card / ticket | 4–6px | Tickets, issue cards, analysis, score, list, carousel |
| control | 8px | Buttons, inputs, tabs, back/icon buttons, logo-area |
| toggle / pill | 999px | Switches, the round FAB plus-icon target |

### Borders & elevation
- Every card/ticket/input: **1.5px solid `line`**. This is the primary structural device.
- **No soft drop-shadows on content cards.** (Only the FAB carries a subtle amber-tinted shadow.)
- Coloured **left edge bar (5px)** on activity tickets and issue cards encodes status.

### Spacing
4px base scale. Screen body horizontal padding **18px**; card inner padding **14–16px**; section
header padding `22px / 2px / 11px`.

### Component sizes
| Component | Size |
|---|---|
| Hazard stripe | 7px tall, 45° repeating black/amber, 10px bands, full-bleed under status bar |
| Bottom nav | ~76px incl. safe area, 4-col, 1.5px top border, amber active + 22×3px top tick |
| FAB | 56–58px, amber, 18px-radius rounded square, plus glyph |
| Primary button | 46px (50px on auth), 8px radius, 1.5px border, amber fill / ghost surface |
| Input | 50px, 8px radius, 1.5px border |
| Logo mark | ~30px (40px auth), standalone, no tile |
| Ticket thumbnail | 46px, full-height left of body, 1.5px right border |
| Avatar | 54px, 10px radius, amber, dark initials |

---

## 2. Brand mark / logo

Radar-sweep mark, used standalone (no backing tile). Theme-dependent:

| File | Use |
|---|---|
| `assets/mark-duo-light.svg` | **Light mode.** Top sweep amber, bottom arcs near-black (`#1B1A12`). |
| `assets/mark-amber.svg` | **Dark mode.** All amber. |
| `assets/mark-ink.svg` | Ink mark — used inside the amber "Guide" banner icon (ink-on-amber). |
| `assets/mark-amber-on-ink.svg`, `mark-ink-on-amber.svg` | Pre-composited squares — splash / share image. |
| `assets/mark-animated.svg` | Reference for the loader motion (recreate natively, see §5). |

The same mark, rotating, is the **scan loader** (see Analysing screen).

---

## 3. Global chrome (every in-app screen)

1. **Status bar** — 44px, time left, signal/wifi/battery right, colour follows theme text.
2. **Hazard stripe** — directly beneath, full-bleed, 7px.
3. **Header** — three forms:
   - *Tabs:* standalone logo + "SafetyScan" wordmark (left), hamburger (right).
   - *Detail:* 38px back button (8px radius, bordered) + page title (left), share or menu (right).
   - *Modal:* page title (left), close ✕ (right).
4. **Bottom nav** — Home · Scans · Sites · Profile. Stroked 22px icons, amber active w/ short top
   tick. 1.5px top border on `surface`.
5. **FAB** — amber rounded-square (+), bottom-right above nav. On Home / Scans / Sites only.
   Launches the new-scan flow at Capture.

---

## 4. Screens (12)

All exist in `reference/` in both themes. Numbers/copy below are the reference content.

### Home / Dashboard  (`AHome`)
- Eyebrow "This month" + "View all →".
- **Stats strip:** 3-up bordered strip — `12 Scans · 3 Sites · 4 Issues` (Issues figure amber).
- **Guide banner:** amber-icon (ink mark) + "SafetyScan Guide" + arrow.
- Section "Recent activity" (amber tick + label + View all).
- **Activity tickets** (status edge bar · thumbnail · title · "Site · date · time" meta · status
  label): Scaffolding (3 issues), Excavator Ops (Pending), Scaffolding (2 issues), Traffic Mgmt
  (2 issues), PPE Spot Check (Clear). FAB + nav (Home active).

### Scans list  (`AScans`)
- Squared filter tabs: All (active) · Issues · Clear · Pending.
- Full activity-ticket list (8 rows incl. Pending + Clear + multi-issue). FAB + nav (Scans).

### Scan detail  (`AScanDetail`)
- Back + "Scan" + share. Page title "Traffic Management", meta "Newstead Plaza · 28 May · 5:29PM".
- **Photo carousel** (216px, striped placeholder, "1/4" counter, 4 dots).
- Summary row: red "2 issues found" + "AI · 94% confidence".
- **AI analysis** block (bordered, amber-highlighted key phrase).
- **Issues** — issue tickets (left severity bar high/med, title, description, reg tag, severity
  label).
- **Checklist** card — rows with amber check / red ✕ boxes; passed rows struck through.
- Actions: "Re-analyse" (ghost) + "Export PDF" (amber). No nav (detail view).

### New-scan flow
- **01 Capture (`ACapture`):** dark viewfinder, hazard stripe at top of frame, amber reticle frame
  + corner anchors, hint pill, close ✕ + "1/4" counter, bottom bar with gallery / 68px shutter /
  scene chips.
- **02 Analysing (`AProcessing`):** "Analysing" + close. Centred **radar loader** (amber sweep
  rotating 3.4s + pinging ring). Title "Reading your site" / sub "Cross-checking against QLD MUTCD
  & WHS regs". Step list: Photos uploaded ✓ 4/4 · Detecting hazards ✓ Done · Matching regulations
  ◌ Now (amber spinner) · Compiling report ☐ (dim).
- **03 Results (`AResults`):** red triangle-alert tile, "2 issues found", subline, two compact
  issue tickets (High/Med), "Save draft" (ghost) + "Open report" (amber) pinned bottom.

### Sites list  (`ASites`)
- Subhead "3 active sites · 19 scans this month" + "Sort ↕".
- **Site rows:** name + "City · N scans" meta, right-aligned compliance % (green ≥90 / amber 70–89
  / red <70), stacked green/amber/red compliance bar. FAB + nav (Sites).

### Site detail  (`ASiteDetail`)
- Back + "Site". Title "Newstead Plaza", sub address/tier/weeks.
- **Score card:** "Compliance" / "Last 30 days", big amber `78%`, legend (6 clear / 1 pending /
  1 issue), 30-bar histogram (one red, accent ambers).
- Section "Recent scans" → activity tickets. FAB + nav (Sites).

### Profile  (`AProfile`)
- Profile card: 54px amber avatar "EM", "Ellie Marsden", "Site Supervisor · QBCC 14821".
- "This month" stats strip (reuse Home strip).
- "Subscription": "Pro · Annual", renews date, green "Active" badge, "12/50 scans · 24%" + amber
  usage bar.
- "Settings" list: Appearance (System ›), Email notifications (toggle on), Privacy & data ›,
  Help & support ›, Log out (red). Nav (Profile). No FAB.

### Login / Sign up  (`ALogin`)
- Hazard stripe, logo + wordmark. Heading "Walk the site. / Catch the gap." + subline.
- Segmented toggle: Sign in (active) / Create account.
- Email + Password fields (uppercase labels), "Keep me signed in" check + "Forgot?".
- Amber "Sign in" (50px). "or" divider. Ghost "Continue with Google". Terms footer.

### Shared scan — public  (`AShared`)
- Logo + wordmark + "Shared report" tag. **No bottom nav.**
- Read-only banner (amber dot · "Read-only · shared 28 May by Ellie M.").
- Title + meta, carousel, summary row, "Summary" block, "Issues" tickets.
- Amber "Open in SafetyScan" + share URL line.

### Guide — onboarding  (`AGuide`)
- "Guide" + close. "Step 2 / 5" + progress dots (amber active pill).
- **Art panel:** radar mark over amber halo + two angled hazard "stickers" (red "Missing sign",
  amber "Cone gap 8m").
- Headline "The AI flags what doesn't match QLD code." + body re: regulation tagging.
- "Back" (ghost) + "Next" (amber) pinned bottom.

---

## 5. Interactions & motion

| Where | Motion |
|---|---|
| Radar loader arcs | rotate 360° / 3.4s linear infinite |
| Loader ping ring | scale 0.5→1.45, opacity 0.8→0 / 1.8s ease-out infinite |
| Step spinner | rotate / 0.85s linear infinite |
| Tab / nav change | colour + tick, ~180ms ease-out |
| Capture→Analysing→Results | crossfade ~240ms; results alert tile scales in ~280ms |

Navigation: Login → Home. Bottom nav swaps tabs. Row tap → detail. FAB → Capture → Analysing →
Results → Scan detail. Share → system sheet → Shared view. Log out → Login.

### States to add (not separately mocked)
Empty states (no scans/sites yet → muted zone + "Start a scan"), camera-permission prompt, network
error toast on analyse, loading skeletons for ticket rows, form validation on auth.

### Accessibility
Status conveyed by colour **and** text/label (never colour alone). Tap targets ≥44px. Uppercase
labels should carry title-case `aria-label`s.

---

## 6. Files in this bundle
```
design_handoff_v2/
├── CLAUDE_CODE_PROMPT.md   ← paste into Claude Code
├── DESIGN_SPEC.md          ← this file
├── reference/
│   ├── SafetyScan App.html ← open in browser; pan/zoom canvas of all 12 screens × L/D
│   ├── concepts.css        ← base tokens (k-st), phone frame, ticket structure
│   ├── app.css             ← component system (detail screens, forms, loader, etc.)
│   ├── app-chrome.jsx      ← header / nav / FAB / data / radar loader
│   ├── app-screens-1.jsx   ← Home, Scans, Scan detail
│   ├── app-screens-2.jsx   ← Capture, Analysing, Results, Sites, Site detail
│   ├── app-screens-3.jsx   ← Profile, Login, Shared, Guide
│   ├── app-canvas.jsx      ← canvas composition (presentation only)
│   ├── concept-chrome.jsx  ← shared status bar + nav glyphs
│   └── design-canvas.jsx   ← pan/zoom canvas component (presentation only)
└── assets/                 ← brand mark SVGs (see §2)
```
The `*-canvas` and `design-canvas` files are presentation scaffolding — ignore for the app build.
