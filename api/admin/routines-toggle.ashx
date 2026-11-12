<%@ WebHandler Language="C#" Class="AdminRoutinesToggleHandler" %>
using System;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

public class AdminRoutineToggleRequest
{
    public object idRutina { get; set; }
    public object activa { get; set; }
}

public class AdminRoutinesToggleHandler : IHttpHandler
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

            if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new { success = false, message = "Método no permitido." }));
                return;
            }

            if (!AdminCsrfProtection.EsSolicitudPostValida(context))
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                context.Response.Write(js.Serialize(new { success = false, message = "Token CSRF inválido o origen no permitido." }));
                return;
            }

            string body = new StreamReader(context.Request.InputStream).ReadToEnd();
            AdminRoutineToggleRequest req = null;
            try { req = js.Deserialize<AdminRoutineToggleRequest>(body); } catch { req = null; }

            int idRutina;
            bool activa;
            if (req == null || !TryInt(req.idRutina, out idRutina) || idRutina <= 0 || !TryBool(req.activa, out activa))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Solicitud inválida." }));
                return;
            }

            int idActor = auth.Usuario != null ? auth.Usuario.IdUsuario : 0;
            OperacionRutinaResultado res = RepositorioRutinas.CambiarEstadoRutina(idActor, idRutina, activa);

            if (!res.Success)
            {
                context.Response.StatusCode = string.Equals(res.CodigoError, "RUTINA_NO_EXISTE", StringComparison.OrdinalIgnoreCase) ? 404 : 400;
                context.Response.Write(js.Serialize(new { success = false, message = res.Message ?? "No fue posible cambiar el estado de la rutina.", codigoError = res.CodigoError }));
                return;
            }

            RepositorioAuditoria.Registrar(new RegistrarAuditoriaRequest { Modulo="Rutinas", Accion="CambiarEstado", IdUsuario=idActor, Entidad="rut.Rutinas", IdRegistro=idRutina.ToString(), Descripcion="Cambio del estado de una rutina." });
            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new { success = true, message = res.Message, idRutina = res.IdRutina, activa = activa }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cambiar el estado de la rutina." }));
        }
    }

    private static bool TryInt(object value, out int parsed)
    {
        parsed = 0;
        if (value == null) return false;
        if (value is int) { parsed = (int)value; return true; }
        return int.TryParse(Convert.ToString(value), out parsed);
    }

    private static bool TryBool(object value, out bool parsed)
    {
        parsed = false;
        if (value == null) return false;
        if (value is bool) { parsed = (bool)value; return true; }
        return bool.TryParse(Convert.ToString(value), out parsed);
    }
}
