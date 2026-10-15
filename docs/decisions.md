# Decisions

Implementation choices where SPEC.md is silent or ambiguous. Newest at the bottom.

| # | Area | Decision | Why |
|---|---|---|---|
| D1 | Versions | Astro 7.3.8, Zod 4.6.7, TypeScript 5.9.3, all exact pins | Astro 7.4.0 was released the same day as this scaffold; wait one patch cycle |
| D2 | Asset paths | Content paths are relative to `public/`. Paths starting with `brand/` resolve to `public/brand/` | SPEC §8: `brand/` is source only, not served |
| D3 | Images | Plain `<img>` with explicit sizes; no Astro `<Image>` in v1 | `public/` already holds optimized copies (SPEC §8) |
| D4 | Islands | Vanilla TypeScript in `<script>` tags; no UI framework | Keeps dependencies minimal (CLAUDE.md); demo and explorer are small |
| D5 | Copy | All UI labels (buttons, aria, status words) live in `content/site.json` under `ui` | Components hold no copy (SPEC §4) |
| D6 | Logo | `logo.light` is the white logo, used on dark grounds; `logo.dark` is the blue logo for light grounds | Key names follow the existing JSON |
| D7 | Placeholders | Text placeholders such as `[CONTACT_EMAIL]` render as written | Open items in SPEC §11 stay visible until filled |
| D8 | Pending media | `hero.media.pending` shows the poster without a play control; `deck.pending` hides the download and slides links | The MP4 and PDF files do not exist yet |
| D9 | Project data | `project.json` is read only when `PUBLIC_BUILD` is not `true`; `getProject` returns `null` otherwise | CLAUDE.md: no reads of `project.json` in public builds |
| D10 | Sitemap | No sitemap in v1 | Project pages stay out of any sitemap by construction |
| D11 | Content checks | A block listed in `blocks` without its data fails the build | SPEC §4: a block renders only if its data exists; a listed block without data is a content error |
| D12 | Colors | Canvas-only neutrals and the green "Available" status are added as tokens next to the brand tokens | The canvas is the approved visual reference |
| D13 | Grounds | No dark mode; grounds are fixed per section | The brand alternates dark and light grounds by design |
| D14 | Demo | After a reason is chosen, Machine 2 returns to Running | Matches the approved canvas behavior |
| D15 | Draft copy | `about.draft` is rendered like any other copy | SPEC §11 item 5 is open; the flag marks it, it does not hide it |
| D16 | Meta strings | Project meta uses commas, not middle dots | SPEC §3 avoids middle-dot meta strings |
| D17 | Tables | The open-questions table scrolls inside its own wrapper on phones | Keeps the page itself free of horizontal scroll at 360 px |
| D18 | Demo markup | The demo block renders its initial state on the server; the client script takes over in the next step | Shares `src/lib/demo.ts` between server and client |
| D19 | 3D twin | `public/demo/mes-twin.html` is the approved 3D file, embedded unchanged in an iframe with lazy load; only the logo is a relative path. Enlarge fills the screen; Restore or Escape returns it | Owner request for the 3D visual now; SPEC §6 still lists 3D as v2 |
| D20 | Twin copy | The embedded file is Spanish and holds its copy in the HTML, which breaks the English-only and content-only rules. Porting it to `content/` is pending | Kept as-is until the owner confirms the port |
| D21 | Twin scope | The embedded file still shows tank temperature, pressure and energy, which SPEC §6 says to drop | Owner's file, owner's call; flagged for the port |
| D22 | 3D twin | The iframe is replaced by a component: `src/lib/twin/scene.ts` (Three.js 0.160.1, npm dependency), mounted lazily when the stage nears the viewport | Scene is driven by the same demo state; English copy comes from `content/` |
| D23 | Machine mapping | Machine 1 = infeed conveyor, Machine 2 = filler (bottleneck), Machine 3 = capper; status lamps turn amber on a fault and bottles stop queuing behind it | Matches the MES story in SPEC §6 |
| D24 | HUD | OEE, A/P/Q, machine states, planned and unplanned totals and the stop log sit on the scene; machine cards, temperature, pressure and energy are removed | Owner decision; avoids redundancy with the 3D view |
| D25 | Demo sequence | Choosing a reason does not restart the machine; Machine 2 stays Faulted until "Restart the line" is pressed. This supersedes D14 | A stop is explained after it happens, but the line only resumes by a physical action |
