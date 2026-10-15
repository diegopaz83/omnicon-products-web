# SPEC — Omnicon Products Web

Version 0.1 · 2026-10-15 · Owner: Diego Paz (PNB Digital) for Omnicon

## 1. What this is

A website that presents **Omnicon's products** to plant and operations leaders. It is a reusable skeleton: the design and code exist once, and each product is a content file plus its assets. **Omnicon MES** is product #1.

| Item | Decision |
|---|---|
| Owner of the content | Omnicon (do not mix other clients) |
| Language | 100% English |
| Audience (public) | Managers and directors of manufacturing companies |
| Audience (internal) | Omnicon and the delivery team |
| Hosting | GitHub Pages, repo `diegopaz83/omnicon-products-web` (public, GitHub Free) |
| URL | `https://diegopaz83.github.io/omnicon-products-web/` (custom domain later) |
| Stack | Astro (static output) + TypeScript; Three.js only inside demo islands |
| Data | JSON files in `content/` behind one data-access module (`src/lib/data.ts`) |
| CRUD | Not in v1. Planned later via Supabase; only `src/lib/data.ts` changes |

## 2. Sitemap

```
/                                  Hub: product catalog
/products/<slug>/                  Product view (public)
/products/<slug>/project/          Project view (internal; see §5)
```

v1 products: `mes` (available). Hub also shows placeholder tiles for future products (`status: "planned"`), with no page.

## 3. Visual system

Source of truth: `brand/README.md` and the approved canvas (`design/README.md`).

| Token | Value | Use |
|---|---|---|
| Night | `#001C3F` | Dark grounds: header, hero, demo, footer |
| Deep | `#002473` | Secondary dark band (deck download) |
| Signal | `#00DCFA` | Primary CTA on dark, live status, accents on dark only |
| Action | `#0A58EB` | Links and primary CTA on light |
| Volt | `#7543FF` | Human-input moments, Quality factor |
| Indigo | `#3530A5` | Performance factor, internal banner |
| Paper | `#F3F7FB` | Light ground |
| Ink / Body | `#001C3F` / `#3B4D66` | Headings / body text on light |
| Fault | `#FFB547` | Faulted machine state (always with a text label) |

- Typeface: **Poppins** only (300 display, 400 body, 500/600 emphasis). Self-host from `brand/fonts/poppins/`.
- Mix of grounds: dark hero, demo and footer; light content sections.
- One signature element: the cyan→purple brand "signal" line (`brand/graphics/`) and the interactive demo. Keep everything else quiet.
- Avoid: ALL-CAPS eyebrow labels, `→` appended to buttons, middle-dot meta strings, emoji, generic card grids for everything, gradient washes.
- Accessibility: AA contrast, visible focus, real `<button>`/`<a>`, `prefers-reduced-motion` respected, works at 360 px width.

## 4. Building blocks (components)

Each product page is an ordered list of blocks declared in its `product.json`. A block renders only if its data exists.

| Block | Component | Data key | MES content |
|---|---|---|---|
| Hero | `Hero.astro` | `hero` | Title, subtitle, CTAs, motion video (poster + mp4/webm) |
| Problem | `Problem.astro` | `problem` | 3 statements + photo |
| Promise + Questions | `Questions.astro` | `promise`, `questions` | One sentence + 4 business questions with icons |
| How it works (product tour) | `Tour.astro` | `tour` | Real product screens (GIF) with a short narrative per screen |
| Flow | `Flow.astro` | `flow` | 5 steps signal → decision; step 4 is human input |
| Concept (demo) | `Demo.astro` (island) | `demo` | Conceptual 3D line + OEE HUD, interactive (§6) |
| KPI explainer | `Kpi.astro` | `kpi` | OEE = A × P × Q + worked example |
| Under the hood | `Architecture.astro` (island) | `architecture` | 6 selectable layers with detail panel. Stays on the product page |
| Day in the plant | `Timeline.astro` | `day` | Before / During / After |
| Roll-up | `Rollup.astro` | `rollup` | Machine → Line → Plant + time cuts |
| Value | `Value.astro` | `benefits`, `foundations` | 4 benefits + foundations strip |
| Deck | `Deck.astro` | `deck` | PDF download + slides link |
| CTA | `Cta.astro` | `cta` (site-level default) | Request a demo |

Rules:
- Components never hard-code product copy. All text comes from JSON.
- A new product = new folder `content/products/<slug>/` + assets in `public/products/<slug>/`. No new components unless a block is genuinely new; if so, add it generically.

