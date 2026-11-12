/* =====================================================================
   Script:        016B_Correccion_Codificacion_Demo.sql
   Descripcion:   Correccion de codificacion en datos de demostracion
				  cargados para HU-25 (catalogo de servicios).
   Alcance:       Solo entorno local de desarrollo.
   ===================================================================== */

USE KFitness;
GO

SET XACT_ABORT ON;

BEGIN TRY
	BEGIN TRANSACTION;

	UPDATE cat.Categorias
	SET Nombre = N'Asesor' + NCHAR(237) + N'a'
	WHERE IdCategoria = 2
	  AND CHARINDEX(NCHAR(195), Nombre) > 0;

	UPDATE cat.Productos
	SET Descripcion = N'Servicio individual enfocado en la planificacion y supervisi' + NCHAR(243) + N'n del entrenamiento.'
	WHERE IdProducto = 1
	  AND CHARINDEX(NCHAR(195), Descripcion) > 0;

	UPDATE cat.Productos
	SET Descripcion = N'Dise' + NCHAR(241) + N'o de rutina de entrenamiento seg' + NCHAR(250) + N'n objetivos y condici' + NCHAR(243) + N'n f' + NCHAR(237) + N'sica.'
	WHERE IdProducto = 2
	  AND CHARINDEX(NCHAR(195), Descripcion) > 0;

	UPDATE cat.Productos
	SET Nombre = N'Asesor' + NCHAR(237) + N'a nutricional',
		Descripcion = N'Orientaci' + NCHAR(243) + N'n nutricional general para apoyar el proceso de entrenamiento.'
	WHERE IdProducto = 3
	  AND (CHARINDEX(NCHAR(195), Nombre) > 0 OR CHARINDEX(NCHAR(195), Descripcion) > 0);

	UPDATE cat.Productos
	SET Nombre = N'Evaluaci' + NCHAR(243) + N'n f' + NCHAR(237) + N'sica',
		Descripcion = N'Valoraci' + NCHAR(243) + N'n inicial del estado f' + NCHAR(237) + N'sico para definir puntos de seguimiento.'
	WHERE IdProducto = 4
	  AND (CHARINDEX(NCHAR(195), Nombre) > 0 OR CHARINDEX(NCHAR(195), Descripcion) > 0);

	UPDATE cat.Productos
	SET Descripcion = N'Sesiones grupales guiadas con objetivos de acondicionamiento f' + NCHAR(237) + N'sico.'
	WHERE IdProducto = 5
	  AND CHARINDEX(NCHAR(195), Descripcion) > 0;

	UPDATE cat.Productos
	SET Descripcion = N'Sesi' + NCHAR(243) + N'n orientada a movimientos funcionales y trabajo integral del cuerpo.'
	WHERE IdProducto = 6
	  AND CHARINDEX(NCHAR(195), Descripcion) > 0;

	COMMIT TRANSACTION;
END TRY
BEGIN CATCH
	IF @@TRANCOUNT > 0
		ROLLBACK TRANSACTION;

	THROW;
END CATCH;
GO
