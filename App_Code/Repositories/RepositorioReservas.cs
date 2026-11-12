using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class ReservaUsuarioItem
{
    public int IdReserva { get; set; }
    public int IdHorarioServicio { get; set; }
    public int IdProducto { get; set; }
    public string Servicio { get; set; }
    public DateTime Fecha { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public string Instructor { get; set; }
    public int CapacidadMaxima { get; set; }
    public int ReservasConfirmadas { get; set; }
    public int CuposRestantes { get; set; }
    public string Estado { get; set; }
    public string Observaciones { get; set; }
    public DateTime FechaCreacion { get; set; }
    public int? IdOperacionPromocional { get; set; }
    public int? IdPromocion { get; set; }
    public string NombrePromocion { get; set; }
    public string TipoPromocion { get; set; }
    public decimal PorcentajeDescuentoPromocion { get; set; }
}

public class ReservaAdminItem : ReservaUsuarioItem
{
    public int IdUsuario { get; set; }
    public string Cliente { get; set; }
    public string Correo { get; set; }
}

public class OperacionReservaResultado
{
    public bool Success { get; set; }
    public string CodigoError { get; set; }
    public string Message { get; set; }
    public int IdReserva { get; set; }
    public int IdHorarioServicio { get; set; }
    public int IdReservaSecundaria { get; set; }
    public int IdHorarioServicioSecundario { get; set; }
    public bool EsOperacionPromocional { get; set; }
    public int IdPromocion { get; set; }
    public string NombrePromocion { get; set; }
    public string TipoPromocion { get; set; }
    public string Servicio { get; set; }
    public DateTime FechaSesion { get; set; }
    public TimeSpan HoraInicioSesion { get; set; }
    public TimeSpan HoraFinSesion { get; set; }
    public string InstructorSesion { get; set; }
    public decimal PrecioRegular { get; set; }
    public decimal PrecioPromocional { get; set; }
    public decimal PorcentajeDescuento { get; set; }
}

public class SesionPromocionalValidacion
{
    public int IdHorarioServicio { get; set; }
    public int IdProducto { get; set; }
    public int CapacidadMaxima { get; set; }
    public DateTime Fecha { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public bool Activo { get; set; }
    public bool ServicioActivo { get; set; }
    public bool CategoriaActiva { get; set; }
    public string Servicio { get; set; }
    public string Instructor { get; set; }
    public decimal PrecioServicio { get; set; }
}

public static class RepositorioReservas
{
    public static List<ReservaUsuarioItem> ObtenerReservasUsuario(int idUsuario)
    {
        List<ReservaUsuarioItem> items = new List<ReservaUsuarioItem>();
        if (idUsuario <= 0) return items;

        const string sql = @"
SELECT
    r.IdReserva,
    r.IdHorarioServicio,
    hs.IdProducto,
    p.Nombre AS Servicio,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.Instructor,
    hs.CapacidadMaxima,
    r.Estado,
    r.Observaciones,
    r.FechaCreacion,
    r.IdOperacionPromocional,
    op.IdPromocion,
    pr.Nombre AS NombrePromocion,
    pr.TipoPromocion,
    pr.PorcentajeDescuento AS PorcentajeDescuentoPromocion,
    COUNT(CASE WHEN r2.Estado = N'CONFIRMADA' THEN 1 END) AS ReservasConfirmadas
FROM res.Reservas r
INNER JOIN cfg.HorariosServicio hs ON hs.IdHorarioServicio = r.IdHorarioServicio
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
LEFT JOIN res.OperacionesPromocionales op ON op.IdOperacionPromocional = r.IdOperacionPromocional
LEFT JOIN prm.Promociones pr ON pr.IdPromocion = op.IdPromocion
LEFT JOIN res.Reservas r2 ON r2.IdHorarioServicio = hs.IdHorarioServicio
WHERE r.IdUsuario = @idUsuario
GROUP BY
    r.IdReserva,
    r.IdHorarioServicio,
    hs.IdProducto,
    p.Nombre,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.Instructor,
    hs.CapacidadMaxima,
    r.Estado,
    r.Observaciones,
    r.FechaCreacion,
    r.IdOperacionPromocional,
    op.IdPromocion,
    pr.Nombre,
    pr.TipoPromocion,
    pr.PorcentajeDescuento
ORDER BY
    CASE WHEN hs.Fecha >= CAST(SYSDATETIME() AS DATE) THEN 0 ELSE 1 END,
    hs.Fecha ASC,
    hs.HoraInicio ASC,
    r.IdReserva DESC;";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idUsuario", idUsuario);
            conn.Open();

            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    ReservaUsuarioItem item = new ReservaUsuarioItem();
                    item.IdReserva = reader.GetInt32(reader.GetOrdinal("IdReserva"));
                    item.IdHorarioServicio = reader.GetInt32(reader.GetOrdinal("IdHorarioServicio"));
                    item.IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto"));
                    item.Servicio = reader.IsDBNull(reader.GetOrdinal("Servicio")) ? string.Empty : reader.GetString(reader.GetOrdinal("Servicio"));
                    item.Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha"));
                    item.HoraInicio = reader.GetTimeSpan(reader.GetOrdinal("HoraInicio"));
                    item.HoraFin = reader.GetTimeSpan(reader.GetOrdinal("HoraFin"));
                    item.Instructor = reader.IsDBNull(reader.GetOrdinal("Instructor")) ? string.Empty : reader.GetString(reader.GetOrdinal("Instructor"));
                    item.CapacidadMaxima = reader.IsDBNull(reader.GetOrdinal("CapacidadMaxima")) ? 0 : reader.GetInt32(reader.GetOrdinal("CapacidadMaxima"));
                    item.ReservasConfirmadas = reader.IsDBNull(reader.GetOrdinal("ReservasConfirmadas")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("ReservasConfirmadas")));
                    item.CuposRestantes = Math.Max(0, item.CapacidadMaxima - item.ReservasConfirmadas);
                    item.Estado = reader.IsDBNull(reader.GetOrdinal("Estado")) ? string.Empty : reader.GetString(reader.GetOrdinal("Estado"));
                    item.Observaciones = reader.IsDBNull(reader.GetOrdinal("Observaciones")) ? string.Empty : reader.GetString(reader.GetOrdinal("Observaciones"));
                    item.FechaCreacion = reader.GetDateTime(reader.GetOrdinal("FechaCreacion"));
                    item.IdOperacionPromocional = reader.IsDBNull(reader.GetOrdinal("IdOperacionPromocional")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("IdOperacionPromocional"));
                    item.IdPromocion = reader.IsDBNull(reader.GetOrdinal("IdPromocion")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("IdPromocion"));
                    item.NombrePromocion = reader.IsDBNull(reader.GetOrdinal("NombrePromocion")) ? string.Empty : reader.GetString(reader.GetOrdinal("NombrePromocion"));
                    item.TipoPromocion = reader.IsDBNull(reader.GetOrdinal("TipoPromocion")) ? string.Empty : reader.GetString(reader.GetOrdinal("TipoPromocion"));
                    item.PorcentajeDescuentoPromocion = reader.IsDBNull(reader.GetOrdinal("PorcentajeDescuentoPromocion")) ? 0m : reader.GetDecimal(reader.GetOrdinal("PorcentajeDescuentoPromocion"));
                    items.Add(item);
                }
            }
        }

        return items;
    }

    public static List<ReservaAdminItem> ObtenerReservasAdmin(string cliente, string servicio, DateTime? fecha, string estado)
    {
        return ObtenerReservasAdminFiltradas(cliente, servicio, fecha, fecha, estado);
    }

    public static List<ReservaAdminItem> ObtenerReservasAdminFiltradas(string cliente, string servicio, DateTime? fechaDesde, DateTime? fechaHasta, string estado)
    {
        List<ReservaAdminItem> items = new List<ReservaAdminItem>();

        const string sql = @"
SELECT
    r.IdReserva,
    r.IdUsuario,
    u.Correo,
    LTRIM(RTRIM(
        ISNULL(u.Nombre, N'') + N' ' + ISNULL(u.Apellido1, N'') + N' ' + ISNULL(u.Apellido2, N'')
    )) AS Cliente,
    r.IdHorarioServicio,
    hs.IdProducto,
    p.Nombre AS Servicio,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.Instructor,
    hs.CapacidadMaxima,
    r.Estado,
    r.Observaciones,
    r.FechaCreacion,
    r.IdOperacionPromocional,
    op.IdPromocion,
    pr.Nombre AS NombrePromocion,
    pr.TipoPromocion,
    pr.PorcentajeDescuento AS PorcentajeDescuentoPromocion,
    COUNT(CASE WHEN r2.Estado = N'CONFIRMADA' THEN 1 END) AS ReservasConfirmadas
FROM res.Reservas r
INNER JOIN seg.Usuarios u ON u.IdUsuario = r.IdUsuario
INNER JOIN cfg.HorariosServicio hs ON hs.IdHorarioServicio = r.IdHorarioServicio
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
LEFT JOIN res.OperacionesPromocionales op ON op.IdOperacionPromocional = r.IdOperacionPromocional
LEFT JOIN prm.Promociones pr ON pr.IdPromocion = op.IdPromocion
LEFT JOIN res.Reservas r2 ON r2.IdHorarioServicio = hs.IdHorarioServicio
WHERE (@cliente IS NULL OR (u.Nombre + N' ' + ISNULL(u.Apellido1, N'') + N' ' + ISNULL(u.Apellido2, N'') + N' ' + u.Correo) LIKE @cliente)
  AND (@servicio IS NULL OR p.Nombre LIKE @servicio)
  AND (@fechaDesde IS NULL OR hs.Fecha >= @fechaDesde)
  AND (@fechaHasta IS NULL OR hs.Fecha <= @fechaHasta)
  AND (@estado IS NULL OR r.Estado = @estado)
GROUP BY
    r.IdReserva,
    r.IdUsuario,
    u.Correo,
    u.Nombre,
    u.Apellido1,
    u.Apellido2,
    r.IdHorarioServicio,
    hs.IdProducto,
    p.Nombre,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.Instructor,
    hs.CapacidadMaxima,
    r.Estado,
    r.Observaciones,
    r.FechaCreacion,
    r.IdOperacionPromocional,
    op.IdPromocion,
    pr.Nombre,
    pr.TipoPromocion,
    pr.PorcentajeDescuento
ORDER BY hs.Fecha DESC, hs.HoraInicio DESC, r.IdReserva DESC;";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@cliente", string.IsNullOrWhiteSpace(cliente) ? (object)DBNull.Value : ("%" + cliente.Trim() + "%"));
            cmd.Parameters.AddWithValue("@servicio", string.IsNullOrWhiteSpace(servicio) ? (object)DBNull.Value : ("%" + servicio.Trim() + "%"));
            cmd.Parameters.AddWithValue("@fechaDesde", fechaDesde.HasValue ? (object)fechaDesde.Value.Date : DBNull.Value);
            cmd.Parameters.AddWithValue("@fechaHasta", fechaHasta.HasValue ? (object)fechaHasta.Value.Date : DBNull.Value);
            cmd.Parameters.AddWithValue("@estado", string.IsNullOrWhiteSpace(estado) ? (object)DBNull.Value : estado.Trim().ToUpperInvariant());

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    ReservaAdminItem item = new ReservaAdminItem();
                    item.IdReserva = reader.GetInt32(reader.GetOrdinal("IdReserva"));
                    item.IdUsuario = reader.GetInt32(reader.GetOrdinal("IdUsuario"));
                    item.Cliente = reader.IsDBNull(reader.GetOrdinal("Cliente")) ? string.Empty : reader.GetString(reader.GetOrdinal("Cliente"));
                    item.Correo = reader.IsDBNull(reader.GetOrdinal("Correo")) ? string.Empty : reader.GetString(reader.GetOrdinal("Correo"));
                    item.IdHorarioServicio = reader.GetInt32(reader.GetOrdinal("IdHorarioServicio"));
                    item.IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto"));
                    item.Servicio = reader.IsDBNull(reader.GetOrdinal("Servicio")) ? string.Empty : reader.GetString(reader.GetOrdinal("Servicio"));
                    item.Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha"));
                    item.HoraInicio = reader.GetTimeSpan(reader.GetOrdinal("HoraInicio"));
                    item.HoraFin = reader.GetTimeSpan(reader.GetOrdinal("HoraFin"));
                    item.Instructor = reader.IsDBNull(reader.GetOrdinal("Instructor")) ? string.Empty : reader.GetString(reader.GetOrdinal("Instructor"));
                    item.CapacidadMaxima = reader.IsDBNull(reader.GetOrdinal("CapacidadMaxima")) ? 0 : reader.GetInt32(reader.GetOrdinal("CapacidadMaxima"));
                    item.ReservasConfirmadas = reader.IsDBNull(reader.GetOrdinal("ReservasConfirmadas")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("ReservasConfirmadas")));
                    item.CuposRestantes = Math.Max(0, item.CapacidadMaxima - item.ReservasConfirmadas);
                    item.Estado = reader.IsDBNull(reader.GetOrdinal("Estado")) ? string.Empty : reader.GetString(reader.GetOrdinal("Estado"));
                    item.Observaciones = reader.IsDBNull(reader.GetOrdinal("Observaciones")) ? string.Empty : reader.GetString(reader.GetOrdinal("Observaciones"));
                    item.FechaCreacion = reader.GetDateTime(reader.GetOrdinal("FechaCreacion"));
                    item.IdOperacionPromocional = reader.IsDBNull(reader.GetOrdinal("IdOperacionPromocional")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("IdOperacionPromocional"));
                    item.IdPromocion = reader.IsDBNull(reader.GetOrdinal("IdPromocion")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("IdPromocion"));
                    item.NombrePromocion = reader.IsDBNull(reader.GetOrdinal("NombrePromocion")) ? string.Empty : reader.GetString(reader.GetOrdinal("NombrePromocion"));
                    item.TipoPromocion = reader.IsDBNull(reader.GetOrdinal("TipoPromocion")) ? string.Empty : reader.GetString(reader.GetOrdinal("TipoPromocion"));

                    items.Add(item);
                }
            }
        }

        return items;
    }

    public static OperacionReservaResultado CrearReserva(int idUsuario, int idHorarioServicio, string observaciones)
    {
        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            {
                var resultado = CrearReserva(conn, tx, idUsuario, idHorarioServicio, observaciones);
                if (resultado.Success) tx.Commit();
                return resultado;
            }
        }
    }

    internal static OperacionReservaResultado CrearReserva(SqlConnection conn, SqlTransaction tx, int idUsuario, int idHorarioServicio, string observaciones)
    {
        OperacionReservaResultado resultado = new OperacionReservaResultado();

        if (idUsuario <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "USUARIO_INVALIDO";
            resultado.Message = "No se pudo identificar al usuario autenticado.";
            return resultado;
        }

        if (idHorarioServicio <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "SESION_INVALIDA";
            resultado.Message = "La sesión seleccionada no es válida.";
            return resultado;
        }

        try
        {
            const string sqlSesion = @"
SELECT
    hs.IdHorarioServicio,
    hs.CapacidadMaxima,
    hs.Fecha,
    hs.HoraInicio,
    hs.Activo,
    p.Activo AS ServicioActivo,
    c.Activo AS CategoriaActiva
FROM cfg.HorariosServicio hs WITH (UPDLOCK, HOLDLOCK)
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE hs.IdHorarioServicio = @idHorarioServicio
  AND p.EsCombo = 0;";

            int capacidadMaxima = 0;
            DateTime fecha = DateTime.MinValue;
            TimeSpan horaInicio = TimeSpan.Zero;
            bool sesionActiva = false;
            bool servicioActivo = false;
            bool categoriaActiva = false;

            using (SqlCommand cmdSesion = new SqlCommand(sqlSesion, conn, tx))
            {
                cmdSesion.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
                using (SqlDataReader reader = cmdSesion.ExecuteReader())
                {
                    if (!reader.Read())
                    {
                        resultado.Success = false;
                        resultado.CodigoError = "SESION_NO_EXISTE";
                        resultado.Message = "La sesión seleccionada no existe.";
                        return resultado;
                    }

                    capacidadMaxima = reader.IsDBNull(reader.GetOrdinal("CapacidadMaxima")) ? 0 : reader.GetInt32(reader.GetOrdinal("CapacidadMaxima"));
                    fecha = reader.GetDateTime(reader.GetOrdinal("Fecha"));
                    horaInicio = reader.GetTimeSpan(reader.GetOrdinal("HoraInicio"));
                    sesionActiva = !reader.IsDBNull(reader.GetOrdinal("Activo")) && reader.GetBoolean(reader.GetOrdinal("Activo"));
                    servicioActivo = !reader.IsDBNull(reader.GetOrdinal("ServicioActivo")) && reader.GetBoolean(reader.GetOrdinal("ServicioActivo"));
                    categoriaActiva = !reader.IsDBNull(reader.GetOrdinal("CategoriaActiva")) && reader.GetBoolean(reader.GetOrdinal("CategoriaActiva"));
                }
            }

            if (!sesionActiva || !servicioActivo || !categoriaActiva)
            {
                resultado.Success = false;
                resultado.CodigoError = "SESION_INACTIVA";
                resultado.Message = "La sesión seleccionada no está disponible.";
                return resultado;
            }

            DateTime inicioSesion = fecha.Date.Add(horaInicio);
            if (inicioSesion <= RepositorioHorariosConsulta.AhoraCostaRica())
            {
                resultado.Success = false;
                resultado.CodigoError = "SESION_VENCIDA";
                resultado.Message = "La sesión seleccionada ya venció.";
                return resultado;
            }

            const string sqlDuplicado = @"
SELECT TOP 1 r.IdReserva
FROM res.Reservas r WITH (UPDLOCK, HOLDLOCK)
WHERE r.IdHorarioServicio = @idHorarioServicio
  AND r.IdUsuario = @idUsuario
  AND r.Estado IN (N'PENDIENTE', N'CONFIRMADA');";

            using (SqlCommand cmdDuplicado = new SqlCommand(sqlDuplicado, conn, tx))
            {
                cmdDuplicado.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
                cmdDuplicado.Parameters.AddWithValue("@idUsuario", idUsuario);
                object duplicado = cmdDuplicado.ExecuteScalar();
                if (duplicado != null && duplicado != DBNull.Value)
                {
                    resultado.Success = false;
                    resultado.CodigoError = "RESERVA_DUPLICADA";
                    resultado.Message = "Ya tienes una reserva activa para esta sesión.";
                    return resultado;
                }
            }

            int confirmadas = 0;
            const string sqlConfirmadas = @"
SELECT COUNT(1)
FROM res.Reservas WITH (UPDLOCK, HOLDLOCK)
WHERE IdHorarioServicio = @idHorarioServicio
  AND Estado = N'CONFIRMADA';";

            using (SqlCommand cmdConfirmadas = new SqlCommand(sqlConfirmadas, conn, tx))
            {
                cmdConfirmadas.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
                object count = cmdConfirmadas.ExecuteScalar();
                confirmadas = count == null || count == DBNull.Value ? 0 : Convert.ToInt32(count);
            }

            if (confirmadas >= capacidadMaxima)
            {
                resultado.Success = false;
                resultado.CodigoError = "SESION_COMPLETA";
                resultado.Message = "La sesión seleccionada no tiene cupos disponibles.";
                return resultado;
            }

            const string sqlInsert = @"
INSERT INTO res.Reservas
(
    IdHorarioServicio,
    IdUsuario,
    Estado,
    Observaciones,
    CreadoPor
)
VALUES
(
    @idHorarioServicio,
    @idUsuario,
    N'CONFIRMADA',
    @observaciones,
    @idUsuario
);
SELECT CAST(SCOPE_IDENTITY() AS INT);";

            using (SqlCommand cmdInsert = new SqlCommand(sqlInsert, conn, tx))
            {
                cmdInsert.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
                cmdInsert.Parameters.AddWithValue("@idUsuario", idUsuario);
                cmdInsert.Parameters.AddWithValue("@observaciones", string.IsNullOrWhiteSpace(observaciones) ? (object)DBNull.Value : observaciones.Trim());
                object nuevoId = cmdInsert.ExecuteScalar();
                resultado.IdReserva = nuevoId == null || nuevoId == DBNull.Value ? 0 : Convert.ToInt32(nuevoId);
            }


            resultado.Success = true;
            resultado.CodigoError = null;
            resultado.Message = "Reserva registrada correctamente.";
            resultado.IdHorarioServicio = idHorarioServicio;
            return resultado;
        }
        catch (SqlException ex)
        {
            resultado.Success = false;

            if (ex.Number == 2601 || ex.Number == 2627)
            {
                resultado.CodigoError = "RESERVA_DUPLICADA";
                resultado.Message = "Ya tienes una reserva activa para esta sesión.";
                return resultado;
            }

            resultado.CodigoError = "RESERVA_DB_ERROR";
            resultado.Message = "No fue posible registrar la reserva.";
            return resultado;
        }
    }

    public static OperacionReservaResultado CrearReservaPromocionalDosPorUno(int idUsuario, int idPromocion, int idHorarioServicioPrimario, int idHorarioServicioSecundario, string observaciones)
    {
        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            {
                var resultado = CrearReservaPromocionalDosPorUno(conn, tx, idUsuario, idPromocion, idHorarioServicioPrimario, idHorarioServicioSecundario, observaciones);
                if (resultado.Success) tx.Commit();
                return resultado;
            }
        }
    }

    internal static OperacionReservaResultado CrearReservaPromocionalDosPorUno(SqlConnection conn, SqlTransaction tx, int idUsuario, int idPromocion, int idHorarioServicioPrimario, int idHorarioServicioSecundario, string observaciones)
    {
        OperacionReservaResultado resultado = new OperacionReservaResultado();

        if (idUsuario <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "USUARIO_INVALIDO";
            resultado.Message = "No se pudo identificar al usuario autenticado.";
            return resultado;
        }

        if (idPromocion <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "PROMOCION_INVALIDA";
            resultado.Message = "La promoción seleccionada no es válida.";
            return resultado;
        }

        if (idHorarioServicioPrimario <= 0 || idHorarioServicioSecundario <= 0 || idHorarioServicioPrimario == idHorarioServicioSecundario)
        {
            resultado.Success = false;
            resultado.CodigoError = "SESIONES_INVALIDAS";
            resultado.Message = "Debes seleccionar dos sesiones diferentes para aplicar la promoción 2x1.";
            return resultado;
        }

        try
        {
            const string sqlPromocion = @"
SELECT TOP 1
    pr.IdPromocion,
    pr.Nombre,
    pr.TipoPromocion,
    pr.CantidadCompra,
    pr.CantidadEntrega,
    pp.IdProducto
FROM prm.Promociones pr WITH (UPDLOCK, HOLDLOCK)
INNER JOIN prm.PromocionProductos pp ON pp.IdPromocion = pr.IdPromocion
WHERE pr.IdPromocion = @idPromocion
  AND pr.Activo = 1
  AND CAST(SYSDATETIME() AS DATE) BETWEEN pr.FechaInicio AND pr.FechaFin;";

            string nombrePromocion = string.Empty;
            string tipoPromocion = string.Empty;
            int cantidadCompra = 0;
            int cantidadEntrega = 0;
            int idProductoPromocion = 0;

            using (SqlCommand cmdPromocion = new SqlCommand(sqlPromocion, conn, tx))
            {
                cmdPromocion.Parameters.AddWithValue("@idPromocion", idPromocion);
                using (SqlDataReader reader = cmdPromocion.ExecuteReader())
                {
                    if (!reader.Read())
                    {
                        resultado.Success = false;
                        resultado.CodigoError = "PROMOCION_NO_VIGENTE";
                        resultado.Message = "La promoción no está activa o se encuentra fuera de vigencia.";
                        return resultado;
                    }

                    nombrePromocion = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre"));
                    tipoPromocion = reader.IsDBNull(reader.GetOrdinal("TipoPromocion")) ? string.Empty : reader.GetString(reader.GetOrdinal("TipoPromocion"));
                    cantidadCompra = reader.IsDBNull(reader.GetOrdinal("CantidadCompra")) ? 0 : reader.GetInt32(reader.GetOrdinal("CantidadCompra"));
                    cantidadEntrega = reader.IsDBNull(reader.GetOrdinal("CantidadEntrega")) ? 0 : reader.GetInt32(reader.GetOrdinal("CantidadEntrega"));
                    idProductoPromocion = reader.IsDBNull(reader.GetOrdinal("IdProducto")) ? 0 : reader.GetInt32(reader.GetOrdinal("IdProducto"));
                }
            }

            if (!string.Equals(tipoPromocion, "DOS_POR_UNO", StringComparison.OrdinalIgnoreCase)
                || cantidadCompra <= 0
                || cantidadEntrega < 2)
            {
                resultado.Success = false;
                resultado.CodigoError = "PROMOCION_NO_APLICA";
                resultado.Message = "La promoción seleccionada no corresponde a un beneficio 2x1 válido.";
                return resultado;
            }

            const string sqlOperacionActiva = @"
SELECT TOP 1 op.IdOperacionPromocional
FROM res.OperacionesPromocionales op WITH (UPDLOCK, HOLDLOCK)
WHERE op.IdUsuario = @idUsuario
  AND op.IdPromocion = @idPromocion
  AND op.Estado = N'ACTIVA';";

            using (SqlCommand cmdOperacionActiva = new SqlCommand(sqlOperacionActiva, conn, tx))
            {
                cmdOperacionActiva.Parameters.AddWithValue("@idUsuario", idUsuario);
                cmdOperacionActiva.Parameters.AddWithValue("@idPromocion", idPromocion);
                object existeOperacion = cmdOperacionActiva.ExecuteScalar();
                if (existeOperacion != null && existeOperacion != DBNull.Value)
                {
                    resultado.Success = false;
                    resultado.CodigoError = "PROMOCION_YA_UTILIZADA";
                    resultado.Message = "Ya tienes una operación promocional 2x1 activa para esta promoción.";
                    return resultado;
                }
            }

            int menor = Math.Min(idHorarioServicioPrimario, idHorarioServicioSecundario);
            int mayor = Math.Max(idHorarioServicioPrimario, idHorarioServicioSecundario);

            const string sqlSesiones = @"
SELECT
    hs.IdHorarioServicio,
    hs.IdProducto,
    hs.CapacidadMaxima,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.Instructor,
    hs.Activo,
    p.Activo AS ServicioActivo,
    c.Activo AS CategoriaActiva,
    p.Nombre AS Servicio,
    p.Precio AS PrecioServicio
FROM cfg.HorariosServicio hs WITH (UPDLOCK, HOLDLOCK)
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE hs.IdHorarioServicio IN (@idSesion1, @idSesion2)
  AND p.EsCombo = 0
ORDER BY hs.IdHorarioServicio;";

            List<SesionPromocionalValidacion> sesiones = new List<SesionPromocionalValidacion>();
            using (SqlCommand cmdSesiones = new SqlCommand(sqlSesiones, conn, tx))
            {
                cmdSesiones.Parameters.AddWithValue("@idSesion1", menor);
                cmdSesiones.Parameters.AddWithValue("@idSesion2", mayor);
                using (SqlDataReader reader = cmdSesiones.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        sesiones.Add(new SesionPromocionalValidacion
                        {
                            IdHorarioServicio = reader.GetInt32(reader.GetOrdinal("IdHorarioServicio")),
                            IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto")),
                            CapacidadMaxima = reader.IsDBNull(reader.GetOrdinal("CapacidadMaxima")) ? 0 : reader.GetInt32(reader.GetOrdinal("CapacidadMaxima")),
                            Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha")),
                            HoraInicio = reader.GetTimeSpan(reader.GetOrdinal("HoraInicio")),
                            HoraFin = reader.GetTimeSpan(reader.GetOrdinal("HoraFin")),
                            Instructor = reader.IsDBNull(reader.GetOrdinal("Instructor")) ? string.Empty : reader.GetString(reader.GetOrdinal("Instructor")),
                            Activo = !reader.IsDBNull(reader.GetOrdinal("Activo")) && reader.GetBoolean(reader.GetOrdinal("Activo")),
                            ServicioActivo = !reader.IsDBNull(reader.GetOrdinal("ServicioActivo")) && reader.GetBoolean(reader.GetOrdinal("ServicioActivo")),
                            CategoriaActiva = !reader.IsDBNull(reader.GetOrdinal("CategoriaActiva")) && reader.GetBoolean(reader.GetOrdinal("CategoriaActiva")),
                            Servicio = reader.IsDBNull(reader.GetOrdinal("Servicio")) ? string.Empty : reader.GetString(reader.GetOrdinal("Servicio")),
                            PrecioServicio = reader.IsDBNull(reader.GetOrdinal("PrecioServicio")) ? 0m : reader.GetDecimal(reader.GetOrdinal("PrecioServicio"))
                        });
                    }
                }
            }

            if (sesiones.Count != 2)
            {
                resultado.Success = false;
                resultado.CodigoError = "SESION_NO_EXISTE";
                resultado.Message = "Una o ambas sesiones seleccionadas no existen.";
                return resultado;
            }

            foreach (SesionPromocionalValidacion sesion in sesiones)
            {
                if (sesion.IdProducto != idProductoPromocion)
                {
                    resultado.Success = false;
                    resultado.CodigoError = "SESION_SERVICIO_INVALIDO";
                    resultado.Message = "Las sesiones deben pertenecer al servicio asociado a la promoción.";
                    return resultado;
                }

                if (!sesion.Activo || !sesion.ServicioActivo || !sesion.CategoriaActiva)
                {
                    resultado.Success = false;
                    resultado.CodigoError = "SESION_INACTIVA";
                    resultado.Message = "Una de las sesiones seleccionadas no está disponible.";
                    return resultado;
                }

                DateTime inicioSesion = sesion.Fecha.Date.Add(sesion.HoraInicio);
                if (inicioSesion <= RepositorioHorariosConsulta.AhoraCostaRica())
                {
                    resultado.Success = false;
                    resultado.CodigoError = "SESION_VENCIDA";
                    resultado.Message = "Una de las sesiones seleccionadas ya venció.";
                    return resultado;
                }
            }

            const string sqlDuplicados = @"
SELECT r.IdHorarioServicio
FROM res.Reservas r WITH (UPDLOCK, HOLDLOCK)
WHERE r.IdUsuario = @idUsuario
  AND r.IdHorarioServicio IN (@idSesion1, @idSesion2)
  AND r.Estado IN (N'PENDIENTE', N'CONFIRMADA');";

            HashSet<int> sesionesDuplicadas = new HashSet<int>();
            using (SqlCommand cmdDuplicados = new SqlCommand(sqlDuplicados, conn, tx))
            {
                cmdDuplicados.Parameters.AddWithValue("@idUsuario", idUsuario);
                cmdDuplicados.Parameters.AddWithValue("@idSesion1", idHorarioServicioPrimario);
                cmdDuplicados.Parameters.AddWithValue("@idSesion2", idHorarioServicioSecundario);
                using (SqlDataReader reader = cmdDuplicados.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        sesionesDuplicadas.Add(reader.GetInt32(0));
                    }
                }
            }

            if (sesionesDuplicadas.Count > 0)
            {
                resultado.Success = false;
                resultado.CodigoError = "RESERVA_DUPLICADA";
                resultado.Message = "Ya tienes una reserva activa en una de las sesiones seleccionadas.";
                return resultado;
            }

            const string sqlCupos = @"
