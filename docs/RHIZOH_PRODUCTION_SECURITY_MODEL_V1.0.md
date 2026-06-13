# Rhizoh Production Security Model v1.0

**SPECFLOW:** `RESEARCH-ONLY` · Sprint 40 final framing  
**Goal:** User-facing OS feels whole — not experimental, not unstable.

## A) Identity & Access Layer

- WebAuthn / passkey (required path)
- Device binding
- Session isolation
- Short-lived tokens
- MFA fallback

**Target:** Account compromise → unusable, not silently hijacked.

## B) Intent + Memory Security (Rhizoh Core)

- Intent snapshot = immutable log contract
- Memory write = policy engine approval only
- **LLM write = forbidden** (suggest / explain only)
- Per-user encryption key for durable memory shards

### LLM role (Teacher Layer)

| LLM may | LLM may not |
|---------|-------------|
| Suggest | Write state |
| Analyze | Migrate domain |
| Explain drawer intent | Mutate memory |
| Offer alternatives | Execute policy |

**Intelligence lives in:** Rhizoh Core + Intent Engine + Policy Layer — not LLM weights.

## C) Domain Isolation Layer

- `studio` · `world` · `media` · `castle` · `broadcast` · `observer`
- Cross-domain access = policy-controlled federation edges
- Medusa and all entities = domain-aware (motion profile from overlay ecology)

## D) Execution Sandbox

- External connectors isolated
- Plugin whitelist
- No arbitrary code execution
- Strict egress control

## E) Audit & Explainability

- “Why this output?” — internal trace chain
- `intent → domain → action` visible to operators only
- Immutable audit logs

## F) Attack Containment (Blast Radius)

- User-level isolation
- Domain-level isolation
- Memory shard separation

## Production trace visibility (Sprint 40)

Kernel globals (`__RHIZOH_CONTEXT_INTENT__`, cluster, domain graph) are **invisible** unless `VITE_RHIZOH_KERNEL_TRACE_DEBUG=1` (with prod membrane rules).

**Code:** `rhizohKernelTraceMembraneV0.js`

## Learning model (Rhizoh learns, LLM teaches)

1. **Input:** drawer interactions, media, ghost behavior, intent clusters  
2. **Learning (Core):** pattern extraction, cluster evolution, frequency weighting  
3. **LLM:** interpretation, suggestions, training copy — read-only to state
