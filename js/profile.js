// js/profile.js - carga datos de perfil desde api/profile.ashx
var perfilReservasState = {
  csrfToken: '',
  cargando: false,
  usuarioEsAdmin: false,
  seccionActiva: 'perfil-datos',
  reservas: [],
  rutinas: [],
  filtroReservas: 'proximas',
  filtroEstado: 'todas',
  reservasPaginacion: { pagina: 1, pageSize: 4, totalPaginas: 1 }
};
var perfilProgresoState = {
  historial: []
};

var perfilNavegacionInicialState = {
  aplicada: false,
  seccion: '',
  filtro: ''
};

/* NUEVO: Reserva pendiente de confirmación */
var perfilReservaPendienteCancelar = 0;

function normalizarFiltroReservasPerfil(valor) {
  var filtro = String(valor || '').toLowerCase();
  if (filtro === 'proximas' || filtro === 'historial') return filtro;
  if (filtro === 'pasadas') return 'historial';
  return 'proximas';
}

function obtenerTextoProximaReservaDesdeItemsPerfil(items) {
  var grupos = agruparReservasPerfil(items || []);
  var ahora = Date.now();

  var futuros = grupos.filter(function (grupo) {
    return obtenerTimestampProximaSesionPerfil(grupo, ahora) > 0;
  }).sort(function (a, b) {
    return obtenerTimestampProximaSesionPerfil(a, ahora) - obtenerTimestampProximaSesionPerfil(b, ahora);
  });

  if (!futuros.length) return 'Sin reservas próximas';

  var grupo = futuros[0];
  var sesion = obtenerSesionReferenciaAgendaPerfil(grupo, 'proximas', ahora) || grupo.principal;
  if (!sesion) return 'Sin reservas próximas';

  var servicio = String(sesion.servicio || grupo.servicio || '').trim();
  var fecha = formatearFechaPerfil(sesion.fecha);
  var hora = [String(sesion.horaInicio || '').trim(), String(sesion.horaFin || '').trim()].filter(Boolean).join('-');
  var partes = [servicio, fecha, hora].filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Sin reservas próximas';
}

function actualizarFilaResumenPerfil(idFila, idValor, valor, opciones) {
  var fila = document.getElementById(idFila);
  var nodoValor = document.getElementById(idValor);
  var cfg = opciones || {};

  if (nodoValor) nodoValor.textContent = valor || '';

  if (!fila) return;

  if (cfg.error) {
    fila.hidden = false;
    return;
  }

  if (cfg.mostrarSinDatos) {
    fila.hidden = false;
    return;
  }

  fila.hidden = !String(valor || '').trim();
}

function normalizarFiltroEstadoReservasPerfil(valor) {
  var filtro = String(valor || '').toLowerCase();
  if (filtro === 'confirmada' || filtro === 'pendiente' || filtro === 'cancelada' || filtro === 'todas') return filtro;
  if (filtro === 'canceladas') return 'cancelada';
  return 'todas';
}

function leerNavegacionInicialPerfilDesdeUrl() {
  var seccion = '';
  var filtro = '';
  try {
    var params = new URLSearchParams(window.location.search || '');
    seccion = String(params.get('seccion') || '').toLowerCase();
    filtro = String(params.get('filtro') || '').toLowerCase();
  } catch (_) {
    seccion = '';
    filtro = '';
  }

  if (seccion === 'perfil-datos' || seccion === 'perfil-reservas' || seccion === 'perfil-progreso' || seccion === 'perfil-rutinas') {
    perfilNavegacionInicialState.seccion = seccion;
    perfilNavegacionInicialState.filtro = filtro;
  }
}

function aplicarNavegacionInicialPerfil() {
  if (perfilNavegacionInicialState.aplicada) return;
  perfilNavegacionInicialState.aplicada = true;

  if (perfilReservasState.usuarioEsAdmin) {
    mostrarSeccionPerfil('perfil-datos');
    return;
  }

  var seccionInicial = perfilNavegacionInicialState.seccion || 'perfil-datos';

  if (seccionInicial === 'perfil-reservas') {
    var filtroInicial = String(perfilNavegacionInicialState.filtro || '').toLowerCase();

    perfilReservasState.filtroReservas = normalizarFiltroReservasPerfil(filtroInicial);
    perfilReservasState.filtroEstado = normalizarFiltroEstadoReservasPerfil(filtroInicial);

    if (filtroInicial === 'canceladas') {
      perfilReservasState.filtroReservas = 'historial';
      perfilReservasState.filtroEstado = 'cancelada';
    } else if (filtroInicial === 'pasadas') {
      perfilReservasState.filtroReservas = 'historial';
    }

    perfilReservasState.reservasPaginacion.pagina = 1;

    var filtroReservas = document.getElementById('perfil-reservas-filtro');
    if (filtroReservas) {
      filtroReservas.value = perfilReservasState.filtroEstado;
    }

    var btnProximas = document.getElementById('perfil-reservas-vista-proximas');
    var btnHistorial = document.getElementById('perfil-reservas-vista-historial');
    if (btnProximas && btnHistorial) {
      var esProximas = perfilReservasState.filtroReservas === 'proximas';
      btnProximas.classList.toggle('activo', esProximas);
      btnProximas.setAttribute('aria-selected', esProximas ? 'true' : 'false');
      btnHistorial.classList.toggle('activo', !esProximas);
      btnHistorial.setAttribute('aria-selected', !esProximas ? 'true' : 'false');
    }

    mostrarSeccionPerfil('perfil-reservas');
    cargarReservasPerfil(false);
    return;
  }

  if (seccionInicial === 'perfil-progreso') {
    mostrarSeccionPerfil('perfil-progreso');
    return;
  }

  if (seccionInicial === 'perfil-rutinas') {
    mostrarSeccionPerfil('perfil-rutinas');
    cargarRutinasPerfil(false);
    return;
  }

  mostrarSeccionPerfil('perfil-datos');
}

