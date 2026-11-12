(function () {
  'use strict';

  var state = {
    historial: [],
    pagina: 1,
    pageSize: 10
  };

  function escapeHtml(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatearNumero(valor) {
    var numero = Number(String(valor || '').replace(',', '.'));
    if (!Number.isFinite(numero)) return '—';
    return numero.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function setMensaje(texto, esError) {
    var mensaje = document.getElementById('progreso-medicion-mensaje');
    if (!mensaje) return;
    mensaje.textContent = texto || '';
    mensaje.style.color = esError ? '#ff8d9a' : '#87efba';
  }

  function ordenarDesc(items) {
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

  function renderTarjeta(item) {
    return [
      '<article class="perfil-reserva-card">',
      '  <div class="perfil-progreso-item">',
      '    <p class="perfil-reserva-meta"><strong>Fecha:</strong> ', escapeHtml(item.fecha || ''), '</p>',
      '    <p class="perfil-reserva-meta"><strong>Peso:</strong> ', escapeHtml(formatearNumero(item.pesoKg)), ' kg</p>',
      '    <p class="perfil-reserva-meta"><strong>Cintura:</strong> ', escapeHtml(formatearNumero(item.cinturaCm)), ' cm</p>',
      '    <p class="perfil-reserva-meta"><strong>Cadera:</strong> ', escapeHtml(formatearNumero(item.caderaCm)), ' cm</p>',
      '    <p class="perfil-reserva-meta"><strong>Pecho:</strong> ', escapeHtml(formatearNumero(item.pechoCm)), ' cm</p>',
      '    <p class="perfil-reserva-meta"><strong>Brazo:</strong> ', escapeHtml(formatearNumero(item.brazoCm)), ' cm</p>',
      '    <p class="perfil-reserva-meta"><strong>Muslo:</strong> ', escapeHtml(formatearNumero(item.musloCm)), ' cm</p>',
      '    <div class="perfil-progreso-item-actions">',
      '      <button type="button" class="boton boton-secundario boton-pequeno progreso-editar" data-id="', escapeHtml(item.idProgreso), '">Editar</button>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function renderPaginacion(totalItems) {
    var cont = document.getElementById('historial-progreso-paginacion');
    var info = document.getElementById('historial-progreso-paginacion-info');
    var prev = document.getElementById('historial-progreso-prev');
    var next = document.getElementById('historial-progreso-next');
    if (!cont || !info || !prev || !next) return;

    var totalPaginas = Math.max(1, Math.ceil(totalItems / state.pageSize));
    if (state.pagina > totalPaginas) state.pagina = totalPaginas;
    if (state.pagina < 1) state.pagina = 1;

    info.textContent = 'Página ' + String(state.pagina) + ' de ' + String(totalPaginas);
    prev.disabled = state.pagina <= 1;
    next.disabled = state.pagina >= totalPaginas;
    cont.hidden = totalPaginas <= 1;
  }

  function renderHistorial() {
    var lista = document.getElementById('historial-progreso-lista');
    if (!lista) return;

    if (!state.historial.length) {
      lista.innerHTML = '<p class="perfil-reservas-empty">Aún no registraste mediciones.</p>';
      renderPaginacion(0);
      return;
    }

    var start = (state.pagina - 1) * state.pageSize;
    var end = start + state.pageSize;
    var pageItems = state.historial.slice(start, end);
    lista.innerHTML = pageItems.map(renderTarjeta).join('');
    renderPaginacion(state.historial.length);
  }

  function abrirModal(item) {
    var modal = document.getElementById('progreso-medicion-modal');
    if (!modal) return;

    document.getElementById('progreso-id').value = String(item.idProgreso || '');
    document.getElementById('progreso-fecha').value = item.fecha || '';
    document.getElementById('progreso-peso').value = item.pesoKg != null ? String(item.pesoKg).replace('.', ',') : '';
    document.getElementById('progreso-cintura').value = item.cinturaCm != null ? String(item.cinturaCm).replace('.', ',') : '';
    document.getElementById('progreso-cadera').value = item.caderaCm != null ? String(item.caderaCm).replace('.', ',') : '';
    document.getElementById('progreso-pecho').value = item.pechoCm != null ? String(item.pechoCm).replace('.', ',') : '';
    document.getElementById('progreso-brazo').value = item.brazoCm != null ? String(item.brazoCm).replace('.', ',') : '';
    document.getElementById('progreso-muslo').value = item.musloCm != null ? String(item.musloCm).replace('.', ',') : '';

    setMensaje('Editando registro del ' + (item.fecha || '') + '.', false);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function cerrarModal() {
    var modal = document.getElementById('progreso-medicion-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    setMensaje('', false);
  }

  function buscarPorId(id) {
    for (var i = 0; i < state.historial.length; i += 1) {
      if (Number(state.historial[i].idProgreso) === Number(id)) return state.historial[i];
    }
    return null;
  }

  function cargarHistorial() {
    return fetch('/api/profile.ashx', { method: 'GET', credentials: 'same-origin' })
      .then(function (resp) {
        if (resp.status === 401) {
          window.location.href = '/login.html';
          throw new Error('unauthenticated');
        }
        if (!resp.ok) throw new Error('http-error');
        return resp.json();
      })
      .then(function (data) {
        state.historial = ordenarDesc((data && Array.isArray(data.historialProgreso)) ? data.historialProgreso : []);
        renderHistorial();
      })
      .catch(function (err) {
        if (err && err.message === 'unauthenticated') return;
        var lista = document.getElementById('historial-progreso-lista');
        if (lista) lista.innerHTML = '<p class="perfil-reservas-empty">No fue posible consultar el historial en este momento.</p>';
      });
  }

  function initEventos() {
    var lista = document.getElementById('historial-progreso-lista');
    var prev = document.getElementById('historial-progreso-prev');
    var next = document.getElementById('historial-progreso-next');
    var modal = document.getElementById('progreso-medicion-modal');
    var btnCancelar = document.getElementById('progreso-cancelar-edicion');
    var form = document.getElementById('form-progreso-medicion');
    var btnGuardar = document.getElementById('progreso-guardar-btn');

    if (lista) {
      lista.addEventListener('click', function (e) {
        var btn = e.target.closest('.progreso-editar');
        if (!btn) return;
        var id = parseInt(btn.getAttribute('data-id') || '0', 10);
        if (!id) return;
        var item = buscarPorId(id);
        if (!item) return;
        abrirModal(item);
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        if (state.pagina <= 1) return;
        state.pagina -= 1;
        renderHistorial();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        var totalPaginas = Math.max(1, Math.ceil(state.historial.length / state.pageSize));
        if (state.pagina >= totalPaginas) return;
        state.pagina += 1;
        renderHistorial();
      });
    }

    if (btnCancelar) {
      btnCancelar.addEventListener('click', function () {
        cerrarModal();
      });
    }

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) cerrarModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var modalActual = document.getElementById('progreso-medicion-modal');
        if (modalActual && !modalActual.hidden) cerrarModal();
      }
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var payload = {
          idProgreso: document.getElementById('progreso-id').value.trim(),
          fecha: document.getElementById('progreso-fecha').value.trim(),
          pesoKg: document.getElementById('progreso-peso').value.trim(),
          cinturaCm: document.getElementById('progreso-cintura').value.trim(),
          caderaCm: document.getElementById('progreso-cadera').value.trim(),
          pechoCm: document.getElementById('progreso-pecho').value.trim(),
          brazoCm: document.getElementById('progreso-brazo').value.trim(),
          musloCm: document.getElementById('progreso-muslo').value.trim()
        };

        if (!payload.fecha) {
          setMensaje('La fecha es obligatoria.', true);
          return;
        }
        if (!payload.pesoKg) {
          setMensaje('El peso es obligatorio.', true);
          return;
        }

        if (btnGuardar && btnGuardar.disabled) return;
        if (btnGuardar) btnGuardar.disabled = true;

        fetch('/api/profile.ashx?action=saveProgress', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (resp) { return resp.json().then(function (body) { body.__status = resp.status; return body; }); })
          .then(function (data) {
            if (!data) return;
            if (data.__status >= 400 || data.success === false) {
              setMensaje(data.message || 'No fue posible guardar el registro.', true);
              return;
            }
            return cargarHistorial().then(function () {
              cerrarModal();
            });
          })
          .catch(function () {
            setMensaje('No fue posible conectar con el servidor.', true);
          })
          .finally(function () {
            if (btnGuardar) btnGuardar.disabled = false;
          });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initEventos();
    cargarHistorial();
  });
})();