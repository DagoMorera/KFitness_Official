/* =====================================================================
   Script:        007_Pedidos.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema ped: estados, carrito, pedidos, detalle,
                  historial de estados y vista de historial de compras.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

IF OBJECT_ID(N'ped.EstadosPedido', N'U') IS NULL
BEGIN
    CREATE TABLE ped.EstadosPedido
    (
        IdEstado     TINYINT      NOT NULL,
        Nombre       NVARCHAR(50) NOT NULL,
        Orden        TINYINT      NOT NULL,
        EsFinal      BIT          NOT NULL CONSTRAINT DF_EstadosPedido_EsFinal DEFAULT 0,
        EsCancelado  BIT          NOT NULL CONSTRAINT DF_EstadosPedido_EsCancelado DEFAULT 0,
        Activo       BIT          NOT NULL CONSTRAINT DF_EstadosPedido_Activo DEFAULT 1,
        CONSTRAINT PK_EstadosPedido        PRIMARY KEY (IdEstado),
        CONSTRAINT UQ_EstadosPedido_Nombre UNIQUE (Nombre)
    );
    PRINT 'Tabla ped.EstadosPedido creada.';
END
GO

INSERT INTO ped.EstadosPedido (IdEstado, Nombre, Orden, EsFinal, EsCancelado)
SELECT v.IdEstado, v.Nombre, v.Orden, v.EsFinal, v.EsCancelado
FROM (VALUES
    (1, N'Pendiente',      1, 0, 0),
    (2, N'Confirmado',     2, 0, 0),
    (3, N'En preparación', 3, 0, 0),
    (4, N'En entrega',     4, 0, 0),
    (5, N'Entregado',      5, 1, 0),
    (6, N'Cancelado',      6, 1, 1)
) AS v (IdEstado, Nombre, Orden, EsFinal, EsCancelado)
WHERE NOT EXISTS (SELECT 1 FROM ped.EstadosPedido e WHERE e.IdEstado = v.IdEstado);
GO

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'ped.Carritos', N'U') IS NULL
BEGIN
    CREATE TABLE ped.Carritos
    (
        IdCarrito          INT IDENTITY(1,1) NOT NULL,
        IdCliente          INT               NOT NULL,
        Estado             NVARCHAR(15)      NOT NULL CONSTRAINT DF_Carritos_Estado DEFAULT N'ABIERTO',
        FechaCreacion      DATETIME2(0)      NOT NULL CONSTRAINT DF_Carritos_FechaCreacion DEFAULT SYSDATETIME(),
        FechaModificacion  DATETIME2(0)      NULL,
        CONSTRAINT PK_Carritos PRIMARY KEY (IdCarrito),
        CONSTRAINT FK_Carritos_Clientes FOREIGN KEY (IdCliente) REFERENCES cli.Clientes (IdCliente),
        CONSTRAINT CK_Carritos_Estado CHECK (Estado IN (N'ABIERTO', N'CONVERTIDO', N'ABANDONADO'))
    );
    PRINT 'Tabla ped.Carritos creada.';
END

-- Un cliente solo puede tener un carrito abierto
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'UX_Carritos_UnoAbierto'
                 AND object_id = OBJECT_ID(N'ped.Carritos'))
    CREATE UNIQUE INDEX UX_Carritos_UnoAbierto ON ped.Carritos (IdCliente) WHERE Estado = N'ABIERTO';
GO

IF OBJECT_ID(N'ped.CarritoItems', N'U') IS NULL
BEGIN
    CREATE TABLE ped.CarritoItems
    (
        IdCarritoItem      INT IDENTITY(1,1) NOT NULL,
        IdCarrito          INT               NOT NULL,
        IdProducto         INT               NOT NULL,
        Cantidad           INT               NOT NULL,
        FechaCreacion      DATETIME2(0)      NOT NULL CONSTRAINT DF_CarritoItems_FechaCreacion DEFAULT SYSDATETIME(),
        FechaModificacion  DATETIME2(0)      NULL,
        CONSTRAINT PK_CarritoItems PRIMARY KEY (IdCarritoItem),
        CONSTRAINT UQ_CarritoItems_Producto UNIQUE (IdCarrito, IdProducto),   -- repetido = sube la cantidad
        CONSTRAINT FK_CarritoItems_Carritos  FOREIGN KEY (IdCarrito)  REFERENCES ped.Carritos (IdCarrito) ON DELETE CASCADE,
        CONSTRAINT FK_CarritoItems_Productos FOREIGN KEY (IdProducto) REFERENCES cat.Productos (IdProducto),
        CONSTRAINT CK_CarritoItems_Cantidad CHECK (Cantidad > 0)
    );
    PRINT 'Tabla ped.CarritoItems creada.';
END
GO

IF OBJECT_ID(N'ped.Pedidos', N'U') IS NULL
BEGIN
    CREATE TABLE ped.Pedidos
    (
        IdPedido           INT IDENTITY(1,1) NOT NULL,
        NumeroPedido       AS (N'PED-' + RIGHT(N'00000000' + CAST(IdPedido AS NVARCHAR(10)), 8)) PERSISTED,
        IdCliente          INT               NOT NULL,
        IdEstado           TINYINT           NOT NULL CONSTRAINT DF_Pedidos_Estado DEFAULT 1,
        IdDireccion        INT               NULL,
        FechaPedido        DATETIME2(0)      NOT NULL CONSTRAINT DF_Pedidos_FechaPedido DEFAULT SYSDATETIME(),
        Subtotal           DECIMAL(12,2)     NOT NULL,
        Descuento          DECIMAL(12,2)     NOT NULL CONSTRAINT DF_Pedidos_Descuento DEFAULT 0,
        CostoEnvio         DECIMAL(12,2)     NOT NULL CONSTRAINT DF_Pedidos_CostoEnvio DEFAULT 0,
        Total              AS (Subtotal - Descuento + CostoEnvio) PERSISTED,
        Observaciones      NVARCHAR(500)     NULL,
        FechaCancelacion   DATETIME2(0)      NULL,
        MotivoCancelacion  NVARCHAR(250)     NULL,
        FechaModificacion  DATETIME2(0)      NULL,
        ModificadoPor      INT               NULL,
        CONSTRAINT PK_Pedidos        PRIMARY KEY (IdPedido),
        CONSTRAINT UQ_Pedidos_Numero UNIQUE (NumeroPedido),
        CONSTRAINT FK_Pedidos_Clientes    FOREIGN KEY (IdCliente)     REFERENCES cli.Clientes (IdCliente),
        CONSTRAINT FK_Pedidos_Estados     FOREIGN KEY (IdEstado)      REFERENCES ped.EstadosPedido (IdEstado),
        CONSTRAINT FK_Pedidos_Direcciones FOREIGN KEY (IdDireccion)   REFERENCES cli.Direcciones (IdDireccion),
        CONSTRAINT FK_Pedidos_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT CK_Pedidos_Subtotal   CHECK (Subtotal >= 0),
        CONSTRAINT CK_Pedidos_Descuento  CHECK (Descuento >= 0 AND Descuento <= Subtotal),
        CONSTRAINT CK_Pedidos_CostoEnvio CHECK (CostoEnvio >= 0)
    );
    PRINT 'Tabla ped.Pedidos creada.';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Pedidos_Cliente'
                 AND object_id = OBJECT_ID(N'ped.Pedidos'))
    CREATE INDEX IX_Pedidos_Cliente ON ped.Pedidos (IdCliente, FechaPedido);

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Pedidos_Estado'
                 AND object_id = OBJECT_ID(N'ped.Pedidos'))
    CREATE INDEX IX_Pedidos_Estado  ON ped.Pedidos (IdEstado, FechaPedido);

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Pedidos_Fecha'
                 AND object_id = OBJECT_ID(N'ped.Pedidos'))
    CREATE INDEX IX_Pedidos_Fecha   ON ped.Pedidos (FechaPedido);
GO

/* El detalle guarda nombre y precio al momento de la compra (historico) */
IF OBJECT_ID(N'ped.PedidoDetalle', N'U') IS NULL
BEGIN
    CREATE TABLE ped.PedidoDetalle
    (
        IdDetalle       INT IDENTITY(1,1) NOT NULL,
        IdPedido        INT               NOT NULL,
        IdProducto      INT               NOT NULL,
        NombreProducto  NVARCHAR(150)     NOT NULL,
        Cantidad        INT               NOT NULL,
        PrecioUnitario  DECIMAL(12,2)     NOT NULL,
        DescuentoLinea  DECIMAL(12,2)     NOT NULL CONSTRAINT DF_PedidoDetalle_Descuento DEFAULT 0,
        Subtotal        AS (Cantidad * PrecioUnitario - DescuentoLinea) PERSISTED,
        CONSTRAINT PK_PedidoDetalle PRIMARY KEY (IdDetalle),
        CONSTRAINT FK_PedidoDetalle_Pedidos   FOREIGN KEY (IdPedido)   REFERENCES ped.Pedidos (IdPedido),
        CONSTRAINT FK_PedidoDetalle_Productos FOREIGN KEY (IdProducto) REFERENCES cat.Productos (IdProducto),
        CONSTRAINT CK_PedidoDetalle_Cantidad  CHECK (Cantidad > 0),
        CONSTRAINT CK_PedidoDetalle_Precio    CHECK (PrecioUnitario >= 0),
        CONSTRAINT CK_PedidoDetalle_Descuento CHECK (DescuentoLinea >= 0 AND DescuentoLinea <= Cantidad * PrecioUnitario)
    );
    PRINT 'Tabla ped.PedidoDetalle creada.';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_PedidoDetalle_Pedido'
                 AND object_id = OBJECT_ID(N'ped.PedidoDetalle'))
    CREATE INDEX IX_PedidoDetalle_Pedido   ON ped.PedidoDetalle (IdPedido);

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_PedidoDetalle_Producto'
                 AND object_id = OBJECT_ID(N'ped.PedidoDetalle'))
    CREATE INDEX IX_PedidoDetalle_Producto ON ped.PedidoDetalle (IdProducto);
