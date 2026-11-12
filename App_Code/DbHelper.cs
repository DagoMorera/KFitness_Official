using System;
using System.Configuration;
using System.Data.SqlClient;

public static class DbHelper
{
    public static string ConnectionString
    {
        get
        {
            var cs = ConfigurationManager.ConnectionStrings["KFitnessConnection"];
            if (cs == null)
                return null;
            return cs.ConnectionString;
        }
    }

    public static SqlConnection GetConnection()
    {
        var connStr = ConnectionString;
        if (string.IsNullOrEmpty(connStr))
            throw new InvalidOperationException("Connection string 'KFitnessConnection' no está configurada.");

        return new SqlConnection(connStr);
    }
}
