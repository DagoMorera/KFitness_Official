/* Script: 024_Rutinas_Editor_Inline.sql - Extensión de rutinas para editor inline */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'rut')
BEGIN
    EXEC(N'CREATE SCHEMA rut AUTHORIZATION dbo;');
END
GO

IF COL_LENGTH(N'rut.Rutinas', N'DuracionUnidad') IS NULL
BEGIN
    ALTER TABLE rut.Rutinas ADD DuracionUnidad NVARCHAR(20) NULL;
END
GO

UPDATE rut.Rutinas
SET DuracionUnidad = N'min'
WHERE DuracionUnidad IS NULL OR LTRIM(RTRIM(DuracionUnidad)) = N'';
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'rut.Rutinas')
      AND name = N'DuracionUnidad'
      AND is_nullable = 1
)
BEGIN
    ALTER TABLE rut.Rutinas ALTER COLUMN DuracionUnidad NVARCHAR(20) NOT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_Rutinas_DuracionUnidad'
      AND parent_object_id = OBJECT_ID(N'rut.Rutinas')
)
BEGIN
    ALTER TABLE rut.Rutinas
    ADD CONSTRAINT CK_Rutinas_DuracionUnidad
    CHECK (DuracionUnidad IN (N'min', N'horas'));
END
GO

IF COL_LENGTH(N'rut.Rutinas', N'PortadaReferencia') IS NULL
BEGIN
    ALTER TABLE rut.Rutinas ADD PortadaReferencia NVARCHAR(260) NULL;
END
GO

IF OBJECT_ID(N'rut.RutinaSesiones', N'U') IS NULL
BEGIN
    CREATE TABLE rut.RutinaSesiones
    (
        IdSesionRutina INT IDENTITY(1,1) NOT NULL,
        IdRutina INT NOT NULL,
        Nombre NVARCHAR(120) NOT NULL,
        OrdenSesion INT NOT NULL,
        Activa BIT NOT NULL CONSTRAINT DF_RutinaSesiones_Activa DEFAULT (1),
        FechaCreacion DATETIME2(0) NOT NULL CONSTRAINT DF_RutinaSesiones_FechaCreacion DEFAULT SYSDATETIME(),
        FechaActualizacion DATETIME2(0) NULL,
        CONSTRAINT PK_RutinaSesiones PRIMARY KEY (IdSesionRutina),
        CONSTRAINT FK_RutinaSesiones_Rutinas FOREIGN KEY (IdRutina) REFERENCES rut.Rutinas (IdRutina),
        CONSTRAINT CK_RutinaSesiones_Nombre CHECK (LEN(LTRIM(RTRIM(Nombre))) > 0),
        CONSTRAINT CK_RutinaSesiones_Orden CHECK (OrdenSesion > 0)
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'rut.RutinaSesiones')
      AND name = N'IX_RutinaSesiones_RutinaOrden'
)
BEGIN
    CREATE INDEX IX_RutinaSesiones_RutinaOrden ON rut.RutinaSesiones (IdRutina, OrdenSesion, IdSesionRutina);
END
GO

IF OBJECT_ID(N'rut.Ejercicios', N'U') IS NULL
BEGIN
    CREATE TABLE rut.Ejercicios
    (
        IdEjercicio INT IDENTITY(1,1) NOT NULL,
        Nombre NVARCHAR(180) NOT NULL,
        NombreNormalizado NVARCHAR(180) NOT NULL,
        GrupoMuscular NVARCHAR(120) NULL,
        Implemento NVARCHAR(120) NULL,
        TecnicaInstrucciones NVARCHAR(2000) NULL,
        ErroresComunes NVARCHAR(2000) NULL,
        ImagenReferencia NVARCHAR(260) NULL,
        VideoUrl NVARCHAR(500) NULL,
        Activo BIT NOT NULL CONSTRAINT DF_EjerciciosRut_Activo DEFAULT (1),
        FechaCreacion DATETIME2(0) NOT NULL CONSTRAINT DF_EjerciciosRut_FechaCreacion DEFAULT SYSDATETIME(),
        FechaActualizacion DATETIME2(0) NULL,
        CONSTRAINT PK_EjerciciosRut PRIMARY KEY (IdEjercicio),
        CONSTRAINT CK_EjerciciosRut_Nombre CHECK (LEN(LTRIM(RTRIM(Nombre))) > 0)
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'rut.Ejercicios')
      AND name = N'UX_EjerciciosRut_NombreNormalizado'
)
BEGIN
    CREATE UNIQUE INDEX UX_EjerciciosRut_NombreNormalizado ON rut.Ejercicios (NombreNormalizado);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'rut.Ejercicios')
      AND name = N'IX_EjerciciosRut_ActivoNombre'
)
BEGIN
    CREATE INDEX IX_EjerciciosRut_ActivoNombre ON rut.Ejercicios (Activo, Nombre);
