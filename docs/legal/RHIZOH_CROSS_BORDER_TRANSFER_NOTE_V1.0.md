# Rhizoh — Yurtdışı Aktarım / SCC Notu v1.0 (Counsel)

**Durum:** Taslak — avukat onayı gerekir.  
**Kapsam:** KVKK m.9 odaklı; AB veri sahibi kitlesi genişlerse GDPR Chapter V ayrıca ele alınır.

---

## 1. Mevcut teknik gerçeklik

- **Data-plane kapalı:** Canlı kullanıcı ingest / heartbeat yok (`VITE_RHIZOH_PHASE1_SIGNAL` off).
- **AI sağlayıcıları:** Potansiyel işlemciler — kullanım yalnızca açık rıza + Phase thaw sonrası.
- Tablo: [`RHIZOH_AI_PROVIDER_MAPPING_V1.0.md`](RHIZOH_AI_PROVIDER_MAPPING_V1.0.md)

---

## 2. Hukuki katman (UI)

| Katman | Araç |
|--------|------|
| Aydınlatma | KVKK metni — aktarımın *mümkün* olduğu |
| Açık rıza | `ai-open-consent-tr.html` — ayrı checkbox |
| Çerez | Analytics varsayılan kapalı |

---

## 3. Önerilen yaklaşım (counsel doğrulaması)

**Türkiye (KVKK):**

- Yurtdışı aktarım: KVKK m.9 — **açık rıza** veya Kanun’daki diğer hukuki sebepler (counsel seçimi).
- Veri sorumlusu: Can Kasaplar — iletişim: cankasaplar@gmail.com.
- İşlemci sözleşmesi (DPA): Her aktif sağlayıcı için standart işlemci hükümleri + alt işlemci listesi.

**AB / GDPR (ileride, AB veri sahibi varsa):**

- **Standard Contractual Clauses (SCC)** — 2021 modülü (controller–processor veya processor–processor, akışa göre).
- **TIA (Transfer Impact Assessment)** — sağlayıcı ülkesi ve şifreleme/erişim pratikleri.
- Schrems II sonrası ek tedbirler counsel ile.

**Sağlayıcı örnekleri (yurtdışı bölge):**

| Sağlayıcı | Bölge (özet) | Counsel notu |
|-----------|--------------|--------------|
| OpenAI | ABD / global | DPA + SCC veya m.9 rıza |
| Anthropic | ABD | Aynı |
| Google (Gemini) | ABD / EU bölge seçimi | Bölge seçimi varsa kayıt |
| xAI | ABD | Aynı |

---

## 4. Repo dışı yapılacaklar (counsel sonrası)

- [ ] Her sağlayıcı ile imzalı DPA / SCC ekleri arşivi
- [ ] Aktarım envanteri (VERBİS / iç kayıt)
- [ ] Phase 1 thaw öncesi: hangi sağlayıcının *gerçekten* açılacağı whitelist

---

*Bu dosya hukuki tavsiye değildir; counsel paketine ek nottur.*
