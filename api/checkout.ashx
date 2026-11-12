<%@ WebHandler Language="C#" Class="CheckoutHandler" %>
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;

public class CheckoutRequest
{
    public string action { get; set; }
    public List<CheckoutRequestItem> items { get; set; }
    public CheckoutPaymentRequest payment { get; set; }
}

public class CheckoutRequestItem
{
    public object idProducto { get; set; }
    public object idPromocion { get; set; }
    public List<int> idsHorarioServicio { get; set; }
    public string observaciones { get; set; }
}

public class CheckoutPaymentRequest
{
    public string tokenIdempotencia { get; set; }
    public bool simularAprobado { get; set; }
}

public class CheckoutResponseItem
{
    public int idProducto { get; set; }
    public string servicio { get; set; }
    public int? idPromocion { get; set; }
    public string nombrePromocion { get; set; }
    public string tipoPromocion { get; set; }
    public decimal precioUnitario { get; set; }
    public decimal subtotal { get; set; }
    public decimal descuento { get; set; }
    public decimal total { get; set; }
    public List<int> idsHorarioServicio { get; set; }
}

public class CheckoutResponse
{
    public bool success { get; set; }
    public string code { get; set; }
    public string message { get; set; }
    public string numeroPedido { get; set; }
    public string moneda { get; set; }
    public decimal subtotal { get; set; }
    public decimal descuento { get; set; }
    public decimal total { get; set; }
    public bool pagoAprobado { get; set; }
    public bool pagoSimulado { get; set; }
    public string csrfToken { get; set; }
    public List<CheckoutResponseItem> items { get; set; }
}

public class CheckoutHandler : IHttpHandler
{
    private const int MaxBodyBytes = 64 * 1024;

    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;

        try
        {
            Usuario usuario = ObtenerUsuarioAutenticado(context);
            if (usuario == null)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                Escribir(context, new CheckoutResponse { success = false, code = "NO_AUTH", message = "No autenticado." });
                return;
            }

            if (string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                string token = AdminCsrfProtection.EnsureToken(context);
                context.Response.StatusCode = 200;
                Escribir(context, new CheckoutResponse { success = true, csrfToken = token, moneda = "CRC" });
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                Escribir(context, new CheckoutResponse { success = false, code = "METHOD_NOT_ALLOWED", message = "Método no permitido." });
                return;
            }

