/**
 * §7 Unified epistemic tick engine v0.1 — convergence layer (read-only).
 *
 * One correlationId + one tick window unifies:
 *   playbook.state() · boundary.validate() · observability.trace() · synthesis.coherence()
 *
 * No enforcement authority — observation + interpretation only.
 * @see docs/RHIZOH_EPISTEMIC_TICK_ENGINE_V0.1.md
 */

import { beginBreachCorrelationWindowV0, endBreachCorrelationWindowV0 } from "./breachCorrelationWindowV0.js";
import { synthesizeBreachCoherenceV0 } from "./breachCorrelationSynthesisV0.js";
import {
  collectClientBoundarySnapshotV0,
  evaluateExternalBoundaryValidationV0,
  fetchExternalBoundarySnapshotV0,
  observeExternalBoundaryBreachV0,
  BOUNDARY_STATE_V0
} from "./externalBoundaryValidationV0.js";
import {
  evaluatePostGoLiveIntegrityV0,
  SYSTEM_STATE_V0
} from "./postGoLiveIntegrityLoopV0.js";
import {
  getBreachObservationTraceV0,
  observePostGoLiveIntegrityBreachV0
} from "./violationObservationLogV0.js";
import { appendEpistemicTickToLedgerV0 } from "./epistemicTickLedgerV0.js";
import { evaluateEpistemicStabilityV0 } from "./epistemicStabilityControllerV0.js";

export const EPISTEMIC_TICK_SCHEMA_V0 = "castle.rhizoh.epistemic_tick.v0";

const DEFAULT_LOOP_MS_V0 = 300_000;
const DEFAULT_INTERVAL_MS_V0 = 30_000;

/**
 * Worst-case merge: playbook §7 + external boundary + synthesis compound signal.
 *
 * @param {ReturnType<typeof evaluatePostGoLiveIntegrityV0>} playbook
 * @param {ReturnType<typeof evaluateExternalBoundaryValidationV0>} boundary
 * @param {ReturnType<typeof synthesizeBreachCoherenceV0>} synthesis
 */
export function resolveEpistemicStateV0(playbook, boundary, synthesis) {
  const playbookState = playbook?.system_state || SYSTEM_STATE_V0.LIVE_OK;
  const boundaryDiverged = boundary?.boundary_state === BOUNDARY_STATE_V0.DIVERGED;
  const compound = Boolean(synthesis?.compoundFault);

  if (playbookState === SYSTEM_STATE_V0.QUARANTINE) {
    return SYSTEM_STATE_V0.QUARANTINE;
  }

  if (
    boundaryDiverged &&
    playbookState !== SYSTEM_STATE_V0.LIVE_OK &&
    playbookState !== SYSTEM_STATE_V0.DEGRADED
  ) {
    return SYSTEM_STATE_V0.QUARANTINE;
  }

  if (
    playbookState === SYSTEM_STATE_V0.DEGRADED ||
    boundaryDiverged ||
    (compound && playbookState !== SYSTEM_STATE_V0.LIVE_OK)
  ) {
    return SYSTEM_STATE_V0.DEGRADED;
  }

  return SYSTEM_STATE_V0.LIVE_OK;
}

/**
 * @param {{
 *   correlationId?: string,
 *   label?: string,
 *   collectSignals?: () => object,
 *   fetchExternal?: boolean,
 *   observe?: boolean,
 *   requireGateway?: boolean,
 *   timeoutMs?: number,
 *   endCorrelationWindow?: boolean
 * }} [opts]
 */
