using System;
using System.Web;

public class AdminAuthorizationResult
{
    public bool IsAuthenticated { get; set; }
    public bool UserExists { get; set; }
    public bool IsAdmin { get; set; }
    public Usuario Usuario { get; set; }
    public string RolNombre { get; set; }
}

public static class AdminAuthorization
{
    public static AdminAuthorizationResult ValidateCurrentUser(HttpContext context)
    {
        AdminAuthorizationResult result = new AdminAuthorizationResult();
        result.IsAuthenticated = false;
        result.UserExists = false;
        result.IsAdmin = false;
        result.Usuario = null;
        result.RolNombre = null;

        if (context == null)
        {
            return result;
        }

        if (context.User == null || context.User.Identity == null || !context.User.Identity.IsAuthenticated)
        {
            return result;
        }

        result.IsAuthenticated = true;

        string correo = context.User.Identity.Name;
        if (string.IsNullOrWhiteSpace(correo))
        {
            return result;
        }

        correo = correo.Trim().ToLowerInvariant();

        Usuario usuario = RepositorioUsuario.ObtenerPorCorreo(correo);
        if (usuario == null || !usuario.Activo)
        {
            return result;
        }

        result.UserExists = true;
        result.Usuario = usuario;

        string rolNombre = RepositorioUsuario.ObtenerNombreRolPorId(usuario.IdRol);
        result.RolNombre = rolNombre;

        if (!string.IsNullOrEmpty(rolNombre) && string.Equals(rolNombre, "Administrador", StringComparison.OrdinalIgnoreCase))
        {
            result.IsAdmin = true;
        }

        return result;
    }

    public static bool IsCurrentUserAdmin(HttpContext context)
    {
        AdminAuthorizationResult result = ValidateCurrentUser(context);
        return result.IsAuthenticated && result.UserExists && result.IsAdmin;
    }
}
