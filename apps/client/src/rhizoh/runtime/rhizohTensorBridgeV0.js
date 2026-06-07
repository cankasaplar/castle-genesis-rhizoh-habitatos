/**
 * Tensor bridge — intent → decision → safety filter → constraint → action.
 * All execution gated through control plane audit + nervous system acyclic graph.
 */

import { resolveDomainAdapterV0 } from "./domainAdapterRegistryV0.js";
import { RHIZOH_DOMAIN_CAPABILITY_V0 } from "./rhizohDomainCapabilitySpecV0.js";
import { DOMAIN_READ_ONLY_ZONES_V0 } from "./rhizohDomainCapabilitySpecV0.js";
import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";
import { dispatchNervousSystemEventV0 } from "./rhizohNervousSystemEventGraphV0.js";
import {
  validateTensorSafetyV0,
  auditTensorDecisionV0,
  getControlPlaneSnapshotV0
} from "./rhizohControlPlaneV0.js";
import {
  traceAdapterResolveV0,
  traceAdapterInvokeV0,
  traceTensorDecisionV0,
  traceFallbackV0
} from "./rhizohTruthTraceLayerV0.js";
import {
  explainTensorSafetyBlockV0,
  explainAdapterFailureV0
} from "./rhizohExplanationLayerV0.js";

/** Deterministic intent map per domain — same input → same action shape. */
const TENSOR_INTENT_RESOLVERS_V0 = Object.freeze({
  [RHIZOH_DOMAIN_ID_V0.CASTLE]: Object.freeze({
    health_probe: () =>
      Object.freeze({ action: "health_probe", channel: "castle_session_graph" }),
    connect_user: (req) =>
      Object.freeze({
        action: "establish_session_graph",
        steps: Object.freeze(["allocate_channel", "sync_presence", "bind_identity"]),
        targetUserId: req.targetUserId ?? null
      }),
    bridge_init: () => Object.freeze({ action: "castle_tensor_init" })
  }),
  [RHIZOH_DOMAIN_ID_V0.STUDIO]: Object.freeze({
    health_probe: () => Object.freeze({ action: "health_probe", toolchain: "studio_sandbox" }),
    create_map: () =>
      Object.freeze({
        action: "allocate_editor_runtime",
        steps: Object.freeze(["resolve_toolchain", "open_map_builder", "persist_artifact"])
      }),
    create_asset: (req) =>
      Object.freeze({
        action: "run_asset_pipeline",
        kind: req.kind ?? "glb"
      }),
    bridge_init: () => Object.freeze({ action: "studio_tensor_init" })
  }),
  [RHIZOH_DOMAIN_ID_V0.OBSERVER]: Object.freeze({
    health_probe: () => Object.freeze({ action: "health_probe", mode: "read_only" }),
    observe_system: () =>
      Object.freeze({
        action: "read_only_snapshot",
        steps: Object.freeze(["flatten_runtime", "attach_log_stream", "emit_telemetry"])
      }),
    bridge_init: () => Object.freeze({ action: "observer_tensor_init" })
  }),
  [RHIZOH_DOMAIN_ID_V0.WORLD]: Object.freeze({
    health_probe: () => Object.freeze({ action: "health_probe", surface: "spatial" }),
    open_world_map: () =>
      Object.freeze({ action: "spatial_render_init", surface: "cesium", op: "ensure_ready" }),
    bridge_init: () => Object.freeze({ action: "world_tensor_init" })
  }),
  [RHIZOH_DOMAIN_ID_V0.T0]: Object.freeze({
    health_probe: () => Object.freeze({ action: "health_probe", surface: "t0_live" }),
    bridge_init: () => Object.freeze({ action: "t0_tensor_init" })
  })
});

/**
 * @param {string} domain
 * @param {string} intent
 * @param {object} request
 */
function resolveDeterministicTensorActionV0(domain, intent, request = {}) {
  const d = String(domain || "").trim();
  const i = String(intent || "bridge_init").trim();
  const map = TENSOR_INTENT_RESOLVERS_V0[d];
  const resolver = map?.[i] || map?.bridge_init;
  if (!resolver) {
    return Object.freeze({ action: "tensor_idle", intent: i, domain: d });
  }
  return resolver(request);
}

/**
 * @param {string} domain
 * @param {{ intent?: string, state?: object, op?: string, mutate?: boolean, skipSafety?: boolean }} request
 */
