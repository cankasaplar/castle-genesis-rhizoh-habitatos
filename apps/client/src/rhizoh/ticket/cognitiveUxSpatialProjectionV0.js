/**
 * Cognitive UX Spatial Projection v0 — semantic geometry → SVG render hints.
 * RESEARCH-ONLY — perception projection, not execution.
 * @see docs/RHIZOH_COGNITIVE_UX_LAYER_V1.md
 */

export const COGNITIVE_UX_SPATIAL_SCHEMA_V0 = "castle.rhizoh.cognitive_ux_spatial.v0";

const TAU = Math.PI * 2;

/**
 * @param {number} n
 */
function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {string} geometry
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {number} intensity01
 */
function buildGeometryPathsV0(geometry, cx, cy, radius, intensity01) {
  const r = radius * (0.35 + intensity01 * 0.65);
  const paths = [];

  if (geometry === "angular_spikes") {
    const spikes = 8;
    for (let i = 0; i < spikes; i += 1) {
      const a0 = (i / spikes) * TAU - Math.PI / 2;
      const a1 = ((i + 0.35) / spikes) * TAU - Math.PI / 2;
      const a2 = ((i + 1) / spikes) * TAU - Math.PI / 2;
      const x0 = cx + Math.cos(a0) * r * 0.4;
      const y0 = cy + Math.sin(a0) * r * 0.4;
      const x1 = cx + Math.cos(a1) * r;
      const y1 = cy + Math.sin(a1) * r;
      const x2 = cx + Math.cos(a2) * r * 0.4;
      const y2 = cy + Math.sin(a2) * r * 0.4;
      paths.push(`M ${x0} ${y0} L ${x1} ${y1} L ${x2} ${y2} Z`);
    }
  } else if (geometry === "vertical_bars") {
    const bars = 6;
    const w = (r * 1.4) / bars;
    for (let i = 0; i < bars; i += 1) {
      const h = r * (0.3 + ((i % 3) + 1) * 0.2 * intensity01);
      const x = cx - r * 0.7 + i * w;
      paths.push(`M ${x} ${cy + h / 2} L ${x} ${cy - h / 2}`);
    }
  } else if (geometry === "waveform_bands") {
    const steps = 24;
    let d = "";
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = cx - r + t * r * 2;
      const y = cy + Math.sin(t * TAU * 2) * r * 0.35 * intensity01;
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    paths.push(d);
  } else if (geometry === "halo_rings") {
    for (let ring = 1; ring <= 3; ring += 1) {
      const rr = (r * ring) / 3;
      paths.push(
        `M ${cx + rr} ${cy} A ${rr} ${rr} 0 1 0 ${cx - rr} ${cy} A ${rr} ${rr} 0 1 0 ${cx + rr} ${cy}`
      );
    }
  } else if (geometry === "gate_brackets") {
    const w = r * 0.5;
    const h = r * 0.8;
    paths.push(`M ${cx - w} ${cy - h} L ${cx - w * 0.5} ${cy - h} L ${cx - w * 0.5} ${cy + h} L ${cx - w} ${cy + h}`);
    paths.push(`M ${cx + w} ${cy - h} L ${cx + w * 0.5} ${cy - h} L ${cx + w * 0.5} ${cy + h} L ${cx + w} ${cy + h}`);
  } else if (geometry === "particle_field") {
    const particles = 14;
    for (let i = 0; i < particles; i += 1) {
      const a = (i / particles) * TAU + intensity01;
      const dist = r * (0.2 + ((i * 5) % 7) / 10);
      const px = cx + Math.cos(a) * dist;
      const py = cy + Math.sin(a * 1.3) * dist * 0.85;
      const pr = 1.2 + (i % 3) * 0.6;
      paths.push(`M ${px} ${py} m -${pr} 0 a ${pr} ${pr} 0 1 0 ${pr * 2} 0 a ${pr} ${pr} 0 1 0 -${pr * 2} 0`);
    }
  } else {
    paths.push(`M ${cx} ${cy} m -${r * 0.2} 0 a ${r * 0.2} ${r * 0.2} 0 1 0 ${r * 0.4} 0 a ${r * 0.2} ${r * 0.2} 0 1 0 -${r * 0.4} 0`);
  }

  return Object.freeze(paths);
}

/**
 * @param {object} layer
 * @param {{ cx?: number, cy?: number, radius?: number }} [opts]
 */
