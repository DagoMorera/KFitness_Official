/* =====================================================================
   Script:        003_Auditoria_Configuracion.sql
   Branch Git:    Feature/SQL
   Descripcion:   aud: bitacora de auditoria y procedimiento para
                  registrarla. cfg: parametros del sistema y horarios
                  de atencion.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

/* ---------------------------------------------------------------------
   aud.Bitacora
   Registra quien hizo que y cuando. Los valores anteriores y nuevos se
   guardan como texto JSON, asi sirve para cualquier tabla futura.
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'aud.Bitacora', N'U') IS NULL
BEGIN
    CREATE TABLE aud.Bitacora
    (
        IdBitacora         BIGINT IDENTITY(1,1) NOT NULL,
        Fecha              DATETIME2(0)   NOT NULL
            CONSTRAINT DF_Bitacora_Fecha DEFAULT SYSDATETIME(),
        IdUsuario          INT            NULL,      -- NULL si no hay usuario identificado
        Modulo             NVARCHAR(50)   NOT NULL,  -- ej: Productos, Seguridad
        Entidad            NVARCHAR(100)  NULL,      -- ej: Producto, Categoria
        IdRegistro         NVARCHAR(50)   NULL,      -- id del registro afectado
        Accion             NVARCHAR(50)   NOT NULL,  -- ej: CREAR, ACTUALIZAR, INACTIVAR, ACCESO_DENEGADO
        EsEventoSeguridad  BIT            NOT NULL
            CONSTRAINT DF_Bitacora_EsSeguridad DEFAULT 0,
        Descripcion        NVARCHAR(500)  NULL,
        ValoresAnteriores  NVARCHAR(MAX)  NULL,
        ValoresNuevos      NVARCHAR(MAX)  NULL,
        DireccionIp        NVARCHAR(45)   NULL,
        CONSTRAINT PK_Bitacora PRIMARY KEY (IdBitacora),
        CONSTRAINT FK_Bitacora_Usuarios
            FOREIGN KEY (IdUsuario) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT CK_Bitacora_JsonAnterior
            CHECK (ValoresAnteriores IS NULL OR ISJSON(ValoresAnteriores) = 1),
        CONSTRAINT CK_Bitacora_JsonNuevo
            CHECK (ValoresNuevos IS NULL OR ISJSON(ValoresNuevos) = 1)
    );
    CREATE INDEX IX_Bitacora_Fecha   ON aud.Bitacora (Fecha);
    CREATE INDEX IX_Bitacora_Entidad ON aud.Bitacora (Modulo, Entidad, IdRegistro);
    CREATE INDEX IX_Bitacora_Usuario ON aud.Bitacora (IdUsuario, Fecha);
    PRINT 'Tabla aud.Bitacora creada.';
END
GO

/* ---------------------------------------------------------------------
   aud.RegistrarBitacora: forma unica de escribir en la bitacora
   --------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE aud.RegistrarBitacora
    @Modulo             NVARCHAR(50),
    @Accion             NVARCHAR(50),
    @IdUsuario          INT            = NULL,
    @Entidad            NVARCHAR(100)  = NULL,
    @IdRegistro         NVARCHAR(50)   = NULL,
    @Descripcion        NVARCHAR(500)  = NULL,
    @ValoresAnteriores  NVARCHAR(MAX)  = NULL,
    @ValoresNuevos      NVARCHAR(MAX)  = NULL,
    @EsEventoSeguridad  BIT            = 0,
    @DireccionIp        NVARCHAR(45)   = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO aud.Bitacora
        (IdUsuario, Modulo, Entidad, IdRegistro, Accion, EsEventoSeguridad,
         Descripcion, ValoresAnteriores, ValoresNuevos, DireccionIp)
    VALUES
        (@IdUsuario, @Modulo, @Entidad, @IdRegistro, @Accion, @EsEventoSeguridad,
         @Descripcion, @ValoresAnteriores, @ValoresNuevos, @DireccionIp);
END
GO

/* ---------------------------------------------------------------------
   cfg.Parametros
   Un parametro por fila (clave y valor). Agregar uno nuevo no requiere
   cambiar la estructura de la base de datos.
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'cfg.Parametros', N'U') IS NULL
BEGIN
    CREATE TABLE cfg.Parametros
    (
        IdParametro        INT IDENTITY(1,1) NOT NULL,
        Clave              NVARCHAR(100) NOT NULL,   -- ej: SEG.MAX_INTENTOS_FALLIDOS
        Valor              NVARCHAR(500) NOT NULL,
        TipoDato           NVARCHAR(20)  NOT NULL,
        Modulo             NVARCHAR(50)  NOT NULL,
        Descripcion        NVARCHAR(250) NULL,
        Activo             BIT           NOT NULL
            CONSTRAINT DF_Parametros_Activo DEFAULT 1,
        FechaCreacion      DATETIME2(0)  NOT NULL
            CONSTRAINT DF_Parametros_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor          INT           NULL,
        FechaModificacion  DATETIME2(0)  NULL,
        ModificadoPor      INT           NULL,
        CONSTRAINT PK_Parametros        PRIMARY KEY (IdParametro),
        CONSTRAINT UQ_Parametros_Clave  UNIQUE (Clave),
        CONSTRAINT CK_Parametros_Tipo
            CHECK (TipoDato IN (N'TEXTO', N'ENTERO', N'DECIMAL', N'BOOLEANO', N'HORA', N'FECHA')),
        CONSTRAINT FK_Parametros_CreadoPor
            FOREIGN KEY (CreadoPor)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Parametros_ModificadoPor
            FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    PRINT 'Tabla cfg.Parametros creada.';
END
GO

/* Valores iniciales PROVISIONALES: se ajustan cuando el negocio los defina.
   En los limites, 0 significa "sin limite". */
