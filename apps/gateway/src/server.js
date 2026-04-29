import { WebSocket, WebSocketServer } from "ws";
import { createServer } from "node:http";
import { createOrchestrator } from "@castle/orchestrator";
import { parseTextToCommand } from "@castle/command-dsl";
import { WS_MESSAGE, COMMAND, createEnvelope, safeJsonParse } from "@castle/protocol";
import { queryOpenData } from "./openData.js";
import { verifyClientToken } from "./auth.js";
import { runRhizohBrain } from "./rhizohBrain.js";
import { queryRhizohLlm } from "./rhizohLlmGateway.js";
import { runRhizohBrainV2 } from "./rhizohBrainV2.js";
import {
  listConnections,
  createConnection,
  updateConnection,
  deleteConnection,
  setDefaultConnection,
  resolveConnection
} from "./llmConnectionsStore.js";
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

const PORT = Number(process.env.CASTLE_GATEWAY_PORT || 8090);
const MAX_MESSAGE_BYTES = Number(process.env.CASTLE_MAX_MESSAGE_BYTES || 32 * 1024);
const REQUIRED_GATEWAY_TOKEN = process.env.CASTLE_GATEWAY_TOKEN || "";
const ALLOWED_ORIGINS = (process.env.CASTLE_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const REQUIRE_AUTH = process.env.CASTLE_REQUIRE_AUTH === "true";
const ALLOW_DEV_ANON = process.env.CASTLE_ALLOW_DEV_ANON !== "false";
const ALLOW_DEV_HTTP_UID = process.env.CASTLE_ALLOW_DEV_HTTP_UID !== "false";
const SOCIAL_RETRY_MAX = Math.max(0, Math.min(5, Number(process.env.CASTLE_SOCIAL_RETRY_MAX || 2)));
const SOCIAL_RETRY_BASE_MS = Math.max(100, Number(process.env.CASTLE_SOCIAL_RETRY_BASE_MS || 700));
const TELEGRAM_BOT_TOKEN = process.env.CASTLE_TELEGRAM_BOT_TOKEN || "";
const WHATSAPP_TOKEN = process.env.CASTLE_WHATSAPP_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.CASTLE_WHATSAPP_PHONE_NUMBER_ID || "";

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

const httpServer = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CASTLE_HTTP_CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Castle-Dev-Uid");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    const persistence = getFirebasePersistence().mode;
    sendJson(res, 200, { ok: true, service: "castle-gateway", wsPort: PORT, persistence });
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
      const result = await queryRhizohLlm({
        message: String(payload?.message || "Ping from Castle Gateway"),
        context: payload?.context || { source: "connection_test" },
        provider: payload?.provider,
        model: payload?.model,
        apiKey: payload?.apiKey
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
      const summary = await queryRhizohLlm({
        message: `Give a concise conversational briefing about this place for a walking-route companion.\nPersona style: ${persona}\n${raw}`,
        context: { source: "event-layer-place-brief", placeName, persona },
        provider: conn?.provider,
        model: conn?.model,
        apiKey: conn?.apiKey
      });
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
        const summary = await queryRhizohLlm({
          message: `Generate a concise spoken briefing for route waypoint.\nPersona style: ${persona}\n${raw}`,
          context: { source: "event-layer-route-brief", waypoint: name, persona },
          provider: conn?.provider,
          model: conn?.model,
          apiKey: conn?.apiKey
        });
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
      const summary = await queryRhizohLlm({
        message: `Summarize this document and provide key points + practical actions.\nTitle:${title}\nContent:\n${content.slice(0, 12000)}`,
        context: { source: "event-layer-pdf-brief", title },
        provider: conn?.provider,
        model: conn?.model,
        apiKey: conn?.apiKey
      });
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

  if (req.method === "POST" && req.url === "/rhizoh/llm") {
    try {
      const payload = await readHttpJson(req);
      const auth = await resolveHttpUser(req);
      const conn = auth.ok ? await resolveConnection(auth.uid, String(payload?.connectionId || "")) : null;
      const memory = await getMemoryContext({
        uid: auth.ok ? auth.uid : "anon",
        agentId: String(payload?.context?.agentId || ""),
        query: String(payload?.message || ""),
        limit: Number(payload?.memoryLimit || 30)
      });
      const result = await queryRhizohLlm({
        ...payload,
        provider: conn?.provider || payload?.provider,
        model: conn?.model || payload?.model,
        apiKey: conn?.apiKey || payload?.apiKey,
        context: {
          ...(payload?.context || {}),
          memory
        }
      });
      if (auth.ok) {
        const profile = await getPersonaGoalMemory(auth.uid);
        const importanceUp = Array.isArray(profile?.goals) && profile.goals.some((g) => String(payload?.message || "").toLowerCase().includes(String(g).toLowerCase()))
          ? 0.7
          : 0.5;
        await appendMemory({
          scope: "users",
          id: auth.uid,
          text: `USER:${String(payload?.message || "").slice(0, 1000)}`,
          tags: ["dialog", "user"],
          importance: importanceUp,
          kind: "episodic",
          meta: { source: "rhizoh.llm" }
        });
        await appendMemory({
          scope: "users",
          id: auth.uid,
          text: `RHIZOH:${String(result?.reply || "").slice(0, 1200)}`,
          tags: ["dialog", "rhizoh", String(result?.directive || "none").toLowerCase()],
          importance: 0.6,
          kind: "episodic",
          meta: { source: "rhizoh.llm", provider: result?.provider, model: result?.model }
        });
        await addTranscript(auth.uid, {
          source: "rhizoh",
          eventType: "dialog",
          text: `${String(payload?.message || "").slice(0, 240)} => ${String(result?.reply || "").slice(0, 360)}`,
          roomId: "studio-main",
          meta: { directive: result?.directive, provider: result?.provider }
        });
        await autoCompactMemories({ scope: "users", id: auth.uid });
      }
      sendJson(res, 200, { ...result, connectionId: conn?.id || null });
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: error?.message || "rhizoh_llm_failed",
        reply: "Rhizoh bağlantısı geçici olarak kesildi.",
        directive: "NONE"
      });
    }
    return;
  }

  sendJson(res, 404, { ok: false, error: "not_found" });
});

const wss = new WebSocketServer({ server: httpServer });
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

httpServer.listen(PORT, () => {
  console.log(`[GATEWAY] ws/http://localhost:${PORT}`);
});
