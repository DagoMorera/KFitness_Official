<%@ WebHandler Language="C#" Class="AdminPromotionsDataHandler" %>
using System;
using System.Web;
using System.Web.Script.Serialization;

public class AdminPromotionsDataHandler : IHttpHandler
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

            string csrfToken = AdminCsrfProtection.EnsureToken(context);
            bool imagenPromocionDisponible = RepositorioPromociones.ExisteColumnaImagenPromocion();
            var servicios = RepositorioPromociones.ObtenerServiciosPromocionables();
            var promociones = RepositorioPromociones.ObtenerPromocionesAdmin();

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new
            {
                success = true,
                csrfToken = csrfToken,
                servicios = servicios,
                promociones = promociones,
                imagenPromocionDisponible = imagenPromocionDisponible
            }));
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cargar la gestión de promociones." }));
        }
    }
}
