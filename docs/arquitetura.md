# Arquitetura Inicial (Atualizada para Database-First)

## Direcao Arquitetural

- Monorepo com `apps/*` e `packages/*`.
- Frontend desacoplado do banco, consumindo API.
- Backend com NestJS modular e camada de adaptacao para legado.
- SQL Server 2014 legado como fonte oficial inicial de dados/estrutura.
- PostgreSQL mantido apenas como alvo futuro/opcional.

## Frontend (`apps/web`)

- React 18 + TypeScript + Vite
- Tailwind CSS mobile-first
- Organizacao por domínio:
  - `features/auth`
  - `features/convenios`
  - `shared/*`
- Shell responsivo com sidebar:
  - desktop fixa
  - mobile drawer com overlay

## Backend (`apps/api`)

- NestJS modular:
  - `auth`
  - `users`
  - `convenios`
  - `parceiros`
- Prefixo global: `/api/v1`
- Validação global com `ValidationPipe`
- Estratégia de persistencia (fase atual):
  - database-first
  - sem modelo definitivo local ate concluir inventario do SQL Server 2014
  - camada de anti-corruption/adaptacao entre domínio novo e legado

## Camada Anticorrupcao (Legado)

Objetivo:
- isolar o domínio novo dos detalhes fisicos do SQL Server legado.

Fundacao implementada:
- `src/config/env.ts`: carregamento e validação de ambiente.
- `src/infra/legacy-database/legacy-database.module.ts`
- `src/infra/legacy-database/legacy-database.service.ts`

Regras:
- módulos de negócio não acessam driver SQL diretamente;
- sem query real antes do inventario CSV e validação funcional;
- sem acoplamento a nomes de tabela/coluna não confirmados.

## Pacotes Compartilhados

- `packages/ui`: componentes base de interface
- `packages/types`: tipos de request/response compartilhados

## Infraestrutura

- Docker Compose com PostgreSQL 16 (futuro/opcional)
- variaveis via `.env` e `apps/api/.env`
- conexão real com SQL Server será configurada apenas quando credenciais forem disponibilizadas

## ORM/Driver - Politica Atual

- Prisma: permitido apenas para avaliação técnica de compatibilidade com SQL Server 2014.
- Se Prisma não atender requisitos, adotar TypeORM, Knex + `mssql`, ou `mssql` direto para camada de leitura do legado.

## Observacoes de Seguranca

- JWT/refresh preparado em contrato técnico, sem segredo em codigo.
- Segredos sempre por variavel de ambiente.
- Rotacao/revogacao de refresh token será detalhada em ADR específico.


