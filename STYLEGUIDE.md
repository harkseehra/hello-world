# Apple HIG Web Style Guide
> Internal reference for the Masnavi project. Distilled from a senior Apple developer's design guidance for web apps targeting iOS, iPadOS, and macOS Safari.

---

## Core Principles
- **Clarity** — legible, focused reading
- **Deference** — UI serves the content, never competes
- **Depth** — subtle layers, smooth motion, materials for hierarchy

## Overall Philosophy
- Minimal & Timeless — white/light mode, elegant dark mode via `prefers-color-scheme`. Single accent color used sparingly.
- Typography-First — SF Pro (`-apple-system, BlinkMacSystemFont, system-ui`) everywhere.
- Performance — lazy-loaded images, minimal JS, optimized for Safari.
- Responsive & Adaptive — single column on iPhone, graceful sidebar on iPad, spacious on macOS.
- PWA-Ready — `manifest.json`, `apple-mobile-web-app-capable`, `viewport-fit=cover`.

---

## Section 1: iOS (iPhone) — Intimate, Scrollable, One-Handed

### Layout & Padding
- Respect `env(safe-area-inset-*)` for Dynamic Island / notch
- Content margins: 16–20pt from edges
- Vertical rhythm: 8-point grid (16pt between sections, 8–12pt between elements)
- Inside cards: 16pt horizontal padding
- Full-bleed hero images with soft rounded corners

### Typography
- Body: **17pt** (`font-size: clamp(16px, 4.25vw, 17px)`)
- Large Title: ~34pt — post titles, modal headers
- Title 1/2: 28pt / 22pt
- Body: 17pt regular, line-height ~1.4×
- Caption: 12–13pt
- Left-aligned body; center only for short intros/quotes
- `-webkit-font-smoothing: antialiased`

### Buttons & Elements
- Minimum hit area: **44×44pt** — use padding + min-height
- Primary: filled, accent color, 10–14pt border-radius, 16pt horizontal padding
- Secondary: outline or plain text — never heavy borders
- Navigation: bottom tab bar in standalone mode (Home, Search, Bookmarks, Settings)
- SF Symbols equivalent SVGs for icons
- Smooth `cubic-bezier` spring transitions

---

## Section 2: iPadOS — Adaptive, Multitasking-Aware

### Layout
- 20–24pt side margins in regular width
- Responsive via media/container queries for Split View + Stage Manager
- Sidebar appears on wide canvas; collapses to single column in compact width
- 44pt touch targets maintained across all canvas sizes

### Typography
- Same SF Pro base, 17pt body
- Optimal line length: 60–75 characters

### Buttons & Elements
- Add `:hover` states for trackpad/mouse in Stage Manager
- Support keyboard focus (`tabindex`, `focus-visible`)
- Bottom sheets / modals via CSS (match system presentation styles)

---

## Section 3: macOS (Safari / Added to Dock) — Desktop Productivity

### Layout
- 24pt+ side margins
- Sidebar + content split (resizable panels)
- Hover feedback essential everywhere

### Typography
- Body: **13pt** (desk viewing distance)
- Headings: 22–26pt range
- Left-aligned content; right-align tabular numbers
- Line length: avoid overly wide paragraphs at large window sizes

### Buttons & Elements
- Push-button style: rounded bezel, subtle shadow, `backdrop-filter` for depth
- Full keyboard navigation (tab, arrows, shortcuts)
- Light materials and soft shadows for layer hierarchy
- Window management: feels natural in multiple desktops / alongside apps

---

## PWA / Web App Setup

```html
<!-- In <head> -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<link rel="manifest" href="manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="App Name">
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111110" media="(prefers-color-scheme: dark)">
```

```json
// manifest.json
{
  "name": "App Name",
  "short_name": "App",
  "display": "standalone",
  "start_url": ".",
  "background_color": "#F2F2F7",
  "theme_color": "#FFFFFF",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Safe Area Insets (CSS)

```css
:root {
  --safe-top:    env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

/* Fixed top nav — grows to fill behind notch */
#top-nav {
  top: 0;
  height: calc(52px + var(--safe-top));
  padding-top: var(--safe-top);
}

/* Scrollable content — clears home bar */
#main-scroll {
  padding-bottom: calc(80px + var(--safe-bottom));
}
```

## Signature Apple Touches
- Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Smooth easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Duration: 220ms fast, 400ms mid
- `backdrop-filter: blur(12px)` for nav/modal glass effect
- `@media (prefers-reduced-motion: reduce)` — disable all non-essential animations
- `@media (prefers-color-scheme: dark)` — auto dark mode (or fall back to manual toggle)
- VoiceOver-friendly: proper ARIA labels, semantic HTML, focus management
- Offline: service worker caches key assets + JSON data on first visit

## Dark Mode Palette
- Light bg: `#F2F2F7` (iOS system grouped background)
- Dark bg: `#0F0E0E` (slightly warm black — not pure `#000`)
- Warm paper: `#FFF4E6` (kaghaz / parchment)
- Avoid pure black in dark mode — use `#111110` or `#0F0E0E`

---

*"The interface should be invisible — you open it, get lost in the content, and only later realize how effortless the reading was."*
