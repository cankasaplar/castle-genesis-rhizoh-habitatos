# A5 — Ingress inert smoke

**Date:** __________  
**Tester:** __________  
**URL:** https://www.rhizoh.com  
**Build / deploy:** __________

## Checklist

- [ ] Legal preamble visible (3 separate checkboxes)
- [ ] Cannot enter app without accepting
- [ ] After accept → Castle shell loads
- [ ] Hard refresh → same deterministic route
- [ ] DevTools Network: no `heartbeat` / `phase1` / `device_heartbeat` calls

## Screenshots (attach in this folder)

- `A5_legal_preamble.png`
- `A5_after_accept.png`
- `A5_network_tab.png`

## Notes

_Write any anomalies here._

## Verdict

- [ ] PASS → set `A5_ingress_inert: true` in activation_decision JSON
- [ ] FAIL → HOLD, note blockers above
