<%@ WebHandler Language="C#" Class="ProfileHandler" %>
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;
using System.Data.SqlClient;

using JavaScriptSerializer = System.Web.Script.Serialization.JavaScriptSerializer;

public class ProfileResponse
{
    public bool success { get; set; }
    public string message { get; set; }
    public string nombre { get; set; }
    public string apellido1 { get; set; }
    public string apellido2 { get; set; }
    public string correo { get; set; }
    public string telefono { get; set; }
    public string rol { get; set; }
    public string fotoUrl { get; set; }
    public string fechaNacimiento { get; set; }
    public int? edad { get; set; }
    public string sexo { get; set; }
    public string nivelActividad { get; set; }
    public object progresoReciente { get; set; }
    public List<ProgresoPerfilResponse> historialProgreso { get; set; }
    public long? idProgreso { get; set; }
}

public class ProgresoPerfilResponse
{
    public long idProgreso { get; set; }
    public string fecha { get; set; }
    public decimal? pesoKg { get; set; }
    public decimal? cinturaCm { get; set; }
    public decimal? caderaCm { get; set; }
    public decimal? pechoCm { get; set; }
    public decimal? brazoCm { get; set; }
    public decimal? musloCm { get; set; }
}

public class ProfileHandler : IHttpHandler
{
    private const int MaxPhotoBytes = 5 * 1024 * 1024;

    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        context.Response.ContentEncoding = Encoding.UTF8;
        context.Response.Charset = "utf-8";
        context.Response.TrySkipIisCustomErrors = true;
        ConfigurarNoCache(context.Response);
        var js = new JavaScriptSerializer();

        try
        {
            if (context.User == null || context.User.Identity == null || !context.User.Identity.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                EscribirJson(context, js, new ProfileResponse { success = false, message = "No autorizado." });
                return;
            }

            var correo = context.User.Identity.Name;
            if (string.IsNullOrWhiteSpace(correo))
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                EscribirJson(context, js, new ProfileResponse { success = false, message = "No autorizado." });
                return;
            }

            correo = correo.Trim().ToLowerInvariant();
            var usuarioSesion = RepositorioUsuario.ObtenerPorCorreo(correo);
            if (usuarioSesion == null || !usuarioSesion.Activo)
            {
                context.Response.StatusCode = 403;
                EscribirJson(context, js, new ProfileResponse { success = false, message = "Acceso denegado." });
                return;
            }

