# Resolution Stability Envelope v1.0

**Status:** FROZEN — Phase 3 öncesi (taxonomy + conflict sonrası)  
**Code:** `apps/gateway/src/ops/resolutionStabilityEnvelopeV0.js`

---

## Problem: resolution instability risk

Çoklu sinyal + priority tree + confidence doğru yönde olsa da:

> Aynı algı (perception) → farklı confidence sınırında → farklı action

Borderline durumlarda kullanıcı deneyimi: “bazen rate limit, bazen değil” → **system unpredictability perception** → trust erosion.

Bu belge **aynı koşulda kararın ne kadar stabil olduğunu** ölçer.

---

## Operational cognition stack (5 katman)

| Katman | İşlev | Rhizoh |
|--------|--------|--------|
| 1 | Stress detection | ✔ |
| 2 | Stress classification | ✔ multi-signal |
| 3 | Conflict resolution | ✔ priority + hybrid |
| 4 | Action mapping (reflex) | ✔ compositional |
| 5 | **Resolution stability** | ✔ bu belge |

Akış: **Event → Perception → Interpretation → Decision → Stability proof**

---

## Action confidence (reflex yumuşatma)

`stressConfidence` = etiket güveni  
`actionConfidence` = uygulanan refleks güveni  

`actionConfidence < 0.72` iken (strict full eşiği):

| Strict | Applied |
|--------|---------|
| isolate | throttle |
| throttle | degrade |
| fallback | degrade |
| degrade | flag (yalnızca &lt; 0.55) |

**Hysteresis dead-band** `[0.68, 0.72)`: 0.69 ve 0.71 aynı applied action (oscillation önleme). `actionBorderline: true` → Phase 3 audit cohort.

Alanlar:

- `responseActionStrict` — priority/hybrid kararı
- `responseAction` — gerçekte uygulanan (softened olabilir)
- `actionSoftened: true|false`
- `actionInterpretable` — action confidence ≥ 0.7

**Amaç:** düşük güven → false isolation / false throttle riskini azaltmak; etiket attack kalsa bile refleks bir kademe yumuşar.

---

## Stability envelope

Aynı canonical input için `classifyStressResponseV0` **64 tekrar** → tek fingerprint.

```bash
npm run ops:resolution-stability-envelope
```

Export: `docs/exports/ops/resolution_stability_envelope_LATEST.json`

Gate: `resolution_stability_ready_for_phase3`

---

## Dual-layer interpretation (UX vs ops)

| Katman | Kim görür | Alan |
|--------|-----------|------|
| Truth | Ops / flight recorder | `stressClass`, `stressConfidence` |
| Execution | Kullanıcı HTTP | `userFacingAction`, `userMessageTr` (applied) |
| Strict ops | Debug / hardening | `responseActionStrict` |

Kullanıcı **asla** strict isolate mesajı görüp throttle almaz — copy `userFacingAction` ile hizalanır.

---

## Priority bias (bilinçli trade-off)

`attack > outage > cost > overload > drift` → **attack-first bias** mümkün; action softening bunu borderline’da dengeler.

Phase 3 drill: `actionSoftened: true` olayları ayrı cohort — operatör review.

---

## Phase 3 kuralı

Economic stress raporunda her olay:

1. `stressClass` + `stressSecondary`
2. `responseAction` + `responseActionStrict`
3. `stressConfidence` + `actionConfidence`
4. `resolutionInputCanonical` (stability key)

`stressConfidence < 0.74` → manuel review kuyruğu (rule-based v1 sınırı).

---

*Resolution Stability Envelope v1.0 — truth is resolved, and resolution must repeat.*
