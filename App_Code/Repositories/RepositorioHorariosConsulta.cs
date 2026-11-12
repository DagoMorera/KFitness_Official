using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class HorarioDisponibleItem
{
    public int IdHorarioServicio { get; set; }
    public int IdProducto { get; set; }
    public string Servicio { get; set; }
    public string Categoria { get; set; }
    public DateTime Fecha { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public int CapacidadMaxima { get; set; }
    public int ReservasConfirmadas { get; set; }
    public int CuposRestantes { get; set; }
    public bool Completo { get; set; }
    public string Instructor { get; set; }
}

public static class RepositorioHorariosConsulta
{
    public static DateTime AhoraCostaRica()
    {
        return DateTime.UtcNow.AddHours(-6);
    }

    public static List<HorarioDisponibleItem> ObtenerHorariosDisponibles(int? idProducto, DateTime? fecha)
    {
        bool tieneReservas = RepositorioHorariosSchema.ExisteTablaReservas();

        string sql = tieneReservas
            ? @"
SELECT
    hs.IdHorarioServicio,
    hs.IdProducto,
    p.Nombre AS Servicio,
    c.Nombre AS Categoria,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.CapacidadMaxima,
    hs.Instructor,
    COUNT(CASE WHEN r.Estado = N'CONFIRMADA' THEN 1 END) AS ReservasConfirmadas
FROM cfg.HorariosServicio hs
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
LEFT JOIN res.Reservas r ON r.IdHorarioServicio = hs.IdHorarioServicio
WHERE hs.Activo = 1
  AND p.Activo = 1
  AND c.Activo = 1
  AND p.EsCombo = 0
  AND (@idProducto IS NULL OR hs.IdProducto = @idProducto)
  AND (@fecha IS NULL OR hs.Fecha = @fecha)
GROUP BY
    hs.IdHorarioServicio,
    hs.IdProducto,
    p.Nombre,
    c.Nombre,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.CapacidadMaxima,
    hs.Instructor
ORDER BY hs.Fecha, hs.HoraInicio, p.Nombre, hs.IdHorarioServicio;"
            : @"
SELECT
    hs.IdHorarioServicio,
    hs.IdProducto,
    p.Nombre AS Servicio,
    c.Nombre AS Categoria,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.CapacidadMaxima,
    hs.Instructor,
    CAST(0 AS INT) AS ReservasConfirmadas
FROM cfg.HorariosServicio hs
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE hs.Activo = 1
  AND p.Activo = 1
  AND c.Activo = 1
  AND p.EsCombo = 0
  AND (@idProducto IS NULL OR hs.IdProducto = @idProducto)
  AND (@fecha IS NULL OR hs.Fecha = @fecha)
ORDER BY hs.Fecha, hs.HoraInicio, p.Nombre, hs.IdHorarioServicio;";

        List<HorarioDisponibleItem> items = new List<HorarioDisponibleItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            SqlParameter pIdProducto = cmd.Parameters.Add("@idProducto", SqlDbType.Int);
            pIdProducto.Value = idProducto.HasValue ? (object)idProducto.Value : DBNull.Value;

            SqlParameter pFecha = cmd.Parameters.Add("@fecha", SqlDbType.Date);
            pFecha.Value = fecha.HasValue ? (object)fecha.Value.Date : DBNull.Value;

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    HorarioDisponibleItem item = new HorarioDisponibleItem();
                    item.IdHorarioServicio = reader.GetInt32(reader.GetOrdinal("IdHorarioServicio"));
                    item.IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto"));
                    item.Servicio = reader.IsDBNull(reader.GetOrdinal("Servicio")) ? string.Empty : reader.GetString(reader.GetOrdinal("Servicio"));
                    item.Categoria = reader.IsDBNull(reader.GetOrdinal("Categoria")) ? string.Empty : reader.GetString(reader.GetOrdinal("Categoria"));
                    item.Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha"));
                    item.HoraInicio = reader.GetTimeSpan(reader.GetOrdinal("HoraInicio"));
                    item.HoraFin = reader.GetTimeSpan(reader.GetOrdinal("HoraFin"));
                    item.CapacidadMaxima = reader.IsDBNull(reader.GetOrdinal("CapacidadMaxima")) ? 0 : reader.GetInt32(reader.GetOrdinal("CapacidadMaxima"));
                    item.ReservasConfirmadas = reader.IsDBNull(reader.GetOrdinal("ReservasConfirmadas")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("ReservasConfirmadas")));
                    item.CuposRestantes = Math.Max(0, item.CapacidadMaxima - item.ReservasConfirmadas);
                    item.Completo = item.CuposRestantes <= 0;
                    item.Instructor = reader.IsDBNull(reader.GetOrdinal("Instructor")) ? string.Empty : reader.GetString(reader.GetOrdinal("Instructor"));
                    items.Add(item);
                }
            }
        }

        return items;
    }

    public static HorarioDisponibleItem ObtenerHorarioPorId(int idHorarioServicio)
    {
        if (idHorarioServicio <= 0) return null;

        bool tieneReservas = RepositorioHorariosSchema.ExisteTablaReservas();
        string sql = tieneReservas
            ? @"
SELECT
    hs.IdHorarioServicio,
    hs.IdProducto,
    p.Nombre AS Servicio,
    c.Nombre AS Categoria,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.CapacidadMaxima,
    hs.Instructor,
    COUNT(CASE WHEN r.Estado = N'CONFIRMADA' THEN 1 END) AS ReservasConfirmadas
FROM cfg.HorariosServicio hs
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
LEFT JOIN res.Reservas r ON r.IdHorarioServicio = hs.IdHorarioServicio
WHERE hs.IdHorarioServicio = @idHorarioServicio
  AND hs.Activo = 1
  AND p.Activo = 1
  AND c.Activo = 1
  AND p.EsCombo = 0
GROUP BY hs.IdHorarioServicio, hs.IdProducto, p.Nombre, c.Nombre, hs.Fecha, hs.HoraInicio, hs.HoraFin, hs.CapacidadMaxima, hs.Instructor;"
            : @"
SELECT
    hs.IdHorarioServicio,
    hs.IdProducto,
    p.Nombre AS Servicio,
    c.Nombre AS Categoria,
    hs.Fecha,
    hs.HoraInicio,
    hs.HoraFin,
    hs.CapacidadMaxima,
    hs.Instructor,
    CAST(0 AS INT) AS ReservasConfirmadas
FROM cfg.HorariosServicio hs
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE hs.IdHorarioServicio = @idHorarioServicio
  AND hs.Activo = 1
  AND p.Activo = 1
  AND c.Activo = 1
  AND p.EsCombo = 0;";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                if (!reader.Read()) return null;

                HorarioDisponibleItem item = new HorarioDisponibleItem();
                item.IdHorarioServicio = reader.GetInt32(reader.GetOrdinal("IdHorarioServicio"));
                item.IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto"));
                item.Servicio = reader.IsDBNull(reader.GetOrdinal("Servicio")) ? string.Empty : reader.GetString(reader.GetOrdinal("Servicio"));
                item.Categoria = reader.IsDBNull(reader.GetOrdinal("Categoria")) ? string.Empty : reader.GetString(reader.GetOrdinal("Categoria"));
                item.Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha"));
                item.HoraInicio = reader.GetTimeSpan(reader.GetOrdinal("HoraInicio"));
                item.HoraFin = reader.GetTimeSpan(reader.GetOrdinal("HoraFin"));
                item.CapacidadMaxima = reader.IsDBNull(reader.GetOrdinal("CapacidadMaxima")) ? 0 : reader.GetInt32(reader.GetOrdinal("CapacidadMaxima"));
                item.ReservasConfirmadas = reader.IsDBNull(reader.GetOrdinal("ReservasConfirmadas")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("ReservasConfirmadas")));
                item.CuposRestantes = Math.Max(0, item.CapacidadMaxima - item.ReservasConfirmadas);
                item.Completo = item.CuposRestantes <= 0;
                item.Instructor = reader.IsDBNull(reader.GetOrdinal("Instructor")) ? string.Empty : reader.GetString(reader.GetOrdinal("Instructor"));
                return item;
            }
        }
    }
}
