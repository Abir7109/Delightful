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

  /* ---- MongoDB Atlas Data API ---- */
  var COLLECTIONS = {
    site: { _id: "main", fields: ["story", "headings", "cats", "hero", "order", "settings"] },
    products: { _id: "all", items: true },
    premium: { _id: "all", items: true },
    reviews: { _id: "all", items: true },
    faq: { _id: "all", items: true }
  };

  function mongoCfg() {
    var s = get("settings") || {};
    return { url: s.dataApiUrl || "", key: s.apiKey || "", ds: s.dataSource || "", db: s.database || "delightful" };
  }

  function isConfigured() {
    var c = mongoCfg();
    return !!(c.url && c.key && c.ds && c.db);
  }

  function apiRequest(action, body) {
    var c = mongoCfg();
    var url = c.url.replace(/\/+$/, "") + "/action/" + action;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": c.key,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        dataSource: c.ds,
        database: c.db,
        collection: body.collection,
        filter: body.filter || {},
        replacement: body.replacement,
        upsert: body.upsert === true
      })
    }).then(function (res) {
      return res.json().then(function (j) {
        if (!res.ok) throw new Error(j && j.error ? j.error : "HTTP " + res.status);
        return j;
      });
    });
  }

  function mongoTest() {
    if (!isConfigured()) return Promise.reject(new Error("Connection fields are incomplete."));
    return apiRequest("findOne", { collection: "site", filter: { _id: COLLECTIONS.site._id } })
      .then(function () { mongoState.status = "connected"; mongoState.error = ""; return true; });
  }

  function mongoPull() {
    if (!isConfigured()) return Promise.resolve(false);
    var jobs = Object.keys(COLLECTIONS).map(function (name) {
      var spec = COLLECTIONS[name];
      return apiRequest("findOne", { collection: name, filter: { _id: spec._id } })
        .then(function (res) {
          var doc = res && res.document;
          if (!doc) return { name: name, found: false };
          if (spec.items) return { name: name, found: true, items: doc.items || [] };
          var o = {};
          spec.fields.forEach(function (f) { o[f] = doc[f]; });
          return { name: name, found: true, fields: o };
        });
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
    if (!isConfigured()) return Promise.resolve(false);
    var d = merged();
    var jobs = Object.keys(COLLECTIONS).map(function (name) {
      var spec = COLLECTIONS[name];
      var replacement;
      if (spec.items) {
        replacement = { items: d[name] || [] };
      } else {
        replacement = {};
        spec.fields.forEach(function (f) { replacement[f] = d[f]; });
      }
      return apiRequest("replaceOne", {
        collection: name,
        filter: { _id: spec._id },
        replacement: replacement,
        upsert: true
      });
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
