<%@ WebHandler Language="C#" Class="AdminScheduleServicesHandler" %>
using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Script.Serialization;

public class AdminScheduleServicesHandler : IHttpHandler
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

            string csrfToken = AdminCsrfProtection.EnsureToken(context);
            List<ServicioCatalogoItem> servicios = RepositorioServicios.ObtenerServiciosActivos();

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new
            {
                success = true,
                csrfToken = csrfToken,
                servicios = servicios
            }));
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cargar los servicios para horarios." }));
        }
    }
}
