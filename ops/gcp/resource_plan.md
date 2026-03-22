# Resource Plan - Token F.C. no GCP

Projeto:

- `zap--advogado`

Regiao principal:

- `southamerica-east1`

---

# 1. Recursos alvo

## Cloud Run

- `tokenfc-blitz-web`
- `tokenfc-blitz-api`
- `tokenfc-blitz-worker`

## Cloud SQL

- `tokenfc-blitz-db`
- database `tokenfc`
- usuario `tokenfc_app`
- connection name `zap--advogado:southamerica-east1:tokenfc-blitz-db`

## Cloud Storage

- `zap-advogado-tokenfc-blitz-assets`

## Cloud Tasks

- `tokenfc-blitz-onboarding`
- `tokenfc-blitz-topup`
- `tokenfc-blitz-chain-actions`

## Secret Manager

- secrets com prefixo `tokenfc-blitz-`

---

# 2. Ordem de provisionamento recomendada

1. habilitar APIs
2. criar service accounts dedicadas
3. criar bucket de assets
4. criar fila de tasks
5. criar containers de secrets
6. criar Cloud SQL
7. subir `api`
8. subir `worker`
9. subir `web`

Estado atual:

- APIs: prontas
- service accounts: prontas
- bucket: pronto
- filas: prontas
- Cloud SQL: pronto
- `tokenfc-blitz-database-url`: preenchido

---

# 3. Padrao de labels

Aplicar em todos os recursos possiveis:

- `app=tokenfc`
- `track=hackathon`
- `workspace=blitz`
- `owner=codex`
- `system=tokenfc-platform`

---

# 4. Principio de isolamento

Mesmo estando dentro do projeto `zap--advogado`, o Token F.C. deve ser reconhecivel por:

- nome
- labels
- service accounts
- secrets
- bucket
- filas

Isso facilita:

- limpeza posterior
- observabilidade
- custo
- evitacao de colisao com outros servicos
