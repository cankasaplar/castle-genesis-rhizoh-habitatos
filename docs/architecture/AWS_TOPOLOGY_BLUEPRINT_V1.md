# AWS Topology Blueprint v1

Status: `REFERENCE-LAYER` / `NON-EXECUTABLE`  
Version: 1.0  
Related: [`AWS_CONSTITUTIONAL_SUBSTRATE_PHASES.md`](AWS_CONSTITUTIONAL_SUBSTRATE_PHASES.md) · [`ADR_BOOTSTRAP_AUTHORITY_V1.md`](ADR_BOOTSTRAP_AUTHORITY_V1.md) · [`AWS_ORG_LATTICE_SCP_BASELINE_V1.md`](AWS_ORG_LATTICE_SCP_BASELINE_V1.md) · [`EPISTEMIC_BOUNDARY_STATEMENT.md`](../EPISTEMIC_BOUNDARY_STATEMENT.md) · [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md) · [`SPRINT_SLICE_01_ARTIFACT_EMISSION.md`](SPRINT_SLICE_01_ARTIFACT_EMISSION.md)

Concrete service map for constitutional substrate on AWS. This is **implementation geometry**, not runtime code.

---

## Authoritative root mapping (cloud anchor — Rhizoh)

**Status:** **Management account** is **org-aware** (multi-account system **initialized**). **Member accounts** and OU lattice are **TBD** until created — see [`AWS_ORG_LATTICE_SCP_BASELINE_V1.md`](AWS_ORG_LATTICE_SCP_BASELINE_V1.md).

| Field | Value |
|--------|--------|
| **AWS account ID** | `583931058673` |
| **Account alias** | `rhizohteam` |
| **IAM console URL** | `https://583931058673.signin.aws.amazon.com/console` |
| **Organization ID** | `o-e9rnnc199v` |
| **Organization root ID** | `r-uxzs` |

**Declared account role (pre-Organizations):** **Genesis / control-plane anchor** — bootstrap, billing visibility, first KMS / Object Lock / ledger ceremony, and governance setup. Maps conceptually to **`castle-core-prod`** (or **Management + core constitutional** intent in §1), **not** the long-term home for all runtime workloads.

**Explicitly not recommended:** **Mixed** long-term use (control plane + primary runtime + ingestion in one account). Acceptable **only** as a **temporary** single-account phase; split per §1 when Organizations exists.

**Next structural step:** Enable **AWS Organizations** and add child accounts (e.g. `castle-runtime-prod`, `castle-sandbox`, `castle-ingest`, dedicated audit/logging pattern) aligned with [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md) and IAM separation of duties.

**Operational risk to avoid:** The genesis anchor **must not** become the **de facto** long-term production/runtime boundary. **Timely Organizations split** (or equivalent account separation) is the guardrail.

### Operational path options (both valid)

| Path | Order | Best when |
|------|--------|-----------|
| **Option 1 — Organizations first** | Organizations → child accounts + **SCPs** → identity migration plan → KMS / audit / Slice 01 in **named** accounts | You want clean boundaries before durable resources. |
| **Option 2 — Minimal friction** | **IAM Identity Center** (or strict IAM) + **KMS** hierarchy + CloudTrail / Object Lock in genesis anchor → Organizations + split **as soon as practical** | You need a fast Slice 01 proof; accept **migrate or redeploy** after split. |

**Path A — next concrete step:** Create **AWS Organizations** (this anchor becomes **management account**) → define **OU** skeleton → create **member accounts** for lattice roles → attach **SCPs** → then IAM Identity Center / KMS / genesis / Slice 01 in **named** accounts.

**Path B — SESSION_LOG obligation:** If Option 2 is chosen, **immediately** append to [`docs/academic/SESSION_LOG.md`](../academic/SESSION_LOG.md) a record that **Organizations + account lattice split** is **DEFERRED** but **MANDATORY** (not optional). Include a **target review date** or **milestone** (e.g. before Slice 02, or N days after Slice 01) so migration debt cannot read as “forgotten work.”

