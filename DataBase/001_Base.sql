/* =====================================================================
   Script:        001_Base.sql
   Branch Git:    Feature/SQL
   Servidor:      SQL Server 2022 Express (MegaMachine\SQLEXPRESS)
   Descripcion:   Crea la base de datos KFitness, los esquemas por
                  modulo y la tabla de control de migraciones.
   Reejecutable:  Si. Cada objeto se revisa antes de crearlo.
   ===================================================================== */

USE master;
GO

IF DB_ID(N'KFitness') IS NULL
BEGIN
    CREATE DATABASE KFitness COLLATE Latin1_General_100_CI_AI_SC;
    PRINT 'Base de datos KFitness creada.';
END
ELSE
    PRINT 'La base de datos KFitness ya existe.';
GO

ALTER DATABASE KFitness SET RECOVERY SIMPLE;
GO

USE KFitness;
GO

/* ---------------------------------------------------------------------
   Esquemas: uno por modulo
   seg = Seguridad          cli = Clientes        cat = Catalogo/Productos
   inv = Inventario         ped = Pedidos         pag = Pagos
   env = Entregas           prm = Promociones     ntf = Notificaciones
   cfg = Configuracion      aud = Auditoria
   --------------------------------------------------------------------- */
DECLARE @esquemas TABLE (Nombre SYSNAME);
INSERT INTO @esquemas (Nombre)
VALUES (N'seg'), (N'cli'), (N'cat'), (N'inv'), (N'ped'), (N'pag'),
       (N'env'), (N'prm'), (N'ntf'), (N'cfg'), (N'aud');

DECLARE @nombre SYSNAME, @sql NVARCHAR(200);

DECLARE cur_esquemas CURSOR LOCAL FAST_FORWARD FOR
    SELECT Nombre FROM @esquemas;

OPEN cur_esquemas;
FETCH NEXT FROM cur_esquemas INTO @nombre;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF SCHEMA_ID(@nombre) IS NULL
    BEGIN
        SET @sql = N'CREATE SCHEMA ' + QUOTENAME(@nombre) + N' AUTHORIZATION dbo;';
        EXEC (@sql);
        PRINT 'Esquema creado: ' + @nombre;
    END
    FETCH NEXT FROM cur_esquemas INTO @nombre;
END

CLOSE cur_esquemas;
DEALLOCATE cur_esquemas;
GO

/* ---------------------------------------------------------------------
   Control de migraciones: registra que scripts ya se aplicaron
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'cfg.Migraciones', N'U') IS NULL
BEGIN
    CREATE TABLE cfg.Migraciones
    (
        IdMigracion      INT IDENTITY(1,1) NOT NULL,
        Script           NVARCHAR(200)     NOT NULL,
        Descripcion      NVARCHAR(500)     NULL,
        FechaAplicacion  DATETIME2(0)      NOT NULL
            CONSTRAINT DF_Migraciones_Fecha   DEFAULT SYSDATETIME(),
        AplicadoPor      NVARCHAR(128)     NOT NULL
            CONSTRAINT DF_Migraciones_Usuario DEFAULT SUSER_SNAME(),
        CONSTRAINT PK_Migraciones        PRIMARY KEY (IdMigracion),
        CONSTRAINT UQ_Migraciones_Script UNIQUE (Script)
    );
    PRINT 'Tabla cfg.Migraciones creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'001_Base.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'001_Base.sql',
            N'Base de datos, esquemas por modulo y control de migraciones');
GO

/* ---------------------------------------------------------------------
   Verificacion: deben aparecer 11 esquemas y 1 migracion registrada
   --------------------------------------------------------------------- */
SELECT name AS Esquema
FROM   sys.schemas
WHERE  name IN (N'seg', N'cli', N'cat', N'inv', N'ped', N'pag',
                N'env', N'prm', N'ntf', N'cfg', N'aud')
ORDER BY name;

SELECT IdMigracion, Script, Descripcion, FechaAplicacion, AplicadoPor
FROM   cfg.Migraciones;
GO