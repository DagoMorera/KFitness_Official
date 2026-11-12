using System;
using System.Data;
using System.Data.SqlClient;
using System.Web;

public class RegistrarAuditoriaRequest
{
    public string Modulo { get; set; }
    public string Accion { get; set; }
    public int? IdUsuario { get; set; }
    public string Entidad { get; set; }
    public string IdRegistro { get; set; }
    public string Descripcion { get; set; }
    public string ValoresAnterioresJson { get; set; }
    public string ValoresNuevosJson { get; set; }
    public bool EsEventoSeguridad { get; set; }
    public string DireccionIp { get; set; }
}

public static class RepositorioAuditoria
{
    public static void Registrar(RegistrarAuditoriaRequest req)
    {
        if (req == null) return;

        string modulo = Limpiar(req.Modulo, 50, true);
        string accion = Limpiar(req.Accion, 50, true);
        if (string.IsNullOrWhiteSpace(modulo) || string.IsNullOrWhiteSpace(accion))
        {
            return;
        }

        try
        {
            using (SqlConnection conn = DbHelper.GetConnection())
            using (SqlCommand cmd = new SqlCommand("aud.RegistrarBitacora", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                string entidad = Limpiar(req.Entidad, 100, false);
                string idRegistro = Limpiar(req.IdRegistro, 50, false);
                string descripcion = Limpiar(req.Descripcion, 500, false);
                string valoresAnteriores = Limpiar(req.ValoresAnterioresJson, -1, false);
                string valoresNuevos = Limpiar(req.ValoresNuevosJson, -1, false);
                string direccionIp = Limpiar(req.DireccionIp, 45, false);

                if (ContieneInformacionSensible(descripcion)) descripcion = null;
                if (ContieneInformacionSensible(valoresAnteriores)) valoresAnteriores = null;
                if (ContieneInformacionSensible(valoresNuevos)) valoresNuevos = null;

                SqlParameter pModulo = cmd.Parameters.Add("@Modulo", SqlDbType.NVarChar, 50);
                pModulo.Value = modulo;

                SqlParameter pAccion = cmd.Parameters.Add("@Accion", SqlDbType.NVarChar, 50);
                pAccion.Value = accion;

                SqlParameter pIdUsuario = cmd.Parameters.Add("@IdUsuario", SqlDbType.Int);
                pIdUsuario.Value = req.IdUsuario.HasValue && req.IdUsuario.Value > 0 ? (object)req.IdUsuario.Value : DBNull.Value;

                SqlParameter pEntidad = cmd.Parameters.Add("@Entidad", SqlDbType.NVarChar, 100);
                pEntidad.Value = (object)entidad ?? DBNull.Value;

                SqlParameter pIdRegistro = cmd.Parameters.Add("@IdRegistro", SqlDbType.NVarChar, 50);
                pIdRegistro.Value = (object)idRegistro ?? DBNull.Value;

                SqlParameter pDescripcion = cmd.Parameters.Add("@Descripcion", SqlDbType.NVarChar, 500);
                pDescripcion.Value = (object)descripcion ?? DBNull.Value;

                SqlParameter pValoresAnteriores = cmd.Parameters.Add("@ValoresAnteriores", SqlDbType.NVarChar, -1);
                pValoresAnteriores.Value = (object)valoresAnteriores ?? DBNull.Value;

                SqlParameter pValoresNuevos = cmd.Parameters.Add("@ValoresNuevos", SqlDbType.NVarChar, -1);
                pValoresNuevos.Value = (object)valoresNuevos ?? DBNull.Value;

                SqlParameter pEsEventoSeguridad = cmd.Parameters.Add("@EsEventoSeguridad", SqlDbType.Bit);
                pEsEventoSeguridad.Value = req.EsEventoSeguridad;

                SqlParameter pDireccionIp = cmd.Parameters.Add("@DireccionIp", SqlDbType.NVarChar, 45);
                pDireccionIp.Value = (object)direccionIp ?? DBNull.Value;

                conn.Open();
                cmd.ExecuteNonQuery();
            }
        }
        catch (Exception ex)
        {
            try
            {
                System.Diagnostics.Trace.TraceError("AUDIT_REGISTER_ERROR: " + ex.GetType().Name + " - " + ex.Message);
            }
            catch
            {
            }
        }
    }

    public static string ObtenerIpCliente(HttpContext context)
    {
        if (context == null || context.Request == null) return null;

        string ip = context.Request.UserHostAddress;
        if (string.IsNullOrWhiteSpace(ip))
        {
            ip = context.Request.ServerVariables["REMOTE_ADDR"];
        }

        return Limpiar(ip, 45, false);
    }

    private static bool ContieneInformacionSensible(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor)) return false;

        string normalizado = valor.ToLowerInvariant();
        return normalizado.Contains("password")
            || normalizado.Contains("contraseña")
            || normalizado.Contains("contrasena")
            || normalizado.Contains("token")
            || normalizado.Contains("access_token")
            || normalizado.Contains("refresh_token");
    }

    private static string Limpiar(string valor, int maxLength, bool requerido)
    {
        if (string.IsNullOrWhiteSpace(valor))
        {
            return requerido ? string.Empty : null;
        }

        string limpio = valor.Trim();
        if (maxLength > 0 && limpio.Length > maxLength)
        {
            limpio = limpio.Substring(0, maxLength);
        }

        return limpio;
    }
}
