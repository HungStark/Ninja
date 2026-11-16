import * as T from 'three';
import {createCombatWarningVfx} from './combat-warning-vfx.js';
import {spellAimShape} from './spell-aim-shape.js';
export const NINJA_WARNING_TIME=.65;
// These ground attacks already have their own impact markers and timing.
export const NINJA_EXISTING_WARNING_STYLES=new Set(['meteor','thunder','jacob','earthgravity','earthquake','earthcraterspikes']);
const flat=p=>[p[0],0,p[2]];
export function planNinjaTelegraph(spell,origin,target,extra={}){
  if(!NINJA_EXISTING_WARNING_STYLES.has(spell.style)){
    const cursor=extra.direction?[origin[0]+extra.direction[0]*31,0,origin[2]+extra.direction[2]*31]:target,shape=spellAimShape(spell,origin,cursor,target);
    if(shape.kind==='area')return [{kind:'circle',position:flat(shape.center),radius:shape.radius}];
    if(shape.kind==='wall')return [{kind:'wall',position:flat(shape.center),direction:shape.direction,width:shape.width}];
    return [{kind:'lane',from:flat(origin),to:flat(shape.center),width:shape.width}];
  }
  const center=spell.style==='earthcraterspikes'?(extra.crater||target):target;
  return [{kind:'circle',position:flat(center),radius:Math.max(.8,spell.blastRadius||spell.radius||1.7)}];
}

export function createNinjaTelegraphs(scene,{heightAt=()=>0}={}){
  const root=new T.Group();root.name='ninja-skill-warnings';scene.add(root);
  const warnings=createCombatWarningVfx(root,{heightAt});let jobs=[],serial=0;
  function draw(shapes){const group=new T.Group();root.add(group);for(const shape of shapes){if(shape.kind==='rectangle'){const p=shape.position;warnings.lane([p[0],0,p[2]-shape.length/2],[p[0],0,p[2]+shape.length/2],shape.width,group);}else warnings.show(shape,group);}return group;}
  function hide(job){if(!job.group)return;warnings.release(job.group);job.group.removeFromParent();job.group=null;}
  function remove(job){hide(job);jobs.splice(jobs.indexOf(job),1);}
  function sync(){for(const job of jobs)if(job.fired&&!job.existingWarning&&job.group&&(!job.released||job.released()))hide(job);}
  return {
    queue({spell,sourceId='primary',origin,target,extra={},valid=()=>true,execute}){
      if(jobs.filter(j=>!j.fired).length>=32)return false;
      const shapes=planNinjaTelegraph(spell,origin,target,extra),job={id:++serial,spellId:spell.id,sourceId,target:[...target],shapes,age:0,fired:false,valid,execute,existingWarning:NINJA_EXISTING_WARNING_STYLES.has(spell.style),group:draw(shapes),life:NINJA_WARNING_TIME+Math.max(1.4,Math.min(7,(spell.duration||0)+(spell.holdTime||0)+2))};jobs.push(job);return true;
    },
    advance(dt){if(dt<=1e-8)return;for(const job of [...jobs]){job.age+=dt;if(!job.fired&&!job.valid()){remove(job);continue;}if(!job.fired&&job.age+1e-8>=NINJA_WARNING_TIME){job.fired=true;job.released=job.execute([...job.target])?.released;}if(job.age>=job.life)remove(job);}sync();},
    sync,
    pending:id=>jobs.some(j=>!j.fired&&j.sourceId===id),
    clear(){for(const job of [...jobs])remove(job);},
    state:()=>jobs.map(j=>({id:j.id,spellId:j.spellId,sourceId:j.sourceId,target:[...j.target],age:j.age,warning:NINJA_WARNING_TIME,visualStyle:'player-guide',borderColor:'red',fired:j.fired,visible:!!j.group,existingWarning:j.existingWarning,shapes:j.shapes})),
    dispose(){this.clear();root.removeFromParent();warnings.dispose();}
  };
}
