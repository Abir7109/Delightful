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
   Edit here. price : number → shows "টাক্য + int"  (see below)
                  null   → shows "Price on request"
   ------------------------------------------------------------ */
const PRODUCT_RECORDS = [
  {
    img: "assets/img/products/p01.jpg",
    name: "Signature Chocolate Truffle",
    tag: "Cakes",
    price: null,
    blurb: "Deep cocoa sponge under a slick of truffle chocolate, finished the way we like it — honest, dark and not overly sweet.",
    desc: "It's the cake most of our regulars start with. A moist cocoa sponge, a dark chocolate ganache that sets slowly, and a finish of hand-shaped truffle curls on top. Made in round and square, eggless possible on request."
  },
  {
    img: "assets/img/products/p02.jpg",
    name: "Rose-Scented Milk Delight",
    tag: "Cream · Cake",
    price: null,
    desc: "Light sponge soaked in rose-kissed milk, layered with fresh whipped cream and a soft rose water finish. Cooling, fragrant, and exactly the cake for warm evenings in Cumilla."
  },
  {
    img: "assets/img/products/p03.jpg",
    name: "Butter & Cocoa Loaf",
    tag: "Baked · Loaf",
    price: null,
    blurb: "A home-bakery classic — dense cocoa pound loaf with a crackly top that tastes of real butter.",
    desc: "No premix, no shortcuts: butter, eggs, cocoa and time. It slices clean, toasts beautifully, and pairs with chai better than most things in this world."
  },
  {
    img: "assets/img/products/p04.jpg",
    name: "Velvet Bloom Celebration Cake",
    tag: "Custom · Cake",
    price: null,
    blurb: "Soft velvet layers under a thick cream bloom — sized for birthdays and small anniversaries.",
    desc: "Airy layers of velvet sponge, whipped cream, and a gentle bloom finish. This is our default celebration cake — pick red velvet, chocolate or vanilla and tell us the size."
  },
  {
    img: "assets/img/products/p05.jpg",
    name: "Caramel Ribbon Cake",
    tag: "Cream · Cake",
    price: null,
    blurb: "Butterscotch ribbons pulled through a light sponge, crowned with toasted caramel.",
    desc: "A light sponge layered with homemade butterscotch caramel and whipped cream, finished with a crisp caramel drip and toasted shavings. The birthday favourite."
  },
  {
    img: "assets/img/products/p06.jpg",
    name: "Custom Fondant Cake",
    tag: "Custom · Fondant",
    price: null,
    blurb: "Entirely fondant-finished, made to order for engagements, Eid and every celebration.",
    desc: "For the days that deserve more than cream. We sculpt, theme and finish fondant cakes around any idea — send a reference or a rough sketch and we'll confirm the design with you first."
  },
  {
    img: "assets/img/products/p07.jpg",
    name: "Black Forest Jar",
    tag: "Jar · Dessert",
    price: null,
    blurb: "Cherry, cream and chocolate stacked in layers you can carry anywhere.",
    desc: "Our best-selling grab-and-go. Chocolate sponge, cream, sweet cherries and a chocolate cap sealed in a jar — with a spoon. Great for parties, teachers' days and little celebrations."
  },
  {
    img: "assets/img/products/p08.jpg",
    name: "Citrus Pound Cake",
    tag: "Bak · Loaf",
    price: null,
    blurb: "Zesty orange pound cake with a crackly sugar top and a dense, slow-baked heart.",
    desc: "Bright citrus against a dense, buttery crumb. Kept simple so the flavour does the talking — lovely with tea, lovely on its own."
  },
  {
    img: "assets/img/products/p09.jpg",
    name: "Mahogany Fudge Brownie",
    tag: "Brownie · Dessert",
    price: null,
    blurb: "Dense, fudgy and midnight-dark with a glossy cap and gooey centre.",
    desc: "Not a cake, not a biscuit — a proper fudgy brownie. Chocolate-forward, sides set, centre soft. Boxes of 4 and 9, ideal for gifting or hoarding."
  },
  {
    img: "assets/img/products/p10.jpg",
    name: "Pista Cream Tart",
    tag: "Custom · Cake",
    price: null,
    blurb: "Pistachio cream pooled over a short crust and showered with roasted crumble.",
    desc: "A crisp pistachio-crusted tart filled with cream and finished with a roasted pistachio crumble. Elegant, nutty, and a little bit fancy."
  },
  {
    img: "assets/img/products/p11.jpg",
    name: "Tiny Star Cupcakes",
    tag: "Cupcake · Dessert",
    price: null,
    blurb: "A dozen individually swirled cupcakes — pick your colours and flavours.",
    desc: "Soft vanilla or chocolate sponge, swirled cream on top, and your pick of colour for the party. Sold in sets of six or twelve."
  },
  {
    img: "assets/img/products/p12.jpg",
    name: "Pastel Celebration Box",
    tag: "Cupcake · Gift",
    price: null,
    blurb: "A custom box of mixed treats for card parties, mehfils and late-night cravings.",
    desc: "A little box of everything — mini pastries, jars, brownies and cupcakes arranged around your guest count. Great for Eid, mehfils, birthdays and treating yourself."
  }
];

