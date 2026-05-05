# ADR 0001 - Arquitetura Inicial da Migração Maker

- Status: Aceito
- Data: 2026-05-04

## Contexto

O sistema SINTESE legado esta em Maker (Softwell) e será migrado para uma arquitetura moderna, responsiva e escalável, com foco em:
- preservacao de regras de negócio existentes;
- alta performance (API < 300ms em operacoes comuns e UI < 2s);
- separacao clara de responsabilidades;
- manutencao facilitada.

## Decisão

Adotar monorepo com `pnpm` e estrutura por aplicacoes/pacotes:
- `apps/web`: React 18 + TypeScript + Vite + Tailwind;
- `apps/api`: NestJS;
- `packages/ui`: componentes reutilizaveis de UI;
- `packages/types`: contratos tipados compartilhados;
- `infra`: Docker e compose;
- `docs`: arquitetura, ADRs e roadmap de migração.

Autenticação alvo: JWT + Refresh Token (detalhes de seguranca em ADR dedicado).

Atualizacao:
- A decisão de banco foi refinada no ADR 0002.
- SQL Server 2014 legado passa a ser fonte oficial inicial (database-first).
- PostgreSQL permanece como alvo futuro/opcional.

## Consequencias

Positivas:
- padronizacao técnica e visual;
- alta reutilizacao entre módulos;
- menor acoplamento entre frontend e backend;
- base preparada para crescimento incremental.

Trade-offs:
- demanda disciplina de versionamento entre pacotes;
- exige onboarding inicial em monorepo/pnpm;
- requer governanca de contratos para evitar drift entre legado e novo sistema.

## Restricoes e Guardrails

- Não implementar regra de negócio presumida sem validação funcional.
- Todos os fluxos criticos devem ser mapeados contra o legado antes de hardening.
- Endpoints criados nesta fase sao scaffolds técnicos, não implementacao final.



