-- Ejecutar sobre la base configurada en KFitnessConnection.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @bloqueo int;
EXEC @bloqueo = sys.sp_getapplock @Resource=N'KFitness.Migracion032', @LockMode=N'Exclusive', @LockOwner=N'Transaction', @LockTimeout=15000;
IF @bloqueo < 0 THROW 51033, N'No se pudo bloquear la migración del plan mensual.', 1;

IF COL_LENGTH(N'con.Consultas', N'Nombre') = 300
    ALTER TABLE con.Consultas ALTER COLUMN Nombre nvarchar(302) NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'prm.Promociones') AND name=N'CK_Promociones_Tipo_Consulta')
BEGIN
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'prm.Promociones') AND name=N'CK_Promociones_Tipo')
        ALTER TABLE prm.Promociones DROP CONSTRAINT CK_Promociones_Tipo;
    ALTER TABLE prm.Promociones WITH CHECK ADD CONSTRAINT CK_Promociones_Tipo_Consulta CHECK
    (
        (TipoPromocion=N'PORCENTAJE' AND PorcentajeDescuento>0 AND PorcentajeDescuento<=100 AND CantidadCompra IS NULL AND CantidadEntrega IS NULL)
        OR (TipoPromocion=N'DOS_POR_UNO' AND PorcentajeDescuento>=0 AND PorcentajeDescuento<=100
            AND CantidadCompra IS NOT NULL AND CantidadEntrega IS NOT NULL AND CantidadCompra>0 AND CantidadEntrega>CantidadCompra)
        OR (TipoPromocion=N'CONSULTA' AND PorcentajeDescuento=0 AND CantidadCompra IS NULL AND CantidadEntrega IS NULL)
    );
END;

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script=N'032_Plan_Mensual_Contacto.sql')
BEGIN
    DECLARE @categoria int, @producto int, @promo int,
        @nombre nvarchar(150) = N'Plan mensual de entrenamiento y seguimiento',
        @descripcion nvarchar(500) = N'Entrená durante un mes con un plan adaptado a tus objetivos y a tu nivel. Recibí seguimiento para revisar tu progreso y ajustar el entrenamiento según tu evolución.',
        @fechaPendiente date = CONVERT(date, '19000101', 112);

    SELECT @categoria=IdCategoria FROM cat.Categorias WHERE Nombre=N'Entrenamiento';
    IF @categoria IS NULL THROW 51034, N'Falta la categoría Entrenamiento del catálogo.', 1;

    SELECT TOP (1) @producto=IdProducto FROM cat.Productos
    WHERE Nombre COLLATE Latin1_General_100_CI_AI = @nombre AND IdCategoria=@categoria AND EsCombo=0
    ORDER BY IdProducto;
    IF @producto IS NULL
    BEGIN
        -- El precio obligatorio se deja en cero mientras el servicio esté inactivo.
        INSERT cat.Productos(IdCategoria, Nombre, Descripcion, Precio, Activo)
        VALUES(@categoria, @nombre, @descripcion, 0, 0);
        SET @producto=CONVERT(int, SCOPE_IDENTITY());
    END;

    IF NOT EXISTS (SELECT 1 FROM cat.ImagenesProducto WHERE IdProducto=@producto AND EsPrincipal=1 AND Activo=1)
        INSERT cat.ImagenesProducto(IdProducto, Ruta, EsPrincipal, Activo)
        VALUES(@producto, N'/img/servicio-entrenamiento.png', 1, 1);

    SELECT TOP (1) @promo=IdPromocion FROM prm.Promociones
    WHERE Motivo=N'KFIT_PLAN_MENSUAL' OR Nombre COLLATE Latin1_General_100_CI_AI=@nombre
    ORDER BY CASE WHEN Motivo=N'KFIT_PLAN_MENSUAL' THEN 0 ELSE 1 END, IdPromocion;
    IF @promo IS NULL
    BEGIN
        INSERT prm.Promociones(Nombre, Descripcion, Motivo, TipoPromocion, PorcentajeDescuento, FechaInicio, FechaFin, Activo)
        VALUES(@nombre, @descripcion, N'KFIT_PLAN_MENSUAL', N'CONSULTA', 0, @fechaPendiente, @fechaPendiente, 0);
        SET @promo=CONVERT(int, SCOPE_IDENTITY());
    END
    ELSE
        UPDATE prm.Promociones
        SET Motivo=N'KFIT_PLAN_MENSUAL', TipoPromocion=N'CONSULTA',
            PorcentajeDescuento=0, CantidadCompra=NULL, CantidadEntrega=NULL
        WHERE IdPromocion=@promo;

    DELETE FROM prm.PromocionProductos WHERE IdPromocion=@promo AND IdProducto<>@producto;
    IF NOT EXISTS (SELECT 1 FROM prm.PromocionProductos WHERE IdPromocion=@promo AND IdProducto=@producto)
        INSERT prm.PromocionProductos(IdPromocion,IdProducto) VALUES(@promo,@producto);

    INSERT cfg.Migraciones(Script, Descripcion)
    VALUES(N'032_Plan_Mensual_Contacto.sql', N'Plan mensual de consulta y nombre completo en consultas autenticadas.');
END;
COMMIT;