export async function runEpistemicTickV0(opts = {}) {
  const tickOpenedAtMs = Date.now();
  const correlationId =
    opts.correlationId ??
    beginBreachCorrelationWindowV0({ label: opts.label || "epistemic_tick" });

  const collect = opts.collectSignals || (() => ({}));
  const rawSignals = collect() || {};
  const signals = { ...rawSignals, correlationId };

  const playbook = evaluatePostGoLiveIntegrityV0(signals);

  if (opts.observe !== false && playbook.system_state !== SYSTEM_STATE_V0.LIVE_OK) {
    observePostGoLiveIntegrityBreachV0(playbook, signals);
  }

  const client = collectClientBoundarySnapshotV0(
    rawSignals.clientBoundary ?? undefined
  );

  const external =
    opts.fetchExternal === false
      ? Object.freeze({
          gatewayLive: false,
          lastAcceptedSeq: null,
          healthStatus: null,
          fetchPhase: "not_fetched",
          collectedAtMs: Date.now()
        })
      : await fetchExternalBoundarySnapshotV0({
          timeoutMs: opts.timeoutMs
        });

  const boundary = evaluateExternalBoundaryValidationV0(client, external, {
    requireGateway: opts.requireGateway
  });

  if (opts.observe !== false && boundary.boundary_state === BOUNDARY_STATE_V0.DIVERGED) {
    observeExternalBoundaryBreachV0(boundary);
  }

  const observabilityFull = getBreachObservationTraceV0();
  const observability = Object.freeze({
    schema: observabilityFull.schema,
    correlationId,
    entries: Object.freeze(
      observabilityFull.entries.filter((e) => e.correlationId === correlationId)
    ),
    totalGlobal: observabilityFull.total,
    dropped: observabilityFull.dropped
  });

  const synthesis = synthesizeBreachCoherenceV0({ correlationId });

  const epistemic_state = resolveEpistemicStateV0(playbook, boundary, synthesis);
  const tickClosedAtMs = Date.now();

  const report = Object.freeze({
    schema: EPISTEMIC_TICK_SCHEMA_V0,
    version: "0.1",
    correlationId,
    tickWindow: Object.freeze({
      openedAtMs: tickOpenedAtMs,
      closedAtMs: tickClosedAtMs,
      durationMs: tickClosedAtMs - tickOpenedAtMs
    }),
    playbook: Object.freeze({
      state: () => playbook.system_state,
      system_state: playbook.system_state,
      checks: playbook.checks,
      schema: playbook.schema,
      atMs: playbook.atMs
    }),
    boundary: Object.freeze({
      validate: () => boundary.boundary_state,
      boundary_state: boundary.boundary_state,
      checks: boundary.checks,
      client: boundary.client,
      external: boundary.external
    }),
    observability: Object.freeze({
      trace: () => observability.entries,
      ...observability
    }),
    synthesis: Object.freeze({
      coherence: () => synthesis,
      compoundFault: synthesis.compoundFault,
      dominantResponseMode: synthesis.dominantResponseMode,
      systemicSummary: synthesis.systemicSummary
    }),
    epistemic_state,
    centralizedArbitrationBus: false,
    interpretationOnly: true
  });

  if (opts.endCorrelationWindow) {
    endBreachCorrelationWindowV0();
  }

  syncEpistemicTickWindowV0(report);

  if (opts.recordLedger !== false) {
    try {
      appendEpistemicTickToLedgerV0(report);
      if (opts.recordStability !== false) {
        evaluateEpistemicStabilityV0();
      }
    } catch {
      /* ledger must not break tick */
    }
  }

  return report;
}

/**
 * §7 loop using unified ticks (replaces raw evaluate-only loop).
 *
 * @param {{
 *   collectSignals?: () => object,
 *   onTick?: (report: Awaited<ReturnType<typeof runEpistemicTickV0>>) => void,
 *   durationMs?: number,
 *   intervalMs?: number,
 *   fetchExternal?: boolean,
 *   observe?: boolean,
 *   label?: string
 * }} [opts]
 * @returns {() => void} teardown
 */
export function startEpistemicTickLoopV0(opts = {}) {
  const durationMs = Number(opts.durationMs) || DEFAULT_LOOP_MS_V0;
  const intervalMs = Number(opts.intervalMs) || DEFAULT_INTERVAL_MS_V0;
  const started = Date.now();
  /** @type {Awaited<ReturnType<typeof runEpistemicTickV0>> | null} */
  let last = null;
  let inFlight = false;

  const tick = () => {
    if (inFlight) return;
    inFlight = true;
    void runEpistemicTickV0({
      collectSignals: opts.collectSignals,
      fetchExternal: opts.fetchExternal,
      observe: opts.observe,
      label: opts.label || "go_live_§7_tick",
      endCorrelationWindow: false
    })
      .then((report) => {
        last = report;
        opts.onTick?.(report);
        const loopActive = Date.now() - started < durationMs;
        if (typeof window !== "undefined") {
          window.__rhizoh_epistemic_tick = { ...report, loopActive };
          window.__rhizoh_go_live_integrity = {
            ...report.playbook,
            system_state: report.epistemic_state,
            correlationId: report.correlationId,
            boundary_state: report.boundary.boundary_state,
            compoundFault: report.synthesis.compoundFault,
            loopActive
          };
        }
      })
      .catch(() => {
        /* tick must not crash loop */
      })
      .finally(() => {
        inFlight = false;
      });
  };

  tick();
  const id = setInterval(() => {
    if (Date.now() - started >= durationMs) {
      clearInterval(id);
      endBreachCorrelationWindowV0();
      if (typeof window !== "undefined" && window.__rhizoh_epistemic_tick) {
        window.__rhizoh_epistemic_tick = {
          ...window.__rhizoh_epistemic_tick,
          loopActive: false
        };
      }
      if (typeof window !== "undefined" && window.__rhizoh_go_live_integrity) {
        window.__rhizoh_go_live_integrity = {
          ...window.__rhizoh_go_live_integrity,
          loopActive: false
        };
      }
      return;
    }
    tick();
  }, intervalMs);

  return () => {
    clearInterval(id);
    endBreachCorrelationWindowV0();
  };
}

function syncEpistemicTickWindowV0(last) {
  if (typeof window === "undefined") return;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh_epistemic_tick = last;
  window.__rhizoh.epistemicTick = Object.freeze({
    run: runEpistemicTickV0,
    startLoop: startEpistemicTickLoopV0,
    last: () => last,
    resolveState: resolveEpistemicStateV0
  });
}
