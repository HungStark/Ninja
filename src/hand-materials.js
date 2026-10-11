import * as T from 'three';
import { handUV } from './hand-sculpt.js';

let cached;
function map(data,size,color=false) {
  const texture=new T.DataTexture(data,size,size,T.RGBAFormat);
  texture.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;
  texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;
  texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;return texture;
}
export function handMaterials() {
  if(cached)return cached;
  const size=512,folds=new Float32Array(size*size);
  function line(part,points,amount) {
    for(let j=1;j<points.length;j++) {
      const a=handUV(part,...points[j-1]),b=handUV(part,...points[j]),steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*size*2);
      for(let k=0;k<=steps;k++) {
        const t=k/Math.max(steps,1),x=(a[0]+(b[0]-a[0])*t)*size,y=(a[1]+(b[1]-a[1])*t)*size;
        for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++) {
          const px=Math.floor(x)+dx,py=Math.floor(y)+dy;if(px<0||py<0||px>=size||py>=size)continue;
          folds[py*size+px]=Math.max(folds[py*size+px],amount*Math.exp(-((px-x)**2+(py-y)**2)/.8));
        }
      }
    }
  }
  line('palm',[[.57,.72],[.70,.74],[.83,.66],[.92,.60]],.5);
  line('palm',[[.58,.57],[.72,.52],[.87,.55]],.35);
  line('palm',[[.6,.27],[.72,.38],[.74,.53],[.65,.68]],.35);
  for(let f=0;f<5;f++) for(const joint of [.46,.77])for(const center of [.25,.75]) {
    line(f,[[center-.10,joint],[center,joint+.016],[center+.10,joint+.004]],.38);
    line(f,[[center-.07,joint-.025],[center+.07,joint-.02]],.18);
  }
  const color=new Uint8Array(size*size*4),bump=new Uint8Array(color.length),rough=new Uint8Array(color.length);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const i=(y*size+x)*4,fold=folds[y*size+x],noise=Math.sin(x*2.13+y*7.71)*Math.sin(y*1.81-x*3.23);
    const tint=Math.sin(x*.065)*Math.sin(y*.04)*1.5;
    color.set([250+tint-fold*15,181+tint-fold*16,152+tint-fold*14,255],i);
    bump.set([145+noise*3-fold*35,145+noise*3-fold*35,145+noise*3-fold*35,255],i);
    rough.set([192+noise*5,192+noise*5,192+noise*5,255],i);
  }
  cached={
    skin:new T.MeshStandardMaterial({name:'skin',color:'#ffffff',map:map(color,size,true),bumpMap:map(bump,size),bumpScale:.00014,roughnessMap:map(rough,size),roughness:1,metalness:0}),
    nail:new T.MeshStandardMaterial({name:'nail',color:'#edbfb2',roughness:.75,metalness:0}),
    cloth:new T.MeshStandardMaterial({name:'cloth',color:'#272c40',roughness:.85}),
    glove:new T.MeshStandardMaterial({name:'glove',color:'#2c3142',roughness:.78}),
    trim:new T.MeshStandardMaterial({name:'trim',color:'#e3bb81',roughness:.62,metalness:.18}),
    edge:new T.MeshStandardMaterial({name:'edge',color:'#151b2a',roughness:.8})
  };
  // A restrained warm contour follows the silhouette, like the illustrated reference.
  cached.skin.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
      'float handContour=pow(1.-abs(dot(normalize(normal),normalize(vViewPosition))),5.);\n'+
      'outgoingLight*=1.-handContour*.23;\n#include <opaque_fragment>');
  };
  cached.skin.customProgramCacheKey=()=> 'reference-hand-contour';
  return cached;
}
