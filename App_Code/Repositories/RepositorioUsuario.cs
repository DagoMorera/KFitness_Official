using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public static class RepositorioUsuario
{
    public static bool ExistePorCorreo(string correo)
    {
        const string sql = "SELECT COUNT(1) FROM seg.Usuarios WHERE Correo = @correo";
        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@correo", correo);
            conn.Open();
            var count = (int)cmd.ExecuteScalar();
            return count > 0;
        }
    }

    public static Usuario ObtenerPorCorreo(string correo)
    {
        const string sql = "SELECT IdUsuario, Correo, ClaveHash, IdRol, Nombre, Apellido1, Apellido2, Telefono, FotoPerfil, Activo, IntentosFallidos, BloqueadoHasta, UltimoAcceso FROM seg.Usuarios WHERE Correo = @correo";
        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@correo", correo);
            conn.Open();
            using (var reader = cmd.ExecuteReader())
            {
                if (!reader.Read()) return null;
                var u = new Usuario();
                u.IdUsuario = reader.GetInt32(reader.GetOrdinal("IdUsuario"));
                u.Correo = reader.GetString(reader.GetOrdinal("Correo"));
                u.ClaveHash = reader.GetString(reader.GetOrdinal("ClaveHash"));
                u.IdRol = reader.GetInt32(reader.GetOrdinal("IdRol"));
                u.Nombre = reader.GetString(reader.GetOrdinal("Nombre"));
                u.Apellido1 = reader.GetString(reader.GetOrdinal("Apellido1"));
                int idx = reader.GetOrdinal("Apellido2");
                if (!reader.IsDBNull(idx)) u.Apellido2 = reader.GetString(idx);
                idx = reader.GetOrdinal("Telefono");
                if (!reader.IsDBNull(idx)) u.Telefono = reader.GetString(idx);
                idx = reader.GetOrdinal("FotoPerfil");
                if (!reader.IsDBNull(idx)) u.FotoPerfil = reader.GetString(idx);
                u.Activo = reader.GetBoolean(reader.GetOrdinal("Activo"));
                u.IntentosFallidos = reader.GetInt32(reader.GetOrdinal("IntentosFallidos"));
                idx = reader.GetOrdinal("BloqueadoHasta");
                if (!reader.IsDBNull(idx)) u.BloqueadoHasta = reader.GetDateTime(idx);
                idx = reader.GetOrdinal("UltimoAcceso");
                if (!reader.IsDBNull(idx)) u.UltimoAcceso = reader.GetDateTime(idx);
                return u;
            }
        }
    }

    public static string ObtenerNombreRolPorId(int idRol)
    {
        const string sql = "SELECT Nombre FROM seg.Roles WHERE IdRol = @idRol";
        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idRol", idRol);
            conn.Open();
            var result = cmd.ExecuteScalar();
            if (result == null || result == DBNull.Value) return null;
            return Convert.ToString(result);
        }
    }

    public static void UpdateUltimoAcceso(int idUsuario)
    {
        const string sql = "UPDATE seg.Usuarios SET UltimoAcceso = SYSDATETIME() WHERE IdUsuario = @idUsuario";
        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idUsuario", idUsuario);
            conn.Open();
            cmd.ExecuteNonQuery();
        }
    }
    public static int? ObtenerIdRolPorNombre(string nombreRol)
    {
        const string sql = "SELECT IdRol FROM seg.Roles WHERE Nombre = @nombre";
        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@nombre", nombreRol);
            conn.Open();
            var result = cmd.ExecuteScalar();
            if (result == null || result == DBNull.Value) return null;
            return Convert.ToInt32(result);
        }
    }

    public static int CrearUsuario(Usuario u, DateTime fechaNacimiento)
    {
        const string sql = @"
INSERT INTO seg.Usuarios (Correo, ClaveHash, IdRol, Nombre, Apellido1, Apellido2, Telefono)
VALUES (@Correo, @ClaveHash, @IdRol, @Nombre, @Apellido1, @Apellido2, @Telefono);
DECLARE @IdUsuario INT = CONVERT(INT, SCOPE_IDENTITY());
INSERT INTO cli.Clientes (IdUsuario, FechaNacimiento, FechaAceptaTerminos, CreadoPor)
VALUES (@IdUsuario, @Nacimiento, SYSDATETIME(), @IdUsuario);
SELECT @IdUsuario;
";
        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@Correo", u.Correo);
            cmd.Parameters.AddWithValue("@ClaveHash", u.ClaveHash);
            cmd.Parameters.AddWithValue("@IdRol", u.IdRol);
            cmd.Parameters.AddWithValue("@Nombre", u.Nombre);
            cmd.Parameters.AddWithValue("@Apellido1", u.Apellido1);
            cmd.Parameters.AddWithValue("@Apellido2", (object)u.Apellido2 ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Telefono", (object)u.Telefono ?? DBNull.Value);
            cmd.Parameters.Add("@Nacimiento", SqlDbType.Date).Value = fechaNacimiento.Date;
            conn.Open();
            using (var tx = conn.BeginTransaction())
            {
                cmd.Transaction = tx;
                var idUsuario = Convert.ToInt32(cmd.ExecuteScalar());
                tx.Commit();
                return idUsuario;
            }
        }
    }

    public static bool ActualizarPerfil(string correo, string nombre, string apellido1, string apellido2, string telefono)
    {
        const string sql = @"
UPDATE seg.Usuarios
SET Nombre = @Nombre,
    Apellido1 = @Apellido1,
    Apellido2 = @Apellido2,
    Telefono = @Telefono
WHERE Correo = @Correo";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@Nombre", nombre);
            cmd.Parameters.AddWithValue("@Apellido1", apellido1);
            cmd.Parameters.AddWithValue("@Apellido2", (object)apellido2 ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Telefono", (object)telefono ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Correo", correo);
            conn.Open();
            var rows = cmd.ExecuteNonQuery();
            return rows > 0;
        }
    }

    public static bool ActualizarClavePorCorreo(string correo, string nuevoHash)
    {
        const string sql = @"
UPDATE seg.Usuarios
SET ClaveHash = @ClaveHash
WHERE Correo = @Correo";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@ClaveHash", nuevoHash);
            cmd.Parameters.AddWithValue("@Correo", correo);
            conn.Open();
            var rows = cmd.ExecuteNonQuery();
            return rows > 0;
        }
    }

    public static int ContarSolicitudesRecuperacionRecientes(int idUsuario, DateTime desdeUtc)
    {
        const string sql = @"
SELECT COUNT(1)
FROM seg.TokensRecuperacion
WHERE IdUsuario = @IdUsuario
  AND FechaCreacion >= @DesdeUtc";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);
            cmd.Parameters.AddWithValue("@DesdeUtc", desdeUtc);
            conn.Open();
            var result = cmd.ExecuteScalar();
            return result == null ? 0 : Convert.ToInt32(result);
        }
    }

    public static bool CrearTokenRecuperacion(int idUsuario, string tokenHash, DateTime fechaExpiraUtc)
    {
        const string sql = @"
INSERT INTO seg.TokensRecuperacion (IdUsuario, TokenHash, FechaExpira)
VALUES (@IdUsuario, @TokenHash, @FechaExpira)";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@IdUsuario", idUsuario);
            cmd.Parameters.AddWithValue("@TokenHash", tokenHash);
            cmd.Parameters.AddWithValue("@FechaExpira", fechaExpiraUtc);
            conn.Open();
            var rows = cmd.ExecuteNonQuery();
            return rows > 0;
        }
    }

    public static bool EliminarTokenRecuperacionNoUsado(string tokenHash)
    {
        const string sql = @"
DELETE FROM seg.TokensRecuperacion
WHERE TokenHash = @TokenHash
  AND FechaUso IS NULL";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@TokenHash", tokenHash);
            conn.Open();
            var rows = cmd.ExecuteNonQuery();
            return rows > 0;
        }
    }

    public static ResultadoResetConToken RestablecerClavePorTokenHash(string tokenHash, string nuevoHash, DateTime fechaActualUtc)
    {
        ResultadoResetConToken resultado = new ResultadoResetConToken();
        resultado.Exitoso = false;
        resultado.Codigo = "TOKEN_INVALIDO";

        using (var conn = DbHelper.GetConnection())
        {
            conn.Open();
            SqlTransaction tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

            try
            {
                const string sqlToken = @"
SELECT TOP 1 IdToken, IdUsuario, FechaExpira, FechaUso
FROM seg.TokensRecuperacion WITH (UPDLOCK, ROWLOCK)
WHERE TokenHash = @TokenHash";

                int idToken = 0;
                int idUsuario = 0;
                DateTime fechaExpira = DateTime.MinValue;
                DateTime? fechaUso = null;

                bool tokenEncontrado = false;
                using (var cmdToken = new SqlCommand(sqlToken, conn, tx))
                {
                    cmdToken.Parameters.AddWithValue("@TokenHash", tokenHash);
                    using (var reader = cmdToken.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            tokenEncontrado = true;
                            idToken = reader.GetInt32(reader.GetOrdinal("IdToken"));
                            idUsuario = reader.GetInt32(reader.GetOrdinal("IdUsuario"));
                            fechaExpira = reader.GetDateTime(reader.GetOrdinal("FechaExpira"));
                            int idxFechaUso = reader.GetOrdinal("FechaUso");
                            if (!reader.IsDBNull(idxFechaUso))
                            {
                                fechaUso = reader.GetDateTime(idxFechaUso);
                            }
                        }
                    }
                }

                if (!tokenEncontrado)
                {
                    tx.Rollback();
                    resultado.Codigo = "TOKEN_INVALIDO";
                    return resultado;
                }

                if (fechaUso.HasValue)
                {
                    tx.Rollback();
                    resultado.Codigo = "TOKEN_USADO";
                    return resultado;
                }

                if (fechaExpira < fechaActualUtc)
                {
                    tx.Rollback();
                    resultado.Codigo = "TOKEN_EXPIRADO";
                    return resultado;
                }

                const string sqlUsuario = @"
UPDATE seg.Usuarios
SET ClaveHash = @ClaveHash
WHERE IdUsuario = @IdUsuario";

                int rowsUsuario;
                using (var cmdUsuario = new SqlCommand(sqlUsuario, conn, tx))
                {
                    cmdUsuario.Parameters.AddWithValue("@ClaveHash", nuevoHash);
                    cmdUsuario.Parameters.AddWithValue("@IdUsuario", idUsuario);
                    rowsUsuario = cmdUsuario.ExecuteNonQuery();
                }

                if (rowsUsuario <= 0)
                {
                    tx.Rollback();
                    resultado.Codigo = "USUARIO_NO_ENCONTRADO";
                    return resultado;
                }

                const string sqlUso = @"
UPDATE seg.TokensRecuperacion
SET FechaUso = @FechaUso
WHERE IdToken = @IdToken
  AND FechaUso IS NULL";

                int rowsUso;
                using (var cmdUso = new SqlCommand(sqlUso, conn, tx))
                {
                    cmdUso.Parameters.AddWithValue("@FechaUso", fechaActualUtc);
                    cmdUso.Parameters.AddWithValue("@IdToken", idToken);
                    rowsUso = cmdUso.ExecuteNonQuery();
                }

                if (rowsUso != 1)
                {
                    tx.Rollback();
                    resultado.Codigo = "TOKEN_CONFLICTO";
                    return resultado;
                }

                tx.Commit();
                resultado.Exitoso = true;
                resultado.Codigo = "OK";
                return resultado;
            }
            catch
            {
                try { tx.Rollback(); } catch { }
                throw;
            }
        }
    }

    public static string ObtenerFotoPerfilPorCorreo(string correo)
    {
        const string sql = "SELECT FotoPerfil FROM seg.Usuarios WHERE Correo = @Correo";
        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@Correo", correo);
            conn.Open();
            var result = cmd.ExecuteScalar();
            if (result == null || result == DBNull.Value) return null;
            return Convert.ToString(result);
        }
    }

    public static bool ActualizarFotoPerfilPorCorreo(string correo, string fotoPerfil)
    {
        const string sql = @"
UPDATE seg.Usuarios
SET FotoPerfil = @FotoPerfil
WHERE Correo = @Correo";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@FotoPerfil", (object)fotoPerfil ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Correo", correo);
            conn.Open();
            var rows = cmd.ExecuteNonQuery();
            return rows > 0;
        }
    }

    public static DatosClientePerfil ObtenerDatosClientePerfilPorCorreo(string correo)
    {
        bool tieneSexo = ColumnaClientesExiste("Sexo");
        bool tieneNivelActividad = ColumnaClientesExiste("NivelActividad");

        string sql = @"
SELECT TOP 1 c.IdCliente, c.FechaNacimiento, "
            + (tieneSexo ? "c.Sexo" : "CAST(NULL AS NVARCHAR(30)) AS Sexo")
            + ", "
            + (tieneNivelActividad ? "c.NivelActividad" : "CAST(NULL AS NVARCHAR(20)) AS NivelActividad")
            + @"
FROM seg.Usuarios u
INNER JOIN cli.Clientes c ON c.IdUsuario = u.IdUsuario
WHERE u.Correo = @Correo";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@Correo", correo);
            conn.Open();
            using (var reader = cmd.ExecuteReader())
            {
                if (!reader.Read()) return null;

                var datos = new DatosClientePerfil();
                datos.IdCliente = reader.GetInt32(reader.GetOrdinal("IdCliente"));

                int idx = reader.GetOrdinal("FechaNacimiento");
                if (!reader.IsDBNull(idx)) datos.FechaNacimiento = reader.GetDateTime(idx);

                idx = reader.GetOrdinal("Sexo");
                if (!reader.IsDBNull(idx)) datos.Sexo = reader.GetString(idx);

                idx = reader.GetOrdinal("NivelActividad");
                if (!reader.IsDBNull(idx)) datos.NivelActividad = reader.GetString(idx);

                return datos;
            }
        }
    }

    public static bool ActualizarDatosClientePerfilPorCorreo(string correo, DateTime? fechaNacimiento, string sexo, string nivelActividad)
    {
        const string sql = @"
UPDATE c
SET FechaNacimiento = @FechaNacimiento, Sexo = @Sexo, NivelActividad = @NivelActividad,
    FechaModificacion = SYSDATETIME(), ModificadoPor = u.IdUsuario
FROM cli.Clientes c
INNER JOIN seg.Usuarios u ON u.IdUsuario = c.IdUsuario
WHERE u.Correo = @Correo";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.Add("@FechaNacimiento", SqlDbType.Date).Value = (object)fechaNacimiento ?? DBNull.Value;
            cmd.Parameters.Add("@Sexo", SqlDbType.NVarChar, 30).Value = (object)sexo ?? DBNull.Value;
            cmd.Parameters.Add("@NivelActividad", SqlDbType.NVarChar, 20).Value = (object)nivelActividad ?? DBNull.Value;
            cmd.Parameters.AddWithValue("@Correo", correo);
            conn.Open();
            return cmd.ExecuteNonQuery() > 0;
        }
    }

    public static List<RegistroProgresoPerfil> ListarProgresoPerfilPorCorreo(string correo)
    {
        var lista = new List<RegistroProgresoPerfil>();
        var idCliente = ObtenerIdClientePorCorreo(correo);
        if (!idCliente.HasValue) return lista;

        const string sql = @"
SELECT IdProgreso, FechaRegistro, PesoKg, CinturaCm, CaderaCm, PechoCm, BrazoCm, MusloCm
FROM cli.ProgresoFisico
WHERE IdCliente = @IdCliente
ORDER BY FechaRegistro DESC, IdProgreso DESC";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@IdCliente", idCliente.Value);
            conn.Open();
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    var item = new RegistroProgresoPerfil();
                    item.IdProgreso = reader.GetInt64(reader.GetOrdinal("IdProgreso"));
                    item.FechaRegistro = reader.GetDateTime(reader.GetOrdinal("FechaRegistro"));

                    int idx = reader.GetOrdinal("PesoKg");
                    if (!reader.IsDBNull(idx)) item.PesoKg = reader.GetDecimal(idx);

                    idx = reader.GetOrdinal("CinturaCm");
                    if (!reader.IsDBNull(idx)) item.CinturaCm = reader.GetDecimal(idx);

                    idx = reader.GetOrdinal("CaderaCm");
                    if (!reader.IsDBNull(idx)) item.CaderaCm = reader.GetDecimal(idx);

                    idx = reader.GetOrdinal("PechoCm");
                    if (!reader.IsDBNull(idx)) item.PechoCm = reader.GetDecimal(idx);

                    idx = reader.GetOrdinal("BrazoCm");
                    if (!reader.IsDBNull(idx)) item.BrazoCm = reader.GetDecimal(idx);

                    idx = reader.GetOrdinal("MusloCm");
                    if (!reader.IsDBNull(idx)) item.MusloCm = reader.GetDecimal(idx);

                    lista.Add(item);
                }
            }
        }

        return lista;
    }

    public static GuardarProgresoPerfilResultado GuardarProgresoPerfilPorCorreo(string correo, long? idProgreso, DateTime fechaRegistro, decimal pesoKg, decimal? cinturaCm, decimal? caderaCm, decimal? pechoCm, decimal? brazoCm, decimal? musloCm)
    {
        var resultado = new GuardarProgresoPerfilResultado();
        var idCliente = ObtenerIdClientePorCorreo(correo);
        if (!idCliente.HasValue)
        {
            resultado.ClienteEncontrado = false;
            return resultado;
        }

        resultado.ClienteEncontrado = true;

        if (idProgreso.HasValue && idProgreso.Value > 0)
        {
            const string sqlUpdate = @"
UPDATE cli.ProgresoFisico
SET FechaRegistro = @FechaRegistro,
    PesoKg = @PesoKg,
    CinturaCm = @CinturaCm,
    CaderaCm = @CaderaCm,
    PechoCm = @PechoCm,
    BrazoCm = @BrazoCm,
    MusloCm = @MusloCm
WHERE IdProgreso = @IdProgreso
  AND IdCliente = @IdCliente";

            using (var conn = DbHelper.GetConnection())
            using (var cmd = new SqlCommand(sqlUpdate, conn))
            {
                cmd.Parameters.AddWithValue("@FechaRegistro", fechaRegistro);
                cmd.Parameters.AddWithValue("@PesoKg", pesoKg);
                cmd.Parameters.AddWithValue("@CinturaCm", (object)cinturaCm ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@CaderaCm", (object)caderaCm ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PechoCm", (object)pechoCm ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@BrazoCm", (object)brazoCm ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@MusloCm", (object)musloCm ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IdProgreso", idProgreso.Value);
                cmd.Parameters.AddWithValue("@IdCliente", idCliente.Value);
                conn.Open();
                var rows = cmd.ExecuteNonQuery();
                resultado.Exitoso = rows > 0;
                resultado.RegistroEncontrado = rows > 0;
                resultado.IdProgreso = idProgreso.Value;
                return resultado;
            }
        }

        const string sqlInsert = @"
INSERT INTO cli.ProgresoFisico (IdCliente, FechaRegistro, PesoKg, CinturaCm, CaderaCm, PechoCm, BrazoCm, MusloCm)
VALUES (@IdCliente, @FechaRegistro, @PesoKg, @CinturaCm, @CaderaCm, @PechoCm, @BrazoCm, @MusloCm);
SELECT CAST(SCOPE_IDENTITY() AS BIGINT);";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sqlInsert, conn))
        {
            cmd.Parameters.AddWithValue("@IdCliente", idCliente.Value);
            cmd.Parameters.AddWithValue("@FechaRegistro", fechaRegistro);
            cmd.Parameters.AddWithValue("@PesoKg", pesoKg);
            cmd.Parameters.AddWithValue("@CinturaCm", (object)cinturaCm ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CaderaCm", (object)caderaCm ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@PechoCm", (object)pechoCm ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@BrazoCm", (object)brazoCm ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@MusloCm", (object)musloCm ?? DBNull.Value);
            conn.Open();
            var idNuevo = cmd.ExecuteScalar();
            if (idNuevo != null && idNuevo != DBNull.Value)
            {
                resultado.Exitoso = true;
                resultado.RegistroEncontrado = true;
                resultado.IdProgreso = Convert.ToInt64(idNuevo);
            }
            return resultado;
        }
    }

    private static bool ColumnaClientesExiste(string nombreColumna)
    {
        if (string.IsNullOrWhiteSpace(nombreColumna)) return false;

        const string sql = @"SELECT COUNT(1) FROM sys.columns WHERE object_id = OBJECT_ID(N'cli.Clientes') AND name = @NombreColumna";
        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@NombreColumna", nombreColumna);
            conn.Open();
            var count = Convert.ToInt32(cmd.ExecuteScalar());
            return count > 0;
        }
    }

    private static int? ObtenerIdClientePorCorreo(string correo)
    {
        const string sql = @"
SELECT TOP 1 c.IdCliente
FROM seg.Usuarios u
INNER JOIN cli.Clientes c ON c.IdUsuario = u.IdUsuario
WHERE u.Correo = @Correo";

        using (var conn = DbHelper.GetConnection())
        using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@Correo", correo);
            conn.Open();
            var valor = cmd.ExecuteScalar();
            if (valor == null || valor == DBNull.Value) return null;
            return Convert.ToInt32(valor);
        }
    }
}

public class ResultadoResetConToken
{
    public bool Exitoso { get; set; }
    public string Codigo { get; set; }
}

public class DatosClientePerfil
{
    public int IdCliente { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public string Sexo { get; set; }
    public string NivelActividad { get; set; }
}

public class RegistroProgresoPerfil
{
    public long IdProgreso { get; set; }
    public DateTime FechaRegistro { get; set; }
    public decimal? PesoKg { get; set; }
    public decimal? CinturaCm { get; set; }
    public decimal? CaderaCm { get; set; }
    public decimal? PechoCm { get; set; }
    public decimal? BrazoCm { get; set; }
    public decimal? MusloCm { get; set; }
}

public class GuardarProgresoPerfilResultado
{
    public bool Exitoso { get; set; }
    public bool ClienteEncontrado { get; set; }
    public bool RegistroEncontrado { get; set; }
    public long IdProgreso { get; set; }
}
