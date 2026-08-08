/* ============================================================
   DELIGHTFUL baking & cooking — main.js
   ------------------------------------------------------------
   Contents
     1.  Product catalogue (edit here)
     2.  Icon/star helpers
     3.  Navigation (sticky, burger, scrollspy, smooth)
     4.  Announcement bar (dismiss + persist)
     5.  Product grid (render, filters, search, count)
     6.  Quick-view modal
     7.  Order flow (Messenger intent + toast)
     8.  Reviews grid
     9.  FAQ accordion
    10. Reveal-on-scroll
    11. Scroll-to-top + floating badge
    12. Cursor blob, tilt effect, year
    13. Reduced-motion & robustness guard
   ============================================================ */

/* ------------------------------------------------------------
   1. PRODUCT CATALOGUE
   Loaded from site-data.js defaults + the admin overlay
   (site-store.js). price : number → shows "৳ + int"; null →
   "Price on request".
   ------------------------------------------------------------ */
const PRODUCT_RECORDS = DB.get("products");

const PRODUCTS = PRODUCT_RECORDS.map((p, i) => ({ ...p, id: i }));

const FB_PAGE = "https://www.facebook.com/profile.php?id=61569872870733";
const PAGE_NAME = "Delightful Baking & Cooking";

/* ------------------------------------------------------------
   2. HELPERS
   ------------------------------------------------------------ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function starSvg() {
  return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z"/></svg>';
}
function stars(count = 5, cls = "review-stars") { return `<span class="${cls}">` + starSvg().repeat(count) + "</span>"; }

const ICONS = {
  mkt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.38 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M4 6v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6M3 6l2-3h14l2 3"/></svg>',
  bin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M10 11v6M14 11v6M6 7l1 13h10l1-13M8 7V4h8v3"/></svg>'
};

/* ---- reveal-on-scroll (hoisted so everything can use it) ---- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add("in");
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

function observeReveals(scope = document) {
  $$(".reveal:not(.in)", scope).forEach(el => io.observe(el));
}

/* ------------------------------------------------------------
   3. NAVIGATION
   ------------------------------------------------------------ */
const nav = $("#nav");
const burger = $("#navBurger");
const navLinks = $("#navLinks");
const scrolledClass = () => nav.classList.toggle("scrolled", window.scrollY > 16);
window.addEventListener("scroll", scrolledClass, { passive: true });
scrolledClass();

if (burger && navLinks) {
  const closeMenu = () => {
    navLinks.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
  };
  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  navLinks.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });
  document.addEventListener("click", (e) => {
    if (navLinks.classList.contains("open") && !navLinks.contains(e.target) && !burger.contains(e.target)) {
      closeMenu();
    }
  });
}

/* Scrollspy — highlight active section */
const spyLinks = $$(".nav-links a[data-nav]");
const spySections = spyLinks
  .map(a => $(a.getAttribute("href")))
  .filter(Boolean);

function spyOn() {
  const y = window.scrollY + 120;
  let id = "";
  spySections.forEach(sec => { if (sec.offsetTop <= y) id = sec.id; });
  spyLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
}
window.addEventListener("scroll", spyOn, { passive: true });
spyOn();

/* Smooth scroll for data-scroll links */
function smoothScrollTo(e) {
  const href = e.currentTarget.getAttribute("href");
  if (!href || !href.startsWith("#")) return;
  const el = $(href);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", href);
}
$$("[data-scroll]").forEach(a => a.addEventListener("click", smoothScrollTo));

/* ------------------------------------------------------------
   4. ANNOUNCEMENT
   ------------------------------------------------------------ */
const announce = $("#announce");
const announceClose = $("#announceClose");
if (announce && announceClose) {
  if (localStorage.getItem("dbc-announce") === "closed") {
    announce.style.display = "none";
  } else {
    announceClose.addEventListener("click", () => {
      announce.style.transition = "opacity .4s, transform .4s";
      announce.style.opacity = "0";
      announce.style.transform = "translateY(-8px)";
      localStorage.setItem("dbc-announce", "closed");
      setTimeout(() => { announce.style.display = "none"; }, 400);
    });
  }
}

