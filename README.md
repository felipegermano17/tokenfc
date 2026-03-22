# Token F.C.

Monorepo do MVP do Token F.C. para o hackathon da Monad Testnet.

## Apps

- `apps/web`: interface Next.js reaproveitando o mock funcional existente
- `apps/api`: API Fastify para sessao, onboarding, ranking, shop e topup
- `apps/worker`: worker Fastify para intents, retries e reconciliacao

## Packages

- `packages/db`: schema, migrations e seed do Postgres
- `packages/contracts`: contratos Foundry para `TFCToken`, `ClubPass` e `ClubContest`
