---
name: Grid Builder
description: A grid-block page builder with AI-assisted content and one-click publish to a Vegvisr subdomain.
colors:
  bg1: "#BAA799"
  bg2: "#A89485"
  text: "#202322"
  muted: "#572210"
  accent: "#A37138"
  accent2: "#7D6E4E"
  primary: "#202322"
  card-bg: "rgba(255, 255, 255, 0.35)"
  card-border: "rgba(32, 35, 34, 0.18)"
  soft: "#572210"
  modal-surface: "#0f172a"
  modal-border: "#334155"
  modal-danger: "#f59e0b"
  modal-confirm: "#2563eb"
  brass: "#a28f39"
  copper-green: "#7fb3a0"
  titanium-blue: "#a8d5e2"
  linen: "#d9d0af"
  deep-olive: "#2d2b16"
typography:
  display:
    fontFamily: "Playfair Display, The Seasons, Georgia, serif"
  body:
    fontFamily: "HK Grotesk, Plus Jakarta Sans, system-ui, sans-serif"
  script:
    fontFamily: "Caveat, Dancing Script, Sacramento, cursive"
  mono:
    fontFamily: "Fira Code, monospace"
rounded:
  sm: "4px"
  md: "8px"
  card: "12px"
  modal: "16px"
spacing:
  sm: "8px"
  md: "16px"
components:
  theme-card:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "18px"
  button-confirm:
    backgroundColor: "{colors.modal-confirm}"
    textColor: "#ffffff"
    rounded: "{rounded.card}"
    padding: "8px 16px"
---

# Design System: Grid Builder

## Overview

**Creative North Star: "The Warm Ledger"**

Grid Builder's editor chrome reads as a warm, tactile workspace for assembling pages by hand — earthy stone and taupe neutrals (`--bg1`/`--bg2`), a serif display face for headings, and translucent glass-card surfaces that soften into the canvas rather than sitting on top of it. The whole app shell — sidebar, canvas, tiles — inherits the currently active theme's CSS custom properties directly, so the editor's own mood shifts with whatever page theme the user has selected; it never asserts a fixed brand look over the user's content.

A second, fixed register exists for system-level chrome that must read consistently regardless of the active page theme: modals (confirm, export, publish) are hardcoded to a dark slate palette independent of theme variables, so destructive/critical actions stay legible and serious no matter how loud or pale the active page theme is.

**Key Characteristics:**
- Theme-variable-driven canvas chrome (sidebar, navbar, tiles) that follows the user's selected page theme.
- A separate, theme-independent dark-slate register for modals and system dialogs.
- Serif display type for headings, humanist sans for body and UI text, script accents for decorative overlays only.
- Glass-card surfaces (translucent background, blur, soft shadow) as the default depth cue; hover states brighten border color to `--accent` rather than deepening shadow.
- Quiet, utilitarian component feel: small type, muted decoration, chrome recedes so the user's own page content stays the visual focus.

## Colors

The palette is intentionally runtime-swappable: every theme in `THEMES` (`src/data/themes.ts`) redefines the same variable set, so "the palette" below documents the default/fallback values in `src/index.css`, not a fixed brand color.

