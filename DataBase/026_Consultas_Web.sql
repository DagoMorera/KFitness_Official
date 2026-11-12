SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF SCHEMA_ID(N'con') IS NULL EXEC(N'CREATE SCHEMA con AUTHORIZATION dbo');
IF OBJECT_ID(N'con.Consultas',N'U') IS NULL
BEGIN
 CREATE TABLE con.Consultas (
 IdConsulta BIGINT IDENTITY PRIMARY KEY,
 Nombre NVARCHAR(150) NOT NULL, Correo NVARCHAR(256) NOT NULL,
 Telefono NVARCHAR(30) NOT NULL, Asunto NVARCHAR(200) NOT NULL,
 Mensaje NVARCHAR(4000) NOT NULL,
 Estado NVARCHAR(15) NOT NULL DEFAULT N'Pendiente' CHECK(Estado IN(N'Pendiente',N'Respondida')),
 Respuesta NVARCHAR(4000) NULL, FechaCreacion DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 FechaRespuesta DATETIME2(0) NULL, IdUsuarioRespuesta INT NULL REFERENCES seg.Usuarios(IdUsuario),
 ClaveSolicitud UNIQUEIDENTIFIER NOT NULL UNIQUE,
 CorreoEnviado BIT NOT NULL DEFAULT 0
 );
 CREATE INDEX IX_Consultas_EstadoFecha ON con.Consultas(Estado,FechaCreacion DESC);
END;
IF NOT EXISTS(SELECT 1 FROM cfg.Migraciones WHERE Script=N'026_Consultas_Web.sql')
 INSERT cfg.Migraciones(Script,Descripcion) VALUES(N'026_Consultas_Web.sql',N'Bandeja de consultas públicas y resolución administrativa.');
COMMIT;
