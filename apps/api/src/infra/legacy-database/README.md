# Legacy Database Layer

## Papel da Camada

Esta camada implementa o ponto único de contato entre a nova aplicacao e o banco legado SQL Server 2014.

Objetivos:
- isolar módulos de negócio dos detalhes técnicos do legado;
- evitar acoplamento direto a schema historico;
- permitir troca de estratégia de conexão (mssql vs TypeORM) com impacto controlado.

## Estrutura Atual

- `legacy-database.module.ts`: módulo global de infraestrutura.
- `legacy-database.service.ts`: contrato técnico inicial da camada.
- `drivers/mssql-legacy.client.ts`: placeholder para driver `mssql`.
- `drivers/typeorm-legacy.client.ts`: placeholder para `TypeORM`.

## Estado Atual

- Não ha conexão real implementada.
- Não ha query real implementada.
- Não ha mapeamento de tabela/coluna.

## Como será implementada futuramente

1. Usar inventario CSV validado para definir contratos de leitura por contexto.
2. Executar POC comparativa (`mssql` vs `TypeORM`).
3. Escolher estratégia final por ADR.
4. Implementar cliente escolhido com:
- timeout;
- pool de conexoes;
- logs estruturados;
- tratamento de erro padronizado.
5. Conectar adaptadores aos módulos de domínio via interfaces, sem expor schema legado cru.



