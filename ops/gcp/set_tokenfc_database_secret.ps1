$ErrorActionPreference = "Stop"

$wrapper = Join-Path $PSScriptRoot "gcloud_tokenfc.ps1"
$instance = "tokenfc-blitz-db"
$dbName = "tokenfc"
$dbUser = "tokenfc_app"
$secretName = "tokenfc-blitz-database-url"

$passwordChars = (48..57) + (65..90) + (97..122)
$dbPassword = -join ($passwordChars | Get-Random -Count 32 | ForEach-Object { [char]$_ })

& $wrapper sql users set-password $dbUser --instance=$instance --password=$dbPassword | Out-Null

$connectionName = (& $wrapper sql instances describe $instance "--format=value(connectionName)").Trim()
$escapedPassword = [System.Uri]::EscapeDataString($dbPassword)
$socketHost = [System.Uri]::EscapeDataString("/cloudsql/$connectionName")
$databaseUrl = "postgresql://${dbUser}:${escapedPassword}@localhost/${dbName}?host=${socketHost}"

$tempFile = [System.IO.Path]::GetTempFileName()
try {
  Set-Content -Path $tempFile -Value $databaseUrl -NoNewline -Encoding ascii
  & $wrapper secrets versions add $secretName --data-file=$tempFile | Out-Null
} finally {
  if (Test-Path $tempFile) {
    Remove-Item $tempFile -Force
  }
}

$latestVersion = (& $wrapper secrets versions list $secretName "--format=value(name)" --limit=1).Trim()

Write-Output "INSTANCE=$instance"
Write-Output "DB=$dbName"
Write-Output "USER=$dbUser"
Write-Output "CONNECTION_NAME=$connectionName"
Write-Output "SECRET=$secretName"
Write-Output "LATEST_SECRET_VERSION=$latestVersion"
