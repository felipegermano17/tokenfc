# Codex Executor Playbook - Token F.C.

Este e o unico arquivo que o chat executor precisa abrir primeiro.

Se a skill local estiver disponivel no chat, use:

- `$monad-tokenfc-executor`

Objetivo:

- iniciar o hackathon e executar sem ficar redescobrindo contexto
- usar o mock funcional existente
- ligar backend, Privy, contratos e deploy com o minimo de desvio

---

# 1. Regra de entrada

Antes de codar qualquer coisa, rodar:

```powershell
& 'C:\Users\user\Documents\Playground\tokenfc\ops\gcp\check_play_ready.ps1'
```

Interpretacao do resultado:

- se faltar `project`, `cloud_sql`, `queues`, `assets_bucket`, `database-url`, `monad-rpc-url`, `deployer key` ou `operator key`, parar e resolver primeiro
- se faltarem apenas `Privy secrets` ou `wallet funding`, pode iniciar as fases locais nao bloqueadas:
  - bootstrap do repo
  - migracao do mock
  - schema e seed
  - APIs sem auth final
- antes de integrar `Privy`, deployar contratos ou validar a jornada completa, o validador precisa estar `PLAY_READY=True`

---

# 2. O que o executor deve assumir

- o produto ja esta arquitetado
- o front mockado ja existe e deve ser reaproveitado
- o usuario nunca paga gas
- `Privy gas sponsorship` e obrigatorio
- faucet e apenas fallback operacional nosso
- nao redesenhar UX do zero
- nao reabrir decisoes de arquitetura sem bloqueio real

---

# 3. Fontes de verdade

Abrir apenas estes arquivos, nesta ordem:

1. [token_fc_mvp_documento_atualizado.md](C:\Users\user\Documents\Playground\tokenfc\token_fc_mvp_documento_atualizado.md)
2. [hackathon_runbook.md](C:\Users\user\Documents\Playground\tokenfc\hackathon_runbook.md)
3. [implementation_sequence.md](C:\Users\user\Documents\Playground\tokenfc\implementation_sequence.md)
4. [play_mode.md](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\play_mode.md)
5. [wallet_inventory.md](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\wallet_inventory.md)

Front de referencia:

- [front token teste nao oficial](C:\Users\user\Documents\Playground\front token teste nao oficial)

Direcao de UX complementar:

- [event-prep\README.md](C:\Users\user\Documents\Playground\front tokenfc\event-prep\README.md)

---

# 4. O que nao fazer

- nao criar UI nova se a tela ja existir no mock
- nao refazer a landing
- nao trocar stack
- nao adicionar features fora do fluxo principal
- nao abrir tempo com admin sofisticado antes do core
- nao deixar o usuario depender de `MON`

---

# 5. Sequencia pratica de execucao

## Primeiros 15 minutos

1. rodar o validador
2. classificar o que esta faltando entre bloqueio duro e bloqueio parcial
3. abrir apenas:
   - [token_fc_mvp_documento_atualizado.md](C:\Users\user\Documents\Playground\tokenfc\token_fc_mvp_documento_atualizado.md)
   - [implementation_sequence.md](C:\Users\user\Documents\Playground\tokenfc\implementation_sequence.md)
   - [play_mode.md](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\play_mode.md)
4. criar o repo publico
5. iniciar o monorepo

Se os unicos faltantes forem `Privy` e funding, seguir em frente com as fases A e B.

## Fase A - Base do repo

1. criar repo publico
2. subir monorepo com `apps/web`, `apps/api`, `apps/worker`, `packages/contracts`, `packages/db`
3. migrar o mock de [front token teste nao oficial](C:\Users\user\Documents\Playground\front token teste nao oficial) para `apps/web`
4. limpar artefatos locais do mock durante a migracao

## Fase B - Backend e dados

5. ligar `DATABASE_URL`
6. criar schema e migrations
7. seedar clubes, aliases, assets e produtos
8. expor APIs minimas

## Fase C - Auth e identidade

9. integrar `Privy`
10. usar wallet padrao da Privy no MVP
11. deixar comentario no codigo marcando futura migracao opcional para wallet restrita
12. trocar mocks de auth por sessao real

## Fase D - Onchain

13. implementar e deployar `TFCToken`, `ClubPass`, `ClubContest`
14. salvar addresses no runtime
15. ligar worker para onboarding, topup e campanha
16. habilitar sponsorship de gas para a jornada principal

## Fase E - Fluxo de produto

17. onboarding funcional
18. dashboard funcional
19. campanha funcional
20. topup mockado funcional
21. checkout funcional
22. atividade funcional

## Fase F - Deploy

23. deploy `api`
24. deploy `worker`
25. deploy `web`
26. rodar smoke test completo

---

# 6. Bloqueios mais comuns

## Caso 1 - Faltam secrets da Privy

- continuar com repo, banco, seed, contratos e mock migrado
- deixar a integracao real de auth para o momento em que os secrets chegarem

## Caso 2 - Faltam fundos nas wallets operacionais

- continuar com repo, banco, seed, mock e parte offchain
- nao tentar deployar contratos nem validar tx reais antes do funding

## Caso 3 - Falta infraestrutura base

- parar
- resolver antes de seguir

---

# 7. Ordem de prioridade se faltar tempo

Nunca cortar:

- login
- escolha de clube
- ativacao
- sponsorship de gas
- campanha com apoio em `TFC`
- topup mockado
- compra simples com `TFC`

Cortar primeiro:

- admin
- multiplos produtos
- multiplas campanhas
- refinamento visual extra

---

# 8. Definicao de pronto

So considerar pronto quando:

- `PLAY_READY=True` antes de entrar nas fases C, D e F
- o mock virou app integrado, nao apenas tela estatica
- onboarding cria `ClubPass + 1 TFC`
- usuario consegue apoiar campanha sem `MON`
- topup mockado altera saldo
- compra altera saldo
- atividade bate com saldo
- deploy web/api/worker esta acessivel
- smoke test completo passa

---

# 9. Comandos uteis

Validar prontidao:

```powershell
& 'C:\Users\user\Documents\Playground\tokenfc\ops\gcp\check_play_ready.ps1'
```

Preencher secret da Privy:

```powershell
& 'C:\Users\user\Documents\Playground\tokenfc\ops\gcp\set_text_secret.ps1' -SecretName 'tokenfc-blitz-privy-app-id' -Value 'SEU_APP_ID'
& 'C:\Users\user\Documents\Playground\tokenfc\ops\gcp\set_text_secret.ps1' -SecretName 'tokenfc-blitz-privy-app-secret' -Value 'SEU_APP_SECRET'
```

Recriar wallets operacionais se necessario:

```powershell
& 'C:\Users\user\Documents\Playground\tokenfc\ops\gcp\create_operational_wallets.ps1'
```

---

# 10. Regra final

Se surgir duvida entre "fazer bonito" e "fazer demoar", escolher "fazer demoar".
