<%@ WebHandler Language="C#" Class="AdminReportsHandler" %>
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Web;

using JavaScriptSerializer = System.Web.Script.Serialization.JavaScriptSerializer;

public class ResumenPromocionesReporte
{
    public int Total { get; set; }
    public int Activas { get; set; }
    public int Inactivas { get; set; }
    public int Vigentes { get; set; }
}

public class ResumenReservasReporte
{
    public int Total { get; set; }
    public int Confirmadas { get; set; }
    public int Canceladas { get; set; }
    public int OtrosEstados { get; set; }
}

public class AdminReportsHandler : IHttpHandler
{
    public bool IsReusable { get { return false; } }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        JavaScriptSerializer js = new JavaScriptSerializer();

        try
        {
            AdminAuthorizationResult auth = AdminAuthorization.ValidateCurrentUser(context);

            if (!auth.IsAuthenticated)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 401;
                context.Response.Write(js.Serialize(new { success = false, message = "No autenticado." }));
                return;
            }

            if (!auth.UserExists || !auth.IsAdmin)
            {
                context.Response.SuppressFormsAuthenticationRedirect = true;
                context.Response.StatusCode = 403;
                context.Response.Write(js.Serialize(new { success = false, message = "Acceso denegado." }));
                return;
            }

            if (!string.Equals(context.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 405;
                context.Response.Write(js.Serialize(new { success = false, message = "Método no permitido." }));
                return;
            }

            string tipo = (context.Request.QueryString["tipo"] ?? string.Empty).Trim().ToLowerInvariant();
            if (tipo != "servicios" && tipo != "promociones" && tipo != "reservas" && tipo != "usuarios")
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new
                {
                    success = false,
                    message = "Tipo de reporte no soportado.",
                    tipo = tipo
                }));
                return;
            }

            string formato = (context.Request.QueryString["formato"] ?? string.Empty).Trim().ToLowerInvariant();
            if (!string.IsNullOrEmpty(formato) && formato != "xlsx")
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new
                {
                    success = false,
                    message = "Formato de exportación no soportado.",
                    formato = formato
                }));
                return;
            }

            if (tipo == "servicios")
            {
                string nombre = (context.Request.QueryString["nombre"] ?? string.Empty).Trim();
                string categoria = (context.Request.QueryString["categoria"] ?? string.Empty).Trim();
                string estado = (context.Request.QueryString["estado"] ?? string.Empty).Trim().ToLowerInvariant();
                string precioMinRaw = (context.Request.QueryString["precioMin"] ?? string.Empty).Trim();
                string precioMaxRaw = (context.Request.QueryString["precioMax"] ?? string.Empty).Trim();

                bool? activo = null;
                if (!string.IsNullOrEmpty(estado))
                {
                    if (estado == "activo") activo = true;
                    else if (estado == "inactivo") activo = false;
                    else
                    {
                        context.Response.StatusCode = 400;
                        context.Response.Write(js.Serialize(new { success = false, message = "Filtro estado inválido." }));
                        return;
                    }
                }

                decimal? precioMin = null;
                if (!string.IsNullOrEmpty(precioMinRaw))
                {
                    decimal valorMin;
                    if (!decimal.TryParse(precioMinRaw, NumberStyles.Number, CultureInfo.InvariantCulture, out valorMin) || valorMin < 0m)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.Write(js.Serialize(new { success = false, message = "Filtro precio mínimo inválido." }));
                        return;
                    }
                    precioMin = decimal.Round(valorMin, 2, MidpointRounding.AwayFromZero);
                }

                decimal? precioMax = null;
                if (!string.IsNullOrEmpty(precioMaxRaw))
                {
                    decimal valorMax;
                    if (!decimal.TryParse(precioMaxRaw, NumberStyles.Number, CultureInfo.InvariantCulture, out valorMax) || valorMax < 0m)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.Write(js.Serialize(new { success = false, message = "Filtro precio máximo inválido." }));
                        return;
                    }
                    precioMax = decimal.Round(valorMax, 2, MidpointRounding.AwayFromZero);
                }

                if (precioMin.HasValue && precioMax.HasValue && precioMin.Value > precioMax.Value)
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "El precio mínimo no puede ser mayor que el precio máximo." }));
                    return;
                }

                List<ServicioAdminListadoItem> servicios = RepositorioServicios.ObtenerServiciosAdminFiltrados(nombre, categoria, activo, precioMin, precioMax);
                int activos;
                int inactivos;
                int categorias;
                CalcularResumen(servicios, out activos, out inactivos, out categorias);

                if (formato == "xlsx")
                {
                    byte[] archivo = ReporteExcelXlsxBuilder.CrearReporteServicios(servicios, DateTime.Now);
                    string nombreArchivo = "KFitness_Reporte_Servicios_" + DateTime.Now.ToString("yyyy-MM-dd") + ".xlsx";

                    context.Response.Clear();
                    context.Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    context.Response.AddHeader("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"");
                    context.Response.AddHeader("X-Content-Type-Options", "nosniff");
                    context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
                    context.Response.BinaryWrite(archivo);
                    context.Response.StatusCode = 200;
                    context.Response.End();
                    return;
                }

                context.Response.StatusCode = 200;
                context.Response.Write(js.Serialize(new
                {
                    success = true,
                    tipo = "servicios",
                    resumen = new
                    {
                        total = servicios.Count,
                        activos = activos,
                        inactivos = inactivos,
                        categorias = categorias
                    },
                    filtros = new
                    {
                        nombre = nombre,
                        categoria = categoria,
                        estado = estado,
                        precioMin = precioMin,
                        precioMax = precioMax
                    },
                    items = servicios,
                    message = "Reporte generado correctamente."
                }));

                return;
            }

            if (tipo == "reservas")
            {
                string servicio = (context.Request.QueryString["servicio"] ?? string.Empty).Trim();
                string estadoReserva = (context.Request.QueryString["estado"] ?? string.Empty).Trim();
                string fechaDesdeRaw = (context.Request.QueryString["fechaDesde"] ?? string.Empty).Trim();
                string fechaHastaRaw = (context.Request.QueryString["fechaHasta"] ?? string.Empty).Trim();

                DateTime? fechaDesde = null;
                if (!string.IsNullOrEmpty(fechaDesdeRaw))
                {
                    DateTime parsedDesde;
                    if (!DateTime.TryParseExact(fechaDesdeRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedDesde))
                    {
                        context.Response.StatusCode = 400;
                        context.Response.Write(js.Serialize(new { success = false, message = "Filtro fecha desde inválido." }));
                        return;
                    }
                    fechaDesde = parsedDesde.Date;
                }

                DateTime? fechaHasta = null;
                if (!string.IsNullOrEmpty(fechaHastaRaw))
                {
                    DateTime parsedHasta;
                    if (!DateTime.TryParseExact(fechaHastaRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedHasta))
                    {
                        context.Response.StatusCode = 400;
                        context.Response.Write(js.Serialize(new { success = false, message = "Filtro fecha hasta inválido." }));
                        return;
                    }
                    fechaHasta = parsedHasta.Date;
                }

                if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde.Value > fechaHasta.Value)
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "La fecha desde no puede ser mayor a la fecha hasta." }));
                    return;
                }

                string estadoNormalizado = string.IsNullOrWhiteSpace(estadoReserva)
                    ? null
                    : estadoReserva.Trim().ToUpperInvariant();

                List<ReservaAdminItem> reservas = RepositorioReservas.ObtenerReservasAdminFiltradas(
                    null,
                    servicio,
                    fechaDesde,
                    fechaHasta,
                    estadoNormalizado);

                ResumenReservasReporte resumenReservas = CalcularResumenReservas(reservas);

                if (formato == "xlsx")
                {
                    byte[] archivo = ReporteExcelXlsxBuilder.CrearReporteReservas(reservas, DateTime.Now);
                    string nombreArchivo = "KFitness_Reporte_Reservas_" + DateTime.Now.ToString("yyyy-MM-dd") + ".xlsx";

                    context.Response.Clear();
                    context.Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    context.Response.AddHeader("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"");
                    context.Response.AddHeader("X-Content-Type-Options", "nosniff");
                    context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
                    context.Response.BinaryWrite(archivo);
                    context.Response.StatusCode = 200;
                    context.Response.End();
                    return;
                }

                List<object> itemsReservas = new List<object>();
                for (int i = 0; i < reservas.Count; i += 1)
                {
                    ReservaAdminItem r = reservas[i] ?? new ReservaAdminItem();
                    itemsReservas.Add(new
                    {
                        idReserva = r.IdReserva,
                        servicio = r.Servicio,
                        usuario = r.Cliente,
                        correo = r.Correo,
                        fechaActividad = r.Fecha.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                        horaInicio = r.HoraInicio.ToString(@"hh\:mm"),
                        estado = r.Estado,
                        fechaCreacion = r.FechaCreacion.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                    });
                }

                context.Response.StatusCode = 200;
                context.Response.Write(js.Serialize(new
                {
                    success = true,
                    tipo = "reservas",
                    resumen = new
                    {
                        total = resumenReservas.Total,
                        confirmadas = resumenReservas.Confirmadas,
                        canceladas = resumenReservas.Canceladas,
                        otrosEstados = resumenReservas.OtrosEstados
                    },
                    filtros = new
                    {
                        servicio = servicio,
                        estado = estadoNormalizado,
                        fechaDesde = fechaDesde.HasValue ? fechaDesde.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : string.Empty,
                        fechaHasta = fechaHasta.HasValue ? fechaHasta.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : string.Empty
                    },
                    items = itemsReservas,
                    message = "Reporte generado correctamente."
                }));

                return;
            }

            if (tipo == "usuarios")
            {
                string busqueda = (context.Request.QueryString["busqueda"] ?? string.Empty).Trim();
                string rolRaw = (context.Request.QueryString["rol"] ?? string.Empty).Trim();
                string estadoUsuario = (context.Request.QueryString["estado"] ?? string.Empty).Trim().ToLowerInvariant();

                int? idRol = null;
                if (!string.IsNullOrEmpty(rolRaw))
                {
                    int parsedRol;
                    if (!int.TryParse(rolRaw, NumberStyles.Integer, CultureInfo.InvariantCulture, out parsedRol) || parsedRol <= 0)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.Write(js.Serialize(new { success = false, message = "Filtro rol inválido." }));
                        return;
                    }
                    idRol = parsedRol;
                }

                bool? activoUsuario = null;
                if (!string.IsNullOrEmpty(estadoUsuario))
                {
                    if (estadoUsuario == "activo") activoUsuario = true;
                    else if (estadoUsuario == "inactivo") activoUsuario = false;
                    else
                    {
                        context.Response.StatusCode = 400;
                        context.Response.Write(js.Serialize(new { success = false, message = "Filtro estado inválido." }));
                        return;
                    }
                }

                List<AdminUsuarioListadoItem> usuarios = RepositorioAdmin.ObtenerUsuariosParaReporte(busqueda, idRol, activoUsuario);

                int total = usuarios.Count;
                int activos = 0;
                int inactivos = 0;
                List<string> rolesUnicos = new List<string>();

                for (int i = 0; i < usuarios.Count; i += 1)
                {
                    AdminUsuarioListadoItem u = usuarios[i] ?? new AdminUsuarioListadoItem();
                    if (u.Activo) activos += 1;
                    else inactivos += 1;

                    string nombreRol = (u.Rol ?? string.Empty).Trim();
                    if (!string.IsNullOrEmpty(nombreRol) && !ContieneTextoIgnorandoMayusculas(rolesUnicos, nombreRol))
                    {
                        rolesUnicos.Add(nombreRol);
                    }
                }

                if (formato == "xlsx")
                {
                    byte[] archivo = ReporteExcelXlsxBuilder.CrearReporteUsuarios(usuarios, DateTime.Now);
                    string nombreArchivo = "KFitness_Reporte_Usuarios_" + DateTime.Now.ToString("yyyy-MM-dd") + ".xlsx";

                    context.Response.Clear();
                    context.Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    context.Response.AddHeader("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"");
                    context.Response.AddHeader("X-Content-Type-Options", "nosniff");
                    context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
                    context.Response.BinaryWrite(archivo);
                    context.Response.StatusCode = 200;
                    context.Response.End();
                    return;
                }

                List<object> itemsUsuarios = new List<object>();
                for (int i = 0; i < usuarios.Count; i += 1)
                {
                    AdminUsuarioListadoItem u = usuarios[i] ?? new AdminUsuarioListadoItem();
                    itemsUsuarios.Add(new
                    {
                        nombreCompleto = u.NombreCompleto,
                        correo = u.Correo,
                        rol = u.Rol,
                        activo = u.Activo,
                        estado = u.Activo ? "Activo" : "Inactivo"
                    });
                }

                context.Response.StatusCode = 200;
                context.Response.Write(js.Serialize(new
                {
                    success = true,
                    tipo = "usuarios",
                    resumen = new
                    {
                        total = total,
                        activos = activos,
                        inactivos = inactivos,
                        roles = rolesUnicos.Count
                    },
                    filtros = new
                    {
                        busqueda = busqueda,
                        rol = idRol.HasValue ? idRol.Value.ToString(CultureInfo.InvariantCulture) : string.Empty,
                        estado = estadoUsuario
                    },
                    items = itemsUsuarios,
                    message = "Reporte generado correctamente."
                }));

                return;
            }

            string nombrePromocion = (context.Request.QueryString["nombre"] ?? string.Empty).Trim();
            string tipoPromocion = (context.Request.QueryString["tipoPromocion"] ?? string.Empty).Trim();
            string estadoPromocion = (context.Request.QueryString["estado"] ?? string.Empty).Trim().ToLowerInvariant();
            string vigencia = (context.Request.QueryString["vigencia"] ?? string.Empty).Trim().ToLowerInvariant();

            bool? promocionActiva = null;
            if (!string.IsNullOrEmpty(estadoPromocion))
            {
                if (estadoPromocion == "activo") promocionActiva = true;
                else if (estadoPromocion == "inactivo") promocionActiva = false;
                else
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(js.Serialize(new { success = false, message = "Filtro estado inválido." }));
                    return;
                }
            }

            if (!string.IsNullOrEmpty(vigencia)
                && vigencia != "vigente"
                && vigencia != "proxima"
                && vigencia != "vencida")
            {
                context.Response.StatusCode = 400;
                context.Response.Write(js.Serialize(new { success = false, message = "Filtro vigencia inválido." }));
                return;
            }

            List<PromocionAdminItem> promociones = RepositorioPromociones.ObtenerPromocionesAdminFiltradas(
                nombrePromocion,
                tipoPromocion,
                promocionActiva,
                vigencia);

            ResumenPromocionesReporte resumenPromociones = CalcularResumenPromociones(promociones, DateTime.Today);

            if (formato == "xlsx")
            {
                byte[] archivo = ReporteExcelXlsxBuilder.CrearReportePromociones(promociones, DateTime.Now);
                string nombreArchivo = "KFitness_Reporte_Promociones_" + DateTime.Now.ToString("yyyy-MM-dd") + ".xlsx";

                context.Response.Clear();
                context.Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                context.Response.AddHeader("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"");
                context.Response.AddHeader("X-Content-Type-Options", "nosniff");
                context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
                context.Response.BinaryWrite(archivo);
                context.Response.StatusCode = 200;
                context.Response.End();
                return;
            }

            List<object> itemsPromociones = new List<object>();
            for (int i = 0; i < promociones.Count; i += 1)
            {
                PromocionAdminItem p = promociones[i] ?? new PromocionAdminItem();
                itemsPromociones.Add(new
                {
                    idPromocion = p.IdPromocion,
                    nombre = p.Nombre,
                    tipoPromocion = p.TipoPromocion,
                    descuento = p.PorcentajeDescuento,
                    cantidadCompra = p.CantidadCompra,
                    cantidadEntrega = p.CantidadEntrega,
                    beneficio = ObtenerBeneficioPromocion(p),
                    fechaInicio = p.FechaInicio.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    fechaFin = p.FechaFin.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    activo = p.Activo,
                    estado = p.Activo ? "Activo" : "Inactivo",
                    vigencia = ObtenerVigenciaPromocion(p, DateTime.Today)
                });
            }

            context.Response.StatusCode = 200;
            context.Response.Write(js.Serialize(new
            {
                success = true,
                tipo = "promociones",
                resumen = new
                {
                    total = resumenPromociones.Total,
                    activas = resumenPromociones.Activas,
                    inactivas = resumenPromociones.Inactivas,
                    vigentes = resumenPromociones.Vigentes
                },
                filtros = new
                {
                    nombre = nombrePromocion,
                    tipoPromocion = tipoPromocion,
                    estado = estadoPromocion,
                    vigencia = vigencia
                },
                items = itemsPromociones,
                message = "Reporte generado correctamente."
            }));
        }
        catch (System.Threading.ThreadAbortException)
        {
        }
        catch (Exception)
        {
            context.Response.SuppressFormsAuthenticationRedirect = true;
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = 500;
            context.Response.Write(js.Serialize(new { success = false, message = "No fue posible generar el reporte solicitado." }));
        }
    }

    private static void CalcularResumen(List<ServicioAdminListadoItem> servicios, out int activos, out int inactivos, out int categorias)
    {
        activos = 0;
        inactivos = 0;
        categorias = 0;

        if (servicios == null)
        {
            return;
        }

        List<string> categoriasUnicas = new List<string>();

        for (int i = 0; i < servicios.Count; i += 1)
        {
            ServicioAdminListadoItem item = servicios[i];
            if (item != null && item.Activo)
            {
                activos += 1;
            }
            else
            {
                inactivos += 1;
            }

            string categoria = item != null ? (item.Categoria ?? string.Empty).Trim() : string.Empty;
            if (!string.IsNullOrEmpty(categoria) && !ContieneTextoIgnorandoMayusculas(categoriasUnicas, categoria))
            {
                categoriasUnicas.Add(categoria);
            }
        }

        categorias = categoriasUnicas.Count;
    }

    private static ResumenPromocionesReporte CalcularResumenPromociones(List<PromocionAdminItem> promociones, DateTime fechaBase)
    {
        ResumenPromocionesReporte resumen = new ResumenPromocionesReporte();

        if (promociones == null)
        {
            return resumen;
        }

        for (int i = 0; i < promociones.Count; i += 1)
        {
            PromocionAdminItem item = promociones[i] ?? new PromocionAdminItem();
            resumen.Total += 1;
            if (item.Activo) resumen.Activas += 1;
            else resumen.Inactivas += 1;

            string vigencia = ObtenerVigenciaPromocion(item, fechaBase);
            if (string.Equals(vigencia, "Vigente", StringComparison.OrdinalIgnoreCase))
            {
                resumen.Vigentes += 1;
            }
        }

        return resumen;
    }

    private static ResumenReservasReporte CalcularResumenReservas(List<ReservaAdminItem> reservas)
    {
        ResumenReservasReporte resumen = new ResumenReservasReporte();

        if (reservas == null)
        {
            return resumen;
        }

        for (int i = 0; i < reservas.Count; i += 1)
        {
            ReservaAdminItem item = reservas[i] ?? new ReservaAdminItem();
            resumen.Total += 1;

            string estado = (item.Estado ?? string.Empty).Trim().ToUpperInvariant();
            if (estado == "CONFIRMADA") resumen.Confirmadas += 1;
            else if (estado == "CANCELADA") resumen.Canceladas += 1;
            else resumen.OtrosEstados += 1;
        }

        return resumen;
    }

    private static string ObtenerVigenciaPromocion(PromocionAdminItem item, DateTime fechaBase)
    {
        DateTime hoy = fechaBase.Date;
        DateTime inicio = item.FechaInicio.Date;
        DateTime fin = item.FechaFin.Date;

        if (hoy < inicio) return "Próxima";
        if (hoy > fin) return "Vencida";
        return "Vigente";
    }

    private static bool ContieneTextoIgnorandoMayusculas(List<string> items, string valor)
    {
        if (items == null || string.IsNullOrWhiteSpace(valor)) return false;

        string buscado = valor.Trim();
        for (int i = 0; i < items.Count; i += 1)
        {
            string actual = (items[i] ?? string.Empty).Trim();
            if (string.Equals(actual, buscado, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static string ObtenerBeneficioPromocion(PromocionAdminItem item)
    {
        string tipo = (item.TipoPromocion ?? string.Empty).Trim().ToUpperInvariant();
        if (tipo == "PORCENTAJE")
        {
            decimal porcentaje = decimal.Round(item.PorcentajeDescuento, 2, MidpointRounding.AwayFromZero);
            return porcentaje.ToString("0.##", CultureInfo.InvariantCulture) + "%";
        }

        if (tipo == "DOS_POR_UNO")
        {
            int compra = item.CantidadCompra.HasValue ? item.CantidadCompra.Value : 0;
            int entrega = item.CantidadEntrega.HasValue ? item.CantidadEntrega.Value : 0;
            return compra.ToString(CultureInfo.InvariantCulture) + "x" + entrega.ToString(CultureInfo.InvariantCulture);
        }

        return string.Empty;
    }
}
