# Testnet Infos Monad Hack

Registro vivo dos dados operacionais mais importantes da Monad Testnet para o Token F.C.

Ultima atualizacao:

- 2026-03-22 17:25 BRT

## Rede

- chain: `Monad Testnet`
- chain id: `10143`
- rpc secret: `tokenfc-blitz-monad-rpc-url`
- rpc atualmente configurado no projeto: `https://testnet-rpc.monad.xyz`

## Repo e ambiente

- repo publico: `https://github.com/felipegermano17/tokenfc`
- branch principal: `main`
- commit atual de referencia: `6b09c89`
- gcp project: `zap--advogado`
- gcloud config: `tokenfc-blitz`

## Servicos em runtime

### Web

- url: `https://tokenfc-blitz-web-wuuxvo4p4q-rj.a.run.app`
- latest ready revision: `tokenfc-blitz-web-00007-7sw`

### API

- url: `https://tokenfc-blitz-api-wuuxvo4p4q-rj.a.run.app`
- latest ready revision: `tokenfc-blitz-api-00004-8r4`

### Worker

- url: `https://tokenfc-blitz-worker-wuuxvo4p4q-rj.a.run.app`
- latest ready revision: `tokenfc-blitz-worker-00003-wd9`
- observacao: privado, responde `403` sem auth

## Wallets operacionais

### Deployer

- address: `0xA5df0c715E7fDdEDa1879A5d8b2daB87F9d58d76`
- secret: `tokenfc-blitz-deployer-private-key`
- uso: deploy de contratos na Monad Testnet

### Operator

- address: `0x34E650b3f3d3C6F06B62a85d145212863B28aa50`
- secret: `tokenfc-blitz-operator-private-key`
- uso: operacao do worker e fallback operacional

## Contratos deployados

Deploy realizado em `2026-03-22`.

### TFCToken

- address: `0x1CEB00023fd3112A8F254C8Da53eaBf63150593f`
- deploy tx: `0x490b5008bb6aac668d0de6a6b9ff9ed84ec70eed095857a06c25a5d4d9eca6d3`
- deploy block: `20492738`

### ClubPass

- address: `0x3d1C3F7608b0d0992Cebb42Fa0D687dFAa7d4cAF`
- deploy tx: `0x29458ab0621b352c8f0b6d0d413094e98f2a52131056d0c4346df8a67b76e3af`
- deploy block: `20492740`

### ClubContest

- address: `0x4C3Ab0c1c23a1D837f66077d04e553d08A201Fbf`
- deploy tx: `0x5aac64cb9f5b419b5ed17a6b58756bdacba2ce15c1bcd94d6939aabc152e623c`
- deploy block: `20492742`

### Grant de role no TFCToken para o ClubContest

- tx hash: `0x0f18f46c2c1027a75e9bf048cdcc8e81063993afbb9603a59f6de570d0b67039`
- block: `20492749`
- role concedida ao `ClubContest`: `OPERATOR_ROLE`

## Arquivos de referencia de deploy

- runtime addresses: `packages/contracts/deployments/monad-testnet.json`
- broadcast completo: `packages/contracts/broadcast/DeployTokenFC.s.sol/10143/run-latest.json`
- contracts package: `packages/contracts`

## Banco e app runtime

- database secret: `tokenfc-blitz-database-url`
- cloud sql instance: `tokenfc-blitz-db`
- cloud sql connection name: `zap--advogado:southamerica-east1:tokenfc-blitz-db`
- database name: `tokenfc`
- app user: `tokenfc_app`

Observacao:

- no runtime cloud, a `DATABASE_URL` usa o socket de `/cloudsql/...`
- no Windows local com proxy, a conexao precisa ser adaptada para `127.0.0.1:5432`

## App secrets importantes

- privy app id em uso no hack: `cmn0k0stx05oe0cihgn1ram0v`
- privy app id secret: `tokenfc-blitz-privy-app-id`
- privy app secret secret: `tokenfc-blitz-privy-app-secret`
- env sugerida no `web`: `NEXT_PUBLIC_PRIVY_APP_ID`
- env sugeridas no `api`: `PRIVY_APP_ID` e `PRIVY_APP_SECRET`

## Offchain seeds relevantes

- contest seedado no banco para demo: `onchainContestId = 1`
- clube do contest seedado: `corinthians`
- titulo do contest seedado: `Escolha da proxima camisa da torcida`
- clubes sem contest real no banco hoje: `flamengo`, `palmeiras`, `sao-paulo`
- fallback visual de campanha no `web` foi ativado para esses clubes durante o hack

## Wallet e conta de teste usadas no hack

- email de teste: `tokenfcd0cee942db@sharebot.net`
- wallet embedded validada no fluxo: `0x9413011b7305Efbd741c925d8Dc90Be0BabA44c4`
- user id offchain: `03dba631-0f55-4dc4-9bc5-cbaaadea8478`
- clube escolhido na conta de teste: `corinthians`

## IDs e intents relevantes ja vistos

- onboarding activation intent: `34add4d1-ec32-4d0c-b4e3-89df583881b0`
- topup antigo preso antes do fix: `6dee7bb6-bb3b-4746-a3f6-a19a1bd888d3`
- topup validado apos o fix: `da7ec4a7-7078-4d2f-9c53-0e73b4f6bfd7`

## Estado validado da jornada

- login Privy por email: validado
- escolha de clube: validada
- ativacao com `ClubPass` e `1 TFC` inicial: validada
- topup mockado gerando mint real: validado
- saldo da conta de teste apos topup validado: `21 TFC`
- campanha visual com camisas disponiveis: validada
- bloqueio atual da campanha transacional: `Gas sponsorship is not enabled.`
- regra operacional mantida: todas as operacoes do usuario devem permanecer gasless

## Status util do que ja esta pronto

- monorepo publicado
- `apps/web` migrado para o repo e buildando
- `apps/api` conectado ao banco
- `packages/db` com schema aplicado e seed executado
- contratos deployados na Monad Testnet

## Proximas entradas para salvar aqui

- tx hashes de onboarding real
- tx hashes de topup real
- tx hashes de apoio em campanha
- addresses finais usadas em runtime do web/api/worker
- identificadores de contests onchain criados depois do deploy
