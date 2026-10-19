const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const S=require('../catalogo-stock.js');
let n=0;const check=(label,f)=>{f();n++;console.log('OK',label);};
const p=(id,extra={})=>({id,familia:'transmisiones',modelo:'RTLO',motor:'Eaton',...extra});
const inv=(items,revision=100)=>({_ts:revision,piezas:items});
const base=inv([p('a'),p('b',{estado:'core'}),p('c',{vendida:true}),p('d',{apartada:true}),p('e',{estado:'reparacion'}),p('f',{faltante:true}),p('g',{desarmado:true}),p('h',{bajoPedido:true}),p('i',{noWeb:true}),p('j',{familia:'ricardo'})]);
check('solo disponible, también sin foto',()=>assert.deepEqual(Object.keys(S.construir(base).piezas),['a']));
check('familias completas',()=>{for(const f of S.familias)assert.equal(S.construir(inv([p('x',{familia:f.id})])).total,1);});
check('reconstruido explícito y estado desconocido',()=>{assert(S.disponible(p('x',{estado:'reconstruido'})));assert(!S.disponible(p('x',{estado:'otra cosa'})));});
check('no repite IDs ni acepta inventario inválido',()=>{for(const d of [null,{},inv([p('a'),p('a')]),inv([p('a/b')]),inv([null]),inv([],0)])assert.throws(()=>S.construir(d));});
check('cero disponible válido en RTDB que omite objeto vacío',()=>{const x=S.construir(inv([]));delete x.piezas;assert(S.valido(x));assert(S.igual(x,S.construir(inv([]))));});
check('lista explícita sin importes ni datos personales',()=>{const x=S.construir(inv([p('a',{precioWeb:999,precioSugerido:777,proveedor:'PRIVADO',notas:'PRIVADO',_key:'PRIVADO',extras:{costo:555,cliente:'PRIVADO'}})]));assert(!JSON.stringify(x).match(/precio|PRIVADO|costo|proveedor|cliente|_key/));assert(!S.valido({...x,total:4}));});
check('fotos comparten claves vigentes',()=>{assert.equal(S.construir(inv([p('x',{modelo:'RT-LO',marca:'EATON'})])).piezas.x.modelKey,'transmisiones::rtlo::eaton');assert.equal(S.construir(inv([p('x',{familia:'motores'})])).piezas.x.modelKey,'');});
check('paridad de claves con función canónica de Inventario',()=>{
 const h=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8'),ctx={};
 vm.createContext(ctx);
 vm.runInContext(h.match(/var FAMILIAS_FOTOS_MODELO = [^;]+;/)[0]+h.slice(h.indexOf('function _normClave('),h.indexOf('function _modelKeyDeId(')),ctx);
 for(const familia of S.familias.map(x=>x.id))for(const modelo of ['RT-LO 16913','N14 / CELECT','___', '',0,123,null])for(const marca of ['EATON',null,'D.D / CAT']){
   const piece=p('test',{familia,modelo,marca});
   assert.equal(S.construir(inv([piece])).piezas.test.modelKey,ctx._modelKey(piece));
 }
});
function io(data,actual=null){let cloud=structuredClone(data),dest=structuredClone(actual),writes=0,online=true;return {conectado:()=>online,leer:async()=>structuredClone(cloud),transaccion:async fn=>{const x=fn(structuredClone(dest));if(x!==undefined){dest=structuredClone(x);writes++;}return structuredClone(dest)},set:x=>cloud=structuredClone(x),off:()=>online=false,get:()=>dest,writes:()=>writes};}
(async()=>{
 let x=io(base);assert.equal((await S.sincronizar(x)).total,1);assert.equal(x.writes(),1);await S.sincronizar(x);assert.equal(x.writes(),1);n++;console.log('OK idempotencia');
 x=io(base,S.construir(inv([p('a',{vendida:true})],200)));await assert.rejects(S.sincronizar(x));assert.equal(x.writes(),0);n++;console.log('OK pestaña atrasada no resucita stock');
 x=io(base,S.construir(inv([],100)));await assert.rejects(S.sincronizar(x),/misma revisión/);assert.equal(x.writes(),0);n++;console.log('OK revisión contradictoria no sobrescribe');
 x=io(base);let trans=x.transaccion;x.transaccion=async fn=>{const out=await trans(fn);x.set(inv([p('a',{vendida:true})],101));return out};assert.equal((await S.sincronizar(x)).total,0);n++;console.log('OK venta concurrente converge al último inventario');
 x=io(base);x.off();await assert.rejects(S.sincronizar(x),/conexión/);assert.equal(x.writes(),0);n++;
 x=io(base);x.transaccion=async()=>{throw Error('PERMISSION_DENIED')};await assert.rejects(S.sincronizar(x),/PERMISSION_DENIED/);n++;
 // Actual public rendering/listeners in a VM. No Firebase, analytics or real data.
 const html=fs.readFileSync(require('path').join(__dirname,'../catalogo.html'),'utf8'),listeners={},errs={},els={app:{innerHTML:''},'wa-general':{}};
 const c={console,gtag(){},CatalogoStock:S,location:{hash:''},window:{addEventListener(){},scrollTo(){}},document:{getElementById:id=>els[id],head:{appendChild(){}},createElement:()=>({}),addEventListener(){}},firebase:{initializeApp(){},database:()=>({ref:path=>({on:(ev,fn,err)=>{listeners[path]=fn;errs[path]=err;}})})}};
 vm.createContext(c);for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())vm.runInContext(m[1],c);
 c.FICHAS={a:{media:[{t:'image',web:'https://example.test/propia.jpg'}]}};
 c.MEDIA={modelo:{media:[{t:'image',web:'https://example.test/modelo.jpg'}]}};
 assert.equal(c.fotosDe({_id:'a',modelKey:'modelo'})[0].web,'https://example.test/propia.jpg');
 assert.equal(c.fotosDe({_id:'sin-foto',modelKey:'modelo'})[0].web,'https://example.test/modelo.jpg');
 n++;console.log('OK foto individual tiene prioridad y modelo sirve de respaldo');
 const emit=(path,v)=>listeners[path]({val:()=>structuredClone(v)});
 emit('.info/connected',true);emit('media_modelo',{});emit('media_modelo',{});assert(!els.app.innerHTML.includes('disponibles para venta'));n++;
 emit('fichas_publicas',{_catalogo_v2:S.construir(base),fantasma:{familia:'transmisiones',titulo:'FANTASMA',precioWeb:12345},a:{media:[],precioWeb:44444}});
 assert(els.app.innerHTML.includes('1 disponible'));assert(!els.app.innerHTML.includes('12345'));c.location.hash='#transmisiones';c.pintar();assert(els.app.innerHTML.includes('1 piezas disponibles'));assert(!els.app.innerHTML.match(/FANTASMA|44444|Ya se vendió|gris/));n++;console.log('OK portada y lista misma existencia sin fichas huérfanas/precios');
 emit('fichas_publicas',{_catalogo_v2:S.construir(inv([],101))});assert(els.app.innerHTML.includes('no tenemos piezas disponibles'));n++;
 emit('fichas_publicas',{_catalogo_v2:{version:2,total:100,revision:102,piezas:{}}});assert(els.app.innerHTML.includes('No podemos confirmar'));c.pintar();assert(els.app.innerHTML.includes('No podemos confirmar'));n++;
 emit('.info/connected',false);assert(els.app.innerHTML.includes('No podemos confirmar'));n++;
 // Execute actual publisher adapter: rejected reads cannot write; always reads fbRef, not local DATA.
 const index=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
 const start=index.indexOf('var _catalogoConectado='),end=index.indexOf('function escucharFichasPublicas',start);
 const el={textContent:''};let writes=0;const pc={console:{warn(){}},CatalogoStock:S,window:{CatalogoStock:S},fbRef:{get:async()=>({val:()=>base})},DATA:inv([p('LOCAL_BAD')]),firebase:{auth:()=>({currentUser:{email:'raultractopartes@gmail.com'}}),database:()=>({ref:path=>{assert.equal(path,'fichas_publicas/_catalogo_v2');return {transaction(fn,cb,local){assert.equal(local,false);const d=fn(null);assert(!d.piezas.LOCAL_BAD);writes++;cb(null,true,{val:()=>d});}};}})},document:{getElementById:()=>el},setTimeout:()=>1,clearTimeout(){}};
 vm.createContext(pc);vm.runInContext(index.slice(start,end),pc);pc._catalogoConectado=true;await pc.actualizarCatalogoDisponible();assert.equal(writes,1);assert.match(el.textContent,/Catálogo actualizado: 1/);n++;
 pc.fbRef.get=async()=>{throw Error('sin lectura')};await pc.actualizarCatalogoDisponible();assert.equal(writes,1);assert.match(el.textContent,/pendiente/);n++;
 console.log(`${n} pruebas de catálogo aprobadas.`);
})().catch(e=>{console.error(e);process.exit(1)});
