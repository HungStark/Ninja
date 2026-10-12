import * as T from 'three';

let cached;
// Cel bands illuminate the real skinned normals. Geometry is inspected in clay
// before this material is applied; no painted shadows or screen-space flattening.
export function handMaterials() {
  if (cached) return cached;
  const flat = (name, color) => new T.MeshBasicMaterial({ name, color, toneMapped: false });
  const bands=new Uint8Array(64);
  for(let i=0;i<bands.length;i++) {
    const dot=(i+.5)/bands.length*2-1;
    bands[i]=Math.round(255*(dot<.20?.38:dot<.55?.65:dot<.78?.84:1));
  }
  const gradient=new T.DataTexture(bands,64,1,T.RedFormat);
  gradient.minFilter=gradient.magFilter=T.NearestFilter;
  gradient.generateMipmaps=false;gradient.needsUpdate=true;
  const cel=(name,color)=>new T.MeshToonMaterial({name,color,gradientMap:gradient,toneMapped:false});
  cached = {
    skin: cel('skin', '#ffd0ac'),
    nail: cel('nail', '#dca5a0'),
    cloth: flat('cloth', '#20273c'),
    glove: flat('glove', '#262c43'),
    trim: flat('trim', '#e7be7f'),
    edge: flat('edge', '#181e30'),
    crease: flat('crease', '#bd8b7e'),
  };
  cached.trim.side = T.DoubleSide;
  cached.crease.side = T.DoubleSide;
  return cached;
}
