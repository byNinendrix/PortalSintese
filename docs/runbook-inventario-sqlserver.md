# Runbook - Inventario SQL Server 2014 (Somente Leitura)

## Objetivo

Executar o inventario técnico do schema legado no SQL Server Management Studio (SSMS), sem alterar dados, schema ou permissoes.

## Escopo

- Executar apenas script de metadados:
  - `docs/sql/inventario-schema-sqlserver-2014.sql`
- Exportar resultados para CSV.
- Guardar evidencias para analise técnica posterior.

## Regras de Seguranca

- Não criar credenciais novas no repositório.
- Não salvar senha em arquivo local/versionado.
- Não executar comandos `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `ALTER`, `DROP`, `TRUNCATE`, `CREATE`.
- Não alterar schema, índices, constraints ou dados.
- Executar somente em contexto controlado e com usuario de leitura.

## Checklist Antes da Execucao

1. Confirmar acesso ao SSMS em ambiente autorizado.
2. Confirmar database alvo correto (legado Maker).
3. Confirmar usuario com permissao de leitura de metadados.
4. Abrir script oficial:
   - `docs/sql/inventario-schema-sqlserver-2014.sql`
5. Revisar visualmente se o script contem apenas `SELECT` e `PRINT`.
6. Definir pasta local de exportação (fora do repositório, se houver dados sensíveis).

## Passo a Passo (SSMS)

1. Abrir o SSMS.
2. Conectar no servidor SQL Server 2014 (sem persistir senha).
3. Selecionar o banco legado correto no dropdown de database.
4. Abrir nova query e carregar:
   - `docs/sql/inventario-schema-sqlserver-2014.sql`
5. Executar (`F5`).
6. Validar que foram retornados 5 blocos de resultado:
   - Tabelas
   - Colunas
   - Chaves primarias
   - Foreign keys
   - Indices

## Exportacao para CSV

Para cada grid de resultado:
1. Clique com botao direito no resultado.
2. `Save Results As...`
3. Escolha formato CSV.
4. Salve com o padrao de nome abaixo.

Alternativa:
- No SSMS, habilitar `Results to File` (`Ctrl+Shift+F`) e executar novamente.
- Depois separar cada bloco em CSV individual (preferencialmente com ferramentas internas controladas).

## Padrao de Nome dos Arquivos

Use este padrao:

`inventario_<ambiente>_<database>_<bloco>_<YYYYMMDD>.csv`

Blocos esperados:
- `tabelas`
- `colunas`
- `pk`
- `fk`
- `índices`

Exemplo:
- `inventario_prod_LEGADO_MAKER_tabelas_20260504.csv`
- `inventario_prod_LEGADO_MAKER_colunas_20260504.csv`

## Checklist Depois da Execucao

1. Confirmar que 5 CSVs foram gerados.
2. Confirmar que os CSVs não contem dados de linhas de negócio (apenas metadados).
3. Confirmar que nenhum arquivo com senha foi salvo.
4. Registrar data/hora da execucao e ambiente.
5. Versionar no projeto apenas artefatos permitidos (sem segredos).
6. Compartilhar os CSVs para analise e preenchimento dos templates.

## Entregaveis Esperados

- 5 arquivos CSV de inventario.
- observacoes de execucao (ambiente, data, usuario técnico).
- preenchimento de:
  - `docs/templates/dicionario-dados-template.md`
  - `docs/templates/mapeamento-módulos-template.md`



