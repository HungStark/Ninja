import * as T from 'three';

const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

// Reconstruct the final vertex position so the wipe also follows instancing,
// wind deformation, sprites and the environment's thin outline shells.
function maskMaterial(material,uniforms,keepInside) {
  const before=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    before.call(this,shader,renderer);
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader='uniform mat4 uDomainInverseVP;varying vec3 vDomainWorld;\n'+shader.vertexShader;
    const end=shader.vertexShader.lastIndexOf('}');
    shader.vertexShader=shader.vertexShader.slice(0,end)+`
      vec4 domainWorld=uDomainInverseVP*gl_Position;
      vDomainWorld=domainWorld.xyz/domainWorld.w;
    `+shader.vertexShader.slice(end);
    shader.fragmentShader='uniform float uDomainWipe;uniform float uDomainRadius;uniform vec3 uDomainOrigin;varying vec3 vDomainWorld;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/,`$&
      if(uDomainWipe>.5){
        vec3 delta=vDomainWorld-uDomainOrigin;
        float edge=sin(delta.x*.65+delta.z*.43)*.22+sin(delta.z*.9-delta.y*.7)*.16;
        if(length(delta) ${keepInside?'>':'<'} uDomainRadius+edge)discard;
      }
    `);
  };
  material.customProgramCacheKey=()=>key+'-domain-wipe-'+keepInside;
  material.needsUpdate=true;
}

export class DarkDomainIntro {
  constructor(world,floor,sky,reducedMotion) {
    this.reducedMotion=reducedMotion;
    this.uniforms={uDomainWipe:{value:0},uDomainRadius:{value:0},uDomainOrigin:{value:new T.Vector3()},uDomainInverseVP:{value:new T.Matrix4()}};
    const materials=new Set();
    for(const root of world.environment)root.traverse(o=>{
      if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);
    });
    for(const m of materials)maskMaterial(m,this.uniforms,false);
    this.field=new T.Group();this.field.name='SpreadingInkDomain';this.field.visible=false;world.scene.add(this.field);
    for(const source of [floor,sky]){
      const copy=source.clone();copy.material=source.material.clone();
      // The floor's animation clock must stay shared with the existing domain.
      if(copy.material.uniforms.uTime)copy.material.uniforms.uTime=source.material.uniforms.uTime;
      maskMaterial(copy.material,this.uniforms,true);this.field.add(copy);
    }
    this.field.children[1].renderOrder=-9;
    this.time={value:0};this.opacity={value:0};
    // A ground-facing hemisphere with equal radii, never a camera-facing disc.
    this.dome=new T.Group();this.dome.name='DomainBlackDome';world.scene.add(this.dome);
    this.shell=new T.Mesh(new T.SphereGeometry(1,64,32,0,Math.PI*2,0,Math.PI/2),new T.ShaderMaterial({
      side:T.DoubleSide,transparent:true,depthWrite:true,uniforms:{uTime:this.time,uOpacity:this.opacity},
      vertexShader:`varying vec3 p;varying vec3 n;void main(){p=position;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec3 p;varying vec3 n;uniform float uTime;uniform float uOpacity;
        void main(){
          float light=dot(normalize(n),normalize(vec3(-.65,.9,.5)));
          vec3 c=vec3(.004,.003,.009);
          if(light>.12)c=vec3(.014,.009,.025);
          if(light>.65)c=vec3(.037,.026,.053);
          // Subtle ink currents follow the curved surface, without a flat spiral.
          float flow=sin(atan(p.z,p.x)*6.+p.y*8.-uTime*.7);
          if(flow>.94&&p.y>.1&&p.y<.92)c*=1.22;
          // Inside the expanding dome, retain visibility of fighters and the ink floor.
          float alpha=uOpacity*(gl_FrontFacing?1.:.16);
          gl_FragColor=vec4(c,alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    }));
    this.shell.name='DomainDomeShell';this.shell.renderOrder=2;this.dome.add(this.shell);
    this.rim=new T.Mesh(new T.TorusGeometry(1,.009,6,128),new T.MeshBasicMaterial({color:'#574265',transparent:true,depthWrite:false}));
    this.rim.rotation.x=-Math.PI/2;this.rim.renderOrder=3;this.dome.add(this.rim);
    this.reset();
  }
  begin(position,direction,alreadyActive) {
    this.reset();this.alreadyActive=alreadyActive;
    const forward=new T.Vector3(direction[0],0,direction[2]).normalize();
    this.uniforms.uDomainOrigin.value.fromArray(position).addScaledVector(forward,6);
    this.uniforms.uDomainOrigin.value.y=.10;
    this.dome.position.copy(this.uniforms.uDomainOrigin.value);
  }
  update(age,openStart,eyesOpen,time) {
    const hold=this.reducedMotion?.10:.30,spread=this.reducedMotion?.28:1.10;
    const start=eyesOpen+hold;
    this.progress=Math.max(0,Math.min(1,(age-start)/spread));
    this.time.value=this.reducedMotion?0:time;
    this.dome.visible=age>=openStart;
    const appear=smooth((age-openStart)/Math.max(.08,eyesOpen-openStart));
    this.opacity.value=appear*(1-smooth((this.progress-.78)/.22));
    this.rim.material.opacity=this.opacity.value*.65;
    const radius=2.6+230*Math.pow(this.progress,2.5);
    this.dome.scale.setScalar(radius*appear);
    this.uniforms.uDomainRadius.value=this.progress>0?radius:0;
    this.field.visible=this.progress>0&&!this.alreadyActive;
    this.uniforms.uDomainWipe.value=this.field.visible?1:0;
    return {done:age>=start+spread,phase:age<start?'dome':'spreading'};
  }
  updateCamera(camera) {
    camera.updateMatrixWorld();
    this.uniforms.uDomainInverseVP.value.multiplyMatrices(camera.matrixWorld,camera.projectionMatrixInverse);
  }
  reset() {
    this.progress=0;this.uniforms.uDomainWipe.value=0;this.uniforms.uDomainRadius.value=0;
    this.field.visible=false;this.dome.visible=false;this.dome.scale.setScalar(0);this.opacity.value=0;this.rim.material.opacity=0;
  }
  state(){return {shape:'hemisphere',domeVisible:this.dome.visible,domeScale:this.dome.scale.toArray(),spreading:this.field.visible,progress:this.progress,radius:this.uniforms.uDomainRadius.value,origin:this.uniforms.uDomainOrigin.value.toArray()};}
}
