import {createGuardianBossCombat as createLegacy} from './guardian-legacy-combat.js';
import {createGuardianBossCombat as createThirdPerson} from './guardian-moba-combat.js';
// A mode is selected only at encounter reset; a phase cannot silently switch rules.
export function createGuardianBossCombat(scene){
 const legacy=createLegacy(scene),third=createThirdPerson(scene);let current=legacy;
 return {
  reset(id,phase=2,thirdPerson=false){legacy.clear();third.clear();current=thirdPerson?third:legacy;current.reset(id,phase);},
  clear(){legacy.clear();third.clear();},
  trigger:(...args)=>current.trigger(...args),update:(...args)=>current.update(...args),
  defense:(...args)=>current.defense(...args),onDamage:(...args)=>current.onDamage(...args),
  slowAt:(...args)=>current.slowAt(...args),hidden:()=>current.hidden(),lockable:()=>current.lockable(),
  breakPrison:(...args)=>current.breakPrison(...args),intercept:(...args)=>current.intercept(...args),areaDamage:(...args)=>current.areaDamage(...args),
  absorbDamage:(amount,...args)=>current.absorbDamage?.(amount,...args)??amount,
  constrainMovement:(from,to,...args)=>current.constrainMovement?.(from,to,...args)||to,
  targetStatus:key=>current.targetStatus?.(key)||null,obscures:p=>current.obscures?.(p)||false,
  get offset(){return current.offset;},state:()=>({...current.state(),thirdPerson:current===third}),
  dispose(){legacy.dispose();third.dispose();}
 };
}