### Primary
- **Espresso Ink** (`--primary` / `--text`, #202322): default body text and heading color; swaps per active theme.

### Secondary
- **Warm Stone** (`--bg1`, #BAA799) / **Deeper Stone** (`--bg2`, #A89485): canvas background pair, used for body background and subtle section separation.

### Tertiary
- **Weathered Copper** (`--accent`, #A37138): interactive accent — links, hover borders, active icon color, focus emphasis. Used sparingly; its rarity against the neutral canvas is the point.
- **Muted Olive** (`--accent2`, #7D6E4E): secondary accent for less prominent emphasis (e.g. quote borders alongside accent).

### Neutral
- **Card Glass** (`--card-bg`, rgba(255,255,255,0.35)): translucent surface for tiles and cards over the canvas background.
- **Card Hairline** (`--card-border`, rgba(32,35,34,0.18)): default card border, brightens to accent on hover.
- **Burnt Soft** (`--soft` / `--muted`, #572210): blockquote and secondary-text color.

### Named Rules
**The Theme-Follows-Content Rule.** The editor chrome is not a fixed brand skin — it reads its own colors from the same CSS custom properties the user's published page uses. Never hardcode a chrome color that should track the active theme; reference the variable instead.

**The Dark-Slate Escape Hatch Rule.** Modals and confirm dialogs (`ConfirmModal`, `ExportModal`, `PublishModal`) are the one place that opts out of theme-variable coloring, using a fixed `slate-900`/`slate-950` surface with `blue-600` (confirm) and `amber-500` (warning) accents — so a destructive action reads the same regardless of how extreme the active page theme is.

## Typography

**Display Font:** Playfair Display (with 'The Seasons', Georgia, serif fallback)
**Body Font:** HK Grotesk (with Plus Jakarta Sans, system-ui, sans-serif fallback)
**Script/Accent Font:** Caveat (with Dancing Script, Sacramento, cursive fallback) — decorative overlay use only (`.script-embellish`, `.script-overlay`), never body copy.

**Character:** A restrained editorial serif for headings paired with a humanist grotesque body — confident but not loud, with the script face reserved for a single handwritten flourish per surface at most.

### Hierarchy
- **H1** (700, 2rem, 1.25 line-height): top-level content headings inside themed markdown (`.themed-content h1`).
- **H2** (700, 1.6rem): section headings.
- **H3** (700, 1.3rem) / **H4** (700, 1.125rem): sub-section headings.
- **Body** (400, 1rem, 1.6 line-height): default reading text via `.themed-content`.
- **Label** (700, ~0.625rem/10px, uppercase, wide tracking): sidebar section headers (`text-[10px] font-bold uppercase tracking-widest`).

### Named Rules
**The Script-Is-Garnish Rule.** The script font never carries structural hierarchy or body copy — it only decorates an inline emphasis or a superimposed overlay.

## Layout

Editor shell is a fixed two-rail layout: a 3.5rem sticky top navbar, a collapsible left sidebar (48px collapsed / 288px expanded, `sticky top-14`, full remaining viewport height), and a scrollable canvas. Content sections use generous vertical rhythm (`space-y-6`) with tighter internal grouping (`gap-2`–`gap-2.5`). Responsive behavior favors hiding secondary labels (`hidden sm:inline`) over reflowing structure at narrow widths.

## Elevation & Depth

Layered glass: surfaces are translucent (`--card-bg` at partial opacity) with `backdrop-filter: blur(8px)` and a soft ambient shadow at rest (`0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 6px -1px rgba(0,0,0,0.03)`). Hover deepens the shadow slightly and shifts the border to `--accent` rather than adding a heavier lift — depth communicates presence, not action; accent-border shift communicates interactivity.

### Shadow Vocabulary
- **Ambient rest** (`0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 6px -1px rgba(0,0,0,0.03)`): default tile/card shadow.
- **Ambient hover** (`0 8px 30px -4px rgba(0,0,0,0.08)`): tile hover state.
- **Modal shadow** (`shadow-2xl`, Tailwind default): fixed-palette modals, independent of the theme's own elevation values.

### Named Rules
**The Border-Before-Shadow Rule.** Interactive state on cards is communicated primarily by border color shifting to `--accent`, with shadow deepening as a secondary, subtler cue — never the reverse.

## Shapes

Rounded-first form language: default `--radius` is 12px for cards/tiles (themable per active theme, ranging 8px–20px across `THEMES`), 16px (`rounded-2xl`) for modals, small (`rounded`/`rounded-md`) for compact controls like sidebar icon buttons. Borders are 1px hairlines by default; modals and confirm dialogs use a slightly heavier definition (`border-slate-700/80`) since they sit outside the theme-variable system.

## Components

### Buttons
- **Shape:** `rounded-xl` (theme surfaces) or `rounded` (compact sidebar/navbar controls).
- **Primary (theme surface):** background `--accent`, white text, used for save/confirm actions on the canvas (e.g. save-graph button in Navbar).
- **Primary (modal, fixed palette):** `bg-blue-600 hover:bg-blue-500`, white text, `shadow-lg shadow-blue-600/20` — confirm actions inside dialogs.
- **Destructive/secondary (modal):** `bg-slate-800 hover:bg-slate-700` with `slate-300` text for cancel; `bg-slate-700 hover:bg-slate-600` for a secondary non-destructive action.
- **Hover / Focus:** color and background transition (`transition-colors` / `transition-all`), no scale change on buttons (reserved for cards).

### Cards / Containers (`theme-card`, `themed-tile`)
- **Corner Style:** `var(--radius)`, themable.
- **Background:** `var(--card-bg)`, translucent.
- **Shadow Strategy:** see Elevation & Depth; ambient rest → ambient hover.
- **Border:** 1px `var(--card-border)`, shifts to `var(--accent)` on hover.
- **Internal Padding:** 18px (`theme-card`).
- **Variants:** accent / accent2 / primary / soft / muted fills or tints via `color-mix()` against `--card-bg`; plus `gradient`, `glass`, `outline`, and brand-specific tints (`brass`, `copper-green`, `titanium-blue`, `linen`, `deep-olive`) for the Lydmorah Ochre theme family.
- **Hover behavior variants:** `hover-lift` (translateY -4px), `hover-scale` (scale 1.02), `hover-glow` (accent-colored glow), `animate-pulse-subtle` (looping border/shadow pulse) — opt-in per instance, not default.

### Inputs / Fields (modal register)
- **Style:** `bg-slate-950/80`, `border-slate-700`, `rounded-xl`, `text-slate-100`.
- **Focus:** `focus:ring-2 focus:ring-blue-500/60`, no border color change.

### Navigation (Navbar)
- **Style:** sticky, `backdrop-blur-md`, bottom hairline border, background/text following the active theme.
- **Live-graph status pill:** dedicated emerald accent (`emerald-500/10` background, `emerald-700`/`emerald-300` text) independent of the page theme — signals a functional/system state (saved graph, live connection), not decorative branding.
- **Mode switch (Editor/Graph/Preview):** segmented control, active state gets a filled background; inactive states stay text-only.

### Sidebar
- **Style:** theme-following background/border/text; collapsed rail shows icon-only controls at `--accent` color; expanded panel groups tools under uppercase 10px tracked-wide labels at 75% opacity.

## Do's and Don'ts

### Do:
- **Do** read chrome colors from the active theme's CSS custom properties (`var(--accent)`, `var(--text)`, etc.) rather than hardcoding a hex value in a component.
- **Do** keep modals and confirm dialogs on the fixed slate/blue/amber palette so destructive actions stay legible regardless of the active page theme.
- **Do** use border-color-to-accent as the primary hover signal on cards/tiles; treat shadow deepening as secondary.
- **Do** reserve the script font for a single decorative accent per surface, never for body copy or structural headings.

### Don't:
- **Don't** hardcode a theme-colored value (bg1/bg2/accent/text) directly in a new component — reference the CSS variable so it stays theme-reactive.
- **Don't** introduce a new modal palette; extend the existing slate/blue/amber system instead of adding a third fixed register.
- **Don't** add drop-shadow-heavy "lifted" depth to editor chrome by default — the system is flat-glass at rest, lift is an explicit opt-in variant (`hover-lift`), not the baseline.
