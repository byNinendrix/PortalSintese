# ADR 0002 - Banco Legado SQL Server 2014 como Fonte Oficial Inicial

- Status: Aceito
- Data: 2026-05-04

## Contexto

Foi confirmado que o sistema legado Maker possui banco SQL Server 2014 com tabelas e dados reais ja em operacao.

Para evitar divergencia funcional, a migração deve seguir abordagem database-first, usando o schema real como referencia inicial de estrutura e comportamento de dados.

## Decisão

1. SQL Server 2014 e a fonte oficial inicial de dados e regra estrutural.
2. Não criar modelo definitivo em PostgreSQL neste momento.
3. Não presumir tabelas, campos ou relacionamentos sem inventario do legado.
4. Criar camada de integração/adaptacao para leitura do legado antes de qualquer migração de dados.
5. PostgreSQL permanece provisionado no Docker apenas como alvo futuro/opcional.

## Prisma - Status e Validação

Prisma possui suporte a SQL Server, mas será considerado apenas após validação prática para SQL Server 2014 no contexto real do legado (tipos, introspection, performance e compatibilidade de queries).

Até essa validação, evitar comprometer a arquitetura com um ORM único.

Alternativas caso Prisma não seja adequado:
- TypeORM (maduro para NestJS e SQL Server);
- Knex + driver `mssql` (controle fino de SQL e adaptadores);
- Driver `mssql` direto para camada de leitura e anti-corruption layer.

## Consequencias

Positivas:
- menor risco de quebrar regras implícitas do sistema atual;
- melhor rastreabilidade entre legado e novo sistema;
- migração incremental com menor impacto operacional.

Trade-offs:
- curva inicial maior de descoberta de schema;
- possível coexistencia temporaria de bancos;
- maior esforco de mapeamento e documentacao antes de acelerar features.

## Guardrails

- Nenhuma regra de negócio será reescrita sem evidencia do legado.
- Nenhuma migração para PostgreSQL será executada antes do inventario validado.
- Decisão final de persistencia (SQL Server direto, coexistencia, ou migração) será tomada após POC técnica e avaliação de risco.



