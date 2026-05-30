# Phase 2.5 — Behavioral Drift Baseline v1.0

**Slot:** After Phase 2 · **Before** Phase 3 economic stress  
**Command:** `npm run ops:behavioral-drift-baseline`

---

## Purpose

Answer: **What does “normal” look like** at 50 / 200 / 500 user patterns?

Without this, Phase 3 measures stress but not **deviation from healthy**.

---

## Captured fields

| Field | Use |
|-------|-----|
| `toolUsageDistribution` | Drift: new tools dominate |
| `toolEntropyBits` | Drift: path diversity collapse or explosion |
| `uniqueContextFingerprints` | Organic diversity vs attack uniformity |
| `avgTokensPerSession` | Cost baseline before avalanche |
| `digest` | Immutable reference hash |

---

## Not global readiness

Baseline = **reference**, not proof of worldwide scale.

Organic user behavior diversity (locales, edge cases) still grows in production — baseline must be **refreshed** after counsel + first staging cohort.

---

## Next

Phase 3: Financial Avalanche — compare metrics to `behavioral_drift_baseline_LATEST.json`.

---

*Phase 2.5 v1.0*
