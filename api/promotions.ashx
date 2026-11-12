<%@ WebHandler Language="C#" Class="PromotionsHandler" %>
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Web;
using System.Web.Script.Serialization;

public class PromotionResponseItem
{
    public int idPromocion { get; set; }
    public string nombre { get; set; }
    public string descripcion { get; set; }
    public string tipoPromocion { get; set; }
    public decimal porcentajeDescuento { get; set; }
    public int? cantidadCompra { get; set; }
    public int? cantidadEntrega { get; set; }
    public string beneficio { get; set; }
    public string fechaInicio { get; set; }
    public string fechaFin { get; set; }
    public string servicio { get; set; }
    public int idProducto { get; set; }
    public decimal precioServicio { get; set; }
    public decimal precioPromocional { get; set; }
    public bool permiteReservar { get; set; }
    public string imagenPromocion { get; set; }
    public string imagenPromocionUrl { get; set; }
    public string imagenServicio { get; set; }
    public string clave { get; set; }
    public bool usoAgotado { get; set; }
    public bool soloConsulta { get; set; }
}

public class PromotionsResponse
{
    public bool success { get; set; }
    public string message { get; set; }
    public List<PromotionResponseItem> promociones { get; set; }
    public PromotionResponseItem promocion { get; set; }
}

public class PromotionsHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
        context.Response.Cache.SetNoStore();
        context.Response.Cache.SetRevalidation(HttpCacheRevalidation.AllCaches);
        context.Response.Cache.SetExpires(DateTime.UtcNow.AddSeconds(-1));
        context.Response.AppendHeader("Pragma", "no-cache");
        context.Response.AppendHeader("Expires", "0");
        JavaScriptSerializer js = new JavaScriptSerializer();

        try
        {
            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new PromotionsResponse { success = false, message = "Método no permitido." }));
                return;
            }

            var identidad = context.User == null ? null : context.User.Identity;
            Usuario cliente = identidad != null && identidad.IsAuthenticated && !string.IsNullOrWhiteSpace(identidad.Name)
                ? RepositorioUsuario.ObtenerPorCorreo(identidad.Name)
                : null;

            int idPromocion;
            string idRaw = context.Request["id"];
            if (!string.IsNullOrWhiteSpace(idRaw))
            {
                if (!int.TryParse(idRaw, out idPromocion) || idPromocion <= 0)
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new PromotionsResponse { success = false, message = "Identificador inválido." }));
                    return;
                }

                PromocionPublicaItem promo = RepositorioPromociones.ObtenerPromocionVigentePorId(idPromocion);
                if (promo == null)
                {
                    context.Response.StatusCode = 404;
                    context.Response.Write(js.Serialize(new PromotionsResponse { success = false, message = "Promoción no encontrada o fuera de vigencia." }));
                    return;
                }

                context.Response.StatusCode = 200;
                context.Response.Write(js.Serialize(new PromotionsResponse
                {
                    success = true,
                    promocion = Mapear(promo, cliente)
                }));
                return;
            }

            List<PromocionPublicaItem> promociones = RepositorioPromociones.ObtenerPromocionesVigentes();
            List<PromotionResponseItem> response = new List<PromotionResponseItem>();
            foreach (PromocionPublicaItem p in promociones)
            {
                response.Add(Mapear(p, cliente));
            }

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new PromotionsResponse
            {
                success = true,
                promociones = response,
                message = response.Count == 0 ? "No hay promociones vigentes en este momento." : null
            }));
        }
        catch
        {
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new PromotionsResponse { success = false, message = "No fue posible consultar promociones." }));
        }
    }

    private static PromotionResponseItem Mapear(PromocionPublicaItem p, Usuario cliente)
    {
        string tipo = (p.TipoPromocion ?? string.Empty).Trim().ToUpperInvariant();
        bool esDosPorUno = string.Equals(tipo, "DOS_POR_UNO", StringComparison.OrdinalIgnoreCase);
        bool esPorcentaje = string.Equals(tipo, "PORCENTAJE", StringComparison.OrdinalIgnoreCase);

        bool esValoracion = p.Motivo == "KFIT_PRIMERA_VALORACION";
        bool esPlan = p.Motivo == "KFIT_PLAN_MENSUAL";
        bool soloConsulta = tipo == "CONSULTA" || esPlan;
        bool usoAgotado = esValoracion && cliente != null && cliente.Activo
            && RepositorioReservas.ValoracionGratisYaUtilizada(p.IdPromocion, cliente.IdUsuario);

        decimal precioServicio = p.PrecioServicio < 0m ? 0m : p.PrecioServicio;
        decimal precioPromocional = precioServicio;
        if (!esDosPorUno)
        {
            decimal porcentaje = p.PorcentajeDescuento;
            if (porcentaje < 0m) porcentaje = 0m;
            if (porcentaje > 100m) porcentaje = 100m;
            precioPromocional = decimal.Round(precioServicio * (1m - (porcentaje / 100m)), 2, MidpointRounding.AwayFromZero);
            if (precioPromocional < 0m) precioPromocional = 0m;
        }

        return new PromotionResponseItem
        {
            idPromocion = p.IdPromocion,
            nombre = p.Nombre,
            descripcion = p.Descripcion,
            tipoPromocion = p.TipoPromocion,
            porcentajeDescuento = p.PorcentajeDescuento,
            cantidadCompra = p.CantidadCompra,
            cantidadEntrega = p.CantidadEntrega,
            beneficio = esValoracion ? "Valoración inicial sin costo" : soloConsulta ? "Consultá por este plan" : ObtenerBeneficio(p),
            fechaInicio = p.FechaInicio.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            fechaFin = esValoracion && p.FechaFin.Year == 9999 ? null : p.FechaFin.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            servicio = p.Servicio,
            idProducto = p.IdProducto,
            precioServicio = precioServicio,
            precioPromocional = precioPromocional,
            permiteReservar = (esDosPorUno || esPorcentaje) && !soloConsulta && !usoAgotado,
            usoAgotado = usoAgotado,
            soloConsulta = soloConsulta,
            clave = esValoracion ? "primera-valoracion-gratuita" : esPlan ? "plan-mensual" : null,
            imagenPromocion = p.ImagenPromocion,
            imagenPromocionUrl = string.IsNullOrWhiteSpace(p.ImagenPromocion)
                ? null
                : "/api/promotion-image.ashx?v=" + HttpUtility.UrlEncode(p.ImagenPromocion),
            imagenServicio = p.ImagenServicio
        };
    }

    private static string ObtenerBeneficio(PromocionPublicaItem p)
    {
        if (p == null) return string.Empty;
        if (string.Equals(p.TipoPromocion, "DOS_POR_UNO", StringComparison.OrdinalIgnoreCase))
        {
            int compra = p.CantidadCompra.HasValue ? p.CantidadCompra.Value : 1;
            int entrega = p.CantidadEntrega.HasValue ? p.CantidadEntrega.Value : 2;
            return entrega + " clases por el precio de " + compra;
        }

        return p.PorcentajeDescuento.ToString("0.##", CultureInfo.InvariantCulture) + "% de descuento";
    }
}
