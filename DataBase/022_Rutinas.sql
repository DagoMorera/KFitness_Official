/* Script: 022_Rutinas.sql - Esquema rut reejecutable */
USE KFitness;
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'rut') BEGIN EXEC(N'CREATE SCHEMA rut AUTHORIZATION dbo;'); END
GO
IF OBJECT_ID(N'rut.Rutinas', N'U') IS NULL
BEGIN
CREATE TABLE rut.Rutinas(
IdRutina INT IDENTITY(1,1) NOT NULL,
Nombre NVARCHAR(150) NOT NULL,
NombreNormalizado NVARCHAR(150) NULL,
Descripcion NVARCHAR(1000) NULL,
Objetivo NVARCHAR(200) NOT NULL,
Nivel NVARCHAR(30) NOT NULL,
DuracionAproximadaMin INT NOT NULL,
Activa BIT NOT NULL CONSTRAINT DF_Rutinas_Activa DEFAULT (1),
FechaCreacion DATETIME2(0) NOT NULL CONSTRAINT DF_Rutinas_FechaCreacion DEFAULT SYSDATETIME(),
FechaActualizacion DATETIME2(0) NULL,
IdUsuarioCreador INT NULL,
IdUsuarioActualizador INT NULL,
CONSTRAINT PK_Rutinas PRIMARY KEY (IdRutina),
CONSTRAINT CK_Rutinas_Nombre CHECK (LEN(LTRIM(RTRIM(Nombre))) > 0),
CONSTRAINT CK_Rutinas_Objetivo CHECK (LEN(LTRIM(RTRIM(Objetivo))) > 0),
CONSTRAINT CK_Rutinas_Nivel CHECK (Nivel IN (N'Principiante', N'Intermedio', N'Avanzado')),
CONSTRAINT CK_Rutinas_Duracion CHECK (DuracionAproximadaMin > 0 AND DuracionAproximadaMin <= 600));
END
GO
IF COL_LENGTH(N'rut.Rutinas', N'NombreNormalizado') IS NULL BEGIN ALTER TABLE rut.Rutinas ADD NombreNormalizado NVARCHAR(150) NULL; END
GO
UPDATE rut.Rutinas SET NombreNormalizado = UPPER(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(Nombre)), CHAR(13), N' '), CHAR(10), N' '), N'  ', N' ')) WHERE NombreNormalizado IS NULL;
GO
IF EXISTS (SELECT 1 FROM rut.Rutinas WHERE NombreNormalizado IS NULL OR LEN(LTRIM(RTRIM(NombreNormalizado))) = 0) BEGIN RAISERROR(N'No se pudo normalizar NombreNormalizado en rut.Rutinas.', 16, 1); RETURN; END
GO
IF EXISTS (SELECT 1 FROM rut.Rutinas GROUP BY NombreNormalizado HAVING COUNT(1) > 1) BEGIN RAISERROR(N'Existen nombres de rutina duplicados (normalizados). Corrija antes de crear el indice unico.', 16, 1); RETURN; END
GO
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'rut.Rutinas') AND name = N'NombreNormalizado' AND is_nullable = 1) BEGIN ALTER TABLE rut.Rutinas ALTER COLUMN NombreNormalizado NVARCHAR(150) NOT NULL; END
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'rut.Rutinas') AND name = N'UX_Rutinas_NombreNormalizado') BEGIN CREATE UNIQUE INDEX UX_Rutinas_NombreNormalizado ON rut.Rutinas (NombreNormalizado); END
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'rut.Rutinas') AND name = N'IX_Rutinas_Activa_Nivel') BEGIN CREATE INDEX IX_Rutinas_Activa_Nivel ON rut.Rutinas (Activa, Nivel); END
GO
IF OBJECT_ID(N'rut.AsignacionesRutina', N'U') IS NULL
BEGIN
CREATE TABLE rut.AsignacionesRutina(
IdAsignacionRutina BIGINT IDENTITY(1,1) NOT NULL,
IdRutina INT NOT NULL,
IdUsuario INT NOT NULL,
Activa BIT NOT NULL CONSTRAINT DF_AsignacionesRutina_Activa DEFAULT (1),
FechaAsignacion DATETIME2(0) NOT NULL CONSTRAINT DF_AsignacionesRutina_FechaAsignacion DEFAULT SYSDATETIME(),
FechaFinalizacion DATETIME2(0) NULL,
IdUsuarioAsignador INT NOT NULL,
CONSTRAINT PK_AsignacionesRutina PRIMARY KEY (IdAsignacionRutina),
CONSTRAINT FK_AsignacionesRutina_Rutinas FOREIGN KEY (IdRutina) REFERENCES rut.Rutinas (IdRutina),
CONSTRAINT FK_AsignacionesRutina_Usuario FOREIGN KEY (IdUsuario) REFERENCES seg.Usuarios (IdUsuario),
CONSTRAINT FK_AsignacionesRutina_Asignador FOREIGN KEY (IdUsuarioAsignador) REFERENCES seg.Usuarios (IdUsuario));
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'rut.AsignacionesRutina') AND name = N'UX_AsignacionesRutina_UsuarioRutinaActiva') BEGIN CREATE UNIQUE NONCLUSTERED INDEX UX_AsignacionesRutina_UsuarioRutinaActiva ON rut.AsignacionesRutina (IdUsuario, IdRutina) WHERE Activa = 1; END
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'rut.AsignacionesRutina') AND name = N'IX_AsignacionesRutina_UsuarioActivaFecha') BEGIN CREATE INDEX IX_AsignacionesRutina_UsuarioActivaFecha ON rut.AsignacionesRutina (IdUsuario, Activa, FechaAsignacion DESC); END
GO
IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'022_Rutinas.sql') BEGIN INSERT INTO cfg.Migraciones (Script, Descripcion) VALUES (N'022_Rutinas.sql', N'Esquema rut: rutinas y asignaciones de rutinas a usuarios.'); END
GO