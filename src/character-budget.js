import * as T from 'three';

// Visual scheduling only: guards, collisions and quest logic keep ticking.
export function createCharacterBudget(){
  const states=new WeakMap();let quality=1,visible=0,animated=0,total=0;
  function state(actor){let s=states.get(actor);if(!s){const group=new T.Group();group.name='character-render-budget';actor.root.add(group);s={group,age:Infinity,scanned:false,outlines:[],surfaces:[]};states.set(actor,s);}return s;}
  function prepare(actor,hero,dt){
    const s=state(actor),root=actor.root;
    for(const child of [...root.children])if(child!==s.group)s.group.add(child);
    const ready=!!(root.userData.ninja?.modelReady||root.userData.characterModel?.ready);
    if(!s.scanned||ready!==s.ready){s.posed=false;s.outlines=[];s.surfaces=[];s.group.traverse(o=>{if(!o.isMesh)return;if(o.userData.inkOutline)s.outlines.push(o);else s.surfaces.push({mesh:o,shadow:o.castShadow});if(o.isSkinnedMesh&&!o.boundingSphere){o.geometry.computeBoundingSphere();o.boundingSphere=o.geometry.boundingSphere.clone();o.boundingSphere.radius+=1;}});s.scanned=true;s.ready=ready;}
    const distance=root.getWorldPosition(s.point??=new T.Vector3()).distanceTo(hero);
    const range=[110,85,65][quality]||85;s.group.visible=distance<range;root.userData.renderBudgetVisible=s.group.visible;
    for(const outline of s.outlines)outline.visible=quality<2&&distance<20;
    for(const {mesh,shadow}of s.surfaces)mesh.castShadow=shadow&&quality<2&&distance<28;
    s.age+=dt;const interval=distance<16?1/30:distance<38?1/12:1/4;
    const tick=root.visible&&s.group.visible&&(s.age>=interval||!s.posed);if(tick){s.dt=s.age===Infinity?dt:s.age;s.age=0;s.posed=true;}s.tick=tick;
    total++;if(root.visible&&s.group.visible)visible++;if(tick)animated++;
    return s;
  }
  return {begin(){visible=0;animated=0;total=0;},prepare,slot:actor=>states.get(actor),setQuality:q=>{quality=q;},state:()=>({total,visible,animated,quality})};
}
