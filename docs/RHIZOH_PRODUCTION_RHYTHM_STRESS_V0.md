# Rhizoh Production Rhythm Stress Test v0

**Status:** ACTIVE · **SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohProductionRhythmStressTestV0.js`

---

## Rol — pre-deploy final gate

Deploy = release değil · **organizmanın gerçek dünyada ilk nefesi**.

Bu test deploy öncesi son teknik kapı:

| Signal | Output |
|--------|--------|
| Heartbeat jitter | `jitter_graph[]`, p95 / max |
| SCR → WAL → ICL | `drift_trace[]` |
| Pet motion | `pet_continuity[]`, lock rate |
| Studio loop | `studio_ticks[]`, ok rate |

---

## CI (compressed)

```bash
npm run ops:production-rhythm-stress-v0
```

Default: **600 logical ticks** (~10 min @ 1 heartbeat/sec) in module; CI test runs **48 ticks** for speed.

---

## Browser (extended 10–30 min)

```javascript
const m = await import("./rhizohProductionRhythmStressTestV0.js");
// ~10 min logical
m.runProductionRhythmStressTestV0({ ticks: 600 });
// ~30 min logical
m.runProductionRhythmStressTestV0({ ticks: 1800 });
```

---

## Gate (`deploy_ready`)

- `jitter_p95_ms` ≤ 64
- `icl_drift_events` = 0 (`identity_break`)
- `identity_fork_events` = 0 (`fork_risk`)
- `studio_ok_rate` ≥ 0.99
- `pet_lock_rate` ≥ 0.99
- no perception fork storm (non-surface drift ≤ 1% ticks)

---

## SSOT

```javascript
window.__rhizoh.productionRhythmStressTest
window.__rhizoh.deployRhythmGate
```

Bkz. [`RHIZOH_ORGANISM_STABILIZATION_V0.md`](RHIZOH_ORGANISM_STABILIZATION_V0.md) · [`RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md`](RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md)
