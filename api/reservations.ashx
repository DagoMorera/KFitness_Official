<%@ WebHandler Language="C#" Class="ReservationsHandler" %>
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;

public class ReservationCreateRequest
{
    public object idHorarioServicio { get; set; }
    public object idPromocion { get; set; }
    public object idHorarioServicioSecundario { get; set; }
    public string observaciones { get; set; }
}

public class ReservationItemResponse
{
    public int idReserva { get; set; }
    public int idHorarioServicio { get; set; }
    public int idProducto { get; set; }
    public string servicio { get; set; }
    public string fecha { get; set; }
    public string horaInicio { get; set; }
    public string horaFin { get; set; }
    public string instructor { get; set; }
    public int capacidadMaxima { get; set; }
    public int reservasConfirmadas { get; set; }
    public int cuposRestantes { get; set; }
    public string estado { get; set; }
    public string observaciones { get; set; }
    public string fechaCreacion { get; set; }
    public int? idOperacionPromocional { get; set; }
    public int? idPromocion { get; set; }
    public string nombrePromocion { get; set; }
    public string tipoPromocion { get; set; }
    public decimal porcentajeDescuentoPromocion { get; set; }
    public string beneficioPromocion { get; set; }
}

public class ReservationsResponse
{
    public bool success { get; set; }
    public string code { get; set; }
    public string message { get; set; }
    public string csrfToken { get; set; }
    public int idReserva { get; set; }
    public int idHorarioServicio { get; set; }
    public int idReservaSecundaria { get; set; }
    public int idHorarioServicioSecundario { get; set; }
    public bool esOperacionPromocional { get; set; }
    public List<ReservationItemResponse> reservas { get; set; }
}

public class ReservationsHandler : IHttpHandler
{
    private const int MaxBodyBytes = 16 * 1024;

    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = Encoding.UTF8;

        try
        {
            Usuario usuario = ObtenerUsuarioAutenticado(context);
            if (usuario == null)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                Escribir(context, new ReservationsResponse { success = false, message = "No autenticado." });
                return;
            }

            if (string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                string token = AdminCsrfProtection.EnsureToken(context);
                List<ReservaUsuarioItem> reservas = RepositorioReservas.ObtenerReservasUsuario(usuario.IdUsuario);
                List<ReservationItemResponse> items = new List<ReservationItemResponse>();

                foreach (ReservaUsuarioItem r in reservas)
                {
                    items.Add(new ReservationItemResponse
                    {
                        idReserva = r.IdReserva,
                        idHorarioServicio = r.IdHorarioServicio,
                        idProducto = r.IdProducto,
                        servicio = r.Servicio,
                        fecha = r.Fecha.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                        horaInicio = r.HoraInicio.ToString(@"hh\:mm"),
                        horaFin = r.HoraFin.ToString(@"hh\:mm"),
                        instructor = r.Instructor,
                        capacidadMaxima = r.CapacidadMaxima,
                        reservasConfirmadas = r.ReservasConfirmadas,
                        cuposRestantes = r.CuposRestantes,
                        estado = r.Estado,
                        observaciones = r.Observaciones,
                        fechaCreacion = r.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture),
                        idOperacionPromocional = r.IdOperacionPromocional,
                        idPromocion = r.IdPromocion,
                        nombrePromocion = r.NombrePromocion,
                        tipoPromocion = r.TipoPromocion,
                        porcentajeDescuentoPromocion = r.PorcentajeDescuentoPromocion,
                        beneficioPromocion = ObtenerBeneficioPromocion(r)
                    });
                }

