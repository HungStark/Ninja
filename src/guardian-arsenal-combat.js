import {createGuardianBossCombat} from './guardian-moba-combat.js';
import {GUARDIAN_ARSENAL_DESIGNS} from './guardian-arsenal-data.js';
import {createGuardianCombatDirector} from './guardian-combat-director.js';
import {updateStormSkill} from './guardian-arsenal-storm.js';
import {updateSkySkill} from './guardian-arsenal-sky.js';
import {updateLifeSkill} from './guardian-arsenal-life.js';
import {arsenalResources} from './guardian-arsenal-patterns.js';

function updateSkill(a,c,dt){
 if(!updateStormSkill(a,c,dt)&&!updateSkySkill(a,c,dt)&&!updateLifeSkill(a,c,dt))throw Error('Missing guardian skill: '+a.type);
}
function tick(c,dt){
 const m=c.memory,r=arsenalResources(c);m.replays=(m.replays||[]).filter(e=>c.clock-e.at<7).slice(-6);
 for(const e of [...c.all('vortex'),...c.all('prison')])if(e.updateArsenal&&!e.dead)e.updateArsenal(dt);
 if(m.prison?.dead)m.prison=null;
 if(m.prison)for(const vortex of c.all('vortex'))if(c.distance(vortex.p,m.prison.p)<vortex.r){const e=m.prison,t=c.target(e.victim);e.p=c.add(vortex.p,[Math.sin(c.clock*3)*vortex.r,1.5,Math.cos(c.clock*3)*vortex.r]);e.root.position.fromArray(e.p);if(t)c.moveTarget(t,e.p);}
 for(const e of r.plants){const maturity=e.age>2?1:0;if(maturity&&!e.growth){e.growth=1;e.root.scale.multiplyScalar(1.2);e.damage=(e.damage||0)*1.2;}}
 if(c.id==='wind')m.momentum=Math.min(5,(m.momentum||0)+dt*(c.action?.role==='pursuit'?1:.15));
 if(c.id==='ice'){
  const onIce=r.ice.some(e=>c.distance(e.p,c.body)<e.r);if(onIce)m.iceSpeed=1.4;else m.iceSpeed=1;
  m.drift??={};for(const t of c.targets){const icy=r.ice.some(e=>c.distance(e.p,t.pos)<e.r),old=m.drift[t.id]||[0,0,0],v=t.velocity||[0,0,0];let drift=old.map((x,i)=>(x*Math.exp(-dt*5)+(v[i]-x)*dt*2)*(icy?1:0));const speed=Math.hypot(...drift);if(speed>1.3)drift=drift.map(x=>x/speed*1.3);m.drift[t.id]=drift;if(icy)c.moveTarget(t,c.add(t.pos,c.mul(drift,dt)));}
 }
 m.summary={realm:c.id==='water'?(/absorb|sky-ocean/.test(c.action?.type)?'abyss':/claws|tail|submerge/.test(c.action?.type)?'dragon':'water'):null,stage:c.stage,pressure:m.pressure||0,momentum:Math.round((m.momentum||0)*10)/10,tailGroupsDisabled:(m.disabledGroups||[]).filter(until=>until>c.clock).length,afterimages:r.images.length,feathers:r.feathers.length,plants:r.plants.length,ice:r.ice.length,brokenLegs:m.brokenLegs||0,toppled:(m.toppledUntil||0)>c.clock,trueTell:(m.trueTellUntil||0)>c.clock,counter:m.counter&&m.counter.until>c.clock?m.counter.kind:null};
}
function defense(c,shot){
 if(!shot)return null;
 const m=c.memory,part=shot?.guardianPart||'',counter=m.counter,dir=shot?.v||[0,0,0],yaw=c.pose.yaw||0,front=dir[0]*Math.sin(yaw)+dir[2]*Math.cos(yaw)<-.2;
 if((m.exposedUntil||0)>c.clock)return {multiplier:c.id==='earth'?2:1.5,reflect:0};
 if(counter&&counter.until>c.clock&&!counter.used){
  if(!front){counter.used=true;c.interrupt(.7);return {multiplier:1.25,reflect:0};}
  if(counter.kind==='gold')return {multiplier:.3,reflect:.45};
  counter.used=true;const type=counter.kind==='wolf'?'wolf-bite':'shadow-stalk';c.forceSkill(type,c.targets[0]?.id);return {multiplier:.15,reflect:0};
 }
 if(c.id==='earth'&&/shell|scute/.test(part))return {multiplier:.12,reflect:0};
 return null;
}
function onDamage(c,amount,shot){
 if(!(amount>0))return;const m=c.memory,part=shot?.guardianPart||'';
 const validChannel=m.channel?.kind==='pressure'?/underbelly|belly-scale|chest/.test(part):m.channel?.kind==='head'?/head|skull|muzzle|beak|nose/.test(part):true;if(m.channel&&validChannel&&m.channel.until>c.clock&&!m.channel.broken){m.channel.hp-=amount;if(m.channel.hp<=0){m.channel.broken=true;if(c.id==='fire'){m.disabledGroups??=[0,0,0];m.disabledGroups[c.action?.index%3||0]=c.clock+5;}c.interrupt(1.2);}}
 if(c.id==='earth'&&part.startsWith('leg-')){
  m.parts??={};m.parts[part]=(m.parts[part]||0)+amount;const broken=Object.entries(m.parts).filter(([,damage])=>damage>=c.maxHp*.09);m.brokenLegs=broken.length;
  const left=broken.filter(([name])=>name.endsWith('left')).length,right=broken.filter(([name])=>name.endsWith('right')).length;
  if((left>=2||right>=2)&&!(m.toppledUntil>c.clock)){m.toppledUntil=c.clock+2.2;c.interrupt(2.2);}
 }
 if(c.id==='wind'&&/wing|feather/.test(part)&&c.action?.role==='pursuit'){m.wingDamage=(m.wingDamage||0)+amount;if(m.wingDamage>c.maxHp*.07){m.wingDamage=0;m.momentum=0;c.interrupt(1.5);}}
}
function intercept(c,shot){
 for(const e of c.all('vortex'))if(e.movingVortex&&e.stored.length<8&&c.along(e.p,shot.old,shot.p)<e.r+(shot.size||.1)){e.stored.push({damage:shot.damage});c.flash(e.p,.4);return true;}
 return false;
}
export function createGuardianArsenalCombat(scene){return createGuardianBossCombat(scene,{designs:GUARDIAN_ARSENAL_DESIGNS,createDirector:createGuardianCombatDirector,updateSkill,tick,defense,onDamage,intercept,hidden:c=>(c.memory.hiddenUntil||0)>c.clock,breakPrison(c,damage){const e=c.memory.prison;if(!e||e.dead)return false;e.hp-=damage;c.flash(e.p,.3);if(e.hp<=0){c.destroy(e);c.memory.prison=null;}return true;}});}
