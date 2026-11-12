<%@ WebHandler Language="C#" Class="AdminServiceUpdateHandler" %>
using System;
using System.Drawing;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;
using JavaScriptSerializer = System.Web.Script.Serialization.JavaScriptSerializer;

public class AdminServiceUpdateRequest
{
    public object idProducto { get; set; }
    public string nombre { get; set; }
    public object idCategoria { get; set; }
    public string descripcion { get; set; }
    public object precio { get; set; }
    public object activo { get; set; }
    public object ordenCatalogo { get; set; }
    public object quitarImagen { get; set; }
}

public class AdminServiceUpdateResponse
{
    public bool success { get; set; }
    public string message { get; set; }
    public int? idProducto { get; set; }
}

internal class ServicioImagenUpdateValidada
{
    public byte[] Contenido { get; set; }
    public string ExtensionNormalizada { get; set; }
    public string TipoContenido { get; set; }
    public string NombreOriginalSeguro { get; set; }
}

public class AdminServiceUpdateHandler : IHttpHandler
{
    private const int MaxBodyBytes = 16 * 1024;
    private const int MaxImagenBytes = 5 * 1024 * 1024;
    private const string CampoMetadata = "metadata";
    private const string CampoImagen = "imagenServicio";

    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;
        JavaScriptSerializer js = new JavaScriptSerializer();

        try
        {
            AdminAuthorizationResult auth = AdminAuthorization.ValidateCurrentUser(context);

            if (!auth.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                Escribir(context, js, false, "No autenticado.", null);
                return;
            }

            if (!auth.UserExists || !auth.IsAdmin)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                Escribir(context, js, false, "Acceso denegado.", null);
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                Escribir(context, js, false, "Método no permitido.", null);
                return;
            }

