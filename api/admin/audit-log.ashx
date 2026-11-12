<%@ WebHandler Language="C#" Class="AdminAuditLogHandler" %>
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;

internal class AuditLogJsonSerializer
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
public class AdminAuditLogResponseItem
{
    [DataMember(Name = "idBitacora")]
    public long idBitacora { get; set; }

    [DataMember(Name = "fechaHora")]
    public string fechaHora { get; set; }

    [DataMember(Name = "idUsuario")]
    public int? idUsuario { get; set; }

    [DataMember(Name = "usuario")]
    public string usuario { get; set; }

    [DataMember(Name = "accion")]
    public string accion { get; set; }

    [DataMember(Name = "modulo")]
    public string modulo { get; set; }

    [DataMember(Name = "descripcion")]
    public string descripcion { get; set; }

    [DataMember(Name = "resultado")]
    public string resultado { get; set; }
}

[DataContract]
public class AdminAuditLogPaginationResponse
{
    [DataMember(Name = "pagina")]
    public int pagina { get; set; }

    [DataMember(Name = "tamanoPagina")]
    public int tamanoPagina { get; set; }

    [DataMember(Name = "totalRegistros")]
    public int totalRegistros { get; set; }

    [DataMember(Name = "totalPaginas")]
    public int totalPaginas { get; set; }
}

[DataContract]
public class AdminAuditLogSuccessResponse
{
    [DataMember(Name = "success")]
    public bool success { get; set; }

    [DataMember(Name = "bitacoraDisponible")]
    public bool bitacoraDisponible { get; set; }

    [DataMember(Name = "paginacion")]
    public AdminAuditLogPaginationResponse paginacion { get; set; }

    [DataMember(Name = "eventos")]
    public List<AdminAuditLogResponseItem> eventos { get; set; }

    [DataMember(Name = "message")]
    public string message { get; set; }
}

[DataContract]
public class AdminAuditLogErrorResponse
{
    [DataMember(Name = "success")]
    public bool success { get; set; }

    [DataMember(Name = "message")]
    public string message { get; set; }
}

public class AdminAuditLogHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = Encoding.UTF8;
        AuditLogJsonSerializer js = new AuditLogJsonSerializer();

        try
        {
            AdminAuthorizationResult auth = AdminAuthorization.ValidateCurrentUser(context);

            if (!auth.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                context.Response.Write(js.Serialize(new AdminAuditLogErrorResponse { success = false, message = "No autenticado." }));
                return;
            }

            if (!auth.UserExists || !auth.IsAdmin)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                context.Response.Write(js.Serialize(new AdminAuditLogErrorResponse { success = false, message = "Acceso denegado." }));
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new AdminAuditLogErrorResponse { success = false, message = "Método no permitido." }));
                return;
            }

            string usuario = (context.Request["usuario"] ?? string.Empty).Trim();
            string accion = (context.Request["accion"] ?? string.Empty).Trim();

            DateTime? fechaDesde = null;
            DateTime? fechaHasta = null;

            string fechaDesdeRaw = (context.Request["fechaDesde"] ?? string.Empty).Trim();
            if (!string.IsNullOrWhiteSpace(fechaDesdeRaw))
            {
                DateTime parsedDesde;
                if (!DateTime.TryParseExact(fechaDesdeRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedDesde))
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new AdminAuditLogErrorResponse { success = false, message = "Parámetro fechaDesde inválido. Use formato yyyy-MM-dd." }));
                    return;
                }
                fechaDesde = parsedDesde.Date;
            }

            string fechaHastaRaw = (context.Request["fechaHasta"] ?? string.Empty).Trim();
            if (!string.IsNullOrWhiteSpace(fechaHastaRaw))
            {
                DateTime parsedHasta;
                if (!DateTime.TryParseExact(fechaHastaRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedHasta))
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new AdminAuditLogErrorResponse { success = false, message = "Parámetro fechaHasta inválido. Use formato yyyy-MM-dd." }));
                    return;
                }
                fechaHasta = parsedHasta.Date;
            }

            if (fechaDesde.HasValue && fechaHasta.HasValue && fechaHasta.Value.Date < fechaDesde.Value.Date)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new AdminAuditLogErrorResponse { success = false, message = "El rango de fechas no es válido." }));
                return;
            }

            int pagina;
            if (!int.TryParse(context.Request["page"], out pagina)) pagina = 1;
            int tamanoPagina;
            if (!int.TryParse(context.Request["pageSize"], out tamanoPagina)) tamanoPagina = 20;

            AdminAuditoriaPaginada resultado = RepositorioAdmin.ObtenerBitacoraAuditoria(usuario, accion, fechaDesde, fechaHasta, pagina, tamanoPagina);

            List<AdminAuditLogResponseItem> eventos = new List<AdminAuditLogResponseItem>();
            foreach (AdminAuditoriaItem item in resultado.Eventos)
            {
                eventos.Add(new AdminAuditLogResponseItem
                {
                    idBitacora = item.IdBitacora,
                    fechaHora = item.Fecha.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture),
                    idUsuario = item.IdUsuario,
                    usuario = item.Usuario,
                    accion = item.Accion,
                    modulo = item.Modulo,
                    descripcion = item.Descripcion,
                    resultado = item.Resultado
                });
            }

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new AdminAuditLogSuccessResponse
            {
                success = true,
                bitacoraDisponible = resultado.BitacoraDisponible,
                paginacion = new AdminAuditLogPaginationResponse
                {
                    pagina = resultado.Pagina,
                    tamanoPagina = resultado.TamanoPagina,
                    totalRegistros = resultado.TotalRegistros,
                    totalPaginas = resultado.TamanoPagina > 0 ? (int)Math.Ceiling((double)resultado.TotalRegistros / (double)resultado.TamanoPagina) : 0
                },
                eventos = eventos,
                message = !resultado.BitacoraDisponible ? "La bitácora de auditoría no está disponible en este entorno." : (eventos.Count == 0 ? "No hay eventos de auditoría registrados." : null)
            }));
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new AdminAuditLogErrorResponse { success = false, message = "No fue posible consultar la bitácora de auditoría." }));
        }
    }
}

