// server.cjs
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const CHIRPSTACK_BASE_URL = process.env.CHIRPSTACK_BASE_URL || "http://10.10.8.50:8090";

function readSecret(envKey, fileEnvKey, fallback) {
  const direct = process.env[envKey];
  if (direct) return direct;
  const filePath = process.env[fileEnvKey];
  if (!filePath) return fallback;
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch (err) {
    console.error(`ERROR: Failed to read ${fileEnvKey} from ${filePath}: ${err.message}`);
    return fallback;
  }
}

const CHIRPSTACK_TOKEN = readSecret("CHIRPSTACK_TOKEN", "CHIRPSTACK_TOKEN_FILE");

const APP_USERNAME = process.env.APP_USERNAME || "admin";
const APP_PASSWORD = readSecret("APP_PASSWORD", "APP_PASSWORD_FILE", "admin");
const SESSION_SECRET = readSecret("SESSION_SECRET", "SESSION_SECRET_FILE", "change-me");

if (!CHIRPSTACK_TOKEN) {
  console.error("ERROR: CHIRPSTACK_TOKEN is not set.");
  process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" }
  })
);

app.use(express.static(path.join(__dirname, "public")));

function toSimpleUUID(id) {
  return String(id || "").replace(/-/g, "");
}

function clampInt(val, def, min, max) {
  const n = Number.parseInt(val, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

async function chirpstackGet(pathname) {
  const url = `${CHIRPSTACK_BASE_URL}${pathname}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${CHIRPSTACK_TOKEN}`,
      Accept: "application/json",
      "User-Agent": "southerniot-chirpstack-explorer/1.1"
    }
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`ChirpStack ${res.status} ${res.statusText}: ${text}`);
  return JSON.parse(text);
}

async function chirpstackPost(pathname, payload) {
  const url = `${CHIRPSTACK_BASE_URL}${pathname}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CHIRPSTACK_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "southerniot-chirpstack-explorer/1.1"
    },
    body: JSON.stringify(payload || {})
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`ChirpStack ${res.status} ${res.statusText}: ${text}`);
  if (!text) return {};
  return JSON.parse(text);
}

function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  res.status(401).json({ error: "Unauthorized" });
}

// ---------- Auth routes ----------
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === APP_USERNAME && password === APP_PASSWORD) {
    req.session.user = { username };
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: "Invalid credentials" });
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/auth/me", (req, res) => {
  res.json({ user: req.session?.user || null });
});

// ---------- ChirpStack API proxy (auth-protected) ----------
// Tenants: GET /api/tenants?limit&offset&search
app.get("/api/tenants", requireAuth, async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 25, 1, 200);
    const offset = clampInt(req.query.offset, 0, 0, 1000000);
    const search = (req.query.search || "").trim();

    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search) qs.set("search", search);

    const data = await chirpstackGet(`/api/tenants?${qs.toString()}`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch tenants", message: e.message });
  }
});

// Applications by tenant: GET /api/tenants/:tenantId/applications?limit&offset&search
app.get("/api/tenants/:tenantId/applications", requireAuth, async (req, res) => {
  try {
    const tenantId = toSimpleUUID(req.params.tenantId);
    const limit = clampInt(req.query.limit, 25, 1, 200);
    const offset = clampInt(req.query.offset, 0, 0, 1000000);
    const search = (req.query.search || "").trim();

    const qs = new URLSearchParams({
      tenantId,
      limit: String(limit),
      offset: String(offset)
    });
    if (search) qs.set("search", search);

    const data = await chirpstackGet(`/api/applications?${qs.toString()}`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch applications", message: e.message });
  }
});

// Devices by application: GET /api/applications/:appId/devices?limit&offset&search
app.get("/api/applications/:applicationId/devices", requireAuth, async (req, res) => {
  try {
    const applicationId = toSimpleUUID(req.params.applicationId);
    const limit = clampInt(req.query.limit, 25, 1, 200);
    const offset = clampInt(req.query.offset, 0, 0, 1000000);
    const search = (req.query.search || "").trim();

    const qs = new URLSearchParams({
      applicationId,
      limit: String(limit),
      offset: String(offset)
    });
    if (search) qs.set("search", search);

    const data = await chirpstackGet(`/api/devices?${qs.toString()}`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch devices", message: e.message });
  }
});

// Gateways by tenant: GET /api/tenants/:tenantId/gateways?limit&offset&search
app.get("/api/tenants/:tenantId/gateways", requireAuth, async (req, res) => {
  try {
    const tenantId = toSimpleUUID(req.params.tenantId);
    const limit = clampInt(req.query.limit, 25, 1, 200);
    const offset = clampInt(req.query.offset, 0, 0, 1000000);
    const search = (req.query.search || "").trim();

    const qs = new URLSearchParams({
      tenantId,
      limit: String(limit),
      offset: String(offset)
    });
    if (search) qs.set("search", search);

    const data = await chirpstackGet(`/api/gateways?${qs.toString()}`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch gateways", message: e.message });
  }
});

// Device detail (common ChirpStack pattern): GET /api/devices/:devEui
app.get("/api/devices/:devEui", requireAuth, async (req, res) => {
  try {
    const devEui = String(req.params.devEui || "").replace(/[^a-fA-F0-9]/g, "");
    const data = await chirpstackGet(`/api/devices/${encodeURIComponent(devEui)}`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch device detail", message: e.message });
  }
});

// Gateway detail (common pattern): GET /api/gateways/:gatewayId
app.get("/api/gateways/:gatewayId", requireAuth, async (req, res) => {
  try {
    const gatewayId = String(req.params.gatewayId || "").replace(/[^a-fA-F0-9]/g, "");
    const data = await chirpstackGet(`/api/gateways/${encodeURIComponent(gatewayId)}`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch gateway detail", message: e.message });
  }
});

// ---------- Provisioning (auth-protected) ----------
app.post("/api/tenants", requireAuth, async (req, res) => {
  try {
    const data = await chirpstackPost("/api/tenants", req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to create tenant", message: e.message });
  }
});

app.post("/api/applications", requireAuth, async (req, res) => {
  try {
    const data = await chirpstackPost("/api/applications", req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to create application", message: e.message });
  }
});

app.post("/api/device-profiles", requireAuth, async (req, res) => {
  try {
    const data = await chirpstackPost("/api/device-profiles", req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to create device profile", message: e.message });
  }
});

app.post("/api/gateways", requireAuth, async (req, res) => {
  try {
    const data = await chirpstackPost("/api/gateways", req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to create gateway", message: e.message });
  }
});

app.post("/api/devices", requireAuth, async (req, res) => {
  try {
    const data = await chirpstackPost("/api/devices", req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to create device", message: e.message });
  }
});

app.post("/api/devices/keys", requireAuth, async (req, res) => {
  try {
    const devEui = req.body?.deviceKeys?.devEui;
    if (!devEui) return res.status(400).json({ error: "deviceKeys.devEui is required" });
    const data = await chirpstackPost(`/api/devices/${encodeURIComponent(devEui)}/keys`, req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to create device keys", message: e.message });
  }
});

// App entry points
app.get("/", (req, res) => res.redirect("/app.html"));

app.listen(PORT, () => {
  console.log(`✅ Web app running: http://localhost:${PORT}`);
  console.log(`ChirpStack base: ${CHIRPSTACK_BASE_URL}`);
});
