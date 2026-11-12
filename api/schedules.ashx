<%@ WebHandler Language="C#" Class="SchedulesHandler" %>
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;

public class HorarioDisponibleResponse
{
    public int idHorarioServicio { get; set; }
    public int idProducto { get; set; }
    public string servicio { get; set; }
    public string categoria { get; set; }
    public string fecha { get; set; }
    public string horaInicio { get; set; }
    public string horaFin { get; set; }
    public int capacidadMaxima { get; set; }
    public int reservasConfirmadas { get; set; }
    public int cuposRestantes { get; set; }
    public bool completo { get; set; }
    public string instructor { get; set; }
}

public class SchedulesResponse
{
    public bool success { get; set; }
    public string message { get; set; }
    public List<HorarioDisponibleResponse> horarios { get; set; }
}

public class SchedulesHandler : IHttpHandler
{
    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;

        try
        {
            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                Escribir(context, new SchedulesResponse { success = false, message = "Método no permitido." });
                return;
            }

            if (string.Equals(context.Request["validateCart"], "1", StringComparison.OrdinalIgnoreCase))
            {
                ProcesarValidacionCarrito(context);
                return;
            }

            int? idProducto = null;
            string idProductoRaw = context.Request["idProducto"];
            if (!string.IsNullOrWhiteSpace(idProductoRaw))
            {
                int idProductoParsed;
                if (!int.TryParse(idProductoRaw, out idProductoParsed) || idProductoParsed <= 0)
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new SchedulesResponse { success = false, message = "El parámetro idProducto no es válido." });
                    return;
                }

                idProducto = idProductoParsed;
            }

            DateTime? fecha = null;
            string fechaRaw = context.Request["fecha"];
            if (!string.IsNullOrWhiteSpace(fechaRaw))
            {
                DateTime fechaParsed;
                if (!DateTime.TryParseExact(fechaRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fechaParsed))
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new SchedulesResponse { success = false, message = "El parámetro fecha no es válido. Use formato yyyy-MM-dd." });
                    return;
                }
                fecha = fechaParsed.Date;
            }

            List<HorarioDisponibleItem> horarios = RepositorioHorariosConsulta.ObtenerHorariosDisponibles(idProducto, fecha);
            var ahora = RepositorioHorariosConsulta.AhoraCostaRica();
            horarios.RemoveAll(h => h.Fecha.Date.Add(h.HoraInicio) <= ahora);
            List<HorarioDisponibleResponse> response = Mapear(horarios);

            context.Response.StatusCode = 200;
            Escribir(context, new SchedulesResponse
            {
                success = true,
                horarios = response,
                message = response.Count == 0 ? "No hay horarios disponibles en este momento." : null
            });
        }
        catch (SqlException ex)
        {
            Trace.TraceError("SCHEDULES_DB_ERROR: " + ex.Number + " - " + ex.Message);
            context.Response.StatusCode = 500;
            Escribir(context, new SchedulesResponse { success = false, message = "Error de base de datos." });
        }
        catch (Exception ex)
        {
            Trace.TraceError("SCHEDULES_FATAL_ERROR: " + ex.GetType().Name + " - " + ex.Message);
            context.Response.StatusCode = 500;
            Escribir(context, new SchedulesResponse { success = false, message = "Error del servidor." });
        }
    }

    private static void ProcesarValidacionCarrito(HttpContext context)
    {
        string idHorarioRaw = context.Request["idHorarioServicio"];
        int idHorario;
        if (!int.TryParse(idHorarioRaw, out idHorario) || idHorario <= 0)
        {
            context.Response.StatusCode = 400;
            Escribir(context, new SchedulesResponse { success = false, message = "El idHorarioServicio no es válido." });
            return;
        }

        HorarioDisponibleItem item = RepositorioHorariosConsulta.ObtenerHorarioPorId(idHorario);
        if (item == null)
        {
            context.Response.StatusCode = 409;
            Escribir(context, new SchedulesResponse { success = false, message = "La cita seleccionada ya no está disponible." });
            return;
        }

        if (item.Completo || item.CuposRestantes <= 0)
        {
            context.Response.StatusCode = 409;
            Escribir(context, new SchedulesResponse { success = false, message = "La cita seleccionada ya no tiene cupo." });
            return;
        }

        DateTime inicioSesion = item.Fecha.Date.Add(item.HoraInicio);
        if (inicioSesion <= RepositorioHorariosConsulta.AhoraCostaRica())
        {
            context.Response.StatusCode = 409;
            Escribir(context, new SchedulesResponse { success = false, message = "La cita seleccionada ya inició o pertenece al pasado." });
            return;
        }

        context.Response.StatusCode = 200;
        Escribir(context, new SchedulesResponse
        {
            success = true,
            horarios = new List<HorarioDisponibleResponse> { Mapear(item) }
        });
    }

    private static void Escribir(HttpContext context, SchedulesResponse response)
    {
        context.Response.Write(Serializar(response));
    }

    private static string Serializar(SchedulesResponse response)
    {
        using (MemoryStream ms = new MemoryStream())
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(SchedulesResponse));
            serializer.WriteObject(ms, response);
            return Encoding.UTF8.GetString(ms.ToArray());
        }
    }

    private static HorarioDisponibleResponse Mapear(HorarioDisponibleItem item)
    {
        if (item == null) return null;

        return new HorarioDisponibleResponse
        {
            idHorarioServicio = item.IdHorarioServicio,
            idProducto = item.IdProducto,
            servicio = item.Servicio,
            categoria = item.Categoria,
            fecha = item.Fecha.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            horaInicio = item.HoraInicio.ToString(@"hh\:mm"),
            horaFin = item.HoraFin.ToString(@"hh\:mm"),
            capacidadMaxima = item.CapacidadMaxima,
            reservasConfirmadas = item.ReservasConfirmadas,
            cuposRestantes = item.CuposRestantes,
            completo = item.Completo,
            instructor = item.Instructor
        };
    }

    private static List<HorarioDisponibleResponse> Mapear(List<HorarioDisponibleItem> items)
    {
        List<HorarioDisponibleResponse> response = new List<HorarioDisponibleResponse>();
        if (items == null) return response;

        foreach (HorarioDisponibleItem item in items)
        {
            response.Add(Mapear(item));
        }

        return response;
    }
}
