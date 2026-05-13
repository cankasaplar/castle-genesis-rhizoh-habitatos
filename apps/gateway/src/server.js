import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("🔥 [GENESIS_BOOT] entry file:", __filename);
console.log("🔥 [GENESIS_BOOT] node env:", process.env.NODE_ENV);
console.log("🔥 [GENESIS_BOOT] pid:", process.pid);
console.log("🧬 [GENESIS_BOOT] cwd:", process.cwd());
console.log("🧬 [GENESIS_BOOT] import.meta.url:", import.meta.url);
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });

import { WebSocket, WebSocketServer } from "ws";
import { createServer } from "node:http";
import { createOrchestrator } from "@castle/orchestrator";
import { parseTextToCommand } from "@castle/command-dsl";
import { WS_MESSAGE, COMMAND, createEnvelope, safeJsonParse } from "@castle/protocol";
import { queryOpenData } from "./openData.js";
import { verifyClientToken } from "./auth.js";
import { runRhizohBrain } from "./rhizohBrain.js";
import { queryRhizohLlm } from "./rhizohLlmGateway.js";
import { rhizohGatewayTurn } from "./rhizohGatewayTurn.js";
import {
  meshAppendDelta,
  meshContinuityAggregate,
  meshJoin,
  meshLeave,
  meshReplayFromNodeId,
  meshReplayFromSeq,
  meshSnapshot,
  meshSubscribeSse
} from "./presenceRoomMesh.js";
import { runRhizohBrainV2 } from "./rhizohBrainV2.js";
import {
  listConnections,
  createConnection,
  updateConnection,
  deleteConnection,
  setDefaultConnection,
  resolveConnection
} from "./llmConnectionsStore.js";
import { checkHttpRateLimit, getHttpClientIp } from "./castleHttpRateLimit.js";
import { logLlmAccess } from "./castleLlmAudit.js";
import { appendMemory, listMemories, getMemoryContext, getPersonaGoalMemory, setPersonaGoalMemory, autoCompactMemories } from "./memoryStore.js";
import { getFirebasePersistence } from "./firebasePersistence.js";
import { registerAgentIdentity, listAgentIdentities, getAgentIdentity, updateAgentIdentity } from "./agentIdentityStore.js";
import { queueAcademyEvent, listAcademyEvents, resolveAcademyEvent, runAcademyEventTick } from "./academyEventEngine.js";
import { enqueuePdfJob, getPdfJob } from "./pdfPipeline.js";
import {
  createPublishSession,
  listPublishSessions,
  updatePublishSession,
  addTranscript,
  listTranscripts,
  searchMetadata,
  registerDevice,
  listDevices,
  updateDevice,
  appendTelemetry,
  listTelemetry,
  createAutomation,
  listAutomations,
  tickAutomations,
  enqueueCommand,
  listCommands,
  updateCommandStatus,
  registerSocialChannel,
  listSocialChannels
} from "./studioOpsStore.js";
import { metrics as infraMetrics } from "./infra/metrics.js";
import { renderRhizohPrometheusMetrics, rhizohEnterpriseMetrics } from "./infra/rhizohEnterpriseMetrics.js";
import { scoreHealth } from "./infra/healthScore.js";
import { getTraceById, listTracesBySession } from "./infra/traceRegistry.js";
import { canonicalEpistemicSealString, hashAndSignEpistemicSeal, EPISTEMIC_SEAL_SCHEMA } from "./epistemicSeal.js";
import { persistEpistemicLedgerBatch } from "./epistemicLedgerStore.js";
import { persistEpistemicForecastBatch } from "./epistemicForecastStore.js";
import { buildRhizohExternalGroundTruthPayload } from "./rhizohExternalGroundTruthGateway.js";
import { ingestRhizohExternalLossBatchHttp } from "./rhizohExternalLossIngestGateway.js";
import {
  ingestRhizohProductOutcomeHttp,
  listRhizohProductOutcomeAggregates,
  verifyRhizohOutcomeHmac,
  verifyRhizohOutcomeSourceToken
} from "./rhizohProductOutcomeIngestGateway.js";
import { initRhizoh } from "./rhizohProductionBootstrap.js";
import {
  buildGenesisRuntimeSurfacePayload,
  recordGenesisEpistemicLedgerPersisted,
  recordGenesisEpistemicSealIssued,
  startGenesisCanonicalClock
} from "./genesisRuntimeSurfaceV0.js";
import { registerGenesisSseClient, getGenesisContinuitySeq, setGenesisContinuityAfterPublishHook } from "./genesisContinuityStreamHubV0.js";
import { computeGenesisReplayFingerprintV0 } from "./genesisReplayFingerprintV0.js";
import { buildGenesisGatewayCapabilitiesV0 } from "./genesisGatewayCapabilitiesV0.js";
import {
  installGenesisCheckpointSurfaceGetter,
  noteGenesisCheckpointSeqCommitted,
  getLatestGenesisSignedCheckpoint
} from "./genesisContinuityCheckpointV0.js";
import { hydrateGenesisContinuityPersistenceBootV0 } from "./genesisContinuityHydrateBootV0.js";
import { startGenesisContinuityInfraSampler } from "./genesisContinuityInfraSamplerV0.js";
import {
  genesisCheckpointQueryBySeqV0,
  genesisCheckpointQueryRangeV0,
  genesisCheckpointQueryLineageV0
} from "./genesisCheckpointQueryV0.js";
import {
  genesisContinuityEventArchiveEnabled,
  queryGenesisContinuityEventArchiveV0,
  GENESIS_CONTINUITY_EVENT_ARCHIVE_QUERY_PROJECTION
} from "./genesisContinuityEventArchiveV0.js";
import { resolveGenesisReplayRouterV1, GENESIS_REPLAY_ROUTER_SCHEMA } from "./genesisReplayRouterV1.js";
import {
  computeGenesisReplayTemporalDiffV1,
  GENESIS_REPLAY_TEMPORAL_DIFF_SCHEMA
} from "./genesisReplayTemporalDiffV1.js";
import { compareGenesisReplayEquivalenceV1 } from "./genesisReplayEquivalenceV1.js";
import { computeGenesisReplayAnalyticsV1 } from "./genesisReplayAnalyticsV1.js";
import { computeGenesisReplayEvolutionV1 } from "./genesisReplayEvolutionV1.js";
import { handleStripeCheckoutCreate, handleStripeMembershipWebhook } from "./stripeWebhookMembership.js";
import { buildRealityHealthPayload } from "./edgeRealityConsistencyV1.js";

/** Render / Fly / Railway: `PORT` — yoksa `CASTLE_GATEWAY_PORT` — yoksa 8090. */
const PORT =
  Number(process.env.PORT) ||
  Number(process.env.CASTLE_GATEWAY_PORT) ||
  8090;
/** Spiral / world WebSocket server — set after `wss` init; used by genesis runtime surface. */
let spiralWssForGenesis = null;
const MAX_MESSAGE_BYTES = Number(process.env.CASTLE_MAX_MESSAGE_BYTES || 32 * 1024);
const REQUIRED_GATEWAY_TOKEN = process.env.CASTLE_GATEWAY_TOKEN || "";
const ALLOWED_ORIGINS = (process.env.CASTLE_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function normalizeHttpOrigin(origin) {
  return String(origin || "")
    .trim()
    .replace(/\/+$/, "");
}

/** HTTP CORS: `CASTLE_ALLOWED_ORIGINS` + `CASTLE_HTTP_CORS_ORIGIN` (tek origin); `CASTLE_HTTP_CORS_ORIGIN=*` → wildcard. */
function buildHttpCorsOriginAllowSet() {
  const set = new Set();
  for (const o of ALLOWED_ORIGINS) {
    const n = normalizeHttpOrigin(o);
    if (n) set.add(n);
  }
  const primary = normalizeHttpOrigin(process.env.CASTLE_HTTP_CORS_ORIGIN);
  if (primary && primary !== "*") set.add(primary);
  return set;
}

const HTTP_CORS_ORIGIN_ALLOW_SET = buildHttpCorsOriginAllowSet();

/**
 * Tarayıcı `Origin` ile tam eşleşme ister. Tek sabit `CASTLE_HTTP_CORS_ORIGIN` yeterli değil:
 * örn. `web.app` vs `firebaseapp.com` veya Render’da yanlış/eksik env.
 * @returns {string|null} `Access-Control-Allow-Origin` değeri; null = başlık yok (istemci CORS fail).
 */
function accessControlAllowOriginValue(req) {
  const primaryEnv = normalizeHttpOrigin(process.env.CASTLE_HTTP_CORS_ORIGIN);
  if (primaryEnv === "*") return "*";
  const reqOrigin = normalizeHttpOrigin(req.headers?.origin);
  if (HTTP_CORS_ORIGIN_ALLOW_SET.size === 0) return "*";
  if (!reqOrigin) return "*";
  if (HTTP_CORS_ORIGIN_ALLOW_SET.has(reqOrigin)) return reqOrigin;
  return null;
}

function applyHttpCorsHeaders(req, res) {
  const allow = accessControlAllowOriginValue(req);
  if (allow) {
    res.setHeader("Access-Control-Allow-Origin", allow);
    if (allow !== "*") res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Castle-Dev-Uid, X-Castle-Guest-Id, X-Castle-Gateway-Token, X-Rhizoh-Outcome-Signature, X-Rhizoh-Outcome-Source-Token"
  );
}
const REQUIRE_AUTH = process.env.CASTLE_REQUIRE_AUTH === "true";
const ALLOW_DEV_ANON = process.env.CASTLE_ALLOW_DEV_ANON !== "false";
const ALLOW_DEV_HTTP_UID = process.env.CASTLE_ALLOW_DEV_HTTP_UID !== "false";
/** Presence mesh: allow `X-Castle-Guest-Id` when Firebase auth absent (default on). Set `false` to require auth only. */
const ALLOW_MESH_GUEST = process.env.CASTLE_ALLOW_MESH_GUEST !== "false";
const SOCIAL_RETRY_MAX = Math.max(0, Math.min(5, Number(process.env.CASTLE_SOCIAL_RETRY_MAX || 2)));
const SOCIAL_RETRY_BASE_MS = Math.max(100, Number(process.env.CASTLE_SOCIAL_RETRY_BASE_MS || 700));
const TELEGRAM_BOT_TOKEN = process.env.CASTLE_TELEGRAM_BOT_TOKEN || "";
const WHATSAPP_TOKEN = process.env.CASTLE_WHATSAPP_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.CASTLE_WHATSAPP_PHONE_NUMBER_ID || "";
const RL_RHIZOH_LLM_PER_MIN = Math.max(5, Number(process.env.CASTLE_RL_RHIZOH_LLM_PER_MIN || 40));
const RL_RHIZOH_EXTERNAL_TRUTH_PER_MIN = Math.max(10, Number(process.env.CASTLE_RL_RHIZOH_EXTERNAL_TRUTH_PER_MIN || 120));
const RL_RHIZOH_EXTERNAL_LOSS_BATCH_PER_MIN = Math.max(8, Number(process.env.CASTLE_RL_RHIZOH_EXTERNAL_LOSS_BATCH_PER_MIN || 48));
const RL_RHIZOH_PRODUCT_OUTCOME_PER_MIN = Math.max(4, Number(process.env.CASTLE_RL_RHIZOH_PRODUCT_OUTCOME_PER_MIN || 24));
const RL_RHIZOH_PRODUCT_OUTCOME_SUBJECT_PER_MIN = Math.max(
  4,
  Number(process.env.CASTLE_RL_RHIZOH_PRODUCT_OUTCOME_SUBJECT_PER_MIN || 18)
);
const RL_EPISTEMIC_SEAL_PER_MIN = Math.max(10, Number(process.env.CASTLE_RL_EPISTEMIC_SEAL_PER_MIN || 120));
const RL_EPISTEMIC_LOG_PER_MIN = Math.max(20, Number(process.env.CASTLE_RL_EPISTEMIC_LOG_PER_MIN || 240));
const EPISTEMIC_SEAL_SECRET = String(
  process.env.CASTLE_EPISTEMIC_SEAL_SECRET || process.env.CASTLE_GATEWAY_TOKEN || ""
).trim();
const RL_LLM_CONN_TEST_PER_MIN = Math.max(2, Number(process.env.CASTLE_RL_LLM_CONNECTION_TEST_PER_MIN || 8));

/** One-shot production warnings: CORS surface, auth toggle, dev bypass flags (observatory deploy hygiene). */
function logProductionObservatorySurfaceGuardsV0() {
  if (String(process.env.NODE_ENV || "").toLowerCase() !== "production") return;
  const tag = "[GATEWAY_PROD_GUARD]";
  const primaryCors = normalizeHttpOrigin(process.env.CASTLE_HTTP_CORS_ORIGIN);
  const corsListEmpty = ALLOWED_ORIGINS.length === 0;
  if (corsListEmpty && !primaryCors) {
    console.warn(
      `${tag} CORS: CASTLE_ALLOWED_ORIGINS empty and CASTLE_HTTP_CORS_ORIGIN empty — browser SSE/replay may fail; set explicit Firebase Hosting origins`
    );
  } else if (corsListEmpty && primaryCors && primaryCors !== "*") {
    console.warn(
      `${tag} CORS: CASTLE_ALLOWED_ORIGINS empty — only CASTLE_HTTP_CORS_ORIGIN set; add web.app + firebaseapp.com (and previews) to CASTLE_ALLOWED_ORIGINS if clients use alternate hostnames`
    );
  }
  if (primaryCors && /localhost|127\.0\.0\.1/i.test(primaryCors)) {
    console.warn(`${tag} CORS: CASTLE_HTTP_CORS_ORIGIN is localhost while NODE_ENV=production`);
  }
  if (REQUIRE_AUTH) {
    console.warn(
      `${tag} AUTH: CASTLE_REQUIRE_AUTH=true — clients must send a valid gateway credential (otherwise silent 401 on replay/SSE); EventSource cannot set custom headers unless proxied`
    );
    if (REQUIRED_GATEWAY_TOKEN.length < 16) {
      console.warn(`${tag} AUTH: CASTLE_GATEWAY_TOKEN missing or short while require-auth enabled`);
    }
  }
  if (ALLOW_DEV_ANON) {
    console.warn(
      `${tag} DEV: CASTLE_ALLOW_DEV_ANON is not "false" — dev anonymous path may be live in production (set CASTLE_ALLOW_DEV_ANON=false)`
    );
  }
  if (ALLOW_DEV_HTTP_UID) {
    console.warn(
      `${tag} DEV: CASTLE_ALLOW_DEV_HTTP_UID is not "false" — X-Castle-Dev-Uid bypass risk (set CASTLE_ALLOW_DEV_HTTP_UID=false)`
    );
  }
}

const rhizohRuntime = initRhizoh();

/** İstemci: llmKeySource veya keySource — env | user_connection | auto */
function normalizeClientLlmKeySource(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "env" || s === "server") return "env";
  if (s === "user_connection" || s === "connection" || s === "user") return "user_connection";
  if (s === "auto" || s === "") return "auto";
  return null;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function logRhizohHealth(stage, detail = {}) {
  try {
    console.info(`[RHIZOH_OK] ${String(stage || "unknown")}`, detail && typeof detail === "object" ? detail : {});
  } catch {
    /* noop */
  }
}

function renderInfraMetricsProm() {
  const lines = [
    `castle_gateway_events_processed_total ${infraMetrics.eventsProcessed}`,
    `castle_gateway_duplicate_reject_total ${infraMetrics.duplicateRejects}`,
    `castle_gateway_enqueue_latency_ms ${infraMetrics.enqueueLatencyMs}`,
    `castle_gateway_queue_depth ${infraMetrics.queueDepth}`,
    `castle_gateway_queue_lag_seconds ${(Number(infraMetrics.queueLag || 0) / 1000).toFixed(3)}`,
    `castle_gateway_errors_total ${infraMetrics.errors}`
  ];
  const buckets = infraMetrics.enqueueLatencyBuckets || {};
  for (const k of Object.keys(buckets)) {
    lines.push(`castle_gateway_enqueue_latency_bucket{le="${k}"} ${buckets[k]}`);
  }
  lines.push(`castle_gateway_enqueue_latency_bucket{le="+Inf"} ${infraMetrics.eventsProcessed}`);
  return lines.join("\n");
}

async function fetchJsonWithTimeout(url, timeoutMs = 1200) {
  const ctl = new AbortController();
  const tid = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHttpPathname(req) {
  let p = String(req.url || "").split("?")[0];
  /* Reverse proxies / clients sometimes append `/` — avoid silent 404 on e.g. `/rhizoh/genesis/stream/`. */
  while (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1);
  }
  return p;
}

function rhizohLlmEnvConfigured() {
  const p = String(process.env.CASTLE_LLM_PROVIDER || "openai").toLowerCase();
  const key =
    p === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : p === "gemini"
        ? process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
        : p === "xai"
          ? process.env.XAI_API_KEY
          : p === "deepseek"
            ? process.env.DEEPSEEK_API_KEY
            : p === "mistral"
              ? process.env.MISTRAL_API_KEY
              : p === "openrouter"
                ? process.env.OPENROUTER_API_KEY
                : process.env.OPENAI_API_KEY;
  return !!String(key || "").trim();
}

/**
 * @param {import("firebase-admin/firestore").Firestore | null} db
 * @param {number} timeoutMs
 */
async function probeFirestoreReachable(db, timeoutMs = 2000) {
  if (!db) return { ok: false, reason: "no_db" };
  const timeout = sleep(timeoutMs).then(() => ({ ok: false, reason: "timeout" }));
  const work = db
    .collection("_castle_gateway_health")
    .doc("ping")
    .get()
    .then(() => ({ ok: true, reason: "reachable" }))
    .catch((e) => ({ ok: false, reason: String(e?.message || e || "firestore_error") }));
  return Promise.race([work, timeout]);
}

function stripHtml(text = "") {
  return String(text)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function haversineMeters(aLat, aLon, bLat, bLon) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const sa = Math.sin(dLat / 2);
  const sb = Math.sin(dLon / 2);
  const x = sa * sa + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * sb * sb;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function checkPublishTargetHealth(protocol, target) {
  const p = String(protocol || "").toUpperCase();
  const t = String(target || "").trim();
  if (!t) return { ok: false, reason: "target_missing", shouldReconnect: false };
  if (p === "RTMP") {
    const ok = t.startsWith("rtmp://") || t.startsWith("rtmps://");
    return { ok, reason: ok ? "rtmp_target_format_ok" : "invalid_rtmp_target", shouldReconnect: !ok, reconnectInSec: 15 };
  }
  if (p === "WHIP" || p === "SFU") {
    try {
      const res = await fetch(t, { method: "OPTIONS" });
      const ok = res.status < 500;
      return { ok, reason: `http_${res.status}`, shouldReconnect: !ok, reconnectInSec: 8 };
    } catch {
      return { ok: false, reason: "network_unreachable", shouldReconnect: true, reconnectInSec: 8 };
    }
  }
  return { ok: true, reason: "unchecked_protocol", shouldReconnect: false };
}

async function fetchTextFromUrl(url) {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`fetch_${res.status}`);
  const ct = String(res.headers.get("content-type") || "");
  if (ct.includes("application/pdf")) throw new Error("pdf_binary_not_supported_directly");
  const body = await res.text();
  return stripHtml(body).slice(0, 14000);
}

function buildTaskActionGraph(task = "", context = {}) {
  const t = String(task || "").toLowerCase();
  if (t.includes("dinner") || t.includes("akşam yemeği") || t.includes("aksam yemegi")) {
    return {
      taskTitle: "Dinner Prep Planner",
      nodes: [
        { id: "n1", title: "Kitchen preheat", action: "smart-oven.preheat", params: { temperatureC: 190, mode: "fan" } },
        { id: "n2", title: "Lighting comfort", action: "smart-light.set_scene", params: { scene: "warm_dinner" } },
        { id: "n3", title: "Fridge inventory check", action: "smart-fridge.inventory_scan", params: {} },
        { id: "n4", title: "Reminder notification", action: "smart-watch.notify", params: { text: "Dinner prep started." } }
      ],
      edges: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" }
      ]
    };
  }
  return {
    taskTitle: task || "General Planner",
    nodes: [
      { id: "n1", title: "Safety check", action: "device.safety_check", params: { context } },
      { id: "n2", title: "Primary action", action: "device.execute_task", params: { task } },
      { id: "n3", title: "Report", action: "studio.timeline_note", params: { task } }
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" }
    ]
  };
}

