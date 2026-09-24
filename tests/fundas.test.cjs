// Isolated regression: real form/save/edit functions, synthetic DATA, no Firebase/network.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function func(name){
 const start=html.search(new RegExp('function '+name+'\\s*\\('));assert(start>=0,name);
 for(let end=html.indexOf('}',start);end>=0;end=html.indexOf('}',end+1)){
  const text=html.slice(start,end+1);try{new vm.Script('('+text+')');return text;}catch{}
 }throw Error(name);
}
function declaration(name){
 const start=html.search(new RegExp('(?:const|var) '+name+'\\s*='));assert(start>=0,name);
 for(let end=html.indexOf(';',start);end>=0;end=html.indexOf(';',end+1)){const code=html.slice(start,end+1).replace(/^(const|var)/,'var');try{new vm.Script(code);return code;}catch{}}throw Error(name);
}
function environment(){
 const nodes=new Map();
 function node(id){return {id,value:'',checked:false,style:{},classList:{add(){},remove(){}},querySelectorAll:()=>[],
 get innerHTML(){return this.markup||''},set innerHTML(s){this.markup=s;
  // Only the synthetic modal subtree is rebuilt; optional absent fields return null.
  if(id==='modal-pieza-body')for(const k of [...nodes.keys()])if(/^(pieza-|edit-|ficha-)/.test(k))nodes.delete(k);
  for(const m of s.matchAll(/<(input|textarea|div|select)[^>]*\bid="([^"]+)"[^>]*>/g)){
   const n=node(m[2]);n.value=(m[0].match(/\bvalue="([^"]*)"/)||[])[1]||'';nodes.set(m[2],n);
  }
 }};}
 for(const id of ['modal-pieza-body','modal-pieza-title','info-busqueda','resultados-busqueda'])nodes.set(id,node(id));
 const c={console,Date,Math,JSON,Array,Object,Set,Map,DATA:{camiones:[],piezas:[],familiasOverride:{}},MEDIA_MODELO:{},
  document:{getElementById:id=>nodes.get(id)||null},_piezaCamionId:null,_piezaFamilia:null,_piezaModelo:null,_piezaExtras:{},_modoCompra:false,
  getCatalogos:()=>({motores:['C7']}),escapeHtml:s=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;'),
  renderBotones(id,values){nodes.get(id).innerHTML=values.map(v=>`<button>${v}</button>`).join('')},
  guardar(){c.writes++},writes:0,toast(m){c.messages.push(m)},messages:[],alert(m){c.messages.push(m)},
  avisarFallaGuardado(m,e){throw e},closeModal(){},openModal(){},playDing(){},refrescarVistaActual(){},pushUndo(){},publicarFicha(){},_modelKey:()=>'',
  _filtroFamilia:'fundas',_filtroLibras:null,_filtroModelo:null,_buscaPzTexto:'',_filtroSinPrecio:false,_filtroBajoPedido:false,_filtroApartadas:false,_filtroFotos:false,_filtroSinFotos:false,
  FAM_CON_MARCA_CAMION:[],ARNES_ZONAS:[],_acordeonesAbiertos:new Set(),esFamiliaReparacion:()=>false,
  RIC_FAM:'ricardo',formatExtras:()=>'',numeroArnesBadge:()=>'',estadoInyBadge:()=>'',estadoInyBotones:()=>'',estadoIny:()=>'',puedeFacturarse:()=>false,botonFotos:()=>'',renderBusqueda(){},fechaCorta:()=>'',piezaDetalles:()=>'',detallePieza:()=>'',precioBadge:()=>'',badgeApartada:()=>'',botonApartar:()=>'',mediaDePieza:()=>[],familiaLlevaFotos:()=>true
 };
 vm.createContext(c);
 for(const name of ['FAMILIAS','FAMILIAS_SIN_ESTADO','ESTADOS_PIEZA','EXCEL_HEADERS','FAM_CON_FILTRO_PROPIO'])vm.runInContext(declaration(name),c);
 for(const name of ['getBotonesFamilia','familiaLlevaEstado','seleccionarFamilia','guardarPieza','editarPieza','guardarEdicionPieza','parsearPrecioRange','_folioClave','piezaConFolio','avisoFolioRepetido','_librasDeTexto','librasDePieza','_fmtLibras','panelFiltroLibras','setFiltro','columnasImprimir','valorColumna','excelFilaDe','_renderResultadosBusqueda'])vm.runInContext(func(name),c);
 return {c,nodes,fill(values){for(const [id,value] of Object.entries(values)){assert(nodes.has(id),id);nodes.get(id).value=value;}}};
}
let passed=0;function test(name,fn){fn();console.log('PASS',name);passed++;}
test('all inline JavaScript parses',()=>{for(const file of ['index.html','catalogo.html'])for(const m of fs.readFileSync(path.join(__dirname,'..',file),'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=|application\/(ld\+)?json/.test(m[1]))new vm.Script(m[2]);});
test('Fundas capture and edit use the same fields as Mancuernas',()=>{
 const {c,nodes}=environment();const fields=f=>{c.seleccionarFamilia(f);return [...nodes.keys()].filter(x=>x.startsWith('pieza-')).sort()};
 assert.deepEqual(fields('fundas'),fields('mancuernas'));c.seleccionarFamilia('fundas');
 assert.match(nodes.get('pieza-modelos').innerHTML,/Funda 44k/);assert.match(nodes.get('pieza-suspensiones').innerHTML,/4 Bolsas/);
 for(const family of ['fundas','mancuernas'])c.DATA.piezas.push({id:family,familia:family,extras:{},modelo:'Modelo'});
 c.editarPieza('fundas');const a=[...nodes.keys()].filter(x=>x.startsWith('edit-')).sort();c.editarPieza('mancuernas');assert.deepEqual(a,[...nodes.keys()].filter(x=>x.startsWith('edit-')).sort());
});
test('create, reload and edit Fundas; existing inventory untouched; independent folios',()=>{
 const {c,nodes,fill}=environment();const existing={id:'old',familia:'mancuernas',modelo:'Mancuerna 44k',folioInterno:'0012',extras:{libras:'44,000'}};c.DATA.piezas.push(existing);const original=JSON.stringify(existing);
 c.seleccionarFamilia('fundas');c._piezaModelo='Funda 44k';c._piezaExtras={marcaEje:'Spicer',suspension:'4 Bolsas',estado:'Usado'};
 fill({'pieza-cantidad':'2','pieza-libras':'44,000','pieza-paso':'11/39','pieza-precio':'1000-1500','pieza-folio':'12','pieza-ubicacion':'Patio A','pieza-notas':'Prueba'});
 c.guardarPieza();assert.equal(c.writes,1);assert.equal(c.DATA.piezas.length,3);assert.equal(JSON.stringify(existing),original);
 const p=c.DATA.piezas[1];assert.equal(p.familia,'fundas');assert.equal(p.folioInterno,'0012');assert.equal(c.DATA.piezas[2].folioInterno,'0013');assert.equal(p.extras.marcaEje,'Spicer');assert.equal(p.extras.suspension,'4 Bolsas');assert.equal(p.extras.libras,'44,000');assert.equal(p.extras.paso,'11/39');assert.equal(p.precioMax,1500);
 c.DATA=JSON.parse(JSON.stringify(c.DATA));c.editarPieza(p.id);
 fill({'edit-modelo':'Funda 46k','edit-folio':'12','edit-marcaEje':'Meritor','edit-suspension':'Muelles','edit-libras':'46,000','edit-paso':'10/41','edit-estado':'Reconstruido','edit-ubicacion':'Patio B','edit-notas':'Editada','edit-precio':'2000-2500'});
 c.guardarEdicionPieza(p.id);const edited=c.DATA.piezas[1];assert.equal(edited.extras.libras,'46,000');assert.equal(edited.extras.marcaEje,'Meritor');assert.equal(edited.extras.suspension,'Muelles');assert.equal(edited.extras.paso,'10/41');assert.equal(edited.precioSugerido,2000);assert.equal(edited.precioMax,2500);assert.equal(JSON.stringify(c.DATA.piezas[0]),original);
 c.seleccionarFamilia('fundas');c._piezaModelo='Funda 42k';fill({'pieza-folio':'12','pieza-cantidad':'1'});const count=c.DATA.piezas.length;c.guardarPieza();assert.equal(c.DATA.piezas.length,count);assert.match(c.messages.at(-1),/folio repetido/);
 const row=c.excelFilaDe(edited);assert.equal(row[2],'Funda');for(const value of ['46,000','Meritor','Muelles','10/41'])assert(row.includes(value));
});
test('libras options count Fundas only, excluding sold and Mancuernas; print includes axle fields',()=>{
 const {c}=environment();c.DATA.piezas=[{familia:'fundas',modelo:'Funda 44k',extras:{}},{familia:'fundas',modelo:'Funda 46k',extras:{}},{familia:'fundas',modelo:'Funda 42k',vendida:true},{familia:'mancuernas',modelo:'Mancuerna 40k'}];
 const h=c.panelFiltroLibras('fundas');assert.match(h,/44000/);assert.match(h,/46000/);assert(!h.includes('42000'));assert(!h.includes('40000'));
 const f=c.FAMILIAS.find(f=>f.id==='fundas'),m=c.FAMILIAS.find(f=>f.id==='mancuernas');assert.deepEqual(c.columnasImprimir(f),c.columnasImprimir(m));assert(c.FAM_CON_FILTRO_PROPIO.includes('fundas'));
 c._filtroLibras=44000;c.setFiltro('fundas');assert.equal(c._filtroLibras,44000);c.setFiltro('motores');assert.equal(c._filtroLibras,null);
});
test('actual list filters Fundas by libras without mixing families or sold pieces',()=>{
 const {c,nodes}=environment();c.DATA.piezas=[{id:'f44',familia:'fundas',modelo:'Funda 44k'},{id:'f46',familia:'fundas',modelo:'Funda 46k'},{id:'sold',familia:'fundas',modelo:'Funda 44k',vendida:true},{id:'m44',familia:'mancuernas',modelo:'Mancuerna 44k'}];
 c._filtroLibras=44000;c._renderResultadosBusqueda();assert.deepEqual(Array.from(c._gruposUltimoRender.fundas.ids),['f44']);assert.match(nodes.get('resultados-busqueda').innerHTML,/Fundas/);
 c._filtroLibras=null;c._renderResultadosBusqueda();assert.equal(c._gruposUltimoRender.fundas.ids.length,2);
 c._filtroFamilia='mancuernas';c._renderResultadosBusqueda();assert.deepEqual(Array.from(c._gruposUltimoRender.mancuernas.ids),['m44']);
});
test('catalog recognizes Fundas as an independent family',()=>{const s=fs.readFileSync(path.join(__dirname,'../catalogo.html'),'utf8');const a=JSON.parse(s.match(/var FAMILIAS = (\[.*?\]);/)[1]);assert.equal(a.filter(x=>x.id==='fundas').length,1);assert.equal(a.find(x=>x.id==='fundas').sing,'Funda');});
console.log(`${passed} tests passed; no live data accessed`);
