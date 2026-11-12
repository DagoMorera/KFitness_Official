var reservasState = {
  sesiones: [],
  servicios: [],
  sesionesPorId: {},
  csrfToken: '',
  enviando: false,
  preseleccionServicio: '',
  preseleccionPromocion: '',
  modoPromocion: false,
  promocionActiva: null
};

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizarTextoMojibake(texto) {
  var valor = String(texto == null ? '' : texto);
  return valor
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã/g, 'Á');
}

function mostrarMensajeReserva(texto, exito, esHtml) {
  var mensaje = document.getElementById('reserva-mensaje');
  if (!mensaje) return;

  mensaje.classList.remove('reserva-mensaje-exito', 'reserva-mensaje-error');
  if (exito) mensaje.classList.add('reserva-mensaje-exito');
  else mensaje.classList.add('reserva-mensaje-error');

  var textoSeguro = normalizarTextoMojibake(texto || '');

  if (esHtml) {
    mensaje.innerHTML = textoSeguro;
    return;
  }

  mensaje.textContent = textoSeguro;
}

function formatearSesionBreve(sesion) {
  if (!sesion) return '';
  return formatearFecha(sesion.fecha) + ' · ' + String(sesion.horaInicio || '') + ' - ' + String(sesion.horaFin || '');
}

function obtenerParametrosReservaIniciales() {
  var params = new URLSearchParams(window.location.search || '');
  var idServicio = String(params.get('idServicio') || '').trim();
  var idPromocion = String(params.get('idPromocion') || '').trim();

  return {
    idServicio: /^\d+$/.test(idServicio) ? idServicio : '',
    idPromocion: /^\d+$/.test(idPromocion) ? idPromocion : ''
  };
}

function redirigirLoginConRetorno() {
  var retorno = window.location.pathname + (window.location.search || '');
  window.location.href = '/login.html?returnUrl=' + encodeURIComponent(retorno);
}

function beneficioPromocionTexto(promocion) {
  if (!promocion) return '';
  var tipo = String(promocion.tipoPromocion || '').toUpperCase();
  if (tipo !== 'DOS_POR_UNO') return '';
  var compra = promocion.cantidadCompra != null ? Number(promocion.cantidadCompra) : 1;
  var entrega = promocion.cantidadEntrega != null ? Number(promocion.cantidadEntrega) : 2;
  return 'Promoción 2x1 activa: ' + entrega + ' sesiones por el precio de ' + compra + '.';
}

function actualizarUIBeneficioPromocion() {
  var bloque = document.getElementById('reserva-promocion-beneficio');
  var label2 = document.getElementById('reserva-sesion-secundaria-label');
  var select2 = document.getElementById('reserva-sesion-secundaria');
  if (!bloque || !label2 || !select2) return;

  if (!reservasState.modoPromocion || !reservasState.promocionActiva) {
    bloque.hidden = true;
    bloque.textContent = '';
    label2.hidden = true;
    select2.hidden = true;
    select2.disabled = true;
    select2.required = false;
    return;
  }

  bloque.hidden = false;
  bloque.style.color = '#f2f2f2';
  bloque.textContent = beneficioPromocionTexto(reservasState.promocionActiva);
  label2.hidden = false;
  select2.hidden = false;
  select2.disabled = false;
  select2.required = true;
}

function cargarPromocionPreseleccionada() {
  if (!reservasState.preseleccionPromocion) {
    reservasState.modoPromocion = false;
    reservasState.promocionActiva = null;
    actualizarUIBeneficioPromocion();
    return Promise.resolve(null);
  }

  return fetch('/api/promotions.ashx?id=' + encodeURIComponent(String(reservasState.preseleccionPromocion)), { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (!resp.ok) throw new Error('La promoción seleccionada no está disponible.');
      return resp.json();
    })
    .then(function (data) {
      var promo = data && data.success ? data.promocion : null;
      if (!promo) throw new Error((data && data.message) || 'La promoción seleccionada no está disponible.');

      var tipo = String(promo.tipoPromocion || '').toUpperCase();
      if (tipo !== 'DOS_POR_UNO') throw new Error('La promoción seleccionada no corresponde al beneficio 2x1.');

      reservasState.modoPromocion = true;
      reservasState.promocionActiva = promo;
      if (!reservasState.preseleccionServicio && promo.idProducto) {
        reservasState.preseleccionServicio = String(promo.idProducto);
      }
      actualizarUIBeneficioPromocion();
      return promo;
    })
    .catch(function (err) {
      reservasState.modoPromocion = false;
      reservasState.promocionActiva = null;
      actualizarUIBeneficioPromocion();
      mostrarMensajeReserva((err && err.message) || 'No fue posible aplicar la promoción seleccionada.', false);
      return null;
    });
}

