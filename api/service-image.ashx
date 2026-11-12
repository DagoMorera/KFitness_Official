<%@ WebHandler Language="C#" Class="ServiceImageHandler" %>
using System;
using System.IO;
using System.Web;

public class ServiceImageHandler : IHttpHandler
{
    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        try
        {
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

            string extension = Path.GetExtension(nombreArchivo);
            if (string.IsNullOrWhiteSpace(extension))
            {
                context.Response.StatusCode = 404;
                return;
            }

            extension = extension.Trim().ToLowerInvariant();
            string contentType;
            if (extension == ".jpg" || extension == ".jpeg")
            {
                contentType = "image/jpeg";
            }
            else if (extension == ".png")
            {
                contentType = "image/png";
            }
            else if (extension == ".webp")
            {
                contentType = "image/webp";
            }
            else
            {
                context.Response.StatusCode = 404;
                return;
            }

            string carpeta = context.Server.MapPath("~/App_Data/ServiceImages");
            string ruta = Path.Combine(carpeta, nombreArchivo);
            if (!File.Exists(ruta))
            {
                context.Response.StatusCode = 404;
                return;
            }

            context.Response.ContentType = contentType;
            context.Response.Cache.SetCacheability(HttpCacheability.Public);
            context.Response.Cache.SetMaxAge(TimeSpan.FromHours(12));
            context.Response.TransmitFile(ruta);
        }
        catch
        {
            context.Response.StatusCode = 404;
        }
    }
}
