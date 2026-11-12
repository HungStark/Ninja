export const MIN_QUEST_ITEM_SPACING=12;

// Reserve every quest slot, including collected items, so reloads cannot shuffle
// remaining items into a recently emptied spot.
export function placeQuestTargets(definitions,{limit,heightAt,valid,relocate=null}){
  const positions=new Map(),placed=[];
  for(const entry of definitions){
    const validPlacement=(x,z)=>Math.abs(x)<=limit-3&&Math.abs(z)<=limit-3&&!placed.some(p=>Math.hypot(p.x-x,p.z-z)<MIN_QUEST_ITEM_SPACING)&&valid(x,z,heightAt(x,z),entry);
    let chosen=relocate?.(entry,validPlacement);if(chosen)chosen={...chosen,y:heightAt(chosen.x,chosen.z)};
    for(const radius of chosen?[]:[0,4,8,12,16,22,30,40,54]){
      for(let k=0;k<(radius?48:1);k++){
        const a=k*Math.PI/24,x=entry.x+Math.sin(a)*radius,z=entry.z+Math.cos(a)*radius;
        if(Math.abs(x)>limit-3||Math.abs(z)>limit-3||placed.some(p=>Math.hypot(p.x-x,p.z-z)<MIN_QUEST_ITEM_SPACING))continue;
        const y=heightAt(x,z);if(!Number.isFinite(y)||!valid(x,z,y,entry))continue;
        chosen={x,z,y};break;
      }
      if(chosen)break;
    }
    if(!chosen)throw Error('No safe quest item placement: '+entry.id);
    positions.set(entry.id,chosen);placed.push(chosen);
  }
  return positions;
}
