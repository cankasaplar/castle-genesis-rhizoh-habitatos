# Interpretation UX Contract v1.0

**Status:** Enforced in Genesis observatory hub + gateway narrative export.

## Purpose

Prevent **perceptual authority illusion**: operators treating DERIVED narrative as approval or execution signal.

## Layer order (mandatory)

1. **RAW** — what happened (measurement)
2. **DERIVED** — what we understand (non-binding hypothesis)
3. **POLICY** — what the system may not do (governance boundary)

## Visual dominance rules

| Layer | Visual rank | UI rule |
|-------|-------------|---------|
| RAW | 100 | Expanded by default; primary metrics |
| POLICY | 70 | Disclaimer + prohibitions visible |
| DERIVED | 40 | Collapsed by default when `collapseDerivedByDefault` |
| Narrative text | 15 | `text-[8px]`, subordinate block inside DERIVED |

Prohibited: headline confidence hero, narrative above RAW fold, green approval chrome on stressed without RAW check.

## Code

| Surface | Module |
|---------|--------|
| Gateway contract | `apps/gateway/src/ops/interpretationUxContractV1.js` |
| Client mirror | `apps/client/src/rhizoh/ops/interpretationUxContractV1.js` |
| UI panel | `apps/client/src/rhizoh/ops/RhizohInterpretationOpsPanel.jsx` |
| Hub wiring | `GenesisObservabilityHubPage.jsx` → section `hub-interpretation-ops` |

## API

`GET /rhizoh/ops/hardening/status` → `unifiedState.stateLayers`, `unifiedState.interpretationUxContract`, `unifiedState.governance.interpretationUxContract`.

## Assert (CI / gate)

`assertInterpretationUxContractV1(narrative)` — called from misread release gate and narrative enrich path.
