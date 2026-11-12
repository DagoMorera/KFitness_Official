var adminUsersState = {
  pagina: 1,
  tamanoPagina: 10,
  totalPaginas: 1,
  totalRegistros: 0,
  query: '',
  roles: [],
  identificacionDisponible: false,
  detalleActual: null,
  rolOriginalId: null,
  fotoModal: {
    abierto: false,
    ultimoFoco: null
  }
};

var adminServicesState = {
  csrfToken: '',
  categorias: [],
  cargandoCategorias: false,
  enviando: false,
  imagenSeleccionada: null,
  previewUrl: '',
  cargandoListado: false,
  paginaActual: 1,
  pageSize: 10,
  total: 0,
  ultimoRequestListado: 0,
  catalogoCompleto: [],
  filtrosListado: {
    nombre: '',
    categoria: '',
    estado: ''
  },
  edit: {
    abierto: false,
    enviando: false,
    idServicio: 0,
    imagenActualUrl: '',
    imagenNueva: null,
    previewUrl: '',
    quitarImagen: false,
    ultimoFoco: null
  },
  modalCrear: {
    abierto: false,
    enviando: false,
    ultimoFoco: null
  }
};

var adminSchedulesState = {
  csrfToken: '',
  servicios: [],
  cargandoServicios: false,
  cargandoListado: false,
  enviando: false,
  editandoId: 0,
  bloqueCounter: 1,
  bloques: [{ indice: 0, idHorarioServicio: 0 }],
  modo: 'INDIVIDUAL',
  previewRecurrente: [],
  listadoActual: [],
  paginacionListado: { pagina: 1, pageSize: 10, total: 0 },
  modalEdicion: {
    abierto: false,
    enviando: false,
    idHorarioServicio: 0,
    ultimoFoco: null
  }
};

var adminPromotionsState = {
  csrfToken: '',
  servicios: [],
  promociones: [],
  listadoFiltrado: [],
  enviando: false,
  cargando: false,
  cargaExitosa: false,
  abriendoModal: false,
  editandoId: 0,
  modoFormulario: 'crear',
  imagen: {
    archivo: null,
    previewUrl: '',
    referenciaActual: '',
    urlActual: ''
  },
  modal: {
    abierto: false,
    ultimoFoco: null
  },
  preview: {
    abierto: false,
    promocionId: 0,
    ultimoFoco: null
  },
  filtros: {
    busqueda: '',
    servicio: '',
    tipo: '',
    estado: ''
  },
  paginacion: { pagina: 1, pageSize: 10, total: 0 }
};

var adminReservationsState = {
  cargando: false,
  items: [],
  filtros: {
    cliente: '',
    servicio: '',
    fecha: '',
    estado: ''
  },
  paginacion: { pagina: 1, pageSize: 10, total: 0 }
};

var adminRoutinesState = {
  csrfToken: '',
  cargando: false,
  guardando: false,
  asignando: false,
  pagina: 1,
  pageSize: 10,
  totalPaginas: 1,
  totalRegistros: 0,
  filtros: {
    nombre: '',
    nivel: '',
    estado: ''
  },
  listado: [],
  rutinasActivas: [],
  usuariosBusqueda: [],
  modal: {
    abierto: false,
    modo: 'crear',
    ultimoFoco: null
  },
  modalDetalle: {
    abierto: false,
    ultimoFoco: null
  },
  modalAsignar: {
    abierto: false,
    ultimoFoco: null
  },
  ia: {
    generando: false,
    modalAbierto: false,
    ultimoFoco: null,
    borrador: null
  }
};

var adminAuditState = {
  cargando: false,
  pagina: 1,
  tamanoPagina: 10,
  totalPaginas: 1,
  totalRegistros: 0,
  accionesDisponibles: [],
  filtros: {
    usuario: '',
    accion: '',
    fechaDesde: '',
    fechaHasta: ''
  }
};

var adminReportsState = {
  cargando: false,
  exportando: false,
  cargadoInicial: false,
  ultimoTipo: '',
  items: [],
  requestId: 0,
  filtrosPanelAbierto: false,
  filtrosActivosCount: 0,
  paginacionDetalle: { pagina: 1, pageSize: 10, total: 0 },
  rolesUsuarios: [],
  filtros: {
    nombre: '',
    categoria: '',
    estado: ''
  },
  filtrosPromociones: {
    nombre: '',
    estado: '',
    vigencia: ''
  },
  filtrosReservas: {
    servicio: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  },
  filtrosUsuarios: {
    busqueda: '',
    rol: '',
    estado: ''
  },
  filtrosAplicados: {
    servicios: { nombre: '', categoria: '', estado: '' },
    promociones: { nombre: '', estado: '', vigencia: '' },
    reservas: { servicio: '', estado: '', fechaDesde: '', fechaHasta: '' },
    usuarios: { busqueda: '', rol: '', estado: '' }
  }
};

var adminDashboardState = {
  cargando: false,
  inicializado: false,
  requestId: 0,
  rangoDefault: {
    desde: '',
    hasta: ''
  },
  charts: {
    reservasPeriodo: null,
    serviciosCategoria: null,
    reservasEstado: null,
    ocupacion: null,
    usuariosRol: null
  },
  filtros: {
    desde: '',
    hasta: ''
  },
  reservasMes: {
    periodoClave: '',
    clavesPeriodo: {},
    todos: [],
    visibles: [],
    seleccionAplicada: null,
    seleccionBorrador: {},
    borradorInicializado: false,
    anioPanel: '',
    panelAbierto: false
  }
};

var ADMIN_SERVICIO_IMAGEN_MAX_BYTES = 5 * 1024 * 1024;
var ADMIN_SERVICIO_IMAGEN_TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
var ADMIN_SERVICIO_IMAGEN_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

function escapeHtml(value) {
  var text = String(value == null ? '' : value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolverPaginacionLocal(items, pagina, pageSize) {
  var lista = Array.isArray(items) ? items : [];
  var tamano = Number(pageSize || 10);
  if (!Number.isFinite(tamano) || tamano <= 0) tamano = 10;

  var total = lista.length;
  var totalPaginas = total > 0 ? Math.ceil(total / tamano) : 1;
  var actual = Number(pagina || 1);
  if (!Number.isFinite(actual) || actual < 1) actual = 1;
  if (actual > totalPaginas) actual = totalPaginas;

  var inicio = total > 0 ? ((actual - 1) * tamano) : 0;
  var fin = total > 0 ? Math.min(inicio + tamano, total) : 0;

  return {
    items: lista.slice(inicio, fin),
    meta: {
      pagina: actual,
      totalPaginas: totalPaginas,
      pageSize: tamano,
      total: total,
      desde: total > 0 ? inicio + 1 : 0,
      hasta: fin
    }
  };
}

function renderControlesPaginacion(idBase, meta, bloqueado, onPrev, onNext) {
  var wrap = document.getElementById(idBase + '-wrap');
  var summary = document.getElementById(idBase + '-summary');
  var pageinfo = document.getElementById(idBase + '-pageinfo');
  var prev = document.getElementById(idBase + '-prev');
  var next = document.getElementById(idBase + '-next');
  if (!wrap || !summary || !pageinfo || !prev || !next) return;

  var total = Number(meta && meta.total != null ? meta.total : 0);
  var pagina = Number(meta && meta.pagina != null ? meta.pagina : 1);
  var totalPaginas = Number(meta && meta.totalPaginas != null ? meta.totalPaginas : 1);
  var desde = Number(meta && meta.desde != null ? meta.desde : 0);
  var hasta = Number(meta && meta.hasta != null ? meta.hasta : 0);
  var tamano = Number(meta && meta.pageSize != null ? meta.pageSize : 10);

  summary.textContent = 'Mostrando ' + String(desde) + '–' + String(hasta) + ' de ' + String(total);
  pageinfo.textContent = 'Página ' + String(pagina) + ' de ' + String(totalPaginas);

  var mostrar = total > tamano;
  wrap.hidden = !mostrar;
  if (!mostrar) return;

  prev.disabled = !!bloqueado || pagina <= 1;
  next.disabled = !!bloqueado || pagina >= totalPaginas;

  if (prev.dataset.bound !== '1') {
    prev.dataset.bound = '1';
    prev.addEventListener('click', function () {
      if (typeof onPrev === 'function') onPrev();
    });
  }

  if (next.dataset.bound !== '1') {
    next.dataset.bound = '1';
    next.addEventListener('click', function () {
      if (typeof onNext === 'function') onNext();
    });
  }
}

function aplicarEstiloEncabezadoCompartidoAdmin(seccion) {
  if (!seccion) return;

  var headers = seccion.querySelectorAll('.admin-modulo-header, .admin-reportes-hero, .admin-hero');
  headers.forEach(function (header) {
    header.classList.add('admin-seccion-header');

    var tieneAccion = !!header.querySelector('.boton, .admin-form-field, .admin-status-badge');
    if (tieneAccion) {
      header.classList.add('admin-seccion-header-con-accion');
    } else {
      header.classList.remove('admin-seccion-header-con-accion');
    }
  });
}

function mostrarSeccionAdmin(clave) {
  var secciones = document.querySelectorAll('.admin-seccion');
  var idObjetivo = clave === 'dashboard' ? 'admin-dashboard' : 'admin-' + clave;

  secciones.forEach(function (seccion) {
    seccion.hidden = seccion.id !== idObjetivo;
  });

  var botones = document.querySelectorAll('.admin-sidebar button[data-admin-seccion]');
  botones.forEach(function (boton) {
    if (boton.getAttribute('data-admin-seccion') === clave) {
      boton.classList.add('activo');
    } else {
      boton.classList.remove('activo');
    }
  });

  if (clave === 'usuarios') {
    cargarUsuarios();
  } else {
    cerrarModalUsuario();
    if (clave === 'dashboard') {
      cargarDashboard();
    } else if (clave === 'servicios') {
      construirLayoutServiciosAdmin();
      cargarCategoriasServicios();
      cargarListadoServicios();
    } else if (clave === 'horarios') {
      cargarServiciosHorariosAdmin();
      cargarListadoHorariosAdmin();
    } else if (clave === 'reservas') {
      cargarListadoReservasAdmin();
    } else if (clave === 'promociones') {
      cargarPromocionesData();
    } else if (clave === 'rutinas') {
      cargarListadoRutinasAdmin();
    } else if (clave === 'reportes') {
      sincronizarFiltrosEditablesDesdeAplicados(obtenerTipoReporteSeleccionado());
      reflejarFiltrosEditablesEnVista();
      actualizarVisibilidadFiltrosReportes();
      configurarPresentacionReportePorTipo();
      setPanelFiltrosReportesAbierto(false);
      actualizarEstadoBotonFiltrosReportes();
      cargarReporteAdmin(false);
    } else if (clave === 'consultas') {
      KFitnessGestionWeb.contacts();
    } else if (clave === 'configuracion') {
      KFitnessGestionWeb.settings();
    } else if (clave === 'seguridad') {
      cargarBitacoraAuditoriaAdmin();
    }
  }

  aplicarEstiloEncabezadoCompartidoAdmin(document.getElementById(idObjetivo));
}

function construirLayoutServiciosAdmin() {
  var seccion = document.getElementById('admin-servicios');
  if (!seccion) return;

  var header = seccion.querySelector('.admin-modulo-header');
  if (header) {
    header.classList.remove('admin-seccion-header-con-accion');

    var titulo = header.querySelector('h2');
    if (titulo) titulo.textContent = 'Gestión de servicios';
  }

  var boton = document.getElementById('admin-servicio-crear-toggle');
  if (!boton) {
    var filtros = document.getElementById('admin-servicios-filtros');
    if (filtros) {
      var accion = document.createElement('div');
      accion.className = 'admin-servicios-accion-field';
      boton = document.createElement('button');
      boton.type = 'button';
      boton.id = 'admin-servicio-crear-toggle';
      boton.className = 'boton boton-principal';
      boton.textContent = '＋ Agregar servicio';
      accion.appendChild(boton);
      filtros.appendChild(accion);
    }
  }

  if (boton) {
    boton.setAttribute('aria-controls', 'admin-servicio-crear-modal');
  }

  var form = document.getElementById('admin-servicios-form');
  if (!form) return;

  var modal = document.getElementById('admin-servicio-crear-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-servicio-crear-modal';
    modal.className = 'admin-modal';
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = [
      '<div class="admin-modal-backdrop" data-admin-servicio-crear-cerrar="1"></div>',
      '<div class="admin-modal-panel" role="dialog" aria-modal="true" aria-labelledby="admin-servicio-crear-titulo">',
      '  <div class="admin-modal-header">',
      '    <h3 id="admin-servicio-crear-titulo">Agregar servicio</h3>',
      '    <button type="button" class="admin-modal-close" id="admin-servicio-crear-cerrar" aria-label="Cerrar">×</button>',
      '  </div>',
      '  <div class="admin-modal-body">',
      '    <div id="admin-servicio-crear-form-panel"></div>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);
  }

  var panel = document.getElementById('admin-servicio-crear-form-panel');
  if (panel && form.parentNode !== panel) {
    panel.appendChild(form);
  }

  actualizarEstadoBotonCrearServicio();
}

function actualizarEstadoBotonCrearServicio() {
  var btn = document.getElementById('admin-servicio-crear-toggle');
  var modal = document.getElementById('admin-servicio-crear-modal');
  if (!btn) return;

  var abierto = !!(adminServicesState.modalCrear && adminServicesState.modalCrear.abierto && modal && !modal.hidden);
  btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
}

function obtenerElementosEnfocablesModalCrearServicio() {
  var modal = document.getElementById('admin-servicio-crear-modal');
  if (!modal || modal.hidden) return [];

  var selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var todos = modal.querySelectorAll(selector);
  return Array.prototype.filter.call(todos, function (el) {
    return !el.hidden && el.getAttribute('aria-hidden') !== 'true';
  });
}

function manejarTecladoModalCrearServicio(e) {
  if (!adminServicesState.modalCrear || !adminServicesState.modalCrear.abierto) return;

  if (e.key === 'Escape') {
    if (adminServicesState.enviando) return;
    e.preventDefault();
    cerrarModalCrearServicio();
    return;
  }

  if (e.key !== 'Tab') return;

  var focusables = obtenerElementosEnfocablesModalCrearServicio();
  if (!focusables.length) return;

  var primero = focusables[0];
  var ultimo = focusables[focusables.length - 1];
  var indiceActual = focusables.indexOf(document.activeElement);

  if (indiceActual < 0) {
    e.preventDefault();
    primero.focus();
    return;
  }

  if (e.shiftKey && document.activeElement === primero) {
    e.preventDefault();
    ultimo.focus();
    return;
  }

  if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primero.focus();
  }
}

function abrirModalCrearServicio(disparador) {
  var modal = document.getElementById('admin-servicio-crear-modal');
  if (!modal) return;

  adminServicesState.modalCrear.ultimoFoco = disparador || document.activeElement || null;

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  adminServicesState.modalCrear.abierto = true;
  actualizarEstadoBotonCrearServicio();
  actualizarVistaPreviaServicioCrear();

  var primerControl = document.getElementById('servicio-nombre') || modal.querySelector('input, select, textarea, button');
  if (primerControl && typeof primerControl.focus === 'function') {
    setTimeout(function () {
      try { primerControl.focus(); } catch (_) { }
    }, 0);
  }
}

function cerrarModalCrearServicio() {
  if (adminServicesState.enviando) return;

  var modal = document.getElementById('admin-servicio-crear-modal');
  if (!modal) return;

  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  adminServicesState.modalCrear.abierto = false;
  actualizarEstadoBotonCrearServicio();

  var foco = adminServicesState.modalCrear.ultimoFoco;
  adminServicesState.modalCrear.ultimoFoco = null;
  if (foco && typeof foco.focus === 'function') {
    try { foco.focus(); } catch (_) { }
  }
}

function esRespuestaHtmlDeLogin(contentType, text) {
  var ct = (contentType || '').toLowerCase();
  if (ct.indexOf('text/html') >= 0) return true;

  var cuerpo = (text || '').trim().toLowerCase();
  return cuerpo.indexOf('<!doctype html') === 0 || cuerpo.indexOf('<html') === 0;
}

function setMensajeServicios(texto, esError) {
  var msg = document.getElementById('admin-servicios-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setMensajeServiciosLista(texto, esError) {
  var msg = document.getElementById('admin-servicios-lista-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setMensajeServicioEdicion(texto, esError) {
  var msg = document.getElementById('admin-servicio-editar-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setMensajeHorarios(texto, esError) {
  var msg = document.getElementById('admin-horarios-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setMensajeHorariosLista(texto, esError) {
  var msg = document.getElementById('admin-horarios-lista-mensaje');
  if (!msg) return;
  msg.innerHTML = '';
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setMensajeHorariosListaConAccion(texto, esError, textoAccion, onClick) {
  var msg = document.getElementById('admin-horarios-lista-mensaje');
  if (!msg) return;

  msg.innerHTML = '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';

  var span = document.createElement('span');
  span.textContent = texto || '';
  msg.appendChild(span);

  if (!textoAccion || typeof onClick !== 'function') return;

  var espacio = document.createTextNode(' ');
  msg.appendChild(espacio);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'boton boton-secundario boton-pequeno';
  btn.textContent = textoAccion;
  btn.addEventListener('click', function () {
    onClick(btn);
  });

  msg.appendChild(btn);
}

function obtenerHoyCostaRicaIso() {
  try {
    var ahora = new Date();
    var texto = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(ahora);
    return texto;
  } catch (_) {
    var d = new Date();
    return d.toISOString().slice(0, 10);
  }
}

function asegurarEstadoCalendarioHorariosAdmin() {
  if (!adminSchedulesState.calendario) {
    var hoyIso = obtenerHoyCostaRicaIso();
    adminSchedulesState.calendario = {
      vistaActiva: 'calendario',
      fechaSeleccionada: hoyIso,
      mesBase: hoyIso.substring(0, 7),
      requestId: 0,
      sesionesMes: []
    };
  }

  return adminSchedulesState.calendario;
}

function formatearFechaLargaCRAdmin(iso) {
  if (!iso) return '';
  try {
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-CR', {
      timeZone: 'America/Costa_Rica',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  } catch (_) {
    return iso;
  }
}

function inicializarEstilosHorariosAdmin() {
}

function construirLayoutHorariosAdmin() {
  var seccion = document.getElementById('admin-horarios');
  if (!seccion) return;

  var estadoCal = asegurarEstadoCalendarioHorariosAdmin();
  inicializarEstilosHorariosAdmin();

  var header = seccion.querySelector('.admin-modulo-header');
  if (header) {
    var titulo = header.querySelector('h2');
    if (titulo) titulo.textContent = 'Gestión de horarios';
  }

  var subHeader = seccion.querySelector('.admin-submodulo-header');
  if (subHeader) {
    var txt = (subHeader.textContent || '').toLowerCase();
    if (txt.indexOf('horarios registrados') >= 0) {
      subHeader.classList.add('admin-horarios-oculto');
    }
  }

  var form = document.getElementById('admin-horarios-form');
  if (form) {
    var modal = document.getElementById('admin-horarios-crear-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-horarios-crear-modal';
      modal.className = 'admin-modal';
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');

      modal.innerHTML = [
        '<div class="admin-modal-backdrop" data-admin-horario-crear-cerrar="1"></div>',
        '<div class="admin-modal-panel" role="dialog" aria-modal="true" aria-labelledby="admin-horario-crear-titulo">',
        '  <div class="admin-modal-header">',
        '    <h3 id="admin-horario-crear-titulo">Agregar horarios</h3>',
        '    <button type="button" class="admin-modal-close" id="admin-horario-crear-cerrar" aria-label="Cerrar">×</button>',
        '  </div>',
        '  <div class="admin-modal-body">',
        '    <div id="admin-horarios-form-panel"></div>',
        '  </div>',
        '</div>'
      ].join('');

      document.body.appendChild(modal);
    }

    var panel = document.getElementById('admin-horarios-form-panel');
    if (panel && form.parentNode !== panel) {
      panel.appendChild(form);
    }
  }

  var filtrosServicio = document.getElementById('horario-filtro-servicio');
  var filtrosFecha = document.getElementById('horario-filtro-fecha');
  var btnFiltrar = document.getElementById('horario-filtrar');

  var filtrosWrap = document.getElementById('admin-horarios-filtros-v2');
  if (!filtrosWrap && filtrosServicio && filtrosFecha && btnFiltrar) {
    filtrosWrap = document.createElement('div');
    filtrosWrap.id = 'admin-horarios-filtros-v2';
    filtrosWrap.className = 'admin-form-grid';

    var fieldSrv = document.createElement('div');
    fieldSrv.className = 'admin-form-field';
    fieldSrv.innerHTML = '<label for="horario-filtro-servicio">Servicio</label>';
    fieldSrv.appendChild(filtrosServicio);

    var fieldEstado = document.createElement('div');
    fieldEstado.className = 'admin-form-field';
    fieldEstado.innerHTML = '<label for="horario-filtro-estado">Estado</label><select id="horario-filtro-estado"><option value="todos">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option></select>';

    var fieldFecha = document.createElement('div');
    fieldFecha.className = 'admin-form-field';
    fieldFecha.innerHTML = '<label for="horario-filtro-fecha">Fecha (Listado)</label>';
    fieldFecha.appendChild(filtrosFecha);

    var fieldBtn = document.createElement('div');
    fieldBtn.className = 'admin-form-field';
    fieldBtn.innerHTML = '<label>&nbsp;</label>';
    fieldBtn.appendChild(btnFiltrar);

    filtrosWrap.appendChild(fieldSrv);
    filtrosWrap.appendChild(fieldEstado);
    filtrosWrap.appendChild(fieldFecha);
    filtrosWrap.appendChild(fieldBtn);

    var ancla = document.getElementById('admin-horarios-lista-body');
    var tabla = ancla ? ancla.closest('table') : null;
    var contenedor = tabla ? tabla.parentNode : null;
    if (contenedor && contenedor.parentNode) {
      contenedor.parentNode.insertBefore(filtrosWrap, contenedor);
    }
  }

  var listadoContainer = document.getElementById('admin-horarios-listado-vista');
  var body = document.getElementById('admin-horarios-lista-body');
  if (!listadoContainer && body) {
    var table = body.closest('table');
    var tableWrap = table ? table.parentNode : null;
    if (tableWrap) {
      listadoContainer = document.createElement('div');
      listadoContainer.id = 'admin-horarios-listado-vista';
      tableWrap.parentNode.insertBefore(listadoContainer, tableWrap);
      listadoContainer.appendChild(tableWrap);

      var msg = document.getElementById('admin-horarios-lista-mensaje');
      if (msg) listadoContainer.appendChild(msg);
    }
  }

  var toolbar = document.getElementById('admin-horarios-toolbar-v2');
  if (!toolbar && listadoContainer) {
    toolbar = document.createElement('div');
    toolbar.id = 'admin-horarios-toolbar-v2';
    toolbar.className = 'admin-horarios-toolbar';
    toolbar.innerHTML = [
      '<div class="admin-horarios-vistas" role="tablist" aria-label="Vista de horarios">',
      '  <button type="button" class="boton boton-secundario" id="admin-horarios-vista-cal" aria-pressed="true">Calendario</button>',
      '  <button type="button" class="boton boton-secundario" id="admin-horarios-vista-list" aria-pressed="false">Listado</button>',
      '</div>'
    ].join('');
    listadoContainer.parentNode.insertBefore(toolbar, listadoContainer);
  }

  var calVista = document.getElementById('admin-horarios-cal-vista');
  if (!calVista && listadoContainer) {
    calVista = document.createElement('div');
    calVista.id = 'admin-horarios-cal-vista';
    calVista.className = 'admin-horarios-cal-layout';
    calVista.innerHTML = [
      '<div class="admin-horarios-cal-card">',
      '  <div class="admin-horarios-cal-header">',
      '    <h3 id="admin-horarios-mes-label"></h3>',
      '    <div id="admin-horarios-cal-nav" class="admin-horarios-cal-actions">',
      '      <button type="button" class="boton boton-secundario boton-pequeno" id="admin-horarios-mes-prev" aria-label="Mes anterior">◀</button>',
      '      <button type="button" class="boton boton-secundario boton-pequeno" id="admin-horarios-hoy">Hoy</button>',
      '      <button type="button" class="boton boton-secundario boton-pequeno" id="admin-horarios-mes-next" aria-label="Mes siguiente">▶</button>',
      '    </div>',
      '  </div>',
      '  <div class="admin-horarios-cal-grid" id="admin-horarios-cal-grid"></div>',
      '</div>',
      '<div class="admin-horarios-agenda-card"><div class="admin-horarios-dia-panel" id="admin-horarios-dia-panel"></div></div>'
    ].join('');
    toolbar.parentNode.insertBefore(calVista, listadoContainer);
  }

  if (estadoCal.fechaSeleccionada && filtrosFecha) {
    filtrosFecha.value = estadoCal.fechaSeleccionada;
  }

  actualizarEstadoBotonCrearHorario();
  actualizarVistaHorariosAdmin(estadoCal.vistaActiva || 'calendario');
}

function actualizarVistaHorariosAdmin(vista) {
  var estadoCal = asegurarEstadoCalendarioHorariosAdmin();
  estadoCal.vistaActiva = vista === 'listado' ? 'listado' : 'calendario';

  var cal = document.getElementById('admin-horarios-cal-vista');
  var list = document.getElementById('admin-horarios-listado-vista');
  var nav = document.getElementById('admin-horarios-cal-nav');
  var btnCal = document.getElementById('admin-horarios-vista-cal');
  var btnList = document.getElementById('admin-horarios-vista-list');

  if (cal) cal.classList.toggle('admin-horarios-oculto', estadoCal.vistaActiva !== 'calendario');
  if (list) list.classList.toggle('admin-horarios-oculto', estadoCal.vistaActiva !== 'listado');
  if (nav) nav.classList.toggle('admin-horarios-oculto', estadoCal.vistaActiva !== 'calendario');

  if (btnCal) btnCal.setAttribute('aria-pressed', estadoCal.vistaActiva === 'calendario' ? 'true' : 'false');
  if (btnList) btnList.setAttribute('aria-pressed', estadoCal.vistaActiva === 'listado' ? 'true' : 'false');

  var campoFecha = document.getElementById('horario-filtro-fecha');
  var btnFiltrar = document.getElementById('horario-filtrar');
  if (campoFecha) {
    var wrapFecha = campoFecha.closest('.admin-form-field') || campoFecha.parentElement;
    if (wrapFecha) wrapFecha.classList.toggle('admin-horarios-oculto', estadoCal.vistaActiva !== 'listado');
  }
  if (btnFiltrar) {
    var wrapBtn = btnFiltrar.closest('.admin-form-field') || btnFiltrar.parentElement;
    if (wrapBtn) wrapBtn.classList.toggle('admin-horarios-oculto', estadoCal.vistaActiva !== 'listado');
  }
}

function recargarCalendarioHorariosAdminManteniendoSeleccion() {
  return cargarSesionesCalendarioHorariosAdmin();
}

function cargarSesionesCalendarioHorariosAdmin() {
  var estadoCal = asegurarEstadoCalendarioHorariosAdmin();
  var idReq = (estadoCal.requestId || 0) + 1;
  estadoCal.requestId = idReq;

  var filtroServicio = document.getElementById('horario-filtro-servicio');
  var filtroEstado = document.getElementById('horario-filtro-estado');

  var query = [];
  var idProducto = filtroServicio ? (filtroServicio.value || '').trim() : '';
  var estado = filtroEstado ? (filtroEstado.value || 'todos').trim() : 'todos';
  if (idProducto) query.push('idProducto=' + encodeURIComponent(idProducto));
  if (estado) query.push('estado=' + encodeURIComponent(estado));

  var url = '/api/admin/schedules-list.ashx' + (query.length ? ('?' + query.join('&')) : '');
  return fetch(url, { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (!resp.ok) throw new Error('No fue posible cargar sesiones del calendario.');
      return resp.json();
    })
    .then(function (data) {
      if (idReq !== estadoCal.requestId) return;
      var horarios = data && Array.isArray(data.horarios) ? data.horarios : [];
      estadoCal.sesionesMes = horarios.map(function (x) { return normalizarHorarioAdmin(x); }).filter(function (x) { return !!x; });
      renderCalendarioHorariosAdmin();
      renderPanelDiaHorariosAdmin();
    })
    .catch(function () {
      if (idReq !== estadoCal.requestId) return;
      estadoCal.sesionesMes = [];
      renderCalendarioHorariosAdmin();
      renderPanelDiaHorariosAdmin();
    });
}

function renderCalendarioHorariosAdmin() {
  var estadoCal = asegurarEstadoCalendarioHorariosAdmin();
  var grid = document.getElementById('admin-horarios-cal-grid');
  var label = document.getElementById('admin-horarios-mes-label');
  if (!grid) return;

  var parts = String(estadoCal.mesBase || '').split('-');
  var year = parseInt(parts[0] || '0', 10);
  var month = parseInt(parts[1] || '0', 10);
  if (!year || !month) {
    var hoy = obtenerHoyCostaRicaIso();
    year = parseInt(hoy.substring(0, 4), 10);
    month = parseInt(hoy.substring(5, 7), 10);
    estadoCal.mesBase = hoy.substring(0, 7);
  }

  var primerDia = new Date(year, month - 1, 1);
  var ultimoDia = new Date(year, month, 0);
  var offset = (primerDia.getDay() + 6) % 7;

  if (label) {
    try {
      var mesTexto = primerDia.toLocaleDateString('es-CR', { month: 'long' });
      var nombreMes = mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1);
      label.textContent = nombreMes + ' de ' + String(year);
    } catch (_) {
      label.textContent = estadoCal.mesBase;
    }
  }

  var porFecha = {};
  (estadoCal.sesionesMes || []).forEach(function (s) {
    if (!s || !s.fecha) return;
    var fecha = String(s.fecha).substring(0, 10);
    if (!porFecha[fecha]) porFecha[fecha] = [];
    porFecha[fecha].push(s);
  });

  var html = [
    '<div class="admin-horarios-cal-weekday">Lun</div>',
    '<div class="admin-horarios-cal-weekday">Mar</div>',
    '<div class="admin-horarios-cal-weekday">Mié</div>',
    '<div class="admin-horarios-cal-weekday">Jue</div>',
    '<div class="admin-horarios-cal-weekday">Vie</div>',
    '<div class="admin-horarios-cal-weekday">Sáb</div>',
    '<div class="admin-horarios-cal-weekday">Dom</div>'
  ];

  for (var i = 0; i < offset; i += 1) {
    html.push('<div></div>');
  }

  var hoy = obtenerHoyCostaRicaIso();
  for (var d = 1; d <= ultimoDia.getDate(); d += 1) {
    var dia = String(d).padStart(2, '0');
    var iso = String(year) + '-' + String(month).padStart(2, '0') + '-' + dia;
    var count = (porFecha[iso] || []).length;
    var selected = estadoCal.fechaSeleccionada === iso ? 'true' : 'false';
    var esHoy = hoy === iso;

    var aria = 'Día ' + String(d);
    if (count > 0) {
      aria += ', ' + String(count) + ' sesión' + (count === 1 ? '' : 'es');
    }
    if (esHoy) aria += ', hoy';
    if (selected === 'true') aria += ', seleccionado';

    html.push(
      '<button type="button" class="admin-horarios-cal-day" data-horario-cal-dia="' + escapeHtml(iso) + '" aria-selected="' + selected + '" data-hoy="' + (esHoy ? '1' : '0') + '" aria-label="' + escapeHtml(aria) + '">' +
      '  <span class="num">' + d + '</span>' +
      (count > 0 ? '  <span class="count"><span class="count-dot" aria-hidden="true"></span>' + count + ' sesión' + (count === 1 ? '' : 'es') + '</span>' : '') +
      (esHoy ? '  <span class="today-dot" aria-hidden="true"></span>' : '') +
      '</button>'
    );
  }

  grid.innerHTML = html.join('');
}

function obtenerSesionesFechaSeleccionadaHorariosAdmin() {
  var estadoCal = asegurarEstadoCalendarioHorariosAdmin();
  var fecha = estadoCal.fechaSeleccionada;
  var sesiones = (estadoCal.sesionesMes || []).filter(function (s) {
    return s && String(s.fecha || '').substring(0, 10) === fecha;
  });

  sesiones.sort(function (a, b) {
    var ha = String(a.horaInicio || '');
    var hb = String(b.horaInicio || '');
    if (ha < hb) return -1;
    if (ha > hb) return 1;
    return 0;
  });

  return sesiones;
}

function renderPanelDiaHorariosAdmin() {
  var panel = document.getElementById('admin-horarios-dia-panel');
  if (!panel) return;

  var estadoCal = asegurarEstadoCalendarioHorariosAdmin();
  var fecha = estadoCal.fechaSeleccionada;
  var sesiones = obtenerSesionesFechaSeleccionadaHorariosAdmin();
  var totalTxt = String(sesiones.length) + ' ' + (sesiones.length === 1 ? 'sesión' : 'sesiones');
  var ariaBtn = 'Agregar horarios para el ' + formatearFechaAccionCRAdmin(fecha);

  var encabezado = [
    '<div class="admin-horarios-dia-head">',
    '  <div><h3>' + escapeHtml(formatearFechaLargaCRAdmin(fecha)) + '</h3><p>' + escapeHtml(totalTxt) + '</p></div>',
    '  <div class="admin-horarios-dia-head-actions">',
    '    <button type="button" class="boton boton-principal" id="admin-horario-crear-desde-panel" data-horario-fecha="' + escapeHtml(fecha) + '" aria-label="' + escapeHtml(ariaBtn) + '">＋ Agregar horarios</button>',
    '  </div>',
    '</div>'
  ].join('');

  if (!sesiones.length) {
    panel.innerHTML = [
      encabezado,
      '<p>No hay sesiones para esta fecha.</p>'
    ].join('');
    return;
  }

  panel.innerHTML = [
    encabezado,
    sesiones.map(function (s) {
      var confirmadas = Number(s.reservasConfirmadas || 0);
      var capacidad = Number(s.capacidadMaxima || 0);
      var cupos = Number(s.cuposRestantes || 0);
      var reservasTxt = String(confirmadas) + ' de ' + String(capacidad) + ' reserva' + (capacidad === 1 ? '' : 's') + ' confirmada' + (capacidad === 1 ? '' : 's');
      var cuposTxt = cupos <= 0 ? 'Completo' : (String(cupos) + ' cupo' + (cupos === 1 ? '' : 's') + ' disponible' + (cupos === 1 ? '' : 's'));
      var estadoAdmin = s.activo ? 'Activo' : 'Inactivo';
      return [
        '<article class="admin-horarios-item">',
        '  <span class="admin-horarios-item-hora">' + escapeHtml(String(s.horaInicio || '')) + ' - ' + escapeHtml(String(s.horaFin || '')) + '</span>',
        '  <h4 class="admin-horarios-item-servicio">' + escapeHtml(s.servicio || '') + '</h4>',
        '  <p class="admin-horarios-item-inst">' + escapeHtml(s.instructor || 'Sin instructor registrado') + '</p>',
        '  <p class="admin-horarios-item-ocupacion">' + escapeHtml(reservasTxt) + ' · ' + escapeHtml(cuposTxt) + '</p>',
        '  <div class="admin-horarios-labels">',
        '    <span class="admin-horarios-estado ' + (s.activo ? '' : 'inactivo') + '">' + escapeHtml(estadoAdmin) + '</span>',
        (cupos <= 0 ? '    <span class="admin-horarios-estado completo">Completo</span>' : ''),
        '  </div>',
        '  <div class="admin-horarios-actions">',
        '    <button type="button" class="boton boton-secundario boton-pequeno" data-horario-cal-editar="' + escapeHtml(String(s.idHorarioServicio || 0)) + '">Editar</button>',
        '    <button type="button" class="boton boton-secundario boton-pequeno admin-horario-toggle-lite" data-horario-cal-toggle="' + escapeHtml(String(s.idHorarioServicio || 0)) + '" data-horario-cal-activo="' + (s.activo ? '1' : '0') + '">' + (s.activo ? 'Desactivar' : 'Activar') + '</button>',
        '  </div>',
        '</article>'
      ].join('');
    }).join('')
  ].join('');
}

function tieneDatosFormularioHorariosAdmin() {
  var form = document.getElementById('admin-horarios-form');
  if (!form) return false;

  var servicio = document.getElementById('horario-servicio');
  if (servicio && (servicio.value || '').trim()) return true;

  var campos = form.querySelectorAll('input, select, textarea');
  for (var i = 0; i < campos.length; i += 1) {
    var c = campos[i];
    if (!c || c.disabled) continue;
    if (c.type === 'hidden' || c.type === 'button' || c.type === 'submit') continue;
    if (c.type === 'radio' || c.type === 'checkbox') continue;
    if ((c.value || '').trim()) {
      if (c.id === 'horario-filtro-fecha' || c.id === 'horario-filtro-servicio' || c.id === 'horario-filtro-estado') continue;
      return true;
    }
  }

  return false;
}

function asegurarEstadoModalCrearHorario() {
  if (!adminSchedulesState.modalCrear) {
    adminSchedulesState.modalCrear = {
      abierto: false,
      focoRetorno: null,
      monitoreandoSubmit: false
    };
  }
  return adminSchedulesState.modalCrear;
}

function actualizarEstadoBotonCrearHorario() {
  var btn = document.getElementById('admin-horarios-crear-toggle');
  var modal = document.getElementById('admin-horarios-crear-modal');
  if (!btn || !modal) return;

  var modalState = asegurarEstadoModalCrearHorario();
  var abierto = !!modalState.abierto && !modal.hidden;
  var conDatos = tieneDatosFormularioHorariosAdmin();

  btn.setAttribute('aria-controls', 'admin-horarios-crear-modal');
  btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  btn.textContent = 'Agregar horarios';
}

function cerrarModalCrearHorarioAdmin() {
  var modal = document.getElementById('admin-horarios-crear-modal');
  if (!modal) return;
  if (adminSchedulesState.enviando) return;

  var st = asegurarEstadoModalCrearHorario();
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  st.abierto = false;

  var foco = st.focoRetorno;
  st.focoRetorno = null;
  actualizarEstadoBotonCrearHorario();

  if (foco && typeof foco.focus === 'function') {
    try { foco.focus(); } catch (_) { }
  }
}

function formatearFechaAccionCRAdmin(fechaIso) {
  if (!fechaIso) return '';
  try {
    var d = new Date(fechaIso + 'T00:00:00');
    return d.toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (_) {
    return fechaIso;
  }
}

function abrirPanelCrearHorarioDesdeFecha(fechaIso, opciones) {
  var modal = document.getElementById('admin-horarios-crear-modal');
  var form = document.getElementById('admin-horarios-form');
  if (!modal || !form) return;

  var st = asegurarEstadoModalCrearHorario();
  st.focoRetorno = document.activeElement;

  var opts = opciones || {};
  var hayBorrador = tieneDatosFormularioHorariosAdmin();
  var campoFecha = document.getElementById('horario-fecha');
  var fechaActualBorrador = campoFecha ? (campoFecha.value || '').trim() : '';

  var alerta = document.getElementById('admin-horario-crear-alerta');
  if (!alerta) {
    alerta = document.createElement('div');
    alerta.id = 'admin-horario-crear-alerta';
    alerta.className = 'mensaje-formulario';
    alerta.style.marginBottom = '8px';
    var body = modal.querySelector('.admin-modal-body');
    if (body) {
      body.insertBefore(alerta, body.firstChild);
    }
  }
  if (alerta) alerta.innerHTML = '';

  if (fechaIso && !hayBorrador && campoFecha) {
    campoFecha.value = fechaIso;
  }

  if (fechaIso && hayBorrador && fechaActualBorrador && fechaActualBorrador !== fechaIso && alerta) {
    var fechaBorradorText = formatearFechaAccionCRAdmin(fechaActualBorrador);
    var fechaNuevaText = formatearFechaAccionCRAdmin(fechaIso);
    alerta.style.color = '#ffd6d6';
    alerta.innerHTML = 'Tenés un borrador para ' + fechaBorradorText + '. Si querés reemplazar la fecha por ' + fechaNuevaText + ', hacelo manualmente sin perder las franjas cargadas.';
  }

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  st.abierto = true;
  actualizarEstadoBotonCrearHorario();

  var primerControl = form.querySelector('input, select, textarea, button');
  if (primerControl && typeof primerControl.focus === 'function') {
    setTimeout(function () {
      try { primerControl.focus(); } catch (_) { }
    }, 0);
  }

  if (opts && opts.desdeCalendario && fechaIso) {
    var filtroFecha = document.getElementById('horario-filtro-fecha');
    if (filtroFecha && !(filtroFecha.value || '').trim()) {
      filtroFecha.value = fechaIso;
    }
  }
}

function monitorearResultadoGuardarHorarioAdmin() {
  var st = asegurarEstadoModalCrearHorario();
  if (st.monitoreandoSubmit) return;
  st.monitoreandoSubmit = true;

  var intentos = 0;
  function revisar() {
    intentos += 1;

    if (adminSchedulesState.enviando) {
      setTimeout(revisar, 120);
      return;
    }

    st.monitoreandoSubmit = false;

    if (!st.abierto) return;

    // Si el formulario quedó limpio después del envío, se asume guardado exitoso.
    if (!tieneDatosFormularioHorariosAdmin()) {
      cerrarModalCrearHorarioAdmin();
      recargarCalendarioHorariosAdminManteniendoSeleccion();
      cargarListadoHorariosAdmin();
      return;
    }

    if (intentos < 2) {
      setTimeout(revisar, 120);
    }
  }

  setTimeout(revisar, 120);
}


function setMensajeHorarioEdicion(texto, esError) {
  var msg = document.getElementById('admin-horario-editar-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setFormularioHorarioEdicionBloqueado(bloqueado) {
  adminSchedulesState.modalEdicion.enviando = !!bloqueado;
  var form = document.getElementById('admin-horario-editar-form');
  if (!form) return;

  var controles = form.querySelectorAll('input, select, textarea, button');
  controles.forEach(function (el) {
    if (el.id === 'admin-horario-editar-id') return;
    el.disabled = !!bloqueado;
  });
}

function obtenerElementosEnfocablesModalHorario() {
  var modal = document.getElementById('admin-horario-editar-modal');
  if (!modal || modal.hidden) return [];

  var selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var todos = modal.querySelectorAll(selector);
  return Array.prototype.filter.call(todos, function (el) {
    return !el.hidden && el.getAttribute('aria-hidden') !== 'true';
  });
}

function manejarTrapFocoModalHorario(e) {
  if (!adminSchedulesState.modalEdicion.abierto || e.key !== 'Tab') return;

  var focusables = obtenerElementosEnfocablesModalHorario();
  if (!focusables.length) return;

  var primero = focusables[0];
  var ultimo = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === primero) {
    e.preventDefault();
    ultimo.focus();
    return;
  }

  if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primero.focus();
  }
}

function cerrarModalHorarioEdicion() {
  if (adminSchedulesState.modalEdicion.enviando) return;

  var modal = document.getElementById('admin-horario-editar-modal');
  if (!modal) return;

  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('admin-modal-open');
  document.removeEventListener('keydown', manejarTrapFocoModalHorario, true);

  adminSchedulesState.modalEdicion.abierto = false;
  adminSchedulesState.modalEdicion.idHorarioServicio = 0;
  setFormularioHorarioEdicionBloqueado(false);
  setMensajeHorarioEdicion('', false);

  var ultimoFoco = adminSchedulesState.modalEdicion.ultimoFoco;
  adminSchedulesState.modalEdicion.ultimoFoco = null;
  if (ultimoFoco && typeof ultimoFoco.focus === 'function') {
    try { ultimoFoco.focus(); } catch (_) { }
  }
}

function abrirModalHorarioEdicion() {
  var modal = document.getElementById('admin-horario-editar-modal');
  if (!modal) return;

  adminSchedulesState.modalEdicion.ultimoFoco = document.activeElement || null;
  setFormularioHorarioEdicionBloqueado(false);
  setMensajeHorarioEdicion('', false);

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('admin-modal-open');
  adminSchedulesState.modalEdicion.abierto = true;

  document.addEventListener('keydown', manejarTrapFocoModalHorario, true);

  var primerControl = document.getElementById('admin-horario-editar-servicio');
  if (primerControl && typeof primerControl.focus === 'function') {
    try { primerControl.focus(); } catch (_) { }
  }
}

function setMensajeReservasLista(texto, esError) {
  var msg = document.getElementById('admin-reservas-lista-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setMensajeAuditoria(texto, esError) {
  var msg = document.getElementById('admin-auditoria-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setMensajeReportes(texto, esError) {
  var msg = document.getElementById('admin-reportes-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function formatearFechaHoraAdmin(valorIso) {
  var valor = String(valorIso || '').trim();
  if (!valor) return '';
  var fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return escapeHtml(valor);
  return escapeHtml(fecha.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + fecha.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }));
}

function obtenerPartesFechaAdmin(valorFecha) {
  var valor = valorFecha;
  if (valor == null) return null;

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return {
      year: valor.getUTCFullYear(),
      month: valor.getUTCMonth() + 1,
      day: valor.getUTCDate()
    };
  }

  valor = String(valor).trim();
  if (!valor) return null;

  var matchDotNet = /^\/Date\((-?\d+)(?:[+-]\d+)?\)\/$/.exec(valor);
  if (matchDotNet) {
    var ticks = parseInt(matchDotNet[1], 10);
    if (!Number.isFinite(ticks)) return null;
    var fechaDotNet = new Date(ticks);
    if (Number.isNaN(fechaDotNet.getTime())) return null;
    return {
      year: fechaDotNet.getUTCFullYear(),
      month: fechaDotNet.getUTCMonth() + 1,
      day: fechaDotNet.getUTCDate()
    };
  }

  var matchIso = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(valor);
  if (matchIso) {
    return {
      year: parseInt(matchIso[1], 10),
      month: parseInt(matchIso[2], 10),
      day: parseInt(matchIso[3], 10)
    };
  }

  var fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return {
    year: fecha.getUTCFullYear(),
    month: fecha.getUTCMonth() + 1,
    day: fecha.getUTCDate()
  };
}

function formatearFechaSoloAdmin(valorFecha) {
  var partes = obtenerPartesFechaAdmin(valorFecha);
  if (!partes) return '';

  var dia = String(partes.day).padStart(2, '0');
  var mes = String(partes.month).padStart(2, '0');
  var anio = String(partes.year).padStart(4, '0');
  return dia + '/' + mes + '/' + anio;
}

function formatearFechaInputAdmin(valorFecha) {
  var partes = obtenerPartesFechaAdmin(valorFecha);
  if (!partes) return '';

  var dia = String(partes.day).padStart(2, '0');
  var mes = String(partes.month).padStart(2, '0');
  var anio = String(partes.year).padStart(4, '0');
  return anio + '-' + mes + '-' + dia;
}

function formatearAccionAuditoriaAdmin(codigoAccion) {
  var codigo = String(codigoAccion || '').trim().toUpperCase();
  if (!codigo) return 'N/D';

  var etiquetas = {
    ACTUALIZAR_SERVICIO: 'Servicio actualizado',
    INACTIVAR_SERVICIO: 'Servicio desactivado',
    CREAR_SERVICIO: 'Servicio creado',
    ACTIVAR_SERVICIO: 'Servicio activado',
    CREAR_PROMOCION: 'Promoción creada',
    ACTUALIZAR_PROMOCION: 'Promoción actualizada',
    LOGIN_EXITOSO: 'Inicio de sesión exitoso',
    LOGIN_FALLIDO: 'Intento de inicio de sesión fallido',
    ACTIVAR_PROMOCION: 'Promoción activada',
    INACTIVAR_PROMOCION: 'Promoción desactivada',
    REGISTRO: 'Registro de cliente',
    ACCESO_DENEGADO: 'Acceso denegado'
  };

  if (etiquetas[codigo]) return etiquetas[codigo];

  var texto = codigo.toLowerCase().replace(/_/g, ' ');
  return texto.replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); });
}

function renderOpcionesAccionAuditoriaAdmin() {
  var select = document.getElementById('admin-auditoria-filtro-accion');
  if (!select) return;

  var valorSeleccionado = String(adminAuditState.filtros.accion || '').trim().toUpperCase();
  var codigos = adminAuditState.accionesDisponibles.slice();

  if (valorSeleccionado && codigos.indexOf(valorSeleccionado) < 0) {
    codigos.push(valorSeleccionado);
  }

  codigos.sort();

  var opciones = ["<option value=''>Todas las acciones</option>"];
  for (var i = 0; i < codigos.length; i += 1) {
    var codigo = codigos[i];
    opciones.push("<option value='" + escapeHtml(codigo) + "'>" + escapeHtml(formatearAccionAuditoriaAdmin(codigo)) + "</option>");
  }

  select.innerHTML = opciones.join('');
  select.value = valorSeleccionado;
}

function actualizarOpcionesAccionAuditoriaAdmin(items) {
  if (!Array.isArray(items) || !items.length) return;

  var actualizado = false;
  for (var i = 0; i < items.length; i += 1) {
    var codigo = String((items[i] && items[i].accion) || '').trim().toUpperCase();
    if (!codigo) continue;
    if (adminAuditState.accionesDisponibles.indexOf(codigo) >= 0) continue;
    adminAuditState.accionesDisponibles.push(codigo);
    actualizado = true;
  }

  if (actualizado) {
    renderOpcionesAccionAuditoriaAdmin();
  }
}

function actualizarPaginacionAuditoriaAdmin(paginacion) {
  adminAuditState.pagina = paginacion && paginacion.pagina ? Number(paginacion.pagina) : 1;
  adminAuditState.totalPaginas = paginacion && paginacion.totalPaginas ? Number(paginacion.totalPaginas) : 1;
  adminAuditState.totalRegistros = paginacion && paginacion.totalRegistros ? Number(paginacion.totalRegistros) : 0;
  adminAuditState.tamanoPagina = paginacion && paginacion.tamanoPagina ? Number(paginacion.tamanoPagina) : adminAuditState.tamanoPagina;

  var info = document.getElementById('admin-auditoria-pagina-info');
  if (info) info.textContent = 'Página ' + adminAuditState.pagina + ' de ' + adminAuditState.totalPaginas;

  var resumen = document.getElementById('admin-auditoria-paginacion-resumen');
  var desde = adminAuditState.totalRegistros > 0 ? (((adminAuditState.pagina - 1) * adminAuditState.tamanoPagina) + 1) : 0;
  var hasta = Math.min(adminAuditState.pagina * adminAuditState.tamanoPagina, adminAuditState.totalRegistros);
  if (resumen) resumen.textContent = 'Mostrando ' + String(desde) + '–' + String(hasta) + ' de ' + String(adminAuditState.totalRegistros);

  var prev = document.getElementById('admin-auditoria-prev');
  var next = document.getElementById('admin-auditoria-next');
  if (prev) prev.disabled = adminAuditState.pagina <= 1;
  if (next) next.disabled = adminAuditState.pagina >= adminAuditState.totalPaginas;
}

function renderBitacoraAuditoriaAdmin(items) {
  var tbody = document.getElementById('admin-auditoria-lista-body');
  if (!tbody) return;

  if (!items || !items.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay eventos de auditoría registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(function (e) {
    var usuario = (e && e.usuario ? String(e.usuario).trim() : '') || 'Sistema';
    var accionCodigo = String((e && e.accion) || '').trim() || 'N/D';
    var accionLabel = formatearAccionAuditoriaAdmin(accionCodigo);
    var modulo = String((e && e.modulo) || '').trim() || 'General';
    var descripcion = String((e && e.descripcion) || '').trim() || 'Sin detalle disponible';

    return [
      '<tr>',
      '<td>', formatearFechaHoraAdmin(e && e.fechaHora), '</td>',
      '<td>', escapeHtml(usuario), '</td>',
      '<td title="', escapeHtml(accionCodigo), '">', escapeHtml(accionLabel), '</td>',
      '<td>', escapeHtml(modulo), '</td>',
      '<td>', escapeHtml(descripcion), '</td>',
      '</tr>'
    ].join('');
  }).join('');
}

function cargarBitacoraAuditoriaAdmin() {
  if (adminAuditState.cargando) return Promise.resolve();

  adminAuditState.cargando = true;
  setMensajeAuditoria('Cargando bitácora de auditoría...', false);

  var params = new URLSearchParams();
  params.set('page', String(adminAuditState.pagina));
  params.set('pageSize', String(adminAuditState.tamanoPagina));

  if (adminAuditState.filtros.usuario) params.set('usuario', adminAuditState.filtros.usuario);
  if (adminAuditState.filtros.accion) params.set('accion', adminAuditState.filtros.accion);
  if (adminAuditState.filtros.fechaDesde) params.set('fechaDesde', adminAuditState.filtros.fechaDesde);
  if (adminAuditState.filtros.fechaHasta) params.set('fechaHasta', adminAuditState.filtros.fechaHasta);

  return fetch('/api/admin/audit-log.ashx?' + params.toString(), { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      return resp.text().then(function (text) {
        if (esRespuestaHtmlDeLogin(resp.headers.get('content-type'), text)) {
          window.location.href = '/login.html';
          return null;
        }

        var data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          throw new Error('Respuesta inválida del servidor.');
        }

        if (!resp.ok || !data.success) {
          throw new Error((data && data.message) || 'No fue posible consultar la bitácora de auditoría.');
        }

        var eventos = Array.isArray(data.eventos) ? data.eventos : [];
        actualizarPaginacionAuditoriaAdmin(data.paginacion || {});
        actualizarOpcionesAccionAuditoriaAdmin(eventos);
        renderBitacoraAuditoriaAdmin(eventos);

        if (data.bitacoraDisponible === false) {
          setMensajeAuditoria(data.message || 'La bitácora no está disponible en este entorno.', true);
        } else {
          setMensajeAuditoria(data.message || 'Bitácora actualizada.', false);
        }
        return data;
      });
    })
    .catch(function (err) {
      var tbody = document.getElementById('admin-auditoria-lista-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="5">No fue posible consultar la bitácora de auditoría.</td></tr>';
      actualizarPaginacionAuditoriaAdmin({ pagina: 1, totalPaginas: 1, totalRegistros: 0, tamanoPagina: adminAuditState.tamanoPagina });
      setMensajeAuditoria((err && err.message) || 'No fue posible consultar la bitácora de auditoría.', true);
      return null;
    })
    .finally(function () {
      adminAuditState.cargando = false;
    });
}

function limpiarFiltrosAuditoriaAdmin() {
  var usuario = document.getElementById('admin-auditoria-filtro-usuario');
  var accion = document.getElementById('admin-auditoria-filtro-accion');
  var desde = document.getElementById('admin-auditoria-filtro-desde');
  var hasta = document.getElementById('admin-auditoria-filtro-hasta');

  if (usuario) usuario.value = '';
  if (accion) accion.value = '';
  if (desde) desde.value = '';
  if (hasta) hasta.value = '';

  adminAuditState.filtros = { usuario: '', accion: '', fechaDesde: '', fechaHasta: '' };
  adminAuditState.pagina = 1;
  renderOpcionesAccionAuditoriaAdmin();
  cargarBitacoraAuditoriaAdmin();
}

function initAuditoriaAdmin() {
  renderOpcionesAccionAuditoriaAdmin();

  var form = document.getElementById('admin-auditoria-filtros-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var usuario = document.getElementById('admin-auditoria-filtro-usuario');
      var accion = document.getElementById('admin-auditoria-filtro-accion');
      var desde = document.getElementById('admin-auditoria-filtro-desde');
      var hasta = document.getElementById('admin-auditoria-filtro-hasta');

      adminAuditState.filtros.usuario = usuario ? (usuario.value || '').trim() : '';
      adminAuditState.filtros.accion = accion ? (accion.value || '').trim().toUpperCase() : '';
      adminAuditState.filtros.fechaDesde = desde ? (desde.value || '').trim() : '';
      adminAuditState.filtros.fechaHasta = hasta ? (hasta.value || '').trim() : '';
      adminAuditState.pagina = 1;

      cargarBitacoraAuditoriaAdmin();
    });
  }

  var limpiar = document.getElementById('admin-auditoria-limpiar');
  if (limpiar) {
    limpiar.addEventListener('click', function () {
      limpiarFiltrosAuditoriaAdmin();
    });
  }

  var prev = document.getElementById('admin-auditoria-prev');
  if (prev) {
    prev.addEventListener('click', function () {
      if (adminAuditState.pagina <= 1) return;
      adminAuditState.pagina -= 1;
      cargarBitacoraAuditoriaAdmin();
    });
  }

  var next = document.getElementById('admin-auditoria-next');
  if (next) {
    next.addEventListener('click', function () {
      if (adminAuditState.pagina >= adminAuditState.totalPaginas) return;
      adminAuditState.pagina += 1;
      cargarBitacoraAuditoriaAdmin();
    });
  }
}

function normalizarReservaAdmin(raw) {
  if (!raw) return null;

  var idOperacionPromocional = raw.idOperacionPromocional != null
    ? raw.idOperacionPromocional
    : raw.IdOperacionPromocional;

  return {
    idReserva: raw.idReserva != null ? raw.idReserva : raw.IdReserva,
    idUsuario: raw.idUsuario != null ? raw.idUsuario : raw.IdUsuario,
    cliente: raw.cliente != null ? raw.cliente : raw.Cliente,
    correo: raw.correo != null ? raw.correo : raw.Correo,
    idHorarioServicio: raw.idHorarioServicio != null ? raw.idHorarioServicio : raw.IdHorarioServicio,
    idProducto: raw.idProducto != null ? raw.idProducto : raw.IdProducto,
    servicio: raw.servicio != null ? raw.servicio : raw.Servicio,
    fecha: raw.fecha != null ? raw.fecha : raw.Fecha,
    horaInicio: raw.horaInicio != null ? raw.horaInicio : raw.HoraInicio,
    horaFin: raw.horaFin != null ? raw.horaFin : raw.HoraFin,
    instructor: raw.instructor != null ? raw.instructor : raw.Instructor,
    estado: raw.estado != null ? raw.estado : raw.Estado,
    idOperacionPromocional: idOperacionPromocional,
    idPromocion: raw.idPromocion != null ? raw.idPromocion : raw.IdPromocion,
    nombrePromocion: raw.nombrePromocion != null ? raw.nombrePromocion : raw.NombrePromocion,
    tipoPromocion: raw.tipoPromocion != null ? raw.tipoPromocion : raw.TipoPromocion,
    porcentajeDescuentoPromocion: Number(raw.porcentajeDescuentoPromocion != null ? raw.porcentajeDescuentoPromocion : raw.PorcentajeDescuentoPromocion || 0),
    tipoReserva: raw.tipoReserva != null ? raw.tipoReserva : raw.TipoReserva
  };
}

function renderResumenReservasAdmin(resumen) {
  var total = document.getElementById('admin-reservas-total');
  var confirmadas = document.getElementById('admin-reservas-confirmadas');
  var pendientes = document.getElementById('admin-reservas-pendientes');
  var canceladas = document.getElementById('admin-reservas-canceladas');

  if (total) total.textContent = String((resumen && resumen.total) || 0);
  if (confirmadas) confirmadas.textContent = String((resumen && resumen.confirmadas) || 0);
  if (pendientes) pendientes.textContent = String((resumen && resumen.pendientes) || 0);
  if (canceladas) canceladas.textContent = String((resumen && resumen.canceladas) || 0);
}

function formatearPorcentajeAdmin(valor) {
  var num = Number(valor || 0);
  if (!Number.isFinite(num) || num <= 0) return '';
  return String(num.toFixed(2)).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + '%';
}

function obtenerPromocionDisplayAdmin(item) {
  if (!item || !item.idOperacionPromocional) {
    return {
      tipoBadge: '<span class="admin-estado-badge">Normal</span>',
      nombre: 'Sin promoción',
      detalle: 'Reserva regular'
    };
  }

  var tipo = String(item.tipoPromocion || '').toUpperCase();
  var nombre = (item.nombrePromocion || '').trim();

  if (tipo === 'DOS_POR_UNO') {
    return {
      tipoBadge: '<span class="admin-estado-badge activo">2x1</span>',
      nombre: nombre || 'Promoción 2x1',
      detalle: '¡Dos clases por el precio de una!'
    };
  }

  if (tipo === 'PORCENTAJE') {
    var porcentaje = formatearPorcentajeAdmin(item.porcentajeDescuentoPromocion);
    return {
      tipoBadge: '<span class="admin-estado-badge activo">Descuento</span>',
      nombre: nombre || 'Promoción por descuento',
      detalle: porcentaje ? (porcentaje + ' de descuento') : 'Descuento aplicado'
    };
  }

  return {
    tipoBadge: '<span class="admin-estado-badge activo">Promoción</span>',
    nombre: nombre || 'Promoción aplicada',
    detalle: 'Beneficio promocional aplicado'
  };
}

function renderListadoReservasAdmin(items) {
  var tbody = document.getElementById('admin-reservas-lista-body');
  if (!tbody) return;

  var lista = Array.isArray(items) ? items : [];
  adminReservationsState.items = lista;

  var pag = resolverPaginacionLocal(lista, adminReservationsState.paginacion.pagina, adminReservationsState.paginacion.pageSize);
  adminReservationsState.paginacion.pagina = pag.meta.pagina;
  adminReservationsState.paginacion.total = pag.meta.total;

  renderControlesPaginacion('admin-reservas-pagination', pag.meta, adminReservationsState.cargando, function () {
    if (adminReservationsState.paginacion.pagina <= 1) return;
    adminReservationsState.paginacion.pagina -= 1;
    renderListadoReservasAdmin(adminReservationsState.items);
  }, function () {
    if (adminReservationsState.paginacion.pagina >= pag.meta.totalPaginas) return;
    adminReservationsState.paginacion.pagina += 1;
    renderListadoReservasAdmin(adminReservationsState.items);
  });

  if (!pag.items.length) {
    tbody.innerHTML = '<tr><td colspan="6">No hay reservas registradas con los filtros actuales.</td></tr>';
    return;
  }

  tbody.innerHTML = pag.items.map(function (raw) {
    var item = normalizarReservaAdmin(raw) || {};
    var estadoRaw = String(item.estado || '').toUpperCase();
    var estadoClass = estadoRaw === 'CONFIRMADA'
      ? 'admin-estado-badge activo'
      : 'admin-estado-badge inactivo';
    var promoInfo = obtenerPromocionDisplayAdmin(item);
    var sesion = [
      escapeHtml(String(item.fecha || '').substring(0, 10)),
      escapeHtml(String(item.horaInicio || '')) + ' - ' + escapeHtml(String(item.horaFin || '')),
      escapeHtml((item.instructor || '').trim() || 'Por definir')
    ].join('<br>');

    var promoResumen = '<br><small class="admin-reserva-promo-nombre">' + escapeHtml(promoInfo.nombre) + '</small><br><small class="admin-reserva-promo-detalle">' + escapeHtml(promoInfo.detalle) + '</small>';

    return [
      '<tr>',
      '<td>#', escapeHtml(String(item.idReserva || 0)), promoResumen, '</td>',
      '<td><strong>', escapeHtml(item.cliente || 'Sin nombre'), '</strong><br><small>', escapeHtml(item.correo || ''), '</small></td>',
      '<td>', escapeHtml(item.servicio || ''), '</td>',
      '<td>', sesion, '</td>',
      '<td>', promoInfo.tipoBadge, '</td>',
      '<td><span class="', estadoClass, '">', escapeHtml(estadoRaw || 'DESCONOCIDO'), '</span></td>',
      '</tr>'
    ].join('');
  }).join('');
}

function renderErrorReservasAdmin() {
  var tbody = document.getElementById('admin-reservas-lista-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6">Error al consultar reservas. Intenta nuevamente.</td></tr>';
  renderControlesPaginacion('admin-reservas-pagination', { pagina: 1, totalPaginas: 1, pageSize: adminReservationsState.paginacion.pageSize, total: 0, desde: 0, hasta: 0 }, false);
}

function cargarListadoReservasAdmin() {
  if (adminReservationsState.cargando) return Promise.resolve();

  adminReservationsState.cargando = true;
  setMensajeReservasLista('Cargando reservas...', false);

  var cliente = document.getElementById('admin-reservas-filtro-cliente');
  var servicio = document.getElementById('admin-reservas-filtro-servicio');
  var fecha = document.getElementById('admin-reservas-filtro-fecha');
  var estado = document.getElementById('admin-reservas-filtro-estado');

  var clienteVal = cliente ? (cliente.value || '').trim() : '';
  var servicioVal = servicio ? (servicio.value || '').trim() : '';
  var fechaVal = fecha ? (fecha.value || '').trim() : '';
  var estadoVal = estado ? (estado.value || '').trim().toUpperCase() : '';

  adminReservationsState.filtros = {
    cliente: clienteVal,
    servicio: servicioVal,
    fecha: fechaVal,
    estado: estadoVal
  };
  adminReservationsState.paginacion.pagina = 1;

  var query = [];
  if (clienteVal) query.push('cliente=' + encodeURIComponent(clienteVal));
  if (servicioVal) query.push('servicio=' + encodeURIComponent(servicioVal));
  if (fechaVal) query.push('fecha=' + encodeURIComponent(fechaVal));
  if (estadoVal) query.push('estado=' + encodeURIComponent(estadoVal));

  var url = '/api/admin/reservations-list.ashx' + (query.length ? ('?' + query.join('&')) : '');

  return fetch(url, { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        setMensajeReservasLista('No tienes permisos para consultar reservas.', true);
        return null;
      }
      if (!resp.ok) throw new Error('No fue posible cargar reservas.');
      return resp.json();
    })
    .then(function (data) {
      if (!data) return;
      if (!data.success) throw new Error(data.message || 'No fue posible cargar reservas.');

      adminReservationsState.items = Array.isArray(data.reservas) ? data.reservas : [];
      renderListadoReservasAdmin(adminReservationsState.items);
      renderResumenReservasAdmin(data.resumen || null);
      setMensajeReservasLista('', false);
    })
    .catch(function (err) {
      adminReservationsState.items = [];
      renderErrorReservasAdmin();
      renderControlesPaginacion('admin-reservas-pagination', { pagina: 1, totalPaginas: 1, pageSize: adminReservationsState.paginacion.pageSize, total: 0, desde: 0, hasta: 0 }, false);
      renderResumenReservasAdmin(null);
      setMensajeReservasLista((err && err.message) || 'No fue posible cargar reservas.', true);
    })
    .finally(function () {
      adminReservationsState.cargando = false;
    });
}

function limpiarFiltrosReservasAdmin() {
  var cliente = document.getElementById('admin-reservas-filtro-cliente');
  var servicio = document.getElementById('admin-reservas-filtro-servicio');
  var fecha = document.getElementById('admin-reservas-filtro-fecha');
  var estado = document.getElementById('admin-reservas-filtro-estado');

  if (cliente) cliente.value = '';
  if (servicio) servicio.value = '';
  if (fecha) fecha.value = '';
  if (estado) estado.value = '';

  adminReservationsState.filtros = {
    cliente: '',
    servicio: '',
    fecha: '',
    estado: ''
  };

  cargarListadoReservasAdmin();
}

function initReservasAdmin() {
  var form = document.getElementById('admin-reservas-filtros-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      cargarListadoReservasAdmin();
    });
  }

  var limpiar = document.getElementById('admin-reservas-limpiar');
  if (limpiar) {
    limpiar.addEventListener('click', function () {
      limpiarFiltrosReservasAdmin();
    });
  }
}

function normalizarHorarioAdmin(raw) {
  if (!raw) return null;
  var capacidad = raw.capacidadMaxima != null ? raw.capacidadMaxima : raw.CapacidadMaxima;
  var confirmadas = raw.reservasConfirmadas != null ? raw.reservasConfirmadas : raw.ReservasConfirmadas;
  var cupos = raw.cuposRestantes != null ? raw.cuposRestantes : raw.CuposRestantes;
  var activo = raw.activo != null ? !!raw.activo : !!raw.Activo;

  return {
    idHorarioServicio: raw.idHorarioServicio != null ? raw.idHorarioServicio : raw.IdHorarioServicio,
    idProducto: raw.idProducto != null ? raw.idProducto : raw.IdProducto,
    servicio: raw.servicio != null ? raw.servicio : raw.Servicio,
    categoria: raw.categoria != null ? raw.categoria : raw.Categoria,
    fecha: raw.fecha != null ? raw.fecha : raw.Fecha,
    horaInicio: raw.horaInicio != null ? raw.horaInicio : raw.HoraInicio,
    horaFin: raw.horaFin != null ? raw.horaFin : raw.HoraFin,
    capacidadMaxima: Number(capacidad || 0),
    reservasConfirmadas: Number(confirmadas || 0),
    cuposRestantes: Number(cupos || 0),
    instructor: raw.instructor != null ? raw.instructor : raw.Instructor,
    activo: activo
  };
}

function obtenerDiaSemanaTexto(fechaISO) {
  var valor = String(fechaISO || '').trim();
  if (!valor) return 'Sin fecha';
  var fecha = new Date(valor + 'T00:00:00');
  if (Number.isNaN(fecha.getTime())) return 'Fecha inválida';
  var dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[fecha.getDay()] || 'Sin fecha';
}

function crearBloqueHorarioHtml(indice, editable) {
  var sufijo = indice === 0 ? '' : ('-' + indice);
  var btnQuitar = indice === 0
    ? ''
    : '<button type="button" class="boton boton-secundario boton-pequeno admin-horario-quitar-bloque" data-bloque-indice="' + indice + '">Quitar bloque</button>';
  var titulo = editable ? ('Horario ' + (indice + 1)) : 'Horario';

  return [
    '<article class="admin-horario-bloque" data-bloque-indice="', indice, '">',
    '<header class="admin-horario-bloque-header">',
    '<h4>', titulo, '</h4>',
    '<div class="admin-form-actions">',
    '<span class="admin-horario-dia" id="horario-dia-semana', sufijo, '">Sin fecha</span>',
    btnQuitar,
    '</div>',
    '</header>',
    '<div class="admin-form-grid">',
    '<div class="admin-form-field">',
    '<label for="horario-fecha', sufijo, '">Fecha</label>',
    '<input id="horario-fecha', sufijo, '" type="date" required>',
    '</div>',
    '<div class="admin-form-field">',
    '<label for="horario-hora-inicio', sufijo, '">Hora de inicio</label>',
    '<input id="horario-hora-inicio', sufijo, '" type="time" required>',
    '</div>',
    '<div class="admin-form-field">',
    '<label for="horario-hora-fin', sufijo, '">Hora de finalización</label>',
    '<input id="horario-hora-fin', sufijo, '" type="time" required>',
    '</div>',
    '<div class="admin-form-field">',
    '<label for="horario-capacidad', sufijo, '">Capacidad máxima</label>',
    '<input id="horario-capacidad', sufijo, '" type="number" min="1" step="1" required value="1">',
    '</div>',
    '<div class="admin-form-field">',
    '<label for="horario-instructor', sufijo, '">Instructor</label>',
    '<input id="horario-instructor', sufijo, '" type="text" maxlength="160" placeholder="Opcional">',
    '</div>',
    '<div class="admin-form-field">',
    '<label for="horario-activo', sufijo, '">Estado</label>',
    '<select id="horario-activo', sufijo, '">',
    '<option value="1">Activo</option>',
    '<option value="0">Inactivo</option>',
    '</select>',
    '</div>',
    '</div>',
    '</article>'
  ].join('');
}

function actualizarDiaSemanaBloque(indice) {
  var sufijo = indice === 0 ? '' : ('-' + indice);
  var inputFecha = document.getElementById('horario-fecha' + sufijo);
  var lbl = document.getElementById('horario-dia-semana' + sufijo);
  if (!inputFecha || !lbl) return;
  lbl.textContent = obtenerDiaSemanaTexto(inputFecha.value);
}

function enlazarEventosBloqueHorario(indice) {
  var sufijo = indice === 0 ? '' : ('-' + indice);
  var inputFecha = document.getElementById('horario-fecha' + sufijo);
  if (inputFecha) {
    inputFecha.addEventListener('change', function () {
      actualizarDiaSemanaBloque(indice);
    });
  }
}

function resetBloquesHorariosAdmin() {
  var wrap = document.getElementById('admin-horarios-bloques');
  if (!wrap) return;

  wrap.innerHTML = crearBloqueHorarioHtml(0, false);
  adminSchedulesState.bloques = [{ indice: 0, idHorarioServicio: 0 }];
  adminSchedulesState.bloqueCounter = 1;
  enlazarEventosBloqueHorario(0);
  actualizarDiaSemanaBloque(0);
}

function agregarBloqueHorarioAdmin() {
  var wrap = document.getElementById('admin-horarios-bloques');
  if (!wrap) return;

  var indice = adminSchedulesState.bloqueCounter;
  adminSchedulesState.bloqueCounter += 1;
  adminSchedulesState.bloques.push({ indice: indice, idHorarioServicio: 0 });

  wrap.insertAdjacentHTML('beforeend', crearBloqueHorarioHtml(indice, true));
  enlazarEventosBloqueHorario(indice);
  actualizarDiaSemanaBloque(indice);
}

function quitarBloqueHorarioAdmin(indice) {
  if (indice === 0) return;
  var wrap = document.getElementById('admin-horarios-bloques');
  if (!wrap) return;
  var bloque = wrap.querySelector('.admin-horario-bloque[data-bloque-indice="' + indice + '"]');
  if (!bloque) return;
  bloque.remove();
  adminSchedulesState.bloques = adminSchedulesState.bloques.filter(function (b) {
    return b.indice !== indice;
  });
}

function limpiarPreviewRecurrenteHorariosAdmin() {
  adminSchedulesState.previewRecurrente = [];
  var total = document.getElementById('horario-rec-total');
  var lista = document.getElementById('horario-rec-fechas');
  if (total) total.textContent = '0 sesiones';
  if (lista) lista.innerHTML = '';
}

function obtenerModoHorariosAdminSeleccionado() {
  var checked = document.querySelector('input[name="horario-modo"]:checked');
  return checked ? String(checked.value || 'INDIVIDUAL').toUpperCase() : 'INDIVIDUAL';
}

function aplicarModoHorariosAdmin(modo) {
  var normalizado = String(modo || 'INDIVIDUAL').toUpperCase();
  adminSchedulesState.modo = normalizado === 'RECURRENTE' ? 'RECURRENTE' : 'INDIVIDUAL';

  var recurrente = document.getElementById('admin-horarios-recurrente');
  var bloques = document.getElementById('admin-horarios-bloques');
  var accionesIndividual = document.getElementById('admin-horarios-acciones-individual');
  var accionesRecurrente = document.getElementById('admin-horarios-acciones-recurrente');
  var idHorario = document.getElementById('horario-id');

  var esRecurrente = adminSchedulesState.modo === 'RECURRENTE';

  if (recurrente) recurrente.hidden = !esRecurrente;
  if (bloques) bloques.hidden = esRecurrente;
  if (accionesIndividual) accionesIndividual.hidden = esRecurrente;
  if (accionesRecurrente) accionesRecurrente.hidden = !esRecurrente;

  if (bloques) {
    var controlesIndividual = bloques.querySelectorAll('input, select, textarea, button');
    controlesIndividual.forEach(function (el) {
      el.disabled = esRecurrente || adminSchedulesState.enviando;
    });
  }

  if (recurrente) {
    var controlesRecurrente = recurrente.querySelectorAll('input, select, textarea, button');
    controlesRecurrente.forEach(function (el) {
      el.disabled = !esRecurrente || adminSchedulesState.enviando;
    });
  }

  if (accionesIndividual) {
    var botonesIndividual = accionesIndividual.querySelectorAll('button');
    botonesIndividual.forEach(function (el) {
      el.disabled = esRecurrente || adminSchedulesState.enviando;
    });
  }

  if (accionesRecurrente) {
    var botonesRecurrente = accionesRecurrente.querySelectorAll('button');
    botonesRecurrente.forEach(function (el) {
      el.disabled = !esRecurrente || adminSchedulesState.enviando;
    });
  }

  if (esRecurrente) {
    if (idHorario) idHorario.value = '0';
    adminSchedulesState.editandoId = 0;
  }
}

function limpiarFormularioHorariosAdmin(preservarMensaje) {
  var form = document.getElementById('admin-horarios-form');
  if (!form) return;

  form.reset();

  var id = document.getElementById('horario-id');
  if (id) id.value = '0';

  resetBloquesHorariosAdmin();
  limpiarPreviewRecurrenteHorariosAdmin();

  adminSchedulesState.editandoId = 0;

  var radioIndividual = document.querySelector('input[name="horario-modo"][value="INDIVIDUAL"]');
  if (radioIndividual) radioIndividual.checked = true;
  aplicarModoHorariosAdmin('INDIVIDUAL');

  var submit = document.getElementById('horario-guardar');
  if (submit) submit.textContent = 'Guardar horarios';

  if (!preservarMensaje) {
    setMensajeHorarios('', false);
  }
}

function poblarServiciosHorariosAdmin(servicios) {
  var selectForm = document.getElementById('horario-servicio');
  var selectFiltro = document.getElementById('horario-filtro-servicio');
  var selectEditar = document.getElementById('admin-horario-editar-servicio');

  var opciones = '<option value="">Selecciona un servicio</option>';
  var opcionesFiltro = '<option value="">Todos los servicios</option>';

  (servicios || []).forEach(function (s) {
    var id = s.idProducto != null ? s.idProducto : s.IdProducto;
    var nombre = s.nombre != null ? s.nombre : s.Nombre;
    if (!id || !nombre) return;

    var option = '<option value="' + escapeHtml(String(id)) + '">' + escapeHtml(String(nombre)) + '</option>';
    opciones += option;
    opcionesFiltro += option;
  });

  if (selectForm) {
    var prev = selectForm.value;
    selectForm.innerHTML = opciones;
    if (prev && selectForm.querySelector('option[value="' + prev + '"]')) {
      selectForm.value = prev;
    }
  }

  if (selectFiltro) {
    var prevFiltro = selectFiltro.value;
    selectFiltro.innerHTML = opcionesFiltro;
    if (prevFiltro && selectFiltro.querySelector('option[value="' + prevFiltro + '"]')) {
      selectFiltro.value = prevFiltro;
    }
  }

  if (selectEditar) {
    var prevEditar = selectEditar.value;
    selectEditar.innerHTML = opciones;
    if (prevEditar && selectEditar.querySelector('option[value="' + prevEditar + '"]')) {
      selectEditar.value = prevEditar;
    }
  }
}

function cargarServiciosHorariosAdmin() {
  if (adminSchedulesState.cargandoServicios) return Promise.resolve();

  adminSchedulesState.cargandoServicios = true;

  return fetch('/api/admin/schedule-services.ashx', { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        setMensajeHorarios('No tienes permisos para administrar horarios.', true);
        return null;
      }
      if (!resp.ok) throw new Error('No fue posible cargar servicios.');
      return resp.json();
    })
    .then(function (data) {
      if (!data || !data.success) throw new Error((data && data.message) || 'No fue posible cargar servicios.');
      adminSchedulesState.csrfToken = data.csrfToken || '';
      adminSchedulesState.servicios = Array.isArray(data.servicios) ? data.servicios : [];
      poblarServiciosHorariosAdmin(adminSchedulesState.servicios);
    })
    .catch(function (err) {
      setMensajeHorarios((err && err.message) || 'No fue posible cargar servicios.', true);
    })
    .finally(function () {
      adminSchedulesState.cargandoServicios = false;
    });
}

function renderListadoHorariosAdmin(items) {
  var tbody = document.getElementById('admin-horarios-lista-body');
  if (!tbody) return;

  var lista = Array.isArray(items) ? items : [];
  adminSchedulesState.listadoActual = lista.map(function (raw) { return normalizarHorarioAdmin(raw); }).filter(function (item) { return !!item; });

  var pag = resolverPaginacionLocal(adminSchedulesState.listadoActual, adminSchedulesState.paginacionListado.pagina, adminSchedulesState.paginacionListado.pageSize);
  adminSchedulesState.paginacionListado.pagina = pag.meta.pagina;
  adminSchedulesState.paginacionListado.total = pag.meta.total;

  renderControlesPaginacion('admin-horarios-listado-pagination', pag.meta, adminSchedulesState.cargandoListado, function () {
    if (adminSchedulesState.paginacionListado.pagina <= 1) return;
    adminSchedulesState.paginacionListado.pagina -= 1;
    renderListadoHorariosAdmin(adminSchedulesState.listadoActual);
  }, function () {
    if (adminSchedulesState.paginacionListado.pagina >= pag.meta.totalPaginas) return;
    adminSchedulesState.paginacionListado.pagina += 1;
    renderListadoHorariosAdmin(adminSchedulesState.listadoActual);
  });

  if (!pag.items.length) {
    tbody.innerHTML = '<tr><td colspan="8">No hay horarios registrados con los filtros actuales.</td></tr>';
    return;
  }

  tbody.innerHTML = pag.items.map(function (raw) {
    var item = normalizarHorarioAdmin(raw) || {};
    var estado = item.activo ? 'Activo' : 'Inactivo';
    var claseEstado = item.activo ? 'admin-estado-badge activo' : 'admin-estado-badge inactivo';
    var horario = escapeHtml(String(item.horaInicio || '')) + ' - ' + escapeHtml(String(item.horaFin || ''));
    var cuposClase = item.cuposRestantes <= 0 ? 'admin-estado-badge inactivo' : 'admin-estado-badge activo';
    var cuposTexto = item.cuposRestantes <= 0 ? 'Completo' : String(item.cuposRestantes);

    return [
      '<tr>',
      '<td>', escapeHtml(item.servicio || ''), '</td>',
      '<td>', escapeHtml(String(item.fecha || '').substring(0, 10)), '</td>',
      '<td>', horario, '</td>',
      '<td>', escapeHtml(String(item.capacidadMaxima != null ? item.capacidadMaxima : '0')), '</td>',
      '<td>', escapeHtml(String(item.reservasConfirmadas != null ? item.reservasConfirmadas : '0')), '</td>',
      '<td><span class="', cuposClase, '">', escapeHtml(cuposTexto), '</span></td>',
      '<td><span class="', claseEstado, '">', estado, '</span></td>',
      '<td>',
      '<div class="admin-form-actions">',
      '<button type="button" class="boton boton-secundario boton-pequeno admin-horario-editar" data-id="', escapeHtml(String(item.idHorarioServicio || '0')), '">Editar</button>',
      '<button type="button" class="boton boton-secundario boton-pequeno admin-horario-toggle" data-id="', escapeHtml(String(item.idHorarioServicio || '0')), '" data-activo="', item.activo ? '1' : '0', '">', item.activo ? 'Desactivar' : 'Activar', '</button>',
      '</div>',
      '</td>',
      '</tr>'
    ].join('');
  }).join('');
}

function cargarListadoHorariosAdmin(opciones) {
  if (adminSchedulesState.cargandoListado) return Promise.resolve({ ok: false, blocked: true });

  var opts = opciones || {};
  adminSchedulesState.cargandoListado = true;
  setMensajeHorariosLista('Cargando horarios...', false);

  var filtroServicio = document.getElementById('horario-filtro-servicio');
  var filtroFecha = document.getElementById('horario-filtro-fecha');
  var filtroEstado = document.getElementById('horario-filtro-estado');

  var query = [];
  var idProducto = filtroServicio ? (filtroServicio.value || '').trim() : '';
  var fecha = filtroFecha ? (filtroFecha.value || '').trim() : '';
  var estado = filtroEstado ? (filtroEstado.value || '').trim() : '';

  if (idProducto) query.push('idProducto=' + encodeURIComponent(idProducto));
  if (!opts.omitirFecha && fecha) query.push('fecha=' + encodeURIComponent(fecha));
  if (estado) query.push('estado=' + encodeURIComponent(estado));

  var url = '/api/admin/schedules-list.ashx' + (query.length ? ('?' + query.join('&')) : '');

  return fetch(url, { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        setMensajeHorariosLista('No tienes permisos para consultar horarios.', true);
        return null;
      }
      if (!resp.ok) throw new Error('No fue posible cargar horarios.');
      return resp.json();
    })
    .then(function (data) {
      if (!data) return { ok: false, cancelled: true };
      if (!data.success) throw new Error(data.message || 'No fue posible cargar horarios.');
      var horarios = Array.isArray(data.horarios) ? data.horarios : [];

      if (!opts.omitirFecha) {
        renderListadoHorariosAdmin(horarios);
      }

      if (typeof opts.onSuccess === 'function') {
        try { opts.onSuccess(horarios); } catch (_) { }
      }

      if (!opts.silencioso) {
        if (opts.exitoMensaje) {
          setMensajeHorariosLista(opts.exitoMensaje, false);
        } else {
          setMensajeHorariosLista('', false);
        }
      }

      return { ok: true, horarios: horarios };
    })
    .catch(function (err) {
      if (!opts.omitirFecha) {
        adminSchedulesState.listadoActual = [];
        renderListadoHorariosAdmin([]);
      }

      var errorTexto = opts.errorCargaMensaje || (err && err.message) || 'No fue posible cargar horarios.';
      if (!opts.silencioso) {
        if (opts.permitirReintento) {
          setMensajeHorariosListaConAccion(errorTexto, true, 'Reintentar carga', function (btn) {
            btn.disabled = true;
            btn.textContent = 'Reintentando...';
            cargarListadoHorariosAdmin({
              exitoMensaje: 'Horario actualizado correctamente.',
              errorCargaMensaje: 'El horario se guardó, pero no se pudo actualizar la lista.',
              permitirReintento: true
            });
          });
        } else {
          setMensajeHorariosLista(errorTexto, true);
        }
      }

      return { ok: false, error: err };
    })
    .finally(function () {
      adminSchedulesState.cargandoListado = false;
    });
}

function setFormularioHorariosBloqueado(bloqueado) {
  adminSchedulesState.enviando = !!bloqueado;
  var ids = ['horario-servicio', 'horario-filtrar', 'horario-filtro-servicio', 'horario-filtro-fecha'];
  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.disabled = !!bloqueado;
  });

  aplicarModoHorariosAdmin(adminSchedulesState.modo || obtenerModoHorariosAdminSeleccionado());
}

function construirFechasRecurrentesHorariosAdmin(fechaInicio, fechaFin, diasSemana) {
  var diasSet = {};
  (diasSemana || []).forEach(function (d) {
    diasSet[String(d)] = true;
  });

  var fechas = [];
  var actual = new Date(fechaInicio.getTime());
  var fin = new Date(fechaFin.getTime());

  while (actual.getTime() <= fin.getTime()) {
    var dow = actual.getDay();
    var dia = dow === 0 ? 7 : dow;
    if (diasSet[String(dia)]) {
      var yyyy = String(actual.getFullYear());
      var mm = String(actual.getMonth() + 1).padStart(2, '0');
      var dd = String(actual.getDate()).padStart(2, '0');
      fechas.push(yyyy + '-' + mm + '-' + dd);
    }
    actual.setDate(actual.getDate() + 1);
  }

  return fechas;
}

function renderPreviewRecurrenteHorariosAdmin(fechas) {
  var lista = document.getElementById('horario-rec-fechas');
  var total = document.getElementById('horario-rec-total');
  if (!lista || !total) return;

  var items = Array.isArray(fechas) ? fechas : [];
  total.textContent = String(items.length) + ' sesiones';

  if (!items.length) {
    lista.innerHTML = '<p class="mensaje-formulario">No hay fechas para la configuración seleccionada.</p>';
    return;
  }

  lista.innerHTML = items.map(function (f) {
    return '<span class="admin-horario-dia">' + escapeHtml(f) + '</span>';
  }).join('');
}

function obtenerPayloadRecurrenteHorariosAdmin(idProducto) {
  var fechaInicioEl = document.getElementById('horario-rec-fecha-inicio');
  var fechaFinEl = document.getElementById('horario-rec-fecha-fin');
  var horaInicioEl = document.getElementById('horario-rec-hora-inicio');
  var horaFinEl = document.getElementById('horario-rec-hora-fin');
  var capacidadEl = document.getElementById('horario-rec-capacidad');
  var instructorEl = document.getElementById('horario-rec-instructor');
  var activoEl = document.getElementById('horario-rec-activo');

  var fechaInicioVal = fechaInicioEl ? (fechaInicioEl.value || '').trim() : '';
  var fechaFinVal = fechaFinEl ? (fechaFinEl.value || '').trim() : '';
  var horaInicioVal = horaInicioEl ? (horaInicioEl.value || '').trim() : '';
  var horaFinVal = horaFinEl ? (horaFinEl.value || '').trim() : '';
  var capacidadVal = capacidadEl ? parseInt((capacidadEl.value || '').trim(), 10) : 0;
  var instructorVal = instructorEl ? (instructorEl.value || '').trim() : '';
  var activoVal = activoEl ? ((activoEl.value || '1').trim() === '1') : true;

  if (!fechaInicioVal) return { ok: false, message: 'Debes seleccionar la fecha de inicio.' };
  if (!fechaFinVal) return { ok: false, message: 'Debes seleccionar la fecha de finalización.' };
  if (!horaInicioVal) return { ok: false, message: 'Debes ingresar la hora de inicio.' };
  if (!horaFinVal) return { ok: false, message: 'Debes ingresar la hora de finalización.' };
  if (!capacidadVal || capacidadVal <= 0) return { ok: false, message: 'La capacidad máxima debe ser mayor que cero.' };

  if (horaFinVal <= horaInicioVal) {
    return { ok: false, message: 'La hora de finalización debe ser posterior a la hora de inicio.' };
  }

  var inicio = new Date(fechaInicioVal + 'T00:00:00');
  var fin = new Date(fechaFinVal + 'T00:00:00');
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || fin.getTime() < inicio.getTime()) {
    return { ok: false, message: 'El rango de fechas de la programación recurrente es inválido.' };
  }

  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fin.getTime() < hoy.getTime()) {
    return { ok: false, message: 'La programación recurrente no puede terminar en fechas ya vencidas.' };
  }

  var checks = document.querySelectorAll('#admin-horarios-recurrente .admin-horarios-dias input[type="checkbox"]:checked');
  var diasSemana = [];
  checks.forEach(function (el) {
    var dia = parseInt(el.value || '0', 10);
    if (dia >= 1 && dia <= 7) diasSemana.push(dia);
  });

  if (!diasSemana.length) {
    return { ok: false, message: 'Debes seleccionar al menos un día de la semana.' };
  }

  var fechas = construirFechasRecurrentesHorariosAdmin(inicio, fin, diasSemana);
  if (!fechas.length) {
    return { ok: false, message: 'No hay fechas coincidentes para los días seleccionados.' };
  }

  adminSchedulesState.previewRecurrente = fechas.slice(0);

  return {
    ok: true,
    modo: 'RECURRENTE',
    payload: {
      modo: 'RECURRENTE',
      idProducto: idProducto,
      fechaInicio: fechaInicioVal,
      fechaFin: fechaFinVal,
      horaInicio: horaInicioVal,
      horaFin: horaFinVal,
      capacidadMaxima: capacidadVal,
      instructor: instructorVal,
      activo: activoVal,
      diasSemana: diasSemana,
      fechasPreview: fechas
    }
  };
}

function obtenerPayloadsHorariosAdmin() {
  var servicio = document.getElementById('horario-servicio');
  var idHorarioGlobal = document.getElementById('horario-id');
  var idProducto = servicio ? parseInt((servicio.value || '').trim(), 10) : 0;

  if (!idProducto) return { ok: false, message: 'Debes seleccionar un servicio.' };

  var modoSeleccionado = obtenerModoHorariosAdminSeleccionado();
  aplicarModoHorariosAdmin(modoSeleccionado);

  if (adminSchedulesState.modo === 'RECURRENTE') {
    return obtenerPayloadRecurrenteHorariosAdmin(idProducto);
  }

  var bloques = adminSchedulesState.bloques || [];
  if (!bloques.length) return { ok: false, message: 'Debes agregar al menos un horario.' };

  var payloads = [];

  for (var i = 0; i < bloques.length; i += 1) {
    var indice = bloques[i].indice;
    var sufijo = indice === 0 ? '' : ('-' + indice);

    var fecha = document.getElementById('horario-fecha' + sufijo);
    var horaInicio = document.getElementById('horario-hora-inicio' + sufijo);
    var horaFin = document.getElementById('horario-hora-fin' + sufijo);
    var capacidad = document.getElementById('horario-capacidad' + sufijo);
    var instructor = document.getElementById('horario-instructor' + sufijo);
    var activo = document.getElementById('horario-activo' + sufijo);

    var fechaVal = fecha ? (fecha.value || '').trim() : '';
    var horaInicioVal = horaInicio ? (horaInicio.value || '').trim() : '';
    var horaFinVal = horaFin ? (horaFin.value || '').trim() : '';
    var capacidadVal = capacidad ? parseInt((capacidad.value || '').trim(), 10) : 0;
    var instructorVal = instructor ? (instructor.value || '').trim() : '';
    var activoVal = activo ? ((activo.value || '1').trim() === '1') : true;

    if (!fechaVal) return { ok: false, message: 'Debes seleccionar la fecha del horario ' + (i + 1) + '.' };
    if (!horaInicioVal) return { ok: false, message: 'Debes ingresar la hora de inicio del horario ' + (i + 1) + '.' };
    if (!horaFinVal) return { ok: false, message: 'Debes ingresar la hora de finalización del horario ' + (i + 1) + '.' };
    if (!capacidadVal || capacidadVal <= 0) return { ok: false, message: 'La capacidad del horario ' + (i + 1) + ' debe ser mayor que cero.' };

    if (horaFinVal <= horaInicioVal) {
      return { ok: false, message: 'La hora final debe ser posterior a la inicial en el horario ' + (i + 1) + '.' };
    }

    var idHorarioServicio = 0;
    if (i === 0 && idHorarioGlobal) {
      idHorarioServicio = parseInt((idHorarioGlobal.value || '0').trim(), 10) || 0;
    }

    payloads.push({
      idHorarioServicio: idHorarioServicio,
      idProducto: idProducto,
      fecha: fechaVal,
      horaInicio: horaInicioVal,
      horaFin: horaFinVal,
      capacidadMaxima: capacidadVal,
      instructor: instructorVal,
      activo: activoVal
    });
  }

  return { ok: true, modo: 'INDIVIDUAL', payloads: payloads };
}

function guardarHorarioPayload(payload) {
  return fetch('/api/admin/schedules-save.ashx', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-CSRF-Token': adminSchedulesState.csrfToken
    },
    body: JSON.stringify(payload)
  })
    .then(function (resp) {
      return resp.json().catch(function () {
        return { success: false, message: 'Respuesta inválida del servidor.' };
      }).then(function (data) {
        return { status: resp.status, data: data };
      });
    });
}

function enviarFormularioHorariosAdmin(e) {
  e.preventDefault();

  if (adminSchedulesState.enviando) return;
  if (!adminSchedulesState.csrfToken) {
    setMensajeHorarios('No se pudo validar la seguridad de la sesión. Recarga la página.', true);
    return;
  }

  var validacion = obtenerPayloadsHorariosAdmin();
  if (!validacion.ok) {
    setMensajeHorarios(validacion.message, true);
    return;
  }

  if (validacion.modo === 'RECURRENTE') {
    setFormularioHorariosBloqueado(true);
    setMensajeHorarios('Guardando programación recurrente...', false);

    guardarHorarioPayload(validacion.payload)
      .then(function (result) {
        var data = result.data || {};

        if (result.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        if (result.status === 403) {
          setMensajeHorarios(data.message || 'No tienes permisos para esta operación.', true);
          return;
        }

        if (!data.success) {
          setMensajeHorarios(data.message || 'No fue posible guardar la programación recurrente.', true);
          return;
        }

        var creadas = data.sesionesCreadas != null ? Number(data.sesionesCreadas) : 0;
        setMensajeHorarios(data.message || ('Programación recurrente guardada. Sesiones creadas: ' + creadas + '.'), false);
        limpiarFormularioHorariosAdmin(true);
        cargarListadoHorariosAdmin();
      })
      .catch(function () {
        setMensajeHorarios('No fue posible guardar la programación recurrente.', true);
      })
      .finally(function () {
        setFormularioHorariosBloqueado(false);
      });

    return;
  }

  var payloads = validacion.payloads || [];
  if (!payloads.length) {
    setMensajeHorarios('No hay horarios para guardar.', true);
    return;
  }

  setFormularioHorariosBloqueado(true);
  setMensajeHorarios('Guardando horarios...', false);

  var indice = 0;
  var guardados = 0;

  function siguiente() {
    if (indice >= payloads.length) {
      setMensajeHorarios('Horarios guardados correctamente (' + guardados + ').', false);
      limpiarFormularioHorariosAdmin(true);
      cargarListadoHorariosAdmin();
      setFormularioHorariosBloqueado(false);
      return;
    }

    guardarHorarioPayload(payloads[indice])
      .then(function (result) {
        var data = result.data || {};

        if (result.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        if (result.status === 403) {
          setMensajeHorarios(data.message || 'No tienes permisos para esta operación.', true);
          setFormularioHorariosBloqueado(false);
          return;
        }

        if (!data.success) {
          setMensajeHorarios('Error en horario ' + (indice + 1) + ': ' + (data.message || 'No fue posible guardar.'), true);
          setFormularioHorariosBloqueado(false);
          return;
        }

        guardados += 1;
        indice += 1;
        siguiente();
      })
      .catch(function () {
        setMensajeHorarios('No fue posible guardar los horarios. Intenta nuevamente.', true);
        setFormularioHorariosBloqueado(false);
      });
  }

  siguiente();
}

function toggleEstadoHorarioAdmin(idHorarioServicio, activoActual) {
  if (!idHorarioServicio || adminSchedulesState.enviando) return;
  if (!adminSchedulesState.csrfToken) {
    setMensajeHorariosLista('No se pudo validar la seguridad de la sesión. Recarga la página.', true);
    return;
  }

  var item = buscarHorarioListadoActual(idHorarioServicio) || {};
  var accion = activoActual ? 'Desactivar horario' : 'Activar horario';
  var servicio = item.servicio || 'Servicio no disponible';
  var fecha = (item.fecha || '').substring(0, 10) || 'Fecha no disponible';
  var hora = (item.horaInicio || '') + ' - ' + (item.horaFin || '');

  abrirConfirmacionEstadoHorarioAdmin({
    titulo: accion,
    mensaje: 'Servicio: ' + servicio + '\nFecha: ' + fecha + '\nHora: ' + hora,
    textoConfirmar: accion,
    onConfirmar: function (btnConfirmar, cerrarConfirmacion) {
      if (adminSchedulesState.enviando) return;

      adminSchedulesState.enviando = true;
      if (btnConfirmar) {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Procesando...';
      }

      var payload = {
        idHorarioServicio: idHorarioServicio,
        activo: !activoActual
      };

      fetch('/api/admin/schedules-toggle.ashx', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-CSRF-Token': adminSchedulesState.csrfToken
        },
        body: JSON.stringify(payload)
      })
        .then(function (resp) {
          return resp.json().catch(function () {
            return { success: false, message: 'Respuesta inválida del servidor.' };
          });
        })
        .then(function (data) {
          if (!data || !data.success) {
            setMensajeHorariosLista((data && data.message) || 'No fue posible actualizar el estado.', true);
            return;
          }

          cerrarConfirmacion();
          setMensajeHorariosLista(data.message || 'Estado actualizado.', false);
          cargarListadoHorariosAdmin().then(function (res) {
            if (res && res.ok) {
              recargarCalendarioHorariosAdminManteniendoSeleccion();
            }
          });
        })
        .catch(function () {
          setMensajeHorariosLista('No fue posible actualizar el estado.', true);
        })
        .finally(function () {
          adminSchedulesState.enviando = false;
          if (btnConfirmar) {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = accion;
          }
        });
    }
  });
}

function abrirConfirmacionEstadoHorarioAdmin(config) {
  var modal = document.getElementById('admin-horario-toggle-confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-horario-toggle-confirm-modal';
    modal.className = 'perfil-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.hidden = true;

    modal.innerHTML = [
      '<div class="perfil-modal">',
      '  <div class="perfil-modal-header">',
      '    <h2 id="admin-horario-toggle-confirm-titulo">Confirmar cambio</h2>',
      '  </div>',
      '  <div id="admin-horario-toggle-confirm-contenido" style="white-space: pre-line;"></div>',
      '  <div class="perfil-modal-actions">',
      '    <button type="button" id="admin-horario-toggle-confirm-accion" class="boton boton-principal"></button>',
      '    <button type="button" id="admin-horario-toggle-confirm-cancelar" class="boton boton-secundario">Volver</button>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);
  }

  var titulo = modal.querySelector('#admin-horario-toggle-confirm-titulo');
  var contenido = modal.querySelector('#admin-horario-toggle-confirm-contenido');
  var btnAccion = modal.querySelector('#admin-horario-toggle-confirm-accion');
  var btnVolver = modal.querySelector('#admin-horario-toggle-confirm-cancelar');

  if (!titulo || !contenido || !btnAccion || !btnVolver) return;

  titulo.textContent = config && config.titulo ? config.titulo : 'Confirmar cambio';
  contenido.textContent = config && config.mensaje ? config.mensaje : '';
  btnAccion.textContent = config && config.textoConfirmar ? config.textoConfirmar : 'Confirmar';

  function cerrar() {
    if (adminSchedulesState.enviando) return;
    modal.hidden = true;
    btnAccion.onclick = null;
    btnVolver.onclick = null;
  }

  btnVolver.onclick = function () {
    cerrar();
  };

  btnAccion.onclick = function () {
    if (typeof config.onConfirmar === 'function') {
      config.onConfirmar(btnAccion, function () {
        modal.hidden = true;
        btnAccion.onclick = null;
        btnVolver.onclick = null;
      });
    }
  };

  modal.hidden = false;
}

function buscarHorarioListadoActual(idHorarioServicio) {
  var idBuscado = Number(idHorarioServicio || 0);
  if (!Number.isFinite(idBuscado) || idBuscado <= 0) return null;

  var items = adminSchedulesState.listadoActual || [];
  for (var i = 0; i < items.length; i += 1) {
    var item = items[i];
    if (!item) continue;
    if (Number(item.idHorarioServicio || 0) === idBuscado) {
      return item;
    }
  }

  return null;
}

function abrirModalEdicionHorarioDesdeListado(idHorarioServicio) {
  var item = buscarHorarioListadoActual(idHorarioServicio);
  if (!item) {
    setMensajeHorariosLista('No se encontró el horario seleccionado para edición.', true);
    return;
  }

  var idInput = document.getElementById('admin-horario-editar-id');
  var selectServicio = document.getElementById('admin-horario-editar-servicio');
  var fechaInput = document.getElementById('admin-horario-editar-fecha');
  var iniInput = document.getElementById('admin-horario-editar-hora-inicio');
  var finInput = document.getElementById('admin-horario-editar-hora-fin');
  var capInput = document.getElementById('admin-horario-editar-capacidad');
  var instructorInput = document.getElementById('admin-horario-editar-instructor');
  var estadoInput = document.getElementById('admin-horario-editar-activo');

  if (idInput) idInput.value = String(item.idHorarioServicio || 0);
  if (selectServicio) selectServicio.value = String(item.idProducto || '');
  if (fechaInput) fechaInput.value = String(item.fecha || '').substring(0, 10);
  if (iniInput) iniInput.value = String(item.horaInicio || '').substring(0, 5);
  if (finInput) finInput.value = String(item.horaFin || '').substring(0, 5);
  if (capInput) capInput.value = String(Number(item.capacidadMaxima || 0));
  if (instructorInput) instructorInput.value = String(item.instructor || '');
  if (estadoInput) estadoInput.value = item.activo ? '1' : '0';

  adminSchedulesState.modalEdicion.idHorarioServicio = Number(item.idHorarioServicio || 0);
  setMensajeHorarioEdicion('', false);
  abrirModalHorarioEdicion();
}

function obtenerPayloadEdicionHorarioAdmin() {
  var idInput = document.getElementById('admin-horario-editar-id');
  var selectServicio = document.getElementById('admin-horario-editar-servicio');
  var fechaInput = document.getElementById('admin-horario-editar-fecha');
  var iniInput = document.getElementById('admin-horario-editar-hora-inicio');
  var finInput = document.getElementById('admin-horario-editar-hora-fin');
  var capInput = document.getElementById('admin-horario-editar-capacidad');
  var instructorInput = document.getElementById('admin-horario-editar-instructor');
  var estadoInput = document.getElementById('admin-horario-editar-activo');

  var idHorarioServicio = idInput ? parseInt((idInput.value || '0').trim(), 10) : 0;
  var idProducto = selectServicio ? parseInt((selectServicio.value || '0').trim(), 10) : 0;
  var fecha = fechaInput ? (fechaInput.value || '').trim() : '';
  var horaInicio = iniInput ? (iniInput.value || '').trim() : '';
  var horaFin = finInput ? (finInput.value || '').trim() : '';
  var capacidadMaxima = capInput ? parseInt((capInput.value || '').trim(), 10) : 0;
  var instructor = instructorInput ? (instructorInput.value || '').trim() : '';
  var activo = estadoInput ? ((estadoInput.value || '1').trim() === '1') : true;

  if (!idHorarioServicio || idHorarioServicio <= 0) {
    return { ok: false, message: 'No se identificó el horario que se desea actualizar.' };
  }

  if (!idProducto || idProducto <= 0) {
    return { ok: false, message: 'Debes seleccionar un servicio válido.' };
  }

  if (!fecha) {
    return { ok: false, message: 'Debes seleccionar la fecha del horario.' };
  }

  if (!horaInicio) {
    return { ok: false, message: 'Debes ingresar la hora de inicio.' };
  }

  if (!horaFin) {
    return { ok: false, message: 'Debes ingresar la hora de finalización.' };
  }

  if (!capacidadMaxima || capacidadMaxima <= 0) {
    return { ok: false, message: 'La capacidad máxima debe ser mayor que cero.' };
  }

  if (horaFin <= horaInicio) {
    return { ok: false, message: 'La hora final debe ser posterior a la hora inicial.' };
  }

  return {
    ok: true,
    payload: {
      idHorarioServicio: idHorarioServicio,
      idProducto: idProducto,
      fecha: fecha,
      horaInicio: horaInicio,
      horaFin: horaFin,
      capacidadMaxima: capacidadMaxima,
      instructor: instructor,
      activo: activo
    }
  };
}

function guardarEdicionHorarioAdmin(e) {
  e.preventDefault();

  if (adminSchedulesState.modalEdicion.enviando) return;
  if (!adminSchedulesState.csrfToken) {
    setMensajeHorarioEdicion('No se pudo validar la seguridad de la sesión. Recarga la página.', true);
    return;
  }

  var validacion = obtenerPayloadEdicionHorarioAdmin();
  if (!validacion.ok) {
    setMensajeHorarioEdicion(validacion.message, true);
    return;
  }

  setFormularioHorarioEdicionBloqueado(true);
  setMensajeHorarioEdicion('Guardando cambios...', false);

  guardarHorarioPayload(validacion.payload)
    .then(function (result) {
      var data = result.data || {};

      if (result.status === 401) {
        window.location.href = '/login.html';
        return;
      }

      if (result.status === 403) {
        setMensajeHorarioEdicion(data.message || 'No tienes permisos para esta operación.', true);
        return;
      }

      if (!data.success) {
        setMensajeHorarioEdicion(data.message || 'No fue posible actualizar el horario.', true);
        return;
      }

      // Importante: liberar bloqueo antes de cerrar modal al éxito.
      setFormularioHorarioEdicionBloqueado(false);
      cerrarModalHorarioEdicion();

      cargarListadoHorariosAdmin({
        exitoMensaje: 'Horario actualizado correctamente.',
        errorCargaMensaje: 'El horario se guardó, pero no se pudo actualizar la lista.',
        permitirReintento: true
      }).then(function (res) {
        if (res && res.ok) {
          recargarCalendarioHorariosAdminManteniendoSeleccion();
        }
      });
    })
    .catch(function () {
      setMensajeHorarioEdicion('No fue posible actualizar el horario.', true);
    })
    .finally(function () {
      if (adminSchedulesState.modalEdicion.abierto) {
        setFormularioHorarioEdicionBloqueado(false);
      }
    });
}

function initHorariosAdmin() {
  var estadoCal = asegurarEstadoCalendarioHorariosAdmin();

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;

    if (adminSchedulesState.modalEdicion && adminSchedulesState.modalEdicion.abierto) {
      e.preventDefault();
      cerrarModalHorarioEdicion();
      return;
    }

    var stCrear = asegurarEstadoModalCrearHorario();
    if (stCrear.abierto) {
      e.preventDefault();
      cerrarModalCrearHorarioAdmin();
    }
  });

  construirLayoutHorariosAdmin();

  var form = document.getElementById('admin-horarios-form');
  if (form) {
    form.addEventListener('submit', function (ev) {
      enviarFormularioHorariosAdmin(ev);
      monitorearResultadoGuardarHorarioAdmin();
    });
    form.addEventListener('input', function () {
      actualizarEstadoBotonCrearHorario();
    });
    form.addEventListener('change', function () {
      actualizarEstadoBotonCrearHorario();
    });
  }

  var radiosModo = document.querySelectorAll('input[name="horario-modo"]');
  radiosModo.forEach(function (radio) {
    radio.addEventListener('change', function () {
      aplicarModoHorariosAdmin(radio.value || 'INDIVIDUAL');
      if (adminSchedulesState.modo === 'RECURRENTE') {
        limpiarPreviewRecurrenteHorariosAdmin();
      }
    });
  });

  function manejarPreviewRecurrente() {
    var servicio = document.getElementById('horario-servicio');
    var idProducto = servicio ? parseInt((servicio.value || '').trim(), 10) : 0;
    if (!idProducto) {
      setMensajeHorarios('Debes seleccionar un servicio antes de generar la vista previa.', true);
      return;
    }

    var validacion = obtenerPayloadRecurrenteHorariosAdmin(idProducto);
    if (!validacion.ok) {
      setMensajeHorarios(validacion.message, true);
      renderPreviewRecurrenteHorariosAdmin([]);
      return;
    }

    renderPreviewRecurrenteHorariosAdmin(validacion.payload.fechasPreview || []);
    setMensajeHorarios('Vista previa generada. Revisa las fechas antes de guardar.', false);
  }

  var btnPreview = document.getElementById('horario-rec-preview');
  if (btnPreview) {
    btnPreview.addEventListener('click', manejarPreviewRecurrente);
  }

  var btnPreviewAccion = document.getElementById('horario-rec-preview-accion');
  if (btnPreviewAccion) {
    btnPreviewAccion.addEventListener('click', manejarPreviewRecurrente);
  }

  var btnAgregar = document.getElementById('horario-agregar-bloque');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', function () {
      agregarBloqueHorarioAdmin();
    });
  }

  var btnLimpiar = document.getElementById('horario-limpiar');
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', function () {
      limpiarFormularioHorariosAdmin();
      actualizarEstadoBotonCrearHorario();
    });
  }

  var btnLimpiarRec = document.getElementById('horario-limpiar-recurrente');
  if (btnLimpiarRec) {
    btnLimpiarRec.addEventListener('click', function () {
      limpiarFormularioHorariosAdmin();
      var radioRec = document.querySelector('input[name="horario-modo"][value="RECURRENTE"]');
      if (radioRec) radioRec.checked = true;
      aplicarModoHorariosAdmin('RECURRENTE');
      actualizarEstadoBotonCrearHorario();
    });
  }

  var btnFiltrar = document.getElementById('horario-filtrar');
  if (btnFiltrar) {
    btnFiltrar.addEventListener('click', function () {
      adminSchedulesState.paginacionListado.pagina = 1;
      cargarListadoHorariosAdmin();
      cargarSesionesCalendarioHorariosAdmin();
    });
  }

  var filtroServicio = document.getElementById('horario-filtro-servicio');
  var filtroEstado = document.getElementById('horario-filtro-estado');
  [filtroServicio, filtroEstado].forEach(function (ctrl) {
    if (!ctrl) return;
    ctrl.addEventListener('change', function () {
      var c = asegurarEstadoCalendarioHorariosAdmin();
      if (c.vistaActiva === 'calendario') {
        cargarSesionesCalendarioHorariosAdmin();
      }
    });
  });

  var bloquesWrap = document.getElementById('admin-horarios-bloques');
  if (bloquesWrap) {
    bloquesWrap.addEventListener('click', function (e) {
      var btnQuitar = e.target.closest('.admin-horario-quitar-bloque');
      if (!btnQuitar) return;
      var indice = parseInt(btnQuitar.getAttribute('data-bloque-indice') || '-1', 10);
      if (indice >= 0) {
        quitarBloqueHorarioAdmin(indice);
      }
    });
  }

  var tbody = document.getElementById('admin-horarios-lista-body');
  if (tbody) {
    tbody.addEventListener('click', function (e) {
      var btnEditar = e.target.closest('.admin-horario-editar');
      if (btnEditar) {
        var idEditar = parseInt(btnEditar.getAttribute('data-id') || '0', 10);
        if (idEditar > 0) {
          abrirModalEdicionHorarioDesdeListado(idEditar);
        }
        return;
      }

      var btnToggle = e.target.closest('.admin-horario-toggle');
      if (btnToggle) {
        var idToggle = parseInt(btnToggle.getAttribute('data-id') || '0', 10);
        var activo = (btnToggle.getAttribute('data-activo') || '0') === '1';
        toggleEstadoHorarioAdmin(idToggle, activo);
      }
    });
  }

  var modal = document.getElementById('admin-horario-editar-modal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        cerrarModalHorarioEdicion();
      }
    });
  }

  var formEditar = document.getElementById('admin-horario-editar-form');
  if (formEditar) {
    formEditar.addEventListener('submit', guardarEdicionHorarioAdmin);
  }

  var btnCerrarModal = document.getElementById('admin-horario-editar-cerrar');
  if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', function () {
      cerrarModalHorarioEdicion();
    });
  }

  var btnCancelarModal = document.getElementById('admin-horario-editar-cancelar');
  if (btnCancelarModal) {
    btnCancelarModal.addEventListener('click', function () {
      cerrarModalHorarioEdicion();
    });
  }

  var btnVistaCal = document.getElementById('admin-horarios-vista-cal');
  var btnVistaList = document.getElementById('admin-horarios-vista-list');
  if (btnVistaCal) {
    btnVistaCal.addEventListener('click', function () {
      actualizarVistaHorariosAdmin('calendario');
    });
  }
  if (btnVistaList) {
    btnVistaList.addEventListener('click', function () {
      actualizarVistaHorariosAdmin('listado');
    });
  }

  var modalCrear = document.getElementById('admin-horarios-crear-modal');
  if (modalCrear) {
    modalCrear.addEventListener('click', function (e) {
      var target = e.target;
      if (!target) return;
      if (target.getAttribute('data-admin-horario-crear-cerrar') === '1') {
        cerrarModalCrearHorarioAdmin();
      }
    });
  }

  var btnCerrarCrear = document.getElementById('admin-horario-crear-cerrar');
  if (btnCerrarCrear) {
    btnCerrarCrear.addEventListener('click', function () {
      cerrarModalCrearHorarioAdmin();
    });
  }

  var btnMesPrev = document.getElementById('admin-horarios-mes-prev');
  var btnMesNext = document.getElementById('admin-horarios-mes-next');
  var btnHoy = document.getElementById('admin-horarios-hoy');

  if (btnMesPrev) {
    btnMesPrev.addEventListener('click', function () {
      var c = asegurarEstadoCalendarioHorariosAdmin();
      var parts = (c.mesBase || obtenerHoyCostaRicaIso().substring(0, 7)).split('-');
      var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 2, 1);
      c.mesBase = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      renderCalendarioHorariosAdmin();
    });
  }

  if (btnMesNext) {
    btnMesNext.addEventListener('click', function () {
      var c = asegurarEstadoCalendarioHorariosAdmin();
      var parts = (c.mesBase || obtenerHoyCostaRicaIso().substring(0, 7)).split('-');
      var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), 1);
      c.mesBase = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      renderCalendarioHorariosAdmin();
    });
  }

  if (btnHoy) {
    btnHoy.addEventListener('click', function () {
      var c = asegurarEstadoCalendarioHorariosAdmin();
      c.fechaSeleccionada = obtenerHoyCostaRicaIso();
      c.mesBase = c.fechaSeleccionada.substring(0, 7);

      var filtroFecha = document.getElementById('horario-filtro-fecha');
      if (filtroFecha) filtroFecha.value = c.fechaSeleccionada;

      renderCalendarioHorariosAdmin();
      renderPanelDiaHorariosAdmin();
    });
  }

  var gridCal = document.getElementById('admin-horarios-cal-grid');
  if (gridCal) {
    gridCal.addEventListener('click', function (e) {
      var btnDia = e.target.closest('[data-horario-cal-dia]');
      if (!btnDia) return;
      var iso = btnDia.getAttribute('data-horario-cal-dia');
      if (!iso) return;
      var c = asegurarEstadoCalendarioHorariosAdmin();
      c.fechaSeleccionada = iso;
      c.mesBase = iso.substring(0, 7);

      var filtroFecha = document.getElementById('horario-filtro-fecha');
      if (filtroFecha) filtroFecha.value = iso;

      renderCalendarioHorariosAdmin();
      renderPanelDiaHorariosAdmin();
    });

    gridCal.addEventListener('keydown', function (e) {
      var control = e.target.closest('[data-horario-cal-dia]');
      if (!control) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      control.click();
    });
  }

  var panelDia = document.getElementById('admin-horarios-dia-panel');
  if (panelDia) {
    panelDia.addEventListener('click', function (e) {
      var btnCrearPanel = e.target.closest('#admin-horario-crear-desde-panel');
      if (btnCrearPanel) {
        var fechaCrear = btnCrearPanel.getAttribute('data-horario-fecha') || asegurarEstadoCalendarioHorariosAdmin().fechaSeleccionada;
        abrirPanelCrearHorarioDesdeFecha(fechaCrear, { desdeCalendario: true });
        return;
      }

      var btnEditar = e.target.closest('[data-horario-cal-editar]');
      if (btnEditar) {
        var idEdit = parseInt(btnEditar.getAttribute('data-horario-cal-editar') || '0', 10);
        if (idEdit > 0) abrirModalEdicionHorarioDesdeListado(idEdit);
        return;
      }

      var btnToggle = e.target.closest('[data-horario-cal-toggle]');
      if (btnToggle) {
        var idT = parseInt(btnToggle.getAttribute('data-horario-cal-toggle') || '0', 10);
        var act = (btnToggle.getAttribute('data-horario-cal-activo') || '0') === '1';
        if (idT > 0) toggleEstadoHorarioAdmin(idT, act);
      }
    });
  }

  limpiarFormularioHorariosAdmin();

  estadoCal.fechaSeleccionada = estadoCal.fechaSeleccionada || obtenerHoyCostaRicaIso();
  estadoCal.mesBase = estadoCal.mesBase || estadoCal.fechaSeleccionada.substring(0, 7);

  var filtroFecha = document.getElementById('horario-filtro-fecha');
  if (filtroFecha && !filtroFecha.value) filtroFecha.value = estadoCal.fechaSeleccionada;

  cargarListadoHorariosAdmin();
  cargarSesionesCalendarioHorariosAdmin();
  actualizarVistaHorariosAdmin('calendario');
}

function formatearPrecioServicioVistaPrevia(valor) {
  var numero = Number(String(valor == null ? '' : valor).replace(',', '.'));
  if (!Number.isFinite(numero) || numero < 0) numero = 0;
  try {
    return numero.toLocaleString('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 2 });
  } catch (_) {
    return '₡' + String(numero.toFixed(2));
  }
}

function actualizarVistaPreviaServicioCrear() {
  var nombre = document.getElementById('servicio-nombre');
  var categoria = document.getElementById('servicio-categoria');
  var descripcion = document.getElementById('servicio-descripcion');
  var precio = document.getElementById('servicio-precio');

  var nombreOut = document.getElementById('servicio-vista-previa-nombre');
  var categoriaOut = document.getElementById('servicio-vista-previa-categoria');
  var precioOut = document.getElementById('servicio-vista-previa-precio');
  var descripcionOut = document.getElementById('servicio-vista-previa-descripcion');

  var nombreTxt = nombre ? (nombre.value || '').trim() : '';
  var categoriaTxt = '';
  if (categoria && categoria.options && categoria.selectedIndex >= 0) {
    categoriaTxt = (categoria.options[categoria.selectedIndex].textContent || '').trim();
    if ((categoria.value || '').trim() === '') categoriaTxt = '';
  }
  var descripcionTxt = descripcion ? (descripcion.value || '').trim() : '';
  var precioTxt = precio ? (precio.value || '').trim() : '';

  if (nombreOut) nombreOut.textContent = nombreTxt || 'Nombre del servicio';
  if (categoriaOut) categoriaOut.textContent = 'Categoría: ' + (categoriaTxt || '-');
  if (precioOut) precioOut.textContent = formatearPrecioServicioVistaPrevia(precioTxt);
  if (descripcionOut) descripcionOut.textContent = descripcionTxt || 'Descripción del servicio.';
}

function limpiarPreviewImagenServicio() {
  if (adminServicesState.previewUrl) {
    try {
      URL.revokeObjectURL(adminServicesState.previewUrl);
    } catch (_) { }
  }

  adminServicesState.previewUrl = '';
  adminServicesState.imagenSeleccionada = null;

  var input = document.getElementById('servicio-imagen-input');
  if (input) {
    input.value = '';
  }

  var previewImg = document.getElementById('servicio-imagen-preview-img');
  var sinImagen = document.getElementById('servicio-vista-previa-sin-imagen');
  var btnQuitar = document.getElementById('servicio-imagen-quitar');

  if (previewImg) {
    previewImg.removeAttribute('src');
    previewImg.hidden = true;
  }
  if (sinImagen) sinImagen.hidden = false;
  if (btnQuitar) btnQuitar.hidden = true;
  actualizarVistaPreviaServicioCrear();
}

function poblarCategoriasServicioEdicion(categorias) {
  var select = document.getElementById('editar-servicio-categoria');
  if (!select) return;

  var valorActual = select.value;
  select.innerHTML = '';

  var opcionVacia = document.createElement('option');
  opcionVacia.value = '';
  opcionVacia.textContent = 'Selecciona una categoría';
  select.appendChild(opcionVacia);

  (categorias || []).forEach(function (cat) {
    var id = cat && (cat.IdCategoria != null ? cat.IdCategoria : cat.idCategoria);
    var nombre = cat && (cat.Nombre != null ? cat.Nombre : cat.nombre);
    if (!id || !nombre) return;
    var opt = document.createElement('option');
    opt.value = String(id);
    opt.textContent = String(nombre);
    select.appendChild(opt);
  });

  if (valorActual && select.querySelector('option[value="' + valorActual + '"]')) {
    select.value = valorActual;
  }
}

function obtenerExtensionArchivo(nombreArchivo) {
  var nombre = String(nombreArchivo || '').trim().toLowerCase();
  var idx = nombre.lastIndexOf('.');
  if (idx < 0) return '';
  return nombre.substring(idx);
}

function validarArchivoImagenServicio(file) {
  if (!file) return { ok: true };

  var tipo = String(file.type || '').toLowerCase();
  var ext = obtenerExtensionArchivo(file.name);

  if (!ADMIN_SERVICIO_IMAGEN_EXTS.includes(ext)) {
    return { ok: false, message: 'Formato de imagen no permitido. Usa JPG, PNG o WebP.' };
  }

  if (tipo && !ADMIN_SERVICIO_IMAGEN_TIPOS.includes(tipo)) {
    return { ok: false, message: 'El tipo de archivo no corresponde a una imagen válida (JPG, PNG o WebP).' };
  }

  if (!file.size || file.size <= 0) {
    return { ok: false, message: 'La imagen seleccionada está vacía.' };
  }

  if (file.size > ADMIN_SERVICIO_IMAGEN_MAX_BYTES) {
    return { ok: false, message: 'La imagen supera el límite de 5 MB.' };
  }

  return { ok: true };
}

function mostrarPreviewImagenServicio(file) {
  var previewImg = document.getElementById('servicio-imagen-preview-img');
  var sinImagen = document.getElementById('servicio-vista-previa-sin-imagen');
  var btnQuitar = document.getElementById('servicio-imagen-quitar');

  if (!previewImg) return;

  if (adminServicesState.previewUrl) {
    try {
      URL.revokeObjectURL(adminServicesState.previewUrl);
    } catch (_) { }
    adminServicesState.previewUrl = '';
  }

  var url = URL.createObjectURL(file);
  adminServicesState.previewUrl = url;
  previewImg.src = url;
  previewImg.hidden = false;
  if (sinImagen) sinImagen.hidden = true;
  if (btnQuitar) btnQuitar.hidden = false;
}

function onSeleccionImagenServicio(e) {
  var input = e && e.target ? e.target : null;
  if (!input || !input.files || !input.files.length) {
    limpiarPreviewImagenServicio();
    return;
  }

  var file = input.files[0];
  var validacion = validarArchivoImagenServicio(file);
  if (!validacion.ok) {
    limpiarPreviewImagenServicio();
    setMensajeServicios(validacion.message, true);
    return;
  }

  adminServicesState.imagenSeleccionada = file;
  mostrarPreviewImagenServicio(file);
  actualizarVistaPreviaServicioCrear();
  setMensajeServicios('', false);
}

function obtenerPayloadServicio() {
  var nombreEl = document.getElementById('servicio-nombre');
  var categoriaEl = document.getElementById('servicio-categoria');
  var descripcionEl = document.getElementById('servicio-descripcion');
  var precioEl = document.getElementById('servicio-precio');
  var estadoEl = document.getElementById('servicio-estado');
  var ordenEl = document.getElementById('servicio-orden');

  var nombre = nombreEl ? (nombreEl.value || '').trim() : '';
  var descripcion = descripcionEl ? (descripcionEl.value || '').trim() : '';
  var categoriaValue = categoriaEl ? (categoriaEl.value || '').trim() : '';
  var precioValue = precioEl ? (precioEl.value || '').trim() : '';
  var estadoValue = estadoEl ? (estadoEl.value || '').trim() : '1';
  var ordenValue = ordenEl ? (ordenEl.value || '').trim() : '0';

  if (!nombre) return { ok: false, message: 'El nombre del servicio es obligatorio.' };
  if (nombre.length > 150) return { ok: false, message: 'El nombre del servicio no puede superar 150 caracteres.' };

  if (!categoriaValue) return { ok: false, message: 'Debes seleccionar una categoría.' };
  var idCategoria = parseInt(categoriaValue, 10);
  if (!idCategoria || idCategoria <= 0) return { ok: false, message: 'La categoría seleccionada no es válida.' };

  if (!descripcion) return { ok: false, message: 'La descripción del servicio es obligatoria.' };
  if (descripcion.length > 1000) return { ok: false, message: 'La descripción no puede superar 1000 caracteres.' };

  if (!precioValue) return { ok: false, message: 'El precio es obligatorio.' };
  var precioNormalizado = precioValue.replace(',', '.');
  var precio = Number(precioNormalizado);
  if (!Number.isFinite(precio) || precio < 0) {
    return { ok: false, message: 'El precio debe ser un número válido y no negativo.' };
  }

  if (!/^[-]?\d+$/.test(ordenValue)) {
    return { ok: false, message: 'El orden de visualización debe ser un número entero.' };
  }
  var ordenCatalogo = parseInt(ordenValue, 10);
  if (ordenCatalogo < 0) {
    return { ok: false, message: 'El orden de visualización no puede ser negativo.' };
  }

  var activo = estadoValue === '1';

  return {
    ok: true,
    payload: {
      nombre: nombre,
      idCategoria: idCategoria,
      descripcion: descripcion,
      precio: precio,
      activo: activo,
      ordenCatalogo: ordenCatalogo
    }
  };
}

function poblarCategoriasServicio(categorias) {
  var select = document.getElementById('servicio-categoria');
  if (!select) return;

  var valorActual = select.value;
  select.innerHTML = '';

  var opcionVacia = document.createElement('option');
  opcionVacia.value = '';
  opcionVacia.textContent = 'Selecciona una categoría';
  select.appendChild(opcionVacia);

  (categorias || []).forEach(function (cat) {
    var id = cat && (cat.IdCategoria != null ? cat.IdCategoria : cat.idCategoria);
    var nombre = cat && (cat.Nombre != null ? cat.Nombre : cat.nombre);
    if (!id || !nombre) return;
    var opt = document.createElement('option');
    opt.value = String(id);
    opt.textContent = String(nombre);
    select.appendChild(opt);
  });

  if (valorActual && select.querySelector('option[value="' + valorActual + '"]')) {
    select.value = valorActual;
  }
}

function cargarCategoriasServicios() {
  if (adminServicesState.cargandoCategorias) return Promise.resolve();

  adminServicesState.cargandoCategorias = true;
  setMensajeServicios('Cargando categorías...', false);

  return fetch('/api/admin/service-categories.ashx', { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        setMensajeServicios('No tienes permisos para registrar servicios.', true);
        return null;
      }

      return resp.text().then(function (text) {
        if (esRespuestaHtmlDeLogin(resp.headers.get('content-type'), text)) {
          window.location.href = '/login.html';
          return null;
        }

        var data = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = null;
        }

        if (!resp.ok) {
          throw new Error((data && data.message) || 'No fue posible cargar las categorías.');
        }

        return data;
      });
    })
    .then(function (data) {
      if (!data) return;
      if (!data.success || !Array.isArray(data.categorias)) {
        throw new Error((data && data.message) || 'No fue posible cargar las categorías.');
      }

      adminServicesState.csrfToken = data.csrfToken || '';
      adminServicesState.categorias = data.categorias;
      poblarCategoriasServicio(data.categorias);
      poblarCategoriasServicioEdicion(data.categorias);
      setMensajeServicios('', false);
    })
    .catch(function (err) {
      setMensajeServicios((err && err.message) || 'No fue posible cargar las categorías.', true);
    })
    .finally(function () {
      adminServicesState.cargandoCategorias = false;
    });
}

function setFormularioServiciosBloqueado(bloqueado) {
  adminServicesState.enviando = !!bloqueado;

  var submit = document.getElementById('servicio-submit');
  var limpiar = document.getElementById('servicio-limpiar');
  var btnSeleccionar = document.getElementById('servicio-imagen-seleccionar');
  var btnQuitar = document.getElementById('servicio-imagen-quitar');
  var inputImagen = document.getElementById('servicio-imagen-input');
  var btnCerrarModal = document.getElementById('admin-servicio-crear-cerrar');
  var btnAbrirModal = document.getElementById('admin-servicio-crear-toggle');
  if (submit) submit.disabled = !!bloqueado;
  if (limpiar) limpiar.disabled = !!bloqueado;
  if (btnSeleccionar) btnSeleccionar.disabled = !!bloqueado;
  if (btnQuitar) btnQuitar.disabled = !!bloqueado;
  if (inputImagen) inputImagen.disabled = !!bloqueado;
  if (btnCerrarModal) btnCerrarModal.disabled = !!bloqueado;
  if (btnAbrirModal) btnAbrirModal.disabled = !!bloqueado;
}

function limpiarFormularioServicios(preservarMensaje) {
  var form = document.getElementById('admin-servicios-form');
  if (!form) return;

  form.reset();

  var orden = document.getElementById('servicio-orden');
  if (orden) orden.value = '0';

  limpiarPreviewImagenServicio();
  actualizarVistaPreviaServicioCrear();

  if (!preservarMensaje) {
    setMensajeServicios('', false);
  }
}

function enviarFormularioServicios(e) {
  e.preventDefault();
  if (adminServicesState.enviando) return;

  var validacion = obtenerPayloadServicio();
  if (!validacion.ok) {
    setMensajeServicios(validacion.message, true);
    return;
  }

  if (!adminServicesState.csrfToken) {
    setMensajeServicios('No fue posible validar la sesión de seguridad. Recarga la sección de servicios.', true);
    return;
  }

  var validacionImagen = validarArchivoImagenServicio(adminServicesState.imagenSeleccionada);
  if (!validacionImagen.ok) {
    setMensajeServicios(validacionImagen.message, true);
    return;
  }

  setFormularioServiciosBloqueado(true);
  setMensajeServicios('Registrando servicio...', false);

  var body;
  var headers = {
    'X-CSRF-Token': adminServicesState.csrfToken
  };

  if (adminServicesState.imagenSeleccionada) {
    var fd = new FormData();
    fd.append('metadata', JSON.stringify(validacion.payload));
    fd.append('imagenServicio', adminServicesState.imagenSeleccionada, adminServicesState.imagenSeleccionada.name || 'imagen');
    body = fd;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(validacion.payload);
  }

  fetch('/api/admin/service-create.ashx', {
    method: 'POST',
    credentials: 'same-origin',
    headers: headers,
    body: body
  })
    .then(function (resp) {
      return resp.text().then(function (text) {
        if (esRespuestaHtmlDeLogin(resp.headers.get('content-type'), text)) {
          window.location.href = '/login.html';
          return null;
        }

        var data = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = null;
        }

        return { status: resp.status, data: data };
      });
    })
    .then(function (result) {
      if (!result) return;

      var status = result.status;
      var data = result.data || {};

      if (status === 201) {
        setFormularioServiciosBloqueado(false);
        cerrarModalCrearServicio();
        limpiarFormularioServicios(true);
        setMensajeServicios('', false);
        cargarListadoServicios();
        setMensajeServiciosLista('Servicio registrado correctamente', false);
        return;
      }

      if (status === 400) {
        setMensajeServicios(data.message || 'Hay datos inválidos en el formulario.', true);
        return;
      }

      if (status === 401) {
        window.location.href = '/login.html';
        return;
      }

      if (status === 403) {
        setMensajeServicios('No autorizado o validación de seguridad inválida.', true);
        return;
      }

      if (status === 409) {
        setMensajeServicios('Ya existe un servicio con ese nombre en la categoría seleccionada.', true);
        return;
      }

      if (status >= 500) {
        setMensajeServicios('Ocurrió un error interno. Intenta nuevamente.', true);
        return;
      }

      setMensajeServicios(data.message || 'No fue posible registrar el servicio.', true);
    })
    .catch(function () {
      setMensajeServicios('No fue posible conectar con el servidor.', true);
    })
    .finally(function () {
      setFormularioServiciosBloqueado(false);
    });
}

function normalizarServicioListado(item) {
  if (!item) return null;
  return {
    idProducto: item.idProducto != null ? item.idProducto : item.IdProducto,
    nombre: item.nombre != null ? item.nombre : item.Nombre,
    categoria: item.categoria != null ? item.categoria : item.Categoria,
    precio: item.precio != null ? item.precio : item.Precio,
    activo: item.activo != null ? !!item.activo : !!item.Activo,
    imagenPrincipal: item.imagenPrincipal != null ? item.imagenPrincipal : item.ImagenPrincipal
  };
}

function formatearPrecioAdmin(valor) {
  var numero = Number(valor);
  if (!Number.isFinite(numero)) return 'CRC 0';
  return numero.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderListadoServicios(items) {
  var tbody = document.getElementById('admin-servicios-lista-body');
  if (!tbody) return;

  if (!items || !items.length) {
    tbody.innerHTML = '<tr><td colspan="6">No se encontraron servicios.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(function (raw) {
    var s = normalizarServicioListado(raw) || {};
    var id = s.idProducto != null ? String(s.idProducto) : '';
    var nombreServicio = s.nombre || '';
    var ariaEditar = escapeHtml('Editar servicio: ' + (nombreServicio || 'servicio'));
    var fotoContenido = s.imagenPrincipal
      ? '<div class="admin-servicio-thumb"><img src="' + escapeHtml(s.imagenPrincipal) + '" alt="Imagen de ' + escapeHtml(nombreServicio || 'servicio') + '"></div>'
      : '<div class="admin-servicio-thumb"><span class="admin-servicio-thumb-empty">Sin foto</span></div>';
    var foto = '<button type="button" class="admin-servicio-foto-btn" data-admin-editar-servicio="' + escapeHtml(id) + '" aria-label="' + ariaEditar + '">' + fotoContenido + '</button>';
    var estado = s.activo
      ? '<span class="admin-estado-badge activo">Activo</span>'
      : '<span class="admin-estado-badge inactivo">Inactivo</span>';

    return [
      '<tr>',
      '<td>' + foto + '</td>',
      '<td><button type="button" class="admin-servicio-nombre-btn" data-admin-editar-servicio="' + escapeHtml(id) + '" aria-label="' + ariaEditar + '">' + escapeHtml(nombreServicio) + '</button></td>',
      '<td>' + escapeHtml(s.categoria || '') + '</td>',
      '<td>CRC ' + escapeHtml(formatearPrecioAdmin(s.precio)) + '</td>',
      '<td>' + estado + '</td>',
      '<td><button type="button" class="boton boton-secundario admin-servicio-editar-btn" data-admin-editar-servicio="' + escapeHtml(id) + '" aria-label="' + ariaEditar + '">Editar</button></td>',
      '</tr>'
    ].join('');
  }).join('');
}

function obtenerFiltrosListadoServicios() {
  var txtNombre = document.getElementById('admin-servicios-filtro-busqueda');
  var selCategoria = document.getElementById('admin-servicios-filtro-categoria');
  var selEstado = document.getElementById('admin-servicios-filtro-estado');

  return {
    nombre: txtNombre ? (txtNombre.value || '').trim() : '',
    categoria: selCategoria ? (selCategoria.value || '').trim() : '',
    estado: selEstado ? (selEstado.value || '').trim() : ''
  };
}

function actualizarPaginacionServicios(meta) {
  var total = Number(meta && meta.total != null ? meta.total : 0);
  var page = Number(meta && meta.page != null ? meta.page : 1);
  var pageSize = Number(meta && meta.pageSize != null ? meta.pageSize : adminServicesState.pageSize);
  var desde = Number(meta && meta.mostrandoDesde != null ? meta.mostrandoDesde : (total > 0 ? 1 : 0));
  var hasta = Number(meta && meta.mostrandoHasta != null ? meta.mostrandoHasta : total);

  adminServicesState.total = total;
  adminServicesState.paginaActual = page > 0 ? page : 1;

  var lbl = document.getElementById('admin-servicios-paginacion-resumen');
  if (lbl) {
    lbl.textContent = 'Mostrando ' + String(desde) + '–' + String(hasta) + ' de ' + String(total);
  }

  var wrap = document.getElementById('admin-servicios-paginacion-wrap');
  var pageInfo = document.getElementById('admin-servicios-paginacion-pageinfo');
  var btnPrev = document.getElementById('admin-servicios-paginacion-anterior');
  var btnNext = document.getElementById('admin-servicios-paginacion-siguiente');
  var maxPage = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  if (pageInfo) pageInfo.textContent = 'Página ' + String(page) + ' de ' + String(maxPage);
  if (btnPrev) btnPrev.disabled = page <= 1 || adminServicesState.cargandoListado;
  if (btnNext) btnNext.disabled = page >= maxPage || adminServicesState.cargandoListado || total <= 0;
  if (wrap) wrap.hidden = total <= pageSize;
}

function cargarListadoServicios(opciones) {
  var opts = opciones || {};
  var filtros = obtenerFiltrosListadoServicios();

  if (opts.resetPagina) {
    adminServicesState.paginaActual = 1;
  }

  adminServicesState.filtrosListado = filtros;
  adminServicesState.cargandoListado = true;
  setMensajeServiciosLista('Cargando servicios...', false);

  var requestId = (adminServicesState.ultimoRequestListado || 0) + 1;
  adminServicesState.ultimoRequestListado = requestId;

  var query = [
    'page=' + encodeURIComponent(String(adminServicesState.paginaActual || 1)),
    'pageSize=' + encodeURIComponent(String(adminServicesState.pageSize || 10))
  ];

  if (filtros.nombre) query.push('nombre=' + encodeURIComponent(filtros.nombre));
  if (filtros.categoria) query.push('categoria=' + encodeURIComponent(filtros.categoria));
  if (filtros.estado) query.push('estado=' + encodeURIComponent(filtros.estado));

  var url = '/api/admin/service-list.ashx?' + query.join('&');

  return fetch(url, { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        setMensajeServiciosLista('No tienes permisos para consultar servicios.', true);
        return null;
      }

      return resp.text().then(function (text) {
        if (esRespuestaHtmlDeLogin(resp.headers.get('content-type'), text)) {
          window.location.href = '/login.html';
          return null;
        }

        var data = null;
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = null;
        }

        if (!resp.ok) {
          throw new Error((data && data.message) || 'No fue posible cargar servicios.');
        }

        return data;
      });
    })
    .then(function (data) {
      if (requestId !== adminServicesState.ultimoRequestListado) return;
      if (!data) return;
      if (!data.success || !Array.isArray(data.servicios)) {
        throw new Error((data && data.message) || 'No fue posible cargar servicios.');
      }

      adminServicesState.catalogoCompleto = Array.isArray(data.serviciosCompletos) ? data.serviciosCompletos : data.servicios;

      var filtroCategoria = document.getElementById('admin-servicios-filtro-categoria');
      if (filtroCategoria) {
        var seleccionado = filtroCategoria.value || '';
        var mapa = {};
        var categorias = [];
        adminServicesState.catalogoCompleto.forEach(function (raw) {
          var s = normalizarServicioListado(raw);
          if (!s || !s.categoria) return;
          var key = String(s.categoria).trim();
          if (!key || mapa[key]) return;
          mapa[key] = true;
          categorias.push(key);
        });
        categorias.sort();

        var opciones = ['<option value="">Todas las categorías</option>'];
        categorias.forEach(function (cat) {
          var sel = cat === seleccionado ? ' selected' : '';
          opciones.push('<option value="' + escapeHtml(cat) + '"' + sel + '>' + escapeHtml(cat) + '</option>');
        });
        filtroCategoria.innerHTML = opciones.join('');
      }

      renderListadoServicios(data.servicios);
      actualizarPaginacionServicios(data);
      setMensajeServiciosLista('', false);
    })
    .catch(function (err) {
      if (requestId !== adminServicesState.ultimoRequestListado) return;
      renderListadoServicios([]);
      actualizarPaginacionServicios({ total: 0, page: 1, pageSize: adminServicesState.pageSize, mostrandoDesde: 0, mostrandoHasta: 0 });
      setMensajeServiciosLista((err && err.message) || 'No fue posible cargar servicios.', true);
    })
    .finally(function () {
      if (requestId !== adminServicesState.ultimoRequestListado) return;
      adminServicesState.cargandoListado = false;
      actualizarPaginacionServicios({
        total: adminServicesState.total,
        page: adminServicesState.paginaActual,
        pageSize: adminServicesState.pageSize,
        mostrandoDesde: adminServicesState.total > 0 ? ((adminServicesState.paginaActual - 1) * adminServicesState.pageSize) + 1 : 0,
        mostrandoHasta: Math.min(adminServicesState.paginaActual * adminServicesState.pageSize, adminServicesState.total)
      });
    });
}

function normalizarReporteServicioItem(item) {
  if (!item) return null;
  return {
    nombre: item.nombre != null ? item.nombre : item.Nombre,
    categoria: item.categoria != null ? item.categoria : item.Categoria,
    precio: item.precio != null ? item.precio : item.Precio,
    activo: item.activo != null ? !!item.activo : !!item.Activo
  };
}

function normalizarReportePromocionItem(item) {
  if (!item) return null;
  return {
    nombre: item.nombre != null ? item.nombre : item.Nombre,
    tipoPromocion: item.tipoPromocion != null ? item.tipoPromocion : item.TipoPromocion,
    beneficio: item.beneficio != null ? item.beneficio : item.Beneficio,
    fechaInicio: item.fechaInicio != null ? item.fechaInicio : item.FechaInicio,
    fechaFin: item.fechaFin != null ? item.fechaFin : item.FechaFin,
    activo: item.activo != null ? !!item.activo : !!item.Activo,
    estado: item.estado != null ? item.estado : (item.Estado || ''),
    vigencia: item.vigencia != null ? item.vigencia : (item.Vigencia || '')
  };
}

function normalizarReporteUsuarioItem(item) {
  if (!item) return null;
  return {
    nombreCompleto: item.nombreCompleto != null ? item.nombreCompleto : item.NombreCompleto,
    correo: item.correo != null ? item.correo : item.Correo,
    rol: item.rol != null ? item.rol : item.Rol,
    activo: item.activo != null ? !!item.activo : !!item.Activo,
    estado: item.estado != null ? item.estado : (item.Estado || '')
  };
}

function formatearPrecioReporteCRC(valor) {
  var numero = Number(valor);
  if (!Number.isFinite(numero)) return '₡0';
  return numero.toLocaleString('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function obtenerTipoReporteSeleccionado() {
  var tipo = document.getElementById('admin-reportes-tipo');
  var valor = tipo ? String(tipo.value || '').trim().toLowerCase() : 'servicios';
  if (valor === 'promociones') return 'promociones';
  if (valor === 'reservas') return 'reservas';
  if (valor === 'usuarios') return 'usuarios';
  return 'servicios';
}

function actualizarVisibilidadFiltrosReportes() {
  var tipo = obtenerTipoReporteSeleccionado();
  var servicios = document.getElementById('admin-reportes-filtros-servicios');
  var promociones = document.getElementById('admin-reportes-filtros-promociones');
  var reservas = document.getElementById('admin-reportes-filtros-reservas');
  var usuarios = document.getElementById('admin-reportes-filtros-usuarios');

  if (servicios) servicios.hidden = tipo !== 'servicios';
  if (promociones) promociones.hidden = tipo !== 'promociones';
  if (reservas) reservas.hidden = tipo !== 'reservas';
  if (usuarios) usuarios.hidden = tipo !== 'usuarios';
}

function configurarPresentacionReportePorTipo() {
  var tipo = obtenerTipoReporteSeleccionado();
  var titulo = document.getElementById('admin-reportes-listado-titulo');
  var etiqueta1 = document.getElementById('admin-reportes-kpi-etiqueta-1');
  var etiqueta2 = document.getElementById('admin-reportes-kpi-etiqueta-2');
  var etiqueta3 = document.getElementById('admin-reportes-kpi-etiqueta-3');
  var etiqueta4 = document.getElementById('admin-reportes-kpi-etiqueta-4');
  var thead = document.getElementById('admin-reportes-lista-head');
  var tabla = document.querySelector('.admin-reportes-lista');

  if (tipo === 'promociones') {
    if (titulo) titulo.textContent = 'Listado de promociones';
    if (etiqueta1) etiqueta1.textContent = 'Total de promociones';
    if (etiqueta2) etiqueta2.textContent = 'Promociones activas';
    if (etiqueta3) etiqueta3.textContent = 'Promociones inactivas';
    if (etiqueta4) etiqueta4.textContent = 'Promociones vigentes';
    if (thead) {
      thead.innerHTML = '<tr><th>Nombre de promoción</th><th>Tipo</th><th>Descuento o beneficio</th><th>Fecha inicio</th><th>Fecha fin</th><th>Estado</th><th>Vigencia</th></tr>';
    }
    if (tabla) tabla.setAttribute('aria-label', 'Reporte de promociones');
  } else if (tipo === 'reservas') {
    if (titulo) titulo.textContent = 'Listado de reservas';
    if (etiqueta1) etiqueta1.textContent = 'Total de reservas';
    if (etiqueta2) etiqueta2.textContent = 'Reservas confirmadas';
    if (etiqueta3) etiqueta3.textContent = 'Reservas canceladas';
    if (etiqueta4) etiqueta4.textContent = 'Reservas en otros estados';
    if (thead) {
      thead.innerHTML = '<tr><th>ID Reserva</th><th>Servicio</th><th>Usuario</th><th>Fecha y hora actividad</th><th>Estado</th><th>Fecha creación</th></tr>';
    }
    if (tabla) tabla.setAttribute('aria-label', 'Reporte de reservas');
  } else if (tipo === 'usuarios') {
    if (titulo) titulo.textContent = 'Listado de usuarios';
    if (etiqueta1) etiqueta1.textContent = 'Total de usuarios';
    if (etiqueta2) etiqueta2.textContent = 'Usuarios activos';
    if (etiqueta3) etiqueta3.textContent = 'Usuarios inactivos';
    if (etiqueta4) etiqueta4.textContent = 'Roles activos';
    if (thead) {
      thead.innerHTML = '<tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr>';
    }
    if (tabla) tabla.setAttribute('aria-label', 'Reporte de usuarios');
  } else {
    if (titulo) titulo.textContent = 'Listado de servicios';
    if (etiqueta1) etiqueta1.textContent = 'Total de servicios';
    if (etiqueta2) etiqueta2.textContent = 'Servicios activos';
    if (etiqueta3) etiqueta3.textContent = 'Servicios inactivos';
    if (etiqueta4) etiqueta4.textContent = 'Categorías';
    if (thead) {
      thead.innerHTML = '<tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Estado</th></tr>';
    }
    if (tabla) tabla.setAttribute('aria-label', 'Reporte de servicios');
  }
}

function setBotonReporteServiciosCargando(cargando) {
  var boton = document.getElementById('admin-reportes-generar');
  if (!boton) return;
  boton.disabled = !!cargando;
  boton.textContent = cargando ? 'Aplicando...' : 'Aplicar filtros';
}

function setTextoBotonExportarReporteServicios(texto) {
  var boton = document.getElementById('admin-reportes-exportar');
  if (!boton) return;
  var span = boton.querySelector('span');
  if (span) {
    span.textContent = texto;
  }
}

function actualizarEstadoBotonExportarReporteServicios() {
  var boton = document.getElementById('admin-reportes-exportar');
  if (!boton) return;

  var habilitado = Array.isArray(adminReportsState.items)
    && adminReportsState.items.length > 0
    && !adminReportsState.cargando
    && !adminReportsState.exportando;

  boton.disabled = !habilitado;
}

function obtenerNombreArchivoReporteDesdeHeader(contentDisposition) {
  var header = String(contentDisposition || '');
  if (!header) return '';

  var utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch && utfMatch[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch (_) {
      return utfMatch[1];
    }
  }

  var basicMatch = /filename="?([^";]+)"?/i.exec(header);
  return basicMatch && basicMatch[1] ? basicMatch[1] : '';
}

function construirQueryReporteServicios(incluirFormatoXlsx) {
  var params = new URLSearchParams();
  params.set('tipo', 'servicios');

  if (adminReportsState.filtrosAplicados.servicios.nombre) params.set('nombre', adminReportsState.filtrosAplicados.servicios.nombre);
  if (adminReportsState.filtrosAplicados.servicios.categoria) params.set('categoria', adminReportsState.filtrosAplicados.servicios.categoria);
  if (adminReportsState.filtrosAplicados.servicios.estado) params.set('estado', adminReportsState.filtrosAplicados.servicios.estado);
  if (incluirFormatoXlsx) params.set('formato', 'xlsx');

  return '/api/admin/reports.ashx?' + params.toString();
}

function construirQueryReportePromociones(incluirFormatoXlsx) {
  var params = new URLSearchParams();
  params.set('tipo', 'promociones');

  if (adminReportsState.filtrosAplicados.promociones.nombre) params.set('nombre', adminReportsState.filtrosAplicados.promociones.nombre);
  if (adminReportsState.filtrosAplicados.promociones.estado) params.set('estado', adminReportsState.filtrosAplicados.promociones.estado);
  if (adminReportsState.filtrosAplicados.promociones.vigencia) params.set('vigencia', adminReportsState.filtrosAplicados.promociones.vigencia);
  if (incluirFormatoXlsx) params.set('formato', 'xlsx');

  return '/api/admin/reports.ashx?' + params.toString();
}

function construirQueryReporteReservas(incluirFormatoXlsx) {
  var params = new URLSearchParams();
  params.set('tipo', 'reservas');

  if (adminReportsState.filtrosAplicados.reservas.servicio) params.set('servicio', adminReportsState.filtrosAplicados.reservas.servicio);
  if (adminReportsState.filtrosAplicados.reservas.estado) params.set('estado', adminReportsState.filtrosAplicados.reservas.estado);
  if (adminReportsState.filtrosAplicados.reservas.fechaDesde) params.set('fechaDesde', adminReportsState.filtrosAplicados.reservas.fechaDesde);
  if (adminReportsState.filtrosAplicados.reservas.fechaHasta) params.set('fechaHasta', adminReportsState.filtrosAplicados.reservas.fechaHasta);
  if (incluirFormatoXlsx) params.set('formato', 'xlsx');

  return '/api/admin/reports.ashx?' + params.toString();
}

function construirQueryReporteUsuarios(incluirFormatoXlsx) {
  var params = new URLSearchParams();
  params.set('tipo', 'usuarios');

  if (adminReportsState.filtrosAplicados.usuarios.busqueda) params.set('busqueda', adminReportsState.filtrosAplicados.usuarios.busqueda);
  if (adminReportsState.filtrosAplicados.usuarios.rol) params.set('rol', adminReportsState.filtrosAplicados.usuarios.rol);
  if (adminReportsState.filtrosAplicados.usuarios.estado) params.set('estado', adminReportsState.filtrosAplicados.usuarios.estado);
  if (incluirFormatoXlsx) params.set('formato', 'xlsx');

  return '/api/admin/reports.ashx?' + params.toString();
}

function construirQueryReporteActual(incluirFormatoXlsx, tipoReporte) {
  var tipo = tipoReporte || obtenerTipoReporteSeleccionado();
  if (tipo === 'promociones') return construirQueryReportePromociones(incluirFormatoXlsx);
  if (tipo === 'reservas') return construirQueryReporteReservas(incluirFormatoXlsx);
  if (tipo === 'usuarios') return construirQueryReporteUsuarios(incluirFormatoXlsx);
  return construirQueryReporteServicios(incluirFormatoXlsx);
}

function capturarFiltrosReporteServiciosDesdeVista() {
  var nombre = document.getElementById('admin-reportes-filtro-nombre');
  var categoria = document.getElementById('admin-reportes-filtro-categoria');
  var estado = document.getElementById('admin-reportes-filtro-estado');

  adminReportsState.filtros.nombre = nombre ? String(nombre.value || '').trim() : '';
  adminReportsState.filtros.categoria = categoria ? String(categoria.value || '').trim() : '';
  adminReportsState.filtros.estado = estado ? String(estado.value || '').trim().toLowerCase() : '';
}

function capturarFiltrosReportePromocionesDesdeVista() {
  var nombre = document.getElementById('admin-reportes-filtro-promocion-nombre');
  var estado = document.getElementById('admin-reportes-filtro-promocion-estado');
  var vigencia = document.getElementById('admin-reportes-filtro-promocion-vigencia');

  adminReportsState.filtrosPromociones.nombre = nombre ? String(nombre.value || '').trim() : '';
  adminReportsState.filtrosPromociones.estado = estado ? String(estado.value || '').trim().toLowerCase() : '';
  adminReportsState.filtrosPromociones.vigencia = vigencia ? String(vigencia.value || '').trim().toLowerCase() : '';
}

function capturarFiltrosReporteReservasDesdeVista() {
  var servicio = document.getElementById('admin-reportes-filtro-reserva-servicio');
  var estado = document.getElementById('admin-reportes-filtro-reserva-estado');
  var desde = document.getElementById('admin-reportes-filtro-reserva-desde');
  var hasta = document.getElementById('admin-reportes-filtro-reserva-hasta');

  adminReportsState.filtrosReservas.servicio = servicio ? String(servicio.value || '').trim() : '';
  adminReportsState.filtrosReservas.estado = estado ? String(estado.value || '').trim().toUpperCase() : '';
  adminReportsState.filtrosReservas.fechaDesde = desde ? String(desde.value || '').trim() : '';
  adminReportsState.filtrosReservas.fechaHasta = hasta ? String(hasta.value || '').trim() : '';
}

function poblarFiltrosReporteUsuariosRoles(roles) {
  var select = document.getElementById('admin-reportes-filtro-usuario-rol');
  if (!select) return;

  var valorActual = String(select.value || '').trim();
  var opciones = '<option value="">Todos</option>';

  (roles || []).forEach(function (rol) {
    var id = rol && (rol.idRol != null ? rol.idRol : rol.IdRol);
    var nombre = rol && (rol.nombre != null ? rol.nombre : rol.Nombre);
    if (!id || !nombre) return;
    opciones += '<option value="' + escapeHtml(String(id)) + '">' + escapeHtml(String(nombre)) + '</option>';
  });

  select.innerHTML = opciones;
  if (valorActual && select.querySelector('option[value="' + valorActual + '"]')) {
    select.value = valorActual;
  }
}

function asegurarRolesReporteUsuariosCargados() {
  if (Array.isArray(adminReportsState.rolesUsuarios) && adminReportsState.rolesUsuarios.length) {
    poblarFiltrosReporteUsuariosRoles(adminReportsState.rolesUsuarios);
    return Promise.resolve(adminReportsState.rolesUsuarios);
  }

  return fetch('/api/admin/users.ashx?page=1&pageSize=1', { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        throw new Error('No tienes permisos para cargar roles de usuario.');
      }
      if (!resp.ok) {
        throw new Error('No fue posible cargar los roles de usuario.');
      }
      return resp.json();
    })
    .then(function (data) {
      if (!data || !data.success) {
        throw new Error((data && data.message) || 'No fue posible cargar los roles de usuario.');
      }

      adminReportsState.rolesUsuarios = Array.isArray(data.roles) ? data.roles : [];
      poblarFiltrosReporteUsuariosRoles(adminReportsState.rolesUsuarios);
      return adminReportsState.rolesUsuarios;
    });
}

function capturarFiltrosReporteUsuariosDesdeVista() {
  var busqueda = document.getElementById('admin-reportes-filtro-usuario-busqueda');
  var rol = document.getElementById('admin-reportes-filtro-usuario-rol');
  var estado = document.getElementById('admin-reportes-filtro-usuario-estado');

  adminReportsState.filtrosUsuarios.busqueda = busqueda ? String(busqueda.value || '').trim() : '';
  adminReportsState.filtrosUsuarios.rol = rol ? String(rol.value || '').trim() : '';
  adminReportsState.filtrosUsuarios.estado = estado ? String(estado.value || '').trim().toLowerCase() : '';
}

function capturarFiltrosReporteTipoActualDesdeVista() {
  var tipo = obtenerTipoReporteSeleccionado();
  if (tipo === 'promociones') capturarFiltrosReportePromocionesDesdeVista();
  else if (tipo === 'reservas') capturarFiltrosReporteReservasDesdeVista();
  else if (tipo === 'usuarios') capturarFiltrosReporteUsuariosDesdeVista();
  else capturarFiltrosReporteServiciosDesdeVista();
}

function reflejarFiltrosEditablesEnVista() {
  var nombre = document.getElementById('admin-reportes-filtro-nombre');
  var categoria = document.getElementById('admin-reportes-filtro-categoria');
  var estado = document.getElementById('admin-reportes-filtro-estado');
  if (nombre) nombre.value = adminReportsState.filtros.nombre || '';
  if (categoria) categoria.value = adminReportsState.filtros.categoria || '';
  if (estado) estado.value = adminReportsState.filtros.estado || '';

  var promoNombre = document.getElementById('admin-reportes-filtro-promocion-nombre');
  var promoEstado = document.getElementById('admin-reportes-filtro-promocion-estado');
  var promoVigencia = document.getElementById('admin-reportes-filtro-promocion-vigencia');
  if (promoNombre) promoNombre.value = adminReportsState.filtrosPromociones.nombre || '';
  if (promoEstado) promoEstado.value = adminReportsState.filtrosPromociones.estado || '';
  if (promoVigencia) promoVigencia.value = adminReportsState.filtrosPromociones.vigencia || '';

  var reservaServicio = document.getElementById('admin-reportes-filtro-reserva-servicio');
  var reservaEstado = document.getElementById('admin-reportes-filtro-reserva-estado');
  var reservaDesde = document.getElementById('admin-reportes-filtro-reserva-desde');
  var reservaHasta = document.getElementById('admin-reportes-filtro-reserva-hasta');
  if (reservaServicio) reservaServicio.value = adminReportsState.filtrosReservas.servicio || '';
  if (reservaEstado) reservaEstado.value = adminReportsState.filtrosReservas.estado || '';
  if (reservaDesde) reservaDesde.value = adminReportsState.filtrosReservas.fechaDesde || '';
  if (reservaHasta) reservaHasta.value = adminReportsState.filtrosReservas.fechaHasta || '';

  var usuarioBusqueda = document.getElementById('admin-reportes-filtro-usuario-busqueda');
  var usuarioRol = document.getElementById('admin-reportes-filtro-usuario-rol');
  var usuarioEstado = document.getElementById('admin-reportes-filtro-usuario-estado');
  if (usuarioBusqueda) usuarioBusqueda.value = adminReportsState.filtrosUsuarios.busqueda || '';
  if (usuarioRol) usuarioRol.value = adminReportsState.filtrosUsuarios.rol || '';
  if (usuarioEstado) usuarioEstado.value = adminReportsState.filtrosUsuarios.estado || '';
}

function validarFiltrosReporteReservas() {
  var desde = adminReportsState.filtrosReservas.fechaDesde;
  var hasta = adminReportsState.filtrosReservas.fechaHasta;
  if (desde && hasta && desde > hasta) {
    return 'La fecha desde no puede ser mayor que la fecha hasta.';
  }
  return '';
}

function validarFiltrosReporteServicios() {
  return '';
}

function exportarReporteServiciosExcel() {
  if (adminReportsState.exportando) return;
  if (!Array.isArray(adminReportsState.items) || !adminReportsState.items.length) {
    setMensajeReportes('No hay resultados para exportar.', true);
    actualizarEstadoBotonExportarReporteServicios();
    return;
  }

  adminReportsState.exportando = true;
  actualizarEstadoBotonExportarReporteServicios();
  setTextoBotonExportarReporteServicios('Exportando...');

  var tipoExportacion = adminReportsState.ultimoTipo || obtenerTipoReporteSeleccionado();

  fetch(construirQueryReporteActual(true, tipoExportacion), {
    method: 'GET',
    credentials: 'same-origin'
  })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }

      if (resp.status === 403) {
        throw new Error('No tienes permisos para exportar este reporte.');
      }

      if (!resp.ok) {
        return resp.text().then(function (text) {
          var data = null;
          try {
            data = JSON.parse(text);
          } catch (_) {
            data = null;
          }
          throw new Error((data && data.message) || 'No fue posible exportar el reporte.');
        });
      }

      return resp.blob().then(function (blob) {
        if (!blob || !blob.size) {
          throw new Error('El archivo exportado no contiene datos.');
        }

        var nombreArchivo = obtenerNombreArchivoReporteDesdeHeader(resp.headers.get('content-disposition'));
        if (!nombreArchivo) {
          var tipoNombre = tipoExportacion;
          if (tipoNombre === 'promociones') nombreArchivo = 'KFitness_Reporte_Promociones.xlsx';
          else if (tipoNombre === 'reservas') nombreArchivo = 'KFitness_Reporte_Reservas.xlsx';
          else if (tipoNombre === 'usuarios') nombreArchivo = 'KFitness_Reporte_Usuarios.xlsx';
          else nombreArchivo = 'KFitness_Reporte_Servicios.xlsx';
        }

        var objectUrl = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = objectUrl;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);

        setMensajeReportes('Exportación a Excel completada.', false);
      });
    })
    .catch(function (err) {
      setMensajeReportes((err && err.message) || 'No fue posible exportar el reporte.', true);
    })
    .finally(function () {
      adminReportsState.exportando = false;
      setTextoBotonExportarReporteServicios('Exportar a Excel');
      actualizarEstadoBotonExportarReporteServicios();
    });
}

function setTotalRegistrosReporteServicios(total) {
  var totalEl = document.getElementById('admin-reportes-total-registros');
  if (!totalEl) return;
  totalEl.textContent = String(Number.isFinite(total) ? total : 0);
}

function obtenerColspanReportePorTipo(tipo) {
  if (tipo === 'promociones') return 7;
  if (tipo === 'reservas') return 6;
  return 4;
}

function renderPaginaReporteActual() {
  var tipo = obtenerTipoReporteSeleccionado();
  var items = Array.isArray(adminReportsState.items) ? adminReportsState.items : [];

  var pag = resolverPaginacionLocal(
    items,
    adminReportsState.paginacionDetalle.pagina,
    adminReportsState.paginacionDetalle.pageSize
  );

  adminReportsState.paginacionDetalle.pagina = pag.meta.pagina;
  adminReportsState.paginacionDetalle.total = pag.meta.total;

  if (tipo === 'promociones') {
    renderReportePromocionesTabla(pag.items);
  } else if (tipo === 'reservas') {
    renderReporteReservasTabla(pag.items);
  } else if (tipo === 'usuarios') {
    renderReporteUsuariosTabla(pag.items);
  } else {
    renderReporteServiciosTabla(pag.items);
  }

  setTotalRegistrosReporteServicios(items.length);

  renderControlesPaginacion(
    'admin-reportes-pagination',
    pag.meta,
    adminReportsState.cargando,
    function () {
      if (adminReportsState.paginacionDetalle.pagina <= 1 || adminReportsState.cargando) return;
      adminReportsState.paginacionDetalle.pagina -= 1;
      renderPaginaReporteActual();
    },
    function () {
      if (adminReportsState.cargando) return;
      if (adminReportsState.paginacionDetalle.pagina >= pag.meta.totalPaginas) return;
      adminReportsState.paginacionDetalle.pagina += 1;
      renderPaginaReporteActual();
    }
  );

  if (!items.length) {
    var tbody = document.getElementById('admin-reportes-lista-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="' + String(obtenerColspanReportePorTipo(tipo)) + '">No hay resultados para mostrar.</td></tr>';
    }
  }
}

function resetPaginacionReportes() {
  adminReportsState.paginacionDetalle.pagina = 1;
  adminReportsState.paginacionDetalle.pageSize = 10;
  adminReportsState.paginacionDetalle.total = 0;
}

function obtenerFiltrosEditablesPorTipo(tipo) {
  if (tipo === 'promociones') return adminReportsState.filtrosPromociones;
  if (tipo === 'reservas') return adminReportsState.filtrosReservas;
  if (tipo === 'usuarios') return adminReportsState.filtrosUsuarios;
  return adminReportsState.filtros;
}

function obtenerFiltrosAplicadosPorTipo(tipo) {
  if (!adminReportsState.filtrosAplicados) return null;
  if (tipo === 'promociones') return adminReportsState.filtrosAplicados.promociones;
  if (tipo === 'reservas') return adminReportsState.filtrosAplicados.reservas;
  if (tipo === 'usuarios') return adminReportsState.filtrosAplicados.usuarios;
  return adminReportsState.filtrosAplicados.servicios;
}

function sincronizarFiltrosEditablesDesdeAplicados(tipo) {
  var aplicados = obtenerFiltrosAplicadosPorTipo(tipo);
  var editables = obtenerFiltrosEditablesPorTipo(tipo);
  if (!aplicados || !editables) return;

  Object.keys(editables).forEach(function (key) {
    editables[key] = aplicados[key] != null ? String(aplicados[key]) : '';
  });
}

function aplicarFiltrosEditablesComoAplicados(tipo) {
  var aplicados = obtenerFiltrosAplicadosPorTipo(tipo);
  var editables = obtenerFiltrosEditablesPorTipo(tipo);
  if (!aplicados || !editables) return;

  Object.keys(aplicados).forEach(function (key) {
    aplicados[key] = editables[key] != null ? String(editables[key]) : '';
  });
}

function contarFiltrosActivosPorTipo(tipo) {
  var filtros = obtenerFiltrosAplicadosPorTipo(tipo);
  if (!filtros) return 0;

  if (tipo === 'reservas') {
    var countReservas = 0;
    if (String(filtros.servicio || '').trim()) countReservas += 1;
    if (String(filtros.estado || '').trim()) countReservas += 1;
    if (String(filtros.fechaDesde || '').trim() || String(filtros.fechaHasta || '').trim()) countReservas += 1;
    return countReservas;
  }

  var count = 0;
  Object.keys(filtros).forEach(function (key) {
    if (String(filtros[key] || '').trim()) count += 1;
  });
  return count;
}

function actualizarEstadoBotonFiltrosReportes() {
  var tipo = obtenerTipoReporteSeleccionado();
  var activos = contarFiltrosActivosPorTipo(tipo);
  adminReportsState.filtrosActivosCount = activos;

  var texto = document.getElementById('admin-reportes-filtros-toggle-texto');
  if (texto) {
    texto.textContent = activos > 0 ? ('Filtros activos · ' + String(activos)) : 'Filtrar resultados';
  }

  var limpiarRapido = document.getElementById('admin-reportes-limpiar-rapido');
  if (limpiarRapido) {
    limpiarRapido.hidden = activos <= 0;
  }
}

function setPanelFiltrosReportesAbierto(abierto) {
  adminReportsState.filtrosPanelAbierto = !!abierto;

  var panel = document.getElementById('admin-reportes-filtros-panel');
  var toggle = document.getElementById('admin-reportes-filtros-toggle');

  if (panel) panel.hidden = !abierto;
  if (toggle) toggle.setAttribute('aria-expanded', abierto ? 'true' : 'false');
}

function limpiarFiltrosReportePorTipo(tipo) {
  var aplicados = obtenerFiltrosAplicadosPorTipo(tipo);
  var editables = obtenerFiltrosEditablesPorTipo(tipo);
  if (!aplicados || !editables) return;

  Object.keys(aplicados).forEach(function (key) {
    aplicados[key] = '';
    editables[key] = '';
  });
}

function renderResumenReporteServicios(items, resumen) {
  var lista = Array.isArray(items) ? items : [];
  var total = lista.length;
  var activos = 0;
  var inactivos = 0;
  var categorias = {};

  for (var i = 0; i < lista.length; i += 1) {
    var item = lista[i] || {};
    if (item.activo) activos += 1;
    else inactivos += 1;

    var categoria = String(item.categoria || '').trim();
    if (categoria) {
      categorias[categoria.toLowerCase()] = true;
    }
  }

  if (resumen && resumen.total != null && Number.isFinite(Number(resumen.total))) {
    total = Number(resumen.total);
  }
  if (resumen && resumen.activos != null && Number.isFinite(Number(resumen.activos))) {
    activos = Number(resumen.activos);
  }
  if (resumen && resumen.inactivos != null && Number.isFinite(Number(resumen.inactivos))) {
    inactivos = Number(resumen.inactivos);
  }

  var totalEl = document.getElementById('admin-reportes-kpi-total');
  var activosEl = document.getElementById('admin-reportes-kpi-activos');
  var inactivosEl = document.getElementById('admin-reportes-kpi-inactivos');
  var categoriasEl = document.getElementById('admin-reportes-kpi-categorias');

  if (totalEl) totalEl.textContent = String(total);
  if (activosEl) activosEl.textContent = String(activos);
  if (inactivosEl) inactivosEl.textContent = String(inactivos);
  if (categoriasEl) categoriasEl.textContent = String(Object.keys(categorias).length);
}

function renderResumenReportePromociones(items, resumen) {
  var lista = Array.isArray(items) ? items : [];
  var total = lista.length;
  var activas = 0;
  var inactivas = 0;
  var vigentes = 0;

  for (var i = 0; i < lista.length; i += 1) {
    var item = lista[i] || {};
    if (item.activo) activas += 1;
    else inactivas += 1;
    if (String(item.vigencia || '').toLowerCase() === 'vigente') vigentes += 1;
  }

  if (resumen && resumen.total != null && Number.isFinite(Number(resumen.total))) total = Number(resumen.total);
  if (resumen && resumen.activas != null && Number.isFinite(Number(resumen.activas))) activas = Number(resumen.activas);
  if (resumen && resumen.inactivas != null && Number.isFinite(Number(resumen.inactivas))) inactivas = Number(resumen.inactivas);
  if (resumen && resumen.vigentes != null && Number.isFinite(Number(resumen.vigentes))) vigentes = Number(resumen.vigentes);

  var totalEl = document.getElementById('admin-reportes-kpi-total');
  var activosEl = document.getElementById('admin-reportes-kpi-activos');
  var inactivosEl = document.getElementById('admin-reportes-kpi-inactivos');
  var vigentesEl = document.getElementById('admin-reportes-kpi-categorias');

  if (totalEl) totalEl.textContent = String(total);
  if (activosEl) activosEl.textContent = String(activas);
  if (inactivosEl) inactivosEl.textContent = String(inactivas);
  if (vigentesEl) vigentesEl.textContent = String(vigentes);
}

function renderResumenReporteReservas(items, resumen) {
  var lista = Array.isArray(items) ? items : [];
  var total = lista.length;
  var confirmadas = 0;
  var canceladas = 0;
  var otros = 0;

  for (var i = 0; i < lista.length; i += 1) {
    var estado = String((lista[i] && lista[i].estado) || '').trim().toUpperCase();
    if (estado === 'CONFIRMADA') confirmadas += 1;
    else if (estado === 'CANCELADA') canceladas += 1;
    else otros += 1;
  }

  if (resumen && resumen.total != null && Number.isFinite(Number(resumen.total))) total = Number(resumen.total);
  if (resumen && resumen.confirmadas != null && Number.isFinite(Number(resumen.confirmadas))) confirmadas = Number(resumen.confirmadas);
  if (resumen && resumen.canceladas != null && Number.isFinite(Number(resumen.canceladas))) canceladas = Number(resumen.canceladas);
  if (resumen && resumen.otrosEstados != null && Number.isFinite(Number(resumen.otrosEstados))) otros = Number(resumen.otrosEstados);

  var totalEl = document.getElementById('admin-reportes-kpi-total');
  var cEl = document.getElementById('admin-reportes-kpi-activos');
  var xEl = document.getElementById('admin-reportes-kpi-inactivos');
  var oEl = document.getElementById('admin-reportes-kpi-categorias');

  if (totalEl) totalEl.textContent = String(total);
  if (cEl) cEl.textContent = String(confirmadas);
  if (xEl) xEl.textContent = String(canceladas);
  if (oEl) oEl.textContent = String(otros);
}

function renderResumenReporteUsuarios(items, resumen) {
  var lista = Array.isArray(items) ? items : [];
  var total = lista.length;
  var activos = 0;
  var inactivos = 0;
  var roles = {};

  for (var i = 0; i < lista.length; i += 1) {
    var item = lista[i] || {};
    if (item.activo) activos += 1;
    else inactivos += 1;

    var rolNombre = String(item.rol || '').trim();
    if (rolNombre) roles[rolNombre.toLowerCase()] = true;
  }

  var totalRoles = Object.keys(roles).length;

  if (resumen && resumen.total != null && Number.isFinite(Number(resumen.total))) total = Number(resumen.total);
  if (resumen && resumen.activos != null && Number.isFinite(Number(resumen.activos))) activos = Number(resumen.activos);
  if (resumen && resumen.inactivos != null && Number.isFinite(Number(resumen.inactivos))) inactivos = Number(resumen.inactivos);
  if (resumen && resumen.roles != null && Number.isFinite(Number(resumen.roles))) totalRoles = Number(resumen.roles);

  var totalEl = document.getElementById('admin-reportes-kpi-total');
  var activosEl = document.getElementById('admin-reportes-kpi-activos');
  var inactivosEl = document.getElementById('admin-reportes-kpi-inactivos');
  var rolesEl = document.getElementById('admin-reportes-kpi-categorias');

  if (totalEl) totalEl.textContent = String(total);
  if (activosEl) activosEl.textContent = String(activos);
  if (inactivosEl) inactivosEl.textContent = String(inactivos);
  if (rolesEl) rolesEl.textContent = String(totalRoles);
}

function renderReporteServiciosTabla(items) {
  var tbody = document.getElementById('admin-reportes-lista-body');
  if (!tbody) return;

  if (!Array.isArray(items) || !items.length) {
    setTotalRegistrosReporteServicios(0);
    tbody.innerHTML = '<tr><td colspan="4">No hay servicios para mostrar.</td></tr>';
    return;
  }

  setTotalRegistrosReporteServicios(items.length);
  tbody.innerHTML = items.map(function (raw) {
    var item = normalizarReporteServicioItem(raw) || {};
    var estado = item.activo
      ? '<span class="admin-estado-badge activo">Activo</span>'
      : '<span class="admin-estado-badge inactivo">Inactivo</span>';

    return [
      '<tr>',
      '<td>' + escapeHtml(item.nombre || '') + '</td>',
      '<td>' + escapeHtml(item.categoria || '') + '</td>',
      '<td>' + escapeHtml(formatearPrecioReporteCRC(item.precio)) + '</td>',
      '<td>' + estado + '</td>',
      '</tr>'
    ].join('');
  }).join('');
}

function renderReportePromocionesTabla(items) {
  var tbody = document.getElementById('admin-reportes-lista-body');
  if (!tbody) return;

  if (!Array.isArray(items) || !items.length) {
    setTotalRegistrosReporteServicios(0);
    tbody.innerHTML = '<tr><td colspan="7">No hay promociones para mostrar.</td></tr>';
    return;
  }

  setTotalRegistrosReporteServicios(items.length);
  tbody.innerHTML = items.map(function (raw) {
    var item = normalizarReportePromocionItem(raw) || {};
    var estado = item.activo
      ? '<span class="admin-estado-badge activo">Activo</span>'
      : '<span class="admin-estado-badge inactivo">Inactivo</span>';

    var fechaInicioTexto = formatearFechaSoloAdmin(item.fechaInicio);
    var fechaFinTexto = formatearFechaSoloAdmin(item.fechaFin);

    return [
      '<tr>',
      '<td>' + escapeHtml(item.nombre || '') + '</td>',
      '<td>' + escapeHtml(item.tipoPromocion || '') + '</td>',
      '<td>' + escapeHtml(item.beneficio || '') + '</td>',
      '<td>' + escapeHtml(fechaInicioTexto || 'No disponible') + '</td>',
      '<td>' + escapeHtml(fechaFinTexto || 'No disponible') + '</td>',
      '<td>' + estado + '</td>',
      '<td>' + escapeHtml(item.vigencia || '') + '</td>',
      '</tr>'
    ].join('');
  }).join('');
}

function renderReporteReservasTabla(items) {
  var tbody = document.getElementById('admin-reportes-lista-body');
  if (!tbody) return;

  if (!Array.isArray(items) || !items.length) {
    setTotalRegistrosReporteServicios(0);
    tbody.innerHTML = '<tr><td colspan="6">No hay reservas para mostrar.</td></tr>';
    return;
  }

  setTotalRegistrosReporteServicios(items.length);
  tbody.innerHTML = items.map(function (item) {
    var estado = String((item && item.estado) || '').trim();
    var badge = estado ? ('<span class="admin-estado-badge">' + escapeHtml(estado) + '</span>') : 'N/D';

    return [
      '<tr>',
      '<td>' + escapeHtml(item && item.idReserva != null ? item.idReserva : '') + '</td>',
      '<td>' + escapeHtml((item && item.servicio) || '') + '</td>',
      '<td>' + escapeHtml((item && item.usuario) || ((item && item.correo) || '')) + '</td>',
      '<td>' + escapeHtml(((item && item.fechaActividad) || '') + ((item && item.horaInicio) ? (' ' + item.horaInicio) : '')) + '</td>',
      '<td>' + badge + '</td>',
      '<td>' + escapeHtml((item && item.fechaCreacion) || '') + '</td>',
      '</tr>'
    ].join('');
  }).join('');
}

function renderReporteUsuariosTabla(items) {
  var tbody = document.getElementById('admin-reportes-lista-body');
  if (!tbody) return;

  if (!Array.isArray(items) || !items.length) {
    setTotalRegistrosReporteServicios(0);
    tbody.innerHTML = '<tr><td colspan="4">No hay usuarios para mostrar.</td></tr>';
    return;
  }

  setTotalRegistrosReporteServicios(items.length);
  tbody.innerHTML = items.map(function (raw) {
    var item = normalizarReporteUsuarioItem(raw) || {};
    var estado = item.activo
      ? '<span class="admin-estado-badge activo">Activo</span>'
      : '<span class="admin-estado-badge inactivo">Inactivo</span>';

    return [
      '<tr>',
      '<td>' + escapeHtml(item.nombreCompleto || '') + '</td>',
      '<td>' + escapeHtml(item.correo || '') + '</td>',
      '<td>' + escapeHtml(item.rol || '') + '</td>',
      '<td>' + estado + '</td>',
      '</tr>'
    ].join('');
  }).join('');
}

function cargarReporteAdmin(forzar) {
  var tipo = obtenerTipoReporteSeleccionado();
  if (!forzar && adminReportsState.cargadoInicial && adminReportsState.ultimoTipo === tipo) {
    return Promise.resolve();
  }

  adminReportsState.requestId += 1;
  var requestId = adminReportsState.requestId;

  adminReportsState.cargando = true;
  adminReportsState.items = [];
  setBotonReporteServiciosCargando(true);
  actualizarEstadoBotonExportarReporteServicios();
  setMensajeReportes('Cargando reporte...', false);

  var tbody = document.getElementById('admin-reportes-lista-body');
  if (tbody) {
    if (tipo === 'promociones') tbody.innerHTML = '<tr><td colspan="7">Cargando reporte...</td></tr>';
    else if (tipo === 'reservas') tbody.innerHTML = '<tr><td colspan="6">Cargando reporte...</td></tr>';
    else tbody.innerHTML = '<tr><td colspan="4">Cargando reporte...</td></tr>';
  }
  setTotalRegistrosReporteServicios(0);

  return fetch(construirQueryReporteActual(false, tipo), { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        throw new Error('No tienes permisos para consultar reportes.');
      }

      return resp.text().then(function (text) {
        if (esRespuestaHtmlDeLogin(resp.headers.get('content-type'), text)) {
          window.location.href = '/login.html';
          return null;
        }

        var data = null;
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = null;
        }

        if (!resp.ok) {
          throw new Error((data && data.message) || 'No fue posible generar el reporte.');
        }

        return data;
      });
    })
    .then(function (data) {
      if (requestId !== adminReportsState.requestId) return;
      if (!data) return;

      var success = data.success != null ? !!data.success : !!data.Success;
      var items = Array.isArray(data.items) ? data.items : (Array.isArray(data.Items) ? data.Items : []);
      var resumen = data.resumen != null ? data.resumen : data.Resumen;

      if (!success) {
        throw new Error((data && data.message) || 'No fue posible generar el reporte.');
      }

      if (tipo === 'promociones') {
        var promociones = [];
        for (var i = 0; i < items.length; i += 1) {
          var promo = normalizarReportePromocionItem(items[i]);
          if (promo) promociones.push(promo);
        }

        adminReportsState.items = promociones;
        resetPaginacionReportes();
        renderPaginaReporteActual();
        renderResumenReportePromociones(promociones, resumen);
        setMensajeReportes(promociones.length ? '' : 'No hay coincidencias para el reporte de promociones.', false);
      } else if (tipo === 'reservas') {
        adminReportsState.items = items;
        resetPaginacionReportes();
        renderPaginaReporteActual();
        renderResumenReporteReservas(items, resumen);
        setMensajeReportes(items.length ? '' : 'No hay coincidencias para el reporte de reservas.', false);
      } else if (tipo === 'usuarios') {
        var usuarios = [];
        for (var j = 0; j < items.length; j += 1) {
          var usuario = normalizarReporteUsuarioItem(items[j]);
          if (usuario) usuarios.push(usuario);
        }

        adminReportsState.items = usuarios;
        resetPaginacionReportes();
        renderPaginaReporteActual();
        renderResumenReporteUsuarios(usuarios, resumen);
        setMensajeReportes(usuarios.length ? '' : 'No hay coincidencias para el reporte de usuarios.', false);
      } else {
        var normalizados = [];
        for (var k = 0; k < items.length; k += 1) {
          var servicio = normalizarReporteServicioItem(items[k]);
          if (servicio) normalizados.push(servicio);
        }

        adminReportsState.items = normalizados;
        resetPaginacionReportes();
        renderPaginaReporteActual();
        renderResumenReporteServicios(normalizados, resumen);
        setMensajeReportes(normalizados.length ? '' : 'No hay coincidencias para el reporte de servicios.', false);
      }

      adminReportsState.cargadoInicial = true;
      adminReportsState.ultimoTipo = tipo;
      actualizarEstadoBotonFiltrosReportes();
    })
    .catch(function (err) {
      if (requestId !== adminReportsState.requestId) return;

      adminReportsState.items = [];
      resetPaginacionReportes();
      renderControlesPaginacion('admin-reportes-pagination', { pagina: 1, totalPaginas: 1, pageSize: adminReportsState.paginacionDetalle.pageSize, total: 0, desde: 0, hasta: 0 }, false);
      if (tbody) {
        if (tipo === 'promociones') tbody.innerHTML = '<tr><td colspan="7">No fue posible cargar el reporte de promociones.</td></tr>';
        else if (tipo === 'reservas') tbody.innerHTML = '<tr><td colspan="6">No fue posible cargar el reporte de reservas.</td></tr>';
        else if (tipo === 'usuarios') tbody.innerHTML = '<tr><td colspan="4">No fue posible cargar el reporte de usuarios.</td></tr>';
        else tbody.innerHTML = '<tr><td colspan="4">No fue posible cargar el reporte de servicios.</td></tr>';
      }
      if (tipo === 'promociones') renderResumenReportePromociones([], null);
      else if (tipo === 'reservas') renderResumenReporteReservas([], null);
      else if (tipo === 'usuarios') renderResumenReporteUsuarios([], null);
      else renderResumenReporteServicios([], null);
      setMensajeReportes((err && err.message) || 'No fue posible cargar el reporte.', true);
    })
    .finally(function () {
      if (requestId !== adminReportsState.requestId) return;
      adminReportsState.cargando = false;
      setBotonReporteServiciosCargando(false);
      actualizarEstadoBotonExportarReporteServicios();
    });
}

function cargarReporteServiciosAdmin(forzar) {
  return cargarReporteAdmin(forzar);
}

function abrirModalEditarServicio(disparador) {
  var modal = document.getElementById('admin-servicio-editar-modal');
  if (!modal) return;
  adminServicesState.edit.ultimoFoco = disparador || document.activeElement || null;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  adminServicesState.edit.abierto = true;
}

function cerrarModalEditarServicio() {
  var modal = document.getElementById('admin-servicio-editar-modal');
  if (!modal) return;

  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  adminServicesState.edit.abierto = false;
  adminServicesState.edit.enviando = false;
  adminServicesState.edit.idServicio = 0;
  adminServicesState.edit.imagenActualUrl = '';
  adminServicesState.edit.imagenNueva = null;
  adminServicesState.edit.quitarImagen = false;
  limpiarPreviewImagenServicioEdicion();
  setMensajeServicioEdicion('', false);

  var form = document.getElementById('admin-servicio-editar-form');
  if (form) form.reset();
  actualizarVistaPreviaServicioEdicion();

  var foco = adminServicesState.edit.ultimoFoco;
  adminServicesState.edit.ultimoFoco = null;
  if (foco && typeof foco.focus === 'function') {
    try { foco.focus(); } catch (_) { }
  }
}

function limpiarPreviewImagenServicioEdicion() {
  if (adminServicesState.edit.previewUrl) {
    try {
      URL.revokeObjectURL(adminServicesState.edit.previewUrl);
    } catch (_) { }
  }

  adminServicesState.edit.previewUrl = '';
  adminServicesState.edit.imagenNueva = null;

  var input = document.getElementById('editar-servicio-imagen-input');
  if (input) input.value = '';

  var previewImg = document.getElementById('editar-servicio-imagen-preview-img');
  var sinImagen = document.getElementById('editar-servicio-vista-previa-sin-imagen');
  if (previewImg) previewImg.removeAttribute('src');
  if (sinImagen) sinImagen.hidden = false;
}

function actualizarVistaPreviaServicioEdicion() {
  var nombre = document.getElementById('editar-servicio-nombre');
  var categoria = document.getElementById('editar-servicio-categoria');
  var descripcion = document.getElementById('editar-servicio-descripcion');
  var precio = document.getElementById('editar-servicio-precio');

  var nombreOut = document.getElementById('editar-servicio-vista-previa-nombre');
  var categoriaOut = document.getElementById('editar-servicio-vista-previa-categoria');
  var precioOut = document.getElementById('editar-servicio-vista-previa-precio');
  var descripcionOut = document.getElementById('editar-servicio-vista-previa-descripcion');

  var nombreTxt = nombre ? (nombre.value || '').trim() : '';
  var categoriaTxt = '';
  if (categoria && categoria.options && categoria.selectedIndex >= 0) {
    categoriaTxt = (categoria.options[categoria.selectedIndex].textContent || '').trim();
    if ((categoria.value || '').trim() === '') categoriaTxt = '';
  }
  var descripcionTxt = descripcion ? (descripcion.value || '').trim() : '';
  var precioTxt = precio ? (precio.value || '').trim() : '';

  if (nombreOut) nombreOut.textContent = nombreTxt || 'Nombre del servicio';
  if (categoriaOut) categoriaOut.textContent = 'Categoría: ' + (categoriaTxt || '-');
  if (precioOut) precioOut.textContent = formatearPrecioServicioVistaPrevia(precioTxt);
  if (descripcionOut) descripcionOut.textContent = descripcionTxt || 'Descripción del servicio.';
}

function refrescarVistaImagenEdicion() {
  var previewImg = document.getElementById('editar-servicio-imagen-preview-img');
  var sinImagen = document.getElementById('editar-servicio-vista-previa-sin-imagen');
  var btnQuitar = document.getElementById('editar-servicio-imagen-quitar');

  if (!previewImg) return;

  var src = '';
  if (adminServicesState.edit.imagenNueva && adminServicesState.edit.previewUrl) {
    src = adminServicesState.edit.previewUrl;
  } else if (!adminServicesState.edit.quitarImagen && adminServicesState.edit.imagenActualUrl) {
    src = adminServicesState.edit.imagenActualUrl;
  }

  if (src) {
    previewImg.src = src;
    if (sinImagen) sinImagen.hidden = true;
  } else {
    previewImg.removeAttribute('src');
    if (sinImagen) sinImagen.hidden = false;
  }

  if (btnQuitar) {
    btnQuitar.hidden = !src;
  }

  actualizarVistaPreviaServicioEdicion();
}

function setFormularioEdicionBloqueado(bloqueado) {
  adminServicesState.edit.enviando = !!bloqueado;

  var ids = [
    'editar-servicio-nombre',
    'editar-servicio-categoria',
    'editar-servicio-precio',
    'editar-servicio-estado',
    'editar-servicio-orden',
    'editar-servicio-descripcion',
    'editar-servicio-imagen-input',
    'editar-servicio-imagen-seleccionar',
    'editar-servicio-imagen-quitar',
    'admin-servicio-editar-cancelar',
    'admin-servicio-editar-cerrar',
    'admin-servicio-editar-guardar'
  ];

  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.disabled = !!bloqueado;
  });
}

function cargarDetalleServicioParaEdicion(idProducto) {
  setMensajeServicioEdicion('Cargando servicio...', false);
  setFormularioEdicionBloqueado(true);

  return fetch('/api/admin/service-detail.ashx?id=' + encodeURIComponent(String(idProducto)), {
    method: 'GET',
    credentials: 'same-origin'
  })
    .then(function (resp) {
      return resp.text().then(function (text) {
        if (esRespuestaHtmlDeLogin(resp.headers.get('content-type'), text)) {
          window.location.href = '/login.html';
          return null;
        }

        var data = null;
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = null;
        }

        return { status: resp.status, data: data };
      });
    })
    .then(function (result) {
      if (!result) return;

      if (result.status === 401) {
        window.location.href = '/login.html';
        return;
      }

      if (result.status === 403) {
        setMensajeServicioEdicion('No autorizado para editar servicios.', true);
        return;
      }

      if (result.status === 404) {
        setMensajeServicioEdicion('Servicio no encontrado.', true);
        return;
      }

      if (result.status >= 400) {
        setMensajeServicioEdicion((result.data && result.data.message) || 'No fue posible cargar el servicio.', true);
        return;
      }

      var servicioRaw = result.data && result.data.servicio;
      var s = normalizarServicioListado(servicioRaw) || {};
      var idCategoria = servicioRaw && (servicioRaw.idCategoria != null ? servicioRaw.idCategoria : servicioRaw.IdCategoria);
      var descripcion = servicioRaw && (servicioRaw.descripcion != null ? servicioRaw.descripcion : servicioRaw.Descripcion);
      var ordenCatalogo = servicioRaw && (servicioRaw.ordenCatalogo != null ? servicioRaw.ordenCatalogo : servicioRaw.OrdenCatalogo);

      adminServicesState.edit.idServicio = s.idProducto || 0;
      adminServicesState.edit.imagenActualUrl = s.imagenPrincipal || '';
      adminServicesState.edit.quitarImagen = false;
      limpiarPreviewImagenServicioEdicion();

      var idEl = document.getElementById('editar-servicio-id');
      var nombreEl = document.getElementById('editar-servicio-nombre');
      var catEl = document.getElementById('editar-servicio-categoria');
      var precioEl = document.getElementById('editar-servicio-precio');
      var estadoEl = document.getElementById('editar-servicio-estado');
      var ordenEl = document.getElementById('editar-servicio-orden');
      var descripcionEl = document.getElementById('editar-servicio-descripcion');

      if (idEl) idEl.value = String(s.idProducto || '');
      if (nombreEl) nombreEl.value = s.nombre || '';
      if (catEl) catEl.value = idCategoria != null ? String(idCategoria) : '';
      if (precioEl) precioEl.value = s.precio != null ? String(s.precio) : '';
      if (estadoEl) estadoEl.value = s.activo ? '1' : '0';
      if (ordenEl) ordenEl.value = ordenCatalogo != null ? String(ordenCatalogo) : '0';
      if (descripcionEl) descripcionEl.value = descripcion || '';

      refrescarVistaImagenEdicion();
      setMensajeServicioEdicion('', false);
    })
    .catch(function () {
      setMensajeServicioEdicion('No fue posible cargar el detalle del servicio.', true);
    })
    .finally(function () {
      setFormularioEdicionBloqueado(false);
    });
}

function abrirEdicionServicio(idProducto, disparador) {
  if (!idProducto || idProducto <= 0) return;
  abrirModalEditarServicio(disparador || null);
  cargarDetalleServicioParaEdicion(idProducto);
}

function obtenerPayloadEdicionServicio() {
  var idEl = document.getElementById('editar-servicio-id');
  var nombreEl = document.getElementById('editar-servicio-nombre');
  var categoriaEl = document.getElementById('editar-servicio-categoria');
  var descripcionEl = document.getElementById('editar-servicio-descripcion');
  var precioEl = document.getElementById('editar-servicio-precio');
  var estadoEl = document.getElementById('editar-servicio-estado');
  var ordenEl = document.getElementById('editar-servicio-orden');

  var idProductoValue = idEl ? (idEl.value || '').trim() : '';
  var nombre = nombreEl ? (nombreEl.value || '').trim() : '';
  var descripcion = descripcionEl ? (descripcionEl.value || '').trim() : '';
  var categoriaValue = categoriaEl ? (categoriaEl.value || '').trim() : '';
  var precioValue = precioEl ? (precioEl.value || '').trim() : '';
  var estadoValue = estadoEl ? (estadoEl.value || '').trim() : '1';
  var ordenValue = ordenEl ? (ordenEl.value || '').trim() : '0';

  var idProducto = parseInt(idProductoValue, 10);
  if (!idProducto || idProducto <= 0) return { ok: false, message: 'El servicio seleccionado no es válido.' };

  if (!nombre) return { ok: false, message: 'El nombre del servicio es obligatorio.' };
  if (nombre.length > 150) return { ok: false, message: 'El nombre del servicio no puede superar 150 caracteres.' };

  if (!categoriaValue) return { ok: false, message: 'Debes seleccionar una categoría.' };
  var idCategoria = parseInt(categoriaValue, 10);
  if (!idCategoria || idCategoria <= 0) return { ok: false, message: 'La categoría seleccionada no es válida.' };

  if (!descripcion) return { ok: false, message: 'La descripción del servicio es obligatoria.' };
  if (descripcion.length > 1000) return { ok: false, message: 'La descripción no puede superar 1000 caracteres.' };

  if (!precioValue) return { ok: false, message: 'El precio es obligatorio.' };
  var precio = Number(precioValue.replace(',', '.'));
  if (!Number.isFinite(precio) || precio < 0) {
    return { ok: false, message: 'El precio debe ser un número válido y no negativo.' };
  }

  if (!/^[-]?\d+$/.test(ordenValue)) {
    return { ok: false, message: 'El orden de visualización debe ser un número entero.' };
  }

  var ordenCatalogo = parseInt(ordenValue, 10);
  if (ordenCatalogo < 0) {
    return { ok: false, message: 'El orden de visualización no puede ser negativo.' };
  }

  return {
    ok: true,
    payload: {
      idProducto: idProducto,
      nombre: nombre,
      idCategoria: idCategoria,
      descripcion: descripcion,
      precio: precio,
      activo: estadoValue === '1',
      ordenCatalogo: ordenCatalogo,
      quitarImagen: !!adminServicesState.edit.quitarImagen
    }
  };
}

function enviarEdicionServicio(e) {
  e.preventDefault();
  if (adminServicesState.edit.enviando) return;

  var validacion = obtenerPayloadEdicionServicio();
  if (!validacion.ok) {
    setMensajeServicioEdicion(validacion.message, true);
    return;
  }

  if (!adminServicesState.csrfToken) {
    setMensajeServicioEdicion('No fue posible validar la sesión de seguridad. Recarga la sección de servicios.', true);
    return;
  }

  var validacionImagen = validarArchivoImagenServicio(adminServicesState.edit.imagenNueva);
  if (!validacionImagen.ok) {
    setMensajeServicioEdicion(validacionImagen.message, true);
    return;
  }

  setFormularioEdicionBloqueado(true);
  setMensajeServicioEdicion('Guardando cambios...', false);

  var body;
  var headers = {
    'X-CSRF-Token': adminServicesState.csrfToken
  };

  if (adminServicesState.edit.imagenNueva) {
    var fd = new FormData();
    fd.append('metadata', JSON.stringify(validacion.payload));
    fd.append('imagenServicio', adminServicesState.edit.imagenNueva, adminServicesState.edit.imagenNueva.name || 'imagen');
    body = fd;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(validacion.payload);
  }

  fetch('/api/admin/service-update.ashx', {
    method: 'POST',
    credentials: 'same-origin',
    headers: headers,
    body: body
  })
    .then(function (resp) {
      return resp.text().then(function (text) {
        if (esRespuestaHtmlDeLogin(resp.headers.get('content-type'), text)) {
          window.location.href = '/login.html';
          return null;
        }

        var data = null;
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = null;
        }

        return { status: resp.status, data: data };
      });
    })
    .then(function (result) {
      if (!result) return;

      var status = result.status;
      var data = result.data || {};

      if (status === 200) {
        setMensajeServicios(data.message || 'Servicio actualizado correctamente.', false);
        cerrarModalEditarServicio();
        cargarListadoServicios();
        return;
      }

      if (status === 400) {
        setMensajeServicioEdicion(data.message || 'Hay datos inválidos en el formulario.', true);
        return;
      }

      if (status === 401) {
        window.location.href = '/login.html';
        return;
      }

      if (status === 403) {
        setMensajeServicioEdicion('No autorizado o validación de seguridad inválida.', true);
        return;
      }

      if (status === 404) {
        setMensajeServicioEdicion(data.message || 'Servicio no encontrado.', true);
        return;
      }

      if (status === 409) {
        setMensajeServicioEdicion(data.message || 'Ya existe un servicio con ese nombre en la categoría.', true);
        return;
      }

      if (status >= 500) {
        setMensajeServicioEdicion('Ocurrió un error interno. Intenta nuevamente.', true);
        return;
      }

      setMensajeServicioEdicion(data.message || 'No fue posible actualizar el servicio.', true);
    })
    .catch(function () {
      setMensajeServicioEdicion('No fue posible conectar con el servidor.', true);
    })
    .finally(function () {
      setFormularioEdicionBloqueado(false);
    });
}

function initEdicionServicios() {
  var tbody = document.getElementById('admin-servicios-lista-body');
  if (tbody && tbody.dataset.editBound !== '1') {
    tbody.dataset.editBound = '1';
    tbody.addEventListener('click', function (e) {
      var target = e.target;
      var trigger = target && target.closest ? target.closest('[data-admin-editar-servicio]') : null;
      if (!trigger) return;

      var id = parseInt(trigger.getAttribute('data-admin-editar-servicio') || '0', 10);
      if (!id || id <= 0) return;
      abrirEdicionServicio(id, trigger);
    });
  }

  var form = document.getElementById('admin-servicio-editar-form');
  if (form) {
    form.addEventListener('submit', enviarEdicionServicio);
  }

  var btnCerrar = document.getElementById('admin-servicio-editar-cerrar');
  var btnCancelar = document.getElementById('admin-servicio-editar-cancelar');
  var modal = document.getElementById('admin-servicio-editar-modal');

  if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalEditarServicio);
  if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalEditarServicio);
  if (modal) {
    modal.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.getAttribute('data-admin-servicio-modal-cerrar') === '1' && !adminServicesState.edit.enviando) {
        cerrarModalEditarServicio();
      }
    });
  }

  var btnSel = document.getElementById('editar-servicio-imagen-seleccionar');
  var inputImg = document.getElementById('editar-servicio-imagen-input');
  var btnQuitar = document.getElementById('editar-servicio-imagen-quitar');

  if (btnSel && inputImg) {
    btnSel.addEventListener('click', function () {
      if (adminServicesState.edit.enviando) return;
      inputImg.click();
    });
  }

  if (inputImg) {
    inputImg.addEventListener('change', function (e) {
      var input = e && e.target ? e.target : null;
      if (!input || !input.files || !input.files.length) {
        return;
      }

      var file = input.files[0];
      var validacion = validarArchivoImagenServicio(file);
      if (!validacion.ok) {
        input.value = '';
        adminServicesState.edit.imagenNueva = null;
        setMensajeServicioEdicion(validacion.message, true);
        refrescarVistaImagenEdicion();
        return;
      }

      if (adminServicesState.edit.previewUrl) {
        try {
          URL.revokeObjectURL(adminServicesState.edit.previewUrl);
        } catch (_) { }
      }

      adminServicesState.edit.previewUrl = URL.createObjectURL(file);
      adminServicesState.edit.imagenNueva = file;
      adminServicesState.edit.quitarImagen = false;
      setMensajeServicioEdicion('', false);
      refrescarVistaImagenEdicion();
    });
  }

  if (btnQuitar) {
    btnQuitar.addEventListener('click', function () {
      if (adminServicesState.edit.enviando) return;

      if (adminServicesState.edit.previewUrl) {
        try {
          URL.revokeObjectURL(adminServicesState.edit.previewUrl);
        } catch (_) { }
      }

      adminServicesState.edit.previewUrl = '';
      adminServicesState.edit.imagenNueva = null;
      adminServicesState.edit.quitarImagen = true;

      if (inputImg) inputImg.value = '';
      refrescarVistaImagenEdicion();
      setMensajeServicioEdicion('La fotografía actual se eliminará al guardar.', false);
    });
  }


  ['editar-servicio-nombre', 'editar-servicio-descripcion', 'editar-servicio-precio', 'editar-servicio-categoria'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, actualizarVistaPreviaServicioEdicion);
  });
  actualizarVistaPreviaServicioEdicion();
}

function initRegistroServicios() {
  construirLayoutServiciosAdmin();

  var form = document.getElementById('admin-servicios-form');
  if (form) {
    form.addEventListener('submit', enviarFormularioServicios);
  }

  document.removeEventListener('keydown', manejarTecladoModalCrearServicio, true);
  document.addEventListener('keydown', manejarTecladoModalCrearServicio, true);

  var btnAgregar = document.getElementById('admin-servicio-crear-toggle');
  var btnCerrarModal = document.getElementById('admin-servicio-crear-cerrar');
  var modalCrear = document.getElementById('admin-servicio-crear-modal');

  if (btnAgregar) {
    btnAgregar.addEventListener('click', function () {
      if (adminServicesState.enviando) return;
      abrirModalCrearServicio(btnAgregar);
    });
  }

  if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', cerrarModalCrearServicio);
  }

  if (modalCrear) {
    modalCrear.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.getAttribute('data-admin-servicio-crear-cerrar') === '1') {
        cerrarModalCrearServicio();
      }
    });
  }

  var btnLimpiar = document.getElementById('servicio-limpiar');
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', function () {
      if (adminServicesState.enviando) return;
      limpiarFormularioServicios();
      if (adminServicesState.modalCrear && adminServicesState.modalCrear.abierto) {
        cerrarModalCrearServicio();
      }
    });
  }

  var btnSeleccionar = document.getElementById('servicio-imagen-seleccionar');
  var inputImagen = document.getElementById('servicio-imagen-input');
  var btnQuitar = document.getElementById('servicio-imagen-quitar');

  if (btnSeleccionar && inputImagen) {
    btnSeleccionar.addEventListener('click', function () {
      if (adminServicesState.enviando) return;
      inputImagen.click();
    });
  }

  if (inputImagen) {
    inputImagen.addEventListener('change', onSeleccionImagenServicio);
  }

  if (btnQuitar) {
    btnQuitar.addEventListener('click', function () {
      if (adminServicesState.enviando) return;
      limpiarPreviewImagenServicio();
      actualizarVistaPreviaServicioCrear();
      setMensajeServicios('', false);
    });
  }

  ['servicio-nombre', 'servicio-descripcion', 'servicio-precio', 'servicio-categoria'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, actualizarVistaPreviaServicioCrear);
  });
  actualizarVistaPreviaServicioCrear();

  var filtroBusqueda = document.getElementById('admin-servicios-filtro-busqueda');
  var filtroCategoria = document.getElementById('admin-servicios-filtro-categoria');
  var filtroEstado = document.getElementById('admin-servicios-filtro-estado');
  var btnAnterior = document.getElementById('admin-servicios-paginacion-anterior');
  var btnSiguiente = document.getElementById('admin-servicios-paginacion-siguiente');

  function refrescarCategoriaFiltro() {
    if (!filtroCategoria) return;
    if (!Array.isArray(adminServicesState.categorias) || adminServicesState.categorias.length === 0) return;

    var valorActual = filtroCategoria.value || '';
    var opciones = ['<option value="">Todas las categorías</option>'];

    adminServicesState.categorias.forEach(function (c) {
      if (!c) return;
      var id = c.idCategoria != null ? c.idCategoria : c.IdCategoria;
      var nombre = c.nombre != null ? c.nombre : c.Nombre;
      if (!nombre) return;
      var value = String(nombre);
      var selected = valorActual === value ? ' selected' : '';
      opciones.push('<option value="' + escapeHtml(value) + '"' + selected + '>' + escapeHtml(nombre) + '</option>');
    });

    filtroCategoria.innerHTML = opciones.join('');
  }

  refrescarCategoriaFiltro();

  if (filtroBusqueda) {
    filtroBusqueda.addEventListener('input', function () {
      adminServicesState.paginaActual = 1;
      cargarListadoServicios({ resetPagina: true });
    });
  }

  if (filtroCategoria) {
    filtroCategoria.addEventListener('change', function () {
      adminServicesState.paginaActual = 1;
      cargarListadoServicios({ resetPagina: true });
    });
  }

  if (filtroEstado) {
    filtroEstado.addEventListener('change', function () {
      adminServicesState.paginaActual = 1;
      cargarListadoServicios({ resetPagina: true });
    });
  }

  if (btnAnterior) {
    btnAnterior.addEventListener('click', function () {
      if (adminServicesState.cargandoListado) return;
      if ((adminServicesState.paginaActual || 1) <= 1) return;
      adminServicesState.paginaActual -= 1;
      cargarListadoServicios();
    });
  }

  if (btnSiguiente) {
    btnSiguiente.addEventListener('click', function () {
      if (adminServicesState.cargandoListado) return;
      var maxPage = Math.max(1, Math.ceil((adminServicesState.total || 0) / (adminServicesState.pageSize || 10)));
      if ((adminServicesState.paginaActual || 1) >= maxPage) return;
      adminServicesState.paginaActual += 1;
      cargarListadoServicios();
    });
  }
}

function initAdminNav() {
  var botones = document.querySelectorAll('.admin-sidebar button[data-admin-seccion]');
  botones.forEach(function (boton) {
    boton.addEventListener('click', function () {
      var clave = boton.getAttribute('data-admin-seccion');
      if (!clave) return;
      mostrarSeccionAdmin(clave);
    });
  });
}

function setMensajeDashboard(texto, esError) {
  var msg = document.getElementById('admin-dashboard-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setBotonDashboardCargando(cargando) {
  var btn = document.getElementById('admin-dashboard-aplicar');
  if (!btn) return;
  btn.disabled = !!cargando;
  btn.textContent = cargando ? 'Actualizando...' : 'Aplicar filtros';
}

function setKpiDashboard(id, value, suffix) {
  var el = document.getElementById(id);
  if (!el) return;
  var numero = Number(value);
  if (!Number.isFinite(numero)) numero = 0;
  el.textContent = String(numero) + (suffix || '');
}

function normalizarSerieDashboard(items) {
  if (!Array.isArray(items)) return [];
  return items.map(function (item) {
    if (!item) return null;
    return {
      etiqueta: item.etiqueta != null ? item.etiqueta : item.Etiqueta,
      valor: Number(item.valor != null ? item.valor : item.Valor || 0),
      capacidad: Number(item.capacidad != null ? item.capacidad : item.Capacidad || 0),
      porcentaje: item.porcentaje != null ? Number(item.porcentaje) : (item.Porcentaje != null ? Number(item.Porcentaje) : null)
    };
  }).filter(function (item) {
    return item && item.etiqueta;
  });
}

function formatoEtiquetaMesDashboard(texto) {
  var valor = String(texto || '').trim();
  if (!/^\d{4}-\d{2}$/.test(valor)) return valor;
  var partes = valor.split('-');
  var anio = Number(partes[0]);
  var mes = Number(partes[1]);
  if (!Number.isFinite(anio) || !Number.isFinite(mes) || mes < 1 || mes > 12) return valor;
  var fecha = new Date(anio, mes - 1, 1);
  return fecha.toLocaleDateString('es-CR', { month: 'short', year: 'numeric' });
}

var adminDashboardCanvasMap = {
  reservasPeriodo: 'grafico-reservas-periodo',
  serviciosCategoria: 'grafico-servicios-categoria',
  ocupacion: 'grafico-ocupacion-horarios',
  usuariosRol: 'grafico-usuarios-rol'
};

function destruirChartPorCanvasDashboard(canvasId) {
  if (!canvasId || typeof Chart === 'undefined') return;
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var chartCanvas = null;
  try {
    chartCanvas = Chart.getChart(canvas);
  } catch (_) {
    chartCanvas = null;
  }
  if (!chartCanvas) return;
  try {
    chartCanvas.destroy();
  } catch (_) { }
}

function destruirChartDashboard(key) {
  var charts = adminDashboardState.charts || {};
  var chartRef = charts[key] || null;
  var canvasId = adminDashboardCanvasMap[key] || '';

  if (chartRef) {
    try {
      chartRef.destroy();
    } catch (_) { }
  }

  destruirChartPorCanvasDashboard(canvasId);
  charts[key] = null;
}

function destruirChartsDashboard() {
  destruirChartDashboard('reservasPeriodo');
  destruirChartDashboard('serviciosCategoria');
  destruirChartDashboard('reservasEstado');
  destruirChartDashboard('ocupacion');
  destruirChartDashboard('usuariosRol');
}

function obtenerCanvasContext(id) {
  var canvas = document.getElementById(id);
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  return canvas.getContext('2d');
}

function alternarVacioDashboard(canvasId, emptyId, hasData) {
  var canvas = document.getElementById(canvasId);
  var empty = document.getElementById(emptyId);
  var wrap = canvas && canvas.closest ? canvas.closest('.admin-chart-wrap') : null;

  if (wrap) wrap.hidden = !hasData;
  if (canvas) canvas.style.display = hasData ? 'block' : 'none';
  if (empty) empty.hidden = !!hasData;
}

function mostrarPeriodoAplicadoDashboard(periodo) {
  var el = document.getElementById('admin-dashboard-periodo-aplicado');
  if (!el) return;

  var desde = periodo && periodo.desde ? String(periodo.desde) : '';
  var hasta = periodo && periodo.hasta ? String(periodo.hasta) : '';

  if (!desde || !hasta) {
    el.textContent = 'Período aplicado: —';
    return;
  }

  var d = new Date(desde + 'T00:00:00');
  var h = new Date(hasta + 'T00:00:00');
  if (isNaN(d.getTime()) || isNaN(h.getTime())) {
    el.textContent = 'Período aplicado: ' + desde + ' al ' + hasta;
    return;
  }

  var dMes = d.toLocaleDateString('es-CR', { month: 'long' });
  var hMes = h.toLocaleDateString('es-CR', { month: 'long' });
  var anio = h.getFullYear();
  el.textContent = 'Período aplicado: ' + dMes + ' – ' + hMes + ' ' + anio;
}

function setReintentoDashboardVisible(visible) {
  var btn = document.getElementById('admin-dashboard-reintentar');
  if (!btn) return;
  btn.hidden = !visible;
  btn.disabled = !!adminDashboardState.cargando;
}

function toMonthKeyDashboard(texto) {
  var valor = String(texto || '').trim();
  if (/^\d{4}-\d{2}$/.test(valor)) return valor;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor.substring(0, 7);
  return '';
}

function construirSerieMensualCompletaDashboard(serie, filtros) {
  var items = Array.isArray(serie) ? serie : [];
  var mapa = {};
  items.forEach(function (item) {
    var key = toMonthKeyDashboard(item && item.etiqueta);
    if (!key) return;
    mapa[key] = Number.isFinite(Number(item.valor)) ? Number(item.valor) : 0;
  });

  var desde = String((filtros && filtros.desde) || '').trim();
  var hasta = String((filtros && filtros.hasta) || '').trim();
  if (!desde || !hasta || !/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
    return items;
  }

  var inicio = new Date(desde + 'T00:00:00');
  var fin = new Date(hasta + 'T00:00:00');
  if (!(inicio instanceof Date) || isNaN(inicio.getTime()) || !(fin instanceof Date) || isNaN(fin.getTime()) || inicio > fin) {
    return items;
  }

  var cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  var ultimo = new Date(fin.getFullYear(), fin.getMonth(), 1);
  var salida = [];

  while (cursor <= ultimo) {
    var m = cursor.getMonth() + 1;
    var keyMes = cursor.getFullYear() + '-' + (m < 10 ? ('0' + m) : String(m));
    salida.push({ etiqueta: keyMes, valor: mapa[keyMes] || 0, porcentaje: null });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return salida;
}

function colorEstadoReserva(label) {
  var estado = String(label || '').trim().toUpperCase();
  if (estado === 'CONFIRMADA') return '#10b981';
  if (estado === 'CANCELADA') return '#ff7f6a';
  if (estado === 'PENDIENTE') return '#f5b239';
  return '#8fa3b2';
}

function formatearNumero(valor) {
  var n = Number(valor);
  if (!Number.isFinite(n)) n = 0;
  return n.toLocaleString('es-CR');
}

function nombreMesDashboard(year, month, formato) {
  var y = Number(year);
  var m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return '';
  var fecha = new Date(y, m - 1, 1);
  if (formato === 'corto') {
    return fecha.toLocaleDateString('es-CR', { month: 'short' }).replace('.', '');
  }
  return fecha.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
}

function parseMonthKeyDashboard(key) {
  var valor = String(key || '').trim();
  if (!/^\d{4}-\d{2}$/.test(valor)) return null;
  var partes = valor.split('-');
  var year = Number(partes[0]);
  var month = Number(partes[1]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { key: valor, year: year, month: month };
}

function construirClavePeriodoDashboard() {
  return String(adminDashboardState.filtros.desde || '') + '|' + String(adminDashboardState.filtros.hasta || '');
}

function construirClavesMesPeriodoDashboard() {
  var desde = String(adminDashboardState.filtros.desde || '').trim();
  var hasta = String(adminDashboardState.filtros.hasta || '').trim();
  var salida = [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
    return salida;
  }

  var inicio = new Date(desde + 'T00:00:00');
  var fin = new Date(hasta + 'T00:00:00');
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
    return salida;
  }

  var cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  var ultimo = new Date(fin.getFullYear(), fin.getMonth(), 1);

  while (cursor <= ultimo) {
    var m = cursor.getMonth() + 1;
    var key = cursor.getFullYear() + '-' + (m < 10 ? ('0' + m) : String(m));
    salida.push(key);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return salida;
}

function obtenerMesesVisiblesReservasDashboard(items) {
  var meses = Array.isArray(items) ? items : [];
  var seleccion = adminDashboardState.reservasMes.seleccionAplicada;
  if (!seleccion) return meses.slice();

  return meses.filter(function (item) {
    return !!seleccion[String(item.etiqueta || '')];
  });
}

function contarSeleccionReservasMes(seleccion) {
  var mapa = seleccion || {};
  return Object.keys(mapa).filter(function (key) { return !!mapa[key]; }).length;
}

function copiarSeleccionReservasMes(seleccion) {
  var copia = {};
  var origen = seleccion || {};
  Object.keys(origen).forEach(function (key) {
    if (origen[key]) copia[key] = true;
  });
  return copia;
}

function construirSeleccionTodosReservasMes() {
  var seleccion = {};
  (adminDashboardState.reservasMes.todos || []).forEach(function (item) {
    seleccion[String(item.etiqueta || '')] = true;
  });
  return seleccion;
}

function textoBotonReservasMes() {
  var toggleText = document.getElementById('admin-reservas-mes-toggle-text');
  if (!toggleText) return;

  var seleccion = adminDashboardState.reservasMes.seleccionAplicada;
  if (!seleccion) {
    toggleText.textContent = 'Todos los meses del período';
    return;
  }

  var claves = Object.keys(seleccion).filter(function (k) { return !!seleccion[k]; }).sort();
  if (claves.length === 1) {
    var dato = parseMonthKeyDashboard(claves[0]);
    toggleText.textContent = dato ? nombreMesDashboard(dato.year, dato.month, 'largo') : '1 mes seleccionado';
    return;
  }

  toggleText.textContent = String(claves.length) + ' meses seleccionados';
}

function descripcionReservasMes(items) {
  var el = document.getElementById('admin-reservas-mes-descripcion');
  if (!el) return;

  var visibles = Array.isArray(items) ? items : [];
  if (!visibles.length) {
    el.textContent = 'Sin meses disponibles en el período.';
    return;
  }

  var primero = parseMonthKeyDashboard(visibles[0].etiqueta);
  var ultimo = parseMonthKeyDashboard(visibles[visibles.length - 1].etiqueta);
  if (!primero || !ultimo) {
    el.textContent = 'Período seleccionado en el dashboard.';
    return;
  }

  if (visibles.length === 1) {
    el.textContent = 'Período: ' + nombreMesDashboard(primero.year, primero.month, 'largo') + '.';
    return;
  }

  var inicio = nombreMesDashboard(primero.year, primero.month, 'largo');
  var fin = nombreMesDashboard(ultimo.year, ultimo.month, 'largo');
  el.textContent = 'Período visible: ' + inicio + ' a ' + fin + '.';
}

function actualizarResumenReservasMes(itemsVisibles) {
  var totalEl = document.getElementById('admin-reservas-mes-total');
  var total = (Array.isArray(itemsVisibles) ? itemsVisibles : []).reduce(function (acc, item) {
    var valor = Number(item && item.valor);
    return acc + (Number.isFinite(valor) ? valor : 0);
  }, 0);

  if (totalEl) totalEl.textContent = formatearNumero(total);
  descripcionReservasMes(itemsVisibles);
}

function actualizarEstadoPanelReservasMes() {
  var aplicar = document.getElementById('admin-reservas-mes-aplicar');
  var hint = document.getElementById('admin-reservas-mes-hint');
  var total = contarSeleccionReservasMes(adminDashboardState.reservasMes.seleccionBorrador);
  var puedeAplicar = total > 0;

  if (aplicar) aplicar.disabled = !puedeAplicar;
  if (hint) {
    hint.classList.toggle('is-warning', !puedeAplicar);
    hint.textContent = puedeAplicar
      ? 'Selecciona uno o varios meses y aplica el filtro local.'
      : 'Selecciona al menos un mes para aplicar el filtro.';
  }
}

function renderMesesPanelReservasMes() {
  var grid = document.getElementById('admin-reservas-mes-grid');
  var yearSelect = document.getElementById('admin-reservas-mes-anio');
  if (!grid || !yearSelect) return;

  var clavesPeriodo = adminDashboardState.reservasMes.clavesPeriodo || {};
  var years = [];
  Object.keys(clavesPeriodo).forEach(function (keyMes) {
    var keyData = parseMonthKeyDashboard(keyMes);
    if (!keyData) return;
    if (years.indexOf(keyData.year) === -1) years.push(keyData.year);
  });
  years.sort(function (a, b) { return a - b; });

  if (!years.length) {
    yearSelect.innerHTML = '';
    grid.innerHTML = '';
    actualizarEstadoPanelReservasMes();
    return;
  }

  if (!adminDashboardState.reservasMes.anioPanel || years.indexOf(Number(adminDashboardState.reservasMes.anioPanel)) === -1) {
    adminDashboardState.reservasMes.anioPanel = String(years[years.length - 1]);
  }

  yearSelect.innerHTML = years.map(function (year) {
    var selected = String(year) === String(adminDashboardState.reservasMes.anioPanel) ? ' selected' : '';
    return '<option value="' + String(year) + '"' + selected + '>' + String(year) + '</option>';
  }).join('');

  var anioActual = Number(adminDashboardState.reservasMes.anioPanel);
  var monthButtons = [];
  for (var m = 1; m <= 12; m += 1) {
    var keyMes = String(anioActual) + '-' + (m < 10 ? ('0' + m) : String(m));
    var disponible = !!clavesPeriodo[keyMes];
    var selected = disponible && !!adminDashboardState.reservasMes.seleccionBorrador[keyMes];
    var clases = 'admin-reservas-mes-item' + (selected ? ' is-selected' : '');
    var pressed = selected ? 'true' : 'false';
    var disabled = disponible ? '' : ' disabled';
    var label = nombreMesDashboard(anioActual, m, 'corto');

    monthButtons.push(
      '<button type="button" class="' + clases + '" data-month-key="' + keyMes + '" aria-pressed="' + pressed + '"' + disabled + '>' +
      escapeHtml(label) +
      '</button>'
    );
  }

  grid.innerHTML = monthButtons.join('');
  actualizarEstadoPanelReservasMes();
}

function setPanelReservasMesAbierto(abierto, devolverFoco) {
  var panel = document.getElementById('admin-reservas-mes-panel');
  var toggle = document.getElementById('admin-reservas-mes-toggle');
  if (!panel || !toggle) return;

  var abrir = !!abierto;
  adminDashboardState.reservasMes.panelAbierto = abrir;
  panel.hidden = !abrir;
  toggle.setAttribute('aria-expanded', abrir ? 'true' : 'false');

  if (abrir) {
    if (!adminDashboardState.reservasMes.borradorInicializado) {
      adminDashboardState.reservasMes.seleccionBorrador = adminDashboardState.reservasMes.seleccionAplicada
        ? copiarSeleccionReservasMes(adminDashboardState.reservasMes.seleccionAplicada)
        : construirSeleccionTodosReservasMes();
      adminDashboardState.reservasMes.borradorInicializado = true;
    }
    renderMesesPanelReservasMes();
  } else if (devolverFoco) {
    toggle.focus();
  }
}

function aplicarFiltroLocalReservasMes() {
  var seleccion = copiarSeleccionReservasMes(adminDashboardState.reservasMes.seleccionBorrador);
  adminDashboardState.reservasMes.seleccionAplicada = contarSeleccionReservasMes(seleccion) > 0 ? seleccion : null;
  textoBotonReservasMes();
  setPanelReservasMesAbierto(false);
  renderGraficoReservasPeriodoChart(adminDashboardState.reservasMes.todos, true);
}

function restablecerFiltroLocalReservasMes() {
  adminDashboardState.reservasMes.seleccionAplicada = null;
  adminDashboardState.reservasMes.seleccionBorrador = {};
  adminDashboardState.reservasMes.borradorInicializado = false;
  textoBotonReservasMes();
  setPanelReservasMesAbierto(false);
  renderGraficoReservasPeriodoChart(adminDashboardState.reservasMes.todos, true);
}

function sincronizarReservasMesPeriodoGlobal(items) {
  var periodoClave = construirClavePeriodoDashboard();
  var cambiaPeriodo = periodoClave !== adminDashboardState.reservasMes.periodoClave;

  var clavesRango = construirClavesMesPeriodoDashboard();
  var clavesPeriodo = {};
  clavesRango.forEach(function (key) {
    clavesPeriodo[key] = true;
  });

  var mapaValores = {};
  (Array.isArray(items) ? items : []).forEach(function (item) {
    var key = String((item && item.etiqueta) || '').trim();
    if (!key) return;
    var valor = Number(item && item.valor);
    mapaValores[key] = Number.isFinite(valor) ? valor : 0;
  });

  var todos = [];
  if (clavesRango.length) {
    todos = clavesRango.map(function (key) {
      return {
        etiqueta: key,
        valor: Number.isFinite(mapaValores[key]) ? mapaValores[key] : 0,
        porcentaje: null
      };
    });
  } else {
    todos = (Array.isArray(items) ? items : []).slice().sort(function (a, b) {
      return String(a.etiqueta || '').localeCompare(String(b.etiqueta || ''));
    });
    todos.forEach(function (item) {
      var key = String((item && item.etiqueta) || '').trim();
      if (key) clavesPeriodo[key] = true;
    });
  }

  adminDashboardState.reservasMes.periodoClave = periodoClave;
  adminDashboardState.reservasMes.clavesPeriodo = clavesPeriodo;
  adminDashboardState.reservasMes.todos = todos;

  if (cambiaPeriodo) {
    adminDashboardState.reservasMes.seleccionAplicada = null;
    adminDashboardState.reservasMes.seleccionBorrador = {};
    adminDashboardState.reservasMes.borradorInicializado = false;
  }

  textoBotonReservasMes();
}

function renderGraficoReservasPeriodoChart(serie, desdeFiltroLocal) {
  destruirChartDashboard('reservasPeriodo');

  var empty = document.getElementById('grafico-reservas-periodo-vacio');
  var canvas = document.getElementById('grafico-reservas-periodo');
  var wrap = canvas && canvas.closest ? canvas.closest('.admin-chart-wrap') : null;

  if (!canvas || !wrap || !empty) return;

  if (!desdeFiltroLocal) {
    var itemsCompletos = construirSerieMensualCompletaDashboard(serie, adminDashboardState.filtros);
    sincronizarReservasMesPeriodoGlobal(itemsCompletos);
  }

  var itemsVisibles = obtenerMesesVisiblesReservasDashboard(adminDashboardState.reservasMes.todos);
  adminDashboardState.reservasMes.visibles = itemsVisibles;
  actualizarResumenReservasMes(itemsVisibles);

  if (!itemsVisibles.length) {
    wrap.hidden = true;
    canvas.style.display = 'none';
    empty.hidden = false;
    return;
  }

  var valores = itemsVisibles.map(function (x) {
    var v = Number(x && x.valor);
    return Number.isFinite(v) ? v : 0;
  });
  var todosCero = valores.every(function (v) { return v <= 0; });

  if (todosCero) {
    wrap.hidden = true;
    canvas.style.display = 'none';
    empty.hidden = false;
    return;
  }

  wrap.hidden = false;
  canvas.style.display = 'block';
  empty.hidden = true;

  var ctx = obtenerCanvasContext('grafico-reservas-periodo');
  if (!ctx || typeof Chart === 'undefined') {
    wrap.hidden = true;
    canvas.style.display = 'none';
    empty.hidden = false;
    return;
  }

  var labels = itemsVisibles.map(function (x) {
    var k = parseMonthKeyDashboard(x && x.etiqueta);
    if (!k) return String(x.etiqueta || 'N/D');
    return nombreMesDashboard(k.year, k.month, 'corto');
  });

  var monthTitles = itemsVisibles.map(function (x) {
    var k = parseMonthKeyDashboard(x && x.etiqueta);
    if (!k) return String(x && x.etiqueta || 'Período');
    return nombreMesDashboard(k.year, k.month, 'largo');
  });

  adminDashboardState.charts.reservasPeriodo = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Reservas por mes',
        data: valores,
        backgroundColor: 'rgba(197, 17, 52, 0.92)',
        borderColor: 'rgba(242, 85, 110, 0.95)',
        borderWidth: 1,
        borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: 'bottom',
        maxBarThickness: 64,
        categoryPercentage: 0.72,
        barPercentage: 0.86
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 34, right: 8, left: 4, bottom: 2 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,10,12,0.94)',
          titleColor: '#fff',
          bodyColor: '#f2f5f8',
          borderColor: 'rgba(255,255,255,0.14)',
          borderWidth: 1,
          callbacks: {
            title: function (ctxTip) {
              var item = ctxTip && ctxTip.length ? ctxTip[0] : null;
              if (!item) return '';
              return monthTitles[item.dataIndex] || String(item.label || '');
            },
            label: function (ctxTip) {
              return 'Reservas: ' + formatearNumero(ctxTip.raw);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(236,241,247,0.82)',
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
            font: { size: 12 }
          },
          grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgba(236,241,247,0.82)',
            precision: 0,
            stepSize: 1,
            font: { size: 12 }
          },
          grid: { color: 'rgba(255,255,255,0.08)', drawBorder: false }
        }
      },
      animation: {
        duration: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280,
        onComplete: function () {
          var chart = this;
          var meta = chart.getDatasetMeta(0);
          var ctxLabel = chart.ctx;
          ctxLabel.save();
          ctxLabel.fillStyle = 'rgba(245,248,252,0.94)';
          ctxLabel.font = '700 12px Segoe UI';
          ctxLabel.textAlign = 'center';
          ctxLabel.textBaseline = 'bottom';
          for (var i = 0; i < valores.length; i += 1) {
            var bar = meta.data[i];
            if (!bar) continue;
            ctxLabel.fillText(String(valores[i]), bar.x, bar.y - 6);
          }
          ctxLabel.restore();
        }
      }
    }
  });
}

function renderGraficoServiciosCategoriaChart(serie) {
  destruirChartDashboard('serviciosCategoria');

  var items = (Array.isArray(serie) ? serie : []).map(function (x) {
    return {
      etiqueta: String((x && x.etiqueta) || 'N/D').trim(),
      valor: Number.isFinite(Number(x && x.valor)) ? Number(x.valor) : 0
    };
  }).filter(function (x) {
    return x.etiqueta.length > 0;
  }).sort(function (a, b) {
    if (a.valor !== b.valor) return a.valor - b.valor;
    return a.etiqueta.localeCompare(b.etiqueta, 'es', { sensitivity: 'base' });
  });

  if (!items.length) {
    alternarVacioDashboard('grafico-servicios-categoria', 'grafico-servicios-categoria-vacio', false);
    return;
  }

  var ctx = obtenerCanvasContext('grafico-servicios-categoria');
  if (!ctx || typeof Chart === 'undefined') return;

  var labels = items.map(function (x) { return x.etiqueta; });
  var data = items.map(function (x) { return x.valor; });

  adminDashboardState.charts.serviciosCategoria = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: '#d11f4f',
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 24
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          right: 28
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,10,12,0.94)',
          titleColor: '#fff',
          bodyColor: '#f2f5f8',
          callbacks: {
            label: function (ctxTip) {
              return 'Reservas: ' + formatearNumero(ctxTip.raw);
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grace: '18%',
          ticks: { color: 'rgba(236,241,247,0.82)', precision: 0, stepSize: 1, font: { size: 12 } },
          grid: { color: 'rgba(255,255,255,0.08)' }
        },
        y: {
          ticks: { color: 'rgba(236,241,247,0.88)', font: { size: 12 } },
          grid: { display: false }
        }
      },
      animation: {
        duration: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 320,
        onComplete: function () {
          var chart = this;
          var ctxLabel = chart.ctx;
          var meta = chart.getDatasetMeta(0);
          var chartArea = chart.chartArea || { right: 0 };
          ctxLabel.save();
          ctxLabel.fillStyle = 'rgba(236,241,247,0.92)';
          ctxLabel.font = '700 12px Segoe UI';
          ctxLabel.textAlign = 'left';
          ctxLabel.textBaseline = 'middle';
          for (var i = 0; i < data.length; i += 1) {
            var bar = meta.data[i];
            if (!bar) continue;
            var valueText = String(data[i]);
            var valueWidth = ctxLabel.measureText(valueText).width;
            var maxX = chartArea.right - valueWidth - 2;
            var drawX = Math.min(bar.x + 8, maxX);
            ctxLabel.fillText(valueText, drawX, bar.y);
          }
          ctxLabel.restore();
        }
      }
    }
  });

  alternarVacioDashboard('grafico-servicios-categoria', 'grafico-servicios-categoria-vacio', true);
}

function normalizarEtiquetaEstadoReserva(label) {
  var estado = String(label || '').trim();
  if (!estado || estado.toUpperCase() === 'SIN_ESTADO') return 'Sin estado';
  return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
}

function tipoEstadoReservaDashboard(label) {
  var estado = String(label || '').trim().toUpperCase();
  if (estado === 'CONFIRMADA') return 'confirmada';
  if (estado === 'CANCELADA') return 'cancelada';
  return 'otros';
}

function obtenerIconoEstadoReserva(tipo) {
  if (tipo === 'confirmada') {
    return '<svg class="admin-estado-icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5 10 17l9-9"></path></svg>';
  }
  if (tipo === 'cancelada') {
    return '<svg class="admin-estado-icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6 18 18M18 6 6 18"></path></svg>';
  }
  return '<svg class="admin-estado-icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8"></circle></svg>';
}

function prioridadEstadoReserva(tipo) {
  if (tipo === 'confirmada') return 0;
  if (tipo === 'cancelada') return 1;
  return 2;
}

function renderGraficoReservasEstadoChart(serie) {
  destruirChartDashboard('reservasEstado');

  var segmentos = document.getElementById('grafico-reservas-estado-segmentos');
  var empty = document.getElementById('grafico-reservas-estado-vacio');
  var totalEl = document.getElementById('grafico-reservas-estado-total');
  var cards = document.getElementById('grafico-reservas-estado-cards');
  if (!segmentos || !empty || !totalEl || !cards) return;

  var mapa = {};
  (Array.isArray(serie) ? serie : []).forEach(function (x) {
    var valor = Number(x && x.valor);
    if (!Number.isFinite(valor) || valor < 0) valor = 0;

    var etiquetaRaw = String((x && x.etiqueta) || '').trim();
    var tipo = tipoEstadoReservaDashboard(etiquetaRaw);
    var etiqueta = normalizarEtiquetaEstadoReserva(etiquetaRaw);
    if (tipo === 'confirmada') etiqueta = 'Confirmadas';
    if (tipo === 'cancelada') etiqueta = 'Canceladas';
    var key = tipo === 'otros' ? ('otros:' + etiqueta.toUpperCase()) : tipo;

    if (!mapa[key]) {
      mapa[key] = {
        etiqueta: etiqueta,
        valor: 0,
        tipo: tipo,
        color: colorEstadoReserva(etiquetaRaw)
      };
    }

    mapa[key].valor += valor;
  });

  if (!mapa.confirmada) {
    mapa.confirmada = { etiqueta: 'Confirmadas', valor: 0, tipo: 'confirmada', color: colorEstadoReserva('CONFIRMADA') };
  }
  if (!mapa.cancelada) {
    mapa.cancelada = { etiqueta: 'Canceladas', valor: 0, tipo: 'cancelada', color: colorEstadoReserva('CANCELADA') };
  }

  var items = Object.keys(mapa).map(function (key) {
    return mapa[key];
  }).sort(function (a, b) {
    var pa = prioridadEstadoReserva(a.tipo);
    var pb = prioridadEstadoReserva(b.tipo);
    if (pa !== pb) return pa - pb;
    return a.etiqueta.localeCompare(b.etiqueta, 'es', { sensitivity: 'base' });
  });

  var total = items.reduce(function (acc, item) {
    return acc + (Number.isFinite(item.valor) ? item.valor : 0);
  }, 0);

  totalEl.textContent = formatearNumero(total);
  segmentos.innerHTML = '';
  cards.innerHTML = '';

  if (total <= 0) {
    var neutro = document.createElement('span');
    neutro.className = 'admin-estado-segmento';
    neutro.style.width = '100%';
    neutro.style.backgroundColor = 'rgba(148, 163, 184, 0.45)';
    segmentos.appendChild(neutro);
    segmentos.setAttribute('aria-label', 'Sin reservas en este período');
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  items.forEach(function (item) {
    var pctRaw = (item.valor * 100) / total;
    var pctText = pctRaw.toFixed(1);

    if (pctRaw > 0) {
      var segmento = document.createElement('span');
      segmento.className = 'admin-estado-segmento';
      segmento.style.width = pctRaw + '%';
      segmento.style.backgroundColor = item.color;
      segmento.title = item.etiqueta + ': ' + formatearNumero(item.valor) + ' (' + pctText + '%)';
      segmentos.appendChild(segmento);
    }

    var card = document.createElement('article');
    card.className = 'admin-estado-card is-' + item.tipo;
    if (item.tipo === 'otros') {
      card.style.color = item.color;
    }

    card.innerHTML = [
      '<div class="admin-estado-card-top">',
      obtenerIconoEstadoReserva(item.tipo),
      '<span>', escapeHtml(item.etiqueta), '</span>',
      '</div>',
      '<p class="admin-estado-card-valor">', escapeHtml(formatearNumero(item.valor)), '</p>',
      '<p class="admin-estado-card-pct">', escapeHtml(pctText), '%</p>'
    ].join('');

    cards.appendChild(card);
  });

  var ariaPartes = items.map(function (item) {
    var pct = total > 0 ? ((item.valor * 100) / total) : 0;
    return item.etiqueta + ': ' + formatearNumero(item.valor) + ' (' + pct.toFixed(1) + '%)';
  });
  segmentos.setAttribute('aria-label', 'Distribución de reservas por estado. ' + ariaPartes.join('. '));
}

function renderGraficoOcupacionBarra(porcentajeGeneral, serieOcupacion, confirmadasPeriodo, capacidadPeriodo) {
  destruirChartDashboard('ocupacion');

  var lista = document.getElementById('grafico-ocupacion-servicio-lista');
  var empty = document.getElementById('grafico-ocupacion-vacio');
  if (!lista || !empty) return;

  var serie = Array.isArray(serieOcupacion) ? serieOcupacion : [];
  var hayCapacidad = serie.some(function (x) {
    return Number(x && x.capacidad) > 0;
  });

  if (!hayCapacidad) {
    lista.hidden = true;
    empty.hidden = false;
    lista.innerHTML = '';
    return;
  }

  lista.hidden = false;
  empty.hidden = true;

  var serieOrdenada = serie.map(function (x) {
    var nombre = String((x && x.etiqueta) || 'Servicio').trim();
    var confirmadas = Number(x && x.valor);
    var capacidad = Number(x && x.capacidad);
    if (!Number.isFinite(confirmadas) || confirmadas < 0) confirmadas = 0;
    if (!Number.isFinite(capacidad) || capacidad < 0) capacidad = 0;

    var pct = capacidad > 0 ? ((confirmadas * 100) / capacidad) : 0;
    if (!Number.isFinite(pct) || pct < 0) pct = 0;
    if (pct > 100) pct = 100;

    return {
      nombre: nombre || 'Servicio',
      confirmadas: confirmadas,
      capacidad: capacidad,
      pct: pct
    };
  }).sort(function (a, b) {
    if (a.pct !== b.pct) return a.pct - b.pct;
    return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
  });

  var html = serieOrdenada.map(function (item) {
    return [
      '<div class="admin-ocupacion-servicio-item">',
      '  <span class="nombre">', escapeHtml(item.nombre), '</span>',
      '  <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="', escapeHtml(item.pct.toFixed(1)), '"><span style="width:', escapeHtml(item.pct.toFixed(2)), '%"></span></div>',
      '  <span class="meta">', escapeHtml(formatearNumero(item.confirmadas)), '/', escapeHtml(formatearNumero(item.capacidad)), ' · ', escapeHtml(item.pct.toFixed(1)), '%</span>',
      '</div>'
    ].join('');
  }).join('');

  var confirmadasTotal = Number(confirmadasPeriodo || 0);
  var capacidadTotal = Number(capacidadPeriodo || 0);
  var general = Number(porcentajeGeneral || 0);
  if (Number.isFinite(confirmadasTotal) && Number.isFinite(capacidadTotal) && capacidadTotal > 0) {
    general = (confirmadasTotal * 100) / capacidadTotal;
  }
  if (!Number.isFinite(general) || general < 0) general = 0;
  if (general > 100) general = 100;

  lista.innerHTML = '<div class="admin-ocupacion-servicio-item"><span class="nombre"><strong>Total período</strong></span><div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + escapeHtml(general.toFixed(1)) + '"><span style="width:' + escapeHtml(general.toFixed(2)) + '%"></span></div><span class="meta">' + escapeHtml(formatearNumero(confirmadasTotal)) + '/' + escapeHtml(formatearNumero(capacidadTotal)) + ' · ' + escapeHtml(general.toFixed(1)) + '%</span></div>' + html;
}

function renderGraficoUsuariosRolChart(serie) {
  destruirChartDashboard('usuariosRol');

  var items = Array.isArray(serie) ? serie : [];
  if (!items.length) {
    alternarVacioDashboard('grafico-usuarios-rol', 'grafico-usuarios-rol-vacio', false);
    return;
  }

  var total = items.reduce(function (acc, x) {
    var val = Number(x && x.valor);
    return acc + (Number.isFinite(val) ? val : 0);
  }, 0);

  var ctx = obtenerCanvasContext('grafico-usuarios-rol');
  if (!ctx || typeof Chart === 'undefined') {
    alternarVacioDashboard('grafico-usuarios-rol', 'grafico-usuarios-rol-vacio', false);
    return;
  }

  var labels = items.map(function (x) { return String(x.etiqueta || 'N/D'); });
  var data = items.map(function (x) { return Number.isFinite(Number(x.valor)) ? Number(x.valor) : 0; });

  adminDashboardState.charts.usuariosRol = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'rgba(93, 183, 255, 0.9)',
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 22
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,10,12,0.94)',
          titleColor: '#fff',
          bodyColor: '#f2f5f8',
          callbacks: {
            label: function (ctxTip) {
              var v = Number(ctxTip.raw || 0);
              var p = total > 0 ? ((v * 100) / total) : 0;
              return 'Usuarios: ' + formatearNumero(v) + ' (' + p.toFixed(1) + '%)';
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: 'rgba(236,241,247,0.82)', precision: 0, stepSize: 1, font: { size: 12 } },
          grid: { color: 'rgba(255,255,255,0.08)' }
        },
        y: {
          ticks: { color: 'rgba(236,241,247,0.88)', font: { size: 12 } },
          grid: { display: false }
        }
      },
      animation: {
        onComplete: function () {
          var chart = this;
          var ctxLabel = chart.ctx;
          var meta = chart.getDatasetMeta(0);
          ctxLabel.save();
          ctxLabel.fillStyle = 'rgba(236,241,247,0.9)';
          ctxLabel.font = '600 12px Segoe UI';
          ctxLabel.textAlign = 'left';
          ctxLabel.textBaseline = 'middle';
          for (var i = 0; i < data.length; i += 1) {
            var bar = meta.data[i];
            if (!bar) continue;
            var valor = Number(data[i] || 0);
            var pct = total > 0 ? ((valor * 100) / total).toFixed(1) : '0.0';
            ctxLabel.fillText(valor + ' (' + pct + '%)', bar.x + 8, bar.y);
          }
          ctxLabel.restore();
        }
      }
    }
  });

  alternarVacioDashboard('grafico-usuarios-rol', 'grafico-usuarios-rol-vacio', true);
}

function actualizarRangoDashboardFormulario(periodo) {
  if (!periodo) return;
  var desde = document.getElementById('admin-dashboard-desde');
  var hasta = document.getElementById('admin-dashboard-hasta');
  if (desde && periodo.desde) desde.value = periodo.desde;
  if (hasta && periodo.hasta) hasta.value = periodo.hasta;

  if (periodo.desde) adminDashboardState.filtros.desde = String(periodo.desde);
  if (periodo.hasta) adminDashboardState.filtros.hasta = String(periodo.hasta);
}

function construirUrlDashboard() {
  var qs = [];
  if (adminDashboardState.filtros.desde) qs.push('desde=' + encodeURIComponent(adminDashboardState.filtros.desde));
  if (adminDashboardState.filtros.hasta) qs.push('hasta=' + encodeURIComponent(adminDashboardState.filtros.hasta));
  return '/api/admin/dashboard.ashx' + (qs.length ? ('?' + qs.join('&')) : '');
}

function ejecutarRenderGraficoDashboard(renderFn, nombreGrafico) {
  try {
    renderFn();
    return true;
  } catch (error) {
    if (window.console && typeof window.console.error === 'function') {
      console.error('Dashboard ' + nombreGrafico + ':', error);
    }
    return false;
  }
}

function renderDashboard(data) {
  var nombre = document.getElementById('admin-nombre');
  if (nombre) nombre.textContent = data.nombre || 'Administrador';

  var kpis = data.kpis || {};
  setKpiDashboard('kpi-servicios-activos', kpis.totalServiciosActivos || 0, '');
  setKpiDashboard('kpi-usuarios-registrados', kpis.totalUsuariosRegistrados || 0, '');
  setKpiDashboard('kpi-reservas-periodo', kpis.reservasPeriodo || 0, '');
  setKpiDashboard('kpi-ocupacion', Number(kpis.ocupacionPorcentaje || 0).toFixed(1), '%');

  var graficos = data.graficos || {};
  var huboErrorGrafico = false;

  if (!ejecutarRenderGraficoDashboard(function () {
    renderGraficoReservasPeriodoChart(normalizarSerieDashboard(graficos.reservasPorMes));
  }, 'Reservas por mes')) {
    huboErrorGrafico = true;
  }

  if (!ejecutarRenderGraficoDashboard(function () {
    renderGraficoServiciosCategoriaChart(normalizarSerieDashboard(graficos.serviciosPorCategoria));
  }, 'Servicios más reservados')) {
    huboErrorGrafico = true;
  }

  if (!ejecutarRenderGraficoDashboard(function () {
    renderGraficoReservasEstadoChart(normalizarSerieDashboard(graficos.reservasPorEstado));
  }, 'Reservas por estado')) {
    huboErrorGrafico = true;
  }

  if (!ejecutarRenderGraficoDashboard(function () {
    renderGraficoOcupacionBarra(
      Number(kpis.ocupacionPorcentaje || 0),
      normalizarSerieDashboard(graficos.ocupacionHorarios),
      Number(kpis.confirmadasPeriodo || 0),
      Number(kpis.capacidadPeriodo || 0)
    );
  }, 'Ocupación por servicio')) {
    huboErrorGrafico = true;
  }

  var disponibilidad = data.disponibilidad || {};
  var advertencias = [];
  if (disponibilidad.catalogo === false) advertencias.push('Catálogo no disponible.');
  if (disponibilidad.seguridad === false) advertencias.push('Datos de seguridad no disponibles.');
  if (disponibilidad.reservasHorarios === false) advertencias.push('Reservas u horarios no disponibles.');
  if (huboErrorGrafico) advertencias.push('Algunas visualizaciones no pudieron actualizarse.');
  setMensajeDashboard(advertencias.join(' '), advertencias.length > 0);

  actualizarRangoDashboardFormulario(data.periodo || null);
  mostrarPeriodoAplicadoDashboard(data.periodo || null);
}

function cargarDashboard() {
  if (adminDashboardState.cargando) return Promise.resolve();
  adminDashboardState.cargando = true;
  var idReq = (adminDashboardState.requestId || 0) + 1;
  adminDashboardState.requestId = idReq;

  setBotonDashboardCargando(true);
  setReintentoDashboardVisible(false);
  setMensajeDashboard('Cargando indicadores y estadísticas...', false);

  return fetch(construirUrlDashboard(), { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        window.location.href = '/index.html';
        return null;
      }
      return resp.text().then(function (text) {
        var data = null;
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = null;
        }

        if (!resp.ok || !data || !data.success) {
          throw new Error((data && data.message) || 'No fue posible cargar el dashboard.');
        }

        return data;
      });
    })
    .then(function (data) {
      if (!data) return;
      if (idReq !== adminDashboardState.requestId) return;
      renderDashboard(data);
      setReintentoDashboardVisible(false);
    })
    .catch(function (err) {
      if (idReq !== adminDashboardState.requestId) return;
      setMensajeDashboard((err && err.message) || 'No fue posible cargar el dashboard.', true);
      setReintentoDashboardVisible(true);
    })
    .finally(function () {
      if (idReq !== adminDashboardState.requestId) return;
      adminDashboardState.cargando = false;
      setBotonDashboardCargando(false);
    });
}

function initFiltroReservasMesDashboard() {
  var toggle = document.getElementById('admin-reservas-mes-toggle');
  var panel = document.getElementById('admin-reservas-mes-panel');
  var yearSelect = document.getElementById('admin-reservas-mes-anio');
  var grid = document.getElementById('admin-reservas-mes-grid');
  var aplicar = document.getElementById('admin-reservas-mes-aplicar');
  var restablecer = document.getElementById('admin-reservas-mes-restablecer');
  var cerrarPanel = document.getElementById('admin-reservas-mes-panel-cerrar');

  if (!toggle || !panel || !yearSelect || !grid || !aplicar || !restablecer || !cerrarPanel) return;

  toggle.addEventListener('click', function () {
    setPanelReservasMesAbierto(!adminDashboardState.reservasMes.panelAbierto);
  });

  cerrarPanel.addEventListener('click', function () {
    setPanelReservasMesAbierto(false, true);
  });

  yearSelect.addEventListener('change', function () {
    adminDashboardState.reservasMes.anioPanel = String(yearSelect.value || '');
    renderMesesPanelReservasMes();
  });

  grid.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || target.tagName !== 'BUTTON') return;
    var key = String(target.getAttribute('data-month-key') || '').trim();
    if (!key || target.disabled) return;

    if (adminDashboardState.reservasMes.seleccionBorrador[key]) {
      delete adminDashboardState.reservasMes.seleccionBorrador[key];
    } else {
      adminDashboardState.reservasMes.seleccionBorrador[key] = true;
    }

    renderMesesPanelReservasMes();
    var btn = grid.querySelector('button[data-month-key="' + key + '"]');
    if (btn) btn.focus();
  });

  aplicar.addEventListener('click', function () {
    if (aplicar.disabled) return;
    aplicarFiltroLocalReservasMes();
  });

  restablecer.addEventListener('click', function () {
    restablecerFiltroLocalReservasMes();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (!adminDashboardState.reservasMes.panelAbierto) return;
    setPanelReservasMesAbierto(false, true);
  });

  document.addEventListener('click', function (event) {
    if (!adminDashboardState.reservasMes.panelAbierto) return;
    var target = event.target;
    if (panel.contains(target) || toggle.contains(target)) return;
    setPanelReservasMesAbierto(false);
  });
}

function validarAccesoAdmin() {
  return fetch('/api/admin/session.ashx', { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        window.location.href = '/index.html';
        return null;
      }
      if (!resp.ok) return null;
      return resp.json();
    })
    .then(function (data) {
      if (!data || !data.success) return false;
      var nombre = document.getElementById('admin-nombre');
      if (nombre) nombre.textContent = data.nombre || 'Administrador';
      return true;
    })
    .catch(function () {
      window.location.href = '/index.html';
      return false;
    });
}

function initAdminLogout() {
  var cerrar = document.getElementById('cerrar-sesion-admin');
  if (!cerrar) return;
  cerrar.addEventListener('click', function () {
    if (window.kfLogout) {
      window.kfLogout();
    } else {
      window.location.href = '/index.html';
    }
  });
}

function renderResumenUsuarios(resumen) {
  if (!resumen) return;
  var total = document.getElementById('usuarios-total');
  var clientes = document.getElementById('usuarios-clientes');
  var admins = document.getElementById('usuarios-admins');
  var activos = document.getElementById('usuarios-activos');
  if (total) total.textContent = String(resumen.usuariosTotales || 0);
  if (clientes) clientes.textContent = String(resumen.clientes || 0);
  if (admins) admins.textContent = String(resumen.administradores || 0);
  if (activos) activos.textContent = String(resumen.usuariosActivos || 0);
}

function badgeRol(rol) {
  var nombreRol = String(rol || '');
  var rolLower = nombreRol.toLowerCase();
  var clase = 'badge-rol-neutral';

  if (rolLower === 'administrador') {
    clase = 'badge-rol-admin';
  } else if (rolLower === 'cliente') {
    clase = 'badge-rol-cliente';
  }

  return '<span class="badge badge-rol ' + clase + '">' + escapeHtml(nombreRol) + '</span>';
}

function badgeEstado(activo) {
  return activo
    ? '<span class="badge badge-activo">Activo</span>'
    : '<span class="badge badge-inactivo">Inactivo</span>';
}

function normalizarUsuarioListado(u) {
  if (!u) return null;
  var idUsuario = u.idUsuario != null ? u.idUsuario : u.IdUsuario;
  return {
    idUsuario: idUsuario,
    nombreCompleto: u.nombreCompleto != null ? u.nombreCompleto : u.NombreCompleto,
    correo: u.correo != null ? u.correo : u.Correo,
    rol: u.rol != null ? u.rol : u.Rol,
    activo: u.activo != null ? !!u.activo : !!u.Activo,
    fotoPerfil: u.fotoPerfil != null ? u.fotoPerfil : u.FotoPerfil,
    fotoUrl: u.fotoUrl != null ? u.fotoUrl : u.FotoUrl
  };
}

function normalizarDetalleUsuario(u) {
  if (!u) return null;
  return {
    idUsuario: u.idUsuario != null ? u.idUsuario : u.IdUsuario,
    nombreCompleto: u.nombreCompleto != null ? u.nombreCompleto : u.NombreCompleto,
    correo: u.correo != null ? u.correo : u.Correo,
    rol: u.rol != null ? u.rol : u.Rol,
    idRol: u.idRol != null ? u.idRol : u.IdRol,
    activo: u.activo != null ? !!u.activo : !!u.Activo,
    telefono: u.telefono != null ? u.telefono : u.Telefono,
    fotoPerfil: u.fotoPerfil != null ? u.fotoPerfil : u.FotoPerfil,
    fotoUrl: u.fotoUrl != null ? u.fotoUrl : u.FotoUrl,
    esPropiaCuentaAdmin: u.esPropiaCuentaAdmin != null ? !!u.esPropiaCuentaAdmin : !!u.EsPropiaCuentaAdmin
  };
}

function construirFotoPerfilUsuarioUrl(item) {
  if (!item || !item.idUsuario) return null;
  if (item.fotoUrl) return String(item.fotoUrl);

  var fotoPerfil = String(item.fotoPerfil || '').trim();
  if (!fotoPerfil) return null;
  return '/api/admin/user-photo.ashx?idUsuario=' + encodeURIComponent(String(item.idUsuario)) + '&v=' + encodeURIComponent(fotoPerfil);
}

function obtenerInicialesUsuario(nombreCompleto, correo) {
  var nombre = String(nombreCompleto || '').trim();
  var partes = nombre ? nombre.split(/\s+/) : [];

  if (partes.length >= 2) {
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }
  if (partes.length === 1 && partes[0].length > 0) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  var email = String(correo || '').trim();
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return 'US';
}

function renderAvatarUsuarioHtml(item, grande) {
  var fotoUrl = construirFotoPerfilUsuarioUrl(item);
  var iniciales = obtenerInicialesUsuario(item && item.nombreCompleto, item && item.correo);
  var clase = grande ? 'admin-usuario-avatar admin-usuario-avatar-grande' : 'admin-usuario-avatar';
  var dimension = grande ? 120 : 40;
  var nombreUsuario = String(item && item.nombreCompleto ? item.nombreCompleto : 'Usuario');

  if (!fotoUrl) {
    return [
      '<span class="', clase, '" aria-hidden="true">',
      '<span class="admin-usuario-avatar-fallback">', escapeHtml(iniciales), '</span>',
      '</span>'
    ].join('');
  }

  var contenidoAvatar = [
    '<span class="', clase, '">',
    '<img src="', escapeHtml(fotoUrl), '" alt="Foto de perfil" width="', String(dimension), '" height="', String(dimension), '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.hidden=false;">',
    '<span class="admin-usuario-avatar-fallback" hidden aria-hidden="true">', escapeHtml(iniciales), '</span>',
    '</span>'
  ].join('');

  if (grande) {
    return contenidoAvatar;
  }

  return [
    '<button type="button" class="admin-usuario-avatar-btn" data-admin-usuario-foto="', escapeHtml(fotoUrl), '" data-admin-usuario-nombre="', escapeHtml(nombreUsuario), '" aria-label="Ampliar fotografía de ', escapeHtml(nombreUsuario), '">',
    contenidoAvatar,
    '</button>'
  ].join('');
}

function obtenerElementosEnfocablesModalFotoUsuario() {
  var modal = document.getElementById('admin-usuario-foto-modal');
  if (!modal || modal.hidden) return [];

  var selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var todos = modal.querySelectorAll(selector);
  return Array.prototype.filter.call(todos, function (el) {
    return !el.hidden && el.getAttribute('aria-hidden') !== 'true';
  });
}

function manejarTecladoModalFotoUsuario(e) {
  if (!adminUsersState.fotoModal.abierto) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    cerrarModalFotoUsuario();
    return;
  }

  if (e.key !== 'Tab') return;

  var focusables = obtenerElementosEnfocablesModalFotoUsuario();
  if (!focusables.length) return;

  var primero = focusables[0];
  var ultimo = focusables[focusables.length - 1];
  var indiceActual = focusables.indexOf(document.activeElement);

  if (indiceActual < 0) {
    e.preventDefault();
    primero.focus();
    return;
  }

  if (e.shiftKey && document.activeElement === primero) {
    e.preventDefault();
    ultimo.focus();
    return;
  }

  if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primero.focus();
  }
}

function abrirModalFotoUsuario(nombreUsuario, fotoUrl, disparador) {
  if (!fotoUrl) return;

  var modal = document.getElementById('admin-usuario-foto-modal');
  var titulo = document.getElementById('admin-usuario-foto-titulo');
  var img = document.getElementById('admin-usuario-foto-imagen');
  var error = document.getElementById('admin-usuario-foto-error');
  if (!modal || !titulo || !img) return;

  adminUsersState.fotoModal.ultimoFoco = disparador || document.activeElement || null;
  adminUsersState.fotoModal.abierto = true;

  titulo.textContent = String(nombreUsuario || 'Fotografía de usuario');
  img.src = fotoUrl;
  img.alt = 'Fotografía de ' + String(nombreUsuario || 'usuario');
  img.hidden = false;
  if (error) {
    error.hidden = true;
    error.textContent = 'No fue posible cargar la fotografía.';
  }

  modal.hidden = false;
  document.body.classList.add('admin-modal-open');

  document.removeEventListener('keydown', manejarTecladoModalFotoUsuario, true);
  document.addEventListener('keydown', manejarTecladoModalFotoUsuario, true);

  var btnCerrar = document.getElementById('admin-usuario-foto-cerrar-x');
  if (btnCerrar && typeof btnCerrar.focus === 'function') {
    setTimeout(function () {
      try { btnCerrar.focus(); } catch (_) { }
    }, 0);
  }
}

function cerrarModalFotoUsuario() {
  var modal = document.getElementById('admin-usuario-foto-modal');
  if (!modal) return;

  modal.hidden = true;
  adminUsersState.fotoModal.abierto = false;
  document.removeEventListener('keydown', manejarTecladoModalFotoUsuario, true);

  if (!document.querySelector('.admin-modal:not([hidden])')) {
    document.body.classList.remove('admin-modal-open');
  }

  var foco = adminUsersState.fotoModal.ultimoFoco;
  adminUsersState.fotoModal.ultimoFoco = null;
  if (foco && typeof foco.focus === 'function') {
    try { foco.focus(); } catch (_) { }
  }
}

function onErrorImagenModalFotoUsuario() {
  var img = document.getElementById('admin-usuario-foto-imagen');
  var error = document.getElementById('admin-usuario-foto-error');
  if (img) img.hidden = true;
  if (error) error.hidden = false;
}

function renderTablaUsuarios(items) {
  var tbody = document.getElementById('admin-usuarios-tbody');
  if (!tbody) return;

  if (!items || !items.length) {
    tbody.innerHTML = '<tr><td colspan="5">No encontramos usuarios que coincidan con tu búsqueda.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(function (raw) {
    var u = normalizarUsuarioListado(raw) || {};
    var id = u.idUsuario != null ? String(u.idUsuario) : '';
    return [
      '<tr>',
      '<td><div class="admin-usuario-identidad">',
      renderAvatarUsuarioHtml(u, false),
      '<span class="admin-usuario-nombre">' + escapeHtml(u.nombreCompleto || '') + '</span>',
      '</div></td>',
      '<td>' + escapeHtml(u.correo || '') + '</td>',
      '<td>' + badgeRol(u.rol || '') + '</td>',
      '<td>' + badgeEstado(!!u.activo) + '</td>',
      '<td><button class="boton boton-pequeno admin-ver-usuario" data-id="' + escapeHtml(id) + '">Ver</button></td>',
      '</tr>'
    ].join('');
  }).join('');
}

function actualizarPaginacion(paginacion) {
  adminUsersState.pagina = paginacion && paginacion.pagina ? Number(paginacion.pagina) : 1;
  adminUsersState.totalPaginas = paginacion && paginacion.totalPaginas ? Number(paginacion.totalPaginas) : 1;
  adminUsersState.totalRegistros = paginacion && paginacion.totalRegistros ? Number(paginacion.totalRegistros) : 0;

  var info = document.getElementById('admin-usuarios-pageinfo');
  if (info) info.textContent = 'Página ' + adminUsersState.pagina + ' de ' + adminUsersState.totalPaginas;

  var summary = document.getElementById('admin-usuarios-pagination-summary');
  var wrap = document.getElementById('admin-usuarios-pagination-wrap');
  var desde = adminUsersState.totalRegistros > 0 ? (((adminUsersState.pagina - 1) * adminUsersState.tamanoPagina) + 1) : 0;
  var hasta = Math.min(adminUsersState.pagina * adminUsersState.tamanoPagina, adminUsersState.totalRegistros);
  if (summary) summary.textContent = 'Mostrando ' + String(desde) + '–' + String(hasta) + ' de ' + String(adminUsersState.totalRegistros);

  var prev = document.getElementById('admin-usuarios-prev');
  var next = document.getElementById('admin-usuarios-next');
  if (prev) prev.disabled = adminUsersState.pagina <= 1;
  if (next) next.disabled = adminUsersState.pagina >= adminUsersState.totalPaginas;
  if (wrap) wrap.hidden = adminUsersState.totalRegistros <= adminUsersState.tamanoPagina;
}

function setEstadoUsuarios(mensaje, visible) {
  var estado = document.getElementById('admin-usuarios-estado');
  if (!estado) return;
  estado.textContent = mensaje || '';
  estado.hidden = !visible;
}

function cargarUsuarios() {
  var q = encodeURIComponent(adminUsersState.query || '');
  var url = '/api/admin/users.ashx?page=' + adminUsersState.pagina + '&pageSize=' + adminUsersState.tamanoPagina + '&q=' + q;

  return fetch(url, { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        window.location.href = '/index.html';
        return null;
      }
      if (!resp.ok) throw new Error('http');
      return resp.json();
    })
    .then(function (data) {
      if (!data || !data.success) return;

      adminUsersState.roles = data.roles || [];
      adminUsersState.identificacionDisponible = !!data.identificacionDisponible;

      var input = document.getElementById('admin-usuarios-query');
      if (input) {
        input.placeholder = adminUsersState.identificacionDisponible
          ? 'Buscar por nombre, correo o identificación...'
          : 'Buscar por nombre o correo...';
      }

      renderResumenUsuarios(data.resumen || {});
      renderTablaUsuarios(data.usuarios || []);
      actualizarPaginacion(data.paginacion || {});
      setEstadoUsuarios('', false);
    })
    .catch(function () {
      setEstadoUsuarios('No fue posible cargar los usuarios. Intenta nuevamente.', true);
    });
}

function abrirModalUsuario() {
  var modal = document.getElementById('admin-usuario-modal');
  if (!modal) return;
  modal.hidden = false;
}

function cerrarModalUsuario() {
  var modal = document.getElementById('admin-usuario-modal');
  if (!modal) return;
  modal.hidden = true;
  adminUsersState.detalleActual = null;
  adminUsersState.rolOriginalId = null;

  var msg = document.getElementById('admin-usuario-mensaje');
  if (msg) msg.textContent = '';

  var confirm = document.getElementById('admin-confirm-box');
  if (confirm) confirm.hidden = true;

  var nombre = document.getElementById('detalle-nombre');
  var correo = document.getElementById('detalle-correo');
  var rol = document.getElementById('detalle-rol');
  var estado = document.getElementById('detalle-estado');
  var telWrap = document.getElementById('detalle-telefono-wrap');
  var tel = document.getElementById('detalle-telefono');
  if (nombre) nombre.textContent = '-';
  if (correo) correo.textContent = '-';
  if (rol) rol.textContent = '-';
  if (estado) estado.textContent = '-';
  if (telWrap) telWrap.hidden = true;
  if (tel) tel.textContent = '-';

  var avatar = document.getElementById('detalle-avatar-display');
  if (avatar) avatar.innerHTML = '';

  var selfProtect = document.getElementById('admin-self-protect');
  if (selfProtect) selfProtect.hidden = true;

  var select = document.getElementById('admin-rol-select');
  if (select) {
    select.innerHTML = '';
    select.disabled = false;
  }

  var btnGuardar = document.getElementById('admin-rol-guardar');
  if (btnGuardar) btnGuardar.disabled = false;
}

function llenarRoles(idSeleccionado) {
  var select = document.getElementById('admin-rol-select');
  if (!select) return;
  select.innerHTML = '';

  (adminUsersState.roles || []).forEach(function (rol) {
    var opt = document.createElement('option');
    opt.value = String(rol.IdRol || rol.idRol);
    opt.textContent = rol.Nombre || rol.nombre;
    if (String(idSeleccionado) === opt.value) opt.selected = true;
    select.appendChild(opt);
  });
}

function mostrarDetalleUsuario(det) {
  var nombre = document.getElementById('detalle-nombre');
  var correo = document.getElementById('detalle-correo');
  var rol = document.getElementById('detalle-rol');
  var estado = document.getElementById('detalle-estado');
  var telWrap = document.getElementById('detalle-telefono-wrap');
  var tel = document.getElementById('detalle-telefono');
  var avatar = document.getElementById('detalle-avatar-display');

  if (avatar) {
    avatar.innerHTML = renderAvatarUsuarioHtml(det, true);
  }

  if (nombre) nombre.textContent = det.nombreCompleto || '-';
  if (correo) correo.textContent = det.correo || '-';
  if (rol) rol.textContent = det.rol || '-';
  if (estado) estado.innerHTML = badgeEstado(!!det.activo);

  if (telWrap && tel) {
    if (det.telefono) {
      telWrap.hidden = false;
      tel.textContent = det.telefono;
    } else {
      telWrap.hidden = true;
      tel.textContent = '-';
    }
  }

  adminUsersState.rolOriginalId = det.idRol;
  llenarRoles(det.idRol);

  var selfProtect = document.getElementById('admin-self-protect');
  var select = document.getElementById('admin-rol-select');
  var btnGuardar = document.getElementById('admin-rol-guardar');

  var esPropia = !!det.esPropiaCuentaAdmin;
  if (selfProtect) {
    selfProtect.hidden = !esPropia;
    selfProtect.textContent = 'Tu cuenta administrativa. Por seguridad, no puedes retirar tus propios permisos de Administrador.';
  }
  if (select) select.disabled = esPropia;
  if (btnGuardar) btnGuardar.disabled = esPropia;
}

function cargarDetalleUsuario(idUsuario) {
  var avatar = document.getElementById('detalle-avatar-display');
  if (avatar) avatar.innerHTML = '';

  return fetch('/api/admin/user-detail.ashx?idUsuario=' + encodeURIComponent(String(idUsuario)), { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (resp.status === 403) {
        window.location.href = '/index.html';
        return null;
      }
      if (!resp.ok) throw new Error('http');
      return resp.json();
    })
    .then(function (data) {
      if (!data || !data.success || !data.usuario) return;
      var detalle = normalizarDetalleUsuario(data.usuario);
      if (!detalle || !detalle.idUsuario) return;
      adminUsersState.detalleActual = detalle;
      mostrarDetalleUsuario(detalle);
      abrirModalUsuario();
    })
    .catch(function () {
      setEstadoUsuarios('No fue posible cargar el detalle del usuario.', true);
    });
}

function prepararConfirmacionCambio() {
  var det = adminUsersState.detalleActual;
  var select = document.getElementById('admin-rol-select');
  var msg = document.getElementById('admin-usuario-mensaje');
  if (!det || !select) return;


  var idNuevo = parseInt(select.value, 10);
  if (!idNuevo || idNuevo === adminUsersState.rolOriginalId) {
    if (msg) {
      msg.textContent = 'No hay cambios para guardar.';
      msg.style.color = '#b8b8be';
    }
    return;
  }

  var nombreRolNuevo = select.options[select.selectedIndex] ? select.options[select.selectedIndex].text : '';
  var confirmBox = document.getElementById('admin-confirm-box');
  var confirmTexto = document.getElementById('admin-confirm-texto');

  if (confirmTexto) {
    confirmTexto.textContent = '¿Deseas cambiar el rol de ' + (det.nombreCompleto || 'este usuario') + ' de ' + (det.rol || '') + ' a ' + nombreRolNuevo + '?';
  }
  if (confirmBox) confirmBox.hidden = false;
}

function ejecutarCambioRol() {
  var det = adminUsersState.detalleActual;
  var select = document.getElementById('admin-rol-select');
  var msg = document.getElementById('admin-usuario-mensaje');
  if (!det || !select || !det.idUsuario) {
    if (msg) {
      msg.textContent = 'Selecciona un usuario válido antes de guardar cambios.';
      msg.style.color = '#ff6b6b';
    }
    return;
  }

  var idRol = parseInt(select.value, 10);
  if (!idRol) {
    if (msg) {
      msg.textContent = 'Selecciona un rol válido.';
      msg.style.color = '#ff6b6b';
    }
    return;
  }

  var payload = {
    idUsuario: det.idUsuario,
    idRol: idRol
  };

  fetch('/api/admin/user-role.ashx', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(function (resp) {
      return resp.json().then(function (body) {
        body.__status = resp.status;
        return body;
      });
    })
    .then(function (data) {
      if (!data) return;
      if (data.__status >= 400 || data.success === false) {
        if (msg) {
          msg.textContent = data.message || 'No fue posible actualizar el rol.';
          msg.style.color = '#ff6b6b';
        }
        return;
      }

      if (msg) {
        msg.textContent = data.message || 'Rol actualizado correctamente.';
        msg.style.color = '#ED1C2E';
      }

      var confirmBox = document.getElementById('admin-confirm-box');
      if (confirmBox) confirmBox.hidden = true;

      cargarUsuarios().then(function () {
        cerrarModalUsuario();
      });
    })
    .catch(function () {
      if (msg) {
        msg.textContent = 'No fue posible actualizar el rol.';
        msg.style.color = '#ff6b6b';
      }
    });
}

function initControlUsuarios() {
  var form = document.getElementById('admin-usuarios-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('admin-usuarios-query');
      adminUsersState.query = input ? (input.value || '').trim() : '';
      adminUsersState.pagina = 1;
      cargarUsuarios();
    });
  }

  var prev = document.getElementById('admin-usuarios-prev');
  var next = document.getElementById('admin-usuarios-next');
  if (prev) {
    prev.addEventListener('click', function () {
      if (adminUsersState.pagina <= 1) return;
      adminUsersState.pagina -= 1;
      cargarUsuarios();
    });
  }
  if (next) {
    next.addEventListener('click', function () {
      if (adminUsersState.pagina >= adminUsersState.totalPaginas) return;
      adminUsersState.pagina += 1;
      cargarUsuarios();
    });
  }

  var tbody = document.getElementById('admin-usuarios-tbody');
  if (tbody) {
    tbody.addEventListener('click', function (e) {
      var target = e.target;
      if (!target || !target.closest) return;

      var triggerFoto = target.closest('[data-admin-usuario-foto]');
      if (triggerFoto) {
        e.preventDefault();
        var fotoUrl = triggerFoto.getAttribute('data-admin-usuario-foto') || '';
        var nombreFoto = triggerFoto.getAttribute('data-admin-usuario-nombre') || 'Usuario';
        if (fotoUrl) {
          abrirModalFotoUsuario(nombreFoto, fotoUrl, triggerFoto);
        }
        return;
      }

      var btn = target.closest('.admin-ver-usuario');
      if (!btn) return;
      var id = parseInt(btn.getAttribute('data-id'), 10);
      if (!id) return;
      cargarDetalleUsuario(id);
    });
  }

  var btnCerrar = document.getElementById('admin-modal-cerrar');
  if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalUsuario);

  var modalFoto = document.getElementById('admin-usuario-foto-modal');
  if (modalFoto) {
    modalFoto.addEventListener('click', function (e) {
      if (e.target === modalFoto) cerrarModalFotoUsuario();
    });
  }

  var btnFotoCerrarX = document.getElementById('admin-usuario-foto-cerrar-x');
  if (btnFotoCerrarX) btnFotoCerrarX.addEventListener('click', cerrarModalFotoUsuario);

  var btnFotoCerrar = document.getElementById('admin-usuario-foto-cerrar');
  if (btnFotoCerrar) btnFotoCerrar.addEventListener('click', cerrarModalFotoUsuario);

  var imgModalFoto = document.getElementById('admin-usuario-foto-imagen');
  if (imgModalFoto) imgModalFoto.addEventListener('error', onErrorImagenModalFotoUsuario);

  var btnCancelar = document.getElementById('admin-rol-cancelar');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', function () {
      var select = document.getElementById('admin-rol-select');
      if (select && adminUsersState.rolOriginalId != null) {
        select.value = String(adminUsersState.rolOriginalId);
      }
      var confirmBox = document.getElementById('admin-confirm-box');
      if (confirmBox) confirmBox.hidden = true;
      cerrarModalUsuario();
    });
  }

  var btnGuardar = document.getElementById('admin-rol-guardar');
  if (btnGuardar) btnGuardar.addEventListener('click', prepararConfirmacionCambio);

  var btnConfirmar = document.getElementById('admin-confirm-aceptar');
  if (btnConfirmar) btnConfirmar.addEventListener('click', ejecutarCambioRol);

  var btnConfirmCancelar = document.getElementById('admin-confirm-cancelar');
  if (btnConfirmCancelar) {
    btnConfirmCancelar.addEventListener('click', function () {
      var confirmBox = document.getElementById('admin-confirm-box');
      if (confirmBox) confirmBox.hidden = true;
      var select = document.getElementById('admin-rol-select');
      if (select && adminUsersState.rolOriginalId != null) {
        select.value = String(adminUsersState.rolOriginalId);
      }
    });
  }

  cerrarModalUsuario();
}

function setMensajePromociones(texto, esError) {
  var msg = document.getElementById('admin-promociones-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setMensajePromocionesLista(texto, esError) {
  var msg = document.getElementById('admin-promociones-lista-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff6b6b' : '#87efba';
}

function setReintentoPromocionesVisible(visible) {
  var btn = document.getElementById('admin-promociones-reintentar');
  if (!btn) return;
  btn.hidden = !visible;
  btn.disabled = !!adminPromotionsState.cargando;
}

function renderErrorCargaPromocionesSinDatos() {
  var tbody = document.getElementById('admin-promociones-lista-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7">No se pudieron cargar las promociones.</td></tr>';

  var pagWrap = document.getElementById('admin-promociones-pagination-wrap');
  if (pagWrap) pagWrap.hidden = true;
}

function actualizarEstadoBotonModalPromocion() {
  var btn = document.getElementById('admin-promocion-crear-toggle');
  var modal = document.getElementById('admin-promocion-modal');
  if (!btn) return;

  var abierto = !!(adminPromotionsState.modal && adminPromotionsState.modal.abierto && modal && !modal.hidden);
  btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
}

function obtenerElementosEnfocablesModalPromocion() {
  var modal = document.getElementById('admin-promocion-modal');
  if (!modal || modal.hidden) return [];

  var selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var todos = modal.querySelectorAll(selector);
  return Array.prototype.filter.call(todos, function (el) {
    return !el.hidden && el.getAttribute('aria-hidden') !== 'true';
  });
}

function cerrarModalPromocion() {
  if (adminPromotionsState.enviando) return;

  var modal = document.getElementById('admin-promocion-modal');
  if (!modal) return;

  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('admin-modal-open');
  adminPromotionsState.modal.abierto = false;
  adminPromotionsState.abriendoModal = false;
  adminPromotionsState.editandoId = 0;

  document.removeEventListener('keydown', manejarTecladoModalPromocion, true);
  actualizarEstadoBotonModalPromocion();

  var foco = adminPromotionsState.modal.ultimoFoco;
  adminPromotionsState.modal.ultimoFoco = null;
  if (foco && typeof foco.focus === 'function') {
    try { foco.focus(); } catch (_) { }
  }
}

function manejarTecladoModalPromocion(e) {
  if (!adminPromotionsState.modal.abierto) return;

  if (e.key === 'Escape') {
    if (adminPromotionsState.enviando) return;
    e.preventDefault();
    cerrarModalPromocion();
    return;
  }

  if (e.key !== 'Tab') return;

  var focusables = obtenerElementosEnfocablesModalPromocion();
  if (!focusables.length) return;

  var primero = focusables[0];
  var ultimo = focusables[focusables.length - 1];
  var indiceActual = focusables.indexOf(document.activeElement);

  if (indiceActual < 0) {
    e.preventDefault();
    primero.focus();
    return;
  }

  if (e.shiftKey && document.activeElement === primero) {
    e.preventDefault();
    ultimo.focus();
    return;
  }

  if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primero.focus();
  }
}

function abrirModalPromocion(modo, elementoRetorno) {
  var modal = document.getElementById('admin-promocion-modal');
  if (!modal) return;

  if (adminPromotionsState.preview.abierto) {
    cerrarPreviewPromocion(false);
  }

  adminPromotionsState.modal.ultimoFoco = elementoRetorno || document.activeElement || null;
  setModoFormularioPromocion(modo || 'crear');

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('admin-modal-open');
  adminPromotionsState.modal.abierto = true;
  actualizarEstadoBotonModalPromocion();

  document.removeEventListener('keydown', manejarTecladoModalPromocion, true);
  document.addEventListener('keydown', manejarTecladoModalPromocion, true);

  var primerControl = document.getElementById('promocion-nombre') || modal.querySelector('input, select, textarea, button');
  if (primerControl && typeof primerControl.focus === 'function') {
    setTimeout(function () {
      try { primerControl.focus(); } catch (_) { }
    }, 0);
  }
}

function obtenerElementosEnfocablesPreviewPromocion() {
  var modal = document.getElementById('admin-promocion-preview-modal');
  if (!modal || modal.hidden) return [];

  var selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var todos = modal.querySelectorAll(selector);
  return Array.prototype.filter.call(todos, function (el) {
    return !el.hidden && el.getAttribute('aria-hidden') !== 'true';
  });
}

function manejarTecladoPreviewPromocion(e) {
  if (!adminPromotionsState.preview.abierto) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    cerrarPreviewPromocion();
    return;
  }

  if (e.key !== 'Tab') return;

  var focusables = obtenerElementosEnfocablesPreviewPromocion();
  if (!focusables.length) return;

  var primero = focusables[0];
  var ultimo = focusables[focusables.length - 1];
  var indiceActual = focusables.indexOf(document.activeElement);

  if (indiceActual < 0) {
    e.preventDefault();
    primero.focus();
    return;
  }

  if (e.shiftKey && document.activeElement === primero) {
    e.preventDefault();
    ultimo.focus();
    return;
  }

  if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primero.focus();
  }
}

function cerrarPreviewPromocion(restaurarFoco) {
  var modal = document.getElementById('admin-promocion-preview-modal');
  if (!modal) return;

  var debeRestaurarFoco = restaurarFoco !== false;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  adminPromotionsState.preview.abierto = false;
  adminPromotionsState.preview.promocionId = 0;

  document.removeEventListener('keydown', manejarTecladoPreviewPromocion, true);

  if (!adminPromotionsState.modal.abierto) {
    document.body.classList.remove('admin-modal-open');
  }

  var foco = adminPromotionsState.preview.ultimoFoco;
  adminPromotionsState.preview.ultimoFoco = null;
  if (debeRestaurarFoco && foco && typeof foco.focus === 'function') {
    try { foco.focus(); } catch (_) { }
  }
}

function obtenerRutaImagenPromoAdmin(ruta) {
  var valor = String(ruta || '').trim();
  if (!valor) return '/img/evento-default.jpg';
  if (/^https?:\/\//i.test(valor)) return valor;
  if (valor.charAt(0) === '/') return valor;
  return '/' + valor.replace(/^\.+\//, '');
}

function construirUrlImagenPromocionAdmin(referencia) {
  var valor = String(referencia || '').trim();
  if (!valor) return '';
  return '/api/promotion-image.ashx?v=' + encodeURIComponent(valor);
}

function obtenerImagenVisualPromocionAdmin(promo) {
  if (!promo) return '/img/evento-default.jpg';
  var urlPropia = String(promo.imagenPromocionUrl || '').trim();
  if (urlPropia) return obtenerRutaImagenPromoAdmin(urlPropia);

  var referenciaPropia = String(promo.imagenPromocion || '').trim();
  if (referenciaPropia) return construirUrlImagenPromocionAdmin(referenciaPropia);

  return obtenerRutaImagenPromoAdmin(promo.imagenServicio);
}

function formatearMonedaPromoAdmin(monto) {
  return Number(monto || 0).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatearFechaPromoAdmin(fechaIso) {
  var fecha = new Date(String(fechaIso || '') + 'T00:00:00');
  if (Number.isNaN(fecha.getTime())) return String(fechaIso || '');
  return fecha.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function beneficioPromoPublicoAdmin(item) {
  var tipo = String(item.tipoPromocion || '').toUpperCase();
  if (tipo === 'CONSULTA') return 'Solo consulta';
  if (tipo === 'DOS_POR_UNO') {
    var compra = item.cantidadCompra != null ? Number(item.cantidadCompra) : 1;
    var entrega = item.cantidadEntrega != null ? Number(item.cantidadEntrega) : 2;
    return entrega + ' clases por el precio de ' + compra;
  }

  var descuento = Number(item.porcentajeDescuento || 0);
  return descuento.toFixed(2).replace(/\.00$/, '') + '% de descuento';
}

function obtenerVigenciaTemporalPromocion(item) {
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  var inicio = new Date(String(item.fechaInicio || '') + 'T00:00:00');
  var fin = new Date(String(item.fechaFin || '') + 'T00:00:00');

  if (!Number.isNaN(inicio.getTime()) && hoy < inicio) return 'Próxima';
  if (!Number.isNaN(fin.getTime()) && hoy > fin) return 'Vencida';
  return 'Vigente';
}

function calcularPrecioPromocionalAdmin(item) {
  var tipo = String(item.tipoPromocion || '').toUpperCase();
  var precioRegular = Number(item.precioServicio || 0);
  if (tipo === 'DOS_POR_UNO') return null;

  var precioDesdeApi = Number(item.precioPromocional);
  if (Number.isFinite(precioDesdeApi) && precioDesdeApi >= 0) {
    return precioDesdeApi;
  }

  var porcentaje = Number(item.porcentajeDescuento || 0);
  var valor = precioRegular * (1 - (porcentaje / 100));
  if (!Number.isFinite(valor) || valor < 0) valor = 0;
  return Math.round(valor * 100) / 100;
}

function abrirPreviewPromocion(idPromocion, triggerEl) {
  var idObjetivo = Number(idPromocion || 0);
  if (!idObjetivo) return;

  var promo = null;
  for (var i = 0; i < adminPromotionsState.promociones.length; i += 1) {
    var p = normalizarPromocionAdmin(adminPromotionsState.promociones[i]);
    if (p && Number(p.idPromocion) === idObjetivo) {
      promo = p;
      break;
    }
  }
  if (!promo) return;

  if (adminPromotionsState.modal.abierto) {
    cerrarModalPromocion();
  }

  var modal = document.getElementById('admin-promocion-preview-modal');
  var contenido = document.getElementById('admin-promocion-preview-contenido');
  if (!modal || !contenido) return;

  var tipo = String(promo.tipoPromocion || '').toUpperCase();
  var esDosPorUno = tipo === 'DOS_POR_UNO';
  var esConsulta = tipo === 'CONSULTA';
  var etiquetaTipo = esConsulta ? 'Solo consulta' : esDosPorUno ? '2x1' : 'Descuento';
  var estadoAdmin = promo.activo ? 'Activa' : 'Inactiva';
  var vigenciaTemporal = obtenerVigenciaTemporalPromocion(promo);
  var precioRegular = Number(promo.precioServicio || 0);
  var precioPromo = calcularPrecioPromocionalAdmin(promo);

  contenido.innerHTML = [
    '<article class="admin-promocion-preview-card">',
    '<div class="admin-promocion-preview-media">',
    '<img src="', escapeHtml(obtenerImagenVisualPromocionAdmin(promo)), '" alt="', escapeHtml(promo.servicio || promo.nombre || 'Servicio'), '" onerror="this.onerror=null;this.src=\'/img/evento-default.jpg\';">',
    '</div>',
    '<div class="admin-promocion-preview-content">',
    '<p class="admin-promocion-preview-badge">', escapeHtml(etiquetaTipo), '</p>',
    '<h4>', escapeHtml(promo.nombre || ''), '</h4>',
    '<p class="admin-promocion-preview-beneficio">', escapeHtml(beneficioPromoPublicoAdmin(promo)), '</p>',
    '<p><strong>Servicio:</strong> ', escapeHtml(promo.servicio || ''), '</p>',
    '<p><strong>Descripción:</strong> ', escapeHtml(promo.descripcion || ''), '</p>',
    esConsulta ? '' : '<p><strong>Precio regular:</strong> CRC ' + escapeHtml(formatearMonedaPromoAdmin(precioRegular)) + '</p>',
    esConsulta ? '' : !esDosPorUno ? '<p><strong>Precio promocional:</strong> CRC ' + escapeHtml(formatearMonedaPromoAdmin(precioPromo)) + '</p>' : '<p><strong>Condiciones 2x1:</strong> ' + escapeHtml(beneficioPromoPublicoAdmin(promo)) + '</p>',
    '<p><strong>Vigencia:</strong> ', escapeHtml(formatearFechaPromoAdmin(promo.fechaInicio)), ' al ', escapeHtml(formatearFechaPromoAdmin(promo.fechaFin)), '</p>',
    '<p><strong>Estado administrativo:</strong> ', escapeHtml(estadoAdmin), '</p>',
    '<p><strong>Vigencia temporal:</strong> ', escapeHtml(vigenciaTemporal), '</p>',
    '<div class="admin-promocion-preview-estados">',
    '<span class="admin-promocion-preview-estado admin">', escapeHtml(estadoAdmin), '</span>',
    '<span class="admin-promocion-preview-estado vigencia">', escapeHtml(vigenciaTemporal), '</span>',
    '</div>',
    '</div>',
    '</article>'
  ].join('');

  adminPromotionsState.preview.abierto = true;
  adminPromotionsState.preview.promocionId = idObjetivo;
  adminPromotionsState.preview.ultimoFoco = triggerEl || document.activeElement || null;

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('admin-modal-open');

  document.removeEventListener('keydown', manejarTecladoPreviewPromocion, true);
  document.addEventListener('keydown', manejarTecladoPreviewPromocion, true);

  var btnEditar = document.getElementById('admin-promocion-preview-editar');
  if (btnEditar) {
    btnEditar.setAttribute('data-admin-editar-id', String(idObjetivo));
  }

  var btnCerrar = document.getElementById('admin-promocion-preview-modal-cerrar');
  if (btnCerrar && typeof btnCerrar.focus === 'function') {
    setTimeout(function () {
      try { btnCerrar.focus(); } catch (_) { }
    }, 0);
  }
}

function abrirEdicionDesdePreviewPromocion() {
  if (!adminPromotionsState.preview.abierto) return;
  var id = Number(adminPromotionsState.preview.promocionId || 0);
  if (!id) return;

  var trigger = adminPromotionsState.preview.ultimoFoco || document.activeElement || null;
  cerrarPreviewPromocion(false);
  cargarPromocionEnFormulario(id, trigger);
}

function normalizarPromocionAdmin(raw) {
  if (!raw) return null;
  return {
    idPromocion: raw.idPromocion != null ? raw.idPromocion : raw.IdPromocion,
    nombre: raw.nombre != null ? raw.nombre : raw.Nombre,
    descripcion: raw.descripcion != null ? raw.descripcion : raw.Descripcion,
    tipoPromocion: raw.tipoPromocion != null ? raw.tipoPromocion : raw.TipoPromocion,
    porcentajeDescuento: Number(raw.porcentajeDescuento != null ? raw.porcentajeDescuento : raw.PorcentajeDescuento || 0),
    cantidadCompra: raw.cantidadCompra != null ? raw.cantidadCompra : raw.CantidadCompra,
    cantidadEntrega: raw.cantidadEntrega != null ? raw.cantidadEntrega : raw.CantidadEntrega,
    fechaInicio: raw.fechaInicio != null ? raw.fechaInicio : raw.FechaInicio,
    fechaFin: raw.fechaFin != null ? raw.fechaFin : raw.FechaFin,
    idProducto: raw.idProducto != null ? raw.idProducto : raw.IdProducto,
    servicio: raw.servicio != null ? raw.servicio : raw.Servicio,
    precioServicio: Number(raw.precioServicio != null ? raw.precioServicio : raw.PrecioServicio || 0),
    precioPromocional: raw.precioPromocional != null ? Number(raw.precioPromocional) : (raw.PrecioPromocional != null ? Number(raw.PrecioPromocional) : null),
    imagenPromocion: raw.imagenPromocion != null ? raw.imagenPromocion : raw.ImagenPromocion,
    imagenPromocionUrl: raw.imagenPromocionUrl != null ? raw.imagenPromocionUrl : raw.ImagenPromocionUrl,
    imagenServicio: raw.imagenServicio != null ? raw.imagenServicio : raw.ImagenServicio,
    activo: raw.activo != null ? !!raw.activo : !!raw.Activo
  };
}

function formatearBeneficioPromocion(item) {
  var tipo = String(item.tipoPromocion || '').toUpperCase();
  if (tipo === 'CONSULTA') return 'Solo consulta';
  if (tipo === 'DOS_POR_UNO') {
    var compra = item.cantidadCompra != null ? Number(item.cantidadCompra) : 1;
    var entrega = item.cantidadEntrega != null ? Number(item.cantidadEntrega) : 2;
    return entrega + ' por ' + compra;
  }

  return String(item.porcentajeDescuento.toFixed(2)).replace(/\.00$/, '') + '%';
}

function poblarServiciosPromocion(servicios) {
  var select = document.getElementById('promocion-servicio');
  if (!select) return;

  var prev = select.value;
  select.innerHTML = '<option value="">Selecciona un servicio</option>';

  (servicios || []).forEach(function (s) {
    var id = s.idProducto != null ? s.idProducto : s.IdProducto;
    var nombre = s.nombre != null ? s.nombre : s.Nombre;
    if (!id || !nombre) return;
    select.insertAdjacentHTML('beforeend', '<option value="' + escapeHtml(String(id)) + '">' + escapeHtml(String(nombre)) + '</option>');
  });

  if (prev && select.querySelector('option[value="' + prev + '"]')) {
    select.value = prev;
  }
}

function poblarFiltroServicioPromociones(servicios) {
  var select = document.getElementById('admin-promociones-filtro-servicio');
  if (!select) return;

  var seleccionado = select.value || '';
  var opciones = ['<option value="">Todos los servicios</option>'];

  (servicios || []).forEach(function (s) {
    var id = s.idProducto != null ? s.idProducto : s.IdProducto;
    var nombre = s.nombre != null ? s.nombre : s.Nombre;
    if (!id || !nombre) return;
    var idTexto = String(id);
    var selected = seleccionado === idTexto ? ' selected' : '';
    opciones.push('<option value="' + escapeHtml(idTexto) + '"' + selected + '>' + escapeHtml(String(nombre)) + '</option>');
  });

  select.innerHTML = opciones.join('');
}

function obtenerFiltrosPromocionesDesdeVista() {
  var txtBusqueda = document.getElementById('admin-promociones-filtro-busqueda');
  var selServicio = document.getElementById('admin-promociones-filtro-servicio');
  var selTipo = document.getElementById('admin-promociones-filtro-tipo');
  var selEstado = document.getElementById('admin-promociones-filtro-estado');

  adminPromotionsState.filtros.busqueda = txtBusqueda ? String(txtBusqueda.value || '').trim().toLowerCase() : '';
  adminPromotionsState.filtros.servicio = selServicio ? String(selServicio.value || '').trim() : '';
  adminPromotionsState.filtros.tipo = selTipo ? String(selTipo.value || '').trim().toUpperCase() : '';
  adminPromotionsState.filtros.estado = selEstado ? String(selEstado.value || '').trim().toLowerCase() : '';
}

function filtrarPromociones(items) {
  var filtros = adminPromotionsState.filtros || {};
  var busqueda = String(filtros.busqueda || '').trim().toLowerCase();
  var servicio = String(filtros.servicio || '').trim();
  var tipo = String(filtros.tipo || '').trim().toUpperCase();
  var estado = String(filtros.estado || '').trim().toLowerCase();

  return (items || []).map(normalizarPromocionAdmin).filter(function (item) {
    if (!item) return false;

    if (busqueda) {
      var nombre = String(item.nombre || '').toLowerCase();
      if (nombre.indexOf(busqueda) < 0) return false;
    }

    if (servicio && String(item.idProducto || '') !== servicio) {
      return false;
    }

    if (tipo && String(item.tipoPromocion || '').toUpperCase() !== tipo) {
      return false;
    }

    if (estado === 'activa' && !item.activo) return false;
    if (estado === 'inactiva' && item.activo) return false;

    return true;
  });
}

function renderListadoPromocionesPaginado() {
  var filtradas = filtrarPromociones(adminPromotionsState.promociones);
  adminPromotionsState.listadoFiltrado = filtradas;

  var paginacion = resolverPaginacionLocal(filtradas, adminPromotionsState.paginacion.pagina, adminPromotionsState.paginacion.pageSize || 10);
  adminPromotionsState.paginacion.pagina = paginacion.meta.pagina;
  adminPromotionsState.paginacion.total = paginacion.meta.total;

  renderListadoPromociones(paginacion.items);

  renderControlesPaginacion(
    'admin-promociones-pagination',
    paginacion.meta,
    adminPromotionsState.cargando,
    function () {
      if (adminPromotionsState.paginacion.pagina <= 1 || adminPromotionsState.cargando) return;
      adminPromotionsState.paginacion.pagina -= 1;
      renderListadoPromocionesPaginado();
    },
    function () {
      if (adminPromotionsState.cargando) return;
      var totalPaginas = paginacion.meta.totalPaginas || 1;
      if (adminPromotionsState.paginacion.pagina >= totalPaginas) return;
      adminPromotionsState.paginacion.pagina += 1;
      renderListadoPromocionesPaginado();
    }
  );
}

function renderListadoPromociones(items) {
  var tbody = document.getElementById('admin-promociones-lista-body');
  if (!tbody) return;

  if (!items || !items.length) {
    tbody.innerHTML = '<tr><td colspan="7">No hay promociones registradas.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(function (raw) {
    var item = normalizarPromocionAdmin(raw) || {};
    var estado = item.activo ? 'Activa' : 'Inactiva';
    var estadoClass = item.activo ? 'admin-estado-badge activo' : 'admin-estado-badge inactivo';
    var fechaInicioTexto = formatearFechaSoloAdmin(item.fechaInicio);
    var fechaFinTexto = formatearFechaSoloAdmin(item.fechaFin);
    var vigencia = (fechaInicioTexto && fechaFinTexto)
      ? (fechaInicioTexto + ' a ' + fechaFinTexto)
      : (fechaInicioTexto || fechaFinTexto || 'No disponible');

    if (item.tipoPromocion === 'CONSULTA' && formatearFechaInputAdmin(item.fechaInicio) === '1900-01-01') vigencia = 'Por definir';

    var idPromocion = String(item.idPromocion || 0);
    var nombrePromocion = item.nombre || '';
    var ariaPreview = 'Ver vista previa de promoción: ' + (nombrePromocion || 'promoción');
    var ariaEditar = 'Editar promoción: ' + (nombrePromocion || 'promoción');

    return [
      '<tr>',
      '<td><button type="button" class="admin-promocion-nombre-btn" data-admin-preview-promocion="', escapeHtml(idPromocion), '" aria-label="', escapeHtml(ariaPreview), '">', escapeHtml(nombrePromocion), '</button></td>',
      '<td>', escapeHtml(item.servicio || ''), '</td>',
      '<td>', escapeHtml(item.tipoPromocion || ''), '</td>',
      '<td>', escapeHtml(formatearBeneficioPromocion(item)), '</td>',
      '<td>', escapeHtml(vigencia), '</td>',
      '<td><span class="', estadoClass, '">', estado, '</span></td>',
      '<td><button type="button" class="boton boton-secundario boton-pequeno admin-promocion-editar" data-admin-editar-promocion="', escapeHtml(idPromocion), '" aria-label="', escapeHtml(ariaEditar), '">Editar</button></td>',
      '</tr>'
    ].join('');
  }).join('');
}

function aplicarTipoPromocionUI() {
  var tipo = document.getElementById('promocion-tipo');
  var porcentaje = document.getElementById('promocion-porcentaje');
  var compra = document.getElementById('promocion-cantidad-compra');
  var entrega = document.getElementById('promocion-cantidad-entrega');
  if (!tipo || !porcentaje || !compra || !entrega) return;

  var esDosPorUno = (tipo.value || '').toUpperCase() === 'DOS_POR_UNO';
  var esConsulta = (tipo.value || '').toUpperCase() === 'CONSULTA';
  porcentaje.disabled = esDosPorUno || esConsulta;
  if (esConsulta) porcentaje.value = '0';
  compra.disabled = !esDosPorUno;
  entrega.disabled = !esDosPorUno;

  if (esDosPorUno) {
    porcentaje.value = '0';
    if (!compra.value) compra.value = '1';
    if (!entrega.value) entrega.value = '2';
  } else {
    compra.value = '';
    entrega.value = '';
  }
}

function setFormularioPromocionBloqueado(bloqueado) {
  adminPromotionsState.enviando = !!bloqueado;

  var form = document.getElementById('admin-promociones-form');
  var btnAbrir = document.getElementById('admin-promocion-crear-toggle');
  var btnCerrar = document.getElementById('admin-promocion-modal-cerrar');

  if (form) {
    var controles = form.querySelectorAll('input, select, textarea, button');
    controles.forEach(function (el) {
      if (el.id === 'promocion-id') return;
      el.disabled = !!bloqueado;
    });
  }

  if (btnAbrir) btnAbrir.disabled = !!bloqueado;
  if (btnCerrar) btnCerrar.disabled = !!bloqueado;
}

function setModoFormularioPromocion(modo) {
  var esEdicion = String(modo || '').toLowerCase() === 'editar';
  adminPromotionsState.modoFormulario = esEdicion ? 'editar' : 'crear';

  var titulo = document.getElementById('admin-promocion-modal-titulo');
  var btn = document.getElementById('promocion-guardar');
  var btnImagen = document.getElementById('promocion-imagen-seleccionar');

  if (titulo) titulo.textContent = esEdicion ? 'Editar promoción' : 'Agregar promoción';
  if (btn) btn.textContent = esEdicion ? 'Actualizar promoción' : 'Guardar promoción';
  if (btnImagen) btnImagen.textContent = esEdicion ? 'Cambiar imagen' : 'Seleccionar imagen';
}

function limpiarEstadoImagenPromocion(limpiarReferenciaActual) {
  if (adminPromotionsState.imagen.previewUrl) {
    try {
      URL.revokeObjectURL(adminPromotionsState.imagen.previewUrl);
    } catch (_) { }
  }

  adminPromotionsState.imagen.previewUrl = '';
  adminPromotionsState.imagen.archivo = null;

  if (limpiarReferenciaActual) {
    adminPromotionsState.imagen.referenciaActual = '';
    adminPromotionsState.imagen.urlActual = '';
  }

  var input = document.getElementById('promocion-imagen-input');
  if (input) input.value = '';
}

function actualizarPreviewImagenPromocion() {
  var wrap = document.getElementById('promocion-imagen-preview-wrap');
  var img = document.getElementById('promocion-imagen-preview-img');
  var empty = document.getElementById('promocion-imagen-preview-empty');
  if (!wrap || !img || !empty) return;

  var src = adminPromotionsState.imagen.previewUrl || adminPromotionsState.imagen.urlActual || '';
  wrap.hidden = false;

  if (src) {
    img.src = src;
    img.hidden = false;
    empty.hidden = true;
    return;
  }

  img.hidden = true;
  img.removeAttribute('src');
  empty.hidden = false;
}

function validarArchivoImagenPromocion(file) {
  return validarArchivoImagenServicio(file);
}

function onSeleccionImagenPromocion(e) {
  var input = e && e.target ? e.target : null;
  if (!input || !input.files || !input.files.length) {
    return;
  }

  var file = input.files[0];
  var validacion = validarArchivoImagenPromocion(file);
  if (!validacion.ok) {
    input.value = '';
    setMensajePromociones(validacion.message, true);
    return;
  }

  limpiarEstadoImagenPromocion(false);
  adminPromotionsState.imagen.archivo = file;
  adminPromotionsState.imagen.previewUrl = URL.createObjectURL(file);
  actualizarPreviewImagenPromocion();
  setMensajePromociones('', false);
}

function abrirSelectorImagenPromocion() {
  if (adminPromotionsState.enviando) return;
  var input = document.getElementById('promocion-imagen-input');
  if (input) {
    try { input.click(); } catch (_) { }
  }
}

function limpiarFormularioPromocion(preservarMensaje) {
  var form = document.getElementById('admin-promociones-form');
  if (!form) return;
  form.reset();

  var id = document.getElementById('promocion-id');
  if (id) id.value = '0';

  limpiarEstadoImagenPromocion(true);
  actualizarPreviewImagenPromocion();
  setModoFormularioPromocion('crear');
  aplicarTipoPromocionUI();

  if (!preservarMensaje) {
    setMensajePromociones('', false);
  }
}

function obtenerPayloadPromocion() {
  var id = parseInt((document.getElementById('promocion-id') || { value: '0' }).value, 10) || 0;
  var nombre = (document.getElementById('promocion-nombre') || { value: '' }).value.trim();
  var descripcion = (document.getElementById('promocion-descripcion') || { value: '' }).value.trim();
  var idProducto = parseInt((document.getElementById('promocion-servicio') || { value: '' }).value, 10) || 0;
  var tipo = ((document.getElementById('promocion-tipo') || { value: 'PORCENTAJE' }).value || '').trim().toUpperCase();
  var porcentaje = Number((document.getElementById('promocion-porcentaje') || { value: '0' }).value);
  var compraText = (document.getElementById('promocion-cantidad-compra') || { value: '' }).value.trim();
  var entregaText = (document.getElementById('promocion-cantidad-entrega') || { value: '' }).value.trim();
  var fechaInicio = (document.getElementById('promocion-fecha-inicio') || { value: '' }).value.trim();
  var fechaFin = (document.getElementById('promocion-fecha-fin') || { value: '' }).value.trim();
  var activo = ((document.getElementById('promocion-estado') || { value: '1' }).value || '1') === '1';

  if (!nombre) return { ok: false, message: 'El nombre es obligatorio.' };
  if (!idProducto) return { ok: false, message: 'Debes seleccionar un servicio asociado.' };
  if (!fechaInicio || !fechaFin) return { ok: false, message: 'Debes completar la vigencia.' };
  if (fechaInicio > fechaFin) return { ok: false, message: 'La fecha de inicio no puede ser mayor a la fecha de fin.' };

  if (tipo === 'DOS_POR_UNO') {
    var compra = Number(compraText || 0);
    var entrega = Number(entregaText || 0);
    if (!Number.isInteger(compra) || compra <= 0) {
      return { ok: false, message: 'La cantidad de compra del 2x1 debe ser un entero mayor que cero.' };
    }
    if (!Number.isInteger(entrega) || entrega <= 0) {
      return { ok: false, message: 'La cantidad de entrega del 2x1 debe ser un entero mayor que cero.' };
    }
    if (entrega <= compra) {
      return { ok: false, message: 'En 2x1, la cantidad de entrega debe ser mayor que la cantidad de compra.' };
    }
  } else {
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      return { ok: false, message: 'El descuento porcentual debe estar entre 0 y 100.' };
    }
  }

  var payload = {
    idPromocion: id,
    nombre: nombre,
    descripcion: descripcion,
    idProducto: idProducto,
    tipoPromocion: tipo,
    porcentajeDescuento: tipo === 'PORCENTAJE' ? porcentaje : 0,
    cantidadCompra: tipo === 'DOS_POR_UNO' ? Number(compraText || 1) : null,
    cantidadEntrega: tipo === 'DOS_POR_UNO' ? Number(entregaText || 2) : null,
    fechaInicio: fechaInicio,
    fechaFin: fechaFin,
    activo: activo,
    imagenPromocion: String(adminPromotionsState.imagen.referenciaActual || '').trim()
  };

  return { ok: true, payload: payload };
}

function cargarPromocionesData() {
  if (adminPromotionsState.cargando) return Promise.resolve();

  var habiaDatosPrevios = Array.isArray(adminPromotionsState.promociones) && adminPromotionsState.promociones.length > 0;
  var mostrarReintento = false;
  adminPromotionsState.cargando = true;
  setReintentoPromocionesVisible(false);
  setMensajePromocionesLista('Cargando promociones...', false);

  return fetch('/api/admin/promotions-data.ashx', { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      return resp.text().then(function (text) {
        if (esRespuestaHtmlDeLogin(resp.headers.get('content-type'), text)) {
          window.location.href = '/login.html';
          return null;
        }

        var data = null;
        try { data = JSON.parse(text); } catch (_) { data = null; }

        if (resp.status === 401) {
          window.location.href = '/login.html';
          return null;
        }
        if (resp.status === 403) {
          setMensajePromocionesLista('No tienes permisos para gestionar promociones.', true);
          mostrarReintento = false;
          return null;
        }
        if (!resp.ok || !data || !data.success) {
          throw new Error((data && data.message) || 'No se pudieron cargar las promociones.');
        }
        return data;
      });
    })
    .then(function (data) {
      if (!data) return;

      adminPromotionsState.csrfToken = data.csrfToken || '';
      adminPromotionsState.servicios = Array.isArray(data.servicios) ? data.servicios : [];
      adminPromotionsState.promociones = Array.isArray(data.promociones) ? data.promociones : [];
      adminPromotionsState.cargaExitosa = true;

      poblarServiciosPromocion(adminPromotionsState.servicios);
      poblarFiltroServicioPromociones(adminPromotionsState.servicios);
      renderListadoPromocionesPaginado();

      if (adminPromotionsState.promociones.length === 0) {
        setMensajePromocionesLista('No hay promociones registradas.', false);
      } else {
        setMensajePromocionesLista('', false);
      }
      mostrarReintento = false;
    })
    .catch(function () {
      if (!habiaDatosPrevios) {
        adminPromotionsState.promociones = [];
        adminPromotionsState.listadoFiltrado = [];
        renderErrorCargaPromocionesSinDatos();
      }

      setMensajePromocionesLista('No se pudieron cargar las promociones.', true);
      mostrarReintento = true;
    })
    .finally(function () {
      adminPromotionsState.cargando = false;
      setReintentoPromocionesVisible(mostrarReintento && !adminPromotionsState.cargando);
    });
}

function guardarPromocionAdmin(e) {
  e.preventDefault();
  if (adminPromotionsState.enviando) return;

  var validacion = obtenerPayloadPromocion();
  if (!validacion.ok) {
    setMensajePromociones(validacion.message, true);
    return;
  }

  if (!adminPromotionsState.csrfToken) {
    setMensajePromociones('No se pudo validar la seguridad de la sesión.', true);
    return;
  }

  var esEdicion = adminPromotionsState.modoFormulario === 'editar' || Number(validacion.payload.idPromocion || 0) > 0;
  setFormularioPromocionBloqueado(true);
  setMensajePromociones(esEdicion ? 'Actualizando promoción...' : 'Registrando promoción...', false);

  var requestOptions = {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'X-CSRF-Token': adminPromotionsState.csrfToken
    }
  };

  if (adminPromotionsState.imagen.archivo) {
    var fd = new FormData();
    fd.append('metadata', JSON.stringify(validacion.payload));
    fd.append('imagenPromocion', adminPromotionsState.imagen.archivo, adminPromotionsState.imagen.archivo.name || 'imagen-promocion');
    requestOptions.body = fd;
  } else {
    requestOptions.headers['Content-Type'] = 'application/json; charset=utf-8';
    requestOptions.body = JSON.stringify(validacion.payload);
  }

  fetch('/api/admin/promotions-save.ashx', requestOptions)
    .then(function (resp) {
      return resp.json().catch(function () {
        return { success: false, message: 'Respuesta inválida del servidor.' };
      }).then(function (data) {
        return { status: resp.status, data: data };
      });
    })
    .then(function (result) {
      var data = result.data || {};
      if (result.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      if (result.status === 403) {
        setMensajePromociones(data.message || 'No tienes permisos para gestionar promociones.', true);
        return;
      }

      if (!data.success) {
        setMensajePromociones(data.message || 'No fue posible guardar la promoción.', true);
        return;
      }

      setFormularioPromocionBloqueado(false);
      cerrarModalPromocion();
      limpiarFormularioPromocion(true);
      setMensajePromociones('', false);
      setMensajePromocionesLista(data.message || (esEdicion ? 'Promoción actualizada correctamente.' : 'Promoción registrada correctamente.'), false);
      cargarPromocionesData();
    })
    .catch(function () {
      setMensajePromociones('No fue posible guardar la promoción.', true);
    })
    .finally(function () {
      setFormularioPromocionBloqueado(false);
    });
}

function cargarPromocionEnFormulario(idPromocion, triggerEl) {
  var idObjetivo = Number(idPromocion || 0);
  if (!idObjetivo) return;

  if (adminPromotionsState.abriendoModal) return;
  if (adminPromotionsState.modal.abierto && Number(adminPromotionsState.editandoId || 0) === idObjetivo) return;

  adminPromotionsState.abriendoModal = true;

  var promo = null;
  for (var i = 0; i < adminPromotionsState.promociones.length; i += 1) {
    var p = normalizarPromocionAdmin(adminPromotionsState.promociones[i]);
    if (p && Number(p.idPromocion) === idObjetivo) {
      promo = p;
      break;
    }
  }

  if (!promo) {
    adminPromotionsState.abriendoModal = false;
    return;
  }

  var id = document.getElementById('promocion-id');
  var nombre = document.getElementById('promocion-nombre');
  var desc = document.getElementById('promocion-descripcion');
  var servicio = document.getElementById('promocion-servicio');
  var tipo = document.getElementById('promocion-tipo');
  var porcentaje = document.getElementById('promocion-porcentaje');
  var compra = document.getElementById('promocion-cantidad-compra');
  var entrega = document.getElementById('promocion-cantidad-entrega');
  var inicio = document.getElementById('promocion-fecha-inicio');
  var fin = document.getElementById('promocion-fecha-fin');
  var estado = document.getElementById('promocion-estado');

  if (id) id.value = String(promo.idPromocion || 0);
  if (nombre) nombre.value = promo.nombre || '';
  if (desc) desc.value = promo.descripcion || '';
  if (servicio) servicio.value = String(promo.idProducto || '');
  if (tipo) tipo.value = promo.tipoPromocion || 'PORCENTAJE';

  limpiarEstadoImagenPromocion(true);
  adminPromotionsState.imagen.referenciaActual = String(promo.imagenPromocion || '').trim();
  adminPromotionsState.imagen.urlActual = obtenerImagenVisualPromocionAdmin(promo);
  actualizarPreviewImagenPromocion();
  if (porcentaje) porcentaje.value = String(promo.porcentajeDescuento || 0);
  if (compra) compra.value = promo.cantidadCompra != null ? String(promo.cantidadCompra) : '';
  if (entrega) entrega.value = promo.cantidadEntrega != null ? String(promo.cantidadEntrega) : '';
  if (inicio) inicio.value = formatearFechaInputAdmin(promo.fechaInicio);
  if (fin) fin.value = formatearFechaInputAdmin(promo.fechaFin);
  if (estado) estado.value = promo.activo ? '1' : '0';

  adminPromotionsState.editandoId = idObjetivo;
  setModoFormularioPromocion('editar');
  aplicarTipoPromocionUI();
  setMensajePromociones('Editando promoción #' + promo.idPromocion + '.', false);
  abrirModalPromocion('editar', triggerEl || null);
  adminPromotionsState.abriendoModal = false;
}

function initPromocionesAdmin() {
  var form = document.getElementById('admin-promociones-form');
  if (form) {
    form.addEventListener('submit', guardarPromocionAdmin);
  }

  var tipo = document.getElementById('promocion-tipo');
  if (tipo) {
    tipo.addEventListener('change', aplicarTipoPromocionUI);
  }

  var inputImagen = document.getElementById('promocion-imagen-input');
  var btnSeleccionarImagen = document.getElementById('promocion-imagen-seleccionar');
  if (inputImagen) inputImagen.addEventListener('change', onSeleccionImagenPromocion);
  if (btnSeleccionarImagen) btnSeleccionarImagen.addEventListener('click', abrirSelectorImagenPromocion);
  actualizarPreviewImagenPromocion();

  var limpiar = document.getElementById('promocion-limpiar');
  if (limpiar) {
    limpiar.addEventListener('click', function () {
      limpiarFormularioPromocion();
    });
  }

  var btnAgregar = document.getElementById('admin-promocion-crear-toggle');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', function () {
      if (adminPromotionsState.enviando) return;

      var idActual = parseInt((document.getElementById('promocion-id') || { value: '0' }).value, 10) || 0;
      if (idActual > 0 || adminPromotionsState.modoFormulario === 'editar') {
        limpiarFormularioPromocion(true);
      }

      adminPromotionsState.editandoId = 0;
      adminPromotionsState.abriendoModal = false;
      setModoFormularioPromocion('crear');
      abrirModalPromocion('crear', btnAgregar);
      setMensajePromociones('', false);
    });
  }

  var btnCerrar = document.getElementById('admin-promocion-modal-cerrar');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarModalPromocion);
  }

  var modal = document.getElementById('admin-promocion-modal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.getAttribute('data-admin-promocion-modal-cerrar') === '1') {
        cerrarModalPromocion();
      }
    });
  }

  var filtroBusqueda = document.getElementById('admin-promociones-filtro-busqueda');
  var filtroServicio = document.getElementById('admin-promociones-filtro-servicio');
  var filtroTipo = document.getElementById('admin-promociones-filtro-tipo');
  var filtroEstado = document.getElementById('admin-promociones-filtro-estado');
  var btnReintentar = document.getElementById('admin-promociones-reintentar');

  function onCambioFiltroPromociones() {
    obtenerFiltrosPromocionesDesdeVista();
    adminPromotionsState.paginacion.pagina = 1;
    renderListadoPromocionesPaginado();
  }

  if (filtroBusqueda) {
    filtroBusqueda.addEventListener('input', onCambioFiltroPromociones);
  }

  if (filtroServicio) {
    filtroServicio.addEventListener('change', onCambioFiltroPromociones);
  }

  if (filtroTipo) {
    filtroTipo.addEventListener('change', onCambioFiltroPromociones);
  }

  if (filtroEstado) {
    filtroEstado.addEventListener('change', onCambioFiltroPromociones);
  }

  if (btnReintentar) {
    btnReintentar.addEventListener('click', function () {
      if (adminPromotionsState.cargando) return;
      cargarPromocionesData();
    });
  }

  var previewModal = document.getElementById('admin-promocion-preview-modal');
  var previewCerrar = document.getElementById('admin-promocion-preview-modal-cerrar');
  var previewCerrarFooter = document.getElementById('admin-promocion-preview-cerrar');
  var previewEditar = document.getElementById('admin-promocion-preview-editar');

  if (previewModal && previewModal.dataset.bound !== '1') {
    previewModal.dataset.bound = '1';
    if (previewCerrar) previewCerrar.addEventListener('click', function () { cerrarPreviewPromocion(); });
    if (previewCerrarFooter) previewCerrarFooter.addEventListener('click', function () { cerrarPreviewPromocion(); });
    if (previewEditar) previewEditar.addEventListener('click', abrirEdicionDesdePreviewPromocion);

    previewModal.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.getAttribute('data-admin-promocion-preview-modal-cerrar') === '1') {
        cerrarPreviewPromocion();
      }
    });
  }

  var tbody = document.getElementById('admin-promociones-lista-body');
  if (tbody && tbody.dataset.editBound !== '1') {
    tbody.dataset.editBound = '1';
    tbody.addEventListener('click', function (e) {
      var target = e.target;
      if (!target || !target.closest) return;
      if (adminPromotionsState.cargando || adminPromotionsState.enviando) return;

      var triggerPreview = target.closest('[data-admin-preview-promocion]');
      if (triggerPreview) {
        var idPreview = parseInt(triggerPreview.getAttribute('data-admin-preview-promocion') || '0', 10);
        if (idPreview > 0) {
          abrirPreviewPromocion(idPreview, triggerPreview);
        }
        return;
      }

      var triggerEditar = target.closest('[data-admin-editar-promocion]');
      if (triggerEditar) {
        var idEditar = parseInt(triggerEditar.getAttribute('data-admin-editar-promocion') || '0', 10);
        if (idEditar > 0) {
          cargarPromocionEnFormulario(idEditar, triggerEditar);
        }
      }
    });
  }

  adminPromotionsState.paginacion.pageSize = 10;
  adminPromotionsState.paginacion.pagina = 1;
  adminPromotionsState.filtros = { busqueda: '', servicio: '', tipo: '', estado: '' };
  adminPromotionsState.preview.abierto = false;
  adminPromotionsState.preview.promocionId = 0;
  adminPromotionsState.preview.ultimoFoco = null;

  limpiarFormularioPromocion(true);
  actualizarEstadoBotonModalPromocion();
}

function limpiarReporteServiciosVista() {
  var tipo = obtenerTipoReporteSeleccionado();
  limpiarFiltrosReportePorTipo(tipo);
  reflejarFiltrosEditablesEnVista();
  aplicarFiltrosEditablesComoAplicados(tipo);
  resetPaginacionReportes();
  setPanelFiltrosReportesAbierto(false);
  setMensajeReportes('', false);
  actualizarEstadoBotonFiltrosReportes();
  return cargarReporteAdmin(true);
}

function initReportesAdmin() {
  var form = document.getElementById('admin-reportes-form');
  if (!form) return;

  var tipoSelect = document.getElementById('admin-reportes-tipo');
  var toggleFiltros = document.getElementById('admin-reportes-filtros-toggle');
  var limpiarRapido = document.getElementById('admin-reportes-limpiar-rapido');

  function reiniciarTodosLosFiltrosReportes() {
    limpiarFiltrosReportePorTipo('servicios');
    limpiarFiltrosReportePorTipo('promociones');
    limpiarFiltrosReportePorTipo('reservas');
    limpiarFiltrosReportePorTipo('usuarios');
  }

  function recargarReporteActualTrasCambioTipo() {
    var tipoActual = obtenerTipoReporteSeleccionado();
    sincronizarFiltrosEditablesDesdeAplicados(tipoActual);
    reflejarFiltrosEditablesEnVista();
    actualizarVisibilidadFiltrosReportes();
    configurarPresentacionReportePorTipo();
    actualizarEstadoBotonFiltrosReportes();
    setPanelFiltrosReportesAbierto(false);
    resetPaginacionReportes();
    setMensajeReportes('', false);
    adminReportsState.cargadoInicial = false;
    adminReportsState.ultimoTipo = '';

    if (tipoActual === 'usuarios') {
      asegurarRolesReporteUsuariosCargados().catch(function (err) {
        setMensajeReportes((err && err.message) || 'No fue posible cargar los roles de usuario.', true);
      });
    }

    cargarReporteAdmin(true);
  }

  if (tipoSelect) {
    tipoSelect.addEventListener('change', function () {
      reiniciarTodosLosFiltrosReportes();
      recargarReporteActualTrasCambioTipo();
    });
  }

  if (toggleFiltros) {
    toggleFiltros.addEventListener('click', function () {
      var abrir = !adminReportsState.filtrosPanelAbierto;
      if (abrir) {
        var tipo = obtenerTipoReporteSeleccionado();
        sincronizarFiltrosEditablesDesdeAplicados(tipo);
        reflejarFiltrosEditablesEnVista();
      }
      setPanelFiltrosReportesAbierto(abrir);
      actualizarVisibilidadFiltrosReportes();
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var tipo = obtenerTipoReporteSeleccionado();
    capturarFiltrosReporteTipoActualDesdeVista();

    if (tipo === 'reservas') {
      var errorReservas = validarFiltrosReporteReservas();
      if (errorReservas) {
        setMensajeReportes(errorReservas, true);
        return;
      }
    } else if (tipo === 'servicios') {
      var errorValidacion = validarFiltrosReporteServicios();
      if (errorValidacion) {
        setMensajeReportes(errorValidacion, true);
        return;
      }
    }

    aplicarFiltrosEditablesComoAplicados(tipo);
    actualizarEstadoBotonFiltrosReportes();
    resetPaginacionReportes();
    cargarReporteAdmin(true);
  });

  var limpiar = document.getElementById('admin-reportes-limpiar');
  if (limpiar) {
    limpiar.addEventListener('click', function () {
      limpiarReporteServiciosVista();
    });
  }

  if (limpiarRapido) {
    limpiarRapido.addEventListener('click', function () {
      limpiarReporteServiciosVista();
    });
  }

  var exportar = document.getElementById('admin-reportes-exportar');
  if (exportar) {
    exportar.addEventListener('click', function () {
      exportarReporteServiciosExcel();
    });
  }

  reiniciarTodosLosFiltrosReportes();
  sincronizarFiltrosEditablesDesdeAplicados(obtenerTipoReporteSeleccionado());
  reflejarFiltrosEditablesEnVista();
  actualizarVisibilidadFiltrosReportes();
  configurarPresentacionReportePorTipo();
  setPanelFiltrosReportesAbierto(false);
  asegurarRolesReporteUsuariosCargados().catch(function () { });
  actualizarEstadoBotonFiltrosReportes();
  actualizarEstadoBotonExportarReporteServicios();
}

function initDashboardAdmin() {
  var desde = document.getElementById('admin-dashboard-desde');
  var hasta = document.getElementById('admin-dashboard-hasta');

  var hoy = new Date();
  var desdeBase = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);

  var hoyTexto = hoy.toISOString().slice(0, 10);
  var desdeTexto = desdeBase.toISOString().slice(0, 10);

  if (desde) desde.value = desdeTexto;
  if (hasta) hasta.value = hoyTexto;

  adminDashboardState.filtros.desde = desdeTexto;
  adminDashboardState.filtros.hasta = hoyTexto;
  adminDashboardState.rangoDefault.desde = desdeTexto;
  adminDashboardState.rangoDefault.hasta = hoyTexto;
  mostrarPeriodoAplicadoDashboard({ desde: desdeTexto, hasta: hoyTexto });

  if (adminDashboardState.inicializado) return;
  adminDashboardState.inicializado = true;

  initFiltroReservasMesDashboard();

  var form = document.getElementById('admin-dashboard-filtros-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valorDesde = desde ? String(desde.value || '').trim() : '';
      var valorHasta = hasta ? String(hasta.value || '').trim() : '';

      if (valorDesde && valorHasta && valorDesde > valorHasta) {
        setMensajeDashboard('El rango de fechas es inválido: desde no puede ser mayor que hasta.', true);
        return;
      }

      adminDashboardState.filtros.desde = valorDesde;
      adminDashboardState.filtros.hasta = valorHasta;
      cargarDashboard();
    });
  }

  var limpiar = document.getElementById('admin-dashboard-limpiar');
  if (limpiar) {
    limpiar.addEventListener('click', function () {
      var defDesde = adminDashboardState.rangoDefault.desde || desdeTexto;
      var defHasta = adminDashboardState.rangoDefault.hasta || hoyTexto;
      if (desde) desde.value = defDesde;
      if (hasta) hasta.value = defHasta;
      adminDashboardState.filtros.desde = defDesde;
      adminDashboardState.filtros.hasta = defHasta;
      cargarDashboard();
    });
  }

  var reintentar = document.getElementById('admin-dashboard-reintentar');
  if (reintentar) {
    reintentar.addEventListener('click', function () {
      if (adminDashboardState.cargando) return;
      cargarDashboard();
    });
  }
}

function setMensajeRutinasAdmin(texto, esError) {
  var msg = document.getElementById('admin-rutinas-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff9aa4' : '#87efba';
}

function normalizarRutinaAdmin(raw) {
  if (!raw) return null;
  return {
    idRutina: raw.idRutina != null ? raw.idRutina : raw.IdRutina,
    nombre: raw.nombre != null ? raw.nombre : raw.Nombre,
    descripcion: raw.descripcion != null ? raw.descripcion : raw.Descripcion,
    objetivo: raw.objetivo != null ? raw.objetivo : raw.Objetivo,
    nivel: raw.nivel != null ? raw.nivel : raw.Nivel,
    duracionAproximadaMin: Number(raw.duracionAproximadaMin != null ? raw.duracionAproximadaMin : raw.DuracionAproximadaMin || 0) * ((raw.DuracionUnidad || raw.duracionUnidad) === "horas" ? 60 : 1),
    portadaReferencia: raw.PortadaReferencia || raw.portadaReferencia,
    totalSesiones: raw.TotalSesiones || raw.totalSesiones || 0,
    activa: raw.activa != null ? !!raw.activa : !!raw.Activa
  };
}

function estadoRutinaBadge(activa) {
  return '<span class="admin-rutina-estado ' + (activa ? 'activa' : 'inactiva') + '">' + (activa ? 'Activa' : 'Inactiva') + '</span>';
}

function renderListadoRutinasAdmin() {
  var tbody = document.getElementById('admin-rutinas-lista-body');
  if (!tbody) return;

  var items = adminRoutinesState.listado || [];
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6">No hay rutinas disponibles para los filtros seleccionados.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(function (item) {
    var acciones = [
      '<button type="button" class="boton boton-secundario boton-pequeno" data-rutina-ver="' + String(item.idRutina) + '">Ver</button>',
      '<button type="button" class="boton boton-secundario boton-pequeno" data-rutina-editar="' + String(item.idRutina) + '">Editar</button>',
      '<button type="button" class="boton boton-secundario boton-pequeno" data-rutina-asignar="' + String(item.idRutina) + '">Asignar</button>',
      '<button type="button" class="boton boton-secundario boton-pequeno" data-rutina-toggle="' + String(item.idRutina) + '" data-rutina-activa="' + (item.activa ? '1' : '0') + '">' + (item.activa ? 'Desactivar' : 'Activar') + '</button>'
    ].join('');

    return [
      '<tr>',
      '  <td>' + (item.portadaReferencia ? '<img class="kr-list-cover" loading="lazy" alt="Portada de rutina" src="api/routine-media.ashx?v=' + encodeURIComponent(item.portadaReferencia) + '">' : '') + '<a href="#" data-rutina-link="' + String(item.idRutina) + '">' + escapeHtml(item.nombre || '') + '</a></td>',
      '  <td>' + escapeHtml(item.objetivo || '') + '</td>',
      '  <td>' + escapeHtml(item.nivel || '') + '</td>',
      '  <td>' + String(item.duracionAproximadaMin || 0) + ' min</td>',
      '  <td>' + estadoRutinaBadge(!!item.activa) + '</td>',
      '  <td><div class="admin-rutina-acciones">' + acciones + '</div></td>',
      '</tr>'
    ].join('');
  }).join('');
}

function cargarListadoRutinasAdmin() {
  if (adminRoutinesState.cargando) { adminRoutinesState.recargarPendiente = true; return; }
  adminRoutinesState.cargando = true;
  setMensajeRutinasAdmin('Cargando rutinas...', false);

  var p = adminRoutinesState.pagina;
  var ps = adminRoutinesState.pageSize;
  var q = adminRoutinesState.filtros;
  var query = '?page=' + encodeURIComponent(String(p)) + '&pageSize=' + encodeURIComponent(String(ps))
    + '&nombre=' + encodeURIComponent(q.nombre || '')
    + '&nivel=' + encodeURIComponent(q.nivel || '')
    + '&estado=' + encodeURIComponent(q.estado || '');

  fetch('api/admin/routines-list.ashx' + query, { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      return resp.arrayBuffer().then(function (bytes) {
        var text = (window.TextDecoder ? new TextDecoder('utf-8').decode(bytes) : String.fromCharCode.apply(null, new Uint8Array(bytes)));
        var contentType = (resp.headers.get('content-type') || '').toLowerCase();
        var esJson = contentType.indexOf('application/json') >= 0 || contentType.indexOf('+json') >= 0;

        if (esRespuestaHtmlDeLogin(contentType, text)) {
          if (resp.status === 404) {
            throw new Error('No se encontró el endpoint de rutinas. Verifica la ruta /api/admin/routines-list.ashx y la raíz del sitio en IIS Express.');
          }
          window.location.href = '/login.html';
          return null;
        }

        if (!resp.ok && !esJson) {
          if (resp.status === 404) {
            throw new Error('No se encontró el endpoint de rutinas. Verifica la ruta /api/admin/routines-list.ashx y la raíz del sitio en IIS Express.');
          }
          throw new Error('Error HTTP ' + resp.status + ' al cargar rutinas.');
        }

        var data = null;
        if (esJson && text) {
          try { data = JSON.parse(text); } catch (_) { data = null; }
        }

        if (resp.status === 401) {
          window.location.href = '/login.html';
          return null;
        }

        if (resp.status === 403) {
          setMensajeRutinasAdmin((data && data.message) || 'No tienes permisos para gestionar rutinas.', true);
          return null;
        }

        if (!resp.ok) {
          throw new Error((data && data.message) || ('Error HTTP ' + resp.status + ' al cargar rutinas.'));
        }

        if (!data || !data.success) {
          throw new Error((data && data.message) || 'La respuesta del servidor no es JSON válido para rutinas.');
        }

        return data;
      });
    })
    .then(function (data) {
      if (!data) return;

      adminRoutinesState.csrfToken = data.csrfToken || adminRoutinesState.csrfToken || '';
      adminRoutinesState.rutinasActivas = (Array.isArray(data.rutinasDisponibles) ? data.rutinasDisponibles : []).map(normalizarRutinaAdmin).filter(function (x) { return !!x; });

      var pag = data.paginacion || {};
      adminRoutinesState.pagina = Number(pag.pagina || p);
      adminRoutinesState.totalPaginas = Number(pag.totalPaginas || 1);
      adminRoutinesState.totalRegistros = Number(pag.totalRegistros || 0);
      adminRoutinesState.listado = (Array.isArray(data.rutinas) ? data.rutinas : []).map(normalizarRutinaAdmin).filter(function (x) { return !!x; });

      renderListadoRutinasAdmin();
      renderControlesPaginacion('admin-rutinas-pagination', {
        pagina: adminRoutinesState.pagina,
        totalPaginas: adminRoutinesState.totalPaginas,
        pageSize: adminRoutinesState.pageSize,
        total: adminRoutinesState.totalRegistros,
        desde: pag.mostrandoDesde || 0,
        hasta: pag.mostrandoHasta || 0
      }, false, function () {
        if (adminRoutinesState.pagina <= 1) return;
        adminRoutinesState.pagina -= 1;
        cargarListadoRutinasAdmin();
      }, function () {
        if (adminRoutinesState.pagina >= adminRoutinesState.totalPaginas) return;
        adminRoutinesState.pagina += 1;
        cargarListadoRutinasAdmin();
      });

      setMensajeRutinasAdmin(adminRoutinesState.listado.length ? 'Rutinas actualizadas.' : 'No hay rutinas disponibles.', false);
    })
    .catch(function (err) {
      var tbody = document.getElementById('admin-rutinas-lista-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="6">No fue posible cargar las rutinas.</td></tr>';
      renderControlesPaginacion('admin-rutinas-pagination', { pagina: 1, totalPaginas: 1, pageSize: adminRoutinesState.pageSize, total: 0, desde: 0, hasta: 0 }, false);
      setMensajeRutinasAdmin((err && err.message) || 'No fue posible cargar las rutinas.', true);
    })
    .finally(function () {
      adminRoutinesState.cargando = false;
      if (adminRoutinesState.recargarPendiente) { adminRoutinesState.recargarPendiente = false; cargarListadoRutinasAdmin(); }
    });
}

function abrirModalCrearRutina(trigger) { KFitnessRutinasAdmin.create(trigger); }

function abrirModalDetalleRutina(idRutina, trigger) { KFitnessRutinasAdmin.view(idRutina, trigger); }

function abrirModalEditarRutina(idRutina, trigger) { KFitnessRutinasAdmin.edit(idRutina, trigger); }

function cambiarEstadoRutinaAdmin(idRutina, activaActual) {
  if (!adminRoutinesState.csrfToken) {
    setMensajeRutinasAdmin('No se pudo validar el token de seguridad. Recarga la lista.', true);
    return;
  }

  var activar = !activaActual;
  var textoConfirmacion = activar ? '¿Deseas activar esta rutina?' : '¿Deseas desactivar esta rutina?';
  if (!window.confirm(textoConfirmacion)) return;

  fetch('api/admin/routines-toggle.ashx', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-CSRF-Token': adminRoutinesState.csrfToken
    },
    body: JSON.stringify({ idRutina: idRutina, activa: activar })
  })
    .then(function (resp) {
      return resp.json().catch(function () { return { success: false, message: 'Respuesta inválida.' }; })
        .then(function (data) { return { status: resp.status, data: data || {} }; });
    })
    .then(function (result) {
      if (result.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      if (!result.data.success) {
        setMensajeRutinasAdmin(result.data.message || 'No fue posible cambiar el estado de la rutina.', true);
        return;
      }

      setMensajeRutinasAdmin(result.data.message || 'Estado actualizado.', false);
      cargarListadoRutinasAdmin();
    })
    .catch(function () {
      setMensajeRutinasAdmin('No fue posible conectar con el servidor.', true);
    });
}

function cargarUsuariosAsignacionRutina(query) {
  var q = query || '';
  return fetch('api/admin/routines-users.ashx?q=' + encodeURIComponent(q) + '&max=20', { method: 'GET', credentials: 'same-origin' })
    .then(function (resp) {
      if (resp.status === 401) { window.location.href = '/login.html'; return null; }
      return resp.json().then(function (data) { return { status: resp.status, data: data || {} }; });
    })
    .then(function (result) {
      if (!result) return [];
      if (result.status !== 200 || !result.data.success) {
        throw new Error((result.data && result.data.message) || 'No fue posible cargar usuarios.');
      }
      return Array.isArray(result.data.usuarios) ? result.data.usuarios : [];
    });
}

function actualizarSelectUsuariosAsignacion(items) {
  var sel = document.getElementById('admin-rutina-asignar-usuario');
  if (!sel) return;

  var opciones = ['<option value="">Selecciona un cliente</option>'];
  (items || []).forEach(function (u) {
    var id = u.idUsuario != null ? u.idUsuario : u.IdUsuario;
    var nombre = u.nombreCompleto != null ? u.nombreCompleto : u.NombreCompleto;
    var correo = u.correo != null ? u.correo : u.Correo;
    opciones.push('<option value="' + String(id) + '">' + escapeHtml((nombre || '') + ' (' + (correo || '') + ')') + '</option>');
  });
  sel.innerHTML = opciones.join('');
}

function actualizarSelectRutinasActivasAsignacion() {
  var sel = document.getElementById('admin-rutina-asignar-rutina');
  if (!sel) return;

  var opciones = ['<option value="">Selecciona una rutina</option>'];
  (adminRoutinesState.rutinasActivas || []).forEach(function (r) {
    opciones.push('<option value="' + String(r.idRutina) + '">' + escapeHtml((r.nombre || '') + ' - ' + (r.nivel || '')) + '</option>');
  });
  sel.innerHTML = opciones.join('');
}

function actualizarResumenAsignacionRutina() {
  var usuarioSel = document.getElementById('admin-rutina-asignar-usuario');
  var rutinaSel = document.getElementById('admin-rutina-asignar-rutina');
  var resumen = document.getElementById('admin-rutina-asignar-resumen');
  if (!usuarioSel || !rutinaSel || !resumen) return;

  var txtUsuario = usuarioSel.options[usuarioSel.selectedIndex] ? usuarioSel.options[usuarioSel.selectedIndex].text : '';
  var txtRutina = rutinaSel.options[rutinaSel.selectedIndex] ? rutinaSel.options[rutinaSel.selectedIndex].text : '';

  if (!usuarioSel.value || !rutinaSel.value) {
    resumen.textContent = 'Selecciona cliente y rutina para ver el resumen.';
    return;
  }

  resumen.textContent = 'Se asignará la rutina "' + txtRutina + '" al cliente "' + txtUsuario + '".';
}

function abrirModalAsignarRutina(idRutina, trigger) {
  var modal = document.getElementById('admin-rutina-asignar-modal');
  if (!modal) return;

  adminRoutinesState.modalAsignar.abierto = true;
  adminRoutinesState.modalAsignar.ultimoFoco = trigger || document.activeElement;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('admin-modal-open');

  var selRutina = document.getElementById('admin-rutina-asignar-rutina');
  var selUsuario = document.getElementById('admin-rutina-asignar-usuario');
  var buscarUsuario = document.getElementById('admin-rutina-asignar-usuario-buscar');
  var msg = document.getElementById('admin-rutina-asignar-mensaje');
  if (msg) { msg.textContent = ''; msg.style.color = '#87efba'; }
  var errU = document.getElementById('admin-rutina-asignar-usuario-error');
  if (errU) errU.textContent = '';
  var errR = document.getElementById('admin-rutina-asignar-rutina-error');
  if (errR) errR.textContent = '';

  actualizarSelectRutinasActivasAsignacion();
  if (selRutina && idRutina) selRutina.value = String(idRutina);

  if (selUsuario) selUsuario.innerHTML = '<option value="">Cargando clientes...</option>';
  if (buscarUsuario) buscarUsuario.value = '';

  cargarUsuariosAsignacionRutina('')
    .then(function (usuarios) {
      adminRoutinesState.usuariosBusqueda = usuarios || [];
      actualizarSelectUsuariosAsignacion(adminRoutinesState.usuariosBusqueda);
      actualizarResumenAsignacionRutina();
    })
    .catch(function (err) {
      if (selUsuario) selUsuario.innerHTML = '<option value="">No fue posible cargar clientes</option>';
      if (msg) { msg.textContent = (err && err.message) || 'No fue posible cargar clientes.'; msg.style.color = '#ff9aa4'; }
    });
}

function cerrarModalAsignarRutina() {
  var modal = document.getElementById('admin-rutina-asignar-modal');
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  adminRoutinesState.modalAsignar.abierto = false;
  document.body.classList.remove('admin-modal-open');
  var prev = adminRoutinesState.modalAsignar.ultimoFoco;
  adminRoutinesState.modalAsignar.ultimoFoco = null;
  if (prev && typeof prev.focus === 'function') prev.focus();
}

function enviarAsignacionRutinaAdmin(e) {
  e.preventDefault();
  if (adminRoutinesState.asignando) return;

  var selUsuario = document.getElementById('admin-rutina-asignar-usuario');
  var selRutina = document.getElementById('admin-rutina-asignar-rutina');
  var errU = document.getElementById('admin-rutina-asignar-usuario-error');
  var errR = document.getElementById('admin-rutina-asignar-rutina-error');
  var msg = document.getElementById('admin-rutina-asignar-mensaje');
  var btn = document.getElementById('admin-rutina-asignar-confirmar');

  if (errU) errU.textContent = '';
  if (errR) errR.textContent = '';

  var idUsuario = selUsuario ? parseInt(selUsuario.value || '0', 10) : 0;
  var idRutina = selRutina ? parseInt(selRutina.value || '0', 10) : 0;

  var valido = true;
  if (!idUsuario) {
    valido = false;
    if (errU) errU.textContent = 'Selecciona un cliente.';
  }
  if (!idRutina) {
    valido = false;
    if (errR) errR.textContent = 'Selecciona una rutina activa.';
  }
  if (!valido) return;

  if (!adminRoutinesState.csrfToken) {
    if (msg) { msg.textContent = 'No se pudo validar el token de seguridad. Recarga la lista.'; msg.style.color = '#ff9aa4'; }
    return;
  }

  adminRoutinesState.asignando = true;
  if (btn) btn.disabled = true;
  if (msg) { msg.textContent = 'Asignando rutina...'; msg.style.color = '#87efba'; }

  fetch('api/admin/routines-assign.ashx', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-CSRF-Token': adminRoutinesState.csrfToken
    },
    body: JSON.stringify({ idUsuario: idUsuario, idRutina: idRutina })
  })
    .then(function (resp) {
      return resp.json().catch(function () { return { success: false, message: 'Respuesta inválida.' }; })
        .then(function (data) { return { status: resp.status, data: data || {} }; });
    })
    .then(function (result) {
      if (result.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      if (!result.data.success) {
        if (msg) { msg.textContent = result.data.message || 'No fue posible asignar la rutina.'; msg.style.color = '#ff9aa4'; }
        return;
      }

      if (msg) { msg.textContent = result.data.message || 'Rutina asignada correctamente.'; msg.style.color = '#87efba'; }
      setMensajeRutinasAdmin(result.data.message || 'Rutina asignada correctamente.', false);
      cerrarModalAsignarRutina();
      cargarListadoRutinasAdmin();
    })
    .catch(function () {
      if (msg) { msg.textContent = 'No fue posible conectar con el servidor.'; msg.style.color = '#ff9aa4'; }
    })
    .finally(function () {
      adminRoutinesState.asignando = false;
      if (btn) btn.disabled = false;
    });
}

function initRutinasAdmin() {
  var filtroNombre = document.getElementById('admin-rutinas-filtro-nombre');
  var filtroNivel = document.getElementById('admin-rutinas-filtro-nivel');
  var filtroEstado = document.getElementById('admin-rutinas-filtro-estado');
  var btnCrear = document.getElementById('admin-rutina-crear-toggle');
  var btnIa = document.getElementById('admin-rutina-ia-toggle');
  var tbody = document.getElementById('admin-rutinas-lista-body');

  if (filtroNombre && filtroNombre.dataset.bound !== '1') {
    filtroNombre.dataset.bound = '1';
    filtroNombre.addEventListener('input', function () {
      adminRoutinesState.filtros.nombre = String(filtroNombre.value || '').trim();
      adminRoutinesState.pagina = 1;
      cargarListadoRutinasAdmin();
    });
  }

  if (filtroNivel && filtroNivel.dataset.bound !== '1') {
    filtroNivel.dataset.bound = '1';
    filtroNivel.addEventListener('change', function () {
      adminRoutinesState.filtros.nivel = String(filtroNivel.value || '').trim();
      adminRoutinesState.pagina = 1;
      cargarListadoRutinasAdmin();
    });
  }

  if (filtroEstado && filtroEstado.dataset.bound !== '1') {
    filtroEstado.dataset.bound = '1';
    filtroEstado.addEventListener('change', function () {
      adminRoutinesState.filtros.estado = String(filtroEstado.value || '').trim();
      adminRoutinesState.pagina = 1;
      cargarListadoRutinasAdmin();
    });
  }

  if (btnCrear && btnCrear.dataset.bound !== '1') {
    btnCrear.dataset.bound = '1';
    btnCrear.addEventListener('click', function () {
      abrirModalCrearRutina(btnCrear);
    });
  }

  if (btnIa && btnIa.dataset.bound !== '1') {
    btnIa.dataset.bound = '1';
    btnIa.addEventListener('click', function () {
      limpiarErroresRutinaIa();
      setMensajeRutinaIa('', false);
      setModalRutinaIaAbierto(true, btnIa);
    });
  }

  var modalAsignar = document.getElementById('admin-rutina-asignar-modal');
  var cerrarAsignar = document.getElementById('admin-rutina-asignar-cerrar');
  var cancelarAsignar = document.getElementById('admin-rutina-asignar-cancelar');
  var formAsignar = document.getElementById('admin-rutina-asignar-form');
  var buscarUsuario = document.getElementById('admin-rutina-asignar-usuario-buscar');
  var selUsuario = document.getElementById('admin-rutina-asignar-usuario');
  var selRutina = document.getElementById('admin-rutina-asignar-rutina');
  var modalIa = document.getElementById('admin-rutina-ia-modal');
  var cerrarIa = document.getElementById('admin-rutina-ia-cerrar');
  var cancelarIa = document.getElementById('admin-rutina-ia-cancelar');
  var formIa = document.getElementById('admin-rutina-ia-form');

  if (modalAsignar && modalAsignar.dataset.bound !== '1') {
    modalAsignar.dataset.bound = '1';
    modalAsignar.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.getAttribute('data-admin-rutina-asignar-cerrar') === '1' && !adminRoutinesState.asignando) {
        cerrarModalAsignarRutina();
      }
    });
  }

  if (cerrarAsignar && cerrarAsignar.dataset.bound !== '1') {
    cerrarAsignar.dataset.bound = '1';
    cerrarAsignar.addEventListener('click', function () {
      if (adminRoutinesState.asignando) return;
      cerrarModalAsignarRutina();
    });
  }

  if (cancelarAsignar && cancelarAsignar.dataset.bound !== '1') {
    cancelarAsignar.dataset.bound = '1';
    cancelarAsignar.addEventListener('click', function () {
      if (adminRoutinesState.asignando) return;
      cerrarModalAsignarRutina();
    });
  }

  if (formAsignar && formAsignar.dataset.bound !== '1') {
    formAsignar.dataset.bound = '1';
    formAsignar.addEventListener('submit', enviarAsignacionRutinaAdmin);
  }

  if (buscarUsuario && buscarUsuario.dataset.bound !== '1') {
    buscarUsuario.dataset.bound = '1';
    buscarUsuario.addEventListener('input', function () {
      var q = String(buscarUsuario.value || '').trim();
      cargarUsuariosAsignacionRutina(q)
        .then(function (usuarios) {
          adminRoutinesState.usuariosBusqueda = usuarios || [];
          actualizarSelectUsuariosAsignacion(adminRoutinesState.usuariosBusqueda);
          actualizarResumenAsignacionRutina();
        })
        .catch(function (err) {
          var msg = document.getElementById('admin-rutina-asignar-mensaje');
          if (msg) { msg.textContent = (err && err.message) || 'No fue posible cargar clientes.'; msg.style.color = '#ff9aa4'; }
        });
    });
  }

  if (selUsuario && selUsuario.dataset.bound !== '1') {
    selUsuario.dataset.bound = '1';
    selUsuario.addEventListener('change', actualizarResumenAsignacionRutina);
  }

  if (selRutina && selRutina.dataset.bound !== '1') {
    selRutina.dataset.bound = '1';
    selRutina.addEventListener('change', actualizarResumenAsignacionRutina);
  }

  if (modalIa && modalIa.dataset.bound !== '1') {
    modalIa.dataset.bound = '1';
    modalIa.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.getAttribute('data-admin-rutina-ia-cerrar') === '1' && !adminRoutinesState.ia.generando) {
        setModalRutinaIaAbierto(false);
      }
    });
  }

  if (cerrarIa && cerrarIa.dataset.bound !== '1') {
    cerrarIa.dataset.bound = '1';
    cerrarIa.addEventListener('click', function () {
      if (adminRoutinesState.ia.generando) return;
      setModalRutinaIaAbierto(false);
    });
  }

  if (cancelarIa && cancelarIa.dataset.bound !== '1') {
    cancelarIa.dataset.bound = '1';
    cancelarIa.addEventListener('click', function () {
      if (adminRoutinesState.ia.generando) return;
      setModalRutinaIaAbierto(false);
    });
  }

  if (formIa && formIa.dataset.bound !== '1') {
    formIa.dataset.bound = '1';
    formIa.addEventListener('submit', generarBorradorRutinaIa);
  }

  if (tbody && tbody.dataset.boundRutinas !== '1') {
    tbody.dataset.boundRutinas = '1';
    tbody.addEventListener('click', function (e) {
      var target = e.target;
      if (!target) return;

      var link = target.closest('[data-rutina-link]');
      if (link) {
        e.preventDefault();
        var idLink = parseInt(link.getAttribute('data-rutina-link') || '0', 10);
        if (idLink > 0) abrirModalDetalleRutina(idLink, link);
        return;
      }

      var ver = target.closest('[data-rutina-ver]');
      if (ver) {
        var idVer = parseInt(ver.getAttribute('data-rutina-ver') || '0', 10);
        if (idVer > 0) abrirModalDetalleRutina(idVer, ver);
        return;
      }

      var editar = target.closest('[data-rutina-editar]');
      if (editar) {
        var idEditar = parseInt(editar.getAttribute('data-rutina-editar') || '0', 10);
        if (idEditar > 0) abrirModalEditarRutina(idEditar, editar);
        return;
      }

      var asignar = target.closest('[data-rutina-asignar]');
      if (asignar) {
        var idAsignar = parseInt(asignar.getAttribute('data-rutina-asignar') || '0', 10);
        if (idAsignar > 0) abrirModalAsignarRutina(idAsignar, asignar);
        return;
      }

      var toggle = target.closest('[data-rutina-toggle]');
      if (toggle) {
        var idToggle = parseInt(toggle.getAttribute('data-rutina-toggle') || '0', 10);
        var activa = toggle.getAttribute('data-rutina-activa') === '1';
        if (idToggle > 0) cambiarEstadoRutinaAdmin(idToggle, activa);
      }
    });
  }
}

function setMensajeRutinaIa(texto, esError) {
  var msg = document.getElementById('admin-rutina-ia-mensaje');
  if (!msg) return;
  msg.textContent = texto || '';
  msg.style.color = esError ? '#ff9aa4' : '#87efba';
}

function limpiarErroresRutinaIa() {
  ['admin-rutina-ia-objetivo-error', 'admin-rutina-ia-nivel-error', 'admin-rutina-ia-dias-error', 'admin-rutina-ia-minutos-error'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function validarFormularioRutinaIa() {
  limpiarErroresRutinaIa();
  var objetivo = document.getElementById('admin-rutina-ia-objetivo');
  var nivel = document.getElementById('admin-rutina-ia-nivel');
  var dias = document.getElementById('admin-rutina-ia-dias');
  var minutos = document.getElementById('admin-rutina-ia-minutos');
  var equipo = document.getElementById('admin-rutina-ia-equipo');

  var objetivoVal = objetivo ? String(objetivo.value || '').trim() : '';
  var nivelVal = nivel ? String(nivel.value || '').trim() : '';
  var diasVal = dias ? parseInt(String(dias.value || '0'), 10) : 0;
  var minutosVal = minutos ? parseInt(String(minutos.value || '0'), 10) : 0;
  var equipoVal = equipo ? String(equipo.value || '').trim() : '';

  var ok = true;
  if (!objetivoVal) {
    ok = false;
    var e1 = document.getElementById('admin-rutina-ia-objetivo-error');
    if (e1) e1.textContent = 'El objetivo es obligatorio.';
  }
  if (!nivelVal) {
    ok = false;
    var e2 = document.getElementById('admin-rutina-ia-nivel-error');
    if (e2) e2.textContent = 'El nivel es obligatorio.';
  }
  if (!Number.isFinite(diasVal) || diasVal < 1 || diasVal > 7) {
    ok = false;
    var e3 = document.getElementById('admin-rutina-ia-dias-error');
    if (e3) e3.textContent = 'Los días por semana deben estar entre 1 y 7.';
  }
  if (!Number.isFinite(minutosVal) || minutosVal < 10 || minutosVal > 180) {
    ok = false;
    var e4 = document.getElementById('admin-rutina-ia-minutos-error');
    if (e4) e4.textContent = 'Los minutos por sesión deben estar entre 10 y 180.';
  }

  return {
    ok: ok,
    payload: {
      objetivo: objetivoVal,
      nivel: nivelVal,
      diasPorSemana: diasVal,
      minutosPorSesion: minutosVal,
      equipoDisponible: equipoVal
    }
  };
}

function setModalRutinaIaAbierto(abierto, trigger) {
  var modal = document.getElementById('admin-rutina-ia-modal');
  if (!modal) return;

  if (abierto) {
    adminRoutinesState.ia.modalAbierto = true;
    adminRoutinesState.ia.ultimoFoco = trigger || document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('admin-modal-open');
    var objetivo = document.getElementById('admin-rutina-ia-objetivo');
    if (objetivo) objetivo.focus();
  } else {
    adminRoutinesState.ia.modalAbierto = false;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('admin-modal-open');
    var prev = adminRoutinesState.ia.ultimoFoco;
    adminRoutinesState.ia.ultimoFoco = null;
    if (prev && typeof prev.focus === 'function') prev.focus();
  }
}

function aplicarBorradorIaEnFormularioRutina(borrador) { KFitnessRutinasAdmin.draft(borrador); }

function generarBorradorRutinaIa(e) {
  e.preventDefault();
  if (adminRoutinesState.ia.generando) return;

  var validacion = validarFormularioRutinaIa();
  if (!validacion.ok) return;

  if (!adminRoutinesState.csrfToken) {
    setMensajeRutinaIa('No se pudo validar el token de seguridad. Recarga la lista.', true);
    return;
  }

  var btn = document.getElementById('admin-rutina-ia-generar');
  adminRoutinesState.ia.generando = true;
  if (btn) btn.disabled = true;
  setMensajeRutinaIa('Generando borrador con IA...', false);

  fetch('api/admin/routines-ai-draft.ashx', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-CSRF-Token': adminRoutinesState.csrfToken
    },
    body: JSON.stringify(validacion.payload)
  })
    .then(function (resp) {
      return resp.json().catch(function () { return { success: false, message: 'Respuesta inválida del servidor.' }; })
        .then(function (data) { return { status: resp.status, data: data || {} }; });
    })
    .then(function (result) {
      if (result.status === 401) {
        window.location.href = '/login.html';
        return;
      }

      if (!result.data.success) {
        setMensajeRutinaIa(result.data.message || 'No fue posible generar el borrador.', true);
        return;
      }

      adminRoutinesState.ia.borrador = result.data.borrador || null;
      setMensajeRutinaIa(result.data.message || 'Borrador generado con IA.', false);

      setModalRutinaIaAbierto(false);
      abrirModalCrearRutina(document.getElementById('admin-rutina-crear-toggle'));
      aplicarBorradorIaEnFormularioRutina(adminRoutinesState.ia.borrador);
      setMensajeRutinasAdmin('Borrador generado con IA. Debe revisarse por entrenador antes de asignar.', false);
    })
    .catch(function () {
      setMensajeRutinaIa('No fue posible conectar con el servicio de IA.', true);
    })
    .finally(function () {
      adminRoutinesState.ia.generando = false;
      if (btn) btn.disabled = false;
    });
}

function initAdmin() {
  mostrarSeccionAdmin('dashboard');
  initAdminNav();
  initAdminLogout();
  initDashboardAdmin();
  initControlUsuarios();
  initRegistroServicios();
  initEdicionServicios();
  initHorariosAdmin();
  initReservasAdmin();
  initPromocionesAdmin();
  initRutinasAdmin();
  initReportesAdmin();
  initAuditoriaAdmin();

  window.addEventListener('beforeunload', function () {
    destruirChartsDashboard();
  });

  validarAccesoAdmin().then(function (ok) {
    if (!ok) return;
    cargarDashboard();
  });
}

document.addEventListener('DOMContentLoaded', initAdmin);
