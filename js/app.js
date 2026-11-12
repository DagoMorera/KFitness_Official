const headerTemplate = `
  <div class='contenedor nav-bar'>
    <a href='index.html' class='nav-logo' aria-label='KFitness - Inicio'>
      <img src='img/Logo1.png' alt='KFitness'>
    </a>
    <button class='menu-hamburguesa' aria-expanded='false' aria-controls='nav-menu'>Menú</button>
    <nav id='nav-menu' class='nav-links' aria-label='Navegación principal'>
      <a href='index.html'>Inicio</a>
      <a href='servicios.html'>Servicios</a>
      <a href='horarios.html'>Horarios</a>
      <a href='promociones.html'>Promociones</a>
      <a href='contacto.html'>Contacto</a>
      <div id='nav-auth-actions'>
        <!-- Auth actions will be populated dynamically -->
      </div>
    </nav>
  </div>
`;

const footerTemplate = `
  <div class='contenedor footer-grid'>
    <div>
      <a href='index.html' class='footer-logo' aria-label='KFitness - Inicio'>
        <img src='img/Logo1.png' alt='KFitness'>
      </a>
    </div>
    <div>
      <h3>Enlaces rápidos</h3>
      <ul class='footer-links'>
        <li><a href='index.html'>Inicio</a></li>
        <li><a href='servicios.html'>Servicios</a></li>
        <li><a href='horarios.html'>Horarios</a></li>
        <li><a href='promociones.html'>Promociones</a></li>
      </ul>
    </div>
    <div>
      <h3>Contacto</h3>
      <p>Iveth Karina Martinez Garcia</p>
      <p>Propietaria de KFitness</p>
      <p>Teléfono: <a href='tel:+50670124477'>+506 7012 4477</a></p>
      <p>Correo: <a href='mailto:karinamartinezg19@gmail.com'>karinamartinezg19@gmail.com</a></p>
    </div>
  </div>
  <div class='contenedor footer-copyright'>
    <p>© <span id='anio-actual'></span> KFitness. Todos los derechos reservados.</p>
  </div>
`;

function initHeaderFooter() {
  // Prevent double initialization if script is accidentally executed twice
  if (window.__kf_header_initialized) return;
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  window.__kf_header_initialized = true;
  try { console.debug('[KF] initHeaderFooter: rendering header/footer'); } catch (e) {}
  if (header) {
    header.innerHTML = headerTemplate;
  }

// Centralized logout function used by dropdown and perfil.html
window.kfLogout = function () {
  return fetch('/api/logout.ashx', { method: 'POST', credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d && d.success) window.location.href = '/index.html';
      return d;
    })
    .catch(function (e) {
      window.location.href = '/index.html';
      throw e;
    });
};
  if (footer) {
    footer.innerHTML = footerTemplate;
  }
  // After rendering header, update authentication-dependent links
  updateAuthHeader();
}

function obtenerCantidadCarritoHeader() {
  try {
    if (window.KFCarritoStore && typeof window.KFCarritoStore.countItems === 'function') {
      return Number(window.KFCarritoStore.countItems() || 0);
    }

    var raw = window.localStorage.getItem('kfitness_carrito_v1');
    if (!raw) return 0;
    var data = JSON.parse(raw);
    return Array.isArray(data) ? data.length : 0;
  } catch (_) {
    return 0;
  }
}

function actualizarBadgeCarritoHeader() {
  var badge = document.getElementById('kf-carrito-count');
  if (!badge) return;
  var total = obtenerCantidadCarritoHeader();
  badge.textContent = String(total);
  badge.hidden = total <= 0;
}

