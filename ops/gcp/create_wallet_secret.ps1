param(
  [Parameter(Mandatory = $true)]
  [string]$SecretName,

  [Parameter(Mandatory = $true)]
  [string]$WalletRole,

  [switch]$ForceRotate
)

$ErrorActionPreference = "Stop"

$wrapper = Join-Path $PSScriptRoot "gcloud_tokenfc.ps1"
$cast = "C:\Users\user\.foundry\bin\cast.exe"

$existingVersions = @(
  & $wrapper secrets versions list $SecretName "--format=value(name)" 2>$null
) | Where-Object { $_ }

if ($existingVersions.Count -gt 0 -and -not $ForceRotate) {
  $privateKey = (& $wrapper secrets versions access latest --secret=$SecretName).Trim()
  $address = (& $cast wallet address $privateKey).Trim()
  Write-Output "SECRET=$SecretName"
  Write-Output "ROLE=$WalletRole"
  Write-Output "ACTION=SKIPPED_EXISTING_VERSION"
  Write-Output "ADDRESS=$address"
  Write-Output "LATEST_SECRET_VERSION=$($existingVersions[0])"
  exit 0
}

$walletJson = & $cast wallet new --json | ConvertFrom-Json
$wallet = $walletJson[0]
$privateKey = $wallet.private_key
$address = $wallet.address

$tempFile = [System.IO.Path]::GetTempFileName()
try {
  Set-Content -Path $tempFile -Value $privateKey -NoNewline -Encoding ascii
  & $wrapper secrets versions add $SecretName --data-file=$tempFile | Out-Null
} finally {
  if (Test-Path $tempFile) {
    Remove-Item $tempFile -Force
  }
}

$latestVersion = (& $wrapper secrets versions list $SecretName "--format=value(name)" --limit=1).Trim()

Write-Output "SECRET=$SecretName"
Write-Output "ROLE=$WalletRole"
Write-Output "ACTION=CREATED"
Write-Output "ADDRESS=$address"
Write-Output "LATEST_SECRET_VERSION=$latestVersion"
