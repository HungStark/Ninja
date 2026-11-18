import * as T from 'three';
import {windTime} from './materials.js';

// Analytic ripples stay in world space across the canal junctions. This uses
// the normal shadow/fog pipeline and needs no reflection render target.
export function landscapeWater(color,{frozen=false,lava=false,opacity=.88}={}){
  const material=new T.MeshStandardMaterial({color,roughness:frozen?.28:.23,metalness:frozen?.12:.16,
    transparent:!lava,opacity:lava?1:opacity,emissive:lava?color:'#000000',emissiveIntensity:lava?.55:0});
  material.name=lava?'flowing-lava':frozen?'frozen-river':'flowing-river';
  material.userData.landscapeWater={frozen,lava};
  material.onBeforeCompile=shader=>{
    shader.uniforms.uLandscapeTime=windTime;
    shader.vertexShader='varying vec3 vLandscapeWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
      vLandscapeWorld=(modelMatrix*vec4(transformed,1.0)).xyz;`);
    shader.fragmentShader='uniform float uLandscapeTime; varying vec3 vLandscapeWorld;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float riverTime=uLandscapeTime*${frozen?'0.0':lava?'0.18':'0.7'};
      vec2 riverP=vLandscapeWorld.xz;
      float waveA=riverP.x*2.1+riverP.y*.8-riverTime;
      float waveB=riverP.x*.9-riverP.y*2.8+riverTime*.7;
      normal=normalize(normal+mat3(viewMatrix)*vec3(cos(waveA)*.085,0.0,cos(waveB)*.07));`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      float riverFresnel=pow(1.0-clamp(abs(dot(normal,normalize(vViewPosition))),0.0,1.0),3.0);
      float flow=sin(waveA+sin(waveB)*.7);
      float glint=smoothstep(.965,1.0,flow)*smoothstep(.4,.95,sin(waveB*.4));
      ${lava?'outgoingLight+=vec3(.7,.23,.025)*glint*.55;':`outgoingLight=mix(outgoingLight,vec3(.42,.65,.72)*.7,riverFresnel*.28);
      outgoingLight+=vec3(.33,.43,.43)*glint*.14;`}
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>`landscape-water-${frozen}-${lava}`;
  return material;
}
