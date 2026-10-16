const STORAGE_KEY='anhoa-learned-spells-v1';

// Learning belongs to the player's collection, independently of equipped slots.
// Existing players retain access to all techniques when this record is introduced.
export function readLearnedSpells(spells){
  const valid=new Set(spells.map(s=>s.id));let learned=new Set(valid);
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(Array.isArray(saved))learned=new Set(saved.filter(id=>valid.has(id)));
    localStorage.setItem(STORAGE_KEY,JSON.stringify([...learned]));
  }catch{}
  return learned;
}
