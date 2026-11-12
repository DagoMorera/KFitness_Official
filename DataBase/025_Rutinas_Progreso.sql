/* Apply after 022 and 024 in the selected database. Preserves all existing rows. */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF COL_LENGTH(N'rut.RutinaSesiones',N'IdSesionRutina') IS NULL
    THROW 51000, 'Se requiere el esquema 024. Revise la estructura existente antes de continuar.', 1;
IF OBJECT_ID(N'rut.ProgresoSesiones',N'U') IS NULL
BEGIN
 CREATE TABLE rut.ProgresoSesiones (
 IdEjecucion BIGINT IDENTITY PRIMARY KEY,
 IdAsignacionRutina BIGINT NOT NULL REFERENCES rut.AsignacionesRutina(IdAsignacionRutina),
 IdSesionRutina INT NOT NULL REFERENCES rut.RutinaSesiones(IdSesionRutina),
 FechaInicio DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 FechaFin DATETIME2(0) NULL,
 PlanJson NVARCHAR(MAX) NOT NULL,
 CONSTRAINT CK_ProgresoSesiones_Plan CHECK(ISJSON(PlanJson)=1)
 );
 CREATE UNIQUE INDEX UX_ProgresoSesiones_Abierta ON rut.ProgresoSesiones(IdAsignacionRutina,IdSesionRutina) WHERE FechaFin IS NULL;
 CREATE TABLE rut.ProgresoEjercicios (
 IdEjecucion BIGINT NOT NULL REFERENCES rut.ProgresoSesiones(IdEjecucion),
 IdRutinaEjercicio BIGINT NOT NULL REFERENCES rut.RutinaEjercicios(IdRutinaEjercicio),
 Completado BIT NOT NULL DEFAULT 0,
 CONSTRAINT PK_ProgresoEjercicios PRIMARY KEY(IdEjecucion,IdRutinaEjercicio)
 );
END;
IF NOT EXISTS(SELECT 1 FROM cfg.Migraciones WHERE Script=N'025_Rutinas_Progreso.sql')
 INSERT cfg.Migraciones(Script,Descripcion) VALUES(N'025_Rutinas_Progreso.sql',N'Ejecuciones con copia de sesión e historial de progreso.');
COMMIT;
