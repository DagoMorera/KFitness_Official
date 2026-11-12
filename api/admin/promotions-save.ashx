<%@ WebHandler Language="C#" Class="AdminPromotionsSaveHandler" %>
using System;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

public class AdminPromotionSaveRequest
{
    public object idPromocion { get; set; }
    public string nombre { get; set; }
    public string descripcion { get; set; }
    public object idProducto { get; set; }
    public string tipoPromocion { get; set; }
    public object porcentajeDescuento { get; set; }
    public object cantidadCompra { get; set; }
    public object cantidadEntrega { get; set; }
    public string fechaInicio { get; set; }
    public string fechaFin { get; set; }
    public object activo { get; set; }
    public string imagenPromocion { get; set; }
}

internal class AdminPromocionImagenValidada
{
    public byte[] Contenido { get; set; }
    public string ExtensionNormalizada { get; set; }
    public string TipoContenido { get; set; }
    public string NombreOriginalSeguro { get; set; }
}

public class AdminPromotionsSaveHandler : IHttpHandler
{
    private const int MaxBodyBytes = 16 * 1024;
    private const int MaxImagenBytes = 5 * 1024 * 1024;
    private const string CampoMetadata = "metadata";
    private const string CampoImagen = "imagenPromocion";

    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
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

            if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new { success = false, message = "Método no permitido." }));
                return;
            }

            if (!AdminCsrfProtection.EsSolicitudPostValida(context))
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                context.Response.Write(js.Serialize(new { success = false, message = "Token CSRF inválido o origen no permitido." }));
                return;
            }

            string contentType = context.Request.ContentType ?? string.Empty;
            bool esJson = contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase);
            bool esMultipart = contentType.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase);
            if (!esJson && !esMultipart)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Content-Type inválido." }));
                return;
            }

            AdminPromotionSaveRequest req;
            AdminPromocionImagenValidada imagenValidada;
            string errorSolicitud;
            if (!TryLeerSolicitud(context, js, esMultipart, out req, out imagenValidada, out errorSolicitud))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = errorSolicitud ?? "Solicitud inválida." }));
                return;
            }

            GuardarPromocionRequest guardar = new GuardarPromocionRequest();
            int idPromocion;
            guardar.IdPromocion = TryToInt(req.idPromocion, out idPromocion) ? idPromocion : 0;

            int idProducto;
            if (!TryToInt(req.idProducto, out idProducto) || idProducto <= 0)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Debe seleccionar un servicio válido." }));
                return;
            }
            guardar.IdProducto = idProducto;

            decimal porcentaje;
            guardar.PorcentajeDescuento = TryToDecimal(req.porcentajeDescuento, out porcentaje) ? porcentaje : 0m;

            int cantidadCompra;
            guardar.CantidadCompra = TryToInt(req.cantidadCompra, out cantidadCompra) ? (int?)cantidadCompra : null;

            int cantidadEntrega;
            guardar.CantidadEntrega = TryToInt(req.cantidadEntrega, out cantidadEntrega) ? (int?)cantidadEntrega : null;

            DateTime fechaInicio;
            DateTime fechaFin;
            if (!DateTime.TryParseExact(req.fechaInicio ?? string.Empty, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fechaInicio)
                || !DateTime.TryParseExact(req.fechaFin ?? string.Empty, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fechaFin))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "La vigencia es inválida." }));
                return;
            }

            bool activo = true;
            bool parsedActivo;
            if (TryToBool(req.activo, out parsedActivo)) activo = parsedActivo;

            guardar.Nombre = req.nombre;
            guardar.Descripcion = req.descripcion;
            guardar.TipoPromocion = req.tipoPromocion;
            guardar.FechaInicio = fechaInicio;
            guardar.FechaFin = fechaFin;
            guardar.Activo = activo;
            guardar.IdActor = auth.Usuario != null ? auth.Usuario.IdUsuario : 0;
            guardar.ImagenPromocion = NormalizarReferenciaImagenPromocion(req.imagenPromocion);

            bool? estadoAnteriorPromocion = null;
            if (guardar.IdPromocion > 0)
            {
                try
                {
                    System.Collections.Generic.List<PromocionAdminItem> promociones = RepositorioPromociones.ObtenerPromocionesAdmin();
                    PromocionAdminItem actual = promociones.Find(delegate (PromocionAdminItem p) { return p != null && p.IdPromocion == guardar.IdPromocion; });
                    if (actual != null)
                    {
                        estadoAnteriorPromocion = actual.Activo;
                    }
                }
                catch
                {
                }
            }

            string rutaNuevaImagenGuardada = null;
            if (imagenValidada != null)
            {
                string nuevoNombreImagen = GenerarNombreArchivoPromocion(imagenValidada.ExtensionNormalizada);
                rutaNuevaImagenGuardada = GuardarImagenPromocion(context, nuevoNombreImagen, imagenValidada.Contenido);
                guardar.ImagenPromocion = nuevoNombreImagen;
            }

            GuardarPromocionResultado result = RepositorioPromociones.GuardarPromocion(guardar);
            if (!result.Success)
            {
                if (!string.IsNullOrWhiteSpace(rutaNuevaImagenGuardada))
                {
                    IntentarEliminarArchivo(rutaNuevaImagenGuardada);
                }

                context.Response.StatusCode = string.Equals(result.CodigoError, "PROMOCION_DB_ERROR", StringComparison.OrdinalIgnoreCase) ? 500 : 400;
                context.Response.Write(js.Serialize(new { success = false, code = result.CodigoError, message = result.Message }));
                return;
            }

            string accionAuditoria = guardar.IdPromocion > 0 ? "ACTUALIZAR_PROMOCION" : "CREAR_PROMOCION";
            if (guardar.IdPromocion > 0 && estadoAnteriorPromocion.HasValue && estadoAnteriorPromocion.Value != guardar.Activo)
            {
                accionAuditoria = guardar.Activo ? "ACTIVAR_PROMOCION" : "INACTIVAR_PROMOCION";
            }

            RepositorioAuditoria.Registrar(new RegistrarAuditoriaRequest
            {
                IdUsuario = guardar.IdActor,
                Modulo = "Promociones",
                Entidad = "Promocion",
                IdRegistro = Convert.ToString(result.IdPromocion, CultureInfo.InvariantCulture),
                Accion = accionAuditoria,
                Descripcion = "Gestión de promoción: " + (guardar.Nombre ?? string.Empty),
                EsEventoSeguridad = false,
                DireccionIp = RepositorioAuditoria.ObtenerIpCliente(context)
            });

            context.Response.StatusCode = guardar.IdPromocion > 0 ? 200 : 201;
            context.Response.Write(js.Serialize(new
            {
                success = true,
                idPromocion = result.IdPromocion,
                message = result.Message,
                imagenPromocion = guardar.ImagenPromocion,
                imagenPromocionUrl = string.IsNullOrWhiteSpace(guardar.ImagenPromocion)
                    ? null
                    : "/api/promotion-image.ashx?v=" + HttpUtility.UrlEncode(guardar.ImagenPromocion)
            }));
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible guardar la promoción." }));
        }
    }

    private static bool TryLeerSolicitud(
        HttpContext context,
        JavaScriptSerializer js,
        bool esMultipart,
        out AdminPromotionSaveRequest req,
        out AdminPromocionImagenValidada imagenValidada,
        out string error)
    {
        req = null;
        imagenValidada = null;
        error = null;

        if (esMultipart)
        {
            string metadata = context.Request.Form[CampoMetadata];
            if (string.IsNullOrWhiteSpace(metadata) || metadata.Length > MaxBodyBytes)
            {
                error = "Solicitud inválida.";
                return false;
            }

            try { req = js.Deserialize<AdminPromotionSaveRequest>(metadata); }
            catch { req = null; }

            if (req == null)
            {
                error = "Solicitud inválida.";
                return false;
            }

            HttpPostedFile imagen = context.Request.Files[CampoImagen];
            if (imagen != null && imagen.ContentLength > 0)
            {
                if (!TryValidarImagenSubida(imagen, out imagenValidada, out error))
                {
                    return false;
                }
            }

            return true;
        }

        string body = LeerBodySeguro(context.Request);
        if (string.IsNullOrWhiteSpace(body))
        {
            error = "Solicitud inválida.";
            return false;
        }

        try { req = js.Deserialize<AdminPromotionSaveRequest>(body); }
        catch { req = null; }

        if (req == null)
        {
            error = "Solicitud inválida.";
            return false;
        }

        return true;
    }

    private static string LeerBodySeguro(HttpRequest request)
    {
        if (request == null || request.InputStream == null)
        {
            throw new InvalidOperationException();
        }

        if (request.InputStream.CanSeek)
        {
            if (request.InputStream.Length > MaxBodyBytes)
            {
                throw new InvalidOperationException();
            }
            request.InputStream.Position = 0;
        }

        using (MemoryStream ms = new MemoryStream())
        {
            byte[] buffer = new byte[2048];
            int total = 0;
            int read;
            while ((read = request.InputStream.Read(buffer, 0, buffer.Length)) > 0)
            {
                total += read;
                if (total > MaxBodyBytes)
                {
                    throw new InvalidOperationException();
                }

                ms.Write(buffer, 0, read);
            }

            return System.Text.Encoding.UTF8.GetString(ms.ToArray());
        }
    }

    private static bool TryValidarImagenSubida(HttpPostedFile postedFile, out AdminPromocionImagenValidada imagen, out string error)
    {
        imagen = null;
        error = null;

        if (postedFile == null || postedFile.InputStream == null)
        {
            error = "No se recibió un archivo de imagen válido.";
            return false;
        }

        if (postedFile.ContentLength <= 0)
        {
            error = "La imagen seleccionada está vacía.";
            return false;
        }

        if (postedFile.ContentLength > MaxImagenBytes)
        {
            error = "La imagen supera el límite de 5 MB.";
            return false;
        }

        string nombreOriginal = Path.GetFileName(postedFile.FileName ?? string.Empty);
        if (!string.Equals(nombreOriginal, postedFile.FileName ?? string.Empty, StringComparison.Ordinal))
        {
            error = "El nombre del archivo no es válido.";
            return false;
        }

        string extension = NormalizarExtension(Path.GetExtension(nombreOriginal));
        if (extension == null)
        {
            error = "Formato de imagen no permitido. Usa JPG, PNG o WebP.";
            return false;
        }

        byte[] contenido = LeerArchivoSeguro(postedFile.InputStream, MaxImagenBytes);
        if (contenido == null || contenido.Length == 0)
        {
            error = "No se pudo leer la imagen enviada.";
            return false;
        }

        if (!ContenidoCoincideConFormato(contenido, extension))
        {
            error = "El contenido del archivo no coincide con una imagen válida.";
            return false;
        }

        string tipoContenido = TipoContenidoPorExtension(extension);
        string tipoReportado = (postedFile.ContentType ?? string.Empty).Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(tipoReportado) &&
            !string.Equals(tipoReportado, "application/octet-stream", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(tipoReportado, tipoContenido, StringComparison.OrdinalIgnoreCase))
        {
            error = "El tipo de archivo enviado no es válido.";
            return false;
        }

        if (nombreOriginal.Length > 200)
        {
            nombreOriginal = nombreOriginal.Substring(0, 200);
        }

        imagen = new AdminPromocionImagenValidada
        {
            Contenido = contenido,
            ExtensionNormalizada = extension,
            TipoContenido = tipoContenido,
            NombreOriginalSeguro = nombreOriginal
        };
        return true;
    }

    private static string GuardarImagenPromocion(HttpContext context, string nombreArchivo, byte[] contenido)
    {
        string carpeta = context.Server.MapPath("~/App_Data/PromotionImages");
        Directory.CreateDirectory(carpeta);

        string ruta = Path.Combine(carpeta, nombreArchivo);
        using (FileStream fs = new FileStream(ruta, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            fs.Write(contenido, 0, contenido.Length);
            fs.Flush();
        }

        return ruta;
    }

    private static string GenerarNombreArchivoPromocion(string extension)
    {
        return "promo_" + Guid.NewGuid().ToString("N") + extension;
    }

    private static void IntentarEliminarArchivo(string ruta)
    {
        if (string.IsNullOrWhiteSpace(ruta)) return;
        try
        {
            if (File.Exists(ruta)) File.Delete(ruta);
        }
        catch
        {
        }
    }

    private static string NormalizarReferenciaImagenPromocion(string referencia)
    {
        string valor = string.IsNullOrWhiteSpace(referencia) ? string.Empty : referencia.Trim();
        if (string.IsNullOrWhiteSpace(valor)) return null;

        string nombre = Path.GetFileName(valor);
        if (!string.Equals(nombre, valor, StringComparison.Ordinal)) return null;

        string extension = NormalizarExtension(Path.GetExtension(nombre));
        if (string.IsNullOrWhiteSpace(extension)) return null;

        return nombre;
    }

    private static byte[] LeerArchivoSeguro(Stream input, int maxBytes)
    {
        if (input == null) return null;

        if (input.CanSeek)
        {
            input.Position = 0;
        }

        using (MemoryStream ms = new MemoryStream())
        {
            byte[] buffer = new byte[16 * 1024];
            int total = 0;
            int read;

            while ((read = input.Read(buffer, 0, buffer.Length)) > 0)
            {
                total += read;
                if (total > maxBytes)
                {
                    return null;
                }

                ms.Write(buffer, 0, read);
            }

            return ms.ToArray();
        }
    }

    private static string NormalizarExtension(string extension)
    {
        if (string.IsNullOrWhiteSpace(extension)) return null;

        extension = extension.Trim().ToLowerInvariant();
        if (extension == ".jpg" || extension == ".jpeg") return ".jpg";
        if (extension == ".png") return ".png";
        if (extension == ".webp") return ".webp";
        return null;
    }

    private static string TipoContenidoPorExtension(string extensionNormalizada)
    {
        if (string.Equals(extensionNormalizada, ".jpg", StringComparison.OrdinalIgnoreCase)) return "image/jpeg";
        if (string.Equals(extensionNormalizada, ".png", StringComparison.OrdinalIgnoreCase)) return "image/png";
        if (string.Equals(extensionNormalizada, ".webp", StringComparison.OrdinalIgnoreCase)) return "image/webp";
        return "application/octet-stream";
    }

    private static bool ContenidoCoincideConFormato(byte[] contenido, string extensionNormalizada)
    {
        if (contenido == null || contenido.Length < 12 || string.IsNullOrWhiteSpace(extensionNormalizada)) return false;

        if (string.Equals(extensionNormalizada, ".jpg", StringComparison.OrdinalIgnoreCase))
        {
            if (!(contenido[0] == 0xFF && contenido[1] == 0xD8)) return false;
            return EsImagenDecodificableSystemDrawing(contenido);
        }

        if (string.Equals(extensionNormalizada, ".png", StringComparison.OrdinalIgnoreCase))
        {
            if (!(contenido[0] == 0x89 && contenido[1] == 0x50 && contenido[2] == 0x4E && contenido[3] == 0x47)) return false;
            return EsImagenDecodificableSystemDrawing(contenido);
        }

        if (string.Equals(extensionNormalizada, ".webp", StringComparison.OrdinalIgnoreCase))
        {
            if (!EsFirmaWebP(contenido)) return false;

            int ancho;
            int alto;
            return TryLeerDimensionesWebP(contenido, out ancho, out alto) && ancho > 0 && alto > 0;
        }

        return false;
    }

    private static bool EsImagenDecodificableSystemDrawing(byte[] contenido)
    {
        try
        {
            using (MemoryStream ms = new MemoryStream(contenido))
            using (Image img = Image.FromStream(ms, true, true))
            {
                return img.Width > 0 && img.Height > 0;
            }
        }
        catch
        {
            return false;
        }
    }

    private static bool EsFirmaWebP(byte[] contenido)
    {
        if (contenido == null || contenido.Length < 12) return false;

        return contenido[0] == (byte)'R' &&
               contenido[1] == (byte)'I' &&
               contenido[2] == (byte)'F' &&
               contenido[3] == (byte)'F' &&
               contenido[8] == (byte)'W' &&
               contenido[9] == (byte)'E' &&
               contenido[10] == (byte)'B' &&
               contenido[11] == (byte)'P';
    }

    private static bool TryLeerDimensionesWebP(byte[] data, out int width, out int height)
    {
        width = 0;
        height = 0;

        if (data == null || data.Length < 30 || !EsFirmaWebP(data)) return false;

        string chunk = System.Text.Encoding.ASCII.GetString(data, 12, 4);

        if (chunk == "VP8 ")
        {
            if (data.Length < 30) return false;
            if (data[23] != 0x9D || data[24] != 0x01 || data[25] != 0x2A) return false;
            width = data[26] | ((data[27] & 0x3F) << 8);
            height = data[28] | ((data[29] & 0x3F) << 8);
            return width > 0 && height > 0;
        }

        if (chunk == "VP8L")
        {
            if (data.Length < 25) return false;
            if (data[20] != 0x2F) return false;

            int b0 = data[21];
            int b1 = data[22];
            int b2 = data[23];
            int b3 = data[24];

            width = 1 + (b0 | ((b1 & 0x3F) << 8));
            height = 1 + (((b1 >> 6) | (b2 << 2) | ((b3 & 0x0F) << 10)) & 0x3FFF);
            return width > 0 && height > 0;
        }

        if (chunk == "VP8X")
        {
            if (data.Length < 30) return false;

            int w = data[24] | (data[25] << 8) | (data[26] << 16);
            int h = data[27] | (data[28] << 8) | (data[29] << 16);

            width = w + 1;
            height = h + 1;
            return width > 0 && height > 0;
        }

        return false;
    }

    private static bool TryToInt(object input, out int value)
    {
        value = 0;
        if (input == null) return false;
        return int.TryParse(Convert.ToString(input, CultureInfo.InvariantCulture), NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
    }

    private static bool TryToDecimal(object input, out decimal value)
    {
        value = 0m;
        if (input == null) return false;
        return decimal.TryParse(Convert.ToString(input, CultureInfo.InvariantCulture), NumberStyles.Number, CultureInfo.InvariantCulture, out value);
    }

    private static bool TryToBool(object input, out bool value)
    {
        value = false;
        if (input == null) return false;
        string text = Convert.ToString(input, CultureInfo.InvariantCulture);
        if (string.IsNullOrWhiteSpace(text)) return false;
        text = text.Trim();
        if (text == "1") { value = true; return true; }
        if (text == "0") { value = false; return true; }
        return bool.TryParse(text, out value);
    }
}