function escapeHtmlPerfil(valor) {
  return String(valor == null ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatearFechaPerfil(fechaIso) {
  var fecha = new Date(String(fechaIso || '') + 'T00:00:00');
  if (Number.isNaN(fecha.getTime())) return String(fechaIso || '');
  return fecha.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatearPorcentajePromocionPerfil(valor) {
  var num = Number(valor || 0);
  if (!Number.isFinite(num) || num <= 0) return '';
  return String(num.toFixed(2)).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + '%';
}

function obtenerResumenPromocionPerfil(grupo) {
  if (!grupo || !grupo.idOperacionPromocional) {
    return {
      titulo: 'Sin promoción',
      detalle: 'Reserva regular'
    };
  }

  var tipo = String(grupo.tipoPromocion || '').toUpperCase();
  var nombre = String(grupo.nombrePromocion || '').trim();
  var porcentaje = formatearPorcentajePromocionPerfil(grupo.porcentajeDescuentoPromocion);

  if (tipo === 'DOS_POR_UNO') {
    return {
      titulo: nombre || 'Promoción 2x1',
      detalle: '¡Dos clases por el precio de una!'
    };
  }

  if (tipo === 'PORCENTAJE') {
    return {
      titulo: nombre || 'Promoción por descuento',
      detalle: porcentaje ? (porcentaje + ' de descuento') : 'Descuento aplicado'
    };
  }

  return {
    titulo: nombre || 'Promoción aplicada',
    detalle: 'Beneficio promocional aplicado'
  };
}

function normalizarReservaPerfil(raw) {
  if (!raw) return null;
  return {
    idReserva: raw.idReserva != null ? raw.idReserva : raw.IdReserva,
    idHorarioServicio: raw.idHorarioServicio != null ? raw.idHorarioServicio : raw.IdHorarioServicio,
    servicio: raw.servicio != null ? raw.servicio : raw.Servicio,
    fecha: raw.fecha != null ? raw.fecha : raw.Fecha,
    horaInicio: raw.horaInicio != null ? raw.horaInicio : raw.HoraInicio,
    horaFin: raw.horaFin != null ? raw.horaFin : raw.HoraFin,
    instructor: raw.instructor != null ? raw.instructor : raw.Instructor,
    estado: raw.estado != null ? raw.estado : raw.Estado,
    idOperacionPromocional: raw.idOperacionPromocional != null ? raw.idOperacionPromocional : raw.IdOperacionPromocional,
    idPromocion: raw.idPromocion != null ? raw.idPromocion : raw.IdPromocion,
    nombrePromocion: raw.nombrePromocion != null ? raw.nombrePromocion : raw.NombrePromocion,
    tipoPromocion: raw.tipoPromocion != null ? raw.tipoPromocion : raw.TipoPromocion,
    porcentajeDescuentoPromocion: Number(raw.porcentajeDescuentoPromocion != null ? raw.porcentajeDescuentoPromocion : raw.PorcentajeDescuentoPromocion || 0)
  };
}

function mostrarSeccionPerfil(idSeccion) {
  var ids = ['perfil-datos', 'perfil-progreso', 'perfil-reservas', 'perfil-rutinas'];
  var esValida = ids.indexOf(idSeccion) >= 0;

  for (var i = 0; i < ids.length; i += 1) {
    var el = document.getElementById(ids[i]);
    if (!el) continue;
    if (!esValida) {
      el.hidden = true;
    } else {
      el.hidden = ids[i] !== idSeccion;
    }
  }

  var enlaces = document.querySelectorAll('.perfil-nav-link[data-seccion]');
  enlaces.forEach(function (link) {
    var activo = esValida && link.getAttribute('data-seccion') === idSeccion;
    if (activo) link.classList.add('activo');
    else link.classList.remove('activo');
  });

  perfilReservasState.seccionActiva = esValida ? idSeccion : '';
}

function setMensajeReservasPerfil(texto, esError) {
  var msg = document.getElementById('perfil-reservas-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff8d9a' : '#87efba';
}

function setMensajeRutinasPerfil(texto, esError) {
  var msg = document.getElementById('perfil-rutinas-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff8d9a' : '#87efba';
}

function renderPaginacionReservasPerfil(total) {
  var wrap = document.getElementById('perfil-reservas-pagination-wrap');
  var summary = document.getElementById('perfil-reservas-pagination-summary');
  var pageInfo = document.getElementById('perfil-reservas-pagination-pageinfo');
  var prev = document.getElementById('perfil-reservas-pagination-prev');
  var next = document.getElementById('perfil-reservas-pagination-next');
  if (!wrap || !summary || !pageInfo || !prev || !next) return;

  var pageSize = Number(perfilReservasState.reservasPaginacion.pageSize || 10);
  var totalPaginas = total > 0 ? Math.ceil(total / pageSize) : 1;
  perfilReservasState.reservasPaginacion.totalPaginas = totalPaginas;
  if (perfilReservasState.reservasPaginacion.pagina < 1) perfilReservasState.reservasPaginacion.pagina = 1;
  if (perfilReservasState.reservasPaginacion.pagina > totalPaginas) perfilReservasState.reservasPaginacion.pagina = totalPaginas;

  var desde = total > 0 ? ((perfilReservasState.reservasPaginacion.pagina - 1) * pageSize) + 1 : 0;
  var hasta = total > 0 ? Math.min(perfilReservasState.reservasPaginacion.pagina * pageSize, total) : 0;

  summary.textContent = 'Mostrando ' + String(desde) + '–' + String(hasta) + ' de ' + String(total);
  pageInfo.textContent = 'Página ' + String(perfilReservasState.reservasPaginacion.pagina) + ' de ' + String(totalPaginas);
  prev.disabled = perfilReservasState.reservasPaginacion.pagina <= 1;
  next.disabled = perfilReservasState.reservasPaginacion.pagina >= totalPaginas;
  wrap.hidden = total <= pageSize;
}

function normalizarRutinaPerfil(raw) {
  if (!raw) return null;
  return {
    idAsignacionRutina: raw.idAsignacionRutina != null ? raw.idAsignacionRutina : raw.IdAsignacionRutina,
    idRutina: raw.idRutina != null ? raw.idRutina : raw.IdRutina,
    nombre: raw.nombre != null ? raw.nombre : raw.Nombre,
    descripcion: raw.descripcion != null ? raw.descripcion : raw.Descripcion,
    objetivo: raw.objetivo != null ? raw.objetivo : raw.Objetivo,
    nivel: raw.nivel != null ? raw.nivel : raw.Nivel,
    duracionAproximadaMin: Number(raw.duracionAproximadaMin != null ? raw.duracionAproximadaMin : raw.DuracionAproximadaMin || 0),
    rutinaActiva: raw.rutinaActiva != null ? !!raw.rutinaActiva : !!raw.RutinaActiva,
    asignacionActiva: raw.asignacionActiva != null ? !!raw.asignacionActiva : !!raw.AsignacionActiva,
    vigente: raw.vigente != null ? !!raw.vigente : !!raw.Vigente,
    fechaAsignacion: raw.fechaAsignacion != null ? raw.fechaAsignacion : raw.FechaAsignacion,
    fechaFinalizacion: raw.fechaFinalizacion != null ? raw.fechaFinalizacion : raw.FechaFinalizacion
  };
}

function renderRutinasPerfil(items) {
  var cont = document.getElementById('perfil-rutinas-lista');
  if (!cont) return;

  if (!items || !items.length) {
    cont.innerHTML = '<p class="perfil-reservas-empty">Aún no tienes una rutina asignada</p>';
    return;
  }

  cont.innerHTML = items.map(function (r) {
    var estadoTxt = r.vigente ? 'Vigente' : (r.asignacionActiva ? 'Asignada (rutina desactivada)' : 'Histórica');
    var estadoClase = r.vigente ? 'confirmada' : (r.asignacionActiva ? 'pendiente' : 'cancelada');

    return [
      '<article class="perfil-reserva-card">',
      '  <h3>' + escapeHtmlPerfil(r.nombre || '') + '</h3>',
      '  <span class="perfil-reserva-badge ' + estadoClase + '">' + escapeHtmlPerfil(estadoTxt) + '</span>',
      '  <p class="perfil-reserva-meta"><strong>Objetivo:</strong> ' + escapeHtmlPerfil(r.objetivo || '') + '</p>',
      '  <p class="perfil-reserva-meta"><strong>Nivel:</strong> ' + escapeHtmlPerfil(r.nivel || '') + '</p>',
      '  <p class="perfil-reserva-meta"><strong>Duración:</strong> ' + String(r.duracionAproximadaMin || 0) + ' min</p>',
      '  <p class="perfil-reserva-meta"><strong>Asignada:</strong> ' + escapeHtmlPerfil(formatearFechaPerfil(String(r.fechaAsignacion || '').slice(0, 10))) + '</p>',
      '  <p class="perfil-reserva-meta"><strong>Descripción:</strong> ' + escapeHtmlPerfil(r.descripcion || 'Sin descripción') + '</p>',
      '</article>'
    ].join('');
  }).join('');
}

function cargarRutinasPerfil(silencioso) {
  setMensajeRutinasPerfil('', false);
  return KFitnessRutinasCliente.mount('#perfil-rutinas-lista');
}

function obtenerEstadoClasePerfil(estadoRaw) {
  var estado = String(estadoRaw || '').toUpperCase();
  if (estado === 'CONFIRMADA') return 'confirmada';
  if (estado === 'PENDIENTE') return 'pendiente';
  if (estado === 'CANCELADA') return 'cancelada';
  return 'pendiente';
}

function agruparReservasPerfil(items) {
  var map = {};

  (items || []).forEach(function (item) {
    if (!item) return;
    var key = item.idOperacionPromocional ? ('op-' + String(item.idOperacionPromocional)) : ('res-' + String(item.idReserva));
    if (!map[key]) {
      map[key] = {
        key: key,
        idOperacionPromocional: item.idOperacionPromocional || null,
        nombrePromocion: item.nombrePromocion || '',
        tipoPromocion: item.tipoPromocion || '',
        porcentajeDescuentoPromocion: Number(item.porcentajeDescuentoPromocion || 0),
        servicio: item.servicio || '',
        sesiones: []
      };
    }
    map[key].sesiones.push(item);
  });

  var grupos = Object.keys(map).map(function (k) { return map[k]; });
  grupos.forEach(function (g) {
    g.sesiones.sort(function (a, b) {
      var aDate = new Date(String(a.fecha || '') + 'T' + String(a.horaInicio || '00:00') + ':00').getTime();
      var bDate = new Date(String(b.fecha || '') + 'T' + String(b.horaInicio || '00:00') + ':00').getTime();
      return aDate - bDate;
    });
    g.principal = g.sesiones[0] || null;
    g.estado = g.principal ? String(g.principal.estado || '').toUpperCase() : 'PENDIENTE';
    g.idReservaAccion = 0;
    for (var i = 0; i < g.sesiones.length; i += 1) {
      if (String(g.sesiones[i].estado || '').toUpperCase() !== 'CANCELADA') {
        g.idReservaAccion = g.sesiones[i].idReserva || 0;
        break;
      }
    }
  });

  grupos.sort(function (a, b) {
    var aLast = a.sesiones.length ? a.sesiones[a.sesiones.length - 1] : null;
    var bLast = b.sesiones.length ? b.sesiones[b.sesiones.length - 1] : null;
    var aDate = aLast ? new Date(String(aLast.fecha || '') + 'T' + String(aLast.horaInicio || '00:00') + ':00').getTime() : 0;
    var bDate = bLast ? new Date(String(bLast.fecha || '') + 'T' + String(bLast.horaInicio || '00:00') + ':00').getTime() : 0;
    return bDate - aDate;
  });

  return grupos;
}

function esReservaCanceladaPerfil(grupo) {
  return !!(grupo && grupo.sesiones && grupo.sesiones.length) && grupo.sesiones.every(function (s) {
    return String(s && s.estado || '').toUpperCase() === 'CANCELADA';
  });
}

function obtenerTimestampSesionPerfil(sesion, usarHoraFin) {
  if (!sesion) return 0;
  var hora = usarHoraFin ? String(sesion.horaFin || '00:00') : String(sesion.horaInicio || '00:00');
  var marca = new Date(String(sesion.fecha || '') + 'T' + hora + ':00').getTime();
  return Number.isFinite(marca) ? marca : 0;
}

function obtenerTimestampProximaSesionPerfil(grupo, ahora) {
  if (!grupo || !Array.isArray(grupo.sesiones)) return 0;
  var candidatas = grupo.sesiones
    .filter(function (s) { return String(s && s.estado || '').toUpperCase() !== 'CANCELADA'; })
    .map(function (s) { return obtenerTimestampSesionPerfil(s, false); })
    .filter(function (x) { return x > ahora; });
  if (!candidatas.length) return 0;
  return Math.min.apply(Math, candidatas);
}

function obtenerTimestampUltimaSesionPerfil(grupo) {
  if (!grupo || !Array.isArray(grupo.sesiones) || !grupo.sesiones.length) return 0;
  return Math.max.apply(Math, grupo.sesiones.map(function (s) {
    return obtenerTimestampSesionPerfil(s, true);
  }));
}

function formatearMesCortoPerfil(fechaIso) {
  var fecha = new Date(String(fechaIso || '') + 'T00:00:00');
  if (Number.isNaN(fecha.getTime())) return '---';
  return fecha.toLocaleDateString('es-CR', { month: 'short' }).replace('.', '').toUpperCase();
}

function obtenerDiaMesPerfil(fechaIso) {
  var fecha = new Date(String(fechaIso || '') + 'T00:00:00');
  if (Number.isNaN(fecha.getTime())) {
    return { dia: '—', mes: '---' };
  }

  return {
    dia: String(fecha.getDate()).padStart(2, '0'),
    mes: formatearMesCortoPerfil(fechaIso)
  };
}

function formatearEstadoReservaPerfil(estadoRaw) {
  var estado = String(estadoRaw || '').toUpperCase();
  if (!estado) return 'Pendiente';
  return estado.slice(0, 1) + estado.slice(1).toLowerCase();
}

function construirBotonCancelarReservaPerfil(grupo) {
  if (!grupo || Number(grupo.idReservaAccion || 0) <= 0) return '';
  return '<button type="button" class="boton boton-secundario boton-pequeno perfil-reserva-cancelar" data-reserva-id="' + escapeHtmlPerfil(String(grupo.idReservaAccion)) + '">Cancelar reserva</button>';
}

function obtenerSesionReferenciaAgendaPerfil(grupo, vista, ahora) {
  if (!grupo || !Array.isArray(grupo.sesiones) || !grupo.sesiones.length) return null;

  var sesionesOrdenadas = grupo.sesiones.slice().sort(function (a, b) {
    return obtenerTimestampSesionPerfil(a, false) - obtenerTimestampSesionPerfil(b, false);
  });

  if (vista === 'proximas') {
    for (var i = 0; i < sesionesOrdenadas.length; i += 1) {
      var sesion = sesionesOrdenadas[i];
      var estado = String(sesion && sesion.estado || '').toUpperCase();
      if (estado !== 'CANCELADA' && obtenerTimestampSesionPerfil(sesion, true) > ahora) {
        return sesion;
      }
    }
  }

  return sesionesOrdenadas[sesionesOrdenadas.length - 1] || sesionesOrdenadas[0] || null;
}

function filtrarGruposReservasPerfil(grupos) {
  var vista = String(perfilReservasState.filtroReservas || 'proximas').toLowerCase();
  var filtroEstado = String(perfilReservasState.filtroEstado || 'todas').toLowerCase();
  var ahora = Date.now();

  var filtrados = (grupos || []).filter(function (grupo) {
    var sesiones = Array.isArray(grupo.sesiones) ? grupo.sesiones : [];
    if (!sesiones.length) return false;

    var hayFutura = sesiones.some(function (s) {
      return String(s && s.estado || '').toUpperCase() !== 'CANCELADA' && obtenerTimestampSesionPerfil(s, true) > ahora;
    });

    if (vista === 'proximas' && !hayFutura) return false;
    if (vista === 'historial' && hayFutura) return false;

    if (filtroEstado !== 'todas') {
      var coincideEstado = sesiones.some(function (s) {
        return String(s && s.estado || '').toLowerCase() === filtroEstado;
      });
      if (!coincideEstado) return false;
    }

    return true;
  });

  if (vista === 'proximas') {
    filtrados.sort(function (a, b) {
      var aProx = obtenerTimestampProximaSesionPerfil(a, ahora);
      var bProx = obtenerTimestampProximaSesionPerfil(b, ahora);
      if (aProx === bProx) return 0;
      if (aProx <= 0) return 1;
      if (bProx <= 0) return -1;
      return aProx - bProx;
    });
  } else {
    filtrados.sort(function (a, b) {
      return obtenerTimestampUltimaSesionPerfil(b) - obtenerTimestampUltimaSesionPerfil(a);
    });
  }

  return filtrados;
}

function obtenerMensajeSinReservasPerfil() {
  var vista = String(perfilReservasState.filtroReservas || 'proximas').toLowerCase();
  if (vista === 'historial') return 'No tenés reservas en el historial para el filtro seleccionado.';
  return 'No tenés próximas reservas para el filtro seleccionado.';
}

function renderReservaDestacadaPerfil(grupo, sesion) {
  var cont = document.getElementById('perfil-reservas-destacada');
  if (!cont) return;

  if (!grupo || !sesion) {
    cont.innerHTML = '';
    cont.hidden = true;
    return;
  }

  var estado = String(sesion.estado || grupo.estado || '').toUpperCase();
  var estadoClase = obtenerEstadoClasePerfil(estado);
  var promoInfo = obtenerResumenPromocionPerfil(grupo);
  var instructor = (sesion.instructor || '').trim() || 'Por definir';
  var botonCancelar = construirBotonCancelarReservaPerfil(grupo);
  var fecha = obtenerDiaMesPerfil(sesion.fecha);

  cont.hidden = false;
  cont.innerHTML = [
    '<article class="perfil-reserva-destacada">',
    '  <div class="perfil-reserva-fecha-bloque">',
    '    <span class="perfil-reserva-fecha-dia">' + escapeHtmlPerfil(fecha.dia) + '</span>',
    '    <span class="perfil-reserva-fecha-mes">' + escapeHtmlPerfil(fecha.mes) + '</span>',
    '  </div>',
    '  <div class="perfil-reserva-destacada-info">',
    '    <p class="perfil-reserva-tag">Tu próxima reserva</p>',
    '    <h3>' + escapeHtmlPerfil(sesion.servicio || grupo.servicio || 'Servicio') + '</h3>',
    '    <p class="perfil-reserva-linea">' + escapeHtmlPerfil(String(sesion.horaInicio || '')) + ' - ' + escapeHtmlPerfil(String(sesion.horaFin || '')) + ' · ' + escapeHtmlPerfil(instructor) + '</p>',
    (grupo.idOperacionPromocional ? ('    <p class="perfil-reserva-promo">' + escapeHtmlPerfil(promoInfo.titulo) + ' · ' + escapeHtmlPerfil(promoInfo.detalle) + '</p>') : ''),
    '  </div>',
    '  <div class="perfil-reserva-destacada-side">',
    '    <span class="perfil-reserva-badge ' + estadoClase + '">' + escapeHtmlPerfil(formatearEstadoReservaPerfil(estado)) + '</span>',
    (botonCancelar ? ('    ' + botonCancelar) : ''),
    '  </div>',
    '</article>'
  ].join('');
}

function renderReservasPerfil(items) {
  var contenedor = document.getElementById('perfil-reservas-lista');
  var tituloLista = document.getElementById('perfil-reservas-lista-titulo');
  if (!contenedor) return;

  var vista = String(perfilReservasState.filtroReservas || 'proximas').toLowerCase();
  var grupos = agruparReservasPerfil(items || []);
  var gruposFiltrados = filtrarGruposReservasPerfil(grupos);
  var ahora = Date.now();

  var destacado = null;
  var destacadoSesion = null;
  if (vista === 'proximas' && gruposFiltrados.length) {
    destacado = gruposFiltrados[0];
    destacadoSesion = obtenerSesionReferenciaAgendaPerfil(destacado, 'proximas', ahora);
  }

  if (vista === 'proximas') {
    renderReservaDestacadaPerfil(destacado, destacadoSesion);
    if (tituloLista) tituloLista.textContent = 'También tienes reservado';
  } else {
    renderReservaDestacadaPerfil(null, null);
    if (tituloLista) tituloLista.textContent = 'Historial de reservas';
  }

  var listaBase = vista === 'proximas' ? gruposFiltrados.slice(1) : gruposFiltrados.slice();

  if (!listaBase.length) {
    if (vista === 'proximas' && destacado && destacadoSesion) {
      renderPaginacionReservasPerfil(0);
      contenedor.innerHTML = '<p class="perfil-reservas-empty">No tenés más reservas futuras además de la destacada.</p>';
      return;
    }

    renderPaginacionReservasPerfil(0);
    contenedor.innerHTML = '<p class="perfil-reservas-empty">' + escapeHtmlPerfil(obtenerMensajeSinReservasPerfil()) + '</p>';
    return;
  }

  var total = listaBase.length;
  var pageSize = Number(perfilReservasState.reservasPaginacion.pageSize || 4);
  var totalPaginas = total > 0 ? Math.ceil(total / pageSize) : 1;
  if (perfilReservasState.reservasPaginacion.pagina > totalPaginas) perfilReservasState.reservasPaginacion.pagina = totalPaginas;
  if (perfilReservasState.reservasPaginacion.pagina < 1) perfilReservasState.reservasPaginacion.pagina = 1;

  var inicio = (perfilReservasState.reservasPaginacion.pagina - 1) * pageSize;
  var fin = Math.min(inicio + pageSize, total);
  var gruposPagina = listaBase.slice(inicio, fin);

  contenedor.innerHTML = gruposPagina.map(function (grupo) {
    var sesion = obtenerSesionReferenciaAgendaPerfil(grupo, vista, ahora) || grupo.principal || {};
    var estado = String(sesion.estado || grupo.estado || '').toUpperCase();
    var estadoClase = obtenerEstadoClasePerfil(estado);
    var promoInfo = obtenerResumenPromocionPerfil(grupo);
    var botonCancelar = construirBotonCancelarReservaPerfil(grupo);
    var instructor = (sesion.instructor || '').trim() || 'Por definir';
    var fecha = obtenerDiaMesPerfil(sesion.fecha);

    return [
      '<article class="perfil-reserva-fila">',
      '  <div class="perfil-reserva-fila-fecha">',
      '    <span class="perfil-reserva-fecha-dia">' + escapeHtmlPerfil(fecha.dia) + '</span>',
      '    <span class="perfil-reserva-fecha-mes">' + escapeHtmlPerfil(fecha.mes) + '</span>',
      '  </div>',
      '  <div>',
      '    <p class="perfil-reserva-fila-servicio">' + escapeHtmlPerfil(sesion.servicio || grupo.servicio || 'Servicio') + '</p>',
      '    <p class="perfil-reserva-fila-detalle">' + escapeHtmlPerfil(String(sesion.horaInicio || '')) + ' - ' + escapeHtmlPerfil(String(sesion.horaFin || '')) + ' · ' + escapeHtmlPerfil(instructor) + '</p>',
      (grupo.idOperacionPromocional ? ('    <p class="perfil-reserva-promo">' + escapeHtmlPerfil(promoInfo.titulo) + '</p><p class="perfil-reserva-beneficio">' + escapeHtmlPerfil(promoInfo.detalle) + '</p>') : ''),
      '  </div>',
      '  <div class="perfil-reserva-fila-side">',
      '    <span class="perfil-reserva-badge ' + estadoClase + '">' + escapeHtmlPerfil(formatearEstadoReservaPerfil(estado)) + '</span>',
      (botonCancelar ? ('    ' + botonCancelar) : ''),
      '  </div>',
      '</article>'
    ].join('');
  }).join('');

  renderPaginacionReservasPerfil(total);
}

function cargarReservasPerfil(silencioso) {
  if (perfilReservasState.cargando) return Promise.resolve();
  perfilReservasState.cargando = true;

  if (!silencioso) setMensajeReservasPerfil('Cargando reservas...', false);

  return fetch('/api/reservations.ashx', { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (!resp.ok) throw new Error('No fue posible cargar tus reservas.');
      return resp.json();
    })
    .then(function (data) {
      if (!data) return;
      if (!data.success) throw new Error(data.message || 'No fue posible cargar tus reservas.');

      perfilReservasState.csrfToken = data.csrfToken || '';
      perfilReservasState.reservas = (Array.isArray(data.reservas) ? data.reservas : [])
        .map(normalizarReservaPerfil)
        .filter(function (r) { return !!r; });

      renderReservasPerfil(perfilReservasState.reservas);
      if (!perfilReservasState.reservas.length) {
        setMensajeReservasPerfil('No tienes reservas registradas por el momento.', false);
      } else if (!silencioso) {
        setMensajeReservasPerfil('Reservas actualizadas.', false);
      }
    })
    .catch(function (err) {
      var contenedor = document.getElementById('perfil-reservas-lista');
      if (contenedor) contenedor.innerHTML = '<p class="perfil-reservas-empty">No fue posible consultar tus reservas en este momento.</p>';
      setMensajeReservasPerfil((err && err.message) || 'No fue posible cargar tus reservas.', true);
    })
    .finally(function () {
      perfilReservasState.cargando = false;
    });
}

/* NUEVO: Abrir confirmación de cancelación */
function abrirConfirmacionCancelarReservaPerfil(idReserva) {
    var modal = document.getElementById(
        'perfil-cancelar-reserva-modal'
    );

    var botonNo = document.getElementById(
        'perfil-cancelar-reserva-no'
    );

    if (!modal || !botonNo || !idReserva || perfilReservasState.cargando) {
        return;
    }

    perfilReservaPendienteCancelar = Number(idReserva);
    modal.hidden = false;

    botonNo.focus();
}

/* NUEVO: Cerrar confirmación sin cancelar */
function cerrarConfirmacionCancelarReservaPerfil() {
    var modal = document.getElementById(
        'perfil-cancelar-reserva-modal'
    );

    perfilReservaPendienteCancelar = 0;

    if (modal) {
        modal.hidden = true;
    }
}

/* NUEVO: Conectar los botones de confirmación */
function inicializarConfirmacionCancelarReservaPerfil() {
    var modal = document.getElementById(
        'perfil-cancelar-reserva-modal'
    );

    var botonNo = document.getElementById(
        'perfil-cancelar-reserva-no'
    );

    var botonSi = document.getElementById(
        'perfil-cancelar-reserva-si'
    );

    if (!modal || !botonNo || !botonSi) {
        return;
    }

    botonNo.addEventListener('click', function () {
        cerrarConfirmacionCancelarReservaPerfil();
    });

    botonSi.addEventListener('click', function () {
        var idReserva = perfilReservaPendienteCancelar;

        if (!idReserva || perfilReservasState.cargando) {
            return;
        }

        cerrarConfirmacionCancelarReservaPerfil();

        // Reutiliza la función original de cancelación.
        cancelarReservaPerfil(idReserva);
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            cerrarConfirmacionCancelarReservaPerfil();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.hidden) {
            cerrarConfirmacionCancelarReservaPerfil();
        }
    });
}

function cancelarReservaPerfil(idReserva) {
  if (!idReserva || perfilReservasState.cargando) return;
  if (!perfilReservasState.csrfToken) {
    setMensajeReservasPerfil('No se pudo validar la sesión de seguridad. Actualiza la sección.', true);
    return;
  }

  perfilReservasState.cargando = true;
  setMensajeReservasPerfil('Cancelando reserva...', false);

  fetch('/api/reservations-cancel.ashx', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-CSRF-Token': perfilReservasState.csrfToken
    },
    body: JSON.stringify({ idReserva: Number(idReserva) })
  })
    .then(function (resp) {
      return resp.json().catch(function () {
        return { success: false, message: 'Respuesta inválida del servidor.' };
      }).then(function (data) {
        return { status: resp.status, data: data || {} };
      });
    })
    .then(function (result) {
      if (result.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      if (!result.data.success) {
        setMensajeReservasPerfil(result.data.message || 'No fue posible cancelar la reserva.', true);
        return;
      }
      setMensajeReservasPerfil(result.data.message || 'Reserva cancelada correctamente.', false);
      cargarReservasPerfil(true);
    })
    .catch(function () {
      setMensajeReservasPerfil('No fue posible cancelar la reserva.', true);
    })
    .finally(function () {
      perfilReservasState.cargando = false;
    });
}

function aplicarVistaPorRol(rol) {
  var esAdmin = String(rol || '').toLowerCase() === 'administrador';
  perfilReservasState.usuarioEsAdmin = esAdmin;

  var itemPanelAdmin = document.getElementById('sidebar-panel-admin');
  var itemProgreso = document.getElementById('sidebar-mi-progreso');
  var itemReservas = document.getElementById('sidebar-mis-reservas');
  var itemRutinas = document.getElementById('sidebar-mis-rutinas');

  var filaMembresia = document.getElementById('fila-membresia');
  var filaProximaReserva = document.getElementById('fila-proxima-reserva');
  var filaRutinaAsignada = document.getElementById('fila-rutina-asignada');

  if (itemPanelAdmin) itemPanelAdmin.hidden = !esAdmin;
  if (itemProgreso) itemProgreso.hidden = esAdmin;
  if (itemReservas) itemReservas.hidden = esAdmin;
  if (itemRutinas) itemRutinas.hidden = esAdmin;

  if (filaMembresia) filaMembresia.style.display = esAdmin ? 'none' : '';
  if (filaProximaReserva) filaProximaReserva.style.display = esAdmin ? 'none' : '';
  if (filaRutinaAsignada) filaRutinaAsignada.style.display = esAdmin ? 'none' : '';

  if (esAdmin && perfilReservasState.seccionActiva !== 'perfil-datos') {
    mostrarSeccionPerfil('perfil-datos');
  } else if (!perfilReservasState.seccionActiva) {
    mostrarSeccionPerfil('perfil-datos');
  }
}

function initNavegacionPerfil() {
  var links = document.querySelectorAll('.perfil-nav-link[data-seccion]');
  links.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var destino = btn.getAttribute('data-seccion');
      if (!destino) return;

      if ((destino === 'perfil-reservas' || destino === 'perfil-progreso') && perfilReservasState.usuarioEsAdmin) {
        return;
      }

      mostrarSeccionPerfil(destino);
      if (destino === 'perfil-reservas') {
        cargarReservasPerfil(false);
      }
      if (destino === 'perfil-rutinas' && !perfilReservasState.usuarioEsAdmin) {
        cargarRutinasPerfil(false);
      }
    });
  });
  // NUEVO: Inicializar una sola vez la confirmación
  inicializarConfirmacionCancelarReservaPerfil();

  var filtroReservas = document.getElementById('perfil-reservas-filtro');
  if (filtroReservas) {
    filtroReservas.value = perfilReservasState.filtroEstado || 'todas';
    filtroReservas.addEventListener('change', function () {
      perfilReservasState.filtroEstado = normalizarFiltroEstadoReservasPerfil(filtroReservas.value);
      perfilReservasState.reservasPaginacion.pagina = 1;
      renderReservasPerfil(perfilReservasState.reservas);
    });
  }

  var vistaBtns = document.querySelectorAll('.perfil-reservas-vista-btn[data-vista]');
  vistaBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var vista = normalizarFiltroReservasPerfil(btn.getAttribute('data-vista') || 'proximas');
      if (perfilReservasState.filtroReservas === vista) return;
      perfilReservasState.filtroReservas = vista;
      perfilReservasState.reservasPaginacion.pagina = 1;

      vistaBtns.forEach(function (x) {
        var activa = x === btn;
        x.classList.toggle('activo', activa);
        x.setAttribute('aria-selected', activa ? 'true' : 'false');
      });

      renderReservasPerfil(perfilReservasState.reservas);
    });
  });

  var btnRecargar = document.getElementById('perfil-reservas-recargar');
  if (btnRecargar) {
    btnRecargar.addEventListener('click', function () {
      cargarReservasPerfil(false);
    });
  }

  var btnRutinasRecargar = document.getElementById('perfil-rutinas-recargar');
  if (btnRutinasRecargar) {
    btnRutinasRecargar.addEventListener('click', function () {
      cargarRutinasPerfil(false);
    });
  }

  var pagPrev = document.getElementById('perfil-reservas-pagination-prev');
  var pagNext = document.getElementById('perfil-reservas-pagination-next');
  if (pagPrev) {
    pagPrev.addEventListener('click', function () {
      if (perfilReservasState.reservasPaginacion.pagina <= 1) return;
      perfilReservasState.reservasPaginacion.pagina -= 1;
      renderReservasPerfil(perfilReservasState.reservas);
    });
  }
  if (pagNext) {
    pagNext.addEventListener('click', function () {
      if (perfilReservasState.reservasPaginacion.pagina >= Number(perfilReservasState.reservasPaginacion.totalPaginas || 1)) return;
      perfilReservasState.reservasPaginacion.pagina += 1;
      renderReservasPerfil(perfilReservasState.reservas);
    });
  }

  function manejarClickCancelarReservaPerfil(e) {
    var btn = e.target.closest('.perfil-reserva-cancelar');
    if (!btn) return;
    var id = parseInt(btn.getAttribute('data-reserva-id') || '0', 10);
    if (id > 0) {
      abrirConfirmacionCancelarReservaPerfil(id);
    }
  }

  var lista = document.getElementById('perfil-reservas-lista');
  if (lista) {
    lista.addEventListener('click', manejarClickCancelarReservaPerfil);
  }

  var destacada = document.getElementById('perfil-reservas-destacada');
  if (destacada) {
    destacada.addEventListener('click', manejarClickCancelarReservaPerfil);
  }

  mostrarSeccionPerfil(perfilNavegacionInicialState.seccion || 'perfil-datos');
}

