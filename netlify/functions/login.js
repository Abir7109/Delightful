const crypto = require("crypto");

/* ─── CORS / headers ─── */
var ALLOWED_ORIGIN = "https://delightfulcake.netlify.app";

function makeHeaders(extra) {
  var h = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
  if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
  return h;
}

/* ─────────────────────────────────────────────────────────
   RATE LIMITER + IP BLOCKER
   - Uses Netlify-injected x-nf-client-connection-ip
     (not spoofable by the client)
   - Three tiers: soft ban → hard ban → permanent ban
   - Max-size cap prevents memory exhaustion DoS
   ───────────────────────────────────────────────────────── */

var BLOCKED_IPS   = new Map();   // ip → expiresAt
var ATTEMPTS      = new Map();   // ip → { first, count, lastFail }
var SOFT_BANS     = new Map();   // ip → expiresAt
var HARD_BANS     = new Map();   // ip → expiresAt

/* limits */
var MAX_MAP_SIZE       = 10000;    // hard cap on tracked IPs
var SOFT_WINDOW_MS     = 15 * 60 * 1000;
var SOFT_BAN_MS        =  5 * 60 * 1000;
var HARD_BAN_MS        = 30 * 60 * 1000;
var PERM_BAN_FAILS     = 10;
var MAX_ATTEMPTS       = 5;

/* input limits */
var MAX_USERNAME_LEN   = 100;
var MAX_PASSWORD_LEN   = 200;

/* ─── helpers ─── */

function getClientIp(event) {
  var h = event.headers || {};

  // Netlify-injected header — not overridable by client
  var nfIP = h["x-nf-client-connection-ip"];
  if (nfIP) return String(nfIP).trim();

  // Fallback: take the RIGHTMOST non-private IP from X-Forwarded-For
  // (Netlify appends its own IP at the end)
  var xff = h["x-forwarded-for"];
  if (xff) {
    var parts = String(xff).split(",").map(function (s) { return s.trim(); });
    for (var i = parts.length - 1; i >= 0; i--) {
      var ip = parts[i];
      if (ip && !ip.startsWith("10.") && !ip.startsWith("192.168.") &&
          !ip.startsWith("172.") && ip !== "127.0.0.1" && ip !== "unknown") {
        return ip;
      }
    }
  }

  return "unknown";
}

function now() { return Date.now(); }

function isBlocked(ip) {
  var exp = BLOCKED_IPS.get(ip);
  if (!exp) return false;
  if (now() > exp) { BLOCKED_IPS.delete(ip); return false; }
  return true;
}

function isSoftBanned(ip) {
  var exp = SOFT_BANS.get(ip);
  if (!exp) return false;
  if (now() > exp) { SOFT_BANS.delete(ip); return false; }
  return true;
}

function isHardBanned(ip) {
  var exp = HARD_BANS.get(ip);
  if (!exp) return false;
  if (now() > exp) { HARD_BANS.delete(ip); return false; }
  return true;
}

function totalTracked() {
  return BLOCKED_IPS.size + ATTEMPTS.size + SOFT_BANS.size + HARD_BANS.size;
}

function evictOldest() {
  // remove the entry with the oldest timestamp across all maps
  var oldestKey = null, oldestTime = Infinity, oldestMap = null;
  [ATTEMPTS, SOFT_BANS, HARD_BANS, BLOCKED_IPS].forEach(function (m) {
    m.forEach(function (v, k) {
      var t = (typeof v === "object" && v !== null) ? (v.first || 0) : (v || 0);
      if (t < oldestTime) { oldestTime = t; oldestKey = k; oldestMap = m; }
    });
  });
  if (oldestMap && oldestKey !== null) oldestMap.delete(oldestKey);
}

function recordFail(ip) {
  // enforce max size before creating new entries
  if (totalTracked() >= MAX_MAP_SIZE) evictOldest();

  var r = ATTEMPTS.get(ip);
  var t = now();

  if (!r || t - r.first > SOFT_WINDOW_MS) {
    ATTEMPTS.set(ip, { first: t, count: 1, lastFail: t });
    return 1;
  }

  r.count++;
  r.lastFail = t;

  if (r.count >= PERM_BAN_FAILS) {
    BLOCKED_IPS.set(ip, t + 24 * 60 * 60 * 1000);
    ATTEMPTS.delete(ip);
    return r.count;
  }

  if (r.count >= 6 && !HARD_BANS.has(ip)) {
    HARD_BANS.set(ip, t + HARD_BAN_MS);
  }

  if (r.count >= 3 && !SOFT_BANS.has(ip) && !HARD_BANS.has(ip)) {
    SOFT_BANS.set(ip, t + SOFT_BAN_MS);
  }

  return r.count;
}

