const crypto = require("crypto");

/* ─── CORS / headers ─── */
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

/* ─────────────────────────────────────────────────────────
   RATE LIMITER + IP BLOCKER
   - In-memory store (resets on cold start, but warm instances
     keep state — enough to catch sustained brute force)
   - Three tiers: soft block → hard block → permanent ban
   ───────────────────────────────────────────────────────── */

const BLOCKED_IPS   = new Map();   // ip → expiresAt
const ATTEMPTS      = new Map();   // ip → { first, count, lastFail }
const SOFT_BANS     = new Map();   // ip → expiresAt  (5-min cooldown)
const HARD_BANS     = new Map();   // ip → expiresAt  (30-min lockout)

/* windows */
const SOFT_WINDOW_MS  = 15 * 60 * 1000;   // 15 min attempt window
const SOFT_BAN_MS     =  5 * 60 * 1000;   // 5 min  after 3 fails
const HARD_BAN_MS     = 30 * 60 * 1000;   // 30 min after 6 fails
const PERM_BAN_FAILS  = 10;                // permanent after 10 fails in window

/* input limits */
const MAX_USERNAME_LEN = 100;
const MAX_PASSWORD_LEN = 200;

/* ─── helpers ─── */

function getClientIp(event) {
  var h = event.headers || {};

  // X-Forwarded-For may be "client, proxy1, proxy2" — take first
  var xff = h["x-forwarded-for"];
  if (xff) {
    var first = String(xff).split(",")[0].trim();
    if (first) return first;
  }

  // Netlify sometimes sets these
  if (h["client-ip"])     return h["client-ip"];
  if (h["x-real-ip"])     return h["x-real-ip"];

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

function getRemaining(ip) {
  var r = ATTEMPTS.get(ip);
  if (!r || now() - r.first > SOFT_WINDOW_MS) return 0;
  return r.count;
}

function recordFail(ip) {
  var r = ATTEMPTS.get(ip);
  var t = now();

  if (!r || t - r.first > SOFT_WINDOW_MS) {
    // fresh window
    ATTEMPTS.set(ip, { first: t, count: 1, lastFail: t });
    return 1;
  }

  r.count++;
  r.lastFail = t;

  // ── escalation tiers ──
  if (r.count >= PERM_BAN_FAILS) {
    // permanent-ish ban (24h)
    BLOCKED_IPS.set(ip, t + 24 * 60 * 60 * 1000);
    ATTEMPTS.delete(ip);
    return r.count;
  }

  if (r.count >= 6 && !HARD_BANS.has(ip)) {
    HARD_BANS.set(ip, t + HARD_BAN_MS);
    return r.count;
  }

  if (r.count >= 3 && !SOFT_BANS.has(ip) && !HARD_BANS.has(ip)) {
    SOFT_BANS.set(ip, t + SOFT_BAN_MS);
    return r.count;
  }

  return r.count;
}

function clearAttemptsOnSuccess(ip) {
  ATTEMPTS.delete(ip);
  SOFT_BANS.delete(ip);
  HARD_BANS.delete(ip);
  BLOCKED_IPS.delete(ip);
}

/* ─── expired-entry cleanup (runs once per request) ─── */
function gc() {
  var t = now();
  [BLOCKED_IPS, SOFT_BANS, HARD_BANS, ATTEMPTS].forEach(function (m) {
    m.forEach(function (v, k) {
      // ATTEMPTS stores objects, others store expiry timestamps
      if (typeof v === "object" && v !== null && v.first) {
        if (t - v.first > SOFT_WINDOW_MS) m.delete(k);
      } else if (typeof v === "number" && t > v) {
        m.delete(k);
      }
    });
  });
}

/* ─── response helpers ─── */
function json(status, extra, body) {
  var hdrs = Object.assign({}, headers, extra || {});
  return { statusCode: status, headers: hdrs, body: JSON.stringify(body) };
}

/* ─────────────────────────────────────────────────────────
   HANDLER
   ───────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, {}, { error: "Method not allowed" });
  }

  gc();  // clean up stale entries

  var ip = getClientIp(event);

  /* ── tier 1: permanent / hard ban ── */
  if (isBlocked(ip)) {
    var blockExp = BLOCKED_IPS.get(ip);
    var retryBlock = Math.max(1, Math.ceil((blockExp - now()) / 1000));
    return json(429, { "Retry-After": String(retryBlock) },
      { error: "Access denied. Try again later." });
  }

  /* ── tier 2: hard ban (30 min) ── */
  if (isHardBanned(ip)) {
    var hardExp = HARD_BANS.get(ip);
    var retryHard = Math.max(1, Math.ceil((hardExp - now()) / 1000));
    return json(429, { "Retry-After": String(retryHard) },
      { error: "Too many failed attempts. Locked out for 30 minutes." });
  }

  /* ── tier 3: soft ban (5 min cooldown) ── */
  if (isSoftBanned(ip)) {
    var softExp = SOFT_BANS.get(ip);
    var retrySoft = Math.max(1, Math.ceil((softExp - now()) / 1000));
    return json(429, { "Retry-After": String(retrySoft) },
      { error: "Too many attempts. Wait 5 minutes." });
  }

  /* ── tier 4: sliding window check ── */
  var remaining = getRemaining(ip);
  if (remaining >= MAX_ATTEMPTS) {
    // this should normally be caught by soft/hard bans above,
    // but acts as a safety net
    return json(429, { "Retry-After": "300" },
      { error: "Rate limit exceeded. Try again later." });
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

    /* input length validation */
    if (username.length > MAX_USERNAME_LEN || password.length > MAX_PASSWORD_LEN) {
      return json(400, {}, { error: "Invalid input" });
    }

    /* reject suspicious patterns */
    if (/<script/i.test(username) || /<script/i.test(password) ||
        /javascript:/i.test(username) || /javascript:/i.test(password) ||
        /\b(or|and)\b\s+\d+\s*=\s*\d+/i.test(username)) {
      // silently log and reject — don't reveal that we caught them
      recordFail(ip);
      return json(401, {}, { ok: false, error: "Wrong username or password" });
    }

    var validUser = process.env.ADMIN_USERNAME;
    var validPass = process.env.ADMIN_PASSWORD;

    if (!validUser || !validPass) {
      return json(500, {}, { error: "Server auth not configured" });
    }

    /* constant-time comparison to prevent timing attacks */
    var userBuf  = Buffer.from(username, "utf8");
    var validUBuf = Buffer.from(validUser, "utf8");
    var passBuf  = Buffer.from(password, "utf8");
    var validPBuf = Buffer.from(validPass, "utf8");

    var userMatch = userBuf.length === validUBuf.length &&
      crypto.timingSafeEqual(userBuf, validUBuf);
    var passMatch = passBuf.length === validPBuf.length &&
      crypto.timingSafeEqual(passBuf, validPBuf);

    if (userMatch && passMatch) {
      clearAttemptsOnSuccess(ip);
      var token = crypto.randomBytes(32).toString("hex");
      return json(200, {}, { ok: true, token: token });
    }

    /* ── failed login ── */
    var failCount = recordFail(ip);

    var msg = "Wrong username or password";
    if (failCount >= PERM_BAN_FAILS) {
      msg = "Account locked. Contact administrator.";
    } else if (failCount >= 6) {
      msg = "Account temporarily locked. Try again in 30 minutes.";
    } else if (failCount >= 3) {
      msg = "Too many attempts. Wait 5 minutes.";
    }

    return json(401, {}, { ok: false, error: msg });

  } catch (e) {
    return json(500, {}, { error: "Login failed" });
  }
};
