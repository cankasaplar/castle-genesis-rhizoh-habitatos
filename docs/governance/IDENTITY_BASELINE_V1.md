# Identity Baseline v1 — AWS & Human Access

Status: `REFERENCE-LAYER` / `OPERATIONAL` / `NON-EXECUTABLE`  
Version: 1.0  
Related: [`ROLE_LATTICE_V1.md`](ROLE_LATTICE_V1.md) · [`AWS_ORG_LATTICE_SCP_BASELINE_V1.md`](../architecture/AWS_ORG_LATTICE_SCP_BASELINE_V1.md) · [`EPISTEMIC_BOUNDARY_STATEMENT.md`](../EPISTEMIC_BOUNDARY_STATEMENT.md) · [`ADR_BOOTSTRAP_AUTHORITY_V1.md`](../architecture/ADR_BOOTSTRAP_AUTHORITY_V1.md)

Operational baseline for **who signs in how**. Not a replacement for [`EPISTEMIC_BOUNDARY_STATEMENT.md`](../EPISTEMIC_BOUNDARY_STATEMENT.md); aligns human/process identity to substrate invariants (**privileged actions attested**, **no long-lived credentials** for workloads).

---

## IAM user vs IAM Identity Center (how to tell)

| Where you manage it | Console path | Typical use |
|----------------------|--------------|-------------|
| **IAM Identity Center** | **IAM Identity Center** → **Users** | **Human** workforce access via **AWS access portal**; permission sets → roles in accounts. |
| **IAM (legacy)** | **IAM** → **Users** | **Minimize** for humans; prefer for **machine** integration only, with keys rotated or replaced by roles. |

The workforce user **`rhizoh`** created for this org is an **IAM Identity Center** user (portal username), not an IAM console user in the IAM → Users list.

**MFA for IdC users:** Configure in **IAM Identity Center** → user → **MFA** (or at **first portal sign-in** if your policy requires it). **Enabled + MFA: None** is a **gap** until MFA is registered.

---

## Mandatory rules

1. **MFA required** for any identity that holds **privileged** permission sets (e.g. AdministratorAccess, break-glass, KMS admin, org admin). Prefer **authenticator app** or **passkey / hardware key**; store **recovery** material in a secure vault.  
2. **Root user** on the **management account**: **MFA on**; **no daily use** — break-glass and billing-critical changes only; strong recovery path documented offline.  
3. **Human access** → **IAM Identity Center** first; **IAM users** for humans only when IdC cannot be used, and then **MFA + least privilege**.  
4. **Workload access** → **IAM roles** / **IRSA** / **ECS task roles** — **no long-lived access keys** in application config where avoidable.  
5. **Device / secret rotation** and **offboarding**: disable IdC user or remove account assignments same day; audit via CloudTrail (audit plane).

---

## Constitutional edge mapping (humans)

Map real people to [`ROLE_LATTICE_V1.md`](ROLE_LATTICE_V1.md) **edges** in your runbook (not in this file’s table — avoid PII). Example pattern:

- **Steward / bootstrap attestor** → `amend`, `approve`, `freeze_propose` (as policy allows).  
- **Day-to-day operator** → `read` + narrow write in **runtime** account only.  
- **Break-glass** → separate IdC group + permission set; **time-bound** or **approval** where possible.

Permission sets in IdC should **mirror** these edges per account (core vs runtime vs audit).

---

## Gap closure checklist (immediate)

- [ ] **`rhizoh` (IdC):** MFA **registered** (not “None”).  
- [ ] **Management account root:** MFA **on**; password **not** reused for IdC.  
- [ ] **IdC:** Permission set assigned to **at least** management account for `rhizoh` (until member accounts exist).  
- [ ] **SESSION_LOG** (optional): one line when MFA baseline is **closed** for bootstrap identities.

---

*Identity baseline v1 — operational; amend via governance review.*
