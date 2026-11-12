<%@ WebHandler Language="C#" Class="AdminSchedulesToggleHandler" %>
using System;
using System.Globalization;
using System.IO;
using System.Web;
using JavaScriptSerializer = System.Web.Script.Serialization.JavaScriptSerializer;

public class AdminScheduleToggleRequest
{
    public object idHorarioServicio { get; set; }
    public object activo { get; set; }
}

public class AdminSchedulesToggleHandler : IHttpHandler
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

            string body;
            using (StreamReader sr = new StreamReader(context.Request.InputStream))
            {
                body = sr.ReadToEnd();
            }

            AdminScheduleToggleRequest req = js.Deserialize<AdminScheduleToggleRequest>(body ?? string.Empty);
            if (req == null)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Solicitud inválida." }));
                return;
            }

            int idHorarioServicio;
            if (!TryToInt(req.idHorarioServicio, out idHorarioServicio) || idHorarioServicio <= 0)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Horario inválido." }));
                return;
            }

            bool activo;
            if (!TryToBool(req.activo, out activo))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Estado inválido." }));
                return;
            }

            int idActor = auth.Usuario != null ? auth.Usuario.IdUsuario : 0;
            GuardarHorarioAdminResultado result = RepositorioHorariosAdmin.CambiarEstadoHorario(idHorarioServicio, activo, idActor);

            if (!result.Success)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, code = result.CodigoError, message = result.Message }));
                return;
            }

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new { success = true, idHorarioServicio = result.IdHorarioServicio, message = result.Message }));
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cambiar el estado del horario." }));
        }
    }

    private static bool TryToInt(object input, out int value)
    {
        value = 0;
        if (input == null) return false;
        return int.TryParse(Convert.ToString(input, CultureInfo.InvariantCulture), NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
    }

    private static bool TryToBool(object input, out bool value)
    {
        value = false;
        if (input == null) return false;

        string text = Convert.ToString(input, CultureInfo.InvariantCulture);
        if (string.IsNullOrWhiteSpace(text)) return false;

        text = text.Trim();
        if (text == "1") { value = true; return true; }
        if (text == "0") { value = false; return true; }

        bool parsed;
        if (bool.TryParse(text, out parsed))
        {
            value = parsed;
            return true;
        }

        return false;
    }
}
