<%@ WebHandler Language="C#" Class="AdminUserRoleHandler" %>
using System;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

public class AdminUserRoleRequest
{
    public int idUsuario { get; set; }
    public int idRol { get; set; }
}

public class AdminUserRoleHandler : IHttpHandler
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

            string body;
            using (StreamReader reader = new StreamReader(context.Request.InputStream))
            {
                body = reader.ReadToEnd();
            }

            AdminUserRoleRequest req = js.Deserialize<AdminUserRoleRequest>(body);
            if (req == null || req.idUsuario <= 0 || req.idRol <= 0)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Solicitud inválida." }));
                return;
            }

            string codigoError;
            bool ok = RepositorioAdmin.CambiarRolUsuario(auth.Usuario.IdUsuario, req.idUsuario, req.idRol, out codigoError);

            if (!ok)
            {
                if (string.Equals(codigoError, "AUTO_REVOKE_NO_PERMITIDO", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new
                    {
                        success = false,
                        message = "Tu cuenta administrativa. Por seguridad, no puedes retirar tus propios permisos de Administrador."
                    }));
                    return;
                }

                if (string.Equals(codigoError, "USUARIO_NO_EXISTE", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = 404;
                    context.Response.Write(js.Serialize(new { success = false, message = "Usuario no encontrado." }));
                    return;
                }

                if (string.Equals(codigoError, "ROL_INVALIDO", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "El rol seleccionado no es válido." }));
                    return;
                }

                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "No fue posible actualizar el rol." }));
                return;
            }

            context.Response.Write(js.Serialize(new { success = true, message = "Rol actualizado correctamente." }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible actualizar el rol." }));
        }
    }
}
