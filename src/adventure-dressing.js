import * as T from 'three';
import {waterwayAt,riverAt} from './adventure-world.js';

// Small authored clusters fill the edges of inhabited places, keeping roads,
// doors, NPC approaches, guard positions and traversal entrances clear.
export function dressVillage(c,region,rand){
  const {id,land,M,box,cyl,mesh,heightAt}=c,wood=c.surfaces?.wood||M('#6c5a42'),stone=c.surfaces?.stone||M('#8c8371'),cloth=M(id==='nameless'?'#6b6451':c.v.color),clay=M(id==='fire'?'#a86643':'#a68b67'),iron=M('#4d5558'),placed=[];
  const candidates=[];land.traverse(o=>{if(o.userData.footprint){const {x,z,w,d,yaw}=o.userData.footprint;for(const side of [-1,1]){const lx=side*(w/2+1.9),lz=d*.15;candidates.push([x+Math.cos(yaw)*lx+Math.sin(yaw)*lz,z-Math.sin(yaw)*lx+Math.cos(yaw)*lz]);}}});
  for(const zone of region.zones.filter(z=>!z.platform))for(let k=0;k<14;k++){const a=k*2.4,r=zone.radius+3+k%3*2;candidates.push([zone.x+Math.sin(a)*r,zone.z+Math.cos(a)*r]);}
  for(const [x,z] of candidates){
    if(placed.length>=44)break;
    const river=id==='water'?waterwayAt(x,z):riverAt(id,z),distance=id==='water'?river.distance:Math.abs(x-river.x),y=heightAt(x,z);
    if(distance<river.width+2.4||Math.abs(x)>c.limit-4||Math.abs(z)>c.limit-4||c.clearCorridor(x,z,1.35)||c.blocked(x,z)||c.physics.overlaps(x,z,y,2.6,1.45,true)||c.interactives.some(i=>Math.hypot(x-i.x,z-i.z)<4)||placed.some(p=>Math.hypot(x-p.x,z-p.z)<5))continue;
    const slope=Math.max(...[[-1,-1],[-1,1],[1,-1],[1,1]].map(([a,b])=>Math.abs(heightAt(x+a,z+b)-y)));if(slope>.32)continue;
    const g=new T.Group();g.name='village-prop-cluster';g.position.set(x,y,z);g.rotation.y=rand()*Math.PI*2;land.add(g);g.userData.dressing=id;
    const variant=placed.length%3;
    if(id==='nameless'){
      for(let k=0;k<5;k++){const plank=box(g,wood,(rand()-.5)*1.6,.08+k*.035,(rand()-.5)*1.3,.16,.08,.9+rand()*.8);plank.rotation.y=rand()*3;}
      const pot=cyl(g,clay,.6,.28,.3,.24,.55,7);pot.rotation.z=.26;box(g,stone,-.45,.16,-.3,.55,.32,.45);
    }else if(variant===0){
      for(let k=0;k<3;k++){const px=(k%2-.5)*.85,py=.38+Math.floor(k/2)*.75,pz=Math.floor(k/2)*.12;box(g,wood,px,py,pz,.74,.72,.7);for(const side of [-1,1])box(g,iron,px+side*.26,py,pz+.36,.045,.73,.025);}
      const roll=cyl(g,cloth,.6,.25,.7,.22,.65,8);roll.rotation.z=Math.PI/2;
    }else if(variant===1){
      for(const side of [-1,1]){cyl(g,wood,side*.52,.45,0,.36,.9,10);for(const h of [.16,.7])cyl(g,iron,side*.52,h,0,.37,.055,10);cyl(g,clay,side*.52,.925,0,.31,.045,10);}
      const rope=mesh(new T.TorusGeometry(.24,.045,4,12),M('#b3a277'),g,0,.12,.6);rope.rotation.x=Math.PI/2;
    }else{
      for(const side of [-1,1])box(g,wood,side*.65,.65,0,.09,1.3,.09);
      box(g,wood,0,1.25,0,1.55,.1,.12);box(g,cloth,0,.92,.03,1.1,.52,.035).rotation.z=.06;
      for(let k=0;k<3;k++){const pot=cyl(g,clay,-.65+k*.6,.23,.6,.2,.45,9);cyl(g,iron,-.65+k*.6,.46,.6,.13,.018,8);}
    }
    if(id==='water')for(let k=0;k<3;k++){const fish=mesh(new T.OctahedronGeometry(.19),M('#9eafb0'),g,-.45+k*.4,.18,.9);fish.scale.set(1.4,.3,.45);}
    if(id==='fire'){const coal=mesh(new T.DodecahedronGeometry(.35,0),M('#393a37'),g,.8,.22,-.65);coal.scale.y=.6;}
    if(id==='lightning')mesh(new T.OctahedronGeometry(.22),M('#b3a3d0',.12),g,.6,1.03,0);
    if(['wind','wood','light'].includes(id))for(let k=0;k<3;k++)mesh(new T.OctahedronGeometry(.15),M(k%2?'#a9aa6c':'#647b4e'),g,-.65+k*.6,.68,.6).scale.set(.6,1.5,.6);
    placed.push({x,z});
  }
  const summary=new T.Group();summary.name='village-dressing-summary';summary.userData={village:id,clusters:placed.length};land.add(summary);return placed.length;
}
