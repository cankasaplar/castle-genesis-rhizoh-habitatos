# Phase 3.1 — Control Feedback Loop Optimization (roadmap)

**Status:** DESIGN ONLY — not active runtime in v1.0  
**Trigger export:** `phase31FeedbackLoopPlan` from harness when balance ≠ balanced

---

## Goal

Move from **static thresholds** → **adaptive gating curve** without collapsing engineering SSOT.

| v1.0 (now) | v3.1 (planned) |
|------------|----------------|
| Fixed divergence bands | Dynamic band from shadow histogram |
| Fixed entropyLimit | Entropy adaptive gating |
| Manual schema bump | Schema evolution triggers (explicit) |
| Over-gating alarm | Over-gating **self-correction** |

---

## When system relaxes vs hard-stabilizes

| Signal | Action |
|--------|--------|
| `over_gating_dominant` + usefulness low | **Intentional relax** — entropy −0.05, MID band widen |
| `under_sensitive_dominant` | **Hard stabilize** — divergenceMid −0.05, review G2/G4 |
| `unstable_gate_calibration` | Full recalibration + shadow replay |
| `balanced` | Hold thresholds; collect live histogram |

---

## Modules (Phase 3.1)

1. **Over-gating self-correction** — auto-loosen when operational CER > 1.2 and usefulness < 0.5 (bounded steps)  
2. **Under-sensitivity guard** — tighten when drill miss rate > 0.25  
3. **Entropy adaptive gating** — limit = f(p95 lattice entropy, live shadow p95)  
4. **Schema evolution triggers** — dimension change only on `modeled_projection.v0.x` bump + migration note  
5. **Control feedback loop optimization** — closed loop: observe balance → propose delta → human approve → apply config version  

---

## Non-goals (stay engineering)

- Not epistemic truth tuning  
- Not ML classifier for “reality”  
- Not auto-relax without audit log entry  

---

## Entry condition for Phase 3.1 work

- `npm run ops:phase3-execution-runtime` green  
- Live shadow sampling ≥ N canonical keys (ops decision)  
- `operabilityBalance.balance !== balanced` for 3+ consecutive weekly exports **OR** explicit ops request  

---

*Phase 3.1 roadmap — operability tuning protocol, not new ontology.*
