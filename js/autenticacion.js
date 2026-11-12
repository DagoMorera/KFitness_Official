const usuariosIniciales = [
  {
    correo: 'cliente@kfitness.com',
    password: 'Cliente123',
    nombre: 'Cliente',
    apellido1: 'KFitness',
    apellido2: 'Usuario',
    telefono: '+56 9 1234 5678',
    nacimiento: '1995-01-15',
    rol: 'Cliente'
  },
  {
    correo: 'admin@kfitness.com',
    password: 'Admin123',
    nombre: 'Administrador',
    apellido1: 'KFitness',
    apellido2: '',
    telefono: '+56 9 8765 4321',
    nacimiento: '1990-06-10',
    rol: 'Administrador'
  }
];

function obtenerSesion() {
  const sessionString = sessionStorage.getItem('kfitness_sesion');
  if (!sessionString) return null;

  try {
    return JSON.parse(sessionString);
  } catch (error) {
    sessionStorage.removeItem('kfitness_sesion');
    return null;
  }
}

function guardarSesion(usuario) {
  sessionStorage.setItem('kfitness_sesion', JSON.stringify(usuario));
}

function limpiarSesion() {
  sessionStorage.removeItem('kfitness_sesion');
}

function redirigir(seguro) {
  if (seguro) {
    window.location.href = seguro;
  }
}

function manejarLogin() {
  const form = document.getElementById('form-login');
  if (!form) return;
  const mensaje = document.getElementById('login-mensaje');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const recordar = document.getElementById('login-recordarme');

    if (!email || !password) {
      mensaje.textContent = 'Ingresa tu correo y contraseña.';
      mensaje.style.color = '#ff6b6b';
      return;
    }
    // Enviar credenciales al backend
    mensaje.textContent = 'Iniciando sesión...';
    mensaje.style.color = '#000';

    fetch('/api/login.ashx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email, password: password, recordar: !!(recordar && recordar.checked) })
    })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {
        if (data && data.success) {
          mensaje.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
          mensaje.style.color = '#ED1C2E';
          // No guardar datos de sesión en localStorage/sessionStorage
          const retorno = new URLSearchParams(window.location.search).get('returnUrl');
          const destino = ['/carrito.html', '/checkout.html'].includes(retorno) ? retorno : 'perfil.html';
          setTimeout(function() { window.location.href = destino; }, 800);
        } else {
          mensaje.textContent = (data && data.message) ? data.message : 'Credenciales incorrectas.';
          mensaje.style.color = '#ff6b6b';
        }
      })
      .catch(function() {
        mensaje.textContent = 'Error de red o del servidor. Intenta nuevamente más tarde.';
        mensaje.style.color = '#ff6b6b';
      });
  });
}

// protegerPaginaPerfil removed: perfil.js -> cargarPerfil() ahora es responsable de acceso a la página de perfil.

function initAutenticacion() {
  manejarLogin();
  // protegerPaginaPerfil() removed to avoid redundant calls to /api/profile.ashx
}

document.addEventListener('DOMContentLoaded', initAutenticacion);
