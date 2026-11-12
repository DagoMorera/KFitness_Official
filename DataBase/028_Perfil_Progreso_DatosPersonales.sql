/* =====================================================================
   Script:        028_Perfil_Progreso_DatosPersonales.sql
   Branch Git:    Feature/SQL
   Descripcion:   Datos personales adicionales del cliente para Mi progreso.
   Reejecutable:  Si.
   ===================================================================== */

-- Ejecutar en la base KFitness seleccionada en la conexión.

/* ---------------------------------------------------------------------
   cli.Clientes.Sexo
   Valores permitidos: Femenino, Masculino, Prefiero no indicarlo.
   --------------------------------------------------------------------- */
IF COL_LENGTH(N'cli.Clientes', N'Sexo') IS NULL
BEGIN
    ALTER TABLE cli.Clientes
        ADD Sexo NVARCHAR(30) NULL;
END
GO

IF COL_LENGTH(N'cli.Clientes', N'Sexo') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'CK_Clientes_Sexo'
         AND parent_object_id = OBJECT_ID(N'cli.Clientes'))
BEGIN
    ALTER TABLE cli.Clientes
        ADD CONSTRAINT CK_Clientes_Sexo
            CHECK (Sexo IS NULL OR Sexo IN (N'Femenino', N'Masculino', N'Prefiero no indicarlo'));
END
GO

/* ---------------------------------------------------------------------
   cli.Clientes.NivelActividad
   Valores permitidos: Sedentario, Ligero, Moderado, Alto, Muy alto.
   --------------------------------------------------------------------- */
IF COL_LENGTH(N'cli.Clientes', N'NivelActividad') IS NULL
BEGIN
    ALTER TABLE cli.Clientes
        ADD NivelActividad NVARCHAR(20) NULL;
END
GO

IF COL_LENGTH(N'cli.Clientes', N'NivelActividad') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'CK_Clientes_NivelActividad'
         AND parent_object_id = OBJECT_ID(N'cli.Clientes'))
BEGIN
    ALTER TABLE cli.Clientes
        ADD CONSTRAINT CK_Clientes_NivelActividad
            CHECK (NivelActividad IS NULL OR NivelActividad IN (N'Sedentario', N'Ligero', N'Moderado', N'Alto', N'Muy alto'));
END
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'028_Perfil_Progreso_DatosPersonales.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'028_Perfil_Progreso_DatosPersonales.sql',
            N'Datos personales adicionales de cliente: sexo y nivel de actividad');
GO

SELECT c.name AS Columna
FROM sys.columns c
WHERE c.object_id = OBJECT_ID(N'cli.Clientes')
  AND c.name IN (N'Sexo', N'NivelActividad')
ORDER BY c.name;
GO
