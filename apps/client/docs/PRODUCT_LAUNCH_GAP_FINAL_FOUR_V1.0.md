# Product Launch — Final Four Gaps v1.0

**Tag:** `CORE-ELIGIBLE` (truth + ops SSOT) · **Not executable law**  
**Purpose:** Name the last four systemic risks before “feels like product” is mistaken for “safe at scale.”

Related: [`ACADEMY_REAL_SIGNAL_OUTPUT_CONNECTION_V1.0.md`](./ACADEMY_REAL_SIGNAL_OUTPUT_CONNECTION_V1.0.md) · [`RHIZOH_CASTLE_REALITY_OS_ARCHITECTURE_MAP.md`](./RHIZOH_CASTLE_REALITY_OS_ARCHITECTURE_MAP.md) · [`RCML_FREEZE_CONTRACT_V1.0.md`](./RCML_FREEZE_CONTRACT_V1.0.md) · [`DEPLOY_MATRIX_V1.0.md`](./DEPLOY_MATRIX_V1.0.md) · [`EDGE_CASE_SURVIVAL_KIT_V1.0.md`](./EDGE_CASE_SURVIVAL_KIT_V1.0.md) · [`GO_LIVE_CHECKLIST_ONE_PAGE_V1.0.md`](./GO_LIVE_CHECKLIST_ONE_PAGE_V1.0.md) · [**Post-launch priority order →**](OBSERVABILITY_FEEDBACK_SPIRAL_ROADMAP_V1.0.md)

---

## 1. Deploy configuration layer — final shape missing

### What exists (partial)

| Piece | Where |
|-------|--------|
| Env examples | `apps/client/.env.example`, `.env.production.example`, `.env.staging.example` |
| Authority profile | `VITE_CASTLE_AUTHORITY_PROFILE` (staging / production) — see architecture map §10, Guardian runbook |
| Hosting / CI | `deploy-hosting.yml`, `ci-enforcement.yml`, Render + Firebase patterns in repo docs |
| Spiral flags | `VITE_SPIRAL_MMO_PERCEPTION_BRIDGE`, `VITE_SPIRAL_MMO_AGREEMENT_LAYER` |

### What is **not** final (after client matrix v1.0)

| Gap | Risk |
|-----|------|
| **Gateway** row in the same audited matrix (Render env × `CASTLE_*` × client pairing) | Host-side drift vs client table |
| “One screen truth” for **combined** client + gateway in one dashboard | On-call still splits two planes |

### Shipped (v1.0 client SSOT)

[`DEPLOY_MATRIX_V1.0.md`](./DEPLOY_MATRIX_V1.0.md) — environments (E0–E3), critical `VITE_*` matrix, rollback order (R1–R5), demo vs prod rules. **v1.1** target: add explicit **Gateway** column set to the same file (or linked appendix) so one ops runbook owns both halves.

**Verdict:** Client deploy matrix is **closed at v1.0**; **full-stack** (client + gateway) single matrix remains the next increment.

---

## 2. Observability layer — product inside the product

### What exists (partial)

| Piece | Nature |
|-------|--------|
| Mutation / continuity | Felt state; not funnel metrics |
| Genesis hub / Academy observe | Ops / continuity **technical** observation |
| `realityHealth`, gateway metrics | Infra-oriented, not FTUE completion |

### What is **not** there

| Gap | Risk |
|-----|------|
| “User stuck where?” (step-level) | Cannot prioritize UX fixes |
| Flow drop (Observe → return → Castle) | No conversion-style **privacy-respecting** product analytics |
| FTUE completion rate | HEL exists; **no** aggregate completion signal |
| Consent + schema for client analytics | Must not ship silent third-party product tracking |

### Principle

Product analytics = **explicit contract** (what is collected, retention, DNT, region) — not ad-hoc `console.log` or opaque pixels.

**Verdict:** **Product analytics layer** is a deliberate gap; mutation proves *felt* loop locally, not *measured* loop at scale.

