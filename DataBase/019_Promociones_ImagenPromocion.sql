/* =====================================================================
   Script:        019_Promociones_ImagenPromocion.sql
   Descripcion:   Agrega columna ImagenPromocion en prm.Promociones
                  para soportar imágenes propias por promoción.
   Reejecutable:  Sí.
   ===================================================================== */

USE KFitness;
GO

IF COL_LENGTH('prm.Promociones', 'ImagenPromocion') IS NULL
BEGIN
    ALTER TABLE prm.Promociones
    ADD ImagenPromocion NVARCHAR(260) NULL;

    PRINT 'Columna prm.Promociones.ImagenPromocion agregada.';
END
ELSE
BEGIN
    PRINT 'La columna prm.Promociones.ImagenPromocion ya existe.';
END
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'019_Promociones_ImagenPromocion.sql')
BEGIN
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (
        N'019_Promociones_ImagenPromocion.sql',
        N'Agrega columna ImagenPromocion para imágenes propias de promociones.'
    );
END
GO

SELECT COL_LENGTH('prm.Promociones', 'ImagenPromocion') AS LongitudColumnaImagenPromocion;
SELECT IdMigracion, Script, FechaAplicacion
FROM cfg.Migraciones
WHERE Script = N'019_Promociones_ImagenPromocion.sql';
GO
