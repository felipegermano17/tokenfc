# Resource Isolation - Token F.C. no projeto zap--advogado

Objetivo:

- usar o projeto `zap--advogado` sem misturar recursos do hackathon com os recursos existentes

---

# 1. Isolamento logico

Como nao vamos separar por projeto, o isolamento precisa acontecer por:

- configuracao dedicada do `gcloud`
- naming convention forte
- labels consistentes
- service accounts especificas
- buckets, filas, servicos e secrets com prefixo proprio

---

# 2. Configuracao de CLI

Configuracao criada:

- `tokenfc-blitz`

Propriedades atuais:

- `core/project = zap--advogado`
- `core/account = germano@20apy.com`
- `run/region = southamerica-east1`
- `compute/region = southamerica-east1`

Importante:

- manter a configuracao `default` intacta
- usar `tokenfc-blitz` apenas para recursos do hackathon

---

# 3. Prefixo obrigatorio de recursos

Prefixo padrao:

- `tokenfc-blitz-`

Exemplos:

- `tokenfc-blitz-web`
- `tokenfc-blitz-api`
- `tokenfc-blitz-worker`
- `tokenfc-blitz-db`
- `zap-advogado-tokenfc-blitz-assets`
- `tokenfc-blitz-onboarding`

---

# 4. Labels obrigatorias

Aplicar sempre que o recurso suportar:

- `app=tokenfc`
- `track=hackathon`
- `workspace=blitz`
- `owner=codex`
- `system=tokenfc-platform`

Label opcional:

- `club-domain=fan-economy`

Observacao:

- o projeto compartilhado atual nao tem tag global de `environment`
- como estamos isolando o hackathon dentro de um projeto existente, a estrategia correta e etiquetar os recursos do Token F.C., nao alterar o projeto inteiro sem alinhamento previo

---

# 5. Service accounts recomendadas

Separar por workload:

- `tokenfc-blitz-web-sa`
- `tokenfc-blitz-api-sa`
- `tokenfc-blitz-worker-sa`

Nao reutilizar service account de outro sistema do projeto.

---

# 6. Secrets recomendados

Usar nomes dedicados:

- `tokenfc-blitz-database-url`
- `tokenfc-blitz-privy-app-id`
- `tokenfc-blitz-privy-app-secret`
- `tokenfc-blitz-monad-rpc-url`
- `tokenfc-blitz-deployer-private-key`
- `tokenfc-blitz-operator-private-key`

Estado atual:

- `tokenfc-blitz-database-url` ja possui uma versao valida gravada para o Cloud SQL do Token F.C.
- os demais secrets seguem apenas com o container criado

---

# 7. Buckets e paths

Bucket recomendado:

- `gs://zap-advogado-tokenfc-blitz-assets`

Paths recomendados:

- `clubs/badges/...`
- `clubs/mock-jerseys/...`
- `products/...`

---

# 8. Regra de ouro

Se um recurso nao tiver:

- configuracao `tokenfc-blitz`
- prefixo `tokenfc-blitz-`
- labels do projeto

ele nao deve ser criado.
