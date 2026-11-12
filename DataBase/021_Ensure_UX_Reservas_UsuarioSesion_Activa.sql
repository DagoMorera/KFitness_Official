/* =====================================================================
   Script:        021_Ensure_UX_Reservas_UsuarioSesion_Activa.sql
   Descripcion:   Garantiza índice único filtrado para evitar reservas
                  activas duplicadas por usuario y sesión.
                  No modifica datos históricos cancelados.
   ===================================================================== */

USE KFitness;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'res.Reservas', N'U') IS NULL
BEGIN
    RAISERROR(N'No existe la tabla res.Reservas.', 16, 1);
    RETURN;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'res.Reservas')
      AND name = N'UX_Reservas_UsuarioSesion_Activa'
)
BEGIN
    PRINT 'El índice UX_Reservas_UsuarioSesion_Activa ya existe. No se realizan cambios.';
    RETURN;
END
GO

IF EXISTS (
    SELECT 1
    FROM res.Reservas
    WHERE Estado IN (N'PENDIENTE', N'CONFIRMADA')
    GROUP BY IdUsuario, IdHorarioServicio
    HAVING COUNT(1) > 1
)
BEGIN
    RAISERROR(N'Existen duplicados activos en res.Reservas. Revise antes de crear el índice.', 16, 1);
    RETURN;
END
GO

CREATE UNIQUE INDEX UX_Reservas_UsuarioSesion_Activa
    ON res.Reservas (IdHorarioServicio, IdUsuario)
    WHERE Estado IN (N'PENDIENTE', N'CONFIRMADA');
GO

PRINT 'Índice UX_Reservas_UsuarioSesion_Activa creado correctamente.';
GO
