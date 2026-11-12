/* =====================================================================
   Script:        017_Horarios_Servicios.sql
   Descripcion:   Relacion de horarios habilitados por servicio (US29).
   ===================================================================== */

USE KFitness;
GO

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'cfg.HorariosServicio', N'U') IS NULL
BEGIN
    CREATE TABLE cfg.HorariosServicio
    (
        IdHorarioServicio   INT IDENTITY(1,1) NOT NULL,
        IdHorario           INT               NOT NULL,
        IdProducto          INT               NOT NULL,
        Fecha               DATE              NOT NULL,
        HoraInicio          TIME(0)           NOT NULL,
        HoraFin             TIME(0)           NOT NULL,
        CapacidadMaxima     INT               NOT NULL,
        Instructor          NVARCHAR(160)     NULL,
        Activo              BIT               NOT NULL CONSTRAINT DF_HorariosServicio_Activo DEFAULT 1,
        FechaCreacion       DATETIME2(0)      NOT NULL CONSTRAINT DF_HorariosServicio_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor           INT               NULL,
        FechaModificacion   DATETIME2(0)      NULL,
        ModificadoPor       INT               NULL,
        CONSTRAINT PK_HorariosServicio PRIMARY KEY (IdHorarioServicio),
        CONSTRAINT FK_HorariosServicio_Horario FOREIGN KEY (IdHorario) REFERENCES cfg.HorariosAtencion (IdHorario),
        CONSTRAINT FK_HorariosServicio_Producto FOREIGN KEY (IdProducto) REFERENCES cat.Productos (IdProducto),
        CONSTRAINT FK_HorariosServicio_CreadoPor FOREIGN KEY (CreadoPor) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_HorariosServicio_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT CK_HorariosServicio_Fecha CHECK (Fecha >= '2000-01-01'),
        CONSTRAINT CK_HorariosServicio_Horas CHECK (HoraFin > HoraInicio),
        CONSTRAINT CK_HorariosServicio_Capacidad CHECK (CapacidadMaxima > 0)
    );

    CREATE INDEX IX_HorariosServicio_Consulta
        ON cfg.HorariosServicio (Activo, Fecha, IdProducto, HoraInicio, HoraFin);

    CREATE UNIQUE INDEX UX_HorariosServicio_Unico
        ON cfg.HorariosServicio (IdProducto, Fecha, HoraInicio, HoraFin)
        WHERE Activo = 1;

    PRINT 'Tabla cfg.HorariosServicio creada.';
END
GO

IF COL_LENGTH('cfg.HorariosServicio', 'HoraInicio') IS NULL
BEGIN
    ALTER TABLE cfg.HorariosServicio ADD HoraInicio TIME(0) NULL;
    UPDATE cfg.HorariosServicio
    SET HoraInicio = h.HoraApertura
    FROM cfg.HorariosServicio hs
    INNER JOIN cfg.HorariosAtencion h ON h.IdHorario = hs.IdHorario
    WHERE hs.HoraInicio IS NULL;
    ALTER TABLE cfg.HorariosServicio ALTER COLUMN HoraInicio TIME(0) NOT NULL;
END
GO

IF COL_LENGTH('cfg.HorariosServicio', 'HoraFin') IS NULL
BEGIN
    ALTER TABLE cfg.HorariosServicio ADD HoraFin TIME(0) NULL;
    UPDATE cfg.HorariosServicio
    SET HoraFin = h.HoraCierre
    FROM cfg.HorariosServicio hs
    INNER JOIN cfg.HorariosAtencion h ON h.IdHorario = hs.IdHorario
    WHERE hs.HoraFin IS NULL;
    ALTER TABLE cfg.HorariosServicio ALTER COLUMN HoraFin TIME(0) NOT NULL;
END
GO

IF COL_LENGTH('cfg.HorariosServicio', 'CapacidadMaxima') IS NULL
BEGIN
    ALTER TABLE cfg.HorariosServicio ADD CapacidadMaxima INT NULL;
    UPDATE cfg.HorariosServicio SET CapacidadMaxima = 1 WHERE CapacidadMaxima IS NULL;
    ALTER TABLE cfg.HorariosServicio ALTER COLUMN CapacidadMaxima INT NOT NULL;
END
GO

IF COL_LENGTH('cfg.HorariosServicio', 'Instructor') IS NULL
BEGIN
    ALTER TABLE cfg.HorariosServicio ADD Instructor NVARCHAR(160) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_HorariosServicio_Horas'
      AND parent_object_id = OBJECT_ID(N'cfg.HorariosServicio')
)
BEGIN
    ALTER TABLE cfg.HorariosServicio
    ADD CONSTRAINT CK_HorariosServicio_Horas CHECK (HoraFin > HoraInicio);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_HorariosServicio_Capacidad'
      AND parent_object_id = OBJECT_ID(N'cfg.HorariosServicio')
)
BEGIN
    ALTER TABLE cfg.HorariosServicio
    ADD CONSTRAINT CK_HorariosServicio_Capacidad CHECK (CapacidadMaxima > 0);
