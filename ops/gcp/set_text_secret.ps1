param(
  [Parameter(Mandatory = $true)]
  [string]$SecretName,

  [Parameter(Mandatory = $true)]
  [string]$Value
)

$ErrorActionPreference = "Stop"

$wrapper = Join-Path $PSScriptRoot "gcloud_tokenfc.ps1"
$tempFile = [System.IO.Path]::GetTempFileName()

try {
  Set-Content -Path $tempFile -Value $Value -NoNewline -Encoding ascii
  & $wrapper secrets versions add $SecretName --data-file=$tempFile | Out-Null
} finally {
  if (Test-Path $tempFile) {
    Remove-Item $tempFile -Force
  }
}

$latestVersion = (& $wrapper secrets versions list $SecretName "--format=value(name)" --limit=1).Trim()

Write-Output "SECRET=$SecretName"
Write-Output "LATEST_SECRET_VERSION=$latestVersion"
