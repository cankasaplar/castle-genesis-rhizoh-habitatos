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
