(function () {
  'use strict';

  var STORAGE_KEY = 'kfitness_carrito_v1';

  function generarId() {
    return 'ci-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function normalizarNumero(valor) {
    var n = Number(valor || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function leer() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function guardar(items) {
    var lista = Array.isArray(items) ? items : [];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    emitirCambio(lista);
    return lista;
  }

  function emitirCambio(items) {
    try {
      window.dispatchEvent(new CustomEvent('kf:carrito:change', { detail: { items: items || [] } }));
    } catch (_) { }
  }

  function contarItems() {
    return leer().length;
  }

  function contarSesiones() {
    return leer().reduce(function (acc, item) {
      return acc + ((item && Array.isArray(item.sesiones)) ? item.sesiones.length : 0);
    }, 0);
  }

  function existeSesion(idHorarioServicio) {
    var id = Number(idHorarioServicio || 0);
    if (id <= 0) return false;
    var items = leer();
    for (var i = 0; i < items.length; i += 1) {
      var sesiones = Array.isArray(items[i] && items[i].sesiones) ? items[i].sesiones : [];
      for (var j = 0; j < sesiones.length; j += 1) {
        if (Number(sesiones[j] && sesiones[j].idHorarioServicio || 0) === id) return true;
      }
    }
    return false;
  }

  function agregar(item) {
    if (!item || !Array.isArray(item.sesiones) || !item.sesiones.length) {
      return { success: false, message: 'El ítem del carrito no es válido.' };
    }

    var sesiones = item.sesiones;
    for (var i = 0; i < sesiones.length; i += 1) {
      var idHorario = Number(sesiones[i] && sesiones[i].idHorarioServicio || 0);
      if (idHorario <= 0) {
        return { success: false, message: 'La sesión seleccionada no es válida.' };
      }
      if (existeSesion(idHorario)) {
        return { success: false, message: 'La sesión seleccionada ya está en tu carrito.' };
      }
    }

    var nuevo = {
      idItem: String(item.idItem || generarId()),
      tipo: String(item.tipo || 'REGULAR').toUpperCase(),
      idProducto: Number(item.idProducto || 0),
      servicio: String(item.servicio || ''),
      idPromocion: item.idPromocion != null ? Number(item.idPromocion || 0) : null,
      nombrePromocion: String(item.nombrePromocion || ''),
      tipoPromocion: String(item.tipoPromocion || ''),
      porcentajeDescuento: normalizarNumero(item.porcentajeDescuento),
      cantidadCompra: item.cantidadCompra != null ? Number(item.cantidadCompra || 0) : null,
      cantidadEntrega: item.cantidadEntrega != null ? Number(item.cantidadEntrega || 0) : null,
      precioUnitario: normalizarNumero(item.precioUnitario),
      subtotal: normalizarNumero(item.subtotal),
      descuento: normalizarNumero(item.descuento),
      total: normalizarNumero(item.total),
      observaciones: String(item.observaciones || ''),
      moneda: 'CRC',
      fechaCreacion: new Date().toISOString(),
      sesiones: sesiones.map(function (s) {
        return {
          idHorarioServicio: Number(s.idHorarioServicio || 0),
          fecha: String(s.fecha || ''),
          horaInicio: String(s.horaInicio || ''),
          horaFin: String(s.horaFin || ''),
          instructor: String(s.instructor || ''),
          precioServicio: normalizarNumero(s.precioServicio)
        };
      })
    };

    var items = leer();
    items.push(nuevo);
    guardar(items);
    return { success: true, item: nuevo, items: items };
  }

  function eliminar(idItem) {
    var id = String(idItem || '');
    if (!id) return leer();
    var items = leer().filter(function (x) { return String(x && x.idItem || '') !== id; });
    return guardar(items);
  }

  function limpiar() {
    return guardar([]);
  }

  function totales() {
    var items = leer();
    return items.reduce(function (acc, item) {
      acc.subtotal += normalizarNumero(item && item.subtotal);
      acc.descuento += normalizarNumero(item && item.descuento);
      acc.total += normalizarNumero(item && item.total);
      return acc;
    }, { subtotal: 0, descuento: 0, total: 0, moneda: 'CRC', cantidadItems: items.length, cantidadSesiones: contarSesiones() });
  }

  window.KFCarritoStore = {
    key: STORAGE_KEY,
    read: leer,
    save: guardar,
    add: agregar,
    remove: eliminar,
    clear: limpiar,
    hasSession: existeSesion,
    countItems: contarItems,
    countSessions: contarSesiones,
    totals: totales,
    notify: emitirCambio
  };
})();
