/* =====================================================================
   Script:        008_Pagos.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema pag: metodos de pago (SINPE y tarjeta) y pagos.
   Reejecutable:  Si.
   NOTA: nunca se guarda el numero completo de la tarjeta ni el CVV.
         Solo los ultimos 4 digitos; el cobro lo procesa la pasarela.
   ===================================================================== */

USE KFitness;
GO

IF OBJECT_ID(N'pag.MetodosPago', N'U') IS NULL
BEGIN
    CREATE TABLE pag.MetodosPago
    (
        IdMetodoPago  TINYINT      NOT NULL,
        Codigo        NVARCHAR(20) NOT NULL,
        Nombre        NVARCHAR(50) NOT NULL,
        Activo        BIT          NOT NULL CONSTRAINT DF_MetodosPago_Activo DEFAULT 1,
        CONSTRAINT PK_MetodosPago        PRIMARY KEY (IdMetodoPago),
        CONSTRAINT UQ_MetodosPago_Codigo UNIQUE (Codigo)
    );
    PRINT 'Tabla pag.MetodosPago creada.';
END
GO

INSERT INTO pag.MetodosPago (IdMetodoPago, Codigo, Nombre)
SELECT v.IdMetodoPago, v.Codigo, v.Nombre
FROM (VALUES
    (1, N'SINPE',   N'SINPE Móvil'),
    (2, N'TARJETA', N'Tarjeta de crédito o débito')
) AS v (IdMetodoPago, Codigo, Nombre)
WHERE NOT EXISTS (SELECT 1 FROM pag.MetodosPago m WHERE m.IdMetodoPago = v.IdMetodoPago);
GO

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'pag.Pagos', N'U') IS NULL
BEGIN
    CREATE TABLE pag.Pagos
    (
        IdPago             INT IDENTITY(1,1) NOT NULL,
        IdPedido           INT           NOT NULL,
        IdMetodoPago       TINYINT       NOT NULL,
        Monto              DECIMAL(12,2) NOT NULL,
        Estado             NVARCHAR(15)  NOT NULL CONSTRAINT DF_Pagos_Estado DEFAULT N'PENDIENTE',
        Referencia         NVARCHAR(100) NULL,    -- comprobante SINPE o id de transaccion
        UltimosDigitos     NVARCHAR(4)   NULL,    -- solo para tarjeta
        MarcaTarjeta       NVARCHAR(20)  NULL,
        MotivoRechazo      NVARCHAR(250) NULL,
        FechaPago          DATETIME2(0)  NULL,
        FechaCreacion      DATETIME2(0)  NOT NULL CONSTRAINT DF_Pagos_FechaCreacion DEFAULT SYSDATETIME(),
        FechaModificacion  DATETIME2(0)  NULL,
        CONSTRAINT PK_Pagos PRIMARY KEY (IdPago),
        CONSTRAINT FK_Pagos_Pedidos FOREIGN KEY (IdPedido)     REFERENCES ped.Pedidos (IdPedido),
        CONSTRAINT FK_Pagos_Metodos FOREIGN KEY (IdMetodoPago) REFERENCES pag.MetodosPago (IdMetodoPago),
        CONSTRAINT CK_Pagos_Monto  CHECK (Monto > 0),
        CONSTRAINT CK_Pagos_Estado CHECK (Estado IN (N'PENDIENTE', N'APROBADO', N'RECHAZADO')),
        CONSTRAINT CK_Pagos_Digitos CHECK (UltimosDigitos IS NULL
            OR (LEN(UltimosDigitos) = 4 AND UltimosDigitos NOT LIKE N'%[^0-9]%'))
    );
    PRINT 'Tabla pag.Pagos creada.';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Pagos_Pedido'
                 AND object_id = OBJECT_ID(N'pag.Pagos'))
    CREATE INDEX IX_Pagos_Pedido ON pag.Pagos (IdPedido);

-- Evita pago duplicado: un pedido solo puede tener un pago aprobado
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'UX_Pagos_UnAprobadoPorPedido'
                 AND object_id = OBJECT_ID(N'pag.Pagos'))
    CREATE UNIQUE INDEX UX_Pagos_UnAprobadoPorPedido ON pag.Pagos (IdPedido) WHERE Estado = N'APROBADO';

-- Evita reutilizar el mismo comprobante en pagos no rechazados
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'UX_Pagos_ReferenciaUnica'
                 AND object_id = OBJECT_ID(N'pag.Pagos'))
    CREATE UNIQUE INDEX UX_Pagos_ReferenciaUnica
        ON pag.Pagos (IdMetodoPago, Referencia) WHERE Referencia IS NOT NULL AND Estado <> N'RECHAZADO';
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'008_Pagos.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'008_Pagos.sql', N'Esquema pag: metodos de pago y pagos');
GO

-- Verificacion: 2 tablas en pag y 2 metodos
SELECT s.name AS Esquema, t.name AS Tabla
FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'pag' ORDER BY t.name;
SELECT * FROM pag.MetodosPago;
SELECT IdMigracion, Script FROM cfg.Migraciones ORDER BY IdMigracion;
GO