<%@ WebHandler Language="C#" Class="ResetPasswordHandler" %>
using System;
using System.Web;
using System.Web.Script.Serialization;

public class ResetPasswordRequest
{
    public string token { get; set; }
    public string nueva { get; set; }
    public string confirmar { get; set; }
}

public class ResetPasswordResponse
{
    public bool success { get; set; }
    public string message { get; set; }
}

public class ResetPasswordHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        JavaScriptSerializer js = new JavaScriptSerializer();

        try
        {
            if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new ResetPasswordResponse { success = false, message = "Método no permitido." }));
                return;
            }

            string body = new System.IO.StreamReader(context.Request.InputStream).ReadToEnd();
            ResetPasswordRequest req = null;
            try
            {
                req = js.Deserialize<ResetPasswordRequest>(body);
            }
            catch
            {
                req = null;
            }

            if (req == null)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ResetPasswordResponse { success = false, message = "Solicitud inválida." }));
                return;
            }

            string token = req.token == null ? string.Empty : req.token.Trim();
            string nueva = req.nueva == null ? string.Empty : req.nueva.Trim();
            string confirmar = req.confirmar == null ? string.Empty : req.confirmar.Trim();

            if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(nueva) || string.IsNullOrWhiteSpace(confirmar))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ResetPasswordResponse { success = false, message = "Todos los campos son obligatorios." }));
                return;
            }

            if (!string.Equals(nueva, confirmar, StringComparison.Ordinal))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ResetPasswordResponse { success = false, message = "Las contraseñas no coinciden." }));
                return;
            }

            if (!CumplePoliticaPassword(nueva))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ResetPasswordResponse { success = false, message = "La nueva contraseña no cumple con los requisitos de seguridad." }));
                return;
            }

            string tokenHash = RecoveryTokenService.CalcularHashToken(token);
            string nuevoHash = PasswordHasher.HashPassword(nueva);
            ResultadoResetConToken resultado = RepositorioUsuario.RestablecerClavePorTokenHash(tokenHash, nuevoHash, DateTime.UtcNow);

            if (!resultado.Exitoso)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ResetPasswordResponse { success = false, message = MapearMensaje(resultado.Codigo) }));
                return;
            }

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new ResetPasswordResponse { success = true, message = "Contraseña restablecida correctamente." }));
        }
        catch
        {
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new ResetPasswordResponse { success = false, message = "Error del servidor." }));
        }
    }

    private static bool CumplePoliticaPassword(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor)) return false;
        if (valor.Length < 8) return false;
        if (!System.Text.RegularExpressions.Regex.IsMatch(valor, "[A-Z]")) return false;
        if (!System.Text.RegularExpressions.Regex.IsMatch(valor, "[a-z]")) return false;
        if (!System.Text.RegularExpressions.Regex.IsMatch(valor, "[0-9]")) return false;
        return true;
    }

    private static string MapearMensaje(string codigo)
    {
        if (string.Equals(codigo, "TOKEN_EXPIRADO", StringComparison.OrdinalIgnoreCase))
            return "El enlace de recuperación expiró.";
        if (string.Equals(codigo, "TOKEN_USADO", StringComparison.OrdinalIgnoreCase))
            return "El enlace de recuperación ya fue utilizado.";
        if (string.Equals(codigo, "TOKEN_CONFLICTO", StringComparison.OrdinalIgnoreCase))
            return "El enlace de recuperación ya no es válido.";
        return "El enlace de recuperación no es válido.";
    }
}