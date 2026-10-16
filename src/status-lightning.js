import * as T from 'three';

const noise=seed=>{const n=Math.sin(seed*12.9898+78.233)*43758.5453;return (n-Math.floor(n))*2-1;};
const profiles={
  static:{width:.012,reach:.48,jitter:.07,opacity:.56},
  shocked:{width:.045,reach:2.55,jitter:.19,opacity:.95},
  magnetic:{width:.026,reach:1.4,jitter:.13,opacity:.7}
};

// Stable within an animation frame, so pause/reduced motion never regenerates noise.
export function statusLightningPaths(mode,stacks,time,quality,reducedMotion=false){
  if(!profiles[mode])return [];
  const profile=profiles[mode],clock=reducedMotion?0:Math.floor(time*(mode==='static'?12:18));
  const count=quality===2?(mode==='static'?2:4):(mode==='shocked'?8:mode==='magnetic'?6:2+stacks),steps=mode==='static'?5:mode==='shocked'?12:9,paths=[];
  for(let arc=0;arc<count;arc++){
    const seed=arc*31+clock*17,angle=arc*2.399+clock*.09;
    const start=mode==='static'?.45+(noise(seed+1)+1)*.8:.18+(noise(seed+1)+1)*.15;
    const reach=profile.reach*(.85+(noise(seed+2)+1)*.15),span=mode==='static'?.65:mode==='shocked'?2.2:1.4;
    const radius=mode==='static'?.47:mode==='shocked'?.65:.57,points=[];
    for(let k=0;k<=steps;k++){
      const u=k/steps,zig=(k%2?1:-1)*profile.jitter*(.55+(noise(seed+k*3)+1)*.35);
      const a=angle+u*span+zig,r=radius+noise(seed+k*7)*profile.jitter;
      points.push([Math.cos(a)*r-Math.sin(a)*zig,start+u*reach+noise(seed+k*11)*profile.jitter*.55,Math.sin(a)*r+Math.cos(a)*zig]);
    }
    paths.push(points);
    const branches=mode==='shocked'?2:1;
    for(let b=0;b<branches;b++){
      const anchor=points[Math.floor(steps*(b?.7:.4))],branch=[anchor],length=mode==='static'?.18:mode==='shocked'?.58:.34,segments=mode==='static'?3:4;
      for(let k=1;k<=segments;k++){
        const u=k/segments,a=angle+1.2+b,zig=(k%2?1:-1)*profile.jitter*.6;
        branch.push([anchor[0]+Math.cos(a)*length*u+Math.sin(a)*zig,anchor[1]+(b?-.35:.5)*length*u+zig,anchor[2]+Math.sin(a)*length*u-Math.cos(a)*zig]);
      }
      paths.push(branch);
    }
  }
  return paths;
}

// Screen-facing ribbons give a real thickness on WebGL, where lineWidth is fixed.
export class StatusLightning extends T.Mesh{
  constructor(){
    const geometry=new T.BufferGeometry(),capacity=200*12;
    geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(capacity*3),3));
    geometry.setAttribute('color',new T.BufferAttribute(new Float32Array(capacity*3),3));
    geometry.setAttribute('aAlpha',new T.BufferAttribute(new Float32Array(capacity),1));
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{uOpacity:{value:1}},
      vertexShader:'attribute vec3 color;attribute float aAlpha;varying vec3 vColor;varying float vAlpha;void main(){vColor=color;vAlpha=aAlpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying vec3 vColor;varying float vAlpha;uniform float uOpacity;void main(){gl_FragColor=vec4(vColor,vAlpha*uOpacity);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
    super(geometry,material);this.frustumCulled=false;this.visible=false;
    this.mode='none';this.width=0;this.reach=0;this.branches=0;
    this.a=new T.Vector3();this.b=new T.Vector3();this.side=new T.Vector3();this.view=new T.Vector3();this.cameraLocal=new T.Vector3();
    this.glowColor=new T.Color('#8470ff').multiplyScalar(1.5);this.coreColor=new T.Color('#d8e6ff').multiplyScalar(1.7);
  }
  update(fighter,time,quality,reducedMotion,camera,origin){
    const mode=fighter.lightningControlTime>0?'shocked':fighter.magneticTime>0?'magnetic':fighter.staticStacks>0?'static':'none',profile=profiles[mode];
    this.visible=!!profile;this.mode=mode;this.width=profile?.width||0;this.reach=profile?.reach||0;this.branches=0;
    if(!profile){this.geometry.setDrawRange(0,0);return;}
    const paths=statusLightningPaths(mode,fighter.staticStacks,time,quality,reducedMotion);
    this.cameraLocal.copy(camera.position).sub(origin);
    const positions=this.geometry.attributes.position,colors=this.geometry.attributes.color,alphas=this.geometry.attributes.aAlpha;
    let index=0;
    for(const path of paths){
      for(let j=1;j<path.length;j++){
        this.a.fromArray(path[j-1]);this.b.fromArray(path[j]);this.view.copy(this.cameraLocal).sub(this.a);
        this.side.subVectors(this.b,this.a).cross(this.view);
        if(this.side.lengthSq()<1e-10)this.side.set(1,0,0);this.side.normalize();
        for(const halo of [true,false]){
          const width=profile.width*(halo?3.5:1)*.5,color=halo?this.glowColor:this.coreColor,alpha=halo?.18:.9;
          for(const [end,sign] of [[0,-1],[1,-1],[0,1],[0,1],[1,-1],[1,1]]){
            const point=end?this.b:this.a;
            positions.setXYZ(index,point.x+this.side.x*width*sign,point.y+this.side.y*width*sign,point.z+this.side.z*width*sign);
            colors.setXYZ(index,color.r,color.g,color.b);alphas.setX(index++,alpha);
          }
        }
      }
    }
    this.branches=paths.filter(p=>p.length<=5).length;
    this.geometry.setDrawRange(0,index);positions.needsUpdate=colors.needsUpdate=alphas.needsUpdate=true;
    this.material.uniforms.uOpacity.value=profile.opacity*(reducedMotion?.65:1);
  }
}
