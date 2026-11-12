using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Text;
using System.Text.RegularExpressions;

public class RutinaAdminListadoItem { public int IdRutina { get; set; } public string Nombre { get; set; } public string Objetivo { get; set; } public string Nivel { get; set; } public int DuracionAproximadaMin { get; set; } public bool Activa { get; set; } }
public class RutinaAdminDetalleItem : RutinaAdminListadoItem { public string Descripcion { get; set; } }
public class RutinasAdminPaginadas { public int Pagina { get; set; } public int TamanoPagina { get; set; } public int TotalRegistros { get; set; } public List<RutinaAdminListadoItem> Rutinas { get; set; } }
public class OperacionRutinaResultado { public bool Success { get; set; } public string CodigoError { get; set; } public string Message { get; set; } public int IdRutina { get; set; } }
public class AsignacionRutinaResultado { public bool Success { get; set; } public string CodigoError { get; set; } public string Message { get; set; } public long IdAsignacionRutina { get; set; } }
public class UsuarioRutinaItem { public int IdUsuario { get; set; } public string NombreCompleto { get; set; } public string Correo { get; set; } }
public class RutinaClienteAsignadaItem { public long IdAsignacionRutina { get; set; } public int IdRutina { get; set; } public string Nombre { get; set; } public string Descripcion { get; set; } public string Objetivo { get; set; } public string Nivel { get; set; } public int DuracionAproximadaMin { get; set; } public bool RutinaActiva { get; set; } public bool AsignacionActiva { get; set; } public bool Vigente { get; set; } public DateTime FechaAsignacion { get; set; } public DateTime? FechaFinalizacion { get; set; } }

public static class RepositorioRutinas
{
    private static readonly Regex EspaciosMultiples = new Regex("\\s+", RegexOptions.Compiled);

    public static string NormalizarNombre(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        string limpio = input.Trim().Replace("\r", " ").Replace("\n", " ");
        limpio = EspaciosMultiples.Replace(limpio, " ");
        return limpio.ToUpperInvariant();
    }

    public static OperacionRutinaResultado ValidarCampos(string nombre, string objetivo, string nivel, int duracion)
    {
        if (string.IsNullOrWhiteSpace(nombre)) return new OperacionRutinaResultado { Success = false, CodigoError = "NOMBRE_REQUERIDO", Message = "El nombre es obligatorio." };
        if (string.IsNullOrWhiteSpace(objetivo)) return new OperacionRutinaResultado { Success = false, CodigoError = "OBJETIVO_REQUERIDO", Message = "El objetivo es obligatorio." };
        if (string.IsNullOrWhiteSpace(nivel)) return new OperacionRutinaResultado { Success = false, CodigoError = "NIVEL_REQUERIDO", Message = "El nivel es obligatorio." };
        string n = nivel.Trim();
        if (!string.Equals(n, "Principiante", StringComparison.OrdinalIgnoreCase) && !string.Equals(n, "Intermedio", StringComparison.OrdinalIgnoreCase) && !string.Equals(n, "Avanzado", StringComparison.OrdinalIgnoreCase)) return new OperacionRutinaResultado { Success = false, CodigoError = "NIVEL_INVALIDO", Message = "Nivel inválido." };
        if (duracion <= 0 || duracion > 600) return new OperacionRutinaResultado { Success = false, CodigoError = "DURACION_INVALIDA", Message = "Duración inválida." };
        if (nombre.Trim().Length > 150) return new OperacionRutinaResultado { Success = false, CodigoError = "NOMBRE_INVALIDO", Message = "Nombre inválido." };
        if (objetivo.Trim().Length > 200) return new OperacionRutinaResultado { Success = false, CodigoError = "OBJETIVO_INVALIDO", Message = "Objetivo inválido." };
        return new OperacionRutinaResultado { Success = true };
    }

