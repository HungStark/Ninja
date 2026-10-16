import * as T from 'three';
import { FLIGHT_PROFILE } from './projectile-motion.js';

// All meshes/geometries are reused. The pressure ring stays at the burst point;
// the tapered slipstream follows the projectile, with its tail opposite velocity.
const forward=new T.Vector3(0,0,1);
function ribbons(radial=false){
  const positions=[],uvs=[];
  for(let i=0;i<12;i++){
    const angle=i*Math.PI*2/12+.13*Math.sin(i*7),length=radial?.8+(i%3)*.28:3+(i%4)*.45;
    const point=(t,side)=>{
      const a=angle+(radial?.05:.18)*Math.sin(t*Math.PI),r=radial?.55+t*length:.24+.9*t*t;
      const width=(radial?.045:.035)*Math.sin(Math.PI*t)+.002;
      return [Math.cos(a)*r-Math.sin(a)*width*side,Math.sin(a)*r+Math.cos(a)*width*side,radial?-.2-t*.35:.18-t*length];
    };
    for(let j=0;j<12;j++){
      const a=j/12,b=(j+1)/12;
      for(const [t,side] of [[a,-1],[b,-1],[a,1],[a,1],[b,-1],[b,1]]){positions.push(...point(t,side));uvs.push(t,i/12);}
    }
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));return geometry;
}
function ribbonMaterial(){
  return new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{uColor:{value:new T.Color()},uOpacity:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv;uniform vec3 uColor;uniform float uOpacity;void main(){float fade=pow(max(0.0,sin(vUv.x*3.14159265)),.65);gl_FragColor=vec4(uColor*1.8,fade*uOpacity);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
}
export class FlightBurstEffects{
  constructor(scene){
    this.scene=scene;this.pool=[];this.count=0;
    this.ringGeometry=new T.TorusGeometry(1,.018,4,64);
    this.wakeGeometry=ribbons();this.fanGeometry=ribbons(true);
  }
  make(){
    const root=new T.Group(),wake=new T.Mesh(this.wakeGeometry,ribbonMaterial()),fan=new T.Mesh(this.fanGeometry,ribbonMaterial());
    const rings=Array.from({length:2},()=>new T.Mesh(this.ringGeometry,new T.MeshBasicMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending})));
    root.add(...rings,fan);this.scene.add(root,wake);root.visible=wake.visible=false;
    const entry={root,wake,fan,rings,active:false};this.pool.push(entry);return entry;
  }
  trigger(shot,position){
    if(Math.hypot(...shot.v)===0)return;
    const entry=this.pool.find(e=>!e.active)||(this.pool.length<24?this.make():this.pool.reduce((a,b)=>a.age>b.age?a:b));
    entry.active=true;entry.age=0;entry.shot=shot;entry.size=T.MathUtils.clamp(Math.sqrt(shot.size||.3),.65,1.45);
    entry.root.position.fromArray(position);entry.root.quaternion.setFromUnitVectors(forward,new T.Vector3(...shot.v).normalize());entry.root.scale.setScalar(entry.size);
    const tint=new T.Color('#e7f8ff').lerp(new T.Color(shot.color||'#93eaff'),.22);
    entry.rings.forEach((r,i)=>r.material.color.copy(i?tint:new T.Color('#f2fbff')).multiplyScalar(1.5));
    entry.fan.material.uniforms.uColor.value.copy(tint);entry.wake.material.uniforms.uColor.value.copy(tint);
    this.count++;
  }
  update(dt,shots,quality,reducedMotion=false){
    const live=new Set(shots);
    for(const e of this.pool){
      if(!e.active)continue;
      e.age+=dt;
      if(e.age>=.48){e.active=false;e.shot=null;e.root.visible=e.wake.visible=false;continue;}
      const t=e.age/.48,fade=(1-t)**2;
      e.root.visible=true;
      e.rings.forEach((r,i)=>{
        const age=Math.max(0,e.age-i*.045),progress=Math.min(1,age/.3);
        r.visible=(!i||quality<2)&&e.age>=i*.045&&progress<1;
        r.scale.setScalar(reducedMotion?1.05:.45+2.7*(1-(1-progress)**2));
        r.position.z=-age*(i?1.8:1);r.material.opacity=(reducedMotion?.2:.72)*(1-progress)**2;
      });
      e.fan.visible=quality<2&&!reducedMotion;e.fan.scale.setScalar(1+e.age*2.5);e.fan.material.uniforms.uOpacity.value=.8*fade;
      e.wake.visible=live.has(e.shot)&&e.age<.38;
      if(e.wake.visible){
        e.wake.position.fromArray(e.shot.p);e.wake.quaternion.setFromUnitVectors(forward,new T.Vector3(...e.shot.v).normalize());
        const speed=T.MathUtils.clamp(((e.shot.flightSpeedRatio||FLIGHT_PROFILE.launchSpeedRatio)-FLIGHT_PROFILE.launchSpeedRatio)/(FLIGHT_PROFILE.peakSpeedRatio-FLIGHT_PROFILE.launchSpeedRatio),0,1);
        // Keep the tail ahead of the release point, away from a first-person camera.
        const lengthScale=Math.min(e.size*(.5+speed),Math.max(0,e.shot.motionDistance||2)*.7/4.35);
        e.wake.scale.set(e.size,e.size,lengthScale);
        e.wake.material.uniforms.uOpacity.value=(reducedMotion?.22:.85)*(1-e.age/.38)*(.35+.65*speed);
      }
    }
  }
  reset(){for(const e of this.pool){e.active=false;e.shot=null;e.root.visible=e.wake.visible=false;}this.count=0;}
  state(){return {triggered:this.count,active:this.pool.filter(e=>e.active).length,wakes:this.pool.filter(e=>e.wake.visible).length,pooled:this.pool.length};}
}
