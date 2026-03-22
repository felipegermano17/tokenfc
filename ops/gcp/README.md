# GCP Ops - Token F.C.

Este diretorio organiza o uso do projeto `zap--advogado` para o hackathon sem misturar recursos com outras iniciativas.

Projeto GCP usado:

- `zap--advogado`

Configuracao isolada criada no `gcloud`:

- `tokenfc-blitz`

Arquivos desta pasta:

- [resource_isolation.md](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\resource_isolation.md)
- [resource_plan.md](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\resource_plan.md)
- [provisioned_state.md](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\provisioned_state.md)
- [activate_tokenfc_blitz.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\activate_tokenfc_blitz.ps1)
- [gcloud_tokenfc.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\gcloud_tokenfc.ps1)
- [set_tokenfc_database_secret.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\set_tokenfc_database_secret.ps1)
- [set_monad_rpc_secret.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\set_monad_rpc_secret.ps1)
- [set_text_secret.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\set_text_secret.ps1)
- [create_wallet_secret.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\create_wallet_secret.ps1)
- [create_operational_wallets.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\create_operational_wallets.ps1)
- [check_play_ready.ps1](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\check_play_ready.ps1)
- [wallet_inventory.md](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\wallet_inventory.md)
- [play_mode.md](C:\Users\user\Documents\Playground\tokenfc\ops\gcp\play_mode.md)

Uso recomendado:

1. ativar ou usar a configuracao `tokenfc-blitz`
2. criar recursos sempre com prefixo `tokenfc-blitz-`
3. aplicar labels padrao em todos os recursos suportados
4. usar `set_tokenfc_database_secret.ps1` sempre que precisar rotacionar a senha do app e regravar a `DATABASE_URL`
5. usar `check_play_ready.ps1` para validar se o modo "dar play" ja esta pronto
