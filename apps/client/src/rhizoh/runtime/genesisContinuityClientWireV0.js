import { getGenesisProtocolGatewayOrigin } from "../../castleFlight/castleFlightConfig.js";
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

let eventSource = null;
let stopIngressWire = () => {};
let stopObservability = () => {};
let stopCohortFeedbackMail = () => {};
let pollTimer = 0;
/** @type {number | null} */
let lastSeq = null;

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
    return;
  }

  publishWorldObservationV0({
    type: `genesis.${genesisType}`,
    payload: { seq: j.seq ?? null, genesisType, line, ...p },
    line
  });
}

/**
 * Subscribe to gateway genesis SSE (+ runtime poll fallback when SSE silent).
 * @returns {() => void} stop
 */
export function startGenesisContinuityClientWireV0() {
  stopGenesisContinuityClientWireV0();
  const origin = String(getGenesisProtocolGatewayOrigin() || "").trim().replace(/\/+$/, "");
  if (!origin) return () => {};

  stopIngressWire = startWorldObservationIngressWireV0();
  stopObservability = installWorldObservationObservabilityV0();
  stopCohortFeedbackMail = installCohortSessionFeedbackMailV0();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.uiTextMode = getRhizohUiTextModeV0();
    window.__rhizoh.uiTextVisibility = getRhizohUiTextVisibilityV0();
  }

  if (typeof EventSource !== "undefined") {
    const streamUrl = `${origin}/rhizoh/genesis/stream`;
    eventSource = new EventSource(streamUrl);
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
  }

  const runtimeUrl = `${origin}/rhizoh/genesis/runtime`;
  pollTimer = window.setInterval(() => {
    void (async () => {
      try {
        const res = await fetch(runtimeUrl, { method: "GET", cache: "no-store" });
        const j = await res.json().catch(() => null);
        if (!res.ok || !j?.ok) return;
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
      } catch {
        /* quiet */
      }
    })();
  }, 6500);

  publishWorldObservationV0({
    type: "genesis.wire",
    payload: { origin, transport: eventSource ? "sse+poll" : "poll" },
    line: `genesis · stream live · ${origin.replace(/^https?:\/\//, "")}`
  });

  return stopGenesisContinuityClientWireV0;
}

export function stopGenesisContinuityClientWireV0() {
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
