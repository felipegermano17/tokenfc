# Sequencia de Implementacao - Token F.C.

Este documento quebra o MVP em uma ordem de implementacao segura para o dia do evento.

Referencia principal:

- [token_fc_mvp_documento_atualizado.md](C:\Users\user\Documents\Playground\tokenfc\token_fc_mvp_documento_atualizado.md)

---

# 1. Stack alvo

- monorepo com `pnpm`
- `apps/web` com `Next.js`
- `apps/api` com `Fastify`
- `apps/worker` com `Fastify` ou worker HTTP simples
- `packages/db` com schema e migrations
- `packages/contracts` com `Foundry`

Contexto confirmado em `2026-03-21`:

- existe um front mockado funcional em [front token teste nao oficial](C:\Users\user\Documents\Playground\front token teste nao oficial)
- esse front ja possui as rotas principais em `src/app`
- esse front ja possui componentes de experiencia e dados mockados em `src/components` e `src/lib/data.ts`

Implicacao:

- a etapa de frontend deixa de ser "construir do zero"
- a etapa de frontend passa a ser "migrar e conectar o mock funcional ao backend, Privy e dados reais"

---

# 2. Ordem de build

## Etapa 0 - Bootstrap

- inicializar monorepo
- configurar TypeScript base
- configurar lint e formatacao minima
- criar estrutura de pastas
- validar build vazia
- importar ou copiar a base de [front token teste nao oficial](C:\Users\user\Documents\Playground\front token teste nao oficial) para `apps/web`
- limpar `node_modules`, `.next`, logs e artefatos locais antes da migracao
- manter como referencia adicional a direcao de UX em [event-prep](C:\Users\user\Documents\Playground\front tokenfc\event-prep)

## Etapa 1 - Banco e schema

- subir `Postgres`
- criar schema inicial
- aplicar migrations
- validar acesso local da API ao banco

Entregaveis:

- tabela `users`
- tabela `clubs`
- tabela `club_search_aliases`
- tabela `club_memberships`
- tabela `ledger_entries`
- tabela `transaction_intents`
- tabela `chain_transactions`

## Etapa 2 - Seed e assets

- seedar clubes principais
- subir escudos e camisas mockadas
- salvar caminhos e URLs no banco
- validar busca por aliases

Entregaveis:

- `GET /clubs/featured`
- `GET /clubs?query=`

## Etapa 3 - Auth e sessao

- integrar `Privy` no frontend
- usar o modelo padrao de embedded wallet para hackathon
- deixar comentario no codigo junto da configuracao da Privy indicando futura migracao opcional para modelo restrito de wallet
- validar token no backend
- criar sessao de usuario
- persistir `privy_user_id` e wallet
- ligar a landing e o onboarding reais ao fluxo de auth

Entregaveis:

- `POST /auth/session`
- usuario autenticado no app

Observacao obrigatoria de implementacao:

- o comentario no codigo deve deixar claro que o MVP usa a wallet padrao da Privy por velocidade
- o comentario tambem deve indicar que a evolucao futura pode trocar para modelo mais restrito se a portabilidade externa da wallet deixar de ser desejada

## Etapa 4 - Onboarding

- tela de busca de clube
- selecao de clube
- persistencia do vinculo
- tela de ativacao de perfil

Entregaveis:

- `POST /onboarding/select-club`
- `club_memberships` preenchida

## Etapa 5 - Contratos

- implementar `TFCToken`
- implementar `ClubPass`
- implementar `ClubContest`
- testes minimos
- deploy em `Monad Testnet`

Entregaveis:

- addresses dos 3 contratos
- papeis configurados

## Etapa 6 - Worker onchain

- criar rotina de onboarding
- criar rotina de topup
- criar rotina de apoio em campanha
- gravar `transaction_intents`
- reconciliar `chain_transactions`
- configurar sponsorship de gas como caminho padrao das transacoes do usuario
- manter `deployer` e `operator` com `MON` de faucet apenas para deploy, administracao e fallback operacional
- definir `gas limit` explicitamente nas acoes previsiveis do app

