# Wallet Inventory - Token F.C.

Data:

- 2026-03-21 10:43:53

Projeto:

- zap--advogado

Config do gcloud:

- tokenfc-blitz

## Wallets operacionais

### Deployer

- secret: tokenfc-blitz-deployer-private-key
- latest version: 1
- address: 0xA5df0c715E7fDdEDa1879A5d8b2daB87F9d58d76
- uso: deploy dos contratos na Monad Testnet

### Operator

- secret: tokenfc-blitz-operator-private-key
- latest version: 1
- address: 0x34E650b3f3d3C6F06B62a85d145212863B28aa50
- uso: operacoes do worker e fallback operacional

## Regras

- private keys ficam apenas no Secret Manager
- enderecos podem ser usados para faucet e observabilidade
- nao reutilizar essas wallets como conta pessoal
