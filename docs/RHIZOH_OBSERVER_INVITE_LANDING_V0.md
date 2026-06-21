# Rhizoh Observer Invite Landing v0

**SPECFLOW:** `RESEARCH-ONLY` · controlled observation surface for invitees and investors.

## Route

| URL | Purpose |
|-----|---------|
| `/invite?invite=rhizoh_inv_…` | Token-based observer landing |
| `/invite?cohort=review&reviewer=friday` | Legacy cohort reviewer URL |
| `/?cohort=review&reviewer=…` | Auto-redirect → `/invite` |

## Landing bundle (read-only)

1. **Invite context** — role (`observer` | `reviewer` | `investor`), opaque token
2. **epi_id viewer** — from `identityManifest.project()`
3. **Causal snapshot timeline** — `causalMap` nodes sorted by `atMs`

CTA **Enter observation area** → `/world/space` + legal gate if not yet acknowledged.

## Founder ops console

```javascript
window.__rhizoh.inviteOps.generate({ role: 'investor', cohortId: 'demo' })
window.__rhizoh.inviteOps.copyUrl()
window.__rhizoh.inviteOps.mailDraft({ observerName: '…', locale: 'tr' })
```

Mail send script (ops): `scripts/send-cohort-observer-invite.ps1`

## Invariants

- `interpretationOnly: true` · `readOnly: true`
- No `appendIdentityEventV0` from invite flow
- Observation ≠ Execution

## Related

- [`RHIZOH_IDENTITY_MANIFEST_V0.md`](RHIZOH_IDENTITY_MANIFEST_V0.md)
- [`RHIZOH_CLOSED_USER_ADMISSION_V0.1.md`](RHIZOH_CLOSED_USER_ADMISSION_V0.1.md)
- Runtime: `apps/client/src/rhizoh/ingress/observerInviteLandingV0.js`
