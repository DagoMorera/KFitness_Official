(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form-contacto');
    if (!form) return;
    const mensaje = document.getElementById('contacto-mensaje-respuesta');
    const enviar = form.querySelector('[type=submit]');
    const identidad = document.getElementById('contacto-identidad');
    const visitante = document.getElementById('contacto-visitante');
    const asunto = document.getElementById('contacto-asunto');
    const asuntoUrl = new URLSearchParams(window.location.search).get('asunto');
    if (asuntoUrl) asunto.value = asuntoUrl.trim().slice(0, asunto.maxLength);

    let estado = null;
    let ocupado = false;

    function mostrarSesion(cliente) {
      identidad.hidden = !cliente;
      visitante.hidden = !!cliente;
      visitante.disabled = !!cliente;
      identidad.textContent = cliente ? 'Enviás como ' + cliente.nombre + ' · ' + cliente.correo : '';
    }

    async function preparar() {
      estado = await KFitnessRutinasUI.request('/api/contact.ashx');
      mostrarSesion(estado.cliente);
      return estado;
    }

    enviar.disabled = true;
    preparar().catch(function () {
      mensaje.textContent = 'No fue posible cargar los datos de la sesión. Podés reintentar al enviar.';
    }).finally(function () { enviar.disabled = false; });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (ocupado) return;
      ocupado = true;
      enviar.disabled = true;
      try {
        const datos = estado || await preparar();
        if (!form.reportValidity()) return;

        const valores = {
          Asunto: asunto.value.trim(),
          Mensaje: document.getElementById('contacto-mensaje').value.trim(),
          ClaveSolicitud: datos.requestKey
        };
        if (!datos.cliente) {
          valores.Nombre = document.getElementById('contacto-nombre').value.trim();
          valores.Correo = document.getElementById('contacto-email').value.trim();
          valores.Telefono = document.getElementById('contacto-telefono').value.trim();
        }

        mensaje.textContent = 'Registrando consulta…';
        const respuesta = await KFitnessRutinasUI.request('/api/contact.ashx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': datos.csrfToken },
          body: JSON.stringify(valores)
        });
        mensaje.textContent = respuesta.message;
        form.reset();
        estado = null;
      } catch (error) {
        mensaje.textContent = error.message || 'No fue posible enviar tu consulta.';
      } finally {
        ocupado = false;
        enviar.disabled = false;
      }
    });
  });
})();
