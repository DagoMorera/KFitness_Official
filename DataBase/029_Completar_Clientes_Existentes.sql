-- Crea el perfil faltante de cuentas activas con rol Cliente.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

INSERT INTO cli.Clientes (IdUsuario, CreadoPor)
SELECT u.IdUsuario, u.IdUsuario
FROM seg.Usuarios u
INNER JOIN seg.Roles r ON r.IdRol = u.IdRol
WHERE u.Activo = 1 AND r.Activo = 1 AND r.Nombre = N'Cliente'
  AND NOT EXISTS (
    SELECT 1 FROM cli.Clientes c WITH (UPDLOCK, HOLDLOCK)
    WHERE c.IdUsuario = u.IdUsuario
  );

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'029_Completar_Clientes_Existentes.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'029_Completar_Clientes_Existentes.sql', N'Completa fichas de cuentas activas sin inventar datos personales.');

COMMIT;
