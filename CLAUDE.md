# CLAUDE.md — omnicon-products-web

Omnicon products website. Read `SPEC.md` first; it is the source of truth. Visual reference: `design/`. Brand: `brand/README.md`.

## Project facts

| Item | Value |
|---|---|
| Client | Omnicon (only Omnicon content here) |
| Owner | Diego Paz, PNB Digital |
| Repo | `diegopaz83/omnicon-products-web` (public) |
| Local path | `C:\Dev\omnicon\omnicon-products-web` |
| Hosting | GitHub Pages, base `/omnicon-products-web` |
| Stack | Astro (static) + TypeScript, Three.js in demo islands only, Zod for content schemas |
| Site language | English only |
| Product #1 | Omnicon MES (`content/products/mes/`) |

## Rules

- Content lives in `content/**.json`, read only through `src/lib/data.ts`. Never hard-code product copy in components.
- Respect `PUBLIC_BUILD=true`: no `/project/` pages, no links to them, no reads of `project.json` (SPEC §5).
- Brand: Poppins only; palette and do/don't in `brand/README.md`. Do not use Gotham or the script fonts (no valid license).
- No secrets, `.env` or credentials in git.
- No backend in v1. Any future CRUD goes behind `src/lib/data.ts` (Supabase planned).
- Never connect the site to the MES SQL Server or InfluxDB.
- Keep dependencies minimal; pin versions (`three@0.160.1`).
- Accessibility AA, keyboard focus visible, reduced motion respected, mobile at 360 px.

## Working style (Diego)

- Answer in Spanish, ultra compact: no intro, no conclusion, short tables over paragraphs.
- Code first; show diffs, not whole files; minimal comments.
- Specs and task lists in writing (Markdown in the repo).
- No emojis in UI copy, commits or messages.
- Every decision documented: update `SPEC.md` (or `docs/decisions.md`) when something changes.

## Commands (once scaffolded)

| Task | Command |
|---|---|
| Dev | `npm run dev` |
| Internal build | `npm run build` |
| Public build | `PUBLIC_BUILD=true npm run build` |
| Preview | `npm run preview` |

## First session plan

1. Scaffold Astro + TypeScript in this folder (keep `brand/`, `content/`, `design/`, docs).
2. `src/lib/schema.ts` + `src/lib/data.ts` from the JSON in `content/`.
3. Layout, header, footer, tokens (CSS custom properties from `brand/README.md`), self-hosted Poppins.
4. Hub page, then MES product page block by block, then project page.
5. Demo v1 (2D) exactly per SPEC §6.
6. GitHub Actions deploy to Pages.
