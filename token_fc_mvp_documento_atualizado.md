# Token F.C. - Documento de MVP
## Wireframes, jornadas, arquitetura invisivel onchain e especificacao tecnica

**Hackathon - Monad Testnet**

---

# 1. Visao geral do produto

Token F.C. e uma infraestrutura digital para clubes de futebol que combina identidade de torcida, participacao economica, campanhas e commerce em uma unica experiencia.

O objetivo do MVP e provar que um produto consumer pode usar blockchain sem parecer um dapp tradicional. O usuario entra com login social, escolhe seu clube, recebe acesso imediato ao ecossistema e interage com campanhas e compras usando `TFC`, sem precisar entender wallet, gas, assinatura ou rede.

## Tese central

O produto mede duas forcas diferentes de cada clube dentro da plataforma:

- `Maior Torcida`: quantidade de torcedores na plataforma
- `Torcida Mais Forte`: quantidade de `TFC` movimentada e comprometida pela torcida

Na campanha da camisa, a logica do produto e:

- cada usuario escolhe uma arte
- apoia essa escolha com `TFC`
- vence a arte com maior volume de `TFC` comprometido

Assim, o MVP prova ao mesmo tempo:

- identidade de torcida
- participacao economica
- commerce com token
- experiencia invisivel onchain

## Premissas do MVP

- `1 TFC = R$ 1,00` dentro da logica do app
- o usuario recebe `1 TFC` no onboarding
- o usuario recebe tambem um `ClubPass` do time escolhido
- a compra de produtos e `100% feita com TFC`
- para comprar `TFC`, o usuario faz um `cash-in via PIX mockado`
- a campanha da camisa usa `apoio com TFC`
- o MVP demonstra:
  - login social
  - onboarding
  - escolha de clube
  - mint inicial
  - apoio onchain em campanha
  - topup via PIX mockado
  - compra com `TFC`
- offchain sera `100% GCP`
- onchain sera o menor recorte possivel para provar a tese
- o usuario nunca precisa ter `MON` para usar o produto
- o usuario nunca paga gas nas acoes principais da jornada

---

# 2. Aderencia ao regulamento do hackathon

O MVP foi ajustado para respeitar as diretrizes apresentadas no regulamento:

- projeto novo, concebido para o evento
- proposta com elemento claro de inovacao
- repositorio publico
- deployado e operacional na `Monad Testnet`
- foco em demonstracao funcional, nao apenas pitch

## A inovacao principal do Token F.C.

O projeto nao e um clone de fan token nem uma replica de marketplace existente. O diferencial esta em combinar:

- login social com wallet invisivel
- ranking de torcida por pessoas e por forca economica
- governanca economica da camisa
- token como unidade de conta do ecossistema

---

# 3. Escopo do MVP

## O que e real no MVP

- login social
- catalogo inicial com os principais clubes do Brasil
- busca de clube no onboarding
- criacao automatica de wallet embutida
- escolha de clube
- escudos salvos e servidos pelo backend
- camisas mockadas por clube para uso nas telas
- mint inicial de `1 TFC`
- emissao de `ClubPass`
- visualizacao de saldo
- dashboard do clube
- tela de campanha
- apoio onchain em arte com `TFC`
- confirmacao de operacao sem expor jargao Web3
- topup adicional apos `PIX mockado`
- compra da camisa com `TFC`
- ranking de torcedores por clube
- ranking de forca economica por clube
- historico de atividade do usuario

## O que e mockado

- geracao do PIX
- aprovacao bancaria do PIX
- operacao real da loja
- logistica e entrega
- moderacao editorial completa do concurso

## O que fica oculto para demo

- painel admin com ranking consolidado
- resultado final da campanha
- publicacao da camisa vencedora na loja

---

# 4. Regras de produto

## 4.1 Regra de identidade

- `1 usuario = 1 conta`
- `1 usuario = 1 clube`
- o vinculo com o clube sera representado onchain por um `ClubPass`
- no MVP, o usuario nao troca de clube apos onboarding

## 4.2 Regra de ranking

O app mostra dois rankings paralelos.

### Maior Torcida

- quantidade de usuarios unicos vinculados ao clube

### Torcida Mais Forte

- soma economica do clube no ecossistema

## 4.3 Formula da forca economica

A metrica de forca economica no MVP considera apenas fluxos validos do produto:

- `TFC` comprado via topup
- `TFC` comprometido em campanhas
- `TFC` gasto na loja

Nao entram:

- transferencias livres entre usuarios
- volume artificial fora dos fluxos oficiais

## 4.4 Regra da campanha da camisa

- `1 usuario escolhe 1 arte por concurso`
- `1 usuario pode apoiar sua arte com uma quantidade de TFC`
- `1 usuario pode aumentar o apoio na mesma arte`
- `1 usuario nao pode mudar para outra arte no mesmo concurso`
- vence a arte com maior `TFC` comprometido

## 4.5 Regra da compra

- a camisa so pode ser comprada com `TFC`
- o pagamento no MVP e tratado como fluxo do ecossistema
- a compra confirma a tese de `TFC` como unidade de conta

## 4.6 Regra economica do apoio com TFC

- o apoio em campanha gera um debito definitivo no saldo do usuario
- o `TFC` apoiado e transferido para a treasury da campanha ou do ecossistema
- o apoio e irreversivel no MVP
- o usuario pode apenas aumentar o apoio na mesma arte
- ranking e contabilidade economica so fecham como definitivos apos confirmacao onchain reconciliada pelo backend

## 4.7 Regra de catalogo e busca de clubes

- o onboarding parte de um seed inicial com os principais clubes do Brasil
- quando a busca estiver vazia, o app mostra clubes em destaque
- a busca considera nome oficial, nome curto, apelidos e aliases
- a busca deve funcionar sem diferenciar maiusculas, minusculas ou acentos
- se o clube nao for encontrado, o app mostra a opcao `Nao encontrei meu time`

## 4.8 Invariantes financeiras do MVP

- nenhum topup gera `TFC` antes da aprovacao do fluxo mockado
- nenhuma aprovacao duplicada pode gerar mint duplicado
- toda entrada ou saida de `TFC` precisa gerar efeito de ledger
- metricas economicas de clube devem ser derivadas do ledger reconciliado
- status mostrado ao usuario pode ser otimista, mas a consolidacao financeira e feita no backend