            if (!AdminCsrfProtection.EsSolicitudPostValida(context))
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                Escribir(context, new CheckoutResponse { success = false, code = "CSRF_INVALID", message = "Token CSRF inválido o origen no permitido." });
                return;
            }

            string body;
            using (StreamReader sr = new StreamReader(context.Request.InputStream))
            {
                body = sr.ReadToEnd();
            }

            if (string.IsNullOrWhiteSpace(body) || body.Length > MaxBodyBytes)
            {
                context.Response.StatusCode = 400;
                Escribir(context, new CheckoutResponse { success = false, code = "BAD_REQUEST", message = "Solicitud inválida." });
                return;
            }

            CheckoutRequest req = Deserializar<CheckoutRequest>(body);
            if (req == null)
            {
                context.Response.StatusCode = 400;
                Escribir(context, new CheckoutResponse { success = false, code = "BAD_REQUEST", message = "Solicitud inválida." });
                return;
            }

            List<CheckoutItemInput> items = MapearItems(req.items);
            string action = (req.action ?? "preview").Trim().ToLowerInvariant();

            CheckoutResultado resultado;
            if (action == "pay")
            {
                CheckoutPagoInput pago = new CheckoutPagoInput
                {
                    TokenIdempotencia = req.payment != null ? req.payment.tokenIdempotencia : null,
                    SimularAprobado = req.payment != null && req.payment.simularAprobado
                };
                resultado = RepositorioCheckout.Procesar(usuario.IdUsuario, items, pago);
            }
            else
            {
                resultado = RepositorioCheckout.Previsualizar(usuario.IdUsuario, items, req.payment != null ? req.payment.tokenIdempotencia : null);
            }

            int statusCode = resultado.Success ? 200 : 409;
            if (string.Equals(resultado.Codigo, "PEDIDO_ERROR", StringComparison.OrdinalIgnoreCase)) statusCode = 500;
            context.Response.StatusCode = statusCode;
            Escribir(context, MapearRespuesta(resultado, AdminCsrfProtection.EnsureToken(context)));
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            Escribir(context, new CheckoutResponse { success = false, code = "SERVER_ERROR", message = "No fue posible procesar checkout." });
        }
    }

    private static CheckoutResponse MapearRespuesta(CheckoutResultado r, string csrfToken)
    {
        List<CheckoutResponseItem> items = new List<CheckoutResponseItem>();
        if (r != null && r.Items != null)
        {
            for (int i = 0; i < r.Items.Count; i += 1)
            {
                CheckoutResumenItem x = r.Items[i] ?? new CheckoutResumenItem();
                items.Add(new CheckoutResponseItem
                {
                    idProducto = x.IdProducto,
                    servicio = x.Servicio,
                    idPromocion = x.IdPromocion,
                    nombrePromocion = x.NombrePromocion,
                    tipoPromocion = x.TipoPromocion,
                    precioUnitario = x.PrecioUnitario,
                    subtotal = x.Subtotal,
                    descuento = x.Descuento,
                    total = x.Total,
                    idsHorarioServicio = x.IdsHorarioServicio ?? new List<int>()
                });
            }
        }

        return new CheckoutResponse
        {
            success = r != null && r.Success,
            code = r != null ? r.Codigo : null,
            message = r != null ? r.Message : "No fue posible procesar checkout.",
            numeroPedido = r != null ? r.NumeroPedido : null,
            moneda = "CRC",
            subtotal = r != null ? r.Subtotal : 0m,
            descuento = r != null ? r.Descuento : 0m,
            total = r != null ? r.Total : 0m,
            pagoAprobado = r != null && r.PagoAprobado,
            pagoSimulado = r == null || r.Simulado,
            csrfToken = csrfToken,
            items = items
        };
    }

    private static List<CheckoutItemInput> MapearItems(List<CheckoutRequestItem> input)
    {
        List<CheckoutItemInput> list = new List<CheckoutItemInput>();
        if (input == null) return list;

        for (int i = 0; i < input.Count; i += 1)
        {
            CheckoutRequestItem x = input[i];
            if (x == null) continue;
            int idProducto = ToInt(x.idProducto);
            int idPromocion = ToInt(x.idPromocion);
            List<int> ids = x.idsHorarioServicio ?? new List<int>();

            list.Add(new CheckoutItemInput
            {
                IdProducto = idProducto,
                IdPromocion = idPromocion > 0 ? (int?)idPromocion : null,
                IdsHorarioServicio = ids,
                Observaciones = (x.observaciones ?? string.Empty).Trim()
            });
        }

        return list;
    }

    private static int ToInt(object o)
    {
        if (o == null) return 0;
        int value;
        return int.TryParse(Convert.ToString(o, CultureInfo.InvariantCulture), NumberStyles.Integer, CultureInfo.InvariantCulture, out value) ? value : 0;
    }

    private static Usuario ObtenerUsuarioAutenticado(HttpContext context)
    {
        if (context == null || context.User == null || context.User.Identity == null || !context.User.Identity.IsAuthenticated)
            return null;

        string correo = context.User.Identity.Name;
        if (string.IsNullOrWhiteSpace(correo))
            return null;

        Usuario usuario = RepositorioUsuario.ObtenerPorCorreo(correo.Trim().ToLowerInvariant());
        if (usuario == null || !usuario.Activo)
            return null;

        return usuario;
    }

    private static T Deserializar<T>(string json) where T : class
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        using (MemoryStream ms = new MemoryStream(Encoding.UTF8.GetBytes(json)))
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(T));
            return serializer.ReadObject(ms) as T;
        }
    }

    private static void Escribir(HttpContext context, CheckoutResponse response)
    {
        context.Response.Write(Serializar(response));
    }

    private static string Serializar(CheckoutResponse response)
    {
        using (MemoryStream ms = new MemoryStream())
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(CheckoutResponse));
            serializer.WriteObject(ms, response);
            return Encoding.UTF8.GetString(ms.ToArray());
        }
    }
}
