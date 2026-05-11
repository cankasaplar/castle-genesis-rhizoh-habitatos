# Sprint Slice 01 — Artifact Emission + Signing + Append + Replay

Status: `REFERENCE-LAYER` — **first deployable constitutional slice** (definition; deployment is execution work).  
Related: [`AWS_TOPOLOGY_BLUEPRINT_V1.md`](AWS_TOPOLOGY_BLUEPRINT_V1.md) · [`ADR_BOOTSTRAP_AUTHORITY_V1.md`](ADR_BOOTSTRAP_AUTHORITY_V1.md) · [`GENESIS_DECLARATION_TEMPLATE_V1.md`](GENESIS_DECLARATION_TEMPLATE_V1.md) · [`AWS_CONSTITUTIONAL_SUBSTRATE_PHASES.md`](AWS_CONSTITUTIONAL_SUBSTRATE_PHASES.md) · [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md)

---

## Goal

Prove the **spine is alive**: emit a minimal attested artifact, append its chain index, verify signature, **replay** from stored state.

This is not a product feature slice; it is **constitutional operating substrate** proof.

---

## In scope

1. **Artifact emission** — deterministic payload (e.g. JSON manifest + small blob) produced by a controlled workload.
2. **Signing** — KMS `Sign` or equivalent; public verification path documented.
3. **Append** — immutable write to **S3 Object Lock** bucket + append row to **ledger index** (DynamoDB or QLDB per blueprint).
4. **Replay** — read chain + fetch blobs; recompute hash; verify signature; assert chain continuity.

Out of scope for Slice 01:

- Full orchestration plane, model routing, multi-agent mesh.
- Robotics thaw.
- Production multi-region DR.

---

## Acceptance criteria

- [ ] At least one **canonical** object in Object Lock bucket with **Compliance** mode.
- [ ] Ledger contains **genesis** and **first artifact** rows with **hash chain** fields consistent.
- [ ] Third party (or second process) can **replay** without write access.
- [ ] **Audit** event exists for sign + put + ledger write (CloudTrail and/or domain event tagged `audit-eligible`).
- [ ] **Rollback path**: if slice fails, sandbox accounts and buckets can be torn down without touching org root; **no** overwrite of canonical objects (only new aborted prefix or new bucket version).

---

## Suggested runtime

- **ECS Fargate** task or **Lambda** (if cold-start acceptable) for emitter — see blueprint ECS default.
- CI may run **replay verifier** as gated job.

---

## Milestone attestation (when done)

Record in [`docs/academic/SESSION_LOG.md`](../academic/SESSION_LOG.md):

- slice id: `SPRINT_SLICE_01`
- artifact ids / manifest hashes (non-secret)
- `SPECFLOW`: operational — does not alter frozen core without separate intent

---

*Slice 01 — spine proof, not feature complete.*
