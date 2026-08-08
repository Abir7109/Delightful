/* ============================================================
   MONGO — Netlify Function: server-side MongoDB driver
   Replaces the browser Data API with direct driver access.
   Collections: site, products, premium, reviews, faq, orders
   ============================================================ */
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "delightful";

let client = null;
let clientPromise = null;

async function getClient() {
  if (client) return client;
  if (clientPromise) return clientPromise;
  client = new MongoClient(MONGO_URI, {
    maxPoolSize: 5,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000
  });
  clientPromise = client.connect();
  return clientPromise;
}

const COLLECTIONS = {
  site: { _id: "main" },
  products: { _id: "all" },
  premium: { _id: "all" },
  reviews: { _id: "all" },
  faq: { _id: "all" },
  orders: { _id: "all" }
};

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function json(status, body) {
  return { statusCode: status, headers, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }
  if (!MONGO_URI) {
    return json(500, { error: "MONGO_URI not configured" });
  }

  try {
    var body = event.body || "";
    if (event.isBase64Encoded) {
      body = Buffer.from(body, "base64").toString("utf8");
    }
    var params = JSON.parse(body);
    var action = params.action;
    var collection = params.collection;

    if (!action || !collection || !COLLECTIONS[collection]) {
      return json(400, { error: "Invalid action or collection" });
    }

    var db = (await getClient()).db(DB_NAME);
    var col = db.collection(collection);
    var spec = COLLECTIONS[collection];

    /* ---- PULL: read all data ---- */
    if (action === "pull") {
      var result = await col.findOne({ _id: spec._id });
      return json(200, { ok: true, data: result });
    }

    /* ---- PUSH: write all data ---- */
    if (action === "push") {
      var data = params.data;
      if (!data || typeof data !== "object") {
        return json(400, { error: "Missing data" });
      }
      await col.replaceOne(
        { _id: spec._id },
        { _id: spec._id, ...data },
        { upsert: true }
      );
      return json(200, { ok: true });
    }

    return json(400, { error: "Unknown action" });

  } catch (e) {
    return json(500, { error: e.message || "MongoDB error" });
  }
};