function buildEthicsPrograms() {
  return {
    policyVersion: "v1",
    tracks: [
      {
        id: "elderly-care-assist",
        audience: "elderly",
        title: "Elderly Assistance Track",
        principles: ["human-in-the-loop", "consent-first", "low-friction alerts"],
        modules: ["medication-reminder", "fall-risk-check", "family-notify", "daily-companion-brief"]
      },
      {
        id: "kids-safe-learning",
        audience: "children",
        title: "Kids Safe Learning Track",
        principles: ["guardian-consent", "age-appropriate-language", "content-filtering"],
        modules: ["study-coach", "screen-time-balance", "safe-social-share", "emergency-contact"]
      }
    ]
  };
}

async function deliverViaTelegram(channel, text) {
  const chatId = String(channel.endpoint || "").trim();
  if (!TELEGRAM_BOT_TOKEN) throw new Error("telegram_token_missing");
  if (!chatId) throw new Error("telegram_chat_id_missing");
  const url = `https://api.telegram.org/bot${encodeURIComponent(TELEGRAM_BOT_TOKEN)}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!res.ok) throw new Error(`telegram_http_${res.status}`);
  return { provider: "telegram", status: res.status };
}

async function deliverViaWhatsapp(channel, text) {
  const to = String(channel.endpoint || "").trim();
  if (!WHATSAPP_TOKEN) throw new Error("whatsapp_token_missing");
  if (!WHATSAPP_PHONE_NUMBER_ID) throw new Error("whatsapp_phone_number_id_missing");
  if (!to) throw new Error("whatsapp_to_missing");
  const url = `https://graph.facebook.com/v22.0/${encodeURIComponent(WHATSAPP_PHONE_NUMBER_ID)}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } })
  });
  if (!res.ok) throw new Error(`whatsapp_http_${res.status}`);
  return { provider: "whatsapp", status: res.status };
}

async function deliverViaWebhook(channel, text) {
  const endpoint = String(channel.endpoint || "").trim();
  if (!endpoint) throw new Error("webhook_endpoint_missing");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, platform: channel.platform || "webhook", ts: Date.now() })
  });
  if (!res.ok) throw new Error(`webhook_http_${res.status}`);
  return { provider: "webhook", status: res.status };
}

async function deliverSocialMessage(channel, text) {
  const platform = String(channel.platform || "webhook").toLowerCase();
  if (platform === "telegram") return deliverViaTelegram(channel, text);
  if (platform === "whatsapp") return deliverViaWhatsapp(channel, text);
  return deliverViaWebhook(channel, text);
}

async function deliverSocialWithRetry(channel, text) {
  let attempt = 0;
  let lastError = null;
  while (attempt <= SOCIAL_RETRY_MAX) {
    try {
      const result = await deliverSocialMessage(channel, text);
      return { ok: true, attempt: attempt + 1, ...result };
    } catch (error) {
      lastError = error;
      if (attempt >= SOCIAL_RETRY_MAX) break;
      const jitter = Math.floor(Math.random() * 90);
      await sleep(SOCIAL_RETRY_BASE_MS * Math.pow(2, attempt) + jitter);
    }
    attempt += 1;
  }
  return { ok: false, attempt: attempt + 1, error: String(lastError?.message || "delivery_failed") };
}

async function dispatchCommandToAdapter(device, command) {
  const adapter = String(command?.adapter || device?.adapter || "websocket").toLowerCase();
  const endpoint = String(device?.endpoint || "").trim();
  if (!endpoint) throw new Error("device_endpoint_missing");
  if (adapter === "mqtt") {
    // MQTT delivery is proxied via a bridge endpoint (HTTP webhook style).
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "mqtt-command",
        topic: `castle/devices/${device.id}/commands`,
        action: command.action,
        params: command.params || {}
      })
    });
    if (!res.ok) throw new Error(`mqtt_bridge_http_${res.status}`);
    return { ok: true, adapter, via: "http-bridge", status: res.status };
  }
  if (!endpoint.startsWith("ws://") && !endpoint.startsWith("wss://")) throw new Error("invalid_websocket_endpoint");
  const sendResult = await new Promise((resolve, reject) => {
    const ws = new WebSocket(endpoint);
    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch {
        /* noop */
      }
      reject(new Error("websocket_timeout"));
    }, 3000);
    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          type: "castle-command",
          commandId: command.id,
          deviceId: command.deviceId,
          action: command.action,
          params: command.params || {}
        }),
        (err) => {
          clearTimeout(timer);
          ws.close();
          if (err) reject(new Error("websocket_send_failed"));
          else resolve({ ok: true, adapter: "websocket", via: "ws" });
        }
      );
    });
    ws.on("error", () => {
      clearTimeout(timer);
      reject(new Error("websocket_connect_failed"));
    });
  });
  return sendResult;
}

function readHttpJson(req, limit = 128 * 1024) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      if (Buffer.byteLength(buf, "utf8") > limit) reject(new Error("payload_too_large"));
    });
    req.on("end", () => {
      if (!buf) return resolve({});
      const payload = safeJsonParse(buf);
      if (!payload || typeof payload !== "object") return reject(new Error("invalid_json_payload"));
      resolve(payload);
    });
    req.on("error", reject);
  });
}

/** Ham gövde (HMAC doğrulaması için). */
function readHttpBodyText(req, limit = 128 * 1024) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      if (Buffer.byteLength(buf, "utf8") > limit) reject(new Error("payload_too_large"));
    });
    req.on("end", () => resolve(buf));
    req.on("error", reject);
  });
}

function maskOpaqueId(value) {
  const t = String(value || "");
  if (!t) return "(empty)";
  if (t.length <= 8) return "****";
  return `${t.slice(0, 4)}…${t.slice(-2)}`;
}

function readGatewayHttpToken(req) {
  const x = String(req.headers?.["x-castle-gateway-token"] || "").trim();
  if (x) return x;
  const auth = String(req.headers?.authorization || "");
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  return m ? String(m[1] || "").trim() : "";
}

async function resolveHttpUser(req) {
  const authResult = await verifyClientToken(req);
  if (authResult?.ok && authResult.user?.uid) {
    return { ok: true, uid: String(authResult.user.uid), mode: authResult.kind || "auth" };
  }
  if (ALLOW_DEV_ANON && ALLOW_DEV_HTTP_UID) {
    const devUid = String(req.headers?.["x-castle-dev-uid"] || "").trim();
    if (devUid) return { ok: true, uid: `dev-${devUid.slice(0, 64)}`, mode: "dev-header" };
  }
  return { ok: false, reason: authResult?.reason || "auth_required" };
}

/** Mesh actor: Firebase uid, dev header, or `guest:<uuid>` via header / `guestId` query (SSE cannot set headers). */
async function resolveMeshActor(req) {
  const auth = await resolveHttpUser(req);
  if (auth.ok) return { ok: true, clientUid: auth.uid, mode: auth.mode };
  if (ALLOW_MESH_GUEST) {
    const q = new URL(String(req.url || ""), "http://localhost");
    const gid = String(req.headers?.["x-castle-guest-id"] || q.searchParams.get("guestId") || "").trim();
    if (gid) {
      const normalized = gid.startsWith("guest:") ? gid.slice(0, 180) : `guest:${gid.slice(0, 160)}`;
      return { ok: true, clientUid: normalized, mode: "guest-header" };
    }
  }
  return { ok: false, reason: "mesh_auth_required" };
}

