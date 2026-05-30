/**
 * YouTube Publisher Bridge — **research** sidecar: accepts `publishRequest` rows from Castle client,
 * exposes **latest analytics snapshot** for `ingestYouTubeAnalyticsForCoherenceFeedbackV0` (A3 loop).
 * Real OAuth upload is out of scope here; this process owns the HTTP contract + in-memory queue.
 */

import http from "node:http";
import { randomBytes } from "node:crypto";

const PORT = Math.max(1, Math.floor(Number(process.env.PORT) || 8791));
const MAX_QUEUE = Math.min(500, Math.max(32, Math.floor(Number(process.env.YT_BRIDGE_MAX_QUEUE) || 200)));

/** @type {Array<Record<string, unknown>>} */
const publishQueue = [];
/** @type {Record<string, unknown> | null} */
let latestAnalytics = null;

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.YT_BRIDGE_CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, status, body) {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        if (!raw.trim()) return resolve({});
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

/**
 * Derive a coarse analytics row from the last publish request (stub sensor until real YouTube API).
 * @param {Record<string, unknown>|null} row
 */
function synthesizeAnalyticsFromPublishRow(row) {
  if (!row || typeof row !== "object") return null;
  const hint = row.youtubePipelineHint && typeof row.youtubePipelineHint === "object" ? row.youtubePipelineHint : {};
  const pr = Number(hint.publishRecommendationScore);
  const ed = Number(hint.emotionalDensity01);
  const viewVelocity01 = Number.isFinite(pr) ? Math.min(1, Math.max(0, pr * 0.85 + 0.05)) : 0.45;
  const retentionQuality01 = Number.isFinite(ed) ? Math.min(1, Math.max(0, 0.35 + ed * 0.55)) : 0.52;
  const commentSentiment01 = 0.5 + (Number.isFinite(pr) ? (pr - 0.5) * 0.12 : 0);
  return {
    schema: "castle.youtube_publisher_bridge.analytics_snapshot.v0",
    ts: Date.now(),
    source: "bridge_stub",
    viewVelocity01,
    averageViewDurationFrac: retentionQuality01,
    commentSentiment01: Math.min(1, Math.max(0, commentSentiment01)),
    publishRequestId: row.id ?? null
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      service: "youtube-publisher-bridge",
      port: PORT,
      queueDepth: publishQueue.length
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/v0/analytics/latest") {
    const snap =
      latestAnalytics ||
      synthesizeAnalyticsFromPublishRow(publishQueue[publishQueue.length - 1] || null) || {
        schema: "castle.youtube_publisher_bridge.analytics_snapshot.v0",
        ts: Date.now(),
        source: "bridge_idle",
        viewVelocity01: 0.4,
        averageViewDurationFrac: 0.48,
        commentSentiment01: 0.5
      };
    sendJson(res, 200, snap);
    return;
  }

  if (req.method === "POST" && url.pathname === "/v0/publish-requests") {
    try {
      const body = await readBody(req);
      const id = `pr_${Date.now()}_${randomBytes(4).toString("hex")}`;
      const row = { id, receivedAt: Date.now(), ...body };
      publishQueue.push(row);
      while (publishQueue.length > MAX_QUEUE) publishQueue.shift();
      latestAnalytics = synthesizeAnalyticsFromPublishRow(row);
      sendJson(res, 202, { ok: true, id, accepted: true });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e?.message || e) });
    }
    return;
  }

  sendJson(res, 404, { ok: false, error: "not_found" });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[youtube-publisher-bridge] listening on http://127.0.0.1:${PORT}`);
});
