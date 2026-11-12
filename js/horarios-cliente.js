(function () {
  'use strict';

  var state = {
    hoyIso: '',
    mesBase: '',
    fechaSeleccionada: '',
    sesiones: [],
    sesionesPorFecha: {},
    servicios: [],
    filtroServicio: '',
    cargandoSesiones: false,
    errorSesiones: '',
    csrfToken: '',
    reservas: [],
    promociones: [],
    preseleccionServicioId: '',
    preseleccionPromocionId: '',
    promoDraft: null,
    authChecked: false,
    cargandoReserva: false,
    agendaPaginacion: { pagina: 1, pageSize: 10 },
    reservasProximasPaginacion: { pagina: 1, pageSize: 10 },
    reservasHistorialPaginacion: { pagina: 1, pageSize: 10 }
  };

  function byId(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hoyIsoCostaRica() {
    try {
      var parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Costa_Rica',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(new Date());
      var yy = parts.find(function (p) { return p.type === 'year'; });
      var mm = parts.find(function (p) { return p.type === 'month'; });
      var dd = parts.find(function (p) { return p.type === 'day'; });
      if (!yy || !mm || !dd) throw new Error('parts');
      return yy.value + '-' + mm.value + '-' + dd.value;
    } catch (_) {
      var now = new Date();
      var y = now.getFullYear();
      var m = String(now.getMonth() + 1).padStart(2, '0');
      var d = String(now.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + d;
    }
  }

  function formatearFechaLarga(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString('es-CR', {
        timeZone: 'America/Costa_Rica', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (_) {
      return iso;
    }
  }

  function formatearFechaCorta(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_) {
      return iso;
    }
  }

  function formatearMonedaCRC(monto) {
    var value = Number(monto || 0);
    return '₡' + value.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function obtenerParametrosAgendaIniciales() {
    var params = new URLSearchParams(window.location.search || '');
    var idServicio = String(params.get('idServicio') || '').trim();
    var idPromocion = String(params.get('idPromocion') || '').trim();
    return {
      idServicio: /^\d+$/.test(idServicio) ? idServicio : '',
      idPromocion: /^\d+$/.test(idPromocion) ? idPromocion : ''
    };
  }

  function renderPaginacion(baseId, total, paginacion) {
    var wrap = byId(baseId + '-wrap');
    var summary = byId(baseId + '-summary');
    var pageInfo = byId(baseId + '-pageinfo');
    var prev = byId(baseId + '-prev');
    var next = byId(baseId + '-next');
    if (!wrap || !summary || !pageInfo || !prev || !next || !paginacion) return;

    var pageSize = Number(paginacion.pageSize || 10);
    var totalPaginas = total > 0 ? Math.ceil(total / pageSize) : 1;
    if (paginacion.pagina < 1) paginacion.pagina = 1;
    if (paginacion.pagina > totalPaginas) paginacion.pagina = totalPaginas;

    var desde = total > 0 ? ((paginacion.pagina - 1) * pageSize) + 1 : 0;
    var hasta = total > 0 ? Math.min(paginacion.pagina * pageSize, total) : 0;

    summary.textContent = 'Mostrando ' + String(desde) + '–' + String(hasta) + ' de ' + String(total);
    pageInfo.textContent = 'Página ' + String(paginacion.pagina) + ' de ' + String(totalPaginas);
    prev.disabled = paginacion.pagina <= 1;
    next.disabled = paginacion.pagina >= totalPaginas;
    wrap.hidden = total <= pageSize;
  }

  function redirigirLogin() {
    var retorno = window.location.pathname + (window.location.search || '');
    window.location.href = '/login.html?returnUrl=' + encodeURIComponent(retorno);
  }

  function normalizarSesion(item) {
    if (!item) return null;
    return {
      idHorarioServicio: Number(item.idHorarioServicio != null ? item.idHorarioServicio : item.IdHorarioServicio || 0),
      idProducto: Number(item.idProducto != null ? item.idProducto : item.IdProducto || 0),
      servicio: String(item.servicio != null ? item.servicio : item.Servicio || ''),
      categoria: String(item.categoria != null ? item.categoria : item.Categoria || ''),
      fecha: String(item.fecha != null ? item.fecha : item.Fecha || ''),
      horaInicio: String(item.horaInicio != null ? item.horaInicio : item.HoraInicio || ''),
      horaFin: String(item.horaFin != null ? item.horaFin : item.HoraFin || ''),
      capacidadMaxima: Number(item.capacidadMaxima != null ? item.capacidadMaxima : item.CapacidadMaxima || 0),
      reservasConfirmadas: Number(item.reservasConfirmadas != null ? item.reservasConfirmadas : item.ReservasConfirmadas || 0),
      cuposRestantes: Number(item.cuposRestantes != null ? item.cuposRestantes : item.CuposRestantes || 0),
      completo: !!(item.completo != null ? item.completo : item.Completo),
      instructor: String(item.instructor != null ? item.instructor : item.Instructor || '')
    };
  }

  function normalizarPromocion(item) {
    if (!item) return null;
    return {
      idPromocion: Number(item.idPromocion != null ? item.idPromocion : item.IdPromocion || 0),
      idProducto: Number(item.idProducto != null ? item.idProducto : item.IdProducto || 0),
      nombre: String(item.nombre != null ? item.nombre : item.Nombre || ''),
      tipoPromocion: String(item.tipoPromocion != null ? item.tipoPromocion : item.TipoPromocion || ''),
      porcentajeDescuento: Number(item.porcentajeDescuento != null ? item.porcentajeDescuento : item.PorcentajeDescuento || 0),
      cantidadCompra: item.cantidadCompra != null ? Number(item.cantidadCompra) : null,
      cantidadEntrega: item.cantidadEntrega != null ? Number(item.cantidadEntrega) : null,
      precioServicio: Number(item.precioServicio != null ? item.precioServicio : item.PrecioServicio || 0),
      precioPromocional: Number(item.precioPromocional != null ? item.precioPromocional : item.PrecioPromocional || 0),
      permiteReservar: !!(item.permiteReservar != null ? item.permiteReservar : item.PermiteReservar)
    };
  }

  function promocionesPorProducto(idProducto) {
    return (state.promociones || []).filter(function (p) {
      return p && p.permiteReservar && Number(p.idProducto || 0) === Number(idProducto || 0);
    });
  }

  function obtenerPromocionPreferida(idProducto) {
    var promos = promocionesPorProducto(idProducto);
    if (!promos.length) return null;

    if (state.preseleccionPromocionId) {
      var pre = promos.find(function (p) { return String(p.idPromocion) === String(state.preseleccionPromocionId); });
      if (pre) return pre;
    }

    return promos[0];
  }

  function agregarItemCarrito(item) {
    if (!window.KFCarritoStore || typeof window.KFCarritoStore.add !== 'function') {
      throw new Error('No fue posible abrir el carrito en este momento.');
    }

    var result = window.KFCarritoStore.add(item);
    if (!result || !result.success) {
      throw new Error((result && result.message) || 'No fue posible agregar al carrito.');
    }

    return result.item;
  }

  function setEstado(texto, esError) {
    var el = byId('horarios-estado');
    if (!el) return;
    el.textContent = texto || '';
    el.style.color = esError ? '#ffb3b3' : '#c7c9cf';
  }

  function agruparSesionesPorFecha() {
    var map = {};
    state.sesiones.forEach(function (s) {
      var fecha = String(s.fecha || '').substring(0, 10);
      if (!fecha) return;
      if (!map[fecha]) map[fecha] = [];
      map[fecha].push(s);
    });
    Object.keys(map).forEach(function (fecha) {
      map[fecha].sort(function (a, b) {
        return String(a.horaInicio || '').localeCompare(String(b.horaInicio || ''));
      });
    });
    state.sesionesPorFecha = map;
  }

  function renderFiltroServicios() {
    var select = byId('horarios-filtro-servicio');
    if (!select) return;

    var actual = state.filtroServicio || '';
    var serviciosMap = {};
    state.sesiones.forEach(function (s) {
      if (s.idProducto > 0) {
        serviciosMap[String(s.idProducto)] = s.servicio || ('Servicio #' + String(s.idProducto));
      }
    });

    var ids = Object.keys(serviciosMap).sort(function (a, b) {
      return serviciosMap[a].localeCompare(serviciosMap[b], 'es');
    });

    var html = ['<option value="">Todos los servicios</option>'];
    ids.forEach(function (id) {
      html.push('<option value="' + escapeHtml(id) + '">' + escapeHtml(serviciosMap[id]) + '</option>');
    });
    select.innerHTML = html.join('');

    if (actual && select.querySelector('option[value="' + actual + '"]')) {
      select.value = actual;
      return;
    }

    if (actual && !select.querySelector('option[value="' + actual + '"]')) {
      var opt = document.createElement('option');
      opt.value = actual;
      opt.textContent = 'Servicio seleccionado';
      select.appendChild(opt);
      select.value = actual;
      return;
    }

    select.value = '';
    state.filtroServicio = '';
  }

  function renderCalendario() {
    var label = byId('mes-label');
    var grid = byId('cal-grid');
    if (!label || !grid) return;

    var parts = state.mesBase.split('-');
    var year = parseInt(parts[0] || '0', 10);
    var month = parseInt(parts[1] || '0', 10);
    var primerDia = new Date(year, month - 1, 1);
    var ultimoDia = new Date(year, month, 0);
    var offset = (primerDia.getDay() + 6) % 7;

    try {
      var mesTxt = primerDia.toLocaleDateString('es-CR', { month: 'long' });
      label.textContent = mesTxt.charAt(0).toUpperCase() + mesTxt.slice(1) + ' de ' + String(year);
    } catch (_) {
      label.textContent = state.mesBase;
    }

    var html = [
      '<div class="cal-weekday">Lun</div>',
      '<div class="cal-weekday">Mar</div>',
      '<div class="cal-weekday">Mié</div>',
      '<div class="cal-weekday">Jue</div>',
      '<div class="cal-weekday">Vie</div>',
      '<div class="cal-weekday">Sáb</div>',
      '<div class="cal-weekday">Dom</div>'
    ];

    for (var k = 0; k < offset; k += 1) {
      html.push('<div class="cal-day is-empty" aria-hidden="true"></div>');
    }

    for (var d = 1; d <= ultimoDia.getDate(); d += 1) {
      var dia = String(d).padStart(2, '0');
      var iso = String(year) + '-' + String(month).padStart(2, '0') + '-' + dia;
      var sesiones = state.sesionesPorFecha[iso] || [];
      var count = sesiones.length;
      var selected = state.fechaSeleccionada === iso;
      var esHoy = state.hoyIso === iso;
      var aria = 'Día ' + d + (count > 0 ? ', ' + count + ' sesión' + (count === 1 ? '' : 'es') : '');
      if (selected) aria += ', seleccionado';
      if (esHoy) aria += ', hoy';

      html.push([
        '<button type="button" class="cal-day" data-cal-dia="', escapeHtml(iso), '" data-selected="', selected ? '1' : '0', '" aria-label="', escapeHtml(aria), '">',
        '<span class="num">', d, '</span>',
        count > 0 ? '<span class="count"><span class="count-dot" aria-hidden="true"></span>' + count + ' sesión' + (count === 1 ? '' : 'es') + '</span>' : '',
        esHoy ? '<span class="today-dot" aria-hidden="true"></span>' : '',
        '</button>'
      ].join(''));
    }

    grid.innerHTML = html.join('');
  }

  function renderAgenda() {
    var fechaEl = byId('agenda-fecha');
    var totalEl = byId('agenda-total');
    var listEl = byId('agenda-list');
    if (!fechaEl || !totalEl || !listEl) return;

    var fecha = state.fechaSeleccionada;
    var sesiones = state.sesionesPorFecha[fecha] || [];

    fechaEl.textContent = formatearFechaLarga(fecha);
    totalEl.textContent = sesiones.length + ' ' + (sesiones.length === 1 ? 'sesión' : 'sesiones');

    if (state.errorSesiones) {
      renderPaginacion('agenda-pagination', 0, state.agendaPaginacion);
      listEl.innerHTML = [
        '<p class="horarios-empty">No se pudieron cargar los horarios.</p>',
        '<button type="button" class="boton boton-principal" id="horarios-reintentar">Reintentar</button>'
      ].join('');
      return;
    }

    if (!sesiones.length) {
      renderPaginacion('agenda-pagination', 0, state.agendaPaginacion);
      listEl.innerHTML = '<p class="horarios-empty">No hay sesiones para esta fecha.</p>';
      return;
    }

    var total = sesiones.length;
    var pageSize = Number(state.agendaPaginacion.pageSize || 10);
    var totalPaginas = total > 0 ? Math.ceil(total / pageSize) : 1;
    if (state.agendaPaginacion.pagina > totalPaginas) state.agendaPaginacion.pagina = totalPaginas;
    if (state.agendaPaginacion.pagina < 1) state.agendaPaginacion.pagina = 1;

    var inicio = (state.agendaPaginacion.pagina - 1) * pageSize;
    var fin = Math.min(inicio + pageSize, total);
    var paginaItems = sesiones.slice(inicio, fin);

    listEl.innerHTML = paginaItems.map(function (s) {
      var cupos = Number(s.cuposRestantes || 0);
      var completo = s.completo || cupos <= 0;
      var labelReserva = completo ? 'Sin cupos' : 'Reservar';
      var disabled = completo ? ' disabled' : '';
      var profesor = (s.instructor || '').trim() || 'Por definir';
      var promo = obtenerPromocionPreferida(s.idProducto);
      var promoTipo = promo ? String(promo.tipoPromocion || '').toUpperCase() : '';
      var promoNombre = promo ? (promo.nombre || (promoTipo === 'DOS_POR_UNO' ? 'Promoción 2x1' : 'Promoción')) : '';
      var promoPrecio = promo ? Number(promo.precioPromocional || 0) : 0;
      var promoRegular = promo ? Number(promo.precioServicio || 0) : 0;
      var promoClase = promo && String(promo.idPromocion) === String(state.preseleccionPromocionId || '') ? ' mine' : '';
      var promoHtml = promo
        ? '<div class="agenda-actions"><span class="tag' + promoClase + '">' + escapeHtml(promoNombre) + '</span><span class="tag">Regular: ' + escapeHtml(formatearMonedaCRC(promoRegular)) + '</span>'
          + (promoTipo === 'PORCENTAJE' ? '<span class="tag mine">Promo: ' + escapeHtml(formatearMonedaCRC(promoPrecio)) + '</span>' : '<span class="tag mine">Beneficio 2x1</span>')
          + (completo ? '' : '<button type="button" class="boton boton-secundario boton-pequeno" data-aplicar-promocion="' + escapeHtml(String(s.idHorarioServicio)) + '" data-promocion-id="' + escapeHtml(String(promo.idPromocion || 0)) + '">Aplicar promoción</button>')
          + '</div>'
        : '';

      return [
        '<article class="agenda-item">',
        '  <h4>', escapeHtml(s.servicio || ''), '</h4>',
        '  <p>', escapeHtml(String(s.horaInicio || '')), ' - ', escapeHtml(String(s.horaFin || '')), ' · Instructor: ', escapeHtml(profesor), '</p>',
        '  <div class="agenda-actions">',
        '    <span class="tag', completo ? ' full' : '', '">', completo ? 'Completo' : ('Cupos: ' + escapeHtml(String(cupos))), '</span>',
        '    <button type="button" class="boton ', completo ? 'boton-secundario' : 'boton-principal', ' boton-pequeno" data-reservar="', escapeHtml(String(s.idHorarioServicio)), '"', disabled, '>', labelReserva, '</button>',
        '  </div>',
        promoHtml,
        '</article>'
      ].join('');
    }).join('');

    renderPaginacion('agenda-pagination', total, state.agendaPaginacion);
  }

  function ajustarFechaSeleccionadaAlMes() {
    var parts = state.mesBase.split('-');
    var y = parseInt(parts[0] || '0', 10);
    var m = parseInt(parts[1] || '0', 10);
    if (!y || !m) return;

    var last = new Date(y, m, 0).getDate();
    var currentDay = parseInt((state.fechaSeleccionada || '').substring(8, 10) || '1', 10);
    if (!currentDay || currentDay < 1) currentDay = 1;
    if (currentDay > last) currentDay = last;
    state.fechaSeleccionada = String(y) + '-' + String(m).padStart(2, '0') + '-' + String(currentDay).padStart(2, '0');
  }

  function cargarSesiones() {
    state.cargandoSesiones = true;
    state.errorSesiones = '';
    setEstado('Cargando horarios...', false);

    var query = [];
    if (state.filtroServicio) query.push('idProducto=' + encodeURIComponent(state.filtroServicio));
    var url = '/api/schedules.ashx' + (query.length ? '?' + query.join('&') : '');

    return fetch(url, { method: 'GET', credentials: 'same-origin' })
      .then(function (resp) {
        if (!resp.ok) throw new Error('No fue posible cargar sesiones.');
        return resp.json();
      })
      .then(function (data) {
        if (!data || !data.success || !Array.isArray(data.horarios)) {
          throw new Error((data && data.message) || 'No fue posible cargar sesiones.');
        }

        state.sesiones = data.horarios.map(normalizarSesion).filter(function (s) {
          return s && s.idHorarioServicio > 0 && s.fecha;
        });

        agruparSesionesPorFecha();
        renderFiltroServicios();
        renderCalendario();
        renderAgenda();
        setEstado('Horarios actualizados.', false);
      })
      .catch(function (err) {
        state.sesiones = [];
        state.sesionesPorFecha = {};
        state.errorSesiones = (err && err.message) || 'No fue posible cargar sesiones.';
        renderCalendario();
        renderAgenda();
        setEstado(state.errorSesiones, true);
      })
      .finally(function () {
        state.cargandoSesiones = false;
      });
  }

  function cargarPromocionesVigentes() {
    return fetch('/api/promotions.ashx', { method: 'GET', credentials: 'same-origin' })
      .then(function (resp) {
        if (!resp.ok) throw new Error('No fue posible cargar promociones.');
        return resp.json();
      })
      .then(function (data) {
        if (!data || !data.success) throw new Error((data && data.message) || 'No fue posible cargar promociones.');
        state.promociones = (Array.isArray(data.promociones) ? data.promociones : [])
          .map(normalizarPromocion)
          .filter(function (p) { return p && p.idPromocion > 0 && p.idProducto > 0; });
        renderAgenda();
      })
      .catch(function () {
        state.promociones = [];
      });
  }

  function abrirModal(titulo, htmlBody, htmlActions) {
    var overlay = byId('horarios-modal');
    var titleEl = byId('horarios-modal-titulo');
    var bodyEl = byId('horarios-modal-body');
    var actionsEl = byId('horarios-modal-actions');
    if (!overlay || !titleEl || !bodyEl || !actionsEl) return;

    titleEl.textContent = titulo || 'Detalle';
    bodyEl.innerHTML = htmlBody || '';
    actionsEl.innerHTML = htmlActions || '';
    overlay.hidden = false;
  }

  function cerrarModal() {
    var overlay = byId('horarios-modal');
    if (!overlay) return;
    overlay.hidden = true;
  }

  function construirItemCarritoRegular(sesion) {
    var promoRef = obtenerPromocionPreferida(sesion.idProducto);
    var precio = promoRef ? Number(promoRef.precioServicio || 0) : 0;
    return {
      tipo: 'REGULAR',
      idProducto: Number(sesion.idProducto || 0),
      servicio: sesion.servicio || '',
      precioUnitario: precio,
      subtotal: precio,
      descuento: 0,
      total: precio,
      sesiones: [
        {
          idHorarioServicio: Number(sesion.idHorarioServicio || 0),
          fecha: sesion.fecha,
          horaInicio: sesion.horaInicio,
          horaFin: sesion.horaFin,
          instructor: sesion.instructor || '',
          precioServicio: precio
        }
      ]
    };
  }

  function mostrarResumenReserva(sesion) {
    if (!sesion) return;
    var profesor = (sesion.instructor || '').trim() || 'Por definir';
    var item = construirItemCarritoRegular(sesion);
    abrirModal('Agregar al carrito', [
      '<p><strong>Servicio:</strong> ', escapeHtml(sesion.servicio), '</p>',
      '<p><strong>Fecha:</strong> ', escapeHtml(formatearFechaCorta(sesion.fecha)), '</p>',
      '<p><strong>Horario:</strong> ', escapeHtml(sesion.horaInicio), ' - ', escapeHtml(sesion.horaFin), '</p>',
      '<p><strong>Instructor:</strong> ', escapeHtml(profesor), '</p>',
      '<p><strong>Cupos disponibles:</strong> ', escapeHtml(String(sesion.cuposRestantes)), '</p>',
      '<p><strong>Total:</strong> ', escapeHtml(formatearMonedaCRC(item.total)), ' CRC</p>'
    ].join(''), [
      '<button type="button" class="boton boton-secundario" id="modal-cancelar">Cerrar</button>',
      '<button type="button" class="boton boton-principal" id="modal-agregar-carrito-regular" data-id="', escapeHtml(String(sesion.idHorarioServicio)), '">Agregar al carrito</button>'
    ].join(''));
  }

  function guardarCarritoAgenda(item) {
    if (state.cargandoReserva) return;
    state.cargandoReserva = true;

    Promise.all(item.sesiones.map(function (sesion) {
      return fetch('/api/schedules.ashx?validateCart=1&idHorarioServicio=' + encodeURIComponent(sesion.idHorarioServicio), { credentials: 'same-origin' })
        .then(function (resp) {
          return resp.json().then(function (data) {
            if (!resp.ok || !data.success) throw new Error(data.message || 'La sesión ya no está disponible.');
          });
        });
    })).then(function () {
      var agregado = agregarItemCarrito(item);
      state.promoDraft = null;
      mostrarConfirmacionCarrito(agregado);
    }).catch(function (err) {
      abrirModal('No se pudo agregar al carrito', '<p>' + escapeHtml(err.message || 'Intentá nuevamente.') + '</p>', '<button type="button" class="boton boton-principal" id="modal-cerrar-error">Cerrar</button>');
    }).finally(function () {
      state.cargandoReserva = false;
    });
  }

  function mostrarConfirmacionCarrito(item) {
    var sesiones = Array.isArray(item && item.sesiones) ? item.sesiones : [];
    var resumenSesiones = sesiones.map(function (s, idx) {
      return '<p><strong>Sesión ' + String(idx + 1) + ':</strong> ' + escapeHtml(formatearFechaCorta(s.fecha)) + ' · ' + escapeHtml(String(s.horaInicio || '')) + ' - ' + escapeHtml(String(s.horaFin || '')) + '</p>';
    }).join('');

    abrirModal('Ítem agregado al carrito', [
      '<p><strong>Servicio:</strong> ', escapeHtml(item && item.servicio || ''), '</p>',
      resumenSesiones,
      '<p><strong>Total:</strong> ', escapeHtml(formatearMonedaCRC(item && item.total || 0)), ' CRC</p>'
    ].join(''), [
      '<button type="button" class="boton boton-secundario" id="modal-seguir-reservando">Seguir reservando</button>',
      '<button type="button" class="boton boton-principal" id="modal-ir-carrito">Ir al carrito</button>'
    ].join(''));
  }

  function crearItemCarritoPromocion(sesionPrimaria, promocion, sesionSecundaria) {
    var tipo = String(promocion && promocion.tipoPromocion || '').toUpperCase();
    var precioRegular = Number(promocion && promocion.precioServicio || 0);

    if (tipo === 'DOS_POR_UNO') {
      var compra = Number(promocion && promocion.cantidadCompra || 1);
      var entrega = Number(promocion && promocion.cantidadEntrega || 2);
      var subtotal2x1 = precioRegular * entrega;
      var total2x1 = precioRegular * compra;
      return {
        tipo: 'PROMOCION',
        idProducto: Number(sesionPrimaria.idProducto || 0),
        servicio: sesionPrimaria.servicio || '',
        idPromocion: Number(promocion.idPromocion || 0),
        nombrePromocion: promocion.nombre || 'Promoción 2x1',
        tipoPromocion: tipo,
        porcentajeDescuento: 0,
        cantidadCompra: compra,
        cantidadEntrega: entrega,
        precioUnitario: precioRegular,
        subtotal: subtotal2x1,
        descuento: Math.max(0, subtotal2x1 - total2x1),
        total: total2x1,
        sesiones: [
          {
            idHorarioServicio: Number(sesionPrimaria.idHorarioServicio || 0),
            fecha: sesionPrimaria.fecha,
            horaInicio: sesionPrimaria.horaInicio,
            horaFin: sesionPrimaria.horaFin,
            instructor: sesionPrimaria.instructor || '',
            precioServicio: precioRegular
          },
          {
            idHorarioServicio: Number(sesionSecundaria.idHorarioServicio || 0),
            fecha: sesionSecundaria.fecha,
            horaInicio: sesionSecundaria.horaInicio,
            horaFin: sesionSecundaria.horaFin,
            instructor: sesionSecundaria.instructor || '',
            precioServicio: precioRegular
          }
        ]
      };
    }

    var porcentaje = Number(promocion && promocion.porcentajeDescuento || 0);
    var total = Number(promocion && promocion.precioPromocional || 0);
    return {
      tipo: 'PROMOCION',
      idProducto: Number(sesionPrimaria.idProducto || 0),
      servicio: sesionPrimaria.servicio || '',
      idPromocion: Number(promocion.idPromocion || 0),
      nombrePromocion: promocion.nombre || 'Promoción',
      tipoPromocion: tipo,
      porcentajeDescuento: porcentaje,
      precioUnitario: precioRegular,
      subtotal: precioRegular,
      descuento: Math.max(0, precioRegular - total),
      total: total,
      sesiones: [
        {
          idHorarioServicio: Number(sesionPrimaria.idHorarioServicio || 0),
          fecha: sesionPrimaria.fecha,
          horaInicio: sesionPrimaria.horaInicio,
          horaFin: sesionPrimaria.horaFin,
          instructor: sesionPrimaria.instructor || '',
          precioServicio: precioRegular
        }
      ]
    };
  }

  function iniciarAplicarPromocion(sesion, promocion) {
    if (!sesion || !promocion) return;

    var tipo = String(promocion.tipoPromocion || '').toUpperCase();
    if (tipo === 'DOS_POR_UNO') {
      var elegibles = (state.sesiones || []).filter(function (x) {
        return x
          && Number(x.idProducto || 0) === Number(sesion.idProducto || 0)
          && Number(x.idHorarioServicio || 0) !== Number(sesion.idHorarioServicio || 0)
          && !x.completo
          && Number(x.cuposRestantes || 0) > 0;
      });

      if (!elegibles.length) {
        abrirModal('Promoción 2x1', '<p>No hay una segunda sesión elegible con cupo para esta promoción.</p>', '<button type="button" class="boton boton-principal" id="modal-cerrar-error">Cerrar</button>');
        return;
      }

      state.promoDraft = {
        sesionPrimaria: sesion,
        promocion: promocion,
        sesionSecundaria: null
      };

      var opciones = elegibles.map(function (x) {
        return '<button type="button" class="boton boton-secundario boton-pequeno" data-promo-secundaria="' + escapeHtml(String(x.idHorarioServicio)) + '">'
          + escapeHtml(formatearFechaCorta(x.fecha)) + ' · ' + escapeHtml(String(x.horaInicio || '')) + ' - ' + escapeHtml(String(x.horaFin || ''))
          + '</button>';
      }).join('');

      abrirModal('Promoción 2x1 · Elegí la segunda sesión', [
        '<p><strong>Servicio:</strong> ', escapeHtml(sesion.servicio || ''), '</p>',
        '<p><strong>Sesión 1:</strong> ', escapeHtml(formatearFechaCorta(sesion.fecha)), ' · ', escapeHtml(String(sesion.horaInicio || '')), ' - ', escapeHtml(String(sesion.horaFin || '')), '</p>',
        '<p>Seleccioná la sesión elegible para completar el 2x1:</p>',
        '<div class="agenda-actions">', opciones, '</div>'
      ].join(''), '<button type="button" class="boton boton-secundario" id="modal-cancelar">Cancelar</button>');
      return;
    }

    var itemPorcentaje = crearItemCarritoPromocion(sesion, promocion, null);
    state.promoDraft = {
      sesionPrimaria: sesion,
      promocion: promocion,
      sesionSecundaria: null
    };
    abrirModal('Aplicar promoción', [
      '<p><strong>Servicio:</strong> ', escapeHtml(sesion.servicio || ''), '</p>',
      '<p><strong>Sesión:</strong> ', escapeHtml(formatearFechaCorta(sesion.fecha)), ' · ', escapeHtml(String(sesion.horaInicio || '')), ' - ', escapeHtml(String(sesion.horaFin || '')), '</p>',
      '<p><strong>Promoción:</strong> ', escapeHtml(promocion.nombre || 'Promoción'), '</p>',
      '<p><strong>Subtotal:</strong> ', escapeHtml(formatearMonedaCRC(itemPorcentaje.subtotal)), ' CRC</p>',
      '<p><strong>Descuento:</strong> ', escapeHtml(formatearMonedaCRC(itemPorcentaje.descuento)), ' CRC</p>',
      '<p><strong>Total:</strong> ', escapeHtml(formatearMonedaCRC(itemPorcentaje.total)), ' CRC</p>'
    ].join(''), [
      '<button type="button" class="boton boton-secundario" id="modal-cancelar">Cancelar</button>',
      '<button type="button" class="boton boton-principal" id="modal-confirmar-carrito-promocion">Agregar al carrito</button>'
    ].join(''));
  }

  function renderMisReservas() {
    var prox = byId('reservas-proximas');
    var hist = byId('reservas-historial');
    if (!prox || !hist) return;

    if (!state.authChecked && !state.csrfToken) {
      renderPaginacion('reservas-proximas-pagination', 0, state.reservasProximasPaginacion);
      renderPaginacion('reservas-historial-pagination', 0, state.reservasHistorialPaginacion);
      prox.innerHTML = '<p class="horarios-empty">Iniciá sesión para ver tus reservas.</p>';
      hist.innerHTML = '<p class="horarios-empty">Sin datos.</p>';
      return;
    }

    var ahora = new Date();
    var items = (state.reservas || []).slice();
    items.sort(function (a, b) {
      var af = new Date(String(a.fecha || '') + 'T' + String(a.horaInicio || '00:00') + ':00').getTime();
      var bf = new Date(String(b.fecha || '') + 'T' + String(b.horaInicio || '00:00') + ':00').getTime();
      return af - bf;
    });

    var proximas = [];
    var historial = [];

    items.forEach(function (r) {
      var fechaHora = new Date(String(r.fecha || '') + 'T' + String(r.horaInicio || '00:00') + ':00');
      var cancelada = String(r.estado || '').toUpperCase() === 'CANCELADA';
      if (!cancelada && fechaHora >= ahora) proximas.push(r);
      else historial.push(r);
    });

    function renderListaPaginada(lista, vacio, paginacion, baseId) {
      var total = lista.length;
      var pageSize = Number((paginacion && paginacion.pageSize) || 10);
      var totalPaginas = total > 0 ? Math.ceil(total / pageSize) : 1;
      if (paginacion.pagina > totalPaginas) paginacion.pagina = totalPaginas;
      if (paginacion.pagina < 1) paginacion.pagina = 1;

      renderPaginacion(baseId, total, paginacion);

      if (!lista.length) return '<p class="horarios-empty">' + escapeHtml(vacio) + '</p>';

      var inicio = (paginacion.pagina - 1) * pageSize;
      var fin = Math.min(inicio + pageSize, total);
      var paginaItems = lista.slice(inicio, fin);

      return paginaItems.map(function (r) {
        var profesor = (r.instructor || '').trim() || 'Por definir';
        var estado = String(r.estado || 'CONFIRMADA').toUpperCase();
        var permitirCancelar = estado !== 'CANCELADA';
        var promo = r.idOperacionPromocional ? '<span class="tag mine">Promoción aplicada</span>' : '';
        return [
          '<article class="reserva-item">',
          '<p><strong>', escapeHtml(r.servicio || ''), '</strong></p>',
          '<p>', escapeHtml(formatearFechaCorta(r.fecha)), ' · ', escapeHtml(String(r.horaInicio || '')), ' - ', escapeHtml(String(r.horaFin || '')), '</p>',
          '<p>Instructor: ', escapeHtml(profesor), '</p>',
          '<div class="agenda-actions">',
          '<span class="tag', estado === 'CANCELADA' ? ' expired' : '', '">', escapeHtml(estado), '</span>', promo,
          '<button type="button" class="boton boton-secundario boton-pequeno" data-reserva-detalle="', escapeHtml(String(r.idReserva || 0)), '">Ver detalle</button>',
          permitirCancelar ? '<button type="button" class="boton boton-secundario boton-pequeno" data-reserva-cancelar="' + escapeHtml(String(r.idReserva || 0)) + '">Cancelar</button>' : '',
          '</div>',
          '</article>'
        ].join('');
      }).join('');
    }

    prox.innerHTML = renderListaPaginada(proximas, 'No tenés reservas próximas.', state.reservasProximasPaginacion, 'reservas-proximas-pagination');
    hist.innerHTML = renderListaPaginada(historial, 'Sin historial por ahora.', state.reservasHistorialPaginacion, 'reservas-historial-pagination');
  }

  function cargarMisReservas(silencioso) {
    return fetch('/api/reservations.ashx', { method: 'GET', credentials: 'same-origin' })
      .then(function (resp) {
        if (resp.status === 401) {
          state.authChecked = false;
          state.csrfToken = '';
          state.reservas = [];
          renderMisReservas();
          return null;
        }
        if (!resp.ok) throw new Error('No fue posible cargar tus reservas.');
        return resp.json();
      })
      .then(function (data) {
        if (!data) return;
        if (!data.success) throw new Error(data.message || 'No fue posible cargar tus reservas.');
        state.authChecked = true;
        state.csrfToken = data.csrfToken || '';
        state.reservas = Array.isArray(data.reservas) ? data.reservas : [];
        renderMisReservas();
      })
      .catch(function (err) {
        if (!silencioso) {
          var prox = byId('reservas-proximas');
          var hist = byId('reservas-historial');
          if (prox) prox.innerHTML = '<p class="horarios-empty">' + escapeHtml((err && err.message) || 'No fue posible cargar tus reservas.') + '</p>';
          if (hist) hist.innerHTML = '<p class="horarios-empty">Reintentá más tarde.</p>';
        }
      });
  }

  function cancelarReserva(idReserva) {
    if (!idReserva) return;
    if (!state.csrfToken) {
      abrirModal('Acción no disponible', '<p>No se pudo validar tu sesión. Volvé a iniciar sesión.</p>', '<button type="button" class="boton boton-principal" id="modal-login">Ir a login</button>');
      return;
    }

    if (!window.confirm('¿Deseas cancelar esta reserva?')) return;

    fetch('/api/reservations-cancel.ashx', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-CSRF-Token': state.csrfToken
      },
      body: JSON.stringify({ idReserva: Number(idReserva) })
    })
      .then(function (resp) {
        return resp.json().catch(function () { return { success: false, message: 'Respuesta inválida del servidor.' }; })
          .then(function (data) { return { status: resp.status, data: data }; });
      })
      .then(function (result) {
        if (result.status === 401) {
          redirigirLogin();
          return;
        }
        if (!result.data || !result.data.success) {
          throw new Error((result.data && result.data.message) || 'No fue posible cancelar la reserva.');
        }
        return Promise.all([cargarMisReservas(true), cargarSesiones()]).then(function () {
          abrirModal('Reserva cancelada', '<p>' + escapeHtml(result.data.message || 'La reserva fue cancelada.') + '</p>', '<button type="button" class="boton boton-principal" id="modal-cerrar-cancel">Aceptar</button>');
        });
      })
      .catch(function (err) {
        abrirModal('No se pudo cancelar', '<p>' + escapeHtml((err && err.message) || 'No fue posible cancelar la reserva.') + '</p>', '<button type="button" class="boton boton-principal" id="modal-cerrar-error">Cerrar</button>');
      });
  }

  function mostrarDetalleReserva(idReserva) {
    var reserva = (state.reservas || []).find(function (r) { return Number(r.idReserva || 0) === Number(idReserva || 0); });
    if (!reserva) return;
    var promo = reserva.idOperacionPromocional ? '<p><strong>Promoción:</strong> ' + escapeHtml(reserva.beneficioPromocion || 'Aplicada') + '</p>' : '';
    abrirModal('Detalle de reserva', [
      '<p><strong>Servicio:</strong> ', escapeHtml(reserva.servicio || ''), '</p>',
      '<p><strong>Fecha:</strong> ', escapeHtml(formatearFechaCorta(reserva.fecha)), '</p>',
      '<p><strong>Horario:</strong> ', escapeHtml(String(reserva.horaInicio || '')), ' - ', escapeHtml(String(reserva.horaFin || '')), '</p>',
      '<p><strong>Estado:</strong> ', escapeHtml(String(reserva.estado || 'CONFIRMADA').toUpperCase()), '</p>',
      promo
    ].join(''), '<button type="button" class="boton boton-principal" id="modal-cerrar-detalle">Cerrar</button>');
  }

  function mostrarTab(tab) {
    var esCal = tab !== 'mis-reservas';
    var btnCal = byId('tab-calendario');
    var btnRes = byId('tab-mis-reservas');
    var vistaCal = byId('vista-calendario');
    var vistaRes = byId('vista-mis-reservas');

    if (btnCal) btnCal.setAttribute('aria-selected', esCal ? 'true' : 'false');
    if (btnRes) btnRes.setAttribute('aria-selected', esCal ? 'false' : 'true');
    if (vistaCal) vistaCal.classList.toggle('hidden', !esCal);
    if (vistaRes) vistaRes.classList.toggle('hidden', esCal);
  }

  function moverMes(delta) {
    var parts = state.mesBase.split('-');
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1 + delta, 1);
    state.mesBase = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    ajustarFechaSeleccionadaAlMes();
    state.agendaPaginacion.pagina = 1;
    renderCalendario();
    renderAgenda();
  }

  function enlazarEventos() {
    var grid = byId('cal-grid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-cal-dia]');
        if (!btn) return;
        var iso = btn.getAttribute('data-cal-dia');
        if (!iso) return;
        state.fechaSeleccionada = iso;
        state.mesBase = iso.substring(0, 7);
        state.agendaPaginacion.pagina = 1;
        renderCalendario();
        renderAgenda();
      });
    }

    var prev = byId('mes-anterior');
    var next = byId('mes-siguiente');
    var hoy = byId('ir-hoy');
    if (prev) prev.addEventListener('click', function () { moverMes(-1); });
    if (next) next.addEventListener('click', function () { moverMes(1); });
    if (hoy) {
      hoy.addEventListener('click', function () {
        state.fechaSeleccionada = state.hoyIso;
        state.mesBase = state.hoyIso.substring(0, 7);
        state.agendaPaginacion.pagina = 1;
        renderCalendario();
        renderAgenda();
      });
    }

    var filtro = byId('horarios-filtro-servicio');
    if (filtro) {
      filtro.addEventListener('change', function () {
        state.filtroServicio = filtro.value || '';
        state.agendaPaginacion.pagina = 1;
        cargarSesiones();
      });
    }

    var btnTabCal = byId('tab-calendario');
    var btnTabRes = byId('tab-mis-reservas');
    if (btnTabCal) btnTabCal.addEventListener('click', function () { mostrarTab('calendario'); });
    if (btnTabRes) btnTabRes.addEventListener('click', function () {
      mostrarTab('mis-reservas');
      cargarMisReservas(true);
    });

    var agenda = byId('agenda-list');
    if (agenda) {
      agenda.addEventListener('click', function (e) {
        var retry = e.target.closest('#horarios-reintentar');
        if (retry) {
          cargarSesiones();
          return;
        }

        var btnRes = e.target.closest('[data-reservar]');
        if (btnRes) {
          var id = Number(btnRes.getAttribute('data-reservar') || 0);
          var sesion = state.sesiones.find(function (s) { return Number(s.idHorarioServicio) === id; });
          if (!sesion || sesion.completo || sesion.cuposRestantes <= 0) return;
          mostrarResumenReserva(sesion);
          return;
        }

        var btnPromo = e.target.closest('[data-aplicar-promocion]');
        if (!btnPromo) return;
        var idSesionPromo = Number(btnPromo.getAttribute('data-aplicar-promocion') || 0);
        var idPromocion = Number(btnPromo.getAttribute('data-promocion-id') || 0);
        var sesionPromo = state.sesiones.find(function (s) { return Number(s.idHorarioServicio) === idSesionPromo; });
        var promo = (state.promociones || []).find(function (p) { return Number(p.idPromocion || 0) === idPromocion; });
        if (!sesionPromo || !promo) return;
        iniciarAplicarPromocion(sesionPromo, promo);
      });
    }

    var modal = byId('horarios-modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          cerrarModal();
          return;
        }

        if (e.target.closest('#horarios-modal-cerrar,#modal-cancelar,#modal-cerrar-ok,#modal-cerrar-error,#modal-cerrar-cancel,#modal-cerrar-detalle')) {
          cerrarModal();
          return;
        }

        var btnAgregarRegular = e.target.closest('#modal-agregar-carrito-regular');
        if (btnAgregarRegular) {
          var idHorarioRegular = Number(btnAgregarRegular.getAttribute('data-id') || 0);
          var sesionRegular = state.sesiones.find(function (s) { return Number(s.idHorarioServicio) === idHorarioRegular; });
          if (!sesionRegular) return;
          try {
            guardarCarritoAgenda(construirItemCarritoRegular(sesionRegular));
          } catch (errRegular) {
            abrirModal('No se pudo agregar al carrito', '<p>' + escapeHtml((errRegular && errRegular.message) || 'Intenta nuevamente.') + '</p>', '<button type="button" class="boton boton-principal" id="modal-cerrar-error">Cerrar</button>');
          }
          return;
        }

        var btnSecundaria = e.target.closest('[data-promo-secundaria]');
        if (btnSecundaria && state.promoDraft && state.promoDraft.sesionPrimaria && state.promoDraft.promocion) {
          var idSec = Number(btnSecundaria.getAttribute('data-promo-secundaria') || 0);
          var sec = state.sesiones.find(function (x) { return Number(x.idHorarioServicio) === idSec; });
          if (!sec) return;
          state.promoDraft.sesionSecundaria = sec;
          var item2x1 = crearItemCarritoPromocion(state.promoDraft.sesionPrimaria, state.promoDraft.promocion, sec);
          abrirModal('Resumen promoción 2x1', [
            '<p><strong>Servicio:</strong> ' + escapeHtml(item2x1.servicio || '') + '</p>',
            '<p><strong>Sesión 1:</strong> ' + escapeHtml(formatearFechaCorta(item2x1.sesiones[0].fecha)) + ' · ' + escapeHtml(item2x1.sesiones[0].horaInicio) + ' - ' + escapeHtml(item2x1.sesiones[0].horaFin) + '</p>',
            '<p><strong>Sesión 2:</strong> ' + escapeHtml(formatearFechaCorta(item2x1.sesiones[1].fecha)) + ' · ' + escapeHtml(item2x1.sesiones[1].horaInicio) + ' - ' + escapeHtml(item2x1.sesiones[1].horaFin) + '</p>',
            '<p><strong>Subtotal:</strong> ' + escapeHtml(formatearMonedaCRC(item2x1.subtotal)) + ' CRC</p>',
            '<p><strong>Descuento:</strong> ' + escapeHtml(formatearMonedaCRC(item2x1.descuento)) + ' CRC</p>',
            '<p><strong>Total:</strong> ' + escapeHtml(formatearMonedaCRC(item2x1.total)) + ' CRC</p>'
          ].join(''), [
            '<button type="button" class="boton boton-secundario" id="modal-cancelar">Cancelar</button>',
            '<button type="button" class="boton boton-principal" id="modal-confirmar-carrito-promocion">Agregar al carrito</button>'
          ].join(''));
          return;
        }

        if (e.target.closest('#modal-confirmar-carrito-promocion')) {
          if (!state.promoDraft || !state.promoDraft.sesionPrimaria || !state.promoDraft.promocion) return;
          var tipoPromoDraft = String(state.promoDraft.promocion.tipoPromocion || '').toUpperCase();
          if (tipoPromoDraft === 'DOS_POR_UNO' && !state.promoDraft.sesionSecundaria) return;
          try {
            var itemPromo = crearItemCarritoPromocion(state.promoDraft.sesionPrimaria, state.promoDraft.promocion, state.promoDraft.sesionSecundaria || null);
            guardarCarritoAgenda(itemPromo);
          } catch (errPromo) {
            abrirModal('No se pudo agregar al carrito', '<p>' + escapeHtml((errPromo && errPromo.message) || 'Intenta nuevamente.') + '</p>', '<button type="button" class="boton boton-principal" id="modal-cerrar-error">Cerrar</button>');
          }
          return;
        }

        if (e.target.closest('#modal-ir-carrito')) {
          window.location.href = '/carrito.html';
          return;
        }

        if (e.target.closest('#modal-seguir-reservando')) {
          cerrarModal();
          return;
        }

        if (e.target.closest('#modal-login')) {
          redirigirLogin();
        }
      });
    }

    var agendaPrev = byId('agenda-pagination-prev');
    var agendaNext = byId('agenda-pagination-next');
    if (agendaPrev) {
      agendaPrev.addEventListener('click', function () {
        if (state.agendaPaginacion.pagina <= 1) return;
        state.agendaPaginacion.pagina -= 1;
        renderAgenda();
      });
    }
    if (agendaNext) {
      agendaNext.addEventListener('click', function () {
        var sesionesDia = state.sesionesPorFecha[state.fechaSeleccionada] || [];
        var totalPaginasAgenda = sesionesDia.length > 0 ? Math.ceil(sesionesDia.length / Number(state.agendaPaginacion.pageSize || 10)) : 1;
        if (state.agendaPaginacion.pagina >= totalPaginasAgenda) return;
        state.agendaPaginacion.pagina += 1;
        renderAgenda();
      });
    }

    var proxPrev = byId('reservas-proximas-pagination-prev');
    var proxNext = byId('reservas-proximas-pagination-next');
    var histPrev = byId('reservas-historial-pagination-prev');
    var histNext = byId('reservas-historial-pagination-next');

    if (proxPrev) {
      proxPrev.addEventListener('click', function () {
        if (state.reservasProximasPaginacion.pagina <= 1) return;
        state.reservasProximasPaginacion.pagina -= 1;
        renderMisReservas();
      });
    }
    if (proxNext) {
      proxNext.addEventListener('click', function () {
        state.reservasProximasPaginacion.pagina += 1;
        renderMisReservas();
      });
    }
    if (histPrev) {
      histPrev.addEventListener('click', function () {
        if (state.reservasHistorialPaginacion.pagina <= 1) return;
        state.reservasHistorialPaginacion.pagina -= 1;
        renderMisReservas();
      });
    }
    if (histNext) {
      histNext.addEventListener('click', function () {
        state.reservasHistorialPaginacion.pagina += 1;
        renderMisReservas();
      });
    }

    var bloques = [byId('reservas-proximas'), byId('reservas-historial')];
    bloques.forEach(function (el) {
      if (!el) return;
      el.addEventListener('click', function (e) {
        var detalle = e.target.closest('[data-reserva-detalle]');
        if (detalle) {
          mostrarDetalleReserva(Number(detalle.getAttribute('data-reserva-detalle') || 0));
          return;
        }
        var cancelar = e.target.closest('[data-reserva-cancelar]');
        if (cancelar) {
          cancelarReserva(Number(cancelar.getAttribute('data-reserva-cancelar') || 0));
        }
      });
    });
  }

  function init() {
    if (!byId('horarios-cliente')) return;

    var params = obtenerParametrosAgendaIniciales();

    state.hoyIso = hoyIsoCostaRica();
    state.fechaSeleccionada = state.hoyIso;
    state.mesBase = state.hoyIso.substring(0, 7);
    state.preseleccionServicioId = params.idServicio || '';
    state.preseleccionPromocionId = params.idPromocion || '';
    if (state.preseleccionServicioId) {
      state.filtroServicio = state.preseleccionServicioId;
    }

    mostrarTab('calendario');
    renderCalendario();
    renderAgenda();
    enlazarEventos();

    Promise.all([
      cargarPromocionesVigentes(),
      cargarSesiones(),
      cargarMisReservas(true)
    ]).then(function () {
      if (state.preseleccionPromocionId) {
        setEstado('Promoción preseleccionada lista para aplicar en Agenda.', false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
