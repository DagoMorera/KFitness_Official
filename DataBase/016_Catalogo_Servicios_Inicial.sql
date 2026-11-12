/* =====================================================================
   Script:        016_Catalogo_Servicios_Inicial.sql
   Branch Git:    feature/sprint1-avances
	  Descripcion:   Carga inicial de categorias y servicios para HU-25 (SER)
				
   ===================================================================== */

USE KFitness;
GO

SET XACT_ABORT ON;


DECLARE @CategoriaEntrenamiento NVARCHAR(100) = N'Entrenamiento';
DECLARE @CategoriaAsesoria      NVARCHAR(100) = N'Asesor' + NCHAR(237) + N'a';
DECLARE @CategoriaClases        NVARCHAR(100) = N'Clases';

DECLARE @ServicioAsesoriaNutricional NVARCHAR(150) = N'Asesor' + NCHAR(237) + N'a nutricional';
DECLARE @ServicioEvaluacionFisica    NVARCHAR(150) = N'Evaluaci' + NCHAR(243) + N'n f' + NCHAR(237) + N'sica';

DECLARE @CategoriaAsesoriaCorrupta NVARCHAR(100) = N'Asesor' + NCHAR(195) + NCHAR(173) + N'a';
DECLARE @ServicioAsesoriaCorrupto  NVARCHAR(150) = N'Asesor' + NCHAR(195) + NCHAR(173) + N'a nutricional';
DECLARE @ServicioEvalCorrupto      NVARCHAR(150) = N'Evaluaci' + NCHAR(195) + NCHAR(179) + N'n f' + NCHAR(195) + NCHAR(173) + N'sica';

DECLARE @Precio_EntrenamientoPersonalizado DECIMAL(12,2) = 25000;
DECLARE @Precio_PlanEntrenamiento          DECIMAL(12,2) = 15000;
DECLARE @Precio_AsesoriaNutricional        DECIMAL(12,2) = 20000;
DECLARE @Precio_EvaluacionFisica           DECIMAL(12,2) = 12000;
DECLARE @Precio_ClasesGrupales             DECIMAL(12,2) = 8000;
DECLARE @Precio_EntrenamientoFuncional     DECIMAL(12,2) = 10000;

IF @Precio_EntrenamientoPersonalizado IS NULL
   OR @Precio_PlanEntrenamiento IS NULL
   OR @Precio_AsesoriaNutricional IS NULL
   OR @Precio_EvaluacionFisica IS NULL
   OR @Precio_ClasesGrupales IS NULL
   OR @Precio_EntrenamientoFuncional IS NULL
BEGIN
	THROW 50020, N'Debe completar los precios reales de todos los servicios antes de ejecutar 016_Catalogo_Servicios_Inicial.sql.', 1;
END;

IF @Precio_EntrenamientoPersonalizado < 0
   OR @Precio_PlanEntrenamiento < 0
   OR @Precio_AsesoriaNutricional < 0
   OR @Precio_EvaluacionFisica < 0
   OR @Precio_ClasesGrupales < 0
   OR @Precio_EntrenamientoFuncional < 0
BEGIN
	THROW 50021, N'Los precios de servicios no pueden ser negativos.', 1;
END;

IF EXISTS
(
	SELECT 1
	FROM cat.Categorias c
	WHERE c.Nombre = @CategoriaAsesoriaCorrupta
)
OR EXISTS
(
	SELECT 1
	FROM cat.Productos p
	WHERE p.Nombre IN (@ServicioAsesoriaCorrupto, @ServicioEvalCorrupto)
)
BEGIN
	THROW 50023, N'Se detectaron textos con codificacion incorrecta. Ejecute primero DataBase/016B_Correccion_Codificacion_Demo.sql.', 1;
END;

