using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;

public class CheckoutItemInput
{
    public int IdProducto { get; set; }
    public int? IdPromocion { get; set; }
    public List<int> IdsHorarioServicio { get; set; }
    public string Observaciones { get; set; }
}

public class CheckoutPagoInput
{
    public string TokenIdempotencia { get; set; }
    public bool SimularAprobado { get; set; }
}

public class CheckoutResumenItem
{
    public int IdProducto { get; set; }
    public string Servicio { get; set; }
    public int? IdPromocion { get; set; }
    public string NombrePromocion { get; set; }
    public string TipoPromocion { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal Total { get; set; }
    public List<int> IdsHorarioServicio { get; set; }
    public string Observaciones { get; set; }
}

public class CheckoutResultado
{
    public bool Success { get; set; }
    public string Codigo { get; set; }
    public string Message { get; set; }
    public string NumeroPedido { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal Total { get; set; }
    public bool PagoAprobado { get; set; }
    public bool Simulado { get; set; }
    public List<CheckoutResumenItem> Items { get; set; }
}

public static class RepositorioCheckout
{
    public static CheckoutResultado Previsualizar(int idUsuario, List<CheckoutItemInput> items, string referencia)
    {
        if (!EsClienteActivo(idUsuario))
            return new CheckoutResultado { Success = false, Codigo = "CLIENTE_INVALIDO", Message = "Iniciá sesión con una cuenta de cliente activa.", Simulado = true };
        if (!string.IsNullOrWhiteSpace(referencia) && referencia.Length <= 100)
        {
            var existente = BuscarPagoProcesado(referencia.Trim(), idUsuario);
            if (existente != null) return existente;
        }

        List<CheckoutResumenItem> resumen;
        string error;
        if (!ValidarYCalcular(idUsuario, items, out resumen, out error))
        {
            return new CheckoutResultado { Success = false, Codigo = "CHECKOUT_INVALIDO", Message = error, Simulado = true, PagoAprobado = false };
        }

        return ConstruirResultadoBase(resumen);
    }

