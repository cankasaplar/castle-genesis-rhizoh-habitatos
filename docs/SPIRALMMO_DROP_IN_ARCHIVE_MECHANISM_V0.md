# SPIRALMMO Drop-In Archive Mechanism (V0)

Status: Active draft  
Purpose: Ingest external files (Drive exports, LLM chat dumps, ad-hoc docs/media) into a controlled archive lane without silent pollution.

## 1) Why this exists

- New files arrive from many channels.
- Manual copy creates naming drift and hidden duplicates.
- We need traceable intake with manifest + quality tags.

## 2) Intake rule

- All external files enter through `_DROP_IN`.
- Direct copy into random project folders is disallowed.
- Every intake creates a batch manifest.

## 3) Folder layout

Under Desktop `SPİRALMMO` root:

- `_DROP_IN/inbox` -> per-batch categorized files
- `_DROP_IN/staging` -> optional post-ingest review area
- `_DROP_IN/manifests` -> csv/json manifest per batch
- `_DROP_IN/logs` -> human-readable summary

## 4) Command

Script path:

- `scripts/spiralmmo-dropin-archive.ps1`

Examples:

- Copy mode (safe default):
  - `powershell -ExecutionPolicy Bypass -File scripts/spiralmmo-dropin-archive.ps1 -SourcePath "C:\Users\LENOVO\Downloads\llm-export"`
- Move mode (source will be relocated):
  - `powershell -ExecutionPolicy Bypass -File scripts/spiralmmo-dropin-archive.ps1 -SourcePath "C:\Users\LENOVO\Desktop\incoming" -Mode Move`
- Explicit root override:
  - `powershell -ExecutionPolicy Bypass -File scripts/spiralmmo-dropin-archive.ps1 -SourcePath "C:\temp\batchA" -ArchiveRoot "C:\Users\LENOVO\Desktop\SPİRALMMO"`

## 5) Classification output

Extension-based categories:

- `web_html`
- `code_js_ts`
- `data_json`
- `docs_text`
- `media_images`
- `media_video_audio`
- `archives_bundles`
- `misc_unknown`

For `.html`, quick quality tags:

- `empty_or_stub`
- `insufficient_code`
- `skeleton_only`
- `workable`
- `unreadable`

## 6) Governance

- Ingest != publish.
- `_DROP_IN` outputs stay non-authoritative until reviewed.
- `empty_or_stub` and `insufficient_code` HTML files require triage before promotion.
- Promotion target should be chosen by canonical map (`KEEP_CORE`, `KEEP_DOC`, `ARCHIVE_COLD`, `DUPLICATE_CANDIDATE`, `QUARANTINE_UNKNOWN`).

## 7) Next step

Create `SPIRALMMO_ARCHIVE_CANONICAL_MAP_V1.md` and wire each category to final destination folders.