/* ------------------------------------------------------------
   5. PRODUCT GRID
   ------------------------------------------------------------ */
const grid = $("#productGrid");
const filtersEl = $("#filters");
const searchInput = $("#searchInput");
const searchBox = $("#searchBox");
const searchClear = $("#searchClear");
const gridCount = $("#gridCount");

let lastFilter = "All";

/* Tap a card to reveal its details overlay, or open the quick-view
   window directly on touch devices; tap again or another card to close */
function toggleCardDetails(e) {
  if (e.target.closest("button, a")) return;
  const card = e.target.closest(".card");
  if (!card) return;
  if (innerWidth < 920 || window.matchMedia("(hover: none), (pointer: coarse)").matches) {
    openQuick(Number(card.dataset.pid));
    return;
  }
  const wasOpen = card.classList.contains("show");
  $$(".card.show", grid).forEach(c => c.classList.remove("show"));
  if (!wasOpen) card.classList.add("show");
}

/* Build nav-like filter chips with counts */
function tagCounts() {
  const counts = {};
  PRODUCTS.forEach(p => {
    const t = p.tag.split(" · ")[0];
    counts[t] = (counts[t] || 0) + 1;
  });
  return counts;
}

function buildFilters() {
  if (!filtersEl) return;
  const tags = ["All", ...new Set(PRODUCTS.map(p => p.tag.split(" · ")[0]))];
  const counts = tagCounts();
  filtersEl.innerHTML = "";
  tags.forEach((t, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (t === "All" ? " active" : "");
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", t === "All" ? "true" : "false");
    b.innerHTML = i === 0 ? `All <span class="chip-count">${PRODUCTS.length}</span>` : `${t}<span class="chip-count">${counts[t] || 0}</span>`;
    b.addEventListener("click", () => {
      lastFilter = t;
      setFilter(t);
    });
    filtersEl.appendChild(b);
  });
}

function setFilter(tag) {
  lastFilter = tag;
  if (searchInput) searchInput.value = "";
  if (searchBox) searchBox.classList.remove("is-typing");
  $$(".chip", filtersEl).forEach(ch => {
    const active = ch.textContent.trim().startsWith(tag);
    ch.classList.toggle("active", active);
    ch.setAttribute("aria-selected", active ? "true" : "false");
  });
  render();
}

/* ---- filtering ---- */
function visibleProducts() {
  const q = (searchInput.value || "").trim().toLowerCase();
  return PRODUCTS.filter(p => {
    const matchFilter = lastFilter === "All" || p.tag.split(" · ")[0] === lastFilter;
    const matchSearch = !q || (p.name + " " + p.tag + " " + (p.blurb || "")).toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
}

function priceHTML(p) {
  if (p.price === null) {
    return '<span class="price wip">Price on request</span>';
  }
  const n = Number(p.price);
  if (isNaN(n)) return `<span class="price">${p.price}</span>`;
  return `<span class="price"><span class="curr">BDT </span>${n.toLocaleString("en-IN")}</span>`;
}

function cardHTML(p) {
  return `
  <article class="card reveal" data-pid="${p.id}">
    <div class="card-media">
      <img src="${p.img}" alt="${p.name}" loading="lazy" width="640" height="480" onerror="this.style.opacity=.25">
      <span class="card-tag">${p.tag}</span>
      <button class="card-quick" data-quick="${p.id}" aria-label="Quick view ${p.name}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <div class="card-body">
        <h3 class="card-title">${p.name}</h3>
        <p class="card-desc">${p.blurb || p.desc}</p>
        <div class="price-row">${priceHTML(p)}</div>
        <div class="card-foot">
          <button class="order-btn" data-order="${p.name}" aria-label="Order ${p.name}">
            ${ICONS.mkt}
            <span class="btn-label">Order on Messenger</span>
          </button>
        </div>
      </div>
    </div>
  </article>`;
}

function render() {
  if (!grid) return;
  const shown = visibleProducts();
  lastRender = shown;
  grid.innerHTML = shown.map(cardHTML).join("") ||
    `<div class="empty-state">
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M4 4c-1 1.5-1 5 0 7"/><path d="M4 11c1-1.5 4.5-2 7 1"/></svg>
       <h3>Nothing in the basket for that</h3>
       <p>Try “chocolate,” “jar” or clear the search — or message us and we’ll bake it your way.</p>
     </div>`;

  if (gridCount) gridCount.innerHTML = shown.length ? `<b>${shown.length}</b> item${shown.length > 1 ? "s" : ""} — baked to order, message to check price` : "";

  /* rebind order buttons + quick view */
  $$("[data-order]", grid).forEach(btn => btn.addEventListener("click", () => orderFlow(btn.dataset.order)));
  $$("[data-quick]", grid).forEach(btn => btn.addEventListener("click", () => openQuick(Number(btn.dataset.quick))));

  observeReveals(grid);
}

grid.addEventListener("click", toggleCardDetails);

/* search box */
if (searchInput && searchClear) {
  searchInput.addEventListener("input", () => {
    searchBox.classList.toggle("is-typing", !!searchInput.value);
    render();
  });
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchBox.classList.remove("is-typing");
    render();
    searchInput.focus();
  });
}

