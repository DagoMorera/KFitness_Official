using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text.RegularExpressions;

public class RutinaEditorListadoItem
{
    public int IdRutina { get; set; }
    public string Nombre { get; set; }
    public string Objetivo { get; set; }
    public string Nivel { get; set; }
    public int DuracionAproximadaMin { get; set; }
    public string DuracionUnidad { get; set; }
    public string PortadaReferencia { get; set; }
    public bool Activa { get; set; }
    public int TotalSesiones { get; set; }
}

public class RutinaEditorDetalle
{
    public int IdRutina { get; set; }
    public string Nombre { get; set; }
    public string Descripcion { get; set; }
    public string Objetivo { get; set; }
    public string Nivel { get; set; }
    public int DuracionAproximadaMin { get; set; }
    public string DuracionUnidad { get; set; }
    public string PortadaReferencia { get; set; }
    public bool Activa { get; set; }
    public List<RutinaEditorSesionDetalle> Sesiones { get; set; }
}

public class RutinaEditorSesionDetalle
{
    public int IdSesionRutina { get; set; }
    public string Nombre { get; set; }
    public int OrdenSesion { get; set; }
    public List<RutinaEditorEjercicioDetalle> Ejercicios { get; set; }
}

public class RutinaEditorEjercicioDetalle
{
    public long IdRutinaEjercicio { get; set; }
    public int? IdEjercicioCatalogo { get; set; }
    public string OrigenCatalogo { get; set; }
    public string NombreEjercicio { get; set; }
    public int OrdenEjercicio { get; set; }
    public int Series { get; set; }
    public int? Repeticiones { get; set; }
    public int? DuracionSegundos { get; set; }
    public int DescansoValor { get; set; }
    public string DescansoUnidad { get; set; }
    public decimal? CargaValor { get; set; }
    public string CargaUnidad { get; set; }
    public string IndicacionesEntrenador { get; set; }
    public string TecnicaInstrucciones { get; set; }
    public string TecnicaErroresComunes { get; set; }
    public string FotoReferencia { get; set; }
    public string VideoUrl { get; set; }
    public bool EsAjusteLocal { get; set; }
}

public class RutinaEditorPayload
{
    public int IdRutina { get; set; }
    public string Nombre { get; set; }
    public string Descripcion { get; set; }
    public string Objetivo { get; set; }
    public string Nivel { get; set; }
    public int DuracionAproximadaMin { get; set; }
    public string DuracionUnidad { get; set; }
    public string PortadaReferencia { get; set; }
    public List<RutinaEditorSesionPayload> Sesiones { get; set; }
}

public class RutinaEditorSesionPayload
{
    public int? IdSesionRutina { get; set; }
    public string Nombre { get; set; }
    public int OrdenSesion { get; set; }
    public List<RutinaEditorEjercicioPayload> Ejercicios { get; set; }
}

public class RutinaEditorEjercicioPayload
{
    public long? IdRutinaEjercicio { get; set; }
    public int? IdEjercicioCatalogo { get; set; }
    public string OrigenCatalogo { get; set; }
    public string NombreEjercicio { get; set; }
    public int OrdenEjercicio { get; set; }
    public int Series { get; set; }
    public int? Repeticiones { get; set; }
    public int? DuracionSegundos { get; set; }
    public int DescansoValor { get; set; }
    public string DescansoUnidad { get; set; }
    public decimal? CargaValor { get; set; }
    public string CargaUnidad { get; set; }
    public string IndicacionesEntrenador { get; set; }
    public string TecnicaInstrucciones { get; set; }
    public string TecnicaErroresComunes { get; set; }
    public string FotoReferencia { get; set; }
    public string VideoUrl { get; set; }
    public bool EsAjusteLocal { get; set; }
    public bool GuardarEnCatalogo { get; set; }
}

public class CatalogoEjercicioItem
{
    public int IdEjercicio { get; set; }
    public string Nombre { get; set; }
    public string GrupoMuscular { get; set; }
    public string Implemento { get; set; }
    public string ImagenReferencia { get; set; }
    public string VideoUrl { get; set; }
    public string TecnicaInstrucciones { get; set; }
    public string ErroresComunes { get; set; }
}

public class CatalogoEjercicioGuardarPayload
{
    public string Nombre { get; set; }
    public string GrupoMuscular { get; set; }
    public string Implemento { get; set; }
    public string TecnicaInstrucciones { get; set; }
    public string ErroresComunes { get; set; }
    public string ImagenReferencia { get; set; }
    public string VideoUrl { get; set; }
}

public class CatalogoEjercicioGuardarResultado
{
    public bool Success { get; set; }
    public string CodigoError { get; set; }
    public string Message { get; set; }
    public int IdEjercicio { get; set; }
}

public class RutinaEditorGuardarResultado
{
    public bool Success { get; set; }
    public string CodigoError { get; set; }
    public string Message { get; set; }
    public int IdRutina { get; set; }
}

