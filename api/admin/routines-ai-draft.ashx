<%@ WebHandler Language="C#" Class="AdminRoutinesAiDraftHandler" %>
using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Net;
using System.Data.SqlClient;
using System.Text;
using System.Web;
using System.Web.Caching;
using System.Web.Script.Serialization;

public class AdminRoutineAiDraftRequest
{
    public string objetivo { get; set; }
    public string nivel { get; set; }
    public object diasPorSemana { get; set; }
    public object minutosPorSesion { get; set; }
    public string equipoDisponible { get; set; }
}

public class AdminRoutinesAiDraftHandler : IHttpHandler
{
    private static readonly object RateLock = new object();

    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = Encoding.UTF8;
        context.Response.TrySkipIisCustomErrors = true;
        context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
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

            int idUsuario = auth.Usuario != null ? auth.Usuario.IdUsuario : 0;
            int remaining;
            DateTime retryAtUtc;
            int maxRequests;
            int windowMinutes;
            if (!TryConsumeQuota(idUsuario, out remaining, out retryAtUtc, out maxRequests, out windowMinutes))
            {
                context.Response.StatusCode = 429;
                string retryAtText = retryAtUtc == DateTime.MinValue
                    ? string.Empty
                    : retryAtUtc.ToLocalTime().ToString("HH:mm");
                string localLimitMessage = "Límite local de generación alcanzado (" + maxRequests.ToString() + " solicitudes por " + windowMinutes.ToString() + " minutos)."
                    + (string.IsNullOrWhiteSpace(retryAtText) ? string.Empty : (" Puedes volver a intentar a las " + retryAtText + "."));
                context.Response.Write(js.Serialize(new
                {
                    success = false,
                    message = localLimitMessage,
                    code = "AI_LOCAL_RATE_LIMIT",
                    source = "local",
                    maxRequests = maxRequests,
                    windowMinutes = windowMinutes,
                    retryAt = retryAtUtc == DateTime.MinValue ? null : retryAtUtc.ToString("o")
                }));
                return;
            }

