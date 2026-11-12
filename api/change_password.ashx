<%@ WebHandler Language="C#" Class="ChangePasswordHandler" %>
using System;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

public class ChangePasswordRequest
{
    public string actual { get; set; }
    public string nueva { get; set; }
    public string confirmar { get; set; }
}

public class ChangePasswordResponse
{
    public bool success { get; set; }
    public string message { get; set; }
}

public class ChangePasswordHandler : IHttpHandler
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
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "Método no permitido." }));
                return;
            }

            if (context.User == null || context.User.Identity == null || !context.User.Identity.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "No autorizado." }));
                return;
            }

            string correoSesion = context.User.Identity.Name;
            if (string.IsNullOrWhiteSpace(correoSesion))
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "No autorizado." }));
                return;
            }

            string body;
            using (StreamReader reader = new StreamReader(context.Request.InputStream))
            {
                body = reader.ReadToEnd();
            }

            ChangePasswordRequest req = js.Deserialize<ChangePasswordRequest>(body);
            if (req == null)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "Solicitud inválida." }));
                return;
            }

            string actual = req.actual == null ? string.Empty : req.actual.Trim();
            string nueva = req.nueva == null ? string.Empty : req.nueva.Trim();
            string confirmar = req.confirmar == null ? string.Empty : req.confirmar.Trim();

            if (string.IsNullOrWhiteSpace(actual) || string.IsNullOrWhiteSpace(nueva) || string.IsNullOrWhiteSpace(confirmar))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "Todos los campos son obligatorios." }));
                return;
            }

            if (!string.Equals(nueva, confirmar, StringComparison.Ordinal))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "Las contraseñas no coinciden." }));
                return;
            }

            if (string.Equals(actual, nueva, StringComparison.Ordinal))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "La nueva contraseña no puede ser igual a la actual." }));
                return;
            }

            if (!CumplePoliticaPassword(nueva))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "La nueva contraseña no cumple con los requisitos de seguridad." }));
                return;
            }

            string correo = correoSesion.Trim().ToLowerInvariant();
            Usuario usuario = RepositorioUsuario.ObtenerPorCorreo(correo);
            if (usuario == null)
            {
                context.Response.StatusCode = 404;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "Usuario no encontrado." }));
                return;
            }

            if (!usuario.Activo)
            {
                context.Response.StatusCode = 403;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "Cuenta inactiva." }));
                return;
            }

            bool actualCorrecta = PasswordHasher.Verify(actual, usuario.ClaveHash);
            if (!actualCorrecta)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "La contraseña actual no es correcta." }));
                return;
            }

            bool nuevaIgualAlHashActual = PasswordHasher.Verify(nueva, usuario.ClaveHash);
            if (nuevaIgualAlHashActual)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "La nueva contraseña no puede ser igual a la actual." }));
                return;
            }

            string nuevoHash = PasswordHasher.HashPassword(nueva);
            bool actualizado = RepositorioUsuario.ActualizarClavePorCorreo(correo, nuevoHash);
            if (!actualizado)
            {
                context.Response.StatusCode = 500;
                context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "No fue posible actualizar la contraseña." }));
                return;
            }

            context.Response.Write(js.Serialize(new ChangePasswordResponse { success = true, message = "Contraseña actualizada. Tu contraseña se cambió correctamente." }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new ChangePasswordResponse { success = false, message = "No fue posible actualizar la contraseña." }));
        }
    }

    private static bool CumplePoliticaPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password)) return false;
        if (password.Length < 8) return false;
        if (!TieneMayuscula(password)) return false;
        if (!TieneMinuscula(password)) return false;
        if (!TieneNumero(password)) return false;
        return true;
    }

    private static bool TieneMayuscula(string valor)
    {
        for (int i = 0; i < valor.Length; i++)
        {
            if (char.IsUpper(valor[i])) return true;
        }
        return false;
    }

    private static bool TieneMinuscula(string valor)
    {
        for (int i = 0; i < valor.Length; i++)
        {
            if (char.IsLower(valor[i])) return true;
        }
        return false;
    }

    private static bool TieneNumero(string valor)
    {
        for (int i = 0; i < valor.Length; i++)
        {
            if (char.IsDigit(valor[i])) return true;
        }
        return false;
    }
}
