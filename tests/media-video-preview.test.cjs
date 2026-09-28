const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const path=require('path');
function env(){
 const all=[],timers=new Set();let observer;
 class E{
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.isConnected=true;this.className='';this.events={};this.duration=5;this.videoWidth=640;this.videoHeight=360;this.readyState=4;all.push(this)}
  append(...xs){this.children.push(...xs)} appendChild(x){this.append(x)} prepend(x){this.children.unshift(x)}
  setAttribute(k,v){this[k]=v} removeAttribute(k){delete this[k]} remove(){this.isConnected=false}
  pause(){this.paused=true} load(){this.loads=(this.loads||0)+1} play(){return Promise.resolve()}
  showModal(){this.open=true} close(){this.open=false} addEventListener(k,v){this.events[k]=v}
  closest(){return null} querySelector(q){return this.children.find(e=>q==='video'?e.tag==='video':e.className===q.slice(1))}
  querySelectorAll(){return this.buttons||[]} getContext(){return {drawImage(){}}} toDataURL(){return 'data:image/jpeg;base64,TEST'}
 }
 const document={body:new E('body'),createElement:t=>new E(t)};
 const ctx={document,location:{href:'https://fotonas.tractopartes.com/'},URL,Map,Set,Number,Math,isFinite,
 setTimeout(fn){timers.add(fn);return fn},clearTimeout(fn){timers.delete(fn)},IntersectionObserver:class{constructor(fn){this.fn=fn;observer=this} observe(){} unobserve(){} disconnect(){this.disconnected=true}},open(){ctx.opened=true}};ctx.window=ctx;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../media-video-preview.js'),'utf8'),ctx);
 function root(indices){const r=new E('root');r.buttons=indices.map(i=>{const b=new E('button');b.dataset.videoIndex=String(i);const h=new E('span');h.className='inv-video-hint';b.append(h);return b});return r}
 const active=()=>all.filter(e=>e.tag==='video'&&e.isConnected);
 return {ctx,all,timers,root,active,see(r){observer.fn(r.buttons.map(target=>({target,isIntersecting:true})))}};
}
const media=Array.from({length:5},(_,i)=>({t:'video',url:'https://example.com/'+i+'.mp4'}));let count=0;
// Two decoders maximum even with five visible HD clips; completing one starts the next.
let e=env(),r=e.root([0,1,2,3,4]);e.ctx.InventarioVideoPreview.mount(r,media);e.see(r);assert.equal(e.active().length,2);let v=e.active()[0];v.onloadedmetadata();assert.equal(v.currentTime,.5);v.onseeked();assert.equal(e.active().length,2);assert(r.buttons[0].querySelector('.inv-video-poster'));count++;
// Closing aborts all decoders/timeouts; late callbacks cannot paint or restart the queue.
let late=e.active()[0].onseeked;e.ctx.InventarioVideoPreview.dispose();late();assert.equal(e.active().length,0);assert.equal(e.timers.size,0);count++;
// Cached thumbnail reopens without a decoder; indexes remain correct in mixed galleries.
r=e.root([0]);e.ctx.InventarioVideoPreview.mount(r,media);assert(r.buttons[0].querySelector('.inv-video-poster'));assert.equal(e.active().length,0);count++;
// Playback remains open across an unrelated gallery refresh and closes if the clip disappears.
r.buttons[0].onclick();let player=e.active()[0];assert.equal(player.src,media[0].url);e.ctx.InventarioVideoPreview.mount(e.root([0]),media);assert(player.isConnected);e.ctx.InventarioVideoPreview.mount(e.root([]),[]);assert(!player.isConnected);count++;
// Invalid URL and non-video slots never create an active link or decoder.
e=env();r=e.root([0,1]);e.ctx.InventarioVideoPreview.mount(r,[{t:'video',url:'javascript:alert(1)'},{t:'image',url:'https://example.com/a.jpg'}]);assert(r.buttons.every(b=>b.disabled));assert.equal(e.active().length,0);count++;
// Corrupt video releases its slot and gives an actionable fallback, not infinite loading.
e=env();r=e.root([0,1,2]);e.ctx.InventarioVideoPreview.mount(r,media);e.see(r);v=e.active()[0];v.onerror();assert.equal(r.buttons[0].querySelector('.inv-video-hint').textContent,'Toca para ver');assert.equal(e.active().length,2);e.ctx.InventarioVideoPreview.dispose();count++;
// Changing folders cancels old work and uses the new media index, not stale callbacks.
e=env();r=e.root([0]);e.ctx.InventarioVideoPreview.mount(r,media);e.see(r);late=e.active()[0].onseeked;const next=e.root([1]);e.ctx.InventarioVideoPreview.mount(next,media);late();assert(!r.buttons[0].querySelector('.inv-video-poster'));next.buttons[0].onclick();assert.equal(e.active()[0].src,media[1].url);count++;
console.log(count+' preview safety scenarios passed (synthetic DOM, no live writes).');
