/**
 * FER-1 minimal event router — deploy için iskelet.
 * Üretimde: Firestore onCreate trigger veya HTTPS validate + projection.
 *
 * Kohort kapısı: `cohortGateV0` — ID token + sunucu allowlist (`COHORT_EMAIL_ALLOWLIST` env, Gen2 function env).
 * Deploy analizinde `defineString` / ağır üst-seviye init zaman aşımına yol açmaması için env + lazy Admin.
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { validateRhizohEventEnvelope } = require("./validateRhizohEvent");
const { loadCohortEmailAllowlistV0 } = require("./cohortAllowlistLoadV0");
const {
  handleCohortSessionFeedbackMailV0,
  handleCohortFeedbackSubmitV0
} = require("./cohortMailV0");

/** Lazy Firebase Admin — yalnızca cohortGateV0 yükünde init (deploy kod analizi zaman aşımını azaltır). */
function getAdmin() {
  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin;
}

/**
 * HTTPS — Authorization: Bearer <Firebase ID token>
 * 200 { ok: true } | 4xx/5xx { ok: false, reason }
 * Başarıda `rhizoh_cohort_v0` custom claim set edilir (Firestore kurallarında ileride kullanılabilir).
 */
exports.cohortGateV0 = onRequest(
  {
    cors: true,
    region: "us-central1",
    invoker: "public"
  },
  async (req, res) => {
    const admin = getAdmin();

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST" && req.method !== "GET") {
      res.status(405).json({ ok: false, reason: "method_not_allowed" });
      return;
    }

    const authHeader = String(req.headers.authorization || "");
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      res.status(401).json({ ok: false, reason: "missing_bearer" });
      return;
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(m[1]);
    } catch (e) {
      logger.warn("cohort_gate_token_invalid", { message: String(e?.message || e) });
      res.status(401).json({ ok: false, reason: "invalid_token" });
      return;
    }

    if (decoded.firebase?.sign_in_provider === "anonymous") {
      res.status(403).json({ ok: false, reason: "anonymous_not_allowed" });
      return;
    }

    const email = String(decoded.email || "").trim().toLowerCase();
    const list = loadCohortEmailAllowlistV0();
    if (!list.length) {
      logger.error("cohort_gate_allowlist_unconfigured");
      res.status(503).json({ ok: false, reason: "server_allowlist_unconfigured" });
      return;
    }

    if (!email || !list.includes(email)) {
      res.status(403).json({ ok: false, reason: "email_not_on_allowlist" });
      return;
    }

    try {
      const user = await admin.auth().getUser(decoded.uid);
      const existing = user.customClaims && typeof user.customClaims === "object" ? user.customClaims : {};
      await admin.auth().setCustomUserClaims(decoded.uid, {
        ...existing,
        rhizoh_cohort_v0: true
      });
    } catch (e) {
      logger.error("cohort_gate_set_claims_failed", { uid: decoded.uid, message: String(e?.message || e) });
      res.status(500).json({ ok: false, reason: "set_claims_failed" });
      return;
    }

    res.status(200).json({ ok: true });
  }
);

const GATEWAY_PROXY_UPSTREAM =
  process.env.CASTLE_GATEWAY_UPSTREAM || "https://castle-genesis-rhizoh-habitatos.onrender.com";

function readRequestBodyBuffer(req) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function pickGatewayProxyForwardHeaders(req) {
  const headers = {};
  const auth = req.headers.authorization;
  const ctype = req.headers["content-type"];
  const devUid = req.headers["x-castle-dev-uid"];
  const gwTok = req.headers["x-castle-gateway-token"];
  if (auth) headers.Authorization = String(auth);
  if (ctype) headers["Content-Type"] = String(ctype);
  if (devUid) headers["X-Castle-Dev-Uid"] = String(devUid);
  if (gwTok) headers["X-Castle-Gateway-Token"] = String(gwTok);
  return headers;
}

