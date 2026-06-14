# A5 — Ingress inert smoke (founder manual test)

**Date:** 2026-06-14  
**Tester:** Can Kasaplar (founder)  
**URL:** https://rhizoh.com / https://www.rhizoh.com  
**Browser:** Chrome Incognito (Gizli mod)  
**Evidence:** Founder screenshots (session 06:39–06:41 local)

---

## Checklist

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Legal preamble visible (separate checkboxes) | **PASS** | "Access and consent" — Terms, KVKK/Privacy, AI cross-border (3 boxes) |
| 2 | Cannot enter app without accepting | **PASS** | "Enter Rhizoh" disabled until boxes checked (screenshot before accept) |
| 3 | After accept → app shell loads | **PASS** | World tab + Fox companion + chat bar visible |
| 4 | Hard refresh → deterministic route | **PASS** (assumed) | Same incognito session reached app; re-test on next cold visit recommended |
| 5 | Network: no heartbeat / phase1 ingest | **PASS** | DevTools Network: only `ingress` + `runtime` fetch to `gatewayProxy/rhizoh/genesis/*` — no `heartbeat`, `device_heartbeat`, or `phase1` |

---

## Network summary (screenshot 4)

- Requests: 8 fetch calls
- Endpoints observed:
  - `https://www.rhizoh.com/api/gatewayProxy/rhizoh/genesis/ingress`
  - `https://www.rhizoh.com/api/gatewayProxy/rhizoh/genesis/runtime`
- Status: 200 / 202 only
- **No Phase 1 signal ingest path observed**

---

## Cookie / analytics

- Banner: "Necessary cookies always run. Analytics cookies are optional."
- **Necessary only** button visible — aligns with checklist (analytics default gated).

---

## Language gate (bonus)

- RHIZOH ENTRY language picker shown before legal gate.
- English selected; multi-locale grid present.

---

## Out of scope (not A5 failure)

- World map not visible on World tab (Fox/studio viewport) — product routing issue, separate from ingress inert test.
- ANCHOR copy: "Your personal anchor appears after you choose a place."

---

## Verdict

- [x] **PASS** → `A5_ingress_inert: true`

Signed: founder manual smoke 2026-06-14
