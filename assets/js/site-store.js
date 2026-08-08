/* ============================================================
   SITE STORE — persistence layer for Delightful Baking & Cooking
   ------------------------------------------------------------
   Pages read via DB.get() → defaults + saved overlay.
   Admin (admin.html) writes via DB.save() → localStorage
   (and MongoDB Atlas Data API when connected in Settings).

   Usage:
     DB.get()          → full merged data object
     DB.get("products")→ one collection
     DB.save(data)     → persist overlay + notify listeners
     DB.reset()        → back to baked-in defaults
     DB.exportJSON()   → download-ready string
     DB.importJSON(s)  → restore from a previous export
     DB.hash(pw)       → salted sha-256 hex (admin login)
     DB.mongoPull() / DB.mongoPush() / DB.mongoTest()
   ============================================================ */
window.DB = (function () {
  "use strict";

  var KEY = "db_site_v1";
  var ORDERS_KEY = "db_orders_v1";
  var LS = null;
  try { LS = window.localStorage; } catch (e) { LS = null; }

  var listeners = [];
  var overlay = null;
  var mongoState = { status: "local", lastSync: null, error: "" };

  function readLS() {
    if (!LS) return null;
    try { return JSON.parse(LS.getItem(KEY) || "null"); } catch (e) { return null; }
  }

  function writeLS(obj) {
    if (!LS) return false;
    try { LS.setItem(KEY, JSON.stringify(obj)); return true; } catch (e) { return false; }
  }

  function defaults() {
    return window.DB_DEFAULTS || {};
  }

  /* strip leftover <em> tags from heading values (legacy data cleanup) */
  function stripEmTags(val) {
    if (typeof val !== "string") return val;
    return val.replace(/<\/?em>/g, "");
  }

  function merged() {
    var d = defaults();
    var o = readLS();
    var data = o && o.data ? o.data : null;
    if (!data) return d;
    var out = {};
    Object.keys(d).forEach(function (k) { out[k] = data[k] !== undefined ? data[k] : d[k]; });
    /* sanitize headings — remove any <em> tags stored from old defaults */
    if (out.headings && typeof out.headings === "object") {
      Object.keys(out.headings).forEach(function (k) {
        out.headings[k] = stripEmTags(out.headings[k]);
      });
    }
    return out;
  }

  function get(key) {
    var m = merged();
    return key ? m[key] : m;
  }

  function emit() {
    listeners.forEach(function (fn) { try { fn(); } catch (e) {} });
  }

  function save(data, opts) {
    opts = opts || {};
    var payload = { v: 1, savedAt: new Date().toISOString(), data: data || merged() };
    var ok = writeLS(payload);
    overlay = payload;
    if (ok) emit();
    if (opts.push !== false) mongoPush().catch(function () {});
    return ok;
  }

  function reset() {
    if (LS) LS.removeItem(KEY);
    overlay = null;
    mongoState = { status: "local", lastSync: null, error: "" };
    emit();
    return true;
  }

  function exportJSON() {
    return JSON.stringify({ v: 1, savedAt: new Date().toISOString(), data: merged() }, null, 2);
  }

  function importJSON(str) {
    var parsed;
    try { parsed = JSON.parse(str); } catch (e) { return false; }
    var data = parsed && parsed.data ? parsed.data : parsed;
    if (!data || typeof data !== "object") return false;
    return save(data, { push: false });
  }

  /* ---- hashing (admin credentials) ---- */
  function hash(pw) {
    var s = get("settings") || {};
    var salt = s.adminSalt || "dbc-admin-v1";
    var data = new TextEncoder().encode(salt + pw);
    if (window.crypto && window.crypto.subtle) {
      return crypto.subtle.digest("SHA-256", data).then(function (buf) {
        var b = new Uint8Array(buf);
        var hex = "";
        for (var i = 0; i < b.length; i++) hex += b[i].toString(16).padStart(2, "0");
        return hex;
      });
    }
    return Promise.resolve(legacyHash(salt + pw));
  }

  function legacyHash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return "legacy:" + h.toString(16);
  }

  /* ---- orders (localStorage + Atlas sync via Netlify Function) ---- */
  function getOrders() {
    /* check overlay first (Atlas data pulled on page load) */
    var m = merged();
    if (m && m.orders && m.orders.length) {
      /* sync Atlas orders into localStorage so it stays consistent */
      try { LS.setItem(ORDERS_KEY, JSON.stringify(m.orders)); } catch (e) {}
      return m.orders;
    }
    try { return JSON.parse(LS.getItem(ORDERS_KEY) || "[]"); }
    catch (e) { return []; }
  }

  function saveOrders(orders) {
    try { LS.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch (e) {}
    /* also update overlay */
    var m = merged();
    m.orders = orders || [];
    overlay = { v: 1, savedAt: new Date().toISOString(), data: m };
    writeLS(overlay);
    /* sync to Atlas via Netlify Function */
    mongoFn("push", "orders", { items: orders || [] }).catch(function () {});
  }

  /* ---- MongoDB via Netlify Function (server-side driver) ---- */
  var COLLECTIONS = {
    site: { _id: "main", fields: ["story", "headings", "cats", "hero", "order", "settings"] },
    products: { _id: "all", items: true },
    premium: { _id: "all", items: true },
    reviews: { _id: "all", items: true },
    faq: { _id: "all", items: true },
    orders: { _id: "all", items: true }
  };

  function mongoFn(action, collection, data) {
    return fetch("/.netlify/functions/mongo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, collection: collection, data: data })
    }).then(function (res) {
      return res.json().then(function (j) {
        if (!res.ok || !j.ok) throw new Error(j.error || "HTTP " + res.status);
        return j;
      });
    });
  }

  function isConfigured() {
    /* the Netlify Function is always deployed — test with a lightweight pull */
    return mongoFn("pull", "site").then(function () { return true; }).catch(function () { return false; });
  }

  function mongoTest() {
    return mongoFn("pull", "site")
      .then(function () { mongoState.status = "connected"; mongoState.error = ""; return true; });
  }

  function mongoPull() {
    var jobs = Object.keys(COLLECTIONS).map(function (name) {
      var spec = COLLECTIONS[name];
      return mongoFn("pull", name)
        .then(function (res) {
          var doc = res.data;
          if (!doc) return { name: name, found: false };
          if (spec.items) return { name: name, found: true, items: doc.items || [] };
          var o = {};
          spec.fields.forEach(function (f) { if (doc[f] !== undefined) o[f] = doc[f]; });
          return { name: name, found: true, fields: o };
        })
        .catch(function () { return { name: name, found: false }; });
    });

    return Promise.all(jobs).then(function (results) {
      var cur = merged();
      results.forEach(function (r) {
        if (!r.found) return;
        if (r.items) { cur[r.name] = r.items; }
        else { Object.keys(r.fields).forEach(function (k) { cur[k] = r.fields[k]; }); }
      });
      save(cur, { push: false });
      mongoState.status = "connected";
      mongoState.lastSync = new Date().toISOString();
      mongoState.error = "";
      return true;
    });
  }

  function mongoPush() {
    var d = merged();
    var jobs = Object.keys(COLLECTIONS).map(function (name) {
      var spec = COLLECTIONS[name];
      var pushData;
      if (spec.items) {
        pushData = { items: d[name] || [] };
      } else {
        pushData = {};
        spec.fields.forEach(function (f) { pushData[f] = d[f]; });
      }
      return mongoFn("push", name, pushData);
    });
    return Promise.all(jobs).then(function () {
      mongoState.status = "connected";
      mongoState.lastSync = new Date().toISOString();
      mongoState.error = "";
      return true;
    }).catch(function (err) {
      mongoState.error = err && err.message ? err.message : String(err);
      mongoState.status = "error";
      throw err;
    });
  }

  function mongoStatus() {
    return mongoState;
  }

  /* silent background sync on page load when connected */
  var ready = mongoPull().catch(function () {});

  return {
    get: get,
    defaults: defaults,
    save: save,
    reset: reset,
    exportJSON: exportJSON,
    importJSON: importJSON,
    hash: hash,
    legacyHash: legacyHash,
    getOrders: getOrders,
    saveOrders: saveOrders,
    on: function (fn) { listeners.push(fn); return fn; },
    off: function (fn) {
      var i = listeners.indexOf(fn);
      if (i > -1) listeners.splice(i, 1);
    },
    ready: ready,
    mongoPull: mongoPull,
    mongoPush: mongoPush,
    mongoTest: mongoTest,
    mongoStatus: mongoStatus,
    mongoConfigured: isConfigured
  };
})();
