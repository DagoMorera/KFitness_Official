<%@ WebHandler Language="C#" Class="AdminDashboardHandler" %>
using System;
using System.Globalization;
using System.Web;
using System.Web.Script.Serialization;

public class AdminDashboardHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
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

            DateTime hoy = DateTime.Today;
            DateTime desde = new DateTime(hoy.Year, hoy.Month, 1).AddMonths(-5);
            DateTime hasta = hoy;

            string desdeRaw = (context.Request["desde"] ?? string.Empty).Trim();
            string hastaRaw = (context.Request["hasta"] ?? string.Empty).Trim();

            if (!string.IsNullOrEmpty(desdeRaw))
            {
                DateTime parsedDesde;
                if (!DateTime.TryParseExact(desdeRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedDesde))
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "Parámetro desde inválido. Use formato yyyy-MM-dd." }));
                    return;
                }
                desde = parsedDesde.Date;
            }

            if (!string.IsNullOrEmpty(hastaRaw))
            {
                DateTime parsedHasta;
                if (!DateTime.TryParseExact(hastaRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedHasta))
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "Parámetro hasta inválido. Use formato yyyy-MM-dd." }));
                    return;
                }
                hasta = parsedHasta.Date;
            }

            if (desde > hasta)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "El rango de fechas es inválido: desde no puede ser mayor que hasta." }));
                return;
            }

            AdminDashboardEstadisticas dashboard = RepositorioAdmin.ObtenerDashboardEstadisticas(desde, hasta);

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new
            {
                success = true,
                nombre = auth.Usuario != null ? auth.Usuario.Nombre : "Administrador",
                rol = auth.RolNombre,
                periodo = new
                {
                    desde = desde.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    hasta = hasta.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                },
                kpis = new
                {
                    totalServiciosActivos = dashboard.TotalServiciosActivos,
                    totalUsuariosRegistrados = dashboard.TotalUsuariosRegistrados,
                    reservasPeriodo = dashboard.ReservasPeriodo,
                    confirmadasPeriodo = dashboard.ConfirmadasPeriodo,
                    capacidadPeriodo = dashboard.CapacidadPeriodo,
                    ocupacionPorcentaje = dashboard.OcupacionPorcentaje
                },
                graficos = new
                {
                    reservasPorMes = dashboard.ReservasPorMes,
                    serviciosPorCategoria = dashboard.ServiciosPorCategoria,
                    reservasPorEstado = dashboard.ReservasPorEstado,
                    ocupacionHorarios = dashboard.OcupacionPorDia,
                    usuariosPorRol = dashboard.UsuariosPorRol
                },
                disponibilidad = new
                {
                    catalogo = dashboard.TieneCatalogo,
                    seguridad = dashboard.TieneSeguridad,
                    reservasHorarios = dashboard.TieneReservasHorarios
                }
            }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cargar el dashboard." }));
        }
    }
}