function setMensajeProgreso(idElemento, texto, esError) {
  var mensaje = document.getElementById(idElemento);
  if (!mensaje) return;
  mensaje.textContent = texto || '';
  mensaje.style.color = esError ? '#ff8d9a' : '#87efba';
}

function formatearNumeroProgreso(valor) {
  var numero = Number(String(valor || '').replace(',', '.'));
  if (!Number.isFinite(numero)) return '—';
  return numero.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function calcularEdadDesdeFecha(fechaIso) {
  if (!fechaIso) return '';
  var fecha = new Date(String(fechaIso) + 'T00:00:00');
  if (Number.isNaN(fecha.getTime())) return '';
  var hoy = new Date();
  var edad = hoy.getFullYear() - fecha.getFullYear();
  var m = hoy.getMonth() - fecha.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad -= 1;
  return edad >= 0 ? String(edad) : '';
}

function formatearFechaLargaProgreso(fechaIso) {
  var fecha = new Date(String(fechaIso || '') + 'T00:00:00');
  if (Number.isNaN(fecha.getTime())) return String(fechaIso || '');
  try {
    var parts = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(fecha);
    var dia = '';
    var mes = '';
    var anio = '';
    for (var i = 0; i < parts.length; i += 1) {
      if (parts[i].type === 'day') dia = parts[i].value;
      if (parts[i].type === 'month') mes = parts[i].value;
      if (parts[i].type === 'year') anio = parts[i].value;
    }
    if (!dia || !mes || !anio) return formatearFechaPerfil(fechaIso);
    return dia + ' de ' + mes + ' de ' + anio;
  } catch (_) {
    return formatearFechaPerfil(fechaIso);
  }
}

function renderValorMedidaProgreso(valor) {
  var texto = formatearNumeroProgreso(valor);
  if (texto === '—') return '<span class="progreso-medida-vacio">—</span>';
  return escapeHtmlPerfil(texto) + '<span class="progreso-medida-unidad">cm</span>';
}

function renderTarjetaProgreso(item, permitirEditar) {
  if (!item) {
    return '<article class="progreso-resumen-card progreso-vacio"><p class="perfil-reservas-empty">Aún no registraste mediciones. Usá “+ Registrar peso y medidas” para crear tu primer registro.</p></article>';
  }

  var pesoTexto = formatearNumeroProgreso(item.pesoKg);
  var editar = permitirEditar
    ? '<button type="button" class="boton boton-secundario boton-pequeno progreso-editar" data-id="' + escapeHtmlPerfil(item.idProgreso) + '">Editar</button>'
    : '';

  return [
    '<article class="progreso-resumen-card">',
    '  <header class="progreso-resumen-head">',
    '    <h3>Último registro</h3>',
    '    <p class="progreso-fecha">', escapeHtmlPerfil(formatearFechaLargaProgreso(item.fecha)), '</p>',
    '  </header>',
    '  <section class="progreso-peso-panel">',
    '    <div>',
    '      <p class="progreso-peso-etiqueta">Peso</p>',
    '      <p class="progreso-peso-valor"><span class="progreso-peso-numero">', escapeHtmlPerfil(pesoTexto), '</span><span class="progreso-peso-unidad">kg</span></p>',
    '    </div>',
    '    <div class="perfil-progreso-item-actions">', editar, '</div>',
    '  </section>',
    '  <section class="progreso-medidas-grid">',
    '    <div class="progreso-medida-item"><p class="progreso-medida-label">Cintura</p><p class="progreso-medida-valor">', renderValorMedidaProgreso(item.cinturaCm), '</p></div>',
    '    <div class="progreso-medida-item"><p class="progreso-medida-label">Cadera</p><p class="progreso-medida-valor">', renderValorMedidaProgreso(item.caderaCm), '</p></div>',
    '    <div class="progreso-medida-item"><p class="progreso-medida-label">Pecho</p><p class="progreso-medida-valor">', renderValorMedidaProgreso(item.pechoCm), '</p></div>',
    '    <div class="progreso-medida-item"><p class="progreso-medida-label">Brazo</p><p class="progreso-medida-valor">', renderValorMedidaProgreso(item.brazoCm), '</p></div>',
    '    <div class="progreso-medida-item"><p class="progreso-medida-label">Muslo</p><p class="progreso-medida-valor">', renderValorMedidaProgreso(item.musloCm), '</p></div>',
    '  </section>',
    '  <footer class="progreso-resumen-footer">',
    '    <a id="progreso-ver-historial" href="historial-progreso.html">Ver historial →</a>',
    '  </footer>',
    '</article>'
  ].join('');
}

function ordenarHistorialProgresoDesc(items) {
  return (items || []).slice().sort(function (a, b) {
    var fechaA = Date.parse(String((a && a.fecha) || '') + 'T00:00:00');
    var fechaB = Date.parse(String((b && b.fecha) || '') + 'T00:00:00');
    if (Number.isNaN(fechaA) && Number.isNaN(fechaB)) return Number((b && b.idProgreso) || 0) - Number((a && a.idProgreso) || 0);
    if (Number.isNaN(fechaA)) return 1;
    if (Number.isNaN(fechaB)) return -1;
    if (fechaB !== fechaA) return fechaB - fechaA;
    return Number((b && b.idProgreso) || 0) - Number((a && a.idProgreso) || 0);
  });
}

function renderHistorialProgreso() {
  var reciente = document.getElementById('progreso-reciente');
  if (!reciente) return;

  if (!perfilProgresoState.historial || perfilProgresoState.historial.length === 0) {
    reciente.innerHTML = renderTarjetaProgreso(null, false);
    return;
  }

  var primero = perfilProgresoState.historial[0];
  reciente.innerHTML = renderTarjetaProgreso(primero, true);
}

function cargarDatosProgresoDesdePerfil(data) {
  var nacimiento = document.getElementById('progreso-nacimiento');
  var edad = document.getElementById('progreso-edad');
  var sexo = document.getElementById('progreso-sexo');
  var actividad = document.getElementById('progreso-actividad');

  if (nacimiento) nacimiento.value = data && data.fechaNacimiento ? data.fechaNacimiento : '';
  if (edad) edad.value = data && data.edad != null ? String(data.edad) : calcularEdadDesdeFecha(data && data.fechaNacimiento ? data.fechaNacimiento : '');
  if (sexo) sexo.value = data && data.sexo ? data.sexo : '';
  if (actividad) actividad.value = data && data.nivelActividad ? data.nivelActividad : '';

  perfilProgresoState.historial = ordenarHistorialProgresoDesc((data && Array.isArray(data.historialProgreso)) ? data.historialProgreso : []);
  renderHistorialProgreso();
}

function cargarPerfil() {
  var form = document.getElementById('form-perfil');
  var mensaje = document.getElementById('perfil-mensaje');
  var rolSpan = document.getElementById('perfil-rol');
  var display = document.getElementById('perfil-avatar-display');
  var cambiar = document.getElementById('perfil-cambiar-foto');
  var eliminar = document.getElementById('perfil-eliminar-foto');

  if (!form && !rolSpan) return;

  fetch('/api/profile.ashx', { method: 'GET', credentials: 'same-origin' })
    .then(function(resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        throw new Error('unauthenticated');
      }
      if (resp.status >= 500) {
        if (mensaje) { mensaje.textContent = 'No fue posible cargar tu perfil. Intenta nuevamente.'; mensaje.style.color = '#ff6b6b'; }
        throw new Error('server-error');
      }
      if (resp.status === 404) {
        if (mensaje) { mensaje.textContent = 'No fue posible cargar tu perfil. Intenta nuevamente.'; mensaje.style.color = '#ff6b6b'; }
        throw new Error('not-found');
      }
      if (!resp.ok) {
        if (mensaje) { mensaje.textContent = 'No fue posible cargar tu perfil. Intenta nuevamente.'; mensaje.style.color = '#ff6b6b'; }
        throw new Error('http-error');
      }
      return resp.json();
    })
    .then(function(data) {
      if (!data) return;

      if (document.getElementById('perfil-nombre')) document.getElementById('perfil-nombre').value = data.nombre || '';
      if (document.getElementById('perfil-apellido1')) document.getElementById('perfil-apellido1').value = data.apellido1 || '';
      if (document.getElementById('perfil-apellido2')) document.getElementById('perfil-apellido2').value = data.apellido2 || '';
      if (document.getElementById('perfil-email')) document.getElementById('perfil-email').value = data.correo || '';
      if (document.getElementById('perfil-telefono')) document.getElementById('perfil-telefono').value = data.telefono || '';
      if (rolSpan) {
        rolSpan.textContent = data.rol || '';
        rolSpan.classList.add('perfil-rol-badge');
      }

      var nombreCompleto = [data.nombre, data.apellido1, data.apellido2].filter(function (x) {
        return String(x || '').trim() !== '';
      }).join(' ').trim();

      var nombreTitulo = document.getElementById('perfil-nombre-titulo');
      if (nombreTitulo) nombreTitulo.textContent = nombreCompleto || 'Mi nombre';

      var contactoCorreo = document.getElementById('perfil-contacto-correo');
      if (contactoCorreo) contactoCorreo.textContent = String(data.correo || '').trim() || '—';

      var contactoTelefono = document.getElementById('perfil-contacto-telefono');
      if (contactoTelefono) contactoTelefono.textContent = String(data.telefono || '').trim() || '—';

      var valorMembresia = String(data.estadoMembresia || data.membresia || data.membresiaEstado || '').trim();
      var membresiaNormalizada = valorMembresia.toLowerCase();
      var membresiaSinDato = !valorMembresia || membresiaNormalizada === 'n/a' || membresiaNormalizada === 'na' || membresiaNormalizada === 'no disponible' || membresiaNormalizada === 'sin membresia' || membresiaNormalizada === 'sin membresía' || membresiaNormalizada === 'ninguna' || membresiaNormalizada === 'no aplica';
      actualizarFilaResumenPerfil('fila-membresia', 'estado-membresia', membresiaSinDato ? '' : valorMembresia, { mostrarSinDatos: false });

      actualizarFilaResumenPerfil('fila-proxima-reserva', 'proxima-reserva', 'Cargando...', { mostrarSinDatos: true });
      fetch('/api/reservations.ashx', { method: 'GET', credentials: 'same-origin' })
        .then(function (respReservas) {
          if (respReservas.status === 401) return null;
          if (!respReservas.ok) throw new Error('reservas-http');
          return respReservas.json();
        })
        .then(function (reservasData) {
          if (!reservasData || reservasData.success === false) {
            actualizarFilaResumenPerfil('fila-proxima-reserva', 'proxima-reserva', 'No disponible', { error: true });
            return;
          }

          var reservasNorm = (Array.isArray(reservasData.reservas) ? reservasData.reservas : []).map(normalizarReservaPerfil).filter(Boolean);
          var textoProxima = obtenerTextoProximaReservaDesdeItemsPerfil(reservasNorm);
          actualizarFilaResumenPerfil('fila-proxima-reserva', 'proxima-reserva', textoProxima, { mostrarSinDatos: true });
        })
        .catch(function () {
          actualizarFilaResumenPerfil('fila-proxima-reserva', 'proxima-reserva', 'No disponible', { error: true });
        });

      actualizarFilaResumenPerfil('fila-rutina-asignada', 'rutina-asignada', 'Cargando...', { mostrarSinDatos: true });
      fetch('/api/routines-my.ashx', { method: 'GET', credentials: 'same-origin' })
        .then(function (respRutinas) {
          if (respRutinas.status === 401) return null;
          if (!respRutinas.ok) throw new Error('rutinas-http');
          return respRutinas.json();
        })
        .then(function (rutinasData) {
          if (!rutinasData || rutinasData.success === false) {
            actualizarFilaResumenPerfil('fila-rutina-asignada', 'rutina-asignada', 'No disponible', { error: true });
            return;
          }

          var planes = Array.isArray(rutinasData.planes) ? rutinasData.planes : [];
          var vigente = planes.find(function (p) {
            return p && p.asignacion && Number(p.asignacion.Vigente) === 1 && p.plan && p.plan.Nombre;
          }) || planes.find(function (p) {
            return p && p.plan && p.plan.Nombre;
          });

          if (!vigente || !vigente.plan || !vigente.plan.Nombre) {
            actualizarFilaResumenPerfil('fila-rutina-asignada', 'rutina-asignada', '', { mostrarSinDatos: false });
            return;
          }

          actualizarFilaResumenPerfil('fila-rutina-asignada', 'rutina-asignada', String(vigente.plan.Nombre).trim(), { mostrarSinDatos: false });
        })
        .catch(function () {
          actualizarFilaResumenPerfil('fila-rutina-asignada', 'rutina-asignada', 'No disponible', { error: true });
        });

      aplicarVistaPorRol(data.rol);
      aplicarNavegacionInicialPerfil();
      cargarDatosProgresoDesdePerfil(data);

      if (display) {
        var defaultPlaceholder = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.59 21C20.21 18.53 17.76 16.67 15 16.67H9C6.24 16.67 3.79 18.53 3.41 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        if (data.fotoUrl) {
          display.innerHTML = '';
          var imgPersistida = document.createElement('img');
          imgPersistida.src = data.fotoUrl;
          imgPersistida.alt = 'Foto de perfil';
          display.appendChild(imgPersistida);
          if (cambiar) cambiar.style.display = '';
          if (eliminar) eliminar.style.display = '';
        } else {
          display.innerHTML = defaultPlaceholder;
          if (cambiar) cambiar.style.display = 'none';
          if (eliminar) eliminar.style.display = 'none';
        }
      }
    })
    .catch(function(err) {
      if (err && err.message === 'unauthenticated') return;
      if (err && (err.message === 'server-error' || err.message === 'not-found' || err.message === 'http-error')) return;
      if (mensaje) { mensaje.textContent = 'No fue posible conectar con el servidor. Intenta nuevamente.'; mensaje.style.color = '#ff6b6b'; }
    });
}

