<%@ WebHandler Language="C#" Class="AdminRoutinesSaveHandler" %>
using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Script.Serialization;

public class AdminRoutinesSaveHandler : IHttpHandler
{
    private const int MaxBodyBytes = 512 * 1024;
    private const int MaxImagenBytes = 5 * 1024 * 1024;
    private const string CampoMetadata = "metadata";

    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = System.Text.Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;
        context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
        JavaScriptSerializer js = new JavaScriptSerializer();

        Dictionary<string, string> archivosGuardados = new Dictionary<string, string>();
        bool confirmado = false;
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

            RutinaEditorPayload payload;
            string errorSolicitud;
            if (!TryLeerSolicitud(context, js, out payload, out archivosGuardados, out errorSolicitud))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = errorSolicitud ?? "Solicitud inválida." }));
                return;
            }

            if (!AplicarReferenciasSubidas(payload, archivosGuardados, out errorSolicitud))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = errorSolicitud ?? "Referencias de medios inválidas." }));
                return;
            }

            int idActor = auth.Usuario != null ? auth.Usuario.IdUsuario : 0;
            RutinaEditorGuardarResultado res = RepositorioRutinasEditor.GuardarRutinaExtendida(idActor, payload);

            if (!res.Success)
            {
                if (string.Equals(res.CodigoError, "RUTINA_NO_EXISTE", StringComparison.OrdinalIgnoreCase)) context.Response.StatusCode = 404;
                else if (string.Equals(res.CodigoError, "RUTINA_DUPLICADA", StringComparison.OrdinalIgnoreCase)) context.Response.StatusCode = 409;
                else context.Response.StatusCode = 400;

                context.Response.Write(js.Serialize(new { success = false, message = res.Message ?? "No fue posible guardar la rutina.", codigoError = res.CodigoError }));
                return;
            }

            confirmado = true;
            RepositorioAuditoria.Registrar(new RegistrarAuditoriaRequest { Modulo="Rutinas", Accion=payload.IdRutina>0?"Actualizar":"Crear", IdUsuario=idActor, Entidad="rut.Rutinas", IdRegistro=res.IdRutina.ToString(), Descripcion="Guardado de rutina, sesiones y ejercicios." });
            context.Response.StatusCode = payload != null && payload.IdRutina > 0 ? 200 : 201;
            context.Response.Write(js.Serialize(new { success = true, message = res.Message, idRutina = res.IdRutina }));
        }
        catch (InvalidOperationException ex)
        {
            context.Response.StatusCode = 400;
            context.Response.Write(js.Serialize(new { success = false, message = ex.Message }));
        }
        catch
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible guardar la rutina." }));
        }
        finally
        {
            if (!confirmado && archivosGuardados != null)
                foreach (string reference in archivosGuardados.Values)
                {
                    try { File.Delete(Path.Combine(context.Server.MapPath("~/App_Data/RoutineMedia"), reference)); }
                    catch (IOException) { }
                    catch (UnauthorizedAccessException) { }
                }
        }
    }

    private static bool TryLeerSolicitud(HttpContext context, JavaScriptSerializer js, out RutinaEditorPayload payload, out Dictionary<string, string> archivosGuardados, out string error)
    {
        payload = null;
        error = null;
        archivosGuardados = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        string contentType = context.Request.ContentType ?? string.Empty;
        bool esJson = contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase);
        bool esMultipart = contentType.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase);

        if (!esJson && !esMultipart)
        {
            error = "Content-Type inválido.";
            return false;
        }

        if (esJson)
        {
            if (context.Request.InputStream == null)
            {
                error = "Solicitud inválida.";
                return false;
            }

            if (context.Request.InputStream.CanSeek && context.Request.InputStream.Length > MaxBodyBytes)
            {
                error = "El tamaño de la solicitud excede el máximo permitido.";
                return false;
            }

            string body = new StreamReader(context.Request.InputStream).ReadToEnd();
            if (string.IsNullOrWhiteSpace(body))
            {
                error = "Solicitud vacía.";
                return false;
            }

            try { payload = js.Deserialize<RutinaEditorPayload>(body); }
            catch { payload = null; }

            if (payload == null)
            {
                error = "No se pudo interpretar la solicitud.";
                return false;
            }

            return true;
        }

        if (context.Request.ContentLength > 32 * 1024 * 1024 || context.Request.Files.Count > 40)
        { error = "La solicitud excede 32 MB o 40 imágenes. Guarda por partes."; return false; }
        string metadata = (context.Request.Form[CampoMetadata] ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(metadata))
        {
            error = "No se recibió metadata de la rutina.";
            return false;
        }

        if (metadata.Length > MaxBodyBytes) { error = "La información de la rutina es demasiado extensa."; return false; }
        try { payload = js.Deserialize<RutinaEditorPayload>(metadata); }
        catch { payload = null; }

        if (payload == null)
        {
            error = "Metadata inválida para la rutina.";
            return false;
        }

        for (int i = 0; i < context.Request.Files.Count; i++)
        {
            HttpPostedFile file = context.Request.Files[i];
            if (file == null || file.ContentLength <= 0) continue;

            string key = context.Request.Files.AllKeys[i] ?? string.Empty;
            if (string.IsNullOrWhiteSpace(key))
            {
                error = "Archivo sin identificador.";
                return false;
            }

            byte[] contenido;
            string extension;
            string validacionError;
            if (!TryValidarImagenSubida(file, out contenido, out extension, out validacionError))
            {
                error = validacionError;
                return false;
            }

            string referencia = GuardarArchivoMedia(context, contenido, extension);
            archivosGuardados[key] = referencia;
        }

        return true;
    }

    private static bool AplicarReferenciasSubidas(RutinaEditorPayload payload, Dictionary<string, string> archivosGuardados, out string error)
    {
        error = null;
        if (payload == null) { error = "Payload inválido."; return false; }

        payload.PortadaReferencia = ResolverReferencia(payload.PortadaReferencia, archivosGuardados, out error);
        if (!string.IsNullOrEmpty(error)) return false;

        if (payload.Sesiones == null) return true;
        for (int i = 0; i < payload.Sesiones.Count; i++)
        {
            RutinaEditorSesionPayload sesion = payload.Sesiones[i];
            if (sesion == null || sesion.Ejercicios == null) continue;

            for (int j = 0; j < sesion.Ejercicios.Count; j++)
            {
                RutinaEditorEjercicioPayload ejercicio = sesion.Ejercicios[j];
                if (ejercicio == null) continue;
                ejercicio.FotoReferencia = ResolverReferencia(ejercicio.FotoReferencia, archivosGuardados, out error);
                if (!string.IsNullOrEmpty(error)) return false;
            }
        }

        return true;
    }

    private static string ResolverReferencia(string valor, Dictionary<string, string> archivosGuardados, out string error)
    {
        error = null;
        string referencia = (valor ?? string.Empty).Trim();
        if (referencia.Length == 0) return null;

        if (referencia.StartsWith("upload:", StringComparison.OrdinalIgnoreCase))
        {
            string key = referencia.Substring("upload:".Length).Trim();
            if (key.Length == 0 || !archivosGuardados.ContainsKey(key))
            {
                error = "No se encontró el archivo indicado para guardar.";
                return null;
            }
            return archivosGuardados[key];
        }

        string nombreArchivo = Path.GetFileName(referencia);
        if (!string.Equals(nombreArchivo, referencia, StringComparison.Ordinal))
        {
            error = "Referencia de archivo inválida.";
            return null;
        }

        string ext = Path.GetExtension(nombreArchivo).ToLowerInvariant();
        if (ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp")
        {
            error = "Formato de referencia de imagen inválido.";
            return null;
        }

        return nombreArchivo;
    }

    private static bool TryValidarImagenSubida(HttpPostedFile postedFile, out byte[] contenido, out string extension, out string error)
    {
        contenido = null;
        extension = null;
        error = null;

        if (postedFile == null || postedFile.ContentLength <= 0)
        {
            error = "Archivo de imagen inválido.";
            return false;
        }

        if (postedFile.ContentLength > MaxImagenBytes)
        {
            error = "La imagen excede el tamaño máximo de 5 MB.";
            return false;
        }

        string ext = Path.GetExtension(Path.GetFileName(postedFile.FileName) ?? string.Empty).ToLowerInvariant();
        if (ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp")
        {
            error = "Formato de imagen no permitido. Usa JPG, PNG o WebP.";
            return false;
        }

        using (MemoryStream ms = new MemoryStream())
        {
            postedFile.InputStream.CopyTo(ms);
            contenido = ms.ToArray();
        }

        if (contenido == null || contenido.Length == 0)
        {
            error = "No fue posible leer la imagen.";
            return false;
        }

        if (!EsFirmaValida(ext, contenido))
        {
            error = "La imagen no coincide con el formato reportado.";
            return false;
        }

        extension = ext == ".jpeg" ? ".jpg" : ext;
        return true;
    }

    private static bool EsFirmaValida(string ext, byte[] data)
    {
        if (data == null || data.Length < 12) return false;

        if (string.Equals(ext, ".jpg", StringComparison.OrdinalIgnoreCase) || string.Equals(ext, ".jpeg", StringComparison.OrdinalIgnoreCase))
        {
            return data.Length >= 4 && data[0] == 0xFF && data[1] == 0xD8 && data[data.Length - 2] == 0xFF && data[data.Length - 1] == 0xD9;
        }

        if (string.Equals(ext, ".png", StringComparison.OrdinalIgnoreCase))
        {
            return data.Length >= 8 && data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47;
        }

        if (string.Equals(ext, ".webp", StringComparison.OrdinalIgnoreCase))
        {
            return data.Length >= 12 && data[0] == 0x52 && data[1] == 0x49 && data[2] == 0x46 && data[3] == 0x46 && data[8] == 0x57 && data[9] == 0x45 && data[10] == 0x42 && data[11] == 0x50;
        }

        return false;
    }

    private static string GuardarArchivoMedia(HttpContext context, byte[] contenido, string extension)
    {
        string carpeta = context.Server.MapPath("~/App_Data/RoutineMedia");
        if (!Directory.Exists(carpeta)) Directory.CreateDirectory(carpeta);

        string nombre = string.Concat("rt_", DateTime.UtcNow.ToString("yyyyMMddHHmmssfff"), "_", Guid.NewGuid().ToString("N"), extension);
        string ruta = Path.Combine(carpeta, nombre);
        File.WriteAllBytes(ruta, contenido);
        return nombre;
    }
}
