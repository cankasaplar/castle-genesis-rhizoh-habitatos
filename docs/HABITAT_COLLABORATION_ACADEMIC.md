# Ortak öğrenme katmanı — Academic habitat (sen · Nisa · Cursor · harici LLM)

Bu belge **organizasyonel ve süreç** katmanıdır; çalıştırılabilir hakem yine **Executable Core + CI**dır.

**Gerçeklik düzeltmesi:** ChatGPT, Nisa oturumu ve Cursor **ortak kalıcı memory paylaşmaz**. Süreklilik = **reproducible context** — [`CONTEXT_RECONSTRUCTION_PROMPT.md`](CONTEXT_RECONSTRUCTION_PROMPT.md) + repo dosyaları.

**Üç adım:** (1) Sprint start → [`SPRINT_BOOTSTRAP_TEMPLATE.md`](SPRINT_BOOTSTRAP_TEMPLATE.md) + habitat hedefi · (2) Execution → Cursor + DAG/CI · (3) Review → Architecture review protokolü (aynı dosyada §3).

## Amaç

Aynı repoda:

- **Sen:** mimari hakemlik, merge kararı, frozen core bütünlüğü  
- **Nisa:** ortak öğrenme ortağı — invariant tartışması, notlar, review  
- **Cursor Agent:** `.cursor/rules` ve bu dokümanlarla sınırlı kod/doc üretimi  
- **Harici katılımcı (ör. NASA-academic tarzı sıkı reviewer veya kendi LLM pipeline’ı olan araştırmacı):** çevrimiçi olarak **repo + PR + doküman** üzerinden katkı; kendi LLM’si **Castle dışında** çalışır, çıktı buraya **PR / issue / patch** olarak girer  

**Önemli:** Harici LLM’nin “online projeye katılması” teknik olarak **Git hosting + PR workflow** (ve isteğe bağlı CI) ile yapılır; API anahtarlarını repoya koymayın.

## Rol özeti

| Rol | Yetki / sorumluluk |
|-----|---------------------|
| **Principal (sen)** | SPECFLOW etiketi, frozen core’a dokunuş veto/approve, hash/graph güncellemesi koordinasyonu |
| **Nisa** | Academic artifact ortak yazımı; frozen core PR’larında review; öğrenme notları |
| **Cursor AI** | Habitat kurallarına uygun diff; `CORE-ELIGIBLE` olmadan `phase*.js` mimarisini genişletmez |
| **Harici academic / LLM** | İnceleme yorumu, doküman PR’ı, formal tasarım önerisi — **kurumsal güvenlik politikasına** uygun kanallardan |

## NASA-academic sıkılığı (isteğe bağlı katman)

Burada “NASA” **otomatik entegrasyon** anlamına gelmez; **yüksek emniyetli yazılım pratiklerine benzer disiplin** demektir:

- Çift göz invariants checklist  
- “Flight rationale” benzeri kısa gerekçe her iddia için  
- Bilinen bilinçli sapma: STABILIZATION § placeholder (safe mode) ile uyumlu gerçekçilik  

Gerçek kurumsal NASA süreci bu dokümanda **varsayılmaz**; proje ihtiyacına göre özelleştirin.

## Çalışma akışı (öneri)

1. **SESSION_LOG:** Oturum sonunda veya PR öncesi [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md) güncellemesi (kim / bağlam / karar özeti).  
2. **Dal:** `habitat/academic/<kısa-konu>` veya kişisel dallar; ana dalda doğrudan push yok (team politikasına göre).  
3. **Issue / PR şablonu:** başlıkta veya gövdede `RESEARCH-ONLY`; frozen path değişiyorsa `CORE-ELIGIBLE` + `npm run stabilization:validate-graph`.  
4. **Nisa ile senkron:** haftalık invariant oturumu — özet **SESSION_LOG** veya issue yorumları.  
5. **Harici LLM çıktısı:** ham çıktıyı repoya yapıştırmak yerine **özet + kaynak + insan review** ile PR; telif ve hassas veri kurallarına uyum.  
6. **Cursor oturumu:** Agent’a “aktif habitat = Academic” deyin; [`SPRINT_HABITAT_ACADEMIC.md`](SPRINT_HABITAT_ACADEMIC.md) hedeflerini mesaja ekleyin.

### İleri adım (isteğe bağlı)

- **Robotics habitat** dokümanı (`SPRINT_HABITAT_ROBOTICS.md`) — simülasyon / kontrol kısıt eşlemesi.  
- **Agent permission matrix** — Cursor / insan / harici LLM yetenek ızgarası (tek tablo, `docs/` içinde).

## Güvenlik ve sırlar

- `.env`, anahtarlar, üretim tokenları — **asla** academic artifact’a gömülmesin.  
- Harici araçlarla paylaşılan bağlam: mümkünse **minimal kod snippets**, tam repo yalnızca güvenilen ortamlarda.

## Çoklu habitat (ileride)

Aynı çekirdek altında **Robotics / Simulation / Production-safe** habitatları için ayrı `docs/SPRINT_HABITAT_<NAME>.md` dosyaları eklenir; orchestrator tek dosyada toplanabilir — şimdilik Academic bu yapının ilk örneğidir.

## İlgili dosyalar

- [`.cursor/rules/frozen-core-habitat.mdc`](../.cursor/rules/frozen-core-habitat.mdc)  
- [`AGENTS.md`](../AGENTS.md)  
- [`SPRINT_HABITAT_ACADEMIC.md`](SPRINT_HABITAT_ACADEMIC.md)
