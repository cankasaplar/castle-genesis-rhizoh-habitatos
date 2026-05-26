# Live runtime & experience phase — V0

**SPECFLOW:** `RESEARCH-ONLY` — sprint / habitat **focus** declaration. Does **not** relax [`STABILIZATION.md`](../STABILIZATION.md), the stabilization graph, or frozen `phase*.js` rules; those remain **machine-enforced**. This file states **where human+runtime effort should go next**, not a policy override.

---

## Freeze = floor, not construction site

When freeze **verification** is in place and green:

- **Freeze is referenced**, not continuously “grown” as the main product loop.
- Returning to freeze-first work **as the default loop** usually means misaligned priorities — legitimate returns go through **explicit** stabilization / v571+ (or experimental) paths per repo process.

**We are not “building freeze” anymore; we build on it.**

---

## What stops being the primary loop

| Deprioritize as default sprint fuel | Why |
|-------------------------------------|-----|
| Kernel narrative expansion | Spec is reference; ship behavior |
| Contract revision churn | PR-2 schemas are **frozen at v0** until a deliberate migration |
| Guard / audit spiral | Add guards only when a **concrete leak** appears; avoid policy creep |

---

## What becomes the primary loop (Experience Runtime Mode)

| Track | Intent |
|-------|--------|
| **Live runtime flow** | End-to-end ticks, orchestrator sinks, observation envelopes → stable behavior |
| **World presence streaming** | Weather / atmosphere path from feed → state → projection consumers |
| **Spatial embodiment (phase B)** | Anchors, Cesium / map binding, calibration vs identity separation already in code/docs — **wire experience** |
| **Castle perception rendering** | Projection layer applies authorized hints; UI stays membrane-clean |
| **Pet / voice / presence** | Real signals → felt Castle; explain less, behave more |

**Target experience:** the user **feels** the Castle; the system **does not narrate itself** as the main output — behavior and presence do.

---

## Transition criterion (human + CI)

- **Engineering mode (winding down):** stabilization validators green; freeze identity boundary respected; membrane + anchor truth **as shipped guards**, not endless new categories.
- **Experience Runtime Mode (starting):** same CI floor, but **feature work** prioritizes streaming, embodiment, and sensory loop over new meta-docs and new global guards.

---

## If we must touch freeze again

Only through **repo-intentional** channels: graph + lock + `STABILIZATION` text in one change set, or labeled experimental / v571+ paths — **not** ad-hoc “one more guard because we thought of it.”

---

## Related references

- [`docs/LIVE_RUNTIME_STREAMING_CORE_V0.md`](LIVE_RUNTIME_STREAMING_CORE_V0.md) — end-to-end world presence → Cesium / Castle presence wire map
- [`docs/PERCEPTUAL_STABILITY_LAYER_V0.md`](PERCEPTUAL_STABILITY_LAYER_V0.md) — jitter, smoothness, frame–perception, Cesium human-stable feel
- [`docs/COGNITIVE_LOAD_LAYER_V0.md`](COGNITIVE_LOAD_LAYER_V0.md) — disclosure, layer visibility schedule, perception budget
- [`docs/SURFACE_REDUCTION_PASS_LIVE_V0.md`](SURFACE_REDUCTION_PASS_LIVE_V0.md) — prod surface: debug off, `/demo` dev-only
- [`docs/RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md`](RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md) — Istanbul / world / Cesium direction  
- [`docs/MEMBRANE_INTEGRITY_PASS_V0.md`](MEMBRANE_INTEGRITY_PASS_V0.md) — UI vs identity boundary (maintain, don’t inflate)  
- [`docs/ANCHOR_TRUTH_TABLE_V0.md`](ANCHOR_TRUTH_TABLE_V0.md) — place ≠ identity  
- [`docs/SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md`](SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md) + [`docs/SOVEREIGN_NETWORK_CONTRACT_SCHEMAS_V0.md`](SOVEREIGN_NETWORK_CONTRACT_SCHEMAS_V0.md) — reference only for network/event shape  

---

## Changelog

| Version | Date | Summary |
|---------|------|---------|
| v0.2 | 2026-05-12 | Surface reduction doc link (prod vs dev surface) |
| v0.1 | 2026-05-12 | Related: perceptual stability + cognitive load layer docs |
| v0 | 2026-05-12 | Initial phase note: freeze as floor, experience runtime as primary focus |