END
GO

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UX_HorariosServicio_Unico'
      AND object_id = OBJECT_ID(N'cfg.HorariosServicio')
)
BEGIN
    DROP INDEX UX_HorariosServicio_Unico ON cfg.HorariosServicio;
END
GO

CREATE UNIQUE INDEX UX_HorariosServicio_Unico
    ON cfg.HorariosServicio (IdProducto, Fecha, HoraInicio, HoraFin)
    WHERE Activo = 1;
GO

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_HorariosServicio_Consulta'
      AND object_id = OBJECT_ID(N'cfg.HorariosServicio')
)
BEGIN
    DROP INDEX IX_HorariosServicio_Consulta ON cfg.HorariosServicio;
END
GO

CREATE INDEX IX_HorariosServicio_Consulta
    ON cfg.HorariosServicio (Activo, Fecha, IdProducto, HoraInicio, HoraFin);
GO

IF SCHEMA_ID(N'res') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA res AUTHORIZATION dbo;');
END
GO

IF OBJECT_ID(N'res.Reservas', N'U') IS NULL
BEGIN
    CREATE TABLE res.Reservas
    (
        IdReserva           INT IDENTITY(1,1) NOT NULL,
        IdHorarioServicio   INT               NOT NULL,
        IdUsuario           INT               NOT NULL,
        Estado              NVARCHAR(20)      NOT NULL CONSTRAINT DF_Reservas_Estado DEFAULT N'PENDIENTE',
        Observaciones       NVARCHAR(500)     NULL,
        FechaCreacion       DATETIME2(0)      NOT NULL CONSTRAINT DF_Reservas_FechaCreacion DEFAULT SYSDATETIME(),
        CreadoPor           INT               NULL,
        FechaModificacion   DATETIME2(0)      NULL,
        ModificadoPor       INT               NULL,
        CONSTRAINT PK_Reservas PRIMARY KEY (IdReserva),
        CONSTRAINT FK_Reservas_HorarioServicio FOREIGN KEY (IdHorarioServicio) REFERENCES cfg.HorariosServicio (IdHorarioServicio),
        CONSTRAINT FK_Reservas_Usuario FOREIGN KEY (IdUsuario) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Reservas_CreadoPor FOREIGN KEY (CreadoPor) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT FK_Reservas_ModificadoPor FOREIGN KEY (ModificadoPor) REFERENCES seg.Usuarios (IdUsuario),
        CONSTRAINT CK_Reservas_Estado CHECK (Estado IN (N'PENDIENTE', N'CONFIRMADA', N'CANCELADA'))
    );

    CREATE INDEX IX_Reservas_HorarioEstado ON res.Reservas (IdHorarioServicio, Estado);
    CREATE INDEX IX_Reservas_UsuarioFecha ON res.Reservas (IdUsuario, FechaCreacion);

    CREATE UNIQUE INDEX UX_Reservas_UsuarioSesion_Activa
        ON res.Reservas (IdHorarioServicio, IdUsuario)
        WHERE Estado IN (N'PENDIENTE', N'CONFIRMADA');

    PRINT 'Tabla res.Reservas creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'017_Horarios_Servicios.sql' AND Descripcion LIKE N'%capacidad%')
BEGIN
    UPDATE cfg.Migraciones
    SET Descripcion = N'Relacion de horarios por servicio, capacidad y reservas base para consulta/admin'
    WHERE Script = N'017_Horarios_Servicios.sql';
END
GO

IF EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'017_Horarios_Servicios.sql')
BEGIN
    UPDATE cfg.Migraciones
    SET FechaAplicacion = SYSDATETIME()
    WHERE Script = N'017_Horarios_Servicios.sql';
END
GO

IF OBJECT_ID(N'cfg.vw_HorariosConCupos', N'V') IS NOT NULL
    DROP VIEW cfg.vw_HorariosConCupos;
GO

CREATE VIEW cfg.vw_HorariosConCupos
AS
SELECT
    hs.IdHorarioServicio,
    hs.IdProducto,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.CapacidadMaxima,
    hs.Instructor,
    hs.Activo,
    COUNT(CASE WHEN r.Estado = N'CONFIRMADA' THEN 1 END) AS ReservasConfirmadas,
    hs.CapacidadMaxima - COUNT(CASE WHEN r.Estado = N'CONFIRMADA' THEN 1 END) AS CuposRestantes
FROM cfg.HorariosServicio hs
LEFT JOIN res.Reservas r ON r.IdHorarioServicio = hs.IdHorarioServicio
GROUP BY
    hs.IdHorarioServicio,
    hs.IdProducto,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.CapacidadMaxima,
    hs.Instructor,
    hs.Activo;
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'017_Horarios_Servicios.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'017_Horarios_Servicios.sql', N'Relacion de horarios por servicio, capacidad y reservas base para consulta/admin');
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'017_Horarios_Servicios.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'017_Horarios_Servicios.sql', N'Relacion de horarios habilitados por servicio para consulta publica');
GO
