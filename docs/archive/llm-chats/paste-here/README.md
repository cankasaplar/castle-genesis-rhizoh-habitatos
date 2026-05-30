# paste-here

Drop `.md` or `.txt` files here, paste chat content, save, then run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-paste-archive.ps1 -ScanOnly
```

**Note:** After `ScanOnly`, files move to `../inbox/` — this folder will look empty again. That is expected.

Quick paste without file:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/llm-chat-paste-archive.ps1 -FromClipboard -SourceHint claude -Title "my-chat"
```