/* ------------------------------------------------------------
   6. QUICK VIEW MODAL
   ------------------------------------------------------------ */
const qv = $("#quickModal");
const qvImg = $("#qvImg"); const qvTag = $("#qvTag"); const qvTitle = $("#qvTitle");
const qvPrice = $("#qvPrice"); const qvDesc = $("#qvDesc"); const qvOrder = $("#qvOrder");

function openQuick(id) {
  const p = PRODUCTS[id];
  if (!p || !qv) return;
  qvImg.src = p.img; qvImg.alt = p.name;
  qvTag.textContent = p.tag;
  qvTitle.textContent = p.name;
  qvPrice.innerHTML = priceHTML(p);
  qvDesc.textContent = p.desc;
  qvOrder.href = "order.html";
  qv.setAttribute("aria-hidden", "false");
  qv.classList.add("show");
  document.body.style.overflow = "hidden";
  /* re-animate card via class reset */
  const cardEl = $(".modal-card", qv);
  cardEl.style.transition = "none";
  void cardEl.offsetHeight;
  cardEl.style.transition = "";
}

function closeQuick() {
  if (!qv) return;
  qv.classList.remove("show");
  qv.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
$$("[data-close]", qv).forEach(el => el.addEventListener("click", closeQuick));
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeQuick(); navLinks.classList.remove("open"); } });

/* ------------------------------------------------------------
   7. ORDER FLOW (Messenger) + TOAST
   ------------------------------------------------------------ */
const toast = $("#toast");
const toastMsg = $("#toastMsg");
let toastTimer;

function orderFlow(product) {
  showToast(`Opening the order page · ${product}`);
  setTimeout(() => window.location.href = "order.html", 450);
}

function showToast(msg) {
  if (!toast) return;
  toastMsg.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3400);
}
/* toast escape auto-dismiss on click */
toast && toast.addEventListener("click", () => toast.classList.remove("show"));

/* ------------------------------------------------------------
   8. REVIEWS GRID
   ------------------------------------------------------------ */
const REVIEWS = DB.get("reviews");

/* Rating widget — computed from the review stars */
const avgScore = $("#avgScore");
if (avgScore && REVIEWS.length) {
  const avg = REVIEWS.reduce((a, r) => a + (Number(r.stars) || 0), 0) / REVIEWS.length;
  avgScore.textContent = avg.toFixed(1);
  const avgStars = $("#avgStars");
  if (avgStars) avgStars.innerHTML = starSvg().repeat(Math.max(1, Math.round(avg)));
}

