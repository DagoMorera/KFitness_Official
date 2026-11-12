(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtCRC(monto) {
    var value = Number(monto || 0);
    return '₡' + value.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function obtenerStore() {
    if (!window.KFCarritoStore) {
      throw new Error('El módulo de carrito no está disponible.');
    }
    return window.KFCarritoStore;
  }

  function setMensaje(texto, esError) {
    var msg = byId('carrito-mensaje');
    if (!msg) return;
    msg.textContent = texto || '';
    msg.style.color = esError ? '#ff8d9a' : '#c7f0d3';
  }

  function render() {
    var lista = byId('carrito-lista');
    var vacio = byId('carrito-vacio');
    var resumen = byId('carrito-resumen');
    if (!lista || !vacio || !resumen) return;

    var store = obtenerStore();
    var items = store.read();

    if (!items.length) {
      lista.innerHTML = '';
      vacio.hidden = false;
      resumen.innerHTML = '<p><strong>Total:</strong> ' + fmtCRC(0) + ' CRC</p>';
      return;
    }

    vacio.hidden = true;

    lista.innerHTML = items.map(function (item) {
      var sesiones = Array.isArray(item.sesiones) ? item.sesiones : [];
      var sesionesHtml = sesiones.map(function (s, idx) {
        return '<li><strong>Sesión ' + String(idx + 1) + ':</strong> '
          + escapeHtml(String(s.fecha || '')) + ' · '
          + escapeHtml(String(s.horaInicio || '')) + ' - ' + escapeHtml(String(s.horaFin || ''))
          + '</li>';
      }).join('');

      var promo = item.idPromocion
        ? ('<p><strong>Promoción:</strong> ' + escapeHtml(item.nombrePromocion || item.tipoPromocion || 'Aplicada') + '</p>')
        : '<p><strong>Promoción:</strong> Sin promoción</p>';

      var observaciones = String(item.observaciones || '').trim();
      var observacionesHtml = '<p><strong>Observaciones:</strong> ' + (observaciones ? escapeHtml(observaciones) : '—') + '</p>';

      return [
        '<article class="tarjeta carrito-item">',
        '<h3>' + escapeHtml(item.servicio || '') + '</h3>',
        '<ul>' + sesionesHtml + '</ul>',
        promo,
        observacionesHtml,
        '<p><strong>Subtotal:</strong> ' + fmtCRC(item.subtotal) + ' CRC</p>',
        '<p><strong>Descuento:</strong> ' + fmtCRC(item.descuento) + ' CRC</p>',
        '<p><strong>Total:</strong> ' + fmtCRC(item.total) + ' CRC</p>',
        '<div class="carrito-item-acciones">',
        '<button type="button" class="boton boton-secundario" data-eliminar-item="' + escapeHtml(String(item.idItem || '')) + '">Eliminar</button>',
        '</div>',
        '</article>'
      ].join('');
    }).join('');

    var t = store.totals();
    resumen.innerHTML = [
      '<p><strong>Ítems:</strong> ' + String(t.cantidadItems || 0) + '</p>',
      '<p><strong>Subtotal:</strong> ' + fmtCRC(t.subtotal) + ' CRC</p>',
      '<p><strong>Descuento:</strong> ' + fmtCRC(t.descuento) + ' CRC</p>',
      '<p><strong>Total:</strong> ' + fmtCRC(t.total) + ' CRC</p>'
    ].join('');
  }

  function validarAutenticado() {
    return fetch('/api/profile.ashx', { method: 'GET', credentials: 'same-origin' })
      .then(function (resp) {
        if (resp.status === 401) return false;
        if (!resp.ok) return false;
        return resp.json().then(function (data) { return !!(data && data.success); }).catch(function () { return false; });
      })
      .catch(function () { return false; });
  }

  function continuarPago() {
    var store = obtenerStore();
    if (!store.read().length) {
      setMensaje('Tu carrito está vacío.', true);
      return;
    }

    validarAutenticado().then(function (ok) {
      if (!ok) {
        var retorno = '/carrito.html';
        window.location.href = '/login.html?returnUrl=' + encodeURIComponent(retorno);
        return;
      }
      window.location.href = '/checkout.html';
    });
  }

  function enlazarEventos() {
    var lista = byId('carrito-lista');
    if (lista) {
      lista.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-eliminar-item]');
        if (!btn) return;
        var id = btn.getAttribute('data-eliminar-item') || '';
        if (!id) return;
        try {
          obtenerStore().remove(id);
          render();
          setMensaje('Ítem eliminado del carrito.', false);
        } catch (_) {
          setMensaje('No fue posible eliminar el ítem.', true);
        }
      });
    }

    var btnSeguir = byId('carrito-seguir');
    if (btnSeguir) {
      btnSeguir.addEventListener('click', function () {
        window.location.href = '/horarios.html';
      });
    }

    var btnPago = byId('carrito-continuar-pago');
    if (btnPago) {
      btnPago.addEventListener('click', continuarPago);
    }

    window.addEventListener('kf:carrito:change', render);
    window.addEventListener('storage', function (ev) {
      if (!ev || ev.key !== 'kfitness_carrito_v1') return;
      render();
    });
  }

  function init() {
    if (!byId('carrito-cliente')) return;
    enlazarEventos();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
