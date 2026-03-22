$config = "tokenfc-blitz"

Write-Host "Ativando configuracao gcloud: $config"
gcloud config configurations activate $config

Write-Host ""
Write-Host "Contexto atual:"
gcloud config list --format="text(core.account,core.project,run.region,compute.region)"