            if (string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                var action = context.Request.QueryString["action"] ?? context.Request.Form["action"];
                if (string.Equals(action, "uploadPhoto", StringComparison.OrdinalIgnoreCase))
                {
                    ProcesarSubidaFoto(context, js, correo);
                    return;
                }
                if (string.Equals(action, "deletePhoto", StringComparison.OrdinalIgnoreCase))
                {
                    ProcesarEliminarFoto(context, js, correo);
                    return;
                }
                var guardarMedicion = string.Equals(action, "saveProgress", StringComparison.OrdinalIgnoreCase);
                var guardarDatosPersonales = string.Equals(action, "savePersonalProgress", StringComparison.OrdinalIgnoreCase);
                if (guardarMedicion || guardarDatosPersonales)
                {
                    if (!string.Equals(RepositorioUsuario.ObtenerNombreRolPorId(usuarioSesion.IdRol), "Cliente", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Response.StatusCode = 403;
                        EscribirJson(context, js, new ProfileResponse { success = false, message = "Esta función es para cuentas de cliente." });
                        return;
                    }

                    try
                    {
                        MigracionesPerfilProgreso.PrepararLocalDb();
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Trace.TraceError("PROFILE_PROGRESS_MIGRATION: " + ex);
                        context.Response.StatusCode = 503;
                        EscribirJson(context, js, new ProfileResponse { success = false, message = "No se pudo preparar la base de datos de Mi progreso. Ejecuta tools\\Aplicar-Migraciones.ps1 -SoloPerfil en la base configurada para el sitio." });
                        return;
                    }

                    if (guardarMedicion)
                        ProcesarGuardarProgreso(context, js, correo);
                    else
                        ProcesarGuardarDatosPersonalesProgreso(context, js, correo);
                    return;
                }

                ProcesarActualizacionPerfil(context, js, correo);
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                EscribirJson(context, js, new ProfileResponse { success = false, message = "Método no permitido." });
                return;
            }

            var usuario = usuarioSesion;

            var rolNombre = RepositorioUsuario.ObtenerNombreRolPorId(usuario.IdRol);
            var fotoUrl = string.IsNullOrWhiteSpace(usuario.FotoPerfil)
                ? null
                : "/api/profile-photo.ashx?v=" + HttpUtility.UrlEncode(usuario.FotoPerfil);

            var datosCliente = RepositorioUsuario.ObtenerDatosClientePerfilPorCorreo(correo);
            var historial = new List<RegistroProgresoPerfil>();
            if (datosCliente != null && string.Equals(rolNombre, "Cliente", StringComparison.OrdinalIgnoreCase))
            {
                try { historial = RepositorioUsuario.ListarProgresoPerfilPorCorreo(correo); }
                catch (SqlException ex)
                {
                    if (ex.Number != 207 && ex.Number != 208) throw;
                    System.Diagnostics.Trace.TraceError("PROFILE_PROGRESS_SCHEMA: " + ex.Number);
                }
            }
            var historialResponse = new List<ProgresoPerfilResponse>();

            for (var i = 0; i < historial.Count; i += 1)
            {
                historialResponse.Add(MapearProgreso(historial[i]));
            }

            var resp = new ProfileResponse
            {
                success = true,
                nombre = usuario.Nombre,
                apellido1 = usuario.Apellido1,
                apellido2 = usuario.Apellido2,
                correo = usuario.Correo,
                telefono = usuario.Telefono,
                rol = rolNombre,
                fotoUrl = fotoUrl,
                fechaNacimiento = datosCliente != null && datosCliente.FechaNacimiento.HasValue
                    ? datosCliente.FechaNacimiento.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                    : null,
                edad = datosCliente != null ? CalcularEdadEnAnios(datosCliente.FechaNacimiento) : null,
                sexo = datosCliente != null ? datosCliente.Sexo : null,
                nivelActividad = datosCliente != null ? datosCliente.NivelActividad : null,
                historialProgreso = historialResponse,
                progresoReciente = historialResponse.Count > 0 ? (object)historialResponse[0] : null
            };

            EscribirJson(context, js, resp);
        }
        catch (Exception)
        {
            context.Response.StatusCode = 500;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Error del servidor." });
        }
    }

    private static void ProcesarActualizacionPerfil(HttpContext context, JavaScriptSerializer js, string correo)
    {
        var req = LeerCuerpoJson(context, js);
        if (req == null)
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Datos inválidos." });
            return;
        }

        string nombre = ObtenerTexto(req, "nombre", "");
        string apellido1 = ObtenerTexto(req, "apellido1", "");
        string apellido2 = ObtenerTexto(req, "apellido2", null);
        string telefono = ObtenerTexto(req, "telefono", null);

        nombre = nombre != null ? nombre.Trim() : null;
        apellido1 = apellido1 != null ? apellido1.Trim() : null;
        apellido2 = apellido2 != null ? apellido2.Trim() : null;
        telefono = telefono != null ? telefono.Trim() : null;

        if (string.IsNullOrWhiteSpace(nombre))
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Nombre es obligatorio." });
            return;
        }
        if (string.IsNullOrWhiteSpace(apellido1))
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Primer apellido es obligatorio." });
            return;
        }
        if (nombre.Length > 100 || apellido1.Length > 100 || (apellido2 != null && apellido2.Length > 100) || (telefono != null && telefono.Length > 30))
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Uno o más campos exceden la longitud permitida." });
            return;
        }

        var ok = RepositorioUsuario.ActualizarPerfil(correo, nombre, apellido1, apellido2, telefono);
        if (!ok)
        {
            context.Response.StatusCode = 404;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Usuario no encontrado." });
            return;
        }

        var incluyeDatosCliente = req.ContainsKey("fechaNacimiento") || req.ContainsKey("sexo") || req.ContainsKey("nivelActividad");
        if (incluyeDatosCliente)
        {
            var actual = RepositorioUsuario.ObtenerDatosClientePerfilPorCorreo(correo);
            if (actual == null)
            {
                context.Response.StatusCode = 404;
                EscribirJson(context, js, new ProfileResponse { success = false, message = "No se encontró el perfil de cliente." });
                return;
            }

            var fechaNacimiento = actual.FechaNacimiento;
            var sexo = actual.Sexo;
            var nivelActividad = actual.NivelActividad;

            if (req.ContainsKey("fechaNacimiento"))
            {
                string errorFecha;
                if (!TryParseFechaNacimiento(ObtenerTexto(req, "fechaNacimiento", null), out fechaNacimiento, out errorFecha))
                {
                    context.Response.StatusCode = 400;
                    EscribirJson(context, js, new ProfileResponse { success = false, message = errorFecha });
                    return;
                }
            }

            if (req.ContainsKey("sexo"))
            {
                sexo = LimpiarTextoOpcional(ObtenerTexto(req, "sexo", null));
                if (sexo != null && !EsSexoValido(sexo))
                {
                    context.Response.StatusCode = 400;
                    EscribirJson(context, js, new ProfileResponse { success = false, message = "Sexo inválido." });
                    return;
                }
            }

            if (req.ContainsKey("nivelActividad"))
            {
                nivelActividad = LimpiarTextoOpcional(ObtenerTexto(req, "nivelActividad", null));
                if (nivelActividad != null && !EsNivelActividadValido(nivelActividad))
                {
                    context.Response.StatusCode = 400;
                    EscribirJson(context, js, new ProfileResponse { success = false, message = "Nivel de actividad física inválido." });
                    return;
                }
            }

            var okCliente = RepositorioUsuario.ActualizarDatosClientePerfilPorCorreo(correo, fechaNacimiento, sexo, nivelActividad);
            if (!okCliente)
            {
                context.Response.StatusCode = 404;
                EscribirJson(context, js, new ProfileResponse { success = false, message = "No se encontró el perfil de cliente." });
                return;
            }
        }

        EscribirJson(context, js, new ProfileResponse { success = true, message = "Perfil actualizado correctamente." });
    }

    private static void ProcesarGuardarDatosPersonalesProgreso(HttpContext context, JavaScriptSerializer js, string correo)
    {
        var req = LeerCuerpoJson(context, js);
        if (req == null)
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Datos inválidos." });
            return;
        }

        var actual = RepositorioUsuario.ObtenerDatosClientePerfilPorCorreo(correo);
        if (actual == null)
        {
            context.Response.StatusCode = 404;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "No se encontró el perfil de cliente." });
            return;
        }

        var fechaNacimiento = actual.FechaNacimiento;
        var sexo = actual.Sexo;
        var nivelActividad = actual.NivelActividad;

        if (req.ContainsKey("fechaNacimiento"))
        {
            string errorFecha;
            if (!TryParseFechaNacimiento(ObtenerTexto(req, "fechaNacimiento", null), out fechaNacimiento, out errorFecha))
            {
                context.Response.StatusCode = 400;
                EscribirJson(context, js, new ProfileResponse { success = false, message = errorFecha });
                return;
            }
        }

        if (req.ContainsKey("sexo"))
        {
            sexo = LimpiarTextoOpcional(ObtenerTexto(req, "sexo", null));
            if (sexo != null && !EsSexoValido(sexo))
            {
                context.Response.StatusCode = 400;
                EscribirJson(context, js, new ProfileResponse { success = false, message = "Sexo inválido." });
                return;
            }
        }

        if (req.ContainsKey("nivelActividad"))
        {
            nivelActividad = LimpiarTextoOpcional(ObtenerTexto(req, "nivelActividad", null));
            if (nivelActividad != null && !EsNivelActividadValido(nivelActividad))
            {
                context.Response.StatusCode = 400;
                EscribirJson(context, js, new ProfileResponse { success = false, message = "Nivel de actividad física inválido." });
                return;
            }
        }

        try
        {
            var okCliente = RepositorioUsuario.ActualizarDatosClientePerfilPorCorreo(correo, fechaNacimiento, sexo, nivelActividad);
            if (!okCliente)
            {
                context.Response.StatusCode = 404;
                EscribirJson(context, js, new ProfileResponse { success = false, message = "No se encontró el perfil de cliente." });
                return;
            }
        }
        catch (SqlException ex)
        {
            context.Response.StatusCode = 500;
            EscribirJson(context, js, new ProfileResponse { success = false, message = ConstruirMensajeSqlDatosPersonales(ex) });
            return;
        }

        EscribirJson(context, js, new ProfileResponse
        {
            success = true,
            message = "Datos personales actualizados correctamente.",
            fechaNacimiento = fechaNacimiento.HasValue ? fechaNacimiento.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : null,
            edad = CalcularEdadEnAnios(fechaNacimiento),
            sexo = sexo,
            nivelActividad = nivelActividad
        });
    }

    private static void ProcesarGuardarProgreso(HttpContext context, JavaScriptSerializer js, string correo)
    {
        var req = LeerCuerpoJson(context, js);
        if (req == null)
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Datos inválidos." });
            return;
        }

        string fechaRaw = ObtenerTexto(req, "fecha", null);
        DateTime fechaRegistro;
        if (!DateTime.TryParseExact(fechaRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fechaRegistro))
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Debe indicar una fecha válida." });
            return;
        }

        if (fechaRegistro.Date > RepositorioHorariosConsulta.AhoraCostaRica().Date)
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "La fecha no puede ser futura." });
            return;
        }

        decimal pesoKg;
        if (!TryParseDecimalFlexible(ObtenerTexto(req, "pesoKg", null), out pesoKg) || pesoKg <= 0m || pesoKg > 500m)
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Debe indicar un peso válido entre 0 y 500 kg." });
            return;
        }

        decimal? cinturaCm;
        decimal? caderaCm;
        decimal? pechoCm;
        decimal? brazoCm;
        decimal? musloCm;

        if (!TryParseMedidaOpcional(ObtenerTexto(req, "cinturaCm", null), 300m, out cinturaCm))
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Cintura: valor inválido. Usa un número mayor a 0 y máximo 300 cm." });
            return;
        }

        if (!TryParseMedidaOpcional(ObtenerTexto(req, "caderaCm", null), 300m, out caderaCm))
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Cadera: valor inválido. Usa un número mayor a 0 y máximo 300 cm." });
            return;
        }

        if (!TryParseMedidaOpcional(ObtenerTexto(req, "pechoCm", null), 300m, out pechoCm))
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Pecho: valor inválido. Usa un número mayor a 0 y máximo 300 cm." });
            return;
        }

        if (!TryParseMedidaOpcional(ObtenerTexto(req, "brazoCm", null), 200m, out brazoCm))
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Brazo: valor inválido. Usa un número mayor a 0 y máximo 200 cm." });
            return;
        }

        if (!TryParseMedidaOpcional(ObtenerTexto(req, "musloCm", null), 250m, out musloCm))
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Muslo: valor inválido. Usa un número mayor a 0 y máximo 250 cm." });
            return;
        }

        long? idProgreso = null;
        if (req.ContainsKey("idProgreso"))
        {
            long parsed;
            if (!long.TryParse(Convert.ToString(req["idProgreso"], CultureInfo.InvariantCulture), NumberStyles.Integer, CultureInfo.InvariantCulture, out parsed) || parsed <= 0)
            {
                context.Response.StatusCode = 400;
                EscribirJson(context, js, new ProfileResponse { success = false, message = "Identificador de progreso inválido." });
                return;
            }
            idProgreso = parsed;
        }

        GuardarProgresoPerfilResultado resultado;
        try
        {
            resultado = RepositorioUsuario.GuardarProgresoPerfilPorCorreo(correo, idProgreso, fechaRegistro, pesoKg, cinturaCm, caderaCm, pechoCm, brazoCm, musloCm);
        }
        catch (SqlException ex)
        {
            context.Response.StatusCode = 500;
            EscribirJson(context, js, new ProfileResponse { success = false, message = ConstruirMensajeSqlProgreso(ex) });
            return;
        }

        if (!resultado.ClienteEncontrado)
        {
            context.Response.StatusCode = 404;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "No se encontró el perfil de cliente." });
            return;
        }

        if (!resultado.Exitoso)
        {
            context.Response.StatusCode = 404;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "No se encontró el registro de progreso a editar." });
            return;
        }

        EscribirJson(context, js, new ProfileResponse
        {
            success = true,
            message = idProgreso.HasValue ? "Registro de progreso actualizado correctamente." : "Registro de progreso guardado correctamente.",
            idProgreso = resultado.IdProgreso
        });
    }

    private static void ProcesarSubidaFoto(HttpContext context, JavaScriptSerializer js, string correo)
    {
        var archivo = context.Request.Files["foto"];
        if (archivo == null || archivo.ContentLength <= 0)
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Debe seleccionar una imagen válida." });
            return;
        }

        if (archivo.ContentLength > MaxPhotoBytes)
        {
            context.Response.StatusCode = 413;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "La imagen supera el tamaño máximo permitido (5 MB)." });
            return;
        }

        var extension = Path.GetExtension(archivo.FileName);
        var extensionNormalizada = NormalizarExtension(extension);
        if (extensionNormalizada == null)
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Formato no permitido. Use JPEG o PNG." });
            return;
        }

        var mime = (archivo.ContentType ?? string.Empty).Trim().ToLowerInvariant();
        if (mime != "image/jpeg" && mime != "image/png")
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Tipo MIME no permitido. Use JPEG o PNG." });
            return;
        }

        byte[] contenido;
        using (var ms = new MemoryStream())
        {
            archivo.InputStream.CopyTo(ms);
            contenido = ms.ToArray();
        }

        if (!ContenidoCoincideConFormato(contenido, extensionNormalizada))
        {
            context.Response.StatusCode = 400;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "El archivo no corresponde a una imagen JPEG o PNG válida." });
            return;
        }

        // Use a KFitness-controlled uploads folder so images persist and are easy to manage
        // Preferir carpeta privada bajo App_Data, pero no mover archivos existentes automáticamente.
        var carpetaPrivada = context.Server.MapPath("~/App_Data/ProfilePhotos");
        var carpetaPublica = context.Server.MapPath("~/Content/Uploads/Profiles");
        string carpetaSeleccionada = carpetaPrivada;

        try
        {
            Directory.CreateDirectory(carpetaPrivada);
        }
        catch
        {
            carpetaSeleccionada = carpetaPublica;
            Directory.CreateDirectory(carpetaPublica);
        }

        var nuevoNombre = Guid.NewGuid().ToString("N") + extensionNormalizada;
        var nuevaRuta = Path.Combine(carpetaSeleccionada, nuevoNombre);
        var fotoAnterior = RepositorioUsuario.ObtenerFotoPerfilPorCorreo(correo);

        // 1) Escribir el archivo nuevo
        try
        {
            File.WriteAllBytes(nuevaRuta, contenido);
        }
        catch
        {
            context.Response.StatusCode = 500;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "No fue posible guardar la foto de perfil en el servidor." });
            return;
        }

        // 2) Actualizar referencia en la base de datos
        var actualizado = RepositorioUsuario.ActualizarFotoPerfilPorCorreo(correo, nuevoNombre);
        if (!actualizado)
        {
            try { if (File.Exists(nuevaRuta)) File.Delete(nuevaRuta); } catch { }
            context.Response.StatusCode = 404;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Usuario no encontrado." });
            return;
        }

        // 3) Intentar eliminar el archivo anterior sin afectar la operación.
        try
        {
            // Eliminar en posible carpeta privada y pública (no sabemos dónde estaba)
            EliminarArchivoSeguroDelUsuario(carpetaPrivada, fotoAnterior, nuevoNombre);
            EliminarArchivoSeguroDelUsuario(carpetaPublica, fotoAnterior, nuevoNombre);
        }
        catch (Exception ex)
        {
            try
            {
                var logDir = context.Server.MapPath("~/App_Data");
                Directory.CreateDirectory(logDir);
                var logFile = Path.Combine(logDir, "profile-photo-errors.log");
                File.AppendAllText(logFile, DateTime.UtcNow.ToString("o") + " - Error al eliminar foto anterior: " + ex.ToString() + Environment.NewLine);
            }
            catch { }
        }

        EscribirJson(context, js, new ProfileResponse
        {
            success = true,
            message = "Foto de perfil actualizada correctamente.",
            fotoUrl = "/api/profile-photo.ashx?v=" + HttpUtility.UrlEncode(nuevoNombre)
        });
    }

    private static void ProcesarEliminarFoto(HttpContext context, JavaScriptSerializer js, string correo)
    {
        var fotoAnterior = RepositorioUsuario.ObtenerFotoPerfilPorCorreo(correo);
        var actualizado = RepositorioUsuario.ActualizarFotoPerfilPorCorreo(correo, null);
        if (!actualizado)
        {
            context.Response.StatusCode = 404;
            EscribirJson(context, js, new ProfileResponse { success = false, message = "Usuario no encontrado." });
            return;
        }

        var carpetaPrivada = context.Server.MapPath("~/App_Data/ProfilePhotos");
        var carpetaPublica = context.Server.MapPath("~/Content/Uploads/Profiles");

        try
        {
            EliminarArchivoSeguroDelUsuario(carpetaPrivada, fotoAnterior, null);
            EliminarArchivoSeguroDelUsuario(carpetaPublica, fotoAnterior, null);
        }
        catch (Exception ex)
        {
            try
            {
                var logDir = context.Server.MapPath("~/App_Data");
                Directory.CreateDirectory(logDir);
                var logFile = Path.Combine(logDir, "profile-photo-errors.log");
                File.AppendAllText(logFile, DateTime.UtcNow.ToString("o") + " - Error al eliminar foto anterior: " + ex.ToString() + Environment.NewLine);
            }
            catch { }
        }

        EscribirJson(context, js, new ProfileResponse
        {
            success = true,
            message = "Foto de perfil eliminada correctamente.",
            fotoUrl = null
        });
    }

    private static void EliminarArchivoSeguroDelUsuario(string carpeta, string referencia, string nombreExcluido)
    {
        if (string.IsNullOrWhiteSpace(referencia)) return;

        var nombre = Path.GetFileName(referencia);
        if (!string.Equals(nombre, referencia, StringComparison.Ordinal)) return;
        if (!string.IsNullOrWhiteSpace(nombreExcluido) && string.Equals(nombre, nombreExcluido, StringComparison.OrdinalIgnoreCase)) return;

        var ruta = Path.Combine(carpeta, nombre);
        if (File.Exists(ruta))
        {
            File.Delete(ruta);
        }
    }

    private static string NormalizarExtension(string extension)
    {
        if (string.IsNullOrWhiteSpace(extension)) return null;

        extension = extension.Trim().ToLowerInvariant();
        if (extension == ".jpg" || extension == ".jpeg") return ".jpg";
        if (extension == ".png") return ".png";
        return null;
    }

    private static bool ContenidoCoincideConFormato(byte[] contenido, string extensionNormalizada)
    {
        if (contenido == null || contenido.Length < 4) return false;

        var firmaJpg = contenido[0] == 0xFF && contenido[1] == 0xD8;
        var firmaPng = contenido[0] == 0x89 && contenido[1] == 0x50 && contenido[2] == 0x4E && contenido[3] == 0x47;

        if (extensionNormalizada == ".jpg" && !firmaJpg) return false;
        if (extensionNormalizada == ".png" && !firmaPng) return false;

        try
        {
            using (var ms = new MemoryStream(contenido))
            using (var img = Image.FromStream(ms, true, true))
            {
                return img.Width > 0 && img.Height > 0;
            }
        }
        catch
        {
            return false;
        }
    }

    private static Dictionary<string, object> LeerCuerpoJson(HttpContext context, JavaScriptSerializer js)
    {
        var body = new StreamReader(context.Request.InputStream).ReadToEnd();
        if (string.IsNullOrWhiteSpace(body)) return new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);

        try
        {
            return js.DeserializeObject(body) as Dictionary<string, object>;
        }
        catch
        {
            return null;
        }
    }

    private static string ObtenerTexto(Dictionary<string, object> req, string key, string defaultValue)
    {
        if (req == null || string.IsNullOrWhiteSpace(key) || !req.ContainsKey(key)) return defaultValue;
        return Convert.ToString(req[key], CultureInfo.InvariantCulture);
    }

    private static string LimpiarTextoOpcional(string value)
    {
        if (value == null) return null;
        value = value.Trim();
        return value.Length == 0 ? null : value;
    }

    private static bool TryParseFechaNacimiento(string raw, out DateTime? fechaNacimiento, out string error)
    {
        fechaNacimiento = null;
        error = null;

        raw = LimpiarTextoOpcional(raw);
        if (raw == null) return true;

        DateTime parsed;
        if (!DateTime.TryParseExact(raw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsed))
        {
            error = "La fecha de nacimiento no es válida.";
            return false;
        }

        if (parsed.Date > DateTime.Today)
        {
            error = "La fecha de nacimiento no puede ser futura.";
            return false;
        }

        fechaNacimiento = parsed.Date;
        return true;
    }

    private static bool EsSexoValido(string sexo)
    {
        return string.Equals(sexo, "Femenino", StringComparison.OrdinalIgnoreCase)
            || string.Equals(sexo, "Masculino", StringComparison.OrdinalIgnoreCase)
            || string.Equals(sexo, "Prefiero no indicarlo", StringComparison.OrdinalIgnoreCase);
    }

    private static bool EsNivelActividadValido(string nivel)
    {
        return string.Equals(nivel, "Sedentario", StringComparison.OrdinalIgnoreCase)
            || string.Equals(nivel, "Ligero", StringComparison.OrdinalIgnoreCase)
            || string.Equals(nivel, "Moderado", StringComparison.OrdinalIgnoreCase)
            || string.Equals(nivel, "Alto", StringComparison.OrdinalIgnoreCase)
            || string.Equals(nivel, "Muy alto", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryParseDecimalFlexible(string raw, out decimal value)
    {
        value = 0m;
        raw = LimpiarTextoOpcional(raw);
        if (raw == null) return false;

        raw = raw.Replace(',', '.');
        return decimal.TryParse(raw, NumberStyles.Number, CultureInfo.InvariantCulture, out value);
    }

    private static bool TryParseMedidaOpcional(string raw, decimal maximo, out decimal? value)
    {
        value = null;
        raw = LimpiarTextoOpcional(raw);
        if (raw == null) return true;

        decimal parsed;
        if (!TryParseDecimalFlexible(raw, out parsed)) return false;
        if (parsed <= 0m || parsed > maximo) return false;

        value = parsed;
        return true;
    }

    private static int? CalcularEdadEnAnios(DateTime? fechaNacimiento)
    {
        if (!fechaNacimiento.HasValue) return null;

        var hoy = DateTime.Today;
        var edad = hoy.Year - fechaNacimiento.Value.Year;
        if (fechaNacimiento.Value.Date > hoy.AddYears(-edad)) edad -= 1;
        return edad >= 0 ? (int?)edad : null;
    }

    private static ProgresoPerfilResponse MapearProgreso(RegistroProgresoPerfil item)
    {
        if (item == null) return null;

        return new ProgresoPerfilResponse
        {
            idProgreso = item.IdProgreso,
            fecha = item.FechaRegistro.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            pesoKg = item.PesoKg,
            cinturaCm = item.CinturaCm,
            caderaCm = item.CaderaCm,
            pechoCm = item.PechoCm,
            brazoCm = item.BrazoCm,
            musloCm = item.MusloCm
        };
    }

    private static string ConstruirMensajeSqlDatosPersonales(SqlException ex)
    {
        if (ex == null) return "No fue posible guardar los datos personales.";
        if (ex.Number == 207 || ex.Number == 208)
        {
            return "Falta el esquema de datos personales. Aplica las migraciones de Mi progreso en la base que usa el sitio.";
        }
        return "No fue posible guardar los datos personales en este momento.";
    }

    private static string ConstruirMensajeSqlProgreso(SqlException ex)
    {
        if (ex == null) return "No fue posible guardar el registro de progreso.";
        if (ex.Number == 207 || ex.Number == 208)
        {
            return "Falta el esquema de mediciones. Aplica las migraciones de Mi progreso en la base que usa el sitio.";
        }
        if (ex.Number == 547)
        {
            return "Algún dato de la medición no cumple los rangos permitidos.";
        }
        return "No fue posible guardar el registro de progreso en este momento.";
    }

    private static void ConfigurarNoCache(HttpResponse response)
    {
        if (response == null) return;

        response.Cache.SetCacheability(HttpCacheability.NoCache);
        response.Cache.SetNoStore();
        response.Cache.SetRevalidation(HttpCacheRevalidation.AllCaches);
        response.Cache.SetExpires(DateTime.UtcNow.AddMinutes(-1));
        response.AppendHeader("Pragma", "no-cache");
    }

    private static void EscribirJson(HttpContext context, JavaScriptSerializer js, ProfileResponse payload)
    {
        context.Response.ContentType = "application/json";
        context.Response.Write(js.Serialize(payload));
    }
}
