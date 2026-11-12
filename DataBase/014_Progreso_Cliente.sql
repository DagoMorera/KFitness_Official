/* =====================================================================
   Script:        014_Progreso_Cliente.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema cli: altura del cliente, progreso fisico
                  historico y metadatos de fotos de progreso.
   Reejecutable:  Si.
   ===================================================================== */

-- Ejecutar en la base KFitness seleccionada en la conexión.

/* ---------------------------------------------------------------------
   cli.Clientes.AlturaCm
   Se almacena en centimetros y se mantiene nullable para clientes sin
   registro de altura.
   --------------------------------------------------------------------- */
IF COL_LENGTH(N'cli.Clientes', N'AlturaCm') IS NULL
BEGIN
    ALTER TABLE cli.Clientes
        ADD AlturaCm DECIMAL(5,2) NULL;
END
GO

IF COL_LENGTH(N'cli.Clientes', N'AlturaCm') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'CK_Clientes_AlturaCm'
         AND parent_object_id = OBJECT_ID(N'cli.Clientes'))
BEGIN
    ALTER TABLE cli.Clientes
        ADD CONSTRAINT CK_Clientes_AlturaCm
            CHECK (AlturaCm IS NULL OR (AlturaCm > 0 AND AlturaCm <= 300));
END
GO

/* ---------------------------------------------------------------------
   cli.ProgresoFisico
   Tabla historica: cada medicion se registra como una fila nueva.
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'cli.ProgresoFisico', N'U') IS NULL
BEGIN
    CREATE TABLE cli.ProgresoFisico
    (
        IdProgreso      BIGINT IDENTITY(1,1) NOT NULL,
        IdCliente       INT                  NOT NULL,
        FechaRegistro   DATETIME2(0)         NOT NULL
            CONSTRAINT DF_ProgresoFisico_FechaRegistro DEFAULT SYSDATETIME(),
        PesoKg          DECIMAL(6,2)         NULL,
        CinturaCm       DECIMAL(6,2)         NULL,
        CaderaCm        DECIMAL(6,2)         NULL,
        PechoCm         DECIMAL(6,2)         NULL,
        BrazoCm         DECIMAL(6,2)         NULL,
        MusloCm         DECIMAL(6,2)         NULL,
        CONSTRAINT PK_ProgresoFisico PRIMARY KEY (IdProgreso),
        CONSTRAINT FK_ProgresoFisico_Clientes
            FOREIGN KEY (IdCliente) REFERENCES cli.Clientes (IdCliente),
        CONSTRAINT CK_ProgresoFisico_PesoKg
            CHECK (PesoKg IS NULL OR (PesoKg > 0 AND PesoKg <= 500)),
        CONSTRAINT CK_ProgresoFisico_CinturaCm
            CHECK (CinturaCm IS NULL OR (CinturaCm > 0 AND CinturaCm <= 300)),
        CONSTRAINT CK_ProgresoFisico_CaderaCm
            CHECK (CaderaCm IS NULL OR (CaderaCm > 0 AND CaderaCm <= 300)),
        CONSTRAINT CK_ProgresoFisico_PechoCm
            CHECK (PechoCm IS NULL OR (PechoCm > 0 AND PechoCm <= 300)),
        CONSTRAINT CK_ProgresoFisico_BrazoCm
            CHECK (BrazoCm IS NULL OR (BrazoCm > 0 AND BrazoCm <= 200)),
        CONSTRAINT CK_ProgresoFisico_MusloCm
            CHECK (MusloCm IS NULL OR (MusloCm > 0 AND MusloCm <= 250))
    );
    PRINT 'Tabla cli.ProgresoFisico creada.';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_ProgresoFisico_Cliente_FechaRegistro'
      AND object_id = OBJECT_ID(N'cli.ProgresoFisico'))
BEGIN
    CREATE INDEX IX_ProgresoFisico_Cliente_FechaRegistro
        ON cli.ProgresoFisico (IdCliente, FechaRegistro DESC);
END
GO

/* ---------------------------------------------------------------------
   cli.FotosProgreso
   Solo metadatos y ruta del archivo; no se almacena binario ni Base64.
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'cli.FotosProgreso', N'U') IS NULL
BEGIN
    CREATE TABLE cli.FotosProgreso
    (
        IdFotoProgreso  BIGINT IDENTITY(1,1) NOT NULL,
        IdCliente       INT                  NOT NULL,
        RutaArchivo     NVARCHAR(500)        NOT NULL,
        NombreArchivo   NVARCHAR(260)        NULL,
        MimeType        NVARCHAR(100)        NOT NULL,
        TamanoBytes     INT                  NOT NULL,
        FechaCarga      DATETIME2(0)         NOT NULL
            CONSTRAINT DF_FotosProgreso_FechaCarga DEFAULT SYSDATETIME(),
        CONSTRAINT PK_FotosProgreso PRIMARY KEY (IdFotoProgreso),
        CONSTRAINT FK_FotosProgreso_Clientes
            FOREIGN KEY (IdCliente) REFERENCES cli.Clientes (IdCliente),
        CONSTRAINT CK_FotosProgreso_RutaArchivo
            CHECK (LEN(LTRIM(RTRIM(RutaArchivo))) > 0),
        CONSTRAINT CK_FotosProgreso_MimeType
            CHECK (LEN(LTRIM(RTRIM(MimeType))) > 0),
        CONSTRAINT CK_FotosProgreso_TamanoBytes
            CHECK (TamanoBytes > 0 AND TamanoBytes <= 52428800)
    );
    PRINT 'Tabla cli.FotosProgreso creada.';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_FotosProgreso_Cliente_FechaCarga'
      AND object_id = OBJECT_ID(N'cli.FotosProgreso'))
BEGIN
    CREATE INDEX IX_FotosProgreso_Cliente_FechaCarga
        ON cli.FotosProgreso (IdCliente, FechaCarga DESC);
END
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'014_Progreso_Cliente.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'014_Progreso_Cliente.sql',
            N'Esquema cli: altura del cliente, progreso fisico y metadatos de fotos de progreso');
GO

/* ---------------------------------------------------------------------
   Verificacion: columna AlturaCm, tablas de progreso y registro de 014
   --------------------------------------------------------------------- */
SELECT c.name AS Columna
FROM sys.columns c
WHERE c.object_id = OBJECT_ID(N'cli.Clientes')
  AND c.name = N'AlturaCm';

SELECT s.name AS Esquema, t.name AS Tabla
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'cli'
  AND t.name IN (N'ProgresoFisico', N'FotosProgreso')
ORDER BY t.name;

SELECT IdMigracion, Script, FechaAplicacion
FROM cfg.Migraciones
WHERE Script = N'014_Progreso_Cliente.sql';
GO