function updateAuthHeader() {
  try {
    var headerEl = document.querySelector('.site-header');
    if (!headerEl) {
      try { console.debug('[KF] updateAuthHeader: no .site-header found'); } catch (e) {}
      return;
    }
    var nav = headerEl.querySelector('#nav-menu');
    if (!nav) {
      try { console.debug('[KF] updateAuthHeader: no #nav-menu found inside header'); } catch (e) {}
      return;
    }
    // Query the server for profile to determine authentication state
    var authContainer = headerEl.querySelector('#nav-auth-actions');
    if (!authContainer) {
      try { console.debug('[KF] updateAuthHeader: no #nav-auth-actions found'); } catch (e) {}
      return;
    }

    // Do not assume visitor state while the server check is in progress.
    // Keep the auth container neutral (empty) until the request returns.
    if (authContainer) {
      try { console.debug('[KF] updateAuthHeader: clearing auth container (neutral)'); } catch (e) {}
      authContainer.innerHTML = '';
    }

    var ctaRegistroInicio = document.getElementById('inicio-cta-registro');
    if (ctaRegistroInicio) {
      ctaRegistroInicio.hidden = true;
    }

    fetch('/api/profile.ashx', { method: 'GET', credentials: 'same-origin' })
      .then(function(resp) {
        // If unauthenticated, render visitor links explicitly
        if (resp.status === 401) {
          try { console.debug('[KF] updateAuthHeader: server returned 401 — rendering visitor links'); } catch (e) {}
          authContainer.innerHTML = "<a href='/login.html'>Iniciar sesión</a> <a class='boton boton-registro' href='/registro.html'>Registrarse</a>";
          if (ctaRegistroInicio) ctaRegistroInicio.hidden = false;
          return null;
        }

        // For server errors or other non-ok responses, do not assume logout: leave neutral
        if (resp.status >= 500 || !resp.ok) {
          return null;
        }

        // Validate content-type before parsing JSON
        var ct = resp.headers.get('content-type') || '';
        if (!ct.toLowerCase().includes('application/json')) {
          try { console.debug('[KF] updateAuthHeader: content-type not JSON:', ct); } catch (e) {}
          // Received non-JSON (e.g., HTML) — do not treat as authenticated; leave neutral
          return null;
        }

        return resp.json();
      })
      .then(function(data) {
        if (!data) return;
        if (data && data.success) {
          if (ctaRegistroInicio) ctaRegistroInicio.hidden = true;
          var rol = (data.rol || '').toLowerCase();
          var esAdmin = rol === 'administrador';
          var texto = esAdmin ? 'Administración' : 'Mi perfil';
          var linkPrincipal = esAdmin ? '/admin.html' : '/perfil.html';
          var etiquetaPrincipal = esAdmin ? 'Panel de administración' : 'Mi perfil';

          var contactoLink = nav.querySelector("a[href='contacto.html'], a[href='/contacto.html']");
          if (contactoLink) {
            if (esAdmin) {
              contactoLink.setAttribute('hidden', 'hidden');
              contactoLink.style.display = 'none';
            } else {
              contactoLink.removeAttribute('hidden');
              contactoLink.style.display = '';
            }
          }

          var isActive = window.location.pathname === linkPrincipal || window.location.pathname === linkPrincipal.replace('/', '');

          var iconDashboard = '<svg class="kf-item-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"></path></svg>';
          var iconProfile = '<svg class="kf-item-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5z"></path></svg>';
          var iconLogout = '<svg class="kf-item-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17 15 12 10 7M15 12H3M13 3h6v18h-6"></path></svg>';

          var menuItems = '';
          if (esAdmin) {
            menuItems += '<a href="' + linkPrincipal + '" class="kf-dropdown-item" role="menuitem">' + iconDashboard + '<span>' + etiquetaPrincipal + '</span></a>';
            menuItems += '<a href="/perfil.html" class="kf-dropdown-item" role="menuitem">' + iconProfile + '<span>Mi perfil</span></a>';
          } else {
            var linkPerfil = '/perfil.html?seccion=perfil-datos#perfil-datos';
            var linkProgreso = '/perfil.html?seccion=perfil-progreso#perfil-progreso';
            var linkReservas = '/perfil.html?seccion=perfil-reservas&filtro=proximas#perfil-reservas';
            var linkRutinas = '/perfil.html?seccion=perfil-rutinas#perfil-rutinas';

            menuItems += '<a href="' + linkPerfil + '" class="kf-dropdown-item" role="menuitem">' + iconProfile + '<span>Mi perfil</span></a>';
            menuItems += '<a href="' + linkProgreso + '" class="kf-dropdown-item" role="menuitem"><span>Mi progreso</span></a>';
            menuItems += '<a href="' + linkReservas + '" class="kf-dropdown-item" role="menuitem"><span>Mis reservas</span></a>';
            menuItems += '<a href="' + linkRutinas + '" class="kf-dropdown-item" role="menuitem"><span>Mis rutinas</span></a>';
            menuItems += '<a href="/carrito.html" class="kf-dropdown-item" role="menuitem">Carrito <span id="kf-carrito-count" class="tag mine" hidden>0</span></a>';
          }
          menuItems += '<button type="button" id="kf-logout-btn" class="kf-dropdown-item kf-logout" role="menuitem">' + iconLogout + '<span>Cerrar sesión</span></button>';

          authContainer.innerHTML = `
            <div class="kf-dropdown" data-kf-dropdown>
              <button type="button" class="kf-dropdown-toggle boton boton-registro" aria-expanded="false">
                ${texto} <span class="kf-caret">▾</span>
              </button>
              <div class="kf-dropdown-menu" role="menu">
                ${menuItems}
              </div>
            </div>
          `;

          if (isActive) {
            var toggle = authContainer.querySelector('.kf-dropdown-toggle');
            if (toggle) toggle.classList.add('activo');
          }

          actualizarBadgeCarritoHeader();

          (function wireDropdown() {
            var root = authContainer.querySelector('[data-kf-dropdown]');
            if (!root) return;
            var toggle = root.querySelector('.kf-dropdown-toggle');
            var menu = root.querySelector('.kf-dropdown-menu');
            var logoutBtn = root.querySelector('#kf-logout-btn');

            function closeMenu() {
              if (toggle) toggle.setAttribute('aria-expanded', 'false');
              if (menu) menu.classList.remove('open');
            }

            function openMenu() {
              if (toggle) toggle.setAttribute('aria-expanded', 'true');
              if (menu) menu.classList.add('open');
            }

            if (toggle) {
              toggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var expanded = toggle.getAttribute('aria-expanded') === 'true';
                if (expanded) closeMenu(); else openMenu();
              });
            }

            if (menu) {
              menu.addEventListener('click', function (ev) {
                var item = ev.target.closest('.kf-dropdown-item');
                if (!item) return;
                closeMenu();
              });
            }

            document.addEventListener('click', function (ev) {
              if (!root.contains(ev.target)) closeMenu();
            });

            document.addEventListener('keydown', function (ev) {
              if (ev.key === 'Escape') {
                closeMenu();
                if (toggle) toggle.focus();
              }
            });

            if (logoutBtn) {
              logoutBtn.addEventListener('click', function () {
                closeMenu();
                if (window.kfLogout) {
                  window.kfLogout();
                } else {
                  window.location.href = '/index.html';
                }
              });
            }
          })();
        }
      })
      .catch(function() {
        // Network error: do not assume logout — keep neutral or previous state
      });
  } catch (e) {
    // ignore errors
  }
}

