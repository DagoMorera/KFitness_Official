<%@ WebHandler Language="C#" Class="AdminUserDetailHandler" %>
using System;
using System.Web;
using System.Web.Script.Serialization;

public class AdminUserDetailHandler : IHttpHandler
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

            int idUsuario;
            if (!int.TryParse(context.Request["idUsuario"], out idUsuario) || idUsuario <= 0)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Parámetros inválidos." }));
                return;
            }

            AdminUsuarioDetalle detalle = RepositorioAdmin.ObtenerUsuarioDetalle(idUsuario);
            if (detalle == null)
            {
                context.Response.StatusCode = 404;
                context.Response.Write(js.Serialize(new { success = false, message = "Usuario no encontrado." }));
                return;
            }

            context.Response.Write(js.Serialize(new
            {
                success = true,
                usuario = new
                {
                    idUsuario = detalle.IdUsuario,
                    nombre = detalle.Nombre,
                    apellido1 = detalle.Apellido1,
                    apellido2 = detalle.Apellido2,
                    nombreCompleto = detalle.NombreCompleto,
                    correo = detalle.Correo,
                    rol = detalle.Rol,
                    idRol = detalle.IdRol,
                    activo = detalle.Activo,
                    telefono = detalle.Telefono,
                    fotoPerfil = detalle.FotoPerfil,
                    esPropiaCuentaAdmin = auth.Usuario != null && auth.Usuario.IdUsuario == detalle.IdUsuario && string.Equals(detalle.Rol, "Administrador", StringComparison.OrdinalIgnoreCase),
                    esCuentaAdministrativaProtegida = auth.Usuario != null && auth.Usuario.IdUsuario == detalle.IdUsuario && string.Equals(detalle.Rol, "Administrador", StringComparison.OrdinalIgnoreCase)
                },
                identificacionDisponible = RepositorioAdmin.ExisteIdentificacionEnClientes()
            }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cargar el detalle del usuario." }));
        }
    }
}
