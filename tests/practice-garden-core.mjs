import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {NatureArts} from '../src/nature-arts.js';
import {practiceMovementBounds,createPracticeOverhead,practiceSpellNeedsAim} from '../src/practice-overhead.js';
const {spells,Fighter}=SealGameCore,spell=spells.find(s=>s.style==='woodseed');
const gardenBounds=owner=>({own:practiceMovementBounds(owner,0),opponent:practiceMovementBounds(owner==='player'?'enemy':'player',0)});
const actors=[{owner:'player',pos:[12,1.72,2],height:4.5,fighter:new Fighter(1000)},{owner:'enemy',pos:[-13,1.72,-14.5],height:4.5,fighter:new Fighter(1000)}];
for(const owner of ['player','enemy']){
  let layout;
  for(const dir of [[1,0,0],[-1,0,0]]){
    const arts=new NatureArts(new T.Scene(),()=>0,{},()=>null,8,{gardenBounds}),source=actors.find(a=>a.owner===owner);
    assert.equal(arts.cast(owner,spell,source.pos,dir,actors,[],[]),true);const g=arts.tree(owner);assert.equal(g.plants.length,37);
    const positions=g.plants.map(p=>[...p.p]);if(layout)assert.deepEqual(positions,layout,'forest placement does not depend on the aiming direction');else layout=positions;
    const foreground=g.plants.filter(p=>p.foreground),background=g.plants.filter(p=>p.kind!=='walnut'&&!p.foreground),axis=owner==='player'?-1:1;
    const mean=(list,fn)=>list.reduce((sum,p)=>sum+fn(p),0)/list.length;
    assert.ok(mean(foreground,p=>p.p[2]*axis)<mean(background,p=>p.p[2]*axis));assert.ok(mean(foreground,p=>p.height)<mean(background,p=>p.height),'small plants are in front, tall plants behind');
    for(const time of [60,60.5,61]){
      g.age=time;arts.wood.visuals(actors);g.root.updateMatrixWorld(true);
      for(const p of g.plants){const b=p.kind==='walnut'?gardenBounds(owner).own:gardenBounds(owner).opponent,box=new T.Box3().setFromObject(p.model);assert.ok(box.min.x>=b.minX-1e-6&&box.max.x<=b.maxX+1e-6&&box.min.z>=b.minZ-1e-6&&box.max.z<=b.maxZ+1e-6,JSON.stringify({owner,time,kind:p.kind,position:p.p,height:p.height,box:{min:box.min.toArray(),max:box.max.toArray()},bounds:b}));}
    }
    const walnut=g.plants.find(p=>p.kind==='walnut'),b=gardenBounds(owner).own;assert.ok(owner==='player'?walnut.p[0]>(b.minX+b.maxX)/2&&walnut.p[2]>(b.minZ+b.maxZ)/2:walnut.p[0]<(b.minX+b.maxX)/2&&walnut.p[2]<(b.minZ+b.maxZ)/2,'walnut uses a rear corner of the caster side');arts.reset();
  }
}
const view=createPracticeOverhead(new T.Scene()),config={enabled:true,active:true,available:true,position:[0,1.72,7],target:[0,0,-24],heightAt:()=>0};
for(const style of ['woodseed','ignite','discharge','aircombo','earthcraterspikes','waterbubbles','vinebind','shadowclone','domain','shadowdive','flowerpoison','snowstorm','blizzard','snowball','icefog']){
  assert.equal(practiceSpellNeedsAim({style}),false);view.update({...config,spell:{style}});assert.equal(view.state().preview,null);assert.equal(view.state().visible,false);
}
for(const style of ['volley','windslash','meteor','earthgravity','earthquake','lightdome','bamboostab','shadowcommand','walnutwall']){view.update({...config,spell:{style}});assert.ok(view.state().preview,'aimed skills retain their preview');}
console.log('PASS: automatic garden, both owners, direction-independent layout, small-front/tall-back ordering, mature crowns within enemy side, own-corner walnut and automatic-vs-aimed spell previews.');