/** Live genesis runtime JSON (GET /rhizoh/genesis/runtime + SSE infra sampler). */
async function buildGenesisRuntimeSurfacePayloadLive() {
  const workerBase = String(process.env.WORKER_INFRA_URL || "").trim();
  const worker = workerBase ? await fetchJsonWithTimeout(`${workerBase.replace(/\/+$/, "")}/infra/health`) : null;
  const scored = scoreHealth(infraMetrics, {
    divergenceTotal: Number(worker?.metrics?.divergenceTotal || 0)
  });
  let spiralWsActive = 0;
  if (spiralWssForGenesis) {
    for (const c of spiralWssForGenesis.clients) {
      if (c.readyState === 1) spiralWsActive += 1;
    }
  }
  const base = buildGenesisRuntimeSurfacePayload({
    infraMetrics,
    scoredHealth: scored,
    rhizohEnterpriseMetrics,
    mesh: meshContinuityAggregate(),
    workerHealth: worker,
    port: PORT,
    spiralWebSocketClientsActive: spiralWsActive
  });
  return {
    ...base,
    replayFingerprint: computeGenesisReplayFingerprintV0(base),
    gatewayCapabilities: buildGenesisGatewayCapabilitiesV0(),
    genesisStream: {
      schema: "castle.genesis.stream_cursor.v0",
      lastAcceptedSeq: getGenesisContinuitySeq(),
      eventArchive: genesisContinuityEventArchiveEnabled()
        ? {
            enabled: true,
            projection: GENESIS_CONTINUITY_EVENT_ARCHIVE_QUERY_PROJECTION,
            queryPath: rhizohRuntime.routes.genesisContinuityEvents
          }
        : { enabled: false },
      replayRouter: {
        schema: GENESIS_REPLAY_ROUTER_SCHEMA,
        queryPath: rhizohRuntime.routes.genesisReplay,
        queryHint: "from=&to= or range=from-to; optional type=&checkpoints=0",
        temporalDiffPath: rhizohRuntime.routes.genesisReplayDiff,
        temporalDiffSchema: GENESIS_REPLAY_TEMPORAL_DIFF_SCHEMA,
        equivalencePath: rhizohRuntime.routes.genesisReplayEquivalence,
        analyticsPath: rhizohRuntime.routes.genesisReplayAnalytics,
        evolutionPath: rhizohRuntime.routes.genesisReplayEvolution
      }
    }
  };
}

