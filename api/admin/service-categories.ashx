<%@ WebHandler Language="C#" Class="AdminServiceCategoriesHandler" %>
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;

internal class ServiceCategoriesJsonSerializer
{
    public string Serialize(object value)
    {
        if (value == null) return "null";
        using (MemoryStream ms = new MemoryStream())
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(value.GetType());
            serializer.WriteObject(ms, value);
            return Encoding.UTF8.GetString(ms.ToArray());
        }
    }
}

[DataContract]
public class ServiceCategoriesResponseDto
{
    [DataMember(Name = "success")]
    public bool Success { get; set; }

    [DataMember(Name = "categorias", EmitDefaultValue = false)]
    public List<ServicioCategoriaItem> Categorias { get; set; }

    [DataMember(Name = "csrfToken", EmitDefaultValue = false)]
    public string CsrfToken { get; set; }

    [DataMember(Name = "message", EmitDefaultValue = false)]
    public string Message { get; set; }
}

public class AdminServiceCategoriesHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;
        ServiceCategoriesJsonSerializer js = new ServiceCategoriesJsonSerializer();

        try
        {
            AdminAuthorizationResult auth = AdminAuthorization.ValidateCurrentUser(context);

            if (!auth.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                context.Response.Write(js.Serialize(new ServiceCategoriesResponseDto
                {
                    Success = false,
                    Message = "No autenticado."
                }));
                return;
            }

            if (!auth.UserExists || !auth.IsAdmin)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                context.Response.Write(js.Serialize(new ServiceCategoriesResponseDto
                {
                    Success = false,
                    Message = "Acceso denegado."
                }));
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new ServiceCategoriesResponseDto
                {
                    Success = false,
                    Message = "Método no permitido."
                }));
                return;
            }

            string csrfToken = AdminCsrfProtection.EnsureToken(context);
            List<ServicioCategoriaItem> categorias = RepositorioServicios.ObtenerCategoriasValidasParaServicios();

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new ServiceCategoriesResponseDto
            {
                Success = true,
                Categorias = categorias,
                CsrfToken = csrfToken
            }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new ServiceCategoriesResponseDto
            {
                Success = false,
                Message = "No fue posible cargar las categorías."
            }));
        }
    }
}

