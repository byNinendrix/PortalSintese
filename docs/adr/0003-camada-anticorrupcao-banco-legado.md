# ADR 0003 - Camada Anticorrupcao para Banco Legado

- Status: Aceito
- Data: 2026-05-04

## Contexto

O SQL Server 2014 legado e a fonte oficial inicial de dados/estrutura. O schema legado pode conter naming técnico, acoplamentos historicos e regras implícitas que não devem contaminar diretamente o domínio da nova aplicacao.

## Decisão

Adotar uma camada anticorrupcao entre módulos de negócio novos e acesso ao banco legado.

Diretrizes:
1. Módulos de domínio (`auth`, `users`, `convenios`, `parceiros`) não acessam driver/ORM legado diretamente.
2. Todo acesso ao legado passa por `infra/legacy-database`.
3. O contrato da camada expoe capacidades técnicas controladas, não tabelas cruas.
4. Mapeamentos tabela->domínio so serao implementados após inventario CSV e validação funcional.

## Consequencias

Positivas:
- reduz acoplamento com schema legado;
- facilita futura migração/coexistencia com PostgreSQL;
- melhora testabilidade e governanca de regras.

Trade-offs:
- adiciona etapa de adaptacao e mapeamento;
- exige disciplina para não burlar a camada de infraestrutura.

## Guardrails

- Não implementar queries reais sem inventario validado.
- Não presumir tabelas, colunas ou relacionamentos.
- Não adicionar credenciais em codigo ou repositório.