function initPerfilProgreso() {
  var formDatos = document.getElementById('form-perfil-progreso-datos');
  var formMedicion = document.getElementById('form-progreso-medicion');
  var reciente = document.getElementById('progreso-reciente');
  var modal = document.getElementById('progreso-medicion-modal');
  if (!formDatos || !formMedicion || !reciente || !modal) return;

  var inputNacimiento = document.getElementById('progreso-nacimiento');
  var inputEdad = document.getElementById('progreso-edad');
  var inputSexo = document.getElementById('progreso-sexo');
  var inputActividad = document.getElementById('progreso-actividad');

  var inputId = document.getElementById('progreso-id');
  var inputFecha = document.getElementById('progreso-fecha');
  var inputPeso = document.getElementById('progreso-peso');
  var inputCintura = document.getElementById('progreso-cintura');
  var inputCadera = document.getElementById('progreso-cadera');
  var inputPecho = document.getElementById('progreso-pecho');
  var inputBrazo = document.getElementById('progreso-brazo');
  var inputMuslo = document.getElementById('progreso-muslo');
  var btnGuardar = document.getElementById('progreso-guardar-btn');
  var btnCancelarEdicion = document.getElementById('progreso-cancelar-edicion');
  var btnAbrirModal = document.getElementById('progreso-abrir-modal');

  function resetFormularioMedicion() {
    if (inputId) inputId.value = '';
    if (inputFecha) inputFecha.value = '';
    if (inputPeso) inputPeso.value = '';
    if (inputCintura) inputCintura.value = '';
    if (inputCadera) inputCadera.value = '';
    if (inputPecho) inputPecho.value = '';
    if (inputBrazo) inputBrazo.value = '';
    if (inputMuslo) inputMuslo.value = '';
    if (btnGuardar) btnGuardar.textContent = 'Guardar registro';
  }

  function cargarFormularioMedicion(item) {
    resetFormularioMedicion();
    if (!item) return;
    if (inputId) inputId.value = String(item.idProgreso || '');
    if (inputFecha) inputFecha.value = item.fecha || '';
    if (inputPeso) inputPeso.value = item.pesoKg != null ? String(item.pesoKg).replace('.', ',') : '';
    if (inputCintura) inputCintura.value = item.cinturaCm != null ? String(item.cinturaCm).replace('.', ',') : '';
    if (inputCadera) inputCadera.value = item.caderaCm != null ? String(item.caderaCm).replace('.', ',') : '';
    if (inputPecho) inputPecho.value = item.pechoCm != null ? String(item.pechoCm).replace('.', ',') : '';
    if (inputBrazo) inputBrazo.value = item.brazoCm != null ? String(item.brazoCm).replace('.', ',') : '';
    if (inputMuslo) inputMuslo.value = item.musloCm != null ? String(item.musloCm).replace('.', ',') : '';
    if (btnGuardar) btnGuardar.textContent = 'Guardar corrección';
  }

  function abrirModalMedicion(item) {
    cargarFormularioMedicion(item || null);
    setMensajeProgreso('progreso-medicion-mensaje', item ? ('Editando registro del ' + (item.fecha || '') + '.') : '', false);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (inputFecha) inputFecha.focus();
  }

  function cerrarModalMedicion() {
    modal.hidden = true;
    document.body.style.overflow = '';
    setMensajeProgreso('progreso-medicion-mensaje', '', false);
  }

  function buscarRegistroPorId(idProgreso) {
    for (var i = 0; i < perfilProgresoState.historial.length; i += 1) {
      if (Number(perfilProgresoState.historial[i].idProgreso) === Number(idProgreso)) return perfilProgresoState.historial[i];
    }
    return null;
  }

  if (inputNacimiento) {
    inputNacimiento.addEventListener('change', function() {
      if (inputEdad) inputEdad.value = calcularEdadDesdeFecha(inputNacimiento.value);
    });
  }

  formDatos.addEventListener('submit', function(e) {
    e.preventDefault();

    var payload = {
      fechaNacimiento: inputNacimiento ? inputNacimiento.value : '',
      sexo: inputSexo ? inputSexo.value : '',
      nivelActividad: inputActividad ? inputActividad.value : ''
    };

    var botonDatos = formDatos.querySelector('button[type="submit"]');
    if (botonDatos.disabled) return;
    botonDatos.disabled = true;
    fetch('/api/profile.ashx?action=savePersonalProgress', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function(resp) { return resp.json().then(function(body) { body.__status = resp.status; return body; }); })
      .then(function(data) {
        if (!data) return;
        if (data.__status >= 400 || data.success === false) {
          setMensajeProgreso('progreso-datos-mensaje', data.message || 'No fue posible guardar los datos personales.', true);
          return;
        }
        setMensajeProgreso('progreso-datos-mensaje', data.message || 'Datos personales guardados.', false);
        cargarPerfil();
      })
      .catch(function() {
        setMensajeProgreso('progreso-datos-mensaje', 'No fue posible conectar con el servidor.', true);
      })
      .finally(function() { botonDatos.disabled = false; });
  });

  formMedicion.addEventListener('submit', function(e) {
    e.preventDefault();

    var fecha = inputFecha ? inputFecha.value.trim() : '';
    var peso = inputPeso ? inputPeso.value.trim() : '';

    if (!fecha) {
      setMensajeProgreso('progreso-medicion-mensaje', 'La fecha es obligatoria.', true);
      return;
    }
    if (!peso) {
      setMensajeProgreso('progreso-medicion-mensaje', 'El peso es obligatorio.', true);
      return;
    }

    var payload = {
      fecha: fecha,
      pesoKg: peso,
      cinturaCm: inputCintura ? inputCintura.value.trim() : '',
      caderaCm: inputCadera ? inputCadera.value.trim() : '',
      pechoCm: inputPecho ? inputPecho.value.trim() : '',
      brazoCm: inputBrazo ? inputBrazo.value.trim() : '',
      musloCm: inputMuslo ? inputMuslo.value.trim() : ''
    };

    var idEdicion = inputId ? inputId.value.trim() : '';
    if (idEdicion) payload.idProgreso = idEdicion;

    if (btnGuardar.disabled) return;
    btnGuardar.disabled = true;
    fetch('/api/profile.ashx?action=saveProgress', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function(resp) { return resp.json().then(function(body) { body.__status = resp.status; return body; }); })
      .then(function(data) {
        if (!data) return;
        if (data.__status >= 400 || data.success === false) {
          setMensajeProgreso('progreso-medicion-mensaje', data.message || 'No fue posible guardar el registro.', true);
          return;
        }
        cargarPerfil();
        cerrarModalMedicion();
      })
      .catch(function() {
        setMensajeProgreso('progreso-medicion-mensaje', 'No fue posible conectar con el servidor.', true);
      })
      .finally(function() { btnGuardar.disabled = false; });
  });

  if (btnAbrirModal) {
    btnAbrirModal.addEventListener('click', function () {
      abrirModalMedicion(null);
    });
  }

  if (btnCancelarEdicion) {
    btnCancelarEdicion.addEventListener('click', function() {
      cerrarModalMedicion();
    });
  }

  reciente.addEventListener('click', function (e) {
    var btn = e.target.closest('.progreso-editar');
    if (!btn) return;

    var id = parseInt(btn.getAttribute('data-id') || '0', 10);
    if (!id) return;

    var item = buscarRegistroPorId(id);
    if (!item) return;
    abrirModalMedicion(item);
  });

  modal.addEventListener('click', function (e) {
    if (e.target === modal) cerrarModalMedicion();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) cerrarModalMedicion();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  mostrarSeccionPerfil('perfil-datos');
  leerNavegacionInicialPerfilDesdeUrl();
  initNavegacionPerfil();
  initPerfilProgreso();
  cargarPerfil();
});

