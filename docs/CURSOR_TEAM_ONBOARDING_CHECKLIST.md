# CURSOR_TEAM_ONBOARDING_CHECKLIST

Status: `PLANNED` / `REFERENCE-LAYER`

Scope:
- Does not modify Rhizoh core execution.
- Is not a canonical artifact.
- Serves as an operational guide for the Cursor team.

---

## Purpose

Provide a short, portable onboarding reference so all contributors keep the same layer boundaries and event semantics.

## 1) Lock Layer Contract

Use this baseline in team communication and docs:

- `SESSION_LOG` -> ledger
- `Artifact` -> canonical object
- `Media` -> external pointer
- `NotebookLM` -> retrieval surface

## 2) Keep Media Bridge External-Only

Follow `docs/MEDIA_OBSERVER_BRIDGE.md` with strict scope:

- external references only
- no authority semantics
- no canonical truth claims from media files

## 3) NotebookLM Register = Cross-Reference Only

In `docs/NOTEBOOKLM_REGISTER.md`, allow only:

- linked media pointer (`local://...`)
- `importedAt`
- optional digest (`sha256:...`)
- related docs links

Do not introduce new artifact families or new semantics there.

## 4) Fix Event Language and Invariant

Allowed event meaning:

- `media_ingested` = pointer imported

Disallowed meaning:

- media implies canonical truth

Invariant:

**Media may inform observation; media may never define canonical truth.**

## 5) Operational Onboarding Flow

For each new team member:

1. Read this checklist.
2. Read `docs/MEDIA_OBSERVER_BRIDGE.md`.
3. Read `docs/NOTEBOOKLM_REGISTER.md` media reference section.
4. Read `docs/governance/IDENTITY_BASELINE_V1.md` if touching AWS (MFA, Identity Center vs IAM).
5. Confirm layer contract in one sentence.
6. Start contributions without extending canonical semantics.

---

Owner: Cursor team operations  
Change policy: append/clarify only, no core semantic expansion here.
