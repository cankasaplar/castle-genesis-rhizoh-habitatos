# RHIZOH_COMPANY_DASHBOARD_SPEC_V1

Kategori: Founder cockpit ve kurumsal kontrol paneli  
Hedef kitle: Founder/CEO, governance operator, exec team

## 1) Objective

Tek insan sovereign için (Founder Console) şirket ajanlarını güvenli şekilde yönetilebilir kılmak:

- Gör
- Doğrula
- Onayla/Reddet
- Durdur

## 2) Dashboard Modules

1. **Agent Health Grid**
   - Agent status, drift score, last task, budget burn

2. **Approval Queue**
   - Pending critical actions
   - Risk tier, required approver, SLA timer

3. **Proof & Truth Panel**
   - Claim coverage
   - Proof routing latency (p50/p95)
   - Replay verification outcomes

4. **Budget & Capacity Panel**
   - Agent bazlı token/compute/time tüketimi
   - Cap breach uyarıları

5. **Mission & KPI Board**
   - Mission progress
   - Weekly output counters (memo, outreach, grant draft vb.)

6. **Kill Switch Console**
   - L1 agent stop
   - L2 domain stop
   - L3 global autonomy freeze

7. **Audit Timeline**
   - Permit/revoke/history
   - Approval decisions
   - Policy changes

## 3) Core Views

- **Founder View**: bütün ajanlar + kritik risk özeti
- **Governance View**: policy, queue, overrides
- **Proof View**: truth reports, evidence health
- **GTM/Funding View**: pipeline ve program üretimi

## 4) Required Integrations

- Mission registry
- Capability registry
- Task DAG engine
- Budget ledger
- Proof ledger
- Approval queue
- Kill switch bus
- Memory graph

Referans: `RHIZOH_AUTONOMY_SUBSTRATE_V1.md`.

## 5) Decision Workflows

### Approval Workflow
1. Agent proposal enters queue
2. Proof attachment check
3. Founder approve/reject/defer
4. Decision sealed + logged

### Emergency Workflow
1. Drift/breach signal triggers alert
2. Governance proposes containment action
3. Founder confirms (or auto policy if pre-authorized)
4. Kill signal emitted + postmortem task auto-created

## 6) KPI Set

- Approval turnaround time
- Policy breach rate
- Budget overrun incidents
- Proof coverage ratio
- Replay verification pass ratio
- Mean time to containment

## 7) v0 Delivery

1. Read-only cockpit
2. Approval actions
3. Kill switch controls
4. KPI and weekly executive export

