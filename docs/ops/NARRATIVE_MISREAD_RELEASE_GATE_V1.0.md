# Narrative misread release gate v1.0

CI/release gate: unified state narrative + misread simulation must have **zero** high-residual misread paths.

## Command

```bash
npm run ci:misread-gate
# or workspace:
npm run ops:misread-gate -w apps/gateway
```

## Pass criteria

- `assertInterpretationUxContractV1(narrative)` OK
- `highResidualCount <= CASTLE_MISREAD_GATE_MAX_HIGH_RESIDUAL` (default `0`)

## CI

`.github/workflows/ci-enforcement.yml` → step **Narrative misread release gate**.

## Override (emergency only)

```bash
CASTLE_MISREAD_GATE_MAX_HIGH_RESIDUAL=1 npm run ci:misread-gate
```

Document override in incident ticket.
