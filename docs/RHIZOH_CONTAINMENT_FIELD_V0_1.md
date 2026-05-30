# Containment field — temporal epistemic classifier (V0.1)

**SPECFLOW:** `RESEARCH-ONLY`

**Durum:** Bu belge **executable contract değildir**; gateway veya client kodunun yerine geçmez. Amaç, `GenesisReplaySessionViewer` içindeki **containment** satırının arkasındaki kavramı — tek düğümde başlayıp çok düğüme taşınabilen **seq-uzayı sınıflandırıcısı** — resmi bir iskelet olarak sabitlemektir.

**İlişkili:** [`docs/RHIZOH_REPLAY_CONTRACT_V0.md`](docs/RHIZOH_REPLAY_CONTRACT_V0.md) · [`docs/RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md`](docs/RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md)

---

## 1. Temel ayrım

| Kavram | Ne değildir | Nedir |
|--------|-------------|--------|
| **Containment** | Truth, consensus, imza yeniden doğrulama | Aynı anda rapor edilen **kabul çizgisi** (`lastAcceptedSeq` ve eşanlamlısı) ile bir **seq segmenti** arasında **içerme** ilişkisinin gözlemlenmesi |
| **Containment divergence** (çok düğüm) | “Hangi veri doğru?” | “Hangi düğümün raporladığı **acceptance boundary** bu segmenti kapsıyor / kapsamıyor?” — **sınır uyumsuzluğu** |

UI yalnızca **sınıflandırır ve gösterir**; replay çalıştırmaz, yeni iddia üretmez, zinciri doğrulama otoritesi taşımaz.

---

## 2. Tek düğüm (V0 — mevcut UI ile uyumlu)

**Girdiler (gözlem anı):**

- Segment: kapalı aralık \([from, to]\) pozitif tamsayılar, \(from \leq to\).
- Gateway runtime snapshot: `genesisStream.lastAcceptedSeq` → \(L \in \mathbb{Z}_{\geq 0}\) veya eksik.

**İçerme (containment) — operatör:**

\[
\text{Contained}(from, to, L) \iff L \text{ tanımlı ve } to \leq L
\]

**Özel durumlar:**

- \(L\) yok / parse edilemiyor → **unknown** (içerme bilinmiyor; “false” değil).
- \((from, to)\) geçersiz → karşılaştırma yapılmaz.

Bu, **binary** bir gösterge olarak sunulabilir; fakat aşağıdaki “alan” okuması aynı bilginin zenginleştirilmesidir.

---

## 3. Çok düğüm (federasyon hazırlığı)

Düğüm \(i \in \{A, B, \ldots\}\) için aynı segment \([from, to]\) ve düğüme özgü \(L_i\) alınır.

Her düğüm için bağımsız:

\[
\text{Contained}_i \iff L_i \text{ tanımlı ve } to \leq L_i
\]

**Containment divergence:** \(\text{Contained}_A \neq \text{Contained}_B\) (veya biri unknown). Bu, **truth divergence** değildir; iki düğümün **aynı anda** raporladığı kabul çizgilerinin segmente göre **farklı sınıflandırma** üretmesidir.

Olası yorum (yürütme değil, gözlem notu): biri segmenti “kabul altında” görürken diğeri “raporlanan çizgiyi aşan” görür → operasyonel olarak **yeniden senkron**, **farklı shard**, veya **ölçüm anı** farkı gibi hipotezler **ayrı kanıt** ister.

---

## 4. Alan fonksiyonu (V0.1 hedef — UI rengi değil)

Binary contained / exceeds / unknown, **0. derece** bir **alan fonksiyonu** örneğidir:

\[
\phi_i(from, to) \in \{\texttt{unknown}, \texttt{exceeds}, \texttt{contained}\}
\]

**Timeline compression** (sonraki adım): aynı düğümde **range** (segment içi checkpoint projeksiyonu) ile **lineage** (≤ to nedensel önek) kesişiminin okunması → “**epistemic band**”: segmentin hem anlık kabul sınırına hem zincirde görünen **taşıyıcı checkpoint örtüşmesine** göre konumu. Bu, \(\phi\)’yı tek bit’ten **daha bilgiç** bir özet fonksiyonuna genişletir; yine **truth üretmez**.

---

## 5. Seq-space projection (gayri resmi)

**Projeksiyon uzayı:** monoton \(seq\) ekseni (kabul sırası). Checkpoint’ler bu eksende **anchor noktaları**; runtime snapshot **anlık üst sınır** \(L\) verir.

- **Segment projeksiyonu:** \([from, to] \subset \mathbb{Z}_{>0}\).
- **Boundary:** \(L\) ile yarım düzlem \(seq \leq L\) (gözlemlenen “şu ana kadar kabul edilmiş” üst sınır).

Containment: segmentin tamamının bu yarım düzlemde kalıp kalmadığıdır. Çok düğümde her \(i\) için \((L_i, \text{checkpoint set}_i)\) ayrı projeksiyon; **koordinat dönüşümü** (tek global seq) ancak ortak sözleşme ile tanımlanır — bu belgenin dışı.

---

## 6. UI / sistem yasaları (korunacak)

1. Containment göstergesi **yargı üretmez** (“checkpoint geçersiz” demez).
2. **410 / 503** gibi HTTP semantiği aynen gösterilir; UI yorumu metinle sınırlıdır.
3. Çok düğüm görünümü yalnızca **yan yana veya üst üste sınıflandırma**; birleştirilmiş “tek doğru” listesi yoktur.

---

## 7. Yol haritası (bu spec’ten sonraki iş)

| Adım | İçerik |
|------|--------|
| V0.2 (tek düğüm) | Range ∩ lineage özet bandı (timeline compression, read-only) |
| V0.3 (çok düğüm) | İkinci origin + \(\phi_A, \phi_B\) yan yana; dışa aktarılabilir JSON özet (opsiyonel) |
| Replay contract | [`docs/RHIZOH_REPLAY_CONTRACT_V0.md`](docs/RHIZOH_REPLAY_CONTRACT_V0.md) ile “replay-equivalent continuity” cümlesi hizalanır |

---

## 8. Özet cümle

Sistem olayları yalnızca “depolamıyor”; olayları ve ankorları, **gözlemlenen kabul çizgisi altında yeniden konumlandırılabilir** bir seq uzayında temsil ediyor. **Containment**, bu uzayda ilk **epistemik sınıflandırma operatörü**dür; çok düğümde aynı operatör **koordinat karşılaştırması** için taşınır.