function initMobileMenu() {
  const boton = document.querySelector('.menu-hamburguesa');
  const nav = document.querySelector('.nav-links');
  if (!boton || !nav) return;

  boton.addEventListener('click', () => {
    const visible = nav.classList.toggle('visible');
    boton.setAttribute('aria-expanded', visible ? 'true' : 'false');
  });
}

function setActiveNavLink() {
  const url = window.location.pathname;
  const page = url.substring(url.lastIndexOf('/') + 1) || 'index.html';
  const links = document.querySelectorAll('.nav-links a');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === page) {
      link.classList.add('activo');
    }
  });
}

function initFiltroServicios() {
  const listaServicios = document.getElementById('lista-servicios');
  if (!listaServicios) return;
  if ((listaServicios.dataset.serviciosRender || '').toLowerCase() === 'inline') return;

  const botones = Array.from(document.querySelectorAll('.filtros-servicios button'));
  const estado = document.getElementById('estado-servicios');
  const modal = document.getElementById('servicio-detalle-modal');
  const modalContenido = document.getElementById('servicio-detalle-contenido');
  const modalCerrar = document.getElementById('servicio-detalle-cerrar');
  let ultimoFoco = null;

  function normalizarCategoria(valor) {
    return (valor || '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function formatoPrecio(valor) {
    if (typeof valor !== 'number' || Number.isNaN(valor)) return null;
    try {
      const monto = Math.round(valor);
      const agrupado = new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true
      }).format(monto);
      return '₡' + agrupado.replace(/\u00A0/g, '.').replace(/,/g, '.');
    } catch (e) {
      return '₡' + Math.round(valor).toString();
    }
  }

  function establecerEstado(texto) {
    if (estado) estado.textContent = texto || '';
  }

  function abrirModal() {
    if (!modal) return;
    ultimoFoco = document.activeElement;
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');
    if (modalCerrar) modalCerrar.focus();
  }

  function cerrarModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    if (ultimoFoco && typeof ultimoFoco.focus === 'function') {
      ultimoFoco.focus();
    }
  }

  function aplicarFiltro(filtro) {
    const filtroActual = filtro || 'todos';
    const tarjetas = listaServicios.querySelectorAll('.tarjeta.servicio');
    tarjetas.forEach((tarjeta) => {
      const categoria = tarjeta.dataset.categoria || '';
      tarjeta.style.display = (filtroActual === 'todos' || categoria === filtroActual) ? '' : 'none';
    });
  }

  function crearParDetalle(etiqueta, valor) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = etiqueta + ': ';
    p.appendChild(strong);
    p.appendChild(document.createTextNode(valor || 'No disponible'));
    return p;
  }

  function crearPlaceholderImagenServicio(claseExtra) {
    const placeholder = document.createElement('div');
    placeholder.className = 'servicio-imagen servicio-imagen--placeholder' + (claseExtra ? (' ' + claseExtra) : '');
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', 'Imagen no disponible para este servicio');

    const texto = document.createElement('span');
    texto.textContent = 'Imagen no disponible';
    placeholder.appendChild(texto);

    return placeholder;
  }

  function normalizarRutaImagen(src) {
    const valor = (src || '').toString().trim();
    if (!valor) return '';
    if (valor.startsWith('http://') || valor.startsWith('https://') || valor.startsWith('/')) return valor;
    return '/' + valor.replace(/^\/+/, '');
  }

  function crearImagenServicio(src, alt, claseExtra) {
    const ruta = normalizarRutaImagen(src);
    if (!ruta) {
      return crearPlaceholderImagenServicio(claseExtra);
    }

    const img = document.createElement('img');
    img.className = 'servicio-imagen' + (claseExtra ? (' ' + claseExtra) : '');
    img.src = ruta;
    img.alt = alt || 'Imagen del servicio';
    img.loading = 'lazy';
    img.addEventListener('error', function () {
      const reemplazo = crearPlaceholderImagenServicio(claseExtra);
      if (img.parentNode) {
        img.parentNode.replaceChild(reemplazo, img);
      }
    });
    return img;
  }

  function renderizarTarjetas(servicios) {
    listaServicios.innerHTML = '';

    servicios.forEach((servicio) => {
      const categoriaNormalizada = normalizarCategoria(servicio.categoria);

      const articulo = document.createElement('article');
      articulo.className = 'tarjeta servicio';
      articulo.dataset.categoria = categoriaNormalizada;

      const imagen = crearImagenServicio(servicio.imagenPrincipal, servicio.nombre);

      const titulo = document.createElement('h3');
      titulo.textContent = servicio.nombre || 'Servicio';

      const descripcion = document.createElement('p');
      descripcion.textContent = servicio.descripcion || 'Descripción no disponible.';

      const precio = document.createElement('p');
      precio.className = 'detalle';
      const precioTexto = formatoPrecio(servicio.precio);
      precio.textContent = precioTexto ? ('Precio: ' + precioTexto) : 'Precio no disponible';

      const acciones = document.createElement('div');
      acciones.className = 'acciones-tarjeta';

      const btnDetalle = document.createElement('button');
      btnDetalle.type = 'button';
      btnDetalle.className = 'boton boton-secundario';
      btnDetalle.textContent = 'Ver detalles';
      btnDetalle.addEventListener('click', function () {
        cargarDetalle(servicio.idProducto, btnDetalle);
      });

      const linkReserva = document.createElement('a');
      linkReserva.href = 'reservas.html';
      linkReserva.className = 'boton boton-principal';
      linkReserva.textContent = 'Reservar';

      acciones.appendChild(btnDetalle);
      acciones.appendChild(linkReserva);

      articulo.appendChild(imagen);
      articulo.appendChild(titulo);
      articulo.appendChild(descripcion);
      articulo.appendChild(precio);
      articulo.appendChild(acciones);

      listaServicios.appendChild(articulo);
    });
  }

  function renderizarDetalle(servicio) {
    if (!modalContenido) return;
    modalContenido.innerHTML = '';

    if (!servicio) {
      const p = document.createElement('p');
      p.textContent = 'No fue posible cargar el detalle del servicio.';
      modalContenido.appendChild(p);
      return;
    }

    const img = crearImagenServicio(servicio.imagenPrincipal, servicio.nombre, 'servicio-detalle-imagen');
    modalContenido.appendChild(img);

    const titulo = document.createElement('h3');
    titulo.textContent = servicio.nombre || 'Servicio';
    modalContenido.appendChild(titulo);

    const descripcion = document.createElement('p');
    descripcion.textContent = servicio.descripcion || 'Descripción no disponible.';
    modalContenido.appendChild(descripcion);

    modalContenido.appendChild(crearParDetalle('Categoría', servicio.categoria || 'No disponible'));

    const precioTexto = formatoPrecio(servicio.precio);
    modalContenido.appendChild(crearParDetalle('Precio', precioTexto || 'No disponible'));
  }

  function cargarDetalle(idProducto, trigger) {
    if (!idProducto || !Number.isInteger(idProducto)) return;
    if (trigger) trigger.disabled = true;

    fetch('/api/services.ashx?id=' + encodeURIComponent(idProducto), { method: 'GET', credentials: 'same-origin' })
      .then((resp) => {
        if (!resp.ok) throw new Error('HTTP_' + resp.status);
        const ct = (resp.headers.get('content-type') || '').toLowerCase();
        if (ct.indexOf('application/json') === -1) throw new Error('INVALID_CONTENT_TYPE');
        return resp.json();
      })
      .then((data) => {
        if (!data || data.success !== true || !data.servicio) {
          throw new Error('INVALID_PAYLOAD');
        }
        renderizarDetalle(data.servicio);
        abrirModal();
      })
      .catch(() => {
        renderizarDetalle(null);
        abrirModal();
      })
      .finally(() => {
        if (trigger) trigger.disabled = false;
      });
  }

  if (modalCerrar) {
    modalCerrar.addEventListener('click', cerrarModal);
  }

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) cerrarModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hidden) {
      cerrarModal();
    }
  });

  botones.forEach((boton) => {
    boton.addEventListener('click', () => {
      botones.forEach((item) => item.classList.remove('activo'));
      boton.classList.add('activo');
      aplicarFiltro(boton.dataset.filtro);
    });
  });

  establecerEstado('Cargando servicios...');

  fetch('/api/services.ashx', { method: 'GET', credentials: 'same-origin' })
    .then((resp) => {
      if (!resp.ok) throw new Error('HTTP_' + resp.status);
      const ct = (resp.headers.get('content-type') || '').toLowerCase();
      if (ct.indexOf('application/json') === -1) throw new Error('INVALID_CONTENT_TYPE');
      return resp.json();
    })
    .then((data) => {
      if (!data || data.success !== true || !Array.isArray(data.servicios)) {
        throw new Error('INVALID_PAYLOAD');
      }

      if (data.servicios.length === 0) {
        establecerEstado('Actualmente no hay servicios disponibles');
        listaServicios.innerHTML = '';
        return;
      }

      renderizarTarjetas(data.servicios);
      establecerEstado('');

      const filtroInicial = normalizarCategoria(new URLSearchParams(window.location.search).get('filtro'));
      const botonInicial = botones.find((boton) => boton.dataset.filtro === filtroInicial) || botones.find((boton) => boton.dataset.filtro === 'todos');
      if (botonInicial) botonInicial.click();
    })
    .catch(() => {
      listaServicios.innerHTML = '';
      establecerEstado('No fue posible cargar los servicios en este momento.');
    });
}

