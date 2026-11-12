/* =====================================================================
   Script:        002_Seguridad.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema seg: roles, permisos, usuarios, historial de
                  acceso, recuperacion de contrasena y doble factor.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

/* ---------------------------------------------------------------------
   seg.Roles
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'seg.Roles', N'U') IS NULL
BEGIN
    CREATE TABLE seg.Roles
    (
        IdRol              INT IDENTITY(1,1) NOT NULL,
        Nombre             NVARCHAR(50)      NOT NULL,
        Descripcion        NVARCHAR(250)     NULL,
        EsSistema          BIT               NOT NULL
            CONSTRAINT DF_Roles_EsSistema     DEFAULT 0,
        EsPorDefecto       BIT               NOT NULL
            CONSTRAINT DF_Roles_EsPorDefecto  DEFAULT 0,
        Activo             BIT               NOT NULL
            CONSTRAINT DF_Roles_Activo        DEFAULT 1,
        FechaCreacion      DATETIME2(0)      NOT NULL
            CONSTRAINT DF_Roles_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor          INT               NULL,
        FechaModificacion  DATETIME2(0)      NULL,
        ModificadoPor      INT               NULL,
        CONSTRAINT PK_Roles        PRIMARY KEY (IdRol),
        CONSTRAINT UQ_Roles_Nombre UNIQUE (Nombre)
    );
    PRINT 'Tabla seg.Roles creada.';
END
GO

-- Solo puede existir un rol marcado como "por defecto"
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'UX_Roles_UnicoPorDefecto'
                 AND object_id = OBJECT_ID(N'seg.Roles'))
    CREATE UNIQUE INDEX UX_Roles_UnicoPorDefecto
        ON seg.Roles (EsPorDefecto) WHERE EsPorDefecto = 1;
GO

/* ---------------------------------------------------------------------
   seg.Permisos  (cada modulo registrara aqui sus permisos)
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'seg.Permisos', N'U') IS NULL
BEGIN
    CREATE TABLE seg.Permisos
    (
        IdPermiso      INT IDENTITY(1,1) NOT NULL,
        Codigo         NVARCHAR(80)      NOT NULL,   -- ej: PRODUCTOS.CREAR
        Nombre         NVARCHAR(100)     NOT NULL,
        Modulo         NVARCHAR(50)      NOT NULL,
        Descripcion    NVARCHAR(250)     NULL,
        FechaCreacion  DATETIME2(0)      NOT NULL
            CONSTRAINT DF_Permisos_FechaCreacion DEFAULT SYSDATETIME(),
        CONSTRAINT PK_Permisos        PRIMARY KEY (IdPermiso),
        CONSTRAINT UQ_Permisos_Codigo UNIQUE (Codigo)
    );
    PRINT 'Tabla seg.Permisos creada.';
END
GO

/* ---------------------------------------------------------------------
   seg.RolPermisos  (que permisos tiene cada rol)
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'seg.RolPermisos', N'U') IS NULL
BEGIN
    CREATE TABLE seg.RolPermisos
    (
        IdRol            INT          NOT NULL,
        IdPermiso        INT          NOT NULL,
        FechaAsignacion  DATETIME2(0) NOT NULL
            CONSTRAINT DF_RolPermisos_Fecha DEFAULT SYSDATETIME(),
        CONSTRAINT PK_RolPermisos PRIMARY KEY (IdRol, IdPermiso),
        CONSTRAINT FK_RolPermisos_Roles
            FOREIGN KEY (IdRol)     REFERENCES seg.Roles (IdRol)         ON DELETE CASCADE,
        CONSTRAINT FK_RolPermisos_Permisos
            FOREIGN KEY (IdPermiso) REFERENCES seg.Permisos (IdPermiso)  ON DELETE CASCADE
    );
    PRINT 'Tabla seg.RolPermisos creada.';
END
GO

/* ---------------------------------------------------------------------
   seg.Usuarios
   La clave NUNCA se guarda en texto plano: la aplicacion guarda aqui
   el hash generado (por ejemplo con BCrypt o PBKDF2).
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'seg.Usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE seg.Usuarios
    (
        IdUsuario          INT IDENTITY(1,1) NOT NULL,
        Correo             NVARCHAR(256)     NOT NULL,
        ClaveHash          NVARCHAR(255)     NOT NULL,
        IdRol              INT               NOT NULL,
        Nombre             NVARCHAR(100)     NOT NULL,
        Apellido1          NVARCHAR(100)     NOT NULL,
        Apellido2          NVARCHAR(100)     NULL,
        Telefono           NVARCHAR(30)      NULL,
        Activo             BIT               NOT NULL
            CONSTRAINT DF_Usuarios_Activo DEFAULT 1,
        IntentosFallidos   INT               NOT NULL
            CONSTRAINT DF_Usuarios_Intentos DEFAULT 0,
        BloqueadoHasta     DATETIME2(0)      NULL,
        UltimoAcceso       DATETIME2(0)      NULL,
        DobleFactorActivo  BIT               NOT NULL
            CONSTRAINT DF_Usuarios_DobleFactor DEFAULT 0,
        FechaCreacion      DATETIME2(0)      NOT NULL
            CONSTRAINT DF_Usuarios_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor          INT               NULL,
        FechaModificacion  DATETIME2(0)      NULL,
        ModificadoPor      INT               NULL,
        CONSTRAINT PK_Usuarios        PRIMARY KEY (IdUsuario),
        CONSTRAINT UQ_Usuarios_Correo UNIQUE (Correo),
        CONSTRAINT FK_Usuarios_Roles  FOREIGN KEY (IdRol) REFERENCES seg.Roles (IdRol),
        CONSTRAINT CK_Usuarios_Intentos CHECK (IntentosFallidos >= 0)
    );
    PRINT 'Tabla seg.Usuarios creada.';
END
GO

-- Quien creo / modifico cada registro (se agregan aqui porque Usuarios ya existe)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Roles_CreadoPor')
    ALTER TABLE seg.Roles ADD CONSTRAINT FK_Roles_CreadoPor
        FOREIGN KEY (CreadoPor) REFERENCES seg.Usuarios (IdUsuario);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Roles_ModificadoPor')
    ALTER TABLE seg.Roles ADD CONSTRAINT FK_Roles_ModificadoPor
        FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Usuarios_CreadoPor')
    ALTER TABLE seg.Usuarios ADD CONSTRAINT FK_Usuarios_CreadoPor
        FOREIGN KEY (CreadoPor) REFERENCES seg.Usuarios (IdUsuario);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Usuarios_ModificadoPor')
    ALTER TABLE seg.Usuarios ADD CONSTRAINT FK_Usuarios_ModificadoPor
        FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario);
GO

/* ---------------------------------------------------------------------
   seg.HistorialAcceso  (cada intento de login, exitoso o no)
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'seg.HistorialAcceso', N'U') IS NULL
BEGIN
    CREATE TABLE seg.HistorialAcceso
    (
        IdHistorial  BIGINT IDENTITY(1,1) NOT NULL,
        IdUsuario    INT                  NULL,      -- NULL si el correo no existe
        Correo       NVARCHAR(256)        NOT NULL,
        Exitoso      BIT                  NOT NULL,
        Motivo       NVARCHAR(100)        NULL,      -- ej: Clave incorrecta, Cuenta bloqueada
        DireccionIp  NVARCHAR(45)         NULL,
        Fecha        DATETIME2(0)         NOT NULL
            CONSTRAINT DF_HistorialAcceso_Fecha DEFAULT SYSDATETIME(),
        CONSTRAINT PK_HistorialAcceso PRIMARY KEY (IdHistorial),
        CONSTRAINT FK_HistorialAcceso_Usuarios
            FOREIGN KEY (IdUsuario) REFERENCES seg.Usuarios (IdUsuario)
    );
    CREATE INDEX IX_HistorialAcceso_Correo_Fecha
        ON seg.HistorialAcceso (Correo, Fecha);
    PRINT 'Tabla seg.HistorialAcceso creada.';
END
GO

/* ---------------------------------------------------------------------
   seg.TokensRecuperacion  (enlaces de recuperacion de contrasena)
   Se guarda el HASH del token, no el token original.
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'seg.TokensRecuperacion', N'U') IS NULL
BEGIN
    CREATE TABLE seg.TokensRecuperacion
    (
        IdToken        INT IDENTITY(1,1) NOT NULL,
        IdUsuario      INT               NOT NULL,
        TokenHash      NVARCHAR(128)     NOT NULL,
        FechaCreacion  DATETIME2(0)      NOT NULL
            CONSTRAINT DF_TokensRecup_Fecha DEFAULT SYSDATETIME(),
        FechaExpira    DATETIME2(0)      NOT NULL,
        FechaUso       DATETIME2(0)      NULL,       -- NULL = aun no usado
        CONSTRAINT PK_TokensRecuperacion PRIMARY KEY (IdToken),
        CONSTRAINT UQ_TokensRecuperacion_Hash UNIQUE (TokenHash),
        CONSTRAINT FK_TokensRecuperacion_Usuarios
            FOREIGN KEY (IdUsuario) REFERENCES seg.Usuarios (IdUsuario)
    );
    CREATE INDEX IX_TokensRecuperacion_Usuario
        ON seg.TokensRecuperacion (IdUsuario);
    PRINT 'Tabla seg.TokensRecuperacion creada.';
END
GO

/* ---------------------------------------------------------------------
   seg.CodigosDobleFactor  (codigos de verificacion temporales)
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'seg.CodigosDobleFactor', N'U') IS NULL
BEGIN
    CREATE TABLE seg.CodigosDobleFactor
    (
        IdCodigo       INT IDENTITY(1,1) NOT NULL,
        IdUsuario      INT               NOT NULL,
        CodigoHash     NVARCHAR(128)     NOT NULL,
        FechaCreacion  DATETIME2(0)      NOT NULL
            CONSTRAINT DF_CodigosDF_Fecha DEFAULT SYSDATETIME(),
        FechaExpira    DATETIME2(0)      NOT NULL,
        FechaUso       DATETIME2(0)      NULL,
        Intentos       INT               NOT NULL
            CONSTRAINT DF_CodigosDF_Intentos DEFAULT 0,
        CONSTRAINT PK_CodigosDobleFactor PRIMARY KEY (IdCodigo),
        CONSTRAINT FK_CodigosDobleFactor_Usuarios
            FOREIGN KEY (IdUsuario) REFERENCES seg.Usuarios (IdUsuario)
    );
    CREATE INDEX IX_CodigosDobleFactor_Usuario
        ON seg.CodigosDobleFactor (IdUsuario);
    PRINT 'Tabla seg.CodigosDobleFactor creada.';
END
GO

/* ---------------------------------------------------------------------
   Datos iniciales: roles base (se pueden renombrar o ampliar luego)
   --------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM seg.Roles WHERE Nombre = N'Administrador')
    INSERT INTO seg.Roles (Nombre, Descripcion, EsSistema, EsPorDefecto)
    VALUES (N'Administrador', N'Acceso total al sistema', 1, 0);

IF NOT EXISTS (SELECT 1 FROM seg.Roles WHERE Nombre = N'Operador')
    INSERT INTO seg.Roles (Nombre, Descripcion, EsSistema, EsPorDefecto)
    VALUES (N'Operador', N'Personal interno (empleado / staff) con permisos limitados', 1, 0);

IF NOT EXISTS (SELECT 1 FROM seg.Roles WHERE Nombre = N'Cliente')
    INSERT INTO seg.Roles (Nombre, Descripcion, EsSistema, EsPorDefecto)
    VALUES (N'Cliente', N'Usuario externo que usa el sitio publico', 1, 1);
GO

/* ---------------------------------------------------------------------
   Registro de la migracion
   --------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'002_Seguridad.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'002_Seguridad.sql',
            N'Esquema seg: roles, permisos, usuarios, historial, recuperacion y doble factor');
GO

/* ---------------------------------------------------------------------
   Verificacion: 7 tablas en seg, 3 roles y 2 migraciones
   --------------------------------------------------------------------- */
SELECT s.name AS Esquema, t.name AS Tabla
FROM   sys.tables t
JOIN   sys.schemas s ON s.schema_id = t.schema_id
WHERE  s.name = N'seg'
ORDER BY t.name;

SELECT IdRol, Nombre, EsSistema, EsPorDefecto, Activo FROM seg.Roles;

SELECT IdMigracion, Script, FechaAplicacion FROM cfg.Migraciones;
GO