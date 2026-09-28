const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function extract(name){let start=html.indexOf('function '+name+'(');assert(start>=0);for(let end=html.indexOf('}',start);end>=0;end=html.indexOf('}',end+1)){let code=html.slice(start,end+1);try{new vm.Script('('+code+')');return code;}catch{}}throw Error(name);}
function env(mode='normal'){
 const nodes=Object.fromEntries(['lock-screen','lock-fields','lock-wait','lock-wait-text','lock-retry','lock-input'].map(id=>[id,{style:{},textContent:'',focus(){this.focused=true;}}]));
 let ok,err,reads=0;const timers=new Map();let next=1;
 const auth={setPersistence(){return Promise.resolve();},onAuthStateChanged(a,b){ok=a;err=b;}};
 const firebase={apps:[{}],auth:()=>auth};firebase.auth.Auth={Persistence:{LOCAL:'local'}};
 if(mode==='throw')firebase.auth=()=>{throw Error('init')};
 const c={document:{getElementById:id=>nodes[id]},console,clearTimeout:id=>timers.delete(id),setTimeout:(f)=>{const id=next++;timers.set(id,f);return id;},initFirebase:()=>reads++,_authGateListo:false,_authVistaEstado:'pending',_authEsperaTimer:null,firebaseConfig:{}};
 if(mode!=='missing')c.firebase=firebase;
 vm.createContext(c);vm.runInContext(extract('mostrarEstadoAcceso')+'\n'+extract('initAuthGate'),c);
 c.mostrarEstadoAcceso('pending');c.initAuthGate();
 return {c,nodes,timers,emit:user=>ok(user),error:()=>err(Error('network')),reads:()=>reads,runTimers(){for(const [id,f] of [...timers]){timers.delete(id);f();}}};
}
let n=0;
assert.match(html, /id="lock-fields" style="display:none/);assert.match(html,/id="lock-wait-text">Abriendo inventario…/);n++;
let e=env();assert.equal(e.nodes['lock-fields'].style.display,'none');assert.equal(e.nodes['lock-screen'].style.display,'flex');assert.equal(e.reads(),0);n++;
e.emit({uid:'test'});assert.equal(e.nodes['lock-screen'].style.display,'none');assert.equal(e.nodes['lock-fields'].style.display,'none');assert.equal(e.reads(),1);assert.equal(e.timers.size,0);e.emit({uid:'test'});assert.equal(e.reads(),1);n++;
e=env();e.emit(null);assert.equal(e.nodes['lock-fields'].style.display,'block');assert.equal(e.nodes['lock-screen'].style.display,'flex');assert.equal(e.reads(),0);e.runTimers();assert(e.nodes['lock-input'].focused);n++;
e.emit({uid:'test'});e.emit(null);assert.equal(e.nodes['lock-screen'].style.display,'flex');assert.equal(e.nodes['lock-fields'].style.display,'block');n++;
e=env();e.runTimers();assert.equal(e.c._authVistaEstado,'slow');assert.equal(e.nodes['lock-fields'].style.display,'none');assert.equal(e.nodes['lock-retry'].style.display,'inline-block');assert.equal(e.reads(),0);e.emit({uid:'test'});assert.equal(e.nodes['lock-screen'].style.display,'none');n++;
for(const mode of ['missing','throw']){e=env(mode);assert.equal(e.c._authVistaEstado,'error');assert.equal(e.nodes['lock-screen'].style.display,'flex');assert.equal(e.reads(),0);assert.equal(e.nodes['lock-retry'].style.display,'inline-block');n++;}
e=env();e.error();assert.equal(e.c._authVistaEstado,'error');assert.equal(e.reads(),0);assert.equal(e.nodes['lock-fields'].style.display,'none');n++;
e=env();e.emit(null);e.emit({uid:'test'});e.runTimers();assert(!e.nodes['lock-input'].focused);assert.equal(e.nodes['lock-screen'].style.display,'none');n++;
console.log(n+' access presentation scenarios passed; synthetic auth, no network or data writes.');
