# Portal SINTESE - Migração do Legado Maker

Base inicial do novo sistema SINTESE com arquitetura moderna, responsiva e escalável.

## Visao do Projeto

Este repositório implementa o esqueleto técnico da migração do sistema Maker (Softwell), preservando regras do legado por abordagem incremental e validada.

Principios:
- não presumir regra de negócio;
- modularidade e manutencao;
- foco em performance e seguranca;
- frontend mobile-first com design system padronizado;
- database-first com SQL Server 2014 como fonte oficial inicial.

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, NestJS
- Banco (fonte atual): SQL Server 2014 legado
- Banco (alvo futuro/opcional): PostgreSQL
- Infra: Docker + Docker Compose
- Auth (alvo): JWT + Refresh Token
- Monorepo: pnpm workspaces

## Estrutura

```text
apps/
  api/               # NestJS (modular) + camada de adaptacao ao legado
  web/               # React + Vite + Tailwind
packages/
  ui/                # Componentes reutilizaveis de interface
  types/             # Tipos compartilhados de contrato
infra/
  docker/            # Docker Compose e artefatos de infraestrutura local
docs/
  adr/                               # Architecture Decision Records
  arquitetura.md                     # arquitetura atual
  banco-legado-sqlserver.md          # plano database-first e checklist
  migração-maker.md                  # roadmap incremental
  sql/inventario-schema-sqlserver-2014.sql
```

## Execucao Local

Pre-requisitos:
- Node.js 20+
- pnpm 10+
- Docker e Docker Compose

1. Instalar dependencias:

```bash
pnpm install
```

2. Subir PostgreSQL local (somente alvo futuro/opcional):

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

3. Preparar variaveis de ambiente:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

4. Rodar apps em desenvolvimento (web + api):

```bash
pnpm dev
```

Atalhos:

```bash
pnpm dev:web
pnpm dev:api
```

## Estado Atual da Persistencia

- SQL Server 2014 e a fonte oficial inicial.
- Nenhuma integração real com SQL Server foi implementada ainda (aguardando credenciais e acesso).
- Não existe modelo definitivo em PostgreSQL nesta fase.
- Prisma esta em avaliação de compatibilidade para SQL Server 2014.
- Fundacao da camada anticorrupcao no backend foi preparada sem conexão real.
- Integração real depende de:
  - inventario CSV validado;
  - credenciais seguras fornecidas fora do repositório;
  - aprovacao técnica da estratégia de driver/ORM.

## Inventario do Banco Legado

Documentacao e script oficial desta fase:
- `docs/banco-legado-sqlserver.md`
- `docs/runbook-inventario-sqlserver.md`
- `docs/sql/inventario-schema-sqlserver-2014.sql`
- `docs/sql/README.md`
- `docs/templates/dicionario-dados-template.md`
- `docs/templates/mapeamento-módulos-template.md`

Use o script no SQL Server Management Studio (SSMS) para extrair:
- tabelas
- colunas e tipos
- chaves primarias
- foreign keys
- índices

## Etapa Atual - Inventario do banco legado SQL Server 2014

Fluxo oficial desta etapa:
1. Executar inventario em modo somente leitura (SSMS), conforme runbook.
2. Exportar os 5 blocos para CSV com padrao de nomes.
3. Preencher templates de dicionario e mapeamento de módulos.
4. Compartilhar artefatos para analise técnica controlada.

## Frontend Data Layer (Mock -> API)

- Feature flag: `VITE_USE_MOCKS=true|false`
- Documentacao: `docs/frontend-data-layer.md`
- Páginas usam hooks de dados (`useQuery` / `useMutation`) e não chamam services diretamente.

## ADRs

- `docs/adr/0001-arquitetura-inicial.md`
- `docs/adr/0002-banco-legado-sqlserver-2014.md`
- `docs/adr/0003-camada-anticorrupcao-banco-legado.md`