const httpServer = createServer(async (req, res) => {
  applyHttpCorsHeaders(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const pathname = getHttpPathname(req);

  if (req.method === "GET" && pathname === "/rhizoh/genesis/__ping") {
    sendJson(res, 200, {
      ok: true,
      pid: process.pid,
      entry: __filename,
      time: Date.now(),
      genesis: true
    });
    return;
  }

  if (req.method === "POST" && pathname === "/webhooks/stripe") {
    await handleStripeMembershipWebhook(req, res);
    return;
  }

  if (req.method === "POST" && pathname === "/billing/stripe/checkout") {
    await handleStripeCheckoutCreate(req, res, { readHttpJson, resolveHttpUser, sendJson });
    return;
  }

  if (req.method === "GET" && pathname === "/health/live") {
    if (process.env.CASTLE_GATEWAY_MAINTENANCE === "true") {
      sendJson(res, 503, { ok: false, live: false, dns: true, phase: "maintenance", service: "castle-gateway" });
      return;
    }
    sendJson(res, 200, { ok: true, live: true, dns: true, service: "castle-gateway", ts: Date.now() });
    return;
  }

  if (req.method === "GET" && pathname === "/health/ready") {
    if (process.env.CASTLE_GATEWAY_MAINTENANCE === "true") {
      sendJson(res, 503, { ok: false, ready: false, phase: "maintenance", service: "castle-gateway" });
      return;
    }
    try {
      const persistence = getFirebasePersistence();
      const llmProbe = rhizohLlmEnvConfigured();
      sendJson(res, 200, {
        ok: true,
        ready: true,
        dns: true,
        persistence: persistence.mode,
        service: "castle-gateway",
        gateway: "ok",
        llm: llmProbe ? "ok" : "degraded",
        spine: llmProbe ? "ok" : "partial"
      });
    } catch (e) {
      sendJson(res, 503, { ok: false, ready: false, reason: String(e?.message || e), service: "castle-gateway" });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/health/reality") {
    const payload = buildRealityHealthPayload();
    sendJson(res, payload.ok ? 200 : 503, payload);
    return;
  }

  if (req.method === "GET" && pathname === "/health/deps") {
    const t0 = Date.now();
    if (process.env.CASTLE_GATEWAY_MAINTENANCE === "true") {
      sendJson(res, 503, {
        ok: false,
        dns: true,
        llm: false,
        firestore: false,
        phase: "maintenance",
        latencyMs: Date.now() - t0,
        service: "castle-gateway"
      });
      return;
    }
    const persistence = getFirebasePersistence();
    let firestoreOk = persistence.mode !== "firebase";
    let firestoreDetail = persistence.mode === "file" ? "file_mode" : "not_applicable";
    if (persistence.mode === "firebase" && persistence.db) {
      const pr = await probeFirestoreReachable(persistence.db, 2000);
      firestoreOk = pr.ok;
      firestoreDetail = pr.reason || (pr.ok ? "reachable" : "fail");
    } else if (persistence.mode === "firebase" && !persistence.db) {
      firestoreOk = false;
      firestoreDetail = "firebase_not_initialized";
    }
    const llmOk = rhizohLlmEnvConfigured();
    const overallOk = llmOk && firestoreOk;
    const latencyMs = Date.now() - t0;
    sendJson(res, 200, {
      ok: overallOk,
      dns: true,
      llm: llmOk,
      firestore: persistence.mode === "firebase" ? firestoreOk : false,
      persistence: persistence.mode,
      firestoreDetail,
      latencyMs,
      service: "castle-gateway",
      wsPort: PORT
    });
    return;
  }

  if (req.method === "GET" && pathname === "/health") {
    const persistence = getFirebasePersistence();
    sendJson(res, 200, {
      ok: true,
      service: "castle-gateway",
      wsPort: PORT,
      persistence: persistence.mode,
      presenceMesh: "sse"
    });
    return;
  }

  if (req.method === "GET" && pathname === "/infra/health") {
    const workerBase = String(process.env.WORKER_INFRA_URL || "").trim();
    const worker = workerBase ? await fetchJsonWithTimeout(`${workerBase.replace(/\/+$/, "")}/infra/health`) : null;
    const scored = scoreHealth(infraMetrics, {
      divergenceTotal: Number(worker?.metrics?.divergenceTotal || 0)
    });
    sendJson(res, 200, {
      ok: true,
      role: "gateway",
      queueLagMs: infraMetrics.queueLag,
      queueDepth: infraMetrics.queueDepth,
      errors: infraMetrics.errors,
      status: scored.status,
      score: scored.score,
      reasons: scored.reasons,
      worker: worker
        ? {
            status: worker.status,
            score: worker.score,
            reasons: worker.reasons
          }
        : null,
      timestamp: Date.now()
    });
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisRuntime) {
    const payload = await buildGenesisRuntimeSurfacePayloadLive();
    sendJson(res, 200, payload);
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisStream) {
    const corsOrigin = accessControlAllowOriginValue(req);
    if (!corsOrigin && String(process.env.NODE_ENV || "").toLowerCase() === "production") {
      const og = String(req.headers?.origin || "").trim();
      if (og) {
        console.warn("[GATEWAY] genesis SSE: missing Access-Control-Allow-Origin for browser Origin (CORS whitelist mismatch):", og);
      }
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.flushHeaders?.();
    res.write("retry: 3000\n\n");
    res.write(": genesis continuity stream\n\n");
    res.write("event: genesis\n");
    res.write(`data: {"booted":true,"pid":${process.pid}}\n\n`);
    registerGenesisSseClient(res, req);
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisCheckpointLatest) {
    const cp = getLatestGenesisSignedCheckpoint();
    if (!cp) {
      sendJson(res, 404, { ok: false, error: "no_checkpoint_yet", hint: "wait_for_seq_interval_or_configure_signing_secret" });
      return;
    }
    sendJson(res, 200, { ok: true, checkpoint: cp });
    return;
  }

  if (req.method === "GET" && pathname.startsWith(rhizohRuntime.routes.genesisCheckpointBySeqPrefix)) {
    const tail = pathname.slice(rhizohRuntime.routes.genesisCheckpointBySeqPrefix.length).split("/")[0];
    const seq = parseInt(String(tail || "").trim(), 10);
    const out = await genesisCheckpointQueryBySeqV0(seq);
    if (out.error === "genesis_ephemeral_mode") {
      sendJson(res, 410, { ok: false, ...out });
      return;
    }
    if (out.error === "genesis_disk_query_unavailable") {
      sendJson(res, 503, { ok: false, ...out });
      return;
    }
    if (!out.ok && out.error === "invalid_seq") {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok && out.error === "checkpoint_not_found") {
      sendJson(res, 404, { ok: false, ...out });
      return;
    }
    if (!out.ok) {
      sendJson(res, 500, { ok: false, ...out });
      return;
    }
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisCheckpointRange) {
    const u = new URL(String(req.url || "/"), `http://${req.headers.host || "localhost"}`);
    const from = parseInt(String(u.searchParams.get("from") || "").trim(), 10);
    const to = parseInt(String(u.searchParams.get("to") || "").trim(), 10);
    const out = await genesisCheckpointQueryRangeV0(from, to);
    if (out.error === "genesis_ephemeral_mode") {
      sendJson(res, 410, { ok: false, ...out });
      return;
    }
    if (out.error === "genesis_disk_query_unavailable") {
      sendJson(res, 503, { ok: false, ...out });
      return;
    }
    if (!out.ok && (out.error === "invalid_range" || out.error === "range_inverted" || out.error === "range_span_too_large")) {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok && out.error === "range_result_cap_exceeded") {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok) {
      sendJson(res, 500, { ok: false, ...out });
      return;
    }
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisCheckpointLineage) {
    const u = new URL(String(req.url || "/"), `http://${req.headers.host || "localhost"}`);
    const seq = parseInt(String(u.searchParams.get("seq") || "").trim(), 10);
    const out = await genesisCheckpointQueryLineageV0(seq);
    if (out.error === "genesis_ephemeral_mode") {
      sendJson(res, 410, { ok: false, ...out });
      return;
    }
    if (out.error === "genesis_disk_query_unavailable") {
      sendJson(res, 503, { ok: false, ...out });
      return;
    }
    if (!out.ok && out.error === "invalid_seq") {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok && out.error === "lineage_result_cap_exceeded") {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok) {
      sendJson(res, 500, { ok: false, ...out });
      return;
    }
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisContinuityEvents) {
    const u = new URL(String(req.url || "/"), `http://${req.headers.host || "localhost"}`);
    const from = parseInt(String(u.searchParams.get("from") || "").trim(), 10);
    const to = parseInt(String(u.searchParams.get("to") || "").trim(), 10);
    const type = String(u.searchParams.get("type") || "").trim();
    const limit = parseInt(String(u.searchParams.get("limit") || "").trim(), 10);
    const out = await queryGenesisContinuityEventArchiveV0(from, to, type, limit);
    if (out.error === "genesis_ephemeral_mode") {
      sendJson(res, 410, { ok: false, ...out });
      return;
    }
    if (out.error === "genesis_disk_query_unavailable" || out.error === "event_archive_disabled") {
      sendJson(res, 503, { ok: false, ...out });
      return;
    }
    if (!out.ok && (out.error === "invalid_range" || out.error === "range_inverted" || out.error === "range_span_too_large")) {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok && out.error === "archive_file_too_large") {
      sendJson(res, 413, { ok: false, ...out });
      return;
    }
    if (!out.ok) {
      sendJson(res, 500, { ok: false, ...out });
      return;
    }
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisReplay) {
    const u = new URL(String(req.url || "/"), `http://${req.headers.host || "localhost"}`);
    let fromSeq = parseInt(String(u.searchParams.get("from") || "").trim(), 10);
    let toSeq = parseInt(String(u.searchParams.get("to") || "").trim(), 10);
    const rangeRaw = String(u.searchParams.get("range") || "").trim();
    if ((!Number.isFinite(fromSeq) || !Number.isFinite(toSeq) || fromSeq <= 0 || toSeq <= 0) && rangeRaw) {
      const m = rangeRaw.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        fromSeq = parseInt(m[1], 10);
        toSeq = parseInt(m[2], 10);
      }
    }
    const type = String(u.searchParams.get("type") || "").trim();
    const checkpointsRaw = String(u.searchParams.get("checkpoints") ?? "1").trim().toLowerCase();
    const includeCheckpoints = checkpointsRaw !== "0" && checkpointsRaw !== "false";
    const out = await resolveGenesisReplayRouterV1({
      from: fromSeq,
      to: toSeq,
      type,
      includeCheckpoints
    });
    if (!out.ok && (out.error === "invalid_range" || out.error === "range_inverted" || out.error === "range_span_too_large")) {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok) {
      sendJson(res, 500, { ok: false, ...out });
      return;
    }
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisReplayDiff) {
    const u = new URL(String(req.url || "/"), `http://${req.headers.host || "localhost"}`);
    let fromSeq = parseInt(String(u.searchParams.get("from") || "").trim(), 10);
    let toSeq = parseInt(String(u.searchParams.get("to") || "").trim(), 10);
    const rangeRaw = String(u.searchParams.get("range") || "").trim();
    if ((!Number.isFinite(fromSeq) || !Number.isFinite(toSeq) || fromSeq <= 0 || toSeq <= 0) && rangeRaw) {
      const m = rangeRaw.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        fromSeq = parseInt(m[1], 10);
        toSeq = parseInt(m[2], 10);
      }
    }
    const type = String(u.searchParams.get("type") || "").trim();
    const out = await computeGenesisReplayTemporalDiffV1({ from: fromSeq, to: toSeq, type });
    if (!out.ok && (out.error === "invalid_range" || out.error === "range_inverted" || out.error === "range_span_too_large")) {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok) {
      sendJson(res, 500, { ok: false, ...out });
      return;
    }
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisReplayEquivalence) {
    const u = new URL(String(req.url || "/"), `http://${req.headers.host || "localhost"}`);
    const from1 = parseInt(String(u.searchParams.get("from1") || "").trim(), 10);
    const to1 = parseInt(String(u.searchParams.get("to1") || "").trim(), 10);
    const from2 = parseInt(String(u.searchParams.get("from2") || "").trim(), 10);
    const to2 = parseInt(String(u.searchParams.get("to2") || "").trim(), 10);
    const type = String(u.searchParams.get("type") || "").trim();
    const checkpointsRaw = String(u.searchParams.get("checkpoints") ?? "1").trim().toLowerCase();
    const includeCheckpoints = checkpointsRaw !== "0" && checkpointsRaw !== "false";
    const out = await compareGenesisReplayEquivalenceV1({
      from1,
      to1,
      from2,
      to2,
      type,
      includeCheckpoints
    });
    if (
      !out.ok &&
      (out.error === "invalid_range" || out.error === "range_inverted" || out.error === "range_span_too_large")
    ) {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok) {
      sendJson(res, 500, { ok: false, ...out });
      return;
    }
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisReplayAnalytics) {
    const u = new URL(String(req.url || "/"), `http://${req.headers.host || "localhost"}`);
    let fromSeq = parseInt(String(u.searchParams.get("from") || "").trim(), 10);
    let toSeq = parseInt(String(u.searchParams.get("to") || "").trim(), 10);
    const rangeRaw = String(u.searchParams.get("range") || "").trim();
    if ((!Number.isFinite(fromSeq) || !Number.isFinite(toSeq) || fromSeq <= 0 || toSeq <= 0) && rangeRaw) {
      const m = rangeRaw.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        fromSeq = parseInt(m[1], 10);
        toSeq = parseInt(m[2], 10);
      }
    }
    const type = String(u.searchParams.get("type") || "").trim();
    const bins = parseInt(String(u.searchParams.get("bins") || "16").trim(), 10);
    const checkpointsRaw = String(u.searchParams.get("checkpoints") ?? "1").trim().toLowerCase();
    const includeCheckpoints = checkpointsRaw !== "0" && checkpointsRaw !== "false";
    const out = await computeGenesisReplayAnalyticsV1({
      from: fromSeq,
      to: toSeq,
      type,
      bins,
      includeCheckpoints
    });
    if (!out.ok && (out.error === "invalid_range" || out.error === "range_inverted" || out.error === "range_span_too_large")) {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok) {
      sendJson(res, 500, { ok: false, ...out });
      return;
    }
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.genesisReplayEvolution) {
    const u = new URL(String(req.url || "/"), `http://${req.headers.host || "localhost"}`);
    let fromSeq = parseInt(String(u.searchParams.get("from") || "").trim(), 10);
    let toSeq = parseInt(String(u.searchParams.get("to") || "").trim(), 10);
    const rangeRaw = String(u.searchParams.get("range") || "").trim();
    if ((!Number.isFinite(fromSeq) || !Number.isFinite(toSeq) || fromSeq <= 0 || toSeq <= 0) && rangeRaw) {
      const m = rangeRaw.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        fromSeq = parseInt(m[1], 10);
        toSeq = parseInt(m[2], 10);
      }
    }
    const type = String(u.searchParams.get("type") || "").trim();
    const bins = parseInt(String(u.searchParams.get("bins") || "16").trim(), 10);
    const collapseWindows = parseInt(String(u.searchParams.get("collapseWindows") || "0").trim(), 10);
    const checkpointsRaw = String(u.searchParams.get("checkpoints") ?? "1").trim().toLowerCase();
    const includeCheckpoints = checkpointsRaw !== "0" && checkpointsRaw !== "false";
    const out = await computeGenesisReplayEvolutionV1({
      from: fromSeq,
      to: toSeq,
      type,
      bins,
      collapseWindows,
      includeCheckpoints
    });
    if (!out.ok && (out.error === "invalid_range" || out.error === "range_inverted" || out.error === "range_span_too_large")) {
      sendJson(res, 400, { ok: false, ...out });
      return;
    }
    if (!out.ok) {
      sendJson(res, 500, { ok: false, ...out });
      return;
    }
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (req.method === "GET" && pathname === "/infra/metrics") {
    res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" });
    res.end(renderInfraMetricsProm());
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.infraPrometheusMetrics) {
    if (process.env.CASTLE_PROMETHEUS_METRICS !== "1") {
      sendJson(res, 404, { ok: false, error: "prometheus_metrics_disabled" });
      return;
    }
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(renderRhizohPrometheusMetrics());
    return;
  }
  if (req.method === "GET" && pathname.startsWith("/infra/traces/")) {
    const traceId = decodeURIComponent(pathname.slice("/infra/traces/".length));
    const item = await getTraceById(traceId);
    if (!item) return sendJson(res, 404, { ok: false, error: "trace_not_found" });
    return sendJson(res, 200, { ok: true, trace: item });
  }
  if (req.method === "GET" && pathname === "/infra/traces") {
    const u = new URL(String(req.url || "/infra/traces"), `http://${req.headers.host || "localhost"}`);
    const sessionId = String(u.searchParams.get("sessionId") || "").trim();
    const items = sessionId ? await listTracesBySession(sessionId) : [];
    return sendJson(res, 200, { ok: true, sessionId, traces: items });
  }

  /** Presence room mesh (C): JOIN / LEAVE / SNAPSHOT / DELTA / REPLAY (HTTP); SUBSCRIBE = SSE stream. */
  if (req.method === "POST" && pathname === "/presence/mesh/join") {
    const actor = await resolveMeshActor(req);
    if (!actor.ok) return sendJson(res, 401, { ok: false, error: actor.reason });
    try {
      const body = await readHttpJson(req, 16 * 1024);
      const roomUid = String(body?.roomUid || "").trim();
      if (!roomUid) return sendJson(res, 400, { ok: false, error: "roomUid_required" });
      meshJoin(roomUid, actor.clientUid);
      sendJson(res, 200, { ok: true, roomUid, clientUid: actor.clientUid });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e) });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/presence/mesh/leave") {
    const actor = await resolveMeshActor(req);
    if (!actor.ok) return sendJson(res, 401, { ok: false, error: actor.reason });
    try {
      const body = await readHttpJson(req, 16 * 1024);
      const roomUid = String(body?.roomUid || "").trim();
      if (!roomUid) return sendJson(res, 400, { ok: false, error: "roomUid_required" });
      meshLeave(roomUid, actor.clientUid);
      sendJson(res, 200, { ok: true, roomUid });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e) });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/presence/mesh/snapshot") {
    const actor = await resolveMeshActor(req);
    if (!actor.ok) return sendJson(res, 401, { ok: false, error: actor.reason });
    try {
      const body = await readHttpJson(req, 16 * 1024);
      const roomUid = String(body?.roomUid || "").trim();
      if (!roomUid) return sendJson(res, 400, { ok: false, error: "roomUid_required" });
      sendJson(res, 200, meshSnapshot(roomUid));
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e) });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/presence/mesh/delta") {
    const actor = await resolveMeshActor(req);
    if (!actor.ok) return sendJson(res, 401, { ok: false, error: actor.reason });
    try {
      const body = await readHttpJson(req, MAX_MESSAGE_BYTES);
      const roomUid = String(body?.roomUid || "").trim();
      if (!roomUid) return sendJson(res, 400, { ok: false, error: "roomUid_required" });
      const seq = meshAppendDelta(roomUid, actor.clientUid, {
        node: body?.node,
        projectionPatch: body?.projectionPatch,
        writerSubject: body?.writerSubject
      });
      sendJson(res, 200, { ok: true, roomUid, seq });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e) });
    }
    return;
  }

  if (req.method === "POST" && pathname === "/presence/mesh/replay") {
    const actor = await resolveMeshActor(req);
    if (!actor.ok) return sendJson(res, 401, { ok: false, error: actor.reason });
    try {
      const body = await readHttpJson(req, 16 * 1024);
      const roomUid = String(body?.roomUid || "").trim();
      if (!roomUid) return sendJson(res, 400, { ok: false, error: "roomUid_required" });
      const fromNodeId = body?.fromNodeId != null ? String(body.fromNodeId) : "";
      const fromSeq = body?.fromSeq;
      if (fromNodeId) {
        sendJson(res, 200, meshReplayFromNodeId(roomUid, fromNodeId));
        return;
      }
      sendJson(res, 200, meshReplayFromSeq(roomUid, fromSeq));
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e) });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/presence/mesh/subscribe") {
    const actor = await resolveMeshActor(req);
    if (!actor.ok) return sendJson(res, 401, { ok: false, error: actor.reason });
    const q = new URL(String(req.url || ""), "http://localhost");
    const roomUid = String(q.searchParams.get("roomUid") || "").trim();
    if (!roomUid) return sendJson(res, 400, { ok: false, error: "roomUid_required" });
    meshJoin(roomUid, actor.clientUid);
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.flushHeaders?.();
    const write = (chunk) => {
      try {
        res.write(chunk);
      } catch {
        /* closed */
      }
    };
    const unsub = meshSubscribeSse(roomUid, write);
    const onClose = () => {
      unsub();
      meshLeave(roomUid, actor.clientUid);
      try {
        res.end();
      } catch {
        /* ignore */
      }
    };
    req.on("close", onClose);
    req.on("aborted", onClose);
    return;
  }

  if (req.method === "GET" && req.url === "/llm/connections") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    sendJson(res, 200, { ok: true, uid: auth.uid, mode: auth.mode, items: await listConnections(auth.uid) });
    return;
  }

  if (req.method === "POST" && req.url === "/llm/connections") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const id = await createConnection(auth.uid, payload);
      if (payload?.isDefault) await setDefaultConnection(auth.uid, id);
      sendJson(res, 200, { ok: true, id, items: await listConnections(auth.uid) });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "create_connection_failed" });
    }
    return;
  }

  if (req.method === "PATCH" && String(req.url || "").startsWith("/llm/connections/")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const id = String(req.url || "").split("/").pop() || "";
    try {
      const payload = await readHttpJson(req);
      await updateConnection(auth.uid, id, payload);
      if (payload?.isDefault) await setDefaultConnection(auth.uid, id);
      sendJson(res, 200, { ok: true, id, items: await listConnections(auth.uid) });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "update_connection_failed" });
    }
    return;
  }

  if (req.method === "DELETE" && String(req.url || "").startsWith("/llm/connections/")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const id = String(req.url || "").split("/").pop() || "";
    try {
      await deleteConnection(auth.uid, id);
      sendJson(res, 200, { ok: true, id, items: await listConnections(auth.uid) });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "delete_connection_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/llm/connections/test") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      if (!checkHttpRateLimit(`llm_conn_test:${auth.uid}`, RL_LLM_CONN_TEST_PER_MIN, 60_000)) {
        return sendJson(res, 429, { ok: false, error: "rate_limit_exceeded" });
      }
      const hasBodyKey = !!String(payload?.apiKey || "").trim();
      const result = await queryRhizohLlm(
        {
          message: String(payload?.message || "Ping from Castle Gateway"),
          context: payload?.context || { source: "connection_test" },
          provider: payload?.provider,
          model: payload?.model,
          apiKey: payload?.apiKey || ""
        },
        { allowExternalApiKey: true, llmKeySource: hasBodyKey ? "auto" : "env" }
      );
      logLlmAccess({
        route: "/llm/connections/test",
        uid: auth.uid,
        llmKeyBillingOwner: result.llmKeyBillingOwner,
        llmKeyOrigin: result.llmKeyOrigin,
        provider: result.provider,
        model: result.model,
        connectionId: null
      });
      sendJson(res, 200, { ok: true, result });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "connection_test_failed" });
    }
    return;
  }

  if (req.method === "GET" && req.url === "/agents/identities") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const items = await listAgentIdentities(auth.uid);
    sendJson(res, 200, { ok: true, items });
    return;
  }

  if (req.method === "POST" && req.url === "/agents/identities") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const row = await registerAgentIdentity({
        ownerUid: auth.uid,
        agentId: payload?.agentId,
        role: payload?.role,
        personaSeed: payload?.personaSeed || {},
        capabilityLevel: payload?.capabilityLevel
      });
      sendJson(res, 200, { ok: true, row });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "agent_register_failed" });
    }
    return;
  }

  if (req.method === "PATCH" && String(req.url || "").startsWith("/agents/identities/")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const id = String(req.url || "").split("/").pop() || "";
    try {
      const owns = await getAgentIdentity(id);
      if (!owns || owns.ownerUid !== auth.uid) return sendJson(res, 403, { ok: false, error: "forbidden" });
      const payload = await readHttpJson(req);
      const row = await updateAgentIdentity(id, payload || {});
      sendJson(res, 200, { ok: true, row });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "agent_update_failed" });
    }
    return;
  }

  if (req.method === "GET" && String(req.url || "").startsWith("/academy/events")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const url = new URL(`http://localhost${req.url || "/academy/events"}`);
    const status = String(url.searchParams.get("status") || "");
    const items = await listAcademyEvents({ ownerUid: auth.uid, status, limit: 120 });
    sendJson(res, 200, { ok: true, items });
    return;
  }

  if (req.method === "POST" && req.url === "/academy/events") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const ev = await queueAcademyEvent({
        type: payload?.type,
        roomId: payload?.roomId,
        ownerUid: auth.uid,
        participants: payload?.participants || [],
        topic: payload?.topic || "academy",
        payload: payload?.payload || {}
      });
      sendJson(res, 200, { ok: true, event: ev });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "academy_event_queue_failed" });
    }
    return;
  }

  if (req.method === "POST" && String(req.url || "").startsWith("/academy/events/") && String(req.url || "").endsWith("/resolve")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const parts = String(req.url || "").split("/").filter(Boolean);
    const eventId = parts[2] || "";
    try {
      const payload = await readHttpJson(req);
      const out = await resolveAcademyEvent(eventId, payload || {});
      sendJson(res, 200, { ok: true, event: out });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "academy_event_resolve_failed" });
    }
    return;
  }

  if (req.method === "GET" && String(req.url || "").startsWith("/memory")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const url = new URL(`http://localhost${req.url || "/memory"}`);
    const scope = url.searchParams.get("scope") === "agents" ? "agents" : "users";
    const id = String(url.searchParams.get("id") || (scope === "agents" ? "" : auth.uid));
    const kind = String(url.searchParams.get("kind") || "");
    const limit = Number(url.searchParams.get("limit") || 40);
    if (!id) return sendJson(res, 400, { ok: false, error: "memory_id_required" });
    sendJson(res, 200, { ok: true, scope, id, kind, items: await listMemories({ scope, id, kind, limit }) });
    return;
  }

  if (req.method === "GET" && req.url === "/memory/profile") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const profile = await getPersonaGoalMemory(auth.uid);
    sendJson(res, 200, { ok: true, profile });
    return;
  }

  if (req.method === "POST" && req.url === "/memory/profile") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const profile = await setPersonaGoalMemory({
        uid: auth.uid,
        personaPatch: payload?.personaPatch || {},
        goals: Array.isArray(payload?.goals) ? payload.goals : null,
        preferencesPatch: payload?.preferencesPatch || {}
      });
      sendJson(res, 200, { ok: true, profile });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "profile_write_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/memory/compact") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const scope = payload?.scope === "agents" ? "agents" : "users";
      const id = String(payload?.id || (scope === "users" ? auth.uid : ""));
      if (!id) return sendJson(res, 400, { ok: false, error: "memory_id_required" });
      const out = await autoCompactMemories({ scope, id });
      sendJson(res, 200, { ok: true, scope, id, ...out });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "memory_compact_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/memory/context") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const context = await getMemoryContext({
        uid: auth.uid,
        agentId: String(payload?.agentId || ""),
        query: String(payload?.query || ""),
        limit: Number(payload?.limit || 80)
      });
      sendJson(res, 200, { ok: true, context });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "memory_context_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/event-layer/place-brief") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const placeName = String(payload?.placeName || "").trim();
      if (!placeName) return sendJson(res, 400, { ok: false, error: "placeName_required" });
      const conn = await resolveConnection(auth.uid, String(payload?.connectionId || ""));
      const persona = String(payload?.waypointPersona || payload?.persona || "guide");
      const nominatim = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(placeName)}`;
      const nomRes = await fetch(nominatim, { headers: { "User-Agent": "castle-gateway/1.0" } });
      const nomJson = nomRes.ok ? await nomRes.json() : [];
      const hit = Array.isArray(nomJson) ? nomJson[0] : null;
      const raw = [
        `Place: ${placeName}`,
        hit?.display_name ? `OSM: ${hit.display_name}` : "",
        hit?.type ? `Type: ${hit.type}` : "",
        hit?.lat && hit?.lon ? `Location: ${hit.lat}, ${hit.lon}` : ""
      ]
        .filter(Boolean)
        .join("\n");
      const summary = await queryRhizohLlm(
        {
          message: `Give a concise conversational briefing about this place for a walking-route companion.\nPersona style: ${persona}\n${raw}`,
          context: { source: "event-layer-place-brief", placeName, persona },
          provider: conn?.provider,
          model: conn?.model,
          apiKey: conn?.apiKey || ""
        },
        { llmKeySource: conn?.apiKey ? "user_connection" : "env" }
      );
      await appendMemory({
        scope: "users",
        id: auth.uid,
        kind: "semantic",
        text: `PLACE_BRIEF:${placeName} => ${String(summary.reply || "").slice(0, 900)}`,
        tags: ["place", "brief", "event-layer"],
        importance: 0.62,
        meta: { placeName }
      });
      await addTranscript(auth.uid, {
        source: "route-companion",
        eventType: "place-brief",
        text: `${placeName} -> ${String(summary.reply || "").slice(0, 500)}`,
        roomId: "studio-main",
        meta: {
          placeName,
          directive: summary.directive,
          lat: hit?.lat ? Number(hit.lat) : null,
          lon: hit?.lon ? Number(hit.lon) : null
        }
      });
      sendJson(res, 200, { ok: true, place: hit || null, reply: summary.reply, directive: summary.directive });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "place_brief_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/event-layer/route-brief") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const conn = await resolveConnection(auth.uid, String(payload?.connectionId || ""));
      const waypoints = Array.isArray(payload?.waypoints) ? payload.waypoints.slice(0, 24) : [];
      const out = [];
      for (const wp of waypoints) {
        const name = String(wp?.name || "").trim();
        if (!name) continue;
        const persona = String(wp?.persona || "guide");
        const nominatim = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(name)}`;
        const nomRes = await fetch(nominatim, { headers: { "User-Agent": "castle-gateway/1.0" } });
        const nomJson = nomRes.ok ? await nomRes.json() : [];
        const hit = Array.isArray(nomJson) ? nomJson[0] : null;
        const raw = [
          `Waypoint: ${name}`,
          hit?.display_name ? `OSM: ${hit.display_name}` : "",
          hit?.type ? `Type: ${hit.type}` : "",
          hit?.lat && hit?.lon ? `Location: ${hit.lat}, ${hit.lon}` : ""
        ]
          .filter(Boolean)
          .join("\n");
        const summary = await queryRhizohLlm(
          {
            message: `Generate a concise spoken briefing for route waypoint.\nPersona style: ${persona}\n${raw}`,
            context: { source: "event-layer-route-brief", waypoint: name, persona },
            provider: conn?.provider,
            model: conn?.model,
            apiKey: conn?.apiKey || ""
          },
          { llmKeySource: conn?.apiKey ? "user_connection" : "env" }
        );
        out.push({
          name,
          persona,
          place: hit || null,
          reply: summary.reply,
          directive: summary.directive
        });
      }
      await appendMemory({
        scope: "users",
        id: auth.uid,
        kind: "semantic",
        text: `ROUTE_BRIEF: waypoints=${out.length} ${out.map((x) => `${x.name}:${x.persona}`).join(" | ")}`.slice(0, 1300),
        tags: ["route", "waypoint", "brief", "event-layer"],
        importance: 0.74,
        meta: { count: out.length }
      });
      await addTranscript(auth.uid, {
        source: "route-companion",
        eventType: "route-brief",
        text: out.map((x) => `${x.name}:${String(x.reply || "").slice(0, 140)}`).join(" | ").slice(0, 1400),
        roomId: "studio-main",
        meta: {
          waypointCount: out.length,
          waypoints: out.map((x) => ({
            name: x.name,
            persona: x.persona,
            lat: x.place?.lat ? Number(x.place.lat) : null,
            lon: x.place?.lon ? Number(x.place.lon) : null
          }))
        }
      });
      sendJson(res, 200, { ok: true, items: out });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "route_brief_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/event-layer/pdf-brief") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const title = String(payload?.title || "document");
      const conn = await resolveConnection(auth.uid, String(payload?.connectionId || ""));
      const providedText = String(payload?.text || "");
      const url = String(payload?.url || "");
      let content = providedText;
      if (!content && url) content = await fetchTextFromUrl(url);
      if (!content) return sendJson(res, 400, { ok: false, error: "text_or_supported_url_required" });
      const summary = await queryRhizohLlm(
        {
          message: `Summarize this document and provide key points + practical actions.\nTitle:${title}\nContent:\n${content.slice(0, 12000)}`,
          context: { source: "event-layer-pdf-brief", title },
          provider: conn?.provider,
          model: conn?.model,
          apiKey: conn?.apiKey || ""
        },
        { llmKeySource: conn?.apiKey ? "user_connection" : "env" }
      );
      await appendMemory({
        scope: "users",
        id: auth.uid,
        kind: "semantic",
        text: `DOC_BRIEF:${title} => ${String(summary.reply || "").slice(0, 1000)}`,
        tags: ["document", "brief", "library", "event-layer"],
        importance: 0.7,
        meta: { title, url: url || null }
      });
      await addTranscript(auth.uid, {
        source: "library-brief",
        eventType: "pdf-brief",
        text: `${title} -> ${String(summary.reply || "").slice(0, 500)}`,
        roomId: "studio-main",
        meta: { title }
      });
      sendJson(res, 200, { ok: true, reply: summary.reply, directive: summary.directive });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "pdf_brief_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/pdf/upload") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req, 8 * 1024 * 1024);
      const job = await enqueuePdfJob({
        uid: auth.uid,
        fileName: payload?.fileName || "document.pdf",
        bytesBase64: payload?.contentBase64
      });
      sendJson(res, 200, { ok: true, job });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "pdf_upload_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/studio/publish/session") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const row = await createPublishSession(auth.uid, payload || {});
      await addTranscript(auth.uid, {
        source: "studio",
        eventType: "publish-session",
        text: `Publish session armed: ${row.protocol} ${row.target}`.slice(0, 500),
        roomId: row.roomId || "studio-main",
        meta: { sessionId: row.id, bridge: row.bridge }
      });
      sendJson(res, 200, { ok: true, session: row });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "publish_session_failed" });
    }
    return;
  }

  if (req.method === "GET" && req.url === "/studio/publish/sessions") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const items = await listPublishSessions(auth.uid, 80);
    sendJson(res, 200, { ok: true, items });
    return;
  }

  if (req.method === "POST" && req.url === "/studio/publish/health-check") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const protocol = String(payload?.protocol || "WHIP");
      const target = String(payload?.target || "");
      const health = await checkPublishTargetHealth(protocol, target);
      if (payload?.sessionId) {
        await updatePublishSession(auth.uid, String(payload.sessionId), {
          status: health.ok ? "healthy" : "degraded",
          reconnectPolicy: {
            enabled: true,
            backoffSec: [2, 5, 10, 20],
            nextRetryInSec: health.reconnectInSec || 0,
            maxRetries: 8,
            reason: health.reason
          }
        });
      }
      await addTranscript(auth.uid, {
        source: "studio",
        eventType: "publish-health",
        text: `${protocol} ${target} => ${health.ok ? "healthy" : "degraded"} (${health.reason})`,
        roomId: "studio-main",
        meta: { protocol, target, reconnect: !!health.shouldReconnect }
      });
      sendJson(res, 200, { ok: true, health });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "publish_health_check_failed" });
    }
    return;
  }

  if (req.method === "PATCH" && String(req.url || "").startsWith("/studio/publish/sessions/")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const id = String(req.url || "").split("/").pop() || "";
    try {
      const payload = await readHttpJson(req);
      const row = await updatePublishSession(auth.uid, id, payload || {});
      await addTranscript(auth.uid, {
        source: "studio",
        eventType: "publish-session-update",
        text: `Session ${id} -> ${row.status || "updated"}`,
        roomId: row.roomId || "studio-main",
        meta: { sessionId: id, status: row.status, ingestUrl: row.ingestUrl || "" }
      });
      sendJson(res, 200, { ok: true, session: row });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "publish_session_update_failed" });
    }
    return;
  }

  if (req.method === "GET" && String(req.url || "").startsWith("/studio/transcripts")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const url = new URL(`http://localhost${req.url || "/studio/transcripts"}`);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 80)));
    const items = await listTranscripts(auth.uid, limit);
    sendJson(res, 200, { ok: true, items });
    return;
  }

  if (req.method === "POST" && req.url === "/studio/transcripts") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const row = await addTranscript(auth.uid, payload || {});
      sendJson(res, 200, { ok: true, row });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "transcript_write_failed" });
    }
    return;
  }

  /** E1: broadcast intent → GreenRoom capability → transcript + memory artifact */
  if (req.method === "POST" && req.url === "/studio/capabilities/greenroom") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const traceId = String(payload?.traceId || `TRC-${Date.now().toString(36).toUpperCase()}`);
      const title = String(payload?.title || "Castle Live Broadcast").slice(0, 200);
      const intentRaw = String(payload?.intentRaw || "").slice(0, 800);
      const audienceEstimate = Math.max(0, Math.min(50_000_000, Number(payload?.audienceEstimate) || 1200));
      const roomId = String(payload?.roomId || "greenroom-main");
      const transcriptRow = await addTranscript(auth.uid, {
        source: "rhizoh",
        eventType: "BROADCAST_ROUTED",
        text: `GreenRoom · ${title}${intentRaw ? `\nIntent: ${intentRaw}` : ""}`,
        roomId,
        meta: {
          ack: "BROADCAST_ROUTED",
          capability: "greenroom",
          intentType: "broadcast",
          traceId,
          audienceEstimate,
          artifact: {
            kind: "broadcast_card",
            title,
            traceId,
            roomId,
            createdAt: Date.now()
          }
        }
      });
      await appendMemory({
        scope: "users",
        id: auth.uid,
        text: `GREENROOM_BROADCAST:${title} trace=${traceId}`,
        tags: ["broadcast", "greenroom", "artifact", "castle-library"],
        importance: 0.72,
        kind: "episodic",
        meta: { traceId, capability: "greenroom", transcriptId: transcriptRow.id }
      });
      sendJson(res, 200, {
        ok: true,
        ack: "BROADCAST_ROUTED",
        traceId,
        transcript: transcriptRow,
        replayPath: `/replay/${encodeURIComponent(traceId)}`,
        sharePath: `/replay/${encodeURIComponent(traceId)}`
      });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "greenroom_capability_failed" });
    }
    return;
  }

  if (req.method === "GET" && String(req.url || "").startsWith("/studio/metadata/search")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const url = new URL(`http://localhost${req.url || "/studio/metadata/search"}`);
    const q = String(url.searchParams.get("q") || "");
    const limit = Math.max(1, Math.min(300, Number(url.searchParams.get("limit") || 80)));
    const items = await searchMetadata(auth.uid, q, limit);
    sendJson(res, 200, { ok: true, q, items });
    return;
  }

  if (req.method === "POST" && req.url === "/robotics/devices") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const row = await registerDevice(auth.uid, payload || {});
      sendJson(res, 200, { ok: true, device: row });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "device_register_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/robotics/telemetry") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const deviceId = String(payload?.deviceId || "");
      if (!deviceId) return sendJson(res, 400, { ok: false, error: "deviceId_required" });
      const lat = Number(payload?.lat);
      const lon = Number(payload?.lon);
      const speed = Math.max(0, Number(payload?.speed || 0));
      const cfgCenterLat = Number(process.env.CASTLE_GEOFENCE_CENTER_LAT || 41.0082);
      const cfgCenterLon = Number(process.env.CASTLE_GEOFENCE_CENTER_LON || 28.9784);
      const cfgRadiusM = Math.max(100, Number(process.env.CASTLE_GEOFENCE_RADIUS_M || 55000));
      const cfgSpeedCap = Math.max(1, Number(process.env.CASTLE_SPEED_CAP_MPS || 35));
      const dist = Number.isFinite(lat) && Number.isFinite(lon) ? haversineMeters(cfgCenterLat, cfgCenterLon, lat, lon) : 0;
      const geofenceOk = !Number.isFinite(dist) ? true : dist <= cfgRadiusM;
      const speedOk = speed <= cfgSpeedCap;
      const failsafe = !(geofenceOk && speedOk);
      const safety = {
        geofenceOk,
        speedOk,
        failsafe,
        distanceFromCenterM: Number.isFinite(dist) ? dist : null,
        speedCapMps: cfgSpeedCap
      };
      const row = await appendTelemetry(auth.uid, deviceId, {
        lat,
        lon,
        speed,
        battery: payload?.battery,
        mode: payload?.mode || (failsafe ? "FAILSAFE_HOLD" : "ACTIVE"),
        raw: payload?.raw || {}
      });
      await updateDevice(auth.uid, deviceId, {
        status: failsafe ? "failsafe" : "active",
        lastTelemetryAt: row.ts,
        safetyState: safety
      });
      if (failsafe) {
        await addTranscript(auth.uid, {
          source: "robotics-guardrails",
          eventType: "failsafe",
          text: `Device ${deviceId} failsafe triggered geofenceOk=${geofenceOk} speedOk=${speedOk}`,
          roomId: "studio-main",
          meta: { deviceId, safety }
        });
      }
      sendJson(res, 200, { ok: true, telemetry: row, safety, command: failsafe ? "FAILSAFE_HOLD" : "CONTINUE" });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "telemetry_ingest_failed" });
    }
    return;
  }

  if (req.method === "GET" && req.url === "/robotics/telemetry") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const items = await listTelemetry(auth.uid, 150);
    sendJson(res, 200, { ok: true, items });
    return;
  }

  if (req.method === "POST" && req.url === "/robotics/automations") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const row = await createAutomation(auth.uid, payload || {});
      await addTranscript(auth.uid, {
        source: "planner",
        eventType: "automation-scheduled",
        text: `Automation scheduled: ${row.title} at ${new Date(row.scheduleAt).toLocaleString()}`,
        roomId: "studio-main",
        meta: { automationId: row.id, action: row.action, deviceId: row.deviceId }
      });
      sendJson(res, 200, { ok: true, automation: row });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "automation_create_failed" });
    }
    return;
  }

  if (req.method === "GET" && req.url === "/robotics/automations") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const items = await listAutomations(auth.uid, 120);
    sendJson(res, 200, { ok: true, items });
    return;
  }

  if (req.method === "GET" && req.url === "/robotics/devices") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const items = await listDevices(auth.uid, 120);
    sendJson(res, 200, { ok: true, items });
    return;
  }

  if (req.method === "POST" && req.url === "/robotics/commands") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const deviceId = String(payload?.deviceId || "");
      if (!deviceId) return sendJson(res, 400, { ok: false, error: "deviceId_required" });
      const devs = await listDevices(auth.uid, 500);
      const d = devs.find((x) => x.id === deviceId);
      if (!d) return sendJson(res, 404, { ok: false, error: "device_not_found" });
      const action = String(payload?.action || "");
      const caps = Array.isArray(d.capabilityProfile) ? d.capabilityProfile : [];
      if (action && caps.length && !caps.includes(action) && !caps.includes("*")) {
        return sendJson(res, 400, { ok: false, error: "unsupported_action_for_device", capabilityProfile: caps });
      }
      const cmd = await enqueueCommand(auth.uid, {
        deviceId,
        action: action || "NOOP",
        params: payload?.params || {},
        adapter: payload?.adapter || d.adapter || "websocket"
      });
      await addTranscript(auth.uid, {
        source: "robotics-command-queue",
        eventType: "command-queued",
        text: `${cmd.deviceId} -> ${cmd.action}`,
        roomId: "studio-main",
        meta: { commandId: cmd.id, adapter: cmd.adapter }
      });
      sendJson(res, 200, { ok: true, command: cmd });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "command_queue_failed" });
    }
    return;
  }

  if (req.method === "GET" && req.url === "/robotics/commands") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const items = await listCommands(auth.uid, 200);
    sendJson(res, 200, { ok: true, items });
    return;
  }

  if (req.method === "PATCH" && String(req.url || "").startsWith("/robotics/commands/")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const id = String(req.url || "").split("/").pop() || "";
    try {
      const payload = await readHttpJson(req);
      const row = await updateCommandStatus(auth.uid, id, payload?.status || "sent");
      sendJson(res, 200, { ok: true, command: row });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "command_update_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/robotics/rhizoh/bridge") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const result = await runRhizohBrainV2({
        message: String(payload?.message || "robotics bridge command"),
        uid: auth.uid,
        agentId: String(payload?.agentId || ""),
        worldState: payload?.worldState || {},
        deviceState: payload?.deviceState || {},
        intent: "robotics-mechanics"
      });
      await addTranscript(auth.uid, {
        source: "robotics-bridge",
        eventType: "robotics-command",
        text: `Bridge -> ${String(result.reply || "").slice(0, 500)}`,
        roomId: "studio-main",
        meta: { directive: result.directive, agentId: payload?.agentId || "" }
      });
      sendJson(res, 200, { ok: true, result });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "robotics_bridge_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/robotics/planner/graph") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const graph = buildTaskActionGraph(String(payload?.task || ""), payload?.context || {});
      await addTranscript(auth.uid, {
        source: "planner",
        eventType: "planner-graph",
        text: `Planner graph built: ${graph.taskTitle} nodes=${graph.nodes.length}`,
        roomId: "studio-main",
        meta: { taskTitle: graph.taskTitle, nodeCount: graph.nodes.length }
      });
      sendJson(res, 200, { ok: true, graph });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "planner_graph_failed" });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/social/channels") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const row = await registerSocialChannel(auth.uid, payload || {});
      sendJson(res, 200, { ok: true, channel: row });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "social_channel_register_failed" });
    }
    return;
  }

  if (req.method === "GET" && req.url === "/social/channels") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const items = await listSocialChannels(auth.uid, 100);
    sendJson(res, 200, { ok: true, items });
    return;
  }

  if (req.method === "POST" && req.url === "/social/broadcast") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const text = String(payload?.text || "").slice(0, 1200);
      const channels = await listSocialChannels(auth.uid, 100);
      const enabled = channels.filter((c) => c.status === "enabled");
      const deliveries = [];
      for (const c of enabled) {
        const out = await deliverSocialWithRetry(c, text);
        deliveries.push({ id: c.id, platform: c.platform, ...out });
      }
      const okCount = deliveries.filter((d) => d.ok).length;
      await addTranscript(auth.uid, {
        source: "social-layer",
        eventType: "social-broadcast",
        text: `Broadcast delivered ${okCount}/${enabled.length} channel(s): ${text.slice(0, 240)}`,
        roomId: "studio-main",
        meta: { deliveries }
      });
      sendJson(res, 200, { ok: true, sentChannels: okCount, totalChannels: enabled.length, deliveries });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "social_broadcast_failed" });
    }
    return;
  }

  if (req.method === "GET" && req.url === "/social/ethics/programs") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    sendJson(res, 200, { ok: true, ...buildEthicsPrograms() });
    return;
  }

  if (req.method === "POST" && req.url === "/robotics/commands/dispatch") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const all = await listCommands(auth.uid, 200);
      const queued = all.filter((c) => String(c.status || "queued") === "queued").slice(0, 50);
      const devices = await listDevices(auth.uid, 500);
      const byId = new Map(devices.map((d) => [d.id, d]));
      const results = [];
      for (const cmd of queued) {
        const dev = byId.get(cmd.deviceId);
        if (!dev) {
          await updateCommandStatus(auth.uid, cmd.id, "failed");
          results.push({ id: cmd.id, ok: false, error: "device_not_found" });
          continue;
        }
        try {
          const dispatched = await dispatchCommandToAdapter(dev, cmd);
          await updateCommandStatus(auth.uid, cmd.id, "sent");
          results.push({ id: cmd.id, ok: true, adapter: dispatched.adapter, via: dispatched.via });
        } catch (error) {
          await updateCommandStatus(auth.uid, cmd.id, "failed");
          results.push({ id: cmd.id, ok: false, error: String(error?.message || "dispatch_failed") });
        }
      }
      await addTranscript(auth.uid, {
        source: "robotics-command-dispatch",
        eventType: "command-dispatch-batch",
        text: `Dispatch batch size=${results.length} ok=${results.filter((x) => x.ok).length}`,
        roomId: "studio-main",
        meta: { results: results.slice(0, 30) }
      });
      sendJson(res, 200, { ok: true, processed: results.length, results });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "dispatch_failed" });
    }
    return;
  }

  if (req.method === "GET" && String(req.url || "").startsWith("/pdf/jobs/")) {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    const id = String(req.url || "").split("/").pop() || "";
    const job = await getPdfJob(auth.uid, id);
    if (!job) return sendJson(res, 404, { ok: false, error: "pdf_job_not_found" });
    sendJson(res, 200, { ok: true, job });
    return;
  }

  if (req.method === "POST" && req.url === "/memory") {
    const auth = await resolveHttpUser(req);
    if (!auth.ok) return sendJson(res, 401, { ok: false, error: auth.reason });
    try {
      const payload = await readHttpJson(req);
      const scope = payload?.scope === "agents" ? "agents" : "users";
      const id = String(payload?.id || (scope === "users" ? auth.uid : ""));
      if (!id) return sendJson(res, 400, { ok: false, error: "memory_id_required" });
      const row = await appendMemory({
        scope,
        id,
        text: payload?.text,
        tags: payload?.tags || [],
        importance: payload?.importance,
        kind: payload?.kind || "episodic",
        meta: { uid: auth.uid, ...(payload?.meta || {}) }
      });
      sendJson(res, 200, { ok: true, row });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error?.message || "memory_write_failed" });
    }
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.externalTruth) {
    try {
      if (process.env.RHIZOH_EXTERNAL_TRUTH_REQUIRE_TOKEN === "1" && REQUIRED_GATEWAY_TOKEN) {
        const tok = readGatewayHttpToken(req);
        if (tok !== REQUIRED_GATEWAY_TOKEN) {
          sendJson(res, 401, { ok: false, error: "gateway_token_required" });
          return;
        }
      }
      const ip = getHttpClientIp(req);
      if (!checkHttpRateLimit(`rhizoh_external_truth:${ip}`, RL_RHIZOH_EXTERNAL_TRUTH_PER_MIN, 60_000)) {
        sendJson(res, 429, { ok: false, error: "rate_limit_exceeded" });
        return;
      }
      sendJson(res, 200, buildRhizohExternalGroundTruthPayload(req));
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e?.message || e) });
    }
    return;
  }

  if (req.method === "POST" && pathname === rhizohRuntime.routes.productOutcome) {
    try {
      if (process.env.RHIZOH_PRODUCT_OUTCOME_REQUIRE_TOKEN === "1" && REQUIRED_GATEWAY_TOKEN) {
        const tok = readGatewayHttpToken(req);
        if (tok !== REQUIRED_GATEWAY_TOKEN) {
          sendJson(res, 401, { ok: false, error: "gateway_token_required" });
          return;
        }
      }
      const ip = getHttpClientIp(req);
      if (!checkHttpRateLimit(`rhizoh_product_outcome:${ip}`, RL_RHIZOH_PRODUCT_OUTCOME_PER_MIN, 60_000)) {
        sendJson(res, 429, { ok: false, error: "rate_limit_exceeded" });
        return;
      }
      const rawBody = await readHttpBodyText(req, 64 * 1024);
      const body = rawBody.trim() ? safeJsonParse(rawBody) : null;
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { ok: false, error: "invalid_json_payload" });
        return;
      }
      const sigHdr = String(req.headers?.["x-rhizoh-outcome-signature"] || "").trim();
      const hmacV = verifyRhizohOutcomeHmac(rawBody, sigHdr);
      if (!hmacV.ok) {
        sendJson(res, 401, { ok: false, error: hmacV.error || "outcome_hmac_invalid" });
        return;
      }
      const srcTokHdr = String(req.headers?.["x-rhizoh-outcome-source-token"] || "").trim();
      const srcV = verifyRhizohOutcomeSourceToken(body.source, srcTokHdr);
      if (!srcV.ok) {
        sendJson(res, 401, { ok: false, error: srcV.error || "outcome_source_token_invalid" });
        return;
      }
      const subjectKey = String(body.subjectKey || "").trim().slice(0, 128);
      if (
        subjectKey &&
        !checkHttpRateLimit(
          `rhizoh_product_outcome_subj:${subjectKey}`,
          RL_RHIZOH_PRODUCT_OUTCOME_SUBJECT_PER_MIN,
          60_000
        )
      ) {
        sendJson(res, 429, { ok: false, error: "rate_limit_subject" });
        return;
      }
      const result = ingestRhizohProductOutcomeHttp(body, { ip });
      if (!result.ok) {
        sendJson(res, 400, { ok: false, error: result.error || "ingest_failed" });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        schemaVersion: "1.1.0",
        aggregate: result.aggregate,
        integrity: result.integrity
      });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e || "outcome_failed") });
    }
    return;
  }

  if (req.method === "GET" && pathname === rhizohRuntime.routes.productOutcomeAggregate) {
    try {
      if (process.env.RHIZOH_PRODUCT_OUTCOME_REQUIRE_TOKEN === "1" && REQUIRED_GATEWAY_TOKEN) {
        const tok = readGatewayHttpToken(req);
        if (tok !== REQUIRED_GATEWAY_TOKEN) {
          sendJson(res, 401, { ok: false, error: "gateway_token_required" });
          return;
        }
      }
      const ip = getHttpClientIp(req);
      if (!checkHttpRateLimit(`rhizoh_product_outcome_agg:${ip}`, RL_RHIZOH_PRODUCT_OUTCOME_PER_MIN, 60_000)) {
        sendJson(res, 429, { ok: false, error: "rate_limit_exceeded" });
        return;
      }
      const u = new URL(String(req.url || "/"), "http://localhost");
      const cohortId = u.searchParams.get("cohortId") || "";
      const decisionFingerprint = u.searchParams.get("decisionFingerprint") || "";
      const limit = u.searchParams.get("limit") || "50";
      const rows = listRhizohProductOutcomeAggregates({
        cohortId: cohortId || undefined,
        decisionFingerprint: decisionFingerprint || undefined,
        limit: Number(limit) || 50
      });
      sendJson(res, 200, { ok: true, schemaVersion: "1.1.0", rows });
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e?.message || e) });
    }
    return;
  }

  if (req.method === "POST" && pathname === rhizohRuntime.routes.externalLossBatch) {
    try {
      if (process.env.RHIZOH_EXTERNAL_LOSS_BATCH_REQUIRE_TOKEN === "1" && REQUIRED_GATEWAY_TOKEN) {
        const tok = readGatewayHttpToken(req);
        if (tok !== REQUIRED_GATEWAY_TOKEN) {
          sendJson(res, 401, { ok: false, error: "gateway_token_required" });
          return;
        }
      }
      const ip = getHttpClientIp(req);
      if (!checkHttpRateLimit(`rhizoh_external_loss_batch:${ip}`, RL_RHIZOH_EXTERNAL_LOSS_BATCH_PER_MIN, 60_000)) {
        sendJson(res, 429, { ok: false, error: "rate_limit_exceeded" });
        return;
      }
      const body = await readHttpJson(req, 256 * 1024);
      const result = ingestRhizohExternalLossBatchHttp(body, { ip });
      if (!result.ok) {
        sendJson(res, 400, { ok: false, error: result.error || "ingest_failed" });
        return;
      }
      sendJson(res, 200, { ok: true, accepted: result.accepted ?? 0 });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e || "batch_failed") });
    }
    return;
  }

  if (req.method === "POST" && req.url === rhizohRuntime.routes.rhizohLlm) {
    try {
      const payload = await readHttpJson(req);
      const auth = await resolveHttpUser(req);
      const ip = getHttpClientIp(req);
      logRhizohHealth("gateway_accept", { route: rhizohRuntime.routes.rhizohLlm, auth: auth.ok ? "ok" : "anon", ip });
      const rlKey = auth.ok ? `uid:${auth.uid}` : `ip:${ip}`;
      if (!checkHttpRateLimit(`rhizoh_llm:${rlKey}`, RL_RHIZOH_LLM_PER_MIN, 60_000)) {
        return sendJson(res, 429, {
          ok: false,
          error: "rate_limit_exceeded",
          reply: "İstek sınırı aşıldı. Kısa süre sonra tekrar deneyin.",
          directive: "NONE"
        });
      }

      const requireExplicit = process.env.CASTLE_LLM_REQUIRE_EXPLICIT_KEY_SOURCE === "1";
      const keyMode = normalizeClientLlmKeySource(payload?.llmKeySource ?? payload?.keySource);
      if (keyMode === null) {
        return sendJson(res, 400, {
          ok: false,
          error: "invalid_llm_key_source",
          reply: "llmKeySource geçersiz. Kullanın: env | user_connection | auto",
          directive: "NONE"
        });
      }
      if (requireExplicit && keyMode === "auto") {
        return sendJson(res, 400, {
          ok: false,
          error: "llm_key_source_required",
          reply: "Sunucu CASTLE_LLM_REQUIRE_EXPLICIT_KEY_SOURCE=1: istekte llmKeySource (env veya user_connection) zorunlu.",
          directive: "NONE"
        });
      }

      const conn = auth.ok ? await resolveConnection(auth.uid, String(payload?.connectionId || "")) : null;

      if (keyMode === "user_connection") {
        if (!auth.ok) {
          return sendJson(res, 401, {
            ok: false,
            error: "llm_auth_required_for_user_connection",
            reply: "Kayıtlı LLM bağlantısı için giriş gerekli.",
            directive: "NONE"
          });
        }
        if (!conn?.apiKey) {
          return sendJson(res, 400, {
            ok: false,
            error: "user_llm_connection_required",
            reply: "Geçerli bir LLM bağlantısı yok; Studio’da bağlantı ekleyin veya llmKeySource=env kullanın.",
            directive: "NONE"
          });
        }
      }

      const safePayload = { ...(payload || {}) };
      delete safePayload.apiKey;
      delete safePayload.llmKeySource;
      delete safePayload.keySource;

      let resolvedProvider = payload?.provider;
      let resolvedModel = payload?.model;
      let connApiKey = "";

      if (keyMode === "user_connection") {
        resolvedProvider = conn.provider;
        resolvedModel = conn.model;
        connApiKey = conn.apiKey || "";
      } else if (keyMode === "env") {
        connApiKey = "";
      } else {
        resolvedProvider = conn?.provider || payload?.provider;
        resolvedModel = conn?.model || payload?.model;
        connApiKey = conn?.apiKey || "";
      }

      const { result, traceId, turnLatencyMs, spinePhases, sampledTrace } = await rhizohGatewayTurn({
        safePayload,
        auth,
        keyMode,
        conn,
        resolvedProvider,
        resolvedModel,
        connApiKey
      });
      logRhizohHealth("llm_response", {
        route: rhizohRuntime.routes.rhizohLlm,
        traceId,
        turnLatencyMs: Number(turnLatencyMs || 0),
        keyMode
      });
      sendJson(res, 200, {
        ...result,
        connectionId: conn?.id || null,
        llmKeySourceUsed: keyMode,
        traceId,
        turnLatencyMs,
        ...(spinePhases ? { spinePhases } : {}),
        ...(sampledTrace !== undefined ? { sampledTrace } : {})
      });
    } catch (error) {
      const msg = String(error?.message || "");
      const code = error?.code || "";
      let status = 500;
      if (msg === "rate_limit_exceeded") status = 429;
      else if (["server_llm_key_missing", "user_llm_connection_required", "message_required", "missing_api_key"].includes(code) || msg.includes("missing_api_key_for_"))
        status = 400;
      let rhizohFailureKind = "provider_error";
      if (msg === "rate_limit_exceeded") rhizohFailureKind = "rate_limit";
      else if (status === 400) rhizohFailureKind = "client_config";
      else if (msg.startsWith("provider_http_")) {
        const st = Number(msg.replace("provider_http_", ""));
        if (st === 408 || st === 504) rhizohFailureKind = "timeout";
        else rhizohFailureKind = "provider_error";
      } else if (/timeout|timed out|ETIMEDOUT/i.test(msg)) rhizohFailureKind = "timeout";

      const providerHttpMatch = msg.match(/^provider_http_(\d{3})$/);
      sendJson(res, status, {
        ok: false,
        rhizohFailureKind,
        ...(providerHttpMatch ? { providerHttpStatus: Number(providerHttpMatch[1]) } : {}),
        error: msg || "rhizoh_llm_failed",
        reply: status === 500 ? "Rhizoh bağlantısı geçici olarak kesildi." : msg,
        directive: "NONE"
      });
    }
    return;
  }

  if (req.method === "POST" && pathname === rhizohRuntime.routes.epistemicSeal) {
    try {
      if (!EPISTEMIC_SEAL_SECRET) {
        sendJson(res, 503, { ok: false, error: "epistemic_seal_disabled" });
        return;
      }
      if (REQUIRED_GATEWAY_TOKEN) {
        const tok = readGatewayHttpToken(req);
        if (tok !== REQUIRED_GATEWAY_TOKEN) {
          sendJson(res, 401, { ok: false, error: "gateway_token_required" });
          return;
        }
      }
      const ip = getHttpClientIp(req);
      if (!checkHttpRateLimit(`epistemic_seal:${ip}`, RL_EPISTEMIC_SEAL_PER_MIN, 60_000)) {
        sendJson(res, 429, { ok: false, error: "rate_limit_exceeded" });
        return;
      }
      const body = await readHttpJson(req, 256 * 1024);
      const truth = body.truth_contract;
      if (!truth || typeof truth !== "object") {
        sendJson(res, 400, { ok: false, error: "truth_contract_required" });
        return;
      }
      const sealBody = {
        truth_contract: truth,
        runtime_hash: String(body.runtime_hash || ""),
        model_route: {
          provider: body.model_route?.provider ?? null,
          model: body.model_route?.model ?? null
        },
        memory_digest: String(body.memory_digest || ""),
        world_snapshot_hash: String(body.world_snapshot_hash || ""),
        timestamp: Number(body.timestamp) || Date.now()
      };
      const canonical = canonicalEpistemicSealString(sealBody);
      const { hash, signature } = hashAndSignEpistemicSeal(canonical, EPISTEMIC_SEAL_SECRET);
      recordGenesisEpistemicSealIssued(hash);
      const attestation = {
        schema: EPISTEMIC_SEAL_SCHEMA,
        algorithm: "SHA-256+HMAC-SHA256",
        keyHint: process.env.CASTLE_EPISTEMIC_SEAL_SECRET ? "CASTLE_EPISTEMIC_SEAL_SECRET" : "CASTLE_GATEWAY_TOKEN",
        issuedAt: Date.now(),
        gateway: { service: "castle-gateway", listenPort: PORT }
      };
      sendJson(res, 200, {
        ok: true,
        hash,
        signature,
        attestation,
        canonicalBytes: Buffer.byteLength(canonical, "utf8")
      });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e || "seal_failed") });
    }
    return;
  }

  if (req.method === "POST" && pathname === rhizohRuntime.routes.epistemicLogsBatch) {
    try {
      if (REQUIRED_GATEWAY_TOKEN) {
        const tok = readGatewayHttpToken(req);
        if (tok !== REQUIRED_GATEWAY_TOKEN) {
          sendJson(res, 401, { ok: false, error: "gateway_token_required" });
          return;
        }
      }
      const auth = await resolveHttpUser(req);
      if (!auth.ok) {
        sendJson(res, 401, { ok: false, error: auth.reason || "auth_required" });
        return;
      }
      const ip = getHttpClientIp(req);
      const rlKey = `uid:${auth.uid || ip}`;
      if (!checkHttpRateLimit(`epistemic_logs:${rlKey}`, RL_EPISTEMIC_LOG_PER_MIN, 60_000)) {
        sendJson(res, 429, { ok: false, error: "rate_limit_exceeded" });
        return;
      }
      const body = await readHttpJson(req, 512 * 1024);
      const entries = Array.isArray(body?.entries) ? body.entries.slice(0, 120) : [];
      if (!entries.length) {
        sendJson(res, 400, { ok: false, error: "entries_required" });
        return;
      }
      const persisted = await persistEpistemicLedgerBatch(auth.uid, entries);
      recordGenesisEpistemicLedgerPersisted(persisted.persisted);
      // Internal cognition layer: forecast stays gateway/ledger-only (no client exposure).
      try {
        await persistEpistemicForecastBatch(auth.uid, persisted.normalized || []);
      } catch {
        /* forecast failures must not break primary ledger ingest */
      }
      sendJson(res, 200, {
        ok: true,
        persisted: persisted.persisted,
        mode: persisted.mode,
        latest: persisted.normalized?.[persisted.normalized.length - 1] || null
      });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e || "epistemic_log_ingest_failed") });
    }
    return;
  }

  sendJson(res, 404, { ok: false, error: "not_found" });
});