    public static CheckoutResultado Procesar(int idUsuario, List<CheckoutItemInput> items, CheckoutPagoInput pago)
    {
        if (!EsClienteActivo(idUsuario))
            return new CheckoutResultado { Success = false, Codigo = "CLIENTE_INVALIDO", Message = "Iniciá sesión con una cuenta de cliente activa.", Simulado = true };
        if (pago == null || string.IsNullOrWhiteSpace(pago.TokenIdempotencia))
            return new CheckoutResultado { Success = false, Codigo = "PAGO_INVALIDO", Message = "Faltan datos de pago." };

        string referencia = pago.TokenIdempotencia.Trim();
        if (referencia.Length > 100)
            return new CheckoutResultado { Success = false, Codigo = "PAGO_INVALIDO", Message = "La referencia de pago no es válida." };

        using (SqlConnection conexion = DbHelper.GetConnection())
        using (SqlCommand bloqueo = new SqlCommand(@"DECLARE @resultado INT;
EXEC @resultado = sys.sp_getapplock @Resource = @recurso, @LockMode = N'Exclusive', @LockOwner = N'Session', @LockTimeout = 5000;
SELECT @resultado;", conexion))
        {
            bloqueo.Parameters.AddWithValue("@recurso", "KFitness.Checkout." + idUsuario.ToString(CultureInfo.InvariantCulture));
            conexion.Open();
            if (Convert.ToInt32(bloqueo.ExecuteScalar(), CultureInfo.InvariantCulture) < 0)
                return new CheckoutResultado { Success = false, Codigo = "PAGO_EN_CURSO", Message = "Ya hay un pago en curso. Esperá y volvé a intentar.", Simulado = true };

            try { return ProcesarConBloqueo(idUsuario, items, pago.SimularAprobado, referencia); }
            finally
            {
                bloqueo.CommandText = "EXEC sys.sp_releaseapplock @Resource = @recurso, @LockOwner = N'Session';";
                bloqueo.ExecuteNonQuery();
            }
        }
    }

    private static CheckoutResultado ProcesarConBloqueo(int idUsuario, List<CheckoutItemInput> items, bool simularAprobado, string referencia)
    {
        CheckoutResultado existente = BuscarPagoProcesado(referencia, idUsuario);
        if (existente != null) return existente;

        List<CheckoutResumenItem> resumen;
        string error;
        if (!ValidarYCalcular(idUsuario, items, out resumen, out error))
        {
            return new CheckoutResultado { Success = false, Codigo = "CHECKOUT_INVALIDO", Message = error, Simulado = true, PagoAprobado = false };
        }

        CheckoutResultado baseResult = ConstruirResultadoBase(resumen);

        if (!simularAprobado)
        {
            baseResult.Success = false;
            baseResult.Codigo = "PAGO_RECHAZADO";
            baseResult.Message = "Pago rechazado por simulador de pruebas. Puedes reintentar.";
            baseResult.PagoAprobado = false;
            return baseResult;
        }

        string numeroPedido;
        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            using (SqlTransaction tx = conn.BeginTransaction(IsolationLevel.Serializable))
            {
                foreach (CheckoutResumenItem item in resumen)
                {
                    OperacionReservaResultado op;
                    if (!item.IdPromocion.HasValue || item.IdPromocion.Value <= 0)
                    {
                        op = RepositorioReservas.CrearReserva(conn, tx, idUsuario, item.IdsHorarioServicio[0], item.Observaciones);
                    }
                    else if (string.Equals(item.TipoPromocion, "DOS_POR_UNO", StringComparison.OrdinalIgnoreCase))
                    {
                        op = RepositorioReservas.CrearReservaPromocionalDosPorUno(conn, tx, idUsuario, item.IdPromocion.Value, item.IdsHorarioServicio[0], item.IdsHorarioServicio[1], item.Observaciones);
                    }
                    else
                    {
                        op = RepositorioReservas.CrearReservaPromocionalPorcentaje(conn, tx, idUsuario, item.IdPromocion.Value, item.IdsHorarioServicio[0], item.Observaciones);
                    }

                    if (!op.Success)
                    {
                        baseResult.Success = false;
                        baseResult.Codigo = op.CodigoError;
                        baseResult.Message = op.Message;
                        baseResult.PagoAprobado = false;
                        return baseResult;
                    }
                }

                if (!InsertarPedidoYPago(conn, tx, idUsuario, resumen, baseResult.Subtotal, baseResult.Descuento, baseResult.Total, referencia, out numeroPedido, out error))
                {
                    baseResult.Success = false;
                    baseResult.Codigo = "PEDIDO_ERROR";
                    baseResult.Message = error;
                    baseResult.PagoAprobado = false;
                    return baseResult;
                }

                tx.Commit();
            }
        }

        baseResult.Success = true;
        baseResult.Codigo = "OK";
        baseResult.Message = "Pago aprobado (simulado) y orden confirmada.";
        baseResult.NumeroPedido = numeroPedido;
        baseResult.PagoAprobado = true;
        return baseResult;
    }

    private static CheckoutResultado ConstruirResultadoBase(List<CheckoutResumenItem> resumen)
    {
        decimal subtotal = 0m;
        decimal descuento = 0m;
        decimal total = 0m;

        for (int i = 0; i < resumen.Count; i += 1)
        {
            subtotal += resumen[i].Subtotal;
            descuento += resumen[i].Descuento;
            total += resumen[i].Total;
        }

        return new CheckoutResultado
        {
            Success = true,
            Codigo = "OK",
            Message = "Validación correcta.",
            Subtotal = decimal.Round(subtotal, 2, MidpointRounding.AwayFromZero),
            Descuento = decimal.Round(descuento, 2, MidpointRounding.AwayFromZero),
            Total = decimal.Round(total, 2, MidpointRounding.AwayFromZero),
            Items = resumen,
            Simulado = true,
            PagoAprobado = false
        };
    }

    private static bool ValidarYCalcular(int idUsuario, List<CheckoutItemInput> items, out List<CheckoutResumenItem> resumen, out string error)
    {
        resumen = new List<CheckoutResumenItem>();
        error = null;
        if (items == null || items.Count == 0)
        {
            error = "El carrito está vacío.";
            return false;
        }

        var sesionesEnCarrito = new HashSet<int>();
        var valoracionesEnCarrito = new HashSet<int>();
        using (SqlConnection conn = DbHelper.GetConnection())
        {
            conn.Open();
            for (int i = 0; i < items.Count; i += 1)
            {
                CheckoutItemInput item = items[i] ?? new CheckoutItemInput();
                List<int> ids = item.IdsHorarioServicio ?? new List<int>();
                if (ids.Count == 0 || ids.Count > 2) { error = "Hay ítems sin sesiones válidas."; return false; }
                if ((item.Observaciones ?? string.Empty).Length > 500) { error = "Las observaciones pueden tener hasta 500 caracteres."; return false; }

                HorarioDisponibleItem primera = null;
                foreach (int idHorario in ids)
                {
                    if (idHorario <= 0 || !sesionesEnCarrito.Add(idHorario)) { error = "El carrito contiene una sesión inválida o repetida."; return false; }
                    var sesion = ObtenerSesion(conn, idHorario);
                    if (sesion == null || sesion.IdProducto != item.IdProducto) { error = "Una sesión del carrito ya no está disponible para este servicio."; return false; }
                    if (primera == null) primera = sesion;
                }
                decimal precio = ObtenerPrecioProducto(conn, primera.IdProducto);
                CheckoutResumenItem r = new CheckoutResumenItem
                {
                    IdProducto = primera.IdProducto,
                    Servicio = primera.Servicio,
                    IdPromocion = item.IdPromocion.HasValue && item.IdPromocion.Value > 0 ? item.IdPromocion : (int?)null,
                    PrecioUnitario = precio,
                    IdsHorarioServicio = new List<int>(ids),
                    Observaciones = item.Observaciones
                };

                if (!r.IdPromocion.HasValue)
                {
                    if (ids.Count != 1) { error = "Una reserva regular requiere una sesión."; return false; }
                    r.Subtotal = precio;
                    r.Descuento = 0m;
                    r.Total = precio;
                }
                else
                {
                    string nombre;
                    string tipo;
                    decimal porcentaje;
                    int compra;
                    int entrega;
                    string motivo;
                    if (!CargarPromocion(conn, r.IdPromocion.Value, r.IdProducto, out nombre, out tipo, out porcentaje, out compra, out entrega, out motivo))
                    {
                        error = "Una promoción ya no está vigente o no aplica al servicio.";
                        return false;
                    }

                    if (tipo == "CONSULTA" || motivo == "KFIT_PLAN_MENSUAL")
                    {
                        error = "Consultá por este plan en Contacto.";
                        return false;
                    }
                    if (motivo == "KFIT_PRIMERA_VALORACION"
                        && (!valoracionesEnCarrito.Add(r.IdPromocion.Value)
                            || RepositorioReservas.ValoracionGratisYaUtilizada(r.IdPromocion.Value, idUsuario)))
                    {
                        error = RepositorioReservas.MensajeValoracionUtilizada;
                        return false;
                    }

                    r.NombrePromocion = nombre;
                    r.TipoPromocion = tipo;

                    if (string.Equals(tipo, "DOS_POR_UNO", StringComparison.OrdinalIgnoreCase))
                    {
                        if (ids.Count != 2) { error = "La promoción 2x1 requiere dos sesiones."; return false; }
                        if (compra <= 0) compra = 1;
                        if (entrega < 2) entrega = 2;
                        r.Subtotal = precio * entrega;
                        r.Total = precio * compra;
                        r.Descuento = r.Subtotal - r.Total;
                    }
                    else
                    {
                        if (ids.Count != 1) { error = "El descuento porcentual requiere una sesión."; return false; }
                        if (porcentaje < 0m) porcentaje = 0m;
                        if (porcentaje > 100m) porcentaje = 100m;
                        r.Subtotal = precio;
                        r.Total = decimal.Round(precio * (1m - (porcentaje / 100m)), 2, MidpointRounding.AwayFromZero);
                        r.Descuento = r.Subtotal - r.Total;
                    }
                }

                r.Subtotal = decimal.Round(r.Subtotal, 2, MidpointRounding.AwayFromZero);
                r.Descuento = decimal.Round(r.Descuento, 2, MidpointRounding.AwayFromZero);
                r.Total = decimal.Round(r.Total, 2, MidpointRounding.AwayFromZero);
                resumen.Add(r);
            }
        }

        return true;
    }

    private static HorarioDisponibleItem ObtenerSesion(SqlConnection conn, int idHorarioServicio)
    {
        const string sql = @"
SELECT hs.IdHorarioServicio, hs.IdProducto, p.Nombre AS Servicio, hs.Fecha, hs.HoraInicio, hs.HoraFin,
       hs.CapacidadMaxima, COUNT(CASE WHEN r.Estado = N'CONFIRMADA' THEN 1 END) AS ReservasConfirmadas,
       hs.Instructor, hs.Activo, p.Activo AS ServicioActivo, c.Activo AS CategoriaActiva
FROM cfg.HorariosServicio hs
INNER JOIN cat.Productos p ON p.IdProducto = hs.IdProducto
INNER JOIN cat.Categorias c ON c.IdCategoria = p.IdCategoria
LEFT JOIN res.Reservas r ON r.IdHorarioServicio = hs.IdHorarioServicio
WHERE hs.IdHorarioServicio=@idHorarioServicio AND p.EsCombo=0
GROUP BY hs.IdHorarioServicio, hs.IdProducto, p.Nombre, hs.Fecha, hs.HoraInicio, hs.HoraFin, hs.CapacidadMaxima, hs.Instructor, hs.Activo, p.Activo, c.Activo;";

        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idHorarioServicio", idHorarioServicio);
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                if (!reader.Read()) return null;
                bool hsActivo = !reader.IsDBNull(reader.GetOrdinal("Activo")) && reader.GetBoolean(reader.GetOrdinal("Activo"));
                bool srvActivo = !reader.IsDBNull(reader.GetOrdinal("ServicioActivo")) && reader.GetBoolean(reader.GetOrdinal("ServicioActivo"));
                bool catActivo = !reader.IsDBNull(reader.GetOrdinal("CategoriaActiva")) && reader.GetBoolean(reader.GetOrdinal("CategoriaActiva"));
                if (!hsActivo || !srvActivo || !catActivo) return null;

                HorarioDisponibleItem item = new HorarioDisponibleItem();
                item.IdHorarioServicio = reader.GetInt32(reader.GetOrdinal("IdHorarioServicio"));
                item.IdProducto = reader.GetInt32(reader.GetOrdinal("IdProducto"));
                item.Servicio = reader.IsDBNull(reader.GetOrdinal("Servicio")) ? string.Empty : reader.GetString(reader.GetOrdinal("Servicio"));
                item.Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha"));
                item.HoraInicio = reader.GetTimeSpan(reader.GetOrdinal("HoraInicio"));
                item.HoraFin = reader.GetTimeSpan(reader.GetOrdinal("HoraFin"));
                item.CapacidadMaxima = reader.IsDBNull(reader.GetOrdinal("CapacidadMaxima")) ? 0 : reader.GetInt32(reader.GetOrdinal("CapacidadMaxima"));
                item.ReservasConfirmadas = reader.IsDBNull(reader.GetOrdinal("ReservasConfirmadas")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("ReservasConfirmadas")));
                item.CuposRestantes = Math.Max(0, item.CapacidadMaxima - item.ReservasConfirmadas);
                item.Completo = item.CuposRestantes <= 0;
                if (item.Completo) return null;
                if (item.Fecha.Date.Add(item.HoraInicio) <= RepositorioHorariosConsulta.AhoraCostaRica()) return null;
                return item;
            }
        }
    }

