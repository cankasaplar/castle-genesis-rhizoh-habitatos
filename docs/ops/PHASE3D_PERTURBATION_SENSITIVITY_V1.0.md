# Phase 3D — Attractor Perturbation Sensitivity Map v1.0

**Status:** FROZEN · **Code:** `phase3DPerturbationSensitivityV0.js`  
**Export:** `phase3DAttractorIntelligence.perturbationSensitivityMap`

Extends attractor intelligence with **perturbation geometry** — still no new sensors.

---

## Three fields

### 1) Input → attractor influence

For each observed stressor (input) that caused a region transition:

| Field | Meaning |
|-------|---------|
| `influenceScore` | \(\|\Delta\mathbf{p}\| / R_{\text{basin}} \times (1 + 5D)\) — magnitude vs basin radius, divergence-weighted |
| `axisDelta` | \((\Delta u, \Delta s, \Delta g)\) |
| `sourceAttractor` / `targetAttractor` | Ejection geometry |
| `byInput[].targetDistribution` | Normalized push per target basin |

Answers: **hangi input hangi attractoru ne kadar etkiliyor**

---

### 2) Basin boundary fragility

Per attractor basin:

| Metric | Meaning |
|--------|---------|
| `boundaryMargin` | \(R - d_{\text{catalog}}\) — distance to design basin edge |
| `boundaryPressure` | Mean exit magnitude when leaving this basin |
| `crossBasinProximity` | How close in-phase samples come to other basins |
| `fragilityScore` | Combined score ∈ [0,1] |
| `fragilityClass` | `robust` \| `moderate` \| `fragile` |

Answers: **basin boundary fragility** — küçük pertürbasyon çıkarır mı?

---

### 3) Transition probability field

From observed trajectory transitions:

- **Marginal:** \(P(\text{to} \mid \text{from})\) — `marginalTransitions`, `transitionMatrix`
- **Conditioned:** \(P(\text{to} \mid \text{from}, \text{input})\) — `stressorConditioned`
- **Rankings:** highest probability edges

Answers: **attractor transition probability field**

---

## Summary block

```json
"summary": {
  "dominantPerturbation": "F3_divergence_explosion",
  "mostFragileBasin": "attractor_locked",
  "highestTransitionProbability": "optimal→kilitli"
}
```

---

## Run

```bash
npm run ops:phase3-execution-runtime
```

Requires `phase3dGate: phase3d_attractor_layer_ready` (sensitivity map non-empty).

---

*Perturbation sensitivity v1.0 — Phase 3D frontier extension.*
