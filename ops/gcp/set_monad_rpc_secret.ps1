$ErrorActionPreference = "Stop"

$wrapper = Join-Path $PSScriptRoot "gcloud_tokenfc.ps1"
$secretName = "tokenfc-blitz-monad-rpc-url"
$rpcUrl = "https://testnet-rpc.monad.xyz"

$tempFile = [System.IO.Path]::GetTempFileName()
try {
  Set-Content -Path $tempFile -Value $rpcUrl -NoNewline -Encoding ascii
  & $wrapper secrets versions add $secretName --data-file=$tempFile | Out-Null
} finally {
  if (Test-Path $tempFile) {
    Remove-Item $tempFile -Force
  }
}

$latestVersion = (& $wrapper secrets versions list $secretName "--format=value(name)" --limit=1).Trim()

Write-Output "SECRET=$secretName"
Write-Output "VALUE=$rpcUrl"
Write-Output "LATEST_SECRET_VERSION=$latestVersion"