---

# 5. Fluxos e jornadas do usuario

## Fluxo macro

```txt
LANDING
  |
LOGIN SOCIAL
  |
ESCOLHER CLUBE
  |
ATIVAR PERFIL (ClubPass + 1 TFC)
  |
DASHBOARD DO CLUBE
  |-- CAMPANHA DA CAMISA
  |-- COMPRAR TFC
  |-- LOJA OFICIAL
  `-- ATIVIDADE
         |
      CHECKOUT COM TFC
```

## Jornada 1 - Entrada

- o usuario acessa a landing page
- entra no ecossistema com `Google`, `Apple`, `email` ou `passkey`
- a wallet embutida e criada automaticamente em segundo plano

## Jornada 2 - Escolha e ativacao

- o usuario pesquisa o time dele
- o usuario escolhe seu clube
- o sistema confirma a identidade do torcedor
- a plataforma ativa o perfil com:
  - `ClubPass`
  - `1 TFC`
- so depois libera o dashboard

## Jornada 3 - Dashboard do clube

- o usuario entende onde esta
- ve a posicao do clube em:
  - `Maior Torcida`
  - `Torcida Mais Forte`
- encontra a campanha ativa, saldo e proximas acoes

## Jornada 4 - Campanha da camisa

- o usuario entra na campanha
- escolhe uma arte
- decide quanto apoiar em `TFC`
- confirma o apoio
- acompanha um estado de processamento sem jargao tecnico

## Jornada 5 - Comprar TFC

- o usuario escolhe quanto quer adicionar
- gera um `PIX mockado`
- simula o pagamento aprovado
- recebe novo saldo em `TFC`

## Jornada 6 - Loja e checkout

- o usuario entra na loja oficial
- escolhe um produto
- confirma a compra em uma etapa propria de checkout
- conclui o pedido usando `TFC`

## Jornada 7 - Atividade

- o usuario acompanha historico de:
  - ativacao
  - topups
  - apoios em campanha
  - compras

---

# 6. Wireframes

## 6.1 Landing page

```txt
+----------------------------------------------------------------------------------+
| TOKEN F.C.                                                    [ Entrar ]         |
+----------------------------------------------------------------------------------+
|                                                                                  |
|                   O token que transforma torcida em economia                     |
|                                                                                  |
|        Com TFC, o torcedor participa e compra dentro do clube.                  |
|                                                                                  |
|      Entre com PIX, receba TFC e use o token no ecossistema oficial.            |
|                                                                                  |
|                        [ Entrar no ecossistema ]                                 |
|                                                                                  |
|     Ranking ao vivo: Maior Torcida | Torcida Mais Forte                         |
|                                                                                  |
+----------------------------------------------------------------------------------+
```

Objetivo: preservar a copy principal do produto e iniciar o login social sem introduzir linguagem Web3.

## 6.2 Onboarding - Escolha do clube

```txt
+----------------------------------------------------------------------------------+
| TOKEN F.C.                                                    Novo perfil        |
+----------------------------------------------------------------------------------+
| Escolha seu clube                                                                |
| Seu clube define sua identidade dentro da plataforma.                            |
| [ Buscar meu time......................................................... ]      |
| Clubes em destaque                                                               |
|                                                                                  |
| Maior Torcida                          Torcida Mais Forte                        |
| 1. Flamengo ...... 1.240              1. Corinthians .... 18.400 TFC            |
| 2. Corinthians ... 1.180              2. Flamengo ....... 17.250 TFC            |
|                                                                                  |
| +----------------------------+   +----------------------------+                  |
| | [ escudo ] FLAMENGO        |   | [ escudo ] CORINTHIANS     |                  |
| | 1.240 torcedores           |   | 1.180 torcedores           |                  |
| | 17.250 TFC de forca        |   | 18.400 TFC de forca        |                  |
| | [ camisa mock ]            |   | [ camisa mock ]            |                  |
| | [ Selecionar ]             |   | [ Selecionar ]             |                  |
| +----------------------------+   +----------------------------+                  |
|                                                                                  |
| Resultado da busca: Corinthians                                                  |
| Clube escolhido: Corinthians                                                     |
| [ Nao encontrei meu time ]                                                       |
|                                                                                  |
|                           [ Ativar meu perfil ]                                  |
+----------------------------------------------------------------------------------+
```

Objetivo: conectar busca, identidade de torcida, prova social e decisao de onboarding na mesma tela.

## 6.3 Ativando perfil

```txt
+----------------------------------------------------------------------------------+
| TOKEN F.C.                                                    Ativando perfil    |
+----------------------------------------------------------------------------------+
| Seu acesso esta sendo preparado                                                  |
|                                                                                  |
| [1] Login confirmado                 OK                                          |
| [2] Clube escolhido                  Corinthians                                  |
| [3] ClubPass liberado                EM PROCESSAMENTO                            |
| [4] 1 TFC inicial                    AGUARDANDO                                  |
|                                                                                  |
| Isso leva apenas alguns instantes.                                               |
|                                                                                  |
|                          [ carregando perfil... ]                                |
+----------------------------------------------------------------------------------+
```

Objetivo: transformar a ativacao em etapa explicita, confiavel e coerente com a jornada.

## 6.4 Dashboard do clube

```txt
+----------------------------------------------------------------------------------+
| TOKEN F.C.     Clube: Corinthians                 Saldo: 12 TFC   [ Perfil ]     |
+----------------------------------------------------------------------------------+
| Clube | Campanha | Comprar TFC | Loja | Atividade                                |
+----------------------------------------------------------------------------------+
| CAMPANHA ATIVA                                                                   |
| Escolha da proxima camisa da torcida                                             |
| Lider atual: Arte #01 | 2.340 TFC | 148 apoiadores        [ Apoiar campanha ]    |
|                                                                                  |
| +----------------------+  +----------------------+  +--------------------------+ |
| | Maior Torcida        |  | Torcida Mais Forte   |  | Seu saldo                | |
| | #2 na plataforma     |  | #1 na plataforma     |  | 12 TFC                   | |
| | 1.180 torcedores     |  | 18.400 TFC           |  | [ Comprar mais TFC ]     | |
| +----------------------+  +----------------------+  +--------------------------+ |
|                                                                                  |
| SUA ATIVIDADE RECENTE                                                            |
| - Apoio na Arte #01 .................................................... 10 TFC  |
| - Topup aprovado ........................................................ 50 TFC  |
| - Camisa comemorativa comprada ......................................... 40 TFC  |
+----------------------------------------------------------------------------------+
```

Objetivo: dar orientacao imediata, destacar a acao dominante e reforcar a tese do produto com dados vivos.

## 6.5 Campanha da camisa

```txt
+----------------------------------------------------------------------------------+
| TOKEN F.C.     Clube: Corinthians                 Saldo: 12 TFC                  |
+----------------------------------------------------------------------------------+
| Clube | Campanha | Comprar TFC | Loja | Atividade                                |
+----------------------------------------------------------------------------------+
| CAMPANHA: ESCOLHA DA PROXIMA CAMISA                                              |
| Encerra em 02d 14h | Regra: escolha 1 arte e aumente seu apoio com TFC           |
|                                                                                  |
| +------------------------------------+  +--------------------------------------+ |
| | ARTE #01                           |  | SEU APOIO                            | |
| | [ preview da camisa ]              |  | Arte escolhida: Arte #01             | |
| | Criador: @torcedor01               |  | Apoio atual: 10 TFC                  | |
| | Apoiadores: 148                    |  | Saldo atual: 12 TFC                  | |
| | TFC comprometido: 2.340            |  | Saldo apos novo apoio: 2 TFC         | |
| | [ Apoiar +5 ] [ +10 ] [ Outro ]    |  | Esta escolha nao pode ser trocada    | |
| +------------------------------------+  | neste concurso.                       | |
|                                         | [ Confirmar +10 TFC ]                | |
| +------------------------------------+  +--------------------------------------+ |
| | ARTE #02                           |                                          |
| | [ preview da camisa ]              |  Ranking atual                          |
| | Criador: @torcedor77               |  1. Arte #01 ..... 2.340 TFC           |
| | Apoiadores: 121                    |  2. Arte #02 ..... 2.120 TFC           |
| | TFC comprometido: 2.120            |                                          |
| | [ Ver detalhes ]                   |                                          |
| +------------------------------------+                                          |
|                                                       [ Voltar ao clube ]        |
+----------------------------------------------------------------------------------+
```

Objetivo: fazer a tela da campanha funcionar como decisao economica guiada, e nao como uma lista solta de cards.

## 6.6 Processando apoio

```txt
+----------------------------------------------------------------------------------+
| PROCESSANDO SEU APOIO                                                            |
+----------------------------------------------------------------------------------+
| Sua participacao esta sendo confirmada.                                          |
|                                                                                  |
| [1] Apoio enviado                     OK                                         |
| [2] Confirmacao em andamento          PROCESSANDO                                |
| [3] Saldo atualizado                  AGUARDANDO                                 |
|                                                                                  |
|                         [ carregando... ]                                        |
|                                                                                  |
|                      [ Voltar quando concluir ]                                  |
+----------------------------------------------------------------------------------+
```

Objetivo: tratar processamento como estado do produto, sem expor hash, gas ou jargao tecnico.

## 6.7 Comprar TFC com PIX mockado

```txt
+----------------------------------------------------------------------------------+
| TOKEN F.C.     Clube: Corinthians                 Saldo: 12 TFC                  |
+----------------------------------------------------------------------------------+
| Clube | Campanha | Comprar TFC | Loja | Atividade                                |
+----------------------------------------------------------------------------------+
| COMPRAR TFC                                                                     |
| Etapa 1 de 3: gerar pagamento                                                   |
|                                                                                  |
| Quanto deseja adicionar?                                                         |
| [ 20 ]   [ 50 ]   [ 100 ]   [ Outro valor ]                                     |
|                                                                                  |
| Voce recebera: 50 TFC                                                            |
| Cotacao interna MVP: 1 TFC = R$ 1                                                |
|                                                                                  |
| +--------------------------------------+   +-----------------------------------+ |
| | QR CODE MOCKADO                      |   | STATUS DO CREDITO                 | |
| |                                      |   | 1. Ordem criada       OK          | |
| |               [ QR ]                 |   | 2. Pagamento          AGUARDANDO  | |
| |                                      |   | 3. Credito liberado   PENDENTE    | |
| +--------------------------------------+   +-----------------------------------+ |
| Codigo copia e cola mockado                                                      |
|                                                                                  |
|                     [ Simular pagamento aprovado ]                               |
+----------------------------------------------------------------------------------+
```

Objetivo: transformar topup em jornada transacional com etapas, e nao em uma unica tela estatica.

## 6.8 Loja oficial

```txt
+----------------------------------------------------------------------------------+
| TOKEN F.C.     Clube: Corinthians                 Saldo: 62 TFC                  |
+----------------------------------------------------------------------------------+
| Clube | Campanha | Comprar TFC | Loja | Atividade                                |
+----------------------------------------------------------------------------------+
| LOJA OFICIAL                                                                     |
|                                                                                  |
| +------------------------------------+  +--------------------------------------+ |
| | Camisa comemorativa vencedora      |  | Patch da campanha                    | |
| | Preco: 40 TFC                      |  | Preco: 15 TFC                        | |
| | Entrega: mockada no MVP            |  | Entrega: mockada no MVP              | |
| | [ Ver produto ]                    |  | [ Ver produto ]                      | |
| +------------------------------------+  +--------------------------------------+ |
|                                                                                  |
|                                                 [ Voltar ao clube ]              |
+----------------------------------------------------------------------------------+
```

Objetivo: mostrar catalogo claro e preparar a ida para um checkout dedicado.

## 6.9 Checkout

```txt
+----------------------------------------------------------------------------------+
| TOKEN F.C.     Clube: Corinthians                 Saldo: 62 TFC                  |
+----------------------------------------------------------------------------------+
| Clube | Campanha | Comprar TFC | Loja | Atividade                                |
+----------------------------------------------------------------------------------+
| CHECKOUT                                                                         |
|                                                                                  |
| +--------------------------------------+  +------------------------------------+ |
| | Camisa comemorativa vencedora        |  | RESUMO DO PEDIDO                   | |
| | [ imagem do produto ]                |  | Produto: Camisa 2026              | |
| | Tamanho: M                           |  | Preco: 40 TFC                     | |
| | Entrega: mockada no MVP              |  | Seu saldo: 62 TFC                 | |
| |                                      |  | Saldo apos compra: 22 TFC         | |
| +--------------------------------------+  | [ Confirmar compra ]               | |
|                                           +------------------------------------+ |
|                                                                                  |
| GARANTIAS DO MVP                                                                 |
| - pagamento em TFC                                                               |
| - pedido registrado                                                              |
| - confirmacao imediata no app                                                    |
|                                                                                  |
|                               [ Voltar para loja ]                               |
+----------------------------------------------------------------------------------+
```

Objetivo: dar uma etapa deliberada e confiavel antes da compra final.

## 6.10 Atividade

```txt
+----------------------------------------------------------------------------------+
| TOKEN F.C.     Clube: Corinthians                 Saldo: 22 TFC                  |
+----------------------------------------------------------------------------------+
| Clube | Campanha | Comprar TFC | Loja | Atividade                                |
+----------------------------------------------------------------------------------+
| SUA ATIVIDADE                                                                    |
|                                                                                  |
| +-------------------------------------------------------------------------+      |
| | Hoje 15:42 | Compra concluida       | Camisa comemorativa      | 40 TFC |      |
| | Hoje 15:20 | Apoio confirmado       | Arte #01                 | 10 TFC |      |
| | Hoje 15:10 | Credito liberado       | PIX mockado              | 50 TFC |      |
| | Hoje 15:05 | Perfil ativado         | ClubPass + saldo         |  1 TFC |      |
| +-------------------------------------------------------------------------+      |
|                                                                                  |
| Sua contribuicao economica total para a torcida: 51 TFC                          |
+----------------------------------------------------------------------------------+
```

Objetivo: reforcar recorrencia, confianca e memoria de uso dentro da plataforma.

## 6.11 Admin oculto

```txt
+----------------------------------------------------------------------------------+
| TOKEN F.C. - ADMIN                                              Operacao ao vivo |
+----------------------------------------------------------------------------------+
| OVERVIEW                                                                         |
| Campanha ativa: Camisa 2026              Status: ABERTA                          |
| Clube lider em torcida: Flamengo         Clube lider em forca: Corinthians       |
|                                                                                  |
| +------------------------------------+  +--------------------------------------+ |
| | TOP CLUBES                         |  | CAMPANHA ATIVA                        | |
| | Flamengo ...... 1.240 pessoas      |  | Arte #01 ..... 2.340 TFC            | |
| | Corinthians ... 1.180 pessoas      |  | Arte #02 ..... 2.120 TFC            | |
| | Corinthians ... 18.400 TFC         |  | 148 apoiadores / 121 apoiadores     | |
| | Flamengo ...... 17.250 TFC         |  | [ Encerrar campanha ]               | |
| +------------------------------------+  | [ Publicar resultado ]                | |
|                                         +--------------------------------------+ |
| TOPUPS RECENTES                                                                   |
| pix_001 | Corinthians | R$ 50 | 50 TFC | aprovado                               |
| pix_002 | Flamengo    | R$ 20 | 20 TFC | aprovado                               |
|                                                                                  |
| PEDIDOS RECENTES                                                                  |
| ord_221 | camisa 2026 | 40 TFC | concluido                                      |
| ord_222 | camisa 2026 | 40 TFC | concluido                                      |
+----------------------------------------------------------------------------------+
```

Objetivo: fazer o admin parecer console operacional, e nao apenas resumo estatico.

---

# 7. Arquitetura final - visao geral

## Principio de divisao

A arquitetura do MVP separa claramente:

- **Onchain** = identidade de clube, saldo do token, apoio economico e transacoes auditaveis
- **Offchain** = experiencia do usuario, catalogo, PIX mockado, loja, ranking, indexacao, dados auxiliares e observabilidade

## Decisoes finais

- Offchain sera `100% GCP`
- login e wallet serao geridos por `Privy`
- o produto tera `3 contratos`
- o ranking tera dois eixos:
  - `torcida`
  - `forca economica`
- a campanha da camisa usara `apoio com TFC`
- o projeto sera deployado em `Monad Testnet`

---

# 8. Offchain - arquitetura 100% GCP

## Stack principal

**Frontend**

- `Next.js`
- deploy em `Cloud Run`

**Backend**

- `Node.js + TypeScript`
- `Fastify`
- `API` em `Cloud Run`
- `Worker` em `Cloud Run`

**Banco**

- `Cloud SQL for PostgreSQL`

**Fila assincrona**

- `Cloud Tasks`

**Arquivos**

- `Cloud Storage`

**Segredos**

- `Secret Manager`

**Observabilidade**

- `Cloud Logging`
- `Cloud Monitoring`
- `Error Reporting`
- `Trace`

## Racional

O dominio do produto pede:

- consistencia transacional
- idempotencia
- reconciliacao de eventos onchain
- auditoria de fluxo financeiro
- estados claros para pedidos, topups e campanhas

Por isso, o `source of truth` do MVP sera `PostgreSQL`, e nao um banco de documentos como core.

## Catalogo e assets dos clubes

O backend tambem sera responsavel por um catalogo inicial de clubes brasileiros para o MVP.

Esse catalogo precisa guardar:

- nome oficial do clube
- slug
- apelidos e aliases para busca
- imagem do escudo
- imagem de camisa mockada
- status de destaque na home e no onboarding

Modelo recomendado:

- metadados dos clubes em `PostgreSQL`
- imagens em `Cloud Storage`
- URLs publicas ou assinadas curtas servidas pela API
- busca feita sobre nome normalizado e aliases precomputados no banco

Seed inicial recomendado para o MVP:

- Flamengo
- Corinthians
- Palmeiras
- Sao Paulo
- Santos
- Vasco
- Fluminense
- Botafogo
- Atletico-MG
- Cruzeiro
- Gremio
- Internacional
- Bahia
- Vitoria
- Sport
- Fortaleza
- Ceara
- Athletico-PR
- Coritiba
- Goias

Politica de assets para o MVP:

- escudos precisam ter origem registrada no backend
- camisas devem ser mockadas/editoriais, nao prometidas como produto oficial de fornecedor
- cada asset precisa guardar nota de origem e uso permitido para o repositorio publico e a demo

---

# 9. Camada de identidade e wallet invisivel

## Decisao principal

A experiencia principal sera:

- login com `Privy`
- `embedded wallet` criada automaticamente
- interface sem `connect wallet`
- gas patrocinado
- sem expor modais tecnicos de wallet nas acoes principais

## Decisao de produto

Na UX do usuario:

- nao mostrar wallet address
- nao mostrar hash
- nao mostrar gas
- nao mostrar rede
- nao usar linguagem Web3 nas telas principais

Na arquitetura:

- o backend valida identidade com `Privy access tokens`
- a wallet existe em segundo plano
- o app patrocina gas nas operacoes da jornada principal
- cada acao onchain relevante nasce como `transaction_intent` antes da submissao da transacao

## Regra absoluta de gas no MVP

- o usuario nunca precisa carregar saldo nativo de `MON`
- o usuario nunca precisa pagar gas para onboarding, apoio em campanha ou compra no ecossistema
- a responsabilidade de gas e sempre do app
- se uma wallet do usuario precisar de `MON` para fallback em demo, esse funding e feito por nos em segundo plano e nunca vira parte da UX

## Modelo operacional de gas

Camada principal:

- `Privy native gas sponsorship` para as wallets embutidas dos usuarios
- todas as transacoes de jornada principal saem com sponsorship habilitado

Camada de fallback:

- `deployer wallet` abastecida via faucet da `Monad Testnet`
- `operator wallet` abastecida via faucet da `Monad Testnet`
- funding emergencial de wallets de demo apenas se o sponsorship falhar

Regra de produto:

- faucet nunca entra na UX do usuario
- faucet e apenas ferramenta operacional do time
- a experiencia do usuario continua identica com ou sem fallback

Regra de implementacao:

- sempre que o gas limit for previsivel, ele deve ser definido explicitamente antes do envio da transacao
- isso e especialmente importante na Monad, onde o valor pago depende do `gas limit`

---

# 10. Onchain - arquitetura final

Os contratos do MVP serao:

- `TFCToken.sol`
- `ClubPass.sol`
- `ClubContest.sol`

## 10.1 TFCToken.sol

Objetivo:

- representar a unidade economica do ecossistema

Responsabilidades:

- mint inicial no onboarding
- mint adicional apos topup mockado
- pagamento da campanha
- pagamento da loja
- transferencia para treasury oficial do ecossistema

Decisao recomendada para o MVP:

- `transfer-restricted`

## 10.2 ClubPass.sol

Objetivo:

- representar o clube escolhido pelo usuario

Regras:

- um passe por usuario
- nao transferivel
- emitido no onboarding

## 10.3 ClubContest.sol

Objetivo:

- registrar apoio economico as artes da campanha

Regras:

- so participa quem possui o `ClubPass` correto
- o usuario escolhe uma unica arte por concurso
- o usuario pode aumentar o apoio na mesma arte
- o `TFC` apoiado vai para a treasury da campanha ou do ecossistema
- vence a arte com maior `TFC` comprometido

## 10.4 Papeis onchain

Papeis recomendados:

- `DEFAULT_ADMIN_ROLE`: carteira de administracao do protocolo
- `MINTER_ROLE`: worker autorizado para onboarding e topup
- `SPENDER_ROLE`: contratos oficiais autorizados a debitar `TFC` dentro das regras do sistema
- `OPERATOR_ROLE`: operador que cria e encerra concursos

Decisao operacional:

- `DEFAULT_ADMIN_ROLE` fica fora do app publico
- `MINTER_ROLE` e `OPERATOR_ROLE` ficam com signer operacional controlado pelo backend
- `SPENDER_ROLE` fica apenas em contratos oficiais do ecossistema

## 10.5 Interfaces exatas recomendadas

### TFCToken.sol

Padrao base:

- `ERC20`
- `AccessControl`

Funcoes:

```solidity
function mintOnboarding(address to, uint256 amount, bytes32 onboardingId) external;
function mintTopup(address to, uint256 amount, bytes32 topupOrderId) external;
function systemTransferFrom(address from, address to, uint256 amount, bytes32 intentId) external;
function setTreasury(address newTreasury) external;
function setAllowedTarget(address target, bool allowed) external;
function treasury() external view returns (address);
function isAllowedTarget(address target) external view returns (bool);
```

Eventos:

```solidity
event OnboardingMinted(address indexed to, uint256 amount, bytes32 indexed onboardingId);
event TopupMinted(address indexed to, uint256 amount, bytes32 indexed topupOrderId);
event SystemTransfer(address indexed from, address indexed to, uint256 amount, bytes32 indexed intentId);
event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);
event AllowedTargetUpdated(address indexed target, bool allowed);
```

Regra de transferencia:

- transferencias livres entre usuarios ficam bloqueadas no MVP
- o token pode ser enviado para:
  - treasury oficial
  - contratos oficiais allowlisted
  - burn address, se o protocolo usar burn no futuro

### ClubPass.sol

Padrao base:

- `ERC721`
- `AccessControl`

Funcoes:

```solidity
function mintPass(address to, uint256 clubId) external returns (uint256 tokenId);
function clubOf(address owner) external view returns (uint256 clubId);
function hasClub(address owner, uint256 clubId) external view returns (bool);
function existsFor(address owner) external view returns (bool);
```

Eventos:

```solidity
event ClubPassMinted(address indexed to, uint256 indexed clubId, uint256 indexed tokenId);
```

Regra de transferencia:

- o passe e soulbound no MVP
- `approve`, `transferFrom` e `safeTransferFrom` devem reverter

### ClubContest.sol

Padrao base:

- `AccessControl`

Estruturas:

```solidity
struct Contest {
    uint256 clubId;
    uint64 startsAt;
    uint64 endsAt;
    address treasury;
    bool active;
    uint256 winningDesignId;
}

