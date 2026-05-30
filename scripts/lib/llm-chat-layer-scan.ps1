function Get-ChatLayerDefinitions {
  return [ordered]@{
    file = @(
      'dosya', 'file', 'path', 'klasor', 'klasör', 'folder', 'zip', 'pdf', 'export', 'attachment', 'manifest'
    )
    text = @(
      'text', 'metin', 'paragraph', 'cümle', 'cumle', 'transcript', 'sohbet', 'chat'
    )
    comment = @(
      'yorum', 'comment', 'feedback', 'eleştiri', 'elestiri', 'review', 'not:', 'değerlendirme'
    )
    meaning = @(
      'anlam', 'meaning', 'semantic', 'kavram', 'ontology', 'narrative', 'yorumlama', 'interpretation'
    )
    fun = @(
      'eğlence', 'eglence', 'fun', 'oyun', 'game', 'humor', 'eğlenceli', 'eglenceli', 'playful'
    )
    music = @(
      'müzik', 'muzik', 'music', 'audio', 'şarkı', 'sarki', 'song', 'beat', 'soundtrack'
    )
    art = @(
      'sanat', 'art', 'görsel', 'gorsel', 'visual', 'design', 'aesthetic', 'estetik', 'canvas'
    )
    sport = @(
      'spor', 'sport', 'futbol', 'basket', 'maç', 'mac', 'fitness', 'antrenman', 'takım'
    )
    competition = @(
      'rekabet', 'competition', 'yarış', 'yaris', 'rank', 'leaderboard', ' vs ', 'rakip', 'score'
    )
    real_layer = @(
      'real layer', 'real_layer', 'weather', 'traffic', 'cesium', 'gps', 'gerçek', 'gercek', 'satellite', 'ingress', 'wgs84'
    )
  }
}

function Scan-ChatLayers {
  param([string]$Text)
  $defs = Get-ChatLayerDefinitions
  $lower = $Text.ToLowerInvariant()
  $hits = @{}
  $total = 0

  foreach ($layerId in $defs.Keys) {
    $score = 0
    foreach ($kw in $defs[$layerId]) {
      if ($lower.Contains($kw.ToLowerInvariant())) {
        $score++
      }
    }
    $hits[$layerId] = $score
    $total += $score
  }

  $primary = @(
    $hits.GetEnumerator() |
      Where-Object { $_.Value -gt 0 } |
      Sort-Object Value -Descending |
      Select-Object -First 3 |
      ForEach-Object { $_.Key }
  )

  [PSCustomObject]@{
    layer_hits = $hits
    layer_primary = ($primary -join ',')
    layer_hit_total = $total
  }
}

function Format-LayerHitsYaml {
  param([hashtable]$Hits)
  $parts = @()
  foreach ($k in $Hits.Keys | Sort-Object) {
    $parts += "$k=$($Hits[$k])"
  }
  return ($parts -join ';')
}
