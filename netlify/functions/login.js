const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { username, password } = JSON.parse(event.body || "{}");

    if (!username || !password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing credentials" }) };
    }

    const validUser = process.env.ADMIN_USERNAME;
    const validPass = process.env.ADMIN_PASSWORD;

    if (!validUser || !validPass) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server auth not configured" }) };
    }

    if (username === validUser && password === validPass) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, token: "delightful-admin-" + Date.now() }),
      };
    }

    return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: "Wrong username or password" }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Login failed" }) };
  }
};
