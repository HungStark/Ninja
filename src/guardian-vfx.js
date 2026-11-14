import * as T from 'three';
const palettes={fire:['#e64b14','#ffe6a0'],water:['#2086b6','#d8ffff'],lightning:['#8059cf','#eee2ff'],wind:['#55bfa4','#e5fff5'],earth:['#877052','#ffe0a0'],light:['#c69736','#fff7c0'],dark:['#4a246b','#c496ff'],wood:['#408953','#d8ffac'],ice:['#619fbf','#e0fbff']};
const vertex=`varying vec3 vP;varying vec3 vN;varying vec3 vView;uniform float uTime;uniform float uKind;
void main(){vP=position;vec3 p=position;float flow=sin(p.y*7.+p.z*5.-uTime*7.)*sin(p.x*5.+uTime*3.);p+=normal*flow*(uKind==0.?0.045:0.018);vec4 mv=modelViewMatrix*vec4(p,1.);vN=normalize(normalMatrix*normal);vView=-mv.xyz;gl_Position=projectionMatrix*mv;}`;
const fragment=`uniform float uTime;uniform float uKind;uniform float uOpacity;uniform vec3 uColor;uniform vec3 uCore;varying vec3 vP;varying vec3 vN;varying vec3 vView;
void main(){vec3 n=normalize(vN);float rim=1.-abs(dot(n,normalize(vView)));float lit=dot(n,normalize(vec3(-.4,.85,.5)))*.5+.5;
float flow=sin(vP.y*8.-uTime*6.+sin(vP.x*5.+vP.z*4.+uTime*2.));vec3 c=uColor*(.36+step(.27,lit)*.36+step(.58,lit)*.36);float alpha=uOpacity;
if(uKind==0.){c=mix(c,uCore,step(.56,lit+flow*.18)*.55);c+=uCore*pow(max(0.,rim),3.)*.3;}
else if(uKind==1.){float foam=step(.86,sin(vP.y*15.+vP.x*5.+vP.z*4.-uTime*4.));c=mix(c,uCore,foam*.65+pow(rim,3.)*.4);alpha*=.65+rim*.35;}
else if(uKind==2.){float arc=step(.94,1.-abs(sin(vP.y*13.+sin(vP.x*8.+uTime*3.)+vP.z*7.-uTime*8.)));c=mix(c,uCore*1.3,arc);c+=uCore*pow(rim,4.)*.5;}
else{float filigree=step(.94,sin(vP.x*9.+vP.y*7.+vP.z*5.-uTime*3.));c=mix(c,uCore,filigree*.45+pow(rim,4.)*.5);}
gl_FragColor=vec4(c,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
function spiral(){const p=[],idx=[];for(let i=0;i<=64;i++){const t=i/64,a=t*Math.PI*7,r=.2+t*.8;for(const edge of [-1,1])p.push(Math.cos(a)*r,t*3+edge*.055,Math.sin(a)*r);if(i<64){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;}

export function createGuardianVfx(){
 const root=new T.Group();root.name='guardian-spell-vfx';
 const geo={orb:new T.SphereGeometry(1,12,8),shard:new T.OctahedronGeometry(1),trail:new T.ConeGeometry(1,1,6),ring:new T.TorusGeometry(1,.035,4,40),slash:new T.TorusGeometry(1,.06,4,24,Math.PI*1.2),spiral:spiral(),beam:new T.CylinderGeometry(1,1,1,12,1,true)};
 const cache=new Map(),materials=new Set(),sparkColor=new T.Color();let element='fire',time=0,lastBurst=-1;
 const shared=m=>{m.userData.guardianShared=true;materials.add(m);return m;};
 const colors=()=>palettes[element]||palettes.fire;
 function surface(opacity=1){const key=element+':surface:'+opacity;if(!cache.has(key))cache.set(key,shared(new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:opacity<1,depthWrite:opacity===1,side:T.DoubleSide,uniforms:{uTime:{value:time},uKind:{value:element==='fire'?0:element==='water'?1:element==='lightning'?2:3},uOpacity:{value:opacity},uColor:{value:new T.Color(colors()[0])},uCore:{value:new T.Color(colors()[1])}}})));return cache.get(key);}
 function glow(opacity=.5){const key=element+':glow:'+opacity;if(!cache.has(key))cache.set(key,shared(new T.MeshBasicMaterial({color:new T.Color(colors()[1]).multiplyScalar(1.15),transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide})));return cache.get(key);}
 function part(parent,g,m,p=[0,0,0],s=[1,1,1]){const o=new T.Mesh(g,m);o.position.fromArray(p);o.scale.fromArray(s);o.name='guardian-energy-layer';parent.add(o);return o;}
 const capacity=96,dummy=new T.Object3D(),sparkMat=shared(new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending,vertexColors:true})),sparks=new T.InstancedMesh(geo.shard,sparkMat,capacity),particles=Array.from({length:capacity},()=>({p:new T.Vector3(),v:new T.Vector3(),age:1,life:0,size:0}));
 sparks.frustumCulled=false;sparks.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(sparks);let cursor=0;
 const charge=new T.Group();charge.name='guardian-cast-charge';root.add(charge);
 let chargeElement=null;
 function spawn(p,v,life,size){const s=particles[cursor++%capacity];s.p.fromArray(p);s.v.fromArray(v);s.age=0;s.life=life;s.size=size;}
 function burst(p,r=1){if(time-lastBurst<.035)return;lastBurst=time;for(let i=0;i<8;i++){const a=i*Math.PI/4+time;spawn(p,[Math.cos(a)*(1.8+r),.7+i%3*.6,Math.sin(a)*(1.8+r)],.35+i%3*.06,.045+Math.min(r,3)*.025);}}
 return {
  surface,glow,part,geo,burst,
  attach(parent,id){element=id in palettes?id:'fire';sparkColor.set(colors()[1]);parent.add(root);time=0;lastBurst=-1;for(const s of particles)s.life=0;sparks.count=0;charge.visible=false;},
  projectile(e,low=false){
   e.model.material.dispose();e.model.material=surface(.95);
   const core=!low&&e.r>=.3?part(e.root,geo.orb,glow(.65),[0,0,0],[e.r*.48,e.r*.48,e.r*.48]):null;
   const trail=part(e.root,geo.trail,glow(.35),[0,-e.r*1.5,0],[e.r*.6,e.r*3.2,e.r*.6]);trail.rotation.z=Math.PI;e.vfx={core,trail};
  },
  vortex(e){const water=e.kind==='vortex',ribbon=part(e.root,geo.spiral,surface(water?.4:.65),[0,water?1.35:0,0],[e.r,water?.45:.9,e.r]);ribbon.rotation.z=water?Math.PI:0;e.vfx={ribbon};},
  zone(e){if(['fire','dark','blizzard','puddle'].includes(e.tag)){const ring=part(e.root,geo.ring,glow(.3),[0,.09,0],[e.r*.85,e.r*.85,e.r*.85]);ring.rotation.x=Math.PI/2;e.vfx={ring};}},
  beam(parent,a,b,r){const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.sub(from),length=delta.length(),g=new T.Group();g.position.copy(from).addScaledVector(delta,.5);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());parent.add(g);part(g,geo.beam,surface(.8),[0,0,0],[r,length,r]);part(g,geo.beam,glow(.45),[0,0,0],[r*.32,length,r*.32]);return g;},
  update(dt,clock,entities,body,action){
   time=clock;for(const m of materials)if(m.uniforms)m.uniforms.uTime.value=time;
   if(chargeElement!==element){charge.clear();part(charge,geo.orb,glow(.4));for(let i=0;i<2;i++){const ring=part(charge,geo.ring,glow(.4));ring.rotation.x=i?Math.PI/2:0;}chargeElement=element;}
   const windup=action?.windup||action?.warning||.6,charging=action&&action.age<windup;charge.visible=!!charging;
   if(charging){const k=Math.min(1,action.age/windup);charge.position.set(body[0],1.9,body[2]);charge.scale.setScalar(.2+k*.5);charge.rotation.set(time*.8,time*2,time*.3);}
   for(const e of entities)if(!e.dead){
    if(e.kind==='projectile'&&clock-(e.sparkAt||0)>.09){e.sparkAt=clock;spawn(e.p,[-e.v[0]*.5,.25,-e.v[2]*.5],.22,e.r*.16);}
    if(e.kind==='wave'&&clock-(e.sparkAt||0)>.1){e.sparkAt=clock;for(const side of [-1,1]){const x=side<0?(-e.width/2+e.gapOffset-e.gap/2)/2:(e.width/2+e.gapOffset+e.gap/2)/2;spawn([e.p[0]+x,.9,e.p[2]],[0,1,.2],.3,.07);}}
    if(e.vfx?.ribbon)e.vfx.ribbon.rotation.y+=dt*(e.kind==='vortex'?-4:3);
    if(e.vfx?.ring){e.vfx.ring.rotation.z+=dt;if(clock-(e.sparkAt||0)>.16){e.sparkAt=clock;const theta=clock*3;spawn([e.p[0]+Math.sin(theta)*e.r,.2,e.p[2]+Math.cos(theta)*e.r],[0,e.tag==='blizzard'?.15:.6,0],.45,.07);}}
   }
   let count=0;for(const s of particles){if(s.age>=s.life)continue;s.age+=dt;s.p.addScaledVector(s.v,dt);s.v.y-=dt*1.5;dummy.position.copy(s.p);dummy.rotation.set(time*3+s.age,time*2,s.age*7);dummy.scale.setScalar(s.size*Math.max(0,1-s.age/s.life));dummy.updateMatrix();sparks.setMatrixAt(count,dummy.matrix);sparks.setColorAt(count,sparkColor);count++;}
   sparks.count=count;sparks.instanceMatrix.needsUpdate=true;if(sparks.instanceColor)sparks.instanceColor.needsUpdate=true;
  },
  state:()=>({particles:sparks.count,capacity,materials:materials.size,sharedGeometries:Object.keys(geo).length,charging:charge.visible}),
  dispose(){root.removeFromParent();sparks.dispose();for(const g of Object.values(geo))g.dispose();for(const m of materials)m.dispose();}
 };
}
