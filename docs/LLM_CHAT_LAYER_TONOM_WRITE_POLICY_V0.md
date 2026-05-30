# LLM Chat Layer Taxonomy + Tonom Write Policy (V0)

Status: Active  
Scope: `docs/archive/llm-chats/` ingest lane

## Layers (10)

| Layer ID | Label | Scan | Annotate | Staging write | Canonical write | Execution write |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `file` | dosya | yes | yes | no | no | no |
| `text` | text | yes | yes | yes | no | no |
| `comment` | yorum | yes | yes | yes | no | no |
| `meaning` | anlam | yes | yes | yes | no | no |
| `fun` | eglence | yes | yes | no | no | no |
| `music` | muzik | yes | yes | no | no | no |
| `art` | sanat | yes | yes | no | no | no |
| `sport` | spor | yes | yes | no | no | no |
| `competition` | rekabet | yes | yes | no | no | no |
| `real_layer` | real_layer | yes | yes | no | no | no |

Machine policy SSOT:

- `docs/archive/llm-chats/tonom-write-policy.v0.json`

## On each chat ingest

Automatic actions:

1. `scan_all_layers` — keyword/heuristic layer scoring
2. `annotate_manifest` — write layer hits to batch manifest
3. `update_layer_index` — refresh archive index table
4. `apply_tonom_write_policy` — enforce allowed write classes only

Forbidden globally:

- `execution_write`
- `canonical_write_without_human_gate`

## Write classes

- `scan` — read/analyze only
- `annotate` — metadata/manifest/index updates in archive lane
- `staging_write` — derived notes under `docs/archive/llm-chats/staging/`
- `canonical_write` — promotion to core docs/runtime (human gate required)
- `execution_write` — always blocked for chat archive lane

## Commands

Paste + layer scan + policy apply:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-paste-archive.ps1 -FromClipboard
```

Policy-only refresh on existing inbox:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-llm-chat-tonom-write.ps1 -RescanInbox
```

## Narrative links

- Paste/scan guide: `docs/LLM_CHAT_ARCHIVE_PASTE_SCAN_V0.md`
- Waiting room protocol: `docs/SPIRALMMO_WAITING_ROOM_AGENT_TRAINING_PROTOCOL_V0.md`
- SPIRALMMO archive table: `docs/SPIRALMMO_ARCHIVE_TABLE_V0.md`
