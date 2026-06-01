# Rhizoh — Surface Layer Operating Model v0

**Status:** ACTIVE — product SSOT (freeze vs experience)  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) · [`RHIZOH_L1_LIFE_CONTINUITY_V0.md`](RHIZOH_L1_LIFE_CONTINUITY_V0.md) · [`RHIZOH_L2_ENTITY_CORE_V0.md`](RHIZOH_L2_ENTITY_CORE_V0.md) · [`RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md`](RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md)

**One-line:** *Freeze the core — open the expression surface.* The system must not hide its intelligence from the user; it must **route** intelligence through safe, interactive projections.

---

## 1. What “freeze” meant (and still means)

| Freeze **is** | Freeze **is not** |
|---------------|-------------------|
| No uncontrolled **core** expansion (v562–v570, WAL, admission law) | “Nothing visible may work” |
| No new **epistemic primitive** without thaw | “User must feel like an observer in a lab” |
| No **ingestion** that writes execution truth (E1 gate) | “Studio / Map / Chat must stay dummy” |
| **Consistency before sprawl** | “Zero output until perfect” |

**Honest Baseline:** frozen core = **launch ramp**, not prison — [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) §2.

---

## 2. The misread we must stop

| ❌ Wrong freeze reading | ✅ Correct freeze reading |
|-------------------------|---------------------------|
| Studio kapalı = güvenlik | Studio kapalı = **ops cohort flag**, not core law |
| Map pasif = spec-complete | Map pasif = **PAL threshold / wiring**, not “no geography” |
| Modlar output vermiyor | Modlar **surface** — core stays inert to their writes |
| Sistem “gözlemci” | Sistem **ifade alanı** — observation ≠ user silence |

**Symptom of misread:** *“Çok akıllı ama hiçbir şey yapmayan yapı.”*  
**Target feel:** *“Burada konuşuyorum, üretiyorum, yerim büyüyor — sistem beni ezmiyor.”*

---

## 3. Four layers (A / B / C / D)

```text
┌─────────────────────────────────────────────────────────┐
│  D — ACADEMIC OBSERVATORY (research export — optional)   │
│  trace · paper blocks · reproducibility                 │
│  See RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md            │
└───────────────────────────┬─────────────────────────────┘
                            │ read-only
┌───────────────────────────▼─────────────────────────────┐
│  C — SURFACE (interactive, user-facing)                 │
│  Studio · Map · Chat · Creation / Output                │
│  READ/WRITE: projection + L1 user content only          │
└───────────────────────────┬─────────────────────────────┘
                            │ commands & renders
┌───────────────────────────▼─────────────────────────────┐
│  B — ENGINE (runs; may be invisible)                    │
│  recall · resolver · projection bridge · PAL            │
└───────────────────────────┬─────────────────────────────┘
                            │ append/read facts
┌───────────────────────────▼─────────────────────────────┐
│  A — CORE (freeze)                                      │
│  L1 life store · L2 entity graph · phase gate · seals   │
│  NO: WAL writes from surface · admission from map pin     │
└─────────────────────────────────────────────────────────┘
```

| Layer | Role | User sees? |
|-------|------|------------|
| **A — Core** | Truth boundaries, graph memory, resolver targets | Usually **no** (by design) |
| **B — Engine** | Computes citations, entities, projections | **Sometimes** (recall panel, strips) |
| **C — Surface** | **Interactive** world: talk, create, see map | **Yes** — this is the product |
| **D — Academic Observatory** | Read-only export: traces, paper blocks, repro | **No** (ops / habitat only) — [`RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md`](RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md) |

**Product intent:** Users enter to **become creative**, not to request permission. The system is an **expression field**, not a locked lab.

**E2-X row:** With creative cohort deploy, Rhizoh behaves as a **world engine** (continuity + place + creation), not a feature checklist — [`RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md`](RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md).

---

## 4. Surface inventory — target posture

| Surface | Target mode | Writes to | Must not write |
|---------|-------------|-----------|----------------|
| **Conversation (Castle chat)** | **Live** | L1 turns, L2 links via resolver | WAL, `phase*.js`, admission |
| **Map** | **Live** when PAL allows | Nothing — **renders** `map_pin` projection | L1/L2 directly from Cesium |
| **Studio** | **Open** (creation) | User artifacts → L1 notes / future media refs | Execution core, global graph |
| **Recall panel** | **Live** | Nothing — shows citations | Invented memory |
| **Creation / output** | **Live** | Export, share, studio projects | Trust scores, auto-profile |

