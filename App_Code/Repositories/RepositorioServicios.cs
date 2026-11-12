using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class ServicioCatalogoItem
{
    public int IdProducto { get; set; }
    public string Nombre { get; set; }
    public string Descripcion { get; set; }
    public decimal Precio { get; set; }
    public string Categoria { get; set; }
    public int OrdenCatalogo { get; set; }
    public string ImagenPrincipal { get; set; }
}

public class ServicioCategoriaItem
{
    public int IdCategoria { get; set; }
    public string Nombre { get; set; }
}

public class CrearServicioResultado
{
    public bool Success { get; set; }
    public int IdProducto { get; set; }
    public string CodigoError { get; set; }
    public string Message { get; set; }
}

public class RegistrarImagenServicioResultado
{
    public bool Success { get; set; }
    public string CodigoError { get; set; }
    public string Message { get; set; }
}

public class ServicioAdminListadoItem
{
    public int IdProducto { get; set; }
    public string Nombre { get; set; }
    public string Categoria { get; set; }
    public decimal Precio { get; set; }
    public bool Activo { get; set; }
    public string ImagenPrincipal { get; set; }
}

public class ServicioAdminDetalleItem
{
    public int IdProducto { get; set; }
    public int IdCategoria { get; set; }
    public string Nombre { get; set; }
    public string Descripcion { get; set; }
    public decimal Precio { get; set; }
    public bool Activo { get; set; }
    public int OrdenCatalogo { get; set; }
    public string Categoria { get; set; }
    public string ImagenPrincipal { get; set; }
}

public class ActualizarServicioResultado
{
    public bool Success { get; set; }
    public string CodigoError { get; set; }
    public string Message { get; set; }
}

public static class RepositorioServicios
{
    private const string CategoriaEntrenamiento = "Entrenamiento";
    private const string CategoriaAsesoria = "Asesor\u00EDa";
    private const string CategoriaClases = "Clases";