            if (!AdminCsrfProtection.EsSolicitudPostValida(context))
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                Escribir(context, js, false, "Token CSRF inválido o origen no permitido.", null);
                return;
            }

            string contentType = context.Request.ContentType ?? string.Empty;
            bool esJson = contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase);
            bool esMultipart = contentType.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase);

            if (!esJson && !esMultipart)
            {
                context.Response.StatusCode = 400;
                Escribir(context, js, false, "Content-Type inválido.", null);
                return;
            }

            AdminServiceUpdateRequest req;
            ServicioImagenUpdateValidada imagenValidada = null;
            string errorSolicitud;

            if (!TryLeerSolicitud(context, js, esMultipart, out req, out imagenValidada, out errorSolicitud))
            {
                context.Response.StatusCode = 400;
                Escribir(context, js, false, errorSolicitud ?? "Solicitud inválida.", null);
                return;
            }

            int idProducto;
            if (!TryConvertirEntero(req.idProducto, out idProducto) || idProducto <= 0)
            {
                context.Response.StatusCode = 400;
                Escribir(context, js, false, "El identificador del servicio no es válido.", null);
                return;
            }

            int idCategoria;
            if (!TryConvertirEntero(req.idCategoria, out idCategoria) || idCategoria <= 0)
            {
                context.Response.StatusCode = 400;
                Escribir(context, js, false, "La categoría seleccionada no es válida.", null);
                return;
            }

            decimal precio;
            if (!TryConvertirDecimal(req.precio, out precio))
            {
                context.Response.StatusCode = 400;
                Escribir(context, js, false, "El precio no es válido.", null);
                return;
            }

            bool activo;
            if (!TryConvertirBooleano(req.activo, out activo))
            {
                context.Response.StatusCode = 400;
                Escribir(context, js, false, "El estado del servicio no es válido.", null);
                return;
            }

            int ordenCatalogo;
            if (!TryConvertirEntero(req.ordenCatalogo, out ordenCatalogo))
            {
                context.Response.StatusCode = 400;
                Escribir(context, js, false, "El orden de catálogo no es válido.", null);
                return;
            }

            bool quitarImagen;
            if (!TryConvertirBooleanoOpcional(req.quitarImagen, out quitarImagen))
            {
                context.Response.StatusCode = 400;
                Escribir(context, js, false, "La opción de imagen no es válida.", null);
                return;
            }

            ServicioAdminDetalleItem servicioActual = RepositorioServicios.ObtenerServicioAdminPorId(idProducto);
            if (servicioActual == null)
            {
                context.Response.StatusCode = 404;
                Escribir(context, js, false, "Servicio no encontrado.", null);
                return;
            }

            int idActor = auth.Usuario != null ? auth.Usuario.IdUsuario : 0;
            bool estadoAnteriorServicio = servicioActual.Activo;
            ActualizarServicioResultado actualizar = RepositorioServicios.ActualizarServicio(
                idProducto,
                idActor,
                req.nombre,
                idCategoria,
                req.descripcion,
                precio,
                activo,
                ordenCatalogo);

            if (!actualizar.Success)
            {
                if (string.Equals(actualizar.CodigoError, "SERVICIO_NO_EXISTE", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = 404;
                    Escribir(context, js, false, actualizar.Message ?? "Servicio no encontrado.", null);
                    return;
                }

                if (string.Equals(actualizar.CodigoError, "SERVICIO_DUPLICADO", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = 409;
                    Escribir(context, js, false, actualizar.Message ?? "Ya existe un servicio con ese nombre en la categoría.", null);
                    return;
                }

                context.Response.StatusCode = 400;
                Escribir(context, js, false, actualizar.Message ?? "No fue posible actualizar el servicio.", null);
                return;
            }

            RepositorioAuditoria.Registrar(new RegistrarAuditoriaRequest
            {
                IdUsuario = idActor,
                Modulo = "Servicios",
                Entidad = "Producto",
                IdRegistro = Convert.ToString(idProducto),
                Accion = estadoAnteriorServicio != activo
                    ? (activo ? "ACTIVAR_SERVICIO" : "INACTIVAR_SERVICIO")
                    : "ACTUALIZAR_SERVICIO",
                Descripcion = (estadoAnteriorServicio != activo
                    ? (activo ? "Activación" : "Desactivación")
                    : "Actualización") + " de servicio: " + (req.nombre ?? string.Empty),
                EsEventoSeguridad = false,
                DireccionIp = RepositorioAuditoria.ObtenerIpCliente(context)
            });

            string nombreArchivoAnterior = ObtenerNombreArchivoDesdeRuta(servicioActual.ImagenPrincipal);

            if (quitarImagen)
            {
                RepositorioServicios.DesactivarImagenPrincipalServicio(idProducto, idActor);
            }

            if (imagenValidada != null)
            {
                string rutaNueva = null;
                try
                {
                    string nombreArchivoNuevo = GenerarNombreArchivoSeguro(idProducto, imagenValidada.ExtensionNormalizada);
                    rutaNueva = GuardarImagenServicio(context, nombreArchivoNuevo, imagenValidada.Contenido);

                    string rutaRelativa = "/api/service-image.ashx?v=" + HttpUtility.UrlEncode(nombreArchivoNuevo);
                    RegistrarImagenServicioResultado imgRes = RepositorioServicios.RegistrarImagenPrincipalServicio(
                        idProducto,
                        rutaRelativa,
                        imagenValidada.NombreOriginalSeguro,
                        imagenValidada.TipoContenido,
                        imagenValidada.Contenido.Length,
                        idActor);

                    if (!imgRes.Success)
                    {
                        IntentarEliminarArchivo(rutaNueva);
                        context.Response.StatusCode = 200;
                        Escribir(context, js, true, "Servicio actualizado, pero no fue posible actualizar la imagen.", idProducto);
                        return;
                    }

                    if (!string.IsNullOrWhiteSpace(nombreArchivoAnterior) &&
                        !string.Equals(nombreArchivoAnterior, nombreArchivoNuevo, StringComparison.OrdinalIgnoreCase))
                    {
                        EliminarArchivoServicioPorNombre(context, nombreArchivoAnterior);
                    }
                }
                catch
                {
                    IntentarEliminarArchivo(rutaNueva);
                    context.Response.StatusCode = 200;
                    Escribir(context, js, true, "Servicio actualizado, pero no fue posible procesar la nueva imagen.", idProducto);
                    return;
                }
            }
            else if (quitarImagen && !string.IsNullOrWhiteSpace(nombreArchivoAnterior))
            {
                EliminarArchivoServicioPorNombre(context, nombreArchivoAnterior);
            }

            context.Response.StatusCode = 200;
            Escribir(context, js, true, "Servicio actualizado correctamente.", idProducto);
        }
        catch (InvalidOperationException)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 400;
            Escribir(context, js, false, "Solicitud inválida.", null);
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            Escribir(context, js, false, "Error interno del servidor.", null);
        }
    }

    private static bool TryLeerSolicitud(
        HttpContext context,
        JavaScriptSerializer js,
        bool esMultipart,
        out AdminServiceUpdateRequest req,
        out ServicioImagenUpdateValidada imagenValidada,
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

            try
            {
                req = js.Deserialize<AdminServiceUpdateRequest>(metadata);
            }
            catch
            {
                req = null;
            }

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

        try
        {
            req = js.Deserialize<AdminServiceUpdateRequest>(body);
        }
        catch
        {
            req = null;
        }

        if (req == null)
        {
            error = "Solicitud inválida.";
            return false;
        }

        return true;
    }

    private static bool TryValidarImagenSubida(HttpPostedFile postedFile, out ServicioImagenUpdateValidada imagen, out string error)
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

        imagen = new ServicioImagenUpdateValidada();
        imagen.Contenido = contenido;
        imagen.ExtensionNormalizada = extension;
        imagen.TipoContenido = tipoContenido;
        imagen.NombreOriginalSeguro = nombreOriginal;
        return true;
    }

    private static string GuardarImagenServicio(HttpContext context, string nombreArchivo, byte[] contenido)
    {
        string carpeta = context.Server.MapPath("~/App_Data/ServiceImages");
        Directory.CreateDirectory(carpeta);

        string ruta = Path.Combine(carpeta, nombreArchivo);
        using (FileStream fs = new FileStream(ruta, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            fs.Write(contenido, 0, contenido.Length);
            fs.Flush();
        }

        return ruta;
    }

    private static void EliminarArchivoServicioPorNombre(HttpContext context, string nombreArchivo)
    {
        if (string.IsNullOrWhiteSpace(nombreArchivo)) return;
        string soloNombre = Path.GetFileName(nombreArchivo);
        if (!string.Equals(soloNombre, nombreArchivo, StringComparison.Ordinal)) return;

        string carpeta = context.Server.MapPath("~/App_Data/ServiceImages");
        string ruta = Path.Combine(carpeta, soloNombre);
        IntentarEliminarArchivo(ruta);
    }

    private static void IntentarEliminarArchivo(string ruta)
    {
        if (string.IsNullOrWhiteSpace(ruta)) return;
        try
        {
            if (File.Exists(ruta))
            {
                File.Delete(ruta);
            }
        }
        catch
        {
        }
    }

    private static string ObtenerNombreArchivoDesdeRuta(string ruta)
    {
        if (string.IsNullOrWhiteSpace(ruta)) return null;
        string texto = ruta.Trim();
        int idx = texto.IndexOf("v=", StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return null;

        string valor = texto.Substring(idx + 2);
        int amp = valor.IndexOf('&');
        if (amp >= 0)
        {
            valor = valor.Substring(0, amp);
        }

        valor = HttpUtility.UrlDecode(valor ?? string.Empty);
        if (string.IsNullOrWhiteSpace(valor)) return null;

        string nombre = Path.GetFileName(valor);
        if (!string.Equals(nombre, valor, StringComparison.Ordinal)) return null;
        return nombre;
    }

    private static string GenerarNombreArchivoSeguro(int idProducto, string extension)
    {
        return "svc_" + idProducto.ToString() + "_" + Guid.NewGuid().ToString("N") + extension;
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

    private static bool TryConvertirDecimal(object value, out decimal precio)
    {
        precio = 0m;
        if (value == null) return false;

        if (value is decimal)
        {
            precio = (decimal)value;
            return true;
        }

        if (value is int)
        {
            precio = Convert.ToDecimal((int)value);
            return true;
        }

        if (value is long)
        {
            precio = Convert.ToDecimal((long)value);
            return true;
        }

        if (value is double)
        {
            double d = (double)value;
            if (double.IsNaN(d) || double.IsInfinity(d)) return false;
            try
            {
                precio = Convert.ToDecimal(d);
                return true;
            }
            catch
            {
                return false;
            }
        }

        if (value is float)
        {
            float f = (float)value;
            if (float.IsNaN(f) || float.IsInfinity(f)) return false;
            try
            {
                precio = Convert.ToDecimal(f);
                return true;
            }
            catch
            {
                return false;
            }
        }

        string text = Convert.ToString(value);
        if (string.IsNullOrWhiteSpace(text)) return false;

        return decimal.TryParse(text, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out precio)
            || decimal.TryParse(text, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.CurrentCulture, out precio);
    }

    private static bool TryConvertirEntero(object value, out int numero)
    {
        numero = 0;
        if (value == null) return false;

        if (value is int)
        {
            numero = (int)value;
            return true;
        }

        if (value is long)
        {
            long l = (long)value;
            if (l < int.MinValue || l > int.MaxValue) return false;
            numero = (int)l;
            return true;
        }

        string text = Convert.ToString(value);
        if (string.IsNullOrWhiteSpace(text)) return false;
        return int.TryParse(text, out numero);
    }

    private static bool TryConvertirBooleano(object value, out bool activo)
    {
        activo = false;
        if (value == null) return false;

        if (value is bool)
        {
            activo = (bool)value;
            return true;
        }

        if (value is int)
        {
            int i = (int)value;
            if (i == 0 || i == 1)
            {
                activo = i == 1;
                return true;
            }
            return false;
        }

        string text = Convert.ToString(value);
        if (string.IsNullOrWhiteSpace(text)) return false;
        if (string.Equals(text, "1", StringComparison.OrdinalIgnoreCase)) { activo = true; return true; }
        if (string.Equals(text, "0", StringComparison.OrdinalIgnoreCase)) { activo = false; return true; }
        return bool.TryParse(text, out activo);
    }

    private static bool TryConvertirBooleanoOpcional(object value, out bool result)
    {
        result = false;
        if (value == null) return true;
        return TryConvertirBooleano(value, out result);
    }

    private static void Escribir(HttpContext context, JavaScriptSerializer js, bool success, string message, int? idProducto)
    {
        AdminServiceUpdateResponse response = new AdminServiceUpdateResponse();
        response.success = success;
        response.message = message;
        response.idProducto = idProducto;
        context.Response.Write(js.Serialize(response));
    }
}

