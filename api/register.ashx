<%@ WebHandler Language="C#" Class="RegisterHandler" %>
using System;
using System.IO;
using System.Globalization;
using System.Data.SqlClient;
using System.Web;
using System.Web.Script.Serialization;

public class RegisterRequest
{
    public string nombre { get; set; }
    public string apellido1 { get; set; }
    public string apellido2 { get; set; }
    public string correo { get; set; }
    public string telefono { get; set; }
    public string nacimiento { get; set; }
    public string password { get; set; }
    public bool aceptaTerminos { get; set; }
}

public class JsonResponse
{
    public bool success { get; set; }
    public string message { get; set; }
}

public class RegisterHandler : IHttpHandler
{
    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;
        if (context.Request.HttpMethod != "POST") { context.Response.StatusCode=405; return; }
        if (context.Request.ContentLength > 16384) { context.Response.StatusCode=413; return; }
        try
        {
            string body;
            using (var reader = new StreamReader(context.Request.InputStream)) body = reader.ReadToEnd();

            var js = new JavaScriptSerializer();
            var req = js.Deserialize<RegisterRequest>(body);

            if (req == null)
            {
                context.Response.Write(js.Serialize(new JsonResponse { success = false, message = "Solicitud inválida." }));
                return;
            }

            // Validaciones servidor mínimas
            if (string.IsNullOrWhiteSpace(req.nombre) || string.IsNullOrWhiteSpace(req.apellido1) || string.IsNullOrWhiteSpace(req.correo) || string.IsNullOrWhiteSpace(req.password) || string.IsNullOrWhiteSpace(req.telefono))
            {
                context.Response.Write(js.Serialize(new JsonResponse { success = false, message = "Faltan campos obligatorios." }));
                return;
            }

            DateTime nacimiento;
            if (!req.aceptaTerminos || !DateTime.TryParseExact(req.nacimiento, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out nacimiento)
                || nacimiento > RepositorioHorariosConsulta.AhoraCostaRica().Date)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new JsonResponse { success = false, message = "Revisá la fecha de nacimiento y aceptá los términos." }));
                return;
            }

            var correo = req.correo.Trim().ToLowerInvariant();

            if (req.password.Length < 8 || req.password.Length > 128 || !System.Text.RegularExpressions.Regex.IsMatch(req.password, "[A-Z]") || !System.Text.RegularExpressions.Regex.IsMatch(req.password, "[a-z]") || !System.Text.RegularExpressions.Regex.IsMatch(req.password, "[0-9]") || req.nombre.Length > 100 || req.apellido1.Length > 100 || (req.apellido2 != null && req.apellido2.Length > 100) || (req.telefono != null && req.telefono.Length > 30))
            { context.Response.StatusCode=400; context.Response.Write(js.Serialize(new JsonResponse { success=false,message="Revisa el tamaño de los campos. La contraseña requiere al menos 8 caracteres, mayúscula, minúscula y número." })); return; }
            try { if (new System.Net.Mail.MailAddress(correo).Address != correo || correo.Length>256) throw new FormatException(); }
            catch { context.Response.StatusCode=400; context.Response.Write(js.Serialize(new JsonResponse { success=false,message="Introduce un correo electrónico válido." })); return; }

            // Verificar si existe correo
            if (RepositorioUsuario.ExistePorCorreo(correo))
            {
                context.Response.Write(js.Serialize(new JsonResponse { success = false, message = "El correo ya está asociado a una cuenta." }));
                return;
            }

            // Obtener IdRol de Cliente
            var idRol = RepositorioUsuario.ObtenerIdRolPorNombre("Cliente");
            if (!idRol.HasValue)
            {
                context.Response.Write(js.Serialize(new JsonResponse { success = false, message = "Rol por defecto no configurado en el sistema." }));
                return;
            }

            // Hashear contraseña
            var hash = PasswordHasher.HashPassword(req.password);

            var usuario = new Usuario
            {
                Correo = correo,
                ClaveHash = hash,
                IdRol = idRol.Value,
                Nombre = req.nombre.Trim(),
                Apellido1 = req.apellido1.Trim(),
                Apellido2 = string.IsNullOrWhiteSpace(req.apellido2) ? null : req.apellido2.Trim(),
                Telefono = string.IsNullOrWhiteSpace(req.telefono) ? null : req.telefono.Trim()
            };

            var newId = RepositorioUsuario.CrearUsuario(usuario, nacimiento);
            if (newId > 0)
            {
                CorreosWeb.Notificar("registro:" + newId, correo, "Bienvenido a KFitness", "Tu cuenta fue creada correctamente. Ya puedes iniciar sesión y consultar nuestros servicios.");
                context.Response.Write(js.Serialize(new JsonResponse { success = true, message = "Registro exitoso." }));
                return;
            }

            context.Response.Write(js.Serialize(new JsonResponse { success = false, message = "No se pudo crear el usuario." }));
        }
        catch (SqlException ex)
        {
            bool correoDuplicado = ex.Number == 2601 || ex.Number == 2627;
            context.Response.StatusCode = correoDuplicado ? 409 : 500;
            context.Response.Write(new JavaScriptSerializer().Serialize(new JsonResponse
            {
                success = false,
                message = correoDuplicado ? "El correo ya está asociado a una cuenta." : "No fue posible registrar la cuenta."
            }));
        }
        catch (Exception)
        {
            // No devolver detalles internos
            var js = new JavaScriptSerializer();
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new JsonResponse { success = false, message = "Error del servidor. Intenta nuevamente más tarde." }));
        }
    }
}
