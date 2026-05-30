# Stress Geometry — Phase 3 Mathematical Model v1.0

**Status:** FROZEN · **Code:** `apps/gateway/src/ops/stressGeometryV0.js`  
**Run:** `npm run ops:synthetic-crisis-phase3`

Phase 3 artık prose değil; **stress geometry** — üç nesne + bir skaler gate.

---

## 1. Entropy vector space model

Perception noktası `I` (gateway input) için:

\[
\mathbf{e}(I) = (e_1, e_2, e_3, e_4, e_5) \in [0,1]^5
\]

| Axis | Sembol | Tanım |
|------|--------|--------|
| Input diversity | \(e_1\) | Sinyal / stress sınıfı çeşitliliği (normalize) |
| Boundary density | \(e_2\) | Hysteresis dead-band \([0.68, 0.72)\) yakınlığı |
| Adversarial mix | \(e_3\) | injection + abuse + overload camouflage |
| Economic pressure | \(e_4\) | cost_hard / cost_soft sinyalleri |
| Baseline deviation | \(e_5\) | Phase 2.5 tool-entropy referansından sapma |

**Entropy expansion magnitude** (weighted Euclidean):

\[
\|\mathbf{e}\|_w = \sqrt{\sum_{k=1}^{5} w_k \, e_k^2}
\]

Ağırlıklar: `ENTROPY_AXIS_WEIGHTS_V0` (adversarial mix en yüksek).

Phase 3 lattice \(L = \{p_1,\ldots,p_n\}\) — 15 yapılandırılmış probe; her biri \(\mathbf{e}(p_i)\) üretir.

---

## 2. Execution drift heatmap

İki katman fingerprint:

- **Canonical perception** \(c\) — `resolutionInputCanonical` (gate satırı)
- **Truth label** \(T\) — `stressClass` + `stressSecondary` + `conflictResolution` (audit)
- **Execution key** \(X\) — `userFacingAction` + `actionSoftened` + `actionBorderline`

**Gate heatmap** (perception-stable execution):

\[
H_c[c, X] = \#\{\text{probes}: \text{canonical}=c,\ \text{execution}=X\}
\]

\[
\text{drift}(c) = 1 - \frac{\max_X H_c[c,X]}{\sum_X H_c[c,X]}, \quad
\bar{D}_c = \frac{1}{|c|}\sum_c \text{drift}(c)
\]

Phase 3 gate: \(\bar{D}_c = 0\).

**Audit heatmap** \(H_t[T,X]\): aynı truth label, farklı perception → farklı execution olabilir (by design); `truthLabelSpread.meanExecutionSpread` raporlanır, gate değil.

---

## 3. Behavioral Consistency Score (BCS)

\[
\text{BCS} = w_t T + w_e E + w_d (1-\bar{D}) + w_s S + w_h H
\]

| Bileşen | Anlam |
|---------|--------|
| \(T\) | Canonical input → tek truth fingerprint oranı |
| \(E\) | Canonical input → tek execution fingerprint oranı |
| \(1-\bar{D}\) | Anti-drift (heatmap) |
| \(S\) | Probe stability (16× fingerprint sabit) |
| \(H\) | Hysteresis dead-band testi |

Varsayılan ağırlıklar: \(w_t{=}0.25,\ w_e{=}0.30,\ w_d{=}0.25,\ w_s{=}0.12,\ w_h{=}0.08\).

**Gate:** \(\text{BCS} \geq 0.85\) ve \(\bar{D}=0\) ve canonical collision yok.

---

## Dört ilke (geometrik okuma)

| İlke | Geometri |
|------|----------|
| truth is invariant | \(T\) sabit manifold |
| execution is context-aware | \(X\) softening ile kayar ama lattice'te deterministik |
| stability is enforced | \(S \to 1\) |
| ambiguity is absorbed | \(\|\mathbf{e}\|\) yüksek köşelerde BCS korunur |

---

## Export

`docs/exports/ops/synthetic_crisis_phase3_stress_geometry_LATEST.json`

İçerik: `entropyVectorSpace`, `executionDriftHeatmap`, `behavioralConsistencyScore`, `phase3Gate`.

---

## Pre-gates (sıra)

1. `ops:stress-taxonomy-verify` → `cognition_stack_ready_for_phase3`
2. `ops:resolution-stability-envelope`
3. `ops:behavioral-drift-baseline` (e5 referansı)
4. **`ops:synthetic-crisis-phase3`** → `execution_consistent_under_entropy`

---

---

## Lattice vs live traffic (engineering)

Lattice ⊂ live canonical keys. Gap → shadow sampling. SSOT: [`RHIZOH_ENGINEERING_SSOT_V1.0.md`](RHIZOH_ENGINEERING_SSOT_V1.0.md). Interpretive metaphors: [`RHIZOH_INTERPRETATION_LAYER_V1.0.md`](RHIZOH_INTERPRETATION_LAYER_V1.0.md).

---

*Stress Geometry v1.0 — observability engineering math layer.*
