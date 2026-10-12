// Executes production functions against synthetic DOM/storage/RTDB only.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path'),Merge=require('../inventario-merge.js');
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
function corte(){return {id:'corte-sintetico',familia:'cortes',folioInterno:'T431',modelo:'Volvo 3era Generacion 2015',
  camionId:null,camionFolio:'SUELTA',vendida:false,fechaRegistro:100,precioSugerido:200000,
  notas:'Nota del conjunto',extras:{ubicacion:'Patio 1',corteExtra:'Corte frontal',
    corteCabina:{marca:'Volvo',modelo:'3era Generacion',anio:'2015',vin:'VIN-SINTETICO',extra:'Cabina completa'},
    corteMotor:{modelo:'Volvo D13',serie:'SERIE-SINTETICA',cpl:'4583',hp:'400',estado:'Usado',
      marca:'Volvo',fichaModelo:'D13',anio:'2015',vin:'VIN-MOTOR-SINTETICO',noMotor:'NM-TEST',extra:'Motor revisado',datoFuturo:'Conservar'}}};}
function env(){
  const nodes=new Map(),timers=[],storage=new Map(),calls={transactions:0,published:[],leadway:[],messages:[],confirms:0};
  let update,done;
  const node=id=>({id,value:'',hidden:false,disabled:false,textContent:'',style:{},
    classList:{add(){},remove(){},contains(){return false}},querySelectorAll:()=>[],
    appendChild(n){nodes.set(n.id,n)},remove(){nodes.delete(id)},
    set innerHTML(s){this.markup=s;
      if(id==='modal-pieza-body')for(const k of [...nodes.keys()])if(k.startsWith('edit-'))nodes.delete(k);
      for(const m of s.matchAll(/<(input|textarea|select)[^>]*\bid="([^"]+)"[^>]*>/g)){
        const n=node(m[2]);n.value=(m[0].match(/\bvalue="([^"]*)"/)||[])[1]||'';
        if(m[1]==='textarea')n.value=s.slice(m.index+m[0].length).split('</textarea>')[0];
        nodes.set(n.id,n);
      }
    },get innerHTML(){return this.markup||''}});
  for(const id of ['venta-desc','venta-fecha','venta-precio','venta-corte-opciones','venta-corte-retener','venta-corte-resumen','modal-venta','modal-pieza','modal-pieza-body','modal-pieza-title','ventas-stats','ventas-lista'])nodes.set(id,node(id));
  const ref={transaction(u,d){calls.transactions++;update=u;done=d;},get:async()=>({val:()=>c._invSync.base})};
  const c={console,Date,Math,JSON,Array,Object,Set,Map,Number,Promise,InventarioMerge:Merge,
    DATA:{camiones:[],piezas:[corte()],familiasOverride:{},catalogos:{},salidas:[]},
    _invSync:{base:null,pendiente:false,ocupado:false},_piezaVendiendoId:null,_piezaVendiendoCorteBase:null,
    _undoStack:[{desc:'Cambio viejo'}],_snapPrevio:'',_reabrirModalPieza:null,fbListo:true,fbAplicandoRemoto:false,fbRef:ref,
    EDITOR_KEY:'test',DEVICE_ID:'test',STORE_KEY:'test',MEDIA_MODELO:{},PUB:{},CATALOGOS_DEFAULT:{},FAMILIAS_OVERRIDE_DEFAULT:{},
    document:{getElementById:id=>nodes.get(id)||null,createElement:()=>node('')},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    escapeHtml:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
    setTimeout:fn=>timers.push(fn),confirm:m=>{calls.confirms++;calls.confirmText=m;return true;},
    toast:m=>calls.messages.push(m),avisarFallaGuardado(m){calls.messages.push(m);const n=node('aviso-falla-guardado');nodes.set(n.id,n);},
    esEditor:()=>true,pushUndo(){},registrarUndo(){},renderHistorialAcciones(){},
    guardarLocal(){storage.set('test',JSON.stringify(c.DATA));return true;},
    setEstadoSync(){},programarMantenimientoSeguro(){},refrescarVistaActual(){},playDing(){},closeModal(){},openModal(){},
    publicarFicha:p=>{calls.published.push(p.id);return Promise.resolve()},bajarDeLeadwayAlVender:p=>calls.leadway.push(p.id),
    esFamiliaReparacion:()=>false,estadoIny:()=>null,estadoInyBotones:()=>'',_limpiarLlaves(){},mostrarRevisionLocal(){},exportJSON(){},
    precioBadge:()=>'',_alertaHuerfano:()=>'',badgeApartada:()=>'',estadoInyBadge:()=>'',botonApartar:()=>'',
    botonFotos:()=>'<button>Fotos</button>',puedeFacturarse:()=>false,colorEstadoPieza:()=>'',txtEstadoPieza:()=>'',
    _notaDeMaura:()=>'',fechaCorta:s=>String(s),optsConsecutivoTPM:()=>'',bajaBtnStyle:()=>'',_modelKey:()=>'',esSoloContenido:()=>false,
    getCatalogos:()=>({motores:[]}),getBotonesFamilia:()=>[],snapActual:()=>JSON.stringify(c.DATA),
    renderHistorialAcciones(){},alert:m=>calls.messages.push(m)};
  vm.createContext(c);
  for(const n of ['FAMILIAS','FAMILIAS_SIN_ESTADO','ESTADOS_PIEZA','ESTADOS_MOTOR','EXCEL_HEADERS','EXCEL_HEADERS_CORTES','EXCEL_HEADERS_CHASIS'])vm.runInContext(declaration(n),c);
  for(const n of ['inventarioBaseLista','normalizarData','guardar','empujarAFirebase','venderPieza','actualizarVentaCorte',
    'componenteRetenidoDeCorte','confirmarVentaCorte','confirmarVenta','precioVentaRegistrada','resumenVentaCorte','fmtDinero',
    'datosPendientesDeCorte','avisosDatosCorte','marcarCamposPendientesCorte','origenCorteInfo','familiaLlevaEstado',
    'editarPieza','guardarEdicionPieza','parsearPrecioRange','_folioClave','piezaConFolio','avisoFolioRepetido',
    'deshacerUltima','reactivarPieza','formatExtras','renderPiezaItem','renderPiezaItemConCamion','renderVentas',
    'excelFilaCorte','excelFilaDe','_saleEnCatalogo'])vm.runInContext(func(n),c);
  c.DATA=c.normalizarData(c.DATA);
  c._invSync.base=Merge.clone(c.DATA);
  return {c,nodes,calls,storage,timers,choose(tipo,precio=''){
    c.venderPieza(c.DATA.piezas[0].id);nodes.get('venta-corte-retener').value=tipo;c.actualizarVentaCorte();
    nodes.get('venta-precio').value=precio;c.confirmarVenta();
  },ack(remote=Merge.clone(c._invSync.base)){
    const result=update(remote);
    if(result===undefined){done(null,false,null);return null;}
    done(null,true,{val:()=>result});return result;
  },reject(){done(new Error('offline de prueba'),false,null)},tick(){if(timers.length)timers.shift()();}};
}
let n=0;async function test(name,fn){await fn();console.log('PASS',name);n++;}
(async()=>{
  await test('Corte Vendí requires an explicit choice; other families hide choices',()=>{
    const e=env();e.c.venderPieza('corte-sintetico');assert.equal(e.nodes.get('venta-corte-opciones').hidden,false);
    assert.equal(e.nodes.get('venta-corte-retener').value,'');e.c.confirmarVenta();assert.equal(e.calls.transactions,0);
    e.c.DATA.piezas.push({id:'normal',familia:'motores',modelo:'ISX',vendida:false});e.c.venderPieza('normal');
    assert.equal(e.nodes.get('venta-corte-opciones').hidden,true);e.c.confirmarVenta();assert.equal(e.calls.transactions,1);
    assert.equal(e.c.DATA.piezas[1].vendida,true);assert.equal(e.c.DATA.piezas.length,2);
  });
  for(const tipo of ['motor','cabina'])await test(`partial sale retains exactly one ${tipo}, original/photos/other records intact, one atomic receipt`,async()=>{
    const e=env(),original=Merge.clone(e.c.DATA.piezas[0]);
    e.c.DATA.piezas.push({id:'otra',familia:'motores',modelo:'ISX'});e.c._invSync.base=Merge.clone(e.c.DATA);
    e.choose(tipo,'125000');assert.equal(e.calls.transactions,1);assert.equal(e.calls.published.length,0);assert.equal(e.calls.leadway.length,0);
    assert(e.storage.has('tpm_guardado_pendiente'));
    const result=e.ack();assert.equal(result.piezas.length,3);assert.equal(e.c._invSync.pendiente,false);
    const p=e.c.DATA.piezas[0],child=e.c.DATA.piezas[2];assert(p.vendida&&p.desarmado);assert.equal(p.folioInterno,'T431');
    assert.deepEqual(JSON.parse(JSON.stringify(p.extras)),original.extras);assert.equal(child.vendida,false);
    assert.equal(child.id,'corte-sintetico_'+tipo);assert.equal(child.familia,tipo==='motor'?'motores':'cabinas');
    assert(!child.folioInterno);assert.equal(child.precioSugerido,0);assert.equal(child.extras.origenCorte.folio,'T431');
    assert.equal(child.extras.origenCorte.titulo,original.modelo);assert.equal(child.extras.origenCorte.motivo,'venta-parcial');
    assert.equal(child.extras.ubicacion,'Patio 1');assert.equal(child.extras.infoExtraCorte,'Corte frontal');
    assert.equal(child.notas,original.notas);assert.equal(e.c.DATA.piezas[1].id,'otra');
    assert.equal(e.c._undoStack.length,0);assert.equal(e.c._saleEnCatalogo(p),false);
    assert.match(e.c.origenCorteInfo(child),/T431.*Volvo 3era Generacion 2015/);
    assert.match(e.c.origenCorteInfo(child),/Ver fotos del corte original/);
    if(tipo==='motor'){
      for(const [a,b] of [['serie','serie'],['cpl','cpl'],['hp','hp'],['estadoMotor','estado'],['fichaMarca','marca'],
        ['fichaModelo','fichaModelo'],['fichaAño','anio'],['fichaVin','vin'],['fichaNoMotor','noMotor'],['fichaExtra','extra']])
        assert.equal(child.extras[a],original.extras.corteMotor[b]);
      assert.equal(child.extras.datosComponenteCorte.datoFuturo,'Conservar');
    }else for(const [a,b] of [['fichaMarca','marca'],['fichaModelo','modelo'],['fichaAño','anio'],['fichaVin','vin'],['fichaExtra','extra']])
      assert.equal(child.extras[a],original.extras.corteCabina[b]);
    e.tick();await Promise.resolve();await Promise.resolve();assert.equal(e.calls.published.length,2);assert.equal(e.calls.leadway.length,1);
    e.c._piezaVendiendoId=p.id;e.c.confirmarVenta();assert.equal(e.calls.transactions,1);
    const exportRow=e.c.excelFilaDe(child);assert(exportRow.some(v=>String(v).includes('T431')));
  });
  await test('complete Corte sale creates no components and retains ordinary price',()=>{
    const e=env();e.choose('todo','200000');e.ack();assert.equal(e.c.DATA.piezas.length,1);
    assert(!e.c.DATA.piezas[0].desarmado);assert.equal(e.c.precioVentaRegistrada(e.c.DATA.piezas[0]),200000);
  });
  await test('partial price is never prefilled or inferred from complete Corte',()=>{
    const e=env();e.c.venderPieza('corte-sintetico');e.nodes.get('venta-corte-retener').value='motor';e.c.actualizarVentaCorte();
    assert.equal(e.nodes.get('venta-precio').value,'');e.c.confirmarVenta();e.ack();
    assert.equal(e.c.DATA.piezas[0].precioSugerido,200000);assert.equal(e.c.precioVentaRegistrada(e.c.DATA.piezas[0]),0);
    e.c.renderVentas();assert.match(e.nodes.get('ventas-lista').innerHTML,/Venta parcial · se quedó el motor/);
    assert(!e.nodes.get('ventas-stats').innerHTML.includes('$200,000'));
  });
  await test('blank fields stay blank, field warnings visible in lists and editor, then disappear when filled',()=>{
    const e=env();e.c.DATA.piezas[0].extras.corteMotor={modelo:'D13',serie:'SERIE'};e.c._invSync.base=Merge.clone(e.c.DATA);
    e.choose('motor');e.ack();const child=e.c.DATA.piezas[1];assert.equal(child.extras.cpl,'');assert.equal(child.marca,'');
    assert.equal(child.camionAño,'');assert.equal(child.extras.hp,'');assert.equal(child.extras.estadoMotor,'');
    for(const render of ['renderPiezaItem','renderPiezaItemConCamion'])assert.match(e.c[render](child),/⚠ CPL: pendiente/);
    e.c.editarPieza(child.id);assert.match(e.nodes.get('modal-pieza-body').innerHTML,/<label>CPL <span[^>]*title=[^>]*>⚠ Falta dato/);
    const editor=e.nodes.get('modal-pieza-body').innerHTML;
    for (const [id] of e.c.datosPendientesDeCorte(child)) {
      const label=new RegExp('<label>[^<]*<span[^>]*>⚠ Falta dato</span></label>\\s*<input[^>]*id="'+id+'"');
      assert.match(editor,label, 'Falta aviso inline para '+id);
    }
    assert.equal(e.nodes.get('edit-cpl').value,'');
    const values={'edit-folio':'901','edit-fichaMarca':'Volvo','edit-fichaModelo':'D13','edit-fichaAño':'2015',
      'edit-fichaVin':'VIN','edit-fichaNoMotor':'NO','edit-cpl':'4583','edit-hp':'400','edit-estadoMotor':'Usado'};
    for(const [id,v] of Object.entries(values))e.nodes.get(id).value=v;
    e.c.guardarEdicionPieza(child.id);e.ack();const edited=e.c.DATA.piezas.find(p=>p.id===child.id);
    assert.equal(e.c.datosPendientesDeCorte(edited).length,0);assert.equal(e.c.avisosDatosCorte(edited),'');
    assert.equal(edited.extras.origenCorte.folio,'T431');assert.equal(edited.folioInterno,'0901');
  });
  await test('cabina blank fields warn individually and extra/price remain optional',()=>{
    const e=env();e.c.DATA.piezas[0].extras.corteCabina={marca:'Volvo'};e.c._invSync.base=Merge.clone(e.c.DATA);
    e.choose('cabina');e.ack();const child=e.c.DATA.piezas[1];e.c.editarPieza(child.id);
    assert.match(e.c.avisosDatosCorte(child),/⚠ VIN: pendiente/);assert(!e.c.avisosDatosCorte(child).includes('HP'));
    assert(!e.c.avisosDatosCorte(child).includes('Extra'));assert.equal(e.nodes.get('edit-fichaVin').value,'');
    assert.match(e.nodes.get('modal-pieza-body').innerHTML,/<label>VIN <span/);
  });
  for(const mode of ['cancel','offline','reader','sold','apart-change','duplicate-component','missing-origin-folio','invalid-price','invalid-date'])await test(`blocked ${mode} changes no records`,()=>{
    const e=env();
    if(mode==='missing-origin-folio'){delete e.c.DATA.piezas[0].folioInterno;e.c._invSync.base=Merge.clone(e.c.DATA);}
    e.c.venderPieza('corte-sintetico');e.nodes.get('venta-corte-retener').value='motor';e.c.actualizarVentaCorte();
    if(mode==='cancel')e.c.confirm=()=>false;
    if(mode==='offline')e.c._invSync.pendiente=true;
    if(mode==='reader')e.c.esEditor=()=>false;
    if(mode==='sold')e.c.DATA.piezas[0].vendida=true;
    if(mode==='apart-change')e.c.DATA.piezas[0].apartada=true;
    if(mode==='duplicate-component')e.c.DATA.piezas.push({id:'corte-sintetico_motor',familia:'motores'});
    if(mode==='invalid-price')e.nodes.get('venta-precio').value='mal';
    if(mode==='invalid-date')e.nodes.get('venta-fecha').value='no-date';
    const before=JSON.stringify(e.c.DATA);e.c.confirmarVenta();assert.equal(JSON.stringify(e.c.DATA),before);assert.equal(e.calls.transactions,0);
  });
  await test('cloud event during confirmation revalidates the actual piece before mutation',()=>{
    const e=env();e.c.confirm=()=>{e.c.DATA.piezas[0].modelo='Otro modelo';return true};e.choose('motor');
    assert.equal(e.calls.transactions,0);assert.equal(e.c.DATA.piezas.length,1);assert(!e.c.DATA.piezas[0].vendida);
  });
  await test('rejected transaction retains durable attempt and publishes no false sale',()=>{
    const e=env();e.choose('motor');e.reject();assert(e.storage.has('tpm_guardado_pendiente'));
    for(let i=0;i<31;i++)e.tick();assert.equal(e.calls.published.length,0);assert.equal(e.calls.leadway.length,0);
    assert(e.calls.messages.some(m=>m.includes('no está confirmada')));
  });
  for(const change of [{vendida:true,fechaVenta:999},{apartada:true},{modelo:'Cambiado'},null])await test(`transaction aborts entire partial sale on concurrent Corte ${JSON.stringify(change)}`,async()=>{
    const e=env();e.choose('motor');const remote=Merge.clone(e.c._invSync.base);
    if(change)Object.assign(remote.piezas[0],change);else remote.piezas=[];
    assert.equal(e.ack(remote),null);await Promise.resolve();e.tick();assert.equal(e.calls.published.length,0);
    assert.equal(remote.piezas.length,change?1:0);assert.equal(e.c._invSync.pendiente,true);
  });
  await test('independent concurrent additions are retained in the same committed group',()=>{
    const e=env();e.choose('motor');const remote=Merge.clone(e.c._invSync.base);remote.piezas.push({id:'otro-equipo',familia:'cabinas'});
    const committed=e.ack(remote);assert.equal(committed.piezas.length,3);assert(committed.piezas.some(p=>p.id==='otro-equipo'));
  });
  await test('old merge rejects opposing partials and double retry has the same component ID',()=>{
    const e=env(),b=Merge.clone(e.c.DATA);e.choose('motor');const l=Merge.clone(e.c.DATA);
    const r=Merge.clone(b);r.piezas[0].desarmado=true;r.piezas[0].vendida=true;r.piezas[0].componentesCorte={cabina:'corte-sintetico_cabina'};
    r.piezas.push({id:'corte-sintetico_cabina',familia:'cabinas'});assert.throws(()=>Merge.merge(b,l,r),/cambió el corte/);
    assert.deepEqual(Merge.merge(b,l,l),l);
  });
  await test('reactivation and old undo cannot resurrect sold Corte or delete retained part; later independent undo still works',()=>{
    const e=env(),old=JSON.stringify(e.c.DATA);e.choose('motor');e.ack();
    const before=JSON.stringify(e.c.DATA);e.c.reactivarPieza('corte-sintetico');assert.equal(JSON.stringify(e.c.DATA),before);
    e.c._undoStack=[{desc:'Viejo',snap:old}];e.c.deshacerUltima();assert.equal(JSON.stringify(e.c.DATA),before);
    e.c._undoStack=[{desc:'Otro cambio',snap:before}];e.c.deshacerUltima();assert.equal(e.calls.transactions,2);
  });
  await test('provenance and warnings escape supplied titles and technical labels',()=>{
    const e=env(),child=e.c.componenteRetenidoDeCorte(corte(),'motor',123);child.extras.origenCorte.titulo='<script>mal</script>';
    assert(!e.c.origenCorteInfo(child).includes('<script>'));assert.match(e.c.origenCorteInfo(child),/&lt;script&gt;/);
  });
  console.log(`${n} partial Corte sale scenarios passed; no live data accessed.`);
})().catch(e=>{console.error(e);process.exit(1)});
