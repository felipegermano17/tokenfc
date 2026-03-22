# Play Mode - Token F.C.

Objetivo:

- chegar no hackathon e iniciar a execucao com o minimo de improviso

## O que ja fica pronto antes

- GCP isolado no projeto `zap--advogado`
- `Cloud SQL`, `Cloud Tasks`, `Artifact Registry`, `bucket` e `service accounts`
- `DATABASE_URL` no `Secret Manager`
- `MONAD RPC` no `Secret Manager`
- wallets operacionais em `Secret Manager`
- checklist de prontidao automatizado

## O que ainda depende de voce

- validar login social no dashboard da `Privy`
- abastecer `deployer` e `operator` no faucet da `Monad Testnet`
- confirmar que o validador retorna `PLAY_READY=True`

Script util para preencher secrets rapidamente:

- [set_text_secret.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\set_text_secret.ps1)

## Ordem recomendada no dia

1. rodar [check_play_ready.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\check_play_ready.ps1)
2. se faltar wallet operacional, rodar [create_operational_wallets.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\create_operational_wallets.ps1)
3. se faltar RPC, rodar [set_monad_rpc_secret.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\set_monad_rpc_secret.ps1)
4. rodar o validador de prontidao novamente
5. iniciar o repo publico e a implementacao

O validador atual considera pronto apenas quando:

- `deployer` tem saldo de `MON`
- `operator` tem saldo de `MON`

## Regra de execucao

- o usuario nunca paga gas
- a jornada principal usa `Privy gas sponsorship`
- faucet e so fallback operacional nosso