function updateFooterYear() {
  const año = new Date().getFullYear();
  const span = document.getElementById('anio-actual');
  if (span) {
    span.textContent = año;
  }
}

function initScrollReveal() {
  const elementos = document.querySelectorAll(`
    .hero .hero-card,
    main section:not(.hero) h1,
    main section:not(.hero) h2,
    main section:not(.hero) h3,
    main section:not(.hero) p,
    main section:not(.hero) li,
    main section:not(.hero) table,
    main section:not(.hero) .boton
  `);

  if (!elementos.length) return;

  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducirMovimiento || !('IntersectionObserver' in window)) {
    elementos.forEach((elemento) => elemento.classList.add('reveal-visible'));
    return;
  }

  elementos.forEach((elemento, indice) => {
    elemento.classList.add('scroll-reveal');
    elemento.style.setProperty('--reveal-delay', `${(indice % 4) * 80}ms`);
  });

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('reveal-visible');
      observador.unobserve(entrada.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px'
  });

  elementos.forEach((elemento) => observador.observe(elemento));
}

function initHeroCarousel() {
  const imagen = document.querySelector('.hero-main-image');
  if (!imagen) return;

  const imagenes = [
    { src: 'img/hero-kfitness.png', alt: 'Entrenamiento en KFitness' },
    { src: 'img/Kfitness2.png', alt: 'Atleta en las instalaciones de KFitness' },
    { src: 'img/Kfitness5.png', alt: 'Actividad física en KFitness' }
  ];
  let indice = 0;

  imagenes.slice(1).forEach((item) => {
    const precarga = new Image();
    precarga.src = item.src;
  });

  window.setInterval(() => {
    indice = (indice + 1) % imagenes.length;
    imagen.classList.add('cambiando-imagen');

    window.setTimeout(() => {
      imagen.src = imagenes[indice].src;
      imagen.alt = imagenes[indice].alt;
      imagen.classList.remove('cambiando-imagen');
    }, 500);
  }, 5000);
}

