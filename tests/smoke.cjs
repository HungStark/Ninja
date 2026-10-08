const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const coreSource=fs.readFileSync(path.join(root,'game-core.js'),'utf8');
const gameSource=fs.readFileSync(path.join(root,'game.js'),'utf8');
const coreContext={};vm.runInNewContext(coreSource,coreContext);
const {GameRules,spells,keys}=coreContext.SealGameCore;
assert.equal(new Set(keys).size,12);
for(const spell of spells){const r=new GameRules();spell.sequence.forEach(k=>r.seal(k));assert.equal(r.ready().id,spell.id);assert.equal(r.cast().ok,true);assert.equal(r.chakra,100-spell.cost);assert.equal(r.sequence.length,0);assert.equal(r.casts,1);}
const r=new GameRules();r.seal('q');r.seal('e');assert.equal(r.sequence.length,0);r.seal('q');r.seal('w');r.seal('a');assert.equal(r.sequence.join(''),'a');r.tick(7.1);assert.equal(r.sequence.length,0);assert.equal(r.cast().reason,'sequence');['z','x','c','v'].forEach(k=>r.seal(k));r.chakra=59;assert.equal(r.cast().reason,'chakra');assert.equal(r.sequence.length,4);r.tick(1);assert.equal(r.cast().ok,true);['q','w','e','r'].forEach(k=>r.seal(k));assert.equal(r.cast().reason,'cooldown');r.tick(1.3);assert.equal(r.cast().reason,'chakra');r.tick(2);assert.equal(r.cast().ok,true);
// Run the actual game event handlers against a minimal DOM and WebGL recording stub.
// This verifies control flow and rendered transforms; it does not compile shaders.
function element(){return {style:{},dataset:{},textContent:'',innerHTML:'',disabled:false,children:[],classList:{_s:new Set(),add(x){this._s.add(x)},remove(x){this._s.delete(x)},contains(x){return this._s.has(x)},toggle(x,on){if(on===undefined)on=!this._s.has(x);on?this._s.add(x):this._s.delete(x);return on;}},setAttribute(){},addEventListener(){},querySelectorAll(){return []}};}
const elements={},events={},documentEvents={},queue=[],draws=[];
const seals=keys.map(k=>Object.assign(element(),{dataset:{key:k}}));
const spellEls=spells.map((s,i)=>{const el=element();el.dataset.spell=i;el.querySelectorAll=()=>s.sequence.map(k=>Object.assign(element(),{dataset:{seq:k}}));return el;});
const gl={};let buffer=null,uniforms={},pass='',programNumber=0,frameDraws=0;
for(const n of ['VERTEX_SHADER','FRAGMENT_SHADER','COMPILE_STATUS','LINK_STATUS','ARRAY_BUFFER','STATIC_DRAW','FLOAT','TRIANGLES','DEPTH_TEST','BLEND','DEPTH_BUFFER_BIT','LEQUAL','SRC_ALPHA','ONE'])gl[n]=n;
gl.createShader=()=>({});gl.shaderSource=gl.compileShader=()=>{};gl.getShaderParameter=()=>true;
gl.createProgram=()=>({number:programNumber++});gl.attachShader=gl.linkProgram=()=>{};gl.getProgramParameter=()=>true;
gl.getAttribLocation=(p,n)=>n;gl.getUniformLocation=(p,n)=>n;gl.createBuffer=()=>({});gl.bindBuffer=(type,b)=>{buffer=b};gl.bufferData=(type,data)=>{buffer.data=data};
gl.useProgram=p=>{pass=p.number;uniforms={};};gl.uniformMatrix4fv=(key,transpose,value)=>uniforms[key]=Array.from(value);gl.uniform3fv=(key,value)=>uniforms[key]=Array.from(value);gl.uniform1f=(key,value)=>uniforms[key]=value;gl.uniform2f=(key,x,y)=>uniforms[key]=[x,y];
gl.drawArrays=(mode,start,count)=>{frameDraws++;if(pass===1)draws.length=0;if(pass===0)draws.push({data:buffer.data,count,model:uniforms.model,vp:uniforms.vp,color:uniforms.color,eye:uniforms.eye,emission:uniforms.emission,alpha:uniforms.alpha});};
for(const n of ['vertexAttribPointer','enableVertexAttribArray','disableVertexAttribArray','enable','disable','depthFunc','clear','depthMask','blendFunc','viewport'])gl[n]=()=>{};
const canvas=element();canvas.getContext=()=>gl;canvas.requestPointerLock=()=>{};
elements.world=canvas;
const document={body:element(),hidden:false,pointerLockElement:null,getElementById:id=>elements[id]||(elements[id]=element()),querySelectorAll:sel=>sel==='.seal'?seals:sel==='.spell'?spellEls:[],addEventListener:(name,fn)=>documentEvents[name]=fn};
const window={devicePixelRatio:1,addEventListener:(name,fn)=>events[name]=fn};
const context={document,window,innerWidth:1440,innerHeight:960,console,Float32Array,Math,Set,setTimeout:fn=>fn(),requestAnimationFrame:fn=>queue.push(fn)};
vm.createContext(context);vm.runInContext(coreSource,context);vm.runInContext(gameSource,context);
let now=0;
function step(frames=1){for(let i=0;i<frames;i++){now+=1000/60;queue.shift()(now)}}
function key(value){events.keydown({key:value,repeat:false,preventDefault(){}});events.keyup({key:value});}
step();assert.ok(draws.length>500,'world should draw 3D geometry');assert.equal(elements.sealKeys.innerHTML.match(/data-key=/g).length,12);
elements.startButton.onclick();key('q');key('w');key('e');key('r');assert.equal(elements.castButton.disabled,false);key(' ');step(55);assert.equal(elements.castCount.textContent,'1 thuật');key('q');key('w');key('e');key('r');step(25);key(' ');step(65);assert.equal(elements.score.textContent,'01','two aimed fireballs should destroy central target');
// Wrong sequence cannot cast; Backspace clears a partial sequence.
key('q');key('e');key(' ');step();assert.equal(elements.castCount.textContent,'2 thuật');key('q');key('Backspace');assert.ok(elements.comboLabel.textContent.includes('0 / 4'));
key('Escape');const chakraAtPause=elements.chakraNumber.textContent;step(100);assert.equal(elements.chakraNumber.textContent,chakraAtPause);key('Enter');step(180);
// Both additional spell paths cast successfully.
for(const value of ['a','s','d','f'])key(value);key(' ');step(140);assert.equal(elements.castCount.textContent,'3 thuật');for(const value of ['z','x','c','v'])key(value);key(' ');step();assert.equal(elements.castCount.textContent,'4 thuật');
// Movement and mouse pitch must move the rendered camera, with the aim projection matching the reticle.
const eyeBefore=draws.find(d=>d.eye[2]!==0).eye;events.keydown({key:'ArrowUp',preventDefault(){}});step(10);events.keyup({key:'ArrowUp'});const worldDraw=draws.slice(-800).find(d=>d.eye[2]!==0);assert.ok(worldDraw,'camera uniforms exist');assert.ok(worldDraw.eye[2]<eyeBefore[2],'ArrowUp moves forward');
function projectY(vp,p){const y=vp[1]*p[0]+vp[5]*p[1]+vp[9]*p[2]+vp[13],w=vp[3]*p[0]+vp[7]*p[1]+vp[11]*p[2]+vp[15];return y/w;}
const beforePitch=projectY(worldDraw.vp,[0,1.72,-11.9]);document.pointerLockElement=canvas;events.mousemove({movementX:0,movementY:-100,clientX:0,clientY:0});step();const afterPitch=projectY(draws.find(d=>d.eye[2]!==0).vp,[0,1.72,-11.9]);assert.ok(afterPitch<beforePitch,'looking up moves the target down on screen');document.pointerLockElement=null;
// Reset restores target score and chakra; held keys cannot continue moving after pause.
elements.resetButton.onclick();step();assert.equal(elements.score.textContent,'00');assert.equal(elements.chakraNumber.textContent,'100 / 100');assert.equal(elements.castCount.textContent,'0 thuật');
// Full five-target round: aim through the real mouse handler, cast and advance time.
const targetPositions=[[-6,-8],[0,-12],[6,-9],[-8,-20],[8,-20]];let yaw=0;document.pointerLockElement=canvas;
for(const [x,z] of targetPositions){const nextYaw=-Math.atan2(x,7-z);events.mousemove({movementX:-(nextYaw-yaw)/.0025,movementY:0,clientX:0,clientY:0});yaw=nextYaw;for(let shot=0;shot<2;shot++){for(const value of ['q','w','e','r'])key(value);key(' ');step(160);}}
assert.equal(elements.score.textContent,'05');assert.equal(elements.winScreen.classList.contains('hidden'),false);key('Enter');step();assert.equal(elements.score.textContent,'00');assert.ok(elements.roundText.textContent.endsWith('02'));document.pointerLockElement=null;
// Breath hits at close range through the same movement and seal controls.
events.keydown({key:'ArrowUp',preventDefault(){}});step(200);events.keyup({key:'ArrowUp'});for(const value of ['a','s','d','f'])key(value);key(' ');step(150);assert.equal(elements.score.textContent,'01','close-range breath should destroy the central target');
elements.resetButton.onclick();step();
console.log('PASS: 12 seals; 3 spell rules; recovery/cooldown/expiry; game input; aimed projectile collision; target death; pause/resume; reset; '+frameDraws+' draw calls.');
module.exports={draws,elements,context,step,key};