**Rule:** Surface is **interactive**; it is not **authoritative** for execution truth.

---

## 5. Controlled output surface (freeze-compatible unlock)

Old fear: *“Her şey açılırsa sistem dağılır.”*  
Correct response: **not shutdown** — **controlled output surface**.

| Control | Mechanism |
|---------|-----------|
| Core isolation | L1 `life_store_class` · L2 edges · S1–S4 causal isolation |
| Earned map | [`RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md`](RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md) — no day-one Istanbul flyTo as “home” |
| Recall honesty | Citations only — no fake “hatırlıyorum” |
| Cohort flags | [`DEPLOY_MATRIX_V1.0.md`](../apps/client/docs/DEPLOY_MATRIX_V1.0.md) — **product** toggles, not freeze theology |
| Observation ≠ execution | Map pin never opens cohort gate |

**Unlock surface ≠ thaw core.**

---

## 6. Current repo vs target (honest)

| Item | Cohort MODE 2 today ([`PHASE2_CONTROLLED_REALITY_TEST`](ops/PHASE2_CONTROLLED_REALITY_TEST_V1.0.md)) | Target (this doc) |
|------|----------------------------------|-------------------|
| Castle + chat | ON | ON |
| Continuity | ON | ON + L1/L2 wired with env flags |
| Studio | **OFF** (ops) | **ON** as creation surface (separate deploy row or flag) |
| Map / world layer | **OFF** (Genesis-first) | **Live** via projection bundle + PAL — not bootstrap cinematic |
| L1 append / resolver / PAL | Code exists; env opt-in | ON for cohort creative path |

**Important:** Studio OFF in cohort doc is **controlled reality test scope**, not proof that freeze requires Studio closed forever.

---

## 7. Product decision (founder — binding direction)

1. **Preserve freeze** on A (core) and B invariants (no execution bleed).  
2. **Open C (surface)** as interactive: Studio + Map + Chat + creation output.  
3. **Stop hiding intelligence** — show engine results as citations, strips, pins, studio tools.  
4. **User never fights the system** — no “unlock mode”, no permission ritual.  
5. **Growth without crush** — PAL + calm tech; user expands, system does not profile-punish.

---

## 8. Technical enablers (already in repo)

| Capability | Module / flag |
|------------|----------------|
| Life memory | `lifeContinuityStoreV0` · `CASTLE_LIFE_CONTINUITY_APPEND=1` |
| World graph | `lifeEntityGraphV0` · `CASTLE_LIFE_ENTITY_RESOLVER=1` |
| Earned map | `projectionActivationLayerV0` · `CASTLE_PROJECTION_ACTIVATION=1` |
| Recall | `lifeRecallEngineV0` · `CASTLE_LIFE_CONTINUITY_RECALL=1` |

**Next implementation focus (surface, not core):**

- Client reads `lifeEntityProjection` → map + strip + studio context  
- Deploy row **[`E2-X`](../apps/client/docs/DEPLOY_MATRIX_V1.0.md)** — [`.env.creative.example`](../apps/client/.env.creative.example)  
- Remove “observer-only” UX copy on ingress where it implies lab not home  

---

## 9. Anti-patterns (regression checklist)

- [ ] Map flyTo on load without entity `located_at` (demo leak)  
- [ ] Studio write path touching WAL or frozen `phase*.js`  
- [ ] LLM reply presented without recall citations when user asks “hatırlıyor musun?”  
- [ ] Surface feature flagged off “because freeze” without ops doc citation  
- [ ] New trust score driving visibility (belongs in L2-trust, not PAL v0)  

---

## 10. One sentence for the team

> **Freeze protects the engine room; the product lives on the stage.**  
> Core stays frozen; the surface must be live, creative, and honest — not read-only, not empty, not ashamed of its own memory.

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md) | Ops activation (signal off) — **orthogonal** to surface live |
| [`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md) | Perception leak prevention |
| [`LAYER_EXPANSION_PROTOCOL.md`](LAYER_EXPANSION_PROTOCOL.md) | How to grow without core edits |

---

*Surface Layer Operating Model v0 — expression field, not observation cage.*