const PRODUCTS = PRODUCT_RECORDS.map((p, i) => ({ ...p, id: i }));

const FB_PAGE = "https://www.facebook.com/messages/t/delightfulbakingandcooking";
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
$$("[data-scroll]").forEach(a => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("#")) return;
    const el = $(href);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", href);
  });
});

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
  qvOrder.href = messengerLink(p.name);
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

function messengerLink(product) {
  const tale = [PAGE_NAME, "Delivery around Chandina, Cumilla.", "— D&B"].join("\n");
  const text = encodeURIComponent(
    `Assalamualaikum!\n\nI'd like to order this from ${product}:\n\nCan you confirm availability and price for this week?\n\n${tale}`
  );
  return `${FB_PAGE}?text=${text}`;
}

function orderFlow(product) {
  if (reduceMotion) {
    window.open(messengerLink(product), "_blank");
    return;
  }
  showToast(`Opening chat · ${product}`);
  setTimeout(() => window.open(messengerLink(product), "_blank"), 550);
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
const REVIEWS = [
  { img: "assets/img/reviews/r1.jpg", name: "Labiba & Family", topic: "Birthday cake", time: "2 weeks ago", quote: "The cake was lighter than I expected and the cream was proper fresh. My daughter kept asking for another slice before we'd even cut the whole thing." },
  { img: "assets/img/reviews/r2.jpg", name: "Sadia", topic: "Black Forest Jar", time: "1 week ago", quote: "Ordered a couple of jars for a small gathering — they arrived neat, stacked safely, and vanished by the end of the evening." },
  { img: "assets/img/reviews/r3.jpg", name: "Photo orders", topic: "Custom theme", time: "just now", quote: "Sent a rough idea, came back better than the picture I sent. Confirmed the design, colour and size before baking — very patient people." },
  { img: "assets/img/reviews/r4.jpg", name: "Family Gifting", topic: "Pastel box", time: "3 days ago", quote: "I gifted the celebration box to my cousin. The mix of brownie, jar and mini bites meant nobody had to share a single flavour." },
  { img: "assets/img/reviews/r5.jpg", name: "", topic: "From the page", time: "recent", quote: "Repeat customer here. The loaf has that dense, buttery weight you only get when someone is actually baking and not just assembling." },
  { img: "assets/img/reviews/r6.jpg", name: "Eid Mezban", topic: "Themed set", time: "last month", quote: "Ordered a themed dessert set for our Eid get-together — every piece arrived labelled and the kids were fighting over the jars first." }
];

const reviewsGrid = $("#reviewsGrid");
if (reviewsGrid) {
  reviewsGrid.innerHTML = REVIEWS.map((r, i) => `
    <figure class="review reveal ${"d" + ((i % 4) + 1)}">
      <div class="review-photo"><img src="${r.img}" alt="${(r.name || "Happy customer")} — ${r.topic}, customer cake photo" loading="lazy"></div>
      <div class="review-body">
        ${stars(5)}
        <blockquote class="review-quote"><q>${r.quote}</q></blockquote>
        <figcaption class="review-person">
          <span class="avatar" aria-hidden="true">${(r.name || "H").split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2)}</span>
          <span>
            <b>${r.name || "Happy customer"}</b>
            <small>${r.topic} · ${r.time}</small>
          </span>
        </figcaption>
      </div>
    </figure>
  `).join("");
  observeReveals(reviewsGrid);
}

/* ------------------------------------------------------------
   9. FAQ ACCORDION
   ------------------------------------------------------------ */
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
  // keep the first item open by default
});
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
  buildFilters();
  render();
  window.__accInit && window.__accInit();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}