Implicit security sequence (either path): **authorization → encryption → immutability → execution** — not reversed. **Immutability and attestation integrity** MUST NOT be broken while choosing A vs B; only **account topology timing** differs.

### Slice 01 — account boundary rule

[`SPRINT_SLICE_01_ARTIFACT_EMISSION.md`](SPRINT_SLICE_01_ARTIFACT_EMISSION.md) is **not** only “is infra ready?” — it **must record which AWS account** hosts canonical Object Lock storage and which hosts the append ledger writer role.

- **Pre-split:** May run **only** in the genesis anchor if explicitly documented as **temporary monolith** with **migration intent** to `castle-core-prod` / `castle-runtime-prod` (or equivalents) in [`docs/academic/SESSION_LOG.md`](../academic/SESSION_LOG.md) at completion.
- **Post-split:** Canonical blobs + high-trust signing **SHOULD** live in the **core constitutional** account; general execution workloads **SHOULD NOT** share that blast radius.

---

## 1) AWS Organizations / account lattice

| Account role | Purpose | Notes |
|--------------|---------|--------|
| **Management** | AWS Organizations root, SCPs, billing aggregation | No workloads |
| **Core constitutional** | KMS hierarchy root policies, org-wide audit sink contracts | Minimal blast radius |
| **Runtime** | Application workloads emitting / consuming artifacts | Primary compute |
| **Sandbox** | Experiments; **no** canonical bucket write | Network-isolated |
| **External ingestion** | Connectors, untrusted inputs | No direct canonical promotion |
| **Robotics** | **Dormant** until controlled thaw ([`ROBOTICS_EPISTEMIC_FREEZE.md`](../ROBOTICS_EPISTEMIC_FREEZE.md)) | Simulation-only when active |

**Pre-Organizations note:** Until the lattice is instantiated, the account in **Authoritative root mapping** may host **bootstrap-only** workloads; treat as **genesis anchor**, not final runtime topology.

Use **SCPs** to deny risky APIs from sandbox/ingestion (e.g. disable Object Lock bypass, restrict `s3:BypassGovernanceRetention`). **OU tree, first accounts, SCP tiers:** [`AWS_ORG_LATTICE_SCP_BASELINE_V1.md`](AWS_ORG_LATTICE_SCP_BASELINE_V1.md).

**Console pitfall:** **IAM → Root access management** may show *Organization is not in use* until **AWS Organizations** is created from this (or another management) account. That message means “no org yet,” not a misconfiguration of the anchor account.

---

## 2) IAM boundary

- **No long-lived access keys** for humans; **IAM Identity Center** (SSO) preferred.
- Workloads: **IAM roles** only; short-lived via **STS**.
- **Permission boundaries** on high-trust roles (break-glass, signing operators).
- **Service-linked roles** where AWS requires them; document each.
- Cross-account: **explicit role assumption** with external ID where applicable.

Audit lane must capture: `AssumeRole`, `CreateGrant`, `kms:Sign`, `s3:PutObject` to Object Lock buckets, IAM policy changes.

---

## 3) KMS key hierarchy

**Trust root (genesis):** Before IaC, follow [`ADR_BOOTSTRAP_AUTHORITY_V1.md`](ADR_BOOTSTRAP_AUTHORITY_V1.md) — offline genesis declaration, KMS operational signing, dual attestation for amendments.

| Key class | Use | Rotation |
|-----------|-----|----------|
| **Organization / core** | Signing artifact manifests; high-trust seals | Annual + break-glass procedure |
| **Per-environment data** | Encryption at rest (S3 SSE-KMS, DynamoDB) | Automated where supported |
| **Workload data** | Application secrets envelope | Shorter lifecycle |

Rules:

- **Signing** and **encryption** keys SHOULD be distinct CMKs where feasible.
- **CloudTrail** log bucket encrypted with dedicated CMK.
- **Grants** for signing roles scoped; no wildcard principals.

---

## 4) VPC segmentation

Per workload account (at minimum **runtime**):

- **Private subnets** for compute and data-plane endpoints.
- **Public subnets** only if load balancer ingress required; no instance public IPs by default.
- **VPC endpoints** for S3, DynamoDB, KMS, STS, CloudTrail delivery where applicable (reduce NAT exposure).
- **Egress control**: egress VPC or explicit allow-lists for external calls (ingestion account may differ).

