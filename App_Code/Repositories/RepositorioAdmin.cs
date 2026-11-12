using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class AdminDashboardData
{
    public int? ClientesRegistrados { get; set; }
    public int? ReservasPendientes { get; set; }
    public int? ConsultasPendientes { get; set; }
    public int? RutinasActivas { get; set; }

    public bool TieneClientes { get; set; }
    public bool TieneReservas { get; set; }
    public bool TieneConsultas { get; set; }
    public bool TieneRutinas { get; set; }
}

public class AdminDashboardSerieItem
{
    public string Etiqueta { get; set; }
    public int Valor { get; set; }
    public int Capacidad { get; set; }
    public decimal? Porcentaje { get; set; }
}

public class AdminDashboardEstadisticas
{
    public int TotalServiciosActivos { get; set; }
    public int TotalUsuariosRegistrados { get; set; }
    public int ReservasPeriodo { get; set; }
    public int ConfirmadasPeriodo { get; set; }
    public int CapacidadPeriodo { get; set; }
    public decimal OcupacionPorcentaje { get; set; }

    public bool TieneCatalogo { get; set; }
    public bool TieneSeguridad { get; set; }
    public bool TieneReservasHorarios { get; set; }

    public List<AdminDashboardSerieItem> ReservasPorMes { get; set; }
    public List<AdminDashboardSerieItem> ServiciosPorCategoria { get; set; }
    public List<AdminDashboardSerieItem> ReservasPorEstado { get; set; }
    public List<AdminDashboardSerieItem> OcupacionPorDia { get; set; }
    public List<AdminDashboardSerieItem> UsuariosPorRol { get; set; }
}

public class AdminResumenUsuarios
{
    public int UsuariosTotales { get; set; }
    public int UsuariosActivos { get; set; }
    public int Administradores { get; set; }
    public int Clientes { get; set; }
    public int Operadores { get; set; }
}

public class AdminUsuarioListadoItem
{
    public int IdUsuario { get; set; }
    public string NombreCompleto { get; set; }
    public string Correo { get; set; }
    public string Rol { get; set; }
    public bool Activo { get; set; }
    public string FotoPerfil { get; set; }
}

public class AdminUsuarioDetalle
{
    public int IdUsuario { get; set; }
    public string Nombre { get; set; }
    public string Apellido1 { get; set; }
    public string Apellido2 { get; set; }
    public string NombreCompleto { get; set; }
    public string Correo { get; set; }
    public string Rol { get; set; }
    public int IdRol { get; set; }
    public bool Activo { get; set; }
    public string Telefono { get; set; }
    public string FotoPerfil { get; set; }
}

public class AdminRolItem
{
    public int IdRol { get; set; }
    public string Nombre { get; set; }
}

public class AdminUsuariosPaginados
{
    public int Pagina { get; set; }
    public int TamanoPagina { get; set; }
    public int TotalRegistros { get; set; }
    public List<AdminUsuarioListadoItem> Usuarios { get; set; }
}

public class AdminAuditoriaItem
{
    public long IdBitacora { get; set; }
    public DateTime Fecha { get; set; }
    public int? IdUsuario { get; set; }
    public string Usuario { get; set; }
    public string Correo { get; set; }
    public string Accion { get; set; }
    public string Modulo { get; set; }
    public string Entidad { get; set; }
    public string IdRegistro { get; set; }
    public string Descripcion { get; set; }
    public bool EsEventoSeguridad { get; set; }
    public string Resultado { get; set; }
}

public class AdminAuditoriaPaginada
{
    public int Pagina { get; set; }
    public int TamanoPagina { get; set; }
    public int TotalRegistros { get; set; }
    public bool BitacoraDisponible { get; set; }
    public List<AdminAuditoriaItem> Eventos { get; set; }
}

public static class RepositorioAdmin
{
    public static AdminDashboardData ObtenerDashboard()
    {
        AdminDashboardData data = new AdminDashboardData();

        data.TieneClientes = ExisteTabla("cli", "Clientes");
        data.TieneReservas = ExisteTabla("res", "Reservas");
        data.TieneConsultas = ExisteTabla("con", "Consultas");
        data.TieneRutinas = ExisteTabla("rut", "Rutinas");

        data.ClientesRegistrados = data.TieneClientes ? ContarClientesRegistrados() : (int?)null;
        data.ReservasPendientes = data.TieneReservas ? ContarReservasPendientes() : (int?)null;
        data.ConsultasPendientes = data.TieneConsultas ? ContarConsultasPendientes() : (int?)null;
        data.RutinasActivas = data.TieneRutinas ? ContarRutinasActivas() : (int?)null;

        return data;
    }

