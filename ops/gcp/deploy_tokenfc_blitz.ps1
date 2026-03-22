param(
  [string]$ProjectId = "zap--advogado",
  [string]$Region = "southamerica-east1",
  [string]$ArtifactRepo = "tokenfc-blitz",
  [string]$ApiService = "tokenfc-blitz-api",
  [string]$WorkerService = "tokenfc-blitz-worker",
  [string]$WebService = "tokenfc-blitz-web"
)

$ErrorActionPreference = "Stop"

function Invoke-Gcloud {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  $output = & gcloud @Args

  if ($LASTEXITCODE -ne 0) {
    throw "gcloud failed: gcloud $($Args -join ' ')"
  }

  return $output
}

$gitSha = (git rev-parse --short HEAD).Trim()
$registryBase = "$Region-docker.pkg.dev/$ProjectId/$ArtifactRepo"
$apiImage = "$registryBase/api:$gitSha"
$workerImage = "$registryBase/worker:$gitSha"
$webImage = "$registryBase/web:$gitSha"
$cloudSqlInstance = "${ProjectId}:${Region}:tokenfc-blitz-db"
$apiServiceAccount = "tokenfc-blitz-api-sa@$ProjectId.iam.gserviceaccount.com"
$workerServiceAccount = "tokenfc-blitz-worker-sa@$ProjectId.iam.gserviceaccount.com"
$webServiceAccount = "tokenfc-blitz-web-sa@$ProjectId.iam.gserviceaccount.com"
$privyAppId = (Invoke-Gcloud secrets versions access latest --secret=tokenfc-blitz-privy-app-id --project=$ProjectId).Trim()

Write-Host "Building API image: $apiImage"
Invoke-Gcloud builds submit `
  --project=$ProjectId `
  --config=cloudbuild.tokenfc.yaml `
  "--substitutions=_DOCKERFILE=apps/api/Dockerfile,_IMAGE=$apiImage" `
  .

Write-Host "Building worker image: $workerImage"
Invoke-Gcloud builds submit `
  --project=$ProjectId `
  --config=cloudbuild.tokenfc.yaml `
  "--substitutions=_DOCKERFILE=apps/worker/Dockerfile,_IMAGE=$workerImage" `
  .

Write-Host "Building web image: $webImage"
Invoke-Gcloud builds submit `
  --project=$ProjectId `
  --config=cloudbuild.tokenfc.yaml `
  "--substitutions=_DOCKERFILE=apps/web/Dockerfile,_IMAGE=$webImage" `
  .

Write-Host "Deploying worker service: $WorkerService"
Invoke-Gcloud run deploy $WorkerService `
  --project=$ProjectId `
  --region=$Region `
  --platform=managed `
  --image=$workerImage `
  --service-account=$workerServiceAccount `
  --add-cloudsql-instances=$cloudSqlInstance `
  "--set-secrets=DATABASE_URL=tokenfc-blitz-database-url:latest,MONAD_RPC_URL=tokenfc-blitz-monad-rpc-url:latest,MONAD_OPERATOR_PRIVATE_KEY=tokenfc-blitz-operator-private-key:latest" `
  --memory=1Gi `
  --cpu=1 `
  --concurrency=10 `
  --max-instances=2 `
  --no-allow-unauthenticated

Invoke-Gcloud run services add-iam-policy-binding $WorkerService `
  --project=$ProjectId `
  --region=$Region `
  --member="serviceAccount:$apiServiceAccount" `
  --role="roles/run.invoker"

$workerUrl = (Invoke-Gcloud run services describe $WorkerService --project=$ProjectId --region=$Region --format="value(status.url)").Trim()

Write-Host "Deploying API service: $ApiService"
Invoke-Gcloud run deploy $ApiService `
  --project=$ProjectId `
  --region=$Region `
  --platform=managed `
  --image=$apiImage `
  --service-account=$apiServiceAccount `
  --add-cloudsql-instances=$cloudSqlInstance `
  "--set-env-vars=WORKER_URL=$workerUrl" `
  "--set-secrets=DATABASE_URL=tokenfc-blitz-database-url:latest,PRIVY_APP_ID=tokenfc-blitz-privy-app-id:latest,PRIVY_APP_SECRET=tokenfc-blitz-privy-app-secret:latest" `
  --memory=1Gi `
  --cpu=1 `
  --concurrency=40 `
  --max-instances=4 `
  --allow-unauthenticated

$apiUrl = (Invoke-Gcloud run services describe $ApiService --project=$ProjectId --region=$Region --format="value(status.url)").Trim()

Write-Host "Deploying web service: $WebService"
Invoke-Gcloud run deploy $WebService `
  --project=$ProjectId `
  --region=$Region `
  --platform=managed `
  --image=$webImage `
  --service-account=$webServiceAccount `
  "--set-env-vars=API_URL=$apiUrl,PRIVY_APP_ID=$privyAppId" `
  --memory=1Gi `
  --cpu=1 `
  --concurrency=40 `
  --max-instances=4 `
  --allow-unauthenticated

$webUrl = (Invoke-Gcloud run services describe $WebService --project=$ProjectId --region=$Region --format="value(status.url)").Trim()

Write-Host ""
Write-Host "Deploy concluido"
Write-Host "worker_url=$workerUrl"
Write-Host "api_url=$apiUrl"
Write-Host "web_url=$webUrl"