const wss = new WebSocketServer({ server: httpServer });
spiralWssForGenesis = wss;
const orchestrator = createOrchestrator();
const clientStats = new Map();
let broadcasterClientId = null;
const spiralState = {
  rooms: [{ id: "room-default", name: "Spiral Default Arena" }],
  activeByClient: new Map(),
  characters: new Map() // id -> {id,name,role,roomId,source}
};

function broadcast(msgObj) {
  const encoded = JSON.stringify(msgObj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(encoded);
  }
}

function broadcastState() {
  broadcast(
    createEnvelope(WS_MESSAGE.BROADCAST_STATE, {
      broadcasterClientId,
      viewers: [...wss.clients].filter((c) => c.readyState === 1).length
    })
  );
}

function currentSpiralStatePayload() {
  return {
    rooms: spiralState.rooms,
    characters: [...spiralState.characters.values()]
  };
}

function broadcastSpiralState() {
  broadcast(createEnvelope(WS_MESSAGE.SPIRAL_STATE, currentSpiralStatePayload()));
}

function ensureRoom(roomId, fallbackName = null) {
  if (!roomId) return spiralState.rooms[0].id;
  const exists = spiralState.rooms.find((r) => r.id === roomId);
  if (exists) return exists.id;
  const created = { id: roomId, name: fallbackName || `Spiral-${roomId.slice(-4)}` };
  spiralState.rooms.push(created);
  return created.id;
}

