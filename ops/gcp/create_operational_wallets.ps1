param(
  [switch]$ForceRotate
)

$ErrorActionPreference = "Stop"

$walletScript = Join-Path $PSScriptRoot "create_wallet_secret.ps1"
$inventoryPath = Join-Path $PSScriptRoot "wallet_inventory.md"

$deployerOutput = & $walletScript -SecretName "tokenfc-blitz-deployer-private-key" -WalletRole "deployer" @PSBoundParameters
$operatorOutput = & $walletScript -SecretName "tokenfc-blitz-operator-private-key" -WalletRole "operator" @PSBoundParameters

function Get-Field {
  param(
    [string[]]$Lines,
    [string]$Name
  )

  $line = $Lines | Where-Object { $_ -like "$Name=*" } | Select-Object -First 1
  if (-not $line) {
    return ""
  }

  return $line.Substring($Name.Length + 1)
}

$deployerAddress = Get-Field -Lines $deployerOutput -Name "ADDRESS"
$operatorAddress = Get-Field -Lines $operatorOutput -Name "ADDRESS"
$deployerSecretVersion = Get-Field -Lines $deployerOutput -Name "LATEST_SECRET_VERSION"
$operatorSecretVersion = Get-Field -Lines $operatorOutput -Name "LATEST_SECRET_VERSION"

$inventory = @(
  "# Wallet Inventory - Token F.C.",
  "",
  "Data:",
  "",
  "- $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
  "",
  "Projeto:",
  "",
  "- zap--advogado",
  "",
  "Config do gcloud:",
  "",
  "- tokenfc-blitz",
  "",
  "## Wallets operacionais",
  "",
  "### Deployer",
  "",
  "- secret: tokenfc-blitz-deployer-private-key",
  "- latest version: $deployerSecretVersion",
  "- address: $deployerAddress",
  "- uso: deploy dos contratos na Monad Testnet",
  "",
  "### Operator",
  "",
  "- secret: tokenfc-blitz-operator-private-key",
  "- latest version: $operatorSecretVersion",
  "- address: $operatorAddress",
  "- uso: operacoes do worker e fallback operacional",
  "",
  "## Regras",
  "",
  "- private keys ficam apenas no Secret Manager",
  "- enderecos podem ser usados para faucet e observabilidade",
  "- nao reutilizar essas wallets como conta pessoal"
)

Set-Content -Path $inventoryPath -Value $inventory -Encoding ascii

Write-Output "DEPLOYER_ADDRESS=$deployerAddress"
Write-Output "OPERATOR_ADDRESS=$operatorAddress"
Write-Output "INVENTORY=$inventoryPath"