struct Design {
    uint256 designId;
    string metadataURI;
    bool active;
}
```

Funcoes:

```solidity
function createContest(
    uint256 contestId,
    uint256 clubId,
    uint64 startsAt,
    uint64 endsAt,
    address treasury
) external;

function addDesign(
    uint256 contestId,
    uint256 designId,
    string calldata metadataURI
) external;

function supportDesign(
    uint256 contestId,
    uint256 designId,
    uint256 amount,
    bytes32 intentId
) external;

function closeContest(uint256 contestId) external;
function totalSupport(uint256 contestId, uint256 designId) external view returns (uint256);
function userSupport(uint256 contestId, address supporter) external view returns (uint256 designId, uint256 amount);
```

Eventos:

```solidity
event ContestCreated(
    uint256 indexed contestId,
    uint256 indexed clubId,
    address indexed treasury,
    uint64 startsAt,
    uint64 endsAt
);

event DesignAdded(
    uint256 indexed contestId,
    uint256 indexed designId,
    string metadataURI
);

event SupportAdded(
    uint256 indexed contestId,
    uint256 indexed designId,
    address indexed supporter,
    uint256 amount,
    bytes32 intentId
);

event ContestClosed(
    uint256 indexed contestId,
    uint256 indexed winningDesignId,
    uint256 winningAmount
);
```

Regra interna de `supportDesign`:

- valida que o concurso esta ativo
- valida que o usuario possui `ClubPass` do clube correto
- valida que a arte escolhida e a primeira do usuario no concurso ou a mesma ja escolhida anteriormente
- debita `TFC` do usuario usando `TFCToken.systemTransferFrom`
- soma o valor ao total da arte e ao acumulado do usuario

## 10.6 Decisoes de implementacao dos contratos

- `TFCToken` usa `18 decimals`
- valores offchain devem ser salvos em unidade crua compatível com a cadeia
- `ClubContest` nao guarda imagem onchain; guarda apenas `metadataURI`
- resultado final do concurso e publicado pelo operador apos o encerramento

---

# 11. Modelo de dados offchain

## Tabelas principais

- `users`
- `user_wallets`
- `clubs`
- `club_search_aliases`
- `club_memberships`
- `contests`
- `contest_designs`
- `contest_supports`
- `topup_orders`
- `shop_products`
- `shop_orders`
- `ledger_entries`
- `transaction_intents`
- `chain_transactions`
- `club_metrics`
- `audit_events`

## Campos importantes

**users**

- `id`
- `privy_user_id`
- `created_at`

**user_wallets**

- `user_id`
- `wallet_address`
- `provider`

**club_memberships**

- `user_id`
- `club_id`
- `club_pass_token_id`
- `joined_at`

**contest_supports**

- `user_id`
- `contest_id`
- `design_id`
- `club_id`
- `tfc_amount`
- `tx_hash`
- `status`

**topup_orders**

- `id`
- `user_id`
- `brl_amount`
- `tfc_amount`
- `customer_status`
- `internal_status`
- `idempotency_key`
- `approved_at`
- `approved_by`
- `mint_intent_id`
- `expires_at`

**shop_orders**

- `id`
- `user_id`
- `club_id`
- `product_id`
- `price_tfc`
- `customer_status`
- `internal_status`
- `payment_intent_id`
- `fulfillment_status`

**ledger_entries**

- `id`
- `user_id`
- `club_id`
- `asset`
- `direction`
- `amount`
- `reason`
- `source_type`
- `source_id`
- `chain_transaction_id`
- `idempotency_key`
- `status`
- `effective_at`

**transaction_intents**

- `id`
- `user_id`
- `wallet_address`
- `intent_type`
- `source_screen`
- `source_action`
- `target_contract`
- `target_method`
- `chain_transaction_id`
- `status`
- `idempotency_key`
- `requested_at`
- `finalized_at`

**chain_transactions**

- `id`
- `tx_hash`
- `network`
- `stage`
- `from_address`
- `to_contract`
- `method`
- `status`
- `proposed_at`
- `verified_at`

**club_metrics**

- `club_id`
- `supporters_count`
- `tfc_topup_volume`
- `tfc_support_volume`
- `tfc_shop_volume`
- `tfc_total_power`

**clubs**

- `id`
- `name`
- `slug`
- `short_name`
- `normalized_name`
- `badge_image_url`
- `mock_jersey_image_url`
- `badge_storage_path`
- `mock_jersey_storage_path`
- `asset_source`
- `license_note`
- `is_featured`
- `is_active`

**club_search_aliases**

- `id`
- `club_id`
- `alias`
- `normalized_alias`

---

## 11.1 Extensoes e convencoes do PostgreSQL

Extensoes recomendadas:

```sql
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists unaccent;
create extension if not exists pg_trgm;
```

Convencoes recomendadas:

- ids operacionais em `uuid`
- ids publicos de clubes e designs podem ser `bigint`
- valores de `TFC` salvos em unidade crua com `numeric(78,0)`
- timestamps sempre em `timestamptz`
- busca de clubes usando texto normalizado + trigram

## 11.2 Schema SQL base recomendado

```sql
create type ledger_direction as enum ('credit', 'debit');
create type ledger_status as enum ('pending', 'posted', 'reversed', 'failed');
create type intent_status as enum ('intent_created', 'tx_requested', 'tx_proposed', 'tx_verified', 'ledger_posted', 'completed', 'failed');

