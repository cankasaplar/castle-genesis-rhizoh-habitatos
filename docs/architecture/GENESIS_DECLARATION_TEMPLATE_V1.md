# Genesis Declaration Template v1

Status: `REFERENCE-LAYER` / `NON-EXECUTABLE`  
Use: Copy into [`docs/academic/SESSION_LOG.md`](../academic/SESSION_LOG.md) when executing bootstrap; follow [`BOOTSTRAP_CEREMONY_CHECKLIST_V1.md`](BOOTSTRAP_CEREMONY_CHECKLIST_V1.md); fill placeholders; compute hash; then KMS-sign per [`ADR_BOOTSTRAP_AUTHORITY_V1.md`](ADR_BOOTSTRAP_AUTHORITY_V1.md).  
Related: [`BOOTSTRAP_CEREMONY_CHECKLIST_V1.md`](BOOTSTRAP_CEREMONY_CHECKLIST_V1.md) · [`SPRINT_SLICE_01_ARTIFACT_EMISSION.md`](SPRINT_SLICE_01_ARTIFACT_EMISSION.md) · [`EPISTEMIC_BOUNDARY_STATEMENT.md`](../EPISTEMIC_BOUNDARY_STATEMENT.md) · [`ROBOTICS_EPISTEMIC_FREEZE.md`](../ROBOTICS_EPISTEMIC_FREEZE.md)

---

## Template (paste into SESSION_LOG as a new block)

```markdown
### GENESIS_DECLARATION_V1 — Bootstrap

**Authority**
- Human Steward Attestation: <legal or operational identity — e.g. name + role>
- Timestamp (UTC): <YYYY-MM-DDThh:mm:ssZ>
- Session Ref: <link or heading id to this SESSION_LOG block>

**Operational Root**
- AWS KMS asymmetric key alias: <e.g. alias/castle-artifact-signing>
- Key ARN: <arn:aws:kms:...>
- Key fingerprint / id (as used in ledger): <KMS key id>
- Rotation policy ref: <doc or ADR id>

**Constitutional Invariants (ACTIVE)**
- Canonical truth = attested artifact stream only.
- Append-only correction law; overwrite forbidden.
- Derived state ≠ truth source (audit / domain / telemetry lanes separated).
- No long-lived workload credentials; privileged actions attested in audit lane.
- Robotics epistemic freeze active until explicit controlled thaw ([ROBOTICS_EPISTEMIC_FREEZE.md](../ROBOTICS_EPISTEMIC_FREEZE.md)).

**Amendment Rule**
- Dual attestation required for structural trust or chain-semantics changes ([ROLE_LATTICE_V1.md](../governance/ROLE_LATTICE_V1.md)).

**Status:** ACTIVE

---

**genesis_hash:** `sha256:<hex over canonical UTF-8 body of this block excluding this line and below>`

**genesis_attestation_signature:** `<KMS Sign output over genesis_hash or canonical payload — algorithm and encoding noted in Slice 01 runbook>`
```

---

## Notes

- Compute `genesis_hash` over a **canonical serialization** (stable field order, no trailing whitespace) — exact serialization MUST be documented in the first Slice 01 runbook so replay verifiers agree.
- First ledger row MAY reference `genesis_hash` as `prev_hash` anchor or dedicated `genesis` event type.
- This template is **not** a runtime artifact schema; it is a **human-steward + operational root** founding record.

---

*Genesis declaration template v1 — founding charter completion before IaC.*