**Priority SSOT (what to build first):** [`OBSERVABILITY_FEEDBACK_SPIRAL_ROADMAP_V1.0.md`](./OBSERVABILITY_FEEDBACK_SPIRAL_ROADMAP_V1.0.md) — minimal REAL pipeline → FTUE / entropy signals → feedback loop → **then** Spiral expansion.

---

## 3. Real user safety — edge cases not closed

### What exists (partial)

| Piece | Nature |
|-------|--------|
| RCML / persistence | `sessionStorage` / `localStorage` with try/catch on quota |
| Auth optional paths | Canonical entry does not require Firebase for felt model |

### What is **not** specified / tested as a suite

| Gap | Risk |
|-----|------|
| **Offline** | Tab offline: RLL-O tick fails silently? user copy stale? |
| **Slow network** | Degrade mode (skeleton UI vs spinner vs timeout copy) |
| **No auth** | Persistence still written locally; conflict when auth appears later? |
| **Storage full / corrupt** | Recovery path: reset keys vs hard error vs “continue without memory” |

### Shipped (v1.0 runbook SSOT)

[`EDGE_CASE_SURVIVAL_KIT_V1.0.md`](./EDGE_CASE_SURVIVAL_KIT_V1.0.md) — corrupt storage keys, offline / long gap, `self_*` vs `wi_*` mismatch, support order.

### Still open

Short **Vitest fixtures** (fake `sessionStorage` throw, corrupt JSON) wired to HEL/RCML degrade copy — not a second product.

**Verdict:** **Operator / support contract** is drafted; **automated safety suite** for every edge class is still open.

---

## 4. SpiralMMO / Rhizoh boundary — contract finalization

### What exists

| Piece | Evidence |
|-------|----------|
| Perception bridge | `passivePerceptionFieldCoherenceV0.js` — `perception_only`, disclaimer |
| Agreement layer | `spiralMMOAgreementLayerV0.js` — `sharedState: false`, no WAL wording in module header |
| Doc | RCML map flags; this file |

### What was missing until v1.0 of this gap doc

| Gap | Risk |
|-----|------|
| Repo-level **enforcement** | Spiral game kernel could theoretically be imported into Rhizoh entry path by mistake |

### Enforcement (CI)

`npm run spiral:validate-rhizoh-boundary` — [`scripts/validateSpiralRhizohBoundaryV1.mjs`](../../../scripts/validateSpiralRhizohBoundaryV1.mjs)

- Rhizoh canonical **experience** path must not import gateway Spiral game kernel.
- Agreement / proto-mesh module must retain `sharedState: false` invariants (static scan).

**Verdict:** **Semantic boundary** was documented; **hard boundary** is now CI-backed for the Rhizoh entry experience slice.

---

## Summary table

| # | Layer | Status | Primary risk |
|---|--------|--------|----------------|
| 1 | Deploy config final | **Client matrix v1.0**; gateway row TBD | Full-stack matrix drift |
| 2 | Product observability | Missing | Flying blind on FTUE / flows |
| 3 | Safety edge cases | **Runbook v1.0**; Vitest suite TBD | Breakage on real networks / storage |
| 4 | Spiral ↔ Rhizoh | Doc + **CI scan** | Accidental merge of execution worlds |

---

## Change policy

Update when:

1. ~~A single **client deploy matrix** doc ships~~ → [`DEPLOY_MATRIX_V1.0.md`](./DEPLOY_MATRIX_V1.0.md); extend with **gateway** rows (v1.1).  
2. Product analytics contract (privacy + schema) is approved and instrumented.  
3. ~~Offline / corrupt storage **runbook**~~ → [`EDGE_CASE_SURVIVAL_KIT_V1.0.md`](./EDGE_CASE_SURVIVAL_KIT_V1.0.md); **Vitest** fixtures for slow/offline/corrupt still TBD.  
4. `validateSpiralRhizohBoundaryV1.mjs` rules expand (e.g. new import paths).

---

*v1.0 — last four gaps before scale narrative.*