SELECT
    hs.IdHorarioServicio,
    hs.CapacidadMaxima,
    COUNT(CASE WHEN r.Estado = N'CONFIRMADA' THEN 1 END) AS Confirmadas
FROM cfg.HorariosServicio hs WITH (UPDLOCK, HOLDLOCK)
LEFT JOIN res.Reservas r WITH (UPDLOCK, HOLDLOCK) ON r.IdHorarioServicio = hs.IdHorarioServicio
WHERE hs.IdHorarioServicio IN (@idSesion1, @idSesion2)
GROUP BY hs.IdHorarioServicio, hs.CapacidadMaxima;";

            Dictionary<int, Tuple<int, int>> cupos = new Dictionary<int, Tuple<int, int>>();
            using (SqlCommand cmdCupos = new SqlCommand(sqlCupos, conn, tx))
            {
                cmdCupos.Parameters.AddWithValue("@idSesion1", idHorarioServicioPrimario);
                cmdCupos.Parameters.AddWithValue("@idSesion2", idHorarioServicioSecundario);
                using (SqlDataReader reader = cmdCupos.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        int idSesion = reader.GetInt32(reader.GetOrdinal("IdHorarioServicio"));
                        int capacidad = reader.IsDBNull(reader.GetOrdinal("CapacidadMaxima")) ? 0 : reader.GetInt32(reader.GetOrdinal("CapacidadMaxima"));
                        int confirmadas = reader.IsDBNull(reader.GetOrdinal("Confirmadas")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("Confirmadas")));
                        cupos[idSesion] = new Tuple<int, int>(capacidad, confirmadas);
                    }
                }
            }

            if (!cupos.ContainsKey(idHorarioServicioPrimario) || !cupos.ContainsKey(idHorarioServicioSecundario))
            {
                resultado.Success = false;
                resultado.CodigoError = "SESION_NO_EXISTE";
                resultado.Message = "Una o ambas sesiones seleccionadas no existen.";
                return resultado;
            }

            if (cupos[idHorarioServicioPrimario].Item2 >= cupos[idHorarioServicioPrimario].Item1
                || cupos[idHorarioServicioSecundario].Item2 >= cupos[idHorarioServicioSecundario].Item1)
            {
                resultado.Success = false;
                resultado.CodigoError = "SESION_COMPLETA";
                resultado.Message = "Una de las sesiones seleccionadas no tiene cupos disponibles.";
                return resultado;
            }

            const string sqlInsertOperacion = @"
