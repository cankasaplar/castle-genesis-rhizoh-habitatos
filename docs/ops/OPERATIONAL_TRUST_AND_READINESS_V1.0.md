# Operational Trust & Readiness v1.0

**Frame:** Rhizoh is a **measurable organism**, not only a running system.

---

## Failure modes are now visible

| Era | State |
|-----|--------|
| Most AI systems | Works or breaks — **cannot explain why** |
| Rhizoh now | **Break controlled** (Phase 1) · **Break explainable** (Phase 2) · **Drift** (baseline → future) |

This is a major threshold: **failure modes are visible**.

---

## Two different questions

| Question | Layer | Status |
|----------|--------|--------|
| Does the system work? | Control | Phase 1 ✓ |
| When it fails, can we tell the story? | Forensics | Phase 2 ✓ |
| Is it **changing over time**? | Behavioral drift | Baseline v0 → active metrics v1.1 |

The second question is what Google / OpenAI / financial infra scale systems share.

---

## `phase3Gate` = operational trust score (not global readiness)

| Signal | Meaning |
|--------|---------|
| `may_proceed_controlled` | Controlled exposure band — staging, legal MVP, phased users |
| `global_readiness` | **false** until Phase 3–4 + organic diversity proven |

**Controlled exposure ≠ global readiness**

- Can carry **real users** in bounded cohorts  
- Cannot yet claim **global chaos absorption** (organic behavior diversity, bot swarms, provider outages at scale)

---

## Self-auditing AI infrastructure (current stack)

| Capability | Status |
|------------|--------|
| Containment | ✔ |
| Observability / replay | ✔ |
| Isolation | ✔ |
| Cost control (readiness) | ✔ harness |
| Drift monitoring | ⚠ baseline snapshot; thresholds not active |

---

## Phase 2.5 — Behavioral drift baseline (before Phase 3)

**Why:** Phase 3 without reference = strong but **unanchored** economic stress.

```bash
npm run ops:behavioral-drift-baseline
```

Captures (synthetic normal cohorts **50 / 200 / 500**):

- Tool usage distribution + entropy  
- Context fingerprint spread (entropy proxy)  
- Avg tokens / session  
- Cost probe blocked rate (sanity)

Output:

- `docs/exports/ops/behavioral_drift_baseline_LATEST.json`  
- `digest` — future runs compare here  

---

## Decision points

### 1. Phase 3 = economic survival test

Not “technical pass/fail” — **operational hayatta kalma**:

- Cost spike  
- Queue pressure  
- Model downgrade path (real traffic shape)

Run only after: Phase 1 ✓ · Phase 2 ✓ · **baseline captured** ✓

### 2. When drift becomes active metric?

| Now (v0) | v1.1+ |
|----------|--------|
| Baseline snapshot | Drift detection thresholds |
| Note-level | User cohort comparison |
| | Time-based behavior delta |

---

## Biggest risk now

Not technical collapse — **measurement blindness** (ölçüm körlüğü).

Mitigation: baseline digest + weekly Phase 1/2 harness + compare `compareToBehavioralDriftBaselineV0`.

---

## Commands (order)

```bash
npm run ops:synthetic-crisis-phase1
npm run ops:synthetic-crisis-phase2
npm run ops:behavioral-drift-baseline
# then Phase 3 economic drill (future script)
```

---

*Operational trust v1.0 — May 2026.*
