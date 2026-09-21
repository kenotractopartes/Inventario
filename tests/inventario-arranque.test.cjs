const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
const Merge=require('../inventario-merge.js');
function func(name){
 const re=new RegExp('(?:async )?function '+name+'\\s*\\(');const start=html.search(re);assert(start>=0,name);
 let end=html.indexOf('}',start);
 for(;end>=0;end=html.indexOf('}',end+1)){
  const text=html.slice(start,end+1);
  try{new vm.Script('('+text+')');return text;}catch(e){}
 }
 throw Error('Cannot extract '+name);
}
const functions=['initFirebase','inventarioBaseLista','programarMantenimientoSeguro','mostrarRevisionLocal','usarNubeConRespaldoLocal','empujarAFirebase','normalizarData','cargar','_ricAsegurarSemana','espejoChasisEstatus','_limpiarModelosInyectores','_recuperarFotosCampanas','rellenarFichasFaltantes','respaldoAutomatico'];
function environment({local,cloud,base=null,pending=true,quota=false}){
 const storage=new Map([['tpm_inventario_v1',JSON.stringify(local)],['tpm_guardado_pendiente',JSON.stringify({base,local})]]);
 const nodes=new Map(),timers=[];let valueListener,writeCount=0,getError=false;
 const node=()=>({appendChild(x){nodes.set(x.id,x)},remove(){nodes.delete(this.id)},style:{}});
 const ref={on(event,fn){valueListener=fn;},get:async()=>{if(getError)throw Error('offline');return {val:()=>structuredClone(cloud)};},transaction(){writeCount++;}};
 const c={console,Date,Math,JSON,Array,Object,Set,Map,InventarioMerge:Merge,DATA:structuredClone(local),_invSync:{base,pendiente:pending,ocupado:false,recuperando:false},fbListo:false,fbAplicandoRemoto:false,fbRef:ref,fbApp:null,FB_PATH:'inventario_patio',firebaseConfig:{},STORE_KEY:'tpm_inventario_v1',CATALOGOS_DEFAULT:{},FAMILIAS_OVERRIDE_DEFAULT:{},EDITOR_KEY:'test',DEVICE_ID:'test',_undoStack:[],_snapPrevio:'',_invMantenimientoProgramado:false,_estatusChasisData:{},esEditor:()=>true,
 firebase:{apps:[{}],app:()=>({}),database:()=>({ref:path=>path==='inventario_patio'?ref:{on(){}}})},
 localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(quota && k.startsWith('tpm_revision_local_'))throw Error('quota');storage.set(k,v);},removeItem:k=>storage.delete(k)},
 document:{getElementById:id=>nodes.get(id),createElement:()=>node()},
 avisarFallaGuardado(msg){c.lastWarning=msg;if(!nodes.has('aviso-falla-guardado')){const n=node();n.id='aviso-falla-guardado';nodes.set(n.id,n);}},
 setEstadoSync:(state,text)=>{c.status={state,text}},toast(){},refrescarVistaActual(){c.renders=(c.renders||0)+1;},guardarLocal(){storage.set(c.STORE_KEY,JSON.stringify(c.DATA));return true;},snapActual:()=>JSON.stringify(c.DATA),
 setTimeout:(fn,ms)=>{timers.push(fn)},_limpiarLlaves(){},guardar(){writeCount++;},RIC_FAM:'ricardo',_ricLunes:()=> '2026-09-21',_ricRotulo:()=> '21 al 27 de septiembre',
 };
 vm.createContext(c);vm.runInContext(functions.map(func).join('\n'),c);
 return {c,storage,nodes,timers,emit(){valueListener({val:()=>structuredClone(cloud)})},writes:()=>writeCount,failGet(){getError=true}};
}
function data(count){return {camiones:[],piezas:Array.from({length:count},(_,i)=>({id:'p'+i,familia:'mancuernas',modelo:'M'+i})),catalogos:{},familiasOverride:{},estatusChasisSync:{},chasisIgnorados:{ids:{},series:{}},salidas:[],folioCounter:1,ventasAtendidas:{},ventasDesde:'',conteos:[]};}
(async()=>{
 let tests=0;const local=data(12),cloud=data(41);
 // Initial automatic work must never edit an obsolete local cache.
 let e=environment({local,cloud,pending:false});
 for(const name of ['_ricAsegurarSemana','espejoChasisEstatus','_limpiarModelosInyectores','_recuperarFotosCampanas','rellenarFichasFaltantes','respaldoAutomatico'])e.c[name]({});
 assert.equal(e.writes(),0);assert.equal(e.c.DATA.piezas.length,12);tests++;
 // An ordinary read accepts cloud data; it does not publish the old cache.
 e.c.initFirebase();e.emit();assert.equal(e.c.DATA.piezas.length,41);assert.equal(e.writes(),0);tests++;
 // Pending data with no baseline stay available until explicitly resolved.
 e=environment({local,cloud});e.c.initFirebase();e.emit();
 assert.equal(e.c.DATA.piezas.length,12);assert(e.nodes.has('inv-usar-nube'));assert.equal(e.writes(),0);tests++;
 // Resolving saves a verifiable archive and only replaces THIS browser's cache.
 await e.c.usarNubeConRespaldoLocal();assert.equal(e.c.DATA.piezas.length,41);assert.equal(e.writes(),0);assert.equal(e.c._invSync.pendiente,false);
 let key=[...e.storage.keys()].find(k=>k.startsWith('tpm_revision_local_'));assert(key);assert.equal(JSON.parse(e.storage.get(key)).local.piezas.length,12);assert(!e.storage.has('tpm_guardado_pendiente'));assert.equal(e.c.status.state,'ok');tests++;
 // A full disk or failed cloud read cannot discard pending local changes.
 for(const mode of ['quota','offline']){
  e=environment({local,cloud,quota:mode==='quota'});e.c.initFirebase();e.emit();if(mode==='offline')e.failGet();await e.c.usarNubeConRespaldoLocal();
  assert.equal(e.c.DATA.piezas.length,12);assert(e.storage.has('tpm_guardado_pendiente'));assert.equal(e.c._invSync.pendiente,true);assert.equal(e.writes(),0);tests++;
 }
 e=environment({local,cloud:data(0)});e.c.initFirebase();e.emit();await e.c.usarNubeConRespaldoLocal();assert.equal(e.c.DATA.piezas.length,12);assert(e.storage.has('tpm_guardado_pendiente'));tests++;
 // A recoverable edit with a known baseline still uses the existing transaction.
 e=environment({local,cloud,base:Merge.clone(local)});e.c.initFirebase();e.emit();assert.equal(e.writes(),1);assert(!e.nodes.has('inv-usar-nube'));tests++;
 // Restart reads the pending payload before any helper can run, not the stale cache.
 e=environment({local,cloud});e.c._invSync.recuperado=data(43);assert.equal(e.c.cargar().piezas.length,43);assert(!e.c._invSync.recuperado);tests++;
 // Existing three-way merge retains concurrent independent additions and rejects conflicts.
 let b=data(1),l=Merge.clone(b),r=Merge.clone(b);l.piezas.push({id:'local'});r.piezas.push({id:'raul'});assert.equal(Merge.merge(b,l,r).piezas.length,3);
 l=Merge.clone(b);r=Merge.clone(b);l.piezas[0].modelo='one';r.piezas[0].modelo='two';assert.throws(()=>Merge.merge(b,l,r));tests++;
 let scripts=0;for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){if(m[1].trim()){new vm.Script(m[1]);scripts++;}}
 console.log(`${tests} safety scenarios passed; ${scripts} inline scripts compile.`);
})().catch(e=>{console.error(e);process.exit(1)});
