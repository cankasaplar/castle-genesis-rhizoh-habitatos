# Rhizoh Continuity Observability v0

**Status:** ACTIVE — **non-invasive** telemetry (not MCO)  
**SPECFLOW:** `RESEARCH-ONLY`  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_RELEASE_CONTROL_ROOM_V0.md`](RHIZOH_RELEASE_CONTROL_ROOM_V0.md) · [`RHIZOH_LIVED_CONTINUITY_STABILITY_V0.md`](RHIZOH_LIVED_CONTINUITY_STABILITY_V0.md)

**Yasak:** Observability → CCF/ECC/RESL geri beslemesi. **Observe only.**

---

## 0. İki yol (bu tur)

| Yol | Bu repoda |
|-----|-----------|
| **A Production hardening** | CSSI 0–3s · TDG first-3s velocity jitter damp · FEL re-entry curve tune |
| **B Observability** | `rhizohContinuityObservabilityV0.js` · CIS ring · heatmap · first contact |

---

## 1. Metrikler

### CSSI — First 0–3s Coherence Stability Index

Modül: `rhizohFirst3sCoherenceStabilityV0.js`

| Alan | Anlam |
|------|--------|
| `cssi01` | 0–3 sn CIS + phase + velocity jitter birleşimi |
| `stable` | `cssi01 >= 0.58` ve phase ok oranı yüksek |
| `velocity_jitter01` | İlk 3 sn narrative velocity sıçraması |

### User felt presence? (proxy)

`user_felt_presence_score01` — **proxy, oracle değil**

- first paint ok
- CIS
- TDG phase ok
- voice coherence
- zero-frame fallback kullanılmadı (tercihen)

### Continuity integrity drift heatmap

`continuity_integrity_drift_heatmap`:

- `drift_none` · `frame_motion_slip` · `motion_without_frame` · `velocity_jump` · `compound` (sayım)
- `by_elapsed_second` — drift birikimi

### First contact success rate

| Alan | Anlam |
|------|--------|
| `first_contact_success` | İlk 10 sn içinde paint + CIS gate + CSSI |
| `first_contact_success_rate01` | 0 veya 1 (session) |
| `voice_entry_success_rate01` | deferred / attempts |

---

## 2. SSOT

```javascript
window.__rhizoh.continuityObservability
window.__rhizoh.continuityObservabilityRing  // last 64 samples
window.__rhizoh.continuityIntegrityScore       // CIS (her sample)
```

Event: `rhizoh:continuity-observability-v0`

---

## 3. Smoke

```bash
npm run ops:continuity-smoke-v0
```

Browser prod (0–10 sn):

```javascript
window.__rhizoh.continuityFirstPaint
window.__rhizoh.continuityObservability
```

---

## 4. MCO farkı

| MCO | Observability v0 |
|-----|------------------|
| Deferred | **Active** (read-only) |
| Sistem coherence audit | Ürün hissi proxy + CSSI |
| Hot path düzeltme | **Yok** |

---

## 5. Kilit cümle

```text
Engine measures stability · Observability asks “did it feel continuous?” · No self-watching consciousness.
```