East-west: **no implicit trust** — service-to-service auth via IAM + TLS (or mesh policy if adopted later).

---

## 5) EventBridge vs Kinesis

| Concern | Primary choice | Rationale |
|---------|----------------|-----------|
| **Domain events** (artifact emitted, approval granted, correction appended) | **Amazon EventBridge** | Rules, buses, SaaS integration, governance routing |
| **High-volume / ordered streams** (sensor-scale, replay buffers) | **Kinesis Data Streams** (or MSK if Kafka contract) | Sharding, consumers, throughput |
| **Audit duplication** | EventBridge → **fork** to audit archive pattern OR CloudTrail-native | Avoid mixing audit semantics into app bus without tagging |

Keep **audit**, **domain**, **telemetry** buses or rules **logically separated** (per substrate doc).

---

## 6) S3 Object Lock — canonical buckets

- **Bucket policy**: deny non-TLS; deny unencrypted puts; restrict to signing role + CI role.
- **Object Lock**: **Compliance** mode for canonical payloads (not Governance-only for highest bar).
- **Versioning**: ON.
- **Replication** (optional): to second region with same lock policy; **MFA delete** on bucket config per ops policy.
- **Naming**: separate buckets for `canonical-artifacts`, `audit-archive`, `telemetry-ephemeral` (lifecycle expires non-canonical).

**Canonical blob truth** lives here; **chain index** does not replace this store.

---

## 7) Append ledger index

- **Purpose**: ordered chain edges (prev hash, artifact id, event type, approver refs).
- **Candidates**: **Amazon QLDB** (strong ledger semantics) · **DynamoDB** single-table append with conditional writes · application-verified chain with periodic **anchor** objects in S3.

Choice is cost/ops trade-off; **hybrid** model: blobs in S3, chain rows in ledger store with **S3 object key** + **content hash** in each row.

---

## 8) CloudTrail — immutable trail

- **Organization trail** covering all accounts (recommended).
- **S3 data events** for canonical buckets (optional, cost-sensitive; enable at least on signing paths).
- Trail log bucket: **Object Lock** + **MFA delete** (or org equivalent); **SSE-KMS**.
- Integrate with **Security Hub** / alerting for policy violations (optional).

---

## 9) OTel / trace mesh

- **OpenTelemetry** SDK in services → collector (sidecar or **ECS** daemon) → **AWS Distro for OpenTelemetry** → **Amazon Managed Prometheus** + **Grafana** (or CloudWatch metrics adapter).
- **Traces**: **AWS X-Ray** or OTLP exporter to vendor-neutral backend.
- **Rule**: traces and metrics are **telemetry lane** — not canonical truth; retention short vs audit.

---

## 10) ECS vs EKS

| Factor | **Amazon ECS (Fargate)** | **Amazon EKS** |
|--------|---------------------------|----------------|
| Ops burden | Lower | Higher (control plane, add-ons, upgrades) |
| Team k8s skill | Optional | Required |
| Sidecar / mesh | Task definitions | DaemonSets / sidecars |
| Portability | AWS-native | CNCF ecosystem |

**Default for Slice 01:** **ECS on Fargate** — fewer moving parts while proving artifact emission + signing + append + replay.

**Revisit EKS** when: multi-cluster tenancy, strong Kubernetes operator ecosystem, or explicit org standard mandates k8s.

---

## Diagram (logical)

```
Organizations (SCP)
    └── Accounts: mgmt | core | runtime | sandbox | ingestion | robotics(dormant)
            └── KMS hierarchy + IAM boundaries
            └── VPC (runtime): private + endpoints
            └── EventBridge (domain)  <>  Kinesis (high-volume, if needed)
            └── S3 Object Lock (canonical blobs) + Ledger (chain index)
            └── CloudTrail → locked audit bucket
            └── ECS Fargate workloads → OTel → metrics/traces
```

---

*Blueprint v1 — concrete topology reference; amend via explicit protocol revision.*
