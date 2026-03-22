# Hackathon Runbook - Token F.C.

Este documento organiza o dia do Blitz para maximizar velocidade sem perder controle.

Documento principal de arquitetura:

- [token_fc_mvp_documento_atualizado.md](C:\Users\user\Documents\Playground\tokenfc\token_fc_mvp_documento_atualizado.md)

---

# 1. Objetivo do dia

Sair do evento com:

- repositorio publico
- deploy funcional na `Monad Testnet`
- login social com `Privy`
- onboarding com escolha de clube
- ativacao com `ClubPass + 1 TFC`
- campanha com apoio em `TFC`
- topup via `PIX mockado`
- loja com checkout em `TFC`
- demo curta e estavel

---

# 2. O que nao fazer no dia

- expandir escopo
- discutir naming de detalhe no meio da implementacao
- refazer arquitetura
- tentar resolver todos os edge cases antes do fluxo principal funcionar
- gastar tempo polindo telas antes da jornada base estar pronta

---

# 3. Ordem operacional do dia

## Antes da abertura do periodo de hacking

- rodar [check_play_ready.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\check_play_ready.ps1)
- classificar pendencias:
  - bloqueio duro: infra base e secrets base
  - bloqueio parcial: `Privy` e funding operacional
- confirmar internet, energia e acesso a contas
- confirmar quem abre o repo publico
- confirmar acesso a `GCP`, `Privy` e `Monad Testnet`
- abrir os docs de execucao deste diretorio
- alinhar dono de cada frente

## Bloco 1 - Primeiros 30 minutos

- criar repositorio publico
- criar branch principal
- subir apenas documentos de execucao e arquitetura, se decidir publicar docs desde o inicio
- criar quadro simples de execucao:
  - `doing`
  - `blocked`
  - `done`

## Bloco 2 - Primeira hora

- bootstrap do monorepo
- configurar package manager
- criar apps:
  - `web`
  - `api`
  - `worker`
  - `contracts`
  - `db`
- preparar `.env` local
- importar a base de [front token teste nao oficial](C:\Users\user\Documents\Playground\front token teste nao oficial) para `apps/web`
- abrir o pacote de direcao visual complementar em [event-prep](C:\Users\user\Documents\Playground\front tokenfc\event-prep)

Observacao:

- se o unico bloqueio ainda for `Privy` ou funding das wallets operacionais, esse bloco deve acontecer normalmente

## Bloco 3 - Base tecnica

- configurar `Privy` no frontend
- habilitar sponsorship de gas como comportamento obrigatorio da jornada do usuario
- configurar `Postgres`
- configurar schema inicial
- configurar contratos e deploy na `Monad Testnet`
- subir APIs minimas

## Bloco 4 - Fluxo principal

- login social
- busca de clube
- onboarding
- ativacao de perfil
- dashboard

Observacao importante:

- o frontend ja existe como mock funcional em [front token teste nao oficial](C:\Users\user\Documents\Playground\front token teste nao oficial)
- no dia, a frente web deve focar em ligar rotas, estado e dados reais, nao em inventar tela

## Bloco 5 - Fluxo economico

- campanha com apoio em `TFC`
- topup mockado
- ledger/atividade
- compra na loja
- validar que nenhuma dessas acoes exige `MON` do usuario

## Bloco 6 - Deploy e estabilidade

- deploy `web`, `api` e `worker`
- smoke test completo
- preparar contas e dados de demo
- travar narrativa da apresentacao

---

# 4. Definicao de pronto por fase

## Fase 1 - Base pronta

- repo publico criado
- monorepo sobe localmente
- apps rodam sem erro
- envs minimas resolvidas
- landing, onboarding e dashboard mockados ja renderizam dentro do monorepo

## Fase 2 - Identidade pronta

- usuario consegue entrar
- usuario consegue buscar o clube
- usuario consegue escolher o clube
- estado de ativacao existe
- a wallet do usuario existe sem exigir qualquer saldo nativo

## Fase 3 - Onchain minimo pronto

- contratos deployados
- `ClubPass` e `TFC` funcionando
- backend registra intents
- chain tx aparece no fluxo
- sponsorship de gas habilitado para a jornada principal

## Fase 4 - Produto pronto

- dashboard responde
- campanha suporta `TFC`
- topup mockado credita saldo
- compra finaliza pedido
- usuario nao precisa de `MON` em nenhum passo da demo

## Fase 5 - Demo pronta

- fluxo completo funciona sem ajustes manuais improvaveis
- dados de demo estao carregados
- narracao cabe em 3 a 5 minutos

---

# 5. Smoke test oficial

Executar nesta ordem:

1. entrar com login social
2. buscar um clube
3. selecionar o clube
4. ativar perfil
5. ver saldo inicial
6. entrar na campanha
7. apoiar uma arte
8. ver atividade atualizada
9. gerar topup mockado
10. simular pagamento aprovado
11. ver saldo aumentado
12. entrar na loja
13. comprar produto
14. confirmar pedido na atividade

Validacao transversal:

- em nenhum desses passos o usuario pode precisar receber, visualizar ou pagar `MON`

Se qualquer uma dessas etapas falhar, o produto ainda nao esta pronto para demo.

---

# 6. Decisoes de corte

Se o tempo apertar, cortar nesta ordem:

1. reduzir quantidade de clubes seedados
2. reduzir quantidade de produtos da loja
3. reduzir quantidade de artes por campanha
4. simplificar admin
5. esconder fluxo de sugestao de time

Nao cortar:

- login
- escolha de clube
- ativacao
- apoio em campanha
- topup mockado
- compra com `TFC`
- sponsorship de gas

---

# 7. Donos sugeridos por frente

Em time de ate 3 pessoas:

- Pessoa 1: `web`
- Pessoa 2: `api + db`
- Pessoa 3: `contracts + worker + deploy`

Se `executor do projeto = codex`, usar a mesma divisao como ordem de foco:

1. base do repo
2. backend e banco
3. contratos
4. frontend
5. deploy

---

# 8. Checklist antes de apresentar

- repo publico acessivel
- app web acessivel
- API saudavel
- fluxo de demo testado do zero
- dados resetados para demo
- wallet/usuário de demo conhecido
- campanha ativa aberta
- saldo inicial controlado
- topup mockado funcionando
- loja com pelo menos 1 item compravel
