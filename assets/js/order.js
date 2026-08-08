/* ============================================================
   ORDER WIZARD — 3 steps: category → design → confirm
   Visual, icon-first, mobile friendly. No text walls.
   ============================================================ */
(function () {
  "use strict";

  const FB_PAGE = "https://www.facebook.com/messages/t/delightfulbakingandcooking";
  const TAKA = "\u09F3";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const emojiFrom = (item) => item.ico || "🍰";
  const thumbOf = (item) => item.img
    ? `<img src="${item.img}" alt="${item.name}" loading="lazy" draggable="false">`
    : emojiFrom(item);

  /* ------------------------------------------------------------
     3. RENDER
     ------------------------------------------------------------ */
  function renderCategories() {
    el.catGrid.innerHTML = CATEGORIES.map(c => `
      <button class="cat-tile ${state.cat === c.id ? "is-on" : ""}" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">
        <span class="cat-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
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
    const div = document.createElement("div");
    div.className = "prod-wrap";
    div.innerHTML = `
      <div class="prod-title">
        <b>${cat.name}</b>
        <span>tap to pick</span>
      </div>
      <div class="prod-grid">
        ${cat.items.map((it, i) => `
          <button class="prod-box ${state.item === cat.id + ":" + i ? "is-on" : ""}" data-item="${cat.id}:${i}">
            <span class="prod-ico" aria-hidden="true">${thumbOf(it)}</span>
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
        renderFinishes();
        refreshBar();
        goStep(2);
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
        <span class="lib-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
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
    const designLbl = state.design
      ? (state.design.mode === "upload" ? `Uploaded photo (${state.design.name})` : `Gallery · ${state.design.name}`)
      : "—";
    el.summary.innerHTML = `
      <div class="sum-row">
        <span class="prod-ico" aria-hidden="true">${thumbOf(it)}</span>
        <span>
          <span class="sum-name">${it.name}</span>
          <span class="sum-sub">${[cat.name, it.topic].filter(Boolean).join(" · ")}</span>
        </span>
      </div>
      <div class="sum-lines">
        <div class="sl"><span>Item</span><b>${it.name}</b></div>
        <div class="sl"><span>Finish</span><b>${finish ? finish.label : "—"}</b></div>
        <div class="sl"><span>Design</span><b>${designLbl}</b></div>
        <div class="sl"><span>Quantity</span><b>${state.qty} × ${priceLbl(it.price)}</b></div>
        ${state.msg ? `<div class="sl"><span>Message</span><b>${state.msg}</b></div>` : ""}
        <div class="sl"><span>Customisation</span><b>Added ✨</b></div>
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
      el.barQty.textContent = `${it.name} · qty ${state.qty}`;
    } else {
      el.barTotal.textContent = TAKA + "0";
      el.barQty.textContent = "—";
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
      if (!state.item) return toast("Pick a cake first 🎂");
      goStep(2);
    } else if (state.step === 2) {
      if (!state.finish) return toast("Pick a finish 🍰");
      if (!state.design) return toast("Add a design — upload or gallery 🎨");
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
    if (!f || !f.type.startsWith("image/")) return toast("That's not an image 📷");
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
    const designLbl = state.design
      ? (state.design.mode === "upload" ? `Uploaded: ${state.design.name}` : `Gallery: ${state.design.name}`)
      : "—";
    const name = el.fName.value.trim();
    const phone = el.fPhone.value.trim();
    const date = el.fDate.value;
    const mode = $(".seg-btn.is-on") ? $(".seg-btn.is-on").dataset.mode : "pickup";
    const addr = mode === "delivery" ? el.fAddr.value.trim() : "";

    if (!name) return toast("Tell us your name 💬");
    if (!phone) return toast("Phone number please 📱");

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
        ico: it.ico || ""
      }
    };

    /* save to localStorage */
    try {
      var orders = JSON.parse(localStorage.getItem("db_orders_v1") || "[]");
      orders.unshift(order);
      localStorage.setItem("db_orders_v1", JSON.stringify(orders));
    } catch (e) { /* ignore */ }

    /* show confirmation */
    showConfirmation(order);
  }

  function showConfirmation(order) {
    var it = order.item;
    var cust = order.customer;
    var date = new Date(order.timestamp);
    var timeStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    var confirmPane = document.createElement("section");
    confirmPane.className = "ord-pane is-active";
    confirmPane.id = "confirmPane";
    confirmPane.innerHTML = `
      <div class="ord-confirm">
        <div class="ord-confirm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
        </div>
        <h1 class="ord-confirm-title">Order <em>received!</em></h1>
        <p class="ord-confirm-sub">We'll review your order and get back to you soon.</p>

        <div class="ord-confirm-card">
          ${it.img ? `<img class="ord-confirm-img" src="${it.img}" alt="${it.name}" loading="lazy">` : `<div class="ord-confirm-ico">${it.ico || "🍰"}</div>`}
          <div class="ord-confirm-meta">
            <b>${it.name}</b>
            <small>${it.category}${it.qty > 1 ? " × " + it.qty : ""}</small>
            ${it.finish ? `<small>Finish: ${it.finish}</small>` : ""}
            ${it.msg ? `<small>Message: "${it.msg}"</small>` : ""}
            <small class="ord-confirm-price">${it.total != null ? "৳" + it.total.toLocaleString("en-IN") : "Price on request"}</small>
          </div>
        </div>

        <div class="ord-confirm-details">
          <div class="ord-confirm-row"><span>Name</span><b>${cust.name}</b></div>
          <div class="ord-confirm-row"><span>Phone</span><b>${cust.phone}</b></div>
          ${cust.date ? `<div class="ord-confirm-row"><span>Needed by</span><b>${cust.date}</b></div>` : ""}
          <div class="ord-confirm-row"><span>Mode</span><b>${cust.mode === "delivery" ? "Delivery" : "Pickup"}${cust.address ? " — " + cust.address : ""}</b></div>
          <div class="ord-confirm-row"><span>Order ID</span><small>${order.id}</small></div>
          <div class="ord-confirm-row"><span>Date</span><small>${timeStr}</small></div>
        </div>

        <div class="ord-confirm-actions">
          <a class="btn-ord btn-ord--done" href="index.html" style="text-decoration:none;text-align:center">Back to home</a>
        </div>
      </div>
    `;

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
      renderFinishes();
      refreshBar();
      goStep(2);
    }
  }
})();
