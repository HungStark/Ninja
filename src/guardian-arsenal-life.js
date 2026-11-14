import {skillTools,arsenalResources} from './guardian-arsenal-patterns.js';
export function updateLifeSkill(a,c,dt){
 const s=(a.skillTools??=skillTools(a,c)),{target,at,src,predict,direction,later,mark,hurt,fan,swipe,rush,patch,image,plant,ice,ring,aimPoints,channel}=s,t=target();if(!t)return false;
 const resources=()=>arsenalResources(c);
 switch(a.type){
 case 'shadow-bite':
  {const d=rush('bite',a.windup,a.damage);if(d?.done&&!d.marked){d.marked=true;c.status(t.id).markTime=6;(c.memory.replays??=[]).push({from:d.from,to:d.to,damage:a.damage,at:c.clock});}}break;
 case 'shadow-step':
  at('shadow',0,()=>{c.memory.hiddenUntil=c.clock+a.windup;patch('dark',c.body,2,4,{slow:.1});});rush('step',a.windup,0);break;
 case 'shadow-illusions':
  at('illusions',a.windup,()=>{for(let i=0;i<3;i++){const e=image(c.add(c.body,[Math.sin(i*2.1)*2.5,0,Math.cos(i*2.1)*2.5]),i===0,5);e.illusion=true;if(i===2){e.real=true;e.damage=a.damage*.2;}}});break;
 case 'shadow-claws':
  for(let i=0;i<3;i++)swipe(i,a.windup+i*.4,5,i===2?Math.PI:Math.PI*.6);
  at('tear',a.windup+.8,()=>{const from=[...c.body],to=predict(t,.25);c.trail('dark',from,to,.5,3,{dps:5,slow:.1,src});(c.memory.replays??=[]).push({from,to,damage:a.damage*.6,at:c.clock});});break;
 case 'shadow-swap':
  at('tell',0,()=>{a.image=resources().images.sort((x,y)=>c.distance(x.p,t.pos)-c.distance(y.p,t.pos))[0];if(a.image)c.telegraphLine(a.image.p,predict(t,.3),.16,a.windup);});
  at('swap',a.windup,()=>{if(!a.image||a.image.dead)return;const old=[...c.body];c.teleport(a.image.p);a.image.p=old;a.image.root.position.fromArray(old);hurt(c.body,1.8,a.damage*.7);});break;
 case 'shadow-replay':
  at('replays',a.windup,()=>{const log=(c.memory.replays||[]).filter(e=>c.clock-e.at<7).slice(-3);for(const [i,e]of log.entries()){c.telegraphLine(e.from,e.to,.18,.6+i*.15);later(.6+i*.15,()=>c.attackLine(e.from,e.to,.6,e.damage*.65,{},src));}});break;
 case 'shadow-stalk':
  at('mark',0,()=>{c.status(t.id).markTime=6;c.memory.hiddenUntil=c.clock+.5;const v=c.unit(t.velocity||[0,0,1]);a.behind=c.fit(c.sub(predict(t,.35),c.mul(v,2)));});
  {const d=c.dash(a,'stalk',a.behind,a.windup,.3,1,a.damage);if(d?.done)c.reveal(.6);}break;
 case 'shadow-counter':
  at('stance',0,()=>c.memory.counter={kind:'shadow',until:c.clock+a.duration,used:false});break;
 case 'shadow-night':
  at('night',0,()=>{c.memory.nightUntil=c.clock+a.duration;patch('dark',t.pos,7,a.duration,{slow:.1});for(let i=0;i<4;i++){const e=image(c.add(c.body,[Math.sin(i*1.57)*3,0,Math.cos(i*1.57)*3]),false,a.duration);e.illusion=true;}});
  for(let i=0;i<4;i++){at('true-tell'+i,a.windup+i*1.1-.45,()=>{c.memory.trueTellUntil=c.clock+.55;c.reveal(.65);});rush(i,a.windup+i*1.1,a.damage*.7);}
  at('rest',a.duration-.1,()=>c.memory.exposedUntil=c.clock+1);break;
 case 'stag-charge':
  {const d=rush('antlers',a.windup,a.damage);if(d?.done&&!d.seeds){d.seeds=true;for(let i=1;i<=3;i++)plant('grass',c.add(d.from,c.mul(c.sub(d.to,d.from),i/4)),20,9);}}break;
 case 'stag-chase-vines':
  at('vines',a.windup,()=>{for(let i=0;i<2;i++){const p=c.fit(c.add(predict(t,.4),[(i?1:-1)*3,0,-1])),e=c.entity('chasing-vine',p,{life:3,r:.45,src});c.mesh('cone',[0,.3,0],[.3,.6,.3],c.designColor,.8,e.root);e.update=step=>{const victim=c.target(t.id);if(!victim)return;const goal=predict(victim,.15),d=c.sub(goal,e.p);e.p=c.add(e.p,c.mul(c.unit(c.flat(d)),step*3));e.root.position.fromArray(e.p);if(c.distance(e.p,victim.pos)<.8){mark(e.p,1,.45,()=>{const live=c.target(t.id);if(live&&c.distance(live.pos,e.p)<1.4){c.emit(a.damage,live,{root:.8},src);}c.destroy(e);},'vine');e.update=null;}};}});break;
 case 'stag-bloom':
  at('flowers',a.windup,()=>{for(const p of aimPoints(4))plant('flower',p,24,8);});break;
 case 'stag-transfer':
  at('channel',0,()=>{channel('grove');a.plants=resources().plants;for(const e of a.plants)c.telegraphLine(c.body,e.p,.06,a.duration);});
  at('transfer',a.windup,()=>{if(c.memory.channel?.broken)return;if(c.fighter.hp<c.maxHp*.55){for(const e of a.plants||[])if(!e.dead){c.fighter.hp=Math.min(c.maxHp,c.fighter.hp+c.maxHp*.025);c.destroy(e);}}else for(const e of a.plants||[])if(!e.dead){e.age+=2;e.growth=1;e.hp=e.maxHp;}});break;
 case 'stag-trunk':
  at('trunks',a.windup,()=>{for(const p of aimPoints(3))mark(p,1,.7,()=>{hurt(p,1,a.damage,{air:.5});plant('ironwood',p,45,9);},'vine');});break;
 case 'stag-leaves':
  for(let i=0;i<3;i++)at(i,a.windup+i*.25,()=>fan(5,1.1,predict(t,.35),{style:'seed',speed:13,piercing:true}));break;
 case 'stag-awaken':
  at('awaken',a.windup,()=>{const old=resources().plants.filter(e=>e.plant==='ironwood'||e.plant==='worldtree').slice(0,2);for(const e of old){const p=[...e.p];c.destroy(e);const tree=plant('treant',p,55,7);tree.update=step=>{const victim=c.target(t.id);if(!victim)return;tree.p=c.fit(c.add(tree.p,c.mul(direction(tree.p,victim.pos),step*2.2)));tree.root.position.fromArray(tree.p);tree.root.rotation.y=c.angle(tree.p,victim.pos);tree.tick=(tree.tick||0)+step;if(tree.tick>1.6){tree.tick=0;const from=[...tree.p],to=predict(victim,.2);c.telegraphLine(from,to,.12,.6);later(.6,()=>c.attackLine(from,to,.7,a.damage,{},src));}};}});break;
 case 'stag-sacrifice':
  at('sacrifice-warning',0,()=>{channel('grove');a.plants=[...resources().plants];for(const e of a.plants)mark(e.p,2,a.windup,()=>{if(e.dead||c.memory.channel?.broken)return;hurt(e.p,2,a.damage);c.destroy(e);});});
  at('heal',a.windup,()=>{if(!c.memory.channel?.broken)c.fighter.hp=Math.min(c.maxHp,c.fighter.hp+c.maxHp*.012*(a.plants||[]).filter(e=>!e.dead).length);});break;
 case 'stag-worldtree':
  at('worldtree',a.windup,()=>{const b=c.attackBounds(),p=[(b.minX+b.maxX)/2,0,(b.minZ+b.maxZ)/2];a.tree=plant('worldtree',p,110,8);a.roots=[];for(const side of [-1,1])for(const z of [-1,1]){const root=plant('ironwood',c.fit(c.add(p,[side*3,0,z*2.5])),28,7);root.mainRoot=true;a.roots.push(root);c.telegraphLine(p,root.p,.12,7);}});
  for(let i=0;i<4;i++)at('growth'+i,a.windup+.7+i*1.1,()=>{if(!a.tree||a.tree.dead)return;if((a.roots||[]).filter(e=>!e.dead).length<2){c.destroy(a.tree);c.stun(1.4);c.memory.exposedUntil=c.clock+1.4;return;}for(const p of aimPoints(2)){mark(p,1.1,.75,()=>hurt(p,1.1,a.damage*.5),'vine');plant(i%2?'flower':'grass',p,20,5);}});break;
 case 'tiger-swipes':
  for(let i=0;i<2;i++){swipe(i,a.windup+i*.45,5,Math.PI*.8);at('ice'+i,a.windup+i*.45,()=>ice(c.add(c.body,c.mul(direction(c.body,t.pos),2)),1.6,6));}break;
 case 'tiger-bite':
  {const d=rush('bite',a.windup,a.damage);if(d?.done&&!d.frost){d.frost=true;ice(d.to,1.5,6);}}break;
 case 'tiger-pounce':
  rush('pounce',a.windup,a.damage);at('land',a.windup+.32,()=>{ice(c.body,2.3,7);ring(c.body,12,8);});break;
 case 'tiger-slide':
  {const d=rush('slide',a.windup,a.damage);if(d?.done&&!d.ice){d.ice=true;for(let i=0;i<3;i++)ice(c.add(d.from,c.mul(c.sub(d.to,d.from),i/3)),1.3,6);}}break;
 case 'tiger-groundspikes':
  at('spikes',a.windup,()=>{for(const p of aimPoints(5))mark(p,.8,.8,()=>{hurt(p,.8,a.damage);c.object('ice-spike',p,30,.7,5,{solid:true,src});},'ice');});break;
 case 'tiger-mirrors':
  at('mirrors',a.windup,()=>{for(const side of [-1,1]){const p=c.fitBody(c.add(c.home,[side*4,0,1]),'walk'),e=c.object('ice-spike',p,24,.65,7,{mirror:true,src});e.root.scale.set(1,1.4,.25);}});break;
 case 'tiger-roar':
  at('roar',a.windup,()=>{ring(c.body,a.damage,10);for(const victim of c.targets)if(c.status(victim.id).stacks>0&&c.distance(victim.pos,c.body)<8)c.applySlow(victim,.3,1.3);});break;
 case 'tiger-shatter':
  at('shatter-tell',0,()=>{a.ice=[...resources().ice];for(const e of a.ice)mark(e.p,e.r+.5,a.windup,()=>{if(e.dead)return;c.explodeObject(e,a.damage*.45,5,{speed:10,style:'ice-shard',src});},'ice');});break;
 case 'tiger-rampage':
  for(let i=0;i<3;i++){at('mirror-'+i,Math.max(0,a.windup+i*.9-.45),()=>{const mirrors=c.all('ice-spike').filter(e=>e.mirror);if(mirrors.length)c.teleport(mirrors[i%mirrors.length].p);});const slowed=c.aimTargets.filter(o=>c.status(o.id).slowTime>0||c.status(o.id).stacks>0);if(slowed.length)a.targetId=slowed[i%slowed.length].id;rush(i,a.windup+i*.9,a.damage*.8);}break;
 case 'tiger-everwinter':
  at('winter',0,()=>{for(const p of aimPoints(5))ice(p,2,8);for(const side of [-1,1])c.object('ice-spike',c.fitBody(c.add(c.home,[side*4,0,0]),'walk'),24,.7,7,{mirror:true,src});});
  for(let i=0;i<3;i++){at('mirror-'+i,Math.max(0,a.windup+i*1.05-.45),()=>{const mirrors=c.all('ice-spike').filter(e=>e.mirror);if(mirrors.length)c.teleport(mirrors[i%mirrors.length].p);});rush(i,a.windup+i*1.05,a.damage*.6);}
  at('last-ice',a.duration-1.8,()=>{a.final=predict(t,.45);mark(a.final,2.3,.9,()=>hurt(a.final,2.3,a.damage),'ice');for(const e of resources().ice)mark(e.p,e.r,.9,()=>{if(!e.dead)c.explodeObject(e,12,4,{speed:9,style:'ice-shard',src});},'ice');});
  at('last-leap',a.duration-1.3,()=>c.telegraphLine(c.body,a.final,.2,.45));rush('last',a.duration-.85,a.damage*.5);break;
 default:return false;
 }
 return true;
}
