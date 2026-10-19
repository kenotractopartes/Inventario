/* Catálogo público: proyección de la nube confirmada; sin importes ni datos privados. */
(function(root){
'use strict';
const familias = [{"id": "arboles", "nombre": "Árboles de Levas", "sing": "Árbol de Levas"}, {"id": "motores", "nombre": "Motores", "sing": "Motor"}, {"id": "transmisiones", "nombre": "Transmisiones", "sing": "Transmisión"}, {"id": "turbos", "nombre": "Turbos", "sing": "Turbo"}, {"id": "compresores", "nombre": "Compresores", "sing": "Compresor"}, {"id": "diferenciales", "nombre": "Diferenciales", "sing": "Diferencial"}, {"id": "mancuernas", "nombre": "Mancuernas", "sing": "Mancuerna"}, {"id": "fundas", "nombre": "Fundas", "sing": "Funda"}, {"id": "cabinas", "nombre": "Cabinas", "sing": "Cabina"}, {"id": "cortes", "nombre": "Cortes", "sing": "Corte"}, {"id": "cofres", "nombre": "Cofres", "sing": "Cofre"}, {"id": "puertas", "nombre": "Puertas", "sing": "Puerta"}, {"id": "quintaRueda", "nombre": "Quinta Rueda", "sing": "Quinta Rueda"}, {"id": "fanclutches", "nombre": "Fanclutches", "sing": "Fanclutch"}, {"id": "radiadores", "nombre": "Radiadores", "sing": "Radiador"}, {"id": "cabezas", "nombre": "Cabezas de Motor", "sing": "Cabeza de Motor"}, {"id": "monoblocks", "nombre": "Monoblocks", "sing": "Monoblock"}, {"id": "ciguenales", "nombre": "Cigüeñales", "sing": "Cigüeñal"}, {"id": "campanas", "nombre": "Campanas de Motor", "sing": "Campana de Motor"}, {"id": "chasis", "nombre": "Chasis", "sing": "Chasis"}, {"id": "complementos", "nombre": "Complementos de Cabina", "sing": "Complemento de Cabina"}, {"id": "computadoras", "nombre": "Computadoras", "sing": "Computadora"}, {"id": "inyectores", "nombre": "Inyectores", "sing": "Inyector"}, {"id": "arneses", "nombre": "Arneses", "sing": "Arnés"}, {"id": "otros", "nombre": "Otros", "sing": "Otro"}];
const nombres = Object.fromEntries(familias.map(f=>[f.id,f.sing]));
const reparables = ['inyectores','cabezas','transmisiones','turbos'];
function disponible(p){
  return !!p && Object.prototype.hasOwnProperty.call(nombres,p.familia) && !p.vendida && !p.apartada && !p.faltante &&
    !p.desarmado && !p.bajoPedido && !p.noWeb &&
    (!reparables.includes(p.familia) || (p.estado || 'reconstruido') === 'reconstruido');
}
function texto(x){ return typeof x === 'string' || typeof x === 'number' ? String(x).trim() : ''; }
// Misma regla que _modelKey / _normClave del inventario; prueba de paridad en tests.
function clave(p){
  if(!p || !p.familia || !p.modelo || !['inyectores','arboles','transmisiones'].includes(p.familia)) return '';
  const norm=x=>String(x == null ? '' : x).toLowerCase().replace(/[\s\-_.\/]/g,'');
  const m=norm(p.modelo);
  return m ? p.familia+'::'+m+'::'+norm(p.marca) : '';
}
function construir(inv){
  if(!inv || !Array.isArray(inv.piezas) || !Number.isSafeInteger(inv._ts) || inv._ts <= 0)
    throw new Error('No llegó un inventario confirmado válido.');
  const piezas={}, vistos=new Set();
  for(const p of inv.piezas){
    if(!p || typeof p.id !== 'string' || !p.id || /[.#$\[\]\/]/.test(p.id) || vistos.has(p.id) || ['__proto__','constructor','prototype'].includes(p.id))
      throw new Error('Identidad de pieza inválida o repetida.');
    vistos.add(p.id);
    if(!disponible(p)) continue;
    const ex=p.extras || {};
    // Lista explícita. Nunca copiar el objeto privado ni precioWeb a la proyección.
    piezas[p.id]={familia:p.familia,titulo:nombres[p.familia]+(texto(p.modelo)?': '+texto(p.modelo):''),
      motor:texto(p.motor),marca:texto(p.familia==='cortes'?(ex.corteCabina||{}).marca:(p.marca||p.camionMarca)),
      terminacion:texto(ex.terminacion !== p.modelo ? ex.terminacion : ''),paso:texto(ex.paso),modelKey:clave(p)};
  }
  return {version:2,revision:inv._ts,piezas:piezas,total:Object.keys(piezas).length};
}
function valido(s){
  if(!s || s.version!==2 || !Number.isSafeInteger(s.revision) || s.revision<=0 || !Number.isSafeInteger(s.total) || s.total<0) return false;
  const p=s.piezas || {};
  if(typeof p!=='object' || Array.isArray(p) || Object.keys(p).length!==s.total) return false;
  return Object.entries(p).every(([id,f])=>id && f && Object.prototype.hasOwnProperty.call(nombres,f.familia) && typeof f.titulo==='string' &&
    Object.keys(f).every(k=>['familia','titulo','motor','marca','terminacion','paso','modelKey'].includes(k)));
}
function igual(a,b){
  if(!valido(a)||!valido(b)||a.revision!==b.revision||a.total!==b.total) return false;
  return Object.keys(b.piezas||{}).every(id=>a.piezas && a.piezas[id] &&
    Object.keys(b.piezas[id]).every(k=>a.piezas[id][k]===b.piezas[id][k]));
}
// Cada ciclo lee la nube. Las transacciones evitan que una pestaña atrasada
// sustituya una revisión más nueva; una revisión contradictoria exige revisión.
async function sincronizar(io){
  for(let intento=0;intento<3;intento++){
    if(!io.conectado()) throw new Error('Sin conexión para confirmar el catálogo.');
    const propuesta=construir(await io.leer());
    if(!io.conectado()) throw new Error('Se perdió la conexión al consultar el inventario.');
    let contradiccion=false;
    const res=await io.transaccion(actual=>{
      contradiccion=false;
      if(actual && actual.version===2 && actual.revision>propuesta.revision) return;
      if(actual && actual.version===2 && actual.revision===propuesta.revision){
        if(!igual(actual,propuesta)) contradiccion=true;
        return;
      }
      return propuesta;
    });
    if(contradiccion) throw new Error('El catálogo recibió dos versiones distintas con la misma revisión.');
    const vigente=construir(await io.leer());
    if(!io.conectado()) throw new Error('No se pudo confirmar la conexión del catálogo.');
    if(igual(res,propuesta) && igual(vigente,propuesta)) return propuesta;
  }
  throw new Error('El inventario sigue cambiando; el catálogo se volverá a comprobar.');
}
const api={familias,disponible,construir,valido,igual,sincronizar};
if(typeof module==='object' && module.exports) module.exports=api;
else root.CatalogoStock=api;
})(typeof globalThis==='object'?globalThis:this);
