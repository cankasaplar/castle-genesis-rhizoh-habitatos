# Stress Response Taxonomy v1.0

**Status:** FROZEN — Phase 3 öncesi zorunlu netlik  
**Code:** `apps/gateway/src/ops/stressResponseTaxonomyV0.js`

Phase 3 gözlemlenebilir ama **yorumlanamaz** kalmasın diye her olay şu matrise oturur:

| Stress class | System response | Anlam (operasyonel) |
|--------------|-----------------|---------------------|
| **overload** | **degrade** | Meşru yük / kapasite — kalite veya hız düşer, sistem yaşar |
| **attack** | **isolate** | Kötü niyet veya politika ihlali — oturum/kanal kesilir |
| **cost_spike** | **throttle** | Finansal bütçe — sert limit veya downgrade yolu |
| **drift** | **flag** | Zaman içinde davranış sapması — bloklamaz, izler (baseline’a göre) |
| **outage** | **fallback** | Dış sağlayıcı / acil disable — yedek yol veya güvenli mod |

**Kısa form:** `stressClass → responseAction` (ör. `attack → isolate`)

---

## Eski vs yeni soru

| Eski | Yeni |
|------|------|
| “Ne oldu?” (log satırı) | “**Hangi tür stres** ve **hangi refleks**?” |

---

## Kod eşlemesi (örnek)

| Internal code | stressClass | responseAction |
|---------------|-------------|----------------|
| `phased_rollout_capacity` | overload | degrade |
| `rate_limit_exceeded` | overload | throttle |
| `prompt_abuse_detected` | attack | isolate |
| `agent_recursive_tool_lock` | attack | isolate |
| `cost_hard_limit` | cost_spike | throttle |
| `cost_soft_downgrade` | cost_spike | degrade |
| `behavioral_drift_suspected` | drift | flag |
| `provider_http_503` | outage | fallback |
| `agent_emergency_disable` | outage | fallback |

Tam liste: `CODE_MAP` in `stressResponseTaxonomyV0.js`.

---

## API / Flight Recorder

LLM hata yanıtı ve snapshot’larda:

```json
{
  "stressClass": "attack",
  "responseAction": "isolate",
  "stressMatrix": "attack → isolate",
  "stressInterpretable": true
}
```

---

## Phase 3 kuralı

Phase 3 economic drill raporunda her olay **taxonomy ile etiketli** olmalı.

Aksi halde metrikler var ama operatör şunu ayırt edemez:

- “Yavaşladık çünkü yoğunluk mu?”
- “Yavaşladık çünkü saldırı mı?”
- “Yavaşladık çünkü bütçe mi?”

---

## Çakışma çözümü (conflict resolution) — Phase 3 öncesi zorunlu

Bir olay **birden fazla** stres sınıfına uyduğunda tek kod yeterli değildir. Yanlış etiket → yanlış refleks zinciri (false throttle / false isolation / silent degradation).

### Öncelik ağacı (primary class)

Düşük indeks = yüksek öncelik:

1. **attack** — güvenlik / politika (isolate baskın)
2. **outage** — sağlayıcı / acil disable (fallback)
3. **cost_spike** — bütçe (throttle / degrade)
4. **overload** — meşru kapasite (degrade / throttle)
5. **drift** — yalnızca izleme; **asla** primary’yi outage/overload üzerine çıkarmaz (secondary)
6. **none**

Örnekler:

| Sinyaller | Primary | Secondary | Mod |
|-----------|---------|-----------|-----|
| `prompt_abuse_detected` + `cost_hard_limit` | attack | cost_spike | priority_tree |
| `phased_rollout_capacity` + drift | overload | drift | **hybrid** |
| `provider_http_503` + drift | outage | drift | priority_tree |
| `rate_limit` + `injectionFlag` | attack (escalation) | — | **adversarial_escalation** |

### Hibrit tepki (response actions)

Birden fazla sınıf varsa **en sert** eylem uygulanır (severity: isolate > throttle ≈ fallback > degrade > flag).

- **drift + overload:** primary `overload → degrade`, secondary `drift → flag` (bloklamaz, izler)
- API alanları: `responseActions[]`, `stressSecondary[]`, `conflictResolution`, `stressConfidence` (0–1)

### Adversarial camouflage guard

Yüzeyde overload (`rate_limit`, `phased_rollout`) görünürken `injectionFlag` veya abuse `riskFlags` varsa → primary **attack**’e yükseltilir (`adversarial_escalation`, confidence ~0.78).

**Amaç:** attack → overload yanlış etiketini azaltmak (false degradation).

### Güven skoru (`stressConfidence`)

| Durum | ~confidence |
|-------|-------------|
| Tek net kod | 0.92 |
| Aynı sınıfta çoklu sinyal | 0.95 |
| priority_tree çözümü | 0.74 |
| hybrid (drift + başka) | 0.80 |
| adversarial_escalation | 0.78 |
| Bilinmeyen kod | ≤0.38, `interpretable: false` |

`stressInterpretable: true` yalnızca confidence ≥ 0.7 ve bilinen kodda.

### Action confidence (reflex yumuşatma)

`actionConfidence` = uygulanan refleks güveni. `stressConfidence < 0.7` → `responseAction` bir kademe yumuşar (`isolate→throttle`, `throttle→degrade`, …). Etiket (`stressClass`) aynı kalabilir; uygulanan refleks `responseActionStrict`’ten farklı olabilir (`actionSoftened: true`).

---

## Resolution stability envelope

Aynı canonical input → 64 tekrar → tek karar fingerprint. Ayrıntı: `docs/ops/RESOLUTION_STABILITY_ENVELOPE_V1.0.md`

```bash
npm run ops:resolution-stability-envelope
```

---

## Doğrulama

```bash
npm run ops:stress-taxonomy-verify
npm run ops:resolution-stability-envelope
```

- Tüm beş `stressClass → responseAction` çifti en az bir kodla kapsanmış olmalı.
- `conflictResolution` senaryoları geçmeli.
- Stability envelope senaryoları %100 deterministik olmalı.

Gate: `cognition_stack_ready_for_phase3`

---

## Sıra (güncel)

1. Phase 1 — containment  
2. Phase 2 — forensics  
3. Phase 2.5 — drift baseline  
4. **Taxonomy + conflict + stability** (bu belge + envelope)  
5. Phase 3 — economic stress (etiketli + stability key)  

---

*Stress Response Taxonomy v1.0 — interpretable stress before Phase 3.*