function clearOnSuccess(ip) {
  ATTEMPTS.delete(ip);
  SOFT_BANS.delete(ip);
  HARD_BANS.delete(ip);
  BLOCKED_IPS.delete(ip);
}

/* GC — clean expired entries, cap size */
function gc() {
  var t = now();
  [BLOCKED_IPS, SOFT_BANS, HARD_BANS].forEach(function (m) {
    m.forEach(function (v, k) { if (t > v) m.delete(k); });
  });
  ATTEMPTS.forEach(function (v, k) {
    if (t - v.first > SOFT_WINDOW_MS) ATTEMPTS.delete(k);
  });
  // hard cap safety net
  while (totalTracked() > MAX_MAP_SIZE) evictOldest();
}

/* ─── response helper ─── */
function json(status, hdrs, body) {
  return { statusCode: status, headers: makeHeaders(hdrs || {}), body: JSON.stringify(body) };
}

/* ─── generic error (never reveals tier) ─── */
var GENERIC_AUTH_ERR = "Wrong username or password";
var GENERIC_LOCK_ERR = "Too many attempts. Please try again later.";

/* ─────────────────────────────────────────────────────────
   HANDLER
   ───────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: makeHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, {}, { error: "Method not allowed" });
  }

  gc();

  var ip = getClientIp(event);

  /* ── check bans (generic error — never reveals which tier) ── */
  if (isBlocked(ip) || isHardBanned(ip)) {
    var exp = BLOCKED_IPS.get(ip) || HARD_BANS.get(ip);
    var retry = Math.max(1, Math.ceil((exp - now()) / 1000));
    return json(429, { "Retry-After": String(retry) }, { error: GENERIC_LOCK_ERR });
  }

  if (isSoftBanned(ip)) {
    var softExp = SOFT_BANS.get(ip);
    var retrySoft = Math.max(1, Math.ceil((softExp - now()) / 1000));
    return json(429, { "Retry-After": String(retrySoft) }, { error: GENERIC_LOCK_ERR });
  }

  /* ── parse body ── */
  try {
    var body = event.body || "";
    if (event.isBase64Encoded) {
      body = Buffer.from(body, "base64").toString("utf8");
    }

    var params = {};
    try {
      params = JSON.parse(body);
    } catch (e) {
      return json(400, {}, { error: "Invalid request" });
    }

    var username = String(params.username || "").trim();
    var password = String(params.password || "");

    if (!username || !password) {
      return json(400, {}, { error: "Missing credentials" });
    }

    if (username.length > MAX_USERNAME_LEN || password.length > MAX_PASSWORD_LEN) {
      return json(400, {}, { error: "Invalid input" });
    }

    /* reject suspicious patterns */
    if (/<script/i.test(username) || /<script/i.test(password) ||
        /javascript:/i.test(username) || /javascript:/i.test(password) ||
        /\b(or|and)\b\s+\d+\s*=\s*\d+/i.test(username)) {
      recordFail(ip);
      return json(401, {}, { ok: false, error: GENERIC_AUTH_ERR });
    }

    var validUser = process.env.ADMIN_USERNAME;
    var validPass = process.env.ADMIN_PASSWORD;

    if (!validUser || !validPass) {
      return json(500, {}, { error: "Server auth not configured" });
    }

    /* constant-time comparison */
    var userBuf  = Buffer.from(username, "utf8");
    var validUBuf = Buffer.from(validUser, "utf8");
    var passBuf  = Buffer.from(password, "utf8");
    var validPBuf = Buffer.from(validPass, "utf8");

    var userMatch = userBuf.length === validUBuf.length &&
      crypto.timingSafeEqual(userBuf, validUBuf);
    var passMatch = passBuf.length === validPBuf.length &&
      crypto.timingSafeEqual(passBuf, validPBuf);

    if (userMatch && passMatch) {
      clearOnSuccess(ip);
      var token = crypto.randomBytes(32).toString("hex");
      return json(200, {}, { ok: true, token: token });
    }

    /* failed — record and return generic error (no tier info) */
    recordFail(ip);
    return json(401, {}, { ok: false, error: GENERIC_AUTH_ERR });

  } catch (e) {
    return json(500, {}, { error: "Login failed" });
  }
};
