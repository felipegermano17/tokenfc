param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$global:PSNativeCommandUseErrorActionPreference = $false
$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "tokenfc-blitz"
Write-Host "Usando CLOUDSDK_ACTIVE_CONFIG_NAME=$env:CLOUDSDK_ACTIVE_CONFIG_NAME"
$gcloudCmd = (Get-Command gcloud.cmd -ErrorAction SilentlyContinue).Source
if (-not $gcloudCmd) {
    $gcloudCmd = "gcloud"
}
& $gcloudCmd @Args
