<%@ WebHandler Language="C#" Class="RoutineMediaHandler" %>
using System;
using System.IO;
using System.Data.SqlClient;
using System.Web;

public class RoutineMediaHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.SuppressFormsAuthenticationRedirect = true;
        context.Response.TrySkipIisCustomErrors = true;
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        try
        {
            AdminAuthorizationResult auth = AdminAuthorization.ValidateCurrentUser(context);
            if (!auth.IsAuthenticated) { context.Response.StatusCode=401; return; }
            if (!auth.UserExists) { context.Response.StatusCode=403; return; }
            if (context.Request.HttpMethod != "GET" && context.Request.HttpMethod != "HEAD") { context.Response.StatusCode=405; return; }
            string referencia = (context.Request.QueryString["v"] ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(referencia))
            {
                context.Response.StatusCode = 404;
                return;
            }

            string nombreArchivo = Path.GetFileName(referencia);
            if (!string.Equals(nombreArchivo, referencia, StringComparison.Ordinal))
            {
                context.Response.StatusCode = 404;
                return;
            }

            string extension = (Path.GetExtension(nombreArchivo) ?? string.Empty).Trim().ToLowerInvariant();
            string contentType;
            if (extension == ".jpg" || extension == ".jpeg") contentType = "image/jpeg";
            else if (extension == ".png") contentType = "image/png";
            else if (extension == ".webp") contentType = "image/webp";
            else
            {
                context.Response.StatusCode = 404;
                return;
            }

            if (!auth.IsAdmin)
            {
                using (SqlConnection c = DbHelper.GetConnection())
                using (SqlCommand q = new SqlCommand(@"SELECT COUNT(1) FROM rut.AsignacionesRutina a
JOIN rut.Rutinas r ON r.IdRutina=a.IdRutina
WHERE a.IdUsuario=@u AND (r.PortadaReferencia=@v OR EXISTS
(SELECT 1 FROM rut.RutinaSesiones s JOIN rut.RutinaEjercicios e ON e.IdSesionRutina=s.IdSesionRutina
WHERE s.IdRutina=r.IdRutina AND e.FotoReferencia=@v))", c))
                {
                    q.Parameters.AddWithValue("@u", auth.Usuario.IdUsuario);
                    q.Parameters.AddWithValue("@v", nombreArchivo);
                    c.Open();
                    if (Convert.ToInt32(q.ExecuteScalar()) == 0) { context.Response.StatusCode=404; return; }
                }
            }
            string carpeta = context.Server.MapPath("~/App_Data/RoutineMedia");
            string ruta = Path.Combine(carpeta, nombreArchivo);
            if (!File.Exists(ruta))
            {
                context.Response.StatusCode = 404;
                return;
            }

            context.Response.ContentType = contentType;
            context.Response.Cache.SetCacheability(HttpCacheability.Private);
            context.Response.Cache.SetMaxAge(TimeSpan.FromMinutes(5));
            context.Response.TransmitFile(ruta);
        }
        catch
        {
            context.Response.StatusCode = 404;
        }
    }
}
