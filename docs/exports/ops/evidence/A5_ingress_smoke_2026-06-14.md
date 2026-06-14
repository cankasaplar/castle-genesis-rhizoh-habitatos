# A5 — Ingress inert smoke

**Date:** 2026-06-14  
**Tester:** Founder (browser, incognito)  
**URL:** https://rhizoh.com  
**Build / deploy:** production (post PR #63/#64)

## Checklist

- [x] Legal preamble visible (3 separate checkboxes)
- [x] Cannot enter app without accepting
- [x] After accept → cohort gate (Yes/No) → Castle shell loads
- [x] Hard refresh → deterministic ingress flow
- [x] DevTools Network: no `heartbeat` / `phase1` / `device_heartbeat` calls

## Screenshots (same folder)

- `A5_legal_preamble.png` — founder upload
- `A5_cohort_continue.png` — founder upload
- `A5_after_accept.png` — founder upload
- `A5_network_heartbeat_empty.png` — founder upload (filter: heartbeat / phase1)

## Notes

Network shows `ingress` (202), `runtime` (200), `deps` (200) — expected ingress shell probes, not Phase 1 data-plane heartbeat.  
`stream` 503 observed separately — not an A5 blocker.

## Verdict

- [x] PASS → `A5_ingress_inert: true` in activation_decision JSON
- [ ] FAIL → HOLD
