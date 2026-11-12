<%@ WebHandler Language="C#" Class="AdminRoutinesListHandler" %>
using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Script.Serialization;

public class AdminRoutinesListHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;
        context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
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

            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new { success = false, message = "Método no permitido." }));
                return;
            }

            string nombre = (context.Request["nombre"] ?? string.Empty).Trim();
            string nivel = (context.Request["nivel"] ?? string.Empty).Trim();
            string estadoRaw = (context.Request["estado"] ?? string.Empty).Trim().ToLowerInvariant();

            bool? activa = null;
            if (!string.IsNullOrWhiteSpace(estadoRaw))
            {
                if (estadoRaw == "activa") activa = true;
                else if (estadoRaw == "inactiva") activa = false;
                else
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "Filtro de estado inválido." }));
                    return;
                }
            }

            int pagina;
            if (!int.TryParse(context.Request["page"], out pagina) || pagina <= 0) pagina = 1;

            int tamanoPagina;
            if (!int.TryParse(context.Request["pageSize"], out tamanoPagina) || tamanoPagina <= 0) tamanoPagina = 10;

            RutinasEditorPaginadas data = RepositorioRutinasEditor.ObtenerRutinasAdminCards(
                string.IsNullOrWhiteSpace(nombre) ? null : nombre,
                string.IsNullOrWhiteSpace(nivel) ? null : nivel,
                activa,
                pagina,
                tamanoPagina);

            List<RutinaAdminListadoItem> rutinasDisponibles = RepositorioRutinas.ObtenerRutinasActivasDisponibles(null);
            string csrfToken = AdminCsrfProtection.EnsureToken(context);

            int totalPaginas = data.TamanoPagina > 0
                ? (int)Math.Ceiling((double)data.TotalRegistros / data.TamanoPagina)
                : 0;

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new
            {
                success = true,
                csrfToken = csrfToken,
                rutinas = data.Rutinas,
                rutinasDisponibles = rutinasDisponibles,
                paginacion = new
                {
                    pagina = data.Pagina,
                    tamanoPagina = data.TamanoPagina,
                    totalRegistros = data.TotalRegistros,
                    totalPaginas = totalPaginas,
                    mostrandoDesde = data.TotalRegistros > 0 ? (((data.Pagina - 1) * data.TamanoPagina) + 1) : 0,
                    mostrandoHasta = Math.Min(data.Pagina * data.TamanoPagina, data.TotalRegistros)
                }
            }));
        }
        catch (System.Data.SqlClient.SqlException ex)
        {
            context.Response.StatusCode = (ex.Number == 207 || ex.Number == 208) ? 503 : 500;
            context.Response.Write(js.Serialize(new { success = false, message = (ex.Number == 207 || ex.Number == 208) ? "La estructura de Rutinas no está actualizada. El administrador debe revisar las migraciones 024 y 025." : "No fue posible consultar las rutinas en la base de datos." }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible cargar las rutinas." }));
        }
    }
}
