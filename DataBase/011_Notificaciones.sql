/* =====================================================================
   Script:        011_Notificaciones.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema ntf: plantillas y cola de notificaciones.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

IF OBJECT_ID(N'ntf.Plantillas', N'U') IS NULL
BEGIN
    CREATE TABLE ntf.Plantillas
    (
        IdPlantilla        INT IDENTITY(1,1) NOT NULL,
        Codigo             NVARCHAR(50)      NOT NULL,
        Nombre             NVARCHAR(100)     NOT NULL,
        Canal              NVARCHAR(15)      NOT NULL CONSTRAINT DF_Plantillas_Canal DEFAULT N'CORREO',
        Asunto             NVARCHAR(200)     NULL,
        Cuerpo             NVARCHAR(MAX)     NOT NULL,   -- con marcadores como {NumeroPedido}
        Activo             BIT               NOT NULL CONSTRAINT DF_Plantillas_Activo DEFAULT 1,
        FechaCreacion      DATETIME2(0)      NOT NULL CONSTRAINT DF_Plantillas_FechaCreacion DEFAULT SYSDATETIME(),
        FechaModificacion  DATETIME2(0)      NULL,
        ModificadoPor      INT               NULL,
        CONSTRAINT PK_Plantillas        PRIMARY KEY (IdPlantilla),
        CONSTRAINT UQ_Plantillas_Codigo UNIQUE (Codigo),
        CONSTRAINT CK_Plantillas_Canal  CHECK (Canal IN (N'CORREO', N'SMS', N'WHATSAPP')),
        CONSTRAINT FK_Plantillas_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    PRINT 'Tabla ntf.Plantillas creada.';
END
GO

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'ntf.Notificaciones', N'U') IS NULL
BEGIN
    CREATE TABLE ntf.Notificaciones
    (
        IdNotificacion  BIGINT IDENTITY(1,1) NOT NULL,
        IdUsuario       INT            NULL,
        IdPlantilla     INT            NULL,
        Canal           NVARCHAR(15)   NOT NULL,
        Destino         NVARCHAR(256)  NOT NULL,     -- correo o telefono
        Asunto          NVARCHAR(200)  NULL,
        Mensaje         NVARCHAR(MAX)  NOT NULL,
        Estado          NVARCHAR(15)   NOT NULL CONSTRAINT DF_Notificaciones_Estado DEFAULT N'PENDIENTE',
        Intentos        INT            NOT NULL CONSTRAINT DF_Notificaciones_Intentos DEFAULT 0,
        UltimoError     NVARCHAR(500)  NULL,
        ReferenciaTipo  NVARCHAR(30)   NULL,         -- ej: Pedido
        ReferenciaId    NVARCHAR(50)   NULL,
        FechaCreacion   DATETIME2(0)   NOT NULL CONSTRAINT DF_Notificaciones_FechaCreacion DEFAULT SYSDATETIME(),
        FechaEnvio      DATETIME2(0)   NULL,
        CONSTRAINT PK_Notificaciones PRIMARY KEY (IdNotificacion),
        CONSTRAINT FK_Notificaciones_Usuarios   FOREIGN KEY (IdUsuario)   REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Notificaciones_Plantillas FOREIGN KEY (IdPlantilla) REFERENCES ntf.Plantillas (IdPlantilla),
        CONSTRAINT CK_Notificaciones_Canal  CHECK (Canal IN (N'CORREO', N'SMS', N'WHATSAPP')),
        CONSTRAINT CK_Notificaciones_Estado CHECK (Estado IN (N'PENDIENTE', N'ENVIADA', N'FALLIDA')),
        CONSTRAINT CK_Notificaciones_Intentos CHECK (Intentos >= 0)
    );
    CREATE INDEX IX_Notificaciones_Usuario    ON ntf.Notificaciones (IdUsuario, FechaCreacion);
    CREATE INDEX IX_Notificaciones_Referencia ON ntf.Notificaciones (ReferenciaTipo, ReferenciaId);
    CREATE INDEX IX_Notificaciones_Pendientes ON ntf.Notificaciones (FechaCreacion) WHERE Estado = N'PENDIENTE';
    PRINT 'Tabla ntf.Notificaciones creada.';
END
GO

INSERT INTO ntf.Plantillas (Codigo, Nombre, Canal, Asunto, Cuerpo)
SELECT v.Codigo, v.Nombre, N'CORREO', v.Asunto, v.Cuerpo
FROM (VALUES
    (N'PEDIDO_CONFIRMADO', N'Confirmación de pedido',
     N'Confirmación de pedido {NumeroPedido}',
     N'Hola {Nombre}, recibimos tu pedido {NumeroPedido} del {Fecha}. Total: {Total}. ¡Gracias por tu compra!'),
    (N'PEDIDO_CAMBIO_ESTADO', N'Cambio de estado del pedido',
     N'Tu pedido {NumeroPedido} cambió de estado',
     N'Hola {Nombre}, tu pedido {NumeroPedido} ahora está: {Estado}.'),
    (N'RECUPERAR_CLAVE', N'Recuperación de contraseña',
     N'Recuperación de contraseña',
     N'Hola {Nombre}, usa este enlace para restablecer tu contraseña: {Enlace}. Vence en {Minutos} minutos.'),
    (N'CODIGO_2FA', N'Código de verificación',
     N'Tu código de verificación',
     N'Tu código de verificación es {Codigo}. Vence en {Minutos} minutos.')
) AS v (Codigo, Nombre, Asunto, Cuerpo)
WHERE NOT EXISTS (SELECT 1 FROM ntf.Plantillas p WHERE p.Codigo = v.Codigo);
GO

INSERT INTO cfg.Parametros (Clave, Valor, TipoDato, Modulo, Descripcion)
SELECT v.Clave, v.Valor, v.TipoDato, v.Modulo, v.Descripcion
FROM (VALUES
    (N'NTF.MAX_REINTENTOS', N'3', N'ENTERO', N'Notificaciones',
        N'Reintentos de envio antes de marcar la notificacion como fallida')
) AS v (Clave, Valor, TipoDato, Modulo, Descripcion)
WHERE NOT EXISTS (SELECT 1 FROM cfg.Parametros p WHERE p.Clave = v.Clave);
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'011_Notificaciones.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'011_Notificaciones.sql', N'Esquema ntf: plantillas y notificaciones');
GO

-- Verificacion: 2 tablas en ntf y 4 plantillas
SELECT s.name AS Esquema, t.name AS Tabla
FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'ntf' ORDER BY t.name;
SELECT Codigo, Canal, Asunto FROM ntf.Plantillas;
SELECT IdMigracion, Script FROM cfg.Migraciones ORDER BY IdMigracion;
GO