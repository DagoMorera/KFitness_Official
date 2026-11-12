using System;
using System.Data.SqlClient;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Hosting;

public static class MigracionesPerfilProgreso
{
    private static readonly string[] Scripts =
    {
        "014_Progreso_Cliente.sql",
        "028_Perfil_Progreso_DatosPersonales.sql",
        "029_Completar_Clientes_Existentes.sql"
    };

    public static void PrepararLocalDb()
    {
        using (var conn = DbHelper.GetConnection())
        {
            var config = new SqlConnectionStringBuilder(conn.ConnectionString);
            if (!config.DataSource.StartsWith(@"(localdb)\", StringComparison.OrdinalIgnoreCase)) return;

            conn.Open();
            if (EsquemaListo(conn, null)) return;

            using (var tx = conn.BeginTransaction())
            {
                const string bloquear = @"
DECLARE @Resultado int;
EXEC @Resultado = sys.sp_getapplock
    @Resource = N'KFitness.PerfilProgreso', @LockMode = 'Exclusive',
    @LockOwner = 'Transaction', @LockTimeout = 15000;
IF @Resultado < 0
    THROW 51029, N'No se pudo reservar la actualización del esquema de progreso.', 1;";

                using (var cmd = new SqlCommand(bloquear, conn, tx))
                    cmd.ExecuteNonQuery();

                if (!EsquemaListo(conn, tx))
                {
                    var carpeta = HostingEnvironment.MapPath("~/DataBase");
                    if (carpeta == null) throw new DirectoryNotFoundException("DataBase");

                    foreach (var script in Scripts)
                    {
                        var sql = File.ReadAllText(Path.Combine(carpeta, script), Encoding.UTF8);
                        foreach (var lote in Regex.Split(sql, @"^[\t ]*GO[\t ]*\r?$", RegexOptions.IgnoreCase | RegexOptions.Multiline))
                        {
                            if (string.IsNullOrWhiteSpace(lote)) continue;
                            using (var cmd = new SqlCommand(lote, conn, tx))
                            {
                                cmd.CommandTimeout = 60;
                                cmd.ExecuteNonQuery();
                            }
                        }
                    }

                    if (!EsquemaListo(conn, tx))
                        throw new InvalidOperationException("El esquema de progreso sigue incompleto.");
                }

                tx.Commit();
            }
        }
    }

    private static bool EsquemaListo(SqlConnection conn, SqlTransaction tx)
    {
        const string sql = @"
SELECT CASE WHEN OBJECT_ID(N'cli.ProgresoFisico', N'U') IS NOT NULL
    AND COL_LENGTH(N'cli.Clientes', N'Sexo') IS NOT NULL
    AND COL_LENGTH(N'cli.Clientes', N'NivelActividad') IS NOT NULL
    AND EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'029_Completar_Clientes_Existentes.sql')
    THEN 1 ELSE 0 END;";

        using (var cmd = new SqlCommand(sql, conn, tx))
            return (int)cmd.ExecuteScalar() == 1;
    }
}
