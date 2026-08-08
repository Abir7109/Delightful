const crypto = require("crypto");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

/* simple in-memory rate limit (resets on cold start, but catches sustained brute force) */
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; /* 15 min */
const MAX_ATTEMPTS = 5;

function getClientIp(event) {
  return (event.headers || {})["x-forwarded-for"]
    || (event.headers || {})["client-ip"]
    || "unknown";
}

function checkRate(ip) {
  var now = Date.now();
  var record = attempts.get(ip);
  if (!record || now - record.start > WINDOW_MS) {
    attempts.set(ip, { start: now, count: 1 });
    return { ok: true, remaining: MAX_ATTEMPTS - 1 };
  }
  record.count++;
  if (record.count > MAX_ATTEMPTS) {
    var retryAfter = Math.ceil((record.start + WINDOW_MS - now) / 1000);
    return { ok: false, retryAfter: retryAfter };
  }
  return { ok: true, remaining: MAX_ATTEMPTS - record.count };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  var ip = getClientIp(event);
  var rate = checkRate(ip);

  if (!rate.ok) {
    return {
      statusCode: 429,
      headers: Object.assign({}, headers, { "Retry-After": String(rate.retryAfter) }),
      body: JSON.stringify({ error: "Too many attempts. Try again later." }),
    };
  }

  try {
    var body = event.body || "";
    if (event.isBase64Encoded) {
      body = Buffer.from(body, "base64").toString("utf8");
    }

    var params = {};
    try {
      params = JSON.parse(body);
    } catch (e) {
      /* reject non-JSON bodies */
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request" }) };
    }

    var username = String(params.username || "").trim();
    var password = String(params.password || "");

    if (!username || !password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing credentials" }) };
    }

    /* reject abnormally long inputs */
    if (username.length > 100 || password.length > 200) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid input" }) };
    }

    var validUser = process.env.ADMIN_USERNAME;
    var validPass = process.env.ADMIN_PASSWORD;

    if (!validUser || !validPass) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server auth not configured" }) };
    }

    /* constant-time comparison to prevent timing attacks */
    var userBuf = Buffer.from(username, "utf8");
    var validUserBuf = Buffer.from(validUser, "utf8");
    var passBuf = Buffer.from(password, "utf8");
    var validPassBuf = Buffer.from(validPass, "utf8");

    var userMatch = userBuf.length === validUserBuf.length &&
      crypto.timingSafeEqual(userBuf, validUserBuf);
    var passMatch = passBuf.length === validPassBuf.length &&
      crypto.timingSafeEqual(passBuf, validPassBuf);

    if (userMatch && passMatch) {
      var token = crypto.randomBytes(32).toString("hex");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, token: token }),
      };
    }

    return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: "Wrong username or password" }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Login failed" }) };
  }
};
