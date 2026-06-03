/**
 * TRF — Topology Reactivation Field.
 * Why the crystal graph reshaped; cluster re-weight; deformation trigger (not UI).
 * @see docs/RHIZOH_TOPOLOGY_REACTIVATION_FIELD_V1.md
 */

export const TRF_SCHEMA_V0 = "castle.rhizoh.topology_reactivation_field.v0";

export const TRF_REACTIVATION_CAUSE_V0 = Object.freeze({
  INITIAL_CRYSTALLIZE: "initial_crystallize",
  QUIESCENT: "quiescent_hold",
  ATTENTION_REDISTRIBUTION: "attention_redistribution",
  CLUSTER_REWEIGHT: "cluster_reweight",
  PROPAGATION_SHIFT: "propagation_shift",
  VOICE_REENERGIZE: "voice_reenergize",
  FEL_REPATTERN: "fel_repattern",
  DRIFT_SURGE: "drift_surge",
  PERSISTENCE_LOCK: "persistence_lock"
});

export const RHIZOH_TOPOLOGY_REACTIVATION_EVENT_V0 = "rhizoh:topology-reactivation-v0";

const WHY_RESHAPE_COPY_V0 = Object.freeze({
  tr: Object.freeze({
    initial_crystallize: "İlk kristal topoloji oluştu",
    quiescent_hold: "Topoloji sabit — yeniden enerji yok",
    attention_redistribution: "Dikkat yeniden dağıldı",
    cluster_reweight: "Küme ağırlıkları güncellendi",
    propagation_shift: "Bakış nedeni değişti — graf yeniden şekillendi",
    voice_reenergize: "Ses kanalı topolojiyi yeniden uyandırdı",
    fel_repattern: "FEL sonrası topoloji yeniden örüldü",
    drift_surge: "Drift eşiği grafı yeniden çizdi",
    persistence_lock: "Uzun süreli odak — minimal deformasyon"
  }),
  en: Object.freeze({
    initial_crystallize: "Initial crystal topology formed",
    quiescent_hold: "Topology quiescent — no re-energy",
    attention_redistribution: "Attention redistributed",
    cluster_reweight: "Cluster weights updated",
    propagation_shift: "Gaze cause shifted — graph reshaped",
    voice_reenergize: "Voice channel re-energized topology",
    fel_repattern: "Post-FEL topology repattern",
    drift_surge: "Drift surge reshaped graph",
    persistence_lock: "Long focus lock — minimal deformation"
  })
});

/** @type {ReturnType<typeof import("./rhizohRcalCrystalTopologyV0.js").projectRcalCrystalTopologyV0> | null} */
let lastTopology = null;
/** @type {ReturnType<typeof deriveTopologyReactivationV0> | null} */
let lastTrf = null;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * @param {ReturnType<typeof import("./rhizohRcalCrystalTopologyV0.js").projectRcalCrystalTopologyV0>} topo
 */
function nodeIntensityMapV0(topo) {
  /** @type {Record<string, number>} */
  const m = {};
  for (const n of topo?.nodes || []) {
    m[n.id] = Number(n.intensity01) || 0;
  }
  return m;
}

/**
 * @param {ReturnType<typeof import("./rhizohRcalCrystalTopologyV0.js").projectRcalCrystalTopologyV0>} prev
 * @param {ReturnType<typeof import("./rhizohRcalCrystalTopologyV0.js").projectRcalCrystalTopologyV0>} next
 */
function measureTopologyDeltaV0(prev, next) {
  const prevMap = nodeIntensityMapV0(prev);
  const nextMap = nodeIntensityMapV0(next);
  let intensityDeltaSum = 0;
  let nodeCount = 0;
  const ids = new Set([...Object.keys(prevMap), ...Object.keys(nextMap)]);
  for (const id of ids) {
    intensityDeltaSum += Math.abs((nextMap[id] || 0) - (prevMap[id] || 0));
    nodeCount += 1;
  }
  const clusterShift =
    String(prev?.cluster?.primary || "") !== String(next?.cluster?.primary || "");
  const edgeDriftDelta = Math.abs(
    (prev?.edges?.[0]?.drift01 || 0) - (next?.edges?.find((e) => e.id === "drift_path")?.drift01 || 0)
  );
  return Object.freeze({
    intensityDeltaSum: nodeCount ? intensityDeltaSum / nodeCount : 0,
    clusterShift,
    edgeDriftDelta,
    nodeCountDelta: (next?.nodes?.length || 0) - (prev?.nodes?.length || 0)
  });
}

