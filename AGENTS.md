# Delightful Baking & Cooking — site notes

## HARD RULE — ALWAYS fix Android/mobile view after every edit
After ANY hero/nav/layout edit on this site, the mobile view MUST be checked and fixed:
- Android / small screens = `@media (max-width: 620px)` and `@media (max-width: 430px)`
- Desktop hand-placed offsets (see "DB LIVE-EDITOR OVERRIDES" at the end of `assets/css/style.css`)
  are tuned to a desktop viewport — mobile falls back to the centered stack via
  `@media (max-width: 1020px)` reset block. Keep that reset intact.
- Verification: `@media (max-width: 1020px) { ... transform: none; ... }` must exist for
  any hand-placed element.
- NEVER ship a hero change without re-checking ≤620 and ≤430.

## Files
- `index.html` — single-page site (nav + hero + sections)
- `order.html` — order wizard (3 steps; sends to Messenger)
- `admin.html` — admin panel (login: `nijhum` / `nijhumsbake123`, local storage now,
  MongoDB Atlas Data API sync via Settings tab). Scripts order in admin.html:
  premium.js → site-data.js → site-store.js → admin.js. Same order on index/order pages.
- `assets/data/site-data.js` — `window.DB_DEFAULTS` (v:1): products, premium, reviews, faq,
  story, cats, headings, hero, order (categories/finishes/designLibrary), settings.
- `assets/js/site-store.js` — `window.DB` store; localStorage key `db_site_v1`; Atlas Data API
  (collections `site`/`products`/`premium`/`reviews`/`faq`); `DB.get("products")` etc. read
  merged defaults+overlay. `price: null` = "Price on request"; number = ৳ price.
- `assets/data/premium.js` — `window.PREMIUM_CAKES` defaults; MUST load before site-data.js
  (site-data maps it into the `premium` list).
- `assets/js/main.js` — nav/drawer/tilt + renders products/reviews/premium/faq/cats/headings/
  story/hero from `DB` (see `applySiteData()`).
- `assets/js/order.js` — reads `DB.get("order")` + `DB.get("premium")`.
- `assets/js/admin.js`, `assets/css/admin.css` — admin panel logic/styles.
- `_backup_hero/` — archive of the old hero; stale selectors there are intentional.

## Palette (do NOT copy magenta/pink from reference mockups)
`--paper`, `--ink`, `--cocoa`, `--caramel #B98952`, `--caramel-deep #9C6F3D`,
`--rose #EFDCC3`, `--rose-deep #E1B489`, `--card #FFFDF8`, `--font-display` (Fraunces).

## Hero structure (current)
`.hero#home > .hero-waves (full-width, .wv-a/b/c) + .container.hero-inner > .hero-content`
- `.hero-headline` (column): `.hv-w1` "Delightful" / `.hv-cake[data-tilt]` (img.hv-cup +
  3 strawberry imgs .hf-stb-a/b/c + 3 sparkle svgs .hf-spk1/2/3 + 7 sprinkles .hf-sp) /
  `.hv-w2` "Baking <span class="hv-amp">& Cooking</span>"
- then .hero-tagline (.hl-so/.tl-hl), .hero-claim, .hero-cta (.btn-h-order/.btn-h-ghost),
  .hero-proof (.hero-stats + .hero-rating)

## Assets
- `assets/img/hero-cupcake.png` (transparent cutout 626×626)
- `assets/img/stb-1.png` (640×640), `assets/img/stb-2.png` (570×555) — originals in `assets/strawberry/`

## Verification after CSS edits
- PowerShell: count `{` vs `}` in style.css — must match.
- Grep for stale selectors in live files: `hf-st1|hf-st2|hf-st3|hf-d|hv-ring|hv-camp|order: -1`
  (allowed only in `_backup_hero/`).
- After ANY edit that touches `.hero` or `.hero.has-bg`, re-check the ≤1020/≤620/≤430 resets.
