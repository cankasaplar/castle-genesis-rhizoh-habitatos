# Stabilization — Frozen Epistemic Core

**Official name:** Bounded Epistemic Adaptive Control System (Frozen Core v1)

**Post-freeze architecture (three layers):** [`docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md`](docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md)

This document is the repo-level record of the **behavioral freeze** for the epistemic control stack. It does not replace tests or the reality contract lock; it states **intent and boundaries** so changes stay deliberate.

---

## 1. Freeze definition

**Freeze does not mean “no more development.”**  
It means: **the behavioral topology of the frozen core does not change.**

- The closed chain **v562 → v570** (identity/collapse through error semantics) is **structurally complete** in the locked module graph.
- **Observation, trust calibration, temporal coupling, adaptation, trust learning, and error semantics** remain **separated roles**: observe ≠ decide ≠ apply as architectural layers, not as accidental coupling.
- **Circular dependency** in the module graph is **forbidden** inside this story (no “lower layer imports upper semantics” shortcuts).

Code may grow elsewhere; **semantics and control flow of v562–v570** must not drift without an explicit version bump and review outside this freeze.

---

## 2. Allowed changes (within v562–v570)

**In the frozen core boundary (v562–v570 phase modules in the locked graph), only maintenance-level work is allowed:**

- Bug fixes that preserve observable behavior (or document a security-critical exception).
- Test fixes, coverage for existing behavior, determinism guards.
- Typo / comment clarifications that do not change control logic.
- Dependency or tooling updates that do **not** alter the epistemic pipeline’s decisions.

**Not allowed inside the frozen core without a new version line (e.g. v571+):**

- New features, refactors that change coupling order, renames that break the forward contract, or “small” behavior tweaks that reshape trust, delay, or semantics.

**New capability rule:** Add behavior only as **v571+** modules or under an explicit **`experimental/`** (or equivalent) path that is **not** part of the frozen default import path.

---

## 3. Import direction rule

**Forward-only dependency along the epistemic stack.** Examples that match the intended design:

- v570 may depend on v569 (e.g. pipeline composition from a higher layer).
- v569 depends on v568, v567, and lower layers as today.
- **No reverse imports:** lower layers must not import v570 (or other “upper” semantics) to avoid cycles and hidden feedback.

When adding files, **verify the graph** (no cycle that turns the stack into implicit circular feedback).

**Reality contract:** Gateway refs for these layers live in `apps/gateway/src/realityContractLockV1.js`. If the lock object changes, maintainers must refresh `CASTLE_REALITY_CONTRACT_LOCK_SHA256` where that check is enforced.

---

## 4. Production safe mode (placeholder)

**Current posture:** Production-grade operations are **not** claimed for the full stochastic surface. The repo aims for a **production-safe architecture boundary**:

| Safer (target) | Higher risk (gate explicitly) |
|----------------|-------------------------------|
| Deterministic pipeline, unit/integration tests | Live Firebase **writes** driven by this stack |
| Contract lock + green CI | Uncontrolled external stochastic input |
| Single-direction imports | Arbitrary feedback injection into the closed loop |

**Placeholder policy (to be implemented and wired to config):**

- **Runtime:** “Safe mode” — frozen core runs **read-only inference** paths only; no persistence of learned state to production stores without an explicit, reviewed path.
- **Gateway:** Inactive or strictly bounded when safe mode is on.
- **Kill-switch:** Single flag (or env) to disable epistemic side effects.
- **Rollback:** Versioned “epochs” or config snapshots so operators can revert behavior without redeploying ad-hoc logic.

Until this section is implemented and documented in deployment runbooks, treat **live writes and uncontrolled feedback** as out of scope for the frozen core.

---

## Closure statement (one line)

**The system is structurally complete and behaviorally frozen. Only maintenance-level changes are allowed within the v562–v570 core boundary; new behavior ships as v571+ or experimental, not as silent edits to the frozen chain.**

See also: [`SPECFLOW_MARKERS.md`](SPECFLOW_MARKERS.md) (`CORE-ELIGIBLE` vs `RESEARCH-ONLY` vs `FUTURE-PROOF-ONLY`) for sprint/item tagging so research does not merge into the executable core by accident.
