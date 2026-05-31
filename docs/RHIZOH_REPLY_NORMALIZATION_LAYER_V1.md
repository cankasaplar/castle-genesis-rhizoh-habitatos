# Rhizoh Reply Normalization Layer v1

**Tag:** `CORE-ELIGIBLE` · **Status:** SSOT (client boundary)  
**Code:** [`rhizohLlmReplyNormalizeV0.js`](../apps/client/src/rhizoh/runtime/rhizohLlmReplyNormalizeV0.js)  
**Gateway parse (authoritative extract):** [`rhizohLlmGateway.js`](../apps/gateway/src/rhizohLlmGateway.js) → `extractRhizohLlmReplyFromProviderText`

## Purpose

**ALL LLM output → single canonical format** on the client.

Provider text is parsed **once** (gateway). The client normalizes the HTTP envelope only — it never re-runs `reply ?? text ?? message ?? content`.

## Pipeline

```
Provider raw text
  → gateway extractRhizohLlmReplyFromProviderText (extractPath)
  → gateway JSON { reply, rhizohDeliveryKind, ledger, drift scores }
  → client normalizeRhizohLlmGatewayResponseV0 (canonical envelope)
  → UI / voice / continuity (resolveRhizohReplyForDisplayV0)
```

## Canonical envelope

Schema: `castle.rhizoh.llm_reply_normalized.v0`

| Field | Source |
|-------|--------|
| `reply` | `json.reply` only |
| `extractPath` | ledger.replyExtractPath · observedFormat |
| `deliveryKind` | rhizohDeliveryKind |
| `replyParsingConfidence` | top-level · ledger |
| `replyFormatDriftScore` | top-level · ledger |

## Domain ownership

| Layer | Owner |
|-------|--------|
| Provider parse + extractPath | Gateway |
| Canonical envelope | `normalizeRhizohLlmGatewayResponseV0` |
| Display string | `resolveRhizohReplyForDisplayV0` |
| Drift EMA | `replyFormatDriftTrackerV0` |

## Dev probe

```js
window.__CASTLE_RHIZOH_LLM_REPLY_NORMALIZED__
```

## Anti-pattern (forbidden on client)

```js
// ❌ second schema router
json?.reply ?? json?.text ?? json?.message ?? json?.content
```
