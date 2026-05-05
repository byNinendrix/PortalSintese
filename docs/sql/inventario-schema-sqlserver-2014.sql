/*
  Inventario de metadados - SQL Server 2014
  Escopo:
  - tabelas
  - colunas
  - tipos
  - chaves primarias
  - foreign keys
  - indices
*/

SET NOCOUNT ON;

PRINT '1) TABELAS (schema + nome)';
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  t.create_date,
  t.modify_date
FROM sys.tables t
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
ORDER BY s.name, t.name;

PRINT '2) COLUNAS (tipo, tamanho, nulabilidade, identity, default)';
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  c.column_id,
  c.name AS column_name,
  ty.name AS data_type,
  c.max_length,
  c.precision,
  c.scale,
  c.is_nullable,
  c.is_identity,
  dc.definition AS default_definition
FROM sys.columns c
INNER JOIN sys.tables t ON t.object_id = c.object_id
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
INNER JOIN sys.types ty ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
ORDER BY s.name, t.name, c.column_id;

PRINT '3) CHAVES PRIMARIAS (PK)';
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  kc.name AS pk_name,
  ic.key_ordinal,
  c.name AS column_name
FROM sys.key_constraints kc
INNER JOIN sys.tables t ON t.object_id = kc.parent_object_id
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
INNER JOIN sys.index_columns ic
  ON ic.object_id = kc.parent_object_id
 AND ic.index_id = kc.unique_index_id
INNER JOIN sys.columns c
  ON c.object_id = ic.object_id
 AND c.column_id = ic.column_id
WHERE kc.type = 'PK'
ORDER BY s.name, t.name, kc.name, ic.key_ordinal;

PRINT '4) FOREIGN KEYS (FK)';
SELECT
  ps.name AS parent_schema,
  pt.name AS parent_table,
  pc.name AS parent_column,
  fk.name AS fk_name,
  rs.name AS referenced_schema,
  rt.name AS referenced_table,
  rc.name AS referenced_column,
  fkc.constraint_column_id AS fk_column_order,
  fk.delete_referential_action_desc AS on_delete_action,
  fk.update_referential_action_desc AS on_update_action
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
INNER JOIN sys.tables pt ON pt.object_id = fkc.parent_object_id
INNER JOIN sys.schemas ps ON ps.schema_id = pt.schema_id
INNER JOIN sys.columns pc
  ON pc.object_id = fkc.parent_object_id
 AND pc.column_id = fkc.parent_column_id
INNER JOIN sys.tables rt ON rt.object_id = fkc.referenced_object_id
INNER JOIN sys.schemas rs ON rs.schema_id = rt.schema_id
INNER JOIN sys.columns rc
  ON rc.object_id = fkc.referenced_object_id
 AND rc.column_id = fkc.referenced_column_id
ORDER BY ps.name, pt.name, fk.name, fkc.constraint_column_id;

PRINT '5) INDICES (clustered/nonclustered, unicidade, colunas)';
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  i.name AS index_name,
  i.type_desc AS index_type,
  i.is_unique,
  i.is_primary_key,
  i.is_unique_constraint,
  ic.key_ordinal,
  ic.is_included_column,
  c.name AS column_name
FROM sys.indexes i
INNER JOIN sys.tables t ON t.object_id = i.object_id
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
INNER JOIN sys.index_columns ic
  ON ic.object_id = i.object_id
 AND ic.index_id = i.index_id
INNER JOIN sys.columns c
  ON c.object_id = ic.object_id
 AND c.column_id = ic.column_id
WHERE i.name IS NOT NULL
  AND i.is_hypothetical = 0
ORDER BY s.name, t.name, i.name, ic.key_ordinal, ic.index_column_id;

