# AWS Organization Lattice & SCP Baseline v1

Status: `REFERENCE-LAYER` / `NON-EXECUTABLE`  
Version: 1.0  
Related: [`AWS_TOPOLOGY_BLUEPRINT_V1.md`](AWS_TOPOLOGY_BLUEPRINT_V1.md) · [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md) · [`IDENTITY_BASELINE_V1.md`](../governance/IDENTITY_BASELINE_V1.md) · [`SPRINT_SLICE_01_ARTIFACT_EMISSION.md`](SPRINT_SLICE_01_ARTIFACT_EMISSION.md)

Distributed governance engineering: **OU shape**, **first member accounts**, **SCP baseline**. Validate all SCP JSON in a **non-production test** before org-wide attach.

---

## 1) Organization snapshot (Rhizoh)

| Field | Value |
|--------|--------|
| **Management / display name** | `rhizoh` |
| **Management account ID** | `583931058673` |
| **Organization ID** | `o-e9rnnc199v` |
| **Root ID** | `r-uxzs` |
| **Member accounts (current)** | *None yet* — lattice instantiation next |
| **IAM Identity Center** | **Enabled** — instance id `69877d5391c09237` (verify **ARN** in **IAM Identity Center** console; do not treat as public metadata) |

**Model:** **Management account = governance root**; **child accounts = constitutional execution domains** — not “genesis account = whole system.”

**SCP scope:** SCPs apply to **member accounts** in OUs; the **management account** is **not** constrained by SCPs the same way — design controls accordingly ([AWS: SCPs and the management account](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)).

---

## 2) OU design — Pattern B (constitutional separation)

Governance shape aligned to epistemic / audit / execution split:

```text
Root (r-uxzs)
├── Constitutional-Core      # KMS authority, signing policy, core control plane
├── Execution-Runtime        # ECS/EKS, agents, Slice 01 execution workloads
├── Epistemic-Audit          # CloudTrail aggregation, immutable audit sinks, replay evidence
├── Data-Ingestion           # Untrusted connectors (later)
├── Experimental-Sandbox       # Labs; no canonical promotion
└── Dormant-Robotics-Frozen  # Empty or placeholder until thaw protocol
```

**Minimal OU first:** If AWS limits initial complexity, create **empty OUs** in this order: `Constitutional-Core` → `Execution-Runtime` → `Epistemic-Audit`, then add `Experimental-Sandbox`, then `Data-Ingestion`, then `Dormant-Robotics-Frozen`.

---

## 3) First member accounts (wave 1)

Create via **Organizations → Add an AWS account** (unique **root email** per account; use **email+tag** pattern if one inbox).

| Account name (friendly) | Constitutional function | OU parent |
|---------------------------|-------------------------|-----------|
| **`castle-core-prod`** | KMS CMK home for signing, CI attestation anchor, core orchestration **control plane** (not general app sprawl) | `Constitutional-Core` |
| **`castle-runtime-prod`** | Workloads: ECS/EKS, Slice 01 **execution**, agent runtime | `Execution-Runtime` |
| **`castle-audit-prod`** | Org CloudTrail / findings aggregation, **immutable** log archive buckets (cross-account policy TBD), compliance replay surface | `Epistemic-Audit` |

**After wave 1:** `castle-ingest-prod` → `Data-Ingestion`; `castle-sandbox` → `Experimental-Sandbox`.

**Robotics:** No dedicated account until thaw; OU `Dormant-Robotics-Frozen` holds **zero** or **deny-all SCP** placeholder only if policy requires.

Record **new account IDs** in [`AWS_TOPOLOGY_BLUEPRINT_V1.md`](AWS_TOPOLOGY_BLUEPRINT_V1.md) or append to [`docs/academic/SESSION_LOG.md`](../academic/SESSION_LOG.md) when created.

---

## 4) SCP baseline v1 (phased)

### Tier 0 — No restrictive SCP (bootstrap window)

