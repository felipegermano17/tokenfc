# Preflight Local - Status Atual

Data da leitura:

- `2026-03-17`

---

# 1. Ferramentas locais

Detectado no ambiente:

- `gcloud`: instalado
- `git`: instalado
- `node`: instalado
- `pnpm`: instalado
- `forge`: instalado

Implicacao:

- o toolchain principal de contratos ja esta disponivel localmente

---

# 2. GCP - Estado atual

Resultado do preflight:

- `Google Cloud SDK`: disponivel
- configuracao ativa: `default`
- projeto ativo atual: `zap--advogado`
- nome do projeto ativo atual: `ZAP! ADVOGADO`
- conta ativa atual: `germano@20apy.com`
- `Application Default Credentials`: indisponivel
- `region`: nao configurada
- `zone`: nao configurada
- projeto atual sem tag global de `environment`

Contexto adicional criado:

- configuracao dedicada do `gcloud`: `tokenfc-blitz`
- projeto da configuracao dedicada: `zap--advogado`
- regiao da configuracao dedicada: `southamerica-east1`
- `Cloud Tasks API`: habilitada
- bucket de assets dedicado: `gs://zap-advogado-tokenfc-blitz-assets`
- queues dedicadas: criadas
- secrets dedicados: criados
- Cloud SQL dedicado: `tokenfc-blitz-db`
- database: `tokenfc`
- usuario do app: `tokenfc_app`
- secret `tokenfc-blitz-database-url`: preenchido

---

# 3. Leitura pratica

O ambiente local tem base forte para trabalhar com `GCP`. Os bloqueios restantes sao apenas de fluxo local complementar:

- o projeto ativo atual no `default` ainda nao e o contexto do hackathon
- `ADC` nao esta configurado

Pontos ja resolvidos:

- configuracao `tokenfc-blitz` criada
- `Foundry` instalado
- wrapper `gcloud_tokenfc.ps1` validado
- service accounts do Token F.C. criadas
- Artifact Registry do Token F.C. criado
- IAM minimo do hackathon aplicado
- Cloud SQL do Token F.C. criado e operacional
- `DATABASE_URL` operacional gravada no Secret Manager

---

# 4. Acoes recomendadas antes do Blitz

## GCP

- usar a configuracao `tokenfc-blitz`
- manter o `default` sem alteracoes
- decidir se o fluxo local vai usar `ADC` ou apenas deploy via `gcloud`

## Contratos

- validar `forge` e `cast` no terminal do dia

## Operacao

- manter a separacao por prefixo, labels e service accounts dentro do projeto compartilhado
- usar sempre o wrapper `gcloud_tokenfc.ps1` para nao misturar contexto

---

# 5. Bloqueadores reais neste momento

- `ADC` ainda indisponivel se alguma ferramenta exigir autenticacao via SDK
- projeto `gcloud` ativo no `default` continua incorreto para o contexto do hackathon, embora a configuracao `tokenfc-blitz` ja exista
