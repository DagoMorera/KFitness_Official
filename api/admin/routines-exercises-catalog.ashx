<%@ WebHandler Language="C#" Class="AdminRoutinesExercisesCatalogHandler" %>
using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

public class AdminRoutinesExerciseCreateRequest
{
    public string nombre { get; set; }
    public string grupoMuscular { get; set; }
    public string implemento { get; set; }
    public string tecnicaInstrucciones { get; set; }
    public string erroresComunes { get; set; }
    public string imagenReferencia { get; set; }
    public string videoUrl { get; set; }
}

public class AdminRoutinesExercisesCatalogHandler : IHttpHandler
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

            if (string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                string q = (context.Request["q"] ?? string.Empty).Trim();
                int maximo;
                if (!int.TryParse(context.Request["max"], out maximo) || maximo <= 0) maximo = 30;
                List<CatalogoEjercicioItem> items = RepositorioRutinasEditor.BuscarCatalogoEjercicios(q, maximo);
                context.Response.StatusCode = 200;
                context.Response.Write(js.Serialize(new { success = true, ejercicios = items }));
                return;
            }

            if (string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                if (!AdminCsrfProtection.EsSolicitudPostValida(context))
                {
                    context.Response.SuppressFormsAuthenticationRedirect = true;
                    context.Response.StatusCode = 403;
                    context.Response.Write(js.Serialize(new { success = false, message = "Token CSRF inválido o origen no permitido." }));
                    return;
                }

                string body = new StreamReader(context.Request.InputStream).ReadToEnd();
                AdminRoutinesExerciseCreateRequest req = null;
                try { req = js.Deserialize<AdminRoutinesExerciseCreateRequest>(body); } catch { req = null; }

                if (req == null)
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "Solicitud inválida." }));
                    return;
                }

                CatalogoEjercicioGuardarPayload payload = new CatalogoEjercicioGuardarPayload
                {
                    Nombre = req.nombre,
                    GrupoMuscular = req.grupoMuscular,
                    Implemento = req.implemento,
                    TecnicaInstrucciones = req.tecnicaInstrucciones,
                    ErroresComunes = req.erroresComunes,
                    ImagenReferencia = req.imagenReferencia,
                    VideoUrl = req.videoUrl
                };

                int idActor = auth.Usuario != null ? auth.Usuario.IdUsuario : 0;
                CatalogoEjercicioGuardarResultado res = RepositorioRutinasEditor.CrearEjercicioCatalogo(idActor, payload);
                if (!res.Success)
                {
                    context.Response.StatusCode = string.Equals(res.CodigoError, "EJERCICIO_DUPLICADO", StringComparison.OrdinalIgnoreCase) ? 409 : 400;
                    context.Response.Write(js.Serialize(new { success = false, message = res.Message ?? "No fue posible crear el ejercicio.", codigoError = res.CodigoError }));
                    return;
                }

                context.Response.StatusCode = 201;
                context.Response.Write(js.Serialize(new { success = true, message = res.Message, idEjercicio = res.IdEjercicio }));
                return;
            }

            context.Response.StatusCode = 405;
            context.Response.Write(js.Serialize(new { success = false, message = "Método no permitido." }));
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible procesar el catálogo de ejercicios." }));
        }
    }
}