    public static AdminDashboardEstadisticas ObtenerDashboardEstadisticas(DateTime desde, DateTime hasta)
    {
        if (hasta < desde)
        {
            DateTime tmp = desde;
            desde = hasta;
            hasta = tmp;
        }

        AdminDashboardEstadisticas data = new AdminDashboardEstadisticas();
        data.ReservasPorMes = new List<AdminDashboardSerieItem>();
        data.ServiciosPorCategoria = new List<AdminDashboardSerieItem>();
        data.ReservasPorEstado = new List<AdminDashboardSerieItem>();
        data.OcupacionPorDia = new List<AdminDashboardSerieItem>();
        data.UsuariosPorRol = new List<AdminDashboardSerieItem>();

        data.TieneCatalogo = ExisteTabla("cat", "Productos") && ExisteTabla("cat", "Categorias");
        data.TieneSeguridad = ExisteTabla("seg", "Usuarios") && ExisteTabla("seg", "Roles");
        data.TieneReservasHorarios = ExisteTabla("res", "Reservas") && ExisteTabla("cfg", "HorariosServicio");

        if (data.TieneCatalogo)
        {
            const string sqlTotalServiciosActivos = @"
SELECT COUNT(1)
FROM cat.Productos p
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE p.EsCombo = 0
  AND p.Activo = 1
  AND c.Activo = 1;";

            using (SqlConnection conn = DbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(sqlTotalServiciosActivos, conn))
            {
                conn.Open();
                data.TotalServiciosActivos = Convert.ToInt32(cmd.ExecuteScalar());
            }

            if (data.TieneReservasHorarios)
            {
                const string sqlServiciosMasReservados = @"
SELECT
    p.Nombre AS Servicio,
    COUNT(1) AS TotalReservas
FROM res.Reservas r
INNER JOIN cfg.HorariosServicio hs ON hs.IdHorarioServicio = r.IdHorarioServicio
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
WHERE hs.Fecha >= @desde AND hs.Fecha <= @hasta
GROUP BY p.Nombre
ORDER BY TotalReservas DESC, p.Nombre;";

                using (SqlConnection conn = DbHelper.GetConnection())
                using (SqlCommand cmd = new SqlCommand(sqlServiciosMasReservados, conn))
                {
                    cmd.Parameters.Add("@desde", SqlDbType.Date).Value = desde.Date;
                    cmd.Parameters.Add("@hasta", SqlDbType.Date).Value = hasta.Date;
                    conn.Open();
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            data.ServiciosPorCategoria.Add(new AdminDashboardSerieItem
                            {
                                Etiqueta = reader.IsDBNull(0) ? string.Empty : reader.GetString(0),
                                Valor = reader.IsDBNull(1) ? 0 : Convert.ToInt32(reader.GetValue(1))
                            });
                        }
                    }
                }
            }
        }

        if (data.TieneSeguridad)
        {
            const string sqlUsuariosTotal = "SELECT COUNT(1) FROM seg.Usuarios;";
            using (SqlConnection conn = DbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(sqlUsuariosTotal, conn))
            {
                conn.Open();
                data.TotalUsuariosRegistrados = Convert.ToInt32(cmd.ExecuteScalar());
            }

            const string sqlUsuariosRol = @"
SELECT r.Nombre, COUNT(1) AS Cantidad
FROM seg.Usuarios u
INNER JOIN seg.Roles r ON r.IdRol = u.IdRol
GROUP BY r.Nombre
ORDER BY Cantidad DESC, r.Nombre;";

            using (SqlConnection conn = DbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(sqlUsuariosRol, conn))
            {
                conn.Open();
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        data.UsuariosPorRol.Add(new AdminDashboardSerieItem
                        {
                            Etiqueta = reader.IsDBNull(0) ? string.Empty : reader.GetString(0),
                            Valor = reader.IsDBNull(1) ? 0 : Convert.ToInt32(reader.GetValue(1))
                        });
                    }
                }
            }
        }

        if (data.TieneReservasHorarios)
        {
            const string sqlReservasPeriodo = @"
SELECT COUNT(1)
FROM res.Reservas r
INNER JOIN cfg.HorariosServicio hs ON hs.IdHorarioServicio = r.IdHorarioServicio
WHERE hs.Fecha >= @desde AND hs.Fecha <= @hasta;";

            using (SqlConnection conn = DbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(sqlReservasPeriodo, conn))
            {
                cmd.Parameters.Add("@desde", SqlDbType.Date).Value = desde.Date;
                cmd.Parameters.Add("@hasta", SqlDbType.Date).Value = hasta.Date;
                conn.Open();
                data.ReservasPeriodo = Convert.ToInt32(cmd.ExecuteScalar());
            }

            const string sqlReservasMes = @"
SELECT
    CAST(YEAR(hs.Fecha) AS NVARCHAR(4)) + N'-' + RIGHT(N'0' + CAST(MONTH(hs.Fecha) AS NVARCHAR(2)), 2) AS Etiqueta,
    COUNT(1) AS Cantidad
FROM res.Reservas r
INNER JOIN cfg.HorariosServicio hs ON hs.IdHorarioServicio = r.IdHorarioServicio
WHERE hs.Fecha >= @desde AND hs.Fecha <= @hasta
GROUP BY YEAR(hs.Fecha), MONTH(hs.Fecha)
ORDER BY YEAR(hs.Fecha), MONTH(hs.Fecha);";

            using (SqlConnection conn = DbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(sqlReservasMes, conn))
            {
                cmd.Parameters.Add("@desde", SqlDbType.Date).Value = desde.Date;
                cmd.Parameters.Add("@hasta", SqlDbType.Date).Value = hasta.Date;
                conn.Open();
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        data.ReservasPorMes.Add(new AdminDashboardSerieItem
                        {
                            Etiqueta = reader.IsDBNull(0) ? string.Empty : reader.GetString(0),
                            Valor = reader.IsDBNull(1) ? 0 : Convert.ToInt32(reader.GetValue(1))
                        });
                    }
                }
            }

            const string sqlReservasEstado = @"
