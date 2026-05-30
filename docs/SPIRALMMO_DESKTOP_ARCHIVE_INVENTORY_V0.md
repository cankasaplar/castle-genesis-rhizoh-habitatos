# SPIRALMMO Desktop Archive Inventory (V0)

Status: Draft  
Scope: `C:\Users\LENOVO\Desktop\SPİRALMMO` (short path: `C:\Users\LENOVO\Desktop\SPRALM~1`)  
Date: 2026-05-28

## 1) Current Snapshot

- Total files: `125586`
- Total directories: `19815`
- Top-level folders/files observed:
  - `assets`
  - `rh-dashboard`
  - `spiral collision prototype`
  - `spiralmmo cursor new`
  - `SPİRALCHİP AND TECH`
  - `SPİRALMMO PNG`
  - `SPİRALMMO ZİP`
  - `txt files`
  - `system live mapper`
  - multiple `vitrammensborn_*` and `wolf_vs_sheep_*` folders
  - `SpiralChip-WebXR-Demo.zip`

## 2) Extension Distribution (Top 40)

- `.js`: `58839`
- `.ts`: `27016`
- `.map`: `10440`
- `.json`: `6572`
- `.md`: `6364`
- `[no_ext]`: `5105`
- `.html`: `1175`
- `.mjs`: `1161`
- `.py`: `1069`
- `.pyc`: `968`
- `.yml`: `603`
- `.cc`: `509`
- `.png`: `509`
- `.cjs`: `478`
- `.h`: `426`
- `.eslintrc`: `362`
- `.txt`: `347`
- `.nycrc`: `272`
- `.mts`: `251`
- `.pyi`: `238`
- `.css`: `219`
- `.zip`: `212`
- `.ps1`: `195`
- `.cmd`: `195`
- `.proto`: `187`
- `.editorconfig`: `145`
- `.npmignore`: `117`
- `.scss`: `97`
- `.pdf`: `79`
- `.cts`: `66`
- `.f90`: `60`
- `.gz`: `58`
- `.jst`: `56`
- `.coffee`: `48`
- `.wasm`: `46`
- `.flow`: `46`
- `.bnf`: `45`
- `.jshintrc`: `44`
- `.markdown`: `40`
- `.docx`: `37`

## 3) Largest Top-Level Buckets (Approx. GB)

- `SPİRALCHİP AND TECH`: `~0.748 GB`
- `SPİRALMMO ZİP`: `~0.682 GB`
- `spiralmmo cursor new`: `~0.641 GB`
- `SPİRALMMO PNG`: `~0.271 GB`
- `rh-dashboard`: `~0.256 GB`

## 4) Cleaning Taxonomy (No Deletion Yet)

This inventory uses a non-destructive triage model:

- `KEEP_CORE`: active source, runnable modules, build scripts
- `KEEP_DOC`: architecture notes, contracts, process docs
- `ARCHIVE_COLD`: old snapshots, exports, legacy experiments
- `DUPLICATE_CANDIDATE`: repeated assets/zips/maps
- `QUARANTINE_UNKNOWN`: unclear provenance, binary-only drops

## 5) Immediate Ordering Plan

1. Freeze evidence: generate manifest and hash list before moving anything.
2. Separate code vs media vs bundle exports.
3. Identify duplicate binary archives (`.zip`, large image buckets).
4. Move old bundles to `ARCHIVE_COLD` by date/version signature.
5. Keep only one canonical entry point for each runnable prototype.

## 6) Safety Rules

- No hard delete in first pass.
- No rename of runtime-critical folders until entry points are mapped.
- Every move action must be logged (source, target, reason, timestamp).
- If execution uncertainty exists, classify as `QUARANTINE_UNKNOWN`.

## 7) Next Deliverable (V1)

`SPIRALMMO_ARCHIVE_CANONICAL_MAP_V1.md`:

- canonical folder tree
- owner/intent per subtree
- retain/move/archive decision
- evidence manifest pointer

## 8) HTML Operability Triage (2026-05-28 re-scan)

Total `.html` files: `1175`

- `workable`: `650`
- `insufficient_code`: `444`
- `skeleton_only`: `5`
- `empty_or_stub`: `76`

### Empty or stub examples (opens blank/near blank)

- `assets/SPIRALMMO HTML/can.html` (0 bytes)
- `assets/SPIRALMMO HTML/dadey.html` (0 bytes)
- `assets/SPIRALMMO HTML/kiiiz.html` (0 bytes)
- `assets/SPIRALMMO HTML/militantpoetry.html` (0 bytes)
- `assets/SPIRALMMO HTML/plusone.html` (0 bytes)
- `assets/SPIRALMMO HTML/spiralentry.html` (0 bytes)
- `assets/SPIRALMMO HTML/trytytyforbetter.html` (0 bytes)

### Insufficient code examples (skeleton/too thin)

- `assets/SPIRALMMO HTML/key01.html`
- `assets/SPIRALMMO HTML/key02.html`
- `assets/SPIRALMMO HTML/key03.html`
- `assets/SPIRALMMO HTML/key04.html`
- `assets/SPIRALMMO HTML/key05.html`
- `assets/SPIRALMMO HTML/key06.html`
- `assets/SPIRALMMO HTML/key07.html`
- `assets/SPIRALMMO HTML/key08.html`
- `spiral collision prototype/test.html`

### Workable high-content examples

- `Yeni klasör (4)/spiralmmo64.html`
- `Yeni klasör (4)/spiralmaster.html`
- `Yeni klasör (4)/spiralmmo64_v6.4_fixed.html`
- `Yeni klasör (4)/orbitdeepcastle.html`
- `Yeni klasör (4)/spiralmmo.html`

### Note on vendor/demo files

Some low-code HTML files are from `node_modules` or vendor demos.  
They are not runtime entry points and should be classified as `ARCHIVE_COLD` or `KEEP_CORE_VENDOR` depending on dependency requirements.