                context.Response.StatusCode = 200;
                Escribir(context, new ReservationsResponse
                {
                    success = true,
                    csrfToken = token,
                    reservas = items
                });
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                Escribir(context, new ReservationsResponse { success = false, message = "Método no permitido." });
                return;
            }

            if (!AdminCsrfProtection.EsSolicitudPostValida(context))
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                Escribir(context, new ReservationsResponse { success = false, message = "Token CSRF inválido o origen no permitido." });
                return;
            }

            string contentType = context.Request.ContentType ?? string.Empty;
            if (!contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 400;
                Escribir(context, new ReservationsResponse { success = false, message = "Content-Type inválido." });
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
                Escribir(context, new ReservationsResponse { success = false, message = "Solicitud inválida." });
                return;
            }

            ReservationCreateRequest req = Deserializar<ReservationCreateRequest>(body);
            if (req == null)
            {
                context.Response.StatusCode = 400;
                Escribir(context, new ReservationsResponse { success = false, message = "Solicitud inválida." });
                return;
            }

            int idHorarioServicio;
            if (!TryToInt(req.idHorarioServicio, out idHorarioServicio) || idHorarioServicio <= 0)
            {
                context.Response.StatusCode = 400;
                Escribir(context, new ReservationsResponse { success = false, message = "La sesión seleccionada no es válida." });
                return;
            }

            int idPromocion;
            bool esPromocional = TryToInt(req.idPromocion, out idPromocion) && idPromocion > 0;

            if (string.Equals(RepositorioConfiguracionWeb.Obtener()["ReservasHabilitadas"], "false", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode=409;
                Escribir(context, new ReservationsResponse { success=false, message="La recepción de nuevas reservas está pausada. Intenta más tarde." });
                return;
            }
            OperacionReservaResultado result;
            if (esPromocional)
            {
                int idHorarioServicioSecundario;
                if (!TryToInt(req.idHorarioServicioSecundario, out idHorarioServicioSecundario) || idHorarioServicioSecundario <= 0)
                {
                    context.Response.StatusCode = 400;
                    Escribir(context, new ReservationsResponse { success = false, message = "Debes seleccionar una segunda sesión válida para la promoción 2x1." });
                    return;
                }

                result = RepositorioReservas.CrearReservaPromocionalDosPorUno(usuario.IdUsuario, idPromocion, idHorarioServicio, idHorarioServicioSecundario, req.observaciones);
            }
            else
            {
                result = RepositorioReservas.CrearReserva(usuario.IdUsuario, idHorarioServicio, req.observaciones);
            }

            if (!result.Success)
            {
                int statusCode = 400;
                if (string.Equals(result.CodigoError, "SESION_COMPLETA", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(result.CodigoError, "RESERVA_DUPLICADA", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(result.CodigoError, "PROMOCION_YA_UTILIZADA", StringComparison.OrdinalIgnoreCase))
                {
                    statusCode = 409;
                }
                else if (string.Equals(result.CodigoError, "RESERVA_DB_ERROR", StringComparison.OrdinalIgnoreCase))
                {
                    statusCode = 500;
                }

                context.Response.StatusCode = statusCode;
                Escribir(context, new ReservationsResponse
                {
                    success = false,
                    code = result.CodigoError,
                    message = result.Message
                });
                return;
            }

            CorreosWeb.Notificar("reserva:" + result.IdReserva, usuario.Correo, "KFitness · Reserva confirmada", "Reserva confirmada. Referencia: " + result.IdReserva + ". Consulta el detalle actualizado en Mis reservas.");
            context.Response.StatusCode = 201;
            Escribir(context, new ReservationsResponse
            {
                success = true,
                idReserva = result.IdReserva,
                idHorarioServicio = result.IdHorarioServicio,
                idReservaSecundaria = result.IdReservaSecundaria,
                idHorarioServicioSecundario = result.IdHorarioServicioSecundario,
                esOperacionPromocional = result.EsOperacionPromocional,
                message = result.Message
            });
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            Escribir(context, new ReservationsResponse { success = false, message = "No fue posible procesar la reserva." });
        }
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

    private static string ObtenerBeneficioPromocion(ReservaUsuarioItem r)
    {
        if (r == null || !r.IdOperacionPromocional.HasValue) return "Reserva regular";

        string tipo = (r.TipoPromocion ?? string.Empty).Trim().ToUpperInvariant();
        if (tipo == "DOS_POR_UNO") return "¡Dos clases por el precio de una!";

        if (tipo == "PORCENTAJE")
        {
            decimal valor = r.PorcentajeDescuentoPromocion;
            if (valor < 0m) valor = 0m;
            if (valor > 100m) valor = 100m;
            string porcentaje = valor.ToString("0.##", CultureInfo.InvariantCulture);
            return porcentaje + "% de descuento";
        }

        return "Beneficio promocional aplicado";
    }

    private static bool TryToInt(object input, out int value)
    {
        value = 0;
        if (input == null) return false;
        return int.TryParse(Convert.ToString(input, CultureInfo.InvariantCulture), NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
    }

    private static void Escribir(HttpContext context, ReservationsResponse response)
    {
        context.Response.Write(Serializar(response));
    }

    private static string Serializar(ReservationsResponse response)
    {
        using (MemoryStream ms = new MemoryStream())
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(ReservationsResponse));
            serializer.WriteObject(ms, response);
            return Encoding.UTF8.GetString(ms.ToArray());
        }
    }

    private static T Deserializar<T>(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return default(T);
        using (MemoryStream ms = new MemoryStream(Encoding.UTF8.GetBytes(json)))
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(T));
            object value = serializer.ReadObject(ms);
            if (value == null) return default(T);
            return (T)value;
        }
    }
}
