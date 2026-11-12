using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class HorarioAdminListadoItem
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
    public string Instructor { get; set; }
    public bool Activo { get; set; }
}

public class GuardarHorarioAdminRequest
{
    public int IdHorarioServicio { get; set; }
    public int IdProducto { get; set; }
    public DateTime Fecha { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public int CapacidadMaxima { get; set; }
    public string Instructor { get; set; }
    public bool Activo { get; set; }
    public int IdActor { get; set; }
}

public class GuardarHorarioAdminResultado
{
    public bool Success { get; set; }
    public string CodigoError { get; set; }
    public string Message { get; set; }
    public int IdHorarioServicio { get; set; }
}

public class GuardarHorariosRecurrentesAdminRequest
{
    public int IdProducto { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public List<int> DiasSemana { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public int CapacidadMaxima { get; set; }
    public string Instructor { get; set; }
    public bool Activo { get; set; }
    public int IdActor { get; set; }
}

public class GuardarHorariosRecurrentesAdminResultado
{
    public bool Success { get; set; }
    public string CodigoError { get; set; }
    public string Message { get; set; }
    public int SesionesCreadas { get; set; }
    public string[] FechasConflicto { get; set; }
}

public class ProgramacionServicioBloqueRequest
{
    public int DiaSemana { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFin { get; set; }
    public int CapacidadMaxima { get; set; }
    public string Instructor { get; set; }
    public bool Activo { get; set; }
}

public class SincronizarProgramacionServicioRequest
{
    public int IdProducto { get; set; }
    public int IdActor { get; set; }
    public int VentanaDias { get; set; }
    public List<ProgramacionServicioBloqueRequest> Bloques { get; set; }
}

public class SincronizarProgramacionServicioResultado
{
    public bool Success { get; set; }
    public string CodigoError { get; set; }
    public string Message { get; set; }
    public int SesionesGeneradas { get; set; }
    public int SesionesActualizadas { get; set; }
    public int SesionesDesactivadas { get; set; }
    public int SesionesProtegidas { get; set; }
}

public static class RepositorioHorariosAdmin
{
    public static List<HorarioAdminListadoItem> ObtenerHorariosAdmin(int? idProducto, DateTime? fecha)
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
    hs.Activo,
    COUNT(CASE WHEN r.Estado = N'CONFIRMADA' THEN 1 END) AS ReservasConfirmadas
FROM cfg.HorariosServicio hs
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
LEFT JOIN res.Reservas r ON r.IdHorarioServicio = hs.IdHorarioServicio
WHERE p.EsCombo = 0
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
    hs.Instructor,
    hs.Activo
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
    hs.Activo,
    CAST(0 AS INT) AS ReservasConfirmadas
FROM cfg.HorariosServicio hs
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE p.EsCombo = 0
  AND (@idProducto IS NULL OR hs.IdProducto = @idProducto)
  AND (@fecha IS NULL OR hs.Fecha = @fecha)
ORDER BY hs.Fecha, hs.HoraInicio, p.Nombre, hs.IdHorarioServicio;";

        List<HorarioAdminListadoItem> items = new List<HorarioAdminListadoItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            SqlParameter pId = cmd.Parameters.Add("@idProducto", SqlDbType.Int);
            pId.Value = idProducto.HasValue ? (object)idProducto.Value : DBNull.Value;

            SqlParameter pFecha = cmd.Parameters.Add("@fecha", SqlDbType.Date);
            pFecha.Value = fecha.HasValue ? (object)fecha.Value.Date : DBNull.Value;

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    HorarioAdminListadoItem item = new HorarioAdminListadoItem();
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
                    item.Instructor = reader.IsDBNull(reader.GetOrdinal("Instructor")) ? string.Empty : reader.GetString(reader.GetOrdinal("Instructor"));
                    item.Activo = !reader.IsDBNull(reader.GetOrdinal("Activo")) && reader.GetBoolean(reader.GetOrdinal("Activo"));
                    items.Add(item);
                }
            }
        }

