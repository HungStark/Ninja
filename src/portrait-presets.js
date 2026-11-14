import {villagerAppearance} from './villager-appearance.js';
import {ARMORS,ARM_GUARDS,BAGS} from './equipment.js';
import {REGIONS} from './adventure-world.js';
import {HA_LY,HA_LY_MOTHER} from './village-events.js';
import {ninjaProfile} from './ninja.js';
import {campaignSpeakers} from './campaign-characters.js';
import {PLOT} from './campaign-plot.js';
import {encounterAppearance} from './encounter-appearance.js';

import {HERO_PORTRAIT_COAT,HERO_PORTRAIT_HAIR,portraitKey,ninjaPortraitKey} from './portrait-key.js';

// Used by the offline portrait builder, never by the dialogue UI.
export function portraitPresets(){
  const result=new Map(),add=(key,spec)=>result.set(key,spec);
  for(const armor of ARMORS)add('hero/'+armor.id,{kind:'hero',equipment:{hero:{coat:HERO_PORTRAIT_COAT,hair:HERO_PORTRAIT_HAIR},armor,armguard:ARM_GUARDS[0],bag:BAGS[0]}});
  for(const [village,region]of Object.entries(REGIONS)){
    add('ninja/'+village,{kind:'ninja',profile:ninjaProfile({id:'village-guard-'+village,village,kind:'ninja'}),pose:'standing'});
    add('guardian/'+village,{kind:'guardian',village});
    const looks=[{village},...['random','quest','sidequest','village-guard','guardian-guard','arena','intro-trio','boss','infiltrator'].map(kind=>encounterAppearance({kind,village,element:village})),encounterAppearance({kind:'village-guard',village,occupation:true})];
    looks.push(encounterAppearance({kind:'boss',village,guardianVillage:village,storyBoss:true}));
    for(const kind of ['intro-trio','village-event'])looks.push(encounterAppearance({kind,village,element:village,faction:'crescent'}));
    for(const look of looks){const profile=ninjaProfile(look);add(ninjaPortraitKey(profile),{kind:'ninja',profile,pose:'standing'});}
    for(const person of [...region.npcs,...['chief','envoy','leader','lore','healer'].map(kind=>({kind})),{id:'shopkeeper',kind:'envoy'},{id:'story-guide-'+village,kind:'lore'}]){const profile=villagerAppearance(village,person);add('npc/'+village+'/'+profile.id,{kind:'villager',profile,pose:'standing'});}
  }
  add('npc/fire/'+HA_LY_MOTHER.id,{kind:'villager',profile:{...villagerAppearance('fire',HA_LY_MOTHER),...HA_LY_MOTHER},pose:'standing'});
  add('npc/wood/arena-referee',{kind:'villager',profile:villagerAppearance('wood',{id:'arena-referee',kind:'envoy'}),pose:'standing'});
  for(const pose of ['standing','wounded'])add('ha-ly/'+pose,{kind:'ninja',profile:ninjaProfile(HA_LY),pose});
  for(const [id,chapter] of Object.entries(PLOT.villages))for(let step=0;step<chapter.stages.length;step++){
    const save={village:id,story:{plotPreview:true,villageEvents:{[id]:step}}};
    for(const speaker of Object.values(campaignSpeakers(save,id))){
      if(!speaker.appearance||speaker.appearance.kind==='creature'||speaker.id===HA_LY.id)continue;
      add(portraitKey(speaker),{kind:speaker.appearance.job==='ninja'?'ninja':'villager',profile:speaker.appearance,pose:speaker.portraitPose||'standing',emblem:speaker.faction==='crescent'});
    }
  }
  return [...result];
}