// Edit mode handling
document.addEventListener('DOMContentLoaded', function() {
  var editarBtn = document.createElement('button');
  editarBtn.type = 'button';
  editarBtn.id = 'perfil-editar-btn';
  editarBtn.className = 'boton boton-principal boton-pequeno';
  editarBtn.innerHTML = '<span aria-hidden="true">✎</span><span>Editar perfil</span>';

  var form = document.getElementById('form-perfil');
  if (!form) return;

  // Insert editar button in account card header
  var submit = form.querySelector('button[type=submit]');
  var panelEdicion = document.getElementById('perfil-edicion-panel');
  var encabezado = form.querySelector('#perfil-datos .perfil-cuenta-card .perfil-encabezado');
  if (encabezado) encabezado.appendChild(editarBtn);
  else if (submit && submit.parentNode) submit.parentNode.insertBefore(editarBtn, submit);
  submit.style.display = 'none';
  submit.disabled = true;

  var cancelarBtn = document.createElement('button');
  cancelarBtn.type = 'button';
  cancelarBtn.id = 'perfil-cancelar-btn';
  cancelarBtn.className = 'boton boton-secundario';
  cancelarBtn.textContent = 'Cancelar';
  cancelarBtn.style.display = 'none';
  submit.parentNode.insertBefore(cancelarBtn, submit);

  // Fields
  var fNombre = document.getElementById('perfil-nombre');
  var fApellido1 = document.getElementById('perfil-apellido1');
  var fApellido2 = document.getElementById('perfil-apellido2');
  var fCorreo = document.getElementById('perfil-email');
  var fTelefono = document.getElementById('perfil-telefono');

  // Keep original values for cancel
  var original = {};

  function setReadOnlyMode() {
    if (fNombre) fNombre.readOnly = true;
    if (fApellido1) fApellido1.readOnly = true;
    if (fApellido2) fApellido2.readOnly = true;
    if (fCorreo) fCorreo.readOnly = true; // always readonly
    if (fTelefono) fTelefono.readOnly = true;
    if (panelEdicion) panelEdicion.hidden = true;
    cancelarBtn.style.display = 'none';
    submit.style.display = 'none';
    submit.disabled = true;
  }

  function setEditMode() {
    if (fNombre) fNombre.readOnly = false;
    if (fApellido1) fApellido1.readOnly = false;
    if (fApellido2) fApellido2.readOnly = false;
    if (fTelefono) fTelefono.readOnly = false;
    if (fCorreo) fCorreo.readOnly = true; // always readonly
    if (panelEdicion) panelEdicion.hidden = false;
    cancelarBtn.style.display = '';
    submit.style.display = '';
    submit.disabled = false;
  }

  function guardarOriginales() {
    original.nombre = fNombre ? fNombre.value : '';
    original.apellido1 = fApellido1 ? fApellido1.value : '';
    original.apellido2 = fApellido2 ? fApellido2.value : '';
    original.telefono = fTelefono ? fTelefono.value : '';
  }

  function restaurarOriginales() {
    if (fNombre) fNombre.value = original.nombre || '';
    if (fApellido1) fApellido1.value = original.apellido1 || '';
    if (fApellido2) fApellido2.value = original.apellido2 || '';
    if (fTelefono) fTelefono.value = original.telefono || '';
  }

  // Start read-only
  setReadOnlyMode();
  // Do NOT capture original values immediately: cargarPerfil() is async and
  // would overwrite 'original' with empty strings if we read before the
  // server response arrives. Capture originals only when entering edit mode.

  editarBtn.addEventListener('click', function() {
    guardarOriginales();
    setEditMode();
  });

  cancelarBtn.addEventListener('click', function() {
    restaurarOriginales();
    setReadOnlyMode();
  });

  // Handle submit (Guardar cambios)
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var mensaje = document.getElementById('perfil-mensaje');
    // Frontend validation
    if (!fNombre || !fNombre.value.trim()) {
      if (mensaje) { mensaje.textContent = 'Nombre es obligatorio.'; mensaje.style.color = '#ff6b6b'; }
      return;
    }
    if (!fApellido1 || !fApellido1.value.trim()) {
      if (mensaje) { mensaje.textContent = 'Primer apellido es obligatorio.'; mensaje.style.color = '#ff6b6b'; }
      return;
    }

    var payload = {
      nombre: fNombre.value.trim(),
      apellido1: fApellido1.value.trim(),
      apellido2: fApellido2 ? fApellido2.value.trim() : null,
      telefono: fTelefono ? fTelefono.value.trim() : null
    };

    fetch('/api/profile.ashx', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(resp) { return resp.json().then(function(body){ body.__status = resp.status; return body; }); })
    .then(function(data) {
      if (!data) return;
      if (data.__status === 401) {
        if (mensaje) { mensaje.textContent = 'No autorizado.'; mensaje.style.color = '#ff6b6b'; }
        return;
      }
      if (data.__status === 400 || (data && data.success === false)) {
        if (mensaje) { mensaje.textContent = data.message || 'Error de validación.'; mensaje.style.color = '#ff6b6b'; }
        return;
      }
      // Success
      if (mensaje) { mensaje.textContent = data.message || 'Perfil actualizado correctamente.'; mensaje.style.color = '#ED1C2E'; }
      setReadOnlyMode();
      // Refresh data from server to ensure stored values are shown
      cargarPerfil();
    })
    .catch(function() {
      if (mensaje) { mensaje.textContent = 'Error de red o servidor.'; mensaje.style.color = '#ff6b6b'; }
    });
  });

});