create table users (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null unique,
  created_at timestamptz not null default now()
);

create table user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  wallet_address text not null unique,
  provider text not null default 'privy',
  is_embedded boolean not null default true,
  created_at timestamptz not null default now()
);

create table clubs (
  id bigserial primary key,
  name text not null unique,
  slug citext not null unique,
  short_name text not null,
  normalized_name text not null,
  badge_image_url text not null,
  mock_jersey_image_url text not null,
  badge_storage_path text not null,
  mock_jersey_storage_path text not null,
  asset_source text not null,
  license_note text not null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index clubs_normalized_name_trgm_idx
  on clubs using gin (normalized_name gin_trgm_ops);

create table club_search_aliases (
  id bigserial primary key,
  club_id bigint not null references clubs(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  unique (club_id, normalized_alias)
);

create index club_search_aliases_trgm_idx
  on club_search_aliases using gin (normalized_alias gin_trgm_ops);

create table club_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  club_id bigint not null references clubs(id),
  club_pass_token_id numeric(78,0),
  joined_at timestamptz not null default now()
);

create table chain_transactions (
  id uuid primary key default gen_random_uuid(),
  tx_hash text not null unique,
  network text not null,
  stage text not null,
  from_address text,
  to_contract text,
  method text,
  status text not null,
  block_number bigint,
  proposed_at timestamptz,
  verified_at timestamptz,
  raw_receipt jsonb
);

create table transaction_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  wallet_address text,
  intent_type text not null,
  source_screen text not null,
  source_action text not null,
  target_contract text,
  target_method text,
  chain_transaction_id uuid references chain_transactions(id),
  status intent_status not null default 'intent_created',
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  finalized_at timestamptz
);