/**
 * Same-origin proxy — rhizoh.com: GET /health/* + POST /rhizoh/llm (CORS + Render cold-start).
 */
exports.gatewayProxyV0 = onRequest(
  {
    cors: true,
    region: "us-central1",
    invoker: "public",
    timeoutSeconds: 120,
    memory: "256MiB"
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "POST") {
      res.status(405).json({ ok: false, reason: "method_not_allowed" });
      return;
    }
    const rawPath = String(req.path || req.url || "");
    const subPath = rawPath.replace(/^\/api\/gatewayProxy\/?/, "") || "health/deps";
    const path = subPath.startsWith("/") ? subPath : `/${subPath}`;
    const upstream = String(GATEWAY_PROXY_UPSTREAM).replace(/\/$/, "");
    const url = `${upstream}${path}`;
    const timeoutMs = path.includes("/rhizoh/llm") ? 90000 : 15000;
    try {
      const headers = pickGatewayProxyForwardHeaders(req);
      /** @type {RequestInit} */
      const init = { method: req.method, headers, signal: AbortSignal.timeout(timeoutMs) };
      if (req.method === "POST") {
        const body = await readRequestBodyBuffer(req);
        if (body.length) init.body = body;
      }
      const r = await fetch(url, init);
      const text = await r.text();
      res
        .status(r.status)
        .set("Content-Type", r.headers.get("content-type") || "application/json")
        .send(text);
    } catch (e) {
      logger.warn("gateway_proxy_failed", { url, message: String(e?.message || e) });
      res.status(502).json({ ok: false, reason: "upstream_unreachable" });
    }
  }
);

async function verifyOptionalBearerEmail(req) {
  const authHeader = String(req.headers.authorization || "");
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const admin = getAdmin();
    const decoded = await admin.auth().verifyIdToken(m[1]);
    return String(decoded.email || "").trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * POST — session end: feedback link mail to observer (cohort review).
 */
exports.cohortSessionFeedbackMailV0 = onRequest(
  {
    cors: true,
    region: "us-central1",
    invoker: "public"
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, reason: "method_not_allowed" });
      return;
    }
    try {
      const tokenEmail = await verifyOptionalBearerEmail(req);
      const out = await handleCohortSessionFeedbackMailV0(req.body || {}, tokenEmail);
      res.status(out.ok ? 200 : 400).json(out);
    } catch (e) {
      const reason = String(e?.code || e?.message || e);
      logger.error("cohort_session_feedback_mail_failed", { reason });
      res.status(reason === "smtp_unconfigured" ? 503 : 500).json({ ok: false, reason });
    }
  }
);

/**
 * POST — human feedback notes after session.
 */
exports.cohortFeedbackSubmitV0 = onRequest(
  {
    cors: true,
    region: "us-central1",
    invoker: "public"
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, reason: "method_not_allowed" });
      return;
    }
    try {
      const tokenEmail = await verifyOptionalBearerEmail(req);
      const out = await handleCohortFeedbackSubmitV0(req.body || {}, tokenEmail);
      res.status(out.ok ? 200 : 400).json(out);
    } catch (e) {
      const reason = String(e?.code || e?.message || e);
      logger.error("cohort_feedback_submit_failed", { reason });
      res.status(reason === "smtp_unconfigured" ? 503 : 500).json({ ok: false, reason });
    }
  }
);

exports.onRhizohEventCreated = onDocumentCreated(
  "rhizoh_events/{stream}/items/{eventId}",
  (event) => {
    const snap = event.data;
    if (!snap) return;
    const stream = event.params.stream;
    const doc = snap.data();
    const v = validateRhizohEventEnvelope({ stream, doc });
    if (!v.ok) {
      logger.error("rhizoh_event_validate_reject", {
        stream,
        eventId: event.params.eventId,
        reason: v.reason
      });
      return Promise.resolve();
    }
    logger.info("rhizoh_event_ingested", {
      stream,
      eventId: event.params.eventId,
      type: snap.get("type")
    });
    return Promise.resolve();
  }
);
