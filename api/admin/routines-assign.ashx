<%@ WebHandler Language="C#" Class="AdminRoutinesAssignHandler" %>
using System;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

public class AdminRoutineAssignRequest
{
    public object idRutina { get; set; }
    public object idUsuario { get; set; }
}

public class AdminRoutinesAssignHandler : IHttpHandler
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
            AdminRoutineAssignRequest req = null;
            try { req = js.Deserialize<AdminRoutineAssignRequest>(body); } catch { req = null; }

            int idRutina;
            int idUsuario;
            if (req == null || !TryInt(req.idRutina, out idRutina) || idRutina <= 0 || !TryInt(req.idUsuario, out idUsuario) || idUsuario <= 0)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Solicitud inválida." }));
                return;
            }

            int idActor = auth.Usuario != null ? auth.Usuario.IdUsuario : 0;
            AsignacionRutinaResultado res = RepositorioRutinas.AsignarRutina(idActor, idRutina, idUsuario);

            if (!res.Success)
            {
                context.Response.StatusCode = string.Equals(res.CodigoError, "ASIGNACION_DUPLICADA", StringComparison.OrdinalIgnoreCase) ? 409 : 400;
                context.Response.Write(js.Serialize(new { success = false, message = res.Message ?? "No fue posible asignar la rutina.", codigoError = res.CodigoError }));
                return;
            }

            RepositorioAuditoria.Registrar(new RegistrarAuditoriaRequest { Modulo="Rutinas", Accion="Asignar", IdUsuario=idActor, Entidad="rut.Rutinas", IdRegistro=idRutina.ToString(), Descripcion="Asignación de rutina a cliente." });
            context.Response.StatusCode = 201;
            context.Response.Write(js.Serialize(new { success = true, message = res.Message, idAsignacionRutina = res.IdAsignacionRutina }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible asignar la rutina." }));
        }
    }

    private static bool TryInt(object value, out int parsed)
    {
        parsed = 0;
        if (value == null) return false;
        if (value is int) { parsed = (int)value; return true; }
        return int.TryParse(Convert.ToString(value), out parsed);
    }
}
