# Bootstrap Ceremony Checklist v1

Status: `REFERENCE-LAYER` / `NON-EXECUTABLE`  
Purpose: **Ceremony order** for moving from `PLANNED / FOUNDED (pre-bootstrap)` to **ACTIVE**. Not a runbook executable in CI.  
Related: [`ADR_BOOTSTRAP_AUTHORITY_V1.md`](ADR_BOOTSTRAP_AUTHORITY_V1.md) · [`GENESIS_DECLARATION_TEMPLATE_V1.md`](GENESIS_DECLARATION_TEMPLATE_V1.md) · [`SPRINT_SLICE_01_ARTIFACT_EMISSION.md`](SPRINT_SLICE_01_ARTIFACT_EMISSION.md) · [`docs/academic/SESSION_LOG.md`](../academic/SESSION_LOG.md) · **Boot gates:** [`GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md`](../GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md) · **Predicate algebra (G0–G3):** [`GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md`](../GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md)

---

## Checklist (in order)

- [ ] **Steward identities verified** — human authority for genesis attestation confirmed.
- [ ] **Operational KMS key created** — per ADR and topology blueprint (core constitutional account).
- [ ] **Fingerprint recorded** — KMS key id / ARN / alias written into genesis block fields.
- [ ] **SESSION_LOG declaration filled** — paste and complete [`GENESIS_DECLARATION_TEMPLATE_V1.md`](GENESIS_DECLARATION_TEMPLATE_V1.md).
- [ ] **Canonical serialization produced** — exact rules noted for `genesis_hash` (stable field order, encoding).
- [ ] **genesis_hash computed** — `sha256` over canonical body (excluding hash/signature lines per template).
- [ ] **KMS signature produced** — `genesis_attestation_signature` over agreed payload (document in Slice 01 runbook).
- [ ] **Dual attestation recorded** — second steward or approver edge per [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md) and ADR.
- [ ] **First ledger append executed** — genesis or first chain row links to `genesis_hash` as designed in Slice 01.
- [ ] **Constitutional state → ACTIVE** — recorded in SESSION_LOG (single explicit line or status field in genesis block).

---

## Rule

**Template** may exist in repo pre-ceremony; **signature and hash** become canonical **only** at ceremony time.

---

*Bootstrap ceremony checklist v1 — order only, not implementation.*