    private static decimal ObtenerPrecioProducto(SqlConnection conn, int idProducto)
    {
        using (SqlCommand cmd = new SqlCommand("SELECT TOP 1 Precio FROM cat.Productos WHERE IdProducto=@id", conn))
        {
            cmd.Parameters.AddWithValue("@id", idProducto);
            object o = cmd.ExecuteScalar();
            return o == null || o == DBNull.Value ? 0m : Convert.ToDecimal(o, CultureInfo.InvariantCulture);
        }
    }

    private static bool CargarPromocion(SqlConnection conn, int idPromocion, int idProducto, out string nombre, out string tipo, out decimal porcentaje, out int compra, out int entrega, out string motivo)
    {
        nombre = string.Empty; tipo = string.Empty; porcentaje = 0m; compra = 1; entrega = 1;
        motivo = null;
        const string sql = @"SELECT TOP 1 pr.Nombre, pr.TipoPromocion, pr.PorcentajeDescuento, pr.CantidadCompra, pr.CantidadEntrega, pr.Motivo
FROM prm.Promociones pr
INNER JOIN prm.PromocionProductos pp ON pp.IdPromocion = pr.IdPromocion
WHERE pr.IdPromocion=@idPromocion AND pp.IdProducto=@idProducto AND pr.Activo=1
  AND @hoy BETWEEN pr.FechaInicio AND pr.FechaFin;";
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@idPromocion", idPromocion);
            cmd.Parameters.AddWithValue("@idProducto", idProducto);
            cmd.Parameters.Add("@hoy", SqlDbType.Date).Value = RepositorioHorariosConsulta.AhoraCostaRica().Date;
            using (SqlDataReader r = cmd.ExecuteReader())
            {
                if (!r.Read()) return false;
                nombre = r.IsDBNull(0) ? string.Empty : r.GetString(0);
                tipo = r.IsDBNull(1) ? string.Empty : r.GetString(1);
                porcentaje = r.IsDBNull(2) ? 0m : r.GetDecimal(2);
                compra = r.IsDBNull(3) ? 1 : r.GetInt32(3);
                entrega = r.IsDBNull(4) ? 1 : r.GetInt32(4);
                motivo = r.IsDBNull(5) ? null : r.GetString(5);
                return true;
            }
        }
    }

    private static bool InsertarPedidoYPago(SqlConnection conn, SqlTransaction tx, int idUsuario, List<CheckoutResumenItem> items, decimal subtotal, decimal descuento, decimal total, string referencia, out string numeroPedido, out string error)
    {
        numeroPedido = string.Empty;
        error = "No fue posible registrar pedido y pago.";

        try
        {
            int idCliente = ObtenerOCrearIdCliente(conn, tx, idUsuario, out error);
            if (idCliente <= 0)
            {
                return false;
            }

            int idMetodoPago = ObtenerMetodoPago(conn, tx);
            if (idMetodoPago <= 0)
            {
                error = "No hay método de pago activo.";
                return false;
            }

            int idPedido;
            using (SqlCommand cmd = new SqlCommand("INSERT INTO ped.Pedidos (IdCliente, IdEstado, IdDireccion, Subtotal, Descuento, CostoEnvio, Observaciones) VALUES (@c,2,NULL,@s,@d,0,@o); SELECT CAST(SCOPE_IDENTITY() AS INT);", conn, tx))
            {
                cmd.Parameters.AddWithValue("@c", idCliente);
                cmd.Parameters.AddWithValue("@s", subtotal);
                cmd.Parameters.AddWithValue("@d", descuento);
                cmd.Parameters.AddWithValue("@o", "Checkout cliente simulado");
                idPedido = Convert.ToInt32(cmd.ExecuteScalar(), CultureInfo.InvariantCulture);
            }

            for (int i = 0; i < items.Count; i += 1)
            {
                CheckoutResumenItem x = items[i];
                using (SqlCommand det = new SqlCommand("INSERT INTO ped.PedidoDetalle (IdPedido, IdProducto, NombreProducto, Cantidad, PrecioUnitario, DescuentoLinea) VALUES (@p,@prod,@n,@c,@pr,@des);", conn, tx))
                {
                    det.Parameters.AddWithValue("@p", idPedido);
                    det.Parameters.AddWithValue("@prod", x.IdProducto);
                    det.Parameters.AddWithValue("@n", x.Servicio ?? string.Empty);
                    det.Parameters.AddWithValue("@c", x.IdsHorarioServicio != null && x.IdsHorarioServicio.Count > 1 ? x.IdsHorarioServicio.Count : 1);
                    det.Parameters.AddWithValue("@pr", x.PrecioUnitario);
                    det.Parameters.AddWithValue("@des", x.Descuento);
                    det.ExecuteNonQuery();
                }
            }

            using (SqlCommand pago = new SqlCommand("INSERT INTO pag.Pagos (IdPedido, IdMetodoPago, Monto, Estado, Referencia, MarcaTarjeta, FechaPago) VALUES (@p,@m,@t,N'APROBADO',@r,N'SIMULADO',SYSDATETIME());", conn, tx))
            {
                pago.Parameters.AddWithValue("@p", idPedido);
                pago.Parameters.AddWithValue("@m", idMetodoPago);
                pago.Parameters.AddWithValue("@t", total);
                pago.Parameters.AddWithValue("@r", referencia);
                pago.ExecuteNonQuery();
            }

            using (SqlCommand num = new SqlCommand("SELECT NumeroPedido FROM ped.Pedidos WHERE IdPedido=@id", conn, tx))
            {
                num.Parameters.AddWithValue("@id", idPedido);
                object o = num.ExecuteScalar();
                numeroPedido = o == null || o == DBNull.Value ? "PED-" + idPedido.ToString(CultureInfo.InvariantCulture) : Convert.ToString(o, CultureInfo.InvariantCulture);
            }

            return true;
        }
        catch (SqlException)
        {
            error = "No fue posible registrar pedido y pago.";
            return false;
        }
    }

    private static int ObtenerOCrearIdCliente(SqlConnection conn, SqlTransaction tx, int idUsuario, out string error)
    {
        error = null;

        using (SqlCommand cmd = new SqlCommand("SELECT TOP 1 IdCliente FROM cli.Clientes WHERE IdUsuario=@u ORDER BY IdCliente", conn, tx))
        {
            cmd.Parameters.AddWithValue("@u", idUsuario);
            object existe = cmd.ExecuteScalar();
            if (existe != null && existe != DBNull.Value)
            {
                int idClienteExistente = Convert.ToInt32(existe, CultureInfo.InvariantCulture);
                using (SqlCommand activar = new SqlCommand("UPDATE cli.Clientes SET Activo=1, FechaModificacion=SYSDATETIME(), ModificadoPor=@u WHERE IdCliente=@idCliente AND Activo=0", conn, tx))
                {
                    activar.Parameters.AddWithValue("@u", idUsuario);
                    activar.Parameters.AddWithValue("@idCliente", idClienteExistente);
                    activar.ExecuteNonQuery();
                }
                return idClienteExistente;
            }
        }

        using (SqlCommand rolCliente = new SqlCommand(@"SELECT TOP 1 1
FROM seg.Usuarios u
INNER JOIN seg.Roles r ON r.IdRol = u.IdRol
WHERE u.IdUsuario=@u AND u.Activo=1 AND r.Nombre=N'Cliente'", conn, tx))
        {
            rolCliente.Parameters.AddWithValue("@u", idUsuario);
            object esCliente = rolCliente.ExecuteScalar();
            if (esCliente == null || esCliente == DBNull.Value)
            {
                error = "La cuenta autenticada no tiene un cliente asociado válido para checkout.";
                return 0;
            }
        }

        try
        {
            using (SqlCommand insertar = new SqlCommand(@"INSERT INTO cli.Clientes (IdUsuario, CreadoPor)
VALUES (@u, @u);
SELECT CAST(SCOPE_IDENTITY() AS INT);", conn, tx))
            {
                insertar.Parameters.AddWithValue("@u", idUsuario);
                object nuevo = insertar.ExecuteScalar();
                return nuevo == null || nuevo == DBNull.Value ? 0 : Convert.ToInt32(nuevo, CultureInfo.InvariantCulture);
            }
        }
        catch (SqlException ex)
        {
            if (ex.Number == 2601 || ex.Number == 2627)
            {
                using (SqlCommand cmd = new SqlCommand("SELECT TOP 1 IdCliente FROM cli.Clientes WHERE IdUsuario=@u ORDER BY IdCliente", conn, tx))
                {
                    cmd.Parameters.AddWithValue("@u", idUsuario);
                    object o = cmd.ExecuteScalar();
                    if (o != null && o != DBNull.Value)
                    {
                        return Convert.ToInt32(o, CultureInfo.InvariantCulture);
                    }
                }
            }

            throw;
        }
    }

    private static int ObtenerMetodoPago(SqlConnection conn, SqlTransaction tx)
    {
        using (SqlCommand cmd = new SqlCommand("SELECT TOP 1 IdMetodoPago FROM pag.MetodosPago WHERE Codigo=N'TARJETA' AND Activo=1", conn, tx))
        {
            object o = cmd.ExecuteScalar();
            if (o != null && o != DBNull.Value) return Convert.ToInt32(o, CultureInfo.InvariantCulture);
        }

        using (SqlCommand cmd = new SqlCommand("SELECT TOP 1 IdMetodoPago FROM pag.MetodosPago WHERE Activo=1 ORDER BY IdMetodoPago", conn, tx))
        {
            object o = cmd.ExecuteScalar();
            return o == null || o == DBNull.Value ? 0 : Convert.ToInt32(o, CultureInfo.InvariantCulture);
        }
    }

    private static bool EsClienteActivo(int idUsuario)
    {
        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(@"SELECT 1 FROM seg.Usuarios u
INNER JOIN seg.Roles r ON r.IdRol=u.IdRol
WHERE u.IdUsuario=@u AND u.Activo=1 AND r.Activo=1 AND r.Nombre=N'Cliente';", conn))
        {
            cmd.Parameters.AddWithValue("@u", idUsuario);
            conn.Open();
            return cmd.ExecuteScalar() != null;
        }
    }

    private static CheckoutResultado BuscarPagoProcesado(string referencia, int idUsuario)
    {
        const string sql = @"DECLARE @pedido int;
SELECT TOP 1 @pedido = p.IdPedido
FROM pag.Pagos pa
JOIN ped.Pedidos p ON p.IdPedido = pa.IdPedido
JOIN cli.Clientes c ON c.IdCliente = p.IdCliente
WHERE pa.Referencia = @r AND pa.Estado = N'APROBADO' AND c.IdUsuario = @u
ORDER BY pa.IdPago DESC;

SELECT p.NumeroPedido, p.Subtotal, p.Descuento, pa.Monto
FROM ped.Pedidos p
JOIN pag.Pagos pa ON pa.IdPedido = p.IdPedido AND pa.Estado = N'APROBADO'
WHERE p.IdPedido = @pedido;

SELECT IdProducto, NombreProducto FROM ped.PedidoDetalle WHERE IdPedido = @pedido;";
        using (SqlConnection conn = DbHelper.GetConnection())
        using (SqlCommand cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@r", referencia);
            cmd.Parameters.AddWithValue("@u", idUsuario);
            conn.Open();
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                if (!reader.Read()) return null;
                var resultado = new CheckoutResultado
                {
                    Success = true, Codigo = "OK", Message = "Orden ya procesada previamente.",
                    NumeroPedido = reader.GetString(0), Subtotal = reader.GetDecimal(1),
                    Descuento = reader.GetDecimal(2), Total = reader.GetDecimal(3),
                    Simulado = true, PagoAprobado = true, Items = new List<CheckoutResumenItem>()
                };

                if (reader.NextResult())
                {
                    while (reader.Read())
                        resultado.Items.Add(new CheckoutResumenItem { IdProducto = reader.GetInt32(0), Servicio = reader.GetString(1) });
                }
                return resultado;
            }
        }
    }
}
