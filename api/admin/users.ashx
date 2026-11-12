<%@ WebHandler Language="C#" Class="AdminUsersHandler" %>
using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Script.Serialization;

public class AdminUsersHandler : IHttpHandler
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

            string q = context.Request["q"];
            int pagina;
            if (!int.TryParse(context.Request["page"], out pagina)) pagina = 1;
            int tamanoPagina;
            if (!int.TryParse(context.Request["pageSize"], out tamanoPagina)) tamanoPagina = 10;

            AdminResumenUsuarios resumen = RepositorioAdmin.ObtenerResumenUsuarios();
            AdminUsuariosPaginados paginaUsuarios = RepositorioAdmin.ObtenerUsuarios(q, pagina, tamanoPagina);
            List<AdminRolItem> roles = RepositorioAdmin.ObtenerRolesActivos();
            bool identificacionDisponible = RepositorioAdmin.ExisteIdentificacionEnClientes();

            context.Response.Write(js.Serialize(new
            {
                success = true,
                resumen = new
                {
                    usuariosTotales = resumen.UsuariosTotales,
                    usuariosActivos = resumen.UsuariosActivos,
                    administradores = resumen.Administradores,
                    clientes = resumen.Clientes,
                    operadores = resumen.Operadores
                },
                paginacion = new
                {
                    pagina = paginaUsuarios.Pagina,
                    tamanoPagina = paginaUsuarios.TamanoPagina,
                    totalRegistros = paginaUsuarios.TotalRegistros,
                    totalPaginas = paginaUsuarios.TamanoPagina > 0
                        ? (int)Math.Ceiling((double)paginaUsuarios.TotalRegistros / (double)paginaUsuarios.TamanoPagina)
                        : 0
                },
                usuarios = paginaUsuarios.Usuarios,
                roles = roles,
                identificacionDisponible = identificacionDisponible,
                criterioBusqueda = identificacionDisponible
                    ? "nombre, correo o identificación"
                    : "nombre o correo"
            }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cargar los usuarios. Intenta nuevamente." }));
        }
    }
}