function aplicarPreseleccionPromocion() {
  var servicioSelect = document.getElementById('reserva-servicio');
  if (!servicioSelect) return;

  var idServicio = reservasState.preseleccionServicio;
  if (!idServicio) return;

  if (!servicioSelect.querySelector('option[value="' + idServicio + '"]')) {
    mostrarMensajeReserva('La promoción seleccionada no tiene sesiones disponibles por ahora. Puedes elegir otro servicio.', false);
    return;
  }

  servicioSelect.value = idServicio;
  poblarSesionesPorServicio(idServicio, false);

  var sesionSelect = document.getElementById('reserva-sesion');
  var totalOpciones = sesionSelect ? sesionSelect.querySelectorAll('option:not([value=""])').length : 0;
  if (!totalOpciones) {
    mostrarMensajeReserva('La promoción seleccionada no tiene sesiones disponibles por ahora. Puedes elegir otro servicio.', false);
    return;
  }

  var mensaje = 'Servicio preseleccionado desde promoción';
  if (reservasState.preseleccionPromocion) {
    mensaje += ' #' + reservasState.preseleccionPromocion;
  }
  mensaje += '. Selecciona una sesión para continuar.';
  mostrarMensajeReserva(mensaje, true);
}

function formatearFecha(fechaIso) {
  var fecha = new Date(String(fechaIso || '') + 'T00:00:00');
  if (Number.isNaN(fecha.getTime())) return String(fechaIso || '');
  return fecha.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function obtenerFechaHora(fechaIso, hora) {
  return new Date(String(fechaIso || '') + 'T' + String(hora || '') + ':00');
}

function normalizarSesion(item) {
  if (!item) return null;
  return {
    idHorarioServicio: item.idHorarioServicio != null ? item.idHorarioServicio : item.IdHorarioServicio,
    idProducto: item.idProducto != null ? item.idProducto : item.IdProducto,
    servicio: item.servicio != null ? item.servicio : item.Servicio,
    fecha: item.fecha != null ? item.fecha : item.Fecha,
    horaInicio: item.horaInicio != null ? item.horaInicio : item.HoraInicio,
    horaFin: item.horaFin != null ? item.horaFin : item.HoraFin,
    capacidadMaxima: Number(item.capacidadMaxima != null ? item.capacidadMaxima : item.CapacidadMaxima || 0),
    cuposRestantes: Number(item.cuposRestantes != null ? item.cuposRestantes : item.CuposRestantes || 0),
    completo: !!(item.completo != null ? item.completo : item.Completo),
    instructor: item.instructor != null ? item.instructor : item.Instructor
  };
}

function evaluarDisponibilidadSesion(sesion) {
  var inicio = obtenerFechaHora(sesion.fecha, sesion.horaInicio);
  if (Number.isNaN(inicio.getTime())) return { disponible: false, motivo: 'Fecha u hora inválida.' };
  if (inicio <= new Date()) return { disponible: false, motivo: 'Sesión vencida.' };
  if (sesion.completo || sesion.cuposRestantes <= 0) return { disponible: false, motivo: 'Sin cupos.' };
  return { disponible: true, motivo: '' };
}

function setReservaFormularioBloqueado(bloqueado) {
  reservasState.enviando = !!bloqueado;
  var boton = document.getElementById('reserva-confirmar');
  var servicio = document.getElementById('reserva-servicio');
  var sesion = document.getElementById('reserva-sesion');
  var sesionSecundaria = document.getElementById('reserva-sesion-secundaria');
  var observaciones = document.getElementById('reserva-observaciones');
  var cards = document.querySelectorAll('.reserva-sesion-card');
  if (boton) boton.disabled = !!bloqueado;
  if (servicio) servicio.disabled = !!bloqueado;
  if (sesion) sesion.disabled = !!bloqueado;
  if (sesionSecundaria) sesionSecundaria.disabled = !!bloqueado || sesionSecundaria.hidden;
  if (observaciones) observaciones.disabled = !!bloqueado;
  cards.forEach(function (card) {
    if (bloqueado) card.setAttribute('disabled', 'disabled');
    else if (!card.classList.contains('inhabilitada')) card.removeAttribute('disabled');
  });
}

function limpiarDetalleSesion() {
  var detalle = document.getElementById('reserva-sesion-detalle');
  if (!detalle) return;
  detalle.textContent = '';
}

function clasificarCuposSesion(sesion, disponibilidad) {
  if (!disponibilidad.disponible || sesion.cuposRestantes <= 0) {
    return { clase: 'rojo', texto: 'Sesión completa' };
  }

  var capacidad = Number(sesion.capacidadMaxima || 0);
  var pocos = sesion.cuposRestantes <= 2;
  if (capacidad > 0) {
    pocos = pocos || (sesion.cuposRestantes / capacidad <= 0.25);
  }

  if (pocos) {
    return { clase: 'amarillo', texto: 'Pocos cupos' };
  }

  return { clase: 'verde', texto: 'Cupos disponibles' };
}

function mostrarDetalleSesion(sesion, disponibilidad) {
  var detalle = document.getElementById('reserva-sesion-detalle');
  if (!detalle || !sesion) return;
  var profesor = (sesion.instructor || '').trim() || 'Por definir';
  var estado = disponibilidad && !disponibilidad.disponible ? disponibilidad.motivo : 'Disponible';
  detalle.innerHTML = [
    '<strong>Fecha:</strong> ', escapeHtml(formatearFecha(sesion.fecha)),
    ' · <strong>Horario:</strong> ', escapeHtml(sesion.horaInicio), ' - ', escapeHtml(sesion.horaFin),
    ' · <strong>Instructor:</strong> ', escapeHtml(profesor),
    ' · <strong>Cupos:</strong> ', escapeHtml(String(sesion.cuposRestantes)),
    ' · <strong>Estado:</strong> ', escapeHtml(estado)
  ].join('');
}

function actualizarSesionActivaVisual(idSesion) {
  var cards = document.querySelectorAll('.reserva-sesion-card');
  cards.forEach(function (card) {
    var activa = idSesion && card.getAttribute('data-sesion-id') === String(idSesion);
    card.classList.toggle('activa', !!activa);
    card.setAttribute('aria-checked', activa ? 'true' : 'false');
  });
}

function renderSesionesCards(sesionesServicio, sesionSeleccionadaId) {
  var contenedor = document.getElementById('reserva-sesiones-cards');
  if (!contenedor) return;

  if (!sesionesServicio || !sesionesServicio.length) {
    contenedor.innerHTML = '';
    return;
  }

  contenedor.innerHTML = sesionesServicio.map(function (sesion) {
    var disponibilidad = evaluarDisponibilidadSesion(sesion);
    var cupo = clasificarCuposSesion(sesion, disponibilidad);
    var profesor = (sesion.instructor || '').trim() || 'Por definir';
    var disabledAttr = (!disponibilidad.disponible || reservasState.enviando) ? ' disabled' : '';
    var inhabilitada = disponibilidad.disponible ? '' : ' inhabilitada';
    var activa = String(sesionSeleccionadaId || '') === String(sesion.idHorarioServicio) ? ' activa' : '';

    return [
      '<button type="button" class="reserva-sesion-card', inhabilitada, activa, '" role="radio" aria-checked="', activa ? 'true' : 'false', '" data-sesion-id="', escapeHtml(String(sesion.idHorarioServicio)), '"', disabledAttr, '>',
      '<div class="reserva-sesion-card-head">',
      '<span class="reserva-sesion-card-titulo">', escapeHtml(formatearFecha(sesion.fecha)), '</span>',
      '<span class="reserva-cupo-indicador ', cupo.clase, '">', escapeHtml(cupo.texto), '</span>',
      '</div>',
      '<p class="reserva-sesion-card-info"><strong>Horario:</strong> ', escapeHtml(sesion.horaInicio), ' - ', escapeHtml(sesion.horaFin), '</p>',
      '<p class="reserva-sesion-card-info"><strong>Instructor:</strong> ', escapeHtml(profesor), '</p>',
      '<p class="reserva-sesion-card-info"><strong>Cupos:</strong> ', escapeHtml(String(sesion.cuposRestantes)), '</p>',
      disponibilidad.disponible ? '' : '<p class="reserva-sesion-card-info"><strong>Estado:</strong> ' + escapeHtml(disponibilidad.motivo) + '</p>',
      '</button>'
    ].join('');
  }).join('');
}

function poblarServiciosReservables() {
  var select = document.getElementById('reserva-servicio');
  if (!select) return;

  var prev = select.value || '';
  var serviciosReservables = {};

  reservasState.sesiones.forEach(function (sesion) {
    var disponibilidad = evaluarDisponibilidadSesion(sesion);
    if (!disponibilidad.disponible) return;
    serviciosReservables[String(sesion.idProducto)] = {
      idProducto: sesion.idProducto,
      nombre: sesion.servicio
    };
  });

  reservasState.servicios = Object.keys(serviciosReservables)
    .map(function (key) { return serviciosReservables[key]; })
    .sort(function (a, b) { return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'); });

  select.innerHTML = '<option value="">Selecciona un servicio</option>';
  reservasState.servicios.forEach(function (servicio) {
    select.insertAdjacentHTML('beforeend', '<option value="' + escapeHtml(String(servicio.idProducto)) + '">' + escapeHtml(servicio.nombre || '') + '</option>');
  });

  if (prev && select.querySelector('option[value="' + prev + '"]')) {
    select.value = prev;
  }
}

function poblarSesionesPorServicio(idProducto, mantenerSeleccion) {
  var select = document.getElementById('reserva-sesion');
  var select2 = document.getElementById('reserva-sesion-secundaria');
  var cards = document.getElementById('reserva-sesiones-cards');
  if (!select) return;

  var prev = mantenerSeleccion ? (select.value || '') : '';
  var prev2 = mantenerSeleccion && select2 ? (select2.value || '') : '';
  limpiarDetalleSesion();
  select.innerHTML = '<option value="">Selecciona una sesión</option>';
  if (select2) select2.innerHTML = '<option value="">Selecciona la segunda sesión</option>';

  if (!idProducto) {
    select.disabled = true;
    select.innerHTML = '<option value="">Selecciona un servicio para ver sesiones</option>';
    if (select2) {
      select2.disabled = true;
      select2.innerHTML = '<option value="">Selecciona primero el servicio</option>';
    }
    reservasState.sesionesPorId = {};
    if (cards) cards.innerHTML = '';
    return;
  }

  var sesionesServicio = reservasState.sesiones
    .filter(function (sesion) { return String(sesion.idProducto) === String(idProducto); })
    .sort(function (a, b) {
      return obtenerFechaHora(a.fecha, a.horaInicio).getTime() - obtenerFechaHora(b.fecha, b.horaInicio).getTime();
    });

  if (!sesionesServicio.length) {
    select.disabled = true;
    select.innerHTML = '<option value="">No hay sesiones publicadas para este servicio</option>';
    if (select2) {
      select2.disabled = true;
      select2.innerHTML = '<option value="">No hay segunda sesión disponible</option>';
    }
    reservasState.sesionesPorId = {};
    if (cards) cards.innerHTML = '';
    return;
  }

  reservasState.sesionesPorId = {};

  sesionesServicio.forEach(function (sesion) {
    var disponibilidad = evaluarDisponibilidadSesion(sesion);
    var profesor = (sesion.instructor || '').trim() || 'Por definir';
    var texto = formatearFecha(sesion.fecha)
      + ' | ' + sesion.horaInicio + ' - ' + sesion.horaFin
      + ' | Instructor: ' + profesor
      + ' | Cupos: ' + sesion.cuposRestantes
      + (disponibilidad.disponible ? '' : ' | ' + disponibilidad.motivo);

    reservasState.sesionesPorId[String(sesion.idHorarioServicio)] = sesion;

    var disabledAttr = disponibilidad.disponible ? '' : ' disabled';
    var optionHtml = '<option value="' + escapeHtml(String(sesion.idHorarioServicio)) + '"' + disabledAttr + '>' + escapeHtml(texto) + '</option>';
    select.insertAdjacentHTML('beforeend', optionHtml);
    if (select2 && reservasState.modoPromocion) {
      select2.insertAdjacentHTML('beforeend', optionHtml);
    }
  });

  select.disabled = false;
  if (select2) {
    select2.disabled = !reservasState.modoPromocion;
  }

  if (prev && select.querySelector('option[value="' + prev + '"]:not([disabled])')) {
    select.value = prev;
    var sesion = reservasState.sesionesPorId[prev];
    if (sesion) {
      mostrarDetalleSesion(sesion, evaluarDisponibilidadSesion(sesion));
    }
  }

  if (select2 && reservasState.modoPromocion) {
    if (prev2 && select2.querySelector('option[value="' + prev2 + '"]:not([disabled])') && prev2 !== select.value) {
      select2.value = prev2;
    } else {
      select2.value = '';
    }
  }

  renderSesionesCards(sesionesServicio, select.value || '');
  actualizarSesionActivaVisual(select.value || '');
}

function cargarSesionesDisponibles(silencioso) {
  if (!silencioso) mostrarMensajeReserva('Cargando servicios y sesiones disponibles...', true);

  return fetch('/api/schedules.ashx', { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        redirigirLoginConRetorno();
        return null;
      }
      if (!resp.ok) throw new Error('No fue posible consultar sesiones disponibles.');
      return resp.json();
    })
    .then(function (data) {
      if (!data) return;
      if (!data.success || !Array.isArray(data.horarios)) {
        throw new Error((data && data.message) || 'No hay sesiones disponibles en este momento.');
      }

      reservasState.sesiones = data.horarios
        .map(normalizarSesion)
        .filter(function (sesion) { return sesion && sesion.idHorarioServicio > 0 && sesion.idProducto > 0; });

      var servicioSelect = document.getElementById('reserva-servicio');
      var seleccionado = servicioSelect ? (servicioSelect.value || '') : '';

      poblarServiciosReservables();
      poblarSesionesPorServicio(seleccionado, true);

      if (!reservasState.servicios.length && !silencioso) {
        mostrarMensajeReserva('No hay servicios con sesiones disponibles para reservar en este momento.', false);
      }
    })
    .catch(function (err) {
      if (!silencioso) mostrarMensajeReserva((err && err.message) || 'No fue posible cargar sesiones.', false);
    });
}

function obtenerPresentacionPromocionReserva(reserva) {
  var nombre = (reserva && reserva.nombrePromocion ? String(reserva.nombrePromocion).trim() : '');
  var tipo = (reserva && reserva.tipoPromocion ? String(reserva.tipoPromocion).trim().toUpperCase() : '');
  var porcentaje = Number(reserva && reserva.porcentajeDescuentoPromocion != null ? reserva.porcentajeDescuentoPromocion : 0);

  if (!reserva || !reserva.idOperacionPromocional) {
    return {
      etiqueta: 'Sin promoción',
      detalle: 'Reserva regular'
    };
  }

  if (tipo === 'DOS_POR_UNO') {
    return {
      etiqueta: nombre || 'Promoción 2x1',
      detalle: '¡Dos clases por el precio de una!'
    };
  }

  if (tipo === 'PORCENTAJE') {
    var valor = String(porcentaje.toFixed(2)).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    return {
      etiqueta: nombre || 'Promoción por descuento',
      detalle: valor + '% de descuento'
    };
  }

  return {
    etiqueta: nombre || 'Promoción aplicada',
    detalle: 'Beneficio promocional aplicado'
  };
}

function renderReservasRecientes(items) {
  var cuerpo = document.getElementById('reservas-lista');
  if (!cuerpo) return;

  if (!items || !items.length) {
    cuerpo.innerHTML = '<tr><td colspan="5">No hay reservas registradas aún.</td></tr>';
    return;
  }

  var reservas = items.slice().sort(function (a, b) {
    var aFecha = String(a.fecha || '') + 'T' + String(a.horaInicio || '00:00') + ':00';
    var bFecha = String(b.fecha || '') + 'T' + String(b.horaInicio || '00:00') + ':00';
    return new Date(bFecha).getTime() - new Date(aFecha).getTime();
  });

  cuerpo.innerHTML = reservas.map(function (r) {
    var estado = String(r.estado || '').toUpperCase();
    var hora = escapeHtml(String(r.horaInicio || '')) + ' - ' + escapeHtml(String(r.horaFin || ''));
    var instructor = escapeHtml((r.instructor || '').trim() || 'Por definir');
    var accion = estado === 'CANCELADA'
      ? '<span>—</span>'
      : '<button class="boton boton-secundario" data-reserva-cancelar="' + escapeHtml(String(r.idReserva || 0)) + '">Cancelar</button>';

    var promo = obtenerPresentacionPromocionReserva(r);

    return [
      '<tr>',
      '<td data-label="Servicio">', escapeHtml(r.servicio || ''), '</td>',
      '<td data-label="Sesión">',
      '<strong>', escapeHtml(formatearFecha(r.fecha)), '</strong><br>',
      hora,
      '<br><small>Instructor: ', instructor, '</small>',
      '</td>',
      '<td data-label="Promoción"><span class="reserva-promo-tag">', escapeHtml(promo.etiqueta), '</span><br><small class="reserva-promo-detalle">', escapeHtml(promo.detalle), '</small></td>',
      '<td data-label="Estado">', escapeHtml(estado || 'CONFIRMADA'), '</td>',
      '<td data-label="Acción">', accion, '</td>',
      '</tr>'
    ].join('');
  }).join('');
}

function cargarReservasUsuario(silencioso) {
  return fetch('/api/reservations.ashx', { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        redirigirLoginConRetorno();
        return null;
      }
      if (!resp.ok) throw new Error('No fue posible cargar tus reservas.');
      return resp.json();
    })
    .then(function (data) {
      if (!data) return;
      if (!data.success) throw new Error(data.message || 'No fue posible cargar tus reservas.');

      reservasState.csrfToken = data.csrfToken || '';
      renderReservasRecientes(Array.isArray(data.reservas) ? data.reservas : []);

      if (!silencioso) {
        mostrarMensajeReserva('Selecciona un servicio y una sesión disponible.', true);
      }
    })
    .catch(function (err) {
      if (!silencioso) mostrarMensajeReserva((err && err.message) || 'No fue posible cargar tus reservas.', false);
    });
}

function registrarReservaSeleccionada() {
  if (reservasState.enviando) return;

  var servicioSelect = document.getElementById('reserva-servicio');
  var sesionSelect = document.getElementById('reserva-sesion');
  var sesionSelect2 = document.getElementById('reserva-sesion-secundaria');
  var observaciones = document.getElementById('reserva-observaciones');

  var idServicio = servicioSelect ? (servicioSelect.value || '') : '';
  var idSesion = sesionSelect ? (sesionSelect.value || '') : '';
  var idSesion2 = sesionSelect2 ? (sesionSelect2.value || '') : '';

  if (!idServicio || !idSesion) {
    mostrarMensajeReserva('Debes seleccionar servicio y sesión.', false);
    return;
  }

  if (reservasState.modoPromocion) {
    if (!idSesion2) {
      mostrarMensajeReserva('Debes seleccionar la segunda sesión para aplicar la promoción 2x1.', false);
      return;
    }
    if (String(idSesion2) === String(idSesion)) {
      mostrarMensajeReserva('Debes seleccionar dos sesiones diferentes para la promoción 2x1.', false);
      return;
    }
  }

  var sesion = reservasState.sesionesPorId[idSesion];
  if (!sesion) {
    mostrarMensajeReserva('La sesión seleccionada no es válida.', false);
    return;
  }

  var disponibilidad = evaluarDisponibilidadSesion(sesion);
  if (!disponibilidad.disponible) {
    mostrarMensajeReserva('La sesión seleccionada ya no está disponible: ' + disponibilidad.motivo, false);
    return;
  }

  if (reservasState.modoPromocion) {
    var sesion2 = reservasState.sesionesPorId[idSesion2];
    if (!sesion2) {
      mostrarMensajeReserva('La segunda sesión seleccionada no es válida.', false);
      return;
    }
    var disponibilidad2 = evaluarDisponibilidadSesion(sesion2);
    if (!disponibilidad2.disponible) {
      mostrarMensajeReserva('La segunda sesión ya no está disponible: ' + disponibilidad2.motivo, false);
      return;
    }
  }

  if (!reservasState.csrfToken) {
    mostrarMensajeReserva('No se pudo validar la sesión de seguridad. Recarga la página.', false);
    return;
  }

  setReservaFormularioBloqueado(true);
  mostrarMensajeReserva(reservasState.modoPromocion ? 'Registrando reserva promocional 2x1...' : 'Registrando reserva...', true);

  var payload = {
    idHorarioServicio: Number(idSesion),
    observaciones: observaciones ? (observaciones.value || '').trim() : ''
  };

  if (reservasState.modoPromocion && reservasState.promocionActiva) {
    payload.idPromocion = Number(reservasState.promocionActiva.idPromocion || 0);
    payload.idHorarioServicioSecundario = Number(idSesion2);
  }

  fetch('/api/reservations.ashx', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-CSRF-Token': reservasState.csrfToken
    },
    body: JSON.stringify(payload)
  })
    .then(function (resp) {
      return resp.json().catch(function () { return { success: false, message: 'Respuesta inválida del servidor.' }; })
        .then(function (data) { return { status: resp.status, data: data }; });
    })
    .then(function (result) {
      var data = result.data || {};
      if (result.status === 401) {
        redirigirLoginConRetorno();
        return;
      }
      if (!data.success) {
        mostrarMensajeReserva(data.message || 'No fue posible registrar la reserva.', false);
        return;
      }

      if (observaciones) observaciones.value = '';

      if (data.esOperacionPromocional) {
        var servicioPromocional = (sesion && sesion.servicio) || (sesion2 && sesion2.servicio) || (reservasState.promocionActiva && reservasState.promocionActiva.servicio) || '';
        var beneficio = beneficioPromocionTexto(reservasState.promocionActiva);
        var mensajePromocional = [
          '<span class="reserva-mensaje-icono" aria-hidden="true">✅</span>',
          '<span class="reserva-mensaje-contenido">',
          '<strong>Promoción 2x1 aplicada</strong>',
          '<br><span><strong>Servicio:</strong> ' + escapeHtml(servicioPromocional) + '</span>',
          '<br><span><strong>Sesión 1:</strong> ' + escapeHtml(formatearSesionBreve(sesion)) + '</span>',
          '<br><span><strong>Sesión 2:</strong> ' + escapeHtml(formatearSesionBreve(sesion2)) + '</span>',
          '<br><span>' + escapeHtml(beneficio) + '</span>',
          '</span>'
        ].join('');

        mostrarMensajeReserva(mensajePromocional, true, true);
      } else {
        mostrarMensajeReserva(data.message || 'Reserva registrada correctamente.', true);
      }

      return Promise.all([
        cargarReservasUsuario(true),
        cargarSesionesDisponibles(true)
      ]).then(function () {
        poblarSesionesPorServicio(idServicio, true);
        if (sesionSelect2 && reservasState.modoPromocion) {
          sesionSelect2.value = '';
        }
      });
    })
    .catch(function () {
      mostrarMensajeReserva('No fue posible registrar la reserva.', false);
    })
    .finally(function () {
      setReservaFormularioBloqueado(false);
    });
}