const reviewsGrid = $("#reviewsGrid");
if (reviewsGrid) {
  const reviewCard = (r) => `
    <figure class="review">
      <div class="review-photo"><img src="${r.img}" alt="${(r.name || "Happy customer")} — ${r.topic}, customer cake photo" loading="lazy" draggable="false"></div>
    </figure>
  `;
  /* column count must mirror the CSS breakpoint: 4 columns above 1020px,
     2 columns below (otherwise the 4 tracks wrap into 2 rows of 2) */
  const colsQuery = window.matchMedia("(max-width: 1020px)");
  const buildReviews = () => {
    const COLUMNS = colsQuery.matches ? 2 : 4;
    const cols = Array.from({ length: COLUMNS }, () => []);
    REVIEWS.forEach((r, i) => cols[i % COLUMNS].push(r));

    reviewsGrid.innerHTML = cols.map(col => `
      <div class="rev-col">
        <div class="rev-track">${col.map(reviewCard).join("")}${col.map(reviewCard).join("")}</div>
      </div>
    `).join("");

    $$(".rev-track", reviewsGrid).forEach(track => {
      const half = Math.ceil(track.scrollHeight / 2);
      const speed = 62;
      track.style.animationDuration = Math.max(10, half / speed) + "s";
    });
  };
  buildReviews();
  if (typeof colsQuery.addEventListener === "function") colsQuery.addEventListener("change", buildReviews);
}

/* ------------------------------------------------------------
   8b. PREMIUM GRID — gap-less mosaic, rebuilds on breakpoint
   Row canvases mirror the CSS: 4/3/2 columns of square cells,
   2 rows per canvas. Patterns below always fill the canvas.
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   8b. PREMIUM GRID — gap-less mosaic, rebuilds on breakpoint
   Row canvases mirror the CSS: 6 cols (>=621px) or 3 cols
   (<=620px), 2 rows per canvas. Patterns below always fill the canvas
   exactly — 6 items per 6-col canvas, 3 per 3-col canvas.
   ------------------------------------------------------------ */
const premiumGrid = $("#premiumGrid");
if (premiumGrid && DB.get("premium").length) {
  /* 6-col canvas (12 cells): A = bigL + bigR + 4 smalls,
     B = tall + big mid + 2 tall + 2 smalls (alternate) */
  const ROW6 = [
    [
      { gridArea: "1 / 1 / 3 / 3" },
      { gridArea: "1 / 4 / 3 / 6" },
      { gridArea: "1 / 3 / 2 / 4" },
      { gridArea: "1 / 6 / 2 / 7" },
      { gridArea: "2 / 3 / 3 / 4" },
      { gridArea: "2 / 6 / 3 / 7" }
    ],
    [
      { gridArea: "1 / 1 / 3 / 2" },
      { gridArea: "1 / 2 / 3 / 4" },
      { gridArea: "1 / 4 / 3 / 5" },
      { gridArea: "1 / 5 / 3 / 6" },
      { gridArea: "1 / 6 / 2 / 7" },
      { gridArea: "2 / 6 / 3 / 7" }
    ]
  ];
  /* 3-col canvas (6 cells): [bigL + 2 smalls] [2 smalls + bigR] */
  const ROW3 = [
    [
      { gridArea: "1 / 1 / 3 / 3" },
      { gridArea: "1 / 3 / 2 / 4" },
      { gridArea: "2 / 3 / 3 / 4" }
    ],
    [
      { gridArea: "1 / 1 / 2 / 2" },
      { gridArea: "2 / 1 / 3 / 2" },
      { gridArea: "1 / 2 / 3 / 4" }
    ]
  ];

  const premQuery3 = window.matchMedia("(max-width: 620px)");
  const premCols = () => (premQuery3.matches ? 3 : 6);
  const premPattern = (cols) => (cols === 6 ? ROW6 : ROW3);

  const buildPremium = () => {
    const cakes = DB.get("premium");
    const cols = premCols();
    const pattern = premPattern(cols);
    const perRow = pattern[0].length;
    const total = Math.ceil(cakes.length / perRow) * perRow;
    const rows = [];
    let i = 0;
    while (i < total) {
      const slots = pattern[rows.length % pattern.length];
      const row = [];
      slots.forEach(slot => { if (i < total) { row.push({ slot, cake: cakes[i % cakes.length] }); i++; } });
      if (row.length) rows.push(row);
    }

    const rowHtml = rows.map(row => `
      <div class="premium-row" data-cols="${cols}">
        ${row.map(({ slot, cake }) => `
          <a class="prem-item" href="order.html" style="grid-area: ${slot.gridArea};" aria-label="Premium cake photo" tabindex="0">
            <img src="${cake.img}" alt="Premium cake" loading="lazy" draggable="false">
          </a>
        `).join("")}
      </div>
    `).join("");

    premiumGrid.innerHTML = `<div class="premium-track">${rowHtml}${rowHtml}</div>`;

    /* speed: ~60 px/s */
    const track = premiumGrid.querySelector(".premium-track");
    if (track) {
      const half = track.scrollWidth / 2;
      track.style.animationDuration = Math.max(14, half / 60) + "s";
    }

    /* index-based deep link */
    premiumGrid.querySelectorAll(".prem-item").forEach((el, idx) => {
      el.href = `order.html#premium:${idx % cakes.length}`;
      el.setAttribute("aria-label", `Premium cake ${(idx % cakes.length) + 1} — view on order page`);
    });
  };
  buildPremium();
  if (typeof premQuery3.addEventListener === "function") premQuery3.addEventListener("change", buildPremium);
}

