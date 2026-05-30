# Rhizoh O1 Violation Execution Spec v1.0 (Runtime Harness)

**Status:** OPS EXECUTION SPEC (implements O1 contract — **not** formal theory)  
**Contract:** [`RHIZOH_PHASE1_O1_CONSTRAINT_SPEC_V1.0.md`](RHIZOH_PHASE1_O1_CONSTRAINT_SPEC_V1.0.md)  
**Topology:** [`RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md`](RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md)

**Output:** `docs/exports/ops/o1_violation_run_v1.0.json`  
**Runner:** `npm run ops:o1-violation-harness` (AUTO slice + MANUAL placeholders)

---

## 0. Modes (do not mix)

| Mode | `VITE_RHIZOH_PHASE1_SIGNAL` | Ingest built? | Purpose |
|------|----------------------------|---------------|---------|
| **T1_DRY** | `0` | No | Phase 0.5 — \(S \equiv s_0\), \(\pi_{\text{core}} \equiv \bot\) stress |
| **O1_PROBE** | `1` (staging only) | After I1–I6 land | Phase 1 — O1-1..O1-5 full matrix |
| **PROD** | `0` until READY signed | — | **Forbidden** O1_PROBE without ops log |

---

## 1. Violation taxonomy → detection logic

| Row | Constraint broken | Detection logic | Signal |
|-----|-------------------|-----------------|--------|
| **O1-1** | P1-S / T1 | `hash(S_t) !== hash(s_0)` on L1 slice export | `core_state_hash_mismatch` |
| **O1-2** | P1-MI / S4 / NI2 | Same ingress route + cohort decision under **only** packet rate change | `routing_side_channel` |
| **O1-3** | I3 / O1 | Heartbeat buffer referenced in `runEpistemicTickV0` call graph (static rg) or tick input fingerprint | `tick_ingest_coupling` |
| **O1-4** | γ lossy | Reconstruct full L1 from \(O\) without `exportEpistemic*` authorized path | `o_reconstructs_s` |
| **O1-5** | TI1′ | `τ_adv !== τ_canonical` after aligned baseline window | `tau_skew` |
| **A9** | Foundation | Any `appendEpistemicTickToLedgerV0` / WAL write traceable to heartbeat handler | `a9_direct_l1_write` |
| **NI2-O** | ¬(O→S) | Write to admission/L1 keys after witness append only | `o_to_s_write` |

**Pass rule:** all executed rows `pass: true`. **SKIP** allowed only with `reason` (e.g. ingest not built).

---

## 2. Stress injection mapping

| Harness phase | Injector | Target | Maps to rows |
|---------------|----------|--------|--------------|
| **S0 baseline** | None | — | Snapshot `hash(s_0)`, `τ_0`, `\|O_0\|` |
| **S1 flood** | Fake traffic generator → gateway queue (when route exists) | \(10^5\) `device_heartbeat_v1`/min, malformed mix | O1-1, O1-5, A9 |
| **S2 replay** | Repeat identical \(p\) | Gateway | O1-1 (idempotent \(\bot\)) |
| **S3 rate ladder** | Step \(\lambda\) 1/s → 10³/s | Gateway | O1-2 |
| **S4 static** | `rg` / import graph | Client bundle | O1-3, NI2-O, A9 |

**Phase 0.5 (T1_DRY):** S1 hits gateway buffers only; **core** probes O1-1, O1-5 via ledger/tick export APIs in test env.

**Adversary class:** \(\mathcal{A}_{\text{net}}\) from [`RHIZOH_STATE_ISOLATION_ADVERSARY_MODEL_V1.0.md`](RHIZOH_STATE_ISOLATION_ADVERSARY_MODEL_V1.0.md).

---

## 3. O-layer growth tracking

