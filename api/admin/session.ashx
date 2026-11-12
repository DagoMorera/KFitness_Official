<%@ WebHandler Language="C#" Class="AdminSessionHandler" %>
using System;
using System.Web;
using System.Web.Script.Serialization;

public class AdminSessionHandler : IHttpHandler
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

            context.Response.Write(js.Serialize(new
            {
                success = true,
                nombre = auth.Usuario != null ? auth.Usuario.Nombre : "Administrador",
                correo = auth.Usuario != null ? auth.Usuario.Correo : string.Empty,
                rol = auth.RolNombre
            }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "Error interno." }));
        }
    }
}
