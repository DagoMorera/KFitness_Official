/* =====================================================================
   Script:        015_Foto_Perfil.sql
   Descripcion:   Soporte de referencia de foto de perfil en seg.Usuarios.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

IF COL_LENGTH('seg.Usuarios', 'FotoPerfil') IS NULL
BEGIN
    ALTER TABLE seg.Usuarios
    ADD FotoPerfil NVARCHAR(260) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'015_Foto_Perfil.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'015_Foto_Perfil.sql', N'Soporte para referencia de foto de perfil en seg.Usuarios');
GO

SELECT IdMigracion, Script, FechaAplicacion
FROM cfg.Migraciones
WHERE Script = N'015_Foto_Perfil.sql';
GO