| Metric | Symbol | Capture |
|--------|--------|---------|
| Witness count | `\|O_t\|` | Observation channel record count |
| Byte size | `bytes(O_t)` | Sum serialized witness sizes |
| Distinct devices | `|deviceRef|` | Cardinality in window \(W\) |
| Core hash | `hash(S_t)` | L1 slice fingerprint (schema version in export) |
| Core tick | `τ(t)` | `getEpistemicTickLedgerV0` index or last tick id |

**Valid O1 signature (Phase 1):**

\[
\|O_t\| \uparrow \quad \land \quad hash(S_t) = hash(s_0) \quad \land \quad \tau(t) = \tau_{\text{canonical}}(t)
\]

**Invalid:** any row in §1 fires.

---

## 4. NI2 runtime compliance verification

| NI2 rule | Runtime check | AUTO? |
|----------|---------------|-------|
| DataPlaneInactive (0.5) | `isDataPlaneActiveV0() === false` | ✔ import gate |
| \(\pi_{\text{core}} \equiv \bot\) | No ingest OR ingest tests prove no ledger growth | Partial |
| ¬(O→S) | No session/L1 mutation after witness-only path | MANUAL / future e2e |
| \(I(O;\text{decision})=0\) | A/B route under rate-only stimulus | MANUAL |
| γ lossy | Export path audit — no full S in O | MANUAL |
| Single Phase1 env reader | `rg VITE_RHIZOH_PHASE1_SIGNAL` → only `phase1ActivationGateV0.js` | ✔ (R9) |

---

## 5. Execution procedure

### 5.1 T1_DRY (now — signal off)

1. `npm run activation:readiness-check` — must be `AUTO_PASS_MANUAL_PENDING`
2. `npm run ops:o1-violation-harness` — writes `o1_violation_run_v1.0.json`
3. `npm run test -w apps/client -- src/rhizoh/ingress/__tests__/phase1ActivationGateV0.test.js`
4. **MANUAL:** optional gateway flood when handler exists — fill S1 rows in JSON
5. **MANUAL:** ledger hash + tick snapshot before/after (O1-1, O1-5)

### 5.2 O1_PROBE (post-READY, staging)

1. Confirm READY in `activation_decision_*.json`
2. Staging build `VITE_RHIZOH_PHASE1_SIGNAL=1`
3. Run full §1 matrix; attach JSON to ops export
4. Any fail → **HOLD** — do not promote prod signal

---

## 6. Export JSON schema (v1.0)

```json
{
  "schema": "castle.rhizoh.ops.o1_violation_run.v1",
  "mode": "T1_DRY",
  "dataPlaneActive": false,
  "at": "ISO-8601",
  "baseline": {
    "coreStateHash": null,
    "tau": null,
    "observationCount": null
  },
  "final": {
    "coreStateHash": null,
    "tau": null,
    "observationCount": null
  },
  "violations": [
    {
      "id": "O1-1",
      "pass": true,
      "type": "AUTO",
      "detail": ""
    }
  ],
  "ni2": {
    "gateInactive": true,
    "singleSwitchSsot": true
  },
  "go": "PASS | FAIL | PARTIAL_MANUAL"
}
```

**Hash fields:** include `ledgerSchemaVersion` + `hashFn` when set — hash is **proxy**, not proof (see temporal lemma).

---

## 7. CI integration (target)

| When | Command |
|------|---------|
| Pre-READY PR | `ops:o1-violation-harness` + ingress tests |
| Phase 1 ingest PR | Add `o1IsolationConstraintV0.test.js` (I4-style) |
| Nightly staging | O1_PROBE after deploy |

**Future test file:** `apps/client/src/rhizoh/runtime/__tests__/o1IsolationConstraintV0.test.js` — implements O1-1 static slice when ingest lands.

---

## 8. Related

| Doc | Role |
|-----|------|
| [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md) | Gate before O1_PROBE |
| [`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`](RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md) | I1–I6 |

*O1 violation execution spec v1.0 — 2026-05-19*
