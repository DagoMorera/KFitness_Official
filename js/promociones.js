function escapeHtmlPromo(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizarNombreArchivoImagen(valor) {
  var referencia = String(valor || '').trim();
  if (!referencia) return '';

  try {
    var match = referencia.match(/[?&]v=([^&]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).split(/[\\/]/).pop() || '';
    }
  } catch (_) { }

  var sinQuery = referencia.split('?')[0];
  return sinQuery.split(/[\\/]/).pop() || '';
}

function obtenerRutaImagenPromo(item) {
  var promo = item || {};

  var urlPromocion = String(promo.imagenPromocionUrl || '').trim();
  if (urlPromocion) {
    if (/^https?:\/\//i.test(urlPromocion)) return urlPromocion;
    if (urlPromocion.charAt(0) === '/') return urlPromocion;
    return '/' + urlPromocion.replace(/^\.+\//, '');
  }

  var archivoPromocion = normalizarNombreArchivoImagen(promo.imagenPromocion);
  if (archivoPromocion) {
    return '/api/promotion-image.ashx?v=' + encodeURIComponent(archivoPromocion);
  }

  var referenciaServicio = String(promo.imagenServicio || '').trim();
  if (/^\/?img\/[a-z0-9._-]+$/i.test(referenciaServicio)) return '/' + referenciaServicio.replace(/^\//, '');
  if (/^https?:\/\//i.test(referenciaServicio)) return referenciaServicio;

  if (/service-image\.ashx/i.test(referenciaServicio)) {
    var archivoDesdeServicio = normalizarNombreArchivoImagen(referenciaServicio);
    if (archivoDesdeServicio) {
      return '/api/service-image.ashx?v=' + encodeURIComponent(archivoDesdeServicio);
    }
  }

  var archivoServicio = normalizarNombreArchivoImagen(referenciaServicio);
  if (archivoServicio) {
    return '/api/service-image.ashx?v=' + encodeURIComponent(archivoServicio);
  }

  return '/img/evento-default.jpg';
}

function formatearMonedaPromo(monto) {
  return Number(monto || 0).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildReservaUrl(item) {
  var idServicio = Number(item && item.idProducto ? item.idProducto : 0);
  var idPromocion = Number(item && item.idPromocion ? item.idPromocion : 0);
  var params = new URLSearchParams();
  if (idServicio > 0) params.set('idServicio', String(idServicio));
  if (idPromocion > 0) params.set('idPromocion', String(idPromocion));
  var query = params.toString();
  return '/horarios.html' + (query ? '?' + query : '');
}

function formatearFechaPromo(fechaIso) {
  var fecha = new Date(String(fechaIso || '') + 'T00:00:00');
  if (Number.isNaN(fecha.getTime())) return String(fechaIso || '');
  return fecha.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function beneficioPromo(item) {
  if (item.beneficio) return item.beneficio;
  var tipo = String(item.tipoPromocion || '').toUpperCase();
  if (tipo === 'DOS_POR_UNO') {
    var compra = item.cantidadCompra != null ? Number(item.cantidadCompra) : 1;
    var entrega = item.cantidadEntrega != null ? Number(item.cantidadEntrega) : 2;
    return entrega + ' clases por el precio de ' + compra;
  }

  var descuento = Number(item.porcentajeDescuento || 0);
  return descuento.toFixed(2).replace(/\.00$/, '') + '% de descuento';
}

function etiquetaPromocion(item) {
  if (item.clave === 'primera-valoracion-gratuita') return 'Valoración gratuita';
  if (item.soloConsulta) return 'Plan de entrenamiento';
  return item.tipoPromocion === 'DOS_POR_UNO' ? '2x1' : 'Porcentaje';
}

function accionPromocion(item) {
  if (item.usoAgotado) return '<p class="promo-beneficio" role="status">Ya utilizaste tu primera valoración gratuita.</p>';
  if (item.soloConsulta) {
    var asunto = 'Consulta sobre el ' + String(item.nombre || 'plan').replace(/^./, function (c) { return c.toLowerCase(); });
    return '<a class="boton boton-secundario" href="/contacto.html?asunto=' + encodeURIComponent(asunto) + '">Consultar plan</a>';
  }
  if (item.permiteReservar) {
    return '<a class="boton boton-secundario" href="' + escapeHtmlPromo(buildReservaUrl(item)) + '">Reservar ahora</a>';
  }
  return '<button class="boton boton-secundario" type="button" disabled>Reservar ahora</button>';
}

function vigenciaPromocion(item) {
  var inicio = formatearFechaPromo(item.fechaInicio);
  return item.fechaFin ? inicio + ' al ' + formatearFechaPromo(item.fechaFin) : 'Desde ' + inicio;
}

function setMensajePromociones(texto, esError) {
  var msg = document.getElementById('promociones-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#f2f2f2';
}

var promocionesState = {
  items: [],
  pagina: 1,
  pageSize: 6
};

function renderPaginacionPromociones(total, pagina, pageSize) {
  var wrap = document.getElementById('promociones-pagination-wrap');
  var summary = document.getElementById('promociones-pagination-summary');
  var pageInfo = document.getElementById('promociones-pagination-pageinfo');
  var prev = document.getElementById('promociones-pagination-prev');
  var next = document.getElementById('promociones-pagination-next');
  if (!wrap || !summary || !pageInfo || !prev || !next) return;

  var totalPaginas = total > 0 ? Math.ceil(total / pageSize) : 1;
  var actual = pagina;
  if (actual < 1) actual = 1;
  if (actual > totalPaginas) actual = totalPaginas;

  var desde = total > 0 ? ((actual - 1) * pageSize) + 1 : 0;
  var hasta = total > 0 ? Math.min(actual * pageSize, total) : 0;

  summary.textContent = 'Mostrando ' + String(desde) + '–' + String(hasta) + ' de ' + String(total);
  pageInfo.textContent = 'Página ' + String(actual) + ' de ' + String(totalPaginas);
  prev.disabled = actual <= 1;
  next.disabled = actual >= totalPaginas;
  wrap.hidden = total <= pageSize;
}

function renderPromociones(items) {
  var listado = document.getElementById('promociones-listado');
  if (!listado) return;

  promocionesState.items = Array.isArray(items) ? items.slice() : [];
  var total = promocionesState.items.length;
  var pageSize = promocionesState.pageSize;
  var totalPaginas = total > 0 ? Math.ceil(total / pageSize) : 1;
  if (promocionesState.pagina > totalPaginas) promocionesState.pagina = totalPaginas;
  if (promocionesState.pagina < 1) promocionesState.pagina = 1;

  if (!promocionesState.items.length) {
    renderPaginacionPromociones(0, 1, pageSize);
    listado.innerHTML = '<article class="tarjeta promocion promo-card-vacia"><h3>Sin promociones vigentes</h3><p>No hay promociones activas dentro del período de vigencia.</p></article>';
    return;
  }

  var inicio = (promocionesState.pagina - 1) * pageSize;
  var fin = Math.min(inicio + pageSize, total);
  var paginaItems = promocionesState.items.slice(inicio, fin);

  listado.innerHTML = paginaItems.map(function (item) {
    var tipo = String(item.tipoPromocion || '').toUpperCase();
    var esDosPorUno = tipo === 'DOS_POR_UNO';
    var imagen = obtenerRutaImagenPromo(item);
    var precioRegular = Number(item.precioServicio || 0);
    var precioPromo = Number(item.precioPromocional || 0);

    return [
      '<article class="tarjeta promocion promo-card">',
      '<div class="promo-media">',
      '<button class="promo-media-trigger" type="button" data-promocion-detalle="', escapeHtmlPromo(String(item.idPromocion || 0)), '" aria-label="Ver detalle de ', escapeHtmlPromo(item.nombre || 'promoción'), '">',
      '<img src="', escapeHtmlPromo(imagen), '" alt="', escapeHtmlPromo(item.servicio || item.nombre || 'Servicio'), '" loading="lazy" onerror="this.onerror=null;this.src=\'/img/evento-default.jpg\';">',
      '</button>',
      '</div>',
      '<div class="promo-contenido">',
      '<p class="promo-categoria">', escapeHtmlPromo(etiquetaPromocion(item)), '</p>',
      '<button class="promo-titulo" type="button" data-promocion-detalle="', escapeHtmlPromo(String(item.idPromocion || 0)), '">', escapeHtmlPromo(item.nombre || ''), '</button>',
      '<p class="promo-descripcion">', escapeHtmlPromo(item.descripcion || ''), '</p>',
      '<p class="promo-beneficio">', escapeHtmlPromo(beneficioPromo(item)), '</p>',
      '<p class="promo-servicio"><strong>Servicio:</strong> ', escapeHtmlPromo(item.servicio || ''), '</p>',
      item.soloConsulta ? '' : '<p class="promo-precio"><strong>Precio regular:</strong> CRC ' + escapeHtmlPromo(formatearMonedaPromo(precioRegular)) + '</p>',
      item.soloConsulta ? '' : !esDosPorUno ? '<p class="promo-precio promo-precio-descuento"><strong>Precio promocional:</strong> CRC ' + escapeHtmlPromo(formatearMonedaPromo(precioPromo)) + '</p>' : '<p class="promo-precio promo-precio-descuento"><strong>Beneficio:</strong> Reserva promocional 2x1 disponible.</p>',
      '<p class="promo-vigencia"><strong>Vigencia:</strong> ', escapeHtmlPromo(vigenciaPromocion(item)), '</p>',
      '<div class="promo-acciones">',
      '<button class="boton boton-principal" type="button" data-promocion-detalle="', escapeHtmlPromo(String(item.idPromocion || 0)), '">Ver detalles</button>',
      accionPromocion(item),
      '</div>',
      '</div>',
      '</article>'
    ].join('');
  }).join('');

  renderPaginacionPromociones(total, promocionesState.pagina, pageSize);
}

function abrirDetallePromocion(item) {
  var modal = document.getElementById('promocion-detalle-modal');
  var contenido = document.getElementById('promocion-detalle-contenido');
  if (!modal || !contenido || !item) return;

  var tipo = String(item.tipoPromocion || '').toUpperCase();
  var esDosPorUno = tipo === 'DOS_POR_UNO';

  contenido.innerHTML = [
    '<div class="promocion-modal-card">',
    '<img class="promocion-modal-imagen" src="', escapeHtmlPromo(obtenerRutaImagenPromo(item)), '" alt="', escapeHtmlPromo(item.servicio || item.nombre || 'Servicio'), '" onerror="this.onerror=null;this.src=\'/img/evento-default.jpg\';">',
    '<div class="promocion-modal-meta">',
    '<p><strong>Nombre:</strong> ', escapeHtmlPromo(item.nombre || ''), '</p>',
    '<p><strong>Tipo:</strong> ', escapeHtmlPromo(etiquetaPromocion(item)), '</p>',
    '<p><strong>Beneficio:</strong> ', escapeHtmlPromo(beneficioPromo(item)), '</p>',
    '<p><strong>Descripción:</strong> ', escapeHtmlPromo(item.descripcion || ''), '</p>',
    '<p><strong>Servicio asociado:</strong> ', escapeHtmlPromo(item.servicio || ''), '</p>',
    item.soloConsulta ? '' : '<p><strong>Precio regular:</strong> CRC ' + escapeHtmlPromo(formatearMonedaPromo(item.precioServicio)) + '</p>',
    !item.soloConsulta && !esDosPorUno ? '<p><strong>Precio promocional:</strong> CRC ' + escapeHtmlPromo(formatearMonedaPromo(item.precioPromocional)) + '</p>' : '',
    '<p><strong>Vigencia:</strong> ', escapeHtmlPromo(vigenciaPromocion(item)), '</p>',
    '<div class="promo-acciones promo-acciones-modal">',
    accionPromocion(item),
    '</div>',
    '</div>',
    '</div>'
  ].join('');

  promocionesState.focoPrevio = document.activeElement;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('promocion-detalle-cerrar').focus();
}

function cerrarDetallePromocion() {
  var modal = document.getElementById('promocion-detalle-modal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  if (promocionesState.focoPrevio) promocionesState.focoPrevio.focus();
  promocionesState.focoPrevio = null;
}

function cargarPromociones() {
  setMensajePromociones('Cargando promociones vigentes...', false);

  return obtenerPromocionesPublicas()
    .then(function (promociones) {
      renderPromociones(promociones);
      setMensajePromociones(promociones.length ? '' : 'No hay promociones vigentes en este momento.', false);
      return promociones;
    })
    .catch(function (err) {
      renderPromociones([]);
      setMensajePromociones(err.message || 'No fue posible consultar promociones.', true);
      return [];
    });
}

function obtenerPromocionesPublicas() {
  return fetch('/api/promotions.ashx', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
    .then(function (resp) {
      if (!resp.ok) throw new Error('No fue posible consultar promociones vigentes.');
      return resp.json();
    })
    .then(function (data) {
      if (!data || !data.success) throw new Error((data && data.message) || 'No fue posible consultar promociones vigentes.');
      return Array.isArray(data.promociones) ? data.promociones : [];
    });
}

function cargarPromocionesInicio(listado) {
  var seccion = document.getElementById('inicio-promociones');
  obtenerPromocionesPublicas().then(function (items) {
    ['primera-valoracion-gratuita', 'plan-mensual'].forEach(function (clave) {
      var promo = items.find(function (item) { return item.clave === clave; });
      if (!promo) return;
      var tarjeta = document.createElement('article');
      tarjeta.className = 'tarjeta promocion';
      var titulo = document.createElement('h3');
      titulo.textContent = promo.nombre;
      var descripcion = document.createElement('p');
      descripcion.textContent = promo.descripcion;
      var enlace = document.createElement('a');
      enlace.className = 'boton boton-secundario';
      enlace.href = 'promociones.html?id=' + encodeURIComponent(promo.idPromocion);
      enlace.textContent = 'Ver promoción';
      tarjeta.append(titulo, descripcion, enlace);
      listado.append(tarjeta);
    });
    seccion.hidden = !listado.children.length;
  }).catch(function () {
    seccion.hidden = true;
  });
}

function initPromociones() {
  var destacados = document.getElementById('inicio-promociones-listado');
  if (destacados) {
    cargarPromocionesInicio(destacados);
    return;
  }
  var listado = document.getElementById('promociones-listado');
  if (!listado) return;
  cargarPromociones().then(function (items) {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id') || params.get('idPromocion');
    var slug = params.get('promo');
    if (!id && !slug) return;
    var promo = items.find(function (item) {
      if (id) return String(item.idPromocion) === id;
      return String(item.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') === slug;
    });
    if (promo) abrirDetallePromocion(promo);
    else if (items.length) setMensajePromociones('Esta promoción ya no está disponible.', true);
  });
  if (listado) {
    listado.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-promocion-detalle]');
      if (!btn) return;
      var id = parseInt(btn.getAttribute('data-promocion-detalle') || '0', 10);
      if (!id) return;
      var item = null;
      for (var i = 0; i < promocionesState.items.length; i += 1) {
        if (Number(promocionesState.items[i].idPromocion) === id) {
          item = promocionesState.items[i];
          break;
        }
      }
      if (!item) return;
      abrirDetallePromocion(item);
    });
  }

  var cerrarBtn = document.getElementById('promocion-detalle-cerrar');
  if (cerrarBtn) cerrarBtn.addEventListener('click', cerrarDetallePromocion);

  document.addEventListener('click', function (e) {
    var cerrar = e.target.closest('[data-promocion-detalle-cerrar]');
    if (!cerrar) return;
    cerrarDetallePromocion();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') cerrarDetallePromocion();
  });

  var prev = document.getElementById('promociones-pagination-prev');
  var next = document.getElementById('promociones-pagination-next');
  if (prev) {
    prev.addEventListener('click', function () {
      if (promocionesState.pagina <= 1) return;
      promocionesState.pagina -= 1;
      renderPromociones(promocionesState.items);
    });
  }
  if (next) {
    next.addEventListener('click', function () {
      promocionesState.pagina += 1;
      renderPromociones(promocionesState.items);
    });
  }
}

document.addEventListener('DOMContentLoaded', initPromociones);