            string apiKey = GetApiKey(context);
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                context.Response.StatusCode = 503;
                context.Response.Write(js.Serialize(new { success = false, message = "Generación no configurada", code = "AI_NOT_CONFIGURED" }));
                return;
            }

            string body = new StreamReader(context.Request.InputStream).ReadToEnd();
            AdminRoutineAiDraftRequest req = null;
            try { req = js.Deserialize<AdminRoutineAiDraftRequest>(body); } catch { req = null; }

            if (req == null)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Solicitud inválida." }));
                return;
            }

            int diasPorSemana;
            int minutosPorSesion;
            if (!TryInt(req.diasPorSemana, out diasPorSemana) || diasPorSemana < 1 || diasPorSemana > 7)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Días por semana inválido. Debe estar entre 1 y 7." }));
                return;
            }

            if (!TryInt(req.minutosPorSesion, out minutosPorSesion) || minutosPorSesion < 10 || minutosPorSesion > 180)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Minutos por sesión inválido. Debe estar entre 10 y 180." }));
                return;
            }

            string objetivo = (req.objetivo ?? string.Empty).Trim();
            string nivel = (req.nivel ?? string.Empty).Trim();
            string equipo = (req.equipoDisponible ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(objetivo) || objetivo.Length > 200)
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Objetivo inválido." }));
                return;
            }

            if (!EsNivelValido(nivel))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Nivel inválido." }));
                return;
            }

            if (ObjetivoRequiereValoracionProfesional(objetivo))
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Este caso requiere valoración profesional. No se generan rutinas de rehabilitación o tratamiento de lesiones." }));
                return;
            }

            string model = GetSetting("OpenAI.Rutinas.Model", "gpt-4o-mini");
            int timeoutMs = GetSettingInt("OpenAI.Rutinas.TimeoutMs", 20000, 5000, 60000);
            Dictionary<int, string> catalogoEjercicios = ObtenerCatalogoEjercicios();

            Dictionary<string, object> draft = SolicitarBorradorOpenAi(apiKey, model, timeoutMs, objetivo, nivel, diasPorSemana, minutosPorSesion, equipo, catalogoEjercicios, js);
            Dictionary<string, object> validated = ValidarBorrador(draft, objetivo, nivel, minutosPorSesion, catalogoEjercicios);

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new
            {
                success = true,
                message = "Borrador generado con IA. Revísalo antes de guardar.",
                borrador = validated,
                requiresCoachReview = true
            }));
        }
        catch (WebException webEx)
        {
            int status = 502;
            string message = "No fue posible conectar con el servicio de generación.";
            string errorCode = "AI_PROVIDER_CONNECTIVITY";

            if (webEx.Status == WebExceptionStatus.Timeout)
            {
                status = 504;
                message = "Tiempo de espera agotado al contactar el servicio de generación.";
                errorCode = "AI_PROVIDER_TIMEOUT";
            }

            HttpWebResponse response = webEx.Response as HttpWebResponse;
            if (response != null)
            {
                int code = (int)response.StatusCode;
                if (code == 429)
                {
                    status = 429;
                    string provider429Code = TryGetProvider429Code(response);
                    if (string.Equals(provider429Code, "insufficient_quota", StringComparison.OrdinalIgnoreCase))
                    {
                        message = "La cuota de generación del proveedor está agotada. Solicita al administrador revisar la facturación o los límites contratados.";
                        errorCode = "AI_PROVIDER_INSUFFICIENT_QUOTA";
                    }
                    else
                    {
                        message = "El proveedor limitó temporalmente la generación por exceso de solicitudes. Intenta más tarde.";
                        errorCode = "AI_PROVIDER_RATE_LIMIT";
                    }
                }
                else if (code == 401 || code == 403)
                {
                    status = 503;
                    message = "Credencial de generación inválida o acceso rechazado.";
                    errorCode = "AI_PROVIDER_AUTH_REJECTED";
                }
                else if (code == 408 || code == 504)
                {
                    status = 504;
                    message = "Tiempo de espera agotado al contactar el servicio de generación.";
                    errorCode = "AI_PROVIDER_TIMEOUT";
                }
                else if (code >= 500)
                {
                    status = 502;
                    message = "El servicio de generación no está disponible en este momento.";
                    errorCode = "AI_PROVIDER_UNAVAILABLE";
                }
            }

            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = status;
            context.Response.Write(js.Serialize(new { success = false, message = message, code = errorCode, source = "provider" }));
        }
        catch (InvalidDataException ex)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 502;
            context.Response.Write(js.Serialize(new { success = false, message = ex.Message }));
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible generar el borrador con IA." }));
        }
    }

    private static Dictionary<string, object> SolicitarBorradorOpenAi(
        string apiKey,
        string model,
        int timeoutMs,
        string objetivo,
        string nivel,
        int diasPorSemana,
        int minutosPorSesion,
        string equipoDisponible,
        Dictionary<int, string> catalogoEjercicios,
        JavaScriptSerializer js)
    {
        string endpoint = GetSetting("OpenAI.Rutinas.Endpoint", "https://api.openai.com/v1/chat/completions");
        if (!endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("Endpoint de generación inválido. Debe usar HTTPS.");

        bool hayCatalogo = catalogoEjercicios != null && catalogoEjercicios.Count > 0;
        string schema = hayCatalogo
            ? "{nombre, objetivo, nivel, duracionAproximadaMin, observacionesGenerales, sesiones:[{dia, ejercicios:[{idEjercicio, nombre, series, repeticiones, tiempoSegundos, descansoSegundos, observaciones}]}]}"
            : "{nombre, objetivo, nivel, duracionAproximadaMin, observacionesGenerales, sesiones:[{dia, ejercicios:[{nombre, series, repeticiones, tiempoSegundos, descansoSegundos, observaciones}]}]}";

        string systemPrompt = "Eres un asistente para entrenadores de gimnasio. " +
            "Devuelve ÚNICAMENTE JSON válido sin markdown. " +
            "No generes rehabilitación ni tratamiento de lesiones. " +
            "Si el objetivo sugiere lesión, indica observación para valoración profesional. " +
            "Esquema JSON: " + schema;

        string userPrompt = "Genera un borrador de rutina con estos parámetros: " +
            "objetivo='" + objetivo + "', nivel='" + nivel + "', diasPorSemana=" + diasPorSemana +
            ", minutosPorSesion=" + minutosPorSesion + ", equipoDisponible='" + equipoDisponible + "'. " +
            "No incluyas datos personales. Usa lenguaje claro en español.";

        if (hayCatalogo)
        {
            StringBuilder sbCatalogo = new StringBuilder();
            int count = 0;
            foreach (KeyValuePair<int, string> item in catalogoEjercicios)
            {
                sbCatalogo.Append(item.Key).Append(":").Append(item.Value).Append("; ");
                count++;
                if (count >= 120) break;
            }

            userPrompt += " Prioriza idEjercicio del catálogo y solo usa IDs existentes. Catálogo disponible (muestra): " + sbCatalogo.ToString();
        }

        var payload = new
        {
            model = model,
            temperature = 0.4,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }
        };

        string payloadJson = js.Serialize(payload);

        HttpWebRequest request = (HttpWebRequest)WebRequest.Create(endpoint);
        request.Method = "POST";
        request.ContentType = "application/json";
        request.Timeout = timeoutMs;
        request.ReadWriteTimeout = timeoutMs;
        request.Headers["Authorization"] = "Bearer " + apiKey.Trim();

        byte[] bytes = Encoding.UTF8.GetBytes(payloadJson);
        using (Stream requestStream = request.GetRequestStream())
        {
            requestStream.Write(bytes, 0, bytes.Length);
        }

        string responseText;
        using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
        using (StreamReader reader = new StreamReader(response.GetResponseStream()))
        {
            responseText = reader.ReadToEnd();
        }

        var root = js.DeserializeObject(responseText) as Dictionary<string, object>;
        if (root == null) throw new InvalidDataException("Respuesta inválida del servicio de generación.");

        object choicesObj;
        if (!root.TryGetValue("choices", out choicesObj))
            throw new InvalidDataException("Respuesta inválida del servicio de generación.");

        ArrayList choices = choicesObj as ArrayList;
        if (choices == null || choices.Count == 0)
            throw new InvalidDataException("Respuesta inválida del servicio de generación.");

        var choice = choices[0] as Dictionary<string, object>;
        if (choice == null) throw new InvalidDataException("Respuesta inválida del servicio de generación.");

        object messageObj;
        if (!choice.TryGetValue("message", out messageObj))
            throw new InvalidDataException("Respuesta inválida del servicio de generación.");

        var message = messageObj as Dictionary<string, object>;
        if (message == null) throw new InvalidDataException("Respuesta inválida del servicio de generación.");

        object contentObj;
        if (!message.TryGetValue("content", out contentObj))
            throw new InvalidDataException("Respuesta inválida del servicio de generación.");

        string content = Convert.ToString(contentObj);
        if (string.IsNullOrWhiteSpace(content))
            throw new InvalidDataException("Respuesta inválida del servicio de generación.");

        content = ExtraerJson(content);
        var parsed = js.DeserializeObject(content) as Dictionary<string, object>;
        if (parsed == null) throw new InvalidDataException("Respuesta inválida del servicio de generación.");

        return parsed;
    }

    private static Dictionary<string, object> ValidarBorrador(Dictionary<string, object> draft, string objetivoInput, string nivelInput, int minutosInput, Dictionary<int, string> catalogoEjercicios)
    {
        string nombre = SafeString(draft, "nombre", 150);
        string objetivo = SafeString(draft, "objetivo", 200);
        string nivel = SafeString(draft, "nivel", 30);
        int duracion = SafeInt(draft, "duracionAproximadaMin", 1, 600, minutosInput);
        string observacionesGenerales = SafeString(draft, "observacionesGenerales", 1200);

        if (string.IsNullOrWhiteSpace(nombre)) throw new InvalidDataException("Respuesta inválida del servicio de generación.");
        if (string.IsNullOrWhiteSpace(objetivo)) objetivo = objetivoInput;
        if (!EsNivelValido(nivel)) nivel = nivelInput;

        ArrayList sesionesRaw = null;
        object sesionesObj;
        if (draft.TryGetValue("sesiones", out sesionesObj)) sesionesRaw = sesionesObj as ArrayList;
        if (sesionesRaw == null || sesionesRaw.Count == 0)
            throw new InvalidDataException("La IA devolvió un borrador sin sesiones válidas.");

        List<Dictionary<string, object>> sesiones = new List<Dictionary<string, object>>();

        for (int i = 0; i < sesionesRaw.Count; i++)
        {
            var sesionMap = sesionesRaw[i] as Dictionary<string, object>;
            if (sesionMap == null) continue;

            string dia = SafeString(sesionMap, "dia", 50);
            if (string.IsNullOrWhiteSpace(dia)) continue;

            ArrayList ejerciciosRaw = null;
            object ejerciciosObj;
            if (sesionMap.TryGetValue("ejercicios", out ejerciciosObj)) ejerciciosRaw = ejerciciosObj as ArrayList;
            if (ejerciciosRaw == null || ejerciciosRaw.Count == 0) continue;

            List<Dictionary<string, object>> ejercicios = new List<Dictionary<string, object>>();
            for (int j = 0; j < ejerciciosRaw.Count; j++)
            {
                var ejMap = ejerciciosRaw[j] as Dictionary<string, object>;
                if (ejMap == null) continue;

                string ejNombre = SafeString(ejMap, "nombre", 120);
                int idEjercicio = SafeInt(ejMap, "idEjercicio", 0, int.MaxValue, 0);
                bool catalogoDisponible = catalogoEjercicios != null && catalogoEjercicios.Count > 0;

                if (catalogoDisponible)
                {
                    string nombreCatalogo;
                    if (idEjercicio > 0 && catalogoEjercicios.TryGetValue(idEjercicio, out nombreCatalogo))
                    {
                        ejNombre = nombreCatalogo;
                    }
                    else if (idEjercicio > 0)
                    {
                        continue;
                    }
                }

                if (string.IsNullOrWhiteSpace(ejNombre)) continue;

                int series = SafeInt(ejMap, "series", 0, 20, 0);
                int repeticiones = SafeInt(ejMap, "repeticiones", 0, 200, 0);
                int tiempoSegundos = SafeInt(ejMap, "tiempoSegundos", 0, 3600, 0);
                int descansoSegundos = SafeInt(ejMap, "descansoSegundos", 0, 600, 60);
                string observaciones = SafeString(ejMap, "observaciones", 300);

                if (series <= 0) series = 3;
                if (repeticiones <= 0 && tiempoSegundos <= 0) repeticiones = 10;

                Dictionary<string, object> ejercicioValido = new Dictionary<string, object>();
                if (idEjercicio > 0 && catalogoDisponible) ejercicioValido["idEjercicio"] = idEjercicio;
                ejercicioValido["nombre"] = ejNombre;
                ejercicioValido["series"] = series;
                ejercicioValido["repeticiones"] = repeticiones > 0 ? (object)repeticiones : null;
                ejercicioValido["tiempoSegundos"] = tiempoSegundos > 0 ? (object)tiempoSegundos : null;
                ejercicioValido["descansoSegundos"] = descansoSegundos;
                ejercicioValido["observaciones"] = observaciones;

                ejercicios.Add(ejercicioValido);
            }

            if (ejercicios.Count == 0) continue;

            Dictionary<string, object> sesionValida = new Dictionary<string, object>();
            sesionValida["dia"] = dia;
            sesionValida["ejercicios"] = ejercicios;
            sesiones.Add(sesionValida);
        }

        if (sesiones.Count == 0)
            throw new InvalidDataException("La IA devolvió un borrador sin sesiones válidas.");

        Dictionary<string, object> result = new Dictionary<string, object>();
        result["nombre"] = nombre;
        result["objetivo"] = objetivo;
        result["nivel"] = nivel;
        result["duracionAproximadaMin"] = duracion;
        result["observacionesGenerales"] = observacionesGenerales;
        result["sesiones"] = sesiones;
        result["safetyNotice"] = "No usar este borrador para rehabilitación o tratamiento de lesiones sin valoración profesional.";
        return result;
    }

    private static Dictionary<int, string> ObtenerCatalogoEjercicios()
    {
        Dictionary<int, string> ejercicios = new Dictionary<int, string>();
        CargarCatalogoEjercicios("rut.Ejercicios", ejercicios);
        CargarCatalogoEjercicios("cat.Ejercicios", ejercicios);
        return ejercicios;
    }

    private static void CargarCatalogoEjercicios(string tabla, Dictionary<int, string> target)
    {
        if (target == null) return;

        string sql = "SELECT IdEjercicio, Nombre FROM " + tabla + " WHERE (COL_LENGTH('" + tabla + "','Activo') IS NULL OR Activo = 1) ORDER BY Nombre";

        try
        {
            using (SqlConnection conn = DbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand(sql, conn))
            {
                conn.Open();
                using (SqlDataReader r = cmd.ExecuteReader())
                {
                    while (r.Read())
                    {
                        int id = r.IsDBNull(0) ? 0 : r.GetInt32(0);
                        string nombre = r.IsDBNull(1) ? string.Empty : r.GetString(1).Trim();
                        if (id <= 0 || string.IsNullOrWhiteSpace(nombre)) continue;
                        if (!target.ContainsKey(id)) target.Add(id, nombre);
                    }
                }
            }
        }
        catch
        {
        }
    }

    private static string ExtraerJson(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return raw;

        string text = raw.Trim();
        if (text.StartsWith("```"))
        {
            int firstBrace = text.IndexOf('{');
            int lastBrace = text.LastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace)
            {
                text = text.Substring(firstBrace, lastBrace - firstBrace + 1);
            }
        }

        return text;
    }

    private static bool TryConsumeQuota(int idUsuario, out int remaining, out DateTime retryAtUtc, out int maxRequests, out int windowMinutes)
    {
        maxRequests = GetSettingInt("OpenAI.Rutinas.MaxRequestsPerWindow", 5, 1, 100);
        windowMinutes = GetSettingInt("OpenAI.Rutinas.WindowMinutes", 60, 1, 1440);

        string key = "rut_ia_q_" + idUsuario.ToString();

        lock (RateLock)
        {
            Queue<DateTime> queue = HttpRuntime.Cache[key] as Queue<DateTime>;
            if (queue == null) queue = new Queue<DateTime>();

            DateTime now = DateTime.UtcNow;
            DateTime minAllowed = now.AddMinutes(-windowMinutes);

            while (queue.Count > 0 && queue.Peek() < minAllowed)
            {
                queue.Dequeue();
            }

            if (queue.Count >= maxRequests)
            {
                remaining = 0;
                retryAtUtc = queue.Count > 0 ? queue.Peek().AddMinutes(windowMinutes) : now.AddMinutes(windowMinutes);
                HttpRuntime.Cache.Insert(key, queue, null, DateTime.UtcNow.AddMinutes(windowMinutes), Cache.NoSlidingExpiration);
                return false;
            }

            queue.Enqueue(now);
            remaining = Math.Max(0, maxRequests - queue.Count);
            retryAtUtc = DateTime.MinValue;
            HttpRuntime.Cache.Insert(key, queue, null, DateTime.UtcNow.AddMinutes(windowMinutes), Cache.NoSlidingExpiration);
            return true;
        }
    }

    private static string TryGetProvider429Code(HttpWebResponse response)
    {
        if (response == null) return string.Empty;

        try
        {
            using (Stream stream = response.GetResponseStream())
            {
                if (stream == null) return string.Empty;
                using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
                {
                    string raw = reader.ReadToEnd();
                    if (string.IsNullOrWhiteSpace(raw)) return string.Empty;

                    JavaScriptSerializer js = new JavaScriptSerializer();
                    Dictionary<string, object> root = js.DeserializeObject(raw) as Dictionary<string, object>;
                    if (root == null) return string.Empty;

                    object errorObj;
                    if (!root.TryGetValue("error", out errorObj)) return string.Empty;

                    Dictionary<string, object> error = errorObj as Dictionary<string, object>;
                    if (error == null) return string.Empty;

                    object codeObj;
                    if (error.TryGetValue("code", out codeObj))
                    {
                        string codeText = Convert.ToString(codeObj ?? string.Empty).Trim();
                        if (!string.IsNullOrWhiteSpace(codeText)) return codeText;
                    }

                    object typeObj;
                    if (error.TryGetValue("type", out typeObj))
                    {
                        string typeText = Convert.ToString(typeObj ?? string.Empty).Trim();
                        if (!string.IsNullOrWhiteSpace(typeText)) return typeText;
                    }
                }
            }
        }
        catch
        {
        }

        return string.Empty;
    }

    private static string GetApiKey(HttpContext context)
    {
        string key = GetSetting("OpenAI.Rutinas.ApiKey", string.Empty);
        if (!string.IsNullOrWhiteSpace(key)) return key;

        string filePath = context.Server.MapPath("~/App_Data/secrets.local.config");
        if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath)) return string.Empty;

        try
        {
            string raw = File.ReadAllText(filePath, Encoding.UTF8);
            if (string.IsNullOrWhiteSpace(raw)) return string.Empty;

            string trimmed = raw.TrimStart();
            if (trimmed.StartsWith("<"))
            {
                System.Xml.XmlDocument doc = new System.Xml.XmlDocument();
                doc.LoadXml(raw);
                System.Xml.XmlNode node = doc.SelectSingleNode("/secrets/add[@key='OpenAI.Rutinas.ApiKey']");
                if (node == null)
                {
                    node = doc.SelectSingleNode("/configuration/appSettings/add[@key='OpenAI.Rutinas.ApiKey']");
                }

                if (node != null)
                {
                    System.Xml.XmlAttribute valueAttr = node.Attributes == null ? null : node.Attributes["value"];
                    if (valueAttr != null)
                    {
                        string xmlValue = (valueAttr.Value ?? string.Empty).Trim();
                        if (!string.IsNullOrWhiteSpace(xmlValue)) return xmlValue;
                    }
                }
            }
            else
            {
                string[] lines = raw.Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                for (int i = 0; i < lines.Length; i++)
                {
                    string line = (lines[i] ?? string.Empty).Trim();
                    if (line.Length == 0 || line.StartsWith("#") || line.StartsWith(";")) continue;

                    int sep = line.IndexOf('=');
                    if (sep <= 0) continue;

                    string k = line.Substring(0, sep).Trim();
                    if (!string.Equals(k, "OpenAI.Rutinas.ApiKey", StringComparison.Ordinal)) continue;

                    string value = line.Substring(sep + 1).Trim();
                    if (!string.IsNullOrWhiteSpace(value)) return value;
                }
            }
        }
        catch
        {
        }

        return string.Empty;
    }

    private static string GetSetting(string key, string fallback)
    {
        string value = ConfigurationManager.AppSettings[key];
        if (string.IsNullOrWhiteSpace(value)) return fallback;
        return value.Trim();
    }

    private static int GetSettingInt(string key, int fallback, int min, int max)
    {
        string raw = ConfigurationManager.AppSettings[key];
        int value;
        if (!int.TryParse(raw, out value)) value = fallback;
        if (value < min) value = min;
        if (value > max) value = max;
        return value;
    }

    private static bool TryInt(object value, out int parsed)
    {
        parsed = 0;
        if (value == null) return false;
        if (value is int)
        {
            parsed = (int)value;
            return true;
        }

        return int.TryParse(Convert.ToString(value), out parsed);
    }

    private static bool EsNivelValido(string nivel)
    {
        return string.Equals(nivel, "Principiante", StringComparison.OrdinalIgnoreCase)
            || string.Equals(nivel, "Intermedio", StringComparison.OrdinalIgnoreCase)
            || string.Equals(nivel, "Avanzado", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ObjetivoRequiereValoracionProfesional(string objetivo)
    {
        if (string.IsNullOrWhiteSpace(objetivo)) return false;

        string text = objetivo.ToLowerInvariant();
        string[] marcadores = new string[]
        {
            "lesion", "lesión", "rehabilit", "rehabilitación", "dolor", "contractura", "fisioterapia", "postoperator", "fractura", "tendinitis"
        };

        for (int i = 0; i < marcadores.Length; i++)
        {
            if (text.Contains(marcadores[i])) return true;
        }

        return false;
    }

    private static string SafeString(Dictionary<string, object> map, string key, int maxLen)
    {
        object value;
        if (!map.TryGetValue(key, out value)) return string.Empty;

        string text = Convert.ToString(value ?? string.Empty).Trim();
        if (text.Length > maxLen) text = text.Substring(0, maxLen);
        return text;
    }

    private static int SafeInt(Dictionary<string, object> map, string key, int min, int max, int fallback)
    {
        object value;
        if (!map.TryGetValue(key, out value) || value == null) return fallback;

        int parsed;
        if (!TryInt(value, out parsed)) return fallback;
        if (parsed < min) return fallback;
        if (parsed > max) return fallback;
        return parsed;
    }
}
