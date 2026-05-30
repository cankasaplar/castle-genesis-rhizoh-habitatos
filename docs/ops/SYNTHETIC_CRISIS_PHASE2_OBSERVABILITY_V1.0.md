# Synthetic Crisis — Phase 2: Observability Integrity v1.0

**Soru:** Phase 1 — agent kırılıyor mu? · Phase 2 — **kırıldığında anlayabiliyor muyuz?**

Phase 2 olmadan Phase 3’e çıkılır ama yalnızca **controlled exposure** bandında; global scale **forensic blindness** riski.

---

## Three layers (architecture)

| Katman | Durum |
|--------|--------|
| **1. Control** | Phase 1 — recursion, token, gate, emergency |
| **2. Forensics** | Phase 2 — Flight Recorder, replay, provenance |
| **3. Behavioral drift** | v1.1+ — gradual model/path drift (not v0) |

Bkz. [`SYNTHETIC_CRISIS_BEHAVIORAL_DRIFT_NOTE_V1.0.md`](SYNTHETIC_CRISIS_BEHAVIORAL_DRIFT_NOTE_V1.0.md)

---

## Hard requirements

| ID | Test | Pass |
|----|------|------|
| **A** | `verifyReplayDeterminismV0` — aynı trace → aynı narrative digest | digest stable |
| **B1** | Snapshot chain — `snapshotSeq` gaps yok | `chainIntegrity.ok` |
| **B2** | Cross-session — fpA ≠ fpB, uid leak yok | cluster isolation |
| **C** | Injection provenance — source, channel, promptSha256 | full chain |

---

## Run

```bash
npm run ops:synthetic-crisis-phase2
```

Export: `docs/exports/ops/synthetic_crisis_phase2_YYYY-MM-DD.json`

---

## Live path

`/rhizoh/llm` kayıtları:

- `turn_begin` → provenance (channel, prompt hash)  
- `prompt_abuse_flagged` → `injectionFlag: true`  
- Admin: `GET /rhizoh/ops/agent-snapshots`

---

## Phase 3 gate

`phase3Gate: may_proceed_controlled` yalnızca Phase 2 harness **tam yeşil** ise.

---

*Phase 2 v1.0 — forensic readiness before economic shock.*
