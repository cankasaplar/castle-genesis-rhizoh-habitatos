# Rhizoh — AI Provider Mapping v1.0

**Status:** DISCLOSURE SSOT — potansiyel sağlayıcılar (data-plane **inactive** today)  
**Veri sorumlusu:** Can Kasaplar · **İletişim:** cankasaplar@gmail.com

---

## 1. Operational truth (Phase 0.5)

| State | Value |
|-------|--------|
| Live user data-plane | **OFF** |
| Phase 1 signal env | **OFF** (`VITE_RHIZOH_PHASE1_SIGNAL` ≠ `1`) |
| Heartbeat ingest route | **Absent / not wired** |
| Table below | **Disclosure of what may activate after READY** |

---

## 2. Provider mapping

| Sağlayıcı | Amaç | Veri türü (örnek) | Bölge | Retention (işletmeci politikası) |
|-----------|------|-------------------|-------|--------------------------------|
| **OpenAI** | AI yanıt / tamamlama | Metin girdisi, oturum metadata | Yurtdışı (ABD / global) | Sağlayıcı politikası + sözleşme; min. gerekli |
| **Anthropic** | AI inference / tamamlama | Metin girdisi, teknik log | Yurtdışı | Aynı |
| **Google** (Gemini / Cloud AI) | Model servisleri | Metin, API metadata | Yurtdışı / AB (hizmete göre) | Aynı |
| **xAI** | AI inference | Metin girdisi | Yurtdışı | Aynı |

**Aktarım hukuki çerçeve:** KVKK m.9 / GDPR Ch. V — açık rıza + SCC veya yeterlilik kararı (counsel onayı).

---

## 3. Purpose limitation

| Allowed when thawed | Not allowed |
|---------------------|-------------|
| Kullanıcı talep ettiği AI özellikleri | Profilleme / reklam satışı |
| Hata ayıklama (sınırlı log) | Çekirdek durum (L1) için bağlayıcı otomatik karar |
| Güvenlik kötüye kullanım | Veri satışı |

---

## 4. User-facing disclosure

- Ingress: [`/legal/ai-open-consent-tr.html`](../../apps/client/public/legal/ai-open-consent-tr.html)  
- Açık rıza metni: [`RHIZOH_OPEN_CONSENT_AI_CROSSBORDER_TR_V1.0.md`](RHIZOH_OPEN_CONSENT_AI_CROSSBORDER_TR_V1.0.md)

---

*Provider mapping v1.0 — May 2026.*