## 5. Public vs internal build

| Build | Command | Includes `/project/` pages | Use |
|---|---|---|---|
| Internal | `npm run build` (default `PUBLIC_BUILD` unset) | Yes, with an "Internal view" banner and `noindex` | Current GitHub Pages deploy (accepted for now) |
| Public | `PUBLIC_BUILD=true npm run build` | **No**: pages not generated, links hidden, `project.json` not read | When the site goes to a public host |

- Project pages always: `<meta name="robots" content="noindex,nofollow">`, excluded from sitemap.
- Never link to Project from public pages when `PUBLIC_BUILD=true`.
- Known limitation (accepted): repo is public, so `content/**/project.json` is readable on GitHub. When that matters: move internal JSON to a private repo or upgrade plan.
- Optional later: password-encrypt Project pages (StatiCrypt) for an internal deploy.

## 6. Concept demo (MES)

Renamed from "Live demo" (D26). It is a concept of a shift on one line, not a live view. v1 (must): the interactive simulation, with the 3D line as its visual.
- Order on the page: How it works (product tour) → Flow → Concept demo → KPI → Under the hood.
- Machine 1 = infeed, Machine 2 = filler (bottleneck), Machine 3 = capper; a line tower light shows the state.
- Line 1 with 3 machines (infeed, bottleneck 1.5 s/part, last machine).
- Shift: 480 min scheduled. Seed event: Machine 1, 10:05, 24 min, Material shortage, unplanned.
- "Cause a breakdown on Machine 2" → Machine 2 Faulted; event 13:40, 12 min, reason Unknown (counted unplanned).
- Operator picks a reason: Electrical fault / Material shortage (unplanned) or Planned changeover (planned).
- Formulas: `A = (480 − planned − unplanned) / (480 − planned)`, `P = 0.85`, `Q = 0.97`, `OEE = A·P·Q`. Seed values: A 95.0 %, OEE 78.3 %.
- Label clearly: "Simulated data, not connected to a PLC".

v2 (next): replace the 2D machines with a Three.js scene based on `design/reference/production-management-3d.html` (Diego's prototype), driven by the same state. Requirements: lazy-load Three.js only when the demo enters the viewport; fallback to the 2D version or the motion poster if WebGL fails; pin `three@0.160.1`.

## 7. Content model

```
content/
  site.json                       hub copy, nav, footer, product list
  products/<slug>/product.json    public product page (blocks)
  products/<slug>/project.json    internal: summary, progress, scope, architecture, decisions, questions
```

Read all content through `src/lib/data.ts` (`getSite()`, `getProduct(slug)`, `getProject(slug)`). Validate with Zod schemas in `src/lib/schema.ts`; the build fails on invalid content.

## 8. Assets

```
brand/                 source brand kit (do not serve directly)
public/brand/          optimized copies served by the site (logos, fonts, graphics, icons)
public/products/mes/   hero poster, motion video, photos, deck PDF
```
- Images: WebP/AVIF via Astro `<Image>`; photos ≤ 300 KB.
- Motion video: MP4 (H.264) + WebM, ≤ 15 MB, with poster image; autoplay only muted and only if `prefers-reduced-motion` is not set.
- Deck: export the "Omnicon MES Overview" deck to PDF → `public/products/mes/omnicon-mes-overview.pdf`.

## 9. Deploy

- GitHub Actions workflow `.github/workflows/deploy.yml` using `withastro/action` + `actions/deploy-pages`.
- `astro.config.mjs`: `site: 'https://diegopaz83.github.io'`, `base: '/omnicon-products-web'`. All internal links use the base.
- Repo variable `PUBLIC_BUILD` controls §5 (unset for now).

## 10. Definition of done (v1)

- [ ] Hub, MES product page and MES project page match the approved canvas at 1440 px and work at 360 px.
- [ ] All copy comes from JSON; adding a dummy second product renders without code changes.
- [ ] Demo behaves exactly as §6.
- [ ] `PUBLIC_BUILD=true` produces no `/project/` output (verify in `dist/`).
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95 on the product page.
- [ ] Deployed on GitHub Pages from `main`.

## 11. Open items

| # | Item | Owner |
|---|---|---|
| 1 | Final motion video file | Diego |
| 2 | Contact email for "Request a demo" | Omnicon |
| 3 | Names of future products for the hub | Omnicon |
| 4 | Confirm out-of-scope list in `project.json` | Diego |
| 5 | Hub copy "Every product starts on a real line" (draft) | Diego |
| 6 | Custom domain | Later |
