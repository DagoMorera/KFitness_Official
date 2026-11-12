-- Ejecutar sobre la base configurada en KFitnessConnection.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @bloqueo int;
EXEC @bloqueo = sys.sp_getapplock @Resource=N'KFitness.Migracion031', @LockMode=N'Exclusive', @LockOwner=N'Transaction', @LockTimeout=15000;
IF @bloqueo < 0 THROW 51031, N'No se pudo bloquear la migración de valoración gratuita.', 1;

IF OBJECT_ID(N'res.ValoracionesGratisUsadas', N'U') IS NULL
BEGIN
    CREATE TABLE res.ValoracionesGratisUsadas
    (
        IdPromocion int NOT NULL REFERENCES prm.Promociones(IdPromocion),
        IdUsuario int NOT NULL REFERENCES seg.Usuarios(IdUsuario),
        FechaUso datetime2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_ValoracionesGratisUsadas PRIMARY KEY (IdPromocion, IdUsuario)
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'pag.Pagos') AND name=N'CK_Pagos_Monto_Simulado')
BEGIN
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'pag.Pagos') AND name=N'CK_Pagos_Monto')
        ALTER TABLE pag.Pagos DROP CONSTRAINT CK_Pagos_Monto;
    ALTER TABLE pag.Pagos WITH CHECK ADD CONSTRAINT CK_Pagos_Monto_Simulado
        CHECK (Monto > 0 OR (Monto = 0 AND Estado = N'APROBADO' AND ISNULL(MarcaTarjeta, N'') = N'SIMULADO'));
END;

DECLARE @servicio int, @promo int, @hoy date = CAST(SYSDATETIME() AS date);
SELECT TOP (1) @servicio = p.IdProducto
FROM cat.Productos p
JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE p.Nombre COLLATE Latin1_General_100_CI_AI IN (N'Evaluación física', N'Valoración inicial', N'Primera valoración gratuita')
  AND p.Activo = 1 AND c.Activo = 1 AND p.EsCombo = 0
ORDER BY CASE WHEN p.Nombre COLLATE Latin1_General_100_CI_AI = N'Evaluación física' THEN 0 ELSE 1 END, p.IdProducto;

SELECT @promo = IdPromocion FROM prm.Promociones WHERE Motivo = N'KFIT_PRIMERA_VALORACION';
IF @promo IS NULL
BEGIN
    IF @servicio IS NULL
        THROW 51032, N'Activa el servicio Evaluación física antes de instalar la primera valoración gratuita.', 1;

    SELECT TOP (1) @promo = IdPromocion
    FROM prm.Promociones
    WHERE Nombre COLLATE Latin1_General_100_CI_AI = N'Primera valoración gratuita'
    ORDER BY IdPromocion;

    IF @promo IS NULL
    BEGIN
        INSERT prm.Promociones
            (Nombre, Descripcion, Motivo, TipoPromocion, PorcentajeDescuento, FechaInicio, FechaFin, Activo)
        VALUES
            (N'Primera valoración gratuita', N'Conocé tu punto de partida con una valoración inicial sin costo.',
             N'KFIT_PRIMERA_VALORACION', N'PORCENTAJE', 100, @hoy, CONVERT(date, '99991231', 112), 1);
        SET @promo = CONVERT(int, SCOPE_IDENTITY());
    END
    ELSE
    BEGIN
        UPDATE prm.Promociones
        SET Motivo=N'KFIT_PRIMERA_VALORACION', TipoPromocion=N'PORCENTAJE',
            PorcentajeDescuento=100, CantidadCompra=NULL, CantidadEntrega=NULL
        WHERE IdPromocion=@promo;
    END;

    DELETE FROM prm.PromocionProductos WHERE IdPromocion=@promo AND IdProducto<>@servicio;
    IF NOT EXISTS (SELECT 1 FROM prm.PromocionProductos WHERE IdPromocion=@promo AND IdProducto=@servicio)
        INSERT prm.PromocionProductos(IdPromocion, IdProducto) VALUES(@promo, @servicio);
END;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'prm.Promociones') AND name=N'CK_Promociones_ValoracionGratis')
    ALTER TABLE prm.Promociones WITH CHECK ADD CONSTRAINT CK_Promociones_ValoracionGratis
        CHECK (ISNULL(Motivo,N'') <> N'KFIT_PRIMERA_VALORACION' OR (TipoPromocion=N'PORCENTAJE' AND PorcentajeDescuento=100));

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script=N'031_Promocion_Primera_Valoracion_Gratis.sql')
BEGIN
    INSERT res.ValoracionesGratisUsadas(IdPromocion, IdUsuario, FechaUso)
    SELECT @promo, o.IdUsuario, MIN(o.FechaCreacion)
    FROM res.OperacionesPromocionales o
    WHERE o.IdPromocion=@promo
      AND EXISTS (SELECT 1 FROM res.Reservas r WHERE r.IdOperacionPromocional=o.IdOperacionPromocional)
      AND NOT EXISTS (SELECT 1 FROM res.ValoracionesGratisUsadas u WHERE u.IdPromocion=@promo AND u.IdUsuario=o.IdUsuario)
    GROUP BY o.IdUsuario;

    INSERT cfg.Migraciones(Script, Descripcion)
    VALUES(N'031_Promocion_Primera_Valoracion_Gratis.sql', N'Valoración gratuita de un solo uso y órdenes simuladas de monto cero.');
END;
COMMIT;