export function projectDensityLayerV0(layer, opts = {}) {
  const cx = opts.cx ?? 50;
  const cy = opts.cy ?? 50;
  const radius = opts.radius ?? 40;
  const intensity01 = clamp01(layer?.visual?.intensity01 ?? layer?.share01 ?? 0.5);
  const geometry = layer?.visual?.geometry || "neutral_point";
  const hueDeg = layer?.visual?.hueDeg ?? 0;

  return Object.freeze({
    schema: COGNITIVE_UX_SPATIAL_SCHEMA_V0,
    kind: "density_layer",
    category: layer?.category,
    geometry,
    hueDeg,
    intensity01,
    paths: buildGeometryPathsV0(geometry, cx, cy, radius, intensity01),
    strokeWidth: geometry === "vertical_bars" ? 2 : 1,
    fillOpacity: geometry === "angular_spikes" ? 0.35 + intensity01 * 0.25 : 0,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} densityField
 */
export function projectDriftFieldViewportV0(densityField) {
  const layers = densityField?.layers || [];
  const projected = layers.map((layer, i) =>
    projectDensityLayerV0(layer, {
      cx: 20 + ((i % 3) + 0.5) * (60 / 3),
      cy: 30 + Math.floor(i / 3) * 35,
      radius: 18 + (layer.share01 || 0) * 12
    })
  );

  return Object.freeze({
    schema: COGNITIVE_UX_SPATIAL_SCHEMA_V0,
    kind: "drift_field_viewport",
    layers: Object.freeze(projected),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} recTimeLayer
 */
export function projectRecWaveformViewportV0(recTimeLayer) {
  const wf = recTimeLayer?.waveform || {};
  const intensity01 = clamp01(wf.envelopeThickness01 ?? 0.3);
  const projected = projectDensityLayerV0(
    {
      visual: { geometry: "waveform_bands", intensity01, hueDeg: 280 },
      share01: intensity01
    },
    { cx: 50, cy: 50, radius: 42 }
  );

  return Object.freeze({
    schema: COGNITIVE_UX_SPATIAL_SCHEMA_V0,
    kind: "rec_waveform_viewport",
    epochId: recTimeLayer?.epochId,
    peak: wf.peak,
    localTimeAnchor: wf.localTimeAnchor,
    pendingCompressionCount: wf.pendingCompressionCount,
    waveform: projected,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} densityField
 */
export function projectScSpikeViewportV0(densityField) {
  const scLayer = (densityField?.layers || []).find((l) => l.category === "SC");
  if (!scLayer) {
    return Object.freeze({
      schema: COGNITIVE_UX_SPATIAL_SCHEMA_V0,
      kind: "sc_spike_viewport",
      empty: true,
      interpretationOnly: true,
      nonExecutive: true
    });
  }

  const projected = projectDensityLayerV0(
    { ...scLayer, visual: { ...scLayer.visual, geometry: "angular_spikes" } },
    { cx: 50, cy: 50, radius: 44 }
  );

  return Object.freeze({
    schema: COGNITIVE_UX_SPATIAL_SCHEMA_V0,
    kind: "sc_spike_viewport",
    layer: projected,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {Record<string, number>} categoryCounts
 */
export function projectStochasticFieldViewportV0(categoryCounts = {}) {
  const entries = Object.entries(categoryCounts);
  const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
  const layers = entries.map(([category, count], i) =>
    projectDensityLayerV0(
      {
        category,
        share01: count / total,
        visual: {
          geometry: category === "ENTROPY_DRIFT" ? "particle_field" : "halo_rings",
          hueDeg: category === "ENTROPY_DRIFT" ? 300 : 260,
          intensity01: count / total
        }
      },
      { cx: 25 + (i % 2) * 50, cy: 40 + Math.floor(i / 2) * 25, radius: 22 }
    )
  );

  return Object.freeze({
    schema: COGNITIVE_UX_SPATIAL_SCHEMA_V0,
    kind: "stochastic_field_viewport",
    spaceId: "sports.causal.space",
    layers: Object.freeze(layers),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} binding
 * @param {{ sportsDriftCategories?: Record<string, number> }} [opts]
 */
export function buildMultiSpaceViewportV0(binding, opts = {}) {
  const chessViewport = buildEpistemicViewportV0(binding);
  const sportsField = projectStochasticFieldViewportV0(opts.sportsDriftCategories || {});

  return Object.freeze({
    schema: COGNITIVE_UX_SPATIAL_SCHEMA_V0,
    kind: "multi_space_viewport",
    chess: Object.freeze({
      spaceId: "chess.causal.space",
      projection: "deterministic_field",
      viewport: chessViewport
    }),
    sports: Object.freeze({
      spaceId: "sports.causal.space",
      projection: "stochastic_field",
      viewport: sportsField
    }),
    hybridOverlap: Object.freeze({
      kind: "drift_overlap_zone",
      note: "deterministic chess field + stochastic sports entropy overlay",
      interpretationOnly: true
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} binding
 */
export function buildEpistemicViewportV0(binding) {
  const densityField = binding?.densityField;
  const recTimeLayer = binding?.recTimeLayer;

  return Object.freeze({
    schema: COGNITIVE_UX_SPATIAL_SCHEMA_V0,
    kind: "epistemic_viewport",
    driftField: projectDriftFieldViewportV0(densityField),
    recWaveform: projectRecWaveformViewportV0(recTimeLayer),
    scSpike: projectScSpikeViewportV0(densityField),
    interpretationOnly: true,
    nonExecutive: true
  });
}
