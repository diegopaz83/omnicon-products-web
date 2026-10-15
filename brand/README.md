# Omnicon brand kit (web)

Source files from Omnicon's brand package, organized for this repo. Optimized copies served by the site live in `public/brand/`.

## Colors

Official palette (`colors/corporate-colors.jpg`):

| Name | Hex | RGB |
|---|---|---|
| Navy (darkest) | `#001C3F` | 0, 28, 63 |
| Blue dark | `#002473` | 0, 36, 115 |
| Cyan | `#00DCFA` | 0, 220, 250 |
| Purple | `#7543FF` | 117, 67, 255 |
| Blue | `#0A58EB` | 10, 88, 235 |
| Cyan light | `#CCFBFE` | 204, 251, 254 |
| Indigo | `#3530A5` | 53, 48, 165 |

Official gradients: `#002473 → #0A58EB`, `#00DCFA → #CCFBFE`, `#7543FF → #3530A5`.

Web tokens (derived, see SPEC §3):

```css
:root {
  --night: #001C3F;
  --deep: #002473;
  --signal: #00DCFA;   /* accents on dark grounds only */
  --action: #0A58EB;   /* links and CTAs on light */
  --volt: #7543FF;
  --indigo: #3530A5;
  --paper: #F3F7FB;
  --ink: #001C3F;
  --body: #3B4D66;
  --muted: #4A5D78;
  --line: #D3DEEB;
  --fault: #FFB547;    /* status only, always with a text label */
  --on-dark: #F2F7FC;
  --on-dark-muted: #B7C6DA;
}
```

Contrast notes: cyan text fails on light grounds; use `--action` there. On dark grounds use `--on-dark` / `--on-dark-muted`.

## Typography

| Use | Face | Weight |
|---|---|---|
| Display (hero, big numbers) | Poppins | 300 |
| Headings | Poppins | 600 |
| Body | Poppins | 400 |
| Emphasis, buttons | Poppins | 500–600 |

- Files: `fonts/poppins/` (TTF, SIL Open Font License, `OFL.txt`). Web WOFF2 (300/400/500/600) in `public/brand/fonts/poppins/`.
- Not included: Gotham (copy came from a free-font site, no valid license), Aurelie Smith Script and Brittany (decorative, license unknown). Do not use them on the web.

## Logo

| File | Use |
|---|---|
| `logo/omnicon-white.png` | On Navy and dark photos |
| `logo/omnicon-blue.png` | On light grounds |

Keep clear space of at least the height of the "o" around the logo. Minimum height on web: 24 px. Do not recolor, stretch or add effects.

## Graphics

`graphics/signal-wave-1..5.png`: the brand's cyan→purple line. On the web it is the "signal" motif: use one per view at most (hero background or a section divider), never as a pattern.

## Backgrounds and photos

| File | Content |
|---|---|
| `backgrounds/bg-dark-wave.jpg` | Navy with signal line (slides, hero) |
| `backgrounds/bg-light-wave.jpg` | White with signal line |
| `backgrounds/bg-light-soft.jpg` | Soft white curves |
| `photos/industrial-robot-engineer.jpg` | Engineer with robot arm and HUD |
| `photos/control-room-engineers.jpg` | Two engineers at control-room screens |
| `photos/team-whiteboard.jpg` | Team planning session |

The kit has few photos. New imagery: licensed stock or real Omnicon project photos (with permission); keep the cool blue grading.

## Icons

`icons/<category>/`: line icons with the brand gradient (PNG/WebP, 80–500 px). Categories: about-us, carrers, digital-transformation-consulting, home, industrial-automation, industrias, smart-manufacturing. Use at 48–96 px on light grounds. For UI glyphs (play, close, chevrons) use inline stroke SVG instead.
