# Checklist de Ambiente e Integracoes - Token F.C.

Este documento lista tudo que precisa estar pronto antes do inicio do hacking.

---

# 1. Contas e acessos

## GCP

- projeto criado
- billing ativo
- acesso de administrador confirmado
- regiao principal decidida

## Privy

- app criado
- login social habilitado
- dominios de desenvolvimento e producao mapeados
- acesso ao dashboard validado

## Monad

- RPC da testnet definido
- explorer definido
- carteira de deploy separada
- carteira admin separada
- faucet validado para `deployer` e `operator`
- faucet nao entra no fluxo do usuario

## GitHub

- dono do repositorio definido
- organizacao ou usuario decidido
- permissoes de push confirmadas

---

# 2. APIs do GCP para habilitar

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

# 3. Recursos a preparar

## Cloud Run

- servico `web`
- servico `api`
- servico `worker`

## Cloud SQL

- instancia `tokenfc-blitz-db`
- database `tokenfc`
- usuario `tokenfc_app`
- `DATABASE_URL` guardada em `tokenfc-blitz-database-url`

## Cloud Storage

- bucket de assets dos clubes
- bucket opcional de uploads internos

## Cloud Tasks

- fila para onboarding
- fila para topup
- fila para acoes onchain

## Secret Manager

- secrets de banco
- segredos da Privy
- chaves operacionais
- RPC URL privada, se aplicavel

---

# 4. Ferramentas locais

- `git`
- `node` LTS
- package manager do monorepo
- `foundry`
- `gcloud`
- editor configurado

---

# 5. Variaveis de ambiente sugeridas

Os nomes abaixo sao convencao interna sugerida para o projeto.

## Web

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `NEXT_PUBLIC_MONAD_CHAIN_ID`
- `NEXT_PUBLIC_MONAD_RPC_URL`

## API

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `PRIVY_APP_ID`
- `PRIVY_APP_SECRET`
- `MONAD_RPC_URL`
- `MONAD_CHAIN_ID`
- `TFC_TOKEN_ADDRESS`
- `CLUB_PASS_ADDRESS`
- `CLUB_CONTEST_ADDRESS`
- `GCP_PROJECT_ID`
- `GCP_REGION`
- `CLUB_ASSETS_BUCKET`

## Worker

- `DATABASE_URL`
- `MONAD_RPC_URL`
- `MONAD_CHAIN_ID`
- `DEPLOYER_PRIVATE_KEY`
- `OPERATOR_PRIVATE_KEY`
- `TFC_TOKEN_ADDRESS`
- `CLUB_PASS_ADDRESS`
- `CLUB_CONTEST_ADDRESS`
- `ONBOARDING_QUEUE_NAME`
- `TOPUP_QUEUE_NAME`
- `CHAIN_ACTIONS_QUEUE_NAME`

---

# 6. Segregacao de chaves e carteiras

Separar pelo menos:

- carteira `admin`
- carteira `deployer`
- signer `worker/operator`
- usuario de demo

Nunca reutilizar:

- carteira pessoal principal
- mesma chave para deploy e operacao se der para separar

---

# 7. Preparacao do banco

Estado atual:

- instancia criada em `southamerica-east1`
- database `tokenfc` criada
- usuario `tokenfc_app` criado
- secret `tokenfc-blitz-database-url` preenchido

Ainda validar no dia:

- conectividade a partir do `Cloud Run`
- politica de migrations do monorepo

---

# 8. Preparacao da Privy

- habilitar `Google`
- habilitar `email` como fallback
- decidir se `Apple` entra no MVP
- configurar embedded wallet
- configurar chain `Monad`
- habilitar `gas sponsorship`
- validar app id
- validar fluxo de token backend
- validar que onboarding, apoio e compra nao exigem `MON` na wallet do usuario

## Regra de implementacao da wallet

- usar o modelo padrao da `Privy` no MVP do hackathon
- deixar comentario no codigo indicando futura opcao de migracao para modelo restrito
- nao bloquear o hackathon tentando resolver custodia avancada agora

## Regra de gas

- sponsorship de gas e obrigatorio para a jornada principal
- faucet da `Monad Testnet` e apenas fallback operacional
- apenas `deployer` e `operator` precisam ser abastecidos manualmente com `MON`
- wallets de usuario so recebem funding manual em fallback de demo, nunca como UX oficial

---

# 9. Preparacao dos assets

- lista final dos clubes seedados
- escudos em formato consistente
- camisas mockadas em formato consistente
- convencao de nomes de arquivo
- nota de origem/licenca preenchida

---

# 10. Preflight de demo

Antes do pitch, confirmar:

- uma conta de demo pronta
- um clube com campanha seedada
- artes cadastradas
- produto da loja seedado
- saldo inicial e fluxo de topup funcionando
- links de deploy acessiveis
