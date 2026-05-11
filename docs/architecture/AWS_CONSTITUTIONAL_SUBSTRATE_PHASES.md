# AWS Constitutional Substrate — Phased Reference

Status: `REFERENCE-LAYER` / `NON-EXECUTABLE`  
Scope: Constitutional **instantiation** on AWS — not a product feature roadmap.  
Related: [`EPISTEMIC_BOUNDARY_STATEMENT.md`](../EPISTEMIC_BOUNDARY_STATEMENT.md) · [`ROBOTICS_EPISTEMIC_FREEZE.md`](../ROBOTICS_EPISTEMIC_FREEZE.md) · [`MEDIA_OBSERVER_BRIDGE.md`](../MEDIA_OBSERVER_BRIDGE.md) · [`FOUNDING_STATE_PRE_BOOTSTRAP_V1.md`](../FOUNDING_STATE_PRE_BOOTSTRAP_V1.md)

---

## Locked decisions (read first)

### 1) Canonical chain store

Two clean baseline patterns:

**Option A — S3 + Object Lock as canonical surface**

- Signed artifact bundles; immutable; low operational cost; simple ops.
- Replay via **index manifests** (application or sidecar index).
- Weakness: **query / causal traversal** lives mostly in app layer.

**Option B — Append ledger as canonical chain**

- DynamoDB append chain, QLDB-class ledger, or equivalent.
- Strength: **native chain traversal**, easier causal reconstruction, natural attestation graph, stronger constitutional query story.
- Weakness: **complexity, operations, cost** rise.

**Hybrid (recommended for Castle / Rhizoh line)**

- **Canonical blob truth** → **S3 Object Lock** (immutable signed payloads).
- **Canonical chain index** → **append ledger** (ordered edges, hashes, approvals, correction links).

Rule: **immutable blob** holds bytes; **chain semantics** live in the ledger. Derived summaries are never truth sources.

### 2) Audit vs domain event vs telemetry

Keep the three lanes separate; mixing them blurs epistemic boundary.

| Lane | Question | Examples | Retention posture |
|------|-----------|----------|-------------------|
| **Audit event** | Who / what / under which authority? | Privileged action, key usage, role assumption, policy breach, constitutional override | Immutable + long retention |
| **Domain event** | What happened in the system (business/protocol)? | Agent invoked, artifact emitted, approval granted, correction appended, routing selected | Replayable + analytical |
| **Telemetry** | How did it behave? | Latency, token cost, failure rate, trace spans, saturation | Ephemeral + derived |

---

## Phase 0 — Constitutional mapping (before change)

Map existing **frozen** concepts to AWS primitives:

| Concept | AWS-oriented mapping |
|---------|----------------------|
| Canonical truth source | Attested artifact stream (blobs + chain index per decision §1) |
| Append-only correction law | Immutable version chain / Object Lock / ledger append-only semantics |
| Boundary statement | IAM + network + signing boundary |
| A / B / C buckets | Storage class + access policy + retention / discovery-only surfaces |

This step is **constitution instantiation**, not “feature deploy.”

---

## Phase 1 — Identity / secret boundary (build first)

Root trust domain:

- Workload identity; machine identity; human operator identity.
- Signing keys; rotation; **emergency revoke**; least-privilege graph.
- **Constitutional break-glass** policy (explicit, attested, rare).

Practical AWS anchors:

- IAM Roles Anywhere / role chains; STS ephemeral credentials.
- **AWS Secrets Manager**; **AWS KMS** (encryption + signing where applicable).
- **CloudTrail** (organization trail where relevant); consider **immutable** archive to locked storage.

Rules:

- No secret in runtime memory longer than necessary.
- No long-lived credentials for workloads.
- Every privileged action **attested** (audit lane).

---

## Phase 2 — Account / network boundary (membrane)

**Account lattice** (illustrative):

- Core constitutional account  
- Runtime account  
- Experiment sandbox  
- External ingestion account  
- Robotics **frozen** account (dormant until controlled thaw)

**Network lattice**:

- Private subnets; controlled egress.
- Signed / authenticated ingress.
- Service-to-service **identity** (no implicit east-west trust).

Goal: **lateral movement ≈ infeasible** without explicit, attestable paths.

---

## Phase 3 — Event / observability plane

Rhizoh-class systems should be **event-sourced, replayable, attested, introspectable**.

Layers:

- Event bus (domain lane).
- Immutable audit stream (audit lane).
- Metrics + traces (telemetry lane).
- **Constitutional violation** channel (dedicated path + alerting).
- Replay simulator (against domain + chain index, not against raw telemetry as truth).

Design question to answer: **which causal chain** produced an outcome — not only “what happened.”

Implementation sketch (non-binding):

- **Amazon EventBridge** for governance and domain routing.
- High-volume streams → **Kinesis** or **MSK** where needed.
- Tracing → **OpenTelemetry** + **X-Ray** or vendor-neutral collector.

---

## Phase 4 — Artifact / ledger plane

**Canonical (attested)**

- Constitutional docs; signed artifacts; milestone chain; approval attestations; epistemic correction chain.

**Non-canonical (ephemeral)**

- Temp memory; model cache; experiment logs; debug traces; derived summaries.

**Golden rule:** **derived state ≠ truth source.**

---

## Phase 5 — Orchestration plane (last)

Only after Phases 1–4 are stable:

- Agent mesh; human agents; approval gates; task DAG; role lattice.
- Constitutional validator; policy engine; model selection / routing; fallback cognition path.

**LLM = actor. Protocol = governor.**

---

## Robotics (reference)

- **Frozen domain**; no active actuator authority.
- Simulation / digital twin only until thaw.
- **Controlled thaw** requires **explicit constitutional / protocol amendment** — see [`ROBOTICS_EPISTEMIC_FREEZE.md`](../ROBOTICS_EPISTEMIC_FREEZE.md).

---

## Closing

This document is a **staged architecture reference** for mapping Rhizoh’s epistemic boundary onto AWS. It does not replace code, CI graph validators, or canonical artifact definitions.

**Next level of detail:** [`ADR_BOOTSTRAP_AUTHORITY_V1.md`](ADR_BOOTSTRAP_AUTHORITY_V1.md) · [`BOOTSTRAP_CEREMONY_CHECKLIST_V1.md`](BOOTSTRAP_CEREMONY_CHECKLIST_V1.md) · [`GENESIS_DECLARATION_TEMPLATE_V1.md`](GENESIS_DECLARATION_TEMPLATE_V1.md) · [`AWS_TOPOLOGY_BLUEPRINT_V1.md`](AWS_TOPOLOGY_BLUEPRINT_V1.md) · [`AWS_ORG_LATTICE_SCP_BASELINE_V1.md`](AWS_ORG_LATTICE_SCP_BASELINE_V1.md) · [`SPRINT_SLICE_01_ARTIFACT_EMISSION.md`](SPRINT_SLICE_01_ARTIFACT_EMISSION.md) · [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md)

*Substrate reference v1 — constitutional compute boundary on AWS.*
