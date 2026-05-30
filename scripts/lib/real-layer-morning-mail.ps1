function New-RealLayerMorningHtmlBody {
  param([string]$Today)

  $lines = @(
    "REAL LAYER MORNING"
    "rhizoh.com | $Today | 06:44"
    ""
    "Gozlem hatti acik. Canonical yazma yok."
    "observe != exec | seal(WAL)"
    ""
    "sabah esigi - sessiz yuzey"
    "-"
    "observation lane | non-authoritative"
  )
  $textBlock = ($lines | ForEach-Object {
    $escaped = [System.Net.WebUtility]::HtmlEncode($_)
    if ([string]::IsNullOrWhiteSpace($_)) { "<br/>" } else { "<p style=`"margin:0 0 10px;`">$escaped</p>" }
  }) -join "`n"

  @"
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <meta charset="utf-8"/>
</head>
<body style="margin:0;padding:0;background:#0b1d2a;color:#8ecae6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0b1d2a;">
    <tr>
      <td align="center" style="padding:28px 16px 32px;font-family:Georgia,serif;font-size:14px;line-height:1.5;max-width:520px;">
        $textBlock
      </td>
    </tr>
  </table>
</body>
</html>
"@
}
