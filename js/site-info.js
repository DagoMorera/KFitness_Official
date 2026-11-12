(function(){
 'use strict';
 async function refresh(){
  try{const r=await fetch('api/site-settings.ashx',{credentials:'same-origin'});if(!r.ok||!(r.headers.get('content-type')||'').includes('application/json'))return;const d=await r.json();if(!d.success)return;const s=d.settings;
   document.querySelectorAll('[data-site-info]').forEach(el=>{const value=s[el.dataset.siteInfo];if(value!=null)el.textContent=value;});
   document.querySelectorAll('.site-footer a[href^="tel:"],.datos-contacto a[href^="tel:"],.contacto-datos-lista a[href^="tel:"]').forEach(el=>{el.textContent=s.Telefono;el.href='tel:'+s.Telefono.replace(/[^+0-9]/g,'');});
   document.querySelectorAll('.site-footer a[href^="mailto:"],.datos-contacto a[href^="mailto:"],.contacto-datos-lista a[href^="mailto:"]').forEach(el=>{el.textContent=s.Correo;el.href='mailto:'+s.Correo;});
  }catch(_) { /* Static contact information remains available during an outage. */ }
 }
 window.KFitnessRefreshInfo=refresh;document.addEventListener('DOMContentLoaded',refresh);
})();
