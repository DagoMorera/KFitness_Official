/* =====================================================================
   Script:        020_Reservas_Promocion_2x1.sql
   Descripcion:   Agrega trazabilidad para operaciones de reservas
                  promocionales 2x1 y vinculo con res.Reservas.
   ===================================================================== */

USE KFitness;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'res.OperacionesPromocionales', N'U') IS NULL
BEGIN
    CREATE TABLE res.OperacionesPromocionales
    (
        IdOperacionPromocional INT IDENTITY(1,1) NOT NULL,
        IdPromocion            INT              NOT NULL,
        IdUsuario              INT              NOT NULL,
        Estado                 NVARCHAR(20)     NOT NULL CONSTRAINT DF_OperacionPromocional_Estado DEFAULT N'ACTIVA',
        FechaCreacion          DATETIME2(0)     NOT NULL CONSTRAINT DF_OperacionPromocional_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor              INT              NULL,
        FechaModificacion      DATETIME2(0)     NULL,
        ModificadoPor          INT              NULL,
        CONSTRAINT PK_OperacionesPromocionales PRIMARY KEY (IdOperacionPromocional),
        CONSTRAINT FK_OperacionPromocional_Promocion FOREIGN KEY (IdPromocion) REFERENCES prm.Promociones (IdPromocion),
        CONSTRAINT FK_OperacionPromocional_Usuario FOREIGN KEY (IdUsuario) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_OperacionPromocional_CreadoPor FOREIGN KEY (CreadoPor) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_OperacionPromocional_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT CK_OperacionPromocional_Estado CHECK (Estado IN (N'ACTIVA', N'CANCELADA'))
    );

    CREATE INDEX IX_OperacionPromocional_UsuarioPromocionEstado
        ON res.OperacionesPromocionales (IdUsuario, IdPromocion, Estado);

    PRINT 'Tabla res.OperacionesPromocionales creada.';
END
GO

IF OBJECT_ID(N'res.OperacionesPromocionales', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'res.OperacionesPromocionales')
      AND name = N'UX_OperacionPromocional_Activa_UsuarioPromocion'
)
BEGIN
    CREATE UNIQUE INDEX UX_OperacionPromocional_Activa_UsuarioPromocion
        ON res.OperacionesPromocionales (IdUsuario, IdPromocion)
        WHERE Estado = N'ACTIVA';
END
GO

IF COL_LENGTH('res.Reservas', 'IdOperacionPromocional') IS NULL
BEGIN
    ALTER TABLE res.Reservas
    ADD IdOperacionPromocional INT NULL;

    ALTER TABLE res.Reservas
    ADD CONSTRAINT FK_Reservas_OperacionPromocional
    FOREIGN KEY (IdOperacionPromocional)
    REFERENCES res.OperacionesPromocionales (IdOperacionPromocional);

    CREATE INDEX IX_Reservas_OperacionPromocional
        ON res.Reservas (IdOperacionPromocional, Estado);

    PRINT 'Campo res.Reservas.IdOperacionPromocional agregado.';
END
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'020_Reservas_Promocion_2x1.sql')
BEGIN
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'020_Reservas_Promocion_2x1.sql', N'Trazabilidad de operaciones de reserva promocional 2x1');
END
GO
