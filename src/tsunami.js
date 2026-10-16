// Snow and living gardens survive; shadow clones are swept behind the opponent.
export function sweepTsunami(wave,start,end,{actors,walls,fields,dark,wind,light,earth,nature,intersectsWave}){
  const touches=(p,r=0,q=p)=>intersectsWave(p,q,start,end,wave.normal,wave.width,wave.height,r,wave.depth);
  const carry=(element,style,owner,color)=>{wave.carried.push({element,style,owner,color});if(wave.carried.length>24)wave.carried.shift();};
  for(const actor of actors)if(actor.owner!==wave.owner&&touches(actor.pos,.54)){
    const f=actor.fighter;if(f.shield>0||f.reflect>0){carry(f.defenseElement,'armor',actor.owner,f.color);f.shield=f.shieldTime=f.reflect=0;}
  }
  for(const wall of walls){
    if(wall.hp<=0)continue;const across=[-wall.normal[2],0,wall.normal[0]],r=wall.radius||wall.width/2;
    const p=wall.p.map((v,i)=>v-across[i]*r),q=wall.p.map((v,i)=>v+across[i]*r);
    if(touches(p,0,q)){wall.hp=0;carry(wall.element,'wall',wall.owner,'#b2d8df');}
  }
  const opponent=actors.find(a=>a.owner!==wave.owner);
  if(opponent){
    wave.sweptClones??=new Set();
    for(const c of dark.clones)if(c.mode!=='respawning'&&!wave.sweptClones.has(c.id)&&touches([c.p[0],c.hitHeight,c.p[2]],c.hitRadius)){
      wave.sweptClones.add(c.id);dark.carryClone(c,wave,opponent);
    }
  }
  for(const b of [...dark.bindings]){const p=b.elephant.getWorldPosition(b.elephant.position.clone()).toArray();if(touches(p,1)){carry('dark','elephant',b.owner,'#645375');dark.releaseBinding(b);}}
  for(const s of [...wind.spirits])if(touches(s.root.position.toArray(),.8)){carry('wind','spirit',s.owner,'#9fe9ce');s.root.removeFromParent();wind.spirits.splice(wind.spirits.indexOf(s),1);}
  for(const o of [...light.optics])if(touches(o.center,o.radius)){carry('light',o.kind,o.owner,'#fff2bd');light.remove(light.optics,o);}
  for(const p of [...light.pulses])if(!p.ticks&&touches(p.pos,.1)){carry('light','laser',p.owner,'#fff2bd');light.remove(light.pulses,p);}
  for(let i=fields.length-1;i>=0;i--)if(touches(fields[i].p,fields[i].radius)){carry('lightning','field',fields[i].owner,'#c6a2ff');fields.splice(i,1);}
  for(const e of [...earth.effects])if(touches(e.orb||e.center,e.kind==='wall'?0:e.spell.radius||.5)){carry('earth',e.kind,e.owner,'#d9ae69');earth.remove(e,walls);}
  // Remove detached defenses and mist without touching their source plants or snow bank.
  for(const w of [...nature.wood.walnuts])if(touches(w.root.position.toArray(),w.size)){carry('wood','walnut',w.owner,'#ae8252');nature.wood.removeWalnut(w,walls);}
  for(const f of [...nature.fogs])if(touches(f.cover.position.toArray(),2)){nature.iceSupport.dispose(f.root);nature.fogs.splice(nature.fogs.indexOf(f),1);}
  for(const c of [...nature.wood.clouds])if(touches(c.center,c.radius)){nature.wood.dispose(c.root);nature.wood.clouds.splice(nature.wood.clouds.indexOf(c),1);}
}
