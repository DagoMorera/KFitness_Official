/* =====================================================================
   Script:        010_Promociones.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema prm: promociones, productos en promocion,
                  componentes de combos y vista de precio vigente.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

IF OBJECT_ID(N'prm.Promociones', N'U') IS NULL
BEGIN
    CREATE TABLE prm.Promociones
    (
        IdPromocion          INT IDENTITY(1,1) NOT NULL,
        Nombre               NVARCHAR(150)     NOT NULL,
        Descripcion          NVARCHAR(500)     NULL,
        Motivo               NVARCHAR(100)     NULL,    -- ej: fecha especial
        PorcentajeDescuento  DECIMAL(5,2)      NOT NULL,
        FechaInicio          DATE              NOT NULL,
        FechaFin             DATE              NOT NULL,
        Activo               BIT               NOT NULL CONSTRAINT DF_Promociones_Activo DEFAULT 1,
        FechaCreacion        DATETIME2(0)      NOT NULL CONSTRAINT DF_Promociones_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor            INT               NULL,
        FechaModificacion    DATETIME2(0)      NULL,
        ModificadoPor        INT               NULL,
        CONSTRAINT PK_Promociones PRIMARY KEY (IdPromocion),
        CONSTRAINT CK_Promociones_Nombre     CHECK (LEN(LTRIM(RTRIM(Nombre))) > 0),
        CONSTRAINT CK_Promociones_Porcentaje CHECK (PorcentajeDescuento > 0 AND PorcentajeDescuento <= 100),
        CONSTRAINT CK_Promociones_Fechas     CHECK (FechaFin >= FechaInicio),
        CONSTRAINT FK_Promociones_CreadoPor     FOREIGN KEY (CreadoPor)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Promociones_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    CREATE INDEX IX_Promociones_Vigencia ON prm.Promociones (Activo, FechaInicio, FechaFin);
    PRINT 'Tabla prm.Promociones creada.';
END
GO

IF OBJECT_ID(N'prm.PromocionProductos', N'U') IS NULL
BEGIN
    CREATE TABLE prm.PromocionProductos
    (
        IdPromocion  INT NOT NULL,
        IdProducto   INT NOT NULL,
        CONSTRAINT PK_PromocionProductos PRIMARY KEY (IdPromocion, IdProducto),
        CONSTRAINT FK_PromocionProductos_Promociones FOREIGN KEY (IdPromocion) REFERENCES prm.Promociones (IdPromocion) ON DELETE CASCADE,
        CONSTRAINT FK_PromocionProductos_Productos   FOREIGN KEY (IdProducto)  REFERENCES cat.Productos (IdProducto)
    );
    CREATE INDEX IX_PromocionProductos_Producto ON prm.PromocionProductos (IdProducto);
    PRINT 'Tabla prm.PromocionProductos creada.';
END
GO

/* Componentes de un combo. IdCombo debe ser un producto con EsCombo = 1 y
   IdProducto uno con EsCombo = 0; esa regla la valida el procedimiento del modulo. */
IF OBJECT_ID(N'prm.ComboProductos', N'U') IS NULL
BEGIN
    CREATE TABLE prm.ComboProductos
    (
        IdCombo     INT NOT NULL,
        IdProducto  INT NOT NULL,
        Cantidad    INT NOT NULL CONSTRAINT DF_ComboProductos_Cantidad DEFAULT 1,
        CONSTRAINT PK_ComboProductos PRIMARY KEY (IdCombo, IdProducto),
        CONSTRAINT FK_ComboProductos_Combo    FOREIGN KEY (IdCombo)    REFERENCES cat.Productos (IdProducto),
        CONSTRAINT FK_ComboProductos_Producto FOREIGN KEY (IdProducto) REFERENCES cat.Productos (IdProducto),
        CONSTRAINT CK_ComboProductos_Cantidad CHECK (Cantidad > 0),
        CONSTRAINT CK_ComboProductos_Distintos CHECK (IdCombo <> IdProducto)
    );
    PRINT 'Tabla prm.ComboProductos creada.';
END
GO

/* Precio vigente: aplica la mejor promocion activa hoy. Si la promocion
   ya vencio, el producto vuelve a su precio normal. */
CREATE OR ALTER VIEW prm.vw_PrecioVigente
AS
SELECT  p.IdProducto,
        p.Nombre AS Producto,
        p.Precio AS PrecioNormal,
        ISNULL(d.Descuento, 0) AS PorcentajeDescuento,
        CAST(ROUND(p.Precio * (1 - ISNULL(d.Descuento, 0) / 100.0), 2) AS DECIMAL(12,2)) AS PrecioFinal
FROM    cat.Productos p
OUTER APPLY (
    SELECT MAX(pr.PorcentajeDescuento) AS Descuento
    FROM   prm.PromocionProductos pp
    JOIN   prm.Promociones pr ON pr.IdPromocion = pp.IdPromocion
    WHERE  pp.IdProducto = p.IdProducto
      AND  pr.Activo = 1
      AND  CAST(SYSDATETIME() AS DATE) BETWEEN pr.FechaInicio AND pr.FechaFin
) d;
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'010_Promociones.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'010_Promociones.sql', N'Esquema prm: promociones, combos y vista de precio vigente');
GO

-- Verificacion: 3 tablas en prm
SELECT s.name AS Esquema, t.name AS Tabla
FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'prm' ORDER BY t.name;
SELECT IdMigracion, Script FROM cfg.Migraciones ORDER BY IdMigracion;
GO