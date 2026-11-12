<%@ WebHandler Language="C#" Class="MyRoutinesHandler" %>
using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Script.Serialization;

public class MyRoutinesHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;
        context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
        JavaScriptSerializer js = new JavaScriptSerializer { MaxJsonLength = 32 * 1024 * 1024 };

        try
        {
            if (context.User == null || context.User.Identity == null || !context.User.Identity.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                context.Response.Write(js.Serialize(new { success = false, message = "No autorizado." }));
                return;
            }

            string correo = (context.User.Identity.Name ?? string.Empty).Trim().ToLowerInvariant();
            Usuario usuario = RepositorioUsuario.ObtenerPorCorreo(correo);
            if (usuario == null || !usuario.Activo)
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

            if (!string.Equals(RepositorioUsuario.ObtenerNombreRolPorId(usuario.IdRol), "Cliente", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 403;
                context.Response.Write(js.Serialize(new { success = false, message = "Acceso exclusivo para clientes." }));
                return;
            }
            List<RutinaClienteAsignadaItem> rutinas = RepositorioRutinas.ObtenerRutinasAsignadasCliente(usuario.IdUsuario);

            List<object> planes = new List<object>();
            foreach (RutinaClienteAsignadaItem item in rutinas)
                planes.Add(new { asignacion = item, plan = RepositorioRutinasEditor.ObtenerDetalleRutina(item.IdRutina), ejecuciones = RepositorioRutinasProgreso.Obtener(usuario.IdUsuario, item.IdAsignacionRutina) });
            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new { success = true, rutinas = rutinas, planes = planes, csrfToken = AdminCsrfProtection.EnsureToken(context) }));
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
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cargar tus rutinas." }));
        }
    }
}
