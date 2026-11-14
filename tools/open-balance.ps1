param([ValidateSet('balance','opponents','guardians')][string]$Page = 'balance')
$ErrorActionPreference = 'Stop'
$balanceRoot = Split-Path -Parent $PSScriptRoot
$balanceNode = Join-Path $balanceRoot '.tools\node-v24.21.0-win-x64\node.exe'
if (-not (Test-Path -LiteralPath $balanceNode)) {
    $balanceNode = (Get-Command node.exe -ErrorAction Stop).Source
}
$balancePort = 4180
$balanceUrl = "http://127.0.0.1:$balancePort/$Page"
$balanceRunning = $false
$balanceUpgrade = $false
$balanceRevision = (& $balanceNode (Join-Path $balanceRoot 'tools\balance-server.mjs') --revision | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $balanceRevision) { throw 'Khong doc duoc phien ban bang can bang. Kiem tra tep du an.' }
try {
    $balanceResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$balancePort/balance/api" -TimeoutSec 2
    $balanceRunning = $balanceResponse.StatusCode -eq 200
    if ($balanceRunning) {
        try {
            $balanceHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$balancePort/health" -TimeoutSec 2
            $balanceUpgrade = $balanceHealth.app -ne 'cuu-an-balance' -or $balanceHealth.revision -ne $balanceRevision
            if (-not $balanceUpgrade) { $null = Invoke-WebRequest -UseBasicParsing -Uri "$balanceUrl/api" -TimeoutSec 2 }
        }
        catch { $balanceUpgrade = $true }
    }
} catch { }
if ($balanceUpgrade) {
    $balanceOwner = Get-NetTCPConnection -LocalPort $balancePort -State Listen -ErrorAction Stop | Select-Object -First 1 -ExpandProperty OwningProcess
    $balanceProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $balanceOwner"
    $balanceOwnedNode = [IO.Path]::GetFullPath($balanceNode).StartsWith($balanceRoot + '\', [StringComparison]::OrdinalIgnoreCase)
    $balanceOwnedCommand = $balanceProcess.CommandLine -match [regex]::Escape($balanceRoot)
    if ($balanceProcess.ExecutablePath -eq $balanceNode -and $balanceProcess.CommandLine -match 'tools[\\/]balance-server\.mjs' -and ($balanceOwnedNode -or $balanceOwnedCommand)) {
        Stop-Process -Id $balanceOwner -ErrorAction Stop
        $balanceRunning = $false
    } else {
        throw 'Cong 4180 dang chay ban cu hoac chuong trinh khac. Dong may chu bang can bang cu roi mo lai.'
    }
}
if (-not $balanceRunning) {
    $env:BALANCE_PORT = [string]$balancePort
    $balanceLog = Join-Path $balanceRoot '.tools'
    New-Item -ItemType Directory -Path $balanceLog -Force | Out-Null
    Start-Process -FilePath $balanceNode -ArgumentList ('"' + (Join-Path $balanceRoot 'tools\balance-server.mjs') + '"') -WorkingDirectory $balanceRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $balanceLog 'balance-server.log') -RedirectStandardError (Join-Path $balanceLog 'balance-server-error.log')
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
