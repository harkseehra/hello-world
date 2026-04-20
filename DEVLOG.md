# Masnavi Reader — Dev Log

## What this is
A web reader for the Masnavi (مثنوی) by Rumi. Persian poetry with English translation, side by side or in focus view. Six books. Deployed on GitHub Pages.

---

## Typography & Fonts

### Farsi fonts
- **Vazirmatn** — default, clean modern Farsi
- **Nazanin (BNazanin)** — self-hosted `.woff` from GitHub, traditional style
- **Arial** — system font, larger size table (+20% over Vazirmatn) and weight 500 to compensate for thinner strokes
- Removed: IranSans, Harmattan, Markazi Text, Lalezar, Amiri (all migrated → Vazirmatn in localStorage)

### Font size system
Each font has its own size table, not one global scale:
- `SIZE_FA_V` — Vazirmatn `[20,22,24,26,28,30]px`
- `SIZE_FA_L` — Nazanin `[23,25,28,30,32,35]px` (+15%)
- `SIZE_FA_A` — Arial `[24,26,29,31,34,37]px` (+20%)

Farsi `font-weight: 500` globally. Arial overrides to 500 explicitly.

### English fonts
- Sans: Schibsted Grotesk
- Serif: Amiri (kept for English serif mode only)

### Section headings
Fixed sizes — not affected by the Aa size control:
- English heading: 20px, weight 500, italic
- Farsi heading: 27px, weight 600
- Scholar view equivalents: 18px / 24px

---

## Colour System

### Farsi text colours (`data-fa-color`)
| Key | Light/Kaghaz | Dark |
|-----|-------------|------|
| `irozumi` | `#3C3D3E` | `#E0E1E0` |
| `nila` | `#2C3A8C` | `#7EA8E8` |
| `qahwa` | `#6F4E37` | `#C4956A` |
| `sorkh` | `#CC3333` | `#E07878` |

Removed: peacock, khun, zafarani (all migrate → irozumi)

### English text colours (`data-en-color`)
| Key | Light/Kaghaz | Dark |
|-----|-------------|------|
| `asagao` | `#1747B0` | `#7EB0E8` |
| `konpeki` | `#0077CC` | `#56C0FF` |
| `noir` | `#1C1C1E` | `#E8E8F2` |

### Themes
- `light` — default
- `dark` — deep black `#0D0D0D`
- `kaghaz` — warm parchment `#fff4e6`

Theme toggle cycles light → dark → kaghaz. Uses `document.startViewTransition()` for smooth crossfade.

---

## UI Components

### Nav bar
- Logo (manuscript icon + مثنوی) — desktop TOC trigger
- Book tabs — desktop only, hidden on mobile
- **Centre pill** (`#nav-book-pill`) — always visible, shows current book ("Book 1" etc.)
  - Desktop: purely informational, `pointer-events: none`
  - Mobile: tappable button, opens book selector dropdown
- Nav actions: search, settings (Aa), scholar/focus toggle

### Mobile
- Hamburger hidden — pill replaces it
- Book selector dropdown slides down from nav when pill is tapped
- Settings panel full-width

### Settings panel
- Farsi Script: Vazirmatn / Nazanin / Arial
- Farsi Colour: 4 swatches
- English Font: Sans / Serif
- English Colour: 3 swatches

### TOC panel
- 320px wide
- Header: "Book N" (accent colour, 11px uppercase) + "Table of Contents" (16px/600)
- Row separators via `border-bottom`
- Backdrop click closes

### Size pill (right edge)
- A / a buttons, 6 size steps
- Adjusts Farsi and English sizes independently via CSS custom properties

### Theme pill (right edge)
- Sun / Moon / Paper icons, cycles themes

### Pager
- Fixed bottom centre
- Opacity 0.72 at rest, 1.0 on hover

---

## Effects

### Phosphor glow (dark mode only — the one effect kept)
Warm amber `text-shadow` on Farsi text in dark mode — simulates light bleeding into the dark background like old phosphor screens:
```css
[data-theme="dark"] .verse-fa {
  text-shadow:
    0 0 18px rgba(235, 190, 95, 0.20),
    0 0 48px rgba(215, 155, 65, 0.09);
}
```

### Effects removed (performance)
The following were built then removed because they degraded scroll performance:
- `filter: sepia() saturate() hue-rotate()` on `html` — forces full-page GPU compositing every frame
- Animated film grain (`body::before` with `steps()` animation)
- Lens/vignette overlay (`body::after` radial gradients)
- Rounded viewport corners
- Projector warm-up animation

The phosphor glow (text-shadow only) has negligible rendering cost and was kept.

---

## Data

Books 1–6 loaded from `data/book1.json` … `data/book6.json`. Each file has sections with entries of type `verse` or `heading`. Verses have `farsi` (two hemistichs joined by ` / `) and `en` fields.

Pagination: 10 verses per page. Pages cached in memory after first load.

---

## localStorage keys
| Key | Values |
|-----|--------|
| `mv-theme` | `light` / `dark` / `kaghaz` |
| `mv-font` | `vazir` / `nazanin` / `arial` |
| `mv-en-font` | `sans` / `serif` |
| `mv-fa-color` | `irozumi` / `nila` / `qahwa` / `sorkh` |
| `mv-en-color` | `asagao` / `konpeki` / `noir` |
| `mv-size-step` | `0`–`5` |

---

## How the user likes to work (for future AI agents)

Talk like a human. Short answers. No "Certainly!" or bullet-pointed summaries of what you just did.

He thinks in feelings and visuals — "it should feel like a cinema projector lens" not "add a radial-gradient." Translate the feeling into code. Ask one question if genuinely unclear, not five.

When he says "yes do it" — build it now, don't re-present the plan.

He pushes back directly ("that's bad", "fix it"). Don't apologise, just fix it.

He cares about aesthetics. Think about whether it looks good, not just whether it works.
