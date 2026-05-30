# Phase 3 — Execution Consistency Under Entropy Expansion v1.0

**Status:** FROZEN definition · **Engineering SSOT:** [`RHIZOH_ENGINEERING_SSOT_V1.0.md`](RHIZOH_ENGINEERING_SSOT_V1.0.md)  
**Slot:** Synthetic Crisis Week · Phase 3 · **Prerequisite:** `cognition_stack_ready_for_phase3`

---

## Phase 3 artık neyi test etmez?

| Artık kapalı (önceki fazlar / pre-gate) | Kanıt |
|----------------------------------------|--------|
| Karar **üretimi** (containment çalışıyor mu?) | Phase 1 |
| Karar **forensics** (kırılınca anlatılabiliyor mu?) | Phase 2 |
| Tek-input **stability** (64× aynı fingerprint) | `resolution_stability_envelope` |
| Taxonomy + conflict + hysteresis | `stress_taxonomy_verify` |

Phase 3 bu soruya gitmez: *“Sistem karar verebiliyor mu?”* — evet, kanıtlandı.

---

## Phase 3 neyi test eder?

**Execution consistency under entropy expansion** + **controlled mismatch measurement** (modeled vs observed)

> Input çeşitliliği artınca — **execution boundary** sabit mi? (gate)  
> **Modeled vs observed divergence** yüksek çözünürlükle ölçülüyor mu? (outcome)

| Çıktı | Alan |
|-------|------|
| Geometry gate | `phase3Gate: execution_consistent_under_entropy` |
| Phase 3 kind | `controlled_mismatch_measurement_layer` |
| Phase 3 outcome | `divergence_instrumentation_under_constrained_execution` |
| Artifact | `modeledObservedDivergence` |

Dört ilke (runtime):

| İlke | Anlam |
|------|--------|
| **truth is invariant** | `stressClass` + canonical key aynı perception → aynı truth |
| **execution is context-aware** | `responseAction` / `userFacingAction` baskıya göre yumuşar |
| **stability is enforced** | 64× probe + hysteresis dead-band |
| **ambiguity is absorbed** | hybrid + `actionBorderline` cohort |

---

## Entropy expansion boyutları

Phase 3 drill bu eksenlerde **varyasyon üretir** (tek senaryo değil, **küme**):

1. **Input diversity** — overload / cost / attack / drift / outage kodları ve kombinasyonları  
2. **Boundary density** — `actionConfidence` dead-band `[0.68, 0.72)` ve `actionSoftened` cohort  
3. **Adversarial mix** — camouflage (injection + rate limit) + meşru yük aynı pencerede  
4. **Economic pressure** — token budget, phased tier, soft downgrade (`FAST_DIALOGUE`)  
5. **Baseline deviation** — metrikler `behavioral_drift_baseline_LATEST.json` referansına göre sapma  

Senaryo adları (Synthetic Crisis): **Financial Avalanche** (+ kısmi Provider Blackout wiring).

---

## Birincil risk: execution drift under stable truth

| Katman | Drift belirtisi |
|--------|-----------------|
| Truth sabit | Aynı `resolutionInputCanonical` → farklı `stressClass` |
| Execution kayar | Aynı truth → farklı `userFacingAction` / HTTP status / throttle sıklığı |

**Kaynaklar (operasyonel):** kullanıcı davranış evrimi, cost/latency optimizasyonu, model routing, env tier değişimi.

**Görünürlük (mimari avantaj):** replay · fingerprint · hysteresis · dual layer (`responseActionStrict` vs `userFacingAction`).

Phase 3 raporu bu drift’i **sayısal** yapmalı: aynı canonical key üzerinde execution fingerprint dağılımı = 0 olmalı.

---

## Pass kriterleri (Phase 3 gate)

### A. Truth stability (entropy altında)

- Aynı canonical input kümesi → %100 tek `stressClass` fingerprint  
- Conflict senaryoları Phase 2 pre-gate ile uyumlu (regression yok)

### B. Execution consistency

- Aynı canonical input → %100 tek **execution fingerprint** (`responseAction`, `actionSoftened`, `userFacingAction`)  
- Dead-band içi (0.69 / 0.71) probe → flip yok (`verifyConfidenceBoundaryHysteresisV0`)

### C. Economic survival (Financial Avalanche)

- Hard limit → `cost_spike → throttle` (taxonomy etiketli)  
- Soft path → downgrade, queue fallback davranışı dokümante  
- Baseline’a göre sapma: flag cohort, bloklama yok (drift = izleme)

### D. Audit cohorts (insan review)

| Cohort | Koşul | Aksiyon |
|--------|--------|---------|
| `actionBorderline` | dead-band + softened | Operatör örnekleme |
| `actionSoftened` | strict ≠ applied | UX / trust review |
| `stressConfidence < 0.74` | rule-based v1 sınırı | Manuel kuyruk |

### E. Phase 3 gate string

`phase3Gate: execution_consistent_under_entropy` — A+B+C yeşil, D raporlanmış.

---

## Her olayda zorunlu alanlar (export / flight recorder)

```json
{
  "resolutionInputCanonical": "...",
  "stressClass": "attack",
  "stressSecondary": ["cost_spike"],
  "responseActionStrict": "isolate",
  "userFacingAction": "throttle",
  "actionSoftened": true,
  "actionBorderline": true,
  "stressConfidence": 0.74,
  "actionConfidence": 0.68,
  "conflictResolution": "priority_tree",
  "executionModel": "truth_stable_execution_adaptive"
}
```

---

## Komutlar (güncel)

| Amaç | Komut | Gate |
|------|--------|------|
| Cognition stack pre-gate | `npm run ops:stress-taxonomy-verify` | `cognition_stack_ready_for_phase3` |
| Stability envelope | `npm run ops:resolution-stability-envelope` | `resolution_stability_ready_for_phase3` |
| Drift referansı | `npm run ops:behavioral-drift-baseline` | baseline JSON |
| Phase 3 drill | `npm run ops:synthetic-crisis-phase3` | `execution_consistent_under_entropy` |

Matematik SSOT: [`STRESS_GEOMETRY_PHASE3_V1.0.md`](STRESS_GEOMETRY_PHASE3_V1.0.md) — \(\mathbf{e}\), \(H_c\), BCS.

Phase 3 harness: economic + entropy matrix → `docs/exports/ops/synthetic_crisis_phase3_*` + taxonomy etiketli olay listesi.

---

## Final çerçeve

Phase 3 sorusu:

> **“Hangi koşulda nasıl tutarlı kalıyor?”**

— çalışıyor mu değil, nasıl davranıyor değil; **entropy genişlediğinde davranış sınırı sabit mi?**

---

*Phase 3 Execution Consistency v1.0 — truth invariant, execution adaptive, stability enforced.*
