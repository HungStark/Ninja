import {skillTools,arsenalResources} from './guardian-arsenal-patterns.js';
export function updateStormSkill(a,c,dt){
 const s=(a.skillTools??=skillTools(a,c)),{at,target,src,predict,direction,later,mark,hurt,fire,fan,swipe,rush,patch,image,ring,aimPoints,channel}=s,t=target();if(!t)return false;
 const resources=()=>arsenalResources(c);
 switch(a.type){
 case 'fox-tail':
  swipe(0,a.windup,5,Math.PI, a.damage);swipe(1,a.windup+.45,7,Math.PI*.3,a.damage*1.2);if(c.distance(c.body,t.pos)<5)swipe(2,a.windup+.95,5,Math.PI*.8,a.damage);break;
 case 'fox-step':
  for(let i=0;i<3;i++){const d=rush(i,a.windup+i*.65);if(d?.done&&!d.burn){d.burn=true;const e=patch('fire',d.to,1.3,4,{dps:3});(a.steps??=[]).push(e);}}
  at('finish',a.duration-.12,()=>{for(const e of a.steps||[])if(!e.dead)mark(e.p,e.r,.55,()=>{hurt(e.p,e.r,a.damage);c.destroy(e);},'flame');});break;
 case 'fox-orbit':
  at('orbit',a.windup,()=>{for(let i=0;i<a.count;i++){const e=c.entity('orbit-fire',[...t.pos],{r:.23,life:4.5,angle:i*Math.PI*2/a.count,triggered:false});c.mesh('orb',[0,0,0],[.23,.23,.23],c.designColor,.8,e.root);e.update=step=>{const victim=c.target(t.id);if(!victim){c.destroy(e);return;}e.angle+=step*2;e.p=c.add(victim.pos,[Math.sin(e.angle)*2.2,.3,Math.cos(e.angle)*2.2]);e.root.position.fromArray(e.p);const fast=Math.hypot(...(victim.velocity||[]))>5.5;if(fast&&!e.triggered){e.triggered=true;c.telegraphLine(e.p,predict(victim,.2),.12,.45);later(.45,()=>{if(!e.dead){fire(e.p,c.sub(predict(victim,.15),e.p),{style:'fireball',homing:0,speed:15});c.destroy(e);}});}};}});break;
 case 'fox-firewalls':
  at('walls',a.windup,()=>{const center=predict(t,.3);for(const side of [-1,1]){const points=Array.from({length:5},(_,i)=>c.fit(c.add(center,[side*(2.9+Math.sin(i*.6)),0,(i-2)*1.1])));for(let i=1;i<points.length;i++){const e=c.trail('fire',points[i-1],points[i],.3,5,{dps:9,src});e.firewall=true;}}});break;
 case 'fox-doubles':
  at('doubles',a.windup,()=>{for(const side of [-1,1]){const e=image(c.add(c.body,[side*2,0,0]),true,5);e.fireClone=true;e.onBroken=()=>patch('fire',e.p,1,3,{dps:5});if(side>0)e.origin=c.fit(c.add(predict(t,.6),[0,0,2]));}});break;
 case 'fox-spiral':
  for(let i=0;i<a.count;i++)at(i,a.windup+i*a.interval,()=>{const theta=i*.52;for(const offset of [0,Math.PI]){const d=[Math.sin(theta+offset),0,Math.cos(theta+offset)];const e=fire([c.body[0],1.4,c.body[2]],d,{style:'fireball',speed:10,homing:0});e.recallable=true;}});break;
 case 'fox-absorb':
  at('absorb',0,()=>{channel('tails');a.consumed=resources().fire.length;for(const e of resources().fire)c.destroy(e);for(const e of c.all('projectile').filter(e=>e.recallable)){e.v=c.unit(c.sub([c.body[0],1.5,c.body[2]],e.p));e.life=Math.min(e.life,e.age+1);e.piercing=true;}a.end=predict(t,.65);c.telegraphLine(c.body,a.end,.3,a.windup);});
  at('breath',a.windup,()=>{if(c.memory.channel?.broken)return;const end=c.add(c.body,c.mul(direction(c.body,a.end),28));c.beam([c.body[0],1.5,c.body[2]],[end[0],1.5,end[2]],.6+Math.min(4,a.consumed)*.12,.6);c.attackLine(c.body,end,.7,a.damage*(1+Math.min(5,a.consumed)*.15),{},src);});break;
 case 'fox-tail-rage':
  at('channel',0,()=>channel('tails'));for(let i=0;i<4;i++){const time=a.windup+i*(i%2?.8:.55);swipe(i,time,8,i%2?Math.PI*.35:Math.PI,a.damage);at('marks'+i,Math.max(0,time-.55),()=>{if(c.memory.channel?.broken)return;const p=predict(t,.2);for(const side of [-1,1])mark(c.add(p,[side*1.2,0,0]),1,.55,()=>hurt(c.add(p,[side*1.2,0,0]),1,a.damage),'flame');});}break;
 case 'fox-suns':
  at('suns',0,()=>{channel('tails',.12);a.suns=[];for(let i=0;i<9;i++){const p=c.fit(c.add(c.body,[Math.sin(i*.7)*3,0,Math.cos(i*.7)*3])),e=c.object('sun',p,18,.5,7,{src});e.root.position.y=3;e.sun=true;a.suns.push(e);const goal=i<2?predict(t,.8):c.randomPoint({radius:1.3});later(.7+i*.45,()=>{if(e.dead)return;c.telegraphLine(e.p,goal,.13,.55);later(.55,()=>{if(e.dead)return;e.p=[...goal];e.root.position.fromArray(e.p);mark(e.p,1.6,.65,()=>{if(e.dead)return;hurt(e.p,1.6,a.damage*.7);patch('fire',e.p,1.3,3,{dps:5});c.destroy(e);},'flame');});});}});
  at('last-breath',a.duration-1.15,()=>{const left=(a.suns||[]).filter(e=>!e.dead);a.power=1+left.length*.12;for(const e of left)c.destroy(e);a.end=predict(t,.45);c.telegraphLine(c.body,a.end,.3,.8);});
  at('final',a.duration-.35,()=>{if(c.memory.channel?.broken)return;const end=c.add(c.body,c.mul(direction(c.body,a.end),32));c.beam([c.body[0],1.5,c.body[2]],[end[0],1.5,end[2]],1,.5);c.attackLine(c.body,end,1.1,a.damage,{},c.source(a));});break;
 case 'dragon-claws':
  swipe(0,a.windup,5,Math.PI*.7);swipe(1,a.windup+.45,5,Math.PI*.8);at('fan',a.windup+.9,()=>fan(5,1.3,null,{style:'waterball',speed:11}));break;
 case 'dragon-roaming-vortex':
  at('vortex',a.windup,()=>{const goal=predict(t,.3),e=c.entity('vortex',goal,{r:1.5,life:5,activeTime:5,centers:new Map(),tick:0,damage:3,pullSpeed:1.5,centerTime:1,controlDuration:.45,growth:1.1,absorbRange:2,src,stored:[]});e.movingVortex=true;e.updateArsenal=step=>{const victim=c.target(t.id);if(victim){const d=c.sub(victim.pos,e.p);e.p=c.add(e.p,c.mul(c.unit(c.flat(d)),step*1.8));e.root.position.fromArray(e.p);}};later(4.7,()=>{if(!e.dead)for(const stored of e.stored)fire([e.p[0],1.5,e.p[2]],direction(e.p,predict(t,.25)),{damage:stored.damage*.5,style:'waterball'});});});break;
 case 'dragon-wave':
  at('wave',a.windup,()=>c.prepareWave({...a,speed:9,waveWidth:18,gapWidth:4.6,radius:.5},t,0));break;
 case 'dragon-tail':
  swipe('tail',a.windup,6.5,Math.PI*1.7,a.damage);at('pool',a.windup+.15,()=>patch('puddle',[...c.body],3,8));break;
 case 'dragon-prison':
  at('tell',0,()=>mark(predict(t,.35),1.5,a.windup,()=>{const victim=target();if(!victim||c.distance(victim.pos,a.prisonPoint)>2)return;const e=c.object('prison',victim.pos,28,1.2,3,{src,victim:t.id});e.root.children.filter(m=>m.isMesh).forEach(m=>{m.material.transparent=true;m.material.opacity=.25;});c.memory.prison=e;e.updateArsenal=()=>{const victim=c.target(e.victim);if(victim){e.p=[...victim.pos];e.root.position.fromArray(e.p);c.status(victim.id).rootTime=.1;}};}));at('point',0,()=>a.prisonPoint=predict(t,.35));break;
 case 'dragon-submerge':
  at('sink',0,()=>{a.from=[...c.body];a.to=predict(t,.5);c.memory.hiddenUntil=c.clock+a.windup;const line=c.telegraphLine(a.from,a.to,.4,a.windup);line.waterTrail=true;});
  if(a.age<a.windup)c.pose.y=-Math.sin(a.age/a.windup*Math.PI)*1.5;
  rush('rise',a.windup,a.damage,{air:.5});at('rise-zone',a.windup+.32,()=>patch('puddle',c.body,2.4,7));break;
 case 'dragon-absorb':
  at('collect',0,()=>{channel('pressure',.1);a.pressure=resources().water.length;c.memory.pressure=a.pressure;for(const e of resources().water)c.destroy(e);a.end=predict(t,.7);c.telegraphLine(c.body,a.end,.3,a.windup);});
  at('pressure',a.windup,()=>{if(c.memory.channel?.broken)return;const d=direction(c.body,a.end),end=c.add(c.body,c.mul(d,36)),mouth=c.mouthPosition,visualEnd=c.add(mouth,c.mul(c.unit(c.sub(a.end,mouth)),Math.min(36,c.distance(mouth,a.end)+2)));visualEnd[1]=Math.max(.4,visualEnd[1]);c.beam(mouth,visualEnd,.7,1);c.attackLine(c.body,end,.8,a.damage*(1+Math.min(5,a.pressure)*.15),{blockable:true},src);});break;
 case 'dragon-sky-ocean':
  at('ocean',0,()=>{channel('pressure',.12);const b=c.attackBounds(),canopy=c.entity('sky-ocean',[(b.minX+b.maxX)/2,9,(b.minZ+b.maxZ)/2],{life:a.duration});c.mesh('box',[0,0,0],[b.maxX-b.minX,.2,b.maxZ-b.minZ],c.designColor,.12,canopy.root);});
  for(let i=0;i<4;i++)at(i,a.windup+i*1.15,()=>{for(const p of aimPoints(3))mark(p,1.5,.9,()=>{hurt(p,1.5,a.damage*.55);patch('puddle',p,1.5,3);});});
  rush('ocean-dive',a.duration-1.2,a.damage);at('ocean-wave',a.duration-.8,()=>c.prepareWave({...a,speed:9,waveWidth:18,gapWidth:4.6,radius:.5},t,1));break;
 case 'wolf-bite':
  {const d=rush('bite',a.windup,a.damage);if(d?.done&&!d.image){d.image=true;image(d.from,false,5);c.status(t.id).markTime=5;}}break;
 case 'wolf-flash':
  {const d=rush('flash',a.windup,0);if(d?.done&&!d.image){d.image=true;image(d.from,false,5);image(d.to,false,5);}}break;
 case 'wolf-claws':
  for(let i=0;i<3;i++)swipe(i,a.windup+i*.35,5,i===2?Math.PI:Math.PI*.55);break;
 case 'wolf-swap':
  at('swap-warning',0,()=>{a.image=resources().images.sort((x,y)=>c.distance(x.p,t.pos)-c.distance(y.p,t.pos))[0];if(a.image)c.telegraphLine(a.image.p,predict(t,.3),.2,a.windup);});
  at('swap',a.windup,()=>{if(!a.image||a.image.dead)return;const old=[...c.body];c.teleport(a.image.p);a.image.p=old;a.image.root.position.fromArray(old);hurt(c.body,2,a.damage);});break;
 case 'wolf-plunge':
  rush('plunge',a.windup,a.damage);at('ring',a.windup+.32,()=>ring(c.body,a.damage*.7,11));break;
 case 'wolf-counter':
  at('stance',0,()=>{c.memory.counter={kind:'wolf',until:c.clock+a.duration,hp:18,used:false};c.pose.lean=.15;});break;
 case 'wolf-hunt':
  for(let i=0;i<3;i++){const marked=c.aimTargets.filter(o=>c.status(o.id).markTime>0);if(marked.length)a.targetId=marked[i%marked.length].id;const d=rush(i,a.windup+i*.7,a.damage*.7);if(d?.done&&!d.image){d.image=true;image(d.from,false,5);image(d.to,false,5);}}break;
 case 'wolf-net':
  at('net',a.windup,()=>{const imgs=resources().images;for(let i=1;i<imgs.length;i++){const from=[...imgs[i-1].p],to=[...imgs[i].p];c.telegraphLine(from,to,.15,.65);later(.65,()=>c.trail('electric',from,to,.35,2,{dps:10,src}));}});break;
 case 'wolf-zigzag':
  for(let i=0;i<3;i++){const d=rush(i,a.windup+i*.7);if(d?.done&&!d.image){d.image=true;image(d.to,false,5);}}break;
 case 'wolf-incarnate':
  at('images',0,()=>{if(resources().images.length<3)for(const side of [-1,1])image(c.add(c.body,[side*3,0,1]),false,7);});
  for(let i=0;i<5;i++){const imgs=resources().images;if(imgs.length){const goal=imgs[i%imgs.length].p;const d=c.dash(a,i,goal,a.windup+i*.9,.25,1.1,a.damage*.7);if(d?.done)c.pose.lean=-.35;}}
  at('net-warning',a.duration-.95,()=>{a.center=predict(t,.4);for(const e of resources().images)c.telegraphLine(e.p,a.center,.18,.7);});
  at('net-final',a.duration-.25,()=>{for(const e of resources().images){c.attackLine(e.p,a.center,.45,a.damage*.55,{},src);c.destroy(e);}c.memory.exposedUntil=c.clock+1.1;});break;
 default:return false;
 }
 return true;
}