    public static RutinaAdminDetalleItem ObtenerDetalleRutina(int idRutina)
    {
        if (idRutina <= 0) return null;
        const string sql = "SELECT IdRutina, Nombre, Descripcion, Objetivo, Nivel, DuracionAproximadaMin, Activa FROM rut.Rutinas WHERE IdRutina=@idRutina";
        using (SqlConnection conn = DbHelper.GetConnection()) using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idRutina", idRutina); conn.Open(); using (SqlDataReader r = cmd.ExecuteReader())
            {
                if (!r.Read()) return null;
                return new RutinaAdminDetalleItem { IdRutina = r.GetInt32(0), Nombre = r.IsDBNull(1)?string.Empty:r.GetString(1), Descripcion = r.IsDBNull(2)?string.Empty:r.GetString(2), Objetivo = r.IsDBNull(3)?string.Empty:r.GetString(3), Nivel = r.IsDBNull(4)?string.Empty:r.GetString(4), DuracionAproximadaMin = r.IsDBNull(5)?0:r.GetInt32(5), Activa = !r.IsDBNull(6)&&r.GetBoolean(6) };
            }
        }
    }

    public static RutinasAdminPaginadas ObtenerRutinasAdmin(string nombre, string nivel, bool? activa, int pagina, int tamanoPagina)
    {
        if (pagina < 1) pagina = 1; if (tamanoPagina <= 0) tamanoPagina = 10; if (tamanoPagina > 50) tamanoPagina = 50;
        string n = string.IsNullOrWhiteSpace(nombre) ? null : nombre.Trim(); string lv = string.IsNullOrWhiteSpace(nivel) ? null : nivel.Trim();
        int ini = ((pagina - 1) * tamanoPagina) + 1; int fin = pagina * tamanoPagina;
        const string sqlCount = "SELECT COUNT(1) FROM rut.Rutinas WHERE (@n IS NULL OR Nombre LIKE '%'+@n+'%') AND (@lv IS NULL OR Nivel=@lv) AND (@a IS NULL OR Activa=@a)";
        const string sqlPage = ";WITH d AS (SELECT IdRutina,Nombre,Objetivo,Nivel,DuracionAproximadaMin,Activa,ROW_NUMBER() OVER(ORDER BY Nombre,IdRutina) rn FROM rut.Rutinas WHERE (@n IS NULL OR Nombre LIKE '%'+@n+'%') AND (@lv IS NULL OR Nivel=@lv) AND (@a IS NULL OR Activa=@a)) SELECT IdRutina,Nombre,Objetivo,Nivel,DuracionAproximadaMin,Activa FROM d WHERE rn BETWEEN @ini AND @fin ORDER BY rn";
        RutinasAdminPaginadas res = new RutinasAdminPaginadas { Pagina = pagina, TamanoPagina = tamanoPagina, Rutinas = new List<RutinaAdminListadoItem>() };
        using (SqlConnection conn = DbHelper.GetConnection()) using (SqlCommand c1 = new SqlCommand(sqlCount, conn)) using (SqlCommand c2 = new SqlCommand(sqlPage, conn))
        {
            c1.Parameters.AddWithValue("@n", (object)n ?? DBNull.Value); c1.Parameters.AddWithValue("@lv", (object)lv ?? DBNull.Value); c1.Parameters.AddWithValue("@a", activa.HasValue ? (object)activa.Value : DBNull.Value);
            c2.Parameters.AddWithValue("@n", (object)n ?? DBNull.Value); c2.Parameters.AddWithValue("@lv", (object)lv ?? DBNull.Value); c2.Parameters.AddWithValue("@a", activa.HasValue ? (object)activa.Value : DBNull.Value); c2.Parameters.AddWithValue("@ini", ini); c2.Parameters.AddWithValue("@fin", fin);
            conn.Open(); res.TotalRegistros = Convert.ToInt32(c1.ExecuteScalar());
            using (SqlDataReader r = c2.ExecuteReader()) while (r.Read()) res.Rutinas.Add(new RutinaAdminListadoItem { IdRutina = r.GetInt32(0), Nombre = r.IsDBNull(1)?string.Empty:r.GetString(1), Objetivo = r.IsDBNull(2)?string.Empty:r.GetString(2), Nivel = r.IsDBNull(3)?string.Empty:r.GetString(3), DuracionAproximadaMin = r.IsDBNull(4)?0:r.GetInt32(4), Activa = !r.IsDBNull(5)&&r.GetBoolean(5) });
        }
        return res;
    }

    public static OperacionRutinaResultado CrearRutina(int idActor, string nombre, string descripcion, string objetivo, string nivel, int duracion)
    {
        OperacionRutinaResultado v = ValidarCampos(nombre, objetivo, nivel, duracion); if (!v.Success) return v;
        string nn = NormalizarNombre(nombre);
        const string qDup = "SELECT TOP 1 IdRutina FROM rut.Rutinas WHERE NombreNormalizado=@nn";
        const string qIns = "INSERT INTO rut.Rutinas (Nombre,NombreNormalizado,Descripcion,Objetivo,Nivel,DuracionAproximadaMin,Activa,FechaCreacion,FechaActualizacion,IdUsuarioCreador,IdUsuarioActualizador) VALUES (@nom,@nn,@des,@obj,@niv,@dur,1,SYSDATETIME(),SYSDATETIME(),@actor,@actor); SELECT CAST(SCOPE_IDENTITY() AS INT);";
        using (SqlConnection conn = DbHelper.GetConnection()) using (SqlCommand cd = new SqlCommand(qDup, conn)) using (SqlCommand ci = new SqlCommand(qIns, conn))
        {
            conn.Open(); cd.Parameters.AddWithValue("@nn", nn); if (cd.ExecuteScalar() != null) return new OperacionRutinaResultado { Success = false, CodigoError = "RUTINA_DUPLICADA", Message = "Ya existe una rutina con ese nombre." };
            ci.Parameters.AddWithValue("@nom", nombre.Trim()); ci.Parameters.AddWithValue("@nn", nn); ci.Parameters.AddWithValue("@des", string.IsNullOrWhiteSpace(descripcion)?(object)DBNull.Value:descripcion.Trim()); ci.Parameters.AddWithValue("@obj", objetivo.Trim()); ci.Parameters.AddWithValue("@niv", nivel.Trim()); ci.Parameters.AddWithValue("@dur", duracion); ci.Parameters.AddWithValue("@actor", idActor > 0 ? (object)idActor : DBNull.Value);
            int id = Convert.ToInt32(ci.ExecuteScalar()); return new OperacionRutinaResultado { Success = true, IdRutina = id, Message = "Rutina creada correctamente." };
        }
    }

    public static OperacionRutinaResultado ActualizarRutina(int idActor, int idRutina, string nombre, string descripcion, string objetivo, string nivel, int duracion)
    {
        if (idRutina <= 0) return new OperacionRutinaResultado { Success = false, CodigoError = "RUTINA_INVALIDA", Message = "Rutina inválida." };
        OperacionRutinaResultado v = ValidarCampos(nombre, objetivo, nivel, duracion); if (!v.Success) return v; string nn = NormalizarNombre(nombre);
        const string qEx = "SELECT COUNT(1) FROM rut.Rutinas WHERE IdRutina=@id";
        const string qDup = "SELECT TOP 1 IdRutina FROM rut.Rutinas WHERE NombreNormalizado=@nn AND IdRutina<>@id";
        const string qUp = "UPDATE rut.Rutinas SET Nombre=@nom,NombreNormalizado=@nn,Descripcion=@des,Objetivo=@obj,Nivel=@niv,DuracionAproximadaMin=@dur,FechaActualizacion=SYSDATETIME(),IdUsuarioActualizador=@actor WHERE IdRutina=@id";
        using (SqlConnection conn = DbHelper.GetConnection()) using (SqlCommand ce = new SqlCommand(qEx, conn)) using (SqlCommand cd = new SqlCommand(qDup, conn)) using (SqlCommand cu = new SqlCommand(qUp, conn))
        {
            conn.Open(); ce.Parameters.AddWithValue("@id", idRutina); if (Convert.ToInt32(ce.ExecuteScalar()) <= 0) return new OperacionRutinaResultado { Success = false, CodigoError = "RUTINA_NO_EXISTE", Message = "La rutina no existe." };
            cd.Parameters.AddWithValue("@nn", nn); cd.Parameters.AddWithValue("@id", idRutina); if (cd.ExecuteScalar() != null) return new OperacionRutinaResultado { Success = false, CodigoError = "RUTINA_DUPLICADA", Message = "Ya existe una rutina con ese nombre." };
            cu.Parameters.AddWithValue("@id", idRutina); cu.Parameters.AddWithValue("@nom", nombre.Trim()); cu.Parameters.AddWithValue("@nn", nn); cu.Parameters.AddWithValue("@des", string.IsNullOrWhiteSpace(descripcion)?(object)DBNull.Value:descripcion.Trim()); cu.Parameters.AddWithValue("@obj", objetivo.Trim()); cu.Parameters.AddWithValue("@niv", nivel.Trim()); cu.Parameters.AddWithValue("@dur", duracion); cu.Parameters.AddWithValue("@actor", idActor > 0 ? (object)idActor : DBNull.Value); cu.ExecuteNonQuery();
            return new OperacionRutinaResultado { Success = true, IdRutina = idRutina, Message = "Rutina actualizada correctamente." };
        }
    }

    public static OperacionRutinaResultado CambiarEstadoRutina(int idActor, int idRutina, bool activa)
    {
        const string qEx = "SELECT COUNT(1) FROM rut.Rutinas WHERE IdRutina=@id"; const string qUp = "UPDATE rut.Rutinas SET Activa=@a,FechaActualizacion=SYSDATETIME(),IdUsuarioActualizador=@actor WHERE IdRutina=@id";
        using (SqlConnection conn = DbHelper.GetConnection()) using (SqlCommand ce = new SqlCommand(qEx, conn)) using (SqlCommand cu = new SqlCommand(qUp, conn))
        {
            conn.Open(); ce.Parameters.AddWithValue("@id", idRutina); if (Convert.ToInt32(ce.ExecuteScalar()) <= 0) return new OperacionRutinaResultado { Success = false, CodigoError = "RUTINA_NO_EXISTE", Message = "La rutina no existe." };
            cu.Parameters.AddWithValue("@id", idRutina); cu.Parameters.AddWithValue("@a", activa); cu.Parameters.AddWithValue("@actor", idActor > 0 ? (object)idActor : DBNull.Value); cu.ExecuteNonQuery();
            return new OperacionRutinaResultado { Success = true, IdRutina = idRutina, Message = activa ? "Rutina activada correctamente." : "Rutina desactivada correctamente." };
        }
    }

    public static AsignacionRutinaResultado AsignarRutina(int idActor, int idRutina, int idUsuario)
    {
        const string qRut = "SELECT COUNT(1) FROM rut.Rutinas WHERE IdRutina=@rutina AND Activa=1";
        const string qUsr = "SELECT COUNT(1) FROM seg.Usuarios u INNER JOIN seg.Roles r ON r.IdRol=u.IdRol WHERE u.IdUsuario=@usuario AND u.Activo=1 AND r.Nombre=N'Cliente'";
        const string qDup = "SELECT TOP 1 IdAsignacionRutina FROM rut.AsignacionesRutina WHERE IdUsuario=@usuario AND IdRutina=@rutina AND Activa=1";
        const string qIns = "INSERT INTO rut.AsignacionesRutina (IdRutina,IdUsuario,Activa,FechaAsignacion,FechaFinalizacion,IdUsuarioAsignador) VALUES (@rutina,@usuario,1,SYSDATETIME(),NULL,@actor); SELECT CAST(SCOPE_IDENTITY() AS BIGINT);";
        using (SqlConnection conn = DbHelper.GetConnection()) using (SqlCommand cr = new SqlCommand(qRut, conn)) using (SqlCommand cu = new SqlCommand(qUsr, conn)) using (SqlCommand cd = new SqlCommand(qDup, conn)) using (SqlCommand ci = new SqlCommand(qIns, conn))
        {
            conn.Open(); cr.Parameters.AddWithValue("@rutina", idRutina); if (Convert.ToInt32(cr.ExecuteScalar()) <= 0) return new AsignacionRutinaResultado { Success = false, CodigoError = "RUTINA_NO_DISPONIBLE", Message = "La rutina no está disponible para asignación." };
            cu.Parameters.AddWithValue("@usuario", idUsuario); if (Convert.ToInt32(cu.ExecuteScalar()) <= 0) return new AsignacionRutinaResultado { Success = false, CodigoError = "USUARIO_NO_PERMITIDO", Message = "El usuario no es válido para asignación." };
            cd.Parameters.AddWithValue("@usuario", idUsuario); cd.Parameters.AddWithValue("@rutina", idRutina); if (cd.ExecuteScalar() != null) return new AsignacionRutinaResultado { Success = false, CodigoError = "ASIGNACION_DUPLICADA", Message = "El usuario ya tiene esta rutina activa." };
            ci.Parameters.AddWithValue("@rutina", idRutina); ci.Parameters.AddWithValue("@usuario", idUsuario); ci.Parameters.AddWithValue("@actor", idActor); long id = Convert.ToInt64(ci.ExecuteScalar()); return new AsignacionRutinaResultado { Success = true, IdAsignacionRutina = id, Message = "Rutina asignada correctamente." };
        }
    }

    public static List<RutinaAdminListadoItem> ObtenerRutinasActivasDisponibles(string nombre)
    {
        string n = string.IsNullOrWhiteSpace(nombre) ? null : nombre.Trim();
        const string sql = "SELECT IdRutina,Nombre,Objetivo,Nivel,DuracionAproximadaMin,Activa FROM rut.Rutinas WHERE Activa=1 AND (@n IS NULL OR Nombre LIKE '%'+@n+'%') ORDER BY Nombre,IdRutina";
        List<RutinaAdminListadoItem> list = new List<RutinaAdminListadoItem>();
        using (SqlConnection conn = DbHelper.GetConnection()) using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@n", (object)n ?? DBNull.Value); conn.Open(); using (SqlDataReader r = cmd.ExecuteReader()) while (r.Read()) list.Add(new RutinaAdminListadoItem { IdRutina = r.GetInt32(0), Nombre = r.IsDBNull(1)?string.Empty:r.GetString(1), Objetivo = r.IsDBNull(2)?string.Empty:r.GetString(2), Nivel = r.IsDBNull(3)?string.Empty:r.GetString(3), DuracionAproximadaMin = r.IsDBNull(4)?0:r.GetInt32(4), Activa = !r.IsDBNull(5)&&r.GetBoolean(5) });
        }
        return list;
    }

    public static List<UsuarioRutinaItem> BuscarUsuariosClientes(string q, int maximo)
    {
        string filtro = string.IsNullOrWhiteSpace(q) ? null : q.Trim(); if (maximo <= 0) maximo = 10; if (maximo > 30) maximo = 30;
        const string sql = "SELECT TOP (@maximo) u.IdUsuario,u.Nombre,u.Apellido1,u.Apellido2,u.Correo FROM seg.Usuarios u INNER JOIN seg.Roles r ON r.IdRol=u.IdRol WHERE u.Activo=1 AND r.Nombre=N'Cliente' AND (@q IS NULL OR u.Nombre LIKE '%'+@q+'%' OR u.Apellido1 LIKE '%'+@q+'%' OR ISNULL(u.Apellido2,N'') LIKE '%'+@q+'%' OR u.Correo LIKE '%'+@q+'%') ORDER BY u.Nombre,u.Apellido1,u.IdUsuario";
        List<UsuarioRutinaItem> list = new List<UsuarioRutinaItem>();
        using (SqlConnection conn = DbHelper.GetConnection()) using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@maximo", maximo); cmd.Parameters.AddWithValue("@q", (object)filtro ?? DBNull.Value); conn.Open();
            using (SqlDataReader r = cmd.ExecuteReader()) while (r.Read()) { string n = r.IsDBNull(1)?string.Empty:r.GetString(1); string a1 = r.IsDBNull(2)?string.Empty:r.GetString(2); string a2 = r.IsDBNull(3)?string.Empty:r.GetString(3); list.Add(new UsuarioRutinaItem { IdUsuario = r.GetInt32(0), NombreCompleto = string.Join(" ", new string[] { n, a1, a2 }).Trim(), Correo = r.IsDBNull(4)?string.Empty:r.GetString(4) }); }
        }
        return list;
    }

    public static List<RutinaClienteAsignadaItem> ObtenerRutinasAsignadasCliente(int idUsuario)
    {
        List<RutinaClienteAsignadaItem> list = new List<RutinaClienteAsignadaItem>(); if (idUsuario <= 0) return list;
        const string sql = "SELECT a.IdAsignacionRutina,a.IdRutina,a.Activa,a.FechaAsignacion,a.FechaFinalizacion,r.Nombre,r.Descripcion,r.Objetivo,r.Nivel,r.DuracionAproximadaMin,r.Activa FROM rut.AsignacionesRutina a INNER JOIN rut.Rutinas r ON r.IdRutina=a.IdRutina WHERE a.IdUsuario=@id ORDER BY a.FechaAsignacion DESC,a.IdAsignacionRutina DESC";
        using (SqlConnection conn = DbHelper.GetConnection()) using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@id", idUsuario); conn.Open(); using (SqlDataReader r = cmd.ExecuteReader()) while (r.Read()) { bool asig = !r.IsDBNull(2) && r.GetBoolean(2); bool rut = !r.IsDBNull(10) && r.GetBoolean(10); list.Add(new RutinaClienteAsignadaItem { IdAsignacionRutina = r.GetInt64(0), IdRutina = r.GetInt32(1), AsignacionActiva = asig, FechaAsignacion = r.GetDateTime(3), FechaFinalizacion = r.IsDBNull(4)?(DateTime?)null:r.GetDateTime(4), Nombre = r.IsDBNull(5)?string.Empty:r.GetString(5), Descripcion = r.IsDBNull(6)?string.Empty:r.GetString(6), Objetivo = r.IsDBNull(7)?string.Empty:r.GetString(7), Nivel = r.IsDBNull(8)?string.Empty:r.GetString(8), DuracionAproximadaMin = r.IsDBNull(9)?0:r.GetInt32(9), RutinaActiva = rut, Vigente = asig && rut }); }
        }
        return list;
    }
}