GO

IF OBJECT_ID(N'ped.HistorialEstados', N'U') IS NULL
BEGIN
    CREATE TABLE ped.HistorialEstados
    (
        IdHistorial       BIGINT IDENTITY(1,1) NOT NULL,
        IdPedido          INT           NOT NULL,
        IdEstadoAnterior  TINYINT       NULL,
        IdEstadoNuevo     TINYINT       NOT NULL,
        Fecha             DATETIME2(0)  NOT NULL CONSTRAINT DF_HistorialEstados_Fecha DEFAULT SYSDATETIME(),
        IdUsuario         INT           NULL,
        Comentario        NVARCHAR(250) NULL,
        CONSTRAINT PK_HistorialEstados PRIMARY KEY (IdHistorial),
        CONSTRAINT FK_HistorialEstados_Pedidos   FOREIGN KEY (IdPedido)         REFERENCES ped.Pedidos (IdPedido),
        CONSTRAINT FK_HistorialEstados_Anterior  FOREIGN KEY (IdEstadoAnterior) REFERENCES ped.EstadosPedido (IdEstado),
        CONSTRAINT FK_HistorialEstados_Nuevo     FOREIGN KEY (IdEstadoNuevo)    REFERENCES ped.EstadosPedido (IdEstado),
        CONSTRAINT FK_HistorialEstados_Usuarios  FOREIGN KEY (IdUsuario)        REFERENCES seg.Usuarios (IdUsuario)
    );
    PRINT 'Tabla ped.HistorialEstados creada.';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_HistorialEstados_Pedido'
                 AND object_id = OBJECT_ID(N'ped.HistorialEstados'))
    CREATE INDEX IX_HistorialEstados_Pedido ON ped.HistorialEstados (IdPedido, Fecha);
GO

/* Historial de compras del cliente (HU-CLI-002) */
CREATE OR ALTER VIEW ped.vw_HistorialCompras
AS
SELECT  p.IdCliente, p.IdPedido, p.NumeroPedido, p.FechaPedido,
        e.Nombre AS Estado, p.Total
FROM    ped.Pedidos p
JOIN    ped.EstadosPedido e ON e.IdEstado = p.IdEstado;
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'007_Pedidos.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'007_Pedidos.sql', N'Esquema ped: estados, carrito, pedidos, detalle e historial');
GO

-- Verificacion: 6 tablas en ped y 6 estados
SELECT s.name AS Esquema, t.name AS Tabla
FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'ped' ORDER BY t.name;
SELECT IdEstado, Nombre, EsFinal, EsCancelado FROM ped.EstadosPedido ORDER BY Orden;
SELECT IdMigracion, Script FROM cfg.Migraciones ORDER BY IdMigracion;
GO