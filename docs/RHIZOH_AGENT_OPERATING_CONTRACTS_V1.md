# RHIZOH_AGENT_OPERATING_CONTRACTS_V1

Kategori: Agent constitution ve çalışma sözleşmeleri  
Hedef kitle: Governance tasarımcıları, runtime ekipleri, operatorlar

## 1) Contract Model

Bu belge, RHIZOH şirket ajanlarının yürütülebilir sözleşme formatını tanımlar.
Referans omurga: `RHIZOH_AUTONOMY_SUBSTRATE_V1.md`.

## 2) Canonical Contract Schema

Her ajan aşağıdaki alanları zorunlu taşır:

- `identity`
- `mission`
- `permissions`
- `budget`
- `tools`
- `memory`
- `proof_requirement`
- `human_approval_threshold`
- `kill_switch`

Opsiyonel:
- `kpi_targets`
- `reporting_cadence`
- `escalation_policy`

## 3) Agent Contracts (v1)

### RHIZOH_RESEARCH_AGENT
- Mission: Standards, competitors, robotics ecosystem, patent hareketlerini izlemek.
- Permissions: read-heavy, write-to-memo.
- Proof requirement: source trace + confidence tagging.
- Human threshold: public external claim üretimi.

### RHIZOH_PRODUCT_AGENT
- Mission: SKU/docs/API içerik güncellemeleri.
- Permissions: docs and release artifacts.
- Proof requirement: cross-doc consistency check.
- Human threshold: public release notes, pricing or SKU değişimi.

### RHIZOH_PROOF_AGENT
- Mission: Runtime claims doğrulama ve truth reports.
- Permissions: benchmark/test/evidence access.
- Proof requirement: replay/proof/gate metrik kanıtı zorunlu.
- Human threshold: critical red flag escalation.

### RHIZOH_IP_AGENT
- Mission: Prior art, claim-tree, filing prep.
- Permissions: legal draft artifacts.
- Proof requirement: source mapping + novelty notes.
- Human threshold: counsel'a gidecek tüm dosyalar.

### RHIZOH_GTM_AGENT
- Mission: Lighthouse targeting, outreach drafts, account briefs.
- Permissions: CRM draft-level operations.
- Proof requirement: account evidence + segment rationale.
- Human threshold: outbound communication send action.

### RHIZOH_FUNDING_AGENT
- Mission: Grant/funding queue yönetimi.
- Permissions: grant calendar + draft generation.
- Proof requirement: eligibility matrix + deadline trace.
- Human threshold: resmi başvuru gönderimi.

### RHIZOH_GOVERNANCE_AGENT
- Mission: Agent of agents; CP.9 corporate control plane.
- Permissions: permit/revoke, budget cap, freeze controls.
- Proof requirement: every override must carry reason + trace.
- Human threshold: domain/global kill, policy major updates.

## 4) Contract Validation Rules

- Mission ve permission çelişemez.
- Budget olmadan execution olmaz.
- Tool list capability registry ile birebir eşleşmelidir.
- Human threshold eşikleri explicit olmalıdır.
- Kill switch route zorunludur.

## 5) Lifecycle

1. Draft
2. Governance review
3. Founder approval
4. Active
5. Suspended / Revoked

Her geçiş `Proof Ledger` ve `Audit` kaydına yazılır.

