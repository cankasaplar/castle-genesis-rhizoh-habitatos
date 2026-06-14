# A6 — UI read-only decision gate

**Date:** __________  
**Tester:** __________

## Checklist

- [ ] Cohort / closed admission screen has **no** sliders
- [ ] **No** live scores or engine-driven UI on this path
- [ ] Only Accept / Decline (or equivalent no-op gate)

## Code reference (CI R5)

`ClosedAdmissionCohortScreen.jsx` uses `completeCohortGateNoOpV0` only — no `evaluateClosedAdmissionForSessionV0` on UI path.

## Screenshot

- `A6_cohort_screen.png`

## Verdict

- [ ] PASS → `A6_ui_readonly_gate: true`
- [ ] FAIL → HOLD
