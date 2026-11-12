<%@ WebHandler Language="C#" Class="AdminReservationsListHandler" %>
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Web;
using System.Web.Script.Serialization;

public class AdminReservationResponseItem
{
    public int idReserva { get; set; }
    public int idUsuario { get; set; }
    public string cliente { get; set; }
    public string correo { get; set; }
    public int idHorarioServicio { get; set; }
    public int idProducto { get; set; }
    public string servicio { get; set; }
    public string fecha { get; set; }
    public string horaInicio { get; set; }
    public string horaFin { get; set; }
    public string instructor { get; set; }
    public string estado { get; set; }
    public int? idOperacionPromocional { get; set; }
    public int? idPromocion { get; set; }
    public string nombrePromocion { get; set; }
    public string tipoPromocion { get; set; }
    public decimal porcentajeDescuentoPromocion { get; set; }
    public string tipoReserva { get; set; }
}

public class AdminReservationsListHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        JavaScriptSerializer js = new JavaScriptSerializer();

        try
        {
            AdminAuthorizationResult auth = AdminAuthorization.ValidateCurrentUser(context);

            if (!auth.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                context.Response.Write(js.Serialize(new { success = false, message = "No autenticado." }));
                return;
            }

            if (!auth.UserExists || !auth.IsAdmin)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                context.Response.Write(js.Serialize(new { success = false, message = "Acceso denegado." }));
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new { success = false, message = "Método no permitido." }));
                return;
            }

            string cliente = (context.Request["cliente"] ?? string.Empty).Trim();
            string servicio = (context.Request["servicio"] ?? string.Empty).Trim();
            string estado = (context.Request["estado"] ?? string.Empty).Trim();

            DateTime? fecha = null;
            string fechaRaw = (context.Request["fecha"] ?? string.Empty).Trim();
            if (!string.IsNullOrWhiteSpace(fechaRaw))
            {
                DateTime fechaParsed;
                if (!DateTime.TryParseExact(fechaRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fechaParsed))
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "Parámetro fecha inválido. Use formato yyyy-MM-dd." }));
                    return;
                }
                fecha = fechaParsed.Date;
            }

            List<ReservaAdminItem> reservas = RepositorioReservas.ObtenerReservasAdmin(cliente, servicio, fecha, estado);
            List<AdminReservationResponseItem> items = new List<AdminReservationResponseItem>();

            int confirmadas = 0;
            int pendientes = 0;
            int canceladas = 0;

            foreach (ReservaAdminItem r in reservas)
            {
                string estadoItem = (r.Estado ?? string.Empty).Trim().ToUpperInvariant();
                if (estadoItem == "CONFIRMADA") confirmadas += 1;
                else if (estadoItem == "PENDIENTE") pendientes += 1;
                else if (estadoItem == "CANCELADA") canceladas += 1;

                string tipoPromocion = (r.TipoPromocion ?? string.Empty).Trim().ToUpperInvariant();
                string tipoReserva = r.IdOperacionPromocional.HasValue
                    ? (tipoPromocion == "DOS_POR_UNO" ? "PROMOCIONAL_2X1" : (tipoPromocion == "PORCENTAJE" ? "PROMOCIONAL_PORCENTAJE" : "PROMOCIONAL"))
                    : "NORMAL";

                items.Add(new AdminReservationResponseItem
                {
                    idReserva = r.IdReserva,
                    idUsuario = r.IdUsuario,
                    cliente = r.Cliente,
                    correo = r.Correo,
                    idHorarioServicio = r.IdHorarioServicio,
                    idProducto = r.IdProducto,
                    servicio = r.Servicio,
                    fecha = r.Fecha.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    horaInicio = r.HoraInicio.ToString(@"hh\:mm"),
                    horaFin = r.HoraFin.ToString(@"hh\:mm"),
                    instructor = r.Instructor,
                    estado = r.Estado,
                    idOperacionPromocional = r.IdOperacionPromocional,
                    idPromocion = r.IdPromocion,
                    nombrePromocion = r.NombrePromocion,
                    tipoPromocion = r.TipoPromocion,
                    porcentajeDescuentoPromocion = r.PorcentajeDescuentoPromocion,
                    tipoReserva = tipoReserva
                });
            }

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new
            {
                success = true,
                reservas = items,
                resumen = new
                {
                    total = items.Count,
                    confirmadas = confirmadas,
                    pendientes = pendientes,
                    canceladas = canceladas
                }
            }));
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible consultar reservas." }));
        }
    }
}
