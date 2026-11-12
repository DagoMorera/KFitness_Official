<%@ WebHandler Language="C#" Class="AdminUserPhotoHandler" %>
using System;
using System.IO;
using System.Web;

public class AdminUserPhotoHandler : IHttpHandler
{
    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        try
        {
            AdminAuthorizationResult auth = AdminAuthorization.ValidateCurrentUser(context);

            if (!auth.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                return;
            }

            if (!auth.UserExists || !auth.IsAdmin)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                return;
            }

            int idUsuario;
            if (!int.TryParse(context.Request["idUsuario"], out idUsuario) || idUsuario <= 0)
            {
                context.Response.StatusCode = 400;
                return;
            }

            string referencia = RepositorioAdmin.ObtenerFotoPerfilUsuario(idUsuario);
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

            string carpetaPrivada = context.Server.MapPath("~/App_Data/ProfilePhotos");
            string carpetaPublica = context.Server.MapPath("~/Content/Uploads/Profiles");
            string rutaPrivada = Path.Combine(carpetaPrivada, nombreArchivo);
            string rutaPublica = Path.Combine(carpetaPublica, nombreArchivo);

            string ruta = null;
            if (File.Exists(rutaPrivada)) ruta = rutaPrivada;
            else if (File.Exists(rutaPublica)) ruta = rutaPublica;

            if (ruta == null)
            {
                context.Response.StatusCode = 404;
                return;
            }

            string extension = Path.GetExtension(nombreArchivo);
            string contentType = "application/octet-stream";
            if (string.Equals(extension, ".jpg", StringComparison.OrdinalIgnoreCase) || string.Equals(extension, ".jpeg", StringComparison.OrdinalIgnoreCase))
            {
                contentType = "image/jpeg";
            }
            else if (string.Equals(extension, ".png", StringComparison.OrdinalIgnoreCase))
            {
                contentType = "image/png";
            }

            context.Response.ContentType = contentType;
            context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
            context.Response.Cache.SetNoStore();
            context.Response.TransmitFile(ruta);
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
        }
    }
}
