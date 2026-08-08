/* ============================================================
   ORDER WIZARD — 3 steps: category → design → confirm
   Visual, icon-first, mobile friendly. No text walls.
   Premium cakes skip design step.
   ============================================================ */
(function () {
  "use strict";

  const FB_PAGE = "https://www.facebook.com/profile.php?id=61569872870733";
  const TAKA = "\u09F3";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }

  /* ------------------------------------------------------------
     SVG ICONS — replacing all emojis
     ------------------------------------------------------------ */
  const ICO = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    cake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3M12 8v3M17 8v3"/><path d="M7 4h.01M12 4h.01M17 4h.01"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>',
    confirm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
  };

  /* ------------------------------------------------------------
     1. MENU DATA — from site-data.js defaults + the admin
     overlay (site-store.js). The "premium" category is
     materialized from the premium cake list.
     ------------------------------------------------------------ */
  const ORDER = DB.get("order") || {};

  const CATEGORIES = (ORDER.categories || []).map(c => {
    if (c.ref === "premium") {
      const list = DB.get("premium").map(cake => ({
        name: cake.name || "Premium Custom Cake",
        price: cake.price != null ? cake.price : null,
        img: cake.img
      }));
      return Object.assign({}, c, { items: list });
    }
    return c;
  });

  const FINISHES = ORDER.finishes || [];

  /* cake photos shown in the site's menu — design library */
  const DESIGN_LIBRARY = ORDER.designLibrary || [];

  /* ------------------------------------------------------------
     2. STATE
     ------------------------------------------------------------ */
  const state = {
    step: 1,
    cat: null,
    item: null,
    finish: null,
    design: null,   // { mode: "upload", url, name } | { mode: "lib", img, name }
    qty: 1,
    msg: ""
  };

  const el = {
    stepsNav: $(".ord-steps"),
    panes: $$(".ord-pane"),
    catGrid: $("#catGrid"),
    pickChip: $("#pickChip"),
    finishRow: $("#finishRow"),
    designUploadBtn: $("#designUploadBtn"),
    designLibBtn: $("#designLibBtn"),
    designFile: $("#designFile"),
    designUploadBox: $("#designUploadBox"),
    designThumb: $("#designThumb"),
    designFileName: $("#designFileName"),
    designClear: $("#designClear"),
    libGrid: $("#libGrid"),
    qtyVal: $("#qtyVal"),
    msgInput: $("#msgInput"),
    summary: $("#orderSummary"),
    barTotal: $("#barTotal"),
    barQty: $("#barQty"),
    btnNext: $("#btnNext"),
    btnNextLbl: $("#btnNextLbl"),
    toast: $("#toast"),
    toastMsg: $("#toastMsg"),
    fName: $("#fName"),
    fPhone: $("#fPhone"),
    fDate: $("#fDate"),
    fAddr: $("#fAddr"),
    fAddrRow: $("#fAddrRow"),
    segBtns: $$(".seg-btn")
  };

  const priceFmt = (n) => TAKA + n.toLocaleString("en-IN");
  const priceLbl = (n) => (n == null || isNaN(n)) ? "Price on request" : priceFmt(n);
  const isPremium = () => state.cat === "premium";
  const thumbOf = (item) => item.img
    ? `<img src="${item.img}" alt="${item.name}" loading="lazy" draggable="false">`
    : ICO.cake;

  /* ------------------------------------------------------------
     3. RENDER
     ------------------------------------------------------------ */
  function renderCategories() {
    el.catGrid.innerHTML = CATEGORIES.map(c => `
      <button class="cat-tile ${state.cat === c.id ? "is-on" : ""}" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">
        <span class="cat-check" aria-hidden="true">${ICO.check}</span>
        <span class="cat-ico" aria-hidden="true">${c.icon}</span>
        <span class="cat-name">${c.name}</span>
        <span class="cat-sub">${c.sub} · ${c.items.length}</span>
      </button>
    `).join("");

    $$(".cat-tile", el.catGrid).forEach(btn => {
      btn.addEventListener("click", () => {
        state.cat = btn.dataset.cat;
        renderCategories();
        openCategory();
        requestAnimationFrame(() => {
          const wrap = $(".prod-wrap", el.catGrid.parentElement);
          if (wrap) {
            const opts = { block: "start", behavior: reduceMotion() ? "auto" : "smooth" };
            wrap.scrollIntoView(opts);
          }
        });
      });
    });
  }

  function openCategory() {
    const cat = CATEGORIES.find(c => c.id === state.cat);
    if (!cat) return;
    const prem = cat.id === "premium";
    const div = document.createElement("div");
    div.className = "prod-wrap";
    div.innerHTML = `
      <div class="prod-title">
        <b>${cat.name}</b>
        <span>tap to pick</span>
      </div>
      <div class="prod-grid${prem ? " prod-grid--premium" : ""}">
        ${cat.items.map((it, i) => `
          <button class="prod-box${prem ? " prod-box--premium" : ""} ${state.item === cat.id + ":" + i ? "is-on" : ""}" data-item="${cat.id}:${i}">
            <span class="prod-ico${prem ? " prod-ico--lg" : ""}" aria-hidden="true">${thumbOf(it)}</span>
            <span class="prod-meta">
              <span class="prod-name">${it.name}</span>
              <span class="prod-price">${priceLbl(it.price)}</span>
            </span>
          </button>
        `).join("")}
      </div>
    `;
    $$(".cat-tile", el.catGrid).forEach(t => {
      const catId = t.dataset.cat;
      const isOn = state.cat === catId;
      t.classList.toggle("is-on", isOn);
      t.setAttribute("aria-pressed", String(isOn));
      if (isOn) {
        const existing = $(".prod-wrap", el.catGrid.parentElement);
        if (existing) existing.remove();
        el.catGrid.after(div);
      }
    });
    /* fix: only keep one wrap */
    $$(".prod-wrap", el.catGrid.parentElement).forEach((w, idx, arr) => {
      if (idx < arr.length - 1) w.remove();
    });

    $$(".prod-box", div).forEach(box => {
      box.addEventListener("click", () => {
        const [cid, idx] = box.dataset.item.split(":");
        state.item = cid + ":" + idx;
        state.finish = null;
        state.design = null;
        state.qty = 1;
        state.msg = "";
        if (el.designFile) el.designFile.value = "";
        el.msgInput.value = "";
        openCategory();
        el.pickChip.innerHTML = pickChipHTML();
        refreshBar();
        /* premium cakes skip design step — go straight to confirm */
        if (isPremium()) {
          state.finish = FINISHES.length > 0 ? FINISHES[0].id : "standard";
          goStep(3);
        } else {
          renderFinishes();
          goStep(2);
        }
      });
    });
  }

  function pickChipHTML() {
    const [cid, idx] = (state.item || ":").split(":");
    const cat = CATEGORIES.find(c => c.id === cid);
    const it = cat ? cat.items[+idx] : null;
    if (!it) return "";
    return `
      <span class="prod-ico" aria-hidden="true">${thumbOf(it)}</span>
      <span class="prod-meta">
        <span class="prod-name">${it.name}</span>
        <span class="prod-price">${cat.name} · ${priceLbl(it.price)}</span>
      </span>
    `;
  }

  function renderFinishes() {
    el.finishRow.innerHTML = FINISHES.map(f => `
      <button class="opt-chip ${state.finish === f.id ? "is-on" : ""}" data-finish="${f.id}" aria-pressed="${state.finish === f.id}">
        <span class="oc-ico" aria-hidden="true">${f.ico}</span>
        <span>${f.label}</span>
      </button>
    `).join("");
    $$(".opt-chip", el.finishRow).forEach(chip => {
      chip.addEventListener("click", () => {
        state.finish = chip.dataset.finish;
        renderFinishes();
        refreshBar();
      });
    });
  }

  /* design reference — upload vs library */
  function renderDesign() {
    const d = state.design;
    el.designUploadBtn.classList.toggle("is-on", !!d && d.mode === "upload");
    el.designLibBtn.classList.toggle("is-on", !!d && d.mode === "lib");

    if (d && d.mode === "upload") {
      el.designThumb.src = d.url;
      el.designFileName.textContent = d.name;
      el.designUploadBox.hidden = false;
    } else {
      el.designUploadBox.hidden = true;
    }

    el.libGrid.innerHTML = DESIGN_LIBRARY.map((s, i) => `
      <button class="lib-item ${d && d.mode === "lib" && s.img === d.img ? "is-on" : ""}" data-lib="${i}" aria-pressed="${d && d.mode === "lib" && s.img === d.img}">
        <img src="${s.img}" alt="${s.name}" loading="lazy" draggable="false">
        <span class="lib-check" aria-hidden="true">${ICO.check}</span>
      </button>
    `).join("");
    $$(".lib-item", el.libGrid).forEach(btn => {
      btn.addEventListener("click", () => {
        const s = DESIGN_LIBRARY[+btn.dataset.lib];
        state.design = { mode: "lib", img: s.img, name: s.name };
        renderDesign();
        refreshBar();
      });
    });
  }

  function renderSummary() {
    const [cid, idx] = (state.item || ":").split(":");
    const cat = CATEGORIES.find(c => c.id === cid);
    const it = cat ? cat.items[+idx] : null;
    if (!it) return;
    const finish = FINISHES.find(f => f.id === state.finish);
    const total = it.price == null ? null : it.price * state.qty;
    const prem = cid === "premium";
    const designLbl = prem
      ? "Premium cake — selected from our collection"
      : (state.design
        ? (state.design.mode === "upload" ? "Uploaded photo (" + state.design.name + ")" : "Gallery \u00b7 " + state.design.name)
        : "\u2014");
    el.summary.innerHTML = `
      <div class="sum-row">
        <span class="prod-ico" aria-hidden="true">${thumbOf(it)}</span>
        <span>
          <span class="sum-name">${it.name}</span>
          <span class="sum-sub">${[cat.name, it.topic].filter(Boolean).join(" \u00b7 ")}</span>
        </span>
      </div>
      <div class="sum-lines">
        <div class="sl"><span>Item</span><b>${it.name}</b></div>
        ${!prem ? `<div class="sl"><span>Finish</span><b>${finish ? finish.label : "\u2014"}</b></div>` : ""}
        <div class="sl"><span>Design</span><b>${designLbl}</b></div>
        <div class="sl"><span>Quantity</span><b>${state.qty} \u00d7 ${priceLbl(it.price)}</b></div>
        ${state.msg ? `<div class="sl"><span>Message</span><b>${state.msg}</b></div>` : ""}
        <div class="sl"><span>Customisation</span><b>Added ${ICO.sparkle}</b></div>
      </div>
      <div class="sum-total">
        <span>Total (estimated)</span>
        <b>${priceLbl(total)}</b>
      </div>
    `;
  }

  function refreshBar() {
    const [cid, idx] = (state.item || ":").split(":");
    const cat = CATEGORIES.find(c => c.id === cid);
    const it = cat ? cat.items[+idx] : null;
    if (it) {
      el.barTotal.textContent = priceLbl(it.price == null ? null : it.price * state.qty);
      el.barQty.textContent = it.name + " \u00b7 qty " + state.qty;
    } else {
      el.barTotal.textContent = TAKA + "0";
      el.barQty.textContent = "\u2014";
    }
    const valid = state.step === 1 ? !!state.item : (state.step === 2 ? !!state.item : true);
    el.btnNext.disabled = !valid;
  }

  /* ------------------------------------------------------------
     4. NAVIGATION
     ------------------------------------------------------------ */
  function goStep(n) {
    state.step = n;
    el.panes.forEach((p, i) => p.classList.toggle("is-active", i + 1 === n));
    el.stepsNav.classList.toggle("is-2", n >= 2);
    el.stepsNav.classList.toggle("is-3", n >= 3);
    $$(".ord-step", el.stepsNav).forEach((s, i) => {
      s.classList.toggle("is-on", i + 1 === n);
      s.classList.toggle("ord-step--done", i + 1 < n);
    });
    if (n === 2) {
      el.pickChip.innerHTML = pickChipHTML();
      renderFinishes();
      renderDesign();
    }
    if (n === 3) {
      renderSummary();
      el.btnNextLbl.textContent = "Send order";
    } else {
      el.btnNextLbl.textContent = "Next";
    }
    refreshBar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  el.btnNext.addEventListener("click", () => {
    if (state.step === 1) {
      if (!state.item) return toast("Pick a cake first");
      goStep(2);
    } else if (state.step === 2) {
      if (!state.finish) return toast("Pick a finish");
      if (!state.design) return toast("Add a design \u2014 upload or gallery");
      goStep(3);
    } else {
      sendOrder();
    }
  });

  $$(".ord-step", el.stepsNav).forEach((s, i) => {
    s.addEventListener("click", () => { if (state.item || i === 0) goStep(i + 1); });
  });

  $$("[data-back]").forEach(b => {
    b.addEventListener("click", () => goStep(+b.dataset.back));
  });

  /* quantity */
  $("#qtyMinus").addEventListener("click", () => { state.qty = Math.max(1, state.qty - 1); el.qtyVal.textContent = state.qty; refreshBar(); });
  $("#qtyPlus").addEventListener("click", () => { state.qty = Math.min(20, state.qty + 1); el.qtyVal.textContent = state.qty; refreshBar(); });

  /* message */
  el.msgInput.addEventListener("input", () => { state.msg = el.msgInput.value.trim(); refreshBar(); });

  /* design reference — upload */
  el.designUploadBtn.addEventListener("click", () => {
    if (el.designFile.value !== "") el.designFile.value = "";
    el.designFile.click();
  });
  el.designFile.addEventListener("change", () => {
    const f = el.designFile.files && el.designFile.files[0];
    if (!f || !f.type.startsWith("image/")) return toast("That's not an image");
    const reader = new FileReader();
    reader.onload = () => {
      state.design = { mode: "upload", url: reader.result, name: f.name };
      renderDesign();
      refreshBar();
    };
    reader.readAsDataURL(f);
  });
  el.designClear.addEventListener("click", () => {
    state.design = null;
    el.designFile.value = "";
    renderDesign();
    refreshBar();
  });

  /* design reference — library */
  el.designLibBtn.addEventListener("click", () => {
    el.libGrid.hidden = !el.libGrid.hidden;
    if (!el.libGrid.hidden) {
      el.designUploadBox.hidden = true;
      renderDesign();
      setTimeout(() => el.libGrid.scrollIntoView({ block: "nearest", behavior: "smooth" }), 60);
    }
  });

  /* delivery / pickup */
  el.segBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      el.segBtns.forEach(b => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-checked", String(on));
      });
      el.fAddrRow.hidden = mode !== "delivery";
      if (mode !== "delivery") el.fAddr.value = "";
    });
  });

  /* ------------------------------------------------------------
     5. SEND ORDER → save + confirm
     ------------------------------------------------------------ */
  function sendOrder() {
    const [cid, idx] = (state.item || ":").split(":");
    const cat = CATEGORIES.find(c => c.id === cid);
    const it = cat ? cat.items[+idx] : null;
    if (!it) return;
    const finish = FINISHES.find(f => f.id === state.finish);
    const prem = cid === "premium";
    const designLbl = prem
      ? "Premium cake"
      : (state.design
        ? (state.design.mode === "upload" ? "Uploaded: " + state.design.name : "Gallery: " + state.design.name)
        : "\u2014");
    const name = el.fName.value.trim();
    const phone = el.fPhone.value.trim();
    const date = el.fDate.value;
    const mode = $(".seg-btn.is-on") ? $(".seg-btn.is-on").dataset.mode : "pickup";
    const addr = mode === "delivery" ? el.fAddr.value.trim() : "";

    if (!name) return toast("Tell us your name");
    if (!phone) return toast("Phone number please");

    /* build order object */
    var order = {
      id: "o-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      status: "new",
      customer: { name: name, phone: phone, date: date, mode: mode, address: addr },
      item: {
        name: it.name,
        category: cat.name,
        finish: finish ? finish.label : "",
        design: designLbl,
        qty: state.qty,
        msg: state.msg,
        price: it.price,
        total: it.price == null ? null : it.price * state.qty,
        img: it.img || "",
        ico: it.ico || "",
        premium: prem
      }
    };

    /* save to localStorage */
    try {
      var orders = JSON.parse(localStorage.getItem("db_orders_v1") || "[]");
      orders.unshift(order);
      localStorage.setItem("db_orders_v1", JSON.stringify(orders));
    } catch (e) { /* ignore */ }

    /* send email notification to shop owner */
    fetch("/.netlify/functions/send-order-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    }).catch(function () { /* non-blocking */ });

    /* show confirmation */
    showConfirmation(order);
  }

  function showConfirmation(order) {
    var it = order.item;
    var cust = order.customer;
    var priceStr = it.total != null ? "\u09F3" + it.total.toLocaleString("en-IN") : "Price on request";
    var qtyStr = it.qty > 1 ? " x" + it.qty : "";
    var finishStr = it.finish ? " \u2014 " + it.finish : "";
    var addrStr = cust.address ? " \u2014 " + cust.address : "";
    var modeStr = cust.mode === "delivery" ? "Delivery" : "Pickup";
    var imgHTML = it.img
      ? '<img class="ord-confirm-img" src="' + it.img + '" alt="' + it.name + '" loading="lazy">'
      : '<div class="ord-confirm-ico">' + ICO.cake + '</div>';
    var dateRow = cust.date
      ? '<div class="ord-cl-row"><span>Needed by</span><b>' + cust.date + '</b></div>'
      : '';

    var confirmPane = document.createElement("section");
    confirmPane.className = "ord-pane is-active ord-confirm-pane";
    confirmPane.id = "confirmPane";
    confirmPane.innerHTML =
      '<div class="ord-confirm">' +
        '<div class="ord-confirm-check">' + ICO.confirm + '</div>' +
        '<h1 class="ord-confirm-title">Order <em>received</em></h1>' +
        '<p class="ord-confirm-sub">We\'ll review and reply on Messenger or phone.</p>' +
        '<div class="ord-confirm-card">' +
          imgHTML +
          '<div class="ord-confirm-info">' +
            '<b>' + it.name + '</b>' +
            '<small>' + it.category + qtyStr + finishStr + '</small>' +
            '<span class="ord-confirm-price">' + priceStr + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="ord-confirm-list">' +
          '<div class="ord-cl-row"><span>Name</span><b>' + cust.name + '</b></div>' +
          '<div class="ord-cl-row"><span>Phone</span><b>' + cust.phone + '</b></div>' +
          '<div class="ord-cl-row"><span>Mode</span><b>' + modeStr + addrStr + '</b></div>' +
          dateRow +
        '</div>' +
        '<div class="ord-confirm-actions">' +
          '<a class="btn-ord btn-ord--primary" href="index.html" style="text-decoration:none;text-align:center;display:block">' +
            ICO.home + ' Back to home' +
          '</a>' +
          '<a class="btn-ord btn-ord--outline" href="' + FB_PAGE + '" target="_blank" rel="noopener" style="text-decoration:none;text-align:center;display:block">' +
            ICO.send + ' Chat on Messenger' +
          '</a>' +
        '</div>' +
      '</div>';

    /* hide all existing panes, step nav, bar */
    el.panes.forEach(p => p.classList.remove("is-active"));
    el.panes.forEach(p => p.style.display = "none");
    el.stepsNav.style.display = "none";
    var bar = document.querySelector(".ord-bar");
    if (bar) bar.style.display = "none";

    /* insert confirmation */
    var page = document.querySelector(".ord-page");
    var toastEl = document.getElementById("toast");
    page.insertBefore(confirmPane, toastEl);
  }

  /* ------------------------------------------------------------
     6. TOAST
     ------------------------------------------------------------ */
  let toastTimer;
  function toast(msg) {
    el.toastMsg.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), 3000);
  }

  /* ------------------------------------------------------------
     7. INIT
     ------------------------------------------------------------ */
  renderCategories();
  renderFinishes();
  refreshBar();

  /* date min = today */
  const today = new Date().toISOString().split("T")[0];
  if (el.fDate) el.fDate.min = today;

  /* deep-link support: #cat:idx preselects (e.g. index?o=special:2) */
  const deep = window.location.hash.replace(/^#/, "");
  if (deep && deep.includes(":")) {
    const [cid, idx] = deep.split(":");
    const cat = CATEGORIES.find(c => c.id === cid);
    if (cat && cat.items[+idx]) {
      state.cat = cid;
      state.item = cid + ":" + idx;
      renderCategories();
      openCategory();
      el.pickChip.innerHTML = pickChipHTML();
      refreshBar();
      if (cid === "premium") {
        state.finish = FINISHES.length > 0 ? FINISHES[0].id : "standard";
        goStep(3);
      } else {
        renderFinishes();
        goStep(2);
      }
    }
  }
})();
