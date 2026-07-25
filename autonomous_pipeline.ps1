# autonomous_pipeline.ps1
Write-Host "--- [Rhizoh Autonomous Automation & Healing Active] ---" -ForegroundColor Cyan

# 1. Mevcut kod bağlamını ve kuralları oku
$types = Get-Content src/types.rs -Raw
$magic = Get-Content src/magic.rs -Raw

# İlk prompt şablonu
$prompt = @"
You are an expert Rust software architect building a high-performance chess engine core.
You must implement 'src/board.rs'. It must use bitboards (u64) for pieces and occupancy, exactly mapping to the structures in 'src/types.rs'.

CRITICAL INSTRUCTIONS:
- Use board.pieces[color][piece_type] which is a u64 bitboard.
- Do NOT assume fields like board.pawns, board.rows, or board.cols exist.
- Implement 'generate_moves(&self) -> Vec<Move>' for at least Pawns, Knights, and Kings.
- Implement 'perft(&self, depth: u8) -> u64' recursively.

Here is 'src/types.rs' for reference:
$types

Here is 'src/magic.rs' for helper attack ray generation functions:
$magic

Return ONLY valid, raw Rust code for 'src/board.rs'. No markdown, no explanations.
"@

for ($i = 1; $i -le 5; $i++) {
    Write-Host "[Iteration $i] Requesting optimized src/board.rs from qwen2.5-coder..." -ForegroundColor Yellow
    
    $payload = @{ model = "qwen2.5-coder:7b"; prompt = $prompt; stream = $false } | ConvertTo-Json -Compress
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($payload)) -ContentType "application/json; charset=utf-8"
    
    if ($response.response) {
        $clean_code = $response.response -replace "(?s)```rust\s*", "" -replace "(?s)```\s*$", ""
        $clean_code.Trim() | Out-File -FilePath src/board.rs -Encoding utf8
        
        Write-Host "[Iteration $i] Compiling and verifying with cargo check..." -ForegroundColor Cyan
        $build_output = cargo check 2>&1 | Out-String
        
        if ($build_output -match "error") {
            Write-Host "[Compiler Alert] Errors found. Feeding errors back to the Agent for correction..." -ForegroundColor Red
            # Hatayı bularak bir sonraki döngüde ajana kural olarak besliyoruz (Feedback Loop)
            $prompt = "The previous code generated these compilation errors. Please fix them completely while preserving the bitboard logic:\n\n$build_output\n\nOriginal instructions and context remain the same."
        } else {
            Write-Host "[Success] Core compiled successfully with NO errors! Layer 0 is stabilized." -ForegroundColor Green
            break
        }
    }
}