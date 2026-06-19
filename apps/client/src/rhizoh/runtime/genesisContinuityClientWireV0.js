import {
  isGenesisSseBlockedViaGatewayProxyV0,
  resolveGenesisGatewayHttpBaseV0,
  resolveGenesisSseStreamBaseV0
} from "../../castleFlight/castleFlightConfig.js";
import { listGenesisAuthorityOriginsV0 } from "./genesisSingleAuthorityLockV0.js";
import {
  formatGenesisContinuityEventLine,
  GENESIS_CONTINUITY_EVENT_SCHEMA
} from "../../genesis/genesisContinuityEventFormatV0.js";
import { publishWorldObservationV0 } from "./worldObservationBusV0.js";
import { startWorldObservationIngressWireV0 } from "./worldObservationIngressWireV0.js";
import { installWorldObservationObservabilityV0 } from "./worldObservationObservabilityV0.js";
import { installCohortSessionFeedbackMailV0 } from "../cohort/cohortSessionFeedbackMailV0.js";
import {
  getRhizohUiTextModeV0,
  getRhizohUiTextVisibilityV0
} from "./rhizohUiTextModeV0.js";
import {
  commitRuntimeEventToGraphV0,
  RUNTIME_SUBSTRATE_SOURCE_V0
} from "./runtimeEventGraphBridgeV0.js";

let eventSource = null;
let stopIngressWire = () => {};
let stopObservability = () => {};
let stopCohortFeedbackMail = () => {};
let pollTimer = 0;
/** @type {number | null} */
let lastSeq = null;
/** @type {(() => void) | null} */
let ensureStopFnV0 = null;
let wireActiveV0 = false;

const POLL_INTERVAL_MS_V0 = 6500;
const GENESIS_POLL_FETCH_TIMEOUT_MS_V0 = 8000;

function listGenesisPollOriginsV0(preferred = "") {
  const origins = listGenesisAuthorityOriginsV0();
  if (!preferred) return origins;
  const p = String(preferred).trim().replace(/\/+$/, "");
  if (!p) return origins;
  if (origins[0] === p) return origins;
  return [p, ...origins.filter((o) => o !== p)];
}

function publishGenesisStreamRegistryV0(detail = {}) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  const prev =
    window.__rhizoh.genesisStream && typeof window.__rhizoh.genesisStream === "object"
      ? window.__rhizoh.genesisStream
      : {};
  const merged = {
    ...prev,
    schema: "rhizoh.genesis_stream_client.v0",
    influencesExecution: false,
    wired: wireActiveV0,
    ...detail
  };
  if (detail.status === "sse_error" && prev.pollOk === true) {
    merged.status = "poll_ok";
    merged.sseStatus = "sse_error";
  } else if (detail.status === "open") {
    merged.sseStatus = "open";
  } else if (detail.status === "connecting") {
    merged.sseStatus = "connecting";
  }
  window.__rhizoh.genesisStream = Object.freeze(merged);
}

