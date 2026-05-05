#!/usr/bin/env node
/**
 * Hızlı duman testi: health + tek POST /rhizoh/llm
 * Kullanım:
 *   GATEWAY=https://xxx.onrender.com CASTLE_DEV_UID=smoke-1 node scripts/rhizoh-validation-smoke.mjs
 * veya Firebase ID token:
 *   GATEWAY=... FIREBASE_ID_TOKEN=eyJ... node scripts/rhizoh-validation-smoke.mjs
 */
const gateway = String(process.env.GATEWAY || process.env.VITE_GATEWAY_URL || "").replace(/\/$/, "");
const devUid = String(process.env.CASTLE_DEV_UID || "smoke-validation").trim();
const bearer = String(process.env.FIREBASE_ID_TOKEN || "").trim();

if (!gateway) {
  console.error("GATEWAY veya VITE_GATEWAY_URL gerekli (örn. https://castle-....onrender.com)");
  process.exit(1);
}

async function get(path) {
  const u = `${gateway}${path}`;
  const r = await fetch(u);
  const text = await r.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* noop */
  }
  return { u, status: r.status, json, text: text.slice(0, 400) };
}

async function postLlm(message) {
  const u = `${gateway}/rhizoh/llm`;
  const headers = { "Content-Type": "application/json" };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  else headers["X-Castle-Dev-Uid"] = devUid;
  const r = await fetch(u, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      llmKeySource: "env",
      context: { agentId: "RHIZOH-PRIME", continuity: { recentTurns: [] } }
    })
  });
  const text = await r.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* noop */
  }
  return { status: r.status, json, text: text.slice(0, 800) };
}

const live = await get("/health/live");
console.log("GET /health/live", live.status, live.json || live.text);

const deps = await get("/health/deps");
console.log("GET /health/deps", deps.status, deps.json ? JSON.stringify(deps.json).slice(0, 300) : deps.text);

const llm = await postLlm("Rhizoh, tek cümleyle kendini tanıt.");
console.log("POST /rhizoh/llm", llm.status);
if (llm.json) {
  const { traceId, turnLatencyMs, reply, ok, error } = llm.json;
  console.log({ traceId, turnLatencyMs, ok, error, replyLen: reply ? String(reply).length : 0 });
} else {
  console.log(llm.text);
}

const ok =
  live.status === 200 &&
  llm.status === 200 &&
  llm.json &&
  String(llm.json.traceId || "").length > 8 &&
  typeof llm.json.turnLatencyMs === "number";
process.exit(ok ? 0 : 1);
