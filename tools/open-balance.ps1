$ErrorActionPreference = 'Stop'
$balanceRoot = Split-Path -Parent $PSScriptRoot
$balanceNode = Join-Path $balanceRoot '.tools\node-v24.21.0-win-x64\node.exe'
if (-not (Test-Path -LiteralPath $balanceNode)) {
    $balanceNode = (Get-Command node.exe -ErrorAction Stop).Source
}
$balancePort = 4180
$balanceUrl = "http://127.0.0.1:$balancePort/balance"
$balanceRunning = $false
try {
    $balanceResponse = Invoke-WebRequest -UseBasicParsing -Uri "$balanceUrl/api" -TimeoutSec 2
    $balanceRunning = $balanceResponse.StatusCode -eq 200
} catch { }
if (-not $balanceRunning) {
    $env:BALANCE_PORT = [string]$balancePort
    $balanceLog = Join-Path $balanceRoot '.tools'
    New-Item -ItemType Directory -Path $balanceLog -Force | Out-Null
    Start-Process -FilePath $balanceNode -ArgumentList 'tools/balance-server.mjs' -WorkingDirectory $balanceRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $balanceLog 'balance-server.log') -RedirectStandardError (Join-Path $balanceLog 'balance-server-error.log')
    for ($balanceAttempt = 0; $balanceAttempt -lt 30; $balanceAttempt++) {
        try {
            $balanceResponse = Invoke-WebRequest -UseBasicParsing -Uri "$balanceUrl/api" -TimeoutSec 1
            if ($balanceResponse.StatusCode -eq 200) { $balanceRunning = $true; break }
        } catch { Start-Sleep -Milliseconds 200 }
    }
}
if (-not $balanceRunning) { throw 'Khong mo duoc bang can bang. Xem .tools/balance-server-error.log.' }
try { Start-Process $balanceUrl }
catch { Write-Host "Bang da chay. Mo trinh duyet tai: $balanceUrl" }
