# Cognitive load layer — V0

**SPECFLOW:** `RESEARCH-ONLY` — **disclosure and attention budget** for human-facing surfaces. This is not a second truth layer; it governs **how much** and **when** observation is shown, not **what is true**.

## Why it is “optional but inevitable”

Without an explicit contract, debug panels, health rows, map chrome, and epistemic overlays **stack** until the product reads as a **telemetry dashboard** instead of a Castle. Naming the concern early avoids ad-hoc “one more row” drift.

## Three questions this layer answers

| Question | V0 posture (product rule) |
|----------|---------------------------|
| **How much should the user see?** | Default = **minimal ambient affordance** (presence, continuity, calm motion). Technical detail only under **gated debug** (see below). |
| **Which layer is visible when?** | **Runtime / world** → always-on *felt* channel (subtle). **Diagnostics** → only when debug gates allow. **Identity / authority** → never as raw strings in ambient UI ([`docs/MEMBRANE_INTEGRITY_PASS_V0.md`](MEMBRANE_INTEGRITY_PASS_V0.md)). |
| **Perception budget management** | Treat attention as a **finite budget**: one primary focal layer + optional secondary; avoid simultaneous competing dense readouts. |

## Code hooks today (budget enforcement)

| Mechanism | Role |
|-----------|------|
| `castleDebugGateV0.js` | Umbrella `VITE_DEBUG` + granular `VITE_RHIZOH_*_DEBUG` — prod requires both; dev can use granular alone. |
| `RhizohAtmosphereRenderer.jsx` | Atmosphere debug UI only when gate passes **and** component is mounted (**DEV only** in bridge — [`docs/SURFACE_REDUCTION_PASS_LIVE_V0.md`](SURFACE_REDUCTION_PASS_LIVE_V0.md)). |
| `RhizohPerceptionDebugOverlay.jsx` | Perception metrics only when `VITE_RHIZOH_PERCEPTION_DEBUG` passes gate. |
| `RhizohAtmosphereRuntime.jsx` | Publishes **observation envelope** for debug UI — envelope is **not** SSOT truth ([`docs/OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)). |

**Rule:** New human-visible readouts should default **off** or behind a **named** granular flag + umbrella, not new always-on prose.

## Relation to adjacent layers

| Adjacent layer | Relationship |
|----------------|--------------|
| [`docs/PERCEPTUAL_STABILITY_LAYER_V0.md`](PERCEPTUAL_STABILITY_LAYER_V0.md) | **Smoothness** of what is already allowed to be seen. |
| [`docs/TEMPORAL_LAYER_BOUNDARY_V0.md`](TEMPORAL_LAYER_BOUNDARY_V0.md) | **When** ticks and renders align — not how much text the user reads. |
| [`docs/MEMBRANE_INTEGRITY_PASS_V0.md`](MEMBRANE_INTEGRITY_PASS_V0.md) | **What** must never appear in UI as identity authority. |

## Anti-patterns (cognitive debt)

- Always-on lane / frame / schema strings in primary HUD.  
- Duplicating the same metric in **multiple** corners (double cognitive tax).  
- Using “more numbers” as a substitute for **stable behavior** (user learns the system by *feel*, not by log tail).

## Future (explicitly not required for v0)

Optional later artifacts: a single **budget manifest** (e.g. max concurrent overlays, priority order) or studio-only “operator density” profile — only if product needs split **resident** vs **guest** density.

## Live surface reduction (prod)

Ship checklist: [`docs/SURFACE_REDUCTION_PASS_LIVE_V0.md`](SURFACE_REDUCTION_PASS_LIVE_V0.md) — debug overlays and demo shortcuts **DEV-only**; engine paths unchanged.

## Changelog

| Version | Date | Summary |
|---------|------|---------|
| v0.1 | 2026-05-12 | Link surface reduction pass (prod checklist) |
| v0 | 2026-05-12 | Initial layer: disclosure, visibility schedule, perception budget; ties to debug gate + observation envelope |