create table topup_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  brl_amount numeric(12,2) not null,
  tfc_amount_raw numeric(78,0) not null,
  pix_code text,
  pix_qr_payload text,
  customer_status text not null,
  internal_status text not null,
  idempotency_key text not null unique,
  approved_at timestamptz,
  approved_by text,
  mint_intent_id uuid references transaction_intents(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table contests (
  id uuid primary key default gen_random_uuid(),
  club_id bigint not null references clubs(id),
  onchain_contest_id bigint not null unique,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null,
  treasury_address text not null,
  created_at timestamptz not null default now()
);

create table contest_designs (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references contests(id) on delete cascade,
  onchain_design_id bigint not null,
  title text not null,
  creator_label text not null,
  preview_image_url text not null,
  metadata_uri text,
  created_at timestamptz not null default now(),
  unique (contest_id, onchain_design_id)
);

create table contest_supports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  contest_id uuid not null references contests(id),
  design_id uuid not null references contest_designs(id),
  club_id bigint not null references clubs(id),
  increment_tfc_raw numeric(78,0) not null,
  cumulative_tfc_raw numeric(78,0) not null,
  transaction_intent_id uuid references transaction_intents(id),
  chain_transaction_id uuid references chain_transactions(id),
  status text not null,
  created_at timestamptz not null default now()
);