function cancelarReserva(idReserva) {
  if (!idReserva || reservasState.enviando) return;
  if (!reservasState.csrfToken) {
    mostrarMensajeReserva('No se pudo validar la sesión de seguridad. Recarga la página.', false);
    return;
  }

  if (!window.confirm('¿Deseas cancelar esta reserva?')) return;

  setReservaFormularioBloqueado(true);
  mostrarMensajeReserva('Cancelando reserva...', true);

  fetch('/api/reservations-cancel.ashx', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-CSRF-Token': reservasState.csrfToken
    },
    body: JSON.stringify({ idReserva: Number(idReserva) })
  })
    .then(function (resp) {
      return resp.json().catch(function () { return { success: false, message: 'Respuesta inválida del servidor.' }; })
        .then(function (data) { return { status: resp.status, data: data }; });
    })
    .then(function (result) {
      var data = result.data || {};
      if (result.status === 401) {
        redirigirLoginConRetorno();
        return;
      }

      if (!data.success) {
        mostrarMensajeReserva(data.message || 'No fue posible cancelar la reserva.', false);
        return;
      }

      mostrarMensajeReserva(data.message || 'Reserva cancelada correctamente.', true);
      return Promise.all([
        cargarReservasUsuario(true),
        cargarSesionesDisponibles(true)
      ]).then(function () {
        var servicioSelect = document.getElementById('reserva-servicio');
        poblarSesionesPorServicio(servicioSelect ? servicioSelect.value : '', true);
      });
    })
    .catch(function () {
      mostrarMensajeReserva('No fue posible cancelar la reserva.', false);
    })
    .finally(function () {
      setReservaFormularioBloqueado(false);
    });
}

