/**
 * RCAL Crystal Topology — spatial cognition graph projection (not UI, not render engine).
 * Maps attention field → node/edge geometry for observation + RESL emotional tint hints.
 * Archive lineage: "crystal nodes" = first intuitive prototype of RCAL (image-space before semantic).
 * @see docs/RHIZOH_RCAL_CRYSTAL_TOPOLOGY_V1.md
 */

export const RCAL_CRYSTAL_TOPOLOGY_SCHEMA_V0 = "castle.rhizoh.rcal_crystal_topology.v0";

export const CRYSTAL_NODE_ROLE_V0 = Object.freeze({
  FOCUS_LOCK: "focus_lock",
  ANCHOR: "anchor",
  TRAIL: "trail",
  CLUSTER_HUB: "cluster_hub"
});

/**
 * @param {number} vx
 * @param {number} vy
 * @param {number} scale
 */
function vecToXYV0(vx, vy, scale = 1) {
  const m = Math.hypot(vx, vy) || 1;
  const s = Math.max(0.15, Math.min(1.2, scale));
  return Object.freeze({
    x: Math.round((vx / m) * s * 1000) / 1000,
    y: Math.round((vy / m) * s * 1000) / 1000
  });
}

/**
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").publishCognitiveAttentionV0>} cognitive
 */
export function projectRcalCrystalTopologyV0(cognitive) {
  if (!cognitive || typeof cognitive !== "object") {
    return Object.freeze({
      schema: RCAL_CRYSTAL_TOPOLOGY_SCHEMA_V0,
      nodes: Object.freeze([]),
      edges: Object.freeze([]),
      cluster: null,
      metaphor: "attention_crystallization",
      archiveMapping: Object.freeze({
        crystal_node: "attention_anchor",
        connection_line: "drift_vector_field",
        density_glow: "attention_magnitude",
        color_shift: "resl_emotional_projection",
        cluster: "selective_focus_region"
      }),
      emotional_projection_hint: null,
      atMs: Date.now()
    });
  }

  const instant = cognitive;
  const inertia = cognitive.attention_inertia || null;
  const iv = instant.attention_vector || {};
  const sv = inertia?.smoothed_vector || iv;
  const mag = Math.max(0, Math.min(1, Number(sv.magnitude) || 0));
  const instantMag = Math.max(0, Math.min(1, Number(iv.magnitude) || 0));
  const focus = inertia?.smoothed_focus || instant.selective_focus || {};
  const trail = inertia?.trail;
  const nowMs = Number(inertia?.atMs || instant.atMs) || Date.now();

  /** @type {Array<{ id: string, role: string, x: number, y: number, intensity01: number, label?: string }>} */
  const nodes = [];

  nodes.push(
    Object.freeze({
      id: "focus_lock",
      role: CRYSTAL_NODE_ROLE_V0.FOCUS_LOCK,
      ...vecToXYV0(0, 0, 0.2),
      intensity01: Number(mag.toFixed(4)),
      label: String(focus.primary || "ambient")
    })
  );

  nodes.push(
    Object.freeze({
      id: "drift_anchor",
      role: CRYSTAL_NODE_ROLE_V0.ANCHOR,
      ...vecToXYV0(Number(iv.vx) || 0, Number(iv.vy) || 0, instantMag),
      intensity01: Number(instantMag.toFixed(4)),
      label: instant.directionLabel || "self_anchor"
    })
  );

  if (focus.secondary) {
    nodes.push(
      Object.freeze({
        id: "cluster_secondary",
        role: CRYSTAL_NODE_ROLE_V0.CLUSTER_HUB,
        ...vecToXYV0(Number(sv.vx) * 0.55, Number(sv.vy) * 0.55, mag * 0.65),
        intensity01: Number((mag * 0.72).toFixed(4)),
        label: String(focus.secondary)
      })
    );
  }

  if (trail?.from && trail?.to) {
    nodes.push(
      Object.freeze({
        id: "trail_from",
        role: CRYSTAL_NODE_ROLE_V0.TRAIL,
        ...vecToXYV0(trail.from.vx, trail.from.vy, 0.35),
        intensity01: 0.35,
        label: String(trail.from.primary || "")
      }),
      Object.freeze({
        id: "trail_to",
        role: CRYSTAL_NODE_ROLE_V0.TRAIL,
        ...vecToXYV0(trail.to.vx, trail.to.vy, 0.45),
        intensity01: Number(mag.toFixed(4)),
        label: String(trail.to.primary || "")
      })
    );
  }

  /** @type {Array<{ id: string, from: string, to: string, drift01: number, kind: string }>} */
  const edges = [];

  const drift01 = Number(instant.intent_drift_control?.drift01) || 0;
  edges.push(
    Object.freeze({
      id: "drift_path",
      from: "focus_lock",
      to: "drift_anchor",
      drift01: Number(drift01.toFixed(4)),
      kind: "intent_drift"
    })
  );

  if (nodes.some((n) => n.id === "trail_from")) {
    edges.push(
      Object.freeze({
        id: "trail_span",
        from: "trail_from",
        to: "trail_to",
        drift01: Number((inertia?.motion_continuity01 || 0.5).toFixed(4)),
        kind: "attention_inertia"
      })
    );
    edges.push(
      Object.freeze({
        id: "trail_to_lock",
        from: "trail_to",
        to: "focus_lock",
        drift01: Number((1 - drift01).toFixed(4)),
        kind: "focus_return"
      })
    );
  }

  if (nodes.some((n) => n.id === "cluster_secondary")) {
    edges.push(
      Object.freeze({
        id: "cluster_link",
        from: "focus_lock",
        to: "cluster_secondary",
        drift01: Number((mag * 0.6).toFixed(4)),
        kind: "selective_focus"
      })
    );
  }

  const cluster = Object.freeze({
    primary: String(focus.primary || "ambient"),
    secondary: focus.secondary || null,
    region: "selective_focus",
    density01: Number(mag.toFixed(4)),
    lock01: Number((inertia?.inertia01 || 0.7).toFixed(4))
  });

  return Object.freeze({
    schema: RCAL_CRYSTAL_TOPOLOGY_SCHEMA_V0,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    cluster,
    metaphor: "attention_crystallization",
    archiveMapping: Object.freeze({
      crystal_node: "attention_anchor",
      connection_line: "drift_vector_field",
      density_glow: "attention_magnitude",
      color_shift: "resl_emotional_projection",
      cluster: "selective_focus_region"
    }),
    emotional_projection_hint: Object.freeze({
      tone: drift01 > 0.5 ? "cautious_shift" : mag > 0.55 ? "present_lock" : "ambient_hold",
      gazeBias01: Number((inertia?.projection?.gazeBias01 ?? mag).toFixed(4)),
      whyLookingCode: inertia?.propagation?.why_looking?.code || null,
      whyChangedCode: inertia?.propagation?.why_changed?.code || null
    }),
    atMs: nowMs
  });
}

export const RHIZOH_RCAL_TOPOLOGY_EVENT_V0 = "rhizoh:rcal-crystal-topology-v0";

/**
 * @param {ReturnType<typeof projectRcalCrystalTopologyV0>} topology
 */
/**
 * @param {ReturnType<typeof projectRcalCrystalTopologyV0>} topology
 */
export function publishRcalCrystalTopologyV0(topology) {
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.rcalCrystalTopology = topology;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_RCAL_TOPOLOGY_EVENT_V0, { detail: Object.freeze({ topology }) })
      );
    } catch {
      /* noop */
    }
  }
  return topology;
}