export function mapIntentToActionV0(domain, request = {}) {
  const d = String(domain || "").trim();
  const intentKey = String(request.intent || "bridge_init");
  const startedAt = Date.now();
  const dryRun = request.dryRun === true;

  if (DOMAIN_READ_ONLY_ZONES_V0.has(d) && request.mutate === true) {
    const blocked = Object.freeze({ ok: false, reason: "observer_read_only", domain: d });
    auditTensorDecisionV0(d, blocked);
    traceTensorDecisionV0({
      domain: d,
      intent: intentKey,
      blocked: true,
      blockReason: "observer_read_only",
      fallback: "read_only",
      latencyMs: Date.now() - startedAt
    });
    return blocked;
  }

  const dispatched = dispatchNervousSystemEventV0("tensor", d, intentKey, () => {
    const action = resolveDeterministicTensorActionV0(d, request.intent, request);

    if (!request.skipSafety) {
      const safety = validateTensorSafetyV0(d, action, request);
      if (!safety.allowed) {
        const blocked = Object.freeze({
          ok: false,
          reason: safety.reason,
          domain: d,
          intent: intentKey,
          action
        });
        auditTensorDecisionV0(d, blocked);
        traceFallbackV0(d, safety.reason, { intent: intentKey, action: action?.action ?? null });
        explainTensorSafetyBlockV0(d, safety.reason, {
          intent: intentKey,
          action: action?.action ?? null
        });
        traceTensorDecisionV0({
          domain: d,
          intent: intentKey,
          action: action?.action ?? null,
          blocked: true,
          blockReason: safety.reason,
          fallback: safety.reason,
          latencyMs: Date.now() - startedAt
        });
        return blocked;
      }
    }

    const adapter = resolveDomainAdapterV0(d, RHIZOH_DOMAIN_CAPABILITY_V0.TENSOR);
    traceAdapterResolveV0(d, RHIZOH_DOMAIN_CAPABILITY_V0.TENSOR, adapter, "tensor_bridge");

    const invoked = dryRun
      ? Object.freeze({ ok: true, dryRun: true, action })
      : adapter?.invoke?.({
          intent: request.intent ?? null,
          state: request.state ?? null,
          op: request.op ?? null,
          action
        }) ?? null;

    if (!dryRun) {
      traceAdapterInvokeV0(
        d,
        RHIZOH_DOMAIN_CAPABILITY_V0.TENSOR,
        adapter,
        { intent: intentKey, action: action?.action ?? null },
        invoked,
        startedAt
      );
    }

    const fallback =
      invoked?.reason === "null_adapter"
        ? "idle_adapter"
        : invoked?.ok === false
          ? invoked.reason || "adapter_failed"
          : "none";

    const result = Object.freeze({
      ok: invoked?.ok !== false,
      domain: d,
      intent: request.intent ?? null,
      action,
      invoked,
      dryRun,
      downgrade: getControlPlaneSnapshotV0(d)?.downgrade ?? null
    });
    auditTensorDecisionV0(d, result);
    traceTensorDecisionV0({
      domain: d,
      intent: intentKey,
      action: action?.action ?? null,
      adapterId: adapter?.id ?? "null",
      render: invoked?.ok !== false ? "ok" : "blocked",
      fallback,
      latencyMs: Date.now() - startedAt
    });
    return result;
  });

  if (!dispatched.ok) {
    const blocked = Object.freeze({
      ok: false,
      reason: dispatched.reason || "tensor_dispatch_blocked",
      domain: d
    });
    auditTensorDecisionV0(d, blocked);
    traceTensorDecisionV0({
      domain: d,
      intent: intentKey,
      blocked: true,
      blockReason: dispatched.reason || "tensor_dispatch_blocked",
      fallback: dispatched.reason || "tensor_dispatch_blocked",
      latencyMs: Date.now() - startedAt
    });
    return blocked;
  }
  return dispatched.result ?? dispatched;
}

/**
 * @param {string} domain
 * @param {string} capability
 * @param {object} request
 */
export function invokeDomainCapabilityV0(domain, capability, request = {}) {
  const d = String(domain || "").trim();

  if (DOMAIN_READ_ONLY_ZONES_V0.has(d) && request.mutate === true) {
    return Object.freeze({ ok: false, reason: "observer_read_only", domain: d });
  }

  const downgrade = getControlPlaneSnapshotV0(d)?.downgrade;
  if (d === RHIZOH_DOMAIN_ID_V0.WORLD && downgrade?.spatialCommands === false && request.op) {
    return Object.freeze({ ok: false, reason: "world_spatial_downgraded", deferred: true });
  }
  if (d === RHIZOH_DOMAIN_ID_V0.CASTLE && downgrade?.voiceEnabled === false && capability === "voice") {
    return Object.freeze({ ok: false, reason: "castle_voice_downgraded", deferred: true });
  }

  const startedAt = Date.now();
  const dispatched = dispatchNervousSystemEventV0("adapter", d, capability, () => {
    const adapter = resolveDomainAdapterV0(d, capability);
    traceAdapterResolveV0(d, capability, adapter, "capability_invoke");
    const result = adapter.invoke(request);
    traceAdapterInvokeV0(d, capability, adapter, request, result, startedAt);
    if (result?.reason === "null_adapter" || result?.ok === false) {
      traceFallbackV0(d, result?.reason || "adapter_failed", {
        capability,
        adapterId: adapter?.id ?? "null"
      });
      explainAdapterFailureV0(d, capability, adapter?.id ?? "null", result?.reason || "adapter_failed");
    }
    return result;
  });
  if (!dispatched.ok) {
    traceFallbackV0(d, dispatched.reason || "adapter_blocked", { capability });
    return Object.freeze({ ok: false, reason: dispatched.reason || "adapter_blocked" });
  }
  return dispatched.result;
}

/**
 * @param {string} domain
 */
export function runTensorBridgeInitV0(domain) {
  return mapIntentToActionV0(domain, { intent: "bridge_init", skipSafety: true });
}