create table shop_products (
  id uuid primary key default gen_random_uuid(),
  club_id bigint not null references clubs(id),
  name text not null,
  sku text not null unique,
  price_tfc_raw numeric(78,0) not null,
  image_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table shop_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  club_id bigint not null references clubs(id),
  product_id uuid not null references shop_products(id),
  price_tfc_raw numeric(78,0) not null,
  customer_status text not null,
  internal_status text not null,
  payment_intent_id uuid references transaction_intents(id),
  fulfillment_status text not null,
  created_at timestamptz not null default now()
);

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  club_id bigint references clubs(id),
  asset text not null default 'TFC',
  direction ledger_direction not null,
  amount_raw numeric(78,0) not null,
  reason text not null,
  source_type text not null,
  source_id uuid,
  transaction_intent_id uuid references transaction_intents(id),
  chain_transaction_id uuid references chain_transactions(id),
  idempotency_key text not null unique,
  status ledger_status not null,
  effective_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table club_metrics (
  club_id bigint primary key references clubs(id),
  supporters_count integer not null default 0,
  tfc_topup_volume_raw numeric(78,0) not null default 0,
  tfc_support_volume_raw numeric(78,0) not null default 0,
  tfc_shop_volume_raw numeric(78,0) not null default 0,
  tfc_total_power_raw numeric(78,0) not null default 0,
  updated_at timestamptz not null default now()
);
```

## 11.3 Indices e constraints minimas

Indices e regras que eu fecharia agora:

- `unique (privy_user_id)` em `users`
- `unique (wallet_address)` em `user_wallets`
- `unique (user_id)` em `club_memberships`
- `unique (idempotency_key)` em `topup_orders`, `shop_orders`, `transaction_intents` e `ledger_entries`
- indice por `contest_id, design_id` em `contest_supports`
- indice por `user_id, created_at desc` em `ledger_entries`
- indice por `club_id, updated_at desc` em `club_metrics`

## 11.4 Regra de calculo de saldo e ranking

- saldo do usuario = soma de `ledger_entries` com `status = 'posted'`
- `Maior Torcida` = contagem de `club_memberships`
- `Torcida Mais Forte` = soma de volumes economicos reconciliados no ledger
- a tabela `club_metrics` pode ser cache/projecao, mas nunca source of truth

---

# 12. Fluxos operacionais

## 12.0 Seed inicial da plataforma

1. backend cadastra os principais clubes do Brasil
2. backend associa aliases de busca para cada clube
3. backend sobe escudos e camisas mockadas no `Cloud Storage`
4. API passa a servir catalogo e busca para o onboarding
5. cada asset recebe origem, nota de licenca e caminho interno de armazenamento

## 12.1 Onboarding

1. usuario faz login social
2. wallet embedded e criada
3. usuario pesquisa e escolhe clube
4. backend grava o usuario
5. backend cria o vinculo de clube
6. backend registra uma `transaction_intent` de onboarding
7. worker faz:
   - mint de `ClubPass`
   - mint de `1 TFC`
8. backend grava os efeitos no `ledger_entries`
9. front mostra estado de ativacao
10. dashboard e liberado

## 12.2 Apoio a arte

1. usuario entra no concurso
2. escolhe a arte
3. escolhe o valor em `TFC`
4. backend cria uma `transaction_intent` de apoio
5. app envia a transacao usando a embedded wallet
6. gas e patrocinado
7. `TFC` e transferido para a treasury da campanha
8. backend grava o debito no `ledger_entries`
9. UI mostra progresso invisivel
10. ranking da arte e atualizado

### State machine de apoio

- `intent_created`
- `tx_requested`
- `tx_proposed`
- `tx_verified`
- `ledger_posted`
- `completed`
- `failed`

## 12.3 PIX mockado

1. usuario cria ordem de topup
2. backend cria ordem com `idempotency_key`
3. usuario visualiza o PIX mockado
4. usuario simula pagamento aprovado
5. backend marca ordem como aprovada apenas uma vez
6. worker dispara uma `transaction_intent` de mint
7. worker aguarda verificacao onchain
8. backend grava o credito no `ledger_entries`
9. saldo e atualizado

### State machine de topup

**Status para o usuario**

- `aguardando pagamento`
- `pagamento em analise`
- `credito em processamento`
- `saldo liberado`
- `falhou`
- `expirado`

**Status internos**

- `created`
- `pix_generated`
- `awaiting_payment`
- `payment_approved_mock`
- `mint_requested`
- `mint_proposed`
- `mint_verified`
- `ledger_posted`
- `completed`
- `failed`
- `expired`

## 12.4 Checkout

1. usuario cria ordem de compra
2. backend registra ordem com `idempotency_key`
3. backend cria uma `transaction_intent` de pagamento
4. app executa o pagamento em `TFC`
5. backend vincula a transacao a ordem
6. backend grava o debito no `ledger_entries`
7. ordem muda para `paid_mock_fulfillment`

### State machine de checkout

**Status para o usuario**

- `pedido iniciado`
- `pagamento em processamento`
- `pedido confirmado`
- `pedido concluido`
- `falhou`

**Status internos**

- `created`
- `payment_requested`
- `payment_proposed`
- `payment_verified`
- `ledger_posted`
- `fulfillment_mock_pending`
- `fulfilled_mock`
- `failed`
- `canceled`

## 12.5 Invariantes operacionais

- topup aprovado nao pode gerar mais de um mint
- compra nao pode debitar mais de uma vez a mesma ordem
- apoio nao pode registrar mais de uma vez o mesmo incremento
- toda `transaction_intent` precisa terminar em sucesso reconciliado ou falha auditavel
- `club_metrics` devem ser calculadas a partir de `ledger_entries` verificados, nao por soma direta de tabelas de operacao

---

# 13. APIs sugeridas

- `POST /auth/session`
- `GET /clubs?query=`
- `GET /clubs/featured`
- `POST /clubs/suggestions`
- `POST /onboarding/select-club`
- `GET /clubs/:clubId/dashboard`
- `GET /rankings`
- `GET /contests/:contestId`
- `POST /contests/:contestId/support`
- `POST /topup/pix`
- `POST /topup/pix/:id/approve`
- `GET /shop/:clubId/products`
- `POST /shop/checkout`
- `GET /me/activity`
- `GET /admin/overview`

---

# 14. Estrutura de rotas sugerida

```txt
/
  landing