- Attach **only** `FullAWSAccess` (default allow) to new OUs/accounts while **landing zone** and **IAM Identity Center** are configured.
- **Duration:** Short, deliberate; document end date in SESSION_LOG.

### Tier 1 — Sandbox guardrails (first deny SCPs)

Attach **first** to `Experimental-Sandbox` OU; validate nothing breaks for intended labs.

**Illustrative intent (not copy-paste without testing):**

- Deny **Object Lock governance bypass** in sandbox: `s3:BypassGovernanceRetention` on untrusted principals (tighten resource scope in real policy).
- Optionally **region allow-list** for sandbox to prevent accidental global deploy.

### Tier 2 — Org-wide safety (member accounts only)

Examples to design with security review:

- Deny disabling **CloudTrail** / org detective controls (if compatible with your logging design).
- Deny **root user** actions where [AWS recommends SCP guards](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_examples.html).

### Tier 3 — Workload separation

- `Execution-Runtime`: no IAM `*` admin for humans; break-glass only via [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md).
- `Constitutional-Core`: minimal service set; SCP or permission boundary to **deny** unrelated service APIs (design per least-privilege).

**Golden rule:** **Deny** SCPs combine with account IAM; **test** in sandbox OU before attaching to `Constitutional-Core` or `Execution-Runtime`.

---

## 5) Slice 01 binding (post–wave 1)

| Asset | Preferred account |
|--------|-------------------|
| Canonical **S3 Object Lock** bucket | **`castle-core-prod`** |
| **Append ledger** writer + app runtime for emission | **`castle-runtime-prod`** or **core** if writer must sit with keys — document **one** choice; avoid splitting writer/keys without cross-account KMS design |
| **CloudTrail org trail** destination (locked bucket) | **`castle-audit-prod`** (or dedicated log archive pattern) |

Update [`SPRINT_SLICE_01_ARTIFACT_EMISSION.md`](SPRINT_SLICE_01_ARTIFACT_EMISSION.md) completion record with **account IDs**.

---

## 6) Natural sequence (this doc → engineering)

1. Create OUs (Pattern B).  
2. Create **three** member accounts; move under OUs.  
3. Enable **IAM Identity Center** (management account) → access to all accounts.  
4. Tier 0 → Tier 1 SCP on sandbox.  
5. Enforce [`IDENTITY_BASELINE_V1.md`](../governance/IDENTITY_BASELINE_V1.md) — IdC users **MFA**; root break-glass only.  
6. KMS keys in **`castle-core-prod`**; cross-account roles for signing if runtime is separate.  
7. Genesis ceremony + Slice 01 in declared accounts.

---

## Operational state vocabulary (Rhizoh)

Use these labels in `SESSION_LOG` and runbooks when reporting progress:

| Label | Meaning |
|--------|--------|
| **ORGANIZATION ACTIVE** | AWS Organizations enabled; management account known. |
| **IDENTITY CENTER: ENABLED** | IAM Identity Center instance live; **permission sets** + **account assignments** follow OUs / [`ROLE_LATTICE_V1.md`](../governance/ROLE_LATTICE_V1.md). |
| **TOPOLOGY: INSTANTIATION PHASE** | OUs and/or member accounts **in progress** — lattice not fully populated. |
| **GOVERNANCE: SCP BASELINE v1** | Section **§4** is the **reference**; **Tier 0→N rollout** happens in console/IaC (not implied complete until recorded). |
| **ACCOUNTS: PENDING CREATION (3 PRIMARY)** | `castle-core-prod`, `castle-runtime-prod`, `castle-audit-prod` not yet created or not yet linked in this doc. |

**Triad (constitutional function binding):** **core** = authority plane · **runtime** = execution plane · **audit** = immutable verification / evidence plane.

When the three primary accounts exist and Identity Center + first cross-account trusts are live, state advances to **EXECUTION: SUBSTRATE LIVE** (record explicitly in `SESSION_LOG`).

---

*Org lattice & SCP baseline v1 — distributed governance reference.*