END
GO

IF OBJECT_ID(N'rut.RutinaEjercicios', N'U') IS NULL
BEGIN
    CREATE TABLE rut.RutinaEjercicios
    (
        IdRutinaEjercicio BIGINT IDENTITY(1,1) NOT NULL,
        IdSesionRutina INT NOT NULL,
        IdEjercicioCatalogo INT NULL,
        OrigenCatalogo NVARCHAR(20) NULL,
        NombreEjercicio NVARCHAR(180) NOT NULL,
        OrdenEjercicio INT NOT NULL,
        Series INT NOT NULL,
        Repeticiones INT NULL,
        DuracionSegundos INT NULL,
        DescansoValor INT NOT NULL,
        DescansoUnidad NVARCHAR(20) NOT NULL,
        CargaValor DECIMAL(10,2) NULL,
        CargaUnidad NVARCHAR(20) NULL,
        IndicacionesEntrenador NVARCHAR(2000) NULL,
        TecnicaInstrucciones NVARCHAR(2000) NULL,
        TecnicaErroresComunes NVARCHAR(2000) NULL,
        FotoReferencia NVARCHAR(260) NULL,
        VideoUrl NVARCHAR(500) NULL,
        EsAjusteLocal BIT NOT NULL CONSTRAINT DF_RutinaEjercicios_EsAjusteLocal DEFAULT (0),
        FechaCreacion DATETIME2(0) NOT NULL CONSTRAINT DF_RutinaEjercicios_FechaCreacion DEFAULT SYSDATETIME(),
        FechaActualizacion DATETIME2(0) NULL,
        CONSTRAINT PK_RutinaEjercicios PRIMARY KEY (IdRutinaEjercicio),
        CONSTRAINT FK_RutinaEjercicios_Sesion FOREIGN KEY (IdSesionRutina) REFERENCES rut.RutinaSesiones (IdSesionRutina),
        CONSTRAINT CK_RutinaEjercicios_Nombre CHECK (LEN(LTRIM(RTRIM(NombreEjercicio))) > 0),
        CONSTRAINT CK_RutinaEjercicios_Orden CHECK (OrdenEjercicio > 0),
        CONSTRAINT CK_RutinaEjercicios_Series CHECK (Series > 0),
        CONSTRAINT CK_RutinaEjercicios_Repeticiones CHECK (Repeticiones IS NULL OR Repeticiones > 0),
        CONSTRAINT CK_RutinaEjercicios_DuracionSegundos CHECK (DuracionSegundos IS NULL OR DuracionSegundos > 0),
        CONSTRAINT CK_RutinaEjercicios_Descanso CHECK (DescansoValor >= 0),
        CONSTRAINT CK_RutinaEjercicios_DescansoUnidad CHECK (DescansoUnidad IN (N'seg', N'min')),
        CONSTRAINT CK_RutinaEjercicios_CargaUnidad CHECK (CargaUnidad IS NULL OR CargaUnidad IN (N'kg', N'lb', N'%1RM', N'RPE'))
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'rut.RutinaEjercicios')
      AND name = N'IX_RutinaEjercicios_SesionOrden'
)
BEGIN
    CREATE INDEX IX_RutinaEjercicios_SesionOrden ON rut.RutinaEjercicios (IdSesionRutina, OrdenEjercicio, IdRutinaEjercicio);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM cfg.Migraciones WHERE Script = N'024_Rutinas_Editor_Inline.sql'
)
BEGIN
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'024_Rutinas_Editor_Inline.sql', N'Extensión de rutinas: editor inline, sesiones, ejercicios y medios.');
END
GO
