// Observe the actual effect objects, so summoned creatures sound when they
// attack and textures stop as soon as their associated effects disappear.
export function createSpellSoundscape({cue,textures,attached=()=>{},repeating=()=>{}}){
 let seen=new WeakMap();
 function update(scene){
  if(!scene){textures(new Map());attached(new Map());repeating(new Map());return;}
  const repeats=new Map(),clips=new Map(),layers=new Map(),add=(type,level=1)=>layers.set(type,Math.max(layers.get(type)||0,level));
  const level=actor=>actor.owner==='player'?1:.65;
  for(const s of scene.shots||[]){
   if(s.life<=0||s.consumedByDefense)continue;
   const power=level(s);
   if(s.style==='bird'&&s.phase==='flying')clips.set(s,{type:'bird-cry',level:power,duration:s.life});
   if(s.style==='thunder'&&s.hitTarget&&s.age<s.totalTime)clips.set(s,{type:'thunder-strike',level:power,duration:s.totalTime-s.age});
   if(s.style==='jacob'&&s.age>=s.strikeTime&&s.age<s.totalTime)clips.set(s,{type:'holy-stair-laser',level:power,duration:s.totalTime-s.age});
   if(s.style==='tsunami')add('tsunami-roar',power);
   if(s.style==='bambooleaf'&&s.phase==='flying')add('bamboo-swoosh',power);
   if(s.element==='wind')add('wind-howl',power);
  }
  for(const w of scene.walls||[])if(w.hp>0&&w.life>0&&w.element==='wind')add('wind-howl',level(w));
  for(const c of scene.clones||[]){
   const before=seen.get(c),charging=['windup','charging'].includes(c.mode);
   if(charging&&!before?.charging)cue(c.form==='bull'?'shadow-bull':'shadow-dog',level(c));
   seen.set(c,{form:c.form,charging});
  }
  for(const s of scene.spirits||[]){
   if(s.life<=0)continue;
   clips.set(s,{type:'spirit-song',level:level(s),duration:s.life,loop:true});add('wind-howl',level(s)*.65);
  }
  for(const b of scene.bindings||[]){if(!seen.has(b)){cue('shadow-elephant',level(b));seen.set(b,{});}}
  for(const s of scene.snow||[])if(!s.consumed)add('snowstorm-wind',level(s));
  for(const b of scene.snowballs||[])if(b.phase==='gathering')add('snowstorm-wind',level(b));
  for(const e of scene.earth||[]){
   if(e.life<=0)continue;
   const duration=e.kind==='quake'?Math.min(e.life,e.spell.duration-e.age):e.life;
   if(duration<=0)continue;
   clips.set(e,{type:e.kind==='gravity'?'earth-cinematic':'earth-heavy-rock',level:level(e),duration,loop:['gravity','quake'].includes(e.kind)});
  }
  for(const p of scene.lightPulses||[])if(p.ticks>0&&p.age<p.spell.chargeTime+.32)clips.set(p,{type:'light-laser',level:level(p),duration:p.spell.chargeTime+.32-p.age});
  for(const dome of scene.optics||[])if(dome.kind==='dome'&&dome.life>0&&dome.rays.some(ray=>ray.path.length>0))repeats.set(dome,{level:level(dome),age:dome.age,duration:dome.life});
  textures(layers);
  attached(clips);
  repeating(repeats);
 }
 return {update,reset(){seen=new WeakMap();textures(new Map());attached(new Map());repeating(new Map());}};
}
