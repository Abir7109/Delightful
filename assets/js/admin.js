/* ============================================================
   ADMIN — Delightful Baking & Cooking
   Login (username + salted hash) → tabs → CRUD over site-store.
   ============================================================ */
(function () {
  "use strict";

  window.addEventListener("error", function (ev) {
    var el = document.getElementById("loginErr");
    if (el) {
      el.hidden = false;
      el.textContent = "Page error: " + (ev.message || "unknown") + (ev.filename ? " @" + ev.filename.split("/").pop() + ":" + ev.lineno : "");
    }
  });

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var TAKA = "\u09F3";

  var SESSION_KEY = "db_admin_ok";
  var HERO_PRESET = "/assets/hero-background-image/bg.jpg";
  var MAX_PRODUCT_IMG = 640;
  var MAX_HERO_IMG = 1600;

  var data = null;
  var saveTimer = null;

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function priceBadge(p) {
    if (p == null) return '<span class="adm-item-price wip">Price on request</span>';
    var n = Number(p);
    if (isNaN(n)) return '<span class="adm-item-price">' + esc(p) + "</span>";
    return '<span class="adm-item-price">' + TAKA + n.toLocaleString("en-IN") + "</span>";
  }

  function toast(msg, isErr) {
    var t = $("#admToast");
    t.textContent = msg;
    t.classList.toggle("err", !!isErr);
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function move(arr, i, dir) {
    var j = i + dir;
    if (j < 0 || j >= arr.length) return false;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    return true;
  }

  function saveData(opts) {
    opts = opts || {};
    var ok = DB.save(data, { push: opts.push !== false });
    updateSavedAt();
    if (opts.push !== false) updateBadge();
    return ok;
  }

  function saveDataSoft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { saveData({ push: false }); }, 350);
  }

  function updateSavedAt() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem("db_site_v1") || "null"); } catch (e) {}
    $("#savedAt").textContent = o && o.savedAt ? "Last saved " + new Date(o.savedAt).toLocaleString() : "Not saved yet";
  }

  function updateBadge() {
    var st = DB.mongoStatus();
    var b = $("#storageBadge");
    if (st.status === "connected") { b.textContent = "Atlas connected"; b.className = "adm-badge is-ok"; }
    else if (st.status === "error") { b.textContent = "Sync error"; b.className = "adm-badge is-err"; }
    else { b.textContent = "Local mode"; b.className = "adm-badge"; }
    var stEl = $("#mStatus");
    if (stEl) {
      var txt = "Status: " + (st.status === "connected" ? "connected" : st.status === "error" ? "error" : "not connected");
      if (st.lastSync) txt += " · last sync " + new Date(st.lastSync).toLocaleString();
      if (st.error) txt += " · " + st.error;
      stEl.textContent = txt;
    }
  }

  function readImage(file, maxDim) {
    return new Promise(function (res, rej) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var k = Math.min(1, maxDim / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * k));
          var h = Math.max(1, Math.round(img.height * k));
          var c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          res(c.toDataURL("image/jpeg", 0.78));
        };
        img.onerror = function () { rej(new Error("Bad image")); };
        img.src = reader.result;
      };
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  function download(name, content, mime) {
    var blob = new Blob([content], { type: mime || "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  }

  /* ---------------- drawer ---------------- */
  var drawerCtx = null;

  function openDrawer(title, bodyHTML, ctx) {
    drawerCtx = ctx || {};
    $("#drawerTitle").textContent = title;
    $("#drawerBody").innerHTML = bodyHTML;
    $("#drawerDelete").hidden = !ctx || !ctx.canDelete;
    $("#drawer").classList.add("show");
    document.body.style.overflow = "hidden";
    var first = $("#drawerBody input, #drawerBody textarea, #drawerBody select");
    if (first) first.focus();
  }

  function closeDrawer() {
    $("#drawer").classList.remove("show");
    document.body.style.overflow = "";
    drawerCtx = null;
  }

  function imgFieldHtml(src, id) {
    return '<div class="adm-img-field">' +
      '<img id="' + id + '" src="' + (src ? esc(src) : "") + '" alt="" class="' + (src ? "" : "placeholder") + '">' +
      '<label class="adm-btn adm-btn-sm" for="' + id + 'File">' + (src ? "Change image" : "Upload image") + "</label>" +
      '<input type="file" id="' + id + 'File" accept="image/*" hidden>' +
      "</div>";
  }

  /* ---------------- login (Netlify Function) ---------------- */
  function showApp() {
    $("#loginView").hidden = true;
    $("#appView").hidden = false;
    window.scrollTo(0, 0);
    data = clone(DB.get());
    renderAll();
    updateSavedAt();
    updateBadge();
    if (DB.mongoConfigured()) {
      DB.mongoPull().then(renderAll).catch(function () {});
    }
  }

  var loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var user = (document.getElementById("loginUser").value || "").trim();
      var pass = document.getElementById("loginPass").value || "";
      var btn = document.getElementById("loginBtn");
      var errEl = document.getElementById("loginErr");

      btn.disabled = true;
      btn.textContent = "Checking\u2026";
      errEl.hidden = true;

      console.log("[login] calling /.netlify/functions/login ...");

      fetch("/.netlify/functions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass })
      })
        .then(function (resp) {
          console.log("[login] HTTP", resp.status);
          return resp.text();
        })
        .then(function (txt) {
          console.log("[login] body:", txt);
          var d;
          try { d = JSON.parse(txt); } catch (e) { d = { error: "Bad response: " + txt.slice(0, 200) }; }
          if (d.ok) {
            sessionStorage.setItem(SESSION_KEY, d.token || "1");
            showApp();
          } else {
            errEl.hidden = false;
            errEl.textContent = d.error || "Wrong username or password.";
          }
          btn.disabled = false;
          btn.textContent = "Sign in";
        })
        .catch(function (err) {
          console.error("[login] fetch error:", err);
          errEl.hidden = false;
          errEl.textContent = "Could not reach login service. " + (err && err.message ? err.message : "");
          btn.disabled = false;
          btn.textContent = "Sign in";
        });
    });
  }

  $("#logoutBtn").addEventListener("click", function () {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  /* ---------------- tabs ---------------- */
  var TABS = {
    dashboard: "Dashboard",
    orders: "Orders",
    menu: "Menu products",
    premium: "Premium cakes",
    reviews: "Reviews",
    story: "Story / About",
    faq: "FAQ",
    headings: "Headings",
    settings: "Settings"
  };

  function switchTab(name) {
    $$(".adm-nav-item").forEach(function (b) { b.classList.toggle("is-on", b.dataset.tab === name); });
    $$(".adm-panel").forEach(function (p) { p.classList.toggle("is-on", p.dataset.panel === name); });
    $("#tabTitle").textContent = TABS[name] || name;
  }

  $("#admNav").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]");
    if (b) switchTab(b.dataset.tab);
  });

  /* ---------------- dashboard ---------------- */
  function getOrders() {
    try { return JSON.parse(localStorage.getItem("db_orders_v1") || "[]"); }
    catch (e) { return []; }
  }

  function saveOrders(orders) {
    try { localStorage.setItem("db_orders_v1", JSON.stringify(orders)); } catch (e) {}
  }

  var ORDER_STATUSES = ["new", "confirmed", "completed", "cancelled"];
  var STATUS_COLORS = { new: "#e67e22", confirmed: "#2980b9", completed: "#27ae60", cancelled: "#c0392b" };

  function renderDashboard() {
    var avg = 0;
    if (data.reviews.length) {
      avg = data.reviews.reduce(function (a, r) { return a + (Number(r.stars) || 0); }, 0) / data.reviews.length;
    }
    var orders = getOrders();
    var newOrders = orders.filter(function (o) { return o.status === "new"; }).length;
    $("#statCards").innerHTML = [
      ["Orders", orders.length + (newOrders ? " · " + newOrders + " new" : "")],
      ["Menu products", data.products.length],
      ["Premium cakes", data.premium.length],
      ["Reviews", data.reviews.length + " · avg " + avg.toFixed(1) + "★"],
      ["FAQ items", data.faq.length]
    ].map(function (c) {
      return '<div class="adm-stat"><b>' + esc(c[1]) + "</b><span>" + esc(c[0]) + "</span></div>";
    }).join("");

    var list = data.products.slice(0, 5);
    $("#dashList").innerHTML =
      '<h3>Latest menu items</h3>' +
      '<div class="adm-list">' +
      list.map(function (p, i) {
        return '<div class="adm-item">' +
          '<img class="adm-item-thumb" src="' + esc(p.img) + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
          '<div class="adm-item-main"><b>' + esc(p.name) + "</b><small>" + esc(p.tag || "") + "</small></div>" +
          priceBadge(p.price) +
          '<div class="adm-item-actions">' +
          '<button class="adm-ico-btn" data-act="edit" data-i="' + i + '" data-pool="products" title="Edit">' + editIco() + "</button>" +
          "</div></div>";
      }).join("") +
      "</div>";
  }

  /* ---------------- orders ---------------- */
  var currentOrderFilter = "all";

  function renderOrders() {
    var orders = getOrders();
    var filtered = currentOrderFilter === "all" ? orders : orders.filter(function (o) { return o.status === currentOrderFilter; });

    if (filtered.length === 0) {
      $("#orderList").innerHTML = '<div class="adm-card"><p class="adm-muted">No orders' + (currentOrderFilter !== "all" ? " with status \"" + currentOrderFilter + "\"" : "") + " yet.</p></div>";
      return;
    }

    $("#orderList").innerHTML = filtered.map(function (o) {
      var date = new Date(o.timestamp);
      var timeStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " " + date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      var statusColor = STATUS_COLORS[o.status] || "#888";
      var item = o.item || {};
      var cust = o.customer || {};
      var imgHTML = "";
      if (item.img) {
        imgHTML = '<img class="adm-order-img" src="' + esc(item.img) + '" alt="' + esc(item.name || "") + '" loading="lazy">';
      } else if (item.ico) {
        imgHTML = '<div class="adm-order-ico">' + item.ico + "</div>";
      }
      return '<div class="adm-item adm-order" data-oid="' + o.id + '">' +
        '<div class="adm-item-main">' +
          '<div class="adm-order-top">' +
            imgHTML +
            '<div class="adm-order-info">' +
              '<div class="adm-order-head">' +
                '<b>' + esc(cust.name || "Customer") + "</b>" +
                '<span class="adm-order-status" style="background:' + statusColor + '">' + esc(o.status) + "</span>" +
              "</div>" +
              '<small class="adm-order-item-name">' + esc(item.name || "") + (item.qty > 1 ? " × " + item.qty : "") + "</small>" +
              (item.category ? '<small>' + esc(item.category) + (item.finish ? " · " + esc(item.finish) : "") + "</small>" : "") +
              (item.design && item.design !== "—" ? '<small class="adm-muted">Design: ' + esc(item.design) + "</small>" : "") +
            "</div>" +
          "</div>" +
          '<div class="adm-order-contact">' +
            '<span>📱 ' + esc(cust.phone || "N/A") + "</span>" +
            (cust.date ? '<span>📅 ' + esc(cust.date) + "</span>" : "") +
            '<span>' + (cust.mode === "delivery" ? "🛵 Delivery" : "🏠 Pickup") + (cust.address ? " — " + esc(cust.address) : "") + "</span>" +
          "</div>" +
          (item.msg ? '<div class="adm-order-msg">"' + esc(item.msg) + '"</div>' : "") +
          '<div class="adm-order-footer">' +
            '<small class="adm-muted">' + timeStr + "</small>" +
            (item.total != null ? '<b class="adm-order-price">৳' + item.total.toLocaleString("en-IN") + "</b>" : '<small class="adm-muted">Price on request</small>') +
          "</div>" +
        "</div>" +
        '<div class="adm-item-actions adm-order-actions">' +
          ORDER_STATUSES.map(function (s) {
            var active = o.status === s;
            return '<button class="adm-ico-btn' + (active ? " is-on" : "") + '" data-ostatus="' + s + '" data-oid="' + o.id + '" title="Mark ' + s + '" style="color:' + STATUS_COLORS[s] + '">' + statusIco(s) + "</button>";
          }).join("") +
          '<button class="adm-ico-btn danger" data-odel="' + o.id + '" title="Delete">' + delIco() + "</button>" +
        "</div>" +
      "</div>";
    }).join("");
  }

  function statusIco(s) {
    if (s === "new") return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
    if (s === "confirmed") return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>';
    if (s === "completed") return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  }

  function bindOrders() {
    var list = $("#orderList");
    if (!list) return;
    list.addEventListener("click", function (e) {
      var statusBtn = e.target.closest("[data-ostatus]");
      if (statusBtn) {
        var oid = statusBtn.dataset.oid;
        var newStatus = statusBtn.dataset.ostatus;
        var orders = getOrders();
        var order = orders.find(function (o) { return o.id === oid; });
        if (order) {
          order.status = newStatus;
          saveOrders(orders);
          renderOrders();
          renderDashboard();
          toast("Order marked as " + newStatus);
        }
        return;
      }
      var delBtn = e.target.closest("[data-odel]");
      if (delBtn) {
        if (!confirm("Delete this order?")) return;
        var orders = getOrders().filter(function (o) { return o.id !== delBtn.dataset.odel; });
        saveOrders(orders);
        renderOrders();
        renderDashboard();
        toast("Order deleted");
      }
    });

    $("[data-ofilter]", list.parentElement).forEach(function (btn) {
      /* handled via parent toolbar, see below */
    });
  }

  /* order filter buttons */
  document.addEventListener("click", function (e) {
    var fbtn = e.target.closest("[data-ofilter]");
    if (!fbtn) return;
    currentOrderFilter = fbtn.dataset.ofilter;
    $$(".adm-orders-filters .adm-btn").forEach(function (b) { b.classList.toggle("is-on", b.dataset.ofilter === currentOrderFilter); });
    renderOrders();
  });

  function clearOrdersBtnBind() {
    var btn = $("#clearOrdersBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!confirm("Delete ALL orders? This cannot be undone.")) return;
      saveOrders([]);
      renderOrders();
      renderDashboard();
      toast("All orders cleared");
    });
  }

  function editIco() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  }
  function delIco() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M10 11v6M14 11v6M6 7l1 13h10l1-13M8 7V4h8v3"/></svg>';
  }
  function upIco() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  }
  function dnIco() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';
  }

  /* ---------------- products ---------------- */
  function renderProducts() {
    var q = ($("#menuSearch").value || "").toLowerCase().trim();
    var items = data.products
      .map(function (p, i) { return { p: p, i: i }; })
      .filter(function (x) {
        return !q || (x.p.name + " " + (x.p.tag || "")).toLowerCase().includes(q);
      });
    $("#productList").innerHTML = items.length
      ? items.map(function (x) {
          var p = x.p;
          return '<div class="adm-item">' +
            '<img class="adm-item-thumb" src="' + esc(p.img) + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
            '<div class="adm-item-main"><b>' + esc(p.name) + "</b><small>" + esc(p.tag || "no tag") + " · " + esc(p.blurb || (p.desc || "").slice(0, 60)) + "</small></div>" +
            priceBadge(p.price) +
            '<div class="adm-item-actions">' +
            '<button class="adm-ico-btn" data-act="up" data-i="' + x.i + '" title="Move up">' + upIco() + "</button>" +
            '<button class="adm-ico-btn" data-act="dn" data-i="' + x.i + '" title="Move down">' + dnIco() + "</button>" +
            '<button class="adm-ico-btn" data-act="edit" data-i="' + x.i + '" title="Edit">' + editIco() + "</button>" +
            '<button class="adm-ico-btn danger" data-act="del" data-i="' + x.i + '" title="Delete">' + delIco() + "</button>" +
            "</div></div>";
        }).join("")
      : '<div class="adm-card"><p class="adm-muted">No products match.</p></div>';
  }

  $("#menuSearch").addEventListener("input", renderProducts);
  $("#addProductBtn").addEventListener("click", function () { openProductDrawer(null); });

  function openProductDrawer(i) {
    var p = i == null
      ? { img: "", name: "", tag: "", price: null, blurb: "", desc: "" }
      : data.products[i];
    openDrawer(i == null ? "Add product" : "Edit product", "" +
      imgFieldHtml(p.img, "pImg") +
      '<label class="adm-f"><span>Name</span><input type="text" id="pName" value="' + esc(p.name) + '" placeholder="e.g. Signature Chocolate Truffle"></label>' +
      '<label class="adm-f"><span>Tag / category</span><input type="text" id="pTag" value="' + esc(p.tag) + '" placeholder="e.g. Cakes · Cream · Jars"></label>' +
      '<label class="adm-f"><span>Price in taka (leave empty for “Price on request”)</span><input type="number" id="pPrice" min="0" step="1" value="' + (p.price == null ? "" : p.price) + '" placeholder="leave empty"></label>' +
      '<label class="adm-f"><span>Short line (card)</span><textarea id="pBlurb" rows="2" placeholder="One tasty sentence…">' + esc(p.blurb || "") + "</textarea></label>" +
      '<label class="adm-f"><span>Full description</span><textarea id="pDesc" rows="4" placeholder="The longer story…">' + esc(p.desc || "") + "</textarea></label>",
      { canDelete: i != null, index: i, pool: "products" });
    bindImgField("pImg", MAX_PRODUCT_IMG);
  }

  /* ---------------- premium ---------------- */
  function renderPremium() {
    $("#premiumHint").textContent = data.premium.length + " cakes · prices set here appear on the homepage and order page.";
    $("#premiumList").innerHTML = data.premium.map(function (p, i) {
      return '<div class="adm-tile">' +
        '<img src="' + esc(p.img) + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
        '<div class="adm-tile-body"><b>' + esc(p.name || "Premium Custom Cake") + "</b>" +
        '<div class="adm-tile-actions">' +
        '<button class="adm-ico-btn" data-act="edit" data-i="' + i + '" title="Edit">' + editIco() + "</button>" +
        '<button class="adm-ico-btn" data-act="del" data-i="' + i + '" title="Delete">' + delIco() + "</button>" +
        '<button class="adm-ico-btn" data-act="up" data-i="' + i + '" title="Move up">' + upIco() + "</button>" +
        '<button class="adm-ico-btn" data-act="dn" data-i="' + i + '" title="Move down">' + dnIco() + "</button>" +
        "</div>" + priceBadge(p.price) +
        "</div></div>";
    }).join("");
  }

  $("#addPremiumBtn").addEventListener("click", function () { openPremiumDrawer(null); });

  function openPremiumDrawer(i) {
    var p = i == null ? { img: "", name: "", price: null } : data.premium[i];
    openDrawer(i == null ? "Add premium cake" : "Edit premium cake", "" +
      imgFieldHtml(p.img, "pmImg") +
      '<label class="adm-f"><span>Name</span><input type="text" id="pmName" value="' + esc(p.name || "") + '" placeholder="e.g. Premium Custom Cake"></label>' +
      '<label class="adm-f"><span>Price in taka (leave empty for “Price on request”)</span><input type="number" id="pmPrice" min="0" step="1" value="' + (p.price == null ? "" : p.price) + '" placeholder="leave empty"></label>',
      { canDelete: i != null, index: i, pool: "premium" });
    bindImgField("pmImg", MAX_PRODUCT_IMG);
  }

  /* ---------------- reviews ---------------- */
  function renderReviews() {
    var avg = data.reviews.length
      ? (data.reviews.reduce(function (a, r) { return a + (Number(r.stars) || 0); }, 0) / data.reviews.length).toFixed(1)
      : "0";
    $("#reviewsHint").textContent = data.reviews.length + " reviews · the homepage average shows " + avg + "★";
    $("#reviewList").innerHTML = data.reviews.map(function (r, i) {
      return '<div class="adm-item">' +
        '<img class="adm-item-thumb" src="' + esc(r.img) + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
        '<div class="adm-item-main"><b>' + esc(r.name || "Happy customer") + "</b>" +
        "<small>" + esc(r.topic || "") + " · " + esc(r.time || "") + " · " + (Number(r.stars) || 0) + "★</small>" +
        '<small style="white-space:normal">' + esc(r.quote) + "</small></div>" +
        '<div class="adm-item-actions">' +
        '<button class="adm-ico-btn" data-act="edit" data-i="' + i + '" title="Edit">' + editIco() + "</button>" +
        '<button class="adm-ico-btn" data-act="del" data-i="' + i + '" title="Delete">' + delIco() + "</button>" +
        '<button class="adm-ico-btn" data-act="up" data-i="' + i + '" title="Move up">' + upIco() + "</button>" +
        '<button class="adm-ico-btn" data-act="dn" data-i="' + i + '" title="Move down">' + dnIco() + "</button>" +
        "</div></div>";
    }).join("");
  }

  $("#addReviewBtn").addEventListener("click", function () { openReviewDrawer(null); });

  function openReviewDrawer(i) {
    var r = i == null
      ? { img: "", name: "", topic: "", time: "", stars: 5, quote: "" }
      : data.reviews[i];
    var starOpts = [5, 4, 3, 2, 1].map(function (n) {
      return '<option value="' + n + '"' + (Number(r.stars) === n ? " selected" : "") + ">" + n + " stars</option>";
    }).join("");
    openDrawer(i == null ? "Add review" : "Edit review", "" +
      imgFieldHtml(r.img, "rImg") +
      '<label class="adm-f"><span>Customer name</span><input type="text" id="rName" value="' + esc(r.name) + '" placeholder="e.g. Sadia"></label>' +
      '<div class="adm-fields two"><label class="adm-f"><span>Topic</span><input type="text" id="rTopic" value="' + esc(r.topic) + '" placeholder="e.g. Birthday cake"></label>' +
      '<label class="adm-f"><span>When</span><input type="text" id="rTime" value="' + esc(r.time) + '" placeholder="e.g. 2 weeks ago"></label></div>' +
      '<label class="adm-f"><span>Rating</span><select class="adm-input" id="rStars">' + starOpts + "</select></label>" +
      '<label class="adm-f"><span>Quote</span><textarea id="rQuote" rows="4" placeholder="What they said…">' + esc(r.quote) + "</textarea></label>",
      { canDelete: i != null, index: i, pool: "reviews" });
    bindImgField("rImg", MAX_PRODUCT_IMG);
  }

  /* ---------------- FAQ ---------------- */
  function renderFaq() {
    $("#faqList").innerHTML = data.faq.map(function (f, i) {
      return '<div class="adm-item">' +
        '<div class="adm-item-main"><b>' + esc(f.q) + "</b><small>" + esc(f.a) + "</small></div>" +
        '<div class="adm-item-actions">' +
        '<button class="adm-ico-btn" data-act="edit" data-i="' + i + '" title="Edit">' + editIco() + "</button>" +
        '<button class="adm-ico-btn" data-act="del" data-i="' + i + '" title="Delete">' + delIco() + "</button>" +
        '<button class="adm-ico-btn" data-act="up" data-i="' + i + '" title="Move up">' + upIco() + "</button>" +
        '<button class="adm-ico-btn" data-act="dn" data-i="' + i + '" title="Move down">' + dnIco() + "</button>" +
        "</div></div>";
    }).join("");
  }

  $("#addFaqBtn").addEventListener("click", function () { openFaqDrawer(null); });

  function openFaqDrawer(i) {
    var f = i == null ? { q: "", a: "" } : data.faq[i];
    openDrawer(i == null ? "Add question" : "Edit question", "" +
      '<label class="adm-f"><span>Question</span><input type="text" id="fQ" value="' + esc(f.q) + '"></label>' +
      '<label class="adm-f"><span>Answer</span><textarea id="fA" rows="5">' + esc(f.a) + "</textarea></label>",
      { canDelete: i != null, index: i, pool: "faq" });
  }

  /* ---------------- delegated list actions ---------------- */
  function bindLists() {
    ["productList", "premiumList", "reviewList", "faqList", "dashList"].forEach(function (id) {
      var el = $("#" + id);
      el.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-act]");
        if (!btn) return;
        var act = btn.dataset.act;
        var i = Number(btn.dataset.i);
        var pool = btn.dataset.pool || (id === "dashList" ? "products" : id === "productList" ? "products" : id === "premiumList" ? "premium" : id === "reviewList" ? "reviews" : "faq");
        if (act === "edit") { openPool(pool, i); return; }
        if (act === "del") {
          if (!confirm("Delete this item?")) return;
          data[pool].splice(i, 1);
          saveData(); renderAll();
          return;
        }
        if (act === "up" || act === "dn") {
          if (move(data[pool], i, act === "up" ? -1 : 1)) { saveData(); renderAll(); }
        }
      });
    });
  }

  function openPool(pool, i) {
    if (pool === "products") openProductDrawer(i);
    else if (pool === "premium") openPremiumDrawer(i);
    else if (pool === "reviews") openReviewDrawer(i);
    else if (pool === "faq") openFaqDrawer(i);
  }

  /* drawer save/delete/close */
  $("#drawerSave").addEventListener("click", function () {
    var ctx = drawerCtx;
    if (!ctx) return;
    var pool = ctx.pool;
    var rec;
    if (pool === "products") {
      rec = {
        img: $("#pImg").getAttribute("src") || "",
        name: $("#pName").value.trim(),
        tag: $("#pTag").value.trim(),
        price: parsePrice($("#pPrice").value),
        blurb: $("#pBlurb").value.trim(),
        desc: $("#pDesc").value.trim()
      };
      if (!rec.name) return toast("Give it a name first", true);
    } else if (pool === "premium") {
      rec = {
        img: $("#pmImg").getAttribute("src") || "",
        name: $("#pmName").value.trim(),
        price: parsePrice($("#pmPrice").value)
      };
      if (!rec.img) return toast("Upload an image first", true);
    } else if (pool === "reviews") {
      rec = {
        img: $("#rImg").getAttribute("src") || "",
        name: $("#rName").value.trim(),
        topic: $("#rTopic").value.trim(),
        time: $("#rTime").value.trim(),
        stars: Number($("#rStars").value) || 5,
        quote: $("#rQuote").value.trim()
      };
      if (!rec.quote) return toast("Write the quote first", true);
    } else if (pool === "faq") {
      rec = { q: $("#fQ").value.trim(), a: $("#fA").value.trim() };
      if (!rec.q) return toast("Write the question first", true);
    } else return;

    if (ctx.index == null) data[pool].push(rec);
    else data[pool][ctx.index] = rec;
    saveData();
    renderAll();
    closeDrawer();
    toast("Saved — now on the site");
  });

  $("#drawerDelete").addEventListener("click", function () {
    var ctx = drawerCtx;
    if (!ctx || ctx.index == null) return;
    if (!confirm("Delete this item?")) return;
    data[ctx.pool].splice(ctx.index, 1);
    saveData(); renderAll(); closeDrawer();
    toast("Deleted");
  });

  $("#drawer").addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeDrawer();
  });

  function parsePrice(v) {
    var s = String(v == null ? "" : v).trim();
    if (s === "") return null;
    var n = Number(s);
    return isNaN(n) || n < 0 ? null : Math.round(n);
  }

  function bindImgField(id, maxDim) {
    var fileEl = $("#" + id + "File");
    fileEl.addEventListener("change", function () {
      var f = fileEl.files && fileEl.files[0];
      if (!f || !f.type.startsWith("image/")) return toast("That's not an image", true);
      readImage(f, maxDim).then(function (url) {
        var img = $("#" + id);
        img.src = url;
        img.classList.remove("placeholder");
        toast("Image ready — press Save");
      }).catch(function () { toast("Could not read that image", true); });
    });
  }

  /* ---------------- story ---------------- */
  function renderStory() {
    var st = data.story;
    $("#storyMediaPrev").src = st.media || "";
    $("#storyMediaPrev").classList.toggle("placeholder", !st.media);
    $("#storyFloatB").value = st.floatB || "";
    $("#storyFloatSmall").value = st.floatSmall || "";
    $("#storyLead").value = st.lead || "";
    $("#storySigName").value = st.sigName || "";
    $("#storySigRole").value = st.sigRole || "";

    $("#storyParas").innerHTML = st.paragraphs.map(function (p, i) {
      return '<div class="para-row">' +
        '<label class="adm-f"><span>Paragraph ' + (i + 1) + '</span><textarea data-para="' + i + '" rows="3">' + esc(p) + "</textarea></label>" +
        '<button class="adm-ico-btn danger" data-para-del="' + i + '" title="Remove">' + delIco() + "</button>" +
        "</div>";
    }).join("");

    $("#storyFacts").innerHTML = st.facts.map(function (f, i) {
      return '<div class="fact-row">' +
        '<label class="adm-f"><span>Fact ' + (i + 1) + ' — big</span><input type="text" data-fact-b="' + i + '" value="' + esc(f.b) + '"></label>' +
        '<label class="adm-f"><span>Fact ' + (i + 1) + ' — small</span><input type="text" data-fact-s="' + i + '" value="' + esc(f.small) + '"></label>' +
        '<button class="adm-ico-btn danger" data-fact-del="' + i + '" title="Remove">' + delIco() + "</button>" +
        "</div>";
    }).join("");
  }

  function bindStory() {
    $("#storyMediaFile").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      readImage(f, MAX_HERO_IMG).then(function (url) {
        data.story.media = url;
        saveDataSoft();
        renderStory();
      }).catch(function () { toast("Could not read that image", true); });
    });
    $("#storyFloatB").addEventListener("input", function () { data.story.floatB = this.value; saveDataSoft(); });
    $("#storyFloatSmall").addEventListener("input", function () { data.story.floatSmall = this.value; saveDataSoft(); });
    $("#storyLead").addEventListener("input", function () { data.story.lead = this.value; saveDataSoft(); });
    $("#storySigName").addEventListener("input", function () { data.story.sigName = this.value; saveDataSoft(); });
    $("#storySigRole").addEventListener("input", function () { data.story.sigRole = this.value; saveDataSoft(); });

    $("#storyParas").addEventListener("input", function (e) {
      var t = e.target.closest("[data-para]");
      if (t) data.story.paragraphs[Number(t.dataset.para)] = t.value;
      saveDataSoft();
    });
    $("#storyParas").addEventListener("click", function (e) {
      var b = e.target.closest("[data-para-del]");
      if (!b) return;
      data.story.paragraphs.splice(Number(b.dataset.paraDel), 1);
      saveDataSoft(); renderStory();
    });
    $("#addParaBtn").addEventListener("click", function () {
      data.story.paragraphs.push("");
      renderStory();
      saveDataSoft();
    });

    $("#storyFacts").addEventListener("input", function (e) {
      var b = e.target.closest("[data-fact-b]");
      var s = e.target.closest("[data-fact-s]");
      if (b) data.story.facts[Number(b.dataset.factB)].b = b.value;
      if (s) data.story.facts[Number(s.dataset.factS)].small = s.value;
      saveDataSoft();
    });
    $("#storyFacts").addEventListener("click", function (e) {
      var b = e.target.closest("[data-fact-del]");
      if (!b) return;
      data.story.facts.splice(Number(b.dataset.factDel), 1);
      saveDataSoft(); renderStory();
    });
  }

  /* ---------------- headings ---------------- */
  var HEADING_FIELDS = [
    "premiumKicker", "premiumTitle", "menuEyebrow", "menuTitle",
    "catsEyebrow", "catsTitle", "storyEyebrow", "reviewsEyebrow",
    "reviewsTitle", "faqEyebrow", "faqTitle", "processEyebrow", "processTitle"
  ];

  function renderHeadings() {
    HEADING_FIELDS.forEach(function (k) {
      var el = $("#h_" + k);
      if (el) el.value = data.headings[k] || "";
    });
  }

  function bindHeadings() {
    HEADING_FIELDS.forEach(function (k) {
      var el = $("#h_" + k);
      if (el) el.addEventListener("input", function () {
        data.headings[k] = this.value;
        saveDataSoft();
      });
    });
  }

  /* ---------------- settings ---------------- */
  function renderSettings() {
    var h = data.hero;
    $("#heroBgPrev").src = h.bg || "";
    $("#heroBgPrev").classList.toggle("placeholder", !h.bg);
    var s = data.settings;
    $("#mUrl").value = s.dataApiUrl || "";
    $("#mKey").value = s.apiKey || "";
    $("#mDs").value = s.dataSource || "";
    $("#mDb").value = s.database || "";
    updateBadge();
  }

  function bindSettings() {
    $("#heroBgFile").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      readImage(f, MAX_HERO_IMG).then(function (url) {
        data.hero.bg = url;
        saveDataSoft(); renderSettings();
        toast("Hero background updated");
      }).catch(function () { toast("Could not read that image", true); });
    });
    $("#heroBgPreset").addEventListener("click", function () {
      data.hero.bg = HERO_PRESET;
      saveData(); renderSettings();
      toast("Preset applied — Save changes to sync");
    });
    $("#heroBgClear").addEventListener("click", function () {
      data.hero.bg = HERO_PRESET;
      saveData(); renderSettings();
      toast("Restored the default hero background");
    });

    function readMongoFields() {
      data.settings.dataApiUrl = $("#mUrl").value.trim();
      data.settings.apiKey = $("#mKey").value.trim();
      data.settings.dataSource = $("#mDs").value.trim();
      data.settings.database = $("#mDb").value.trim() || "delightful";
    }

    function mongoAct(fn, okMsg) {
      readMongoFields();
      saveData({ push: false });
      fn().then(function (r) {
        updateBadge();
        if (r === false) return toast("Fill all connection fields first", true);
        toast(okMsg);
      }).catch(function (err) {
        updateBadge();
        toast("Connection failed: " + (err && err.message ? err.message : "unknown"), true);
      });
    }

    $("#mTestBtn").addEventListener("click", function () {
      mongoAct(function () { return DB.mongoTest(); }, "Connected — Atlas is reachable");
    });
    $("#mPullBtn").addEventListener("click", function () {
      mongoAct(function () { return DB.mongoPull(); }, "Pulled latest data from Atlas");
    });
    $("#mSaveBtn").addEventListener("click", function () {
      mongoAct(function () {
        return DB.mongoTest().then(function () { return DB.mongoPush(); });
      }, "Connection saved + data pushed to Atlas");
    });
  }

  /* ---------------- global actions ---------------- */
  function renderAll() {
    renderDashboard();
    renderOrders();
    renderProducts();
    renderPremium();
    renderReviews();
    renderFaq();
    renderStory();
    renderHeadings();
    renderSettings();
  }

  function bindGlobal() {
    $("#saveAllBtn").addEventListener("click", function () {
      saveData();
      updateBadge();
      toast(DB.mongoConfigured() ? "Saved — synced to Atlas" : "Saved locally");
    });

    $("#exportBtn").addEventListener("click", function () {
      download("delightful-site-data.json", DB.exportJSON());
      toast("Exported");
    });

    $("#importFile").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        if (DB.importJSON(String(reader.result))) {
          data = clone(DB.get());
          renderAll();
          toast("Imported — all tabs updated");
        } else toast("That file doesn't look right", true);
      };
      reader.readAsText(f);
      this.value = "";
    });

    function doReset() {
      if (!confirm("Reset ALL menu, premium, reviews, FAQ, story and headings to the built-in defaults?\n\nYour admin login and Atlas connection stay.")) return;
      var keep = clone(data.settings);
      data = clone(DB.defaults());
      data.settings = keep;
      saveData();
      renderAll();
      toast("Reset to defaults");
    }
    $("#resetBtn").addEventListener("click", doReset);
    $("#resetBtn2").addEventListener("click", doReset);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && $("#drawer").classList.contains("show")) closeDrawer();
    });
  }

  /* ---------------- boot ---------------- */
  var bootErr = null;
  try {
    bindLists();
    bindOrders();
    clearOrdersBtnBind();
    bindStory();
    bindHeadings();
    bindSettings();
    bindGlobal();
  } catch (e) {
    bootErr = e;
  }

  if (sessionStorage.getItem(SESSION_KEY)) {
    showApp();
    /* auto-refresh orders every 15 seconds */
    setInterval(function () {
      var panel = $("#panelOrders");
      if (panel && panel.classList.contains("is-active")) {
        renderOrders();
      }
    }, 15000);
  } else {
    $("#loginView").hidden = false;
    if (bootErr) {
      $("#loginErr").hidden = false;
      $("#loginErr").textContent = "Admin script error: " + bootErr.message;
    }
  }
})();
