// Object disposal must include instance buffers and shadow-only materials,
// which are not released by geometry/material disposal alone.
export function disposeSceneResources(root,{materials=[],textures=[]}={}){
  const geometries=new Set(),ownedMaterials=new Set(materials),ownedTextures=new Set(textures);let instances=0;
  root.traverse(object=>{
    if(object.isInstancedMesh){object.dispose();instances++;}
    if(object.geometry&&!object.isSprite)geometries.add(object.geometry);
    for(const material of [object.material,object.customDepthMaterial,object.customDistanceMaterial].flat())if(material)ownedMaterials.add(material);
  });
  const addTexture=texture=>{if(texture?.isTexture&&!texture.userData.sharedCharacterTexture&&!texture.userData.sharedTexture)ownedTextures.add(texture);};
  for(const material of ownedMaterials){
    for(const key of ['map','bumpMap','roughnessMap','normalMap','alphaMap','emissiveMap','metalnessMap','aoMap','displacementMap','lightMap'])addTexture(material[key]);
    for(const uniform of Object.values(material.uniforms||{}))for(const value of [uniform.value].flat())addTexture(value);
  }
  for(const geometry of geometries)geometry.dispose();
  for(const material of ownedMaterials)material.dispose();
  let textureCount=0;for(const texture of ownedTextures)if(texture?.isTexture&&!texture.userData.sharedCharacterTexture&&!texture.userData.sharedTexture){texture.dispose();textureCount++;}
  return {geometries:geometries.size,materials:ownedMaterials.size,textures:textureCount,instances};
}
