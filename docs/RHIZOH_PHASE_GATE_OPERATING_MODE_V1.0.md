# Rhizoh Phase Gate — Operating Mode v1.0

**Status:** ACTIVE (founder / ops SSOT — what to do next)  
**Date:** 2026-05-19

---

## One sentence (state definition)

**Rhizoh is not a running system — it is an activation-controlled control-plane spec with a frozen perception shell.**

Runtime is **consciously absent**. Work is: *may it be turned on?* (readiness), not *turn it on* (signal).

---

## Architectural truth (four parts)

| Part | Role today |
|------|------------|
| **UI** | Perception shell (frozen) |
| **Repo** | Control-plane spec |
| **Activation** | Ops gate (READY / HOLD) |
| **Runtime** | Intentionally off (data-plane closed) |

You are building **whether execution is allowed** — not expanding world semantics.

---

## What is DONE (do not reopen without HOLD + written thaw)

| Track | Status |
|-------|--------|
| UI / surface framing | ✔ DONE |
| Perception stabilization (L1–L5, L2 chrome) | ✔ DONE |
| Control-plane (ingress, legal, cohort no-op) | ✔ frozen |
| Data-plane | ✔ intentionally off |
| Mock vs real boundary SSOT | ✔ [`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md) |

**Stop:** new formal docs after [`RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md`](RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md) — boundary system, not proof engine. Ops only: readiness · stress export.

---

## Three options (decision matrix)

| Option | What it means | Verdict |
|--------|---------------|---------|
| **A — Freeze** | L1–L5 locked; bugfix + regression-only copy; no new mapping | **Required baseline** |
| **B — Activation readiness** | DNS/TLS/hosting/routing scaffold; signal **off**; checklist + dry-run | **Primary next step** |
| **C — Real signal design** | `device_heartbeat_v1` spec only; ingestion still closed | **Spec exists — no new design** |

**Chosen path:** **A + B** (not C implementation).

```
Perception DONE → Freeze regressions → Readiness + deploy scaffold → Human READY/HOLD → only then signal
```

---

## Allowed work (until READY signed)

| Allowed | Not allowed |
|---------|-------------|
| Bugfix | New features |
| Leakage regression fix (must cite L-ID in boundary map) | New UI flows / onboarding |
| `npm run activation:readiness-check` | `VITE_RHIZOH_PHASE1_SIGNAL=1` in prod |
| MANUAL checklist (DNS, TLS, Firebase, legal) | WAL / heartbeat ingest wiring |
| Deploy scaffold (static ingress, rules review) | Concept→Code mapping as SSOT |
| Ops decision log READY / HOLD | Attorney claims / new legal surface |

---

## Spine rules (unchanged)

1. **Deployment ≠ activation** — DNS live does not turn on data-plane.
2. **Signal switch** — only after [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md) + signed ops log.
3. **Observation ≠ execution** — heartbeat (when on) is non-effective until later phases say otherwise.

---

## Two gates (do not merge)

| Gate | Question | Mechanism |
|------|----------|-----------|
| **1 — Ready?** | Can we operate safely? | `activation:readiness-check` + MANUAL checklist |
| **2 — Open?** | May signal run? | `VITE_RHIZOH_PHASE1_SIGNAL` — **forbidden until READY signed** |

Without this split: premature live **or** infinite spec production. Both are closed.

---

## Progression line (MUST / SHOULD / OPTIONAL)

### MUST (active work)

- [ ] `npm run activation:readiness-check` (AUTO slice)
- [ ] MANUAL checklist A1–A5 ([`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md))
- [ ] DNS / TLS staging verification (evidence in ops log)

### SHOULD (ops control)

- [ ] Staging deploy scaffold (static + rules)
- [ ] Ingress smoke (preamble → cohort → app; signal **off**)
- [ ] Confirm `isDataPlaneActiveV0() === false` on staging build

### OPTIONAL (regression only)

- [ ] L6 / L15 cleanup **only if** perception regression observed — not a sprint

---

## Dry-run sequence (B)

1. `npm run activation:readiness-check` → AUTO slice green  
2. Complete MANUAL A1–A5 in checklist  
3. Staging deploy (ingress smoke, preamble, cohort no-op)  
4. Confirm `isDataPlaneActiveV0()` === false in staging build  
5. Copy `activation_decision_LOG.template.json` → signed **READY** or **HOLD**  
6. **Only if READY:** staging may set `VITE_RHIZOH_PHASE1_SIGNAL=1` for controlled probe (ops-owned)

**C — Real signal:** heartbeat spec exists; ingestion closed; **no new design** — spec is sufficient.

---

## Concept → Code mapping

**Step 3 deferred** until post-READY or explicit thaw. Draft stays [`RHIZOH_CONCEPT_CODE_MAPPING_V1.0.md`](RHIZOH_CONCEPT_CODE_MAPPING_V1.0.md) — not execution SSOT during freeze.

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md`](RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md) | Short ops phase snapshot + hosting table |
| [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md) | Go/no-go |
| [`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`](RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md) | Spec only (C) |
| [`RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`](RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md) | Cold execution |

*Operating mode v1.0*
