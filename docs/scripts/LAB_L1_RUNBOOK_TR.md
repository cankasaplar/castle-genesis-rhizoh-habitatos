# Lab L1 — SRPOA-v1 (TR)

**SSOT:** [`RHIZOH_SRPOA_V1.md`](../RHIZOH_SRPOA_V1.md) — Single Runtime + Passive Observer Architecture

## Kilit

| | |
|--|--|
| 1 | Üretici runtime (gerçek) |
| 1 | Pasif observer (gölge okuma) |
| 0 | Çift gerçeklik · **A vs B yok** |

> Artık iki gerçeklik yok; tek gerçeklik + gölge okuma var.

## Üretici sekme

```javascript
// rhizohLabL1ProbeV0.js (+ isteğe bağlı hybrid)
rhizohLabL1.capture({ label: "L1_t0", origin: "runtime" });
// ≥60–120 sn
rhizohLabL1.capture({ label: "L1_t1", origin: "runtime" });
rhizohLabL1.report();
```

- **Sadece** `origin: "runtime"` — `context` yazma (observer üretir).
- `laptop:` yasak.

## Observer sekme

```javascript
// rhizohLabObserverShellV0.js
rhizohLabObserver.importArchive(/* producer JSON */);
rhizohLabObserver.snapshot();       // normalized frame (önce bunu)
rhizohLabObserver.summarizeArchive();
rhizohLabObserver.diffView();
// rhizohLabObserver.capture() → OBSERVERS ARE READ-ONLY (SRPOA-v1)
```

## Arşiv export (üretici)

```javascript
copy(JSON.stringify({
  schema: "castle.rhizoh.lab_l1_archive.v0",
  architecture: "SRPOA-v1",
  origin: "runtime",
  exported_at_ms: Date.now(),
  report: rhizohLabL1.report(),
  log: window.__rhizoh_lab_l1_log
}, null, 2));
```

## Yasak

- Observer’da probe + capture
- Manuel `observe` stub
- `ensureL1` / `rebuilt` / inline probe
- Runtime’da `context` / `laptop`
