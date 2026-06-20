import React from "react";
import ReactDOM from "react-dom/client";
import { bootstrapRhizohOntologicalGateV0 } from "../rhizoh/runtime/continuity/bootstrapOntologicalGateV0.js";
import { QuarantineOntologicalGateShell } from "./QuarantineOntologicalGateShell.jsx";
import { resolveIngressRouteV0 } from "../rhizoh/ingress/ingress_router.js";
import { RhizohIngressFlow } from "../rhizoh/ingress/RhizohIngressFlow.jsx";
import { hideLegacyIndexHudV0 } from "./castleCrashTelemetry.js";
import { installRhizohReflexDebugGlobalsV0 } from "../rhizoh/runtime/rhizohFastPrecheckV0.js";
import { installRhizohVoiceSmokeGlobalsV0 } from "../rhizoh/runtime/rhizohVoiceCommandSmokeHarnessV0.js";
import { startProdWorldObservabilityBridgeV0 } from "../rhizoh/runtime/rhizohProdWorldObservabilityBridgeV0.js";
import { publishIngressRouteV0 } from "../rhizoh/runtime/spatialSinkRoutePolicyV0.js";
import { ensureRhizohRuntimeSurfaceBinderV0 } from "../rhizoh/runtime/rhizohRuntimeSurfaceBinderV0.js";
import { runBootExecutionPhaseV0 } from "../rhizoh/runtime/executionPhaseSynchronizerV0.js";

/**
 * CORE-ELIGIBLE: mount after ontological gate (pre-render).
 *
 * @param {{
 *   appEl: HTMLElement,
 *   RootErrorBoundary: React.ComponentType<{ children: React.ReactNode }>,
 *   bootLog?: { ok?: (k: string, m: string) => void, fail?: (k: string, m: string) => void }
 * }} ctx
 */
export async function mountCastleApplicationV0(ctx) {
  const { appEl, RootErrorBoundary, bootLog } = ctx;

  hideLegacyIndexHudV0();
  installRhizohReflexDebugGlobalsV0();
  installRhizohVoiceSmokeGlobalsV0();
  bootLog?.ok?.("boot.ontological_gate", "pre-render gate starting");

  const gate = await bootstrapRhizohOntologicalGateV0();

  let reactRoot = window.__CASTLE_REACT_ROOT__;
  if (!reactRoot) {
    reactRoot = ReactDOM.createRoot(appEl);
    window.__CASTLE_REACT_ROOT__ = reactRoot;
  }

  if (!gate.proceed) {
    bootLog?.fail?.("boot.ontological_gate", String(gate.reason || "blocked"));
    reactRoot.render(
      <RootErrorBoundary>
        <QuarantineOntologicalGateShell
          reason={String(gate.reason || "EPISTEMIC_LEGITIMACY_BREACH")}
          detail={gate.error || gate.gateVerdict?.statement || ""}
        />
      </RootErrorBoundary>
    );
    return { mounted: true, quarantine: true, gate };
  }

  bootLog?.ok?.(
    "boot.ontological_gate",
    `CONTINUITY_OK world=${gate.bootContext?.livingWorldId || "?"} tick=${gate.bootContext?.targetTick ?? "?"}`
  );

  const surfaceAssert = ensureRhizohRuntimeSurfaceBinderV0();
  bootLog?.ok?.(
    "boot.runtime_surface",
    `fusion surface bound (${surfaceAssert?.apis?.join("|") || "ingest|fuse"})`
  );

  const phaseCommit = runBootExecutionPhaseV0({ gate });
  bootLog?.ok?.(
    "boot.execution_phase",
    `phase=${phaseCommit.commit.phaseSeq} aligned=${phaseCommit.phaseAligned} inference=${phaseCommit.commit.inferenceEligible}`
  );
  bootLog?.ok?.(
    "boot.admission_arbitration",
    `verdict=${phaseCommit.commit.arbitration?.verdict || "hold"} mutation=${phaseCommit.commit.realityMutationPermitted}`
  );
  bootLog?.ok?.(
    "boot.authority_ledger",
    `height=${phaseCommit.commit.ledgerHeight ?? 0} seal=${phaseCommit.commit.sealHash ? String(phaseCommit.commit.sealHash).slice(0, 10) : "none"}`
  );
  const bridgeSnap =
    typeof window !== "undefined" ? window.__rhizoh?.authorityGatewayBridge?.() : null;
  bootLog?.ok?.(
    "boot.authority_gateway_bridge",
    bridgeSnap?.wired
      ? `armed shadow=${bridgeSnap.shadowCount ?? 0} shared=${bridgeSnap.sharedOfficialHistory}`
      : "not_armed"
  );
  bootLog?.ok?.("boot.authority_replay_alignment", "armed deterministic-only");
  const epochSnap =
    typeof window !== "undefined" ? window.__rhizoh?.authorityLedger?.()?.epoch : null;
  bootLog?.ok?.(
    "boot.authority_epoch",
    epochSnap?.epochId ? `epoch=${String(epochSnap.epochId).slice(0, 10)}` : "not_minted"
  );
  bootLog?.ok?.("boot.authority_epoch_merge", "armed causal_assimilation");
  bootLog?.ok?.("boot.semantic_reality_field", "armed phase_4 projection");
  bootLog?.ok?.("boot.prism_cube_engine", "armed bounded_units compression");
  bootLog?.ok?.("boot.spatial_allocation", "armed logical_placement");
  bootLog?.ok?.("boot.arena_binding", "armed identity_kernel");
  bootLog?.ok?.("boot.spatial_slot_resolver", "armed world_projection");
  bootLog?.ok?.("boot.prism_cube_commit", "armed spatial_object");
  bootLog?.ok?.("boot.cesium_world_commit", "armed world_sink");
  bootLog?.ok?.("boot.spatial_distribution", "armed pin_spread");
  bootLog?.ok?.("boot.arena_population", "armed v11_layer_seeds");

  const observability = startProdWorldObservabilityBridgeV0();
  if (observability.started) {
    bootLog?.ok?.("boot.world_observability", "presence + liveMonitor bridge active");
  }

  const ingress = resolveIngressRouteV0();
  publishIngressRouteV0(ingress.route, { source: "boot.mount" });
  bootLog?.ok?.("boot.rhizoh_ingress", `route=${ingress.route} overlay=1`);

  reactRoot.render(
    <RootErrorBoundary>
      <RhizohIngressFlow />
    </RootErrorBoundary>
  );

  return { mounted: true, quarantine: false, gate, ingress: ingress.route };
}