/* ------------------------------------------------------------
   8c. SITE DATA — headings, categories, story, hero background
   Elements are marked with data-h-eyebrow / data-h-title /
   ids in index.html; fall back to the baked-in markup when the
   store value is empty.
   ------------------------------------------------------------ */
function applySiteData() {
  const H = DB.get("headings") || {};
  $$("[data-h-eyebrow]").forEach(el => {
    if (H[el.dataset.hEyebrow]) el.textContent = H[el.dataset.hEyebrow];
  });
  $$("[data-h-title]").forEach(el => {
    if (H[el.dataset.hTitle]) el.innerHTML = H[el.dataset.hTitle];
  });

  /* categories row — rebuilt from data */
  const cats = DB.get("cats") || [];
  const catsRow = $("#catsRow");
  if (catsRow && cats.length) {
    catsRow.innerHTML = cats.map(c => `
      <a class="cat-card reveal" href="#menu" data-scroll>
        <img src="${c.img}" alt="${c.imgAlt || c.title}" loading="lazy">
        <div class="cat-info">
          <h3>${c.title}</h3>
          <span class="cat-link">${c.link} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </div>
      </a>
    `).join("");
    $$("[data-scroll]", catsRow).forEach(a => a.addEventListener("click", smoothScrollTo));
    observeReveals(catsRow);
  }

  /* story section */
  const st = DB.get("story") || {};
  const smImg = $("#storyMediaImg"); if (smImg && st.media) smImg.src = st.media;
  const fB = $("#storyFloatB"); if (fB && st.floatB) fB.textContent = st.floatB;
  const fS = $("#storyFloatSmall"); if (fS && st.floatSmall) fS.textContent = st.floatSmall;
  const lead = $("#storyLead"); if (lead && st.lead) lead.textContent = st.lead;
  const paras = $("#storyParas");
  if (paras && st.paragraphs && st.paragraphs.length) {
    paras.innerHTML = st.paragraphs.map(p => `<p>${p}</p>`).join("");
  }
  const facts = $("#storyFacts");
  if (facts && st.facts && st.facts.length) {
    facts.innerHTML = st.facts.map(f => `<div class="cell"><b>${f.b}</b><small>${f.small}</small></div>`).join("");
  }
  const sigN = $("#storySigName"); if (sigN && st.sigName) sigN.textContent = st.sigName;
  const sigR = $("#storySigRole"); if (sigR && st.sigRole) sigR.textContent = st.sigRole;

  /* hero background image (set from the admin panel) */
  const heroBg = DB.get("hero") || {};
  const hero = $("#home");
  const HERO_BG_DEFAULT = "/assets/hero-background-image/bg.jpg";
  if (hero) {
    let bg = heroBg.bg || HERO_BG_DEFAULT;
    if (!/^(\/|data:|https?:|blob:)/.test(bg)) bg = "/assets/hero-background-image/" + bg.replace(/^.*[\\/]/, "");
    hero.classList.add("has-bg");
    hero.style.setProperty("--hero-bg", `url("${bg}")`);
    const nav = $("#nav"); if (nav) nav.classList.add("hero-bg-active");
  }
}

