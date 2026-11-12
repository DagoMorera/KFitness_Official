using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class PromocionPublicaItem
{
    public int IdPromocion { get; set; }
    public string Nombre { get; set; }
    public string Descripcion { get; set; }
    public string Motivo { get; set; }
    public string TipoPromocion { get; set; }
    public decimal PorcentajeDescuento { get; set; }
    public int? CantidadCompra { get; set; }
    public int? CantidadEntrega { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string Servicio { get; set; }
    public int IdProducto { get; set; }
    public decimal PrecioServicio { get; set; }
    public string ImagenPromocion { get; set; }
    public string ImagenServicio { get; set; }
}

public class PromocionAdminItem : PromocionPublicaItem
{
    public bool Activo { get; set; }
}

public class GuardarPromocionRequest
{
    public int IdPromocion { get; set; }
    public string Nombre { get; set; }
    public string Descripcion { get; set; }
    public int IdProducto { get; set; }
    public string TipoPromocion { get; set; }
    public decimal PorcentajeDescuento { get; set; }
    public int? CantidadCompra { get; set; }
    public int? CantidadEntrega { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public bool Activo { get; set; }
    public int IdActor { get; set; }
    public string ImagenPromocion { get; set; }
}

public class GuardarPromocionResultado
{
    public bool Success { get; set; }
    public string CodigoError { get; set; }
    public string Message { get; set; }
    public int IdPromocion { get; set; }
}

public static class RepositorioPromociones
{
    public static List<PromocionPublicaItem> ObtenerPromocionesVigentes()
    {
        bool tieneTipoPromocion = ExisteColumnaPromocion("TipoPromocion");
        bool tieneCantidadCompra = ExisteColumnaPromocion("CantidadCompra");
        bool tieneCantidadEntrega = ExisteColumnaPromocion("CantidadEntrega");
        bool tieneImagenPromocion = ExisteColumnaPromocion("ImagenPromocion");

        string sql = string.Format(@"
SELECT
    pr.IdPromocion,
    pr.Nombre,
    pr.Descripcion,
    pr.Motivo,
    {0},
    pr.PorcentajeDescuento,
    {1},
    {2},
    pr.FechaInicio,
    pr.FechaFin,
    p.IdProducto,
    p.Nombre AS Servicio,
    p.Precio AS PrecioServicio,
    {3},
    img.Ruta AS ImagenServicio
FROM prm.Promociones pr
INNER JOIN prm.PromocionProductos pp ON pp.IdPromocion = pr.IdPromocion
INNER JOIN cat.Productos p ON p.IdProducto = pp.IdProducto
OUTER APPLY (
    SELECT TOP 1 i.Ruta
    FROM cat.ImagenesProducto i
    WHERE i.IdProducto = p.IdProducto
      AND i.Activo = 1
      AND i.EsPrincipal = 1
    ORDER BY i.Orden, i.IdImagen
) img
WHERE pr.Activo = 1
  AND p.Activo = 1
  AND p.EsCombo = 0
  AND CAST(SYSDATETIME() AS DATE) BETWEEN pr.FechaInicio AND pr.FechaFin
ORDER BY pr.FechaInicio DESC, pr.IdPromocion DESC;",
            ObtenerSelectTipoPromocion(tieneTipoPromocion),
            ObtenerSelectCantidadCompra(tieneCantidadCompra),
            ObtenerSelectCantidadEntrega(tieneCantidadEntrega),
            ObtenerSelectImagenPromocion(tieneImagenPromocion));

        return EjecutarListadoPublico(sql, null);
    }

    public static PromocionPublicaItem ObtenerPromocionVigentePorId(int idPromocion)
    {
        if (idPromocion <= 0) return null;

        bool tieneTipoPromocion = ExisteColumnaPromocion("TipoPromocion");
        bool tieneCantidadCompra = ExisteColumnaPromocion("CantidadCompra");
        bool tieneCantidadEntrega = ExisteColumnaPromocion("CantidadEntrega");
        bool tieneImagenPromocion = ExisteColumnaPromocion("ImagenPromocion");

        string sql = string.Format(@"
SELECT
    pr.IdPromocion,
    pr.Nombre,
    pr.Descripcion,
    pr.Motivo,
    {0},
    pr.PorcentajeDescuento,
    {1},
    {2},
    pr.FechaInicio,
    pr.FechaFin,
    p.IdProducto,
    p.Nombre AS Servicio,
    p.Precio AS PrecioServicio,
    {3},
    img.Ruta AS ImagenServicio
FROM prm.Promociones pr
INNER JOIN prm.PromocionProductos pp ON pp.IdPromocion = pr.IdPromocion
INNER JOIN cat.Productos p ON p.IdProducto = pp.IdProducto
OUTER APPLY (
    SELECT TOP 1 i.Ruta
    FROM cat.ImagenesProducto i
    WHERE i.IdProducto = p.IdProducto
      AND i.Activo = 1
      AND i.EsPrincipal = 1
    ORDER BY i.Orden, i.IdImagen
) img
WHERE pr.IdPromocion = @idPromocion
  AND pr.Activo = 1
  AND p.Activo = 1
  AND p.EsCombo = 0
  AND CAST(SYSDATETIME() AS DATE) BETWEEN pr.FechaInicio AND pr.FechaFin;",
            ObtenerSelectTipoPromocion(tieneTipoPromocion),
            ObtenerSelectCantidadCompra(tieneCantidadCompra),
            ObtenerSelectCantidadEntrega(tieneCantidadEntrega),
            ObtenerSelectImagenPromocion(tieneImagenPromocion));

        SqlParameter[] parametros = new SqlParameter[]
        {
            new SqlParameter("@idPromocion", SqlDbType.Int) { Value = idPromocion }
        };

        List<PromocionPublicaItem> items = EjecutarListadoPublico(sql, parametros);
        return items.Count > 0 ? items[0] : null;
    }

    public static List<PromocionAdminItem> ObtenerPromocionesAdmin()
    {
        return ObtenerPromocionesAdminFiltradas(null, null, null, null);
    }

    public static List<PromocionAdminItem> ObtenerPromocionesAdminFiltradas(
        string nombre,
        string tipoPromocion,
        bool? activo,
        string vigencia)
    {
        string vigenciaNormalizada = string.IsNullOrWhiteSpace(vigencia)
            ? null
            : vigencia.Trim().ToUpperInvariant();

        bool tieneTipoPromocion = ExisteColumnaPromocion("TipoPromocion");
        bool tieneCantidadCompra = ExisteColumnaPromocion("CantidadCompra");
        bool tieneCantidadEntrega = ExisteColumnaPromocion("CantidadEntrega");
        bool tieneImagenPromocion = ExisteColumnaPromocion("ImagenPromocion");

        string sql = string.Format(@"
SELECT
    pr.IdPromocion,
    pr.Nombre,
    pr.Descripcion,
    pr.Motivo,
    {0},
    pr.PorcentajeDescuento,
    {1},
    {2},
    pr.FechaInicio,
    pr.FechaFin,
    pr.Activo,
    p.IdProducto,
    p.Nombre AS Servicio,
    p.Precio AS PrecioServicio,
    {3},
    img.Ruta AS ImagenServicio
FROM prm.Promociones pr
INNER JOIN prm.PromocionProductos pp ON pp.IdPromocion = pr.IdPromocion
INNER JOIN cat.Productos p ON p.IdProducto = pp.IdProducto
OUTER APPLY (
    SELECT TOP 1 i.Ruta
    FROM cat.ImagenesProducto i
    WHERE i.IdProducto = p.IdProducto
      AND i.Activo = 1
      AND i.EsPrincipal = 1
    ORDER BY i.Orden, i.IdImagen
) img
WHERE (@nombre IS NULL OR pr.Nombre LIKE @nombre)
  AND {4}
  AND (@activo IS NULL OR pr.Activo = @activo)
  AND (
        @vigencia IS NULL
        OR (
            @vigencia = N'VIGENTE'
            AND CAST(SYSDATETIME() AS DATE) BETWEEN pr.FechaInicio AND pr.FechaFin
        )
        OR (
            @vigencia = N'PROXIMA'
            AND CAST(SYSDATETIME() AS DATE) < pr.FechaInicio
        )
        OR (
            @vigencia = N'VENCIDA'
            AND CAST(SYSDATETIME() AS DATE) > pr.FechaFin
        )
      )
ORDER BY pr.FechaInicio DESC, pr.IdPromocion DESC;",
            ObtenerSelectTipoPromocion(tieneTipoPromocion),
            ObtenerSelectCantidadCompra(tieneCantidadCompra),
            ObtenerSelectCantidadEntrega(tieneCantidadEntrega),
            ObtenerSelectImagenPromocion(tieneImagenPromocion),
            ObtenerFiltroTipoPromocion(tieneTipoPromocion));

        List<PromocionAdminItem> items = new List<PromocionAdminItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@nombre", string.IsNullOrWhiteSpace(nombre) ? (object)DBNull.Value : ("%" + nombre.Trim() + "%"));
            cmd.Parameters.AddWithValue("@tipoPromocion", string.IsNullOrWhiteSpace(tipoPromocion) ? (object)DBNull.Value : tipoPromocion.Trim().ToUpperInvariant());
            cmd.Parameters.AddWithValue("@activo", activo.HasValue ? (object)activo.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@vigencia", string.IsNullOrWhiteSpace(vigenciaNormalizada) ? (object)DBNull.Value : vigenciaNormalizada);

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    PromocionAdminItem item = new PromocionAdminItem();
                    MapearPromocion(reader, item);
                    item.Activo = !reader.IsDBNull(reader.GetOrdinal("Activo")) && reader.GetBoolean(reader.GetOrdinal("Activo"));
                    items.Add(item);
                }
            }
        }

        return items;
    }

    public static GuardarPromocionResultado GuardarPromocion(GuardarPromocionRequest req)
    {
        GuardarPromocionResultado validacion = ValidarPromocion(req);
        if (!validacion.Success) return validacion;

        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            {
                try
                {
                    if (!EsProductoPromocionable(conn, tx, req.IdProducto, !req.Activo && req.TipoPromocion == "CONSULTA"))
                    {
                        tx.Rollback();
                        return new GuardarPromocionResultado
                        {
                            Success = false,
                            CodigoError = "SERVICIO_INVALIDO",
                            Message = "El servicio asociado no está disponible para promociones."
                        };
                    }

                    int idPromocion = req.IdPromocion;

                    if (ExistePromocionDuplicada(conn, tx, req))
                    {
                        tx.Rollback();
                        return new GuardarPromocionResultado
                        {
                            Success = false,
                            CodigoError = "PROMOCION_DUPLICADA",
                            Message = "Ya existe una promoción con los mismos datos para el servicio seleccionado."
                        };
                    }

                    if (idPromocion > 0)
                    {
                        bool tieneImagenPromocion = ExisteColumnaPromocion(conn, tx, "ImagenPromocion");

                        const string sqlExiste = @"SELECT TOP 1 ISNULL(Motivo,N'') FROM prm.Promociones WHERE IdPromocion = @idPromocion;";
                        using (SqlCommand cmdExiste = new SqlCommand(sqlExiste, conn, tx))
                        {
                            cmdExiste.Parameters.AddWithValue("@idPromocion", idPromocion);
                            object existe = cmdExiste.ExecuteScalar();
                            if (existe == null || existe == DBNull.Value)
                            {
                                tx.Rollback();
                                return new GuardarPromocionResultado
                                {
                                    Success = false,
                                    CodigoError = "PROMOCION_NO_EXISTE",
                                    Message = "La promoción indicada no existe."
                                };
                            }
                            if ((string)existe == "KFIT_PRIMERA_VALORACION"
                                && (req.TipoPromocion != "PORCENTAJE" || req.PorcentajeDescuento != 100m))
                            {
                                tx.Rollback();
                                return new GuardarPromocionResultado
                                {
                                    Success = false,
                                    CodigoError = "VALORACION_DEBE_SER_GRATUITA",
                                    Message = "La primera valoración gratuita debe conservar el 100% de descuento."
                                };
                            }
                        }

                        string sqlUpdate = tieneImagenPromocion
                            ? @"
UPDATE prm.Promociones
SET Nombre = @nombre,
    Descripcion = @descripcion,
    TipoPromocion = @tipo,
    ImagenPromocion = @imagenPromocion,
    PorcentajeDescuento = @porcentaje,
    CantidadCompra = @cantidadCompra,
    CantidadEntrega = @cantidadEntrega,
    FechaInicio = @fechaInicio,
    FechaFin = @fechaFin,
    Activo = @activo,
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @idActor
WHERE IdPromocion = @idPromocion;"
                            : @"
UPDATE prm.Promociones
SET Nombre = @nombre,
    Descripcion = @descripcion,
    TipoPromocion = @tipo,
    PorcentajeDescuento = @porcentaje,
    CantidadCompra = @cantidadCompra,
    CantidadEntrega = @cantidadEntrega,
    FechaInicio = @fechaInicio,
    FechaFin = @fechaFin,
    Activo = @activo,
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @idActor
WHERE IdPromocion = @idPromocion;";

                        using (SqlCommand cmdUpdate = new SqlCommand(sqlUpdate, conn, tx))
                        {
                            cmdUpdate.Parameters.AddWithValue("@idPromocion", idPromocion);
                            AgregarParametrosPromocion(cmdUpdate, req, tieneImagenPromocion);
                            int afectadas = cmdUpdate.ExecuteNonQuery();
                            if (afectadas <= 0)
                            {
                                tx.Rollback();
                                return new GuardarPromocionResultado
                                {
                                    Success = false,
                                    CodigoError = "PROMOCION_NO_EXISTE",
                                    Message = "La promoción indicada no existe."
                                };
                            }
                        }

                        const string sqlUpdateProducto = @"
UPDATE prm.PromocionProductos
SET IdProducto = @idProducto
WHERE IdPromocion = @idPromocion;";

                        int afectadasProducto = 0;
                        using (SqlCommand cmdP = new SqlCommand(sqlUpdateProducto, conn, tx))
                        {
                            cmdP.Parameters.AddWithValue("@idPromocion", idPromocion);
                            cmdP.Parameters.AddWithValue("@idProducto", req.IdProducto);
                            afectadasProducto = cmdP.ExecuteNonQuery();
                        }

                        if (afectadasProducto <= 0)
                        {
                            const string sqlInsertProductoFaltante = @"
INSERT INTO prm.PromocionProductos (IdPromocion, IdProducto)
VALUES (@idPromocion, @idProducto);";

                            using (SqlCommand cmdPFaltante = new SqlCommand(sqlInsertProductoFaltante, conn, tx))
                            {
                                cmdPFaltante.Parameters.AddWithValue("@idPromocion", idPromocion);
                                cmdPFaltante.Parameters.AddWithValue("@idProducto", req.IdProducto);
                                cmdPFaltante.ExecuteNonQuery();
                            }
                        }
                    }
                    else
                    {
                        bool tieneImagenPromocion = ExisteColumnaPromocion(conn, tx, "ImagenPromocion");
                        string sqlInsert = tieneImagenPromocion
                            ? @"
INSERT INTO prm.Promociones
(
    Nombre,
    Descripcion,
    TipoPromocion,
    ImagenPromocion,
    PorcentajeDescuento,
    CantidadCompra,
    CantidadEntrega,
    FechaInicio,
    FechaFin,
    Activo,
    CreadoPor
)
VALUES
(
    @nombre,
    @descripcion,
    @tipo,
    @imagenPromocion,
    @porcentaje,
    @cantidadCompra,
    @cantidadEntrega,
    @fechaInicio,
    @fechaFin,
    @activo,
    @idActor
);
SELECT CAST(SCOPE_IDENTITY() AS INT);"
                            : @"
INSERT INTO prm.Promociones
(
    Nombre,
    Descripcion,
    TipoPromocion,
    PorcentajeDescuento,
    CantidadCompra,
    CantidadEntrega,
    FechaInicio,
    FechaFin,
    Activo,
    CreadoPor
)
VALUES
(
    @nombre,
    @descripcion,
    @tipo,
    @porcentaje,
    @cantidadCompra,
    @cantidadEntrega,
    @fechaInicio,
    @fechaFin,
    @activo,
    @idActor
);
SELECT CAST(SCOPE_IDENTITY() AS INT);";

                        using (SqlCommand cmdInsert = new SqlCommand(sqlInsert, conn, tx))
                        {
                            AgregarParametrosPromocion(cmdInsert, req, tieneImagenPromocion);
                            object nuevo = cmdInsert.ExecuteScalar();
                            idPromocion = nuevo == null || nuevo == DBNull.Value ? 0 : Convert.ToInt32(nuevo);
                        }

                        const string sqlInsertProducto = @"
INSERT INTO prm.PromocionProductos (IdPromocion, IdProducto)
VALUES (@idPromocion, @idProducto);";

                        using (SqlCommand cmdP = new SqlCommand(sqlInsertProducto, conn, tx))
                        {
                            cmdP.Parameters.AddWithValue("@idPromocion", idPromocion);
                            cmdP.Parameters.AddWithValue("@idProducto", req.IdProducto);
                            cmdP.ExecuteNonQuery();
                        }
                    }

                    tx.Commit();
                    return new GuardarPromocionResultado
                    {
                        Success = true,
                        IdPromocion = idPromocion,
                        Message = req.IdPromocion > 0 ? "Promoción actualizada correctamente." : "Promoción registrada correctamente."
                    };
                }
                catch (SqlException)
                {
                    try { tx.Rollback(); } catch { }
                    return new GuardarPromocionResultado
                    {
                        Success = false,
                        CodigoError = "PROMOCION_DB_ERROR",
                        Message = "No fue posible guardar la promoción."
                    };
                }
                catch
                {
                    try { tx.Rollback(); } catch { }
                    throw;
                }
            }
        }
    }

    public static List<ServicioCatalogoItem> ObtenerServiciosPromocionables()
    {
        return RepositorioServicios.ObtenerServiciosActivos(incluirBorradoresPromocion: true);
    }

    private static void AgregarParametrosPromocion(SqlCommand cmd, GuardarPromocionRequest req, bool incluirImagenPromocion)
    {
        cmd.Parameters.AddWithValue("@nombre", req.Nombre.Trim());
        cmd.Parameters.AddWithValue("@descripcion", string.IsNullOrWhiteSpace(req.Descripcion) ? (object)DBNull.Value : req.Descripcion.Trim());
        cmd.Parameters.AddWithValue("@tipo", req.TipoPromocion);
        if (incluirImagenPromocion)
        {
            cmd.Parameters.AddWithValue("@imagenPromocion", string.IsNullOrWhiteSpace(req.ImagenPromocion) ? (object)DBNull.Value : req.ImagenPromocion.Trim());
        }
        cmd.Parameters.AddWithValue("@porcentaje", req.PorcentajeDescuento);
        cmd.Parameters.AddWithValue("@cantidadCompra", req.CantidadCompra.HasValue ? (object)req.CantidadCompra.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("@cantidadEntrega", req.CantidadEntrega.HasValue ? (object)req.CantidadEntrega.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("@fechaInicio", req.FechaInicio.Date);
        cmd.Parameters.AddWithValue("@fechaFin", req.FechaFin.Date);
        cmd.Parameters.AddWithValue("@activo", req.Activo);
        cmd.Parameters.AddWithValue("@idActor", req.IdActor > 0 ? (object)req.IdActor : DBNull.Value);
    }

    private static bool EsProductoPromocionable(SqlConnection conn, SqlTransaction tx, int idProducto, bool permitirInactivo)
    {
        const string sql = @"
SELECT TOP 1 1
FROM cat.Productos
WHERE IdProducto = @idProducto
  AND (Activo = 1 OR @permitirInactivo = 1)
  AND EsCombo = 0;";

        using (SqlCommand cmd = new SqlCommand(sql, conn, tx))
        {
            cmd.Parameters.AddWithValue("@idProducto", idProducto);
            cmd.Parameters.Add("@permitirInactivo", SqlDbType.Bit).Value = permitirInactivo;
            object existe = cmd.ExecuteScalar();
            return existe != null && existe != DBNull.Value;
        }
    }

    private static bool ExistePromocionDuplicada(SqlConnection conn, SqlTransaction tx, GuardarPromocionRequest req)
    {
        const string sql = @"
SELECT TOP 1 1
FROM prm.Promociones pr
INNER JOIN prm.PromocionProductos pp ON pp.IdPromocion = pr.IdPromocion
WHERE pr.Nombre = @nombre
  AND pr.TipoPromocion = @tipo
  AND pr.FechaInicio = @fechaInicio
  AND pr.FechaFin = @fechaFin
  AND pp.IdProducto = @idProducto
  AND (@idPromocion <= 0 OR pr.IdPromocion <> @idPromocion);";

        using (SqlCommand cmd = new SqlCommand(sql, conn, tx))
        {
            cmd.Parameters.AddWithValue("@nombre", req.Nombre.Trim());
            cmd.Parameters.AddWithValue("@tipo", req.TipoPromocion);
            cmd.Parameters.AddWithValue("@fechaInicio", req.FechaInicio.Date);
            cmd.Parameters.AddWithValue("@fechaFin", req.FechaFin.Date);
            cmd.Parameters.AddWithValue("@idProducto", req.IdProducto);
            cmd.Parameters.AddWithValue("@idPromocion", req.IdPromocion);
            object existe = cmd.ExecuteScalar();
            return existe != null && existe != DBNull.Value;
        }
    }

    public static bool ExisteColumnaImagenPromocion()
    {
        return ExisteColumnaPromocion("ImagenPromocion");
    }

    private static bool ExisteColumnaPromocion(string nombreColumna)
    {
        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            return ExisteColumnaPromocion(conn, null, nombreColumna);
        }
    }

    private static bool ExisteColumnaPromocion(SqlConnection conn, SqlTransaction tx, string nombreColumna)
    {
        const string sql = @"
SELECT 1
FROM sys.columns c
INNER JOIN sys.tables t ON t.object_id = c.object_id
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = N'prm'
  AND t.name = N'Promociones'
  AND c.name = @nombreColumna;";

        using (SqlCommand cmd = tx == null ? new SqlCommand(sql, conn) : new SqlCommand(sql, conn, tx))
        {
            cmd.Parameters.AddWithValue("@nombreColumna", nombreColumna ?? string.Empty);
            object existe = cmd.ExecuteScalar();
            return existe != null && existe != DBNull.Value;
        }
    }

    private static string ObtenerSelectTipoPromocion(bool existeColumna)
    {
        return existeColumna
            ? "pr.TipoPromocion AS TipoPromocion"
            : "N'PORCENTAJE' AS TipoPromocion";
    }

    private static string ObtenerSelectCantidadCompra(bool existeColumna)
    {
        return existeColumna
            ? "pr.CantidadCompra AS CantidadCompra"
            : "CAST(NULL AS INT) AS CantidadCompra";
    }

    private static string ObtenerSelectCantidadEntrega(bool existeColumna)
    {
        return existeColumna
            ? "pr.CantidadEntrega AS CantidadEntrega"
            : "CAST(NULL AS INT) AS CantidadEntrega";
    }

    private static string ObtenerSelectImagenPromocion(bool existeColumna)
    {
        return existeColumna
            ? "pr.ImagenPromocion AS ImagenPromocion"
            : "CAST(NULL AS NVARCHAR(260)) AS ImagenPromocion";
    }

    private static string ObtenerFiltroTipoPromocion(bool existeColumna)
    {
        return existeColumna
            ? "(@tipoPromocion IS NULL OR pr.TipoPromocion = @tipoPromocion)"
            : "(@tipoPromocion IS NULL OR @tipoPromocion = N'PORCENTAJE')";
    }

    private static string ObtenerSelectImagenPromocion()
    {
        return @"CASE
    WHEN COL_LENGTH('prm.Promociones', 'ImagenPromocion') IS NOT NULL THEN CONVERT(NVARCHAR(260), pr.ImagenPromocion)
    ELSE NULL
END AS ImagenPromocion";
    }

    private static GuardarPromocionResultado ValidarPromocion(GuardarPromocionRequest req)
    {
        if (req == null)
        {
            return new GuardarPromocionResultado { Success = false, CodigoError = "SOLICITUD_INVALIDA", Message = "Solicitud inválida." };
        }

        if (string.IsNullOrWhiteSpace(req.Nombre) || req.Nombre.Trim().Length > 150)
        {
            return new GuardarPromocionResultado { Success = false, CodigoError = "NOMBRE_INVALIDO", Message = "El nombre de la promoción es inválido." };
        }

        if (!string.IsNullOrWhiteSpace(req.Descripcion) && req.Descripcion.Trim().Length > 500)
        {
            return new GuardarPromocionResultado { Success = false, CodigoError = "DESCRIPCION_INVALIDA", Message = "La descripción supera el máximo permitido." };
        }

        if (!string.IsNullOrWhiteSpace(req.ImagenPromocion) && req.ImagenPromocion.Trim().Length > 260)
        {
            return new GuardarPromocionResultado { Success = false, CodigoError = "IMAGEN_INVALIDA", Message = "La referencia de imagen de la promoción es inválida." };
        }

        if (req.IdProducto <= 0)
        {
            return new GuardarPromocionResultado { Success = false, CodigoError = "SERVICIO_INVALIDO", Message = "Debe seleccionar un servicio válido." };
        }

        if (req.FechaInicio == DateTime.MinValue || req.FechaFin == DateTime.MinValue || req.FechaFin.Date < req.FechaInicio.Date)
        {
            return new GuardarPromocionResultado { Success = false, CodigoError = "FECHAS_INVALIDAS", Message = "La vigencia de la promoción es inválida." };
        }

        string tipo = (req.TipoPromocion ?? string.Empty).Trim().ToUpperInvariant();
        if (tipo != "PORCENTAJE" && tipo != "DOS_POR_UNO" && tipo != "CONSULTA")
        {
            return new GuardarPromocionResultado { Success = false, CodigoError = "TIPO_INVALIDO", Message = "El tipo de promoción es inválido." };
        }

        if (tipo == "PORCENTAJE")
        {
            if (req.PorcentajeDescuento <= 0m || req.PorcentajeDescuento > 100m)
            {
                return new GuardarPromocionResultado { Success = false, CodigoError = "DESCUENTO_INVALIDO", Message = "El porcentaje de descuento es inválido." };
            }

            req.CantidadCompra = null;
            req.CantidadEntrega = null;
        }
        else if (tipo == "DOS_POR_UNO")
        {
            req.PorcentajeDescuento = 0m;
            if (!req.CantidadCompra.HasValue || !req.CantidadEntrega.HasValue || req.CantidadCompra.Value <= 0 || req.CantidadEntrega.Value <= req.CantidadCompra.Value)
            {
                return new GuardarPromocionResultado { Success = false, CodigoError = "REGLA_2X1_INVALIDA", Message = "La configuración de 2x1 es inválida." };
            }
        }

        else
        {
            req.PorcentajeDescuento = 0m;
            req.CantidadCompra = null;
            req.CantidadEntrega = null;
        }

        req.TipoPromocion = tipo;
        req.PorcentajeDescuento = decimal.Round(req.PorcentajeDescuento, 2, MidpointRounding.AwayFromZero);

        return new GuardarPromocionResultado { Success = true };
    }

    private static List<PromocionPublicaItem> EjecutarListadoPublico(string sql, SqlParameter[] parametros)
    {
        List<PromocionPublicaItem> items = new List<PromocionPublicaItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            if (parametros != null)
            {
                foreach (SqlParameter p in parametros)
                {
                    cmd.Parameters.Add(p);
                }
            }

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    PromocionPublicaItem item = new PromocionPublicaItem();
                    MapearPromocion(reader, item);
                    items.Add(item);
                }
            }
        }

        return items;
    }

    private static void MapearPromocion(SqlDataReader reader, PromocionPublicaItem item)
    {
        item.IdPromocion = reader.GetInt32(reader.GetOrdinal("IdPromocion"));
        item.Nombre = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre"));
        item.Descripcion = reader.IsDBNull(reader.GetOrdinal("Descripcion")) ? string.Empty : reader.GetString(reader.GetOrdinal("Descripcion"));
        item.Motivo = reader.IsDBNull(reader.GetOrdinal("Motivo")) ? null : reader.GetString(reader.GetOrdinal("Motivo"));
        item.TipoPromocion = reader.IsDBNull(reader.GetOrdinal("TipoPromocion")) ? "PORCENTAJE" : reader.GetString(reader.GetOrdinal("TipoPromocion"));
        item.PorcentajeDescuento = reader.IsDBNull(reader.GetOrdinal("PorcentajeDescuento")) ? 0m : reader.GetDecimal(reader.GetOrdinal("PorcentajeDescuento"));
        item.CantidadCompra = reader.IsDBNull(reader.GetOrdinal("CantidadCompra")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("CantidadCompra"));
        item.CantidadEntrega = reader.IsDBNull(reader.GetOrdinal("CantidadEntrega")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("CantidadEntrega"));
        item.FechaInicio = reader.GetDateTime(reader.GetOrdinal("FechaInicio"));
        item.FechaFin = reader.GetDateTime(reader.GetOrdinal("FechaFin"));
        item.IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto"));
        item.Servicio = reader.IsDBNull(reader.GetOrdinal("Servicio")) ? string.Empty : reader.GetString(reader.GetOrdinal("Servicio"));
        item.PrecioServicio = reader.IsDBNull(reader.GetOrdinal("PrecioServicio")) ? 0m : reader.GetDecimal(reader.GetOrdinal("PrecioServicio"));
        item.ImagenPromocion = reader.IsDBNull(reader.GetOrdinal("ImagenPromocion")) ? null : reader.GetString(reader.GetOrdinal("ImagenPromocion"));
        item.ImagenServicio = reader.IsDBNull(reader.GetOrdinal("ImagenServicio")) ? null : reader.GetString(reader.GetOrdinal("ImagenServicio"));
    }
}
