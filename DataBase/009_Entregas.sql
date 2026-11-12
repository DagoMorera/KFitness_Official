/* =====================================================================
   Script:        009_Entregas.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema env: zonas, cobertura por distrito, franjas
                  horarias y entregas.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

IF OBJECT_ID(N'env.Zonas', N'U') IS NULL
BEGIN
    CREATE TABLE env.Zonas
    (
        IdZona             INT IDENTITY(1,1) NOT NULL,
        Nombre             NVARCHAR(100)     NOT NULL,
        Descripcion        NVARCHAR(250)     NULL,
        CostoEnvio         DECIMAL(10,2)     NOT NULL,
        Activo             BIT               NOT NULL CONSTRAINT DF_Zonas_Activo DEFAULT 1,
        FechaCreacion      DATETIME2(0)      NOT NULL CONSTRAINT DF_Zonas_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor          INT               NULL,
        FechaModificacion  DATETIME2(0)      NULL,
        ModificadoPor      INT               NULL,
        CONSTRAINT PK_Zonas PRIMARY KEY (IdZona),
        CONSTRAINT UQ_Zonas_Nombre UNIQUE (Nombre),
        CONSTRAINT CK_Zonas_Costo CHECK (CostoEnvio >= 0),
        CONSTRAINT FK_Zonas_CreadoPor     FOREIGN KEY (CreadoPor)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Zonas_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    PRINT 'Tabla env.Zonas creada.';
END
GO

/* Que distritos cubre cada zona. Un distrito pertenece a una sola zona.
   Si la direccion no esta aqui, no hay cobertura. */
IF OBJECT_ID(N'env.ZonaCobertura', N'U') IS NULL
BEGIN
    CREATE TABLE env.ZonaCobertura
    (
        IdCobertura  INT IDENTITY(1,1) NOT NULL,
        IdZona       INT          NOT NULL,
        Provincia    NVARCHAR(50) NOT NULL,
        Canton       NVARCHAR(50) NOT NULL,
        Distrito     NVARCHAR(50) NOT NULL,
        Activo       BIT          NOT NULL CONSTRAINT DF_ZonaCobertura_Activo DEFAULT 1,
        CONSTRAINT PK_ZonaCobertura PRIMARY KEY (IdCobertura),
        CONSTRAINT UQ_ZonaCobertura_Distrito UNIQUE (Provincia, Canton, Distrito),
        CONSTRAINT FK_ZonaCobertura_Zonas FOREIGN KEY (IdZona) REFERENCES env.Zonas (IdZona)
    );
    PRINT 'Tabla env.ZonaCobertura creada.';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_ZonaCobertura_Zona'
                 AND object_id = OBJECT_ID(N'env.ZonaCobertura'))
    CREATE INDEX IX_ZonaCobertura_Zona ON env.ZonaCobertura (IdZona);
GO

