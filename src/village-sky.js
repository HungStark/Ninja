import * as T from 'three';

export function createVillageSky(scene){
  const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
    uniforms:{horizon:{value:new T.Color()},zenith:{value:new T.Color()},haze:{value:new T.Color()},cloudStrength:{value:1}},
    vertexShader:'varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec3 skyDirection;uniform vec3 horizon;uniform vec3 zenith;uniform vec3 haze;uniform float cloudStrength;
      void main(){vec3 d=normalize(skyDirection);float elevation=max(0.0,d.y);
        vec3 color=mix(horizon,zenith,smoothstep(0.0,.8,elevation));
        float wisps=sin(d.x*18.0+d.z*11.0+sin(d.z*17.0)*.7)*.5+.5;
        float cloud=smoothstep(.72,.94,wisps)*smoothstep(.12,.24,elevation)*(1.0-smoothstep(.32,.5,elevation));
        color=mix(color,haze,cloud*.17*cloudStrength);gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const dome=new T.Mesh(new T.SphereGeometry(1,24,12),material);dome.name='village-atmosphere';dome.frustumCulled=false;dome.renderOrder=-100;scene.add(dome);
  return {setVillage(v){const base=new T.Color(v.sky);material.uniforms.horizon.value.copy(base);material.uniforms.zenith.value.copy(base).multiplyScalar(v.id==='dark'?.6:.7);material.uniforms.haze.value.copy(base).lerp(new T.Color(v.id==='fire'?'#c9ad91':'#e0e8df'),.45);material.uniforms.cloudStrength.value=['dark','lightning','fire'].includes(v.id)?.35:1;dome.visible=true;},hide(){dome.visible=false;},update(camera){dome.position.copy(camera.position);dome.scale.setScalar(camera.far*.9);}};
}
