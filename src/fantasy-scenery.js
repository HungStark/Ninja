import * as T from 'three';
import kit from '../assets/fantasy-kit.json' with {type:'json'};

// Exported by tools/build-fantasy-kit.py through Blender MCP. Each call owns
// its geometry so the existing map disposal lifecycle stays intact.
export function sceneryGeometry(name){
  const data=kit[name];
  if(!data)throw new Error('Unknown scenery geometry: '+name);
  const geometry=new T.BufferGeometry();
  for(const [key,size] of [['position',3],['normal',3],['color',3],['uv',2]])
    geometry.setAttribute(key,new T.Float32BufferAttribute(data[key],size));
  geometry.name='blender-'+name;geometry.userData.solidScenery=/rock|trunk/.test(name);geometry.computeBoundingSphere();
  return geometry;
}

// Local surface detail never changes garment dyes, UVs, bones or silhouettes.
// The same treatment also works with the existing toon NPCs and guardian art.
export function sculptedSurface(material,{fabric=false,rim=.045}={}){
  if(!material.isMeshStandardMaterial&&!material.isMeshToonMaterial)return material;
  if(material.onBeforeCompile.sculptedSurface)return material;
  material.userData.sculptedSurface=true;
  const previous=material.onBeforeCompile,cache=material.customProgramCacheKey.bind(material),key=cache();
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      float sculptRim=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),3.0);
      outgoingLight+=diffuseColor.rgb*sculptRim*${rim.toFixed(4)};
      #include <opaque_fragment>`);
    if(fabric)shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`
      #include <roughnessmap_fragment>
      #ifdef USE_MAP
      roughnessFactor=clamp(roughnessFactor+.035*sin(vMapUv.x*420.0)*sin(vMapUv.y*420.0),.45,1.0);
      #endif`);
  };
  material.onBeforeCompile.sculptedSurface=true;
  material.customProgramCacheKey=()=>key+'-sculpt-'+fabric+'-'+rim;
  return material;
}

export function litCharacterMaterial(source){
  if(!source.isMeshBasicMaterial||/eye|mouth|brow/i.test(source.name))return source.clone();
  return new T.MeshStandardMaterial({name:source.name,color:source.color,map:source.map,
    alphaMap:source.alphaMap,alphaTest:source.alphaTest,transparent:source.transparent,
    opacity:source.opacity,side:source.side,depthWrite:source.depthWrite,
    depthTest:source.depthTest,vertexColors:source.vertexColors,roughness:.88});
}
