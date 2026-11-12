/* =====================================================================
   Script:        006_Inventario.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema inv: stock, movimientos y vista de stock actual.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

IF OBJECT_ID(N'inv.Inventario', N'U') IS NULL
BEGIN
    CREATE TABLE inv.Inventario
    (
        IdProducto         INT          NOT NULL,
        StockActual        INT          NOT NULL CONSTRAINT DF_Inventario_Stock DEFAULT 0,
        StockMinimo        INT          NULL,    -- NULL = usa el minimo global de cfg.Parametros
        FechaCreacion      DATETIME2(0) NOT NULL CONSTRAINT DF_Inventario_FechaCreacion DEFAULT SYSDATETIME(),
        FechaModificacion  DATETIME2(0) NULL,
        ModificadoPor      INT          NULL,
        CONSTRAINT PK_Inventario PRIMARY KEY (IdProducto),
        CONSTRAINT FK_Inventario_Productos FOREIGN KEY (IdProducto)    REFERENCES cat.Productos (IdProducto),
        CONSTRAINT FK_Inventario_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT CK_Inventario_Stock  CHECK (StockActual >= 0),      -- nunca stock negativo
        CONSTRAINT CK_Inventario_Minimo CHECK (StockMinimo IS NULL OR StockMinimo >= 0)
    );
    PRINT 'Tabla inv.Inventario creada.';
END
GO

IF OBJECT_ID(N'inv.MovimientosInventario', N'U') IS NULL
BEGIN
    CREATE TABLE inv.MovimientosInventario
    (
        IdMovimiento     BIGINT IDENTITY(1,1) NOT NULL,
        IdProducto       INT           NOT NULL,
        TipoMovimiento   NVARCHAR(10)  NOT NULL,
        Cantidad         INT           NOT NULL,
        StockAnterior    INT           NOT NULL,
        StockResultante  INT           NOT NULL,
        Motivo           NVARCHAR(250) NULL,
        ReferenciaTipo   NVARCHAR(30)  NULL,    -- ej: Pedido
        ReferenciaId     NVARCHAR(50)  NULL,
        Fecha            DATETIME2(0)  NOT NULL CONSTRAINT DF_Movimientos_Fecha DEFAULT SYSDATETIME(),
        IdUsuario        INT           NULL,
        CONSTRAINT PK_MovimientosInventario PRIMARY KEY (IdMovimiento),
        CONSTRAINT FK_Movimientos_Productos FOREIGN KEY (IdProducto) REFERENCES cat.Productos (IdProducto),
        CONSTRAINT FK_Movimientos_Usuarios  FOREIGN KEY (IdUsuario)  REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT CK_Movimientos_Tipo     CHECK (TipoMovimiento IN (N'ENTRADA', N'SALIDA')),
        CONSTRAINT CK_Movimientos_Cantidad CHECK (Cantidad > 0),
        CONSTRAINT CK_Movimientos_Stock    CHECK (StockResultante >= 0),
        CONSTRAINT CK_Movimientos_Coherencia CHECK (
               (TipoMovimiento = N'ENTRADA' AND StockResultante = StockAnterior + Cantidad)
            OR (TipoMovimiento = N'SALIDA'  AND StockResultante = StockAnterior - Cantidad))
    );
    CREATE INDEX IX_Movimientos_Producto ON inv.MovimientosInventario (IdProducto, Fecha);
    PRINT 'Tabla inv.MovimientosInventario creada.';
END
GO

/* Stock actual, minimo efectivo (propio o global) y alerta de stock bajo.
   Los combos no llevan stock propio, por eso se excluyen. */
CREATE OR ALTER VIEW inv.vw_StockActual
AS
SELECT  p.IdProducto,
        p.Nombre                     AS Producto,
        p.IdCategoria,
        c.Nombre                     AS Categoria,
        p.Activo                     AS ProductoActivo,
        ISNULL(i.StockActual, 0)     AS StockActual,
        m.StockMinimoEfectivo        AS StockMinimo,
        CAST(CASE WHEN ISNULL(i.StockActual, 0) <= m.StockMinimoEfectivo
                  THEN 1 ELSE 0 END AS BIT) AS BajoMinimo
FROM    cat.Productos p
JOIN    cat.Categorias c ON c.IdCategoria = p.IdCategoria
LEFT JOIN inv.Inventario i ON i.IdProducto = p.IdProducto
CROSS APPLY (
    SELECT ISNULL(i.StockMinimo,
           ISNULL(TRY_CAST((SELECT Valor FROM cfg.Parametros
                            WHERE Clave = N'INV.STOCK_MINIMO_GLOBAL' AND Activo = 1) AS INT), 0))
           AS StockMinimoEfectivo
) m
WHERE   p.EsCombo = 0;
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'006_Inventario.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'006_Inventario.sql', N'Esquema inv: stock, movimientos y vista de stock actual');
GO

-- Verificacion: 2 tablas en inv
SELECT s.name AS Esquema, t.name AS Tabla
FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'inv' ORDER BY t.name;
SELECT IdMigracion, Script FROM cfg.Migraciones ORDER BY IdMigracion;
GO