function syncSpiralCharactersWithWorld(snapshot) {
  const agents = snapshot?.agents || [];
  for (const a of agents) {
    if (!spiralState.characters.has(a.id)) {
      spiralState.characters.set(a.id, {
        id: a.id,
        name: a.id,
        role: "agent",
        roomId: spiralState.rooms[0].id,
        source: "world"
      });
    }
  }
}

function broadcastExcept(msgObj, exceptSocket) {
  const encoded = JSON.stringify(msgObj);
  for (const client of wss.clients) {
    if (client !== exceptSocket && client.readyState === 1) client.send(encoded);
  }
}

function validateInputFrame(payload, socket) {
  const stats = clientStats.get(socket.clientId) || { lastFrame: 0, windowStart: Date.now(), msgCount: 0 };
  const now = Date.now();
  if (now - stats.windowStart > 5000) {
    stats.windowStart = now;
    stats.msgCount = 0;
  }
  stats.msgCount += 1;
  clientStats.set(socket.clientId, stats);
  if (stats.msgCount > 120) return "Rate limit exceeded.";

  if (!payload || !Number.isInteger(payload.frame)) return "frame must be integer.";
  if (payload.frame <= stats.lastFrame) return "frame must be monotonic.";
  const commands = Array.isArray(payload.commands) ? payload.commands : [];
  if (commands.length > 8) return "Too many commands in one frame.";
  for (const cmd of commands) {
    if (!cmd || typeof cmd.command !== "string") return "Invalid command format.";
    if (
      cmd.command !== "SPAWN_AGENT" &&
      cmd.command !== "LIST_CASTLES" &&
      cmd.command !== "SPAWN_ENTITY" &&
      cmd.command !== "CREATE_CASTLE"
    ) return "Unsupported command.";
  }
  stats.lastFrame = payload.frame;
  clientStats.set(socket.clientId, stats);
  return null;
}

