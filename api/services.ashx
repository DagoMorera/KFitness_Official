<%@ WebHandler Language="C#" Class="ServicesHandler" %>
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Web;

public class ServicioResponseItem
{
    public int idProducto { get; set; }
    public string nombre { get; set; }
    public string descripcion { get; set; }
    public decimal precio { get; set; }
    public string categoria { get; set; }
    public int ordenCatalogo { get; set; }
    public string imagenPrincipal { get; set; }
}

public class ServicesResponse
{
    public bool success { get; set; }
    public string message { get; set; }
    public List<ServicioResponseItem> servicios { get; set; }
    public ServicioResponseItem servicio { get; set; }
}

public class ServicesHandler : IHttpHandler
{
    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        var js = new System.Web.Script.Serialization.JavaScriptSerializer();

        try
        {
            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new ServicesResponse { success = false, message = "Método no permitido." }));
                return;
            }

            string idRaw = context.Request["id"];
            if (string.IsNullOrWhiteSpace(idRaw))
            {
                List<ServicioCatalogoItem> items = RepositorioServicios.ObtenerServiciosActivos();
                context.Response.StatusCode = 200;
                context.Response.Write(js.Serialize(new ServicesResponse
                {
                    success = true,
                    servicios = Mapear(items)
                }));
                return;
            }

            int idProducto;
            if (!int.TryParse(idRaw, out idProducto) || idProducto <= 0)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new ServicesResponse { success = false, message = "Identificador inválido." }));
                return;
            }

            ServicioCatalogoItem servicio = RepositorioServicios.ObtenerServicioActivoPorId(idProducto);
            if (servicio == null)
            {
                context.Response.StatusCode = 404;
                context.Response.Write(js.Serialize(new ServicesResponse { success = false, message = "Servicio no encontrado." }));
                return;
            }

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new ServicesResponse
            {
                success = true,
                servicio = Mapear(servicio)
            }));
        }
        catch (SqlException ex)
        {
            Trace.TraceError("SERVICES_DB_ERROR: " + ex.Number + " - " + ex.Message);
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new ServicesResponse { success = false, message = "Error de base de datos." }));
        }
        catch (Exception ex)
        {
            Trace.TraceError("SERVICES_FATAL_ERROR: " + ex.GetType().Name + " - " + ex.Message);
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new ServicesResponse { success = false, message = "Error del servidor." }));
        }
    }

    private static List<ServicioResponseItem> Mapear(List<ServicioCatalogoItem> items)
    {
        List<ServicioResponseItem> response = new List<ServicioResponseItem>();
        if (items == null)
            return response;

        foreach (ServicioCatalogoItem item in items)
        {
            response.Add(Mapear(item));
        }

        return response;
    }

    private static ServicioResponseItem Mapear(ServicioCatalogoItem item)
    {
        if (item == null) return null;

        return new ServicioResponseItem
        {
            idProducto = item.IdProducto,
            nombre = item.Nombre,
            descripcion = item.Descripcion,
            precio = item.Precio,
            categoria = item.Categoria,
            ordenCatalogo = item.OrdenCatalogo,
            imagenPrincipal = item.ImagenPrincipal
        };
    }
}