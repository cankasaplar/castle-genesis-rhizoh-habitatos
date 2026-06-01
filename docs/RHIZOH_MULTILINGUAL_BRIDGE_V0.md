# Rhizoh — Multilingual Bridge v0 (SSOT)

**Status:** ACTIVE — client + gateway context  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md) · [`RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md`](RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md)

---

## Principle

Rhizoh does **not** teach language — it **matches** the user and may use **cross-language bridges** (e.g. English ↔ Spanish cognates) to sharpen curiosity, never as homework.

| Avoid | Prefer |
|-------|--------|
| Forced Turkish-only replies | **Detected locale** + session preference |
| Translation drills | Meaning bridges · proper names unchanged |
| Performative multilingualism | Honest, fast, surprising growth |

---

## Catalog

**48+ locales** in `RHIZOH_LANGUAGE_CATALOG_V0` — see [`rhizohMultilingualBridgeV0.js`](../apps/client/src/rhizoh/runtime/rhizohMultilingualBridgeV0.js).

Detection stack:

1. MF-0 (`detectInputLanguageV0`) — tr · en · es · ja  
2. Social detector (`detectLanguageContextV0`)  
3. Extended pattern heuristics (de, fr, ar, ru, hi, …)  
4. Session preference · navigator fallback  

---

## Gateway payload

Per LLM turn (`rhizohQueryLlmV1`):

| Field | Role |
|-------|------|
| `context.rhizohMultilingual` | `{ detected_locale, respond_locale, respond_bcp47, catalog_codes }` |
| `context.rhizohMultilingualDirective` | Full bridge directive (en↔es hints, match-user-language) |
| `context.rhizohMemoryContract` | Language-aware memory contract (replaces Turkish-only default) |
| `options.language` | BCP-47 (e.g. `en-US`, `es-ES`, `tr-TR`) |

---

## Continuity pulse (T0 stream)

| Event | Function |
|-------|----------|
| Every LLM turn | `pushRhizohTurnContinuityPulseV0` |
| PAL / map pin seed | `pushRhizohSeedInterpretationPulseV0` |

Pulse copy localized when templates exist (tr · en · es · de · fr); else English.

---

## Cross-language bridges (examples)

| Pair | Hint |
|------|------|
| en ↔ es | continuity / continuidad · seed / semilla |
| en ↔ tr | Clear English when user writes English; Turkish names preserved on switch |

Romance family: optional cognates when user writes English — **not** as a lesson.

---

## Related

| Module | Role |
|--------|------|
| [`rhizohMeaningFrameV0.js`](../apps/client/src/rhizoh/runtime/rhizohMeaningFrameV0.js) | MF-0 language core |
| [`rhizohGlobalMeaningProjectorV0.js`](../apps/client/src/rhizoh/runtime/rhizohGlobalMeaningProjectorV0.js) | Rhythm projection per locale |
| [`t0ContinuitySurfaceStreamV0.js`](../apps/client/src/rhizoh/runtime/t0ContinuitySurfaceStreamV0.js) | Living pulse log |

---

*Multilingual bridge v0 — match user language; grow through curiosity.*
