/* Unión de cambios por ID. Ante cambios incompatibles conserva las dos copias
   y obliga a revisar; nunca elige silenciosamente una computadora ganadora. */
(function(root){
  'use strict';
  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const eq=(a,b)=>{
    if(a===b)return true;
    if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
    const ka=Object.keys(a),kb=Object.keys(b);
    return ka.length===kb.length&&ka.every(k=>Object.prototype.hasOwnProperty.call(b,k)&&eq(a[k],b[k]));
  };
  function merge(base,local,remote,path){
    path=path||'inventario';
    if(eq(local,base))return clone(remote);
    if(eq(remote,base)||eq(local,remote))return clone(local);
    if(Array.isArray(base)&&Array.isArray(local)&&Array.isArray(remote)){
      // Desarmar un corte crea dos piezas vendibles. Si otro equipo modificó
      // ese mismo corte mientras tanto (venta, apartado, edición, etc.), una
      // unión campo por campo dejaría el corte vendido y los componentes en
      // stock. Rechazar toda la transacción y conservar el pendiente local.
      if(path==='inventario/piezas'){
        const localPorId=new Map(local.filter(Boolean).map(p=>[String(p.id),p]));
        const remotoPorId=new Map(remote.filter(Boolean).map(p=>[String(p.id),p]));
        for(const anterior of base){
          if(!anterior||anterior.familia!=='cortes'||anterior.desarmado)continue;
          const l=localPorId.get(String(anterior.id)),r=remotoPorId.get(String(anterior.id));
          if(!l||!r)continue;
          const lDesarmo=!!l.desarmado, rDesarmo=!!r.desarmado;
          if((lDesarmo&&!eq(r,anterior))||(rDesarmo&&!eq(l,anterior)))
            throw new Error('Otro equipo cambió el corte '+(anterior.folioInterno||anterior.id)+
              ' durante el desarme. No se guardó la operación; revisa el corte en la nube.');
        }
      }
      const indexed=a=>a.every(x=>x&&typeof x==='object'&&x.id!==undefined)&&new Set(a.map(x=>String(x.id))).size===a.length;
      if([base,local,remote].every(indexed)){
        const maps=[base,local,remote].map(a=>new Map(a.map(x=>[String(x.id),x])));
        const ids=[...new Set(remote.concat(local).map(x=>String(x.id)))];
        return ids.map(id=>merge(maps[0].get(id),maps[1].get(id),maps[2].get(id),path+'/'+id)).filter(x=>x!==undefined);
      }
    }else if([base,local,remote].every(x=>x&&typeof x==='object'&&!Array.isArray(x))){
      const result=Object.create(null);
      for(const k of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){
        const v=merge(base[k],local[k],remote[k],path+'/'+k);
        if(v!==undefined)result[k]=v;
      }
      return result;
    }
    throw new Error('Otro equipo cambió el mismo dato ('+path+'). Se conservaron tus cambios para revisión.');
  }
  const api={merge,eq,clone};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.InventarioMerge=api;
})(typeof globalThis!=='undefined'?globalThis:this);
