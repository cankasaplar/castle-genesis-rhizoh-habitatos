# ADR — Bootstrap Authority v1

Status: `ACCEPTED` (substrate reference) / `REFERENCE-LAYER` / `NON-EXECUTABLE`  
Date: 2026-05-09  
Related: [`EPISTEMIC_BOUNDARY_STATEMENT.md`](../EPISTEMIC_BOUNDARY_STATEMENT.md) · [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md) · [`AWS_TOPOLOGY_BLUEPRINT_V1.md`](AWS_TOPOLOGY_BLUEPRINT_V1.md) · [`SPRINT_SLICE_01_ARTIFACT_EMISSION.md`](SPRINT_SLICE_01_ARTIFACT_EMISSION.md)

---

## Context

Before IaC (Terraform / CDK), the **genesis trust root** must be explicit. Without it, infrastructure rests on an implicit signer and undermines attestation semantics.

Constitutional line: **canonical truth** emerges from **attested artifact streams**; the **first** attestation still requires a **declared** root of trust.

---

## Options considered

| Approach | Pros | Cons |
|--------|------|------|
| Human steward key only | Clear accountability | Operational fragility; key custody |
| Offline root key only | Strong air-gap story | Slow rotation; ops friction |
| HSM-backed KMS asymmetric root | AWS-native; auditable | Cost; org setup |
| Multi-sig genesis only | High assurance | Complexity before Slice 01 |

---

## Decision

**Hybrid genesis model:**

1. **Offline genesis declaration** — Human-steward **attested** declaration (document + hash) recorded in **SESSION_LOG** (and optionally replicated to canonical store as **first non-automated** artifact class). This anchors *intent* and *human accountability*.

2. **KMS asymmetric operational root** — Day-to-day **signing** uses **AWS KMS** keys in the **core constitutional** account (see topology blueprint). No long-lived raw private keys in application memory.

3. **Dual attestation for amendments** — Structural changes to chain semantics, key policy, or promotion of trust **require two independent attestations** (e.g. **Steward** + **Approver** roles per [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md), or steward + CI attestation where policy allows). **Break-glass** remains separate, rare, and audit-mandatory.

**First signature (Slice 01):** Emitted by **operational KMS role** only after genesis declaration is recorded; genesis hash MAY be included in genesis ledger row.

**Future hardening:** Multi-party approval for KMS key policy changes; optional additional HSM for org policy.

---

## Naming conventions (illustrative)

Align with account lattice and bucket separation in [`AWS_TOPOLOGY_BLUEPRINT_V1.md`](AWS_TOPOLOGY_BLUEPRINT_V1.md).

**Accounts (examples)**

- `castle-core-prod`
- `castle-runtime-prod`
- `castle-sandbox`
- `castle-ingest`
- `castle-robotics-dormant`

**Buckets (examples)**

- `castle-canonical-artifacts-prod`
- `castle-domain-events-prod`
- `castle-audit-trail-prod`
- `castle-derived-telemetry-prod`

**KMS aliases (examples)**

- `alias/castle-root-signing` — org/core seals; minimal use
- `alias/castle-artifact-signing` — routine artifact manifests
- `alias/castle-ledger-signing` — ledger row attestation (if distinct from artifact)
- `alias/castle-secrets` — envelope encryption for secrets

Exact names MUST follow org naming policy; suffix env (`-prod`, `-sandbox`) consistently.

---

## Consequences

- **IaC** MUST create KMS and IAM **after** genesis declaration is recorded (or in same change set with explicit human step ordering documented).
- **Rotation** of operational signing keys preserves chain via **key id in ledger** + **overlap period** documented in a follow-up ADR if needed.
- **Permission ≠ authority** remains enforced in [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md); KMS resource policies reflect edges, not generic admin.

---

## Next steps

1. Run [`BOOTSTRAP_CEREMONY_CHECKLIST_V1.md`](BOOTSTRAP_CEREMONY_CHECKLIST_V1.md); record genesis using [`GENESIS_DECLARATION_TEMPLATE_V1.md`](GENESIS_DECLARATION_TEMPLATE_V1.md) in [`docs/academic/SESSION_LOG.md`](../academic/SESSION_LOG.md).
2. Terraform / CDK skeleton referencing this ADR and blueprint v1.

---

*ADR Bootstrap Authority v1 — trust root before IaC.*
