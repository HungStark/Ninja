import * as T from 'three';

// Source textures are shared across scene instances and survive map changes.
export function prepareCharacterSource(source){
  source.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(m))if(value?.isTexture)value.userData.sharedCharacterTexture=true;});
  source.updateMatrixWorld(true);new T.Box3().setFromObject(source);return source;
}

export function trackCharacterLoad(root,asset,ready){
  const status={state:'loading',asset};root.userData.characterLoad=status;
  return Promise.resolve(ready).then(loaded=>{status.state=loaded===false?'error':'ready';return loaded;},error=>{status.state='error';status.error=String(error?.message||error);return false;});
}
