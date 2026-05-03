# RHIZOH_AUTONOMY_SUBSTRATE_V1

Kategori: Otonom şirket çalışma zemini (operating substrate)  
Hedef kitle: Runtime mimarları, platform mühendisleri, founder-operators

## 1) Purpose

Bu belge, RHIZOH Autonomous Company Layer'in "anayasadan işletime" geçmesi için gereken çekirdek substrate'i tanımlar.

Hedef model: **bounded autonomous enterprise**

- Ajan proposal üretir
- Proof bağlanır
- Governance kontrol eder
- Human sovereign (Founder Console) onaylar/reddeder

## 2) Core Substrate Components

1. **Mission Registry**
   - Agent mission tanımları
   - Scope, success metric, policy boundary

2. **Capability Registry**
   - Agent bazlı izinli tool/adapter listesi
   - Capability token üretim kuralları

3. **Task DAG**
   - İş akışlarının bağımlılık grafiği
   - Proposal -> review -> execution -> evidence adımları

4. **Budget Ledger**
   - Token/compute/time bütçeleri
   - Hard cap + soft alert + override kayıtları

5. **Memory Graph**
   - Tenant-safe görev belleği
   - Artifact, decision, outcome düğümleri

6. **Proof Ledger**
   - Claim -> evidence -> verification ilişkisi
   - Truth report ve witness referansları

7. **Human Approval Queue**
   - Kritik eylemler için gated onay akışı
   - SLA, priority, escalation metadata

8. **Kill Switch Bus**
   - Agent-local / domain / global stop sinyalleri
   - Trigger nedeni ve forensic kayıt

## 3) Data Contracts (Canonical Entities)

- `Mission`
- `Capability`
- `TaskNode`
- `BudgetEntry`
- `MemoryArtifact`
- `ProofRecord`
- `ApprovalRequest`
- `KillSignal`

Her entity için minimum alanlar:

- `id`
- `tenantId`
- `createdAt`
- `updatedAt`
- `ownerAgentId`
- `traceId`
- `policyVersion`

## 4) Execution Model

### Stage 1: Proposal
- Agent bir görev veya karar önerisi üretir.
- Öneri `Task DAG` ve `Mission Registry` ile tutarlılık kontrolünden geçer.

### Stage 2: Policy + Proof Precheck
- Capability ve budget doğrulanır.
- Gerekiyorsa proof requirement tetiklenir.

### Stage 3: Human Gate (Threshold-based)
- `human_approval_threshold` koşulu sağlanıyorsa queue'ya düşer.
- Founder/Governance onayı olmadan icra edilmez.

### Stage 4: Execution
- Onay sonrası bounded execution başlar.
- Kill switch sinyalleri daima önceliklidir.

### Stage 5: Evidence Commit
- Sonuçlar `Proof Ledger` + `Memory Graph` + `Audit` kaydına yazılır.
- Replay/forensic için identity seal zinciri güncellenir.

## 5) Security and Control Guarantees

- Least-privilege capability fabric
- Policy-enforced budget ceilings
- Signed decision envelopes (hedef)
- Full auditability (trace-linked artifacts)
- Immediate kill-switch interrupt path

Not: Bu garanti seti operasyonel hedeftir; formal/matematiksel tamlık iddiası değildir.

## 6) Plane Mapping

| Plane | Substrate karşılığı |
|------|----------------------|
| Execution | Task DAG + scheduler + adapters |
| Proof | Proof ledger + verification hooks |
| Governance | Approval queue + policy engine + budget caps |
| Identity | Seal/fingerprint lineage + artifact identity |
| Physical | External adapters + telemetry bridge |

## 7) v0 Implementation Order

1. Mission + capability registry
2. Approval queue + budget ledger
3. Task DAG engine
4. Proof ledger integration
5. Kill switch bus
6. Memory graph enrichment
7. Founder cockpit integration

## 8) Exit Criteria (Substrate v0)

- 7 şirket ajanı substrate üstünde kayıtlı ve policy-bounded çalışabiliyor.
- Kritik aksiyonlar approval queue'dan geçiyor.
- Bütçe ve capability ihlali otomatik engelleniyor.
- Her görev için traceable proof/memory/artifact kaydı oluşuyor.

