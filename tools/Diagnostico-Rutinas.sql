/* Read-only schema inventory; no credentials or customer records. */
SELECT DB_NAME() AS BaseActual;
SELECT s.name AS Esquema,t.name AS Tabla,c.name AS Columna,ty.name AS Tipo,c.max_length,c.is_nullable
FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id
WHERE s.name=N'rut' ORDER BY t.name,c.column_id;
SELECT Script FROM cfg.Migraciones WHERE Script LIKE N'%Rutina%' ORDER BY Script;
