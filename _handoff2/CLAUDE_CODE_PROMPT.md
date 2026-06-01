# SafetyScan — Claude Code build prompt

> Paste everything between the lines below into Claude Code, with this folder attached
> (or run Claude Code from inside this folder). Replace the one bracketed line with your
> actual stack.

---

You are implementing the **SafetyScan** mobile app — an AI-powered Queensland construction-site
compliance tool. This folder contains a complete, signed-off high-fidelity design: an HTML/React
reference (`reference/SafetyScan App.html` + its `.jsx`/`.css` files), the brand assets
(`assets/`), and a full spec (`DESIGN_SPEC.md`). The design is FINAL — do not redesign it.

**My stack:** [e.g. "React Native + Expo, TypeScript, Zustand for state" — replace this line.]

Your job: rebuild these screens natively in my stack, pixel-faithful to the reference, using my
project's existing conventions and component patterns. The HTML is a spec, not source to copy.

Read in this order:
1. `DESIGN_SPEC.md` — the canonical spec: design tokens, every screen, components, interactions.
2. `reference/SafetyScan App.html` — open in a browser to see the real thing (pan/zoom canvas,
   12 screens × light+dark). The `.jsx` files show exact markup/structure; `app.css` +
   `concepts.css` hold the canonical numeric values.
3. `assets/` — the SVG brand mark in its variants.

Hard requirements (the locked visual system):
- **Type:** Schibsted Grotesk (Google Fonts). Numbers tabular where shown.
- **Palette:** warm "Concrete" neutral foundation, single **amber** accent (#EE801A light /
  #F58A22 dark). Status: red issues, green clear, amber pending. Full token table in the spec.
- **Structure — "Worklog Ticket":** squared cards (~4–8px radius), 1.5px solid borders, a coloured
  LEFT edge bar on every activity/issue row signalling status, single clean status label on the
  right. No soft drop-shadows on cards — borders do the work.
- **Signature:** a diagonal black+amber **hazard stripe** (45°, ~10px bands) sits directly under
  the status bar on every in-app screen, the camera viewfinder, login and shared views.
- **Logo:** standalone radar mark, no backing tile. **Light mode uses the two-tone mark**
  (`mark-duo-light.svg` — amber top sweep, near-black bottom arcs); **dark mode uses the all-amber
  mark** (`mark-amber.svg`).
- **Two themes:** Light ("Paper"/Concrete) and Dark ("Ink"), driven by a single theme switch.
- Bottom nav: 4 tabs (Home · Scans · Sites · Profile), amber active state. Amber FAB (+) on the
  three list tabs only; it launches the new-scan flow.

Build order: tokens/theme → shared chrome (status bar, header w/ back+actions, hazard stripe, nav,
FAB) → primitives (ticket row, issue ticket, button, input, badge, toggle, checklist) → the 12
screens → the new-scan flow (camera, radar loader, results) last.

Deliver working, navigable screens wired to mock data matching the reference, in both themes.
Flag anything in the spec that's ambiguous instead of guessing.

---
