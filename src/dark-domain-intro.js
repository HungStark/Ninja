import * as T from 'three';

const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

// Tint the existing lit surface rather than replacing or clipping its geometry.
// Reconstruct final world positions to follow instancing and terrain deformation.
function coatMaterial(material,uniforms) {
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
    shader.fragmentShader='uniform float uDomainCoat;uniform float uDomainTime;uniform float uDomainWipe;uniform float uDomainRadius;uniform vec3 uDomainOrigin;varying vec3 vDomainWorld;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',`
      float domainCoverage=uDomainCoat;
      if(uDomainWipe>.5&&domainCoverage<.5){
        vec3 delta=vDomainWorld-uDomainOrigin;
        float edge=sin(delta.x*.65+delta.z*.43)*.22+sin(delta.z*.9-delta.y*.7)*.16;
        domainCoverage=1.-smoothstep(uDomainRadius+edge-.35,uDomainRadius+edge+.35,length(delta));
      }
      if(domainCoverage>0.){
        vec2 domainUV=vDomainWorld.xz+vDomainWorld.y*vec2(.12,.21);
        float domainFlow=sin(domainUV.x*.32+sin(domainUV.y*.23+uDomainTime*.4)*1.5+uDomainTime*.5)+sin(domainUV.y*.52-domainUV.x*.14-uDomainTime*.35)*.4;
        vec3 domainInk=mix(vec3(.016,.010,.026),vec3(.065,.035,.090),smoothstep(.45,.60,domainFlow));
        domainInk=mix(domainInk,vec3(.100,.055,.135),smoothstep(1.12,1.26,domainFlow));
        // Irregular black pools sit inside the broad, flowing purple bands.
        vec2 domainCell=floor(domainUV/vec2(8.5,7.));
        float domainSeed=fract(sin(dot(domainCell,vec2(127.1,311.7)))*43758.5453);
        float domainSeed2=fract(sin(dot(domainCell,vec2(269.5,183.3)))*43758.5453);
        vec2 domainPool=(fract(domainUV/vec2(8.5,7.))-.5-vec2(domainSeed-.5,domainSeed2-.5)*.35)*vec2(8.5,7.);
        float domainAngle=domainSeed*6.28318;
        domainPool=mat2(cos(domainAngle),-sin(domainAngle),sin(domainAngle),cos(domainAngle))*domainPool;
        float domainPoolEdge=length(domainPool/vec2(1.4+domainSeed*1.2,.65+domainSeed2*.8));
        float domainPoolMask=(1.-smoothstep(.90,1.02,domainPoolEdge))*step(.25,domainSeed);
        domainInk=mix(domainInk,vec3(.005,.003,.009),domainPoolMask);
        // Keep surface relief from the original lighting while giving ink its
        // own color, so dark grass cannot erase the visible pattern.
        float domainLight=clamp(sqrt(max(dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722)),.0001))*3.3,.35,1.5);
        vec3 domainSurface=domainInk*domainLight+gl_FragColor.rgb*.10;
        gl_FragColor.rgb=mix(gl_FragColor.rgb,domainSurface,domainCoverage);
      }
      #include <tonemapping_fragment>
    `);
  };
  material.customProgramCacheKey=()=>key+'-domain-surface-coat';
  material.needsUpdate=true;
}

export class DarkDomainIntro {
  constructor(world,reducedMotion=false) {
    this.reducedMotion=reducedMotion;this.world=world;this.materials=new WeakSet();
    this.uniforms={uDomainCoat:{value:0},uDomainTime:{value:0},uDomainWipe:{value:0},uDomainRadius:{value:0},uDomainOrigin:{value:new T.Vector3()},uDomainInverseVP:{value:new T.Matrix4()}};
    this.prepareSurfaces();
    this.time={value:0};this.opacity={value:0};
    // A ground-facing hemisphere with equal radii, never a camera-facing disc.
    this.dome=new T.Group();this.dome.name='DomainBlackDome';world.scene.add(this.dome);
    this.shell=new T.Mesh(new T.SphereGeometry(1,64,32,0,Math.PI*2,0,Math.PI/2),new T.ShaderMaterial({
      side:T.DoubleSide,transparent:true,depthWrite:false,uniforms:{uTime:this.time,uOpacity:this.opacity},
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
          // Keep the existing terrain and fighters readable through the shell.
          float alpha=uOpacity*.12;
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
  prepareSurfaces(){
    // Indoor arenas are built lazily, so collect new surfaces on every cast.
    for(const root of this.world.environment){if(root===this.world.sky)continue;root.traverse(o=>{
      if(!o.isMesh||o.userData.inkOutline||!o.material)return;
      for(const material of Array.isArray(o.material)?o.material:[o.material]){
        // Luminous fixtures keep their visible glow as well as their light.
        if(material.emissiveIntensity>0&&material.emissive?.getHex()>0)continue;
        if(!this.materials.has(material)){this.materials.add(material);coatMaterial(material,this.uniforms);}
      }
    });}
  }
  setActive(active){this.prepareSurfaces();this.uniforms.uDomainCoat.value=active?1:0;}
  begin(position,direction,alreadyActive) {
    this.reset();this.prepareSurfaces();this.alreadyActive=alreadyActive;this.uniforms.uDomainCoat.value=alreadyActive?1:0;
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
    this.uniforms.uDomainWipe.value=this.progress>0&&!this.alreadyActive?1:0;
    return {done:age>=start+spread,phase:age<start?'dome':'spreading'};
  }
  updateCamera(camera) {
    camera.updateMatrixWorld();
    this.uniforms.uDomainInverseVP.value.multiplyMatrices(camera.matrixWorld,camera.projectionMatrixInverse);
  }
  reset() {
    this.progress=0;this.uniforms.uDomainCoat.value=0;this.uniforms.uDomainWipe.value=0;this.uniforms.uDomainRadius.value=0;
    this.dome.visible=false;this.dome.scale.setScalar(0);this.opacity.value=0;this.rim.material.opacity=0;
  }
  state(){return {shape:'hemisphere',domeVisible:this.dome.visible,domeScale:this.dome.scale.toArray(),spreading:this.uniforms.uDomainWipe.value>0,coating:this.uniforms.uDomainCoat.value>0,progress:this.progress,radius:this.uniforms.uDomainRadius.value,origin:this.uniforms.uDomainOrigin.value.toArray()};}
}