/**
 * @param {ReturnType<typeof measureTopologyDeltaV0>} delta
 * @param {ReturnType<typeof import("./rhizohCognitiveAttentionLayerV0.js").publishCognitiveAttentionV0>} [cognitive]
 */
function inferReactivationCauseV0(delta, cognitive) {
  const prop = cognitive?.attention_inertia?.propagation;
  const whyChanged = prop?.why_changed?.code;
  const whyLooking = prop?.why_looking?.code;
  const drift01 = Number(cognitive?.intent_drift_control?.drift01) || 0;

  if (whyChanged) return TRF_REACTIVATION_CAUSE_V0.PROPAGATION_SHIFT;
  if (whyLooking === "voice_open" || prop?.persisted_cause === "voice_open") {
    return TRF_REACTIVATION_CAUSE_V0.VOICE_REENERGIZE;
  }
  if (whyLooking === "fel_return" || whyChanged === "fel_return") {
    return TRF_REACTIVATION_CAUSE_V0.FEL_REPATTERN;
  }
  if (drift01 > 0.5 || delta.edgeDriftDelta > 0.2) return TRF_REACTIVATION_CAUSE_V0.DRIFT_SURGE;
  if (delta.clusterShift) return TRF_REACTIVATION_CAUSE_V0.CLUSTER_REWEIGHT;
  if (Number(prop?.persistence_ms) > 4000 && delta.intensityDeltaSum < 0.08) {
    return TRF_REACTIVATION_CAUSE_V0.PERSISTENCE_LOCK;
  }
  if (delta.intensityDeltaSum > 0.06) return TRF_REACTIVATION_CAUSE_V0.ATTENTION_REDISTRIBUTION;
  return TRF_REACTIVATION_CAUSE_V0.QUIESCENT;
}

/**
 * @param {ReturnType<typeof import("./rhizohRcalCrystalTopologyV0.js").projectRcalCrystalTopologyV0>} topo
 * @param {number} reactivation01
 */
function buildClusterReweightV0(topo, reactivation01) {
  const boost = 1 + reactivation01 * 0.45;
  return Object.freeze(
    (topo?.nodes || []).map((n) =>
      Object.freeze({
        nodeId: n.id,
        role: n.role,
        weight01: Number(Math.min(1, (n.intensity01 || 0) * boost).toFixed(4)),
        delta01: Number((reactivation01 * (n.role === "focus_lock" ? 0.35 : 0.15)).toFixed(4))
      })
    )
  );
}

/**
 * @param {number} reactivation01
 * @param {string} cause
 * @param {ReturnType<typeof import("./rhizohCognitiveAttentionLayerV0.js").publishCognitiveAttentionV0>} [cognitive]
 */
function buildDeformationTriggerV0(reactivation01, cause, cognitive) {
  const inertia = cognitive?.attention_inertia;
  const persist01 = Number(inertia?.propagation?.direction_persist01) || 0.5;
  return Object.freeze({
    /** VCL / RESL hint — not mesh deformation authority */
    breathScale: Number((1 + reactivation01 * 0.08 - persist01 * 0.04).toFixed(4)),
    twistDeg: Number((12 + reactivation01 * 18).toFixed(2)),
    shear: Number((0.06 + reactivation01 * 0.14).toFixed(4)),
    memoryDeform01: Number(
      (cause === TRF_REACTIVATION_CAUSE_V0.FEL_REPATTERN ? 0.55 : reactivation01 * 0.72).toFixed(4)
    ),
    active: reactivation01 > 0.12
  });
}

/**
 * @param {ReturnType<typeof import("./rhizohRcalCrystalTopologyV0.js").projectRcalCrystalTopologyV0>} nextTopo
 * @param {ReturnType<typeof import("./rhizohCognitiveAttentionLayerV0.js").publishCognitiveAttentionV0>} [cognitive]
 */
