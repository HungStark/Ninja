import * as T from 'three';

const HIT_TIME=.2;
export function createCharacterDamageFeedback(){
  const hits=new Map(),cooldowns=new Map();
  function restore(hit){
    for(const overlay of hit.meshes)overlay.removeFromParent();
    for(const material of hit.materials)material.dispose();
    hit.meshes=[];hit.materials=[];
  }
  function remove(id,hit){restore(hit);hits.delete(id);}
  return {
    trigger(id){if(cooldowns.has(id))return;cooldowns.set(id,1);hits.set(id,{id,age:0,meshes:[],materials:[]});},
    advance(dt){for(const [id,left] of cooldowns){if(left<=dt+1e-9)cooldowns.delete(id);else cooldowns.set(id,left-dt);}for(const [id,hit] of hits){hit.age+=dt;if(hit.age>=HIT_TIME)remove(id,hit);}},
    render(actors,enabled){
      if(!enabled){this.reset();return;}
      for(const [id,hit] of hits){
        const actor=actors.find(a=>a.id===id);if(!actor){remove(id,hit);continue;}
        const {root}=actor;
        if(!hit.meshes.length){
          const materials=new Map(),meshes=[];
          const layer=source=>{
            if(!materials.has(source)){
              const material=new T.MeshBasicMaterial({color:'#ff3030',transparent:true,opacity:.32*(source.opacity??1),depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,toneMapped:false,side:source.side,alphaTest:source.alphaTest||0,map:source.alphaTest>0?source.map:null,alphaMap:source.alphaMap||null});
              materials.set(source,material);hit.materials.push(material);
            }
            return materials.get(source);
          };
          root.traverseVisible(mesh=>{if(mesh.isMesh&&!mesh.userData.damageOverlay)meshes.push(mesh);});
          for(const mesh of meshes){
            const sources=Array.isArray(mesh.material)?mesh.material:[mesh.material];
            if(sources.every(m=>m.side===T.BackSide||m.transparent&&m.opacity<.9))continue;
            const overlay=mesh.clone(false);overlay.name='damage-overlay';overlay.userData.damageOverlay=true;
            overlay.material=Array.isArray(mesh.material)?sources.map(layer):layer(mesh.material);
            overlay.position.set(0,0,0);overlay.quaternion.identity();overlay.scale.set(1,1,1);overlay.matrix.identity();overlay.matrixAutoUpdate=false;
            overlay.morphTargetInfluences=mesh.morphTargetInfluences;overlay.castShadow=overlay.receiveShadow=false;overlay.frustumCulled=false;overlay.renderOrder=mesh.renderOrder+1;
            mesh.add(overlay);hit.meshes.push(overlay);
          }
        }
      }
    },
    reset(){for(const [id,hit] of hits)remove(id,hit);cooldowns.clear();},
    state:()=>[...hits.values()].map(h=>({id:h.id,age:h.age,flashing:h.age<HIT_TIME,overlayMeshes:h.meshes.length,overlayOpacity:h.meshes[0]?(Array.isArray(h.meshes[0].material)?h.meshes[0].material[0]:h.meshes[0].material).opacity:0}))
  };
}
