# RHIZOH_SUBSTRATE_V0_IMPLEMENTATION_BACKLOG

Kategori: Uygulama backlogu (ilk 14 gun)  
Hedef: Minimum calisan Autonomous Company Runtime v0

## North Star

RHIZOH'u "manifesto + belge seti" seviyesinden, calisan substrate seviyesine indirmek:

- memory graph live
- task DAG executor
- budget ledger active
- approval queue active
- kill switch bus wired
- proof stub pipeline connected

## Framing (Sabit)

RHIZOH bir "oyun motoru" degil; game mechanics kullanan production-grade autonomous runtime.

Calisma tanimi:
- Inside: deterministic simulation layers
- Outside: real decisions, real workflow outputs, revenue-facing operations

## 14-Day Delivery Plan

## Day 1-2: Substrate Skeleton

- `apps/client/src/kernel/company/` dizinini olustur:
  - `autonomySubstrateState.js`
  - `missionRegistry.js`
  - `capabilityRegistry.js`
  - `budgetLedger.js`
  - `taskDag.js`
  - `approvalQueue.js`
  - `proofLedger.js`
  - `killSwitchBus.js`
  - `memoryGraph.js`
- V0 state shape'i tanimla:
  - `agents`
  - `missions`
  - `tasks`
  - `budgets`
  - `approvals`
  - `proofRecords`
  - `memoryArtifacts`
  - `killState`

Exit:
- Substrate bootstrap fonksiyonu tek cagrida saglam state dondurur.

## Day 3-4: Mission + Capability Registry

- Canonical kayit API'leri:
  - `registerMission()`
  - `registerCapability()`
  - `resolveAgentPermissions()`
- `RHIZOH_AGENT_OPERATING_CONTRACTS_V1.md` ile schema parity kontrolu.
- Contract validation guard'lari:
  - permission/budget/tool mismatch reject
  - missing kill-switch route reject

Exit:
- 7 ajan contract'i registry'e yuklenebilir.

## Day 5-6: Budget Ledger + Approval Queue

- Budget ledger:
  - reserve/commit/release
  - soft/hard cap
  - overrun event emit
- Approval queue:
  - enqueue/dequeue/approve/reject/defer
  - SLA timeout flag
  - escalation reason

Exit:
- High-risk task'lar approval olmadan execute edilmez.

## Day 7-8: Task DAG Executor

- DAG node turleri:
  - `proposal`
  - `proof_precheck`
  - `approval_gate`
  - `execution`
  - `evidence_commit`
- Node durumlari:
  - `pending | ready | running | blocked | failed | completed`
- Retry policy + bounded retries.

Exit:
- Ornek GTM veya Research gorevi DAG uzerinde uctan uca calisir.

## Day 9-10: Memory Graph + Proof Ledger

- Memory graph:
  - artifact nodes (memo, outreach draft, report)
  - decision links (approved/rejected)
  - traceId ile lineage
- Proof ledger:
  - claim -> evidence -> verifierStatus
  - proof stub status (`UNVERIFIED`, `STUB_OK`, `FAILED`)

Exit:
- Her task completion icin memory + proof kaydi olusur.

## Day 11: Kill Switch Bus

- Kill seviyeleri:
  - L1 agent-local stop
  - L2 domain stop
  - L3 global freeze
- Kill nedeni + actor + timestamp audit'e yazilir.

Exit:
- Running taskler kill sinyaliyle deterministik olarak durdurulur.

## Day 12: Founder Console Minimal View

- Basit panel veya debug surface:
  - queue count
  - budget burn
  - proof health
  - drift alerts (stub)
  - kill status

Exit:
- Founder kritik karar kuyrugunu ve kill durumunu gorebilir.

## Day 13: Studio Integration Entry

- Studio/SpiralMMO event hook:
  - simulation event -> task proposal
  - approved action -> content event
- Revenue loop icin placeholder metric:
  - engagement-triggered task counter

Exit:
- En az bir simulation event substrate task'ina baglanir.

## Day 14: Hardening + Demo Runbook

- End-to-end smoke test:
  - agent proposal
  - approval
  - execution
  - proof stub
  - memory/proof commit
  - optional kill interrupt
- `demo_run_summary.json` uretimi.

Exit:
- "minimum calisan agent runtime" demonstrable durumda.

## Minimum Agent Runtime (v0)

Ilk aktivasyon kapsamı:
- `RHIZOH_RESEARCH_AGENT`
- `RHIZOH_GTM_AGENT`
- `RHIZOH_GOVERNANCE_AGENT`

Neden:
- Dis dunya etkisi + approval ihtiyaci + pipeline gorunurlugu ayni anda test edilir.

## Definition of Done (v0)

- 3 ajan policy-bounded calisiyor.
- Contract validation fail durumlari test edildi.
- Approval gate devrede.
- Budget cap ihlali bloklaniyor.
- Proof ledger kaydi otomatik.
- Kill switch L1/L2/L3 calisiyor.
- Founder console basic operable.

## Immediate File Targets

- `apps/client/src/kernel/company/autonomySubstrateState.js`
- `apps/client/src/kernel/company/agentContractsRuntime.js`
- `apps/client/src/kernel/company/taskDagExecutor.js`
- `apps/client/src/kernel/company/founderConsoleStore.js`
- `apps/client/src/kernel/company/studioBridgeHooks.js`

## Risk Notes

- Over-design riski: v0'da "perfect architecture" yerine calisan bounded flow once.
- Proof realism riski: stub/real ayrimi UI ve loglarda acik isaretlenmeli.
- Governance friction riski: approval queue SLA ve batching ile azaltilmali.

