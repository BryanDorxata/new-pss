import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" })); // lock down to your Webflow domain when you go live

// ---------- helpers ----------
function basicFail(res, code = 401) {
  res.set("WWW-Authenticate", "Basic realm=\"zakeke\"").status(code).send("Unauthorized");
}
function parseBasic(req) {
  const h = req.headers.authorization || "";
  const [type, b64] = h.split(" ");
  if (type !== "Basic" || !b64) return null;
  const [user, pass] = Buffer.from(b64, "base64").toString("utf8").split(":");
  return { user, pass };
}
function requireZakekeBasic(req, res, next) {
  const creds = parseBasic(req);
  if (!creds) return basicFail(res, 401);
  if (creds.user !== process.env.ZAKEKE_CLIENT_ID || creds.pass !== process.env.ZAKEKE_CLIENT_SECRET) {
    return basicFail(res, 403);
  }
  next();
}
async function getZakekeToken({ accessType = "C2S", visitor, customer }) {
  // OAuth token (server-side). Never call this from the browser.
  // POST https://api.zakeke.com/token  (x-www-form-urlencoded)
  // access_type=C2S for iframe usage; S2S for server-to-server calls.
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("access_type", accessType);
  if (visitor) params.append("visitorcode", visitor);
  if (customer) params.append("customercode", customer);

  const r = await fetch("https://api.zakeke.com/token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer
        .from(`${process.env.ZAKEKE_CLIENT_ID}:${process.env.ZAKEKE_CLIENT_SECRET}`)
        .toString("base64")
    },
    body: params
  });
  if (!r.ok) throw new Error(`Token error ${r.status}`);
  const j = await r.json();
  return j["access_token"];
}

// ---------- 1) Token endpoints ----------
app.get("/api/zakeke/token", async (req, res) => {
  try {
    const { visitor, customer } = req.query;
    const token = await getZakekeToken({ accessType: "C2S", visitor, customer });
    res.json({ accessToken: token }); // return only the token; keep credentials secret
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Optional: S2S token endpoint for internal server use only (don't expose to browser)
async function getS2SToken() {
  return getZakekeToken({ accessType: "S2S" });
}

// ---------- 2) Product Catalog API (called by Zakeke) ----------
// Register the *base URL* (ending with a trailing slash) in Zakeke > Your Account > E‑commerce Connection.
// Zakeke will call these endpoints using HTTP Basic with your Zakeke API keys.
app.get("/api/catalog/", requireZakekeBasic, async (req, res) => {
  // TODO: Replace with real store fetch (Shopify, DB, etc.) & pagination/filter
  const { page = "1", search = "" } = req.query;
  const products = [
    { code: "SKU-1001", name: "Customizable Sneaker", thumbnail: "https://picsum.photos/seed/snk/200" },
    { code: "SKU-2002", name: "Customizable Cap",     thumbnail: "https://picsum.photos/seed/cap/200" }
  ].filter(p => (search ? (p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search)) : true));
  res.json(products);
});

app.get("/api/catalog/:product_code/options", requireZakekeBasic, async (req, res) => {
  // TODO: Replace with real product options from your store or a mapping table
  const { product_code } = req.params;
  const options = [
    {
      code: "OPT-COLOR", name: "Color",
      values: [
        { code: "COL-WHITE", name: "White" },
        { code: "COL-BLACK", name: "Black" }
      ]
    },
    {
      code: "OPT-SIZE", name: "Size",
      values: [
        { code: "S-38", name: "38" }, { code: "S-39", name: "39" }, { code: "S-40", name: "40" }
      ]
    }
  ];
  res.json(options);
});

// Mark product configurable/customizable (Zakeke can toggle this)
app.post("/api/catalog/:product_code/configurator", requireZakekeBasic, (req, res) => res.sendStatus(200));
app.delete("/api/catalog/:product_code/configurator", requireZakekeBasic, (req, res) => res.sendStatus(200));
app.post("/api/catalog/:product_code/customizer", requireZakekeBasic, (req, res) => res.sendStatus(200));
app.delete("/api/catalog/:product_code/customizer", requireZakekeBasic, (req, res) => res.sendStatus(200));

// ---------- 3) Cart bridge (called by your Webflow page on AddToCart) ----------
app.post("/api/zakeke/cart", async (req, res) => {
  try {
    const { compositionId, quantity = 1 } = req.body;
    const s2sToken = await getS2SToken();
    // Cart info: GET /v1/compositions/{compositionId}/cartinfo?quantity=Q  (S2S)
    const cartInfoRes = await fetch(`https://api.zakeke.com/v1/compositions/${encodeURIComponent(compositionId)}/cartinfo?quantity=${quantity}`, {
      headers: { "Authorization": `Bearer ${s2sToken}` }
    });
    if (!cartInfoRes.ok) throw new Error(`cartinfo ${cartInfoRes.status}`);
    const cartInfo = await cartInfoRes.json();

    // TODO: add this configured item to YOUR store's cart and return the cart URL or your cart payload.
    // For now, just echo what we got:
    res.json({
      added: true,
      compositionId,
      quantity,
      cartInfo // includes preview image, price, selected attributes, optional designID
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Zakeke bridge listening on :${port}`));