SELECT
    UPPER(LTRIM(RTRIM(ISNULL(r.Estado, N'SIN_ESTADO')))) AS Estado,
    COUNT(1) AS Cantidad
FROM res.Reservas r
INNER JOIN cfg.HorariosServicio hs ON hs.IdHorarioServicio = r.IdHorarioServicio
WHERE hs.Fecha >= @desde AND hs.Fecha <= @hasta
GROUP BY UPPER(LTRIM(RTRIM(ISNULL(r.Estado, N'SIN_ESTADO'))))
ORDER BY Cantidad DESC, Estado;";

            using (SqlConnection conn = DbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(sqlReservasEstado, conn))
            {
                cmd.Parameters.Add("@desde", SqlDbType.Date).Value = desde.Date;
                cmd.Parameters.Add("@hasta", SqlDbType.Date).Value = hasta.Date;
                conn.Open();
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        data.ReservasPorEstado.Add(new AdminDashboardSerieItem
                        {
                            Etiqueta = reader.IsDBNull(0) ? string.Empty : reader.GetString(0),
                            Valor = reader.IsDBNull(1) ? 0 : Convert.ToInt32(reader.GetValue(1))
                        });
                    }
                }
            }

            const string sqlOcupacionResumen = @"
;WITH confirmadas AS
(
    SELECT r.IdHorarioServicio, COUNT(1) AS TotalConfirmadas
    FROM res.Reservas r
    WHERE UPPER(LTRIM(RTRIM(ISNULL(r.Estado, N'')))) = N'CONFIRMADA'
    GROUP BY r.IdHorarioServicio
)
SELECT
    ISNULL(SUM(CAST(ISNULL(c.TotalConfirmadas, 0) AS DECIMAL(18,2))), 0) AS Confirmadas,
    ISNULL(SUM(CAST(hs.CapacidadMaxima AS DECIMAL(18,2))), 0) AS Capacidad
FROM cfg.HorariosServicio hs
LEFT JOIN confirmadas c ON c.IdHorarioServicio = hs.IdHorarioServicio
WHERE hs.Fecha >= @desde AND hs.Fecha <= @hasta AND hs.Activo = 1;";

            using (SqlConnection conn = DbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(sqlOcupacionResumen, conn))
            {
                cmd.Parameters.Add("@desde", SqlDbType.Date).Value = desde.Date;
                cmd.Parameters.Add("@hasta", SqlDbType.Date).Value = hasta.Date;
                conn.Open();
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        decimal confirmadas = reader.IsDBNull(0) ? 0m : reader.GetDecimal(0);
                        decimal capacidad = reader.IsDBNull(1) ? 0m : reader.GetDecimal(1);
                        data.ConfirmadasPeriodo = Convert.ToInt32(Math.Round(confirmadas, 0, MidpointRounding.AwayFromZero));
                        data.CapacidadPeriodo = Convert.ToInt32(Math.Round(capacidad, 0, MidpointRounding.AwayFromZero));
                        data.OcupacionPorcentaje = capacidad <= 0m ? 0m : Math.Round((confirmadas * 100m) / capacidad, 2, MidpointRounding.AwayFromZero);
                    }
                }
            }

            const string sqlOcupacionPorServicio = @"
;WITH confirmadas AS
(
    SELECT r.IdHorarioServicio, COUNT(1) AS TotalConfirmadas
    FROM res.Reservas r
    WHERE UPPER(LTRIM(RTRIM(ISNULL(r.Estado, N'')))) = N'CONFIRMADA'
    GROUP BY r.IdHorarioServicio
)
SELECT
    p.Nombre AS Servicio,
    ISNULL(SUM(ISNULL(c.TotalConfirmadas, 0)), 0) AS Confirmadas,
    ISNULL(SUM(hs.CapacidadMaxima), 0) AS Capacidad,
    CAST(
        CASE WHEN ISNULL(SUM(hs.CapacidadMaxima), 0) = 0 THEN 0
             ELSE (ISNULL(SUM(CAST(ISNULL(c.TotalConfirmadas, 0) AS DECIMAL(18,2))), 0) * 100.0) / ISNULL(SUM(CAST(hs.CapacidadMaxima AS DECIMAL(18,2))), 0)
        END AS DECIMAL(6,2)
    ) AS OcupacionPct
