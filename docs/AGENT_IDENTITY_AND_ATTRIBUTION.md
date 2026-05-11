# Agent identity, attribution & mühür (Castle / Rhizoh)

**Amaç:** Çoklu gözlemci ve araç ortamında **kimin ne ürettiği** ve **hangi katmanın otorite olduğu** karışmasın — “hızlıca kontrolsüz veri/ajan karmaşası”na düşülmesin.

---

## 1. Execution vs observation (otorite)

| Otorite türü | Kim / ne |
|--------------|----------|
| **Execution** | Frozen core kodu (**v562–v570**), onaylı merge, CI graf doğrulaması |
| **Observation / interpretation** | İnsan, Nisa oturumu, Cursor Agent önerileri, harici LLM, canlı feed — **doğrudan execution komutu değil** |

Kanonik kural (repoda birden fazla yerde tekrarlanır):

> **Agents may influence interpretation, never execution.**

İkinci kural ([`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)):

> **Observation may be aggregated. Execution may never be inferred.**

---

## 2. Kayıtlı ajan kimlikleri (repo dokümantasyonu için)

Bu tablo **süreç etiketidir**; GitHub’da ayrıca hesap/email kullanılır.

| Etiket | Anlam | Kalıcı kayıt |
|--------|--------|----------------|
| **Principal (human)** | Orchestrator, merge, mimari veto | Git commit author |
| **Cursor Agent** | Cursor IDE içindeki AI coding agent (bu workspace kurallarıyla) | Commit **Co-authored-by** veya PR açıklaması + [`SESSION_LOG`](academic/SESSION_LOG.md) |
| **ChatGPT / Nisa channel** | Harici sohbet — fikir ve metin | Özet PR/issue gövdesine yapıştırılır; ham log opsiyonel |
| **External LLM** | Üçüncü parti model çıktısı | Kaynak + özet + insan review |

**Cursor Agent — kayıt adı (önerilen):** `Cursor Agent (Castle)` veya commit satırı: `Co-authored-by: Cursor Agent <noreply@cursor.com>` — takım politikasına göre sabitleyin.

---

## 3. Mühür: bu sohbetten gelen repo değişiklikleri

**Özet:** Freeze, habitat, observation fabric, asset contract, layer expansion ve ilişki dokümanları **bu workspace’te Cursor Agent oturumlarıyla** üretilmiş / güncellenmiştir; **nihai onay** insan merge iledır.

**Teknik mühür:**

- Git history = birincil kanıt  
- [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md) = oturum düzeyi karar izi  
- Bu dosya = kimlik ve rol sınırları  

İnsan düzenlemesi yapıldığında commit mesajında belirtin.

### 3b. Attribution = forensic, never semantic authority

Büyüyen sistemlerde risk: iz kaydı zamanla **“yorum otoritesi”** gibi okunur — bu **decision bias** üretir (execution’a sızmadan önce bile).

| Doğru | Yanlış |
|-------|--------|
| Attribution **forensic metadata** — replayable provenance | Attribution **kim haklı** otoritesi |
| Git + SESSION_LOG = delil zinciri | En çok konuşan en doğru |

**Kural:** `provenance` alanları **audit / replay** içindir; tek başına **semantik doğruluk kaynağı** değildir ([`WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md) §6).

---

## 4. “Çoklu zeka” yerine doğru sınıf adı

Önerilen mimari isim:

**Multi-layer observational intelligence system**  
veya **Symbiotic Observational Field with Frozen Deterministic Core**

Kaçınılması gereken yanlış çağrışım: ortak **execution intelligence** — burada **yok**; **çoklu gözlem + tek deterministik çekirdek**.

---

## 5. İlgili belgeler

- [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)  
- [`LAYER_EXPANSION_PROTOCOL.md`](LAYER_EXPANSION_PROTOCOL.md)  
- [`WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md)  
- [`CONTEXT_RECONSTRUCTION_PROMPT.md`](CONTEXT_RECONSTRUCTION_PROMPT.md)  
