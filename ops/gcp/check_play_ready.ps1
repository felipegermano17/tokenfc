$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "tokenfc-blitz"
$gcloudCmd = (Get-Command gcloud.cmd -ErrorAction SilentlyContinue).Source
$castCmd = "C:\Users\user\.foundry\bin\cast.exe"
if (-not $gcloudCmd) {
  throw "gcloud.cmd nao encontrado no PATH"
}

$checks = New-Object System.Collections.Generic.List[object]

function Invoke-Gcloud {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  $escapedArgs = $Args | ForEach-Object {
    if ($_ -match '[\s"]') {
      '"' + ($_ -replace '"', '\"') + '"'
    } else {
      $_
    }
  }
  $command = '"' + $gcloudCmd + '" ' + ($escapedArgs -join ' ') + ' 2>nul'
  cmd.exe /d /c $command
}

function Add-Check {
  param(
    [string]$Category,
    [string]$Name,
    [bool]$Ok,
    [string]$Detail
  )

  $checks.Add([pscustomobject]@{
    Category = $Category
    Name = $Name
    Status = if ($Ok) { "READY" } else { "MISSING" }
    Detail = $Detail
  })
}

function Secret-Has-Version {
  param([string]$SecretName)
  $versions = @(Invoke-Gcloud secrets versions list $SecretName "--format=value(name)") | Where-Object { $_ }
  return $versions.Count -gt 0
}

function Get-SecretValue {
  param([string]$SecretName)
  return (Invoke-Gcloud secrets versions access latest --secret=$SecretName).Trim()
}

$project = (Invoke-Gcloud config get-value project).Trim()
Add-Check -Category "gcp" -Name "project" -Ok ($project -eq "zap--advogado") -Detail $project

$sqlState = (Invoke-Gcloud sql instances describe tokenfc-blitz-db "--format=value(state)").Trim()
Add-Check -Category "gcp" -Name "cloud_sql" -Ok ($sqlState -eq "RUNNABLE") -Detail $sqlState

foreach ($queue in @("tokenfc-blitz-onboarding", "tokenfc-blitz-topup", "tokenfc-blitz-chain-actions")) {
  $queueName = (Invoke-Gcloud tasks queues describe $queue --location=southamerica-east1 "--format=value(name)").Trim()
  Add-Check -Category "gcp" -Name $queue -Ok (-not [string]::IsNullOrWhiteSpace($queueName)) -Detail $queueName
}

$bucket = (Invoke-Gcloud storage buckets list "--filter=name:zap-advogado-tokenfc-blitz-assets" "--format=value(name)").Trim()
$bucketOk = $bucket -eq "gs://zap-advogado-tokenfc-blitz-assets" -or $bucket -eq "zap-advogado-tokenfc-blitz-assets"
Add-Check -Category "gcp" -Name "assets_bucket" -Ok $bucketOk -Detail $bucket

foreach ($secret in @(
  "tokenfc-blitz-database-url",
  "tokenfc-blitz-monad-rpc-url",
  "tokenfc-blitz-deployer-private-key",
  "tokenfc-blitz-operator-private-key",
  "tokenfc-blitz-privy-app-id",
  "tokenfc-blitz-privy-app-secret"
)) {
  Add-Check -Category "secret" -Name $secret -Ok (Secret-Has-Version -SecretName $secret) -Detail $secret
}

if ((Secret-Has-Version -SecretName "tokenfc-blitz-monad-rpc-url") -and
    (Secret-Has-Version -SecretName "tokenfc-blitz-deployer-private-key") -and
    (Secret-Has-Version -SecretName "tokenfc-blitz-operator-private-key")) {
  $rpcUrl = Get-SecretValue -SecretName "tokenfc-blitz-monad-rpc-url"

  $deployerPk = Get-SecretValue -SecretName "tokenfc-blitz-deployer-private-key"
  $deployerAddress = (& $castCmd wallet address $deployerPk).Trim()
  $deployerWei = (& $castCmd balance --rpc-url $rpcUrl $deployerAddress).Trim()
  $deployerReady = [bigint]$deployerWei -gt [bigint]0
  Add-Check -Category "wallet" -Name "deployer_funded" -Ok $deployerReady -Detail $deployerAddress

  $operatorPk = Get-SecretValue -SecretName "tokenfc-blitz-operator-private-key"
  $operatorAddress = (& $castCmd wallet address $operatorPk).Trim()
  $operatorWei = (& $castCmd balance --rpc-url $rpcUrl $operatorAddress).Trim()
  $operatorReady = [bigint]$operatorWei -gt [bigint]0
  Add-Check -Category "wallet" -Name "operator_funded" -Ok $operatorReady -Detail $operatorAddress
}

$ready = -not ($checks | Where-Object { $_.Status -ne "READY" })

Write-Output ""
Write-Output "PLAY_READY=$ready"
Write-Output ""
$checks | Format-Table -AutoSize
