# omnicon-products-web

Omnicon's products website. Product #1: **Omnicon MES**.

| Folder | Content |
|---|---|
| `SPEC.md` | What to build: sitemap, blocks, public vs internal build, demo, deploy |
| `CLAUDE.md` | Instructions for Claude Code in this repo |
| `content/` | All site copy and data (JSON) |
| `brand/` | Omnicon brand kit (source) and `brand/README.md` |
| `public/` | Optimized assets served by the site |
| `design/` | Approved design canvas, deck and 3D prototype references |

Status: Astro app built (hub, MES product, MES project, 2D demo). Commands: `npm run dev`, `npm run build`, `npm run verify:public` (public build check). Decisions: `docs/decisions.md`. Deploy: `.github/workflows/deploy.yml` to GitHub Pages.
