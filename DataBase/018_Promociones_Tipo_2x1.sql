/* =====================================================================
   Script:        018_Promociones_Tipo_2x1.sql
   Descripcion:   Extiende prm.Promociones para soportar tipo DOS_POR_UNO
                  y registra promoción de prueba Core Training 2x1.
   ===================================================================== */

USE KFitness;
GO

IF COL_LENGTH('prm.Promociones', 'TipoPromocion') IS NULL
BEGIN
    ALTER TABLE prm.Promociones
    ADD TipoPromocion NVARCHAR(30) NULL;
END
GO

IF COL_LENGTH('prm.Promociones', 'TipoPromocion') IS NOT NULL
BEGIN
    UPDATE prm.Promociones
    SET TipoPromocion = N'PORCENTAJE'
    WHERE TipoPromocion IS NULL;

    ALTER TABLE prm.Promociones
    ALTER COLUMN TipoPromocion NVARCHAR(30) NOT NULL;
END
GO

IF COL_LENGTH('prm.Promociones', 'CantidadCompra') IS NULL
BEGIN
    ALTER TABLE prm.Promociones
    ADD CantidadCompra INT NULL;
END
GO

IF COL_LENGTH('prm.Promociones', 'CantidadEntrega') IS NULL
BEGIN
    ALTER TABLE prm.Promociones
    ADD CantidadEntrega INT NULL;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID(N'prm.Promociones')
      AND name = N'DF_Promociones_TipoPromocion'
)
BEGIN
    ALTER TABLE prm.Promociones DROP CONSTRAINT DF_Promociones_TipoPromocion;
END
GO

IF COL_LENGTH('prm.Promociones', 'TipoPromocion') IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID(N'prm.Promociones')
      AND name = N'DF_Promociones_TipoPromocion'
)
BEGIN
    ALTER TABLE prm.Promociones
    ADD CONSTRAINT DF_Promociones_TipoPromocion DEFAULT N'PORCENTAJE' FOR TipoPromocion;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'prm.Promociones')
      AND name = N'CK_Promociones_Porcentaje'
)
BEGIN
    ALTER TABLE prm.Promociones DROP CONSTRAINT CK_Promociones_Porcentaje;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'prm.Promociones')
      AND name = N'CK_Promociones_Tipo'
)
BEGIN
    ALTER TABLE prm.Promociones DROP CONSTRAINT CK_Promociones_Tipo;
END
GO

IF COL_LENGTH('prm.Promociones', 'TipoPromocion') IS NOT NULL
BEGIN
    ALTER TABLE prm.Promociones
    ADD CONSTRAINT CK_Promociones_Tipo
    CHECK (
        (
            TipoPromocion = N'PORCENTAJE'
            AND PorcentajeDescuento > 0
            AND PorcentajeDescuento <= 100
            AND CantidadCompra IS NULL
            AND CantidadEntrega IS NULL
        )
        OR
        (
            TipoPromocion = N'DOS_POR_UNO'
            AND PorcentajeDescuento >= 0
            AND PorcentajeDescuento <= 100
            AND CantidadCompra IS NOT NULL
            AND CantidadEntrega IS NOT NULL
            AND CantidadCompra > 0
            AND CantidadEntrega > CantidadCompra
        )
    );
END
GO

DECLARE @IdProductoCore INT;
SELECT TOP 1 @IdProductoCore = p.IdProducto
FROM cat.Productos p
WHERE UPPER(LTRIM(RTRIM(p.Nombre))) = UPPER(N'Core training Session');

IF @IdProductoCore IS NOT NULL
BEGIN
    DECLARE @IdPromocionCore INT;

    SELECT TOP 1 @IdPromocionCore = pr.IdPromocion
    FROM prm.Promociones pr
    WHERE UPPER(LTRIM(RTRIM(pr.Nombre))) = UPPER(N'Core Training 2x1');

    IF @IdPromocionCore IS NULL
    BEGIN
        INSERT INTO prm.Promociones
        (
            Nombre,
            Descripcion,
            Motivo,
            TipoPromocion,
            PorcentajeDescuento,
            CantidadCompra,
            CantidadEntrega,
            FechaInicio,
            FechaFin,
            Activo
        )
        VALUES
        (
            N'Core Training 2x1',
            N'Disfruta dos clases de Core Training por el precio de una. Entrena acompañado o aprovecha una segunda sesión sin costo adicional.',
            N'Promoción HU 39',
            N'DOS_POR_UNO',
            0,
            1,
            2,
            CAST(SYSDATETIME() AS DATE),
            DATEADD(DAY, 30, CAST(SYSDATETIME() AS DATE)),
            1
        );

        SET @IdPromocionCore = CAST(SCOPE_IDENTITY() AS INT);
    END
    ELSE
    BEGIN
        UPDATE prm.Promociones
        SET Descripcion = N'Disfruta dos clases de Core Training por el precio de una. Entrena acompañado o aprovecha una segunda sesión sin costo adicional.',
            TipoPromocion = N'DOS_POR_UNO',
            PorcentajeDescuento = 0,
            CantidadCompra = 1,
            CantidadEntrega = 2,
            Activo = 1,
            FechaModificacion = SYSDATETIME(),
            FechaFin = CASE WHEN FechaFin < CAST(SYSDATETIME() AS DATE) THEN DATEADD(DAY, 30, CAST(SYSDATETIME() AS DATE)) ELSE FechaFin END
        WHERE IdPromocion = @IdPromocionCore;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM prm.PromocionProductos pp
        WHERE pp.IdPromocion = @IdPromocionCore
          AND pp.IdProducto = @IdProductoCore
    )
    BEGIN
        DELETE FROM prm.PromocionProductos WHERE IdPromocion = @IdPromocionCore;
        INSERT INTO prm.PromocionProductos (IdPromocion, IdProducto)
        VALUES (@IdPromocionCore, @IdProductoCore);
    END
END
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'018_Promociones_Tipo_2x1.sql')
BEGIN
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'018_Promociones_Tipo_2x1.sql', N'Extiende promociones para tipo DOS_POR_UNO y registra promoción Core Training 2x1');
END
GO
