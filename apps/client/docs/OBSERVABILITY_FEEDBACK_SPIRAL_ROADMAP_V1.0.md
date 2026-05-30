# Observability → Feedback → Spiral — Roadmap v1.0

**Tag:** `CORE-ELIGIBLE` (prioritization + design SSOT) · **Not executable law**  
**Purpose:** Lock **order of work** after deploy matrix / go-live: (1) real observability, (2) product feedback loop, (3) SpiralMMO expansion — without collapsing *observation* into *execution*.

| Related | |
|---------|--|
| Gap inventory | [`PRODUCT_LAUNCH_GAP_FINAL_FOUR_V1.0.md`](./PRODUCT_LAUNCH_GAP_FINAL_FOUR_V1.0.md) §2–§4 |
| Truth boundary (Academy / signal) | [`ACADEMY_REAL_SIGNAL_OUTPUT_CONNECTION_V1.0.md`](./ACADEMY_REAL_SIGNAL_OUTPUT_CONNECTION_V1.0.md) |
| Observation fabric (non-authority) | [`docs/OBSERVATION_FABRIC_V1.md`](../../../docs/OBSERVATION_FABRIC_V1.md) |
| Deploy / flags | [`DEPLOY_MATRIX_V1.0.md`](./DEPLOY_MATRIX_V1.0.md) |
| Spiral CI guard | `npm run spiral:validate-rhizoh-boundary` |
| UI reaction binding (not decision logic) | [`OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md`](./OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md) |
| Reaction **intensity** scaling | [`OBSERVATION_UI_REACTION_WEIGHTING_LAYER_V0.md`](./OBSERVATION_UI_REACTION_WEIGHTING_LAYER_V0.md) |

---

## 0. Sequencing (why this order)

| Order | Track | Rationale |
|-------|--------|-----------|
| **1** | Observability → **REAL** aggregates | Without **consented**, **schema-bound** events you cannot know whether HEL/FTUE fixes work; Spiral expansion on guesses recreates leak risk. |
| **2** | Product feedback loop (*“ne yaptı?” → UI değiştir*) | Needs minimal signal to prioritize copy, disclosure, and safe RCML/HEL tweaks — still **interpretation / UX**, not WAL authority. |
| **3** | SpiralMMO expansion | **After** stable user signal: boundary stays CI-backed; flags remain off in prod until a **signed** layer decision + matrix update. |

---

## 1. (Critical) Observability bridge → REAL data

**Goal:** A **minimal** first-party event pipeline: small vocabulary, gateway or privacy-reviewed sink, retention caps — **no** silent third-party pixels (see gap doc §2 principle).

### 1.1 Minimal event pipeline (v0 sketch)

| Layer | Responsibility |
|-------|----------------|
| **Emit** | Client: immutable **event envelope** (name, `schemaVersion`, `ts`, `correlationId`, `route` or coarse step id, **no** raw prompts / no email). |
| **Transport** | Same origin as app gateway where possible; batch + backoff; fail closed on 4xx/5xx (drop batch, do not retry forever). |
| **Store** | Append-only observation store (ops retention); **not** mixed with sealer / WAL truth. |

**Gate before prod traffic:** explicit **consent + policy doc** (what, why, retention, region); align with legal ingress freeze docs — do not ship “analytics” without counsel-approved copy.

### 1.2 FTUE drop tracking

| Event family | Intent |
|--------------|--------|
| `ftue.step_enter` / `ftue.step_exit` | Step id from HEL beats (stable string ids, not copy text). |
| `ftue.drop` | Last visible step + coarse reason bucket (`navigation`, `error`, `background`, `unknown`). |

Use this only to answer *“where do humans stall?”* — not to score individuals for authority.

### 1.3 Entropy usage log (projection-only)

| Field (example) | Notes |
|-----------------|--------|
| `action` | `observe` \| `enter_castle` \| … (align with `perceptualEntropyEconomyV0` costs). |
| `cost_applied` | Numeric bucket or rounded float — avoid fingerprinting via high precision. |
| `budget_after_bucket` | Coarse bucket (e.g. deciles) — enough for product, weak for surveillance. |

**Rule:** Logs describe **felt economy projection**, not trust / seal / gateway auth outcomes.

---

## 2. (Very important) Product feedback loop

**Plain statement:** *What did they do?* (aggregates + optional qualitative) → *Change the UI* (HEL strings, visibility schedule, empty states, **feature flags** for copy experiments).

**Formal binding contract (v0):** [`OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md`](./OBSERVATION_UI_REACTION_BINDING_LAYER_V0.md) — FTUE drop → HEL; low entropy → pacing; return visit → continuity strip density. **Mapping only**; no authority or seal side effects.

**Intensity (v0):** [`OBSERVATION_UI_REACTION_WEIGHTING_LAYER_V0.md`](./OBSERVATION_UI_REACTION_WEIGHTING_LAYER_V0.md) — after binding, scale *how strong* (e.g. HEL 30% vs 80%); still **not** product/path decisions.

| Allowed | Forbidden |
|---------|-----------|
| HEL / ribbon copy, disclosure timing, skeleton vs spinner policy | Changing `VITE_CASTLE_AUTHORITY_PROFILE`, sealer behavior, or WAL merge rules “because funnel said so” |
| A/B on **presentation** with consent | Using analytics as **execution** input to substrate |

**Process:** weekly triage on top `ftue.drop` steps + entropy stall patterns → single owner → PR with RCML/HEL tests where applicable.

---

## 3. (Later) SpiralMMO expansion

**Preconditions (all):**

1. Track **1** live with **known** schema version and dashboard or query path for ops.  
2. Track **2** used for at least one **measured** HEL iteration (documented outcome).  
3. `spiral:validate-rhizoh-boundary` remains green; [`DEPLOY_MATRIX_V1.0.md`](./DEPLOY_MATRIX_V1.0.md) updated for any new `VITE_SPIRAL_*` prod posture.  
4. No expansion while Phase-1 / data-plane gates in [`GO_LIVE_CHECKLIST_ONE_PAGE_V1.0.md`](./GO_LIVE_CHECKLIST_ONE_PAGE_V1.0.md) are **HOLD** unless explicit ops exception doc exists.

**Why wait:** Real user signal reduces the chance that Spiral layers are tuned on **simulated** engagement only.

---

## 4. Change policy

Bump to **v1.1** when: first event schema is frozen in code + JSON schema file; or when Spiral expansion gate checklist is exercised once in staging.

---

*v1.0 — observability → feedback → Spiral priority SSOT.*