/* Franjas horarias de entrega con cupo maximo (para el aviso de "horario ocupado") */
IF OBJECT_ID(N'env.FranjasEntrega', N'U') IS NULL
BEGIN
    CREATE TABLE env.FranjasEntrega
    (
        IdFranja           INT IDENTITY(1,1) NOT NULL,
        HoraInicio         TIME(0)           NOT NULL,
        HoraFin            TIME(0)           NOT NULL,
        CapacidadMaxima    INT               NOT NULL,
        Activo             BIT               NOT NULL CONSTRAINT DF_Franjas_Activo DEFAULT 1,
        FechaCreacion      DATETIME2(0)      NOT NULL CONSTRAINT DF_Franjas_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor          INT               NULL,
        FechaModificacion  DATETIME2(0)      NULL,
        ModificadoPor      INT               NULL,
        CONSTRAINT PK_FranjasEntrega PRIMARY KEY (IdFranja),
        CONSTRAINT UQ_Franjas_Horas UNIQUE (HoraInicio, HoraFin),
        CONSTRAINT CK_Franjas_Horas CHECK (HoraFin > HoraInicio),
        CONSTRAINT CK_Franjas_Capacidad CHECK (CapacidadMaxima > 0),
        CONSTRAINT FK_Franjas_CreadoPor     FOREIGN KEY (CreadoPor)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Franjas_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    PRINT 'Tabla env.FranjasEntrega creada.';
END
GO

/* Una entrega por pedido. Ocupacion de una franja:
   SELECT COUNT(*) FROM env.Entregas WHERE FechaProgramada = @fecha AND IdFranja = @franja */
IF OBJECT_ID(N'env.Entregas', N'U') IS NULL
BEGIN
    CREATE TABLE env.Entregas
    (
        IdEntrega          INT IDENTITY(1,1) NOT NULL,
        IdPedido           INT           NOT NULL,
        IdZona             INT           NOT NULL,
        IdDireccion        INT           NULL,
        DireccionEntrega   NVARCHAR(500) NOT NULL,    -- copia de la direccion al momento del pedido
        CostoEnvio         DECIMAL(10,2) NOT NULL,
        FechaProgramada    DATE          NULL,
        IdFranja           INT           NULL,
        Observaciones      NVARCHAR(250) NULL,
        FechaCreacion      DATETIME2(0)  NOT NULL CONSTRAINT DF_Entregas_FechaCreacion DEFAULT SYSDATETIME(),
        FechaModificacion  DATETIME2(0)  NULL,
        ModificadoPor      INT           NULL,
        CONSTRAINT PK_Entregas        PRIMARY KEY (IdEntrega),
        CONSTRAINT UQ_Entregas_Pedido UNIQUE (IdPedido),
        CONSTRAINT FK_Entregas_Pedidos     FOREIGN KEY (IdPedido)      REFERENCES ped.Pedidos (IdPedido),
        CONSTRAINT FK_Entregas_Zonas       FOREIGN KEY (IdZona)        REFERENCES env.Zonas (IdZona),
        CONSTRAINT FK_Entregas_Direcciones FOREIGN KEY (IdDireccion)   REFERENCES cli.Direcciones (IdDireccion),
        CONSTRAINT FK_Entregas_Franjas     FOREIGN KEY (IdFranja)      REFERENCES env.FranjasEntrega (IdFranja),
        CONSTRAINT FK_Entregas_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT CK_Entregas_Costo CHECK (CostoEnvio >= 0),
        CONSTRAINT CK_Entregas_Programacion CHECK (
               (FechaProgramada IS NULL     AND IdFranja IS NULL)
            OR (FechaProgramada IS NOT NULL AND IdFranja IS NOT NULL))
    );
    PRINT 'Tabla env.Entregas creada.';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Entregas_Zona'
                 AND object_id = OBJECT_ID(N'env.Entregas'))
    CREATE INDEX IX_Entregas_Zona   ON env.Entregas (IdZona);

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Entregas_Franja'
                 AND object_id = OBJECT_ID(N'env.Entregas'))
    CREATE INDEX IX_Entregas_Franja ON env.Entregas (FechaProgramada, IdFranja);
GO

INSERT INTO cfg.Parametros (Clave, Valor, TipoDato, Modulo, Descripcion)
SELECT v.Clave, v.Valor, v.TipoDato, v.Modulo, v.Descripcion
FROM (VALUES
    (N'ENV.DIAS_MIN_ANTICIPACION', N'1', N'ENTERO', N'Entregas',
        N'Dias minimos de anticipacion para programar una entrega')
) AS v (Clave, Valor, TipoDato, Modulo, Descripcion)
WHERE NOT EXISTS (SELECT 1 FROM cfg.Parametros p WHERE p.Clave = v.Clave);
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'009_Entregas.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'009_Entregas.sql', N'Esquema env: zonas, cobertura, franjas y entregas');
GO

-- Verificacion: 4 tablas en env
SELECT s.name AS Esquema, t.name AS Tabla
FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'env' ORDER BY t.name;
SELECT IdMigracion, Script FROM cfg.Migraciones ORDER BY IdMigracion;
GO