FROM cfg.HorariosServicio hs
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
LEFT JOIN confirmadas c ON c.IdHorarioServicio = hs.IdHorarioServicio
WHERE hs.Fecha >= @desde AND hs.Fecha <= @hasta AND hs.Activo = 1
GROUP BY p.Nombre
ORDER BY Confirmadas DESC, Servicio;";

            using (SqlConnection conn = DbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(sqlOcupacionPorServicio, conn))
            {
                cmd.Parameters.Add("@desde", SqlDbType.Date).Value = desde.Date;
                cmd.Parameters.Add("@hasta", SqlDbType.Date).Value = hasta.Date;
                conn.Open();
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        int confirmadas = reader.IsDBNull(1) ? 0 : Convert.ToInt32(reader.GetValue(1));
                        int capacidad = reader.IsDBNull(2) ? 0 : Convert.ToInt32(reader.GetValue(2));
                        decimal ocupacion = reader.IsDBNull(3) ? 0m : reader.GetDecimal(3);

                        data.OcupacionPorDia.Add(new AdminDashboardSerieItem
                        {
                            Etiqueta = reader.IsDBNull(0) ? string.Empty : reader.GetString(0),
                            Valor = confirmadas,
                            Capacidad = capacidad,
                            Porcentaje = ocupacion
                        });
                    }
                }
            }
        }

        return data;
    }

    public static AdminResumenUsuarios ObtenerResumenUsuarios()
    {
        const string sql = @"
SELECT
    COUNT(1) AS UsuariosTotales,
    SUM(CASE WHEN u.Activo = 1 THEN 1 ELSE 0 END) AS UsuariosActivos,
    SUM(CASE WHEN r.Nombre = N'Administrador' THEN 1 ELSE 0 END) AS Administradores,
    SUM(CASE WHEN r.Nombre = N'Cliente' THEN 1 ELSE 0 END) AS Clientes,
    SUM(CASE WHEN r.Nombre = N'Operador' THEN 1 ELSE 0 END) AS Operadores
FROM seg.Usuarios u
INNER JOIN seg.Roles r ON r.IdRol = u.IdRol;";

        AdminResumenUsuarios resumen = new AdminResumenUsuarios();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                if (reader.Read())
                {
                    resumen.UsuariosTotales = reader.IsDBNull(0) ? 0 : Convert.ToInt32(reader.GetValue(0));
                    resumen.UsuariosActivos = reader.IsDBNull(1) ? 0 : Convert.ToInt32(reader.GetValue(1));
                    resumen.Administradores = reader.IsDBNull(2) ? 0 : Convert.ToInt32(reader.GetValue(2));
                    resumen.Clientes = reader.IsDBNull(3) ? 0 : Convert.ToInt32(reader.GetValue(3));
                    resumen.Operadores = reader.IsDBNull(4) ? 0 : Convert.ToInt32(reader.GetValue(4));
                }
            }
        }

        return resumen;
    }

    public static AdminUsuariosPaginados ObtenerUsuarios(string busqueda, int pagina, int tamanoPagina)
    {
        if (pagina < 1) pagina = 1;
        if (tamanoPagina < 1) tamanoPagina = 10;
        if (tamanoPagina > 50) tamanoPagina = 50;

        string filtro = string.IsNullOrWhiteSpace(busqueda) ? null : busqueda.Trim();
        int inicio = ((pagina - 1) * tamanoPagina) + 1;
        int fin = pagina * tamanoPagina;

        const string sqlCount = @"
SELECT COUNT(1)
FROM seg.Usuarios u
INNER JOIN seg.Roles r ON r.IdRol = u.IdRol
WHERE (@q IS NULL
       OR u.Correo LIKE '%' + @q + '%'
       OR u.Nombre LIKE '%' + @q + '%'
       OR u.Apellido1 LIKE '%' + @q + '%'
       OR ISNULL(u.Apellido2, N'') LIKE '%' + @q + '%');";

        const string sqlPage = @"
;WITH datos AS
(
    SELECT
        u.IdUsuario,
        u.Nombre,
        u.Apellido1,
        u.Apellido2,
        u.Correo,
        u.Activo,
        u.FotoPerfil,
        r.Nombre AS Rol,
        ROW_NUMBER() OVER (ORDER BY u.Nombre, u.Apellido1, u.IdUsuario) AS rn
    FROM seg.Usuarios u
    INNER JOIN seg.Roles r ON r.IdRol = u.IdRol
    WHERE (@q IS NULL
           OR u.Correo LIKE '%' + @q + '%'
           OR u.Nombre LIKE '%' + @q + '%'
           OR u.Apellido1 LIKE '%' + @q + '%'
           OR ISNULL(u.Apellido2, N'') LIKE '%' + @q + '%')
)
SELECT IdUsuario, Nombre, Apellido1, Apellido2, Correo, Activo, Rol, FotoPerfil
FROM datos
WHERE rn BETWEEN @inicio AND @fin
ORDER BY rn;";

        AdminUsuariosPaginados resultado = new AdminUsuariosPaginados();
        resultado.Pagina = pagina;
        resultado.TamanoPagina = tamanoPagina;
        resultado.TotalRegistros = 0;
        resultado.Usuarios = new List<AdminUsuarioListadoItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmdCount = new SqlCommand(sqlCount, conn))
        using (SqlCommand cmdPage = new SqlCommand(sqlPage, conn))
        {
            cmdCount.Parameters.AddWithValue("@q", (object)filtro ?? DBNull.Value);
            cmdPage.Parameters.AddWithValue("@q", (object)filtro ?? DBNull.Value);
            cmdPage.Parameters.AddWithValue("@inicio", inicio);
            cmdPage.Parameters.AddWithValue("@fin", fin);

            conn.Open();
            resultado.TotalRegistros = Convert.ToInt32(cmdCount.ExecuteScalar());

            using (SqlDataReader reader = cmdPage.ExecuteReader())
            {
                while (reader.Read())
                {
                    string nombre = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre"));
                    string apellido1 = reader.IsDBNull(reader.GetOrdinal("Apellido1")) ? string.Empty : reader.GetString(reader.GetOrdinal("Apellido1"));
                    string apellido2 = reader.IsDBNull(reader.GetOrdinal("Apellido2")) ? string.Empty : reader.GetString(reader.GetOrdinal("Apellido2"));

                    AdminUsuarioListadoItem item = new AdminUsuarioListadoItem();
                    item.IdUsuario = reader.GetInt32(reader.GetOrdinal("IdUsuario"));
                    item.Correo = reader.GetString(reader.GetOrdinal("Correo"));
                    item.Rol = reader.GetString(reader.GetOrdinal("Rol"));
                    item.Activo = reader.GetBoolean(reader.GetOrdinal("Activo"));
                    item.FotoPerfil = reader.IsDBNull(reader.GetOrdinal("FotoPerfil")) ? null : reader.GetString(reader.GetOrdinal("FotoPerfil"));
                    item.NombreCompleto = ConstruirNombreCompleto(nombre, apellido1, apellido2);
                    resultado.Usuarios.Add(item);
                }
            }
        }

        return resultado;
    }

    public static List<AdminUsuarioListadoItem> ObtenerUsuariosParaReporte(string busqueda, int? idRol, bool? activo)
    {
        string filtroBusqueda = string.IsNullOrWhiteSpace(busqueda) ? null : busqueda.Trim();

        const string sql = @"
SELECT
    u.IdUsuario,
    u.Nombre,
    u.Apellido1,
    u.Apellido2,
    u.Correo,
    u.Activo,
    r.Nombre AS Rol
FROM seg.Usuarios u
INNER JOIN seg.Roles r ON r.IdRol = u.IdRol
WHERE (@q IS NULL
       OR u.Correo LIKE '%' + @q + '%'
       OR u.Nombre LIKE '%' + @q + '%'
       OR u.Apellido1 LIKE '%' + @q + '%'
       OR ISNULL(u.Apellido2, N'') LIKE '%' + @q + '%')
  AND (@idRol IS NULL OR u.IdRol = @idRol)
  AND (@activo IS NULL OR u.Activo = @activo)
ORDER BY u.Nombre, u.Apellido1, u.IdUsuario;";

        List<AdminUsuarioListadoItem> usuarios = new List<AdminUsuarioListadoItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@q", (object)filtroBusqueda ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@idRol", idRol.HasValue ? (object)idRol.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@activo", activo.HasValue ? (object)activo.Value : DBNull.Value);

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    string nombre = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre"));
                    string apellido1 = reader.IsDBNull(reader.GetOrdinal("Apellido1")) ? string.Empty : reader.GetString(reader.GetOrdinal("Apellido1"));
                    string apellido2 = reader.IsDBNull(reader.GetOrdinal("Apellido2")) ? string.Empty : reader.GetString(reader.GetOrdinal("Apellido2"));

                    AdminUsuarioListadoItem item = new AdminUsuarioListadoItem();
                    item.IdUsuario = reader.GetInt32(reader.GetOrdinal("IdUsuario"));
                    item.Correo = reader.GetString(reader.GetOrdinal("Correo"));
                    item.Rol = reader.GetString(reader.GetOrdinal("Rol"));
                    item.Activo = reader.GetBoolean(reader.GetOrdinal("Activo"));
                    item.NombreCompleto = ConstruirNombreCompleto(nombre, apellido1, apellido2);
                    usuarios.Add(item);
                }
            }
        }

        return usuarios;
    }

    public static AdminAuditoriaPaginada ObtenerBitacoraAuditoria(string usuario, string accion, DateTime? fechaDesde, DateTime? fechaHasta, int pagina, int tamanoPagina)
    {
        if (pagina < 1) pagina = 1;
        if (tamanoPagina < 1) tamanoPagina = 10;
        if (tamanoPagina > 100) tamanoPagina = 100;

        AdminAuditoriaPaginada resultado = new AdminAuditoriaPaginada();
        resultado.Pagina = pagina;
        resultado.TamanoPagina = tamanoPagina;
        resultado.TotalRegistros = 0;
        resultado.Eventos = new List<AdminAuditoriaItem>();
        resultado.BitacoraDisponible = ExisteTabla("aud", "Bitacora");

        if (!resultado.BitacoraDisponible)
        {
            return resultado;
        }

        string filtroUsuario = string.IsNullOrWhiteSpace(usuario) ? null : usuario.Trim();
        string filtroAccion = string.IsNullOrWhiteSpace(accion) ? null : accion.Trim().ToUpperInvariant();

        int inicio = ((pagina - 1) * tamanoPagina) + 1;
        int fin = pagina * tamanoPagina;

        const string sqlCount = @"
SELECT COUNT(1)
FROM aud.Bitacora b
LEFT JOIN seg.Usuarios u ON u.IdUsuario = b.IdUsuario
WHERE (@usuario IS NULL
       OR u.Correo LIKE '%' + @usuario + '%'
       OR u.Nombre LIKE '%' + @usuario + '%'
       OR u.Apellido1 LIKE '%' + @usuario + '%'
       OR ISNULL(u.Apellido2, N'') LIKE '%' + @usuario + '%')
  AND (@accion IS NULL OR b.Accion = @accion)
  AND (@desde IS NULL OR b.Fecha >= @desde)
  AND (@hasta IS NULL OR b.Fecha < DATEADD(DAY, 1, @hasta));";

        const string sqlPage = @"
;WITH datos AS
(
    SELECT
        b.IdBitacora,
        b.Fecha,
        b.IdUsuario,
        u.Correo,
        u.Nombre,
        u.Apellido1,
        u.Apellido2,
        b.Modulo,
        b.Entidad,
        b.IdRegistro,
        b.Accion,
        b.EsEventoSeguridad,
        b.Descripcion,
        CASE
            WHEN b.Accion LIKE N'%ERROR%' OR b.Accion LIKE N'%DENEGADO%' THEN N'Error'
            WHEN b.Accion LIKE N'%EXITO%' OR b.Accion LIKE N'%EXITOSO%' THEN N'Exitoso'
            ELSE NULL
        END AS ResultadoOperacion,
        ROW_NUMBER() OVER (ORDER BY b.Fecha DESC, b.IdBitacora DESC) AS rn
    FROM aud.Bitacora b
    LEFT JOIN seg.Usuarios u ON u.IdUsuario = b.IdUsuario
    WHERE (@usuario IS NULL
           OR u.Correo LIKE '%' + @usuario + '%'
           OR u.Nombre LIKE '%' + @usuario + '%'
           OR u.Apellido1 LIKE '%' + @usuario + '%'
           OR ISNULL(u.Apellido2, N'') LIKE '%' + @usuario + '%')
      AND (@accion IS NULL OR b.Accion = @accion)
      AND (@desde IS NULL OR b.Fecha >= @desde)
      AND (@hasta IS NULL OR b.Fecha < DATEADD(DAY, 1, @hasta))
)
SELECT
    IdBitacora,
    Fecha,
    IdUsuario,
    Correo,
    Nombre,
    Apellido1,
    Apellido2,
    Modulo,
    Entidad,
    IdRegistro,
    Accion,
    EsEventoSeguridad,
    Descripcion,
    ResultadoOperacion
FROM datos
WHERE rn BETWEEN @inicio AND @fin
ORDER BY rn;";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmdCount = new SqlCommand(sqlCount, conn))
        using (SqlCommand cmdPage = new SqlCommand(sqlPage, conn))
        {
            cmdCount.Parameters.AddWithValue("@usuario", (object)filtroUsuario ?? DBNull.Value);
            cmdCount.Parameters.AddWithValue("@accion", (object)filtroAccion ?? DBNull.Value);
            cmdCount.Parameters.AddWithValue("@desde", fechaDesde.HasValue ? (object)fechaDesde.Value.Date : DBNull.Value);
            cmdCount.Parameters.AddWithValue("@hasta", fechaHasta.HasValue ? (object)fechaHasta.Value.Date : DBNull.Value);

            cmdPage.Parameters.AddWithValue("@usuario", (object)filtroUsuario ?? DBNull.Value);
            cmdPage.Parameters.AddWithValue("@accion", (object)filtroAccion ?? DBNull.Value);
            cmdPage.Parameters.AddWithValue("@desde", fechaDesde.HasValue ? (object)fechaDesde.Value.Date : DBNull.Value);
            cmdPage.Parameters.AddWithValue("@hasta", fechaHasta.HasValue ? (object)fechaHasta.Value.Date : DBNull.Value);
            cmdPage.Parameters.AddWithValue("@inicio", inicio);
            cmdPage.Parameters.AddWithValue("@fin", fin);

            conn.Open();
            resultado.TotalRegistros = Convert.ToInt32(cmdCount.ExecuteScalar());

            using (SqlDataReader reader = cmdPage.ExecuteReader())
            {
                while (reader.Read())
                {
                    string nombre = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre"));
                    string apellido1 = reader.IsDBNull(reader.GetOrdinal("Apellido1")) ? string.Empty : reader.GetString(reader.GetOrdinal("Apellido1"));
                    string apellido2 = reader.IsDBNull(reader.GetOrdinal("Apellido2")) ? string.Empty : reader.GetString(reader.GetOrdinal("Apellido2"));
                    string correo = reader.IsDBNull(reader.GetOrdinal("Correo")) ? string.Empty : reader.GetString(reader.GetOrdinal("Correo"));
                    string nombreCompleto = ConstruirNombreCompleto(nombre, apellido1, apellido2);

                    AdminAuditoriaItem item = new AdminAuditoriaItem();
                    item.IdBitacora = reader.GetInt64(reader.GetOrdinal("IdBitacora"));
                    item.Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha"));
                    item.IdUsuario = reader.IsDBNull(reader.GetOrdinal("IdUsuario")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("IdUsuario"));
                    item.Correo = correo;
                    item.Usuario = !string.IsNullOrWhiteSpace(nombreCompleto)
                        ? nombreCompleto
                        : (!string.IsNullOrWhiteSpace(correo) ? correo : "Sistema");
                    item.Accion = reader.IsDBNull(reader.GetOrdinal("Accion")) ? string.Empty : reader.GetString(reader.GetOrdinal("Accion"));
                    item.Modulo = reader.IsDBNull(reader.GetOrdinal("Modulo")) ? string.Empty : reader.GetString(reader.GetOrdinal("Modulo"));
                    item.Entidad = reader.IsDBNull(reader.GetOrdinal("Entidad")) ? string.Empty : reader.GetString(reader.GetOrdinal("Entidad"));
                    item.IdRegistro = reader.IsDBNull(reader.GetOrdinal("IdRegistro")) ? string.Empty : reader.GetString(reader.GetOrdinal("IdRegistro"));
                    item.Descripcion = reader.IsDBNull(reader.GetOrdinal("Descripcion")) ? string.Empty : reader.GetString(reader.GetOrdinal("Descripcion"));
                    item.EsEventoSeguridad = !reader.IsDBNull(reader.GetOrdinal("EsEventoSeguridad")) && reader.GetBoolean(reader.GetOrdinal("EsEventoSeguridad"));
                    item.Resultado = reader.IsDBNull(reader.GetOrdinal("ResultadoOperacion")) ? string.Empty : reader.GetString(reader.GetOrdinal("ResultadoOperacion"));
                    resultado.Eventos.Add(item);
                }
            }
        }

        return resultado;
    }

    public static AdminUsuarioDetalle ObtenerUsuarioDetalle(int idUsuario)
    {
        const string sql = @"
SELECT
    u.IdUsuario,
    u.Nombre,
    u.Apellido1,
    u.Apellido2,
    u.Correo,
    u.Telefono,
    u.Activo,
    u.IdRol,
    u.FotoPerfil,
    r.Nombre AS Rol
FROM seg.Usuarios u
INNER JOIN seg.Roles r ON r.IdRol = u.IdRol
WHERE u.IdUsuario = @idUsuario;";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idUsuario", idUsuario);
            conn.Open();

            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                if (!reader.Read()) return null;

                AdminUsuarioDetalle item = new AdminUsuarioDetalle();
                item.IdUsuario = reader.GetInt32(reader.GetOrdinal("IdUsuario"));
                item.Nombre = reader.GetString(reader.GetOrdinal("Nombre"));
                item.Apellido1 = reader.GetString(reader.GetOrdinal("Apellido1"));
                item.Apellido2 = reader.IsDBNull(reader.GetOrdinal("Apellido2")) ? null : reader.GetString(reader.GetOrdinal("Apellido2"));
                item.Correo = reader.GetString(reader.GetOrdinal("Correo"));
                item.Telefono = reader.IsDBNull(reader.GetOrdinal("Telefono")) ? null : reader.GetString(reader.GetOrdinal("Telefono"));
                item.Activo = reader.GetBoolean(reader.GetOrdinal("Activo"));
                item.IdRol = reader.GetInt32(reader.GetOrdinal("IdRol"));
                item.Rol = reader.GetString(reader.GetOrdinal("Rol"));
                item.FotoPerfil = reader.IsDBNull(reader.GetOrdinal("FotoPerfil")) ? null : reader.GetString(reader.GetOrdinal("FotoPerfil"));
                item.NombreCompleto = ConstruirNombreCompleto(item.Nombre, item.Apellido1, item.Apellido2);
                return item;
            }
        }
    }

    public static string ObtenerFotoPerfilUsuario(int idUsuario)
    {
        if (idUsuario <= 0) return null;

        const string sql = @"
SELECT u.FotoPerfil
FROM seg.Usuarios u
WHERE u.IdUsuario = @idUsuario;";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idUsuario", idUsuario);
            conn.Open();
            object valor = cmd.ExecuteScalar();
            if (valor == null || valor == DBNull.Value) return null;
            return Convert.ToString(valor);
        }
    }

    public static List<AdminRolItem> ObtenerRolesActivos()
    {
        const string sql = @"
SELECT IdRol, Nombre
FROM seg.Roles
WHERE Activo = 1
ORDER BY Nombre;";

        List<AdminRolItem> roles = new List<AdminRolItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    AdminRolItem rol = new AdminRolItem();
                    rol.IdRol = reader.GetInt32(reader.GetOrdinal("IdRol"));
                    rol.Nombre = reader.GetString(reader.GetOrdinal("Nombre"));
                    roles.Add(rol);
                }
            }
        }

        return roles;
    }


    public static bool CambiarRolUsuario(int idUsuarioActor, int idUsuarioObjetivo, int idRolNuevo, out string codigoError)
    {
        codigoError = null;

        const string sqlObjetivo = @"
SELECT u.IdUsuario, u.IdRol, r.Nombre AS Rol
FROM seg.Usuarios u
INNER JOIN seg.Roles r ON r.IdRol = u.IdRol
WHERE u.IdUsuario = @idUsuario;";

        const string sqlRolNuevo = @"
SELECT IdRol FROM seg.Roles WHERE IdRol = @idRol AND Activo = 1;";

        const string sqlRolAdmin = @"
SELECT TOP 1 IdRol FROM seg.Roles WHERE Nombre = N'Administrador';";

        const string sqlUpdate = @"
UPDATE seg.Usuarios
SET IdRol = @idRolNuevo,
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @idActor
WHERE IdUsuario = @idUsuarioObjetivo;";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmdObjetivo = new SqlCommand(sqlObjetivo, conn))
        using (SqlCommand cmdRolNuevo = new SqlCommand(sqlRolNuevo, conn))
        using (SqlCommand cmdRolAdmin = new SqlCommand(sqlRolAdmin, conn))
        using (SqlCommand cmdUpdate = new SqlCommand(sqlUpdate, conn))
        {
            cmdObjetivo.Parameters.AddWithValue("@idUsuario", idUsuarioObjetivo);
            cmdRolNuevo.Parameters.AddWithValue("@idRol", idRolNuevo);
            cmdUpdate.Parameters.AddWithValue("@idRolNuevo", idRolNuevo);
            cmdUpdate.Parameters.AddWithValue("@idActor", idUsuarioActor);
            cmdUpdate.Parameters.AddWithValue("@idUsuarioObjetivo", idUsuarioObjetivo);

            conn.Open();

            int? idRolActual = null;
            string rolActual = null;

            using (SqlDataReader reader = cmdObjetivo.ExecuteReader())
            {
                if (!reader.Read())
                {
                    codigoError = "USUARIO_NO_EXISTE";
                    return false;
                }

                idRolActual = reader.GetInt32(reader.GetOrdinal("IdRol"));
                rolActual = reader.GetString(reader.GetOrdinal("Rol"));
            }

            object rolValido = cmdRolNuevo.ExecuteScalar();
            if (rolValido == null || rolValido == DBNull.Value)
            {
                codigoError = "ROL_INVALIDO";
                return false;
            }

            if (idRolActual.HasValue && idRolActual.Value == idRolNuevo)
            {
                return true;
            }

            object rolAdminValue = cmdRolAdmin.ExecuteScalar();
            int idRolAdmin = rolAdminValue == null || rolAdminValue == DBNull.Value ? -1 : Convert.ToInt32(rolAdminValue);

            bool esAutoEdicion = idUsuarioActor == idUsuarioObjetivo;
            bool esAdminActual = string.Equals(rolActual, "Administrador", StringComparison.OrdinalIgnoreCase);
            bool intentaSalirDeAdmin = idRolNuevo != idRolAdmin;

            if (esAutoEdicion && esAdminActual && intentaSalirDeAdmin)
            {
                codigoError = "AUTO_REVOKE_NO_PERMITIDO";
                return false;
            }

            int filas = cmdUpdate.ExecuteNonQuery();
            if (filas <= 0)
            {
                codigoError = "NO_ACTUALIZADO";
                return false;
            }

            return true;
        }
    }

    public static bool ExisteIdentificacionEnClientes()
    {
        const string sql = @"
SELECT COUNT(1)
FROM sys.columns c
INNER JOIN sys.tables t ON t.object_id = c.object_id
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'cli'
  AND t.name = N'Clientes'
  AND c.name IN (N'Identificacion', N'Cedula', N'NumeroIdentificacion');";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            conn.Open();
            int count = Convert.ToInt32(cmd.ExecuteScalar());
            return count > 0;
        }
    }

    private static string ConstruirNombreCompleto(string nombre, string apellido1, string apellido2)
    {
        string n = string.IsNullOrWhiteSpace(nombre) ? string.Empty : nombre.Trim();
        string a1 = string.IsNullOrWhiteSpace(apellido1) ? string.Empty : apellido1.Trim();
        string a2 = string.IsNullOrWhiteSpace(apellido2) ? string.Empty : apellido2.Trim();
        return (n + " " + a1 + " " + a2).Trim();
    }

    private static bool ExisteTabla(string esquema, string tabla)
    {
        const string sql = "SELECT COUNT(1) FROM sys.tables t INNER JOIN sys.schemas s ON s.schema_id = t.schema_id WHERE s.name = @esquema AND t.name = @tabla";
        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@esquema", esquema);
            cmd.Parameters.AddWithValue("@tabla", tabla);
            conn.Open();
            int count = Convert.ToInt32(cmd.ExecuteScalar());
            return count > 0;
        }
    }

    private static int ContarClientesRegistrados()
    {
        const string sql = "SELECT COUNT(1) FROM cli.Clientes c INNER JOIN seg.Usuarios u ON u.IdUsuario = c.IdUsuario WHERE c.Activo = 1 AND u.Activo = 1";
        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            conn.Open();
            return Convert.ToInt32(cmd.ExecuteScalar());
        }
    }

    private static int ContarReservasPendientes()
    {
        const string sql = "SELECT COUNT(1) FROM res.Reservas WHERE Estado = @estado";
        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@estado", "Pendiente");
            conn.Open();
            return Convert.ToInt32(cmd.ExecuteScalar());
        }
    }

    private static int ContarConsultasPendientes()
    {
        const string sql = "SELECT COUNT(1) FROM con.Consultas WHERE Estado = @estado";
        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@estado", "Pendiente");
            conn.Open();
            return Convert.ToInt32(cmd.ExecuteScalar());
        }
    }

    private static int ContarRutinasActivas()
    {
        const string sql = "SELECT COUNT(1) FROM rut.Rutinas WHERE Activa = 1";
        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            conn.Open();
            return Convert.ToInt32(cmd.ExecuteScalar());
        }
    }
}
