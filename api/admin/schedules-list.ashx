<%@ WebHandler Language="C#" Class="AdminSchedulesListHandler" %>
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;

public class HorarioAdminListadoResponse
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
    public string instructor { get; set; }
    public bool activo { get; set; }
}

public class AdminSchedulesListResult
{
    public bool success { get; set; }
    public string message { get; set; }
    public List<HorarioAdminListadoResponse> horarios { get; set; }
}

public class AdminSchedulesListHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = Encoding.UTF8;

        try
        {
            AdminAuthorizationResult auth = AdminAuthorization.ValidateCurrentUser(context);

            if (!auth.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                Escribir(context, new AdminSchedulesListResult { success = false, message = "No autenticado." });
                return;
            }

            if (!auth.UserExists || !auth.IsAdmin)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                Escribir(context, new AdminSchedulesListResult { success = false, message = "Acceso denegado." });
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                Escribir(context, new AdminSchedulesListResult { success = false, message = "Método no permitido." });
                return;
            }

            int? idProducto = null;
            int idProductoParsed;
            string idProductoRaw = context.Request["idProducto"];
            if (!string.IsNullOrWhiteSpace(idProductoRaw))
            {
                if (!int.TryParse(idProductoRaw, out idProductoParsed) || idProductoParsed <= 0)
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new AdminSchedulesListResult { success = false, message = "Parámetro idProducto inválido." });
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
                    Escribir(context, new AdminSchedulesListResult { success = false, message = "Parámetro fecha inválido. Use formato yyyy-MM-dd." });
                    return;
                }
                fecha = fechaParsed.Date;
            }

            bool? activo = null;
            string estadoRaw = (context.Request["estado"] ?? string.Empty).Trim().ToLowerInvariant();
            if (!string.IsNullOrEmpty(estadoRaw))
            {
                if (estadoRaw == "activo") activo = true;
                else if (estadoRaw == "inactivo") activo = false;
                else if (estadoRaw == "todos") activo = null;
                else
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new AdminSchedulesListResult { success = false, message = "Parámetro estado inválido. Use activo, inactivo o todos." });
                    return;
                }
            }

            List<HorarioAdminListadoItem> horarios = RepositorioHorariosAdmin.ObtenerHorariosAdmin(idProducto, fecha);
            if (activo.HasValue)
            {
                horarios = horarios.FindAll(delegate (HorarioAdminListadoItem h)
                {
                    return h != null && h.Activo == activo.Value;
                });
            }

            List<HorarioAdminListadoResponse> response = new List<HorarioAdminListadoResponse>();

            foreach (HorarioAdminListadoItem h in horarios)
            {
                response.Add(new HorarioAdminListadoResponse
                {
                    idHorarioServicio = h.IdHorarioServicio,
                    idProducto = h.IdProducto,
                    servicio = h.Servicio,
                    categoria = h.Categoria,
                    fecha = h.Fecha.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    horaInicio = h.HoraInicio.ToString(@"hh\:mm"),
                    horaFin = h.HoraFin.ToString(@"hh\:mm"),
                    capacidadMaxima = h.CapacidadMaxima,
                    reservasConfirmadas = h.ReservasConfirmadas,
                    cuposRestantes = h.CuposRestantes,
                    instructor = h.Instructor,
                    activo = h.Activo
                });
            }

            context.Response.StatusCode = 200;
            Escribir(context, new AdminSchedulesListResult
            {
                success = true,
                horarios = response
            });
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            Escribir(context, new AdminSchedulesListResult { success = false, message = "No fue posible cargar los horarios." });
        }
    }

    private static void Escribir(HttpContext context, AdminSchedulesListResult response)
    {
        context.Response.Write(Serializar(response));
    }

    private static string Serializar(AdminSchedulesListResult response)
    {
        using (MemoryStream ms = new MemoryStream())
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(AdminSchedulesListResult));
            serializer.WriteObject(ms, response);
            return Encoding.UTF8.GetString(ms.ToArray());
        }
    }
}
