# Role Lattice v1 — Constitutional Edges

Status: `REFERENCE-LAYER` / `NON-EXECUTABLE`  
Version: 1.0  
Related: [`EPISTEMIC_BOUNDARY_STATEMENT.md`](../EPISTEMIC_BOUNDARY_STATEMENT.md) · [`IDENTITY_BASELINE_V1.md`](IDENTITY_BASELINE_V1.md) · [`AWS_TOPOLOGY_BLUEPRINT_V1.md`](../architecture/AWS_TOPOLOGY_BLUEPRINT_V1.md) · [`CURSOR_TEAM_ONBOARDING_CHECKLIST.md`](../CURSOR_TEAM_ONBOARDING_CHECKLIST.md)

Defines **who may do what** against the constitutional substrate. This is **governance**, not application RBAC for every feature.

---

## Constitutional edges (verbs)

| Edge | Meaning | Touches canonical truth? |
|------|---------|-------------------------|
| **read** | Discover, replay, inspect attested stream | No |
| **attest** | Cryptographically sign or witness a payload / manifest | Indirect (binds identity to bytes) |
| **approve** | Authorize promotion / linkage in chain (human or policy gate) | Yes (governance act on chain) |
| **amend** | Propose or record **correction** as **new** artifact / ledger entry | Yes (append-only only) |
| **emergency_override** | Break-glass action; **must** emit audit + post-hoc review | Risk to boundary; attested, rare |
| **freeze_propose** / **thaw_propose** | Propose robotics or core thaw/freeze policy change | Protocol layer; not ad hoc |

---

## Role → edges (matrix)

| Role (example) | read | attest | approve | amend | emergency_override | freeze/thaw propose |
|----------------|------|--------|---------|-------|-------------------|---------------------|
| **Observer** | yes | no | no | no | no | no |
| **Developer** | yes | no* | no | no | no | no |
| **Signer / CI attestor** | yes | yes | no | no | no | no |
| **Approver (human)** | yes | no | yes | no | no | no |
| **Steward (protocol)** | yes | no | yes | yes (append) | no | yes |
| **Break-glass operator** | yes | case-by-case | case-by-case | case-by-case | **yes** (scoped) | no |

\*Developer may attest **non-canonical** builds in sandbox only; **not** canonical bucket paths.

---

## IAM / policy mapping (conceptual)

- **read** → `s3:GetObject` on replay manifests; `dynamodb:Query` on ledger (read-only); no `Put`.
- **attest** → `kms:Sign` (scoped to signing key); `s3:PutObject` only to **staging** or via **CI role** into canonical with approval pipeline.
- **approve** → separate **approval service** role or human-gated step; may write **approval record** to ledger.
- **amend** → append-only writer to ledger + new Object Lock put; **no** delete / overwrite.
- **emergency_override** → highly scoped role + **MFA** + **time-bound** session + mandatory audit event.
- **freeze/thaw propose** → write to governance queue or ledger event type `protocol_proposal`; execution requires quorum per future policy.

---

## Invariants

- **No role** receives “define canonical truth by model output” — truth remains **attested artifact stream** only.
- **Correction** = new entry; **overwrite** forbidden ([`EPISTEMIC_BOUNDARY_STATEMENT.md`](../EPISTEMIC_BOUNDARY_STATEMENT.md)).
- **Emergency** actions are **audit-lane mandatory** and **review-lane follow-up**.

---

*Role lattice v1 — refine with org HR titles and actual IAM policy names in a later revision.*
