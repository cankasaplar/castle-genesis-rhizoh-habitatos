# Rhizoh Temporal Drift Guard (TDG) v0

**Status:** ACTIVE — **continuity insurance** (not a product feature)  
**SPECFLOW:** `RESEARCH-ONLY`  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_CCF_V1.md`](RHIZOH_CCF_V1.md) · [`RHIZOH_ECC_V1.md`](RHIZOH_ECC_V1.md) · [`RHIZOH_LIVED_CONTINUITY_STABILITY_V0.md`](RHIZOH_LIVED_CONTINUITY_STABILITY_V0.md)

**Tek cümle:** CCF (frame) ile ECC (motion) arasında **faz kayması yokluğu** — süreklilik sigortası.

---

## 0. Ne değil / ne

| Değil | Evet |
|-------|------|
| Yeni feature | Continuity insurance |
| MCO (self-watching) | CCF↔ECC phase lock |
| CCF yeniden çalıştırma | ECC-only soft correction |
| UI açıklama | Hissedilir düzeltme (fade/velocity) |

```text
CCF = şimdi (frame)
ECC = şimdi nasıl akıyor (motion)
TDG = frame ile motion aynı fazda mı?
```

---

## 1. Yerleşim

```text
compile ECC (raw)
   ↓
Temporal Drift Guard (CCF + prior ECC state)
   ↓
publish ECC → T0 narrativeStream.temporal_guard
```

**Yasak:** TDG → CCF geri çağrı · TDG → MCIB/TRF · TDG → execution.

---

## 2. Drift sınıfları

| Class | Anlam |
|-------|--------|
| `frame_motion_slip` | CCF `experiential_now_id` değişti, ECC hâlâ `hold` + yüksek velocity |
| `motion_without_frame` | CCF sabit, ECC `shift`/`drift` + yüksek velocity |
| `velocity_jump` | `narrative_velocity` tick arası sıçrama |
| `compound` | Birden fazla |

`phase_coherence_ok` = `drift_magnitude01 < 0.38`

---

## 3. Sigorta düzeltmeleri (yalnızca ECC)

Drift yüksekse:

- `narrative_velocity` — önceki tick ile yumuşatma
- `micro_transition.undertone_weight01` — dampen
- `fade_semantics` — `durationMs` / `delayMs` hafif uzatma (`phase_lock: true`)
- Gerekirse micro `settle` (frame_motion_slip)

Çoğulluk **korunur** (CCF `latent_echo` dokunulmaz).

---

## 4. Çıktı

`ecc.temporal_guard`:

| Alan | Rol |
|------|------|
| `phase_coherence_ok` | Faz kayması yok mu |
| `drift_magnitude01` | Kayma şiddeti |
| `drift_class` | Sınıf |
| `corrections_applied` | ECC düzeltildi mi |
| `insurance_only` | Her zaman `true` |
| `frame_motion_aligned` | CCF↔ECC hizası |

T0: `narrativeStream.phase_coherence_ok`

---

## 5. SSOT

```javascript
window.__rhizoh.temporalDriftGuard
window.__rhizoh.experienceContinuity.temporal_guard
```

Event: `rhizoh:temporal-drift-guard-v0`

Modül: `rhizohTemporalDriftGuardV0.js`

---

## 6. MCO ile fark

| TDG | MCO |
|-----|-----|
| Aktif sigorta (ECC yumuşatma) | **Deferred** — observe-only |
| CCF↔ECC faz kilidi | Sistem geneli coherence audit |
| Üretim yolunda | Sidecar (gelecek) |

---

## 7. Kilit cümle

```text
MCIB çoğaltır · CCF tekleştirir · ECC akıtır · TDG faz kaymasını sigortalar.
Continuity integrity > feature.
```
