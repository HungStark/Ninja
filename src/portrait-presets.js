import {villagerAppearance} from './villager-appearance.js';
import {ARMORS,ARM_GUARDS,BAGS} from './equipment.js';
import {REGIONS} from './adventure-world.js';
import {HA_LY,HA_LY_MOTHER} from './village-events.js';
import {ninjaProfile} from './ninja.js';

import {PORTRAIT_COATS} from './portrait-key.js';

// Used by the offline portrait builder, never by the dialogue UI.
export function portraitPresets(){
  const result=new Map(),add=(key,spec)=>result.set(key,spec);
  for(const armor of ARMORS)for(const coat of PORTRAIT_COATS)add('hero/'+armor.id+'/'+coat,{kind:'hero',equipment:{hero:{coat,hair:'#161821'},armor,armguard:ARM_GUARDS[0],bag:BAGS[0]}});
  for(const [village,region]of Object.entries(REGIONS)){
    add('ninja/'+village,{kind:'ninja',profile:ninjaProfile({id:'village-guard-'+village,village,kind:'ninja'}),pose:'standing'});
    add('guardian/'+village,{kind:'guardian',village});
    for(const person of [...region.npcs,...['chief','envoy','leader','lore','healer'].map(kind=>({kind})),{id:'shopkeeper',kind:'envoy'},{id:'story-guide-'+village,kind:'lore'}]){const profile=villagerAppearance(village,person);add('npc/'+village+'/'+profile.id,{kind:'villager',profile,pose:'standing'});}
  }
  add('npc/fire/'+HA_LY_MOTHER.id,{kind:'villager',profile:{...villagerAppearance('fire',HA_LY_MOTHER),...HA_LY_MOTHER},pose:'standing'});
  add('npc/wood/arena-referee',{kind:'villager',profile:villagerAppearance('wood',{id:'arena-referee',kind:'envoy'}),pose:'standing'});
  for(const pose of ['standing','wounded'])add('ha-ly/'+pose,{kind:'ninja',profile:ninjaProfile(HA_LY),pose});
  return [...result];
}
