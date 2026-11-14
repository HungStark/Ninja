const dist=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export function createGuardianCombatDirector(){
 let nextSense=0,observed=[],chain=0,last=null,reason='opening',targetId=null;
 return {
  reset(){nextSense=chain=0;observed=[];last=null;reason='opening';targetId=null;},
  observe(clock,targets){if(clock<nextSense)return;nextSense=clock+.24;observed=targets.filter(t=>!t.untargetable&&!(t.fighter?.hp<=0)).map(t=>({...t,pos:[...t.pos],velocity:[...(t.velocity||[0,0,0])]}));},
  target(body){if(!observed.length)return null;const ranked=observed.map(t=>({t,score:dist(body,t.pos)-((t.fighter?.hp||1)/(t.fighter?.maxHp||1)<.3?5:0)})).sort((a,b)=>a.score-b.score),held=ranked.find(x=>x.t.id===targetId);targetId=held&&held.score<ranked[0].score+4?held.t.id:ranked[0].t.id;return ranked.find(x=>x.t.id===targetId).t;},
  select({design,available,stage,body,resources,random,blocked,incoming}){
   const t=this.target(body);if(!t)return null;const distance=dist(body,t.pos),cluster=observed.filter(o=>dist(o.pos,t.pos)<4).length,fast=Math.hypot(...t.velocity)>5;
   const ready=available.filter(i=>{const s=design.skills[i];if(s.unlock>stage)return false;const type=s.type;
    if(/swap|net|incarnate/.test(type)&&!resources.images)return false;
    if(/recall|greatsword/.test(type)&&!resources.feathers)return false;
    if(/absorb/.test(type)&&!resources.zones)return false;
    if(/transfer|sacrifice|awaken/.test(type)&&!resources.plants)return false;
    if(/slide|shatter|rampage/.test(type)&&!resources.ice)return false;
    return true;
   });
   if(!ready.length)return null;
   const scored=ready.map(i=>{const s=design.skills[i];let score=random()*.8;
    if(s.role==='melee')score+=distance<6?5:-10;
    if(s.role==='pursuit')score+=distance>8||blocked>0.3?5:1;
    if(s.role==='ranged')score+=distance>6?3:1;
    if(s.role==='control')score+=fast||cluster>1?4:2;
    if(s.role==='setup')score+=resources.count<5?3.2:1;
    if(s.role==='resource')score+=resources.count>3?5:-2;
    if(s.role==='defense')score+=incoming?4:-4;
    if(s.role==='finisher')score+=chain>=2||cluster>1?5:1;
    if(s.role==='ultimate')score+=stage===3&&chain===0?7:-6;
    if(last?.index===i)score-=4;
    if(last?.hit===false&&s.role==='pursuit'&&distance>8)score+=2;
    return {i,score};
   }).sort((a,b)=>b.score-a.score);
   reason=blocked>.3?'fence-pursuit':fast?'cut-off-movement':cluster>1?'cluster':incoming?'incoming-pressure':distance<6?'close-combat':'ranged-pressure';
   return scored[0].i;
  },
  finish(action,hit){last={index:action.index,hit};chain++;const end=chain>=3||['finisher','ultimate'].includes(action.role)||(action.role==='melee'&&!hit);if(end)chain=0;return {end,recovery:end?.9:.2};},
  state:()=>({reactionDelay:.24,targetId,chain,reason,observed:observed.map(t=>({id:t.id,position:[...t.pos]}))})
 };
}
