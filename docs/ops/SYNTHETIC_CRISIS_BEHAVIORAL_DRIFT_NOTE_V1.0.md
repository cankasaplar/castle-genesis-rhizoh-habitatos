# Behavioral Drift Layer — Note v1.0 (future)

**Status:** BASELINE v0 captured — active thresholds v1.1+  
**Baseline:** `npm run ops:behavioral-drift-baseline` → `docs/exports/ops/behavioral_drift_baseline_LATEST.json`  
**Why:** LLM sistemlerinde en sinsi risk anlık crash değil, **gradual behavior drift**.

---

## What it would measure

| Signal | Örnek |
|--------|--------|
| Tool path distribution shift | Aynı prompt → farklı tool sırası haftalar içinde |
| Model routing drift | Downgrade oranı artışı |
| Risk flag rate change | Injection false positive/negative kayması |
| Latency / token baselines | Sessiz maliyet kayması |

---

## Relation to Phase 2

- Phase 2: **tek olay** sonrası narrative reconstruction (deterministic replay)  
- Drift layer: **zaman serisi** — “sistem farklı davranmaya başladı mı?”

---

## Suggested v1.1 hooks

- Weekly digest: `narrativeReconstructionDigest` distribution  
- Baseline compare: Phase 1 harness metrics vs previous week  
- Alert: tool lock rate > 2σ from 7-day median  

---

*Placeholder — pre-operational sovereign AI infrastructure.*
