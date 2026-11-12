/* INV-TEMAS-1111. Preferencia visual local: no usa Firebase, datos ni permisos. */
(function () {
  'use strict';
  var KEY = 'tpm_inventario_tema_v1';
  var THEMES = [{"id":"arena","name":"Arena","colors":{"canvas":"#f1ede5","surface":"#fffdf8","soft":"#e9e2d5","border":"#cec3af","text":"#302b24","muted":"#645a4c","accent":"#725c39","tint":"#e8deca","header":"#393329"}},{"id":"cafe","name":"Café claro","colors":{"canvas":"#eee8e2","surface":"#fffcf8","soft":"#e7ddd2","border":"#cdbdae","text":"#342b26","muted":"#67594e","accent":"#78533b","tint":"#eaddd0","header":"#3e3028"}},{"id":"lino","name":"Lino","colors":{"canvas":"#f0eee8","surface":"#fffefb","soft":"#e6e2d8","border":"#ccc6b8","text":"#302f29","muted":"#615f54","accent":"#69654a","tint":"#e7e3cf","header":"#35362e"}},{"id":"marfil","name":"Marfil","colors":{"canvas":"#f4f1e9","surface":"#fffefa","soft":"#eae6db","border":"#d0c7b5","text":"#342e25","muted":"#696051","accent":"#7a6134","tint":"#ede3cc","header":"#3c3529"}},{"id":"piedra","name":"Piedra","colors":{"canvas":"#eaeae6","surface":"#fcfcf8","soft":"#dfdfd8","border":"#bfc1b7","text":"#2c302b","muted":"#5a6258","accent":"#59674f","tint":"#dde4d7","header":"#30372f"}},{"id":"perla","name":"Perla","colors":{"canvas":"#edf0f2","surface":"#ffffff","soft":"#e2e8ec","border":"#c3cdd3","text":"#27323a","muted":"#586872","accent":"#4d6373","tint":"#dfe8ee","header":"#2a3945"}},{"id":"azul-gris","name":"Azul gris","colors":{"canvas":"#e9eef2","surface":"#fcfdff","soft":"#dee6ee","border":"#bbcbd9","text":"#283543","muted":"#556878","accent":"#4b6781","tint":"#dce7f1","header":"#2c3d51"}},{"id":"acero","name":"Azul acero","colors":{"canvas":"#e6edf1","surface":"#fbfdff","soft":"#dce7ee","border":"#b8cad6","text":"#263541","muted":"#526777","accent":"#3e637e","tint":"#d6e6f1","header":"#293f50"}},{"id":"marino","name":"Azul marino","colors":{"canvas":"#e9edf3","surface":"#fcfdff","soft":"#dfe6f0","border":"#bdc9db","text":"#293346","muted":"#58667b","accent":"#405b83","tint":"#dce5f3","header":"#28354f"}},{"id":"petroleo","name":"Petróleo","colors":{"canvas":"#e7efee","surface":"#fbfffe","soft":"#dbe7e5","border":"#b5ceca","text":"#273b38","muted":"#506c66","accent":"#356b63","tint":"#d6e9e4","header":"#263e3a"}},{"id":"salvia","name":"Salvia","colors":{"canvas":"#ecf0e9","surface":"#fcfef9","soft":"#e1e7da","border":"#c0ceb5","text":"#303b2b","muted":"#5c6a54","accent":"#566e45","tint":"#e0ead7","header":"#34412c"}},{"id":"oliva","name":"Oliva suave","colors":{"canvas":"#efefe5","surface":"#fffff9","soft":"#e4e5d5","border":"#c7c9ae","text":"#35382a","muted":"#60634c","accent":"#666f3b","tint":"#e6e8d2","header":"#3b402b"}},{"id":"terracota","name":"Terracota","colors":{"canvas":"#f2eae5","surface":"#fffdfa","soft":"#ecdfd7","border":"#d4beb0","text":"#3f302a","muted":"#735e53","accent":"#8a5840","tint":"#efdfd3","header":"#49362e"}},{"id":"vino","name":"Vino suave","colors":{"canvas":"#f1e9ec","surface":"#fffafd","soft":"#eadde3","border":"#d3bbc5","text":"#3d2d35","muted":"#715765","accent":"#825165","tint":"#ecdbe3","header":"#452d3a"}},{"id":"grafito","name":"Grafito","colors":{"canvas":"#e9eaec","surface":"#fdfdfd","soft":"#dedfe3","border":"#bec1c7","text":"#2e3037","muted":"#5c616c","accent":"#555e70","tint":"#e0e3e9","header":"#30343d"}},{"id":"negro-perla","name":"Negro y perla","colors":{"canvas":"#ececed","surface":"#ffffff","soft":"#e2e2e5","border":"#c3c3ca","text":"#28282e","muted":"#5f5f69","accent":"#50505e","tint":"#e3e3e9","header":"#222227"}},{"id":"negro-mate","name":"Negro mate","dark":true,"colors":{"canvas":"#090c10","surface":"#171c23","soft":"#222a34","border":"#465363","text":"#eef2f7","muted":"#b3bfce","accent":"#a8c8e9","tint":"#263747","header":"#050709","on-accent":"#090c10"}},{"id":"azul-noche","name":"Azul medianoche","dark":true,"colors":{"canvas":"#081322","surface":"#11233a","soft":"#1b304b","border":"#405e80","text":"#edf3fc","muted":"#b0c3dc","accent":"#9fc5f0","tint":"#213e61","header":"#060e1a","on-accent":"#081322"}},{"id":"grafito-oscuro","name":"Grafito oscuro","dark":true,"colors":{"canvas":"#14151a","surface":"#20232b","soft":"#2c303b","border":"#555d70","text":"#f0f1f7","muted":"#bfc5d4","accent":"#b9c5e4","tint":"#343d53","header":"#0e1015","on-accent":"#14151a"}},{"id":"cafe-noche","name":"Café nocturno","dark":true,"colors":{"canvas":"#17120f","surface":"#29211b","soft":"#362c24","border":"#71604e","text":"#f6eee7","muted":"#d0bcaa","accent":"#e2bd96","tint":"#4b3726","header":"#100c09","on-accent":"#17120f"}},{"id":"bosque-noche","name":"Bosque nocturno","dark":true,"colors":{"canvas":"#0b1714","surface":"#172a24","soft":"#223b32","border":"#4c6e5e","text":"#ecf5ee","muted":"#b6cfc1","accent":"#a7d4b8","tint":"#294b3a","header":"#07100d","on-accent":"#0b1714"}},{"id":"vino-noche","name":"Vino nocturno","dark":true,"colors":{"canvas":"#1a0e17","surface":"#2c1c28","soft":"#3c2938","border":"#78596d","text":"#f8edf5","muted":"#d4bacc","accent":"#e0b4d1","tint":"#503047","header":"#110810","on-accent":"#1a0e17"}}];
  var root = document.documentElement;
  var selected = 'actual';
  function valid(id) { return id === 'actual' || THEMES.some(function (t) { return t.id === id; }); }
  function apply(id) {
    selected = valid(id) ? id : 'actual';
    var theme = THEMES.find(function (t) { return t.id === selected; });
    if (theme && theme.dark) root.setAttribute('data-inv-oscuro','true');
    else root.removeAttribute('data-inv-oscuro');
    if (selected === 'actual') root.removeAttribute('data-inv-tema');
    else root.setAttribute('data-inv-tema', selected);
  }
  try { apply(localStorage.getItem(KEY)); } catch (e) { apply('actual'); }
  function init() {
    var trigger = document.getElementById('btn-inv-tema');
    if (!trigger || document.getElementById('inv-temas')) return;
    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
    var dialog = el('dialog'); dialog.id = 'inv-temas'; dialog.setAttribute('aria-labelledby', 'inv-temas-titulo');
    var head = el('div', 'inv-temas-cab');
    var title = el('h2', '', '✏️ Apariencia del inventario'); title.id = 'inv-temas-titulo'; head.appendChild(title);
    var close = el('button', 'inv-temas-cerrar', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Cerrar apariencia'); head.appendChild(close);
    var body = el('div', 'inv-temas-cuerpo');
    body.appendChild(el('p', '', 'Elige los colores que te resulten más cómodos. El cambio se ve al momento.'));
    var grid = el('div', 'inv-temas-grid'); grid.setAttribute('role','group'); grid.setAttribute('aria-label','Temas disponibles');
    var original = {id:'actual', name:'Aspecto actual', colors:{canvas:'#f2efe9',surface:'#ffffff',soft:'#faf8f3',header:'#17140f',accent:'#b03a2e'}};
    var buttons = [];
    var foot = el('div', 'inv-temas-pie'); var status = el('p'); status.id = 'inv-temas-estado'; status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    function update() { buttons.forEach(function (b) { b.setAttribute('aria-pressed',String(b.dataset.theme === selected)); }); }
    function choose(id, name) {
      apply(id); var saved = true;
      try { if (id === 'actual') localStorage.removeItem(KEY); else localStorage.setItem(KEY,id); } catch (e) { saved = false; }
      update();
      status.textContent = saved ? name + ' · Guardado en este navegador.' : name + ' · Aplicado sólo en esta pestaña; el navegador no permitió guardarlo.';
    }
    [original].concat(THEMES.filter(function(t){return t.dark;}),THEMES.filter(function(t){return !t.dark;})).forEach(function (t) {
      var b = el('button','inv-tema-opcion'); b.type = 'button'; b.dataset.theme = t.id;
      var sample = el('span','inv-tema-muestra'); sample.setAttribute('aria-hidden','true');
      ['canvas','surface','soft','header','accent'].forEach(function (k) { sample.style.setProperty('--m-'+k,t.colors[k]); });
      var name = el('span','inv-tema-nombre'); name.appendChild(el('span','',t.name)); var check = el('span','inv-tema-marca','✓'); check.setAttribute('aria-hidden','true'); name.appendChild(check);
      b.appendChild(sample); b.appendChild(name); b.setAttribute('aria-label',t.name);
      b.addEventListener('click', function () { choose(t.id,t.name); }); grid.appendChild(b); buttons.push(b);
    });
    body.appendChild(grid); foot.appendChild(status);
    foot.appendChild(el('p','inv-temas-nota','Sólo cambia los colores de este navegador. No cambia piezas, permisos ni la vista de otras computadoras. Los avisos y estados conservan sus colores.'));
    body.appendChild(foot); dialog.appendChild(head); dialog.appendChild(body); document.body.appendChild(dialog);
    close.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target !== dialog) return; var r=dialog.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) dialog.close(); });
    // Escape cierra sólo este diálogo, sin cancelar capturas abiertas detrás.
    document.addEventListener('keydown', function (e) { if (dialog.open && e.key === 'Escape') e.stopImmediatePropagation(); }, true);
    function open() { update(); status.textContent = 'Preferencia independiente por navegador y computadora.'; if (!dialog.open) dialog.showModal(); }
    trigger.addEventListener('click',open); trigger.disabled = false;
    // En celular se conserva Catálogo en Herramientas, con el lápiz al lado.
    var panel = document.getElementById('eng-panel-izq');
    var catalog = panel && panel.querySelector('button[onclick*="dialogo-catalogo"]');
    if (catalog) {
      var pair = el('div','inv-temas-par'); catalog.parentNode.insertBefore(pair,catalog); pair.appendChild(catalog);
      var mobile = el('button','inv-temas-movil','✏️'); mobile.type = 'button'; mobile.setAttribute('aria-label','Cambiar colores del inventario'); mobile.setAttribute('aria-haspopup','dialog'); mobile.setAttribute('aria-controls','inv-temas');
      mobile.addEventListener('click',function () { if (typeof window.engCerrar === 'function') window.engCerrar(); open(); }); pair.appendChild(mobile);
    }
    window.addEventListener('storage',function(e) { if (e.key === KEY || e.key === null) { apply(e.newValue); update(); status.textContent = 'Apariencia actualizada desde otra pestaña de este navegador.'; } });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
