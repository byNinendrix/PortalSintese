# Banco Legado SQL Server 2014 - Plano Database-First

## Objetivo

Documentar e executar o inventario técnico do banco legado SQL Server 2014, que passa a ser a fonte oficial inicial de estrutura de dados do sistema.

## Escopo desta fase

- Identificar estrutura real do banco legado.
- Mapear dependencias entre tabelas.
- Levantar objetos criticos para performance e integridade.
- Não alterar schema e não migrar dados nesta fase.

## Checklist de Inventario

1. Confirmar ambiente de leitura:
- instancia SQL Server 2014
- database alvo
- usuario com permissao de leitura em metadados

2. Extrair catalogo estrutural:
- schemas existentes
- tabelas por schema
- colunas e tipos
- nulabilidade e defaults
- colunas identity

3. Extrair integridade relacional:
- chaves primarias
- chaves estrangeiras
- cardinalidade de relacionamento (inferida por FK)

4. Extrair performance estrutural:
- índices clustered/nonclustered
- ordem de colunas indexadas
- unicidade
- (opcional) estatísticas básicas de row count por tabela

5. Extrair objetos de logica de negócio:
- views
- procedures
- functions
- triggers

6. Consolidar evidencias:
- salvar resultado bruto (CSV ou planilha)
- consolidar dicionario de dados inicial
- marcar tabelas candidatas por módulo de negócio (auth, cadastro, convenios, parceiros)

## Plano Técnico de Mapeamento do Schema

Fase A - Descoberta estrutural:
- rodar script padrao de inventario de metadados
- gerar snapshot versionado em `docs/` (sem dados sensiveis)

Fase B - Classificacao funcional:
- agrupar tabelas por domínio funcional
- mapear dependencias diretas e indiretas
- destacar tabelas de alto risco (alto volume, alta criticidade, muitas FKs)

Fase C - Validação com negócio e legado:
- revisar nomes técnicos vs significado funcional
- identificar regras implícitas em procedures/triggers
- aprovar baseline de schema oficial para migração incremental

Fase D - Decisão de persistencia:
- avaliar SQL Server direto x coexistencia x migração gradual para PostgreSQL
- abrir ADR complementar com decisão final

## Prisma e Compatibilidade com SQL Server 2014

Status atual: em avaliação.

Pontos de validação obrigatorios antes de produção:
- compatibilidade real de introspection no SQL Server 2014;
- suporte aos tipos existentes no legado;
- comportamento com chaves compostas e defaults complexos;
- performance em consultas de leitura principais;
- maturidade para estratégia de coexistencia.

Caso falhe na validação:
- priorizar TypeORM ou Knex + `mssql` para camada de adaptacao.

## Entregaveis esperados desta fase

- `docs/banco-legado-sqlserver.md` atualizado com resultados.
- arquivo SQL padrao de inventario em `docs/sql/inventario-schema-sqlserver-2014.sql`.
- backlog técnico com itens de mapeamento por módulo.



