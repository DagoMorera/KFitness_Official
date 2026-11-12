<%@ WebHandler Language="C#" Class="ReservationsCancelHandler" %>
using System;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;

public class ReservationCancelRequest
{
    public object idReserva { get; set; }
}

public class ReservationsCancelResponse
{
    public bool success { get; set; }
    public string code { get; set; }
    public string message { get; set; }
    public int idReserva { get; set; }
    public int idHorarioServicio { get; set; }
    public int idReservaSecundaria { get; set; }
    public int idHorarioServicioSecundario { get; set; }
    public bool esOperacionPromocional { get; set; }
}

public class ReservationsCancelHandler : IHttpHandler
{
    private const int MaxBodyBytes = 8 * 1024;

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
                Escribir(context, new ReservationsCancelResponse { success = false, message = "No autenticado." });
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                Escribir(context, new ReservationsCancelResponse { success = false, message = "Método no permitido." });
                return;
            }

            if (!AdminCsrfProtection.EsSolicitudPostValida(context))
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                Escribir(context, new ReservationsCancelResponse { success = false, message = "Token CSRF inválido o origen no permitido." });
                return;
            }

            string contentType = context.Request.ContentType ?? string.Empty;
            if (!contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 400;
                Escribir(context, new ReservationsCancelResponse { success = false, message = "Content-Type inválido." });
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
                Escribir(context, new ReservationsCancelResponse { success = false, message = "Solicitud inválida." });
                return;
            }

            ReservationCancelRequest req = Deserializar<ReservationCancelRequest>(body);
            if (req == null)
            {
                context.Response.StatusCode = 400;
                Escribir(context, new ReservationsCancelResponse { success = false, message = "Solicitud inválida." });
                return;
            }

            int idReserva;
            if (!TryToInt(req.idReserva, out idReserva) || idReserva <= 0)
            {
                context.Response.StatusCode = 400;
                Escribir(context, new ReservationsCancelResponse { success = false, message = "La reserva indicada no es válida." });
                return;
            }

            OperacionReservaResultado result = RepositorioReservas.CancelarReserva(usuario.IdUsuario, idReserva);
            if (!result.Success)
            {
                int statusCode = 400;
                if (string.Equals(result.CodigoError, "RESERVA_NO_AUTORIZADA", StringComparison.OrdinalIgnoreCase))
                    statusCode = 403;
                else if (string.Equals(result.CodigoError, "RESERVA_NO_EXISTE", StringComparison.OrdinalIgnoreCase))
                    statusCode = 404;
                else if (string.Equals(result.CodigoError, "RESERVA_DB_ERROR", StringComparison.OrdinalIgnoreCase))
                    statusCode = 500;

                context.Response.StatusCode = statusCode;
                Escribir(context, new ReservationsCancelResponse
                {
                    success = false,
                    code = result.CodigoError,
                    message = result.Message
                });
                return;
            }

            CorreosWeb.Notificar("cancelacion:" + result.IdReserva, usuario.Correo, "KFitness · Reserva cancelada", "Reserva cancelada. Referencia: " + result.IdReserva + ". Consulta el detalle actualizado en Mis reservas.");
            context.Response.StatusCode = 200;
            Escribir(context, new ReservationsCancelResponse
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
            Escribir(context, new ReservationsCancelResponse { success = false, message = "No fue posible cancelar la reserva." });
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

    private static bool TryToInt(object input, out int value)
    {
        value = 0;
        if (input == null) return false;
        return int.TryParse(Convert.ToString(input, CultureInfo.InvariantCulture), NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
    }

    private static void Escribir(HttpContext context, ReservationsCancelResponse response)
    {
        context.Response.Write(Serializar(response));
    }

    private static string Serializar(ReservationsCancelResponse response)
    {
        using (MemoryStream ms = new MemoryStream())
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(ReservationsCancelResponse));
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
