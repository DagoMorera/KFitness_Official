/* Shared presentation and transport for routine editors and assigned plans. */
(function () {
  'use strict';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const media = ref => ref ? 'api/routine-media.ashx?v=' + encodeURIComponent(ref) : '';
  async function request(url, options) {
    const response = await fetch(url, Object.assign({credentials:'same-origin'}, options));
    const type = response.headers.get('content-type') || '';
    const bytes = await response.arrayBuffer();
    const text = (window.TextDecoder ? new TextDecoder('utf-8').decode(bytes) : String.fromCharCode.apply(null, new Uint8Array(bytes)));
    if (response.status === 401) throw new Error('Tu sesión venció. Vuelve a iniciar sesión.');
    if (!type.includes('application/json')) throw new Error('El servidor devolvió HTTP ' + response.status + ' sin JSON. Revisa la ruta solicitada: ' + url.split('?')[0]);
    let data;
    try { data = JSON.parse(text); } catch (_) { throw new Error('El servidor devolvió JSON inválido (HTTP ' + response.status + ').'); }
    if (!response.ok || !data.success) throw new Error(data.message || 'No fue posible completar la solicitud (HTTP ' + response.status + ').');
    return data;
  }
  function video(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' && ['youtube.com','www.youtube.com','m.youtube.com','youtu.be','vimeo.com','www.vimeo.com','player.vimeo.com'].includes(u.hostname) ? u.href : '';
    } catch (_) { return ''; }
  }
  function photo(ref, alt, resolve) {
    const src = (resolve || media)(ref);
    return src ? '<img loading="lazy" src="'+escape(src)+'" alt="'+escape(alt)+'">' : '<div class="kr-no-photo">Sin imagen</div>';
  }
  function dose(e) {
    return e.Series+' series · '+(e.Repeticiones ? e.Repeticiones+' repeticiones' : e.DuracionSegundos+' s')+' · Descanso '+e.DescansoValor+' '+e.DescansoUnidad+(e.CargaValor != null ? ' · '+e.CargaValor+' '+(e.CargaUnidad || '') : '');
  }
  const tamanoPagina = 10;

  function paginacion(pagina, total, atributo, etiqueta) {
    if (total <= 1) return '';
    return '<nav class="kr-pagination" aria-label="'+escape(etiqueta)+'"><button type="button" '+atributo+'="'+(pagina-1)+'" '+(pagina===0?'disabled':'')+'>Anterior</button><span role="status">Página '+(pagina+1)+' de '+total+'</span><button type="button" '+atributo+'="'+(pagina+1)+'" '+(pagina===total-1?'disabled':'')+'>Siguiente</button></nav>';
  }

  function plan(container, data, options) {
    const opts = options || {};
    let index = 0, exercise = (opts.paginaEjercicios || 0) * tamanoPagina;
    const sessions = data.Sesiones || [];
    index = Math.max(0, sessions.findIndex(s => s.IdSesionRutina === opts.sessionId));
    function render() {
      const session = sessions[index];
      const exercises = session && session.Ejercicios || [];
      const active = opts.execution && opts.execution(session);
      const completed = active && active.Completados || [];
      const totalPaginas = opts.preview ? 1 : Math.max(1, Math.ceil(exercises.length / tamanoPagina));
      const pagina = Math.min(Math.floor(exercise / tamanoPagina), totalPaginas - 1);
      const inicio = pagina * tamanoPagina;
      const visibles = opts.preview ? exercises : exercises.slice(inicio, inicio + tamanoPagina);
      if (!exercises[exercise]) exercise = inicio;
      const selected = exercises[exercise];
      container.classList.add('kr');
      const objetivo = escape(data.Objetivo || '');
      const nivel = String(data.Nivel || '').trim();
      const duracionNum = Number(data.DuracionAproximadaMin || 0);
      const duracionUnidad = escape(data.DuracionUnidad || 'min');
      const chips = [
        nivel ? '<span class="kr-chip">⚡ Nivel ' + escape(nivel) + '</span>' : '',
        duracionNum > 0 ? '<span class="kr-chip">◷ ' + escape(String(duracionNum)) + ' ' + duracionUnidad + ' por sesión</span>' : ''
      ].filter(Boolean).join(' ');

      const haySesionesConfiguradas = sessions.some(s => (s.Ejercicios || []).length);
      const notasPlan = String(data.Descripcion || '').trim();

      container.innerHTML = '<div class="kr-plan-head">'+(data.PortadaReferencia ? '<div class="kr-cover">'+photo(data.PortadaReferencia,data.Nombre,opts.resolve)+'</div>' : '')+
        '<div><span class="kr-eyebrow">'+(opts.preview ? 'Vista previa del cliente' : 'Mi plan de entrenamiento')+'</span><h2>'+escape(data.Nombre)+'</h2>'+(objetivo?'<p class="kr-rutina-objetivo">'+objetivo+'</p>':'')+(chips?'<div class="kr-rutina-chips">'+chips+'</div>':'')+'</div></div>'+
        '<section class="kr-sesiones-panel"><h3>Sesiones</h3>'+
        (!haySesionesConfiguradas ? '<p class="kr-empty kr-pendiente"><strong>Pendientes de configurar</strong>Tu entrenador completará las sesiones de este plan.</p>' :
        '<div class="kr-tabs" role="tablist" aria-label="Sesiones">'+sessions.map((s,i)=>'<button type="button" role="tab" aria-selected="'+(index===i)+'" data-session="'+i+'">'+escape(s.Nombre)+'</button>').join('')+'</div>'+
        (!exercises.length ? '<p class="kr-empty">Esta sesión aún no tiene ejercicios configurados.</p>' :
        '<div class="kr-training"><div class="kr-exercises">'+visibles.map((e,i)=>'<article class="kr-exercise '+(exercise===inicio+i?'is-selected':'')+'"><div class="kr-picture">'+photo(e.FotoReferencia,e.NombreEjercicio,opts.resolve)+'</div><div class="kr-exercise-body"><h3>'+escape(e.NombreEjercicio)+'</h3><p>'+escape(dose(e))+'</p><div class="kr-actions"><button type="button" data-technique="'+(inicio+i)+'">Ver técnica</button>'+(active && opts.toggle ? '<button type="button" data-complete="'+e.IdRutinaEjercicio+'" aria-pressed="'+completed.includes(e.IdRutinaEjercicio)+'">'+(completed.includes(e.IdRutinaEjercicio)?'✓ Completado':'Marcar completado')+'</button>' : '')+'</div></div></article>').join('') +paginacion(pagina,totalPaginas,'data-ejercicios-pagina','Páginas de ejercicios')+'</div><aside class="kr-guide" aria-label="Guía del ejercicio"><h3>Guía del ejercicio</h3>'+photo(selected.FotoReferencia,selected.NombreEjercicio,opts.resolve)+'<h3>'+escape(selected.NombreEjercicio)+'</h3>'+(video(selected.VideoUrl)?'<a class="kr-button" href="'+escape(video(selected.VideoUrl))+'" target="_blank" rel="noopener noreferrer">▶ Ver video</a>':'<p class="kr-muted">Video no disponible</p>')+'<h4>Técnica paso a paso</h4><p class="kr-lines">'+escape(selected.TecnicaInstrucciones || 'Sin instrucciones adicionales.')+'</p>'+(selected.TecnicaErroresComunes?'<h4>Errores a evitar</h4><p class="kr-lines">'+escape(selected.TecnicaErroresComunes)+'</p>':'')+(selected.IndicacionesEntrenador?'<div class="kr-note"><h4>Nota del entrenador</h4><p class="kr-lines">'+escape(selected.IndicacionesEntrenador)+'</p></div>':'')+'</aside></div>'+
        (opts.start ? '<div class="kr-progress"><div><strong>Tu sesión · '+completed.length+' de '+exercises.length+' ejercicios completados</strong><progress max="'+exercises.length+'" value="'+completed.length+'" aria-label="Ejercicios completados"></progress></div><button type="button" class="kr-primary" data-progress="'+(active?'finish':'start')+'">'+(active?'Finalizar sesión':'Iniciar sesión')+'</button></div>' : '')))
        +'</section>'+
        (notasPlan ? '<details class="kr-notas"><summary>▸ Notas del plan</summary><p class="kr-lines">'+escape(notasPlan)+'</p></details>' : '');
      container.querySelectorAll('[data-session]').forEach(b=>b.onclick=()=>{index=Number(b.dataset.session);exercise=0;if(opts.onSession) opts.onSession(sessions[index].IdSesionRutina);render();});
      container.querySelectorAll('[data-ejercicios-pagina]').forEach(b=>b.onclick=()=>{
        const paginaNueva = Number(b.dataset.ejerciciosPagina);
        exercise = paginaNueva * tamanoPagina;
        if (opts.onPaginaEjercicios) opts.onPaginaEjercicios(paginaNueva);
        render();
        const siguiente = container.querySelector('[data-ejercicios-pagina]:not(:disabled)');
        if (siguiente) siguiente.focus();
      });
      container.querySelectorAll('[data-technique]').forEach(b=>b.onclick=()=>{exercise=Number(b.dataset.technique);render();container.querySelector('.kr-guide').scrollIntoView({behavior:'smooth',block:'nearest'});});
      container.querySelectorAll('[data-complete]').forEach(b=>b.onclick=()=>opts.toggle(active,Number(b.dataset.complete),!completed.includes(Number(b.dataset.complete))));
      const progress = container.querySelector('[data-progress]');
      if(progress) progress.onclick=()=>active?opts.finish(active):opts.start(session);
      container.querySelectorAll('img').forEach(img=>img.onerror=()=>{const fallback=document.createElement('div');fallback.className='kr-no-photo';fallback.textContent='Imagen no disponible';img.replaceWith(fallback);});
      if(opts.busy) container.querySelectorAll('button').forEach(b=>b.disabled=true);
    }
    render();
  }
  window.KFitnessRutinasUI={escape,media,request,video,photo,plan,paginacion,tamanoPagina};
})();
