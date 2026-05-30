# SPIRALMMO Archive Intelligence (V0)

Status: Active (heuristic v0)  
Mode: Observation / interpretation only

## 1) Temporal heatmap

Tracks how layer hits change over time from LLM chat ingest events.

- Output: `docs/archive/spiralmmo-intelligence/TEMPORAL_LAYER_HEATMAP_V0.md`
- JSON: `docs/archive/spiralmmo-intelligence/TEMPORAL_LAYER_HEATMAP_V0.json`
- Source fields: `archived_at_utc`, `layer_hits` in chat inbox frontmatter

## 2) Meaning compression

Compresses large archive surfaces into semantic clusters (target: 50).

- Output: `docs/archive/spiralmmo-intelligence/MEANING_COMPRESSION_50_V0.md`
- JSON: `docs/archive/spiralmmo-intelligence/MEANING_COMPRESSION_50_V0.json`
- Method v0: path-semantics signature (folder tokens + extension + size bucket)
- Note: v0 is not embedding-based clustering; v1 can add content embeddings.

## 3) Narrative anomaly detection

Flags likely "bozuk ayna / broken mirror" class events:

- phrase signals in LLM chats
- HTML empty/stub surfaces
- temporal ingest skew
- duplicate basename mirrors across archive paths

- Output: `docs/archive/spiralmmo-intelligence/NARRATIVE_ANOMALY_REPORT_V0.md`
- JSON: `docs/archive/spiralmmo-intelligence/NARRATIVE_ANOMALY_REPORT_V0.json`

## Command

Fast (daily default, ~3-4 min):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-spiralmmo-archive-intelligence.ps1 -Fast
```

Full (includes duplicate-basename mirror scan, slower):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-spiralmmo-archive-intelligence.ps1
```

Included in daily report runner:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-spiralmmo-daily-report.ps1
```

## Governance

- Intelligence outputs are non-authoritative.
- Anomalies do not trigger execution writes.
- Human gate required before canonical promotion or runtime action.