export function deriveTopologyReactivationV0(nextTopo, cognitive = null) {
  const nowMs = Number(nextTopo?.atMs) || Date.now();
  const prev = lastTopology;

  if (!prev || !(prev.nodes?.length)) {
    lastTopology = nextTopo;
    const trf = Object.freeze({
      schema: TRF_SCHEMA_V0,
      active: true,
      reactivation01: 1,
      cause: TRF_REACTIVATION_CAUSE_V0.INITIAL_CRYSTALLIZE,
      why_reshaped: Object.freeze({
        code: TRF_REACTIVATION_CAUSE_V0.INITIAL_CRYSTALLIZE,
        label_tr: WHY_RESHAPE_COPY_V0.tr.initial_crystallize,
        label_en: WHY_RESHAPE_COPY_V0.en.initial_crystallize
      }),
      cluster_reweight: buildClusterReweightV0(nextTopo, 1),
      deformation_trigger: buildDeformationTriggerV0(1, TRF_REACTIVATION_CAUSE_V0.INITIAL_CRYSTALLIZE, cognitive),
      delta: null,
      atMs: nowMs
    });
    lastTrf = trf;
    return trf;
  }

  const delta = measureTopologyDeltaV0(prev, nextTopo);
  const cause = inferReactivationCauseV0(delta, cognitive);
  const reactivation01 = clamp01(
    cause === TRF_REACTIVATION_CAUSE_V0.QUIESCENT
      ? 0.04
      : cause === TRF_REACTIVATION_CAUSE_V0.PERSISTENCE_LOCK
        ? 0.08
        : 0.15 +
            delta.intensityDeltaSum * 0.55 +
            (delta.clusterShift ? 0.22 : 0) +
            delta.edgeDriftDelta * 0.25 +
            (cognitive?.attention_inertia?.propagation?.why_changed ? 0.28 : 0)
  );

  const active =
    reactivation01 > 0.12 ||
    delta.clusterShift ||
    Boolean(cognitive?.attention_inertia?.propagation?.why_changed);

  const copy = WHY_RESHAPE_COPY_V0;
  const trf = Object.freeze({
    schema: TRF_SCHEMA_V0,
    active,
    reactivation01: Number(reactivation01.toFixed(4)),
    cause,
    why_reshaped: Object.freeze({
      code: cause,
      label_tr: copy.tr[cause] || copy.tr.attention_redistribution,
      label_en: copy.en[cause] || copy.en.attention_redistribution,
      propagation: cognitive?.attention_inertia?.propagation?.why_changed || null
    }),
    cluster_reweight: buildClusterReweightV0(nextTopo, reactivation01),
    deformation_trigger: buildDeformationTriggerV0(reactivation01, cause, cognitive),
    delta,
    atMs: nowMs
  });

  lastTopology = nextTopo;
  lastTrf = trf;
  return trf;
}

/**
 * @param {ReturnType<typeof deriveTopologyReactivationV0>} trf
 * @param {ReturnType<typeof import("./rhizohRcalCrystalTopologyV0.js").projectRcalCrystalTopologyV0>} topology
 */
export function publishTopologyReactivationV0(trf, topology) {
  const enriched = Object.freeze({
    ...topology,
    reactivation: trf
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.topologyReactivation = trf;
    window.__rhizoh.rcalCrystalTopology = enriched;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_TOPOLOGY_REACTIVATION_EVENT_V0, {
          detail: Object.freeze({ trf, topology: enriched })
        })
      );
    } catch {
      /* noop */
    }
  }
  return enriched;
}

/**
 * @param {ReturnType<typeof import("./rhizohRcalCrystalTopologyV0.js").projectRcalCrystalTopologyV0>} topology
 * @param {ReturnType<typeof import("./rhizohCognitiveAttentionLayerV0.js").publishCognitiveAttentionV0>} [cognitive]
 */
export function syncTopologyReactivationV0(topology, cognitive = null) {
  const trf = deriveTopologyReactivationV0(topology, cognitive);
  return publishTopologyReactivationV0(trf, topology);
}

export function readLastTopologyReactivationV0() {
  return lastTrf;
}

export function resetTopologyReactivationForTestV0() {
  lastTopology = null;
  lastTrf = null;
}
