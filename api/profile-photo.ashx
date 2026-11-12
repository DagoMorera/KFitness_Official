<%@ WebHandler Language="C#" Class="ProfilePhotoHandler" %>
using System;
using System.IO;
using System.Web;

public class ProfilePhotoHandler : IHttpHandler
{
    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        if (context.User == null || context.User.Identity == null || !context.User.Identity.IsAuthenticated)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 401;
            return;
        }

        var correo = context.User.Identity.Name;
        if (string.IsNullOrWhiteSpace(correo))
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 401;
            return;
        }

        var referencia = RepositorioUsuario.ObtenerFotoPerfilPorCorreo(correo);
        if (string.IsNullOrWhiteSpace(referencia))
        {
            context.Response.StatusCode = 404;
            return;
        }

        var nombreArchivo = Path.GetFileName(referencia);
        if (!string.Equals(nombreArchivo, referencia, StringComparison.Ordinal))
        {
            context.Response.StatusCode = 404;
            return;
        }

        // Buscar primero en carpeta privada (App_Data), luego en pública si es necesario
        var carpetaPrivada = context.Server.MapPath("~/App_Data/ProfilePhotos");
        var carpetaPublica = context.Server.MapPath("~/Content/Uploads/Profiles");
        var rutaPrivada = Path.Combine(carpetaPrivada, nombreArchivo);
        var rutaPublica = Path.Combine(carpetaPublica, nombreArchivo);

        string ruta = null;
        if (File.Exists(rutaPrivada)) ruta = rutaPrivada;
        else if (File.Exists(rutaPublica)) ruta = rutaPublica;

        if (ruta == null)
        {
            context.Response.StatusCode = 404;
            return;
        }

        var extension = Path.GetExtension(nombreArchivo);
        var contentType = "application/octet-stream";
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
}