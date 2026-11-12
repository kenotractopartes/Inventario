/* INV-PERSONAL-OSCURO-1111: accesos visuales locales, sin datos ni permisos. */
(function () {
  'use strict';
  var KEY='tpm_inventario_accesos_v1';
  function init(){
    var home=document.getElementById('inv-accesos-inicio');
    var filters=document.getElementById('filtros-familia');
    if(!home || !filters || document.getElementById('inv-personal')) return;
    var families=typeof FAMILIAS!=='undefined' ? FAMILIAS : [];
    var homeDefaults=['motores','transmisiones','chasis','mancuernas','fundas','cabinas','cortes','inyectores','fotos','sin-fotos'];
    var filterDefs=[['todas','Todas'],['sin-precio','⚠️ Sin precio'],['bajo-pedido','📦 Bajo pedido'],['apartadas','🔖 Apartadas'],['fotos','📷 Fotos'],['sin-fotos','📷❌ Sin fotos']];
    var homeDefs=families.map(function(f){return [f.id,f.nombreSingular||f.nombre];}).concat([['fotos','📷 Fotos'],['sin-fotos','📷❌ Sin fotos']]);
    // Conserva el nombre que Raúl ya reconoce en sus accesos originales.
    homeDefaults.forEach(function(id){var b=home.querySelector('[data-inv-acceso="'+id+'"]');var d=homeDefs.find(function(x){return x[0]===id;});if(b&&d)d[1]=b.textContent.replace(/\s*\(\d+\)\s*$/,'').trim();});
    var defs={inicio:homeDefs,filtros:filterDefs};
    var defaults={inicio:homeDefaults,filtros:filterDefs.map(function(x){return x[0];})};
    function normalize(raw){
      var out={version:1};
      ['inicio','filtros'].forEach(function(g){
        var allowed=defs[g].map(function(x){return x[0];}),v=raw&&raw.version===1&&raw[g];
        out[g]=Array.isArray(v)?v.filter(function(id,i){return typeof id==='string'&&allowed.indexOf(id)>=0&&v.indexOf(id)===i;}):defaults[g].slice();
      });return out;
    }
    var prefs;
    try{prefs=normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){prefs=normalize(null);}
    function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
    var dialog=el('dialog');dialog.id='inv-personal';dialog.setAttribute('aria-labelledby','inv-personal-titulo');
    var head=el('div','inv-personal-cab'),title=el('h2');title.id='inv-personal-titulo';
    var close=el('button','inv-personal-cerrar','×');close.type='button';close.setAttribute('aria-label','Cerrar personalización');head.appendChild(title);head.appendChild(close);
    var body=el('div','inv-personal-cuerpo');var intro=el('p','','Ordena con ↑ y ↓, arrastra las filas o usa «Al principio». Ocultar sólo quita el acceso de esta sección.');body.appendChild(intro);
    var list=el('div','inv-personal-lista');list.setAttribute('role','list');body.appendChild(list);
    var empty=el('p','inv-personal-vacio','No hay accesos visibles. Puedes añadirlos abajo o restaurar esta sección.');body.appendChild(empty);
    var moreTitle=el('h3','','Añadir accesos');body.appendChild(moreTitle);var more=el('div','inv-personal-mas');body.appendChild(more);
    var foot=el('div','inv-personal-pie');var reset=el('button','inv-personal-restaurar','↺ Restaurar esta sección');reset.type='button';foot.appendChild(reset);
    var status=el('p');status.id='inv-personal-estado';status.setAttribute('role','status');status.setAttribute('aria-live','polite');foot.appendChild(status);
    foot.appendChild(el('p','inv-personal-nota','Sólo en este navegador. No elimina piezas, familias ni filtros del sistema.'));body.appendChild(foot);dialog.appendChild(head);dialog.appendChild(body);document.body.appendChild(dialog);
    var group='inicio',opener=null,dragged=null;
    function save(){
      var saved=true;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(e){saved=false;}
      status.textContent=saved?'Guardado en este navegador.':'Aplicado sólo en esta pestaña; el navegador no permitió guardar la preferencia.';
      apply();renderList();
    }
    function label(g,id){var d=defs[g].find(function(x){return x[0]===id;});return d?d[1]:id;}
    function move(id,target){var a=prefs[group],i=a.indexOf(id);if(i<0)return;target=Math.max(0,Math.min(a.length-1,target));if(target===i)return;a.splice(i,1);a.splice(target,0,id);save();}
    function action(text,aria,fn){var b=el('button','',text);b.type='button';b.setAttribute('aria-label',aria);b.addEventListener('click',fn);return b;}
    function renderList(){
      var focused=document.activeElement&&document.activeElement.closest('[data-inv-op]');
      var focusKey=focused&&focused.getAttribute('data-inv-op');
      list.replaceChildren();more.replaceChildren();
      prefs[group].forEach(function(id,i){
        var row=el('div','inv-personal-fila');row.setAttribute('role','listitem');row.draggable=true;row.dataset.id=id;
        var name=label(group,id);row.appendChild(el('span','inv-personal-agarre','⠿'));row.appendChild(el('span','inv-personal-nombre',name));
        var buttons=el('div','inv-personal-acciones');
        var up=action('↑','Subir '+name,function(){move(id,i-1);});up.disabled=i===0;up.setAttribute('data-inv-op',id+':up');
        var down=action('↓','Bajar '+name,function(){move(id,i+1);});down.disabled=i===prefs[group].length-1;down.setAttribute('data-inv-op',id+':down');
        var first=action('⇡','Al principio: '+name,function(){move(id,0);});first.disabled=i===0;first.setAttribute('data-inv-op',id+':first');first.title='Al principio';
        var hide=action('Ocultar','Ocultar '+name,function(){prefs[group]=prefs[group].filter(function(x){return x!==id;});save();});hide.setAttribute('data-inv-op',id+':hide');
        [up,down,first,hide].forEach(function(b){buttons.appendChild(b);});row.appendChild(buttons);
        row.addEventListener('dragstart',function(e){dragged=id;if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id);}row.classList.add('arrastrando');});
        row.addEventListener('dragend',function(){dragged=null;row.classList.remove('arrastrando');});
        row.addEventListener('dragover',function(e){if(dragged&&dragged!==id)e.preventDefault();});
        row.addEventListener('drop',function(e){if(!dragged||dragged===id)return;e.preventDefault();move(dragged,prefs[group].indexOf(id));dragged=null;});
        list.appendChild(row);
      });
      empty.hidden=prefs[group].length>0;
      defs[group].filter(function(d){return prefs[group].indexOf(d[0])<0;}).forEach(function(d){var b=action('＋ '+d[1],'Mostrar '+d[1],function(){prefs[group].push(d[0]);save();});more.appendChild(b);});
      if(!more.children.length)more.appendChild(el('p','','Todos los accesos están visibles.'));
      if(focusKey){var target=Array.from(list.querySelectorAll('[data-inv-op]')).find(function(b){return b.getAttribute('data-inv-op')===focusKey&&!b.disabled;});if(target)target.focus();}
    }
    function open(g,button){group=g;opener=button;title.textContent=g==='inicio'?'⚙️ Accesos de Inicio':'⚙️ Filtros de Piezas';status.textContent='Preferencia independiente de otras computadoras.';renderList();dialog.showModal();}
    function gear(headingId,g,aria){var h=document.getElementById(headingId);if(!h)return;var wrap=el('div','inv-personal-encabezado');h.parentNode.insertBefore(wrap,h);wrap.appendChild(h);var b=action('⚙️',aria,function(){open(g,b);});b.className='inv-personal-eng';b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls','inv-personal');b.title=aria;wrap.appendChild(b);}
    gear('inv-inicio-titulo','inicio','Personalizar accesos de Inicio');gear('inv-piezas-titulo','filtros','Personalizar filtros de Piezas');
    var notice=el('div','inv-personal-filtro-aviso');notice.id='inv-filtro-oculto-aviso';notice.hidden=true;
    var noticeText=el('span');notice.appendChild(noticeText);
    var clear=action('Quitar filtro','Quitar filtro activo oculto',function(){if(typeof window.setFiltro==='function')window.setFiltro(null);});notice.appendChild(clear);filters.parentNode.insertBefore(notice,filters);
    function applyHome(){
      defs.inicio.forEach(function(d){
        var b=home.querySelector('[data-inv-acceso="'+d[0]+'"]');
        if(!b && prefs.inicio.indexOf(d[0])>=0){
          b=el('button','btn btn-mini',d[1]);b.type='button';b.dataset.invAcceso=d[0];
          b.addEventListener('click',function(){if(typeof window.verTodasPiezas==='function')window.verTodasPiezas(d[0]);});home.appendChild(b);
        }
      });
      order(home,'inicio');
    }
    function order(host,g){
      if(!host)return;
      var ids=prefs[g].concat(defs[g].map(function(d){return d[0];}).filter(function(id){return prefs[g].indexOf(id)<0;}));
      var nodes=ids.map(function(id){return host.querySelector('[data-inv-acceso="'+id+'"]');}).filter(Boolean);
      nodes.forEach(function(b){var hidden=prefs[g].indexOf(b.dataset.invAcceso)<0;b.setAttribute('data-inv-ui-hidden',String(hidden));});
      var current=Array.from(host.children).filter(function(b){return b.hasAttribute('data-inv-acceso');});
      if(nodes.some(function(b,i){return b!==current[i];}))nodes.forEach(function(b){host.appendChild(b);});
    }
    function applyFilters(){
      var bar=document.getElementById('inv-filtros-rapidos');if(!bar)return;
      order(bar,'filtros');
      var active=Array.from(bar.querySelectorAll('[data-inv-acceso]')).find(function(b){return b.classList.contains('active')&&b.dataset.invAcceso!=='todas'&&prefs.filtros.indexOf(b.dataset.invAcceso)<0;});
      notice.hidden=!active;if(active)noticeText.textContent='Filtro activo: '+label('filtros',active.dataset.invAcceso)+' · Su acceso está oculto. ';
    }
    function apply(){applyHome();applyFilters();}
    apply();
    // Sólo observa la reconstrucción de la barra de filtros, nunca resultados,
    // dinero, formularios o contadores. No vuelve a renderizar el inventario.
    var scheduled=false;
    var observer=new MutationObserver(function(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;applyFilters();});});
    observer.observe(filters,{childList:true});
    close.addEventListener('click',function(){dialog.close();});
    dialog.addEventListener('close',function(){if(opener)opener.focus();});
    dialog.addEventListener('click',function(e){if(e.target!==dialog)return;var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
    document.addEventListener('keydown',function(e){if(dialog.open&&e.key==='Escape')e.stopImmediatePropagation();},true);
    reset.addEventListener('click',function(){prefs[group]=defaults[group].slice();save();});
    window.addEventListener('storage',function(e){if(e.key!==KEY&&e.key!==null)return;try{prefs=normalize(JSON.parse(e.newValue||'null'));}catch(err){prefs=normalize(null);}apply();if(dialog.open){renderList();status.textContent='Actualizado desde otra pestaña de este navegador.';}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
