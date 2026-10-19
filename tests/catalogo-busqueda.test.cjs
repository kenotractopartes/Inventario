const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../catalogo-busqueda'),S=require('../catalogo-stock');
const source={_ts:1,piezas:[
{id:'m1',familia:'motores',modelo:'ISXsinEGR',motor:'ISX sin EGR',marca:'Cummins'},
{id:'m2',familia:'motores',modelo:'ISXconEGR',motor:'ISX con EGR',marca:'Cummins'},
{id:'t1',familia:'transmisiones',modelo:'RTLO-18918B',marca:'Eaton'},
{id:'i1',familia:'inyectores',modelo:'C15',motor:'C15',marca:'Caterpillar'},
{id:'i2',familia:'inyectores',modelo:'C13',motor:'C13',marca:'Caterpillar'},
{id:'a1',familia:'arboles',modelo:'ISX870',motor:'ISX870'},
{id:'d1',familia:'motores',modelo:'DD15',motor:'DD15',marca:'Detroit'},
{id:'sold',familia:'motores',modelo:'EXCLUSIVO',vendida:true},
{id:'core',familia:'transmisiones',modelo:'CORE',estado:'core'},
{id:'reserved',familia:'motores',modelo:'APARTADO',apartada:true}
]};
const stock=S.construir(source),p=Object.entries(stock.piezas).map(([id,v])=>({...v,_id:id}));
const find=q=>B.buscar(p,S.familias,q).map(r=>r.pieza._id).sort();
const cases=[
 ['acento','transmisión',['t1']],['plural','motores',['d1','m1','m2']],['singular','inyector',['i1','i2']],
 ['sinónimo','caja de velocidades',['t1']],['natural','busco una caja de cambios Eaton',['t1']],
 ['marca','cummins',['m1','m2']],['error simple','cumins',['m1','m2']],['error inyector','inyetor c15',['i1']],
 ['transposición','inyecotr',['i1','i2']],['modelo exacto','C13',['i2']],['modelo no inventado','C16',[]],
 ['modelo separado','DD 15',['d1']],['modelo guion','DD-15',['d1']],['modelo compuesto','RTLO 18918B',['t1']],['modelo pegado','RTLO18918B',['t1']],
 ['camelcase','ISX sin EGR',['m1']],['con no sin','ISX con EGR',['m2']],
 ['orden libre','eaton caja',['t1']],['prefijo','transmi',['t1']],['arboles','árbol de levas',['a1']],
 ['motor codigo','ISX 870',['a1']],['no disponible','EXCLUSIVO',[]],['core excluido','CORE',[]],['apartado excluido','APARTADO',[]],
 ['sin resultado','astronauta',[]],['solo símbolos','🔥',[]],['vacío','',p.map(v=>v._id).sort()],['injection','<img src=x onerror=alert(1)>',[]]
];
for(const [name,q,expected] of cases)test(name,()=>assert.deepEqual(find(q),expected));
test('prioriza coincidencia exacta frente a aproximada',()=>{const rows=B.buscar([{familia:'motores',titulo:'Motor ABCCC'},{familia:'motores',titulo:'Motor ABCCD'}],S.familias,'ABCCD');assert.equal(rows[0].pieza.titulo,'Motor ABCCD');assert.equal(rows[0].aproximada,false);assert.equal(rows[1].aproximada,true)});
test('no muta ni usa fichas históricas',()=>{const before=JSON.stringify(p);find('motor');assert.equal(JSON.stringify(p),before);assert(!find('EXCLUSIVO').length)});
