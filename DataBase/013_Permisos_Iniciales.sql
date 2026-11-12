/* =====================================================================
   Script:        013_Permisos_Iniciales.sql
   Branch Git:    Feature/SQL
   Descripcion:   Permisos de cada modulo y su asignacion inicial a roles.
                  PROVISIONAL: se ajusta cuando se definan las reglas.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

INSERT INTO seg.Permisos (Codigo, Nombre, Modulo)
SELECT v.Codigo, v.Nombre, v.Modulo
FROM (VALUES
    (N'SEG.USUARIOS.VER',           N'Ver usuarios',                    N'Seguridad'),
    (N'SEG.USUARIOS.GESTIONAR',     N'Gestionar usuarios',              N'Seguridad'),
    (N'SEG.ROLES.GESTIONAR',        N'Gestionar roles y permisos',      N'Seguridad'),
    (N'SEG.AUDITORIA.VER',          N'Ver auditoría',                   N'Seguridad'),
    (N'CATEGORIAS.VER',             N'Ver categorías',                  N'Catálogo'),
    (N'CATEGORIAS.GESTIONAR',       N'Crear, editar y eliminar categorías', N'Catálogo'),
    (N'PRODUCTOS.VER',              N'Ver productos (administrativo)',  N'Catálogo'),
    (N'PRODUCTOS.GESTIONAR',        N'Crear y editar productos',        N'Catálogo'),
    (N'PRODUCTOS.CAMBIAR_ESTADO',   N'Activar o inactivar productos',   N'Catálogo'),
    (N'IMAGENES.GESTIONAR',         N'Gestionar imágenes de productos', N'Catálogo'),
    (N'CATALOGO.ORDENAR',           N'Ordenar el catálogo',             N'Catálogo'),
    (N'INVENTARIO.VER',             N'Ver inventario',                  N'Inventario'),
    (N'INVENTARIO.MOVIMIENTOS',     N'Registrar movimientos de inventario', N'Inventario'),
    (N'INVENTARIO.CONFIGURAR_MINIMO', N'Configurar stock mínimo',       N'Inventario'),
    (N'PEDIDOS.VER',                N'Ver pedidos',                     N'Pedidos'),
    (N'PEDIDOS.CAMBIAR_ESTADO',     N'Cambiar estado de pedidos',       N'Pedidos'),
    (N'CLIENTES.VER',               N'Ver clientes',                    N'Clientes'),
    (N'PAGOS.VER',                  N'Ver pagos',                       N'Pagos'),
    (N'ENTREGAS.VER',               N'Ver entregas',                    N'Entregas'),
    (N'ENTREGAS.CONFIGURAR_ZONAS',  N'Configurar zonas y costos de entrega', N'Entregas'),
    (N'PROMOCIONES.GESTIONAR',      N'Gestionar promociones y combos',  N'Promociones'),
    (N'NOTIFICACIONES.VER',         N'Ver notificaciones',              N'Notificaciones'),
    (N'REPORTES.VER',               N'Ver reportes',                    N'Reportes'),
    (N'ANALITICA.VER',              N'Ver dashboard y analítica',       N'Analítica'),
    (N'CONFIG.GESTIONAR',           N'Gestionar configuración',         N'Configuración')
) AS v (Codigo, Nombre, Modulo)
WHERE NOT EXISTS (SELECT 1 FROM seg.Permisos p WHERE p.Codigo = v.Codigo);
GO

-- Administrador: todos los permisos
INSERT INTO seg.RolPermisos (IdRol, IdPermiso)
SELECT r.IdRol, p.IdPermiso
FROM   seg.Roles r CROSS JOIN seg.Permisos p
WHERE  r.Nombre = N'Administrador'
  AND  NOT EXISTS (SELECT 1 FROM seg.RolPermisos rp
                   WHERE rp.IdRol = r.IdRol AND rp.IdPermiso = p.IdPermiso);
GO

-- Operador: consulta, movimientos de inventario, imagenes y estado de pedidos
INSERT INTO seg.RolPermisos (IdRol, IdPermiso)
SELECT r.IdRol, p.IdPermiso
FROM   seg.Roles r
JOIN   seg.Permisos p ON p.Codigo IN (
           N'CATEGORIAS.VER', N'PRODUCTOS.VER', N'IMAGENES.GESTIONAR',
           N'INVENTARIO.VER', N'INVENTARIO.MOVIMIENTOS',
           N'PEDIDOS.VER', N'PEDIDOS.CAMBIAR_ESTADO',
           N'CLIENTES.VER', N'ENTREGAS.VER')
WHERE  r.Nombre = N'Operador'
  AND  NOT EXISTS (SELECT 1 FROM seg.RolPermisos rp
                   WHERE rp.IdRol = r.IdRol AND rp.IdPermiso = p.IdPermiso);
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'013_Permisos_Iniciales.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'013_Permisos_Iniciales.sql', N'Permisos por modulo y asignacion inicial a roles');
GO

/* ---------------------------------------------------------------------
   Verificacion final:
   - Permisos por rol: Administrador 25, Cliente 0, Operador 9
   - Tablas por esquema (35 en total) y 13 migraciones
   --------------------------------------------------------------------- */
SELECT r.Nombre AS Rol, COUNT(rp.IdPermiso) AS Permisos
FROM   seg.Roles r LEFT JOIN seg.RolPermisos rp ON rp.IdRol = r.IdRol
GROUP BY r.Nombre ORDER BY r.Nombre;

SELECT s.name AS Esquema, COUNT(*) AS Tablas
FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
GROUP BY s.name ORDER BY s.name;

SELECT IdMigracion, Script, FechaAplicacion FROM cfg.Migraciones ORDER BY IdMigracion;
GO