INSERT INTO cfg.Parametros (Clave, Valor, TipoDato, Modulo, Descripcion)
SELECT v.Clave, v.Valor, v.TipoDato, v.Modulo, v.Descripcion
FROM (VALUES
    (N'SEG.MAX_INTENTOS_FALLIDOS',        N'5',  N'ENTERO', N'Seguridad',
        N'Intentos de login fallidos antes de bloquear la cuenta'),
    (N'SEG.MINUTOS_BLOQUEO',              N'15', N'ENTERO', N'Seguridad',
        N'Minutos que dura el bloqueo temporal de la cuenta'),
    (N'SEG.MINUTOS_EXPIRA_RECUPERACION',  N'30', N'ENTERO', N'Seguridad',
        N'Minutos de vigencia del enlace de recuperacion de contrasena'),
    (N'SEG.MINUTOS_EXPIRA_CODIGO_2FA',    N'5',  N'ENTERO', N'Seguridad',
        N'Minutos de vigencia del codigo de doble factor'),
    (N'SEG.LONGITUD_MIN_CLAVE',           N'8',  N'ENTERO', N'Seguridad',
        N'Longitud minima de la contrasena'),
    (N'INV.STOCK_MINIMO_GLOBAL',          N'5',  N'ENTERO', N'Inventario',
        N'Stock minimo por defecto para generar alertas de reposicion'),
    (N'PED.MINUTOS_MAX_CANCELACION',      N'60', N'ENTERO', N'Pedidos',
        N'Minutos permitidos para cancelar un pedido'),
    (N'PED.MONTO_MINIMO_COMPRA',          N'0',  N'DECIMAL', N'Pedidos',
        N'Monto minimo por pedido (0 = sin minimo)'),
    (N'PED.LIMITE_DIARIO_PEDIDOS',        N'0',  N'ENTERO', N'Pedidos',
        N'Maximo de pedidos por dia (0 = sin limite)')
) AS v (Clave, Valor, TipoDato, Modulo, Descripcion)
WHERE NOT EXISTS (SELECT 1 FROM cfg.Parametros p WHERE p.Clave = v.Clave);
GO

/* ---------------------------------------------------------------------
   cfg.HorariosAtencion
   DiaSemana: 1 = Lunes ... 7 = Domingo. Un dia puede tener varios
   tramos (por ejemplo manana y tarde).
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'cfg.HorariosAtencion', N'U') IS NULL
BEGIN
    CREATE TABLE cfg.HorariosAtencion
    (
        IdHorario          INT IDENTITY(1,1) NOT NULL,
        DiaSemana          TINYINT       NOT NULL,
        HoraApertura       TIME(0)       NOT NULL,
        HoraCierre         TIME(0)       NOT NULL,
        Activo             BIT           NOT NULL
            CONSTRAINT DF_Horarios_Activo DEFAULT 1,
        FechaCreacion      DATETIME2(0)  NOT NULL
            CONSTRAINT DF_Horarios_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor          INT           NULL,
        FechaModificacion  DATETIME2(0)  NULL,
        ModificadoPor      INT           NULL,
        CONSTRAINT PK_HorariosAtencion PRIMARY KEY (IdHorario),
        CONSTRAINT UQ_Horarios_Dia_Apertura UNIQUE (DiaSemana, HoraApertura),
        CONSTRAINT CK_Horarios_Dia   CHECK (DiaSemana BETWEEN 1 AND 7),
        CONSTRAINT CK_Horarios_Horas CHECK (HoraCierre > HoraApertura),
        CONSTRAINT FK_Horarios_CreadoPor
            FOREIGN KEY (CreadoPor)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Horarios_ModificadoPor
            FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    PRINT 'Tabla cfg.HorariosAtencion creada.';
END
GO

/* ---------------------------------------------------------------------
   Registro de la migracion
   --------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'003_Auditoria_Configuracion.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'003_Auditoria_Configuracion.sql',
            N'Esquemas aud y cfg: bitacora, parametros del sistema y horarios de atencion');
GO

/* ---------------------------------------------------------------------
   Verificacion: 1 tabla en aud, 3 en cfg, 9 parametros y 3 migraciones
   --------------------------------------------------------------------- */
SELECT s.name AS Esquema, t.name AS Tabla
FROM   sys.tables t
JOIN   sys.schemas s ON s.schema_id = t.schema_id
WHERE  s.name IN (N'aud', N'cfg')
ORDER BY s.name, t.name;

SELECT Clave, Valor, TipoDato, Modulo FROM cfg.Parametros ORDER BY Clave;

SELECT IdMigracion, Script, FechaAplicacion FROM cfg.Migraciones;
GO