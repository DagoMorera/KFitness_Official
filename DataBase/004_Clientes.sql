/* =====================================================================
   Script:        004_Clientes.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema cli: clientes, direcciones y procedimiento de
                  registro de cliente (crea usuario + cliente).
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

/* ---------------------------------------------------------------------
   cli.Clientes
   Nombre, apellidos, correo y telefono viven en seg.Usuarios. Aqui van
   solo los datos propios del cliente.
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'cli.Clientes', N'U') IS NULL
BEGIN
    CREATE TABLE cli.Clientes
    (
        IdCliente            INT IDENTITY(1,1) NOT NULL,
        IdUsuario            INT               NOT NULL,
        FechaNacimiento      DATE              NULL,
        FechaAceptaTerminos  DATETIME2(0)      NULL,
        Activo               BIT               NOT NULL
            CONSTRAINT DF_Clientes_Activo DEFAULT 1,
        FechaCreacion        DATETIME2(0)      NOT NULL
            CONSTRAINT DF_Clientes_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor            INT               NULL,
        FechaModificacion    DATETIME2(0)      NULL,
        ModificadoPor        INT               NULL,
        CONSTRAINT PK_Clientes         PRIMARY KEY (IdCliente),
        CONSTRAINT UQ_Clientes_Usuario UNIQUE (IdUsuario),
        CONSTRAINT FK_Clientes_Usuarios
            FOREIGN KEY (IdUsuario)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Clientes_CreadoPor
            FOREIGN KEY (CreadoPor)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Clientes_ModificadoPor
            FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    PRINT 'Tabla cli.Clientes creada.';
END
GO

/* ---------------------------------------------------------------------
   cli.Direcciones
   Un cliente puede tener varias. La relacion con la zona de entrega
   (esquema env) se agregara cuando exista ese modulo.
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'cli.Direcciones', N'U') IS NULL
BEGIN
    CREATE TABLE cli.Direcciones
    (
        IdDireccion        INT IDENTITY(1,1) NOT NULL,
        IdCliente          INT               NOT NULL,
        Alias              NVARCHAR(50)      NULL,       -- ej: Casa, Trabajo
        Provincia          NVARCHAR(50)      NOT NULL,
        Canton             NVARCHAR(50)      NOT NULL,
        Distrito           NVARCHAR(50)      NOT NULL,
        DireccionExacta    NVARCHAR(300)     NOT NULL,
        Referencia         NVARCHAR(250)     NULL,
        EsPrincipal        BIT               NOT NULL
            CONSTRAINT DF_Direcciones_EsPrincipal DEFAULT 0,
        Activo             BIT               NOT NULL
            CONSTRAINT DF_Direcciones_Activo DEFAULT 1,
        FechaCreacion      DATETIME2(0)      NOT NULL
            CONSTRAINT DF_Direcciones_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor          INT               NULL,
        FechaModificacion  DATETIME2(0)      NULL,
        ModificadoPor      INT               NULL,
        CONSTRAINT PK_Direcciones PRIMARY KEY (IdDireccion),
        CONSTRAINT FK_Direcciones_Clientes
            FOREIGN KEY (IdCliente)     REFERENCES cli.Clientes (IdCliente),
        CONSTRAINT FK_Direcciones_CreadoPor
            FOREIGN KEY (CreadoPor)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Direcciones_ModificadoPor
            FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    CREATE INDEX IX_Direcciones_Cliente ON cli.Direcciones (IdCliente);
    PRINT 'Tabla cli.Direcciones creada.';
END
GO

SET QUOTED_IDENTIFIER ON;
GO

-- Cada cliente puede tener, como maximo, una direccion principal activa
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'UX_Direcciones_UnicaPrincipal'
                 AND object_id = OBJECT_ID(N'cli.Direcciones'))
    CREATE UNIQUE INDEX UX_Direcciones_UnicaPrincipal
        ON cli.Direcciones (IdCliente)
        WHERE EsPrincipal = 1 AND Activo = 1;
GO

/* ---------------------------------------------------------------------
   cli.RegistrarCliente  (HU-CLI-001)
   Recibe la clave YA convertida a hash por la aplicacion.
   Crea el usuario con el rol por defecto y el cliente, en una sola
   transaccion, y deja registro en la bitacora.

   Errores que devuelve (la aplicacion puede mostrar el mensaje):
     50010  Faltan datos obligatorios
     50011  No se aceptaron los terminos y condiciones
     50012  Fecha de nacimiento invalida
     50013  El correo ya esta asociado a una cuenta
     50014  No existe un rol por defecto configurado
   --------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE cli.RegistrarCliente
    @Correo           NVARCHAR(256),
    @ClaveHash        NVARCHAR(255),
    @Nombre           NVARCHAR(100),
    @Apellido1        NVARCHAR(100),
    @Apellido2        NVARCHAR(100) = NULL,
    @Telefono         NVARCHAR(30)  = NULL,
    @FechaNacimiento  DATE          = NULL,
    @AceptaTerminos   BIT           = 0,
    @DireccionIp      NVARCHAR(45)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @Correo    = LOWER(LTRIM(RTRIM(@Correo)));
    SET @Nombre    = LTRIM(RTRIM(@Nombre));
    SET @Apellido1 = LTRIM(RTRIM(@Apellido1));

    IF ISNULL(@Correo, N'') = N'' OR ISNULL(@ClaveHash, N'') = N''
       OR ISNULL(@Nombre, N'') = N'' OR ISNULL(@Apellido1, N'') = N''
        THROW 50010, N'Faltan datos obligatorios.', 1;

    IF ISNULL(@AceptaTerminos, 0) <> 1
        THROW 50011, N'Debe aceptar los terminos y condiciones.', 1;

    IF @FechaNacimiento IS NOT NULL
       AND @FechaNacimiento > CAST(SYSDATETIME() AS DATE)
        THROW 50012, N'La fecha de nacimiento no es valida.', 1;

    IF EXISTS (SELECT 1 FROM seg.Usuarios WHERE Correo = @Correo)
        THROW 50013, N'El correo ya esta asociado a una cuenta.', 1;

    DECLARE @IdRol INT =
        (SELECT IdRol FROM seg.Roles WHERE EsPorDefecto = 1 AND Activo = 1);

    IF @IdRol IS NULL
        THROW 50014, N'No existe un rol por defecto configurado.', 1;

    DECLARE @IdUsuario INT, @IdCliente INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO seg.Usuarios
            (Correo, ClaveHash, IdRol, Nombre, Apellido1, Apellido2, Telefono)
        VALUES
            (@Correo, @ClaveHash, @IdRol, @Nombre, @Apellido1,
             NULLIF(LTRIM(RTRIM(@Apellido2)), N''),
             NULLIF(LTRIM(RTRIM(@Telefono)), N''));

        SET @IdUsuario = SCOPE_IDENTITY();

        INSERT INTO cli.Clientes
            (IdUsuario, FechaNacimiento, FechaAceptaTerminos, CreadoPor)
        VALUES
            (@IdUsuario, @FechaNacimiento, SYSDATETIME(), @IdUsuario);

        SET @IdCliente = SCOPE_IDENTITY();

        EXEC aud.RegistrarBitacora
            @Modulo      = N'Clientes',
            @Accion      = N'REGISTRO',
            @IdUsuario   = @IdUsuario,
            @Entidad     = N'Cliente',
            @IdRegistro  = @IdCliente,
            @Descripcion = N'Registro de nuevo cliente',
            @DireccionIp = @DireccionIp;

        COMMIT TRANSACTION;

        SELECT @IdCliente AS IdCliente, @IdUsuario AS IdUsuario;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

/* ---------------------------------------------------------------------
   Registro de la migracion
   --------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'004_Clientes.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'004_Clientes.sql',
            N'Esquema cli: clientes, direcciones y procedimiento de registro');
GO

/* ---------------------------------------------------------------------
   Verificacion: 2 tablas, 1 procedimiento y 4 migraciones
   --------------------------------------------------------------------- */
SELECT s.name AS Esquema, t.name AS Tabla
FROM   sys.tables t
JOIN   sys.schemas s ON s.schema_id = t.schema_id
WHERE  s.name = N'cli'
ORDER BY t.name;

SELECT s.name AS Esquema, p.name AS Procedimiento
FROM   sys.procedures p
JOIN   sys.schemas s ON s.schema_id = p.schema_id
WHERE  s.name IN (N'cli', N'aud')
ORDER BY s.name, p.name;

SELECT IdMigracion, Script, FechaAplicacion FROM cfg.Migraciones;
GO