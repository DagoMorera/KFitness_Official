/* Script: 023B_Rutinas_Legado_Compat_024.sql - Compatibilidad incremental para 024/025 */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF SCHEMA_ID(N'rut') IS NULL THROW 51000, 'No existe el esquema rut. Aplique primero las migraciones base.', 1;

IF OBJECT_ID(N'rut.RutinaSesiones', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'rut.RutinaSesiones', N'OrdenSesion') IS NULL
        ALTER TABLE rut.RutinaSesiones ADD OrdenSesion INT NULL;

    IF COL_LENGTH(N'rut.RutinaSesiones', N'Orden') IS NOT NULL
        EXEC(N'UPDATE rs SET OrdenSesion = rs.Orden FROM rut.RutinaSesiones rs WHERE rs.OrdenSesion IS NULL AND rs.Orden IS NOT NULL;');

    EXEC(N';WITH faltantes AS (
        SELECT rs.IdSesionRutina, ROW_NUMBER() OVER(PARTITION BY rs.IdRutina ORDER BY rs.IdSesionRutina) AS rn
        FROM rut.RutinaSesiones rs
        WHERE rs.OrdenSesion IS NULL OR rs.OrdenSesion <= 0
    )
    UPDATE rs SET OrdenSesion = f.rn FROM rut.RutinaSesiones rs INNER JOIN faltantes f ON f.IdSesionRutina = rs.IdSesionRutina;');

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'rut.RutinaSesiones') AND name = N'OrdenSesion' AND is_nullable = 1)
        EXEC(N'ALTER TABLE rut.RutinaSesiones ALTER COLUMN OrdenSesion INT NOT NULL;');

    IF COL_LENGTH(N'rut.RutinaSesiones', N'FechaActualizacion') IS NULL
        ALTER TABLE rut.RutinaSesiones ADD FechaActualizacion DATETIME2(0) NULL;
END;

IF OBJECT_ID(N'rut.Ejercicios', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'rut.Ejercicios', N'NombreNormalizado') IS NULL ALTER TABLE rut.Ejercicios ADD NombreNormalizado NVARCHAR(180) NULL;
    IF COL_LENGTH(N'rut.Ejercicios', N'GrupoMuscular') IS NULL ALTER TABLE rut.Ejercicios ADD GrupoMuscular NVARCHAR(120) NULL;
    IF COL_LENGTH(N'rut.Ejercicios', N'Implemento') IS NULL ALTER TABLE rut.Ejercicios ADD Implemento NVARCHAR(120) NULL;
    IF COL_LENGTH(N'rut.Ejercicios', N'TecnicaInstrucciones') IS NULL ALTER TABLE rut.Ejercicios ADD TecnicaInstrucciones NVARCHAR(2000) NULL;
    IF COL_LENGTH(N'rut.Ejercicios', N'FechaActualizacion') IS NULL ALTER TABLE rut.Ejercicios ADD FechaActualizacion DATETIME2(0) NULL;

    IF COL_LENGTH(N'rut.Ejercicios', N'Instrucciones') IS NOT NULL
        EXEC(N'UPDATE e SET TecnicaInstrucciones = e.Instrucciones FROM rut.Ejercicios e WHERE (e.TecnicaInstrucciones IS NULL OR LEN(LTRIM(RTRIM(e.TecnicaInstrucciones))) = 0) AND e.Instrucciones IS NOT NULL AND LEN(LTRIM(RTRIM(e.Instrucciones))) > 0;');

    EXEC(N'UPDATE e
    SET NombreNormalizado = UPPER(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(e.Nombre)), CHAR(13), N'' ''), CHAR(10), N'' ''), N''  '', N'' ''))
    FROM rut.Ejercicios e
    WHERE e.NombreNormalizado IS NULL OR LEN(LTRIM(RTRIM(e.NombreNormalizado))) = 0;');

    EXEC(N';WITH duplicados AS (
        SELECT IdEjercicio, NombreNormalizado, ROW_NUMBER() OVER(PARTITION BY NombreNormalizado ORDER BY IdEjercicio) AS rn
        FROM rut.Ejercicios
        WHERE NombreNormalizado IS NOT NULL AND LEN(LTRIM(RTRIM(NombreNormalizado))) > 0
    )
    UPDATE e
    SET NombreNormalizado = LEFT(e.NombreNormalizado, 160) + N''_'' + CONVERT(NVARCHAR(18), e.IdEjercicio)
    FROM rut.Ejercicios e INNER JOIN duplicados d ON d.IdEjercicio = e.IdEjercicio
    WHERE d.rn > 1;');

    EXEC(N'UPDATE e SET NombreNormalizado = N''EJERCICIO_'' + CONVERT(NVARCHAR(18), e.IdEjercicio) FROM rut.Ejercicios e WHERE e.NombreNormalizado IS NULL OR LEN(LTRIM(RTRIM(e.NombreNormalizado))) = 0;');

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'rut.Ejercicios') AND name = N'NombreNormalizado' AND is_nullable = 1)
        EXEC(N'ALTER TABLE rut.Ejercicios ALTER COLUMN NombreNormalizado NVARCHAR(180) NOT NULL;');
END;

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'023B_Rutinas_Legado_Compat_024.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion) VALUES (N'023B_Rutinas_Legado_Compat_024.sql', N'Compatibiliza estructuras legadas de rutinas para migraciones 024 y 025.');

COMMIT;