function enlazarEventosFormulario() {
  var servicioSelect = document.getElementById('reserva-servicio');
  var sesionSelect = document.getElementById('reserva-sesion');
  var sesionSelect2 = document.getElementById('reserva-sesion-secundaria');
  var form = document.getElementById('form-reserva');
  var tabla = document.getElementById('reservas-lista');

  if (servicioSelect) {
    servicioSelect.addEventListener('change', function () {
      poblarSesionesPorServicio(servicioSelect.value || '', false);
      mostrarMensajeReserva('', true);
    });
  }

  if (sesionSelect) {
    sesionSelect.addEventListener('change', function () {
      var idSesion = sesionSelect.value || '';
      actualizarSesionActivaVisual(idSesion);
      if (!idSesion) {
        limpiarDetalleSesion();
        return;
      }

      if (sesionSelect2 && reservasState.modoPromocion && sesionSelect2.value === idSesion) {
        sesionSelect2.value = '';
      }

      var sesion = reservasState.sesionesPorId[idSesion];
      if (!sesion) {
        limpiarDetalleSesion();
        return;
      }

      mostrarDetalleSesion(sesion, evaluarDisponibilidadSesion(sesion));
    });
  }

  if (sesionSelect2) {
    sesionSelect2.addEventListener('change', function () {
      if (!reservasState.modoPromocion) return;
      if (sesionSelect.value && sesionSelect2.value && sesionSelect.value === sesionSelect2.value) {
        sesionSelect2.value = '';
        mostrarMensajeReserva('La segunda sesión debe ser diferente a la primera.', false);
        return;
      }
      mostrarMensajeReserva('', true);
    });
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      registrarReservaSeleccionada();
    });
  }

  var cards = document.getElementById('reserva-sesiones-cards');
  if (cards && sesionSelect) {
    cards.addEventListener('click', function (event) {
      var card = event.target.closest('button[data-sesion-id]');
      if (!card || card.disabled) return;
      var idSesion = card.getAttribute('data-sesion-id') || '';
      if (!idSesion) return;
      sesionSelect.value = idSesion;
      sesionSelect.dispatchEvent(new Event('change'));
    });
  }

  if (tabla) {
    tabla.addEventListener('click', function (event) {
      var btn = event.target.closest('button[data-reserva-cancelar]');
      if (!btn) return;
      var idReserva = parseInt(btn.getAttribute('data-reserva-cancelar') || '0', 10);
      if (idReserva > 0) {
        cancelarReserva(idReserva);
      }
    });
  }
}

function initReservas() {
  var parametrosIniciales = obtenerParametrosReservaIniciales();
  reservasState.preseleccionServicio = parametrosIniciales.idServicio;
  reservasState.preseleccionPromocion = parametrosIniciales.idPromocion;

  enlazarEventosFormulario();
  cargarPromocionPreseleccionada().then(function () {
    return Promise.all([
      cargarReservasUsuario(true),
      cargarSesionesDisponibles(true)
    ]);
  }).then(function () {
    poblarSesionesPorServicio(document.getElementById('reserva-servicio') ? document.getElementById('reserva-servicio').value : '', false);

    if (reservasState.preseleccionServicio) {
      aplicarPreseleccionPromocion();
      return;
    }

    mostrarMensajeReserva('Selecciona un servicio y una sesión disponible.', true);
  }).catch(function () {
    mostrarMensajeReserva('No fue posible cargar la información de reservas.', false);
  });
}

document.addEventListener('DOMContentLoaded', initReservas);
