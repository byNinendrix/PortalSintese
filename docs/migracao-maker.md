# Roadmap de Migração Maker (Softwell) -> Nova Plataforma

## 1. Inventario do Banco Legado (SQL Server 2014)

Objetivo:
- mapear schema real e objetos que sustentam regras do sistema.

Entregaveis:
- inventario de tabelas, colunas, PK, FK e índices;
- mapeamento de views, procedures e triggers;
- baseline de estrutura oficial do legado.

Criterio de saida:
- inventario técnico validado e versionado em `docs/`.

## 2. Mapeamento Funcional (Tela x Dados)

Objetivo:
- conectar fluxos funcionais do Maker com estruturas reais de banco.

Entregaveis:
- matriz tela/campo/regra/origem no SQL Server;
- backlog priorizado por risco e valor.

Criterio de saida:
- regras criticas documentadas e validadas com negócio.

## 3. Fundacao Técnica

Objetivo:
- consolidar monorepo, design system base, infraestrutura local e contratos de API.

Entregaveis:
- `apps/web`, `apps/api`, `packages/ui`, `packages/types`, `infra`, `docs`;
- PostgreSQL no Docker como alvo futuro/opcional;
- ADRs iniciais publicados.

## 4. Adaptacao de Leitura ao Legado

Escopo:
- camada de integração/adaptacao para consumo do SQL Server 2014.

Estratégia:
- anti-corruption layer entre domínio novo e schema legado;
- sem alterar regras de negócio;
- foco em observabilidade e rastreabilidade.

## 5. Migração de Módulos Criticos

Prioridade:
1. autenticação e acesso
2. cadastro inicial
3. recuperacao de senha
4. convenios por ramo
5. parceiros e beneficios

## 6. Decisão de Persistencia Alvo

Opcoes:
- SQL Server direto;
- coexistencia SQL Server + PostgreSQL;
- migração gradual para PostgreSQL.

Decisão será formalizada em ADR após:
- POC técnica;
- analise de risco operacional;
- custo de manutencao;
- impacto de performance.



