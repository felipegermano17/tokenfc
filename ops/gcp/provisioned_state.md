# Provisioned State - Token F.C. no projeto zap--advogado

Status consolidado da preparacao operacional realizada.

Data:

- `2026-03-21`

Projeto:

- `zap--advogado`

Configuracao dedicada:

- `tokenfc-blitz`

Regiao principal:

- `southamerica-east1`

---

# 1. APIs habilitadas

Confirmadas para o Token F.C.:

- `run.googleapis.com`
- `sqladmin.googleapis.com`
- `secretmanager.googleapis.com`
- `cloudtasks.googleapis.com`
- `storage.googleapis.com`
- `artifactregistry.googleapis.com`
- `cloudbuild.googleapis.com`
- `logging.googleapis.com`
- `monitoring.googleapis.com`

---

# 2. Service accounts criadas

- `tokenfc-blitz-web-sa@zap--advogado.iam.gserviceaccount.com`
- `tokenfc-blitz-api-sa@zap--advogado.iam.gserviceaccount.com`
- `tokenfc-blitz-worker-sa@zap--advogado.iam.gserviceaccount.com`

---

# 3. Artifact Registry criado

- repositorio: `tokenfc-blitz`
- location: `southamerica-east1`
- format: `DOCKER`

---

# 4. Bucket criado

- `gs://zap-advogado-tokenfc-blitz-assets`

Configuracao:

- `uniform bucket level access`: ativo
- `public access prevention`: enforced
- labels aplicadas

---

# 5. Filas criadas

- `tokenfc-blitz-onboarding`
- `tokenfc-blitz-topup`
- `tokenfc-blitz-chain-actions`

Location:

- `southamerica-east1`

---

# 6. Secrets criados

- `tokenfc-blitz-database-url`
- `tokenfc-blitz-privy-app-id`
- `tokenfc-blitz-privy-app-secret`
- `tokenfc-blitz-monad-rpc-url`
- `tokenfc-blitz-deployer-private-key`
- `tokenfc-blitz-operator-private-key`

Observacao:

- `tokenfc-blitz-database-url`: container criado e versao `1` ja gravada
- `tokenfc-blitz-monad-rpc-url`: versao `1` ja gravada com o RPC publico oficial da testnet
- `tokenfc-blitz-deployer-private-key`: versao `1` ja gravada
- `tokenfc-blitz-operator-private-key`: versao `1` ja gravada
- `tokenfc-blitz-privy-app-id`: versao `1` ja gravada
- `tokenfc-blitz-privy-app-secret`: versao `1` ja gravada

---

# 7. Cloud SQL criado

- instancia: `tokenfc-blitz-db`
- database version: `POSTGRES_16`
- edition: `enterprise`
- tier: `db-custom-1-3840`
- region: `southamerica-east1`
- zone: `southamerica-east1-a`
- connection name: `zap--advogado:southamerica-east1:tokenfc-blitz-db`
- database criada: `tokenfc`
- usuario criado: `tokenfc_app`
- labels aplicadas

Observacao:

- a `DATABASE_URL` operacional do app foi gravada no Secret Manager
- a senha do usuario fica apenas no valor atual do secret, nao em arquivo local

---

# 8. Wallets operacionais criadas

- `deployer`: endereco salvo em [wallet_inventory.md](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\wallet_inventory.md)
- `operator`: endereco salvo em [wallet_inventory.md](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\wallet_inventory.md)

Regra:

- private keys ficam apenas no `Secret Manager`
- enderecos podem ser usados para faucet e observabilidade
- o faucet da `Monad Testnet` e apenas fallback operacional

---

# 9. IAM minimo ja aplicado

## Projeto

API:

- `roles/cloudtasks.enqueuer`
- `roles/cloudsql.client`

Worker:

- `roles/cloudsql.client`

## Bucket

Leitura de objetos para:

- `tokenfc-blitz-api-sa`
- `tokenfc-blitz-worker-sa`

## Secrets

`roles/secretmanager.secretAccessor` para:

- `tokenfc-blitz-api-sa`
- `tokenfc-blitz-worker-sa`

---

# 10. O que ainda propositalmente nao foi criado

- servicos do `Cloud Run`
- imagens no bucket
- deploy dos contratos
- funding de `MON` nas wallets `deployer` e `operator`

Esses itens ficam para o momento certo do hackathon ou para quando voce quiser explicitamente executar essa etapa.
