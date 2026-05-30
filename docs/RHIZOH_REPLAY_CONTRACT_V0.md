# Rhizoh replay contract (continuity equivalence) — V0

**SPECFLOW:** `RESEARCH-ONLY`

**Durum:** Bu belge **yürütme motoru değildir**. Executable gerçeklik repo + CI + gateway kodudur. Amaç, mevcut genesis süreklilik hattı (`continuitySeq`, SSE ring, signed checkpoint, JSONL, query projeksiyonları, replay fingerprint) üzerinde **“hangi koşullarda aynı süreklilik sayılır?”** sorusuna resmi bir çerçeve oturtmak ve ileride federasyon / çok düğüm karşılaştırması için **sözleşme iskeleti** bırakmaktır.

**İlişkili (canonical / operasyon):** [`docs/RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md`](RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md), [`docs/RHIZOH_CONTAINMENT_FIELD_V0_1.md`](RHIZOH_CONTAINMENT_FIELD_V0_1.md), [`docs/RHIZOH_PROJECTION_DISCIPLINE_V0.md`](RHIZOH_PROJECTION_DISCIPLINE_V0.md), [`docs/RHIZOH_RUNTIME_FRAME_CORRELATION_V0.md`](RHIZOH_RUNTIME_FRAME_CORRELATION_V0.md), [`docs/RHIZOH_SGRA_OPERATIONAL_MAP_V0.md`](RHIZOH_SGRA_OPERATIONAL_MAP_V0.md).

---

## 1. Merkez tanım (hedef)

**Replay contract:** İki gözlem veya iki süreç çıktısı, **aynı süreklilik** (replay-equivalent continuity) olarak ne zaman kabul edilir?

Bu, “event’ler aynı mı?” sorusundan dar: taşıma katmanındaki bayt eşliği değil; **kabul edilen nedensel hat + iddia edilen durum yüzeyi + doğrulanabilir ankorlar** üzerinden tanımlanacak bir eşdeğerlik sınıfıdır.

---

## 2. Üçlü epistemik soru (katman → soru)

| Katman | Soru |
|--------|------|
| **Stream (SSE / ring)** | Ne gözlendi? (ephemeral perception; bounded catch-up) |
| **Checkpoint (signed assertion)** | Gateway bu süreklilik hattında **neyi iddia etti?** (audit claim; truth değil) |
| **Replay contract** | **Hangi koşullarda** iki taraf “aynı gerçeklik / aynı süreklilik” için **karşılaştırılabilir** sayılır? |

Federasyon başladığında kritik soru: **İki düğüm aynı continuity’den mi bahsediyor?** — cevap, önce replay contract ile **karşılaştırılabilir süreç** tanımına indirgenir; aksi halde yalnızca “birden fazla gateway” vardır.

---

## 3. Sözleşme maddeleri (V0 — açık uçlar / bağlanacak alanlar)

Aşağıdaki maddeler **şimdilik taahhüt değil**; CORE-ELIGIBLE’e taşınmadan önce kod + test + CI ile sıkılaştırılacak maddeler listesidir.

1. **Canonical replay window** — Hangi `seq` aralığı ve hangi artifact’ler (checkpoint satırları, head, runtime surface snapshot) “aynı deney”in parçası sayılır?
2. **Accepted divergence classes** — Hangi farklar replay-equivalence’i **kırar**, hangileri sınıflandırılmış “güvenli sapma” olarak kalır (ör. wall clock, gözlemci yokluğu, ring taşması)?
3. **Deterministic surface subset** — `buildGenesisRuntimeSurfacePayload` (veya eşdeğeri) içinden hangi alanlar eşdeğerlik için **zorunlu**, hangileri isteğe bağlı?
4. **Non-authoritative fields** — Hangi alanlar asla eşdeğerlik veya iddia doğrulamasına **girmemeli** (debug, telemetri, UI-only)?
5. **Replay-equivalent continuity definition** — `continuitySeq` ile “kabul çizgisi”nin eşdeğerlikteki yeri; gap semantiği ile birlikte (aşağıda).
6. **Fingerprint basis contract** — `ReplayFingerprint` / ilgili türevler: hangi girdiler hash’e girer, hangi sürüm şeması, ne zaman “yeniden hesap = farklı continuity” sayılır?
7. **Checkpoint validation precedence** — Zincir doğrulaması, imza, `prevLedgerRoot` → `ledgerRoot`, sorgu projeksiyonları: **hangi sıra / hangi başarısızlık** “replay reddi” üretir?
8. **Causal gap semantics** — Ring dışı kalan olaylar, restart, checkpoint aralığı: “gap” bilinçli iken iki taraf nasıl **aynı sözleşmeyi** kullanarak hizalanır?
9. **Ephemeral transport disclaimer** — SSE ring’in **kalıcı doğruluk taşımadığı**; replay contract’ın disk checkpoint + head + (tanımlanacak) surface alt kümesine dayanması.

---

## 4. Uygulama eşlemesi (bilgi amaçlı; bütünlük iddiası değil)

Gateway tarafında bugünkü somut parçalar (isimler repo içi referans): `genesisContinuityStreamHubV0`, `genesisContinuityCheckpointV0`, `genesisContinuityPersistenceV0`, `genesisContinuityHydrateBootV0`, `genesisCheckpointQueryV0`, `genesisReplayFingerprintV0`, `genesisRuntimeSurfaceV0`. Bu belge bunların **davranışını tek başına kilitlemez**; tersine, bu parçaların üzerine **hangi sözleşmenin yazılacağını** tanımlar.

---

## 5. Yol haritası (önerilen sıra)

| Ufuk | İş |
|------|-----|
| **Kısa** | Bu V0 metnini sprint / review ile sıkılaştırma; madde başına “kabul / red / TBD” tablosu. |
| **Orta** | Runtime’da küçük **doğrulama kancaları** (ör. surface alt kümesi hash, contract ihlali bayrakları); deterministik replay için **CI harness** (mevcut RDVH kültürü ile hizalanabilir). |
| **Uzun** | Federasyon öncesi **eligibility gate**: iki düğümün checkpoint lineage + tanımlı replay window üzerinden karşılaştırılabilirliği. |

---

## 6. Özet

Replay contract formalizasyonu, **temporal query cebirinden** önce geldiğinde mevcut epistemik çekirdeği **sıkıştırır**; federasyonu ise “çok gateway” olmaktan **karşılaştırılabilir epistemik süreç**e taşıma şansı verir. Bu V0, o sözleşmenin **ilk iskeletidir**; executable gerçeklik güncellemeleri ayrı, etiketli değişiklik setleriyle yapılmalıdır.
