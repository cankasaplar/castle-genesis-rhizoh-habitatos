# Interpretation Safety Contract v1.0

**Status:** IMPLEMENTED · **Code:** `interpretationSafetyContractV0.js`  
**Purpose:** Anti-action boundary — narrative must not become de facto decision layer.

---

## Three state layers (read order)

| Layer | Question | Authority | Binds? |
|-------|----------|-----------|--------|
| **RAW** | Ne oldu? | GCL, Rollout, Lifecycle, LoadTest measurements | — |
| **DERIVED** | Ne anlıyoruz? | Narrative, confidence, validation | No |
| **POLICY** | Sistem ne yapamaz? | Governance boundaries | **No** |

```
RAW → DERIVED → POLICY (limits only, not decisions)
```

---

## Safety contract (mühür)

```json
{
  "can_inform": true,
  "can_suggest": true,
  "can_execute": false,
  "can_self_modify": false,
  "authority_level": "non_binding",
  "decision_owner": "human_or_external_ops",
  "narrative_role": "derived_interpretation_only",
  "not_a_decision_layer": true
}
```

---

## Prohibited system actions

- `execute_suggested_action_automatically`
- `apply_narrative_to_rollout_tier` / `apply_narrative_to_gcl_limits`
- `self_modify_gateway_config_from_narrative`
- `self_modify_env_from_confidence`
- Low confidence **does not** trigger self-healing automation

---

## Perceived governance risk (addressed)

| Risk | Mitigation |
|------|------------|
| Narrative feels like “go/no-go” | `governance.narrativeIsNotDecisionLayer`, `trustPosture` |
| Headline confidence overtrust | `confidenceTrustworthy`, `validation.divergence` |
| Suggested action → auto run | `executable: false` + `prohibitedActions` |

---

## API surfaces

- `npm run ops:state-narrative` → full `stateLayers` + `interpretationSafetyContract`
- `GET /rhizoh/ops/hardening/status` → `unifiedState.governance` + layered summary

---

*Interpretation safety contract v1.0 — inform and suggest; never execute.*