/* ------------------------------------------------------------
   9. FAQ ACCORDION — built from site data (first item open)
   ------------------------------------------------------------ */
function buildFaq() {
  const accordion = $("#accordion");
  if (!accordion) return;
  accordion.innerHTML = DB.get("faq").map((f, i) => `
    <div class="acc-item${i === 0 ? " open" : ""}">
      <button class="acc-btn" type="button" aria-expanded="${i === 0 ? "true" : "false"}">
        ${f.q}
        <span class="acc-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
      </button>
      <div class="acc-panel">
        <div class="acc-panel-inner">${f.a}</div>
      </div>
    </div>
  `).join("");
  bindFaq();
}
function bindFaq() {
  $$(".acc-item").forEach(item => {
    const btn = $(".acc-btn", item);
    const panel = $(".acc-panel", item);
    if (!btn || !panel) return;
    const inner = $(".acc-panel-inner", panel);
    const setOpen = (open) => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const target = open !== undefined ? open : !expanded;
      item.classList.toggle("open", target);
      btn.setAttribute("aria-expanded", target ? "true" : "false");
      panel.style.maxHeight = target ? inner.scrollHeight + "px" : "";
      if (target) {
        $$(".acc-item", item.closest(".accordion")).forEach(other => {
          if (other !== item && other.classList.contains("open")) other.querySelector(".acc-btn").click();
        });
      }
    };
    btn.addEventListener("click", () => setOpen());
  });
}
/* set initial height for the open item so CSS transition works */
window.__accInit = () => {
  $$(".acc-item.open .acc-panel").forEach(p => { p.style.maxHeight = ($(".acc-panel-inner", p)).scrollHeight + "px"; });
};
window.addEventListener("load", window.__accInit);
window.addEventListener("resize", window.__accInit);

/* ------------------------------------------------------------
   10. REVEAL ON SCROLL
    ------------------------------------------------------------ */
observeReveals();

/* ------------------------------------------------------------
   11. SCROLL-TO-TOP
   ------------------------------------------------------------ */
const scrollTop = $("#scrollTop");
if (scrollTop) {
  window.addEventListener("scroll", () => {
    scrollTop.classList.toggle("show", window.scrollY > 700);
  }, { passive: true });
  scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
}

/* ------------------------------------------------------------
   12. CURSOR GLOW + TILT
   ------------------------------------------------------------ */
const blob = $("#cursorBlob");
if (blob && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
  let raf = null;
  window.addEventListener("mousemove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      blob.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      if (!blob.classList.contains("show")) blob.classList.add("show");
      raf = null;
    });
  }, { passive: true });
  document.addEventListener("mouseleave", () => blob.classList.remove("show"));
}

/* ---- gentle tilt on hero float cards ---- */
if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
  $$("[data-tilt]").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - .5;
      const dy = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `translateY(-3px) rotate(${dx * 3}deg) rotateY(${dx * 6}deg) scale(1.02)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transition = "transform .5s var(--ease)";
      card.style.transform = "";
      setTimeout(() => { card.style.transition = ""; }, 500);
    });
  });
}

/* ------------------------------------------------------------
   13. INIT + YEAR
   ------------------------------------------------------------ */
$("#year") && ($("#year").textContent = new Date().getFullYear());

/* The script is loaded at the end of <body>, DOM is ready —
   but guard anyway in case of deferred/async loading. */
function init() {
  applySiteData();
  buildFaq();
  buildFilters();
  render();
  window.__accInit && window.__accInit();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}