async function fetchGenesisPollV0(url, timeoutMs = GENESIS_POLL_FETCH_TIMEOUT_MS_V0) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return fetch(url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { method: "GET", cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function ingestGenesisEvent(j) {
  if (!j || j.schema !== GENESIS_CONTINUITY_EVENT_SCHEMA || !j.type) return;
  if (typeof j.seq === "number" && Number.isFinite(j.seq)) {
    lastSeq = j.seq;
  }
  const line = formatGenesisContinuityEventLine(j);
  const genesisType = String(j.type);
  const p = j.payload && typeof j.payload === "object" ? j.payload : {};

  if (genesisType === "WorldObservation" && p.observationType) {
    publishWorldObservationV0({
      type: String(p.observationType),
      payload: {
        ...p,
        seq: j.seq ?? null,
        genesisType,
        via: "gateway_sse",
        line
      },
      line: String(p.line || line)
    });
  } else {
    publishWorldObservationV0({
      type: `genesis.${genesisType}`,
      payload: { seq: j.seq ?? null, genesisType, line, ...p },
      line
    });
  }

  commitRuntimeEventToGraphV0(RUNTIME_SUBSTRATE_SOURCE_V0.GENESIS, {
    genesisType,
    seq: j.seq ?? null,
    via: p.via || "gateway_sse"
  });
}

/**
 * @param {string} [origin]
 */
async function pollGenesisRuntimeOnceV0(origin) {
  const origins = listGenesisPollOriginsV0(origin);
  if (!origins.length) return;

  let lastPollError = "fetch_failed";

  for (let index = 0; index < origins.length; index += 1) {
    const pollOrigin = origins[index];
    const hasFallback = index < origins.length - 1;

    try {
      const res = await fetchGenesisPollV0(`${pollOrigin}/rhizoh/genesis/runtime`);
      const j = await res.json().catch(() => null);

      if (!res.ok || !j?.ok) {
        lastPollError = j?.error || j?.reason || `http_${res.status}`;
        if (hasFallback) continue;
        publishGenesisStreamRegistryV0({
          status: res.status === 503 ? "upstream_503" : "poll_error",
          streamUrl: `${pollOrigin}/rhizoh/genesis/stream`,
          pollOrigin,
          pollViaDirect: pollOrigin !== origins[0],
          lastPollHttpStatus: res.status,
          lastPollAtMs: Date.now(),
          pollOk: false,
          pollError: lastPollError
        });
        return;
      }

      publishGenesisStreamRegistryV0({
        status: "poll_ok",
        streamUrl: `${pollOrigin}/rhizoh/genesis/stream`,
        pollOrigin,
        pollViaDirect: pollOrigin !== origins[0],
        lastPollHttpStatus: res.status,
        lastPollAtMs: Date.now(),
        pollOk: true,
        lastAcceptedSeq: j.genesisStream?.lastAcceptedSeq ?? null
      });

      const seq = j.genesisStream?.lastAcceptedSeq;
      const tick = j.canonicalTick?.value;
      if (typeof seq === "number" && seq !== lastSeq) {
        ingestGenesisEvent({
          schema: GENESIS_CONTINUITY_EVENT_SCHEMA,
          type: "TickAdvanced",
          id: `poll:tick:${tick ?? seq}`,
          seq,
          payload: { value: tick, via: "runtime_poll" }
        });
      }
      return;
    } catch (err) {
      const aborted = err?.name === "AbortError" || String(err?.message || "").includes("aborted");
      lastPollError = aborted ? "poll_timeout" : String(err?.message || err || "fetch_failed");
      if (hasFallback) continue;
      publishGenesisStreamRegistryV0({
        status: "poll_unreachable",
        streamUrl: `${pollOrigin}/rhizoh/genesis/stream`,
        pollOrigin,
        pollViaDirect: pollOrigin !== origins[0],
        lastPollAtMs: Date.now(),
        pollOk: false,
        pollError: lastPollError
      });
    }
  }
}

/**
 * @param {{ restart?: boolean }} [opts]
 */
function startGenesisContinuityClientWireInternalV0(opts = {}) {
  if (opts.restart === true) {
    stopGenesisContinuityClientWireV0();
  } else if (wireActiveV0) {
    return stopGenesisContinuityClientWireV0;
  }

  const pollOrigin = String(resolveGenesisGatewayHttpBaseV0() || "").trim().replace(/\/+$/, "");
  const sseOrigin = String(resolveGenesisSseStreamBaseV0() || pollOrigin).trim().replace(/\/+$/, "");
  if (!pollOrigin && !sseOrigin) {
    publishGenesisStreamRegistryV0({
      status: "not_configured",
      hint: "resolveGenesisGatewayHttpBaseV0 returned empty"
    });
    return () => {};
  }

  wireActiveV0 = true;
  stopIngressWire = startWorldObservationIngressWireV0();
  stopObservability = installWorldObservationObservabilityV0();
  stopCohortFeedbackMail = installCohortSessionFeedbackMailV0();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.uiTextMode = getRhizohUiTextModeV0();
    window.__rhizoh.uiTextVisibility = getRhizohUiTextVisibilityV0();
  }

  const streamUrl = `${sseOrigin}/rhizoh/genesis/stream`;
  const sseViaDirect = sseOrigin !== pollOrigin;
  const skipSseViaProxy = isGenesisSseBlockedViaGatewayProxyV0();

  if (typeof EventSource !== "undefined" && !skipSseViaProxy) {
    eventSource = new EventSource(streamUrl);
    publishGenesisStreamRegistryV0({
      status: "connecting",
      streamUrl,
      pollOrigin,
      sseOrigin,
      sseViaDirect,
      transport: "sse+poll"
    });
    eventSource.onopen = () => {
      publishGenesisStreamRegistryV0({
        status: "open",
        streamUrl,
        transport: "sse+poll",
        atMs: Date.now()
      });
    };
    eventSource.onerror = () => {
      publishGenesisStreamRegistryV0({
        status: "sse_error",
        streamUrl,
        transport: "sse+poll",
        atMs: Date.now(),
        hint: "SSE failed — proxy 524 or upstream offline; poll fallback continues"
      });
    };
    eventSource.onmessage = (ev) => {
      try {
        ingestGenesisEvent(JSON.parse(ev.data));
      } catch {
        /* malformed */
      }
    };
    eventSource.addEventListener("genesis", (ev) => {
      try {
        ingestGenesisEvent(JSON.parse(ev.data));
      } catch {
        /* boot line */
      }
    });
  } else {
    publishGenesisStreamRegistryV0({
      status: "poll_only",
      streamUrl,
      pollOrigin,
      sseOrigin,
      sseViaDirect,
      transport: "poll",
      sseSkipped: skipSseViaProxy,
      hint: skipSseViaProxy
        ? "gatewayProxy cannot hold SSE — poll fallback only (no 524)"
        : "EventSource unavailable"
    });
  }

  void pollGenesisRuntimeOnceV0(pollOrigin);
  pollTimer = window.setInterval(() => {
    void pollGenesisRuntimeOnceV0(pollOrigin);
  }, POLL_INTERVAL_MS_V0);

  publishWorldObservationV0({
    type: "genesis.wire",
    payload: { pollOrigin, sseOrigin, sseViaDirect, transport: eventSource ? "sse+poll" : "poll" },
    line: `genesis · wire armed · poll ${pollOrigin.replace(/^https?:\/\//, "")}${sseViaDirect ? ` · sse ${sseOrigin.replace(/^https?:\/\//, "")}` : ""}`
  });

  return stopGenesisContinuityClientWireV0;
}

/**
 * Idempotent mount — safe from boot observability + nervous system.
 * Does not require gateway health phase === connected.
 * @returns {() => void} stop
 */
export function ensureGenesisContinuityClientWireV0() {
  if (ensureStopFnV0) return ensureStopFnV0;
  ensureStopFnV0 = startGenesisContinuityClientWireInternalV0();
  return ensureStopFnV0;
}

/**
 * Force restart genesis wire (tests / manual recovery).
 * @returns {() => void} stop
 */
export function startGenesisContinuityClientWireV0() {
  ensureStopFnV0 = null;
  return startGenesisContinuityClientWireInternalV0({ restart: true });
}

export function stopGenesisContinuityClientWireV0() {
  wireActiveV0 = false;
  ensureStopFnV0 = null;
  stopCohortFeedbackMail();
  stopCohortFeedbackMail = () => {};
  stopObservability();
  stopObservability = () => {};
  stopIngressWire();
  stopIngressWire = () => {};
  if (eventSource) {
    try {
      eventSource.close();
    } catch {
      /* noop */
    }
    eventSource = null;
  }
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = 0;
  }
}

/** @internal vitest */
export function __resetGenesisContinuityWireForTestV0() {
  stopGenesisContinuityClientWireV0();
  lastSeq = null;
}
