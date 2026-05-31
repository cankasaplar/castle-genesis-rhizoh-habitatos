# Rhizoh Reply Normalization Layer v1

**Tag:** `CORE-ELIGIBLE` · **Status:** SSOT (client boundary)

## Runtime invariant (system law)

> **Gateway decides, client renders. No second interpretation exists.**

> Meaning is decided once, rendered everywhere, never re-interpreted.

| Role | Responsibility | Forbidden |
|------|----------------|-----------|
| **Gateway** | Meaning producer · schema owner · drift tracker | — |
| **Envelope** | Single carrier · semantic lock | Alt-field fallback |
| **Client** | Projection · UI render · voice surface | Semantic actor · `?? text/message/content` |

**Reply rule:** `gateway.reply` ONLY. If empty → empty UI state (client fallback forbidden).

**Envelope:** [`rhizohReplyEnvelopeV1.js`](../apps/client/src/rhizoh/runtime/rhizohReplyEnvelopeV1.js) → `projectRhizohReplyEnvelopeV1`  
**Normalize impl:** [`rhizohLlmReplyNormalizeV0.js`](../apps/client/src/rhizoh/runtime/rhizohLlmReplyNormalizeV0.js)  
**Gateway parse (authoritative extract):** [`rhizohLlmGateway.js`](../apps/gateway/src/rhizohLlmGateway.js) → `extractRhizohLlmReplyFromProviderText`  
**Gateway contract tests:** [`rhizohLlmReplyExtractV0.test.js`](../apps/gateway/src/__tests__/rhizohLlmReplyExtractV0.test.js)  
**Client boundary CI:** `npm run stabilization:validate-reply-envelope-boundary`

## Purpose

**ALL LLM output → single canonical format** on the client.

Provider text is parsed **once** (gateway). The client **projects** the HTTP envelope only — it never re-runs `reply ?? text ?? message ?? content`.

**Wheel analogy:** navigation vs cognition split → here **interpretation vs rendering** split.

## Pipeline

```
Provider raw text
  → gateway extractRhizohLlmReplyFromProviderText (extract + decide + label)
  → gateway JSON { reply, rhizohDeliveryKind, ledger, drift scores }  ← contract freeze
  → client projectRhizohReplyEnvelopeV1 / normalizeRhizohLlmGatewayResponseV0
  → UI / voice / continuity (resolveRhizohReplyForDisplayV0)
```

## Gateway contract freeze v2

Pinned field on every successful `/rhizoh/llm` body:

```json
"replySchemaVersion": "castle.rhizoh.reply_schema.v1"
```

Client assesses via `assessRhizohReplySchemaContractV1` — **observable drift, non-executable** (`contractOk` / `contractDrift` on envelope). Reply render unchanged; missing version = legacy gateway until deploy.

Frozen success fields: `reply`, `replySchemaVersion`, `rhizohDeliveryKind`, `rhizohCompressionLedger`, drift scores.

## Gateway contract freeze (reply only)

Client-facing `/rhizoh/llm` success body **must** expose:

| Field | Role |
|-------|------|
| `reply` | **Only** user-visible text (already extracted) |
| `rhizohDeliveryKind` | ok · empty_reply · semantic_silence · unstructured_reply |
| `rhizohCompressionLedger.replyExtractPath` | how gateway parsed provider |
| `replyParsingConfidence` | parse confidence |
| `replyFormatDriftScore` | format drift |

**Fallback chains live only in gateway** (`extractRhizohLlmReplyFromProviderText`). Client alt-fields (`text`, `message`, `content`) are **ignored by design**.

## replyEnvelopeV1 (canonical projection)

Schema: `castle.rhizoh.reply_envelope.v1`

```json
{
  "reply": "string",
  "extractPath": "json.reply | plain_text_fallback | …",
  "deliveryKind": "ok",
  "confidence": 1,
  "driftScore": 0
}
```

Full normalize schema (internal): `castle.rhizoh.llm_reply_normalized.v0`

## Domain ownership

| Layer | Owner | Must not |
|-------|--------|----------|
| Provider parse + extractPath | Gateway | — |
| Decide + label (deliveryKind) | Gateway | — |
| replyEnvelope projection | Client | Re-parse provider text |
| Display string | `resolveRhizohReplyForDisplayV0` | Alt-field fallback |
| Drift EMA | `replyFormatDriftTrackerV0` | Override gateway reply |

## Query layer (single entry)

**Module:** [`rhizohQueryLlmV1.js`](../apps/client/src/rhizoh/runtime/rhizohQueryLlmV1.js)  
**Entry:** `queryRhizohLLM` — text/voice turns; App registers shell deps via `registerRhizohQueryLlmDepsV0`.

## Dev probe

```js
window.__CASTLE_RHIZOH_LLM_REPLY_NORMALIZED__
```

## Anti-pattern (forbidden on client — CI enforced)

```js
// ❌ second schema router — creates dual epistemic authority
json?.reply ?? json?.text ?? json?.message ?? json?.content
```

## Required test invariant

**Alt-field shadow, no `reply` → client shows empty** (gateway must populate `reply` first).
