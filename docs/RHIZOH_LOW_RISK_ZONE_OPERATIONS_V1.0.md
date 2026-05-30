# Rhizoh Low-Risk Zone Operations v1.0

**Mode:** Polish + stabilisation — **not** development / expansion  
**Frame:** *First production coherence pass* — “bozulmadan çalışabilir mi?”

---

## STEP 1 — UI ingress (simplification pass)

| Screen | Rule |
|--------|------|
| Legal preamble | ToS/KVKK özeti · veri sorumlusu · tek onay kutusu · **Kabul et** |
| Erişim onayı (if flag on) | **Evet / Hayır** — no-op hook; engine output ignored; not onboarding |
| Error | offline · timeout · gateway — net mesaj, sessiz fail yok |

**SSOT:** `ingress_router.js` copy functions · `LegalPreambleScreen.jsx` · `ClosedAdmissionCohortScreen.jsx` · `IngressErrorScreen.jsx`

---

## STEP 2 — Routing cleanup

| Rule | Implementation |
|------|----------------|
| Default → legal | `resolveIngressRouteV0` when required && !acked |
| Unknown phase → hard reset | `normalizeIngressPhaseV0` → `hardResetIngressToEntryPhaseV0` |
| Fallback carries state | **false** — transient cohort cleared; legal ack preserved |
| No redirect loop | phase state machine only advances forward |
| ENV = on/off only | `getIngressEnvFlagsV0()` snapshot |

---

## STEP 3 — Passive sanity check

```bash
npm run ops:passive-coherence-check
```

Observe only — **no fixes** in this step. Report: `docs/exports/ops/passive_coherence_check_v1.0.json`

Checks: ingress tests · audit bundle test · WAL append test (existing vitest).

---

## Freeze (do not touch)

- New V0 primitive · legal text expansion · admission logic change · epistemic layer · runtime behavior expansion

---

## Related

- [`LEGAL_FREEZE_SPEC_V1.0.md`](LEGAL_FREEZE_SPEC_V1.0.md)
- [`RHIZOH_INGRESS_UI_FREEZE_V1.0.md`](RHIZOH_INGRESS_UI_FREEZE_V1.0.md)
- [`RHIZOH_INGRESS_FLOW_V1.0.md`](RHIZOH_INGRESS_FLOW_V1.0.md)