/login
  auth social

/onboarding
  escolher-clube

/club/:id
  dashboard do clube

/contest/:id
  campanha ativa

/buy-tfc
  comprar TFC com PIX mockado

/shop
  loja oficial

/shop/checkout
  checkout do pedido

/activity
  historico do usuario

/admin
  oculto para demo

/admin/clubs
  gestao de catalogo e assets
```

---

# 15. Dependencias recomendadas

## Frontend

- `next`
- `react`
- `react-dom`
- `@privy-io/react-auth`
- `viem`
- `@tanstack/react-query`
- `zod`
- `react-hook-form`
- `tailwindcss`
- `clsx`

## Backend

- `fastify`
- `@privy-io/server-auth`
- `@privy-io/node`
- `prisma`
- `@prisma/client`
- `viem`
- `pino`
- `zod`

## GCP

- `@google-cloud/tasks`
- `@google-cloud/storage`
- `@google-cloud/secret-manager`

## Smart contracts

- `@openzeppelin/contracts`
- `foundry`

---

# 16. Decisoes de UX

## O que a interface deve comunicar

- pertencimento ao clube
- reconhecimento rapido do time do usuario
- campanha ativa
- posicao da torcida
- saldo disponivel
- proxima melhor acao

## O que a interface nao deve comunicar

- wallet
- gas
- hash
- RPC
- rede
- assinatura manual como conceito de produto

## Principios de experiencia

- a landing vende a proposta, nao a infraestrutura
- o dashboard orienta e prioriza
- a campanha funciona como jornada de decisao
- topup e checkout precisam de etapas explicitas
- onboarding precisa cobrir busca, destaque e estado de `time nao encontrado`
- atividade reforca memoria e confianca de uso

---

# 17. O que o jurado precisa perceber

- o produto e novo e nao um clone
- o usuario entra com UX de app tradicional
- a blockchain esta presente, mas invisivel
- o clube ganha identidade de comunidade
- o clube ganha leitura de popularidade e poder economico
- o `TFC` nao e token especulativo no MVP
- o `TFC` e a unidade operacional do ecossistema
- a campanha da camisa prova governanca economica
- o fluxo `PIX mockado -> mint onchain -> apoio/compra com TFC` prova a ponte Web2 e Web3
- o projeto esta publico, deployado e funcional em `Monad Testnet`

---

# 18. Referencias oficiais revisadas

- Privy, automatic wallet creation: [Automatic wallet creation](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation)
- Privy, whitelabel wallets: [Whitelabel wallet UIs](https://docs.privy.io/wallets/using-wallets/whitelabel)
- Privy, access tokens: [Access tokens](https://docs.privy.io/authentication/user-authentication/access-tokens)
- Privy, identity tokens: [Identity tokens](https://docs.privy.io/user-management/users/identity-tokens)
- Privy, user and server signers: [Enabling users or servers to execute transactions](https://docs.privy.io/recipes/wallets/user-and-server-signers)
- Privy, gas sponsorship overview: [Gas sponsorship overview](https://docs.privy.io/transaction-management/gas-management)
- Privy, gas sponsorship setup: [Setting up sponsorship](https://docs.privy.io/wallets/gas-and-asset-management/gas/setup)
- Privy, wallet policies and controls: [Wallet policies and controls](https://docs.privy.io/security/wallet-infrastructure/policy-and-controls)
- Privy, EVM networks including Monad: [Configuring EVM networks](https://docs.privy.io/basics/react/advanced/configuring-evm-networks)
- Monad, introduction: [Introduction](https://docs.monad.xyz/)
- Monad, deployment summary: [Deployment Summary for Developers](https://docs.monad.xyz/developer-essentials/summary)
- Monad, network information: [Network Information](https://docs.monad.xyz/developer-essentials/network-information/)
- OpenZeppelin, AccessControl: [Access Control](https://docs.openzeppelin.com/contracts/5.x/access-control)
- OpenZeppelin, ERC20: [ERC20](https://docs.openzeppelin.com/contracts/5.x/erc20)
- OpenZeppelin, ERC721: [ERC721](https://docs.openzeppelin.com/contracts/5.x/erc721)
- Google Cloud Run: [What is Cloud Run](https://cloud.google.com/run/docs/overview/what-is-cloud-run)
- Google Cloud SQL for PostgreSQL: [Introduction to Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres/introduction)
- Google Cloud Tasks: [Understand Cloud Tasks](https://cloud.google.com/tasks/docs/dual-overview)
- Next.js deployment: [How to deploy your Next.js application](https://nextjs.org/docs/pages/getting-started/deploying)
