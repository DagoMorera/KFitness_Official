/* =====================================================================
   Script:        005_Catalogo.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema cat: categorias, productos e imagenes.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

IF OBJECT_ID(N'cat.Categorias', N'U') IS NULL
BEGIN
    CREATE TABLE cat.Categorias
    (
        IdCategoria        INT IDENTITY(1,1) NOT NULL,
        Nombre             NVARCHAR(100)     NOT NULL,
        Descripcion        NVARCHAR(500)     NULL,
        Activo             BIT               NOT NULL CONSTRAINT DF_Categorias_Activo DEFAULT 1,
        FechaCreacion      DATETIME2(0)      NOT NULL CONSTRAINT DF_Categorias_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor          INT               NULL,
        FechaModificacion  DATETIME2(0)      NULL,
        ModificadoPor      INT               NULL,
        CONSTRAINT PK_Categorias PRIMARY KEY (IdCategoria),
        CONSTRAINT UQ_Categorias_Nombre UNIQUE (Nombre),
        CONSTRAINT CK_Categorias_Nombre CHECK (LEN(LTRIM(RTRIM(Nombre))) > 0),
        CONSTRAINT FK_Categorias_CreadoPor     FOREIGN KEY (CreadoPor)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Categorias_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    PRINT 'Tabla cat.Categorias creada.';
END
GO

/* Un combo es un producto con EsCombo = 1 (sus componentes se definen en prm) */
IF OBJECT_ID(N'cat.Productos', N'U') IS NULL
BEGIN
    CREATE TABLE cat.Productos
    (
        IdProducto         INT IDENTITY(1,1) NOT NULL,
        IdCategoria        INT               NOT NULL,
        Nombre             NVARCHAR(150)     NOT NULL,
        Descripcion        NVARCHAR(1000)    NULL,
        Precio             DECIMAL(12,2)     NOT NULL,
        EsCombo            BIT               NOT NULL CONSTRAINT DF_Productos_EsCombo DEFAULT 0,
        Activo             BIT               NOT NULL CONSTRAINT DF_Productos_Activo DEFAULT 1,
        OrdenCatalogo      INT               NOT NULL CONSTRAINT DF_Productos_Orden DEFAULT 0,
        FechaCreacion      DATETIME2(0)      NOT NULL CONSTRAINT DF_Productos_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor          INT               NULL,
        FechaModificacion  DATETIME2(0)      NULL,
        ModificadoPor      INT               NULL,
        CONSTRAINT PK_Productos PRIMARY KEY (IdProducto),
        CONSTRAINT FK_Productos_Categorias FOREIGN KEY (IdCategoria) REFERENCES cat.Categorias (IdCategoria),
        CONSTRAINT CK_Productos_Nombre CHECK (LEN(LTRIM(RTRIM(Nombre))) > 0),
        CONSTRAINT CK_Productos_Precio CHECK (Precio >= 0),
        CONSTRAINT FK_Productos_CreadoPor     FOREIGN KEY (CreadoPor)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Productos_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    CREATE INDEX IX_Productos_Categoria ON cat.Productos (IdCategoria);
    CREATE INDEX IX_Productos_Catalogo  ON cat.Productos (Activo, OrdenCatalogo) INCLUDE (Nombre, Precio);
    CREATE INDEX IX_Productos_Nombre    ON cat.Productos (Nombre);
    PRINT 'Tabla cat.Productos creada.';
END
GO

/* Se guarda la ruta del archivo, no la imagen dentro de la base de datos */
IF OBJECT_ID(N'cat.ImagenesProducto', N'U') IS NULL
BEGIN
    CREATE TABLE cat.ImagenesProducto
    (
        IdImagen           INT IDENTITY(1,1) NOT NULL,
        IdProducto         INT               NOT NULL,
        Ruta               NVARCHAR(400)     NOT NULL,
        NombreArchivo      NVARCHAR(200)     NULL,
        TipoContenido      NVARCHAR(50)      NULL,
        TamanoBytes        INT               NULL,
        EsPrincipal        BIT               NOT NULL CONSTRAINT DF_Imagenes_EsPrincipal DEFAULT 0,
        Orden              INT               NOT NULL CONSTRAINT DF_Imagenes_Orden DEFAULT 0,
        Activo             BIT               NOT NULL CONSTRAINT DF_Imagenes_Activo DEFAULT 1,
        FechaCreacion      DATETIME2(0)      NOT NULL CONSTRAINT DF_Imagenes_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor          INT               NULL,
        FechaModificacion  DATETIME2(0)      NULL,
        ModificadoPor      INT               NULL,
        CONSTRAINT PK_ImagenesProducto PRIMARY KEY (IdImagen),
        CONSTRAINT FK_ImagenesProducto_Productos FOREIGN KEY (IdProducto) REFERENCES cat.Productos (IdProducto),
        CONSTRAINT CK_ImagenesProducto_Tamano CHECK (TamanoBytes IS NULL OR TamanoBytes > 0),
        CONSTRAINT FK_ImagenesProducto_CreadoPor     FOREIGN KEY (CreadoPor)     REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_ImagenesProducto_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario)
    );
    CREATE INDEX IX_ImagenesProducto_Producto ON cat.ImagenesProducto (IdProducto, Orden);
    PRINT 'Tabla cat.ImagenesProducto creada.';
END
GO

SET QUOTED_IDENTIFIER ON;
GO

-- Maximo una imagen principal activa por producto
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'UX_ImagenesProducto_UnicaPrincipal'
                 AND object_id = OBJECT_ID(N'cat.ImagenesProducto'))
    CREATE UNIQUE INDEX UX_ImagenesProducto_UnicaPrincipal
        ON cat.ImagenesProducto (IdProducto) WHERE EsPrincipal = 1 AND Activo = 1;
GO

INSERT INTO cfg.Parametros (Clave, Valor, TipoDato, Modulo, Descripcion)
SELECT v.Clave, v.Valor, v.TipoDato, v.Modulo, v.Descripcion
FROM (VALUES
    (N'IMG.FORMATOS_PERMITIDOS', N'jpg,jpeg,png,webp', N'TEXTO',  N'Imagenes', N'Extensiones de imagen permitidas'),
    (N'IMG.TAMANO_MAX_MB',       N'5',                 N'ENTERO', N'Imagenes', N'Tamano maximo por imagen en MB')
) AS v (Clave, Valor, TipoDato, Modulo, Descripcion)
WHERE NOT EXISTS (SELECT 1 FROM cfg.Parametros p WHERE p.Clave = v.Clave);
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'005_Catalogo.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'005_Catalogo.sql', N'Esquema cat: categorias, productos e imagenes');
GO

-- Verificacion: 3 tablas en cat
SELECT s.name AS Esquema, t.name AS Tabla
FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'cat' ORDER BY t.name;
SELECT IdMigracion, Script FROM cfg.Migraciones ORDER BY IdMigracion;
GO