Entregaveis:

- onboarding onchain funcionando
- ledger sendo alimentado
- usuario transacionando sem precisar ter `MON`

## Etapa 7 - Dashboard

- saldo do usuario
- clube escolhido
- ranking de torcida
- ranking de forca economica
- atividade recente
- shell persistente do produto

Entregaveis:

- `GET /clubs/:clubId/dashboard`
- `GET /rankings`
- `GET /me/activity`

## Etapa 8 - Campanha

- criar concurso seedado
- cadastrar artes
- exibir ranking das artes
- permitir apoio com `TFC`
- mostrar estado de processamento

Entregaveis:

- `GET /contests/:contestId`
- `POST /contests/:contestId/support`

## Etapa 9 - Topup mockado

- criar ordem
- gerar PIX mockado
- aprovar mock
- worker minta `TFC`
- ledger credita o usuario

Entregaveis:

- `POST /topup/pix`
- `POST /topup/pix/:id/approve`

## Etapa 10 - Loja e checkout

- seedar produtos
- listar produtos da loja
- checkout com `TFC`
- debito via ledger
- atividade atualizada

Entregaveis:

- `GET /shop/:clubId/products`
- `POST /shop/checkout`

## Etapa 11 - Admin de demo

- overview de ranking
- topups recentes
- pedidos recentes
- status da campanha

Entregaveis:

- `GET /admin/overview`

## Etapa 12 - Deploy

- deploy `web`
- deploy `api`
- deploy `worker`
- validar conexoes
- smoke test completo

---

# 3. Dependencias entre etapas

Ordem critica:

1. schema
2. seed de clubes
3. auth
4. onboarding
5. contratos
6. worker
7. dashboard
8. campanha
9. topup
10. loja
11. admin
12. deploy

Atividades paralelizaveis:

- frontend da landing e onboarding pode andar junto com schema
- contratos podem andar junto com dashboard basico
- admin pode ficar por ultimo

Atalho confirmado:

- a frente web ja tem mock navegavel com estas rotas:
  - `/`
  - `/onboarding`
  - `/activating`
  - `/club/[slug]`
  - `/contest/[slug]`
  - `/buy-tfc`
  - `/shop`
  - `/shop/checkout`
  - `/activity`
- a direcao de linguagem e fluxo continua podendo sair de [TOKENFC_DEMO_DATA_AND_COPY.md](C:\Users\user\Documents\Playground\front tokenfc\event-prep\TOKENFC_DEMO_DATA_AND_COPY.md)

---

# 4. Corte inteligente se faltar tempo

## Nivel A - obrigatorio

- login social
- busca e escolha de clube
- ativacao com `ClubPass + 1 TFC`
- campanha com apoio em `TFC`
- topup mockado
- compra simples na loja
- usuario sem pagar gas

## Nivel B - desejavel

- atividade detalhada
- admin
- mais clubes seedados
- mais de uma campanha

## Nivel C - cortar primeiro

- sugestao de clube nao encontrado
- multiplos produtos
- refinamentos visuais extras
- filtros avancados de ranking

---

# 5. Checklist de aceite por modulo

## Auth

- login abre
- usuario autenticado persiste
- backend reconhece o usuario

## Clubes

- featured clubs carregam
- busca retorna corretamente
- escudos e mocks carregam

## Onboarding

- so e possivel escolher 1 clube
- ativacao mostra estado
- dashboard abre no final

## Onchain

- contratos deployados
- intents criadas
- tx reconciliadas
- sponsorship de gas funcionando para a jornada principal

## Financeiro

- topup credita uma vez
- apoio debita uma vez
- compra debita uma vez
- atividade bate com saldo
- nenhuma dessas operacoes exige `MON` do usuario

## Demo

- fluxo roda do zero sem edicao manual de banco
