<%@ WebHandler Language="C#" Class="AdminRoutinesDetailHandler" %>
using System;
using System.Web;
using System.Web.Script.Serialization;

public class AdminRoutinesDetailHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;
        context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
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

            int idRutina;
            if (!int.TryParse(context.Request.QueryString["id"], out idRutina) || idRutina <= 0)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "El identificador de rutina no es válido." }));
                return;
            }

            RutinaEditorDetalle rutina = RepositorioRutinasEditor.ObtenerDetalleRutina(idRutina);
            if (rutina == null)
            {
                context.Response.StatusCode = 404;
                context.Response.Write(js.Serialize(new { success = false, message = "Rutina no encontrada." }));
                return;
            }

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new { success = true, rutina = rutina }));
        }
        catch (System.Data.SqlClient.SqlException ex)
        {
            context.Response.StatusCode = (ex.Number == 207 || ex.Number == 208) ? 503 : 500;
            context.Response.Write(js.Serialize(new { success = false, message = (ex.Number == 207 || ex.Number == 208) ? "La estructura de Rutinas no está actualizada. El administrador debe revisar las migraciones 024 y 025." : "No fue posible consultar las rutinas en la base de datos." }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cargar el detalle de la rutina." }));
        }
    }
}