        return items;
    }

    public static GuardarHorarioAdminResultado GuardarHorario(GuardarHorarioAdminRequest req)
    {
        GuardarHorarioAdminResultado resultado = ValidarReglas(req);
        if (!resultado.Success && !string.IsNullOrEmpty(resultado.CodigoError))
        {
            return resultado;
        }

        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();

            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            {
                try
                {
                    if (ExisteConflictoHorario(conn, tx, req))
                    {
                        resultado.Success = false;
                        resultado.CodigoError = "HORARIO_DUPLICADO";
                        resultado.Message = "Ya existe un horario activo incompatible para ese servicio, fecha y franja horaria.";
                        tx.Rollback();
                        return resultado;
                    }

                    if (req.IdHorarioServicio > 0)
                    {
                        int confirmadas = ContarReservasConfirmadas(conn, tx, req.IdHorarioServicio);
                        if (req.CapacidadMaxima < confirmadas)
                        {
                            resultado.Success = false;
                            resultado.CodigoError = "CAPACIDAD_INSUFICIENTE";
                            resultado.Message = "La capacidad máxima no puede ser menor que las reservas confirmadas.";
                            tx.Rollback();
                            return resultado;
                        }

                        const string sqlUpdate = @"
UPDATE cfg.HorariosServicio
SET IdProducto = @idProducto,
    Fecha = @fecha,
    HoraInicio = @horaInicio,
    HoraFin = @horaFin,
    CapacidadMaxima = @capacidad,
    Instructor = @instructor,
    Activo = @activo,
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @actor
WHERE IdHorarioServicio = @idHorarioServicio;";

                        using (SqlCommand cmd = new SqlCommand(sqlUpdate, conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@idHorarioServicio", req.IdHorarioServicio);
                            cmd.Parameters.AddWithValue("@idProducto", req.IdProducto);
                            cmd.Parameters.AddWithValue("@fecha", req.Fecha.Date);
                            cmd.Parameters.AddWithValue("@horaInicio", req.HoraInicio);
                            cmd.Parameters.AddWithValue("@horaFin", req.HoraFin);
                            cmd.Parameters.AddWithValue("@capacidad", req.CapacidadMaxima);
                            cmd.Parameters.AddWithValue("@instructor", string.IsNullOrWhiteSpace(req.Instructor) ? (object)DBNull.Value : req.Instructor.Trim());
                            cmd.Parameters.AddWithValue("@activo", req.Activo);
                            cmd.Parameters.AddWithValue("@actor", req.IdActor > 0 ? (object)req.IdActor : DBNull.Value);

                            int afectadas = cmd.ExecuteNonQuery();
                            if (afectadas <= 0)
                            {
                                resultado.Success = false;
                                resultado.CodigoError = "HORARIO_NO_EXISTE";
                                resultado.Message = "No se encontró el horario a actualizar.";
                                tx.Rollback();
                                return resultado;
                            }
                        }

                        resultado.IdHorarioServicio = req.IdHorarioServicio;
                    }
                    else
                    {
                        const string sqlInsert = @"
INSERT INTO cfg.HorariosServicio
(
    IdHorario,
    IdProducto,
    Fecha,
    HoraInicio,
    HoraFin,
    CapacidadMaxima,
    Instructor,
    Activo,
    CreadoPor
)
VALUES
(
    @idHorario,
    @idProducto,
    @fecha,
    @horaInicio,
    @horaFin,
    @capacidad,
    @instructor,
    @activo,
    @actor
);
SELECT CAST(SCOPE_IDENTITY() AS INT);";

                        int idHorarioBase = ObtenerHorarioBaseCompatible(conn, tx, req.Fecha, req.HoraInicio, req.HoraFin, req.IdActor);

                        using (SqlCommand cmd = new SqlCommand(sqlInsert, conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@idHorario", idHorarioBase);
                            cmd.Parameters.AddWithValue("@idProducto", req.IdProducto);
                            cmd.Parameters.AddWithValue("@fecha", req.Fecha.Date);
                            cmd.Parameters.AddWithValue("@horaInicio", req.HoraInicio);
                            cmd.Parameters.AddWithValue("@horaFin", req.HoraFin);
                            cmd.Parameters.AddWithValue("@capacidad", req.CapacidadMaxima);
                            cmd.Parameters.AddWithValue("@instructor", string.IsNullOrWhiteSpace(req.Instructor) ? (object)DBNull.Value : req.Instructor.Trim());
                            cmd.Parameters.AddWithValue("@activo", req.Activo);
                            cmd.Parameters.AddWithValue("@actor", req.IdActor > 0 ? (object)req.IdActor : DBNull.Value);

                            object nuevoId = cmd.ExecuteScalar();
                            resultado.IdHorarioServicio = nuevoId == null || nuevoId == DBNull.Value ? 0 : Convert.ToInt32(nuevoId);
                        }
                    }

                    tx.Commit();

                    resultado.Success = true;
                    resultado.CodigoError = null;
                    resultado.Message = req.IdHorarioServicio > 0
                        ? "Horario actualizado correctamente."
                        : "Horario registrado correctamente.";

                    return resultado;
                }
                catch (SqlException ex)
                {
                    try { tx.Rollback(); } catch { }
                    return MapearErrorSqlGuardarHorario(ex);
                }
                catch
                {
                    try { tx.Rollback(); } catch { }
                    throw;
                }
            }
        }
    }

    public static GuardarHorariosRecurrentesAdminResultado GuardarHorariosRecurrentes(GuardarHorariosRecurrentesAdminRequest req)
    {
        GuardarHorariosRecurrentesAdminResultado validacion = ValidarReglasRecurrentes(req);
        if (!validacion.Success && !string.IsNullOrEmpty(validacion.CodigoError))
        {
            return validacion;
        }

        List<DateTime> fechasProgramadas = ObtenerFechasProgramacion(req.FechaInicio, req.FechaFin, req.DiasSemana);
        if (fechasProgramadas.Count <= 0)
        {
            return new GuardarHorariosRecurrentesAdminResultado
            {
                Success = false,
                CodigoError = "RANGO_SIN_FECHAS",
                Message = "No hay fechas coincidentes para los días seleccionados en el período indicado.",
                FechasConflicto = new string[0]
            };
        }

        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();

            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            {
                try
                {
                    List<string> fechasConflicto = new List<string>();
                    DateTime hoy = DateTime.Today;

                    for (int i = 0; i < fechasProgramadas.Count; i++)
                    {
                        DateTime fecha = fechasProgramadas[i].Date;
                        if (fecha < hoy)
                        {
                            fechasConflicto.Add(fecha.ToString("yyyy-MM-dd"));
                            continue;
                        }

                        GuardarHorarioAdminRequest horarioValidar = new GuardarHorarioAdminRequest
                        {
                            IdHorarioServicio = 0,
                            IdProducto = req.IdProducto,
                            Fecha = fecha,
                            HoraInicio = req.HoraInicio,
                            HoraFin = req.HoraFin,
                            CapacidadMaxima = req.CapacidadMaxima,
                            Instructor = req.Instructor,
                            Activo = req.Activo,
                            IdActor = req.IdActor
                        };

                        if (ExisteConflictoHorario(conn, tx, horarioValidar))
                        {
                            fechasConflicto.Add(fecha.ToString("yyyy-MM-dd"));
                        }
                    }

                    if (fechasConflicto.Count > 0)
                    {
                        tx.Rollback();
                        return new GuardarHorariosRecurrentesAdminResultado
                        {
                            Success = false,
                            CodigoError = "HORARIO_CONFLICTOS",
                            Message = "Se detectaron fechas vencidas o conflictos de horario. Corrige la programación antes de guardar.",
                            SesionesCreadas = 0,
                            FechasConflicto = fechasConflicto.ToArray()
                        };
                    }

                    int sesionesCreadas = 0;
                    const string sqlInsert = @"
INSERT INTO cfg.HorariosServicio
(
    IdHorario,
    IdProducto,
    Fecha,
    HoraInicio,
    HoraFin,
    CapacidadMaxima,
    Instructor,
    Activo,
    CreadoPor
)
VALUES
(
    @idHorario,
    @idProducto,
    @fecha,
    @horaInicio,
    @horaFin,
    @capacidad,
    @instructor,
    @activo,
    @actor
);";

                    for (int i = 0; i < fechasProgramadas.Count; i++)
                    {
                        DateTime fecha = fechasProgramadas[i].Date;
                        int idHorarioBase = ObtenerHorarioBaseCompatible(conn, tx, fecha, req.HoraInicio, req.HoraFin, req.IdActor);

                        using (SqlCommand cmd = new SqlCommand(sqlInsert, conn, tx))
                        {
                            cmd.Parameters.AddWithValue("@idHorario", idHorarioBase);
                            cmd.Parameters.AddWithValue("@idProducto", req.IdProducto);
                            cmd.Parameters.AddWithValue("@fecha", fecha);
                            cmd.Parameters.AddWithValue("@horaInicio", req.HoraInicio);
                            cmd.Parameters.AddWithValue("@horaFin", req.HoraFin);
                            cmd.Parameters.AddWithValue("@capacidad", req.CapacidadMaxima);
                            cmd.Parameters.AddWithValue("@instructor", string.IsNullOrWhiteSpace(req.Instructor) ? (object)DBNull.Value : req.Instructor.Trim());
                            cmd.Parameters.AddWithValue("@activo", req.Activo);
                            cmd.Parameters.AddWithValue("@actor", req.IdActor > 0 ? (object)req.IdActor : DBNull.Value);
                            sesionesCreadas += cmd.ExecuteNonQuery();
                        }
                    }

                    tx.Commit();

                    return new GuardarHorariosRecurrentesAdminResultado
                    {
                        Success = true,
                        CodigoError = null,
                        Message = "Programación recurrente registrada correctamente.",
                        SesionesCreadas = sesionesCreadas,
                        FechasConflicto = new string[0]
                    };
                }
                catch (SqlException ex)
                {
                    try { tx.Rollback(); } catch { }
                    return MapearErrorSqlGuardarHorarioRecurrente(ex);
                }
                catch
                {
                    try { tx.Rollback(); } catch { }
                    throw;
                }
            }
        }
    }