// Avatar: interfaz modal para gestión de fotografía
document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('perfil-foto-input');
  var display = document.getElementById('perfil-avatar-display');
  var avatarButton = document.getElementById('perfil-avatar-button');
  var mensaje = document.getElementById('perfil-mensaje');

  var modal = document.getElementById('perfil-foto-modal');
  var modalBackdrop = document.getElementById('perfil-foto-backdrop');
  var modalAvatar = document.getElementById('modal-avatar-display');
  var modalSelect = document.getElementById('modal-select-photo');
  var modalDelete = document.getElementById('modal-delete-photo');
  var modalCancel = document.getElementById('modal-cancel');
  var modalSave = document.getElementById('modal-save');
  var modalMessage = document.getElementById('modal-message');

  if (!input || !display || !modal) return;

  var defaultPlaceholder = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.59 21C20.21 18.53 17.76 16.67 15 16.67H9C6.24 16.67 3.79 18.53 3.41 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function setMensaje(texto, ok) {
    if (!mensaje) return;
    mensaje.textContent = texto || '';
    mensaje.style.color = ok ? '#ED1C2E' : '#ff6b6b';
  }

  function subirFoto(file) {
    var fd = new FormData();
    fd.append('action', 'uploadPhoto');
    fd.append('foto', file);

    return fetch('/api/profile.ashx', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd
    })
    .then(function(resp) {
      return resp.json().then(function(body) { body.__status = resp.status; return body; });
    });
  }

  function eliminarFoto() {
    var fd = new FormData();
    fd.append('action', 'deletePhoto');

    return fetch('/api/profile.ashx', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd
    })
    .then(function(resp) {
      return resp.json().then(function(body) { body.__status = resp.status; return body; });
    });
  }

  var modalOpen = false;
  var pendingFile = null;
  var pendingDelete = false;
  var isSaving = false;

  function openModal() {
    if (modalOpen) return;
    modal.hidden = false;
    modalOpen = true;
    pendingFile = null; pendingDelete = false; isSaving = false;
    if (modalMessage) modalMessage.textContent = '';
    modalSave.disabled = true;
    modalCancel.disabled = false;
    modalSelect.disabled = false;
    modalAvatar.innerHTML = display.innerHTML || defaultPlaceholder;
    var hasFoto = !!display.querySelector('img');
    if (modalDelete) modalDelete.style.display = hasFoto ? '' : 'none';
    if (modalSelect) modalSelect.focus();
    document.body.classList.add('modal-open');
  }

  function closeModal(restore) {
    if (isSaving) return;
    modal.hidden = true;
    modalOpen = false;
    pendingFile = null; pendingDelete = false; isSaving = false;
    if (avatarButton) avatarButton.focus();
    document.body.classList.remove('modal-open');
  }

  if (avatarButton) avatarButton.addEventListener('click', openModal);
  display.addEventListener('click', openModal);

  if (modalBackdrop) modalBackdrop.addEventListener('click', function() { closeModal(true); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && modalOpen && !isSaving) closeModal(true); });

  if (modalSelect) modalSelect.addEventListener('click', function() { input.click(); });

  if (modalDelete) modalDelete.addEventListener('click', function() {
    pendingDelete = true; pendingFile = null;
    modalAvatar.innerHTML = defaultPlaceholder;
    modalSave.disabled = false;
    if (modalMessage) modalMessage.textContent = '';
  });

  if (modalCancel) modalCancel.addEventListener('click', function() { closeModal(true); });

  if (modalSave) modalSave.addEventListener('click', function() {
    if (isSaving) return;
    isSaving = true;
    modalSave.disabled = true; modalCancel.disabled = true; modalSelect.disabled = true;
    if (modalMessage) modalMessage.textContent = 'Guardando...';

    if (pendingFile) {
      subirFoto(pendingFile)
        .then(function(data) { finishSave(data); })
        .catch(function() { finishSave(null, true); });
    } else if (pendingDelete) {
      eliminarFoto()
        .then(function(data) { finishSave(data); })
        .catch(function() { finishSave(null, true); });
    } else {
      isSaving = false; modalSave.disabled = false; modalCancel.disabled = false; modalSelect.disabled = false; if (modalMessage) modalMessage.textContent = 'No hay cambios.';
    }
  });

  function finishSave(data, networkError) {
    isSaving = false; modalCancel.disabled = false; modalSelect.disabled = false;
    if (networkError || !data || data.__status >= 400 || data.success === false) {
      if (modalMessage) modalMessage.textContent = networkError ? 'No fue posible conectar con el servidor.' : (data && data.message) || 'No fue posible guardar los cambios.';
      modalSave.disabled = false;
      return;
    }

    cargarPerfil();
    if (modalMessage) modalMessage.textContent = data.message || 'Cambios guardados.';
    setTimeout(function() { closeModal(false); }, 700);
  }

  input.addEventListener('change', function(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    var accept = ['image/jpeg', 'image/png'];
    if (accept.indexOf(file.type) === -1) {
      if (modalMessage) modalMessage.textContent = 'Formato no permitido. Use JPEG o PNG.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (modalMessage) modalMessage.textContent = 'La imagen supera el tamaño máximo permitido (5 MB).';
      input.value = '';
      return;
    }

    if (modalOpen) {
      pendingFile = file; pendingDelete = false;
      var url = URL.createObjectURL(file);
      modalAvatar.innerHTML = '';
      var img = document.createElement('img');
      img.src = url;
      img.alt = 'Foto de perfil';
      img.onload = function() { URL.revokeObjectURL(url); };
      modalAvatar.appendChild(img);
      if (modalMessage) modalMessage.textContent = '';
      modalSave.disabled = false;
    } else {
      // Fallback: if modal not open, perform immediate upload (legacy behavior)
      subirFoto(file).then(function(data) {
        if (!data || data.__status >= 400 || data.success === false) {
          setMensaje((data && data.message) || 'No fue posible guardar la foto de perfil.', false);
          cargarPerfil();
          return;
        }
        if (data.fotoUrl) {
          display.innerHTML = '';
          var imgPersistida = document.createElement('img');
          imgPersistida.src = data.fotoUrl;
          imgPersistida.alt = 'Foto de perfil';
          display.appendChild(imgPersistida);
        }
        setMensaje(data.message || 'Foto guardada correctamente.', true);
        input.value = '';
      }).catch(function() { setMensaje('No fue posible conectar con el servidor.', false); cargarPerfil(); });
    }
  });
});

