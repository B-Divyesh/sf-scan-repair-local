$ErrorActionPreference = 'Stop'
$repo = 'B-Divyesh/sf-scan-repair-local'; $base = "https://github.com/$repo/releases/latest/download"; $manifest = Invoke-RestMethod "$base/latest.json"; $asset = Split-Path -Leaf $manifest.platforms.windows.url
$dir = Join-Path $env:TEMP 'scan-repair-local'; New-Item -Force -ItemType Directory $dir | Out-Null
Invoke-WebRequest "$base/SHA256SUMS" -OutFile "$dir\SHA256SUMS"; Invoke-WebRequest "$base/$asset" -OutFile "$dir\$asset"
$expected = ((Get-Content "$dir\SHA256SUMS") | Where-Object { $_ -match [regex]::Escape($asset) } | Select-Object -First 1).Split(' ')[0]
$actual = (Get-FileHash "$dir\$asset" -Algorithm SHA256).Hash.ToLower()
if ($expected.ToLower() -ne $actual) { throw 'Checksum verification failed.' }
Write-Host "Checksum verified. Starting unsigned installer: $asset"; Start-Process "$dir\$asset" -Wait
