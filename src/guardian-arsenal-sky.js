import {skillTools,arsenalResources} from './guardian-arsenal-patterns.js';
export function updateSkySkill(a,c,dt){
 const s=(a.skillTools??=skillTools(a,c)),{target,at,src,predict,direction,later,mark,hurt,fire,fan,swipe,rush,ring,aimPoints,channel}=s,t=target();if(!t)return false;
 const resources=()=>arsenalResources(c);
 switch(a.type){
 case 'eagle-wing':
  {const d=rush('wing',a.windup,a.damage);if(d?.done&&!d.cut){d.cut=true;c.trail('wind',d.from,d.to,.55,2,{dps:6,src});}}break;
 case 'eagle-grab':
  rush('grab',a.windup,a.damage,{air:.5});at('drop',a.windup+.35,()=>{if(c.distance(c.body,t.pos)<2.2){c.moveTarget(t,c.add(t.pos,c.mul(direction(a.origin,c.body),2)));c.control(t,'air',.5);}});break;
 case 'eagle-fan':
  for(let i=0;i<3;i++)at(i,a.windup+i*.25,()=>fan(5,1.25,predict(t,.25),{style:'windblade',speed:15,piercing:true}));break;
 case 'eagle-turn':
  {const goal=c.fitBody(c.add(c.home,[Math.sin(c.clock)*4,0,0]),'walk'),d=c.dash(a,'turn',goal,a.windup,.3,.5,0);if(d?.done&&!d.wind){d.wind=true;ring(c.body,12,9);c.memory.momentum=Math.max(0,(c.memory.momentum||0)-1);}}break;
 case 'eagle-eye':
  at('eye',a.windup,()=>{const p=predict(t,.35),e=c.entity('storm-eye',p,{r:5,life:4,tick:0});c.circle([0,0,0],5,c.designColor,false,e.root);c.circle([0,0,0],1.6,'#8cf4bd',false,e.root);e.update=step=>{e.root.rotation.y+=step*2;e.tick+=step;if(e.tick>.4){e.tick=0;for(const victim of c.targets){const d=c.distance(victim.pos,e.p);if(d>1.6&&d<5)c.emit(a.damage*.45,victim,{slow:.15,slowTime:.5},src);}}};});break;
 case 'eagle-eight':
  for(let i=0;i<2;i++){const d=rush(i,a.windup+i*.95,a.damage);if(d?.done&&!d.slash){d.slash=true;fan(3,1.3,null,{style:'windblade',speed:13});}}break;
 case 'eagle-triple':
  for(let i=0;i<3;i++){const d=rush(i,a.windup+i*.95,a.damage*(1+Math.min(3,c.memory.momentum||0)*.1));if(d&&a.age<a.windup+i*.95)c.pose.y=3;}
  at('spent',a.duration-.1,()=>{c.memory.momentum=0;c.memory.exposedUntil=c.clock+.8;});break;
 case 'eagle-tempest':
  at('storm',0,()=>{channel('wings');const b=c.attackBounds();for(const x of [b.minX+1,b.maxX-1])c.trail('wind',[x,0,b.minZ],[x,0,b.maxZ],.8,a.duration,{dps:6,src});});
  for(let i=0;i<4;i++)rush(i,a.windup+i*1.1,a.damage*.7);
  at('landing-warning',a.duration-1,()=>{a.land=predict(t,.3);mark(a.land,2.5,.75,()=>{hurt(a.land,2.5,a.damage);ring(a.land,a.damage*.5,10);});});break;
 case 'turtle-stomp':
  at('tell',0,()=>c.circle([c.body[0],0,c.body[2]],2,'#ff8166',false));at('stomp',a.windup,()=>ring(c.body,a.damage,10));break;
 case 'turtle-headbutt':
  {const d=rush('headbutt',a.windup,a.damage);if(d?.done&&!d.rocks){d.rocks=true;for(let i=1;i<=3;i++){const p=c.add(d.from,c.mul(c.sub(d.to,d.from),i/3));mark(p,1,.5,()=>c.object('rock',p,35,.8,5,{solid:true,src}));}}}break;
 case 'turtle-spin':
  {const d=rush('spin',a.windup,a.damage);c.pose.roll=(a.age-a.windup)*6;if(d?.done&&!d.smashed){d.smashed=true;for(const rock of c.all('rock'))if(c.along(rock.p,d.from,d.to)<rock.r+1.5)c.explodeObject(rock,12,5,{src});}}break;
 case 'turtle-rockfall':
  at('tell',0,()=>{channel('head',.08);for(const p of aimPoints(6))mark(p,1.2,a.windup+.35,()=>{if(c.memory.channel?.broken)return;hurt(p,1.2,a.damage);c.object('rock',p,20,.7,4,{solid:true,src});});});break;
 case 'turtle-fissure':
  at('tell',0,()=>{a.from=[...c.body];a.to=predict(t,.35);c.telegraphLine(a.from,a.to,.2,a.windup);});
  at('crack',a.windup,()=>{c.attackLine(a.from,a.to,.9,a.damage,{ground:true},src);for(let i=0;i<4;i++){const p=c.add(a.from,c.mul(c.sub(a.to,a.from),(i+1)/4));later(i*.12,()=>c.flash(p,1));}});break;
 case 'turtle-fortify':
  at('rocks',0,()=>{channel('shell',.12);a.rocks=[];for(const side of [-1,1])for(const z of [-1,1])a.rocks.push(c.object('rock',c.add(c.body,[side*2,0,z*2]),24,.6,3,{src,formingArmor:true}));});
  at('armor',a.duration-.1,()=>{const count=(a.rocks||[]).filter(e=>!e.dead).length;c.gainArmor(c.maxHp*.025*count);for(const e of a.rocks||[])c.destroy(e);});break;
 case 'turtle-collapse':
  at('rise',0,()=>{c.pose.lean=-.25;const p=predict(t,.35);mark(p,2.5,a.windup+.3,()=>hurt(p,2.5,a.damage));});
  at('collapse',a.windup+.3,()=>{ring(c.body,a.damage*.8,11);if((c.memory.brokenLegs||0)>0){c.memory.exposedUntil=c.clock+1.8;c.memory.toppledUntil=c.clock+1.8;c.stun(1.8);}});break;
 case 'turtle-labyrinth':
  at('pillars',a.windup,()=>{a.pillars=[];const safe=t.pos[0];for(const p of aimPoints(7)){if(Math.abs(p[0]-safe)<1.8)p[0]+=p[0]<safe?-2.5:2.5;mark(p,1,.85,()=>a.pillars.push(c.object('rock',p,40,.85,7,{solid:true,src})));}});
  at('fall-warning',a.duration-1.6,()=>{for(const e of a.pillars||[]){if(e.dead)continue;const end=c.add(e.p,c.mul(direction(e.p,predict(t,.3)),5));c.telegraphLine(e.p,end,.2,.9);later(.9,()=>{if(e.dead)return;c.attackLine(e.p,end,.7,a.damage,{},src);c.destroy(e);});}});break;
 case 'gold-double':
  swipe(0,a.windup,5,Math.PI*.8);swipe(1,a.windup+.45,5,Math.PI*.9);at('edge',a.windup+.45,()=>fan(1,.1,null,{style:'goldarc',piercing:true}));break;
 case 'gold-fan':
  at('fan',a.windup,()=>fan(11,1.5,null,{style:'feather',armorPiercing:true,featherLife:8}));break;
 case 'gold-hunt':
  at('homing',a.windup,()=>{for(let i=0;i<4;i++)fire([c.body[0]+(i-1.5)*.3,1.5,c.body[2]],c.sub(predict(t,.25),c.body),{style:'feather',homing:2.3,homingTime:.9,targetId:t.id,featherLife:8});});break;
 case 'gold-reflect':
  at('shield',0,()=>{c.memory.counter={kind:'gold',until:c.clock+a.duration,used:false};const m=c.circle([c.body[0],0,c.body[2]],2,c.designColor,false);m.rotation.x=0;});break;
 case 'gold-recall':
  at('recall-warning',0,()=>{a.feathers=[...resources().feathers];for(const e of a.feathers)c.telegraphLine(e.p,c.body,.12,a.windup);});
  at('recall',a.windup,()=>{for(const e of a.feathers||[]){if(e.dead)continue;fire([e.p[0],1.5,e.p[2]],c.sub([c.body[0],1.5,c.body[2]],e.p),{style:'feather',damage:a.damage,homing:0,piercing:true,life:c.distance(e.p,c.body)/14+.1,featherLife:0});c.destroy(e);}});break;
 case 'gold-spin':
  for(let i=0;i<3;i++)swipe(i,a.windup+i*.35,6,Math.PI*1.7,a.damage*.7);break;
 case 'gold-array':
  at('array',a.windup,()=>{const b=c.attackBounds(),safe=t.pos[0];for(let row=0;row<3;row++){const z=b.minZ+1+row*2;for(let x=b.minX+1;x<b.maxX;x+=2){if(Math.abs(x-safe)<2)continue;const p=[x,1.5,z];c.telegraphLine(p,[x,1.5,b.maxZ],.08,.7+row*.25);later(.7+row*.25,()=>fire(p,[0,0,1],{style:'sword',speed:12}));}}});break;
 case 'gold-pierce':
  rush('pierce',a.windup,a.damage,{armorPiercing:true,armorReduction:.25});break;
 case 'gold-greatsword':
  at('gather',0,()=>{a.countFeathers=resources().feathers.length;for(const e of resources().feathers)c.destroy(e);a.sword=c.entity('greatsword',[c.body[0],5,c.body[2]],{life:a.duration});c.mesh('cone',[0,0,0],[.45,8,.5],c.designColor,.9,a.sword.root);});
  for(let i=0;i<3;i++)at('cut'+i,a.windup+i*1.1,()=>{const from=[...c.body],to=predict(t,.3);c.telegraphLine(from,to,.25,.65);later(.65,()=>c.attackLine(from,to,1,a.damage,{},src));});
  at('rain',a.duration-1.15,()=>{for(const p of aimPoints(Math.min(12,6+Math.floor((a.countFeathers||0)/3))))mark(p,.9,.75,()=>hurt(p,.9,a.damage*.45),'ice');});break;
 default:return false;
 }
 return true;
}
