# Interpretation Layer Boundary v1.0

**Status:** FROZEN · **Counsel + product + engineering**  
**Engineering SSOT wins on conflict:** [`RHIZOH_ENGINEERING_SSOT_V1.0.md`](RHIZOH_ENGINEERING_SSOT_V1.0.md)

---

## The single open architectural decision (product risk)

> When does the system stay **observation-only**, and when does it **approach meaning production**?

This boundary determines **perceived authority** — not gate correctness.

---

## Three zones

| Zone | What it is | User may feel | Must NOT imply |
|------|------------|---------------|----------------|
| **A — Observation** | States, metrics, maps, queues (`feedsExecution: false`) | “Transparent instrumentation” | “Do X” |
| **B — Meaning-adjacent (internal only)** | Attractor labels, trajectory class, proposal rationale | “Interesting pattern” (ops) | Deploy / auto-fix |
| **C — Authority (forbidden in shadow)** | Imperative advice, confidence-as-command, “system recommends” | “Rhizoh told me to…” | Any auto config change |

**Product UX may use zone A vocabulary only** without legal review of B/C copy.

---

## Allowed observation vocabulary (zone A)

- `mode`, `band`, `region`, `gate pass/hold`
- `distanceToOptimal`, `dwellFraction`, `probability` (labeled as observed)
- `pending_human`, `draft`, `observation_gate`

Prefix pattern: **“observed …” / “export shows …”** — not **“you should …”**

---

## Forbidden interpretive leakage (zone C in exports & default UX)

| Pattern | Why |
|---------|-----|
| `you should`, `must`, `recommend deploy` | Authority |
| `system advises`, `Rhizoh decided` | Agency attribution |
| `optimal` without “operational window” qualifier | Normative |
| `phase3dObservationGate` shown as “go live” | Gate confusion |

Engineering exports use **non-imperative** `rationale` fields (proposal queue).

---

## Emergent risk (acknowledged)

System is **technically passive**, **epistemically rich** → users may treat it as **“entity that understands”**.

This is **emergent**, not designed. Mitigation:

- [`AUTHORITY_PERCEPTION_FAILURE_MODES_V1.0.md`](AUTHORITY_PERCEPTION_FAILURE_MODES_V1.0.md) — M0–M7 UX/Legal matrix
- `npm run ops:phase3-exposure-behavior-boundaries`
- Counsel review on **decision-influence feeling**, not model card alone

---

## Relation to layers

| Layer | Zone |
|-------|------|
| Phase 3 control | Execution (not interpretation) |
| Phase 3D + proposal queue | A + B (internal), never C in machine export |
| Interpretation Layer doc | C allowed **only** in non-SSOT essays |

---

*Interpretation boundary v1.0 — product risk lives here.*
