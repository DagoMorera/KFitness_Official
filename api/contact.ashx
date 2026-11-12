<%@ WebHandler Language="C#" Class="ContactHandler" %>
using System;
using System.Linq;
using System.Web;

public class ContactHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        WebJson.Init(context);
        context.Response.Cache.SetNoStore();
        try
        {
            if (context.Request.HttpMethod == "GET")
            {
                Usuario cliente = ObtenerCliente(context);
                WebJson.Send(context, 200, new
                {
                    success = true,
                    csrfToken = AdminCsrfProtection.EnsureToken(context),
                    requestKey = Guid.NewGuid().ToString(),
                    cliente = cliente == null ? null : new { nombre = NombreCompleto(cliente), correo = cliente.Correo }
                });
                return;
            }

            if (!WebJson.Post(context)) return;
            ConsultaWeb consulta = WebJson.Read<ConsultaWeb>(context);
            Usuario usuario = ObtenerCliente(context);
            if (usuario != null && consulta != null)
            {
                consulta.Nombre = NombreCompleto(usuario);
                consulta.Correo = usuario.Correo;
                consulta.Telefono = usuario.Telefono;
            }
            long id = RepositorioConsultasWeb.Crear(consulta, usuario == null);
            WebJson.Send(context, 201, new { success = true, id = id, message = "Tu consulta quedó registrada. Nos comunicaremos con vos." });
        }
        catch (InvalidOperationException ex)
        {
            WebJson.Send(context, 400, new { success = false, message = ex.Message });
        }
        catch
        {
            WebJson.Send(context, 500, new { success = false, message = "No fue posible registrar la consulta. Conserva el mensaje y reintenta." });
        }
    }

    private static Usuario ObtenerCliente(HttpContext context)
    {
        var identidad = context.User == null ? null : context.User.Identity;
        if (identidad == null || !identidad.IsAuthenticated || string.IsNullOrWhiteSpace(identidad.Name))
            return null;

        Usuario usuario = RepositorioUsuario.ObtenerPorCorreo(identidad.Name);
        return usuario != null && usuario.Activo
            && string.Equals(RepositorioUsuario.ObtenerNombreRolPorId(usuario.IdRol), "Cliente", StringComparison.OrdinalIgnoreCase)
            ? usuario : null;
    }

    private static string NombreCompleto(Usuario usuario)
    {
        return string.Join(" ", new[] { usuario.Nombre, usuario.Apellido1, usuario.Apellido2 }
            .Where(valor => !string.IsNullOrWhiteSpace(valor)).Select(valor => valor.Trim()));
    }
}
