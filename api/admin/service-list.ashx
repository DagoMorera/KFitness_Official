<%@ WebHandler Language="C#" Class="AdminServiceListHandler" %>
using System;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.Web;
using JavaScriptSerializer = System.Web.Script.Serialization.JavaScriptSerializer;

[DataContract]
internal class ServiceListSuccessResponse
{
    [DataMember(Name = "success")]
    public bool Success { get; set; }

    [DataMember(Name = "servicios")]
    public List<ServicioAdminListadoItem> Servicios { get; set; }
}

[DataContract]
internal class ServiceListErrorResponse
{
    [DataMember(Name = "success")]
    public bool Success { get; set; }

    [DataMember(Name = "message")]
    public string Message { get; set; }
}

public class AdminServiceListHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;
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

            string nombre = (context.Request["nombre"] ?? string.Empty).Trim();
            string categoria = (context.Request["categoria"] ?? string.Empty).Trim();
            string estadoRaw = (context.Request["estado"] ?? string.Empty).Trim().ToLowerInvariant();
            string precioMinRaw = (context.Request["precioMin"] ?? string.Empty).Trim();
            string precioMaxRaw = (context.Request["precioMax"] ?? string.Empty).Trim();

            bool? activo = null;
            if (!string.IsNullOrWhiteSpace(estadoRaw))
            {
                if (estadoRaw == "activo") activo = true;
                else if (estadoRaw == "inactivo") activo = false;
                else
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "Filtro de estado inválido." }));
                    return;
                }
            }

            decimal? precioMin = null;
            if (!string.IsNullOrWhiteSpace(precioMinRaw))
            {
                decimal parsedMin;
                if (!decimal.TryParse(precioMinRaw, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out parsedMin) || parsedMin < 0m)
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "Filtro de precio mínimo inválido." }));
                    return;
                }
                precioMin = parsedMin;
            }

            decimal? precioMax = null;
            if (!string.IsNullOrWhiteSpace(precioMaxRaw))
            {
                decimal parsedMax;
                if (!decimal.TryParse(precioMaxRaw, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out parsedMax) || parsedMax < 0m)
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "Filtro de precio máximo inválido." }));
                    return;
                }
                precioMax = parsedMax;
            }

            if (precioMin.HasValue && precioMax.HasValue && precioMin.Value > precioMax.Value)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "El precio mínimo no puede ser mayor que el precio máximo." }));
                return;
            }

            int page;
            if (!int.TryParse(context.Request["page"], out page) || page <= 0) page = 1;

            int pageSize;
            if (!int.TryParse(context.Request["pageSize"], out pageSize) || pageSize <= 0) pageSize = 0;

            List<ServicioAdminListadoItem> serviciosFiltrados = RepositorioServicios.ObtenerServiciosAdminFiltrados(
                string.IsNullOrWhiteSpace(nombre) ? null : nombre,
                string.IsNullOrWhiteSpace(categoria) ? null : categoria,
                activo,
                precioMin,
                precioMax);

            int total = serviciosFiltrados.Count;
            List<ServicioAdminListadoItem> servicios = serviciosFiltrados;

            if (pageSize > 0)
            {
                int skip = (page - 1) * pageSize;
                if (skip < 0) skip = 0;
                if (skip >= total)
                {
                    page = 1;
                    skip = 0;
                }

                servicios = serviciosFiltrados.GetRange(skip, Math.Min(pageSize, Math.Max(0, total - skip)));
            }

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new
            {
                success = true,
                servicios = servicios,
                serviciosCompletos = pageSize > 0 ? serviciosFiltrados : servicios,
                total = total,
                page = page,
                pageSize = pageSize,
                mostrandoDesde = (pageSize > 0 && total > 0) ? (((page - 1) * pageSize) + 1) : (total > 0 ? 1 : 0),
                mostrandoHasta = (pageSize > 0 && total > 0) ? Math.Min(page * pageSize, total) : total
            }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cargar los servicios." }));
        }
    }
}

