
<%@ WebHandler Language="C#" Class="ForgotPasswordHandler" %>

using System;
using System.Diagnostics;
using System.Web;
using System.Web.Script.Serialization;

public class ForgotPasswordRequest
{
    public string correo { get; set; }
}

public class ForgotPasswordResponse
{
    public bool success { get; set; }
    public string message { get; set; }
}

public class ForgotPasswordHandler : IHttpHandler
{
    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        JavaScriptSerializer js = new JavaScriptSerializer();

        try
        {
            if (!string.Equals(
                context.Request.HttpMethod,
                "POST",
                StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(
                    new ForgotPasswordResponse
                    {
                        success = false,
                        message = "Método no permitido."
                    }));
                return;
            }

            string body;

            using (var reader = new System.IO.StreamReader(
                context.Request.InputStream))
            {
                body = reader.ReadToEnd();
            }

            ForgotPasswordRequest req = null;

            try
            {
                req = js.Deserialize<ForgotPasswordRequest>(body);
            }
            catch
            {
                req = null;
            }

            string correo = req == null
                ? string.Empty
                : (req.correo ?? string.Empty)
                    .Trim()
                    .ToLowerInvariant();

            if (!EsCorreoValido(correo))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(
                    new ForgotPasswordResponse
                    {
                        success = false,
                        message = "Ingresa un correo válido."
                    }));
                return;
            }

            // ==========================================
            // LÍMITE POR IP DESACTIVADO PARA PRUEBAS
            // Reactivar antes de producción definitiva.
            // ==========================================

            /*
            string ipOrigen = ObtenerIpOrigen(context);

            if (ForgotPasswordRateLimiter.ExcedioLimitePorIp(ipOrigen))
            {
                ResponderGenerico(context, js);
                return;
            }
            */

            Usuario usuario =
                RepositorioUsuario.ObtenerPorCorreo(correo);

            if (usuario == null || !usuario.Activo)
            {
                ResponderGenerico(context, js);
                return;
            }

            // ==========================================
            // LÍMITE POR USUARIO DESACTIVADO
            // PARA PRUEBAS
            // ==========================================

            /*
            DateTime desdeUtc =
                DateTime.UtcNow.AddMinutes(-15);

            int solicitudesRecientes =
                RepositorioUsuario
                    .ContarSolicitudesRecuperacionRecientes(
                        usuario.IdUsuario,
                        desdeUtc);

            if (solicitudesRecientes >= 3)
            {
                ResponderGenerico(context, js);
                return;
            }
            */

            RecoveryTokenPayload token =
                RecoveryTokenService.GenerarToken();

            bool tokenGuardado =
                RepositorioUsuario.CrearTokenRecuperacion(
                    usuario.IdUsuario,
                    token.TokenHash,
                    token.FechaExpiraUtc);

            if (!tokenGuardado)
            {
                Trace.TraceError(
                    "FORGOT_PASSWORD_ERROR: " +
                    "No se pudo guardar el token.");

                ResponderGenerico(context, js);
                return;
            }

            try
            {
                string enlace =
                    RecoveryTokenService
                        .ConstruirEnlaceRecuperacion(
                            token.TokenPlano);

                SmtpRecoveryMailer
                    .EnviarCorreoRecuperacion(
                        correo,
                        usuario.Nombre,
                        enlace);
            }
            catch (Exception ex)
            {
                Trace.TraceError(
                    "FORGOT_PASSWORD_SMTP_ERROR: " +
                    ex.ToString());

                try
                {
                    RepositorioUsuario
                        .EliminarTokenRecuperacionNoUsado(
                            token.TokenHash);
                }
                catch (Exception cleanupEx)
                {
                    Trace.TraceError(
                        "FORGOT_PASSWORD_TOKEN_CLEANUP_ERROR: " +
                        cleanupEx.ToString());
                }
            }

            ResponderGenerico(context, js);
        }
        catch (Exception ex)
        {
            Trace.TraceError(
                "FORGOT_PASSWORD_FATAL_ERROR: " +
                ex.ToString());

            context.Response.StatusCode = 500;

            context.Response.Write(js.Serialize(
                new ForgotPasswordResponse
                {
                    success = false,
                    message = "Error del servidor."
                }));
        }
    }

    private static void ResponderGenerico(
        HttpContext context,
        JavaScriptSerializer js)
    {
        context.Response.StatusCode = 200;

        context.Response.Write(js.Serialize(
            new ForgotPasswordResponse
            {
                success = true,
                message =
                    "Si el correo está registrado, " +
                    "recibirás un enlace para " +
                    "restablecer tu contraseña."
            }));
    }

    private static string ObtenerIpOrigen(
        HttpContext context)
    {
        if (context == null ||
            context.Request == null)
        {
            return string.Empty;
        }

        string ip =
            context.Request.UserHostAddress;

        if (string.IsNullOrWhiteSpace(ip))
        {
            ip = context.Request
                .ServerVariables["REMOTE_ADDR"];
        }

        if (string.IsNullOrWhiteSpace(ip))
        {
            return "unknown";
        }

        return ip.Trim();
    }

    private static bool EsCorreoValido(
        string correo)
    {
        if (string.IsNullOrWhiteSpace(correo))
        {
            return false;
        }

        try
        {
            System.Net.Mail.MailAddress m =
                new System.Net.Mail.MailAddress(correo);

            return string.Equals(
                m.Address,
                correo,
                StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }
}