BEGIN TRY
	BEGIN TRANSACTION;

	/* ---------------------------------------------------------------------
	   Categorias iniciales de servicios (sin duplicar por Nombre).
	   --------------------------------------------------------------------- */
	INSERT INTO cat.Categorias (Nombre, Descripcion, Activo)
	SELECT v.Nombre, v.Descripcion, 1
	FROM (VALUES
		(@CategoriaEntrenamiento, N'Categoria de servicios de entrenamiento.'),
		(@CategoriaAsesoria,      N'Categoria de servicios de asesoria.'),
		(@CategoriaClases,        N'Categoria de servicios de clases.')
	) AS v (Nombre, Descripcion)
	WHERE NOT EXISTS
	(
		SELECT 1
		FROM cat.Categorias c
		WHERE c.Nombre = v.Nombre
	);

	/* ---------------------------------------------------------------------
	   Seguridad de datos: no insertar servicios en categorias inactivas.
	   --------------------------------------------------------------------- */
	IF EXISTS
	(
		SELECT 1
		FROM cat.Categorias c
		WHERE c.Nombre IN (@CategoriaEntrenamiento, @CategoriaAsesoria, @CategoriaClases)
		  AND c.Activo = 0
	)
	BEGIN
		THROW 50022, N'Existe al menos una categoria objetivo inactiva. Active la categoria o ajuste la carga antes de insertar servicios.', 1;
	END;

	/* ---------------------------------------------------------------------
	   Insercion de servicios activos en cat.Productos.
	   - Usa FK por busqueda de categoria por Nombre.
	   - Evita duplicados por (Categoria, Nombre de servicio).
	   - EsCombo = 0 para servicios individuales.
	   --------------------------------------------------------------------- */
	;WITH Servicios AS
	(
		SELECT *
		FROM (VALUES
			(@CategoriaEntrenamiento, N'Entrenamiento personalizado', @Precio_EntrenamientoPersonalizado, 10, N'Servicio individual enfocado en la planificacion y supervision del entrenamiento.'),
			(@CategoriaEntrenamiento, N'Plan de entrenamiento',       @Precio_PlanEntrenamiento,          20, N'Diseno de rutina de entrenamiento segun objetivos y condicion fisica.'),
			(@CategoriaAsesoria,      @ServicioAsesoriaNutricional,   @Precio_AsesoriaNutricional,        30, N'Orientacion nutricional general para apoyar el proceso de entrenamiento.'),
			(@CategoriaAsesoria,      @ServicioEvaluacionFisica,      @Precio_EvaluacionFisica,           40, N'Valoracion inicial del estado fisico para definir puntos de seguimiento.'),
			(@CategoriaClases,        N'Clases grupales',             @Precio_ClasesGrupales,             50, N'Sesiones grupales guiadas con objetivos de acondicionamiento fisico.'),
			(@CategoriaClases,        N'Entrenamiento funcional',     @Precio_EntrenamientoFuncional,     60, N'Sesion orientada a movimientos funcionales y trabajo integral del cuerpo.')
		) AS x (CategoriaNombre, NombreServicio, Precio, OrdenCatalogo, DescripcionServicio)
	)
	INSERT INTO cat.Productos (IdCategoria, Nombre, Descripcion, Precio, EsCombo, Activo, OrdenCatalogo)
	SELECT c.IdCategoria,
		   s.NombreServicio,
		   s.DescripcionServicio,
		   s.Precio,
		   0,
		   1,
		   s.OrdenCatalogo
	FROM Servicios s
	INNER JOIN cat.Categorias c
		ON c.Nombre = s.CategoriaNombre
	WHERE c.Activo = 1
	  AND NOT EXISTS
	  (
		  SELECT 1
		  FROM cat.Productos p
		  WHERE p.IdCategoria = c.IdCategoria
			AND p.Nombre = s.NombreServicio
	  );

	IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'016_Catalogo_Servicios_Inicial.sql')
		INSERT INTO cfg.Migraciones (Script, Descripcion)
		VALUES (N'016_Catalogo_Servicios_Inicial.sql', N'Carga inicial de categorias y servicios de demostracion para consulta de servicios (HU-25).');

	COMMIT TRANSACTION;
END TRY
BEGIN CATCH
	IF @@TRANCOUNT > 0
		ROLLBACK TRANSACTION;

	THROW;
END CATCH;

/* ---------------------------------------------------------------------
   Verificacion sugerida post-ejecucion (solo lectura)
   ---------------------------------------------------------------------
SELECT c.IdCategoria, c.Nombre AS Categoria, c.Activo
FROM cat.Categorias c
WHERE c.Nombre IN (@CategoriaEntrenamiento, @CategoriaAsesoria, @CategoriaClases)
ORDER BY c.Nombre;

SELECT p.IdProducto, c.Nombre AS Categoria, p.Nombre AS Servicio, p.Precio, p.Activo, p.OrdenCatalogo
FROM cat.Productos p
JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE c.Nombre IN (@CategoriaEntrenamiento, @CategoriaAsesoria, @CategoriaClases)
ORDER BY p.OrdenCatalogo, p.IdProducto;
*/
GO