// Cambio de contraseña
function initCambioContrasena() {
  var abrirBtn = document.getElementById('sidebar-cambiar-clave');
  var overlay = document.getElementById('perfil-clave-modal');
  var form = document.getElementById('perfil-clave-form');
  var cancelar = document.getElementById('perfil-clave-cancelar');
  var mensaje = document.getElementById('perfil-clave-mensaje');

  if (!overlay || !form || !cancelar) return;

  overlay.hidden = true;
  overlay.classList.remove('is-open');

  if (!abrirBtn) return;

  var actual = document.getElementById('clave-actual');
  var nueva = document.getElementById('clave-nueva');
  var confirmar = document.getElementById('clave-confirmar');

  var errActual = document.getElementById('clave-actual-error');
  var errNueva = document.getElementById('clave-nueva-error');
  var errConfirmar = document.getElementById('clave-confirmar-error');

  var reqLen = document.getElementById('policy-len');
  var reqUpper = document.getElementById('policy-upper');
  var reqLower = document.getElementById('policy-lower');
  var reqNum = document.getElementById('policy-num');

  function limpiarErrores() {
    if (errActual) errActual.textContent = '';
    if (errNueva) errNueva.textContent = '';
    if (errConfirmar) errConfirmar.textContent = '';
    if (mensaje) { mensaje.textContent = ''; mensaje.style.color = ''; }
  }

  function limpiarFormulario() {
    if (actual) actual.value = '';
    if (nueva) nueva.value = '';
    if (confirmar) confirmar.value = '';
    limpiarErrores();
    actualizarIndicadores();
  }

  function abrirModal() {
    overlay.hidden = false;
    overlay.classList.add('is-open');
    document.body.classList.add('modal-open');
    limpiarFormulario();
    if (actual) actual.focus();
  }

  function cerrarModal() {
    overlay.classList.remove('is-open');
    overlay.hidden = true;
    document.body.classList.remove('modal-open');
    limpiarFormulario();
  }

  function manejarEscape(e) {
    if (e.key === 'Escape' && !overlay.hidden) {
      cerrarModal();
    }
  }

  function cumpleLen(valor) { return valor && valor.length >= 8; }
  function tieneMayus(valor) { return /[A-Z]/.test(valor || ''); }
  function tieneMinus(valor) { return /[a-z]/.test(valor || ''); }
  function tieneNum(valor) { return /[0-9]/.test(valor || ''); }

  function pintarIndicador(el, ok) {
    if (!el) return;
    el.className = ok ? 'policy-ok' : 'policy-off';
    el.textContent = (ok ? '✓ ' : '• ') + el.textContent.replace('✓ ', '').replace('• ', '');
  }

  function actualizarIndicadores() {
    var v = nueva ? nueva.value : '';
    pintarIndicador(reqLen, cumpleLen(v));
    pintarIndicador(reqUpper, tieneMayus(v));
    pintarIndicador(reqLower, tieneMinus(v));
    pintarIndicador(reqNum, tieneNum(v));
  }

  function politicaValida(valor) {
    return cumpleLen(valor) && tieneMayus(valor) && tieneMinus(valor) && tieneNum(valor);
  }

  function validar() {
    limpiarErrores();
    var ok = true;

    var vActual = actual ? actual.value : '';
    var vNueva = nueva ? nueva.value : '';
    var vConfirmar = confirmar ? confirmar.value : '';

    if (!vActual) {
      if (errActual) errActual.textContent = 'Ingresa tu contraseña actual.';
      ok = false;
    }

    if (!vNueva) {
      if (errNueva) errNueva.textContent = 'Ingresa tu nueva contraseña.';
      ok = false;
    } else if (!politicaValida(vNueva)) {
      if (errNueva) errNueva.textContent = 'La nueva contraseña no cumple con los requisitos de seguridad.';
      ok = false;
    }

    if (!vConfirmar) {
      if (errConfirmar) errConfirmar.textContent = 'Confirma tu nueva contraseña.';
      ok = false;
    } else if (vNueva !== vConfirmar) {
      if (errConfirmar) errConfirmar.textContent = 'Las contraseñas no coinciden.';
      ok = false;
    }

    if (vActual && vNueva && vActual === vNueva) {
      if (errNueva) errNueva.textContent = 'La nueva contraseña no puede ser idéntica a la contraseña actual.';
      ok = false;
    }

    return ok;
  }

  abrirBtn.addEventListener('click', abrirModal);
  cancelar.addEventListener('click', cerrarModal);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) cerrarModal();
  });

  document.addEventListener('keydown', manejarEscape);

  if (nueva) {
    nueva.addEventListener('input', actualizarIndicadores);
  }

  var toggles = overlay.querySelectorAll('.perfil-toggle-clave');
  for (var i = 0; i < toggles.length; i++) {
    toggles[i].addEventListener('click', function() {
      var targetId = this.getAttribute('data-target');
      var inputTarget = document.getElementById(targetId);
      if (!inputTarget) return;
      var mostrar = inputTarget.type === 'password';
      inputTarget.type = mostrar ? 'text' : 'password';
      var use = this.querySelector('use');
      if (use) use.setAttribute('href', mostrar ? '#i-eye-off' : '#i-eye');
    });
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!validar()) return;

    fetch('/api/change_password.ashx', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actual: actual.value,
        nueva: nueva.value,
        confirmar: confirmar.value
      })
    })
    .then(function(resp) {
      return resp.json().then(function(body) {
        body.__status = resp.status;
        return body;
      });
    })
    .then(function(data) {
      if (!data) return;
      if (data.__status === 401) {
        if (mensaje) { mensaje.textContent = 'No autorizado.'; mensaje.style.color = '#ff6b6b'; }
        return;
      }
      if (data.__status >= 400 || data.success === false) {
        if (mensaje) { mensaje.textContent = data.message || 'No fue posible actualizar la contraseña.'; mensaje.style.color = '#ff6b6b'; }
        return;
      }
      if (mensaje) {
        mensaje.textContent = 'Contraseña actualizada. Tu contraseña se cambió correctamente.';
        mensaje.style.color = '#ED1C2E';
      }
      setTimeout(function() {
        cerrarModal();
      }, 900);
    })
    .catch(function() {
      if (mensaje) { mensaje.textContent = 'No fue posible conectar con el servidor.'; mensaje.style.color = '#ff6b6b'; }
    });
  });

  actualizarIndicadores();
}

document.addEventListener('DOMContentLoaded', initCambioContrasena);
