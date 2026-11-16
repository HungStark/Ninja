import * as T from 'three';
import {createSpellAimGuide} from './spell-aim-vfx.js';

// Enemy warnings use the player's exact guide geometry with a red palette.
export function createCombatWarningVfx(parent,{heightAt=()=>0}={}){
  const pool=[],all=new Set(),active=new Map();
  function release(root){const guide=active.get(root);if(!guide)return;active.delete(root);root.removeFromParent();root.visible=false;if(pool.length<128)pool.push(guide);else{all.delete(guide);guide.dispose();}}
  function show(shape,host=parent){
    const guide=pool.pop()||createSpellAimGuide(new T.Group(),{danger:true});all.add(guide);for(const material of guide.materials)material.userData.guardianShared=true;const root=guide.root;root.visible=true;root.position.set(0,0,0);root.rotation.set(0,0,0);root.scale.setScalar(1);host.add(root);active.set(root,guide);
    root.name='enemy-warning-guide';root.userData.warningPalette='red';root.userData.releaseWarning=()=>release(root);
    root.userData.warningOpacity=value=>{guide.materials[0].opacity=.9*value;guide.materials[1].opacity=.2*value;guide.materials[2].opacity=.96*value;};
    const update=s=>{
      const p=s.position||s.from,from=[0,0,0],to=s.to?[s.to[0]-p[0],0,s.to[2]-p[2]]:[0,0,0],length=Math.hypot(to[0],to[2])||1;
      root.position.set(p[0],heightAt(p[0],p[2])+.12,p[2]);root.userData.warningKind=s.kind;
      guide.update({kind:s.kind==='circle'?'area':s.kind==='sector'?'sector':s.kind==='wall'?'wall':'direction',position:from,center:to,direction:s.direction||[to[0]/length,0,to[2]/length],width:s.width||.2,radius:s.radius||1,arc:s.arc,heightAt:()=>-.2,available:true});
    };root.userData.updateWarning=update;update(shape);return root;
  }
  return {show,area:(p,r,host)=>show({kind:'circle',position:p,radius:r},host),lane:(a,b,width,host)=>show({kind:'lane',from:a,to:b,width},host),
    release(node){if(!node)return;const list=[];node.traverse(child=>{if(active.has(child))list.push(child);});for(const child of list)release(child);},
    state:()=>({active:active.size,allocated:all.size,pooled:pool.length}),
    dispose(){for(const guide of all)guide.dispose();active.clear();all.clear();pool.length=0;}
  };
}
