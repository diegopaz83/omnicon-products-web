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
