# Guardian Onboarding — First Anchor Runbook (v0.1)

**Tag:** `RESEARCH-ONLY` · operational · **frozen core untouched**  
**Audience:** Guardian circle (Eren, Ceyda, Karden, Nisa) — first Kadıköy / Barcelona satellite anchors  
**Owner plane:** Observation + shadow continuity only — **no** `bootValidityToken`, **no** execution write

**Related:** [`TEMPORAL_IDENTITY_CONTINUITY_V0.md`](TEMPORAL_IDENTITY_CONTINUITY_V0.md) §18 · [`docs/RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md`](../../../docs/RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md) · [`docs/MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](../../../docs/MANIFESTO_DISTRIBUTION_PACK_V0.1.md)

---

## 0. One-page intent

Deploy the **Sovereign Interface Layer** so Guardians can place a **satellite observer anchor** on the globe. The system writes a **shadow WAL tick 0** to IndexedDB (`sovereign_shadow_onboarding_v0`) and mirrors read-only state to `window`. Execution core stays frozen and silent.

---

## 1. Environment (.env.staging or local)

Copy and enable (production/staging builds require **both** umbrella + granular flags):

```bash
# apps/client/.env.staging — see .env.staging.example

VITE_CASTLE_AUTHORITY_PROFILE=staging

# Umbrella (required in prod for granular research flags)
VITE_DEBUG=1

# Optional: ontological gate / watchdog (continuity labs)
# VITE_ONTOLOGICAL_WATCHDOG=1

# §18 — Sovereign onboarding wizard + satellite registry
VITE_SOVEREIGN_NODE_ONBOARDING=1
VITE_SATELLITE_NODE_REGISTRY_V0=1

# §9.4 — Event bus mirror + observer telemetry (recommended for Denetim 2–3)
VITE_EPISTEMIC_SIM_RESEARCH=1

# §20–21 — Cross-node arcs + graph viz (optional, Kadıköy ↔ Barcelona)
# VITE_EPISTEMIC_GRAPH_VIZ_V0=1
```

**Note:** There is no `VITE_DEFAULT_ONBOARDING_PRESET` env var. Default Kadıköy is selected in the wizard UI (**Kadıköy** button) or via console:

```javascript
// After wizard is open (see §2)
const w = await window.__rhizoh.sovereignOnboarding.startWizard(null, null);
w.useDefaultKadikoyAnchor();
```

**Local dev:**

```bash
cd apps/client
cp .env.staging.example .env.staging
# edit flags above, then:
npm run dev
```

---

## 2. Operational flow

### Step A — Entry & observation gate

1. Guardian opens the Rhizoh client URL (staging or local).
2. If flags are correct, **Sovereign node onboarding** dialog appears (`SovereignNodeOnboardingWizard.jsx`).
3. Alternatively: `window.__rhizoh.sovereignOnboarding.open()` (if UI dismissed).
4. Initial state: **OBSERVATION_ONLY** — event bus **disabled** until confirm.

**Pass:** Globe visible; wizard shows step `world_entry`. No `bootValidityToken` on `window`.

### Step B — Geographic anchor & seal preview

1. Click **Kadıköy** or **Barcelona** preset, or pick coordinates on the map (when Cesium pick wire is active).
2. Click **Preview seal** → epistemic fingerprint derived (research import); panel shows:
   - `nodeId`: `node:kadikoy_satellite` or `node:barcelona_satellite` (label/coords heuristic)
   - `continuity`: `pending`
   - `epistemicRole`: `satellite-observer`
   - `bootValidityTokenCreated`: `false`

**Pass:** `getSovereignNodeSealPreviewV0()` / wizard step `seal_preview`.

### Step C — Confirm node (shadow seal)

1. Guardian clicks **Confirm node**.
2. System appends IDB WAL segment tick **0** under disk key `sovereign_shadow_onboarding_v0`.
3. Mirror: `window.__rhizoh_shadow_continuity`
4. Satellite registry updated (non-executive).
5. Event bus enabled **read-only**; sim research wire starts if `VITE_EPISTEMIC_SIM_RESEARCH=1`.
6. Optional: Reality Sync birth overlay (`__rhizoh_reality_sync_session`).

**Pass:** `bootValidityTokenCreated === false`; `window.__rhizoh_boot_validity_token` **undefined**.

---

## 3. Console verification protocol (F12)

Run after **Confirm node**. Any failure below is a **membrane violation** — stop and report; do not patch frozen core ad hoc.

### Denetim 1 — Shadow continuity

```javascript
window.__rhizoh_shadow_continuity
// or
window.__rhizoh.sovereignOnboarding.shadowContinuity()
```

**Expected (shape):**

```json
{
  "schema": "castle.rhizoh.shadow_continuity_buffer.v0",
  "nodeId": "node:kadikoy_satellite",
  "continuity": "pending",
  "epistemicRole": "satellite-observer",
  "state": "SOFT_INIT",
  "walTick": 0,
  "segmentHash": "<hex or null if IDB unavailable>",
  "bootValidityTokenCreated": false
}
```

**Violations:**

| Signal | Meaning |
|--------|---------|
| `bootValidityTokenCreated: true` | Shadow path leaked into execution |
| `window.__rhizoh_boot_validity_token` set | Same — abort |
| `mayRehydrate` true on boot context | Execution gate must not open from onboarding |

```javascript
window.__rhizoh_boot_validity_token
// → undefined (or absent) for Guardian-only onboarding session
```

### Denetim 2 — Event bus (observation mirror)

Requires `VITE_EPISTEMIC_SIM_RESEARCH=1` and confirm completed.

```javascript
window.__rhizoh.epistemicSimResearch.enabled()
window.__rhizoh.epistemicSimResearch.eventBus.status()
```

**Expected:**

```json
{
  "enabled": true,
  "traceLength": >= 1,
  "seqHead": >= 1
}
```

Inspect read-only envelopes:

```javascript
window.__rhizoh.epistemicSimResearch.eventBus.trace().slice(-3)
```

**Expected per envelope:** `readOnly: true`, `witnessWrite: false`, `feedbackLoop: false`, `executive: false` (if present), `eventClass`: `"observer"` or `"physics"`.

Move camera / interact; optional observer pulse:

```javascript
window.__rhizoh.epistemicSimResearch.recordObserverAction({
  kind: "cam_vector_shift",
  nodeId: window.__rhizoh_node_id,
  statement: "guardian_manual_probe"
})
```

### Denetim 3 — Compression signature

Generate then read (not automatic on confirm):

```javascript
window.__rhizoh.epistemicSimResearch.compressionSignature.run()
window.__rhizoh.epistemicSimResearch.compressionSignature.latest()
// or mirror:
window.__rhizoh_epistemic_compression_signature
```

**Expected:**

- `composedSignature`: `epi_sig_<8 hex chars>` (e.g. `epi_sig_a1b2c3d4`)
- `traceSemanticFingerprint`: `epi_trace_fp_<hex>`
- `topologySignature.topologySignature`: `epi_topo_<hex>`
- `executionWrite: false`, `witnessWrite: false`, `mode: "compression_read_only"`

**Not expected:** literal `epi_sig_kadikoy_pending_*` — node id is not embedded in signature string.

### Denetim 4 — Multi-node registry (optional)

```javascript
window.__rhizoh.satelliteRegistry.nodes()
window.__rhizoh_shadow_coherence_graph
```

**Expected:** Kadıköy and/or Barcelona preset nodes; graph `executive: false`.

### Denetim 5 — Entanglement guard (C closed)

```javascript
window.__rhizoh_cross_node_resonance?.entanglementGuard
```

**Expected:** `entanglementCouplingAllowed: false`.

---

## 4. Guardian checklist (printable)

| # | Check | OK |
|---|--------|-----|
| 1 | `.env` flags: `VITE_DEBUG` + `VITE_SOVEREIGN_NODE_ONBOARDING` | ☐ |
| 2 | Wizard visible; Kadıköy or Barcelona anchored | ☐ |
| 3 | Confirm → `__rhizoh_shadow_continuity.bootValidityTokenCreated === false` | ☐ |
| 4 | No `__rhizoh_boot_validity_token` | ☐ |
| 5 | Event bus trace read-only envelopes | ☐ |
| 6 | `epi_sig_*` generated on demand | ☐ |
| 7 | Screenshot / export: `eventBus.exportJson()` archived | ☐ |

---

## 5. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Wizard not shown | Set `VITE_DEBUG=1` and `VITE_SOVEREIGN_NODE_ONBOARDING=1`; rebuild client |
| `epistemicSimResearch.enabled()` false | Add `VITE_EPISTEMIC_SIM_RESEARCH=1` |
| `segmentHash: null` | IDB blocked (private mode); mirror still valid in-memory for session |
| Wrong `nodeId` | Use label `kadikoy` / `barcelona` in anchor or preset buttons |
| Map click ignored | Wizard running without Cesium instance — use preset buttons |

---

## 6. What Guardians must not do

- Do not expect `bootValidityToken` or world rehydrate from onboarding.
- Do not treat `epi_sig_*` as execution permission.
- Do not enable observer→resonance→navigation coupling (C path — architecturally blocked).

---

## 7. After first anchor

1. Archive console exports (`eventBus.exportJson()`, `compressionSignature.exportJson()`).
2. Optional: share manifesto pack [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](../../../docs/MANIFESTO_DISTRIBUTION_PACK_V0.1.md) with academic / partner circle.
3. Second Guardian repeats flow — observe cross-node resonance refresh (`window.__rhizoh.crossNodeResonance.refresh()`).

**Frozen core:** no code changes required for spread. Distribution is **flags + people + traces**, not mutation.

---

*EFIR-α: Execution frozen · Causal flowing · Observation projecting · C blocked.*
