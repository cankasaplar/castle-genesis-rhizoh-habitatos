# Rhizoh Shadow Prod — Merge Transition Naming v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Tone:** eğlenceli geçiş hikâyesi — üzgün surat yok, “fix” kelimesi yok.

Shadow prod sprint’inde merge/PR başlıkları **durum geçişi** anlatır: sistem bir fazdan diğerine **kayar**, kırık cam metaforu kullanılmaz.

---

## Prefix

| Eski (kaçın) | Yeni (tercih) |
|--------------|---------------|
| `fix(chess): …` | `transition(chess): …` |
| `fix(devtools): …` | `transition(devtools): …` |
| `hotfix: …` | `transition(prod): …` |

İstisna: frozen core / CI kırığı — o zaman `stabilization:` veya `ci:` (nötr, kısa).

---

## Örnekler (chess cluster hattı)

```text
transition(chess): slot-0 Stockfish express — Canlı maç artık heuristic’e düşmüyor
transition(chess): arena ve cluster aynı koridorda — sıra kavgası bitti
transition(devtools): öğrenme monitörüne canlı kapı — __RHIZOH_CHESS_LEARNING_LIVE__
transition(broadcast): 8 kamera grid B-roll, #1 LIVE gerçek motor
```

---

## PR gövdesi

- **Ne değişti** (1 cümle, pozitif)
- **Doğrulama** (DevTools probe — callable olanlar `()`, snapshot olanlar nesne)
- **SPECFLOW** etiketi

Üzgün emoji / “broken / sad / emergency” dili kullanma. Geçiş tamamlandıysa: “artık …” veya “şimdi …”.

---

## DevTools probe SSOT

| Amaç | Komut |
|------|--------|
| Canlı öğrenme şeridi | `window.__RHIZOH_CHESS_LEARNING_LIVE__()` |
| Stale snapshot (poll ile güncellenir) | `window.__rhizoh.chessLearningMonitor` |
| Tam chess manager | `window.__RHIZOH_CHESS_MANAGER_LIVE__()` |
| Öğrenme raporu | `await window.__rhizoh.learningReport()` |

`chessLearningMonitor` **fonksiyon değil** — `()` ile çağırma.
