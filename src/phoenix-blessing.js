export const companionSacrificed=save=>save.story?.companion?.sacrificed===true;
export const phoenixBattle=encounter=>encounter?.kind==='village-event'&&encounter.storyBoss&&encounter.storyBattle==='crescent-gatekeeper'&&encounter.village==='dark';
export function sacrificeForHero(save,encounter){
  const c=save.story?.companion;
  if(!phoenixBattle(encounter)||!c?.recruited||c.phase==='separated'||c.sacrificed)return false;
  c.sacrificed=true;c.hp=0;c.treatmentSeconds=0;c.phase='sacrificed';
  save.story.phoenixRevealed=true;save.story.ending='bad';return true;
}
export const storyEnding=save=>companionSacrificed(save)?'bad':'true';
export const endingEvent=(save,event)=>companionSacrificed(save)&&event?.badEnding?{...event,...event.badEnding}:event;