function initConsultaHorarios() {
  const tbody = document.getElementById('tabla-horarios-body');
  const estado = document.getElementById('estado-horarios');
  const filtroServicio = document.getElementById('horarios-filtro-servicio');
  const filtroFecha = document.getElementById('horarios-filtro-fecha');
  const btnFiltrar = document.getElementById('horarios-filtrar');
  if (!tbody) return;

  function setEstado(texto) {
    if (estado) estado.textContent = texto || '';
  }

  function escapeHtml(valor) {
    return (valor || '')
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatearFecha(valor) {
    if (!valor) return '-';
    const fecha = new Date(valor + 'T00:00:00');
    if (Number.isNaN(fecha.getTime())) return valor;
    try {
      return new Intl.DateTimeFormat('es-CR', {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(fecha);
    } catch (e) {
      return valor;
    }
  }

  function formatearHora(valor) {
    const texto = (valor || '').toString();
    if (!texto) return '--:--';
    return texto.length >= 5 ? texto.substring(0, 5) : texto;
  }

  function renderVacio(texto) {
    tbody.innerHTML = "<tr><td colspan='9'>" + escapeHtml(texto) + "</td></tr>";
  }

  function poblarFiltroServicios(horarios) {
    if (!filtroServicio) return;

    const seleccionado = filtroServicio.value || '';
    const mapa = new Map();
    (horarios || []).forEach(function (h) {
      if (!h) return;
      const id = h.idProducto;
      const nombre = h.servicio;
      if (!id || !nombre) return;
      if (!mapa.has(String(id))) {
        mapa.set(String(id), String(nombre));
      }
    });

    let html = '<option value="">Todos los servicios</option>';
    Array.from(mapa.entries()).forEach(function (pair) {
      html += '<option value="' + escapeHtml(pair[0]) + '">' + escapeHtml(pair[1]) + '</option>';
    });

    filtroServicio.innerHTML = html;

    if (seleccionado && filtroServicio.querySelector('option[value="' + seleccionado + '"]')) {
      filtroServicio.value = seleccionado;
    }
  }

  function cargarHorarios() {
    const query = [];
    const idProducto = filtroServicio ? (filtroServicio.value || '').trim() : '';
    const fecha = filtroFecha ? (filtroFecha.value || '').trim() : '';

    if (idProducto) query.push('idProducto=' + encodeURIComponent(idProducto));
    if (fecha) query.push('fecha=' + encodeURIComponent(fecha));

    const url = '/api/schedules.ashx' + (query.length ? ('?' + query.join('&')) : '');

    renderVacio('Cargando horarios disponibles...');
    setEstado('');

    return fetch(url, { method: 'GET', credentials: 'same-origin' })
      .then(function (resp) {
        if (!resp.ok) {
          throw new Error('HTTP_' + resp.status);
        }
        return resp.json();
      })
      .then(function (data) {
        if (!data || !data.success) {
          renderVacio((data && data.message) || 'No fue posible cargar los horarios disponibles.');
          setEstado((data && data.message) || '');
          return;
        }

        const horarios = Array.isArray(data.horarios) ? data.horarios : [];
        poblarFiltroServicios(horarios);

        if (horarios.length === 0) {
          const msg = data.message || 'No hay horarios disponibles en este momento.';
          renderVacio(msg);
          setEstado(msg);
          return;
        }

        const filas = horarios.map(function (h) {
          const fechaTxt = formatearFecha(h.fecha);
          const hora = formatearHora(h.horaInicio) + ' - ' + formatearHora(h.horaFin);
          const servicio = h.servicio || 'Servicio no disponible';
          const instructor = h.instructor || 'Sin asignar';
          const capacidad = Number(h.capacidadMaxima || 0);
          const confirmadas = Number(h.reservasConfirmadas || 0);
          const cupos = Number(h.cuposRestantes || 0);
          const completo = !!h.completo || cupos <= 0;
          const estadoSesion = completo ? 'Completo' : 'Disponible';
          const claseEstado = completo ? 'estado-tag inactivo' : 'estado-tag disponible';
          const accion = completo
            ? '<span class="estado-tag inactivo">Sin cupo</span>'
            : '<a class="boton boton-secundario" href="reservas.html?idHorarioServicio=' + encodeURIComponent(String(h.idHorarioServicio || '')) + '">Reservar</a>';

          return '<tr>' +
            '<td>' + escapeHtml(fechaTxt) + '</td>' +
            '<td>' + escapeHtml(hora) + '</td>' +
            '<td>' + escapeHtml(servicio) + '</td>' +
            '<td>' + escapeHtml(instructor) + '</td>' +
            '<td>' + escapeHtml(String(capacidad)) + '</td>' +
            '<td>' + escapeHtml(String(confirmadas)) + '</td>' +
            '<td>' + escapeHtml(String(cupos)) + '</td>' +
            '<td><span class="' + claseEstado + '">' + escapeHtml(estadoSesion) + '</span></td>' +
            '<td>' + accion + '</td>' +
            '</tr>';
        }).join('');

        tbody.innerHTML = filas;
        setEstado('');
      })
      .catch(function () {
        renderVacio('No fue posible cargar los horarios disponibles. Intenta nuevamente más tarde.');
        setEstado('No fue posible cargar los horarios disponibles.');
      });
  }

  if (btnFiltrar) {
    btnFiltrar.addEventListener('click', function () {
      cargarHorarios();
    });
  }

  cargarHorarios();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body) document.body.classList.add('kf-global-bg');

  initHeaderFooter();
  initMobileMenu();
  setActiveNavLink();
  initFiltroServicios();
  initConsultaHorarios();
  updateFooterYear();
  initScrollReveal();
  initHeroCarousel();
  actualizarBadgeCarritoHeader();
  window.addEventListener('kf:carrito:change', actualizarBadgeCarritoHeader);
  window.addEventListener('storage', function (ev) {
    if (!ev || ev.key !== 'kfitness_carrito_v1') return;
    actualizarBadgeCarritoHeader();
  });
  // Ensure header auth state is refreshed after other inits
  // updateAuthHeader called from initHeaderFooter which already ran
});
