# LLM Chat Archive — Paste & Scan (V0)

Status: Active  
Mode: Observation / archive only (no execution authority)

## Purpose

Archive LLM conversation exports with a simple workflow:

1. Copy chat text
2. Paste (or drop file)
3. Scan + classify
4. Write to repo inbox + index

## Archive location

`docs/archive/llm-chats/`

- `paste-here/` — drop `.md` / `.txt` files, then scan
- `inbox/` — archived chats (with YAML frontmatter metadata)
- `manifests/` — per-batch csv/json
- `logs/` — batch summaries
- `LLM_CHAT_ARCHIVE_INDEX_V0.md` — auto index table

## Masaüstü RTF şeridi (en kolay)

Canonical belge yok — yalnızca inbox + katman taraması + staging (tonom policy engelli).

1. Kurulum (bir kez veya RTF kaybolursa):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-llm-chat-desktop-lane.ps1
```

Oluşur:

- `C:\Users\LENOVO\Desktop\Rhizoh_LLM_Sohbet_Yapistir.rtf` — sohbeti buraya yapıştır, kaydet
- `C:\Users\LENOVO\Desktop\Rhizoh_Sohbet_Repoya_Aktar.bat` — çift tık = repoya aktar

2. Sohbeti `=== SOHBET BASLANGIC ===` ile `=== SOHBET BITIS ===` arasına yapıştır, Ctrl+S.

3. `.bat` dosyasına çift tık (veya):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-desktop-ingest.ps1
```

Script: RTF → düz metin, kırık karakter / fazla boşluk onarımı, şablon talimatlarını ayıklama, inbox + index + staging.

## Yapılacaklar / fikir ayrıştırma (otomatik)

Her ingest sonrası (veya manuel) anlam katmanı + eylem kalıplarıyla todo/fikir/soru listesi:

- `docs/archive/llm-chats/action-items/*_actions.md` — sohbet başına digest
- `docs/archive/llm-chats/LLM_CHAT_ACTION_ITEMS_MASTER_V0.md` — birleşik indeks + önizleme

Manuel (tek dosya):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-extract-action-items.ps1 -InboxFiles "20260528-215915_gemini_desktop-rtf-chat.md" -SourceHintOverride chatgpt
```

Tüm substantial sohbetler:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-extract-action-items.ps1 -AllSubstantial
```

Kaynak etiketi düzeltme (ör. ChatGPT yanlışlıkla gemini): `-SourceHintOverride chatgpt`

## Kod / dosya ayrıştırma

Her ingest + extract sonrası:

- `docs/archive/llm-chats/segments/*_segments.md` — kod blokları (dil etiketli fence) + dosya yolu/uzantı tablosu
- Inbox gövdesi: bozuk fence onarımı, `\v` temizliği, `code_block_count` / `file_ref_count` frontmatter

Tüm arşivi yeniden ayrıştır:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-restructure-inbox.ps1 -RescanAll
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-extract-action-items.ps1 -RescanAll
```

## Commands

### A) Clipboard paste (fastest)

```powershell
# 1) Copy chat from LLM UI
# 2) Run:
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-paste-archive.ps1 -FromClipboard
```

Optional title/source override:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-paste-archive.ps1 -FromClipboard -Title "SpiralMMO fold model" -SourceHint cursor
```

### B) Paste file path

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-paste-archive.ps1 -PasteFile "C:\Users\LENOVO\Downloads\chat-export.md"
```

### C) Folder scan (batch)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-paste-archive.ps1 -SourcePath "C:\Users\LENOVO\Downloads\llm-exports"
```

### D) Drop folder scan

1. Put files into `docs/archive/llm-chats/paste-here/`
2. Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-paste-archive.ps1 -ScanOnly
```

## Scan tags

- `source_hint`: `chatgpt | claude | cursor | gemini | copilot | perplexity | unknown`
- `content_type`: `conversation | code_notes | freeform_notes`
- `quality`: `empty_or_stub | thin | substantial | code_heavy`

## Layer scan (10 katman)

Her sohbet ingest sonrası otomatik taranır:

- `file` (dosya)
- `text`
- `comment` (yorum)
- `meaning` (anlam)
- `fun` (eğlence)
- `music` (müzik)
- `art` (sanat)
- `sport`
- `competition` (rekabet)
- `real_layer`

Çıktılar:

- frontmatter: `layer_primary`, `layer_hits`, `layer_hit_total`
- policy state: `docs/archive/llm-chats/tonom-write-policy.v0.json`
- staging notes (izinli katmanlar için): `docs/archive/llm-chats/staging/`

## Tonom write permissions

Policy SSOT: `docs/LLM_CHAT_LAYER_TONOM_WRITE_POLICY_V0.md`

Sohbet eklendikçe otomatik uygulanır:

- `scan` + `annotate` (tüm katmanlar)
- `staging_write` (yalnız `text`, `comment`, `meaning`)
- `canonical_write` / `execution_write` (engelli)

Manuel yeniden tarama:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-llm-chat-tonom-write.ps1 -RescanInbox
```

## Governance

- Archived chats are **non-authoritative** until reviewed.
- Agents may analyze and propose; they must not execute from chat text.
- Link to waiting-room protocol:
  - `docs/SPIRALMMO_WAITING_ROOM_AGENT_TRAINING_PROTOCOL_V0.md`

## Narrative links

- SPIRALMMO archive table: `docs/SPIRALMMO_ARCHIVE_TABLE_V0.md`
- Drop-in archive lane: `docs/SPIRALMMO_DROP_IN_ARCHIVE_MECHANISM_V0.md`
