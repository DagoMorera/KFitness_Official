<%@ WebHandler Language="C#" Class="AdminSchedulesSaveHandler" %>
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;

public class AdminScheduleSaveRequest
{
    public object idHorarioServicio { get; set; }
    public object idProducto { get; set; }
    public string fecha { get; set; }
    public string horaInicio { get; set; }
    public string horaFin { get; set; }
    public object capacidadMaxima { get; set; }
    public string instructor { get; set; }
    public object activo { get; set; }
    public string modo { get; set; }
    public string fechaInicio { get; set; }
    public string fechaFin { get; set; }
    public object diasSemana { get; set; }
}

public class AdminSchedulesSaveResponse
{
    public bool success { get; set; }
    public string code { get; set; }
    public string message { get; set; }
    public int idHorarioServicio { get; set; }
    public int sesionesCreadas { get; set; }
    public string[] fechasConflicto { get; set; }
}

public class AdminSchedulesSaveHandler : IHttpHandler
{
    private const int MaxBodyBytes = 16 * 1024;

    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";

        try
        {
            AdminAuthorizationResult auth = AdminAuthorization.ValidateCurrentUser(context);

            if (!auth.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "No autenticado." });
                return;
            }

            if (!auth.UserExists || !auth.IsAdmin)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "Acceso denegado." });
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "Método no permitido." });
                return;
            }

            if (!AdminCsrfProtection.EsSolicitudPostValida(context))
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "Token CSRF inválido o origen no permitido." });
                return;
            }

            string contentType = context.Request.ContentType ?? string.Empty;
            if (!contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 400;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "Content-Type inválido." });
                return;
            }

            string body;
            using (StreamReader sr = new StreamReader(context.Request.InputStream))
            {
                body = sr.ReadToEnd();
            }

            if (string.IsNullOrWhiteSpace(body) || body.Length > MaxBodyBytes)
            {
                context.Response.StatusCode = 400;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "Solicitud inválida." });
                return;
            }

            AdminScheduleSaveRequest req = Deserializar<AdminScheduleSaveRequest>(body);
            if (req == null)
            {
                context.Response.StatusCode = 400;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "Solicitud inválida." });
                return;
            }

            int idProducto;
            if (!TryToInt(req.idProducto, out idProducto) || idProducto <= 0)
            {
                context.Response.StatusCode = 400;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "Debe seleccionar un servicio válido." });
                return;
            }

            bool activo;
            if (!TryToBool(req.activo, out activo))
            {
                activo = true;
            }

            string modo = string.IsNullOrWhiteSpace(req.modo) ? "INDIVIDUAL" : req.modo.Trim().ToUpperInvariant();
            if (modo == "RECURRENTE")
            {
                DateTime fechaInicio;
                if (!DateTime.TryParseExact(req.fechaInicio ?? string.Empty, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fechaInicio))
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "La fecha de inicio es inválida." });
                    return;
                }

                DateTime fechaFin;
                if (!DateTime.TryParseExact(req.fechaFin ?? string.Empty, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fechaFin))
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "La fecha de finalización es inválida." });
                    return;
                }

                List<int> diasSemana;
                if (!TryToIntList(req.diasSemana, out diasSemana) || diasSemana.Count <= 0)
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "Debe seleccionar al menos un día de la semana." });
                    return;
                }

                TimeSpan horaInicioRec;
                if (!TimeSpan.TryParseExact(req.horaInicio ?? string.Empty, @"hh\:mm", CultureInfo.InvariantCulture, out horaInicioRec))
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "La hora de inicio es inválida." });
                    return;
                }

                TimeSpan horaFinRec;
                if (!TimeSpan.TryParseExact(req.horaFin ?? string.Empty, @"hh\:mm", CultureInfo.InvariantCulture, out horaFinRec))
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "La hora de finalización es inválida." });
                    return;
                }

                int capacidadRec;
                if (!TryToInt(req.capacidadMaxima, out capacidadRec))
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "La capacidad máxima es inválida." });
                    return;
                }

                GuardarHorariosRecurrentesAdminRequest guardarRec = new GuardarHorariosRecurrentesAdminRequest();
                guardarRec.IdProducto = idProducto;
                guardarRec.FechaInicio = fechaInicio;
                guardarRec.FechaFin = fechaFin;
                guardarRec.DiasSemana = diasSemana;
                guardarRec.HoraInicio = horaInicioRec;
                guardarRec.HoraFin = horaFinRec;
                guardarRec.CapacidadMaxima = capacidadRec;
                guardarRec.Instructor = req.instructor;
                guardarRec.Activo = activo;
                guardarRec.IdActor = auth.Usuario != null ? auth.Usuario.IdUsuario : 0;

                GuardarHorariosRecurrentesAdminResultado resultadoRec = RepositorioHorariosAdmin.GuardarHorariosRecurrentes(guardarRec);
                if (!resultadoRec.Success)
                {
                    int statusCodeRec = 400;
                    if (string.Equals(resultadoRec.CodigoError, "HORARIO_CONFLICTOS", StringComparison.OrdinalIgnoreCase))
                        statusCodeRec = 409;
                    else if (string.Equals(resultadoRec.CodigoError, "CONCURRENCIA_BLOQUEO", StringComparison.OrdinalIgnoreCase))
                        statusCodeRec = 409;
                    else if (string.Equals(resultadoRec.CodigoError, "HORARIO_DB_ERROR", StringComparison.OrdinalIgnoreCase))
                        statusCodeRec = 500;

                    context.Response.StatusCode = statusCodeRec;
                    Escribir(context, new AdminSchedulesSaveResponse
                    {
                        success = false,
                        code = resultadoRec.CodigoError,
                        message = resultadoRec.Message,
                        sesionesCreadas = resultadoRec.SesionesCreadas,
                        fechasConflicto = resultadoRec.FechasConflicto
                    });
                    return;
                }

                context.Response.StatusCode = 201;
                Escribir(context, new AdminSchedulesSaveResponse
                {
                    success = true,
                    message = resultadoRec.Message,
                    sesionesCreadas = resultadoRec.SesionesCreadas,
                    fechasConflicto = resultadoRec.FechasConflicto
                });
                return;
            }

            int idHorarioServicio;
            if (!TryToInt(req.idHorarioServicio, out idHorarioServicio)) idHorarioServicio = 0;

            DateTime fecha;
            if (!DateTime.TryParseExact(req.fecha ?? string.Empty, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fecha))
            {
                context.Response.StatusCode = 400;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "La fecha es inválida." });
                return;
            }

            TimeSpan horaInicio;
            if (!TimeSpan.TryParseExact(req.horaInicio ?? string.Empty, @"hh\:mm", CultureInfo.InvariantCulture, out horaInicio))
            {
                context.Response.StatusCode = 400;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "La hora de inicio es inválida." });
                return;
            }

            TimeSpan horaFin;
            if (!TimeSpan.TryParseExact(req.horaFin ?? string.Empty, @"hh\:mm", CultureInfo.InvariantCulture, out horaFin))
            {
                context.Response.StatusCode = 400;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "La hora de finalización es inválida." });
                return;
            }

            int capacidadMaxima;
            if (!TryToInt(req.capacidadMaxima, out capacidadMaxima))
            {
                context.Response.StatusCode = 400;
                Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "La capacidad máxima es inválida." });
                return;
            }

            GuardarHorarioAdminRequest guardar = new GuardarHorarioAdminRequest();
            guardar.IdHorarioServicio = idHorarioServicio;
            guardar.IdProducto = idProducto;
            guardar.Fecha = fecha;
            guardar.HoraInicio = horaInicio;
            guardar.HoraFin = horaFin;
            guardar.CapacidadMaxima = capacidadMaxima;
            guardar.Instructor = req.instructor;
            guardar.Activo = activo;
            guardar.IdActor = auth.Usuario != null ? auth.Usuario.IdUsuario : 0;

            GuardarHorarioAdminResultado resultado = RepositorioHorariosAdmin.GuardarHorario(guardar);
            if (!resultado.Success)
            {
                int statusCode = 400;
                if (string.Equals(resultado.CodigoError, "HORARIO_DUPLICADO", StringComparison.OrdinalIgnoreCase))
                    statusCode = 409;
                else if (string.Equals(resultado.CodigoError, "CONCURRENCIA_BLOQUEO", StringComparison.OrdinalIgnoreCase))
                    statusCode = 409;
                else if (string.Equals(resultado.CodigoError, "HORARIO_DB_ERROR", StringComparison.OrdinalIgnoreCase))
                    statusCode = 500;

                context.Response.StatusCode = statusCode;
                Escribir(context, new AdminSchedulesSaveResponse
                {
                    success = false,
                    code = resultado.CodigoError,
                    message = resultado.Message
                });
                return;
            }

            context.Response.StatusCode = idHorarioServicio > 0 ? 200 : 201;
            Escribir(context, new AdminSchedulesSaveResponse
            {
                success = true,
                idHorarioServicio = resultado.IdHorarioServicio,
                message = resultado.Message
            });
        }
        catch (Exception ex)
        {
            try { System.Diagnostics.Trace.TraceError("SCHEDULES_SAVE_ERROR: " + ex.GetType().Name + " - " + ex.Message); } catch { }
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            Escribir(context, new AdminSchedulesSaveResponse { success = false, message = "No fue posible guardar el horario." });
        }
    }

    private static void Escribir(HttpContext context, AdminSchedulesSaveResponse response)
    {
        context.Response.Write(Serializar(response));
    }

    private static string Serializar(AdminSchedulesSaveResponse response)
    {
        using (MemoryStream ms = new MemoryStream())
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(AdminSchedulesSaveResponse));
            serializer.WriteObject(ms, response);
            return Encoding.UTF8.GetString(ms.ToArray());
        }
    }

    private static T Deserializar<T>(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return default(T);

        using (MemoryStream ms = new MemoryStream(Encoding.UTF8.GetBytes(json)))
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(T));
            object value = serializer.ReadObject(ms);
            if (value == null) return default(T);
            return (T)value;
        }
    }

    private static bool TryToInt(object input, out int value)
    {
        value = 0;
        if (input == null) return false;
        return int.TryParse(Convert.ToString(input, CultureInfo.InvariantCulture), NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
    }

    private static bool TryToIntList(object input, out List<int> values)
    {
        values = new List<int>();
        if (input == null) return false;

        object[] array = input as object[];
        if (array == null || array.Length <= 0) return false;

        for (int i = 0; i < array.Length; i++)
        {
            int parsed;
            if (!TryToInt(array[i], out parsed) || parsed < 1 || parsed > 7)
            {
                continue;
            }

            if (!values.Contains(parsed))
                values.Add(parsed);
        }

        return values.Count > 0;
    }

    private static bool TryToBool(object input, out bool value)
    {
        value = false;
        if (input == null) return false;

        string text = Convert.ToString(input, CultureInfo.InvariantCulture);
        if (string.IsNullOrWhiteSpace(text)) return false;

        text = text.Trim();
        if (text == "1") { value = true; return true; }
        if (text == "0") { value = false; return true; }

        bool parsed;
        if (bool.TryParse(text, out parsed))
        {
            value = parsed;
            return true;
        }

        return false;
    }
}
