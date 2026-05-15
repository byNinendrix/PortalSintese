# ADR 0004 - Estratégia de Conexão com SQL Server 2014

- Status: Proposto
- Data: 2026-05-04

## Contexto

O projeto precisa definir a estratégia de conexão com SQL Server 2014 para a camada de integração legado. Duas abordagens estão em avaliação:
- Driver `mssql`
- `TypeORM` com SQL Server

A decisão ainda não pode ser tomada sem POC comparativa baseada no inventario real do legado.

## Decisão (Pendente)

Decisão adiada ate conclusao da POC técnica documentada em:
- `docs/poc-sqlserver-2014.md`

## Criterios de Decisão

1. Compatibilidade real com SQL Server 2014.
2. Seguranca de conexão e gestao de credenciais.
3. Performance em leituras criticas.
4. Facilidade de manutencao e observabilidade.
5. Aderencia a camada anticorrupcao e baixo acoplamento.

## Proximos Passos

1. Receber e analisar CSVs do inventario.
2. Definir cenarios de leitura para benchmark técnico.
3. Executar POC controlada para `mssql` e `TypeORM`.
4. Atualizar este ADR para `Aceito` com decisão final e justificativa.



