/* Búsqueda local sobre piezas públicas confirmadas. Sin red, IA remota ni índices privados. */
(function(root){
'use strict';
var alias={
 arboles:'arbol arboles leva levas camshaft', motores:'motor motores engine',
 transmisiones:'transmision transmisiones caja cajas cambios velocidades transmission',
 turbos:'turbo turbos turbocargador turbocargadores turbocompresor',
 compresores:'compresor compresores',diferenciales:'diferencial diferenciales',
 mancuernas:'mancuerna mancuernas',fundas:'funda fundas',cabinas:'cabina cabinas',
 cortes:'corte cortes',cofres:'cofre cofres capo',puertas:'puerta puertas',
 quintaRueda:'quinta rueda quintas ruedas',fanclutches:'fanclutch fan clutch ventilador',
 radiadores:'radiador radiadores',cabezas:'cabeza cabezas culata culatas',
 monoblocks:'monoblock monoblocks monobloque bloque bloques',
 ciguenales:'ciguenal ciguenales crankshaft',campanas:'campana campanas',
 chasis:'chasis bastidor bastidores',complementos:'complemento complementos cabina cabinas',
 computadoras:'computadora computadoras modulo modulos electronico ecm ecu',
 inyectores:'inyector inyectores injector injectors',arneses:'arnes arneses cableado',otros:'otro otros'
};
var omitir=new Set('de del para el la los las un una unos unas busco buscar quiero necesito pieza piezas refaccion refacciones'.split(' '));
function normalizar(s){
 return String(s||'').replace(/([A-Z0-9])(con|sin)([A-Z0-9])/g,'$1 $2 $3')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/([a-z])(\d)/g,'$1 $2').replace(/(\d)([a-z])/g,'$1 $2')
  .replace(/[^a-z0-9]+/g,' ').trim();
}
function palabras(s){return normalizar(s).split(/\s+/).filter(Boolean);}
// Una omisión, sustitución o inversión adyacente; nunca corregir números/modelos.
function parecido(a,b){
 if(a.length<5||b.length<5||/\d/.test(a+b)||Math.abs(a.length-b.length)>1)return false;
 if(a.length===b.length){
  var posiciones=[];for(var i=0;i<a.length;i++)if(a[i]!==b[i])posiciones.push(i);
  return posiciones.length===1 || (posiciones.length===2 && posiciones[1]===posiciones[0]+1 && a[posiciones[0]]===b[posiciones[1]] && a[posiciones[1]]===b[posiciones[0]]);
 }
 var corto=a.length<b.length?a:b,largo=a.length<b.length?b:a,j=0,k=0,errores=0;
 while(j<corto.length&&k<largo.length){if(corto[j]===largo[k]){j++;k++;}else{errores++;k++;if(errores>1)return false;}}
 return true;
}
function buscar(piezas,familias,consulta){
 if(String(consulta||'').trim() && !normalizar(consulta))return [];
 var tokens=palabras(String(consulta||'').slice(0,100)).filter(function(t){return !omitir.has(t);});
 var nombres=Object.create(null);familias.forEach(function(f){nombres[f.id]=f.nombre+' '+f.sing;});
 var resultados=[];
 piezas.forEach(function(p){
  if(!p || !nombres[p.familia])return;
  var directas=palabras([nombres[p.familia],p.titulo,p.motor,p.marca,p.terminacion,p.paso].join(' '));
  var relacionadas=palabras(alias[p.familia]||'');var score=0,aproximada=false;
  for(var i=0;i<tokens.length;i++){
   var t=tokens[i],valor=0;
   if(directas.includes(t))valor=12;
   else if(relacionadas.includes(t))valor=10;
   else if(t.length>=2 && directas.some(function(w){return w.startsWith(t);}))valor=7;
   else if(t.length>=3 && relacionadas.some(function(w){return w.startsWith(t);}))valor=6;
   else if(directas.concat(relacionadas).some(function(w){return parecido(t,w);})) {valor=3;aproximada=true;}
   if(!valor)return;score+=valor;
  }
  resultados.push({pieza:p,puntos:score,aproximada:aproximada});
 });
 return resultados.sort(function(a,b){return b.puntos-a.puntos;});
}
var api={normalizar:normalizar,buscar:buscar};
if(typeof module==='object'&&module.exports)module.exports=api;else root.CatalogoBusqueda=api;
})(typeof globalThis==='object'?globalThis:this);
