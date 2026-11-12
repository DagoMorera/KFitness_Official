function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function mostrarMensaje(id, texto, exito = true) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = texto;
    elemento.style.color = exito ? '#ED1C2E' : '#ff6b6b';
  }
}

function manejarFormularioRegistro() {
  const form = document.getElementById('form-registro');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const nombre = document.getElementById('registro-nombre').value.trim();
    const apellido1 = document.getElementById('registro-apellido1').value.trim();
    const apellido2 = document.getElementById('registro-apellido2').value.trim();
    const email = document.getElementById('registro-email').value.trim().toLowerCase();
    const telefono = document.getElementById('registro-telefono').value.trim();
    const nacimiento = document.getElementById('registro-nacimiento').value;
    const password = document.getElementById('registro-password').value;
    const password2 = document.getElementById('registro-password2').value;
    const terminos = document.getElementById('registro-terminos').checked;

    if (!nombre || !apellido1 || !email || !telefono || !nacimiento || !password || !password2) {
      mostrarMensaje('registro-mensaje', 'Completa todos los campos obligatorios.', false);
      return;
    }
    if (!validarEmail(email)) {
      mostrarMensaje('registro-mensaje', 'Ingresa un correo válido.', false);
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      mostrarMensaje('registro-mensaje', 'La contraseña debe tener 8 caracteres, mayúscula, minúscula y número.', false);
      return;
    }
    if (password !== password2) {
      mostrarMensaje('registro-mensaje', 'Las contraseñas deben coincidir.', false);
      return;
    }
    if (!terminos) {
      mostrarMensaje('registro-mensaje', 'Debes aceptar los términos y condiciones.', false);
      return;
    }

    // Enviar al backend para registro
    const payload = { nombre, apellido1, apellido2, correo: email, telefono, nacimiento, password, aceptaTerminos: terminos };

    mostrarMensaje('registro-mensaje', 'Registrando...');

    fetch('/api/register.ashx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (data && data.success) {
          mostrarMensaje('registro-mensaje', 'Registro exitoso. Serás redirigido al inicio de sesión.');
          form.reset();
          setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        } else {
          mostrarMensaje('registro-mensaje', (data && data.message) ? data.message : 'Error en el registro.', false);
        }
      })
      .catch((err) => {
        mostrarMensaje('registro-mensaje', 'Error de red o del servidor. Intenta nuevamente más tarde.', false);
      });
  });
}

function manejarFormularioRecuperar() {
  const form = document.getElementById('form-recuperar');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('recuperar-email').value.trim().toLowerCase();
    if (!email) {
      mostrarMensaje('recuperar-mensaje', 'Ingresa un correo electrónico.', false);
      return;
    }
    if (!validarEmail(email)) {
      mostrarMensaje('recuperar-mensaje', 'Ingresa un correo válido.', false);
      return;
    }

    mostrarMensaje('recuperar-mensaje', 'Procesando solicitud...');

    fetch('/api/forgot-password.ashx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email })
    })
      .then((resp) => resp.json().then((data) => ({ status: resp.status, data })))
      .then(({ status, data }) => {
        if (status >= 400 || !data || data.success === false) {
          mostrarMensaje('recuperar-mensaje', (data && data.message) ? data.message : 'No fue posible procesar la solicitud.', false);
          return;
        }
        mostrarMensaje('recuperar-mensaje', data.message || 'Si el correo está registrado, recibirás un enlace de recuperación en unos minutos.');
        form.reset();
      })
      .catch(() => {
        mostrarMensaje('recuperar-mensaje', 'Error de red o del servidor. Intenta nuevamente más tarde.', false);
      });
  });
}

function manejarFormularioRestablecer() {
  const form = document.getElementById('form-restablecer');
  if (!form) return;

  form.querySelectorAll('button[data-target]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const campo = document.getElementById(boton.dataset.target);
      if (!campo) return;
      const mostrar = campo.type === 'password';
      campo.type = mostrar ? 'text' : 'password';
      boton.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
      boton.setAttribute('aria-pressed', String(mostrar));
    });
  });

  const params = new URLSearchParams(window.location.search);
  const token = (params.get('token') || '').trim();

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nueva = document.getElementById('reset-password').value;
    const confirmar = document.getElementById('reset-password2').value;

    if (!token) {
      mostrarMensaje('restablecer-mensaje', 'El enlace de recuperación no es válido.', false);
      return;
    }
    if (!nueva || !confirmar) {
      mostrarMensaje('restablecer-mensaje', 'Completa ambos campos de contraseña.', false);
      return;
    }
    if (nueva !== confirmar) {
      mostrarMensaje('restablecer-mensaje', 'Las contraseñas deben coincidir.', false);
      return;
    }
    if (nueva.length < 8 || !/[A-Z]/.test(nueva) || !/[a-z]/.test(nueva) || !/[0-9]/.test(nueva)) {
      mostrarMensaje('restablecer-mensaje', 'La contraseña debe tener 8 caracteres, mayúscula, minúscula y número.', false);
      return;
    }

    mostrarMensaje('restablecer-mensaje', 'Restableciendo contraseña...');

    fetch('/api/reset-password.ashx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, nueva, confirmar })
    })
      .then((resp) => resp.json().then((data) => ({ status: resp.status, data })))
      .then(({ status, data }) => {
        if (status >= 400 || !data || data.success === false) {
          mostrarMensaje('restablecer-mensaje', (data && data.message) ? data.message : 'No fue posible restablecer la contraseña.', false);
          return;
        }
        mostrarMensaje('restablecer-mensaje', data.message || 'Contraseña actualizada correctamente.');
        form.reset();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      })
      .catch(() => {
        mostrarMensaje('restablecer-mensaje', 'Error de red o del servidor. Intenta nuevamente más tarde.', false);
      });
  });
}

function initFormularios() {

  manejarFormularioRegistro();
  manejarFormularioRecuperar();
  manejarFormularioRestablecer();
}

document.addEventListener('DOMContentLoaded', initFormularios);
