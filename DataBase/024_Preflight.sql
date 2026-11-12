/* Read-only compatibility check. Run with sqlcmd -b before 024. */
IF OBJECT_ID(N'rut.Rutinas',N'U') IS NULL OR OBJECT_ID(N'cfg.Migraciones',N'U') IS NULL
 THROW 51000, 'Se requiere el esquema base y 022_Rutinas.sql.',1;
IF OBJECT_ID(N'rut.RutinaSesiones',N'U') IS NOT NULL AND
 (COL_LENGTH(N'rut.RutinaSesiones',N'IdSesionRutina') IS NULL OR
 COL_LENGTH(N'rut.RutinaSesiones',N'OrdenSesion') IS NULL OR
 COL_LENGTH(N'rut.RutinaSesiones',N'Activa') IS NULL)
 THROW 51000, 'RutinaSesiones usa otra estructura. No ejecute 024 hasta preparar una migración compatible con su base.',1;
IF OBJECT_ID(N'rut.Ejercicios',N'U') IS NOT NULL AND
 (COL_LENGTH(N'rut.Ejercicios',N'NombreNormalizado') IS NULL OR
 COL_LENGTH(N'rut.Ejercicios',N'TecnicaInstrucciones') IS NULL OR
 COL_LENGTH(N'rut.Ejercicios',N'ImagenReferencia') IS NULL)
 THROW 51000, 'Ejercicios usa otra estructura. Se requiere una migración compatible; no borre la tabla.',1;


IF EXISTS (
 SELECT 1 FROM sys.indexes i
 WHERE i.object_id=OBJECT_ID(N'rut.RutinaSesiones') AND i.is_unique=1 AND i.has_filter=0
 AND EXISTS(SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name=N'IdRutina')
 AND EXISTS(SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name=N'OrdenSesion')
 AND (SELECT COUNT(*) FROM sys.index_columns ic WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)=2
)
 THROW 51000, 'El índice único de sesiones no permite conservar versiones inactivas. Revise su definición antes de migrar.',1;

SELECT DB_NAME() AS BaseSeleccionada, N'Compatible con el editor 024' AS Resultado;
