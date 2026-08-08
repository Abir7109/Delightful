/* ============================================================
   send-order-email — Netlify Function
   Sends order confirmation email to the shop owner via Resend.

   Environment variables (set in Netlify dashboard):
     RESEND_API_KEY   — API key from resend.com
     OWNER_EMAIL      — where to receive order notifications
   ============================================================ */
exports.handler = async function (event) {
  /* CORS headers */
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const OWNER_EMAIL = process.env.OWNER_EMAIL || "nijhumsbake123@gmail.com";

  if (!RESEND_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "RESEND_API_KEY not configured" }),
    };
  }

  try {
    const order = JSON.parse(event.body || "{}");
    const it = order.item || {};
    const cust = order.customer || {};
    const date = new Date(order.timestamp || Date.now());
    const timeStr = date.toLocaleDateString("en-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const subject = `New order: ${it.name || "Cake"} — ${cust.name || "Customer"}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #FFFDF8; border-radius: 16px; border: 1px solid #E8E0D4;">
        <h2 style="margin: 0 0 4px; font-size: 22px; color: #2C1810;">New Order Received</h2>
        <p style="margin: 0 0 20px; color: #8B7355; font-size: 14px;">${timeStr}</p>

        <div style="background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #E8E0D4;">
          <h3 style="margin: 0 0 8px; font-size: 16px; color: #2C1810;">${it.name || "Cake"}</h3>
          <p style="margin: 0; font-size: 14px; color: #8B7355;">
            ${it.category || ""}${it.qty > 1 ? " × " + it.qty : ""}
            ${it.finish ? " · " + it.finish : ""}
            ${it.premium ? " · Premium" : ""}
          </p>
          ${it.total != null ? `<p style="margin: 8px 0 0; font-size: 18px; font-weight: 700; color: #9C6F3D;">৳${it.total.toLocaleString("en-IN")}</p>` : '<p style="margin: 8px 0 0; font-size: 14px; color: #8B7355;">Price on request</p>'}
        </div>

        <div style="background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #E8E0D4;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #8B7355;">Customer</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${cust.name || "—"}</td></tr>
            <tr><td style="padding: 6px 0; color: #8B7355;">Phone</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${cust.phone || "—"}</td></tr>
            ${cust.date ? `<tr><td style="padding: 6px 0; color: #8B7355;">Needed by</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${cust.date}</td></tr>` : ""}
            <tr><td style="padding: 6px 0; color: #8B7355;">Mode</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${cust.mode === "delivery" ? "Delivery" : "Pickup"}${cust.address ? " — " + cust.address : ""}</td></tr>
          </table>
        </div>

        ${it.msg ? `<div style="background: #F5EDE3; border-radius: 12px; padding: 14px; margin-bottom: 16px; font-size: 14px; color: #5C4A3A; font-style: italic;">"${it.msg}"</div>` : ""}

        <p style="margin: 0; font-size: 12px; color: #B0A090; text-align: center;">Order ID: ${order.id || "—"}</p>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Delightful Orders <orders@delightfulcake.netlify.app>",
        to: OWNER_EMAIL,
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.message || "Email send failed" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, id: data.id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Internal error" }),
    };
  }
};