function validateSignalPayload(payload) {
  if (!payload || typeof payload !== "object") return "Invalid signaling payload.";
  const signalType = payload.signalType;
  if (!["OFFER", "ANSWER", "ICE"].includes(signalType)) return "Invalid signal type.";
  if (typeof payload.to !== "string" || payload.to.length < 3) return "Invalid signal destination.";
  if (signalType !== "ICE" && JSON.stringify(payload.sdp || {}).length > 16 * 1024) return "SDP too large.";
  if (signalType === "ICE" && JSON.stringify(payload.candidate || {}).length > 6 * 1024) return "ICE too large.";
  return null;
}

function sanitizeRawMessage(raw) {
  if (!raw) return null;
  const text = raw.toString();
  if (Buffer.byteLength(text, "utf8") > MAX_MESSAGE_BYTES) return null;
  return text;
}

wss.on("connection", async (socket, req) => {
  const origin = req?.headers?.origin || "";
  if (ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) {
    socket.close(1008, "Origin not allowed");
    return;
  }
  if (REQUIRED_GATEWAY_TOKEN) {
    const path = req?.url || "";
    const query = new URL(`ws://localhost${path}`).searchParams;
    const token = query.get("token");
    if (!token || token !== REQUIRED_GATEWAY_TOKEN) {
      socket.close(1008, "Invalid gateway token");
      return;
    }
  }
  if (REQUIRE_AUTH) {
    const result = await verifyClientToken(req);
    if (!result.ok) {
      const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1") || !origin;
      if (!(ALLOW_DEV_ANON && isLocal)) {
        socket.close(1008, result.reason);
        return;
      }
      socket.auth = { ok: true, kind: "dev-anon", user: { uid: "dev-anon" } };
    } else {
      socket.auth = result;
    }
  }

  socket.clientId = `c-${Math.random().toString(36).slice(2, 8)}`;
  socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.HELLO, { message: "Castle Gateway online.", clientId: socket.clientId })));
  socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.WORLD_SNAPSHOT, orchestrator.worldSnapshot())));
  socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.PEERS, { peers: [...wss.clients].map((c) => c.clientId).filter(Boolean) })));
  socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.BROADCAST_STATE, { broadcasterClientId, viewers: [...wss.clients].filter((c) => c.readyState === 1).length })));
  socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.SPIRAL_STATE, currentSpiralStatePayload())));
  broadcastExcept(createEnvelope(WS_MESSAGE.PEERS, { peers: [...wss.clients].map((c) => c.clientId).filter(Boolean) }), socket);

  socket.on("message", (raw) => {
    const safeRaw = sanitizeRawMessage(raw);
    if (!safeRaw) {
      socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.ERROR, { error: "Message too large or invalid." })));
      return;
    }
    const parsed = safeJsonParse(safeRaw);
    if (!parsed?.type) {
      socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.ERROR, { error: "Invalid message." })));
      return;
    }

    if (parsed.type === WS_MESSAGE.COMMAND_TEXT) {
      const canonical = parseTextToCommand(parsed.payload?.text);
      if (!canonical) {
        socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.ERROR, { error: "Unknown command text." })));
        return;
      }
      const result = orchestrator.applyCommand(canonical);
      socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.COMMAND_RESULT, result)));
      return;
    }

    if (parsed.type === WS_MESSAGE.COMMAND) {
      const result = orchestrator.applyCommand(parsed.payload);
      socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.COMMAND_RESULT, result)));
    }

    if (parsed.type === WS_MESSAGE.INPUT_FRAME) {
      const err = validateInputFrame(parsed.payload, socket);
      if (err) {
        socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.ERROR, { error: err })));
        return;
      }
      const frame = parsed.payload.frame;
      const commands = Array.isArray(parsed.payload?.commands) ? parsed.payload.commands : [];
      orchestrator.queueInputFrame(socket.clientId, frame, commands);
      socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.COMMAND_RESULT, { ok: true, queued: true, frame })));
    }

    if (parsed.type === WS_MESSAGE.SIGNAL) {
      const payload = parsed.payload || {};
      const err = validateSignalPayload(payload);
      if (err) {
        socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.ERROR, { error: err })));
        return;
      }
      const signalType = payload.signalType;
      const to = payload.to;
      for (const client of wss.clients) {
        if (client.clientId === to && client.readyState === 1) {
          client.send(JSON.stringify(createEnvelope(WS_MESSAGE.SIGNAL, { ...payload, from: socket.clientId })));
          break;
        }
      }
    }

    if (parsed.type === WS_MESSAGE.DRONE_TELEMETRY) {
      const payload = parsed.payload || {};
      const json = JSON.stringify(payload);
      if (Buffer.byteLength(json, "utf8") > 48 * 1024) {
        socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.ERROR, { error: "DRONE_TELEMETRY payload too large." })));
        return;
      }
      broadcastExcept(createEnvelope(WS_MESSAGE.DRONE_TELEMETRY, { ...payload, relayFrom: socket.clientId }), socket);
      return;
    }

    if (parsed.type === WS_MESSAGE.OPEN_DATA_QUERY) {
      queryOpenData(parsed.payload)
        .then((result) => {
          socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.OPEN_DATA_RESULT, { ok: true, result })));
        })
        .catch((e) => {
          socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.OPEN_DATA_RESULT, { ok: false, error: e.message })));
        });
      return;
    }

    if (parsed.type === WS_MESSAGE.RHIZOH_QUERY) {
      runRhizohBrainV2({
        ...(parsed.payload || {}),
        uid: socket?.auth?.user?.uid || "unknown"
      })
        .then((result) => {
          socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.RHIZOH_RESULT, result)));
        })
        .catch(async () => {
          const fallback = await runRhizohBrain(parsed.payload || {}).catch(() => ({
            ok: false,
            reply: "Rhizoh temporary disturbance. Habitat remains stable."
          }));
          socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.RHIZOH_RESULT, fallback)));
        });
      return;
    }

    if (parsed.type === WS_MESSAGE.BROADCAST_REGISTER) {
      const role = String(parsed.payload?.role || "");
      if (role === "GENESIS_BROADCAST_AGENT") {
        broadcasterClientId = socket.clientId;
        socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.COMMAND_RESULT, { ok: true, registered: role })));
        broadcastState();
      }
      return;
    }

    if (parsed.type === WS_MESSAGE.STUDIO_CUE) {
      // Only registered broadcaster can push global cues.
      if (!broadcasterClientId || socket.clientId !== broadcasterClientId) {
        socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.ERROR, { error: "Only broadcaster agent can emit STUDIO_CUE." })));
        return;
      }
      const cue = parsed.payload || {};
      if (typeof cue !== "object") {
        socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.ERROR, { error: "Invalid STUDIO_CUE payload." })));
        return;
      }
      broadcast(createEnvelope(WS_MESSAGE.STUDIO_CUE, cue));
      return;
    }

    if (parsed.type === WS_MESSAGE.SPIRAL_JOIN_ROOM) {
      const requested = String(parsed.payload?.roomId || "").trim();
      const requestedName = String(parsed.payload?.roomName || "").trim();
      const roomId = ensureRoom(requested || `room-${Math.random().toString(36).slice(2, 7)}`, requestedName || null);
      spiralState.activeByClient.set(socket.clientId, roomId);
      socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.COMMAND_RESULT, { ok: true, roomId })));
      broadcastSpiralState();
      return;
    }

    if (parsed.type === WS_MESSAGE.SPIRAL_CREATE_CHARACTER) {
      const name = String(parsed.payload?.name || "").trim().slice(0, 32) || `AI-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const role = String(parsed.payload?.role || "agent").trim().slice(0, 24) || "agent";
      const roomId = ensureRoom(
        String(parsed.payload?.roomId || spiralState.activeByClient.get(socket.clientId) || spiralState.rooms[0].id),
        null
      );

      // Character creation always maps to an authoritative world agent.
      const result = orchestrator.applyCommand({
        command: COMMAND.SPAWN_AGENT,
        params: { targetCastleId: "castle-01" }
      });
      if (!result?.ok || !result?.data?.id) {
        socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.ERROR, { error: "Character creation failed." })));
        return;
      }
      const id = result.data.id;
      spiralState.characters.set(id, { id, name, role, roomId, source: "spawned" });
      socket.send(JSON.stringify(createEnvelope(WS_MESSAGE.COMMAND_RESULT, { ok: true, characterId: id, roomId })));
      broadcastSpiralState();
      return;
    }
  });

  socket.on("close", () => {
    if (socket.clientId === broadcasterClientId) broadcasterClientId = null;
    clientStats.delete(socket.clientId);
    spiralState.activeByClient.delete(socket.clientId);
    broadcast(createEnvelope(WS_MESSAGE.PEERS, { peers: [...wss.clients].map((c) => c.clientId).filter(Boolean) }));
    broadcastState();
  });
});

setInterval(async () => {
  const { frame, snapshot, delta, packedDelta } = orchestrator.tick(1 / 20);
  syncSpiralCharactersWithWorld(snapshot);
  broadcast(createEnvelope(WS_MESSAGE.NETWORK_TICK, { frame }));
  broadcast(createEnvelope(WS_MESSAGE.WORLD_TICK, snapshot));
  broadcast(createEnvelope(WS_MESSAGE.WORLD_DELTA, delta));
  broadcast(createEnvelope(WS_MESSAGE.WORLD_DELTA_PACKED, packedDelta));
  broadcastSpiralState();
  await runAcademyEventTick();
  const executed = await tickAutomations(Date.now());
  for (const a of executed) {
    await addTranscript(a.uid, {
      source: "planner",
      eventType: "automation-executed",
      text: `Automation executed: ${a.title} (${a.action})`,
      roomId: "studio-main",
      meta: { automationId: a.id, action: a.action, deviceId: a.deviceId || "" }
    });
  }
}, 50);

(async () => {
  await rhizohRuntime.telemetry.initOpenTelemetry();
  if (String(process.env.CASTLE_GENESIS_DISK_PERSIST ?? "").trim() === "") {
    process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  }
  const genesisDiskBoot = await hydrateGenesisContinuityPersistenceBootV0();
  if (!genesisDiskBoot.ok) {
    console.warn("[GATEWAY] genesis disk hydrate failed; continuing with in-memory genesis continuity");
  }
  httpServer.listen(PORT, () => {
    startGenesisCanonicalClock();
    installGenesisCheckpointSurfaceGetter(buildGenesisRuntimeSurfacePayloadLive);
    setGenesisContinuityAfterPublishHook((seq) => {
      noteGenesisCheckpointSeqCommitted(seq);
    });
    startGenesisContinuityInfraSampler(buildGenesisRuntimeSurfacePayloadLive, 2000);
    logProductionObservatorySurfaceGuardsV0();
    console.log(`[GATEWAY] ws/http://localhost:${PORT}`);
    console.log(
      `[GATEWAY] genesis continuity: GET ${rhizohRuntime.routes.genesisRuntime} | SSE ${rhizohRuntime.routes.genesisStream} | replay ${rhizohRuntime.routes.genesisReplay} | diff ${rhizohRuntime.routes.genesisReplayDiff} | equiv ${rhizohRuntime.routes.genesisReplayEquivalence} | analytics ${rhizohRuntime.routes.genesisReplayAnalytics} | evolution ${rhizohRuntime.routes.genesisReplayEvolution}`
    );
    if (String(process.env.CASTLE_GENESIS_OBSERVATORY_LIVE_V01 ?? "").trim() === "1") {
      console.log("GENESIS OBSERVATORY LIVE v0.1 — READ ONLY PHASE STARTED");
    }
  });
})();
