using System;
using System.Data.SqlClient;

public static class RepositorioHorariosSchema
{
    public static bool ExisteTablaReservas()
    {
        const string sql = @"
SELECT 1
FROM sys.tables t
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'res' AND t.name = N'Reservas';";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            conn.Open();
            object result = cmd.ExecuteScalar();
            return result != null && result != DBNull.Value;
        }
    }
}