    public static GuardarHorarioAdminResultado CambiarEstadoHorario(int idHorarioServicio, bool activo, int idActor)
    {
        GuardarHorarioAdminResultado resultado = new GuardarHorarioAdminResultado();

        if (idHorarioServicio <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "HORARIO_INVALIDO";
            resultado.Message = "El identificador del horario no es válido.";
            return resultado;
        }

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(@"
UPDATE cfg.HorariosServicio
SET Activo = @activo,
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @actor
WHERE IdHorarioServicio = @idHorarioServicio;", conn))
        {
            cmd.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
            cmd.Parameters.AddWithValue("@activo", activo);
            cmd.Parameters.AddWithValue("@actor", idActor > 0 ? (object)idActor : DBNull.Value);

            conn.Open();
            int afectadas = cmd.ExecuteNonQuery();
            if (afectadas <= 0)
            {
                resultado.Success = false;
                resultado.CodigoError = "HORARIO_NO_EXISTE";
                resultado.Message = "No se encontró el horario indicado.";
                return resultado;
            }

            resultado.Success = true;
            resultado.Message = activo ? "Horario activado." : "Horario desactivado.";
            resultado.IdHorarioServicio = idHorarioServicio;
            return resultado;
        }
    }

    private static GuardarHorarioAdminResultado ValidarReglas(GuardarHorarioAdminRequest req)
    {
        GuardarHorarioAdminResultado resultado = new GuardarHorarioAdminResultado();

        if (req == null)
        {
            resultado.Success = false;
            resultado.CodigoError = "SOLICITUD_INVALIDA";
            resultado.Message = "Solicitud inválida.";
            return resultado;
        }

        if (req.IdProducto <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "SERVICIO_INVALIDO";
            resultado.Message = "Debe seleccionar un servicio válido.";
            return resultado;
        }

        if (req.Fecha == DateTime.MinValue)
        {
            resultado.Success = false;
            resultado.CodigoError = "FECHA_INVALIDA";
            resultado.Message = "Debe indicar una fecha válida.";
            return resultado;
        }

        if (req.HoraFin <= req.HoraInicio)
        {
            resultado.Success = false;
            resultado.CodigoError = "HORAS_INVALIDAS";
            resultado.Message = "La hora de finalización debe ser posterior a la hora de inicio.";
            return resultado;
        }

        if (req.CapacidadMaxima <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "CAPACIDAD_INVALIDA";
            resultado.Message = "La capacidad máxima debe ser mayor que cero.";
            return resultado;
        }

        resultado.Success = true;
        return resultado;
    }

    private static GuardarHorariosRecurrentesAdminResultado ValidarReglasRecurrentes(GuardarHorariosRecurrentesAdminRequest req)
    {
        GuardarHorariosRecurrentesAdminResultado resultado = new GuardarHorariosRecurrentesAdminResultado();

        if (req == null)
        {
            resultado.Success = false;
            resultado.CodigoError = "SOLICITUD_INVALIDA";
            resultado.Message = "Solicitud inválida.";
            resultado.FechasConflicto = new string[0];
            return resultado;
        }

        if (req.IdProducto <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "SERVICIO_INVALIDO";
            resultado.Message = "Debe seleccionar un servicio válido.";
            resultado.FechasConflicto = new string[0];
            return resultado;
        }

        if (req.FechaInicio == DateTime.MinValue || req.FechaFin == DateTime.MinValue || req.FechaFin.Date < req.FechaInicio.Date)
        {
            resultado.Success = false;
            resultado.CodigoError = "RANGO_FECHAS_INVALIDO";
            resultado.Message = "El período de programación recurrente es inválido.";
            resultado.FechasConflicto = new string[0];
            return resultado;
        }

        if (req.FechaFin.Date < DateTime.Today)
        {
            resultado.Success = false;
            resultado.CodigoError = "FECHA_VENCIDA";
            resultado.Message = "La fecha de finalización no puede estar en el pasado.";
            resultado.FechasConflicto = new string[0];
            return resultado;
        }

        if (req.HoraFin <= req.HoraInicio)
        {
            resultado.Success = false;
            resultado.CodigoError = "HORAS_INVALIDAS";
            resultado.Message = "La hora de finalización debe ser posterior a la hora de inicio.";
            resultado.FechasConflicto = new string[0];
            return resultado;
        }

        if (req.CapacidadMaxima <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "CAPACIDAD_INVALIDA";
            resultado.Message = "La capacidad máxima debe ser mayor que cero.";
            resultado.FechasConflicto = new string[0];
            return resultado;
        }

        if (req.DiasSemana == null || req.DiasSemana.Count <= 0)
        {
            resultado.Success = false;
            resultado.CodigoError = "DIAS_SEMANA_REQUERIDOS";
            resultado.Message = "Debe seleccionar al menos un día de la semana.";
            resultado.FechasConflicto = new string[0];
            return resultado;
        }

        List<int> diasNormalizados = new List<int>();
        for (int i = 0; i < req.DiasSemana.Count; i++)
        {
            int dia = req.DiasSemana[i];
            if (dia < 1 || dia > 7)
            {
                resultado.Success = false;
                resultado.CodigoError = "DIAS_SEMANA_INVALIDOS";
                resultado.Message = "Los días de la semana seleccionados no son válidos.";
                resultado.FechasConflicto = new string[0];
                return resultado;
            }

            if (!diasNormalizados.Contains(dia))
            {
                diasNormalizados.Add(dia);
            }
        }

        req.DiasSemana = diasNormalizados;

        resultado.Success = true;
        resultado.FechasConflicto = new string[0];
        return resultado;
    }

    private static List<DateTime> ObtenerFechasProgramacion(DateTime fechaInicio, DateTime fechaFin, List<int> diasSemana)
    {
        List<DateTime> fechas = new List<DateTime>();
        if (diasSemana == null || diasSemana.Count <= 0)
            return fechas;

        DateTime actual = fechaInicio.Date;
        DateTime fin = fechaFin.Date;

        while (actual <= fin)
        {
            int dia = ConvertirDiaSemana(actual);
            if (diasSemana.Contains(dia))
                fechas.Add(actual);

            actual = actual.AddDays(1);
        }

        return fechas;
    }

    private static int ContarReservasConfirmadas(SqlConnection conn, SqlTransaction tx, int idHorarioServicio)
    {
        if (!RepositorioHorariosSchema.ExisteTablaReservas())
        {
            return 0;
        }

        using (SqlCommand cmd = new SqlCommand(@"
SELECT COUNT(1)
FROM res.Reservas
WHERE IdHorarioServicio = @idHorarioServicio
  AND Estado = N'CONFIRMADA';", conn, tx))
        {
            cmd.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
            object result = cmd.ExecuteScalar();
            return result == null || result == DBNull.Value ? 0 : Convert.ToInt32(result);
        }
    }

    private static bool ExisteConflictoHorario(SqlConnection conn, SqlTransaction tx, GuardarHorarioAdminRequest req)
    {
        using (SqlCommand cmd = new SqlCommand(@"
SELECT TOP 1 1
FROM cfg.HorariosServicio hs
WHERE hs.IdProducto = @idProducto
  AND hs.Fecha = @fecha
  AND hs.Activo = 1
  AND (@idHorarioServicio <= 0 OR hs.IdHorarioServicio <> @idHorarioServicio)
  AND hs.HoraInicio < @horaFin
  AND hs.HoraFin > @horaInicio;", conn, tx))
        {
            cmd.Parameters.AddWithValue("@idProducto", req.IdProducto);
            cmd.Parameters.AddWithValue("@fecha", req.Fecha.Date);
            cmd.Parameters.AddWithValue("@idHorarioServicio", req.IdHorarioServicio);
            cmd.Parameters.AddWithValue("@horaInicio", req.HoraInicio);
            cmd.Parameters.AddWithValue("@horaFin", req.HoraFin);
            object existe = cmd.ExecuteScalar();
            return existe != null && existe != DBNull.Value;
        }
    }

    private static int ObtenerHorarioBaseCompatible(SqlConnection conn, SqlTransaction tx, DateTime fecha, TimeSpan horaInicio, TimeSpan horaFin, int idActor)
    {
        int diaSemana = ConvertirDiaSemana(fecha);

        using (SqlCommand cmdBuscar = new SqlCommand(@"
SELECT TOP 1 IdHorario, HoraCierre, Activo
FROM cfg.HorariosAtencion
WHERE DiaSemana = @diaSemana
  AND HoraApertura = @horaInicio
ORDER BY IdHorario;", conn, tx))
        {
            cmdBuscar.Parameters.AddWithValue("@diaSemana", diaSemana);
            cmdBuscar.Parameters.AddWithValue("@horaInicio", horaInicio);

            using (SqlDataReader reader = cmdBuscar.ExecuteReader())
            {
                if (reader.Read())
                {
                    int idHorario = reader.GetInt32(reader.GetOrdinal("IdHorario"));
                    TimeSpan horaCierreActual = reader.IsDBNull(reader.GetOrdinal("HoraCierre"))
                        ? horaFin
                        : reader.GetTimeSpan(reader.GetOrdinal("HoraCierre"));
                    bool activoActual = !reader.IsDBNull(reader.GetOrdinal("Activo")) && reader.GetBoolean(reader.GetOrdinal("Activo"));

                    reader.Close();

                    if (horaCierreActual < horaFin || !activoActual)
                    {
                        using (SqlCommand cmdActualizar = new SqlCommand(@"
UPDATE cfg.HorariosAtencion
SET HoraCierre = CASE WHEN HoraCierre < @horaFin THEN @horaFin ELSE HoraCierre END,
    Activo = 1,
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @actor
WHERE IdHorario = @idHorario;", conn, tx))
                        {
                            cmdActualizar.Parameters.AddWithValue("@horaFin", horaFin);
                            cmdActualizar.Parameters.AddWithValue("@actor", idActor > 0 ? (object)idActor : DBNull.Value);
                            cmdActualizar.Parameters.AddWithValue("@idHorario", idHorario);
                            cmdActualizar.ExecuteNonQuery();
                        }
                    }

                    return idHorario;
                }
            }
        }

        using (SqlCommand cmdInsert = new SqlCommand(@"
INSERT INTO cfg.HorariosAtencion
(
    DiaSemana,
    HoraApertura,
    HoraCierre,
    Activo,
    CreadoPor
)
VALUES
(
    @diaSemana,
    @horaInicio,
    @horaFin,
    1,
    @actor
);
SELECT CAST(SCOPE_IDENTITY() AS INT);", conn, tx))
        {
            cmdInsert.Parameters.AddWithValue("@diaSemana", diaSemana);
            cmdInsert.Parameters.AddWithValue("@horaInicio", horaInicio);
            cmdInsert.Parameters.AddWithValue("@horaFin", horaFin);
            cmdInsert.Parameters.AddWithValue("@actor", idActor > 0 ? (object)idActor : DBNull.Value);
            object nuevoId = cmdInsert.ExecuteScalar();
            return nuevoId == null || nuevoId == DBNull.Value ? 0 : Convert.ToInt32(nuevoId);
        }
    }

    private static GuardarHorarioAdminResultado MapearErrorSqlGuardarHorario(SqlException ex)
    {
        GuardarHorarioAdminResultado resultado = new GuardarHorarioAdminResultado();
        resultado.Success = false;

        int numero = ex != null ? ex.Number : 0;
        if (numero == 2601 || numero == 2627)
        {
            resultado.CodigoError = "HORARIO_DUPLICADO";
            resultado.Message = "Ya existe un horario activo incompatible para ese servicio, fecha y franja horaria.";
            return resultado;
        }

        if (numero == 547)
        {
            resultado.CodigoError = "RELACION_INVALIDA";
            resultado.Message = "El servicio relacionado no es válido para registrar el horario.";
            return resultado;
        }

        if (numero == 515)
        {
            resultado.CodigoError = "DATOS_REQUERIDOS";
            resultado.Message = "Faltan datos obligatorios para guardar el horario.";
            return resultado;
        }

        if (numero == 1205)
        {
            resultado.CodigoError = "CONCURRENCIA_BLOQUEO";
            resultado.Message = "No fue posible guardar el horario por concurrencia. Intenta nuevamente.";
            return resultado;
        }

        resultado.CodigoError = "HORARIO_DB_ERROR";
        resultado.Message = "No fue posible guardar el horario por un error de base de datos.";
        return resultado;
    }

    private static GuardarHorariosRecurrentesAdminResultado MapearErrorSqlGuardarHorarioRecurrente(SqlException ex)
    {
        GuardarHorarioAdminResultado baseError = MapearErrorSqlGuardarHorario(ex);
        return new GuardarHorariosRecurrentesAdminResultado
        {
            Success = false,
            CodigoError = baseError.CodigoError,
            Message = baseError.Message,
            SesionesCreadas = 0,
            FechasConflicto = new string[0]
        };
    }

    private static int ConvertirDiaSemana(DateTime fecha)
    {
        DayOfWeek dow = fecha.DayOfWeek;
        if (dow == DayOfWeek.Sunday)
            return 7;

        return (int)dow;
    }
}
