(function () {
  'use strict';

  var state = {
    valido: false,
    procesando: false,
    carrito: [],
    resumen: null
  };

  function byId(id) { return document.getElementById(id); }

  function fmtCRC(value) {
    var n = Number(value || 0);
    return '₡' + n.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function normalizarTexto(texto) {
    var s = String(texto || '');
    return s
      .replace(/encontrÃ³/g, 'encontró')
      .replace(/invÃ¡lido/g, 'inválido')
      .replace(/sesiÃ³n/g, 'sesión');
  }

  function setMensaje(texto, esError) {
    var el = byId('checkout-mensaje');
    if (!el) return;
    el.textContent = normalizarTexto(texto);
    el.style.color = esError ? '#ff8d9a' : '#c7f0d3';
  }

  function setPagoHabilitado(habilitado) {
    var activo = !!habilitado && !state.procesando;
    ['checkout-continuar', 'checkout-gratis', 'checkout-pagar-aprobado', 'checkout-pagar-rechazado'].forEach(function (id) {
      byId(id).disabled = !activo;
    });
  }

  function redirigirLoginCheckout() {
    window.location.href = '/login.html?returnUrl=' + encodeURIComponent('/checkout.html');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function obtenerTokenPago(carrito) {
    var firma = JSON.stringify(carrito.map(function (item) { return item.idItem; }));
    try {
      var anterior = JSON.parse(sessionStorage.getItem('kfitness_checkout_intento') || 'null');
      if (anterior && anterior.firma === firma) return anterior.token;
    } catch (_) { }
    var token = 'chk-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    try { sessionStorage.setItem('kfitness_checkout_intento', JSON.stringify({ firma: firma, token: token })); } catch (_) { }
    return token;
  }

  function mapItems(items) {
    return (items || []).map(function (item) {
      return {
        idProducto: Number(item.idProducto || 0),
        idPromocion: item.idPromocion != null ? Number(item.idPromocion || 0) : null,
        observaciones: String(item.observaciones || ''),
        idsHorarioServicio: (item.sesiones || []).map(function (s) { return Number(s.idHorarioServicio || 0); }).filter(function (x) { return x > 0; })
      };
    }).filter(function (x) { return x.idsHorarioServicio.length > 0; });
  }

  function renderResumen(resp) {
    var cont = byId('checkout-resumen');
    if (!cont) return;
    var items = (resp && Array.isArray(resp.items)) ? resp.items : [];

    if (!items.length) {
      cont.innerHTML = '<p>Sin ítems para checkout.</p>';
      return;
    }

    cont.innerHTML = items.map(function (x, idx) {
      var localItem = state.carrito[idx] || {};
      var sesiones = Array.isArray(localItem.sesiones) ? localItem.sesiones : [];
      var sesionesHtml = sesiones.map(function (sesion) {
        var fecha = new Date(String(sesion.fecha || '') + 'T00:00:00');
        var fechaTexto = Number.isNaN(fecha.getTime()) ? String(sesion.fecha || '') : fecha.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
        return '<li><time>' + escapeHtml(fechaTexto) + '</time><span>' + escapeHtml(sesion.horaInicio) + '–' + escapeHtml(sesion.horaFin) + '</span></li>';
      }).join('');
      var promo = x.idPromocion ? (x.nombrePromocion || x.tipoPromocion || 'Aplicada') : 'Sin promoción';
      return '<article class="checkout-servicio"><h3>' + escapeHtml(x.servicio) + '</h3>'
        + (sesionesHtml ? '<ul class="checkout-sesiones">' + sesionesHtml + '</ul>' : '')
        + (x.idPromocion ? '<p class="checkout-promocion">' + escapeHtml(promo) + '</p>' : '')
        + (localItem.observaciones ? '<p><strong>Observaciones:</strong> ' + escapeHtml(localItem.observaciones) + '</p>' : '')
        + (items.length > 1 ? '<p><strong>Total de la reserva</strong> ' + fmtCRC(x.total) + '</p>' : '')
        + '</article>';
    }).join('');

    var t = byId('checkout-totales');
    if (t) {
      t.innerHTML = '<div><dt>Subtotal</dt><dd>' + fmtCRC(resp.subtotal) + '</dd></div>'
        + (Number(resp.descuento) > 0 ? '<div><dt>Descuento</dt><dd>−' + fmtCRC(resp.descuento) + '</dd></div>' : '')
        + '<div class="checkout-total"><dt>Total a pagar</dt><dd>' + fmtCRC(resp.total) + '</dd></div>';
    }
  }

  function fetchCheckout(body) {
    return fetch('/api/checkout.ashx', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-CSRF-Token': window.__checkoutCsrf || ''
      },
      body: JSON.stringify(body)
    }).then(function (resp) {
      if (resp.status === 401) {
        redirigirLoginCheckout();
        return { status: 401, data: { success: false, message: 'Sesión expirada.' } };
      }
      return resp.json().catch(function () { return { success: false, message: 'Respuesta inválida del servidor.' }; })
        .then(function (data) { return { status: resp.status, data: data }; });
    });
  }

  function cargarCsrf() {
    return fetch('/api/checkout.ashx', { method: 'GET', credentials: 'same-origin' })
      .then(function (resp) {
        if (resp.status === 401) {
          redirigirLoginCheckout();
          return null;
        }
        if (!resp.ok) return null;
        return resp.json();
      })
      .then(function (data) {
        if (!data || !data.success) return false;
        window.__checkoutCsrf = data.csrfToken || '';
        return true;
      });
  }

  function confirmarPago(simularAprobado) {
    if (!state.valido || state.procesando) return;

    var items = mapItems(state.carrito);
    if (!items.length) {
      setMensaje('No hay ítems para pagar.', true);
      setPagoHabilitado(false);
      return;
    }

    var tokenIdempotencia = state.tokenPago;
    state.procesando = true;
    setPagoHabilitado(false);
    setMensaje('Procesando pago...', false);

    fetchCheckout({
      action: 'pay',
      items: items,
      payment: {
        tokenIdempotencia: tokenIdempotencia,
        simularAprobado: !!simularAprobado
      }
    }).then(function (result) {
      var data = result.data || {};
      if (result.status === 401) {
        state.valido = false;
        state.procesando = false;
        setPagoHabilitado(false);
        return;
      }

      if (!data.success || !data.pagoAprobado) {
        state.procesando = false;
        setMensaje(data.message || 'No fue posible procesar el pago.', true);
        setPagoHabilitado(state.valido);
        return;
      }

      mostrarOrdenConfirmada(data);
    }).catch(function () {
      state.procesando = false;
      setMensaje('No fue posible procesar el pago.', true);
      setPagoHabilitado(state.valido);
    });
  }

  function mostrarOrdenConfirmada(data) {
    if (window.KFCarritoStore) window.KFCarritoStore.clear();
    try { sessionStorage.removeItem('kfitness_checkout_intento'); } catch (_) { }

    var items = data.items && data.items.length ? data.items : (state.resumen && state.resumen.items) || [];
    byId('checkout-confirmacion-servicio').textContent = items.map(function (item) { return item.servicio; }).filter(Boolean).join(', ');
    byId('checkout-confirmacion-numero').textContent = data.numeroPedido || '—';
    byId('checkout-confirmacion-total').textContent = fmtCRC(data.total) + ' CRC';
    byId('checkout-confirmacion-modo').textContent = Number(data.total) === 0 ? 'Reserva gratuita' : 'Simulado (pruebas)';
    byId('checkout-tarjeta').reset();
    byId('checkout-tarjeta').hidden = true;
    byId('checkout-continuar').hidden = true;
    byId('checkout-gratis').hidden = true;
    byId('checkout-ver-confirmacion').hidden = false;
    byId('checkout-confirmacion').showModal();

    state.valido = false;
    state.procesando = false;
    setPagoHabilitado(false);
    setMensaje('Pago aprobado y orden confirmada.', false);
  }

  function init() {
    if (!byId('checkout-cliente')) return;

    setPagoHabilitado(false);

    if (!window.KFCarritoStore || !window.KFCarritoStore.read().length) {
      setMensaje('Tu carrito está vacío. Volvé a Horarios para agregar sesiones.', true);
      return;
    }

    state.carrito = window.KFCarritoStore.read();
    state.tokenPago = obtenerTokenPago(state.carrito);

    cargarCsrf().then(function (ok) {
      if (!ok) {
        setMensaje('No fue posible validar la sesión de checkout.', true);
        setPagoHabilitado(false);
        return;
      }

      var items = mapItems(state.carrito);
      fetchCheckout({ action: 'preview', items: items, payment: { tokenIdempotencia: state.tokenPago } }).then(function (result) {
        var data = result.data || {};
        if (!data.success) {
          state.valido = false;
          setPagoHabilitado(false);
          setMensaje(data.message || 'No fue posible validar checkout.', true);
          return;
        }
        if (data.csrfToken) window.__checkoutCsrf = data.csrfToken;
        if (data.pagoAprobado) { mostrarOrdenConfirmada(data); return; }
        state.valido = true;
        state.resumen = data;
        renderResumen(data);
        var gratis = Number(data.total) === 0;
        byId('checkout-continuar').hidden = gratis;
        byId('checkout-gratis').hidden = !gratis;
        byId('checkout-pagar-aprobado').textContent = 'Simular pago de ' + fmtCRC(data.total);
        setPagoHabilitado(true);
        setMensaje('', false);
      }).catch(function () {
        state.valido = false;
        setPagoHabilitado(false);
        setMensaje('No fue posible validar checkout.', true);
      });
    }).catch(function () {
      state.valido = false;
      setPagoHabilitado(false);
      setMensaje('No fue posible validar la sesión de checkout.', true);
    });

    var formulario = byId('checkout-tarjeta');
    var modal = byId('checkout-confirmacion');
    byId('checkout-continuar').addEventListener('click', function () {
      this.hidden = true;
      formulario.hidden = false;
      byId('checkout-titular').focus();
    });
    byId('checkout-datos-prueba').addEventListener('click', function () {
      byId('checkout-titular').value = 'Cliente de prueba';
      byId('checkout-numero').value = '4242 4242 4242 4242';
      byId('checkout-vencimiento').value = '12/30';
      byId('checkout-cvv').value = '123';
    });
    formulario.addEventListener('submit', function (event) {
      event.preventDefault();
      if (formulario.reportValidity()) confirmarPago(true);
    });
    byId('checkout-pagar-rechazado').addEventListener('click', function () { confirmarPago(false); });
    byId('checkout-gratis').addEventListener('click', function () { confirmarPago(true); });
    byId('checkout-ver-confirmacion').addEventListener('click', function () { modal.showModal(); });
    modal.addEventListener('close', function () { byId('checkout-ver-confirmacion').focus(); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