    public static List<ServicioCatalogoItem> ObtenerServiciosActivos(bool incluirBorradoresPromocion = false)
    {
        const string sql = @"
SELECT
    p.IdProducto,
    p.Nombre,
    p.Descripcion,
    p.Precio,
    c.Nombre AS Categoria,
    p.OrdenCatalogo,
    img.Ruta AS ImagenPrincipal
FROM cat.Productos p
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
OUTER APPLY (
    SELECT TOP 1 i.Ruta
    FROM cat.ImagenesProducto i
    WHERE i.IdProducto = p.IdProducto
      AND i.Activo = 1
      AND i.EsPrincipal = 1
    ORDER BY i.Orden, i.IdImagen
) img
WHERE (p.Activo = 1 OR (@incluirBorradores = 1 AND EXISTS (
    SELECT 1 FROM prm.PromocionProductos pp
    JOIN prm.Promociones pr ON pr.IdPromocion = pp.IdPromocion
    WHERE pp.IdProducto = p.IdProducto AND pr.Motivo = N'KFIT_PLAN_MENSUAL'
)))
  AND c.Activo = 1
  AND p.EsCombo = 0
  AND c.Nombre IN (@catEntrenamiento, @catAsesoria, @catClases)
ORDER BY p.OrdenCatalogo, p.Nombre, p.IdProducto;";

        List<ServicioCatalogoItem> servicios = new List<ServicioCatalogoItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.Add("@incluirBorradores", SqlDbType.Bit).Value = incluirBorradoresPromocion;
            cmd.Parameters.AddWithValue("@catEntrenamiento", CategoriaEntrenamiento);
            cmd.Parameters.AddWithValue("@catAsesoria", CategoriaAsesoria);
            cmd.Parameters.AddWithValue("@catClases", CategoriaClases);

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    servicios.Add(MapearServicio(reader));
                }
            }
        }

        return servicios;
    }

    public static List<ServicioAdminListadoItem> ObtenerServiciosAdmin()
    {
        return ObtenerServiciosAdminFiltrados(null, null, null, null, null);
    }

    public static List<ServicioAdminListadoItem> ObtenerServiciosAdminFiltrados(
        string nombre,
        string categoria,
        bool? activo,
        decimal? precioMinimo,
        decimal? precioMaximo)
    {
        const string sql = @"
SELECT
    p.IdProducto,
    p.Nombre,
    c.Nombre AS Categoria,
    p.Precio,
    p.Activo,
    img.Ruta AS ImagenPrincipal
FROM cat.Productos p
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
OUTER APPLY (
    SELECT TOP 1 i.Ruta
    FROM cat.ImagenesProducto i
    WHERE i.IdProducto = p.IdProducto
      AND i.Activo = 1
      AND i.EsPrincipal = 1
    ORDER BY i.Orden, i.IdImagen
) img
WHERE p.EsCombo = 0
  AND c.Nombre IN (@catEntrenamiento, @catAsesoria, @catClases)
  AND (@nombre IS NULL OR p.Nombre LIKE @nombre)
  AND (@categoria IS NULL OR c.Nombre = @categoria)
  AND (@activo IS NULL OR p.Activo = @activo)
  AND (@precioMinimo IS NULL OR p.Precio >= @precioMinimo)
  AND (@precioMaximo IS NULL OR p.Precio <= @precioMaximo)
ORDER BY p.OrdenCatalogo, p.Nombre, p.IdProducto;";

        List<ServicioAdminListadoItem> servicios = new List<ServicioAdminListadoItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@catEntrenamiento", CategoriaEntrenamiento);
            cmd.Parameters.AddWithValue("@catAsesoria", CategoriaAsesoria);
            cmd.Parameters.AddWithValue("@catClases", CategoriaClases);
            cmd.Parameters.AddWithValue("@nombre", string.IsNullOrWhiteSpace(nombre) ? (object)DBNull.Value : ("%" + nombre.Trim() + "%"));
            cmd.Parameters.AddWithValue("@categoria", string.IsNullOrWhiteSpace(categoria) ? (object)DBNull.Value : categoria.Trim());
            cmd.Parameters.AddWithValue("@activo", activo.HasValue ? (object)activo.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@precioMinimo", precioMinimo.HasValue ? (object)precioMinimo.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@precioMaximo", precioMaximo.HasValue ? (object)precioMaximo.Value : DBNull.Value);

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    ServicioAdminListadoItem item = new ServicioAdminListadoItem();
                    item.IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto"));
                    item.Nombre = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre"));
                    item.Categoria = reader.IsDBNull(reader.GetOrdinal("Categoria")) ? string.Empty : reader.GetString(reader.GetOrdinal("Categoria"));
                    item.Precio = reader.IsDBNull(reader.GetOrdinal("Precio")) ? 0m : reader.GetDecimal(reader.GetOrdinal("Precio"));
                    item.Activo = !reader.IsDBNull(reader.GetOrdinal("Activo")) && reader.GetBoolean(reader.GetOrdinal("Activo"));
                    item.ImagenPrincipal = reader.IsDBNull(reader.GetOrdinal("ImagenPrincipal")) ? null : reader.GetString(reader.GetOrdinal("ImagenPrincipal"));
                    servicios.Add(item);
                }
            }
        }

        return servicios;
    }

    public static ServicioAdminDetalleItem ObtenerServicioAdminPorId(int idProducto)
    {
        if (idProducto <= 0) return null;

        const string sql = @"
SELECT
    p.IdProducto,
    p.IdCategoria,
    p.Nombre,
    p.Descripcion,
    p.Precio,
    p.Activo,
    p.OrdenCatalogo,
    c.Nombre AS Categoria,
    img.Ruta AS ImagenPrincipal
FROM cat.Productos p
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
OUTER APPLY (
    SELECT TOP 1 i.Ruta
    FROM cat.ImagenesProducto i
    WHERE i.IdProducto = p.IdProducto
      AND i.Activo = 1
      AND i.EsPrincipal = 1
    ORDER BY i.Orden, i.IdImagen
) img
WHERE p.IdProducto = @idProducto
  AND p.EsCombo = 0
  AND c.Nombre IN (@catEntrenamiento, @catAsesoria, @catClases);";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idProducto", idProducto);
            cmd.Parameters.AddWithValue("@catEntrenamiento", CategoriaEntrenamiento);
            cmd.Parameters.AddWithValue("@catAsesoria", CategoriaAsesoria);
            cmd.Parameters.AddWithValue("@catClases", CategoriaClases);

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                if (!reader.Read()) return null;

                ServicioAdminDetalleItem item = new ServicioAdminDetalleItem();
                item.IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto"));
                item.IdCategoria = reader.GetInt32(reader.GetOrdinal("IdCategoria"));
                item.Nombre = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre"));
                item.Descripcion = reader.IsDBNull(reader.GetOrdinal("Descripcion")) ? null : reader.GetString(reader.GetOrdinal("Descripcion"));
                item.Precio = reader.IsDBNull(reader.GetOrdinal("Precio")) ? 0m : reader.GetDecimal(reader.GetOrdinal("Precio"));
                item.Activo = !reader.IsDBNull(reader.GetOrdinal("Activo")) && reader.GetBoolean(reader.GetOrdinal("Activo"));
                item.OrdenCatalogo = reader.IsDBNull(reader.GetOrdinal("OrdenCatalogo")) ? 0 : reader.GetInt32(reader.GetOrdinal("OrdenCatalogo"));
                item.Categoria = reader.IsDBNull(reader.GetOrdinal("Categoria")) ? string.Empty : reader.GetString(reader.GetOrdinal("Categoria"));
                item.ImagenPrincipal = reader.IsDBNull(reader.GetOrdinal("ImagenPrincipal")) ? null : reader.GetString(reader.GetOrdinal("ImagenPrincipal"));
                return item;
            }
        }
    }

    public static ActualizarServicioResultado ActualizarServicio(
        int idProducto,
        int idUsuarioActor,
        string nombre,
        int idCategoria,
        string descripcion,
        decimal precio,
        bool activo,
        int ordenCatalogo)
    {
        ActualizarServicioResultado resultado = new ActualizarServicioResultado();
        resultado.Success = false;

        if (idProducto <= 0)
        {
            resultado.CodigoError = "SERVICIO_INVALIDO";
            resultado.Message = "El servicio indicado no es válido.";
            return resultado;
        }

        string nombreNormalizado = NormalizarTexto(nombre);
        string descripcionNormalizada = NormalizarTexto(descripcion);

        if (string.IsNullOrWhiteSpace(nombreNormalizado))
        {
            resultado.CodigoError = "NOMBRE_REQUERIDO";
            resultado.Message = "El nombre del servicio es obligatorio.";
            return resultado;
        }

        if (nombreNormalizado.Length > 150)
        {
            resultado.CodigoError = "NOMBRE_LONGITUD";
            resultado.Message = "El nombre del servicio excede el máximo permitido.";
            return resultado;
        }

        if (descripcionNormalizada != null && descripcionNormalizada.Length > 1000)
        {
            resultado.CodigoError = "DESCRIPCION_LONGITUD";
            resultado.Message = "La descripción del servicio excede el máximo permitido.";
            return resultado;
        }

        if (idCategoria <= 0)
        {
            resultado.CodigoError = "CATEGORIA_INVALIDA";
            resultado.Message = "La categoría seleccionada no es válida.";
            return resultado;
        }

        if (ordenCatalogo < 0 || ordenCatalogo > 2147483647)
        {
            resultado.CodigoError = "ORDEN_INVALIDO";
            resultado.Message = "El orden de catálogo no es válido.";
            return resultado;
        }

        if (precio < 0m || precio > 9999999999.99m)
        {
            resultado.CodigoError = "PRECIO_INVALIDO";
            resultado.Message = "El precio no es válido.";
            return resultado;
        }

        decimal precioAjustado = decimal.Round(precio, 2, MidpointRounding.AwayFromZero);

        const string sqlServicioValido = @"
SELECT TOP 1 p.IdProducto
FROM cat.Productos p
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE p.IdProducto = @idProducto
  AND p.EsCombo = 0
  AND c.Nombre IN (@catEntrenamiento, @catAsesoria, @catClases);";

        const string sqlCategoriaValida = @"
SELECT TOP 1 c.IdCategoria
FROM cat.Categorias c
WHERE c.IdCategoria = @idCategoria
  AND c.Activo = 1
  AND c.Nombre IN (@catEntrenamiento, @catAsesoria, @catClases);";

        const string sqlDuplicado = @"
SELECT TOP 1 p.IdProducto
FROM cat.Productos p WITH (UPDLOCK, HOLDLOCK)
WHERE p.IdCategoria = @idCategoria
  AND p.IdProducto <> @idProducto
  AND UPPER(LTRIM(RTRIM(p.Nombre))) = UPPER(@nombreNormalizado);";

        const string sqlUpdate = @"
UPDATE cat.Productos
SET IdCategoria = @idCategoria,
    Nombre = @nombre,
    Descripcion = @descripcion,
    Precio = @precio,
    Activo = @activo,
    OrdenCatalogo = @ordenCatalogo,
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @modificadoPor
WHERE IdProducto = @idProducto;";

        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            using (SqlCommand cmdServicio = new SqlCommand(sqlServicioValido, conn, tx))
            using (SqlCommand cmdCategoria = new SqlCommand(sqlCategoriaValida, conn, tx))
            using (SqlCommand cmdDuplicado = new SqlCommand(sqlDuplicado, conn, tx))
            using (SqlCommand cmdUpdate = new SqlCommand(sqlUpdate, conn, tx))
            {
                cmdServicio.Parameters.AddWithValue("@idProducto", idProducto);
                cmdServicio.Parameters.AddWithValue("@catEntrenamiento", CategoriaEntrenamiento);
                cmdServicio.Parameters.AddWithValue("@catAsesoria", CategoriaAsesoria);
                cmdServicio.Parameters.AddWithValue("@catClases", CategoriaClases);

                object existe = cmdServicio.ExecuteScalar();
                if (existe == null || existe == DBNull.Value)
                {
                    tx.Rollback();
                    resultado.CodigoError = "SERVICIO_NO_EXISTE";
                    resultado.Message = "El servicio no existe o no se puede editar.";
                    return resultado;
                }

                cmdCategoria.Parameters.AddWithValue("@idCategoria", idCategoria);
                cmdCategoria.Parameters.AddWithValue("@catEntrenamiento", CategoriaEntrenamiento);
                cmdCategoria.Parameters.AddWithValue("@catAsesoria", CategoriaAsesoria);
                cmdCategoria.Parameters.AddWithValue("@catClases", CategoriaClases);

                object categoriaValida = cmdCategoria.ExecuteScalar();
                if (categoriaValida == null || categoriaValida == DBNull.Value)
                {
                    tx.Rollback();
                    resultado.CodigoError = "CATEGORIA_INVALIDA";
                    resultado.Message = "La categoría seleccionada no es válida.";
                    return resultado;
                }

                cmdDuplicado.Parameters.AddWithValue("@idCategoria", idCategoria);
                cmdDuplicado.Parameters.AddWithValue("@idProducto", idProducto);
                cmdDuplicado.Parameters.AddWithValue("@nombreNormalizado", nombreNormalizado);

                object duplicado = cmdDuplicado.ExecuteScalar();
                if (duplicado != null && duplicado != DBNull.Value)
                {
                    tx.Rollback();
                    resultado.CodigoError = "SERVICIO_DUPLICADO";
                    resultado.Message = "Ya existe un servicio con ese nombre en la categoría seleccionada.";
                    return resultado;
                }

                cmdUpdate.Parameters.AddWithValue("@idProducto", idProducto);
                cmdUpdate.Parameters.AddWithValue("@idCategoria", idCategoria);
                cmdUpdate.Parameters.AddWithValue("@nombre", nombreNormalizado);
                cmdUpdate.Parameters.AddWithValue("@descripcion", (object)descripcionNormalizada ?? DBNull.Value);
                cmdUpdate.Parameters.AddWithValue("@precio", precioAjustado);
                cmdUpdate.Parameters.AddWithValue("@activo", activo);
                cmdUpdate.Parameters.AddWithValue("@ordenCatalogo", ordenCatalogo);
                cmdUpdate.Parameters.AddWithValue("@modificadoPor", idUsuarioActor > 0 ? (object)idUsuarioActor : DBNull.Value);

                int filas = cmdUpdate.ExecuteNonQuery();
                if (filas <= 0)
                {
                    tx.Rollback();
                    resultado.CodigoError = "SERVICIO_NO_EXISTE";
                    resultado.Message = "El servicio no existe o no se puede editar.";
                    return resultado;
                }

                tx.Commit();
                resultado.Success = true;
                resultado.CodigoError = null;
                resultado.Message = "Servicio actualizado correctamente.";
                return resultado;
            }
        }
    }

    public static bool DesactivarImagenPrincipalServicio(int idProducto, int idUsuarioActor)
    {
        if (idProducto <= 0) return false;

        const string sql = @"
UPDATE cat.ImagenesProducto
SET Activo = 0,
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @idActor
WHERE IdProducto = @idProducto
  AND EsPrincipal = 1
  AND Activo = 1;";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idProducto", idProducto);
            cmd.Parameters.AddWithValue("@idActor", idUsuarioActor > 0 ? (object)idUsuarioActor : DBNull.Value);
            conn.Open();
            cmd.ExecuteNonQuery();
            return true;
        }
    }

    public static RegistrarImagenServicioResultado RegistrarImagenPrincipalServicio(
        int idProducto,
        string rutaRelativa,
        string nombreArchivo,
        string tipoContenido,
        int tamanoBytes,
        int idUsuarioActor)
    {
        RegistrarImagenServicioResultado resultado = new RegistrarImagenServicioResultado();
        resultado.Success = false;

        if (idProducto <= 0)
        {
            resultado.CodigoError = "PRODUCTO_INVALIDO";
            resultado.Message = "El servicio indicado no es válido.";
            return resultado;
        }

        if (string.IsNullOrWhiteSpace(rutaRelativa) || rutaRelativa.Length > 400)
        {
            resultado.CodigoError = "RUTA_INVALIDA";
            resultado.Message = "La ruta de imagen no es válida.";
            return resultado;
        }

        if (!string.IsNullOrEmpty(nombreArchivo) && nombreArchivo.Length > 200)
        {
            resultado.CodigoError = "NOMBRE_ARCHIVO_INVALIDO";
            resultado.Message = "El nombre de archivo no es válido.";
            return resultado;
        }

        if (!string.IsNullOrEmpty(tipoContenido) && tipoContenido.Length > 50)
        {
            resultado.CodigoError = "TIPO_INVALIDO";
            resultado.Message = "El tipo de archivo no es válido.";
            return resultado;
        }

        if (tamanoBytes <= 0)
        {
            resultado.CodigoError = "TAMANO_INVALIDO";
            resultado.Message = "El tamaño de la imagen no es válido.";
            return resultado;
        }

        const string sqlServicioValido = @"
SELECT TOP 1 p.IdProducto
FROM cat.Productos p
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
WHERE p.IdProducto = @idProducto
  AND p.EsCombo = 0
  AND c.Nombre IN (@catEntrenamiento, @catAsesoria, @catClases);";

        const string sqlDesactivarPrincipal = @"
UPDATE cat.ImagenesProducto
SET Activo = 0,
    FechaModificacion = SYSDATETIME(),
    ModificadoPor = @idActor
WHERE IdProducto = @idProducto
  AND EsPrincipal = 1
  AND Activo = 1;";

        const string sqlInsert = @"
INSERT INTO cat.ImagenesProducto
    (IdProducto, Ruta, NombreArchivo, TipoContenido, TamanoBytes, EsPrincipal, Orden, Activo, CreadoPor)
VALUES
    (@idProducto, @ruta, @nombreArchivo, @tipoContenido, @tamanoBytes, 1, 0, 1, @creadoPor);";

        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            using (SqlCommand cmdServicio = new SqlCommand(sqlServicioValido, conn, tx))
            using (SqlCommand cmdDesactivar = new SqlCommand(sqlDesactivarPrincipal, conn, tx))
            using (SqlCommand cmdInsert = new SqlCommand(sqlInsert, conn, tx))
            {
                cmdServicio.Parameters.AddWithValue("@idProducto", idProducto);
                cmdServicio.Parameters.AddWithValue("@catEntrenamiento", CategoriaEntrenamiento);
                cmdServicio.Parameters.AddWithValue("@catAsesoria", CategoriaAsesoria);
                cmdServicio.Parameters.AddWithValue("@catClases", CategoriaClases);

                object servicio = cmdServicio.ExecuteScalar();
                if (servicio == null || servicio == DBNull.Value)
                {
                    tx.Rollback();
                    resultado.CodigoError = "SERVICIO_NO_VALIDO";
                    resultado.Message = "No fue posible asociar la imagen al servicio indicado.";
                    return resultado;
                }

                cmdDesactivar.Parameters.AddWithValue("@idProducto", idProducto);
                cmdDesactivar.Parameters.AddWithValue("@idActor", idUsuarioActor > 0 ? (object)idUsuarioActor : DBNull.Value);
                cmdDesactivar.ExecuteNonQuery();

                cmdInsert.Parameters.AddWithValue("@idProducto", idProducto);
                cmdInsert.Parameters.AddWithValue("@ruta", rutaRelativa.Trim());
                cmdInsert.Parameters.AddWithValue("@nombreArchivo", (object)nombreArchivo ?? DBNull.Value);
                cmdInsert.Parameters.AddWithValue("@tipoContenido", (object)tipoContenido ?? DBNull.Value);
                cmdInsert.Parameters.AddWithValue("@tamanoBytes", tamanoBytes);
                cmdInsert.Parameters.AddWithValue("@creadoPor", idUsuarioActor > 0 ? (object)idUsuarioActor : DBNull.Value);

                cmdInsert.ExecuteNonQuery();
                tx.Commit();

                resultado.Success = true;
                resultado.CodigoError = null;
                resultado.Message = "Imagen asociada correctamente.";
                return resultado;
            }
        }
    }

    public static ServicioCatalogoItem ObtenerServicioActivoPorId(int idProducto)
    {
        const string sql = @"
SELECT
    p.IdProducto,
    p.Nombre,
    p.Descripcion,
    p.Precio,
    c.Nombre AS Categoria,
    p.OrdenCatalogo,
    img.Ruta AS ImagenPrincipal
FROM cat.Productos p
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
OUTER APPLY (
    SELECT TOP 1 i.Ruta
    FROM cat.ImagenesProducto i
    WHERE i.IdProducto = p.IdProducto
      AND i.Activo = 1
      AND i.EsPrincipal = 1
    ORDER BY i.Orden, i.IdImagen
) img
WHERE p.IdProducto = @idProducto
  AND p.Activo = 1
  AND c.Activo = 1
  AND p.EsCombo = 0
  AND c.Nombre IN (@catEntrenamiento, @catAsesoria, @catClases);";

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idProducto", idProducto);
            cmd.Parameters.AddWithValue("@catEntrenamiento", CategoriaEntrenamiento);
            cmd.Parameters.AddWithValue("@catAsesoria", CategoriaAsesoria);
            cmd.Parameters.AddWithValue("@catClases", CategoriaClases);

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                if (!reader.Read())
                    return null;

                return MapearServicio(reader);
            }
        }
    }

    public static List<ServicioCategoriaItem> ObtenerCategoriasValidasParaServicios()
    {
        const string sql = @"
SELECT c.IdCategoria, c.Nombre
FROM cat.Categorias c
WHERE c.Activo = 1
  AND c.Nombre IN (@catEntrenamiento, @catAsesoria, @catClases)
ORDER BY c.Nombre;";

        List<ServicioCategoriaItem> categorias = new List<ServicioCategoriaItem>();

        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@catEntrenamiento", CategoriaEntrenamiento);
            cmd.Parameters.AddWithValue("@catAsesoria", CategoriaAsesoria);
            cmd.Parameters.AddWithValue("@catClases", CategoriaClases);

            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    ServicioCategoriaItem item = new ServicioCategoriaItem();
                    item.IdCategoria = reader.GetInt32(reader.GetOrdinal("IdCategoria"));
                    item.Nombre = reader.GetString(reader.GetOrdinal("Nombre"));
                    categorias.Add(item);
                }
            }
        }

        return categorias;
    }

    public static CrearServicioResultado CrearServicio(
        int idUsuarioActor,
        string nombre,
        int idCategoria,
        string descripcion,
        decimal precio,
        bool activo,
        int ordenCatalogo)
    {
        CrearServicioResultado resultado = new CrearServicioResultado();
        resultado.Success = false;
        resultado.IdProducto = 0;

        string nombreNormalizado = NormalizarTexto(nombre);
        string descripcionNormalizada = NormalizarTexto(descripcion);

        if (string.IsNullOrWhiteSpace(nombreNormalizado))
        {
            resultado.CodigoError = "NOMBRE_REQUERIDO";
            resultado.Message = "El nombre del servicio es obligatorio.";
            return resultado;
        }

        if (nombreNormalizado.Length > 150)
        {
            resultado.CodigoError = "NOMBRE_LONGITUD";
            resultado.Message = "El nombre del servicio excede el máximo permitido.";
            return resultado;
        }

        if (descripcionNormalizada != null && descripcionNormalizada.Length > 1000)
        {
            resultado.CodigoError = "DESCRIPCION_LONGITUD";
            resultado.Message = "La descripción del servicio excede el máximo permitido.";
            return resultado;
        }

        if (idCategoria <= 0)
        {
            resultado.CodigoError = "CATEGORIA_INVALIDA";
            resultado.Message = "La categoría seleccionada no es válida.";
            return resultado;
        }

        if (ordenCatalogo < 0 || ordenCatalogo > 2147483647)
        {
            resultado.CodigoError = "ORDEN_INVALIDO";
            resultado.Message = "El orden de catálogo no es válido.";
            return resultado;
        }

        if (precio < 0m || precio > 9999999999.99m)
        {
            resultado.CodigoError = "PRECIO_INVALIDO";
            resultado.Message = "El precio no es válido.";
            return resultado;
        }

        decimal precioAjustado = decimal.Round(precio, 2, MidpointRounding.AwayFromZero);

        const string sqlCategoriaValida = @"
SELECT c.IdCategoria
FROM cat.Categorias c
WHERE c.IdCategoria = @idCategoria
  AND c.Activo = 1
  AND c.Nombre IN (@catEntrenamiento, @catAsesoria, @catClases);";

        const string sqlDuplicado = @"
SELECT TOP 1 p.IdProducto
FROM cat.Productos p WITH (UPDLOCK, HOLDLOCK)
WHERE p.IdCategoria = @idCategoria
  AND UPPER(LTRIM(RTRIM(p.Nombre))) = UPPER(@nombreNormalizado);";

        const string sqlInsert = @"
INSERT INTO cat.Productos
    (IdCategoria, Nombre, Descripcion, Precio, EsCombo, Activo, OrdenCatalogo, CreadoPor)
VALUES
    (@idCategoria, @nombre, @descripcion, @precio, 0, @activo, @ordenCatalogo, @creadoPor);
SELECT CAST(SCOPE_IDENTITY() AS INT);";

        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            using (SqlCommand cmdCategoria = new SqlCommand(sqlCategoriaValida, conn, tx))
            using (SqlCommand cmdDuplicado = new SqlCommand(sqlDuplicado, conn, tx))
            using (SqlCommand cmdInsert = new SqlCommand(sqlInsert, conn, tx))
            {
                cmdCategoria.Parameters.AddWithValue("@idCategoria", idCategoria);
                cmdCategoria.Parameters.AddWithValue("@catEntrenamiento", CategoriaEntrenamiento);
                cmdCategoria.Parameters.AddWithValue("@catAsesoria", CategoriaAsesoria);
                cmdCategoria.Parameters.AddWithValue("@catClases", CategoriaClases);

                object categoriaValida = cmdCategoria.ExecuteScalar();
                if (categoriaValida == null || categoriaValida == DBNull.Value)
                {
                    tx.Rollback();
                    resultado.CodigoError = "CATEGORIA_INVALIDA";
                    resultado.Message = "La categoría seleccionada no es válida.";
                    return resultado;
                }

                cmdDuplicado.Parameters.AddWithValue("@idCategoria", idCategoria);
                cmdDuplicado.Parameters.AddWithValue("@nombreNormalizado", nombreNormalizado);
                object duplicado = cmdDuplicado.ExecuteScalar();
                if (duplicado != null && duplicado != DBNull.Value)
                {
                    tx.Rollback();
                    resultado.CodigoError = "SERVICIO_DUPLICADO";
                    resultado.Message = "Ya existe un servicio con ese nombre en la categoría seleccionada.";
                    return resultado;
                }

                cmdInsert.Parameters.AddWithValue("@idCategoria", idCategoria);
                cmdInsert.Parameters.AddWithValue("@nombre", nombreNormalizado);
                cmdInsert.Parameters.AddWithValue("@descripcion", (object)descripcionNormalizada ?? DBNull.Value);
                cmdInsert.Parameters.AddWithValue("@precio", precioAjustado);
                cmdInsert.Parameters.AddWithValue("@activo", activo);
                cmdInsert.Parameters.AddWithValue("@ordenCatalogo", ordenCatalogo);
                cmdInsert.Parameters.AddWithValue("@creadoPor", idUsuarioActor > 0 ? (object)idUsuarioActor : DBNull.Value);

                object idGenerado = cmdInsert.ExecuteScalar();
                tx.Commit();

                resultado.Success = true;
                resultado.IdProducto = idGenerado == null || idGenerado == DBNull.Value ? 0 : Convert.ToInt32(idGenerado);
                resultado.CodigoError = null;
                resultado.Message = "Servicio registrado correctamente.";
                return resultado;
            }
        }
    }

    private static ServicioCatalogoItem MapearServicio(SqlDataReader reader)
    {
        ServicioCatalogoItem item = new ServicioCatalogoItem();

        item.IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto"));
        item.Nombre = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre"));
        item.Descripcion = reader.IsDBNull(reader.GetOrdinal("Descripcion")) ? null : reader.GetString(reader.GetOrdinal("Descripcion"));
        item.Precio = reader.IsDBNull(reader.GetOrdinal("Precio")) ? 0m : reader.GetDecimal(reader.GetOrdinal("Precio"));
        item.Categoria = reader.IsDBNull(reader.GetOrdinal("Categoria")) ? string.Empty : reader.GetString(reader.GetOrdinal("Categoria"));
        item.OrdenCatalogo = reader.IsDBNull(reader.GetOrdinal("OrdenCatalogo")) ? 0 : reader.GetInt32(reader.GetOrdinal("OrdenCatalogo"));
        item.ImagenPrincipal = reader.IsDBNull(reader.GetOrdinal("ImagenPrincipal")) ? null : reader.GetString(reader.GetOrdinal("ImagenPrincipal"));

        return item;
    }

    private static string NormalizarTexto(string value)
    {
        if (value == null) return null;
        string trimmed = value.Trim();
        if (trimmed.Length == 0) return string.Empty;

        System.Text.StringBuilder sb = new System.Text.StringBuilder(trimmed.Length);
        bool wasSpace = false;
        for (int i = 0; i < trimmed.Length; i++)
        {
            char c = trimmed[i];
            bool isSpace = char.IsWhiteSpace(c);
            if (isSpace)
            {
                if (!wasSpace)
                {
                    sb.Append(' ');
                }
                wasSpace = true;
            }
            else
            {
                sb.Append(c);
                wasSpace = false;
            }
        }

        return sb.ToString();
    }
}
