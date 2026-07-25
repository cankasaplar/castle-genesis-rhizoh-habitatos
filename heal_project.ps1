# heal_project.ps1

# 1. Proje dosyalarını oku
$types = Get-Content src/types.rs -Raw
$magic = Get-Content src/magic.rs -Raw
$board = Get-Content src/board.rs -Raw

# 2. Derleme hatasını simüle et/al (veya ajana bağlamı ver)
$system_prompt = @"
You are an expert Rust systems architect. Your job is to fix the compiler errors in 'src/board.rs'.
The errors occur because the previous implementation used fields like 'board.pawns' or 'board.occupied' which do not exist.
You must use ONLY the structures defined in 'src/types.rs'.

Here is 'src/types.rs':
$types

Here is 'src/magic.rs' (contains attack helpers):
$magic

Please rewrite 'src/board.rs' completely so that:
1. It compiles perfectly with no errors.
2. The 'generate_moves' function produces pseudo-legal moves for PAWNS, KNIGHTS, and KINGS using the correct bitboard structures.
3. It has the 'perft' function implemented correctly.

Return ONLY the raw Rust code for 'src/board.rs'. Do not wrap it in markdown blockquotes or add explanations.
"@

Write-Host "[Rhizoh Agent] Querying local qwen2.5-coder to heal board.rs..." -ForegroundColor Cyan

$payload = @{
    model = "qwen2.5-coder:7b"
    prompt = $system_prompt
    stream = $false
} | ConvertTo-Json -Compress

# UTF8 encoding ile payload'u hazırla
$response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($payload)) -ContentType "application/json; charset=utf-8"

if ($response.response) {
    # Markdown kod bloklarını temizle (eğer ajan inatla eklediyse)
    $clean_code = $response.response -replace "(?s)```rust\s*", ""
    $clean_code =$clean_code -replace "(?s)```\s*$", ""
    $clean_code = $clean_code.Trim()

    $clean_code | Out-File -FilePath src/board.rs -Encoding utf8
    Write-Host "[Success] board.rs has been healed by the agent!" -ForegroundColor Green
    
    Write-Host "[Compiling] Running cargo check to verify..." -ForegroundColor Yellow
    cargo check
} else {
    Write-Error "Failed to get response from local Ollama."
}