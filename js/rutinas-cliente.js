(function () {
 'use strict';
 const U=window.KFitnessRutinasUI;
 const mounts=new WeakMap();
 function mount(container) {
 if(typeof container==='string')container=document.querySelector(container);
 if(!container)return Promise.resolve();
 if(mounts.has(container))return mounts.get(container).reload();
 const enPerfil = !!(container.closest && container.closest('#perfil-rutinas'));
 let planes=[],csrf='',chosen=0,busy=false,sessionId=0,generation=0,paginaEjercicios=0,paginaHistorial=0;
 function cambiarRutina(indice){chosen=indice;sessionId=0;paginaEjercicios=0;paginaHistorial=0;render();}
 const app={reload};mounts.set(container,app);container.classList.add('kr');
  function alert(text){const msg=container.querySelector('[data-client-message]');if(msg){msg.textContent=text;msg.focus();}}
  function render(){
   if(!planes.length)return;
   if(chosen<0)chosen=0;
   if(chosen>=planes.length)chosen=planes.length-1;
   container.innerHTML=(enPerfil?'' : '<div class="kr-toolbar"><button type="button" data-refresh>Actualizar</button></div>')+
     '<div class="kr-toolbar" '+(planes.length>1?'':'hidden')+'><label>Seleccionar rutina<select data-plan>'+planes.map((p,i)=>'<option value="'+i+'" '+(i===chosen?'selected':'')+'>'+U.escape(p.plan.Nombre)+(p.asignacion.Vigente?'':' · Histórica')+'</option>').join('')+'</select></label><div class="kr-pagination" aria-label="Navegación de rutinas"><button type="button" data-prev>Anterior</button><span data-pageinfo>Rutina '+(chosen+1)+' de '+planes.length+'</span><button type="button" data-next>Siguiente</button></div></div><p class="kr-error" role="status" tabindex="-1" data-client-message></p><div data-plan-view></div><div data-history></div>';
   container.querySelector('[data-plan]').onchange=event=>{cambiarRutina(Number(event.target.value));};
   const refreshBtn = container.querySelector('[data-refresh]');
   if(refreshBtn) refreshBtn.onclick=()=>reload();
   container.querySelector('[data-prev]').onclick=()=>{if(chosen<=0)return;cambiarRutina(chosen-1);};
   container.querySelector('[data-next]').onclick=()=>{if(chosen>=planes.length-1)return;cambiarRutina(chosen+1);};
   container.querySelector('[data-prev]').disabled=chosen<=0;
   container.querySelector('[data-next]').disabled=chosen>=planes.length-1;
   const item=planes[chosen];if(!item)return;
   const plan=JSON.parse(JSON.stringify(item.plan));
   const open=(item.ejecuciones||[]).filter(x=>!x.FechaFin);
   // Show unfinished sessions even when an administrator has revised the plan.
   open.forEach(x=>{if(!plan.Sesiones.some(s=>s.IdSesionRutina===x.IdSesionRutina))plan.Sesiones.push(Object.assign({},x.Sesion,{Nombre:x.Sesion.Nombre+' · En curso (versión anterior)'}));});
   const options={busy,sessionId,paginaEjercicios,onPaginaEjercicios:pagina=>paginaEjercicios=pagina,onSession:id=>{sessionId=id;paginaEjercicios=0;},execution:s=>s&&open.find(x=>x.IdSesionRutina===s.IdSesionRutina)};
   if(item.asignacion.Vigente){
    options.start=s=>update({action:'start',sessionId:s.IdSesionRutina});
    options.toggle=(x,id,completed)=>update({action:'toggle',executionId:x.IdEjecucion,exerciseId:id,completed});
    options.finish=x=>{const pending=x.Sesion.Ejercicios.length-x.Completados.length;if(!confirm(pending?'Quedan '+pending+' ejercicios pendientes. ¿Finalizar esta sesión incompleta?':'¿Finalizar esta sesión?'))return;update({action:'finish',executionId:x.IdEjecucion,confirmIncomplete:pending>0});};
   }
   U.plan(container.querySelector('[data-plan-view]'),plan,options);
   const history=(item.ejecuciones||[]).filter(x=>x.FechaFin);
   if(history.length){
    const host=container.querySelector('[data-history]');
    host.innerHTML='<details class="kr-history"><summary>Historial · '+history.length+' sesiones</summary><div data-historial-lista></div></details>';
    const lista=host.querySelector('[data-historial-lista]');
    const total=Math.ceil(history.length/U.tamanoPagina);
    function pintarHistorial(){
     paginaHistorial=Math.min(paginaHistorial,total-1);
     const inicio=paginaHistorial*U.tamanoPagina;
     lista.innerHTML='<ul>'+history.slice(inicio,inicio+U.tamanoPagina).map(x=>'<li>'+U.escape(x.Sesion.Nombre)+' · '+U.escape(new Date(x.FechaFin).toLocaleString('es-CR'))+' · '+x.Completados.length+'/'+x.Sesion.Ejercicios.length+' ejercicios</li>').join('')+'</ul>'+U.paginacion(paginaHistorial,total,'data-historial-pagina','Páginas del historial');
     lista.querySelectorAll('[data-historial-pagina]').forEach(b=>b.onclick=()=>{
      paginaHistorial=Number(b.dataset.historialPagina);
      pintarHistorial();
      const siguiente=lista.querySelector('[data-historial-pagina]:not(:disabled)');
      if(siguiente)siguiente.focus();
     });
    }
    pintarHistorial();
   }
   if(busy)container.querySelectorAll('button,select').forEach(b=>b.disabled=true);
  }
  async function update(payload){
   if(busy)return;busy=true;const item=planes[chosen];render();
   try{await U.request('api/routines-progress.ashx',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(Object.assign({assignmentId:item.asignacion.IdAsignacionRutina},payload))});busy=false;await reload();}
   catch(err){busy=false;render();alert(err.message);}
  }
  async function reload(){
   if(busy)return;
   const token=++generation,keep=planes[chosen]?.asignacion.IdAsignacionRutina;
   container.setAttribute('aria-busy','true');container.innerHTML='<p role="status">Cargando tus rutinas...</p>';
   try{
    const data=await U.request('api/routines-my.ashx');if(token!==generation)return;
    csrf=data.csrfToken;planes=(data.planes||[]).filter(p=>p.plan).sort((a,b)=>Number(b.asignacion.Vigente)-Number(a.asignacion.Vigente));
    chosen=Math.max(0,planes.findIndex(p=>p.asignacion.IdAsignacionRutina===keep));
    if(!planes.length){container.innerHTML='<p class="kr-empty">Aún no tienes rutinas asignadas. Tu entrenador podrá asignarte un plan desde Administración.</p>';return;}
    render();
   }catch(err){if(token!==generation)return;container.innerHTML='<p class="kr-error" role="alert">'+U.escape(err.message)+'</p><button type="button">Reintentar</button>';container.querySelector('button').onclick=reload;}
   finally{if(token===generation)container.removeAttribute('aria-busy');}
  }
  return reload();
 }
 window.KFitnessRutinasCliente={mount};
 document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('[data-rutinas-cliente]').forEach(mount));
})();
