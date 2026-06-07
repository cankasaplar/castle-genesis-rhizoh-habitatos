/**
 * Rhizoh Unified Pulse Loop v1 — live-first heartbeat.
 * Scheduler → live emit immediate · thinking observation async · fault-isolated stages.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { getContinuityKernelSnapshotV0 } from "./rhizohContinuityKernelV0.js";
import { getIdentityContinuitySnapshotV0 } from "./rhizohIdentityContinuityCoreV0.js";
import { runIdentityLifecycleDecayV0, getIdentityLifecycleSnapshotV0 } from "./rhizohIdentityLifecycleV0.js";
import { getIdentityEventLogSnapshotV0 } from "./rhizohIdentityEventLogV0.js";
import { resolveGatewayTransportV0 } from "./rhizohGatewayTransportFallbackV0.js";
import { getVoiceOutputAdapterSnapshotV0 } from "./rhizohVoiceOutputAdapterChainV0.js";
import { getVoiceAdapterRegistrySnapshot } from "./voiceInputAdapterRegistryV0.js";
import { getComputeAdapterSnapshotV0, probeComputeAdapterV0 } from "./rhizohComputeAdapterRegistryV0.js";
import {
  evaluatePersonaSchedulerPulseV1,
  notePersonaSchedulerUserActivityV0,
  notePersonaPulseEmittedV0
} from "./rhizohPersonaLoopSchedulerV0.js";
import { PRESENCE_EVENT_KIND_V0 } from "./rhizohPresenceSignatureV0.js";
import { emitLivePresenceV0 } from "./rhizohLiveLayerV0.js";
import { scheduleThinkingObservationV0 } from "./rhizohThinkingLayerV0.js";
import {
  safePulseStageV0,
  getPulseGovernanceSnapshotV0
} from "./rhizohPulseGovernanceV0.js";
import { filterIdentityNoiseV0 } from "./rhizohSemanticCompressionFilterV0.js";
import { evaluatePresencePrimitiveOnPulseV1 } from "./rhizohPresencePrimitiveV1.js";

export const RHIZOH_PULSE_LOOP_SCHEMA_V1 = "rhizoh.pulse_loop.v1";

const PULSE_TICK_MS_V1 = 2000;
const COMPUTE_PROBE_EVERY_TICKS_V1 = 30;

/** @type {number | null} */
let pulseTimerV1 = null;
/** @type {boolean} */
let mountedV1 = false;
/** @type {number} */
let pulseSeqV1 = 0;
/** @type {object | null} */
let lastPulseSnapshotV1 = null;

/**
 * Single heartbeat tick — live-first, fault-isolated.
 */
