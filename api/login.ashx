<%@ WebHandler Language="C#" Class="LoginHandler" %>
using System;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Security;

public class LoginRequest
{
    public string correo { get; set; }
    public string password { get; set; }
    public bool recordar { get; set; }
}

public class LoginResponse
{
    public bool success { get; set; }
    public string message { get; set; }
    public string nombre { get; set; }
    public string rol { get; set; }
}

public class LoginHandler : IHttpHandler
{
    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        try
        {
            string body;
            using (var reader = new StreamReader(context.Request.InputStream)) body = reader.ReadToEnd();

            var js = new JavaScriptSerializer();
            var req = js.Deserialize<LoginRequest>(body);

            if (req == null || string.IsNullOrWhiteSpace(req.correo) || string.IsNullOrWhiteSpace(req.password))
            {
                context.Response.Write(js.Serialize(new LoginResponse { success = false, message = "Credenciales inválidas." }));
                return;
            }

            var correo = req.correo.Trim().ToLowerInvariant();
            var usuario = RepositorioUsuario.ObtenerPorCorreo(correo);
            if (usuario == null)
            {
                // No revelar existencia del correo
                context.Response.Write(js.Serialize(new LoginResponse { success = false, message = "Credenciales inválidas." }));
                return;
            }

            if (!usuario.Activo)
            {
                context.Response.Write(js.Serialize(new LoginResponse { success = false, message = "Credenciales inválidas." }));
                return;
            }

            if (usuario.BloqueadoHasta.HasValue)
            {
                var ahora = DateTime.Now;
                if (usuario.BloqueadoHasta.Value > ahora)
                {
                    context.Response.Write(js.Serialize(new LoginResponse { success = false, message = "Cuenta temporalmente bloqueada. Intenta más tarde." }));
                    return;
                }
            }

            var ok = PasswordHasher.Verify(req.password, usuario.ClaveHash);
            if (!ok)
            {
                context.Response.Write(js.Serialize(new LoginResponse { success = false, message = "Credenciales inválidas." }));
                return;
            }

            // Autenticación exitosa: crear cookie FormsAuthentication
            FormsAuthentication.SetAuthCookie(correo, req.recordar);

            // Actualizar UltimoAcceso
            RepositorioUsuario.UpdateUltimoAcceso(usuario.IdUsuario);

            var rolNombre = RepositorioUsuario.ObtenerNombreRolPorId(usuario.IdRol);

            context.Response.Write(js.Serialize(new LoginResponse { success = true, message = "Inicio de sesión exitoso.", nombre = usuario.Nombre, rol = rolNombre }));
        }
        catch (Exception)
        {
            var js = new JavaScriptSerializer();
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new LoginResponse { success = false, message = "Error del servidor. Intenta nuevamente más tarde." }));
        }
    }
}