public class RutinasEditorPaginadas
{
    public int Pagina { get; set; }
    public int TamanoPagina { get; set; }
    public int TotalRegistros { get; set; }
    public List<RutinaEditorListadoItem> Rutinas { get; set; }
}

public static class RepositorioRutinasEditor
{
    private static readonly Regex EspaciosMultiples = new Regex("\\s+", RegexOptions.Compiled);

    public static string NormalizarNombre(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        string limpio = input.Trim().Replace("\r", " ").Replace("\n", " ");
        limpio = EspaciosMultiples.Replace(limpio, " ");
        return limpio.ToUpperInvariant();
    }

    private static object ToDb(string valor, int maxLen)
    {
        string v = (valor ?? string.Empty).Trim();
        if (v.Length == 0) return DBNull.Value;
        if (maxLen > 0 && v.Length > maxLen) v = v.Substring(0, maxLen);
        return v;
    }

    public static bool TryNormalizarVideoUrl(string videoUrl, out string normalizada)
    {
        normalizada = null;
        string url = (videoUrl ?? string.Empty).Trim();
        if (url.Length == 0) return true;

        Uri uri;
        if (!Uri.TryCreate(url, UriKind.Absolute, out uri)) return false;
        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)) return false;

        string host = (uri.Host ?? string.Empty).Trim().ToLowerInvariant();
        bool youtube = host == "youtube.com" || host == "www.youtube.com" || host == "youtu.be" || host == "m.youtube.com";
        bool vimeo = host == "vimeo.com" || host == "www.vimeo.com" || host == "player.vimeo.com";
        if (!youtube && !vimeo) return false;

        if (youtube)
        {
            if (host == "youtu.be")
            {
                string id = uri.AbsolutePath.Trim('/');
                if (!Regex.IsMatch(id, "^[A-Za-z0-9_-]{6,20}$")) return false;
                normalizada = "https://youtu.be/" + id;
                return true;
            }

            string query = uri.Query ?? string.Empty;
            string videoId = null;
            if (query.StartsWith("?")) query = query.Substring(1);
            string[] pares = query.Split('&');
            for (int i = 0; i < pares.Length; i++)
            {
                string p = pares[i] ?? string.Empty;
                if (p.StartsWith("v=", StringComparison.OrdinalIgnoreCase))
                {
                    videoId = Uri.UnescapeDataString(p.Substring(2));
                    break;
                }
            }

            if (string.IsNullOrWhiteSpace(videoId))
            {
                string path = uri.AbsolutePath.Trim('/');
                string[] segs = path.Split('/');
                if (segs.Length >= 2 && string.Equals(segs[0], "embed", StringComparison.OrdinalIgnoreCase)) videoId = segs[1];
            }

            if (!Regex.IsMatch(videoId ?? string.Empty, "^[A-Za-z0-9_-]{6,20}$")) return false;
            normalizada = "https://www.youtube.com/watch?v=" + videoId;
            return true;
        }

        string pathVimeo = (uri.AbsolutePath ?? string.Empty).Trim('/');
        string[] parts = pathVimeo.Split('/');
        string ultimo = parts.Length > 0 ? parts[parts.Length - 1] : string.Empty;
        if (!Regex.IsMatch(ultimo, "^[0-9]{6,15}$")) return false;
        normalizada = "https://vimeo.com/" + ultimo;
        return true;
    }

    public static RutinasEditorPaginadas ObtenerRutinasAdminCards(string nombre, string nivel, bool? activa, int pagina, int tamanoPagina)
    {
        if (pagina < 1) pagina = 1;
        if (tamanoPagina <= 0) tamanoPagina = 10;
        if (tamanoPagina > 50) tamanoPagina = 50;

        string n = string.IsNullOrWhiteSpace(nombre) ? null : nombre.Trim();
        string lv = string.IsNullOrWhiteSpace(nivel) ? null : nivel.Trim();

        int ini = ((pagina - 1) * tamanoPagina) + 1;
        int fin = pagina * tamanoPagina;

        const string sqlCount = @"SELECT COUNT(1)
FROM rut.Rutinas r
WHERE (@n IS NULL OR r.Nombre LIKE '%'+@n+'%')
  AND (@lv IS NULL OR r.Nivel=@lv)
  AND (@a IS NULL OR r.Activa=@a)";

        const string sqlPage = @";WITH d AS (
SELECT r.IdRutina,r.Nombre,r.Objetivo,r.Nivel,r.DuracionAproximadaMin,
       ISNULL(NULLIF(r.DuracionUnidad,N''),N'min') AS DuracionUnidad,
       r.PortadaReferencia,r.Activa,
       (SELECT COUNT(1) FROM rut.RutinaSesiones s WHERE s.IdRutina=r.IdRutina AND s.Activa=1) AS TotalSesiones,
       ROW_NUMBER() OVER(ORDER BY r.Nombre, r.IdRutina) rn
FROM rut.Rutinas r
WHERE (@n IS NULL OR r.Nombre LIKE '%'+@n+'%')
  AND (@lv IS NULL OR r.Nivel=@lv)
  AND (@a IS NULL OR r.Activa=@a)
)
SELECT IdRutina,Nombre,Objetivo,Nivel,DuracionAproximadaMin,DuracionUnidad,PortadaReferencia,Activa,TotalSesiones
FROM d
WHERE rn BETWEEN @ini AND @fin
ORDER BY rn";

        RutinasEditorPaginadas res = new RutinasEditorPaginadas
        {
            Pagina = pagina,
            TamanoPagina = tamanoPagina,
            Rutinas = new List<RutinaEditorListadoItem>()
        };

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand c1 = new SqlCommand(sqlCount, conn))
        using (SqlCommand c2 = new SqlCommand(sqlPage, conn))
        {
            c1.Parameters.AddWithValue("@n", (object)n ?? DBNull.Value);
            c1.Parameters.AddWithValue("@lv", (object)lv ?? DBNull.Value);
            c1.Parameters.AddWithValue("@a", activa.HasValue ? (object)activa.Value : DBNull.Value);

            c2.Parameters.AddWithValue("@n", (object)n ?? DBNull.Value);
            c2.Parameters.AddWithValue("@lv", (object)lv ?? DBNull.Value);
            c2.Parameters.AddWithValue("@a", activa.HasValue ? (object)activa.Value : DBNull.Value);
            c2.Parameters.AddWithValue("@ini", ini);
            c2.Parameters.AddWithValue("@fin", fin);

            conn.Open();
            res.TotalRegistros = Convert.ToInt32(c1.ExecuteScalar());

            using (SqlDataReader r = c2.ExecuteReader())
            {
                while (r.Read())
                {
                    res.Rutinas.Add(new RutinaEditorListadoItem
                    {
                        IdRutina = r.GetInt32(0),
                        Nombre = r.IsDBNull(1) ? string.Empty : r.GetString(1),
                        Objetivo = r.IsDBNull(2) ? string.Empty : r.GetString(2),
                        Nivel = r.IsDBNull(3) ? string.Empty : r.GetString(3),
                        DuracionAproximadaMin = r.IsDBNull(4) ? 0 : r.GetInt32(4),
                        DuracionUnidad = r.IsDBNull(5) ? "min" : r.GetString(5),
                        PortadaReferencia = r.IsDBNull(6) ? null : r.GetString(6),
                        Activa = !r.IsDBNull(7) && r.GetBoolean(7),
                        TotalSesiones = r.IsDBNull(8) ? 0 : r.GetInt32(8)
                    });
                }
            }
        }

        return res;
    }

    public static RutinaEditorDetalle ObtenerDetalleRutina(int idRutina)
    {
        if (idRutina <= 0) return null;

        const string sqlRutina = @"SELECT IdRutina,Nombre,Descripcion,Objetivo,Nivel,DuracionAproximadaMin,
ISNULL(NULLIF(DuracionUnidad,N''),N'min') AS DuracionUnidad,
PortadaReferencia,Activa
FROM rut.Rutinas
WHERE IdRutina=@idRutina";

        const string sqlSesiones = @"SELECT IdSesionRutina,Nombre,OrdenSesion
FROM rut.RutinaSesiones
WHERE IdRutina=@idRutina AND Activa=1
ORDER BY OrdenSesion, IdSesionRutina";

        const string sqlEjercicios = @"SELECT e.IdRutinaEjercicio,e.IdSesionRutina,e.IdEjercicioCatalogo,e.OrigenCatalogo,e.NombreEjercicio,e.OrdenEjercicio,
e.Series,e.Repeticiones,e.DuracionSegundos,e.DescansoValor,e.DescansoUnidad,e.CargaValor,e.CargaUnidad,
e.IndicacionesEntrenador,e.TecnicaInstrucciones,e.TecnicaErroresComunes,e.FotoReferencia,e.VideoUrl,e.EsAjusteLocal
FROM rut.RutinaEjercicios e
INNER JOIN rut.RutinaSesiones s ON s.IdSesionRutina=e.IdSesionRutina
WHERE s.IdRutina=@idRutina AND s.Activa=1
ORDER BY s.OrdenSesion, e.OrdenEjercicio, e.IdRutinaEjercicio";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand c1 = new SqlCommand(sqlRutina, conn))
        using (SqlCommand c2 = new SqlCommand(sqlSesiones, conn))
        using (SqlCommand c3 = new SqlCommand(sqlEjercicios, conn))
        {
            c1.Parameters.AddWithValue("@idRutina", idRutina);
            c2.Parameters.AddWithValue("@idRutina", idRutina);
            c3.Parameters.AddWithValue("@idRutina", idRutina);

            conn.Open();

            RutinaEditorDetalle rutina = null;
            using (SqlDataReader r = c1.ExecuteReader())
            {
                if (!r.Read()) return null;
                rutina = new RutinaEditorDetalle
                {
                    IdRutina = r.GetInt32(0),
                    Nombre = r.IsDBNull(1) ? string.Empty : r.GetString(1),
                    Descripcion = r.IsDBNull(2) ? string.Empty : r.GetString(2),
                    Objetivo = r.IsDBNull(3) ? string.Empty : r.GetString(3),
                    Nivel = r.IsDBNull(4) ? string.Empty : r.GetString(4),
                    DuracionAproximadaMin = r.IsDBNull(5) ? 0 : r.GetInt32(5),
                    DuracionUnidad = r.IsDBNull(6) ? "min" : r.GetString(6),
                    PortadaReferencia = r.IsDBNull(7) ? null : r.GetString(7),
                    Activa = !r.IsDBNull(8) && r.GetBoolean(8),
                    Sesiones = new List<RutinaEditorSesionDetalle>()
                };
            }

            Dictionary<int, RutinaEditorSesionDetalle> sesionMap = new Dictionary<int, RutinaEditorSesionDetalle>();
            using (SqlDataReader r = c2.ExecuteReader())
            {
                while (r.Read())
                {
                    RutinaEditorSesionDetalle s = new RutinaEditorSesionDetalle
                    {
                        IdSesionRutina = r.GetInt32(0),
                        Nombre = r.IsDBNull(1) ? string.Empty : r.GetString(1),
                        OrdenSesion = r.IsDBNull(2) ? 0 : r.GetInt32(2),
                        Ejercicios = new List<RutinaEditorEjercicioDetalle>()
                    };
                    rutina.Sesiones.Add(s);
                    if (!sesionMap.ContainsKey(s.IdSesionRutina)) sesionMap.Add(s.IdSesionRutina, s);
                }
            }

            using (SqlDataReader r = c3.ExecuteReader())
            {
                while (r.Read())
                {
                    int idSesion = r.IsDBNull(1) ? 0 : r.GetInt32(1);
                    RutinaEditorSesionDetalle sesion;
                    if (!sesionMap.TryGetValue(idSesion, out sesion)) continue;

                    sesion.Ejercicios.Add(new RutinaEditorEjercicioDetalle
                    {
                        IdRutinaEjercicio = r.GetInt64(0),
                        IdEjercicioCatalogo = r.IsDBNull(2) ? (int?)null : r.GetInt32(2),
                        OrigenCatalogo = r.IsDBNull(3) ? null : r.GetString(3),
                        NombreEjercicio = r.IsDBNull(4) ? string.Empty : r.GetString(4),
                        OrdenEjercicio = r.IsDBNull(5) ? 0 : r.GetInt32(5),
                        Series = r.IsDBNull(6) ? 0 : r.GetInt32(6),
                        Repeticiones = r.IsDBNull(7) ? (int?)null : r.GetInt32(7),
                        DuracionSegundos = r.IsDBNull(8) ? (int?)null : r.GetInt32(8),
                        DescansoValor = r.IsDBNull(9) ? 0 : r.GetInt32(9),
                        DescansoUnidad = r.IsDBNull(10) ? "seg" : r.GetString(10),
                        CargaValor = r.IsDBNull(11) ? (decimal?)null : r.GetDecimal(11),
                        CargaUnidad = r.IsDBNull(12) ? null : r.GetString(12),
                        IndicacionesEntrenador = r.IsDBNull(13) ? string.Empty : r.GetString(13),
                        TecnicaInstrucciones = r.IsDBNull(14) ? string.Empty : r.GetString(14),
                        TecnicaErroresComunes = r.IsDBNull(15) ? string.Empty : r.GetString(15),
                        FotoReferencia = r.IsDBNull(16) ? null : r.GetString(16),
                        VideoUrl = r.IsDBNull(17) ? null : r.GetString(17),
                        EsAjusteLocal = !r.IsDBNull(18) && r.GetBoolean(18)
                    });
                }
            }

            return rutina;
        }
    }

    public static List<CatalogoEjercicioItem> BuscarCatalogoEjercicios(string query, int maximo)
    {
        if (maximo <= 0) maximo = 20;
        if (maximo > 80) maximo = 80;

        string q = string.IsNullOrWhiteSpace(query) ? null : query.Trim();

        const string sql = @"SELECT TOP (@maximo) IdEjercicio,Nombre,GrupoMuscular,Implemento,ImagenReferencia,VideoUrl,TecnicaInstrucciones,ErroresComunes
FROM rut.Ejercicios
WHERE Activo=1
  AND (@q IS NULL OR Nombre LIKE '%'+@q+'%' OR ISNULL(GrupoMuscular,N'') LIKE '%'+@q+'%' OR ISNULL(Implemento,N'') LIKE '%'+@q+'%')
ORDER BY Nombre, IdEjercicio";

        List<CatalogoEjercicioItem> items = new List<CatalogoEjercicioItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@maximo", maximo);
            cmd.Parameters.AddWithValue("@q", (object)q ?? DBNull.Value);

            conn.Open();
            using (SqlDataReader r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    items.Add(new CatalogoEjercicioItem
                    {
                        IdEjercicio = r.GetInt32(0),
                        Nombre = r.IsDBNull(1) ? string.Empty : r.GetString(1),
                        GrupoMuscular = r.IsDBNull(2) ? string.Empty : r.GetString(2),
                        Implemento = r.IsDBNull(3) ? string.Empty : r.GetString(3),
                        ImagenReferencia = r.IsDBNull(4) ? null : r.GetString(4),
                        VideoUrl = r.IsDBNull(5) ? null : r.GetString(5),
                        TecnicaInstrucciones = r.IsDBNull(6) ? string.Empty : r.GetString(6),
                        ErroresComunes = r.IsDBNull(7) ? string.Empty : r.GetString(7)
                    });
                }
            }
        }

        return items;
    }

    public static CatalogoEjercicioGuardarResultado CrearEjercicioCatalogo(int idActor, CatalogoEjercicioGuardarPayload payload)
    {
        if (payload == null) return new CatalogoEjercicioGuardarResultado { Success = false, CodigoError = "PAYLOAD_INVALIDO", Message = "Solicitud inválida." };
        string nombre = (payload.Nombre ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(nombre) || nombre.Length > 180) return new CatalogoEjercicioGuardarResultado { Success = false, CodigoError = "NOMBRE_INVALIDO", Message = "Nombre de ejercicio inválido." };

        string urlVideo;
        if (!TryNormalizarVideoUrl(payload.VideoUrl, out urlVideo)) return new CatalogoEjercicioGuardarResultado { Success = false, CodigoError = "VIDEO_INVALIDO", Message = "El enlace de video debe ser HTTPS de YouTube o Vimeo." };

        string nombreNormalizado = NormalizarNombre(nombre);

        const string qDup = "SELECT TOP 1 IdEjercicio FROM rut.Ejercicios WHERE NombreNormalizado=@nn";
        const string qIns = @"INSERT INTO rut.Ejercicios (Nombre,NombreNormalizado,GrupoMuscular,Implemento,TecnicaInstrucciones,ErroresComunes,ImagenReferencia,VideoUrl,Activo,FechaCreacion,FechaActualizacion)
VALUES (@n,@nn,@gm,@imp,@ti,@ec,@img,@vid,1,SYSDATETIME(),SYSDATETIME());
SELECT CAST(SCOPE_IDENTITY() AS INT);";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cd = new SqlCommand(qDup, conn))
        using (SqlCommand ci = new SqlCommand(qIns, conn))
        {
            conn.Open();
            cd.Parameters.AddWithValue("@nn", nombreNormalizado);
            if (cd.ExecuteScalar() != null) return new CatalogoEjercicioGuardarResultado { Success = false, CodigoError = "EJERCICIO_DUPLICADO", Message = "Ya existe un ejercicio con ese nombre." };

            ci.Parameters.AddWithValue("@n", nombre);
            ci.Parameters.AddWithValue("@nn", nombreNormalizado);
            ci.Parameters.AddWithValue("@gm", ToDb(payload.GrupoMuscular, 120));
            ci.Parameters.AddWithValue("@imp", ToDb(payload.Implemento, 120));
            ci.Parameters.AddWithValue("@ti", ToDb(payload.TecnicaInstrucciones, 2000));
            ci.Parameters.AddWithValue("@ec", ToDb(payload.ErroresComunes, 2000));
            ci.Parameters.AddWithValue("@img", ToDb(payload.ImagenReferencia, 260));
            ci.Parameters.AddWithValue("@vid", ToDb(urlVideo, 500));

            int idEjercicio = Convert.ToInt32(ci.ExecuteScalar());
            return new CatalogoEjercicioGuardarResultado { Success = true, IdEjercicio = idEjercicio, Message = "Ejercicio creado correctamente." };
        }
    }

    public static RutinaEditorGuardarResultado GuardarRutinaExtendida(int idActor, RutinaEditorPayload payload)
    {
        if (payload == null) return new RutinaEditorGuardarResultado { Success = false, CodigoError = "PAYLOAD_INVALIDO", Message = "Solicitud inválida." };

        OperacionRutinaResultado baseVal = RepositorioRutinas.ValidarCampos(payload.Nombre, payload.Objetivo, payload.Nivel, payload.DuracionAproximadaMin);
        if (!baseVal.Success) return new RutinaEditorGuardarResultado { Success = false, CodigoError = baseVal.CodigoError, Message = baseVal.Message };

        string unidad = (payload.DuracionUnidad ?? string.Empty).Trim().ToLowerInvariant();
        if (unidad != "min" && unidad != "horas") return new RutinaEditorGuardarResultado { Success = false, CodigoError = "DURACION_UNIDAD_INVALIDA", Message = "Unidad de duración inválida." };

        if (unidad == "horas" && payload.DuracionAproximadaMin > 10) throw new InvalidOperationException("La duración máxima es 600 minutos.");
        if (payload.Descripcion != null && payload.Descripcion.Length > 1000) throw new InvalidOperationException("La descripción admite hasta 1000 caracteres.");
        if (payload.Sesiones == null) payload.Sesiones = new List<RutinaEditorSesionPayload>();
        if (payload.Sesiones.Count > 31) throw new InvalidOperationException("El máximo es 31 sesiones por rutina.");
        foreach (RutinaEditorSesionPayload session in payload.Sesiones)
        {
            if (session == null || string.IsNullOrWhiteSpace(session.Nombre)) throw new InvalidOperationException("Cada sesión necesita un nombre.");
            if (session.Ejercicios != null && session.Ejercicios.Count > 50) throw new InvalidOperationException("El máximo es 50 ejercicios por sesión.");
        }

        string portada = (payload.PortadaReferencia ?? string.Empty).Trim();
        if (portada.Length > 260) portada = portada.Substring(0, 260);
        if (portada.Length == 0) portada = null;

        string nombreNormalizado = RepositorioRutinas.NormalizarNombre(payload.Nombre);

        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            {
                try
                {
                    bool esEdicion = payload.IdRutina > 0;
                    int idRutina = payload.IdRutina;

                    if (esEdicion)
                    {
                        const string qExiste = "SELECT COUNT(1) FROM rut.Rutinas WITH (UPDLOCK,HOLDLOCK) WHERE IdRutina=@id";
                        using (SqlCommand cex = new SqlCommand(qExiste, conn, tx))
                        {
                            cex.Parameters.AddWithValue("@id", idRutina);
                            if (Convert.ToInt32(cex.ExecuteScalar()) <= 0) return new RutinaEditorGuardarResultado { Success = false, CodigoError = "RUTINA_NO_EXISTE", Message = "La rutina no existe." };
                        }

                        const string qDup = "SELECT TOP 1 IdRutina FROM rut.Rutinas WHERE NombreNormalizado=@nn AND IdRutina<>@id";
                        using (SqlCommand cdup = new SqlCommand(qDup, conn, tx))
                        {
                            cdup.Parameters.AddWithValue("@nn", nombreNormalizado);
                            cdup.Parameters.AddWithValue("@id", idRutina);
                            if (cdup.ExecuteScalar() != null) return new RutinaEditorGuardarResultado { Success = false, CodigoError = "RUTINA_DUPLICADA", Message = "Ya existe una rutina con ese nombre." };
                        }

                        const string qUpd = @"UPDATE rut.Rutinas
SET Nombre=@nom,NombreNormalizado=@nn,Descripcion=@des,Objetivo=@obj,Nivel=@niv,
    DuracionAproximadaMin=@dur,DuracionUnidad=@uni,PortadaReferencia=@port,
    FechaActualizacion=SYSDATETIME(),IdUsuarioActualizador=@actor
WHERE IdRutina=@id";

                        using (SqlCommand cup = new SqlCommand(qUpd, conn, tx))
                        {
                            cup.Parameters.AddWithValue("@id", idRutina);
                            cup.Parameters.AddWithValue("@nom", payload.Nombre.Trim());
                            cup.Parameters.AddWithValue("@nn", nombreNormalizado);
                            cup.Parameters.AddWithValue("@des", ToDb(payload.Descripcion, 1000));
                            cup.Parameters.AddWithValue("@obj", payload.Objetivo.Trim());
                            cup.Parameters.AddWithValue("@niv", payload.Nivel.Trim());
                            cup.Parameters.AddWithValue("@dur", payload.DuracionAproximadaMin);
                            cup.Parameters.AddWithValue("@uni", unidad);
                            cup.Parameters.AddWithValue("@port", (object)portada ?? DBNull.Value);
                            cup.Parameters.AddWithValue("@actor", idActor > 0 ? (object)idActor : DBNull.Value);
                            cup.ExecuteNonQuery();
                        }
                    }
                    else
                    {
                        const string qDup = "SELECT TOP 1 IdRutina FROM rut.Rutinas WHERE NombreNormalizado=@nn";
                        using (SqlCommand cdup = new SqlCommand(qDup, conn, tx))
                        {
                            cdup.Parameters.AddWithValue("@nn", nombreNormalizado);
                            if (cdup.ExecuteScalar() != null) return new RutinaEditorGuardarResultado { Success = false, CodigoError = "RUTINA_DUPLICADA", Message = "Ya existe una rutina con ese nombre." };
                        }

                        const string qIns = @"INSERT INTO rut.Rutinas
(Nombre,NombreNormalizado,Descripcion,Objetivo,Nivel,DuracionAproximadaMin,DuracionUnidad,PortadaReferencia,Activa,FechaCreacion,FechaActualizacion,IdUsuarioCreador,IdUsuarioActualizador)
VALUES (@nom,@nn,@des,@obj,@niv,@dur,@uni,@port,1,SYSDATETIME(),SYSDATETIME(),@actor,@actor);
SELECT CAST(SCOPE_IDENTITY() AS INT);";

                        using (SqlCommand cin = new SqlCommand(qIns, conn, tx))
                        {
                            cin.Parameters.AddWithValue("@nom", payload.Nombre.Trim());
                            cin.Parameters.AddWithValue("@nn", nombreNormalizado);
                            cin.Parameters.AddWithValue("@des", ToDb(payload.Descripcion, 1000));
                            cin.Parameters.AddWithValue("@obj", payload.Objetivo.Trim());
                            cin.Parameters.AddWithValue("@niv", payload.Nivel.Trim());
                            cin.Parameters.AddWithValue("@dur", payload.DuracionAproximadaMin);
                            cin.Parameters.AddWithValue("@uni", unidad);
                            cin.Parameters.AddWithValue("@port", (object)portada ?? DBNull.Value);
                            cin.Parameters.AddWithValue("@actor", idActor > 0 ? (object)idActor : DBNull.Value);
                            idRutina = Convert.ToInt32(cin.ExecuteScalar());
                        }
                    }

                    LimpiarSesionesExistentes(conn, tx, idRutina);
                    InsertarSesionesYEjercicios(conn, tx, idRutina, payload.Sesiones);

                    tx.Commit();
                    return new RutinaEditorGuardarResultado { Success = true, IdRutina = idRutina, Message = esEdicion ? "Rutina actualizada correctamente." : "Rutina creada correctamente." };
                }
                catch
                {
                    try { tx.Rollback(); } catch { }
                    throw;
                }
            }
        }
    }

    private static void LimpiarSesionesExistentes(SqlConnection conn, SqlTransaction tx, int idRutina)
    {
        // Preserve prior session versions and their exercise references.
        using (SqlCommand cmd = new SqlCommand("UPDATE rut.RutinaSesiones SET Activa=0,FechaActualizacion=SYSDATETIME() WHERE IdRutina=@id AND Activa=1", conn, tx))
        {
            cmd.Parameters.AddWithValue("@id", idRutina);
            cmd.ExecuteNonQuery();
        }
    }

    private static void InsertarSesionesYEjercicios(SqlConnection conn, SqlTransaction tx, int idRutina, List<RutinaEditorSesionPayload> sesiones)
    {
        const string qInsSes = @"INSERT INTO rut.RutinaSesiones (IdRutina,Nombre,OrdenSesion,Activa,FechaCreacion,FechaActualizacion)
VALUES (@idRutina,@nom,@ord,1,SYSDATETIME(),SYSDATETIME());
SELECT CAST(SCOPE_IDENTITY() AS INT);";

        const string qInsEj = @"INSERT INTO rut.RutinaEjercicios
(IdSesionRutina,IdEjercicioCatalogo,OrigenCatalogo,NombreEjercicio,OrdenEjercicio,Series,Repeticiones,DuracionSegundos,DescansoValor,DescansoUnidad,CargaValor,CargaUnidad,IndicacionesEntrenador,TecnicaInstrucciones,TecnicaErroresComunes,FotoReferencia,VideoUrl,EsAjusteLocal,FechaCreacion,FechaActualizacion)
VALUES (@idSesion,@idCat,@origen,@nom,@ord,@series,@rep,@dur,@desVal,@desUni,@cargaVal,@cargaUni,@ind,@tecIns,@tecErr,@foto,@video,@local,SYSDATETIME(),SYSDATETIME());";

        List<RutinaEditorSesionPayload> sesionesOrdenadas = (sesiones ?? new List<RutinaEditorSesionPayload>()).OrderBy(x => x != null ? x.OrdenSesion : int.MaxValue).ToList();

        int ordenSesionAuto = 1;
        foreach (RutinaEditorSesionPayload sesion in sesionesOrdenadas)
        {
            if (sesion == null) continue;
            string nombreSesion = (sesion.Nombre ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(nombreSesion)) nombreSesion = "Día " + ordenSesionAuto.ToString();
            if (nombreSesion.Length > 120) nombreSesion = nombreSesion.Substring(0, 120);

            int ordenSesion = sesion.OrdenSesion > 0 ? sesion.OrdenSesion : ordenSesionAuto;

            int idSesion;
            using (SqlCommand cs = new SqlCommand(qInsSes, conn, tx))
            {
                cs.Parameters.AddWithValue("@idRutina", idRutina);
                cs.Parameters.AddWithValue("@nom", nombreSesion);
                cs.Parameters.AddWithValue("@ord", ordenSesion);
                idSesion = Convert.ToInt32(cs.ExecuteScalar());
            }

            List<RutinaEditorEjercicioPayload> ejercicios = (sesion.Ejercicios ?? new List<RutinaEditorEjercicioPayload>()).OrderBy(x => x != null ? x.OrdenEjercicio : int.MaxValue).ToList();

            int ordenEjAuto = 1;
            foreach (RutinaEditorEjercicioPayload ej in ejercicios)
            {
                if (ej == null) continue;

                string nombreEj = (ej.NombreEjercicio ?? string.Empty).Trim();
                if (string.IsNullOrWhiteSpace(nombreEj) || nombreEj.Length > 180) throw new InvalidOperationException("Nombre de ejercicio inválido.");

                if (ej.Series <= 0 || ej.Series > 100) throw new InvalidOperationException("Series inválidas.");
                if (ej.Repeticiones.HasValue && ej.Repeticiones.Value <= 0) throw new InvalidOperationException("Repeticiones inválidas.");
                if (ej.DuracionSegundos.HasValue && ej.DuracionSegundos.Value <= 0) throw new InvalidOperationException("Duración de ejercicio inválida.");
                if (ej.Repeticiones.HasValue == ej.DuracionSegundos.HasValue) throw new InvalidOperationException("Cada ejercicio requiere repeticiones o duración.");
                if (ej.DescansoValor < 0) throw new InvalidOperationException("Descanso inválido.");

                string desUni = (ej.DescansoUnidad ?? string.Empty).Trim().ToLowerInvariant();
                if (desUni != "seg" && desUni != "min") desUni = "seg";

                if (ej.CargaValor.HasValue && ej.CargaValor.Value < 0) throw new InvalidOperationException("Carga inválida.");
                string cargaUni = (ej.CargaUnidad ?? string.Empty).Trim();
                if (cargaUni.Length > 0 && cargaUni != "kg" && cargaUni != "lb" && cargaUni != "%1RM" && cargaUni != "RPE") throw new InvalidOperationException("Unidad de carga inválida.");
                if (cargaUni.Length > 20) cargaUni = cargaUni.Substring(0, 20);
                if (cargaUni.Length == 0) cargaUni = null;

                string video;
                if (!TryNormalizarVideoUrl(ej.VideoUrl, out video)) throw new InvalidOperationException("El enlace de video debe ser HTTPS de YouTube o Vimeo.");

                if (ej.GuardarEnCatalogo && !ej.IdEjercicioCatalogo.HasValue)
                {
                    using (SqlCommand cat = new SqlCommand(@"IF NOT EXISTS(SELECT 1 FROM rut.Ejercicios WITH(UPDLOCK,HOLDLOCK) WHERE NombreNormalizado=@nn)
INSERT rut.Ejercicios(Nombre,NombreNormalizado,TecnicaInstrucciones,ErroresComunes,ImagenReferencia,VideoUrl) VALUES(@n,@nn,@t,@err,@img,@vid);
SELECT IdEjercicio FROM rut.Ejercicios WHERE NombreNormalizado=@nn;", conn, tx))
                    {
                        cat.Parameters.AddWithValue("@nn", NormalizarNombre(nombreEj));
                        cat.Parameters.AddWithValue("@n", nombreEj);
                        cat.Parameters.AddWithValue("@t", ToDb(ej.TecnicaInstrucciones,2000));
                        cat.Parameters.AddWithValue("@err", ToDb(ej.TecnicaErroresComunes,2000));
                        cat.Parameters.AddWithValue("@img", ToDb(ej.FotoReferencia,260));
                        cat.Parameters.AddWithValue("@vid", ToDb(video,500));
                        ej.IdEjercicioCatalogo = Convert.ToInt32(cat.ExecuteScalar());
                        ej.OrigenCatalogo = "rut";
                    }
                }
                int ordenEj = ej.OrdenEjercicio > 0 ? ej.OrdenEjercicio : ordenEjAuto;

                using (SqlCommand ce = new SqlCommand(qInsEj, conn, tx))
                {
                    ce.Parameters.AddWithValue("@idSesion", idSesion);
                    ce.Parameters.AddWithValue("@idCat", ej.IdEjercicioCatalogo.HasValue ? (object)ej.IdEjercicioCatalogo.Value : DBNull.Value);
                    ce.Parameters.AddWithValue("@origen", ToDb(ej.OrigenCatalogo, 20));
                    ce.Parameters.AddWithValue("@nom", nombreEj);
                    ce.Parameters.AddWithValue("@ord", ordenEj);
                    ce.Parameters.AddWithValue("@series", ej.Series);
                    ce.Parameters.AddWithValue("@rep", ej.Repeticiones.HasValue ? (object)ej.Repeticiones.Value : DBNull.Value);
                    ce.Parameters.AddWithValue("@dur", ej.DuracionSegundos.HasValue ? (object)ej.DuracionSegundos.Value : DBNull.Value);
                    ce.Parameters.AddWithValue("@desVal", ej.DescansoValor);
                    ce.Parameters.AddWithValue("@desUni", desUni);
                    ce.Parameters.AddWithValue("@cargaVal", ej.CargaValor.HasValue ? (object)ej.CargaValor.Value : DBNull.Value);
                    ce.Parameters.AddWithValue("@cargaUni", (object)cargaUni ?? DBNull.Value);
                    ce.Parameters.AddWithValue("@ind", ToDb(ej.IndicacionesEntrenador, 2000));
                    ce.Parameters.AddWithValue("@tecIns", ToDb(ej.TecnicaInstrucciones, 2000));
                    ce.Parameters.AddWithValue("@tecErr", ToDb(ej.TecnicaErroresComunes, 2000));
                    ce.Parameters.AddWithValue("@foto", ToDb(ej.FotoReferencia, 260));
                    ce.Parameters.AddWithValue("@video", ToDb(video, 500));
                    ce.Parameters.AddWithValue("@local", ej.EsAjusteLocal);
                    ce.ExecuteNonQuery();
                }

                ordenEjAuto += 1;
            }

            ordenSesionAuto += 1;
        }
    }
}
