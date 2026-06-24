# Rhizoh World Bridge Memory Writeback v0

**SPECFLOW:** `RESEARCH-ONLY` — shadow → ledger projection; governance frozen.

## Gap closed

World Bridge wrote to `worldBridgeMemoryGraph` but **never** projected into `shadowTraceLedger` (`SHADOW_SOURCE_SYSTEM_V0.MAP` unused).

## Writeback path (one-way)

```
shadow timeline entry
  → recordWorldBridgeShadowMemoryV0 (memory graph)
  → projectWorldBridgeShadowToLedgerV0 (shadow trace ledger, when shadow mode)
  → rhizohEpistemicMemoryGraph (auto-project on append)
```

## Governance (unchanged)

```javascript
SHADOW_LEDGER_GOVERNANCE_V0 = {
  feedsDriftDetection: false,
  feedsMoveSelection: false,
  feedsPolicyDiff: false,
  executionEffect: false
}
```

Writeback is **compliance projection**, not execution feedback.

## Module

`worldBridgeShadowTraceBridgeV0.js` — `projectWorldBridgeShadowToLedgerV0(shadowEntry, source)`

## DevTools smoke

```javascript
__rhizoh.ingestCalendarEvent({ title: "Focus block" })
__rhizoh.worldBridgeMemory()
__rhizoh.shadowTraceLedger  // MAP source rows when shadow mode active
```