export function runRhizohPulseTickV1() {
  pulseSeqV1 += 1;
  const atMs = Date.now();

  const lifecycleStage = safePulseStageV0(
    "identity_lifecycle",
    () => runIdentityLifecycleDecayV0(),
    getIdentityLifecycleSnapshotV0()
  );
  const lifecycle = lifecycleStage.result;

  const transportStage = safePulseStageV0(
    "transport",
    () => resolveGatewayTransportV0(),
    Object.freeze({ mode: "local", role: "carrier_only" })
  );
  const transport = transportStage.result;

  const voiceStage = safePulseStageV0(
    "voice_readiness",
    () => {
      const voiceOut = getVoiceOutputAdapterSnapshotV0();
      const voiceIn = getVoiceAdapterRegistrySnapshot();
      return Object.freeze({
        input: voiceIn,
        output: voiceOut,
        ready: voiceOut.ttsAvailable || voiceOut.textBufferAvailable
      });
    },
    Object.freeze({ ready: true, output: { textBufferAvailable: true } })
  );
  const voice = voiceStage.result;

  const continuityStage = safePulseStageV0(
    "continuity",
    () => getContinuityKernelSnapshotV0(),
    Object.freeze({ state: "idle" })
  );
  const continuity = continuityStage.result;

  const identityStage = safePulseStageV0(
    "identity",
    () => getIdentityContinuitySnapshotV0(),
    Object.freeze({ turnCount: 0 })
  );
  const identity = identityStage.result;

  const eventLogStage = safePulseStageV0(
    "event_log",
    () => getIdentityEventLogSnapshotV0(),
    Object.freeze({ count: 0, ssot: true, recent: [] })
  );
  const eventLog = eventLogStage.result;

  const semanticFilter = safePulseStageV0(
    "semantic_filter",
    () => filterIdentityNoiseV0(eventLog),
    Object.freeze({ semanticMass: 0, noiseRatio: 0 })
  );

  const computeStage = safePulseStageV0(
    "compute_probe",
    () => {
      if (pulseSeqV1 === 1 || pulseSeqV1 % COMPUTE_PROBE_EVERY_TICKS_V1 === 0) {
        probeComputeAdapterV0().catch(() => {});
      }
      return getComputeAdapterSnapshotV0();
    },
    getComputeAdapterSnapshotV0()
  );
  const compute = computeStage.result;
  const computeDegraded = compute.adapterAvailable === false;

  const schedulerStage = safePulseStageV0(
    "scheduler",
    () =>
      evaluatePersonaSchedulerPulseV1({
        continuity,
        identity,
        lifecycle,
        userFocused: typeof document !== "undefined" ? document.hasFocus?.() === true : true,
        sessionDepth: lifecycle.turnCount
      }),
    Object.freeze({ shouldEmit: false })
  );
  const schedulerEval = schedulerStage.result;

  /** @type {object | null} */
  let emission = null;
  if (schedulerEval.shouldEmit && schedulerEval.phrase) {
    const emitStage = safePulseStageV0(
      "live_presence_emit",
      () =>
        emitLivePresenceV0({
          kind: schedulerEval.presenceKind || PRESENCE_EVENT_KIND_V0.PULSE,
          phrase: schedulerEval.phrase,
          intent: schedulerEval.kind,
          emotionalTone: schedulerEval.emotionalTone || lifecycle.emotionalToneLabel,
          carrier: transport.mode,
          traceId: `pulse_${pulseSeqV1}`,
          incrementTurn: false,
          speak: schedulerEval.speak !== false,
          source: "pulse_scheduler",
          moduleId: "pulse_loop",
          observe: false
        }),
      Object.freeze({ ok: false })
    );
    emission = emitStage.result;

    if (emission?.ok && schedulerEval.kind) {
      notePersonaPulseEmittedV0(schedulerEval.kind);
      scheduleThinkingObservationV0({
        source: "pulse_scheduler",
        kind: schedulerEval.presenceKind || PRESENCE_EVENT_KIND_V0.PULSE,
        intent: schedulerEval.kind,
        phrase: schedulerEval.phrase,
        traceId: `pulse_${pulseSeqV1}`,
        carrier: transport.mode,
        liveEvent: emission
      });
    }
  }

  if (!emission?.ok) {
    const primitiveStage = safePulseStageV0(
      "presence_primitive",
      () =>
        evaluatePresencePrimitiveOnPulseV1({
          seq: pulseSeqV1,
          continuity,
          eventLogCount: eventLog.count
        }),
      null
    );
    if (primitiveStage.result?.ok) {
      emission = primitiveStage.result.live;
    }
  }

  const stagesV1 = Object.freeze({
    identity_lifecycle: lifecycleStage,
    transport: transportStage,
    voice_readiness: voiceStage,
    continuity: continuityStage,
    identity: identityStage,
    event_log: eventLogStage,
    semantic_filter: semanticFilter,
    compute_probe: computeStage,
    scheduler: schedulerStage
  });

  const stageHealth = Object.freeze(
    Object.fromEntries(
      Object.entries(stagesV1).map(([k, s]) => [k, s.ok && !s.degraded])
    )
  );

  const degradedStages = Object.freeze(
    Object.entries(stagesV1)
      .filter(([, s]) => s.degraded || !s.ok)
      .map(([k, s]) =>
        Object.freeze({ stage: k, degraded: s.degraded, ok: s.ok, error: s.error ?? null })
      )
  );

  const systemHealth = Object.freeze({
    healthy: degradedStages.length === 0,
    degraded: degradedStages.length > 0,
    degradedStages,
    silentFallbackMasked: degradedStages.some((d) => d.degraded && d.ok === false)
  });

  const snapshot = Object.freeze({
    schema: RHIZOH_PULSE_LOOP_SCHEMA_V1,
    seq: pulseSeqV1,
    atMs,
    role: "live_first_governor",
    stageHealth,
    systemHealth,
    godLoopRiskMitigated: systemHealth.healthy,
    lifecycle,
    transport: Object.freeze({ ...transport, role: "carrier_only" }),
    voice,
    compute: Object.freeze({
      ...compute,
      isolatedFromVoice: true,
      voicePipelineAware: false
    }),
    continuity,
    identity,
    eventLog: Object.freeze({
      count: eventLog.count,
      ssot: true,
      semanticMass: semanticFilter.result?.semanticMass
    }),
    semanticFilter: semanticFilter.result,
    scheduler: schedulerEval,
    liveLayer: emission?.layer === "live" ? emission : null,
    pulseGovernance: getPulseGovernanceSnapshotV0(),
    emission,
    unified: true
  });

  lastPulseSnapshotV1 = snapshot;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.pulseLoop = snapshot;
    window.__rhizoh.pulseGovernance = snapshot.pulseGovernance;
    window.dispatchEvent(new CustomEvent("rhizoh:pulse-loop-v1", { detail: snapshot }));
  }

  if (pulseSeqV1 % 15 === 0) {
    logVoiceInfoV0("PULSE_LOOP_TICK", {
      seq: pulseSeqV1,
      transport: transport.mode,
      identityTurns: lifecycle.turnCount,
      emitted: Boolean(emission?.ok),
      liveFirst: Boolean(emission?.layer === "live"),
      semanticMass: semanticFilter.result?.semanticMass
    });
  }

  return snapshot;
}

export function mountRhizohPulseLoopV1() {
  if (typeof window === "undefined" || mountedV1) return;
  mountedV1 = true;
  notePersonaSchedulerUserActivityV0();

  const onActivity = () => notePersonaSchedulerUserActivityV0();
  window.addEventListener("pointerdown", onActivity, { passive: true });
  window.addEventListener("keydown", onActivity, { passive: true });

  runRhizohPulseTickV1();
  pulseTimerV1 = window.setInterval(runRhizohPulseTickV1, PULSE_TICK_MS_V1);
  logVoiceInfoV0("PULSE_LOOP_MOUNT", { tickMs: PULSE_TICK_MS_V1, governance: true });
}

export function getRhizohPulseLoopSnapshotV1() {
  return (
    lastPulseSnapshotV1 ||
    Object.freeze({
      schema: RHIZOH_PULSE_LOOP_SCHEMA_V1,
      mounted: mountedV1,
      seq: pulseSeqV1,
      unified: false,
      role: "governor"
    })
  );
}

/** @internal vitest */
export function __resetRhizohPulseLoopForTestV1() {
  if (pulseTimerV1 && typeof window !== "undefined") {
    window.clearInterval(pulseTimerV1);
  }
  pulseTimerV1 = null;
  mountedV1 = false;
  pulseSeqV1 = 0;
  lastPulseSnapshotV1 = null;
}