INSERT INTO res.OperacionesPromocionales
(
    IdPromocion,
    IdUsuario,
    Estado,
    CreadoPor
)
VALUES
(
    @idPromocion,
    @idUsuario,
    N'ACTIVA',
    @idUsuario
);
SELECT CAST(SCOPE_IDENTITY() AS INT);";

            int idOperacionPromocional = 0;
            using (SqlCommand cmdOperacion = new SqlCommand(sqlInsertOperacion, conn, tx))
            {
                cmdOperacion.Parameters.AddWithValue("@idPromocion", idPromocion);
                cmdOperacion.Parameters.AddWithValue("@idUsuario", idUsuario);
                object idOperacionObj = cmdOperacion.ExecuteScalar();
                idOperacionPromocional = idOperacionObj == null || idOperacionObj == DBNull.Value ? 0 : Convert.ToInt32(idOperacionObj);
            }

            if (idOperacionPromocional <= 0)
            {
                resultado.Success = false;
                resultado.CodigoError = "RESERVA_DB_ERROR";
                resultado.Message = "No fue posible registrar la reserva promocional.";
                return resultado;
            }

            const string sqlInsertReserva = @"
INSERT INTO res.Reservas
(
    IdHorarioServicio,
    IdUsuario,
    Estado,
    Observaciones,
    CreadoPor,
    IdOperacionPromocional
)
VALUES
(
    @idHorarioServicio,
    @idUsuario,
    N'CONFIRMADA',
    @observaciones,
    @idUsuario,
    @idOperacionPromocional
);
SELECT CAST(SCOPE_IDENTITY() AS INT);";

            int idReservaPrimaria = 0;
            int idReservaSecundaria = 0;

            using (SqlCommand cmdReserva1 = new SqlCommand(sqlInsertReserva, conn, tx))
            {
                cmdReserva1.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicioPrimario);
                cmdReserva1.Parameters.AddWithValue("@idUsuario", idUsuario);
                cmdReserva1.Parameters.AddWithValue("@observaciones", string.IsNullOrWhiteSpace(observaciones) ? (object)DBNull.Value : observaciones.Trim());
                cmdReserva1.Parameters.AddWithValue("@idOperacionPromocional", idOperacionPromocional);
                object idReserva1Obj = cmdReserva1.ExecuteScalar();
                idReservaPrimaria = idReserva1Obj == null || idReserva1Obj == DBNull.Value ? 0 : Convert.ToInt32(idReserva1Obj);
            }

            using (SqlCommand cmdReserva2 = new SqlCommand(sqlInsertReserva, conn, tx))
            {
                cmdReserva2.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicioSecundario);
                cmdReserva2.Parameters.AddWithValue("@idUsuario", idUsuario);
                cmdReserva2.Parameters.AddWithValue("@observaciones", string.IsNullOrWhiteSpace(observaciones) ? (object)DBNull.Value : observaciones.Trim());
                cmdReserva2.Parameters.AddWithValue("@idOperacionPromocional", idOperacionPromocional);
                object idReserva2Obj = cmdReserva2.ExecuteScalar();
                idReservaSecundaria = idReserva2Obj == null || idReserva2Obj == DBNull.Value ? 0 : Convert.ToInt32(idReserva2Obj);
            }

            if (idReservaPrimaria <= 0 || idReservaSecundaria <= 0)
            {
                resultado.Success = false;
                resultado.CodigoError = "RESERVA_DB_ERROR";
                resultado.Message = "No fue posible registrar ambas reservas promocionales.";
                return resultado;
            }


            SesionPromocionalValidacion sesionPrimaria = sesiones.Find(s => s.IdHorarioServicio == idHorarioServicioPrimario);
            if (sesionPrimaria == null && sesiones.Count > 0)
            {
                sesionPrimaria = sesiones[0];
            }

            resultado.Success = true;
            resultado.CodigoError = null;
            resultado.Message = "Promoción 2x1 aplicada. Se registraron las dos sesiones correctamente.";
            resultado.IdReserva = idReservaPrimaria;
            resultado.IdHorarioServicio = idHorarioServicioPrimario;
            resultado.IdReservaSecundaria = idReservaSecundaria;
            resultado.IdHorarioServicioSecundario = idHorarioServicioSecundario;
            resultado.EsOperacionPromocional = true;
            resultado.IdPromocion = idPromocion;
            resultado.NombrePromocion = nombrePromocion;
            resultado.TipoPromocion = "DOS_POR_UNO";
            resultado.PorcentajeDescuento = 0m;
            resultado.PrecioRegular = sesionPrimaria != null ? sesionPrimaria.PrecioServicio : 0m;
            resultado.PrecioPromocional = resultado.PrecioRegular;
            resultado.Servicio = sesionPrimaria != null ? sesionPrimaria.Servicio : string.Empty;
            resultado.FechaSesion = sesionPrimaria != null ? sesionPrimaria.Fecha.Date : DateTime.MinValue;
            resultado.HoraInicioSesion = sesionPrimaria != null ? sesionPrimaria.HoraInicio : TimeSpan.Zero;
            resultado.HoraFinSesion = sesionPrimaria != null ? sesionPrimaria.HoraFin : TimeSpan.Zero;
            resultado.InstructorSesion = sesionPrimaria != null ? sesionPrimaria.Instructor : string.Empty;
            return resultado;
        }
        catch (SqlException ex)
        {
            resultado.Success = false;

            if (ex.Number == 2601 || ex.Number == 2627)
            {
                resultado.CodigoError = "RESERVA_DUPLICADA";
                resultado.Message = "Ya tienes una reserva activa en una de las sesiones seleccionadas.";
                return resultado;
            }

            resultado.CodigoError = "RESERVA_DB_ERROR";
            resultado.Message = "No fue posible registrar la reserva promocional.";
            return resultado;
        }
    }

    public static OperacionReservaResultado CrearReservaPromocionalPorcentaje(int idUsuario, int idPromocion, int idHorarioServicio, string observaciones)
    {
        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            {
                var resultado = CrearReservaPromocionalPorcentaje(conn, tx, idUsuario, idPromocion, idHorarioServicio, observaciones);
                if (resultado.Success) tx.Commit();
                return resultado;
            }
        }
    }

    internal static OperacionReservaResultado CrearReservaPromocionalPorcentaje(SqlConnection conn, SqlTransaction tx, int idUsuario, int idPromocion, int idHorarioServicio, string observaciones)
    {
        OperacionReservaResultado resultado = new OperacionReservaResultado();

        if (idUsuario <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "USUARIO_INVALIDO";
            resultado.Message = "No se pudo identificar al usuario autenticado.";
            return resultado;
        }

        if (idPromocion <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "PROMOCION_INVALIDA";
            resultado.Message = "La promoción seleccionada no es válida.";
            return resultado;
        }

        if (idHorarioServicio <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "SESION_INVALIDA";
            resultado.Message = "La sesión seleccionada no es válida.";
            return resultado;
        }

        try
        {
            const string sqlPromocion = @"
SELECT TOP 1
    pr.IdPromocion,
    pr.Nombre,
    pr.TipoPromocion,
    pr.PorcentajeDescuento,
    pr.Motivo,
    pp.IdProducto
FROM prm.Promociones pr WITH (UPDLOCK, HOLDLOCK)
INNER JOIN prm.PromocionProductos pp ON pp.IdPromocion = pr.IdPromocion
WHERE pr.IdPromocion = @idPromocion
  AND pr.Activo = 1
  AND CAST(SYSDATETIME() AS DATE) BETWEEN pr.FechaInicio AND pr.FechaFin;";

            string nombrePromocion = string.Empty;
            string tipoPromocion = string.Empty;
            decimal porcentajeDescuento = 0m;
            int idProductoPromocion = 0;
            bool esValoracionGratis = false;

            using (SqlCommand cmdPromocion = new SqlCommand(sqlPromocion, conn, tx))
            {
                cmdPromocion.Parameters.AddWithValue("@idPromocion", idPromocion);
                using (SqlDataReader reader = cmdPromocion.ExecuteReader())
                {
                    if (!reader.Read())
                    {
                        resultado.Success = false;
                        resultado.CodigoError = "PROMOCION_NO_VIGENTE";
                        resultado.Message = "La promoción no está activa o se encuentra fuera de vigencia.";
                        return resultado;
                    }

                    nombrePromocion = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre"));
                    tipoPromocion = reader.IsDBNull(reader.GetOrdinal("TipoPromocion")) ? string.Empty : reader.GetString(reader.GetOrdinal("TipoPromocion"));
                    porcentajeDescuento = reader.IsDBNull(reader.GetOrdinal("PorcentajeDescuento")) ? 0m : reader.GetDecimal(reader.GetOrdinal("PorcentajeDescuento"));
                    idProductoPromocion = reader.IsDBNull(reader.GetOrdinal("IdProducto")) ? 0 : reader.GetInt32(reader.GetOrdinal("IdProducto"));
                    int motivo = reader.GetOrdinal("Motivo");
                    esValoracionGratis = !reader.IsDBNull(motivo) && reader.GetString(motivo) == "KFIT_PRIMERA_VALORACION";
                }
            }

            if (!string.Equals(tipoPromocion, "PORCENTAJE", StringComparison.OrdinalIgnoreCase))
            {
                resultado.Success = false;
                resultado.CodigoError = "PROMOCION_NO_APLICA";
                resultado.Message = "La promoción seleccionada no corresponde a un beneficio porcentual válido.";
                return resultado;
            }

            if (porcentajeDescuento <= 0m || porcentajeDescuento > 100m)
            {
                resultado.Success = false;
                resultado.CodigoError = "DESCUENTO_INVALIDO";
                resultado.Message = "La promoción seleccionada tiene un descuento inválido.";
                return resultado;
            }

            if (esValoracionGratis && ValoracionGratisYaUtilizada(conn, tx, idPromocion, idUsuario))
            {
                resultado.CodigoError = "PROMOCION_YA_UTILIZADA";
                resultado.Message = MensajeValoracionUtilizada;
                return resultado;
            }

            const string sqlSesion = @"
SELECT
    hs.IdHorarioServicio,
    hs.IdProducto,
    hs.CapacidadMaxima,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.Instructor,
    hs.Activo,
    p.Activo AS ServicioActivo,
    c.Activo AS CategoriaActiva,
    p.Nombre AS Servicio,
    p.Precio AS PrecioServicio
FROM cfg.HorariosServicio hs WITH (UPDLOCK, HOLDLOCK)
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE hs.IdHorarioServicio = @idHorarioServicio
  AND p.EsCombo = 0;";

            SesionPromocionalValidacion sesion = null;
            using (SqlCommand cmdSesion = new SqlCommand(sqlSesion, conn, tx))
            {
                cmdSesion.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
                using (SqlDataReader reader = cmdSesion.ExecuteReader())
                {
                    if (!reader.Read())
                    {
                        resultado.Success = false;
                        resultado.CodigoError = "SESION_NO_EXISTE";
                        resultado.Message = "La sesión seleccionada no existe.";
                        return resultado;
                    }

                    sesion = new SesionPromocionalValidacion
                    {
                        IdHorarioServicio = reader.GetInt32(reader.GetOrdinal("IdHorarioServicio")),
                        IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto")),
                        CapacidadMaxima = reader.IsDBNull(reader.GetOrdinal("CapacidadMaxima")) ? 0 : reader.GetInt32(reader.GetOrdinal("CapacidadMaxima")),
                        Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha")),
                        HoraInicio = reader.GetTimeSpan(reader.GetOrdinal("HoraInicio")),
                        HoraFin = reader.GetTimeSpan(reader.GetOrdinal("HoraFin")),
                        Instructor = reader.IsDBNull(reader.GetOrdinal("Instructor")) ? string.Empty : reader.GetString(reader.GetOrdinal("Instructor")),
                        Activo = !reader.IsDBNull(reader.GetOrdinal("Activo")) && reader.GetBoolean(reader.GetOrdinal("Activo")),
                        ServicioActivo = !reader.IsDBNull(reader.GetOrdinal("ServicioActivo")) && reader.GetBoolean(reader.GetOrdinal("ServicioActivo")),
                        CategoriaActiva = !reader.IsDBNull(reader.GetOrdinal("CategoriaActiva")) && reader.GetBoolean(reader.GetOrdinal("CategoriaActiva")),
                        Servicio = reader.IsDBNull(reader.GetOrdinal("Servicio")) ? string.Empty : reader.GetString(reader.GetOrdinal("Servicio")),
                        PrecioServicio = reader.IsDBNull(reader.GetOrdinal("PrecioServicio")) ? 0m : reader.GetDecimal(reader.GetOrdinal("PrecioServicio"))
                    };
                }
            }

            if (sesion.IdProducto != idProductoPromocion)
            {
                resultado.Success = false;
                resultado.CodigoError = "SESION_SERVICIO_INVALIDO";
                resultado.Message = "La sesión no corresponde al servicio asociado a la promoción.";
                return resultado;
            }

            if (!sesion.Activo || !sesion.ServicioActivo || !sesion.CategoriaActiva)
            {
                resultado.Success = false;
                resultado.CodigoError = "SESION_INACTIVA";
                resultado.Message = "La sesión seleccionada no está disponible.";
                return resultado;
            }

            DateTime inicioSesion = sesion.Fecha.Date.Add(sesion.HoraInicio);
            if (inicioSesion <= RepositorioHorariosConsulta.AhoraCostaRica())
            {
                resultado.Success = false;
                resultado.CodigoError = "SESION_VENCIDA";
                resultado.Message = "La sesión seleccionada ya venció.";
                return resultado;
            }

            const string sqlDuplicado = @"
SELECT TOP 1 r.IdReserva
FROM res.Reservas r WITH (UPDLOCK, HOLDLOCK)
WHERE r.IdHorarioServicio = @idHorarioServicio
  AND r.IdUsuario = @idUsuario
  AND r.Estado IN (N'PENDIENTE', N'CONFIRMADA');";

            using (SqlCommand cmdDuplicado = new SqlCommand(sqlDuplicado, conn, tx))
            {
                cmdDuplicado.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
                cmdDuplicado.Parameters.AddWithValue("@idUsuario", idUsuario);
                object duplicado = cmdDuplicado.ExecuteScalar();
                if (duplicado != null && duplicado != DBNull.Value)
                {
                    resultado.Success = false;
                    resultado.CodigoError = "RESERVA_DUPLICADA";
                    resultado.Message = "Ya tienes una reserva activa para esta sesión.";
                    return resultado;
                }
            }

            const string sqlConfirmadas = @"
SELECT COUNT(1)
FROM res.Reservas WITH (UPDLOCK, HOLDLOCK)
WHERE IdHorarioServicio = @idHorarioServicio
  AND Estado = N'CONFIRMADA';";

            int confirmadas = 0;
            using (SqlCommand cmdConfirmadas = new SqlCommand(sqlConfirmadas, conn, tx))
            {
                cmdConfirmadas.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
                object count = cmdConfirmadas.ExecuteScalar();
                confirmadas = count == null || count == DBNull.Value ? 0 : Convert.ToInt32(count);
            }

            if (confirmadas >= sesion.CapacidadMaxima)
            {
                resultado.Success = false;
                resultado.CodigoError = "SESION_COMPLETA";
                resultado.Message = "La sesión seleccionada no tiene cupos disponibles.";
                return resultado;
            }

            const string sqlInsertOperacion = @"
INSERT INTO res.OperacionesPromocionales
(
    IdPromocion,
    IdUsuario,
    Estado,
    CreadoPor
)
VALUES
(
    @idPromocion,
    @idUsuario,
    N'CANCELADA',
    @idUsuario
);
SELECT CAST(SCOPE_IDENTITY() AS INT);";

            int idOperacionPromocional = 0;
            using (SqlCommand cmdOperacion = new SqlCommand(sqlInsertOperacion, conn, tx))
            {
                cmdOperacion.Parameters.AddWithValue("@idPromocion", idPromocion);
                cmdOperacion.Parameters.AddWithValue("@idUsuario", idUsuario);
                object idOperacionObj = cmdOperacion.ExecuteScalar();
                idOperacionPromocional = idOperacionObj == null || idOperacionObj == DBNull.Value ? 0 : Convert.ToInt32(idOperacionObj);
            }

            if (idOperacionPromocional <= 0)
            {
                resultado.Success = false;
                resultado.CodigoError = "RESERVA_DB_ERROR";
                resultado.Message = "No fue posible registrar la operación promocional.";
                return resultado;
            }

            const string sqlInsertReserva = @"
INSERT INTO res.Reservas
(
    IdHorarioServicio,
    IdUsuario,
    Estado,
    Observaciones,
    CreadoPor,
    IdOperacionPromocional
)
VALUES
(
    @idHorarioServicio,
    @idUsuario,
    N'CONFIRMADA',
    @observaciones,
    @idUsuario,
    @idOperacionPromocional
);
SELECT CAST(SCOPE_IDENTITY() AS INT);";

            int idReserva = 0;
            using (SqlCommand cmdInsert = new SqlCommand(sqlInsertReserva, conn, tx))
            {
                cmdInsert.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
                cmdInsert.Parameters.AddWithValue("@idUsuario", idUsuario);
                cmdInsert.Parameters.AddWithValue("@observaciones", string.IsNullOrWhiteSpace(observaciones) ? (object)DBNull.Value : observaciones.Trim());
                cmdInsert.Parameters.AddWithValue("@idOperacionPromocional", idOperacionPromocional);
                object nuevoId = cmdInsert.ExecuteScalar();
                idReserva = nuevoId == null || nuevoId == DBNull.Value ? 0 : Convert.ToInt32(nuevoId);
            }

            if (idReserva <= 0)
            {
                resultado.Success = false;
                resultado.CodigoError = "RESERVA_DB_ERROR";
                resultado.Message = "No fue posible registrar la reserva promocional.";
                return resultado;
            }

            if (esValoracionGratis)
            {
                using (SqlCommand uso = new SqlCommand(
                    "INSERT res.ValoracionesGratisUsadas (IdPromocion, IdUsuario) VALUES (@promo, @usuario);", conn, tx))
                {
                    uso.Parameters.Add("@promo", SqlDbType.Int).Value = idPromocion;
                    uso.Parameters.Add("@usuario", SqlDbType.Int).Value = idUsuario;
                    uso.ExecuteNonQuery();
                }
            }

            decimal precioRegular = sesion.PrecioServicio < 0m ? 0m : sesion.PrecioServicio;
            decimal precioPromocional = decimal.Round(precioRegular * (1m - (porcentajeDescuento / 100m)), 2, MidpointRounding.AwayFromZero);
            if (precioPromocional < 0m) precioPromocional = 0m;


            resultado.Success = true;
            resultado.CodigoError = null;
            resultado.Message = esValoracionGratis ? "Valoración gratuita confirmada." : "Promoción porcentual aplicada correctamente.";
            resultado.IdReserva = idReserva;
            resultado.IdHorarioServicio = idHorarioServicio;
            resultado.IdReservaSecundaria = 0;
            resultado.IdHorarioServicioSecundario = 0;
            resultado.EsOperacionPromocional = true;
            resultado.IdPromocion = idPromocion;
            resultado.NombrePromocion = nombrePromocion;
            resultado.TipoPromocion = "PORCENTAJE";
            resultado.Servicio = sesion.Servicio;
            resultado.FechaSesion = sesion.Fecha.Date;
            resultado.HoraInicioSesion = sesion.HoraInicio;
            resultado.HoraFinSesion = sesion.HoraFin;
            resultado.InstructorSesion = sesion.Instructor;
            resultado.PorcentajeDescuento = porcentajeDescuento;
            resultado.PrecioRegular = precioRegular;
            resultado.PrecioPromocional = precioPromocional;
            return resultado;
        }
        catch (SqlException ex)
        {
            resultado.Success = false;

            if (ex.Number == 2601 || ex.Number == 2627)
            {
                if (ex.Message.IndexOf("PK_ValoracionesGratisUsadas", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    resultado.CodigoError = "PROMOCION_YA_UTILIZADA";
                    resultado.Message = MensajeValoracionUtilizada;
                    return resultado;
                }
                resultado.CodigoError = "RESERVA_DUPLICADA";
                resultado.Message = "Ya tienes una reserva activa para esta sesión.";
                return resultado;
            }

            resultado.CodigoError = "RESERVA_DB_ERROR";
            resultado.Message = "No fue posible registrar la reserva promocional.";
            return resultado;
        }
    }

    public const string MensajeValoracionUtilizada = "Ya utilizaste tu primera valoración gratuita.";

    public static bool ValoracionGratisYaUtilizada(int idPromocion, int idUsuario)
    {
        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            return ValoracionGratisYaUtilizada(conn, null, idPromocion, idUsuario);
        }
    }

    private static bool ValoracionGratisYaUtilizada(SqlConnection conn, SqlTransaction tx, int idPromocion, int idUsuario)
    {
        string sql = "SELECT 1 FROM res.ValoracionesGratisUsadas "
            + (tx != null ? "WITH (UPDLOCK, HOLDLOCK) " : "")
            + "WHERE IdPromocion=@promo AND IdUsuario=@usuario;";
        using (SqlCommand cmd = new SqlCommand(sql, conn, tx))
        {
            cmd.Parameters.Add("@promo", SqlDbType.Int).Value = idPromocion;
            cmd.Parameters.Add("@usuario", SqlDbType.Int).Value = idUsuario;
            return cmd.ExecuteScalar() != null;
        }
    }

    public static OperacionReservaResultado CancelarReserva(int idUsuario, int idReserva)
    {
        OperacionReservaResultado resultado = new OperacionReservaResultado();

        if (idUsuario <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "USUARIO_INVALIDO";
            resultado.Message = "No se pudo identificar al usuario autenticado.";
            return resultado;
        }

        if (idReserva <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "RESERVA_INVALIDA";
            resultado.Message = "La reserva seleccionada no es válida.";
            return resultado;
        }

        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();

            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            {
                try
                {
                    const string sqlReserva = @"
SELECT
    r.IdReserva,
    r.IdUsuario,
    r.IdHorarioServicio,
    r.IdOperacionPromocional,
    r.Estado
FROM res.Reservas r WITH (UPDLOCK, HOLDLOCK)
WHERE r.IdReserva = @idReserva;";

                    int idUsuarioReserva = 0;
                    string estado = null;
                    int idHorarioServicio = 0;
                    int? idOperacionPromocional = null;

                    using (SqlCommand cmdReserva = new SqlCommand(sqlReserva, conn, tx))
                    {
                        cmdReserva.Parameters.AddWithValue("@idReserva", idReserva);
                        using (SqlDataReader reader = cmdReserva.ExecuteReader())
                        {
                            if (!reader.Read())
                            {
                                tx.Rollback();
                                resultado.Success = false;
                                resultado.CodigoError = "RESERVA_NO_EXISTE";
                                resultado.Message = "La reserva indicada no existe.";
                                return resultado;
                            }

                            idUsuarioReserva = reader.GetInt32(reader.GetOrdinal("IdUsuario"));
                            idHorarioServicio = reader.GetInt32(reader.GetOrdinal("IdHorarioServicio"));
                            idOperacionPromocional = reader.IsDBNull(reader.GetOrdinal("IdOperacionPromocional"))
                                ? (int?)null
                                : reader.GetInt32(reader.GetOrdinal("IdOperacionPromocional"));
                            estado = reader.IsDBNull(reader.GetOrdinal("Estado")) ? string.Empty : reader.GetString(reader.GetOrdinal("Estado"));
                        }
                    }

                    if (idUsuarioReserva != idUsuario)
                    {
                        tx.Rollback();
                        resultado.Success = false;
                        resultado.CodigoError = "RESERVA_NO_AUTORIZADA";
                        resultado.Message = "No tienes permisos para cancelar esta reserva.";
                        return resultado;
                    }

                    if (string.Equals(estado, "CANCELADA", StringComparison.OrdinalIgnoreCase))
                    {
                        tx.Rollback();
                        resultado.Success = false;
                        resultado.CodigoError = "RESERVA_YA_CANCELADA";
                        resultado.Message = "La reserva ya estaba cancelada.";
                        return resultado;
                    }

                    if (!string.Equals(estado, "CONFIRMADA", StringComparison.OrdinalIgnoreCase)
                        && !string.Equals(estado, "PENDIENTE", StringComparison.OrdinalIgnoreCase))
                    {
                        tx.Rollback();
                        resultado.Success = false;
                        resultado.CodigoError = "RESERVA_NO_ACTIVA";
                        resultado.Message = "Solo se pueden cancelar reservas activas.";
                        return resultado;
                    }

                    if (idOperacionPromocional.HasValue)
                    {
                        const string sqlReservasOperacion = @"
SELECT
    r.IdReserva,
    r.IdHorarioServicio,
    r.Estado
FROM res.Reservas r WITH (UPDLOCK, HOLDLOCK)
WHERE r.IdOperacionPromocional = @idOperacionPromocional
  AND r.IdUsuario = @idUsuario;";

                        List<Tuple<int, int, string>> reservasOperacion = new List<Tuple<int, int, string>>();
                        using (SqlCommand cmdReservasOperacion = new SqlCommand(sqlReservasOperacion, conn, tx))
                        {
                            cmdReservasOperacion.Parameters.AddWithValue("@idOperacionPromocional", idOperacionPromocional.Value);
                            cmdReservasOperacion.Parameters.AddWithValue("@idUsuario", idUsuario);
                            using (SqlDataReader reader = cmdReservasOperacion.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    reservasOperacion.Add(new Tuple<int, int, string>(
                                        reader.GetInt32(reader.GetOrdinal("IdReserva")),
                                        reader.GetInt32(reader.GetOrdinal("IdHorarioServicio")),
                                        reader.IsDBNull(reader.GetOrdinal("Estado")) ? string.Empty : reader.GetString(reader.GetOrdinal("Estado"))
                                    ));
                                }
                            }
                        }

                        if (reservasOperacion.Count == 0)
                        {
                            tx.Rollback();
                            resultado.Success = false;
                            resultado.CodigoError = "RESERVA_NO_EXISTE";
                            resultado.Message = "La reserva indicada no existe.";
                            return resultado;
                        }

                        bool alMenosUnaActiva = false;
                        foreach (Tuple<int, int, string> reservaOp in reservasOperacion)
                        {
                            if (string.Equals(reservaOp.Item3, "CONFIRMADA", StringComparison.OrdinalIgnoreCase)
                                || string.Equals(reservaOp.Item3, "PENDIENTE", StringComparison.OrdinalIgnoreCase))
                            {
                                alMenosUnaActiva = true;
                                break;
                            }
                        }

                        if (!alMenosUnaActiva)
                        {
                            tx.Rollback();
                            resultado.Success = false;
                            resultado.CodigoError = "RESERVA_YA_CANCELADA";
                            resultado.Message = "La operación promocional ya estaba cancelada.";
                            return resultado;
                        }

                        const string sqlCancelarOperacion = @"
UPDATE res.Reservas
SET Estado = N'CANCELADA',
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @idUsuario
WHERE IdOperacionPromocional = @idOperacionPromocional
  AND IdUsuario = @idUsuario
  AND Estado IN (N'PENDIENTE', N'CONFIRMADA');";

                        using (SqlCommand cmdCancelarOperacion = new SqlCommand(sqlCancelarOperacion, conn, tx))
                        {
                            cmdCancelarOperacion.Parameters.AddWithValue("@idOperacionPromocional", idOperacionPromocional.Value);
                            cmdCancelarOperacion.Parameters.AddWithValue("@idUsuario", idUsuario);
                            cmdCancelarOperacion.ExecuteNonQuery();
                        }

                        const string sqlCerrarOperacion = @"
UPDATE res.OperacionesPromocionales
SET Estado = N'CANCELADA',
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @idUsuario
WHERE IdOperacionPromocional = @idOperacionPromocional
  AND Estado = N'ACTIVA';";

                        using (SqlCommand cmdCerrarOperacion = new SqlCommand(sqlCerrarOperacion, conn, tx))
                        {
                            cmdCerrarOperacion.Parameters.AddWithValue("@idOperacionPromocional", idOperacionPromocional.Value);
                            cmdCerrarOperacion.Parameters.AddWithValue("@idUsuario", idUsuario);
                            cmdCerrarOperacion.ExecuteNonQuery();
                        }

                        tx.Commit();

                        resultado.Success = true;
                        resultado.CodigoError = null;
                        resultado.EsOperacionPromocional = true;
                        resultado.IdReserva = idReserva;
                        resultado.IdHorarioServicio = idHorarioServicio;

                        int secundariaIdReserva = 0;
                        int secundariaIdHorario = 0;
                        foreach (Tuple<int, int, string> reservaOp in reservasOperacion)
                        {
                            if (reservaOp.Item1 != idReserva)
                            {
                                secundariaIdReserva = reservaOp.Item1;
                                secundariaIdHorario = reservaOp.Item2;
                                break;
                            }
                        }

                        resultado.IdReservaSecundaria = secundariaIdReserva;
                        resultado.IdHorarioServicioSecundario = secundariaIdHorario;
                        resultado.Message = "Reserva promocional cancelada correctamente. Se cancelaron ambas sesiones vinculadas.";
                        return resultado;
                    }

                    const string sqlUpdate = @"
UPDATE res.Reservas
SET Estado = N'CANCELADA',
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @idUsuario
WHERE IdReserva = @idReserva;";

                    using (SqlCommand cmdUpdate = new SqlCommand(sqlUpdate, conn, tx))
                    {
                        cmdUpdate.Parameters.AddWithValue("@idReserva", idReserva);
                        cmdUpdate.Parameters.AddWithValue("@idUsuario", idUsuario);
                        int afectadas = cmdUpdate.ExecuteNonQuery();
                        if (afectadas <= 0)
                        {
                            tx.Rollback();
                            resultado.Success = false;
                            resultado.CodigoError = "RESERVA_NO_EXISTE";
                            resultado.Message = "La reserva indicada no existe.";
                            return resultado;
                        }
                    }

                    tx.Commit();

                    resultado.Success = true;
                    resultado.CodigoError = null;
                    resultado.Message = "Reserva cancelada correctamente.";
                    resultado.IdReserva = idReserva;
                    resultado.IdHorarioServicio = idHorarioServicio;
                    return resultado;
                }
                catch (SqlException)
                {
                    try { tx.Rollback(); } catch { }
                    resultado.Success = false;
                    resultado.CodigoError = "RESERVA_DB_ERROR";
                    resultado.Message = "No fue posible cancelar la reserva.";
                    return resultado;
                }
                catch
                {
                    try { tx.Rollback(); } catch { }
                    throw;
                }
            }
        }
    }
}
