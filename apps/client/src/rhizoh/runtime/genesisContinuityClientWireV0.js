import { resolveGenesisGatewayHttpBaseV0, resolveGenesisSseStreamBaseV0 } from "../../castleFlight/castleFlightConfig.js";
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

function publishGenesisStreamRegistryV0(detail = {}) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.genesisStream = Object.freeze({
    schema: "rhizoh.genesis_stream_client.v0",
    influencesExecution: false,
    wired: wireActiveV0,
    ...detail
  });
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
 * @param {string} origin
 */
async function pollGenesisRuntimeOnceV0(origin) {
  const pollOrigin = String(origin || resolveGenesisGatewayHttpBaseV0() || "")
    .trim()
    .replace(/\/+$/, "");
  if (!pollOrigin) return;

  try {
    const res = await fetch(`${pollOrigin}/rhizoh/genesis/runtime`, {
      method: "GET",
      cache: "no-store"
    });
    const j = await res.json().catch(() => null);

    if (!res.ok || !j?.ok) {
      publishGenesisStreamRegistryV0({
        status: res.status === 503 ? "upstream_503" : "poll_error",
        streamUrl: `${pollOrigin}/rhizoh/genesis/stream`,
        lastPollHttpStatus: res.status,
        lastPollAtMs: Date.now(),
        pollOk: false,
        pollError: j?.error || j?.reason || `http_${res.status}`
      });
      return;
    }

    publishGenesisStreamRegistryV0({
      status: "poll_ok",
      streamUrl: `${pollOrigin}/rhizoh/genesis/stream`,
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
  } catch (err) {
    publishGenesisStreamRegistryV0({
      status: "poll_unreachable",
      streamUrl: `${pollOrigin}/rhizoh/genesis/stream`,
      lastPollAtMs: Date.now(),
      pollOk: false,
      pollError: String(err?.message || err || "fetch_failed")
    });
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

  if (typeof EventSource !== "undefined") {
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
    publishGenesisStreamRegistryV0({ status: "poll_only", streamUrl, transport: "poll" });
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
