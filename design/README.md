# Design references

| Reference | What it is | Status |
|---|---|---|
| Canvas "Omnicon Products Web" (claude.ai artifact, private): https://claude.ai/artifact/HyBBRy6xmsaHaUjdR53Amy | Approved visual design: Hub, MES Product, MES Project | Approved 2026-10-15 |
| `canvas/*.dc.html` | Source of the three canvas artboards. Image paths point to `../../public/...` | Reference only, not build input |
| Deck "Omnicon MES Overview" (claude.ai artifact, private): https://claude.ai/artifact/Gq6hdgK95MtyxCq67vvwd8 | 15-slide English deck; the Product page follows its story | Export PDF to `public/products/mes/omnicon-mes-overview.pdf` |
| `reference/production-management-3d.html` | Diego's Three.js digital-twin prototype (packaging line) | Base for demo v2 (SPEC §6) |

## Reading the canvas files

`.dc.html` is the canvas editor's format: plain HTML with inline styles, `{{holes}}` filled by the `renderVals()` script at the bottom, `<sc-for>` loops and `<sc-if>` conditionals. Port layout and styles to Astro components; take logic (demo, architecture explorer, progress filter) from the script blocks. Copy comes from `content/` JSON, not from these files.

## What to keep from the 3D prototype

- Scene look: navy fog, steel and glass materials, cyan/blue/purple accents, floating info cards.
- Orbit controls, camera tour, machine selection.

## What to change

- Machines and KPIs must follow the MES story: state per machine (Running / Slow / Faulted), stop events, OEE A × P × Q. Drop tank temperature, pressure and energy.
- Tabs in the prototype are decorative; remove or wire to page sections.
- Use Poppins instead of Inter.
- Fallback when WebGL is unavailable; lazy-load Three.js.
