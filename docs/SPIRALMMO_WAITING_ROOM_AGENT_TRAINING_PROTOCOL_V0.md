# SPIRALMMO Waiting Room Agent Training Protocol (V0)

Status: Draft  
Mode: Research-only  
Boundary: Observation may influence interpretation, never execution

## 1) Intent

Prepare agents in a waiting-room training lane before any production-adjacent role.
Training objectives:

- cleanliness discipline (`temizlik`)
- attention discipline (`dikkat`)
- focus discipline (`odak`)
- semantic consistency (`anlam`)

## 2) Core Law: Observation / Execution Separation

- Agents in waiting room are `observer-class`.
- Observer-class agents cannot trigger runtime execution writes.
- No authority escalation from analysis output.
- Any proposed change must pass human gate + explicit execution policy path.

Short form:

- observe -> analyze -> feedback -> propose
- never: observe -> execute

## 3) Training Tracks

### A) Cleanliness Track (`temizlik`)

- objective: reduce noise, duplicate artifacts, unclear naming
- outputs:
  - inventory cards
  - duplicate candidates
  - archive recommendations
- forbidden:
  - direct delete
  - silent move without log

### B) Attention Track (`dikkat`)

- objective: detect risk-bearing inconsistencies early
- outputs:
  - anomaly notes
  - boundary violation candidates
  - confidence labels (`high`, `medium`, `low`)
- forbidden:
  - certainty claims without evidence path

### C) Focus Track (`odak`)

- objective: prevent scope drift
- outputs:
  - single-session goal lock
  - off-scope queue
  - completion checkpoint
- forbidden:
  - opportunistic feature expansion

### D) Meaning Track (`anlam`)

- objective: preserve semantic intent across docs and code references
- outputs:
  - glossary alignment checks
  - wording normalization proposals
  - interpretation notes
- forbidden:
  - redefinition of core terms without governance decision

## 4) Analysis -> Feedback -> Change Loop

1. Analysis: collect evidence only.
2. Feedback: produce constrained recommendations.
3. Change proposal: map recommendation to explicit owner.
4. Human decision: approve/hold/reject.
5. Execution lane: only approved items move to implementer-class.

## 5) Agent Classes

- `Observer`: read, inspect, classify, summarize.
- `Analyst`: score risk, produce options, define trade-offs.
- `Curator`: documentation cleanup proposals.
- `Implementer` (outside waiting room): executes approved changes only.

## 6) Required Output Schema (Per Task)

Each waiting-room output must contain:

- `task_id`
- `scope`
- `evidence`
- `risk_level`
- `recommended_action`
- `execution_required` (`true/false`)
- `human_gate_status` (`pending/approved/rejected`)

## 7) Red Flags

- implicit execution authority
- cross-boundary state write proposal
- missing evidence for high-confidence claims
- policy language that bypasses human gate

## 8) Exit Criteria From Waiting Room

An agent can graduate only when:

- 3 consecutive tasks with complete schema
- zero observation-execution violations
- traceable evidence in every recommendation
- human reviewer marks consistency as stable

## 9) Immediate Use With Desktop Archive Cleanup

For `SPİRALMMO` archive work:

- all agents start as `Observer` + `Analyst`
- produce `inventory + risk + proposed move map`
- no deletion, no silent relocation, no runtime coupling decisions
- hand off approved actions to implementer lane

## 10) Drop-In Intake Integration

- External files from Drive/LLM/chat exports must enter only through `_DROP_IN`.
- Intake is done by `scripts/spiralmmo-dropin-archive.ps1`.
- Waiting-room agents can classify and score intake artifacts but cannot publish them into core paths.
- Promotion from `_DROP_IN` requires explicit human gate + canonical map destination.

## 11) LLM Chat Paste & Scan Lane

- LLM sohbet arşivi repo içinde: `docs/archive/llm-chats/`
- Komut: `scripts/llm-chat-paste-archive.ps1`
- Akış: kopyala -> yapıştır (clipboard veya `paste-here/`) -> tara -> `inbox/` + index
- Chat metni execution yetkisi vermez; yalnızca gözlem/analiz girdisidir.
- Rehber: `docs/LLM_CHAT_ARCHIVE_PASTE_SCAN_V0.md`
- Katman + tonom write policy: `docs/LLM_CHAT_LAYER_TONOM_WRITE_POLICY_V0.md`
- 10 katman taraması: file/text/comment/meaning/fun/music/art/sport/competition/real_layer
- Sohbet eklendikçe `scripts/apply-llm-chat-tonom-write.ps1` izinleri uygular (`execution_write` kapalı)
