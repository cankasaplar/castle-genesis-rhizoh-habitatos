function Get-CohortObserverInviteHtml {
  param(
    [string]$InviteUrl = "https://rhizoh.com/?cohort=review&reviewer=metehan",
    [string]$ObserverName = "Metehan"
  )

  $fridaySteps = @(
    "Burada ne yapabilirsin?",
    "Kendi alanını kur",
    "Rhizoh sana nasıl tepki veriyor?"
  )
  $fridayList = ($fridaySteps | ForEach-Object { "<li>$_</li>" }) -join ""

  @"
<!DOCTYPE html>
<html lang="tr">
<body style="font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:560px;line-height:1.55">
  <p>Merhaba $ObserverName,</p>
  <p>Rhizoh&apos;a davetlisin — canlı bir dijital alan. Teknik detay yok; sadece dene ve hisset.</p>
  <p><a href="$InviteUrl" style="display:inline-block;padding:14px 22px;background:#5b21b6;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Rhizoh&apos;a gir</a></p>
  <p><strong>Ne yapabilirsin?</strong></p>
  <ul>
    <li>Rhizoh ile konuş</li>
    <li>Haritayı keşfet</li>
    <li>Alanını kurmayı dene</li>
    <li>Hissettiklerini not al</li>
  </ul>
  <p style="font-size:13px;color:#555">Oturum bitince sana kısa bir geri bildirim linki gelecek — birkaç cümle yeterli.</p>
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0"/>
  <p style="font-size:12px;color:#666"><strong>Ek — Friday gözlem scripti</strong> (senin için değil; sistem kontrol listesi):</p>
  <ol style="font-size:12px;color:#666">$fridayList</ol>
  <p style="font-size:12px;color:#888;margin-top:28px">Rhizoh · observe@rhizoh.com</p>
</body>
</html>
"@
}

function Get-CohortObserverInvitePlainText {
  param(
    [string]$InviteUrl = "https://rhizoh.com/?cohort=review&reviewer=metehan",
    [string]$ObserverName = "Metehan"
  )

@"
Merhaba $ObserverName,

Rhizoh'a davetlisin — canlı bir dijital alan.

Giriş: $InviteUrl

Ne yapabilirsin?
- Rhizoh ile konuş
- Haritayı keşfet
- Alanını kurmayı dene
- Hissettiklerini not al

Oturum bitince kısa bir geri bildirim linki gelecek.

Rhizoh · observe@rhizoh.com
"@
}

function Get-CohortObserverSystemBriefHtml {
  param(
    [string]$InviteUrl = "https://rhizoh.com/?cohort=review&reviewer=metehan",
    [string]$ObserverName = "Metehan"
  )

  @"
<!DOCTYPE html>
<html lang="tr">
<body style="font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:560px;line-height:1.55">
  <p>Merhaba $ObserverName,</p>
  <p><strong>Rhizoh nedir?</strong> Canlı bir dijital alan: harita üzerinde bir dünya, üstünde Rhizoh ile konuşma. Bir chatbot değil — <em>gözlem ve süreklilik</em> için tasarlanmış kapalı bir ön izleme (kohort).</p>
  <p><a href="$InviteUrl" style="display:inline-block;padding:14px 22px;background:#5b21b6;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Rhizoh&apos;a gir</a></p>
  <p><strong>İlk oturum (5–15 dk)</strong></p>
  <ul>
    <li><strong>Giriş:</strong> Google hesabınla (davet e-postası ile aynı adres)</li>
    <li><strong>Konuş:</strong> kısa bir soru sor; gerçek model yanıtı gelmeli</li>
    <li><strong>Harita:</strong> İstanbul kalibrasyon penceresi — sen başka şehirde olsan da normal</li>
    <li><strong>Not:</strong> hissettiklerini birkaç cümleyle yaz (oturum sonu link gelebilir)</li>
  </ul>
  <p><strong>Pratik ipuçları</strong></p>
  <ul style="font-size:14px;color:#333">
    <li>Chrome veya Edge; ekran kaydı kapalı</li>
    <li>Takılırsa: gizli pencere + sert yenileme (Ctrl+Shift+R)</li>
    <li>Üst bant <em>Bağlandı</em> yazmalı; kırmızı hata görürsen bize ekran görüntüsü</li>
  </ul>
  <p style="font-size:13px;color:#555">Sorun olursa bu maili yanıtla — Can.</p>
  <p style="font-size:12px;color:#888;margin-top:28px">Rhizoh · observe@rhizoh.com</p>
</body>
</html>
"@
}

function Get-CohortObserverSystemBriefPlainText {
  param(
    [string]$InviteUrl = "https://rhizoh.com/?cohort=review&reviewer=metehan",
    [string]$ObserverName = "Metehan"
  )

@"
Merhaba $ObserverName,

Rhizoh nedir?
Canlı bir dijital alan: harita + Rhizoh ile konuşma. Kapalı kohort ön izlemesi — gözlem için; klasik chatbot değil.

Giriş: $InviteUrl

İlk oturum (5–15 dk):
- Google ile giriş (davet e-postası ile aynı adres)
- Kısa bir soru sor
- Haritayı keşfet (ilk açılış İstanbul bölgesi — konumun farklı olabilir, sorun değil)
- Hissettiklerini not al

İpuçları: Chrome/Edge, ekran kaydı kapalı; takılırsa gizli pencere + Ctrl+Shift+R.

Sorun olursa yanıtla — Can.

Rhizoh · observe@rhizoh.com
"@
}
