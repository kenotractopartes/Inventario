// Regression isolated from Firebase: one corte until an explicit, double-confirmed split.
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const path=require('node:path');
const InventarioMerge=require('../inventario-merge.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function func(name){
  const start=html.search(new RegExp('function '+name+'\\s*\\('));assert(start>=0,name);
  for(let end=html.indexOf('}',start);end>=0;end=html.indexOf('}',end+1)){
    const code=html.slice(start,end+1);try{new vm.Script('('+code+')');return code;}catch{}
  }throw Error(name);
}
function declaration(name){
  const start=html.search(new RegExp('(?:const|var) '+name+'\\s*='));assert(start>=0,name);
  for(let end=html.indexOf(';',start);end>=0;end=html.indexOf(';',end+1)){
    const code=html.slice(start,end+1).replace(/^(const|var)/,'var');
    try{new vm.Script(code);return code;}catch{}
  }throw Error(name);
}
function env(){
  const nodes=new Map(),timers=[],calls={writes:0,published:[],confirms:0,prompts:0,messages:[]};
  function node(id){return {id,value:'',style:{},classList:{add(){},remove(){}},querySelectorAll:()=>[],
    set innerHTML(markup){this.markup=markup;
      if(id==='modal-pieza-body')for(const k of [...nodes.keys()])if(/^(pieza-|edit-|ficha-)/.test(k))nodes.delete(k);
      for(const m of markup.matchAll(/<(input|textarea|select)[^>]*\bid="([^"]+)"[^>]*>/g)){
        const n=node(m[2]);n.value=(m[0].match(/\bvalue="([^"]*)"/)||[])[1]||'';nodes.set(m[2],n);
      }
    },get innerHTML(){return this.markup||''}};}
  for(const id of ['modal-pieza-body','modal-pieza-title'])nodes.set(id,node(id));
  const c={console,Date,Math,JSON,Array,Object,Set,Map,DATA:{camiones:[],piezas:[],familiasOverride:{}},MEDIA_MODELO:{},PUB:{},
    document:{getElementById:id=>nodes.get(id)||null},_piezaCamionId:null,_piezaFamilia:null,_piezaModelo:null,_piezaExtras:{},_modoCompra:false,
    _invSync:{base:{piezas:[]},pendiente:false,ocupado:false},_reabrirModalPieza:null,
    _undoStack:[{desc:'Cambio anterior'}],renderHistorialAcciones(){},
    inventarioBaseLista(){return !!(c._invSync.base&&!c._invSync.pendiente&&!c._invSync.ocupado)},
    getCatalogos:()=>({motores:['ISX'],marcasCamion:[],modelosPorMarca:{}}),getBotonesFamilia:id=>id==='motores'?['ISX','DD15']:[],
    escapeHtml:s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),
    guardar(){calls.writes++;c._invSync.base={piezas:structuredClone(c.DATA.piezas)};c._invSync.pendiente=false;},
    toast:m=>calls.messages.push(m),alert:m=>calls.messages.push(m),confirm:()=>{calls.confirms++;return true;},
    prompt:()=>{calls.prompts++;return 'DESARMAR 0123';},pushUndo(){},closeModal(){},openModal(){},playDing(){},
    refrescarVistaActual(){},avisarFallaGuardado(m){calls.messages.push(m)},
    publicarFicha:p=>{calls.published.push(p.id);return Promise.resolve()},
    _modelKey:() => '',republicarModelo(){},esSoloContenido:()=>false,
    setTimeout:fn=>timers.push(fn),
    esEditor:()=>true,mediaDePieza:()=>[],precioBadge:()=>'',_alertaHuerfano:()=>'',badgeApartada:()=>'',
    estadoInyBadge:()=>'',botonApartar:()=>'',botonFotos:()=>'<button>📷</button>',puedeFacturarse:()=>false,
    colorEstadoPieza:()=>'',txtEstadoPieza:()=>'',_notaDeMaura:()=>'',formatExtras:()=>'',
    optsConsecutivoTPM:()=>'',bajaBtnStyle:()=>'',fmtDinero:()=>'',
  };
  vm.createContext(c);
  for(const n of ['FAMILIAS','FAMILIAS_SIN_ESTADO','ESTADOS_PIEZA','ESTADOS_MOTOR','FAMILIAS_FOTOS_MODELO','EXCEL_HEADERS','EXCEL_HEADERS_CHASIS','EXCEL_HEADERS_CORTES'])
    vm.runInContext(declaration(n),c);
  for(const n of ['leerDatosCorte','nombreCorte','familiaLlevaEstado','seleccionarFamilia','guardarPieza',
    'editarPieza','guardarEdicionPieza','parsearPrecioRange','_folioClave','piezaConFolio','avisoFolioRepetido',
    'desarmarCorte','deshacerUltima','origenCorteInfo','datosPublicosDePieza','_saleEnCatalogo','excelFilaCorte',
    'excelHeadersFam','excelFilaFam','columnasImprimir','valorColumna'])vm.runInContext(func(n),c);
  return {c,nodes,timers,calls,fill(values){for(const [id,value] of Object.entries(values)){assert(nodes.has(id),id);nodes.get(id).value=value;}}};
}
let n=0;function test(name,run){run();console.log('PASS',name);n++;}
test('family and public catalog contain Cortes, with individual photos',()=>{
  const {c}=env();assert.equal(c.FAMILIAS.filter(f=>f.id==='cortes').length,1);
  assert(!c.FAMILIAS_FOTOS_MODELO.includes('cortes'));
  const cat=fs.readFileSync(path.join(__dirname,'../catalogo.html'),'utf8');
  const familias=JSON.parse(cat.match(/var FAMILIAS = (\[.*?\]);/)[1]);
  assert.equal(familias.filter(f=>f.id==='cortes').length,1);
});
let piece;
test('new Corte has both complete forms, one unit and a required folio',()=>{
  const e=env(),{c,nodes,fill,calls}=e;
  c._piezaFamilia='cortes';c.seleccionarFamilia('cortes');
  for(const id of ['pieza-corte-cabina-marca','pieza-corte-cabina-modelo','pieza-corte-cabina-anio','pieza-corte-cabina-vin',
    'pieza-corte-cabina-extra','pieza-corte-motor-modelo','pieza-corte-motor-serie','pieza-corte-motor-cpl',
    'pieza-corte-motor-hp','pieza-corte-motor-estado','pieza-corte-motor-marca','pieza-corte-motor-fichamodelo',
    'pieza-corte-motor-anio','pieza-corte-motor-vin','pieza-corte-motor-nomotor','pieza-corte-motor-extra',
    'pieza-corte-extra','pieza-folio'])assert(nodes.has(id),id);
  assert(!nodes.has('pieza-motor-suelto'));
  fill({'pieza-corte-cabina-marca':'Kenworth','pieza-corte-cabina-modelo':'T800','pieza-corte-cabina-anio':'2012',
    'pieza-corte-cabina-vin':'VIN123','pieza-corte-cabina-extra':'Tablero íntegro',
    'pieza-corte-motor-modelo':'ISX','pieza-corte-motor-serie':'SER456','pieza-corte-motor-cpl':'4583',
    'pieza-corte-motor-hp':'400','pieza-corte-motor-estado':'Usado','pieza-corte-motor-marca':'Kenworth',
    'pieza-corte-motor-fichamodelo':'T800','pieza-corte-motor-anio':'2012','pieza-corte-motor-vin':'VIN123',
    'pieza-corte-motor-nomotor':'NM77','pieza-corte-motor-extra':'Arranca bien','pieza-corte-extra':'Corte de frente'});
  c.guardarPieza();assert.equal(calls.writes,0);assert.equal(c.DATA.piezas.length,0);
  fill({'pieza-folio':'123','pieza-precio':'200000'});c.guardarPieza();
  assert.equal(calls.writes,1);assert.equal(c.DATA.piezas.length,1);
  piece=c.DATA.piezas[0];assert.equal(piece.familia,'cortes');assert.equal(piece.folioInterno,'0123');
  assert.equal(piece.modelo,'Kenworth T800 2012');assert.equal(piece.extras.corteCabina.vin,'VIN123');
  assert.equal(piece.extras.corteMotor.serie,'SER456');assert.equal(piece.extras.corteMotor.cpl,'4583');
  assert.equal(piece.extras.corteExtra,'Corte de frente');
  assert.equal(c.DATA.piezas.filter(p=>p.familia==='motores'||p.familia==='cabinas').length,0);
  assert.equal(c.excelFilaCorte(piece)[0],'0123');
  assert.equal(c.excelHeadersFam('cortes').length,c.excelFilaFam(piece,'cortes').length);
  assert(c.columnasImprimir(c.FAMILIAS.find(f=>f.id==='cortes')).includes('Motor serie'));
});
test('edit keeps cabina and motor nested without changing other families',()=>{
  const e=env(),{c,fill}=e;c.DATA.piezas=[structuredClone(piece),{id:'unrelated',familia:'motores',modelo:'DD15',extras:{}}];
  const untouched=JSON.stringify(c.DATA.piezas[1]);
  c.editarPieza(c.DATA.piezas[0].id);
  fill({'edit-corte-cabina-modelo':'T880','edit-corte-motor-serie':'SER999','edit-corte-extra':'Nueva nota'});
  c.guardarEdicionPieza(c.DATA.piezas[0].id);
  assert.equal(c.DATA.piezas[0].modelo,'Kenworth T880 2012');
  assert.equal(c.DATA.piezas[0].extras.corteMotor.serie,'SER999');
  assert.equal(c.DATA.piezas[0].extras.corteExtra,'Nueva nota');
  assert.equal(JSON.stringify(c.DATA.piezas[1]),untouched);
});
test('double confirmation splits once, archives Corte and records origin/date; no component folios',()=>{
  const e=env(),{c,timers,calls}=e;c.DATA.piezas=[structuredClone(piece)];
  c._invSync.base={piezas:structuredClone(c.DATA.piezas)};
  c.desarmarCorte(piece.id);assert.equal(calls.confirms,1);assert.equal(calls.prompts,1);
  assert.equal(c.DATA.piezas.length,3);assert.equal(calls.writes,1);
  assert.equal(c._undoStack.length,0,'an old snapshot must not resurrect the cut');
  const [original,cab,mot]=c.DATA.piezas;
  assert(original.desarmado);assert(original.noWeb);assert.deepEqual(Object.keys(original.componentesCorte).sort(),['cabina','motor']);
  assert.equal(cab.familia,'cabinas');assert.equal(mot.familia,'motores');
  assert.equal(cab.camionId,original.camionId);assert.equal(mot.camionFolio,original.camionFolio);
  assert.equal(cab.extras.fichaMarca,'Kenworth');assert.equal(cab.extras.fichaVin,'VIN123');
  assert.equal(mot.extras.serie,'SER456');assert.equal(mot.extras.fichaNoMotor,'NM77');
  assert(!cab.folioInterno && !mot.folioInterno);
  for(const child of [cab,mot]){
    assert.equal(child.extras.origenCorte.folio,'0123');assert.equal(child.extras.origenCorte.modelo,'T800');
    assert(child.extras.origenCorte.fecha>0);assert.match(c.origenCorteInfo(child),/ⓘ Viene de un corte/);
    assert.match(c.origenCorteInfo(child),/Folio propio pendiente de Raúl/);
  }
  assert.equal(c._saleEnCatalogo(original),false);assert.equal(c.datosPublicosDePieza(original).desarmado,true);
  while(timers.length)timers.shift()();assert.equal(calls.published.length,3);
  c.desarmarCorte(piece.id);assert.equal(c.DATA.piezas.length,3);assert.equal(calls.writes,1);
});
test('an older undo snapshot on another device cannot resurrect a dismantled cut',()=>{
  const e=env(),{c,calls}=e;
  const original={...structuredClone(piece),desarmado:true,componentesCorte:{cabina:'cab',motor:'mot'}};
  c.DATA.piezas=[original,{id:'cab',familia:'cabinas'},{id:'mot',familia:'motores'}];
  c._undoStack=[{desc:'Cambio anterior',snap:JSON.stringify({piezas:[piece],camiones:[],folioCounter:0})}];
  c.deshacerUltima();
  assert.equal(c.DATA.piezas.length,3);assert.equal(c._undoStack.length,1);
  assert(calls.messages.some(m=>m.includes('otro equipo desarmó un corte')));
});
test('cancelled or unsynced split writes nothing',()=>{
  for(const blocked of ['cancel','pending']){
    const e=env(),{c,calls}=e;c.DATA.piezas=[structuredClone(piece)];
    c._invSync.base={piezas:structuredClone(c.DATA.piezas)};
    if(blocked==='pending')c._invSync.pendiente=true;else c.confirm=()=>false;
    c.desarmarCorte(piece.id);assert.equal(c.DATA.piezas.length,1);assert.equal(calls.writes,0);
  }
});
test('cloud merge rejects sale, apart or edits concurrent with disassembly',()=>{
  const base={piezas:[{id:'c123',familia:'cortes',folioInterno:'0123',modelo:'T800',vendida:false}]};
  const split={piezas:[{...base.piezas[0],desarmado:true,fechaDesarmado:123},
    {id:'c123_cabina',familia:'cabinas'},{id:'c123_motor',familia:'motores'}]};
  for(const change of [{vendida:true,fechaVenta:456},{apartada:true,apartadoInfo:{cliente:'A'}},{modelo:'T880'}]){
    const edited={piezas:[{...base.piezas[0],...change}]};
    assert.throws(()=>InventarioMerge.merge(base,split,edited),/cambió el corte/);
    assert.throws(()=>InventarioMerge.merge(base,edited,split),/cambió el corte/);
  }
  const unrelated={piezas:base.piezas.concat({id:'otro',familia:'motores',modelo:'ISX'})};
  const merged=InventarioMerge.merge(base,split,unrelated);
  assert.equal(merged.piezas.length,4);
});
console.log(`${n} Corte scenarios passed; only synthetic data`);
