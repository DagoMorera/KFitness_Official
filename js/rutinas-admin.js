(function () {
 'use strict';
 const U=window.KFitnessRutinasUI;
 let model, files={}, previews={}, tab='info', readonly=false, busy=false, dirty=false, trigger=null, catalog=[], requestVersion=0;
 const root=()=>document.getElementById('admin-rutina-editor');
 const e=U.escape;
 function input(label,key,value,type,extra){return '<label>'+label+'<input data-field="'+key+'" type="'+(type||'text')+'" value="'+e(value)+'" '+(extra||'')+'></label>';}
 function area(label,key,value){return '<label>'+label+'<textarea data-field="'+key+'" maxlength="2000">'+e(value)+'</textarea></label>';}
 function select(label,key,value,options){return '<label>'+label+'<select data-field="'+key+'">'+options.map(o=>'<option value="'+e(o)+'" '+(o===value?'selected':'')+'>'+e(o)+'</option>').join('')+'</select></label>';}
 function resolve(ref){return previews[ref]||U.media(ref);}
 function photoEditor(ref,key){return '<div class="kr-media-editor"><div>'+U.photo(ref,'Vista previa de imagen',resolve)+'</div><label>Imagen (JPG, PNG o WebP; máximo 5 MB)<input type="file" data-photo="'+key+'" accept="image/jpeg,image/png,image/webp"><button type="button" data-remove-photo="'+key+'">Quitar imagen</button></label></div>';}
 function release(){Object.values(previews).forEach(URL.revokeObjectURL);files={};previews={};}
 function showList(show){const section=document.getElementById('admin-rutinas');Array.from(section.children).forEach(el=>{if(el.id==='admin-rutinas-filtros'||el.classList.contains('admin-rutinas-list-wrap')||el.id==='admin-rutinas-pagination-wrap'||el.id==='admin-rutinas-mensaje'){if(!show){el.dataset.wasHidden=String(el.hidden);el.hidden=true;}else el.hidden=el.dataset.wasHidden==='true';}});}
 function message(text){const el=root().querySelector('[data-editor-message]');if(el){el.textContent=text;el.focus();}}
 function base(){return {IdRutina:0,Nombre:'',Objetivo:'',Nivel:'Principiante',DuracionAproximadaMin:60,DuracionUnidad:'min',Descripcion:'',PortadaReferencia:null,Sesiones:[]};}
 function open(data,view,source){
  release();model=JSON.parse(JSON.stringify(data||base()));model.Sesiones=model.Sesiones||[];if(model.DuracionUnidad==='horas'){model.DuracionAproximadaMin*=60;model.DuracionUnidad='min';}readonly=!!view;dirty=false;tab=view?'preview':'info';trigger=source||document.activeElement;
  showList(false);root().hidden=false;render();root().querySelector('h2').focus();
 }
 function close(){if(busy)return;if(dirty&&!confirm('¿Descartar los cambios sin guardar?'))return;requestVersion++;root().hidden=true;showList(true);release();dirty=false;if(trigger)trigger.focus();}
 async function load(id,view,source){const version=++requestVersion;try{const data=await U.request('api/admin/routines-detail.ashx?id='+id);if(version===requestVersion)open(data.rutina,view,source);}catch(err){setMensajeRutinasAdmin(err.message,true);}}
 function exerciseHTML(x,si,xi){return '<article class="kr-exercise-editor" data-si="'+si+'" data-xi="'+xi+'"><div class="kr-section-head"><h3>Ejercicio '+(xi+1)+'</h3><div class="kr-actions"><button type="button" data-act="ex-up" '+(!xi?'disabled':'')+'>↑ Subir</button><button type="button" data-act="ex-down" '+(xi===model.Sesiones[si].Ejercicios.length-1?'disabled':'')+'>↓ Bajar</button><button type="button" data-act="ex-delete">Eliminar</button></div></div><div class="kr-grid">'+
 '<div class="kr-full">'+(!x.IdEjercicioCatalogo?'<label><input type="checkbox" data-field="GuardarEnCatalogo" '+(x.GuardarEnCatalogo?'checked':'')+'> Agregar este ejercicio al catálogo reutilizable</label>':'')+input('Nombre del ejercicio','NombreEjercicio',x.NombreEjercicio,'text','maxlength="180" required')+'</div><div class="kr-full">'+photoEditor(x.FotoReferencia,'FotoReferencia')+'</div><div class="kr-full kr-number-grid">'+input('Series','Series',x.Series,'number','min="1" max="100"')+select('Medir por','Measure',x.Repeticiones!=null?'Repeticiones':'Tiempo (s)',['Repeticiones','Tiempo (s)'])+input(x.Repeticiones!=null?'Repeticiones':'Tiempo (s)',x.Repeticiones!=null?'Repeticiones':'DuracionSegundos',x.Repeticiones!=null?x.Repeticiones:x.DuracionSegundos,'number','min="1"')+input('Descanso','DescansoValor',x.DescansoValor,'number','min="0"')+select('Unidad de descanso','DescansoUnidad',x.DescansoUnidad,['seg','min'])+input('Carga (opcional)','CargaValor',x.CargaValor,'number','min="0" step="0.01"')+select('Unidad de carga','CargaUnidad',x.CargaUnidad||'kg',['kg','lb','%1RM','RPE'])+'</div>'+area('Técnica paso a paso','TecnicaInstrucciones',x.TecnicaInstrucciones)+area('Errores a evitar','TecnicaErroresComunes',x.TecnicaErroresComunes)+area('Indicaciones para el cliente','IndicacionesEntrenador',x.IndicacionesEntrenador)+input('Video de YouTube o Vimeo (HTTPS)','VideoUrl',x.VideoUrl,'url','maxlength="500"')+'</div></article>';}
 function render(){
  root().innerHTML='<div class="kr-toolbar"><button type="button" data-act="back">← Volver al listado</button><span class="kr-chip">'+(readonly?'Consulta':model.IdRutina?'Edición':'Nueva rutina')+'</span></div><h2 tabindex="-1">'+(readonly?e(model.Nombre):model.IdRutina?'Editar plan de entrenamiento':'Crear plan de entrenamiento')+'</h2><p>Organiza cada sesión y acompaña los ejercicios con imágenes, técnica y video.</p>'+
  (!readonly?'<div class="kr-tabs" role="tablist" aria-label="Editor de rutina">'+[['info','Información'],['sessions','Sesiones y ejercicios'],['preview','Vista previa']].map(t=>'<button type="button" role="tab" aria-selected="'+(tab===t[0])+'" data-tab="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>':'')+
  '<div data-tab-body></div><p class="kr-error" data-editor-message role="status" tabindex="-1"></p>'+(!readonly?'<div class="kr-footer kr-toolbar"><span>'+model.Sesiones.length+' sesiones · '+model.Sesiones.reduce((n,s)=>n+s.Ejercicios.length,0)+' ejercicios</span><div class="kr-actions"><button type="button" data-act="back">Cancelar</button><button type="button" class="kr-primary" data-act="save">Guardar rutina</button></div></div>':'');
  const body=root().querySelector('[data-tab-body]');
  if(tab==='info')body.innerHTML='<div class="kr-panel kr-grid">'+input('Nombre de la rutina','Nombre',model.Nombre,'text','maxlength="150" required')+input('Objetivo','Objetivo',model.Objetivo,'text','maxlength="200" required')+select('Nivel','Nivel',model.Nivel,['Principiante','Intermedio','Avanzado'])+input('Duración por sesión (minutos)','DuracionAproximadaMin',model.DuracionAproximadaMin,'number','min="1" max="600"')+'<div class="kr-full">'+area('Descripción del plan','Descripcion',model.Descripcion)+'</div><div class="kr-full">'+photoEditor(model.PortadaReferencia,'PortadaReferencia')+'</div></div>';
  if(tab==='sessions')body.innerHTML='<div class="kr-toolbar"><p>Define días o sesiones. Puedes reordenarlos con las flechas.</p><button type="button" class="kr-primary" data-act="session-add">＋ Agregar sesión</button></div>'+(!model.Sesiones.length?'<p class="kr-empty">Todavía no hay sesiones. Agrega la primera para comenzar.</p>':'')+model.Sesiones.map((s,si)=>'<section class="kr-panel kr-session-editor" data-si="'+si+'"><div class="kr-section-head">'+input('Nombre de la sesión','Nombre',s.Nombre,'text','maxlength="120"')+'<div class="kr-actions"><button type="button" data-act="session-up" '+(!si?'disabled':'')+'>↑ Subir</button><button type="button" data-act="session-down" '+(si===model.Sesiones.length-1?'disabled':'')+'>↓ Bajar</button><button type="button" data-act="session-delete">Eliminar sesión</button></div></div>'+s.Ejercicios.map((x,xi)=>exerciseHTML(x,si,xi)).join('')+'<div class="kr-actions"><button type="button" data-act="exercise-add">＋ Crear ejercicio</button><button type="button" data-act="catalog">Buscar en catálogo</button></div><div data-catalog hidden></div></section>').join('');
  if(tab==='preview')U.plan(body,model,{preview:true,resolve});
  if(busy)root().querySelectorAll('button,input,textarea,select').forEach(x=>x.disabled=true);
 }
 function target(node){const ex=node.closest('[data-xi]'), session=node.closest('[data-si]');return ex?model.Sesiones[Number(ex.dataset.si)].Ejercicios[Number(ex.dataset.xi)]:session?model.Sesiones[Number(session.dataset.si)]:model;}
 function sync(event){const node=event.target,key=node.dataset.field;if(!key)return;const obj=target(node);if(key==='Measure'){if(node.value==='Repeticiones'){obj.Repeticiones=10;obj.DuracionSegundos=null;}else{obj.Repeticiones=null;obj.DuracionSegundos=30;}render();}else obj[key]=node.type==='checkbox'?node.checked:node.type==='number'?(node.value===''?null:Number(node.value)):node.value;dirty=true;}
 function newExercise(){return {NombreEjercicio:'',Series:3,Repeticiones:10,DuracionSegundos:null,DescansoValor:60,DescansoUnidad:'seg',CargaValor:null,CargaUnidad:'kg',EsAjusteLocal:true,GuardarEnCatalogo:true};}
 async function save(){
  if(busy)return;
  if(!model.Nombre.trim()||!model.Objetivo.trim())return message('Completa el nombre y el objetivo en Información.');
  if(!Number.isInteger(model.DuracionAproximadaMin)||model.DuracionAproximadaMin<1||model.DuracionAproximadaMin>600)return message('La duración debe estar entre 1 y 600 minutos.');
  if((model.Descripcion||'').length>1000)return message('La descripción admite hasta 1000 caracteres.');
  for(const s of model.Sesiones){if(!s.Nombre.trim())return message('Cada sesión debe tener un nombre.');for(const x of s.Ejercicios){if(!x.NombreEjercicio.trim()||!Number.isInteger(x.Series)||x.Series<1||x.Series>100||((x.Repeticiones==null)===(x.DuracionSegundos==null))||Number(x.Repeticiones||x.DuracionSegundos)<1||!Number.isInteger(x.DescansoValor)||x.DescansoValor<0)return message('Revisa nombre, series, repeticiones o tiempo y descanso de cada ejercicio.');if(x.VideoUrl&&!U.video(x.VideoUrl))return message('El video debe ser un enlace HTTPS de YouTube o Vimeo.');}}
  model.DuracionUnidad='min';model.Sesiones.forEach((s,i)=>{s.OrdenSesion=i+1;s.Ejercicios.forEach((x,j)=>x.OrdenEjercicio=j+1);});
  const body=new FormData(), json=JSON.stringify(model);body.append('metadata',json);
  const used=Object.keys(files).filter(k=>json.includes('upload:'+k));
  if(used.reduce((sum,k)=>sum+files[k].size,0)>30*1024*1024)return message('Las imágenes superan 30 MB. Reduce su tamaño o guarda por partes.');
  used.forEach(k=>body.append(k,files[k]));
  busy=true;render();
  try{await U.request('api/admin/routines-save.ashx',{method:'POST',headers:{'X-CSRF-Token':adminRoutinesState.csrfToken},body});busy=false;dirty=false;close();cargarListadoRutinasAdmin();}
  catch(err){busy=false;render();message(err.message);}
 }
 async function catalogSearch(section,query){const slot=section.querySelector('[data-catalog]');slot.hidden=false;slot.innerHTML='<p>Cargando catálogo...</p>';try{const data=await U.request('api/admin/routines-exercises-catalog.ashx?max=50&q='+encodeURIComponent(query||''));catalog=data.ejercicios||[];slot.innerHTML='<div class="kr-panel"><label>Buscar ejercicio<input type="search" data-catalog-search value="'+e(query||'')+'"></label><button type="button" data-act="catalog-search">Buscar</button><div class="kr-actions">'+catalog.map((x,i)=>'<button type="button" data-catalog-id="'+i+'">'+e(x.Nombre)+'</button>').join('')+'</div>'+(!catalog.length?'<p>No hay coincidencias. Puedes crear un ejercicio para esta sesión.</p>':'')+'</div>';}catch(err){slot.innerHTML='<p class="kr-error">'+e(err.message)+'</p>';}}
 function init(){const el=root();if(!el)return;el.addEventListener('input',event=>{if(event.target.tagName!=='SELECT')sync(event);});el.addEventListener('change',event=>{
   if(event.target.tagName==='SELECT')sync(event);
   const key=event.target.dataset.photo;if(!key)return;const file=event.target.files[0];if(!file)return;
   if(file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)){message('Usa JPG, PNG o WebP de hasta 5 MB.');return;}
   const id='photo_'+Date.now()+'_'+Math.random().toString(36).slice(2);files[id]=file;const ref='upload:'+id;previews[ref]=URL.createObjectURL(file);target(event.target)[key]=ref;dirty=true;render();
  });
  el.addEventListener('click',event=>{
   const b=event.target.closest('button');if(!b||busy)return;
   if(b.dataset.tab){tab=b.dataset.tab;render();return;}
   if(b.dataset.removePhoto){target(b)[b.dataset.removePhoto]=null;dirty=true;render();return;}
   const section=b.closest('[data-si]'),si=section?Number(section.dataset.si):-1,ex=b.closest('[data-xi]'),xi=ex?Number(ex.dataset.xi):-1,action=b.dataset.act;
   if(b.dataset.catalogId!=null){const c=catalog[Number(b.dataset.catalogId)],x=newExercise();Object.assign(x,{NombreEjercicio:c.Nombre,IdEjercicioCatalogo:c.IdEjercicio,OrigenCatalogo:'rut',GuardarEnCatalogo:false,FotoReferencia:c.ImagenReferencia,VideoUrl:c.VideoUrl,TecnicaInstrucciones:c.TecnicaInstrucciones,TecnicaErroresComunes:c.ErroresComunes});model.Sesiones[si].Ejercicios.push(x);dirty=true;render();return;}
   if(action==='back')return close();if(action==='save')return save();if(action==='catalog'||action==='catalog-search')return catalogSearch(section,section.querySelector('[data-catalog-search]')?.value);
   if(action==='session-add')model.Sesiones.push({Nombre:'Día '+(model.Sesiones.length+1),Ejercicios:[]});
   else if(action==='session-delete'){if(!confirm('¿Quitar esta sesión del plan? El historial guardado se conserva.'))return;model.Sesiones.splice(si,1);}
   else if(action==='exercise-add')model.Sesiones[si].Ejercicios.push(newExercise());
   else if(action==='ex-delete'){if(!confirm('¿Quitar este ejercicio?'))return;model.Sesiones[si].Ejercicios.splice(xi,1);}
   else if(action==='session-up'||action==='session-down'){const other=si+(action==='session-up'?-1:1);[model.Sesiones[si],model.Sesiones[other]]=[model.Sesiones[other],model.Sesiones[si]];}
   else if(action==='ex-up'||action==='ex-down'){const xs=model.Sesiones[si].Ejercicios,other=xi+(action==='ex-up'?-1:1);[xs[xi],xs[other]]=[xs[other],xs[xi]];}
   else return;
   dirty=true;render();
  });
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 }
 window.KFitnessRutinasAdmin={create:source=>open(null,false,source),edit:(id,source)=>load(id,false,source),view:(id,source)=>load(id,true,source),close,
  draft:d=>{
   if(!model)open();
   model.Nombre=d.nombre||'Borrador de rutina';model.Objetivo=d.objetivo||'';model.Nivel=d.nivel||'Principiante';
   model.DuracionAproximadaMin=d.duracionAproximadaMin||60;model.Descripcion=[d.observacionesGenerales,d.safetyNotice].filter(Boolean).join('\n');
   model.Sesiones=(d.sesiones||[]).map((session,i)=>({Nombre:String(session.dia||('Día '+(i+1))),OrdenSesion:i+1,Ejercicios:(session.ejercicios||[]).map((x,j)=>Object.assign(newExercise(),{NombreEjercicio:x.nombre,OrdenEjercicio:j+1,Series:x.series,Repeticiones:x.repeticiones||null,DuracionSegundos:x.repeticiones?null:(x.tiempoSegundos||null),DescansoValor:x.descansoSegundos||0,IndicacionesEntrenador:x.observaciones||'',GuardarEnCatalogo:false}))}));
   dirty=true;tab='sessions';render();message('Revisa el borrador y su técnica antes de guardar. No se ha asignado a ningún cliente.');
  }};
 document.addEventListener('DOMContentLoaded',init);
})();
