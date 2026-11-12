<%@ WebHandler Language="C#" Class="AdminServiceDetailHandler" %>
using System;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;

internal class ServiceDetailJsonSerializer
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
public class AdminServiceDetailResponseDto
{
    [DataMember(Name = "success")]
    public bool success { get; set; }

    [DataMember(Name = "message", EmitDefaultValue = false)]
    public string message { get; set; }

    [DataMember(Name = "servicio", EmitDefaultValue = false)]
    public ServicioAdminDetalleItem servicio { get; set; }
}

public class AdminServiceDetailHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;
        ServiceDetailJsonSerializer js = new ServiceDetailJsonSerializer();

        try
        {
            AdminAuthorizationResult auth = AdminAuthorization.ValidateCurrentUser(context);

            if (!auth.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                context.Response.Write(js.Serialize(new AdminServiceDetailResponseDto { success = false, message = "No autenticado." }));
                return;
            }

            if (!auth.UserExists || !auth.IsAdmin)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                context.Response.Write(js.Serialize(new AdminServiceDetailResponseDto { success = false, message = "Acceso denegado." }));
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new AdminServiceDetailResponseDto { success = false, message = "Método no permitido." }));
                return;
            }

            int idProducto;
            if (!int.TryParse(context.Request.QueryString["id"], out idProducto) || idProducto <= 0)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new AdminServiceDetailResponseDto { success = false, message = "El identificador del servicio no es válido." }));
                return;
            }

            ServicioAdminDetalleItem servicio = RepositorioServicios.ObtenerServicioAdminPorId(idProducto);
            if (servicio == null)
            {
                context.Response.StatusCode = 404;
                context.Response.Write(js.Serialize(new AdminServiceDetailResponseDto { success = false, message = "Servicio no encontrado." }));
                return;
            }

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new AdminServiceDetailResponseDto
            {
                success = true,
                servicio = servicio
            }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new AdminServiceDetailResponseDto { success = false, message = "No fue posible cargar el detalle del servicio." }));
        }
    }
}

